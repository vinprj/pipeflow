import type { PipelineRun } from '../types'

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
  }
}

function PipelineCard({ name, displayName, description, icon, onTrigger, lastRun }: Props) {
  const statusConfig = {
    success: {
      color: 'border-green-500/50 bg-green-500/10',
      text: 'text-green-400',
      label: 'SUCCESS'
    },
    failed: {
      color: 'border-red-500/50 bg-red-500/10',
      text: 'text-red-400',
      label: 'FAILED'
    },
    running: {
      color: 'border-blue-500/50 bg-blue-500/10 status-running',
      text: 'text-blue-400',
      label: 'RUNNING'
    },
  }

  const config = lastRun ? statusConfig[lastRun.status as keyof typeof statusConfig] : null

  return (
    <div className="glass-card rounded-lg p-5 hover:border-[var(--color-spark)]/50 transition-all group">
      {/* Icon & Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="text-4xl">{icon}</div>
        {config && (
          <span className={`px-3 py-1 rounded border text-xs font-bold font-mono ${config.color} ${config.text}`}>
            {config.label}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-xl mb-2 text-white font-mono group-hover:text-[var(--color-spark)] transition-colors">
        {displayName}
      </h3>
      
      {/* Description */}
      <p className="text-sm text-[var(--color-dim)] mb-4 leading-relaxed">
        {description}
      </p>

      {/* Last Run Info */}
      {lastRun && (
        <div className="mb-4 p-3 bg-[var(--color-void)]/50 rounded border border-white/5">
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <div className="text-[var(--color-dim)]">RECORDS</div>
              <div className="text-white font-bold">{lastRun.records_processed}</div>
            </div>
            <div>
              <div className="text-[var(--color-dim)]">LAST RUN</div>
              <div className="text-white font-bold">
                {new Date(lastRun.started_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={onTrigger}
        className="w-full bg-[var(--color-spark)] hover:bg-[var(--color-spark)]/80 text-black font-bold py-3 px-4 rounded font-mono transition-all btn-primary transform hover:scale-[1.02] active:scale-[0.98]"
      >
        ▶ RUN PIPELINE
      </button>

      {/* Decorative grid corner */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--color-spark)]/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--color-spark)]/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  )
}

export default PipelineCard
