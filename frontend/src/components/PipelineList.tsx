import type { PipelineRun } from '../types'

interface Props {
  runs: PipelineRun[]
  onSelect: (run: PipelineRun) => void
}

function PipelineList({ runs, onSelect }: Props) {
  const statusConfig = {
    success: {
      color: 'text-green-400 bg-green-500/10 border-green-500/30',
      label: 'SUCCESS',
      icon: '✓'
    },
    failed: {
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      label: 'FAILED',
      icon: '✕'
    },
    running: {
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30 status-running',
      label: 'RUNNING',
      icon: '◉'
    },
  }

  if (runs.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-6xl mb-4 opacity-20">📊</div>
        <p className="text-[var(--color-dim)] font-mono">NO PIPELINE RUNS YET</p>
        <p className="text-sm text-[var(--color-dim)] font-mono mt-2">
          Trigger a pipeline to see activity
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[var(--color-steel)] border-b border-white/10">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-mono font-bold text-[var(--color-dim)] uppercase tracking-wider">
              PIPELINE
            </th>
            <th className="px-6 py-4 text-left text-xs font-mono font-bold text-[var(--color-dim)] uppercase tracking-wider">
              STATUS
            </th>
            <th className="px-6 py-4 text-left text-xs font-mono font-bold text-[var(--color-dim)] uppercase tracking-wider">
              RECORDS
            </th>
            <th className="px-6 py-4 text-left text-xs font-mono font-bold text-[var(--color-dim)] uppercase tracking-wider">
              STARTED
            </th>
            <th className="px-6 py-4 text-left text-xs font-mono font-bold text-[var(--color-dim)] uppercase tracking-wider">
              DURATION
            </th>
            <th className="px-6 py-4 text-left text-xs font-mono font-bold text-[var(--color-dim)] uppercase tracking-wider">
              LOGS
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {runs.map((run) => {
            const config = statusConfig[run.status]
            const duration = run.completed_at 
              ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
              : null

            return (
              <tr 
                key={run.id}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-mono text-sm font-medium text-white">
                    {run.pipeline_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${config.color}`}>
                    <span>{config.icon}</span>
                    {config.label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono font-bold text-[var(--color-spark)]">
                    {run.records_processed.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono text-gray-300">
                    {new Date(run.started_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono text-gray-300">
                    {duration ? `${duration}s` : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onSelect(run)}
                    className="px-4 py-2 bg-[var(--color-spark)] hover:bg-[var(--color-spark)]/80 text-black font-mono font-bold text-xs rounded transition-all transform hover:scale-105 active:scale-95"
                  >
                    📜 VIEW
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default PipelineList
