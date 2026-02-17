import { useState, useEffect, useCallback } from 'react'
import PipelineCard from './components/PipelineCard'
import PipelineList from './components/PipelineList'
import PipelineAnalytics from './components/PipelineAnalytics'
import StatsCard from './components/StatsCard'
import Scheduler from './components/Scheduler'
import LogsViewer from './components/LogsViewer'
import ToastContainer from './components/ToastContainer'
import NotificationPanel from './components/NotificationPanel'
import PipelineHealth from './components/PipelineHealth'
import PipelineTemplates from './components/PipelineTemplates'
import PipelineDetails from './components/PipelineDetails'
import type { PipelineRun, Stats, Toast, PipelineConfig, Notification } from './types'

const PIPELINE_CONFIGS: PipelineConfig[] = [
  {
    name: 'csv_ingestion',
    displayName: 'CSV Ingestion',
    description: 'Extract data from CSV files, transform, and load to database',
    icon: '📊'
  },
  {
    name: 'api_fetch',
    displayName: 'API Data Fetch',
    description: 'Fetch data from external REST APIs and store in database',
    icon: '🌐'
  },
  {
    name: 'data_aggregation',
    displayName: 'Data Aggregation',
    description: 'Aggregate and compute metrics from existing data',
    icon: '📈'
  },
  {
    name: 'json_ingestion',
    displayName: 'JSON Ingestion',
    description: 'Process JSON files and normalize to database schema',
    icon: '📝'
  },
  {
    name: 'xml_parser',
    displayName: 'XML Parser',
    description: 'Parse XML documents and extract structured data',
    icon: '🔖'
  }
]

// Local storage for pipeline configs
const STORAGE_KEY = 'pipeflow_configs'

function App() {
  const [runs, setRuns] = useState<PipelineRun[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null)
  const [showScheduler, setShowScheduler] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [currentView, setCurrentView] = useState<'pipelines' | 'analytics' | 'health'>('pipelines')
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [pipelineConfigs, setPipelineConfigs] = useState<PipelineConfig[]>(PIPELINE_CONFIGS)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'running'>('all')

  // Load configs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setPipelineConfigs(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load configs:', e)
      }
    }
  }, [])

  // Save configs to localStorage
  const savePipelineConfigs = useCallback((configs: PipelineConfig[]) => {
    setPipelineConfigs(configs)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
  }, [])

  const addToast = (type: Toast['type'], message: string) => {
    const toast: Toast = {
      id: Date.now().toString(),
      type,
      message,
      duration: 4000
    }
    setToasts(prev => [...prev, toast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const fetchData = async () => {
    try {
      const [runsRes, statsRes, notifRes] = await Promise.all([
        fetch('/api/pipelines'),
        fetch('/api/stats'),
        fetch('/api/notifications')
      ])
      
      if (runsRes.ok && statsRes.ok && notifRes.ok) {
        setConnectionStatus('connected')
        const runsData = await runsRes.json()
        const statsData = await statsRes.json()
        const notifData = await notifRes.json()
        
        setRuns(runsData)
        setStats(statsData)
        setNotifications(notifData)
        setUnreadCount(notifData.filter((n: Notification) => !n.read).length)
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setConnectionStatus('disconnected')
      addToast('error', 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleTrigger = async (pipeline: string, displayName: string) => {
    try {
      addToast('info', `Triggering ${displayName}...`)
      const response = await fetch(`/api/pipelines/${pipeline}/trigger`, {
        method: 'POST'
      })
      const result = await response.json()
      
      if (response.ok) {
        addToast('success', `${displayName} started successfully!`)
        fetchData()
      } else {
        addToast('error', `Failed to start ${displayName}`)
      }
    } catch (error) {
      console.error('Error triggering pipeline:', error)
      addToast('error', `Error triggering ${displayName}`)
    }
  }

  const handleTriggerAll = async () => {
    addToast('info', 'Triggering all pipelines...')
    for (const pipeline of pipelineConfigs) {
      try {
        await fetch(`/api/pipelines/${pipeline.name.replace('_', '-')}/trigger`, {
          method: 'POST'
        })
      } catch (error) {
        console.error(`Error triggering ${pipeline.displayName}:`, error)
      }
    }
    addToast('success', 'All pipelines triggered!')
    fetchData()
  }

  const handleMarkRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PATCH' })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications read:', error)
    }
  }

  const updatePipelineConfig = (name: string, updates: Partial<PipelineConfig>) => {
    const updated = pipelineConfigs.map(p => 
      p.name === name ? { ...p, ...updates } : p
    )
    savePipelineConfigs(updated)
    addToast('success', 'Pipeline configuration updated')
  }

  const handleApplyTemplate = (template: PipelineConfig) => {
    setPipelineConfigs(prev => {
      const exists = prev.find(p => p.name === template.name)
      if (exists) {
        return prev.map(p => p.name === template.name ? template : p)
      }
      return [...prev, template]
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pipelineConfigs))
    addToast('success', `Template "${template.displayName}" applied`)
  }

  // Filter pipelines based on search and status
  const filteredPipelines = pipelineConfigs.filter(p => {
    const matchesSearch = p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Filter runs based on status
  const filteredRuns = runs.filter(r => {
    if (filterStatus === 'all') return true
    return r.status === filterStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⚡</div>
          <div className="text-2xl font-mono text-[var(--color-spark)] font-bold glitch-text">
            INITIALIZING PIPEFLOW
          </div>
          <div className="mt-4 flex justify-center gap-1">
            <div className="w-2 h-2 bg-[var(--color-spark)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[var(--color-spark)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[var(--color-spark)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Scan line effect */}
      <div className="scan-line"></div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="glass-card border-b-2 border-[var(--color-spark)]/30 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold font-mono text-[var(--color-spark)] glitch-text mb-0">
                  PIPEFLOW
                </h1>
                <p className="text-[var(--color-dim)] font-mono text-xs">
                  ETL PIPELINE ORCHESTRATION
                </p>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></div>
                <span className="text-xs font-mono text-[var(--color-dim)] uppercase">
                  {connectionStatus}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pipelines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[var(--color-steel)] border border-white/10 rounded-lg px-4 py-2 pl-10 text-white font-mono text-sm focus:border-[var(--color-spark)] focus:outline-none w-48"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-dim)]">🔍</span>
              </div>
              
              {/* Templates Button */}
              <button
                onClick={() => setShowTemplates(true)}
                className="bg-[var(--color-steel)] hover:bg-[var(--color-concrete)] border border-white/10 text-white font-mono py-2 px-4 rounded transition-all hover:border-[var(--color-spark)]/50"
                title="Pipeline Templates"
              >
                📋
              </button>
              
              {/* Config Button */}
              <button
                onClick={() => setShowConfig(true)}
                className="bg-[var(--color-steel)] hover:bg-[var(--color-concrete)] border border-white/10 text-white font-mono py-2 px-4 rounded transition-all hover:border-[var(--color-spark)]/50"
                title="Configure Pipelines"
              >
                ⚙️
              </button>
              
              {/* Notifications Bell */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative bg-[var(--color-steel)] hover:bg-[var(--color-concrete)] border border-white/10 text-white font-mono py-2 px-4 rounded transition-all hover:border-[var(--color-spark)]/50"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Scheduler Button */}
              <button
                onClick={() => setShowScheduler(true)}
                className="bg-[var(--color-spark)] hover:bg-[var(--color-spark)]/80 text-black font-bold py-2 px-5 rounded font-mono transition-all btn-primary"
              >
                ⏱ SCHEDULER
              </button>
            </div>
          </div>

          {/* View Toggle & Quick Actions */}
          <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('pipelines')}
                className={`flex-1 py-2 px-4 rounded font-mono text-sm transition-all ${
                  currentView === 'pipelines'
                    ? 'bg-[var(--color-spark)] text-black'
                    : 'bg-[var(--color-steel)] text-[var(--color-dim)] hover:text-white'
                }`}
              >
                📦 PIPELINES
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`flex-1 py-2 px-4 rounded font-mono text-sm transition-all ${
                  currentView === 'analytics'
                    ? 'bg-[var(--color-spark)] text-black'
                    : 'bg-[var(--color-steel)] text-[var(--color-dim)] hover:text-white'
                }`}
              >
                📊 ANALYTICS
              </button>
              <button
                onClick={() => setCurrentView('health')}
                className={`flex-1 py-2 px-4 rounded font-mono text-sm transition-all ${
                  currentView === 'health'
                    ? 'bg-[var(--color-spark)] text-black'
                    : 'bg-[var(--color-steel)] text-[var(--color-dim)] hover:text-white'
                }`}
              >
                💚 HEALTH
              </button>
            </div>

            {currentView === 'pipelines' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerAll}
                  className="bg-green-600 hover:bg-green-700 text-white font-mono py-2 px-4 rounded text-sm transition-all"
                  title="Trigger all pipelines"
                >
                  ▶ RUN ALL
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-6 top-40 z-50 w-96">
          <div className="glass-card rounded-lg border border-[var(--color-spark)]/30 shadow-2xl">
            <NotificationPanel 
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
            />
          </div>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto px-6 py-8 relative z-10">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatsCard 
              title="TOTAL RUNS" 
              value={stats.total_runs} 
              icon="📦"
            />
            <StatsCard 
              title="SUCCESSFUL" 
              value={stats.successful_runs} 
              color="green" 
              icon="✓"
            />
            <StatsCard 
              title="FAILED" 
              value={stats.failed_runs} 
              color="red" 
              icon="✕"
            />
            <StatsCard 
              title="SUCCESS RATE" 
              value={`${stats.success_rate}%`} 
              color={stats.success_rate > 70 ? 'green' : 'yellow'} 
              icon="📊"
            />
          </div>
        )}

        {currentView === 'pipelines' ? (
          <>
            {/* Section Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold font-mono text-white mb-2">
                AVAILABLE PIPELINES
              </h2>
              <div className="h-1 w-32 bg-gradient-to-r from-[var(--color-spark)] to-transparent"></div>
              <p className="text-sm text-[var(--color-dim)] mt-2">
                {filteredPipelines.length} pipeline{filteredPipelines.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {/* Pipeline Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredPipelines.map((pipeline, index) => (
                <div 
                  key={pipeline.name}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <PipelineCard
                    name={pipeline.name}
                    displayName={pipeline.displayName}
                    description={pipeline.description}
                    icon={pipeline.icon}
                    onTrigger={() => handleTrigger(
                      pipeline.name.replace('_', '-'),
                      pipeline.displayName
                    )}
                    onViewDetails={() => setSelectedPipeline(pipeline.name)}
                    lastRun={stats?.latest_runs?.[pipeline.name]}
                  />
                </div>
              ))}
            </div>

            {/* Filter Controls */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-mono text-white">
                RECENT PIPELINE RUNS
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-dim)] font-mono">Filter:</span>
                {(['all', 'success', 'failed', 'running'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 rounded font-mono text-xs transition-all ${
                      filterStatus === status
                        ? 'bg-[var(--color-spark)] text-black'
                        : 'bg-[var(--color-steel)] text-[var(--color-dim)] hover:text-white'
                    }`}
                  >
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Pipeline Runs List */}
            <div className="glass-card rounded-lg overflow-hidden border border-white/10">
              <PipelineList runs={filteredRuns} onSelect={setSelectedRun} />
            </div>
          </>
        ) : currentView === 'analytics' ? (
          <PipelineAnalytics runs={runs} />
        ) : (
          <PipelineHealth runs={runs} pipelines={pipelineConfigs} />
        )}
      </main>

      {/* Logs Modal */}
      {selectedRun && (
        <LogsViewer run={selectedRun} onClose={() => setSelectedRun(null)} />
      )}

      {/* Pipeline Details Modal */}
      {selectedPipeline && (
        <PipelineDetails 
          pipeline={pipelineConfigs.find(p => p.name === selectedPipeline)!}
          runs={runs.filter(r => r.pipeline === selectedPipeline)}
          onClose={() => setSelectedPipeline(null)}
          onTrigger={() => {
            const p = pipelineConfigs.find(p => p.name === selectedPipeline)
            if (p) handleTrigger(p.name.replace('_', '-'), p.displayName)
          }}
        />
      )}

      {/* Scheduler Modal */}
      {showScheduler && (
        <Scheduler 
          pipelines={pipelineConfigs} 
          onClose={() => setShowScheduler(false)} 
        />
      )}

      {/* Pipeline Config Modal */}
      {showConfig && (
        <PipelineConfigModal 
          pipelines={pipelineConfigs}
          onUpdate={updatePipelineConfig}
          onClose={() => setShowConfig(false)}
        />
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <PipelineTemplates 
          onApply={handleApplyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 text-center text-[var(--color-dim)] font-mono text-sm">
          <p>PIPEFLOW v2.2 — ETL ORCHESTRATION SYSTEM</p>
        </div>
      </footer>
    </div>
  )
}

// Pipeline Configuration Modal Component
function PipelineConfigModal({ 
  pipelines, 
  onUpdate, 
  onClose 
}: { 
  pipelines: PipelineConfig[]
  onUpdate: (name: string, updates: Partial<PipelineConfig>) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState(pipelines[0]?.name || '')

  const selectedPipeline = pipelines.find(p => p.name === selected)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative glass-card border border-[var(--color-spark)]/30 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold font-mono text-white">
            ⚙️ PIPELINE CONFIGURATION
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-dim)] hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Pipeline Selector */}
          <div className="mb-6">
            <label className="block text-sm font-mono text-[var(--color-dim)] mb-2">
              SELECT PIPELINE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {pipelines.map(p => (
                <button
                  key={p.name}
                  onClick={() => setSelected(p.name)}
                  className={`p-3 rounded border font-mono text-sm transition-all ${
                    selected === p.name
                      ? 'bg-[var(--color-spark)]/20 border-[var(--color-spark)] text-[var(--color-spark)]'
                      : 'bg-[var(--color-steel)] border-white/10 text-[var(--color-dim)] hover:border-white/30'
                  }`}
                >
                  {p.icon} {p.displayName}
                </button>
              ))}
            </div>
          </div>
          
          {/* Config Form */}
          {selectedPipeline && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-[var(--color-dim)] mb-2">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={selectedPipeline.displayName}
                  onChange={(e) => onUpdate(selectedPipeline.name, { displayName: e.target.value })}
                  className="w-full bg-[var(--color-void)] border border-white/20 rounded p-3 text-white font-mono focus:border-[var(--color-spark)] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-[var(--color-dim)] mb-2">
                  DESCRIPTION
                </label>
                <textarea
                  value={selectedPipeline.description}
                  onChange={(e) => onUpdate(selectedPipeline.name, { description: e.target.value })}
                  rows={3}
                  className="w-full bg-[var(--color-void)] border border-white/20 rounded p-3 text-white font-mono focus:border-[var(--color-spark)] focus:outline-none resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-[var(--color-dim)] mb-2">
                  ICON (EMOJI)
                </label>
                <input
                  type="text"
                  value={selectedPipeline.icon}
                  onChange={(e) => onUpdate(selectedPipeline.name, { icon: e.target.value })}
                  className="w-20 bg-[var(--color-void)] border border-white/20 rounded p-3 text-2xl text-center focus:border-[var(--color-spark)] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[var(--color-spark)] hover:bg-[var(--color-spark)]/80 text-black font-bold py-2 px-6 rounded font-mono transition-all"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
