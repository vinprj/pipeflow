import { useState, useEffect } from 'react'
import PipelineCard from './components/PipelineCard'
import PipelineList from './components/PipelineList'
import StatsCard from './components/StatsCard'
import Scheduler from './components/Scheduler'
import LogsViewer from './components/LogsViewer'
import ToastContainer from './components/ToastContainer'
import type { PipelineRun, Stats, Toast, PipelineConfig } from './types'

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

function App() {
  const [runs, setRuns] = useState<PipelineRun[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null)
  const [showScheduler, setShowScheduler] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

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
      const [runsRes, statsRes] = await Promise.all([
        fetch('/api/pipelines'),
        fetch('/api/stats')
      ])
      const runsData = await runsRes.json()
      const statsData = await statsRes.json()
      setRuns(runsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      addToast('error', 'Failed to fetch pipeline data')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⚡</div>
          <div className="text-2xl font-mono text-[var(--color-spark)] font-bold glitch-text">
            INITIALIZING PIPEFLOW
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
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold font-mono text-[var(--color-spark)] glitch-text mb-1">
                PIPEFLOW
              </h1>
              <p className="text-[var(--color-dim)] font-mono text-sm">
                ETL PIPELINE ORCHESTRATION SYSTEM
              </p>
            </div>
            <button
              onClick={() => setShowScheduler(true)}
              className="bg-[var(--color-spark)] hover:bg-[var(--color-spark)]/80 text-black font-bold py-3 px-6 rounded font-mono transition-all btn-primary"
            >
              ⏱ SCHEDULER
            </button>
          </div>
        </div>
      </header>

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

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-mono text-white mb-2">
            AVAILABLE PIPELINES
          </h2>
          <div className="h-1 w-32 bg-gradient-to-r from-[var(--color-spark)] to-transparent"></div>
        </div>

        {/* Pipeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {PIPELINE_CONFIGS.map((pipeline) => (
            <PipelineCard
              key={pipeline.name}
              name={pipeline.name}
              displayName={pipeline.displayName}
              description={pipeline.description}
              icon={pipeline.icon}
              onTrigger={() => handleTrigger(
                pipeline.name.replace('_', '-'),
                pipeline.displayName
              )}
              lastRun={stats?.latest_runs?.[pipeline.name]}
            />
          ))}
        </div>

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-mono text-white mb-2">
            RECENT PIPELINE RUNS
          </h2>
          <div className="h-1 w-32 bg-gradient-to-r from-[var(--color-spark)] to-transparent"></div>
        </div>

        {/* Pipeline Runs List */}
        <div className="glass-card rounded-lg overflow-hidden border border-white/10">
          <PipelineList runs={runs} onSelect={setSelectedRun} />
        </div>
      </main>

      {/* Logs Modal */}
      {selectedRun && (
        <LogsViewer run={selectedRun} onClose={() => setSelectedRun(null)} />
      )}

      {/* Scheduler Modal */}
      {showScheduler && (
        <Scheduler 
          pipelines={PIPELINE_CONFIGS} 
          onClose={() => setShowScheduler(false)} 
        />
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 text-center text-[var(--color-dim)] font-mono text-sm">
          <p>PIPEFLOW v2.0 — ETL ORCHESTRATION SYSTEM</p>
        </div>
      </footer>
    </div>
  )
}

export default App
