import { useState, useEffect } from 'react'
import type { Schedule, PipelineConfig } from '../types'

interface Props {
  pipelines: PipelineConfig[]
  onClose: () => void
}

function Scheduler({ pipelines, onClose }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    pipeline_name: '',
    cron_expression: '0 * * * *',
    enabled: true
  })

  useEffect(() => {
    const stored = localStorage.getItem('pipeflow_schedules')
    if (stored) {
      setSchedules(JSON.parse(stored))
    }
  }, [])

  const saveSchedules = (newSchedules: Schedule[]) => {
    localStorage.setItem('pipeflow_schedules', JSON.stringify(newSchedules))
    setSchedules(newSchedules)
  }

  const addSchedule = () => {
    const newSchedule: Schedule = {
      id: Date.now().toString(),
      pipeline_name: formData.pipeline_name,
      cron_expression: formData.cron_expression,
      enabled: formData.enabled,
      last_run: null,
      next_run: calculateNextRun(formData.cron_expression),
      created_at: new Date().toISOString()
    }
    saveSchedules([...schedules, newSchedule])
    setShowForm(false)
    setFormData({ pipeline_name: '', cron_expression: '0 * * * *', enabled: true })
  }

  const deleteSchedule = (id: string) => {
    saveSchedules(schedules.filter(s => s.id !== id))
  }

  const toggleSchedule = (id: string) => {
    saveSchedules(schedules.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ))
  }

  const calculateNextRun = (cron: string): string => {
    // Simple approximation - in reality you'd parse cron properly
    const parts = cron.split(' ')
    const minute = parts[0]
    const hour = parts[1]
    
    const now = new Date()
    const next = new Date(now)
    
    if (hour !== '*') {
      next.setHours(parseInt(hour))
      if (next < now) next.setDate(next.getDate() + 1)
    } else {
      next.setHours(next.getHours() + 1)
    }
    
    if (minute !== '*') {
      next.setMinutes(parseInt(minute))
    } else {
      next.setMinutes(0)
    }
    
    return next.toISOString()
  }

  const cronPresets = [
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every 6 hours', value: '0 */6 * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Daily at 9 AM', value: '0 9 * * *' },
    { label: 'Weekly (Mon 9 AM)', value: '0 9 * * 1' },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="glass-card rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden border-2 border-[var(--color-spark)]/30">
        {/* Scan line effect */}
        <div className="scan-line"></div>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[var(--color-steel)] to-[var(--color-concrete)]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold font-mono text-[var(--color-spark)] glitch-text">
                PIPELINE SCHEDULER
              </h2>
              <p className="text-sm text-[var(--color-dim)] font-mono mt-1">
                Automate pipeline execution with cron expressions
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
          {/* Add Schedule Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full mb-6 bg-[var(--color-spark)] hover:bg-[var(--color-spark)]/80 text-black font-bold py-3 px-4 rounded font-mono transition-all btn-primary"
            >
              + NEW SCHEDULE
            </button>
          )}

          {/* Add Schedule Form */}
          {showForm && (
            <div className="glass-card p-4 mb-6 border border-[var(--color-spark)]/30 rounded">
              <h3 className="font-mono text-lg mb-4 text-[var(--color-spark)]">CREATE SCHEDULE</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-mono mb-2 text-[var(--color-dim)]">PIPELINE</label>
                  <select
                    value={formData.pipeline_name}
                    onChange={(e) => setFormData({ ...formData, pipeline_name: e.target.value })}
                    className="w-full bg-[var(--color-void)] border border-white/20 rounded px-3 py-2 font-mono text-white focus:border-[var(--color-spark)] focus:outline-none"
                  >
                    <option value="">Select pipeline...</option>
                    {pipelines.map(p => (
                      <option key={p.name} value={p.name}>{p.displayName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-mono mb-2 text-[var(--color-dim)]">CRON EXPRESSION</label>
                  <input
                    type="text"
                    value={formData.cron_expression}
                    onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })}
                    className="w-full bg-[var(--color-void)] border border-white/20 rounded px-3 py-2 font-mono text-white focus:border-[var(--color-spark)] focus:outline-none"
                    placeholder="0 * * * *"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cronPresets.map(preset => (
                      <button
                        key={preset.value}
                        onClick={() => setFormData({ ...formData, cron_expression: preset.value })}
                        className="text-xs bg-[var(--color-wire)] hover:bg-[var(--color-concrete)] px-2 py-1 rounded font-mono text-[var(--color-dim)] hover:text-white transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={addSchedule}
                    disabled={!formData.pipeline_name}
                    className="flex-1 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-black font-bold py-2 px-4 rounded font-mono disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ADD
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-[var(--color-wire)] hover:bg-[var(--color-concrete)] text-white font-bold py-2 px-4 rounded font-mono transition-all"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Schedules List */}
          <div className="space-y-3">
            {schedules.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-dim)] font-mono">
                <div className="text-4xl mb-2">⏱</div>
                <p>No schedules configured</p>
              </div>
            ) : (
              schedules.map(schedule => {
                const pipeline = pipelines.find(p => p.name === schedule.pipeline_name)
                return (
                  <div
                    key={schedule.id}
                    className="glass-card p-4 rounded border border-white/10 hover:border-[var(--color-spark)]/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-mono font-bold text-white">
                            {pipeline?.displayName || schedule.pipeline_name}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                            schedule.enabled 
                              ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' 
                              : 'bg-[var(--color-dim)]/20 text-[var(--color-dim)]'
                          }`}>
                            {schedule.enabled ? 'ACTIVE' : 'PAUSED'}
                          </span>
                        </div>
                        <div className="text-sm text-[var(--color-dim)] font-mono space-y-1">
                          <div>Cron: <span className="text-[var(--color-spark)]">{schedule.cron_expression}</span></div>
                          {schedule.next_run && (
                            <div>Next: {new Date(schedule.next_run).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleSchedule(schedule.id)}
                          className="px-3 py-1 bg-[var(--color-wire)] hover:bg-[var(--color-concrete)] rounded font-mono text-sm transition-colors"
                        >
                          {schedule.enabled ? '⏸' : '▶'}
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="px-3 py-1 bg-[var(--color-danger)]/20 hover:bg-[var(--color-danger)]/40 text-[var(--color-danger)] rounded font-mono text-sm transition-colors"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Scheduler
