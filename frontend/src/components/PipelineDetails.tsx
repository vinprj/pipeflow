import { useState } from 'react'
import type { PipelineRun, PipelineConfig } from '../types'

interface Props {
  pipeline: PipelineConfig
  runs: PipelineRun[]
  onClose: () => void
  onTrigger: () => void
}

export default function PipelineDetails({ pipeline, runs, onClose, onTrigger }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'config'>('overview')
  
  const pipelineRuns = runs.filter(r => (r.pipeline ?? r.pipeline_name) === pipeline.name)
  const successCount = pipelineRuns.filter(r => r.status === 'completed' || r.status === 'success').length
  const failedCount = pipelineRuns.filter(r => r.status === 'failed').length
  const avgDuration = pipelineRuns.length > 0
    ? Math.round(pipelineRuns.reduce((sum, r) => {
        if (r.completed_at) return sum + (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime())
        return sum
      }, 0) / pipelineRuns.length / 1000)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative glass-card border border-[var(--color-spark)]/30 w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{pipeline.icon}</div>
            <div>
              <h2 className="text-2xl font-bold font-mono text-white">
                {pipeline.displayName}
              </h2>
              <p className="text-sm text-[var(--color-dim)] font-mono">
                {pipeline.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-dim)] hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['overview', 'history', 'config'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 font-mono text-sm transition-all ${
                activeTab === tab
                  ? 'text-[var(--color-spark)] border-b-2 border-[var(--color-spark)] bg-[var(--color-spark)]/5'
                  : 'text-[var(--color-dim)] hover:text-white'
              }`}
            >
              {tab === 'overview' && '📊 OVERVIEW'}
              {tab === 'history' && '📜 HISTORY'}
              {tab === 'config' && '⚙️ CONFIG'}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="glass-card rounded-lg p-4 border border-white/10 text-center">
                  <div className="text-3xl font-bold font-mono text-[var(--color-spark)]">
                    {pipelineRuns.length}
                  </div>
                  <div className="text-xs text-[var(--color-dim)] font-mono mt-1">TOTAL RUNS</div>
                </div>
                <div className="glass-card rounded-lg p-4 border border-green-500/30 bg-green-500/5 text-center">
                  <div className="text-3xl font-bold font-mono text-green-400">{successCount}</div>
                  <div className="text-xs text-green-400 font-mono mt-1">SUCCESS</div>
                </div>
                <div className="glass-card rounded-lg p-4 border border-red-500/30 bg-red-500/5 text-center">
                  <div className="text-3xl font-bold font-mono text-red-400">{failedCount}</div>
                  <div className="text-xs text-red-400 font-mono mt-1">FAILED</div>
                </div>
                <div className="glass-card rounded-lg p-4 border border-yellow-500/30 bg-yellow-500/5 text-center">
                  <div className="text-3xl font-bold font-mono text-yellow-400">{avgDuration}s</div>
                  <div className="text-xs text-yellow-400 font-mono mt-1">AVG DURATION</div>
                </div>
              </div>

              {/* Description */}
              <div className="glass-card rounded-lg p-4 border border-white/10">
                <h3 className="font-mono text-white text-sm mb-2">DESCRIPTION</h3>
                <p className="text-[var(--color-dim)] font-mono text-sm">
                  {pipeline.description}
                </p>
              </div>

              {/* Recent Runs */}
              <div className="glass-card rounded-lg p-4 border border-white/10">
                <h3 className="font-mono text-white text-sm mb-4">RECENT RUNS</h3>
                {pipelineRuns.length === 0 ? (
                  <p className="text-[var(--color-dim)] font-mono text-sm text-center py-4">
                    No runs yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pipelineRuns.slice(0, 10).map(run => (
                      <div 
                        key={run.id}
                        className="flex items-center justify-between p-2 rounded bg-[var(--color-void)]"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${
                            (run.status === 'completed' || run.status === 'success') ? 'bg-green-500' :
                            run.status === 'failed' ? 'bg-red-500' :
                            'bg-blue-500 animate-pulse'
                          }`} />
                          <span className="font-mono text-sm text-white">
                            {new Date(run.started_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-[var(--color-dim)]">
                            {run.records_processed} records
                          </span>
                          <span className={`font-mono text-xs ${
                            (run.status === 'completed' || run.status === 'success') ? 'text-green-400' :
                            run.status === 'failed' ? 'text-red-400' :
                            'text-blue-400'
                          }`}>
                            {run.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {pipelineRuns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl opacity-20 mb-4">📜</div>
                  <p className="text-[var(--color-dim)] font-mono">No run history yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pipelineRuns.map(run => {
                    const duration = run.completed_at 
                      ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                      : null
                    
                    return (
                      <div 
                        key={run.id}
                        className="glass-card rounded-lg p-4 border border-white/10 hover:border-[var(--color-spark)]/30 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-mono ${
                              (run.status === 'completed' || run.status === 'success')
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : run.status === 'failed'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {run.status.toUpperCase()}
                            </span>
                            <span className="font-mono text-sm text-white">
                              {new Date(run.started_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-xs text-[var(--color-dim)] font-mono">RECORDS</div>
                              <div className="font-mono text-white">{run.records_processed.toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-[var(--color-dim)] font-mono">DURATION</div>
                              <div className="font-mono text-white">{duration ? `${duration}s` : '-'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="glass-card rounded-lg p-4 border border-white/10">
                <h3 className="font-mono text-white text-sm mb-4">PIPELINE CONFIGURATION</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-[var(--color-void)] rounded">
                    <span className="text-[var(--color-dim)] font-mono text-sm">Pipeline Name</span>
                    <span className="font-mono text-white">{pipeline.name}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[var(--color-void)] rounded">
                    <span className="text-[var(--color-dim)] font-mono text-sm">Display Name</span>
                    <span className="font-mono text-white">{pipeline.displayName}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[var(--color-void)] rounded">
                    <span className="text-[var(--color-dim)] font-mono text-sm">Icon</span>
                    <span className="font-mono text-2xl">{pipeline.icon}</span>
                  </div>
                  <div className="p-3 bg-[var(--color-void)] rounded">
                    <span className="text-[var(--color-dim)] font-mono text-sm block mb-2">Description</span>
                    <span className="font-mono text-white text-sm">{pipeline.description}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-between">
          <button
            onClick={onClose}
            className="bg-[var(--color-steel)] hover:bg-[var(--color-concrete)] text-white font-mono py-2 px-6 rounded transition-all"
          >
            CLOSE
          </button>
          <button
            onClick={onTrigger}
            className="bg-[var(--color-spark)] hover:bg-[var(--color-spark)]/80 text-black font-bold font-mono py-2 px-6 rounded transition-all"
          >
            ▶ RUN NOW
          </button>
        </div>
      </div>
    </div>
  )
}
