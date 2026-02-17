import { useState } from 'react';

interface Props {
  name: string
  displayName: string
  description: string
  icon: string
  onTrigger: () => void
  lastRun?: {
    status: string
    started_at: string
    records_processed: number
    duration?: number
  }
}

function PipelineCard({ name: _name, displayName, description, icon, onTrigger, lastRun }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const statusConfig = {
    success: {
      color: 'border-green-500/50 bg-green-500/10',
      text: 'text-green-400',
      label: 'SUCCESS',
      glow: 'shadow-green-500/20',
      icon: '✓'
    },
    failed: {
      color: 'border-red-500/50 bg-red-500/10',
      text: 'text-red-400',
      label: 'FAILED',
      glow: 'shadow-red-500/20',
      icon: '✕'
    },
    running: {
      color: 'border-blue-500/50 bg-blue-500/10 status-running',
      text: 'text-blue-400',
      label: 'RUNNING',
      glow: 'shadow-blue-500/20',
      icon: '⟳'
    },
  }

  const config = lastRun ? statusConfig[lastRun.status as keyof typeof statusConfig] : null;
  const runDuration = lastRun?.duration ? `${(lastRun.duration / 1000).toFixed(1)}s` : '--';

  const handleTrigger = () => {
    setIsRunning(true);
    onTrigger();
    setTimeout(() => setIsRunning(false), 3000);
  };

  return (
    <div 
      className={`relative glass-card rounded-lg p-5 transition-all duration-300 group overflow-hidden ${
        isHovered ? 'border-[var(--color-spark)]/50 shadow-lg shadow-[var(--color-spark)]/10' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background */}
      <div className={`absolute inset-0 bg-gradient-to-br from-[var(--color-spark)]/5 to-transparent opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : ''}`} />
      
      {/* Status indicator line */}
      {config && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${lastRun?.status === 'success' ? 'from-green-500 to-emerald-500' : lastRun?.status === 'failed' ? 'from-red-500 to-orange-500' : 'from-blue-500 to-cyan-500'} ${lastRun?.status === 'running' ? 'animate-pulse' : ''}`} />
      )}

      {/* Icon & Status */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`text-4xl transform transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
          {isRunning ? <span className="animate-spin">⟳</span> : icon}
        </div>
        {config && (
          <span className={`px-3 py-1 rounded border text-xs font-bold font-mono ${config.color} ${config.text} flex items-center gap-1 ${config.glow} shadow-lg`}>
            {lastRun?.status === 'running' && <span className="animate-spin">{config.icon}</span>}
            {lastRun?.status !== 'running' && config.icon} {config.label}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-xl mb-2 text-white font-mono group-hover:text-[var(--color-spark)] transition-colors duration-300 relative z-10">
        {displayName}
      </h3>
      
      {/* Description */}
      <p className="text-sm text-[var(--color-dim)] mb-4 leading-relaxed relative z-10">
        {description}
      </p>

      {/* Last Run Info */}
      {lastRun && (
        <div className="mb-4 p-3 bg-[var(--color-void)]/50 rounded border border-white/5 relative z-10">
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <div className="text-[var(--color-dim)]">RECORDS</div>
              <div className="text-white font-bold">{lastRun.records_processed.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[var(--color-dim)]">DURATION</div>
              <div className="text-white font-bold">{runDuration}</div>
            </div>
            <div>
              <div className="text-[var(--color-dim)]">LAST RUN</div>
              <div className="text-white font-bold">
                {new Date(lastRun.started_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
          {/* Progress bar for running */}
          {lastRun.status === 'running' && (
            <div className="mt-2 h-1 bg-blue-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={handleTrigger}
        disabled={isRunning}
        className={`w-full bg-[var(--color-spark)] hover:bg-[var(--color-spark)]/80 text-black font-bold py-3 px-4 rounded font-mono transition-all btn-primary transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group/btn relative z-10`}
      >
        <span className={`flex items-center justify-center gap-2 ${isRunning ? 'animate-pulse' : ''}`}>
          {isRunning ? (
            <>
              <span className="animate-spin">⟳</span> RUNNING...
            </>
          ) : (
            <>
              ▶ RUN PIPELINE
            </>
          )}
        </span>
        
        {/* Button shimmer effect */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
      </button>

      {/* Decorative grid corners */}
      <div className={`absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[var(--color-spark)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[var(--color-spark)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      {/* Corner accent */}
      <div className={`absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-tl from-[var(--color-spark)]/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </div>
  )
}

export default PipelineCard
