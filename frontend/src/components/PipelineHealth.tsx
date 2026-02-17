import type { PipelineRun, PipelineConfig } from '../types'

interface Props {
  runs: PipelineRun[]
  pipelines: PipelineConfig[]
}

export default function PipelineHealth({ runs, pipelines }: Props) {
  // Calculate health metrics for each pipeline
  const pipelineHealth = pipelines.map(pipeline => {
    const pipelineRuns = runs.filter(r => (r.pipeline ?? r.pipeline_name) === pipeline.name)
    const totalRuns = pipelineRuns.length
    const successfulRuns = pipelineRuns.filter(r => r.status === 'completed' || r.status === 'success').length
    const failedRuns = pipelineRuns.filter(r => r.status === 'failed').length
    const runningRuns = pipelineRuns.filter(r => r.status === 'running').length
    
    // Calculate health score (0-100)
    let healthScore = 100
    if (totalRuns > 0) {
      const successRate = successfulRuns / totalRuns
      const failurePenalty = failedRuns / totalRuns * 50
      const runningBonus = runningRuns > 0 ? 5 : 0
      healthScore = Math.max(0, Math.min(100, (successRate * 100) - failurePenalty + runningBonus))
    }
    
    // Get last run time
    const lastRun = pipelineRuns.length > 0 
      ? pipelineRuns.reduce((latest, run) => 
          new Date(run.started_at) > new Date(latest.started_at) ? run : latest
        )
      : null
    
    // Calculate average duration
    const completedRuns = pipelineRuns.filter(r => r.completed_at)
    const avgDuration = completedRuns.length > 0
      ? completedRuns.reduce((sum, r) => sum + (new Date(r.completed_at!).getTime() - new Date(r.started_at).getTime()), 0) / completedRuns.length / 1000
      : 0
    
    // Check if healthy (no failures in last 5 runs)
    const recentRuns = pipelineRuns.slice(0, 5)
    const isHealthy = recentRuns.length === 0 || recentRuns.every(r => r.status !== 'failed')
    
    return {
      ...pipeline,
      totalRuns,
      successfulRuns,
      failedRuns,
      runningRuns,
      healthScore: Math.round(healthScore),
      lastRun,
      avgDuration: Math.round(avgDuration),
      isHealthy
    }
  })

  const overallHealth = pipelineHealth.length > 0
    ? Math.round(pipelineHealth.reduce((sum, p) => sum + p.healthScore, 0) / pipelineHealth.length)
    : 100

  const getHealthColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-400', label: 'HEALTHY' }
    if (score >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'WARNING' }
    return { bg: 'bg-red-500', text: 'text-red-400', label: 'CRITICAL' }
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Banner */}
      <div className={`glass-card rounded-xl p-6 border-2 ${
        overallHealth >= 80 ? 'border-green-500/50 bg-green-500/10' :
        overallHealth >= 50 ? 'border-yellow-500/50 bg-yellow-500/10' :
        'border-red-500/50 bg-red-500/10'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-mono text-white mb-2">
              SYSTEM HEALTH OVERVIEW
            </h2>
            <p className="text-[var(--color-dim)] font-mono text-sm">
              {pipelineHealth.filter(p => p.isHealthy).length} of {pipelines.length} pipelines healthy
            </p>
          </div>
          <div className="text-center">
            <div className={`text-5xl font-bold font-mono ${getHealthColor(overallHealth).text}`}>
              {overallHealth}%
            </div>
            <div className={`text-sm font-mono ${getHealthColor(overallHealth).text}`}>
              {getHealthColor(overallHealth).label}
            </div>
          </div>
        </div>
        
        {/* Health Bar */}
        <div className="mt-4 h-3 bg-[var(--color-void)] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${getHealthColor(overallHealth).bg}`}
            style={{ width: `${overallHealth}%` }}
          />
        </div>
      </div>

      {/* Pipeline Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pipelineHealth.map((pipeline, index) => {
          const healthColor = getHealthColor(pipeline.healthScore)
          
          return (
            <div 
              key={pipeline.name}
              className="glass-card rounded-lg p-5 border border-white/10 hover:border-[var(--color-spark)]/30 transition-all animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{pipeline.icon}</div>
                  <div>
                    <h3 className="font-mono font-bold text-white">{pipeline.displayName}</h3>
                    <p className="text-xs text-[var(--color-dim)] font-mono">{pipeline.totalRuns} runs</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${healthColor.bg} text-black`}>
                  {pipeline.healthScore}%
                </div>
              </div>
              
              {/* Health Status */}
              <div className={`mb-4 p-2 rounded text-center text-sm font-mono ${
                pipeline.isHealthy 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {pipeline.isHealthy ? '✓ OPERATIONAL' : '⚠ ATTENTION NEEDED'}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[var(--color-void)] rounded p-2">
                  <div className="text-lg font-bold text-green-400">{pipeline.successfulRuns}</div>
                  <div className="text-[10px] text-[var(--color-dim)] font-mono">SUCCESS</div>
                </div>
                <div className="bg-[var(--color-void)] rounded p-2">
                  <div className="text-lg font-bold text-red-400">{pipeline.failedRuns}</div>
                  <div className="text-[10px] text-[var(--color-dim)] font-mono">FAILED</div>
                </div>
                <div className="bg-[var(--color-void)] rounded p-2">
                  <div className="text-lg font-bold text-blue-400">{pipeline.avgDuration}s</div>
                  <div className="text-[10px] text-[var(--color-dim)] font-mono">AVG</div>
                </div>
              </div>
              
              {/* Last Run */}
              {pipeline.lastRun && (
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--color-dim)]">LAST RUN</span>
                    <span className="text-white">
                      {new Date(pipeline.lastRun.started_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-mono mt-1">
                    <span className="text-[var(--color-dim)]">STATUS</span>
                    <span className={(pipeline.lastRun.status === 'completed' || pipeline.lastRun.status === 'success') ? 'text-green-400' : 'text-red-400'}>
                      {pipeline.lastRun.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Health Bar */}
              <div className="mt-4 h-1.5 bg-[var(--color-void)] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${healthColor.bg}`}
                  style={{ width: `${pipeline.healthScore}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card rounded-lg p-4 border border-white/10">
          <div className="text-xs text-[var(--color-dim)] font-mono uppercase mb-1">Total Pipelines</div>
          <div className="text-2xl font-bold font-mono text-[var(--color-spark)]">{pipelines.length}</div>
        </div>
        <div className="glass-card rounded-lg p-4 border border-white/10">
          <div className="text-xs text-[var(--color-dim)] font-mono uppercase mb-1">Healthy</div>
          <div className="text-2xl font-bold font-mono text-green-400">
            {pipelineHealth.filter(p => p.isHealthy).length}
          </div>
        </div>
        <div className="glass-card rounded-lg p-4 border border-white/10">
          <div className="text-xs text-[var(--color-dim)] font-mono uppercase mb-1">Need Attention</div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {pipelineHealth.filter(p => !p.isHealthy).length}
          </div>
        </div>
        <div className="glass-card rounded-lg p-4 border border-white/10">
          <div className="text-xs text-[var(--color-dim)] font-mono uppercase mb-1">Total Runs</div>
          <div className="text-2xl font-bold font-mono text-white">{runs.length}</div>
        </div>
      </div>
    </div>
  )
}
