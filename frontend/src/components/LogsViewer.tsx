import { useState, useMemo } from 'react'
import type { PipelineRun } from '../types'

interface Props {
  run: PipelineRun
  onClose: () => void
}

function LogsViewer({ run, onClose }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warning' | 'info'>('all')

  const logs = useMemo(() => {
    if (!run.logs) return []
    return run.logs.split('\n').filter(line => line.trim())
  }, [run.logs])

  const filteredLogs = useMemo(() => {
    return logs.filter(line => {
      const matchesSearch = line.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
      
      if (filterLevel === 'all') return true
      if (filterLevel === 'error') return line.toLowerCase().includes('error') || line.toLowerCase().includes('fail')
      if (filterLevel === 'warning') return line.toLowerCase().includes('warn')
      if (filterLevel === 'info') return line.toLowerCase().includes('info') || line.toLowerCase().includes('success')
      
      return true
    })
  }, [logs, searchTerm, filterLevel])

  const getLineClass = (line: string) => {
    const lower = line.toLowerCase()
    if (lower.includes('error') || lower.includes('fail')) return 'text-red-400'
    if (lower.includes('warn')) return 'text-yellow-400'
    if (lower.includes('success')) return 'text-green-400'
    return 'text-gray-300'
  }

  const statusColors: Record<string, string> = {
    success: 'text-green-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
    running: 'text-blue-400'
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="glass-card rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden border-2 border-[var(--color-spark)]/30">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[var(--color-steel)] to-[var(--color-concrete)]">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold font-mono text-[var(--color-spark)]">
                PIPELINE LOGS
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm font-mono">
                <span className="text-[var(--color-dim)]">Pipeline: <span className="text-white">{run.pipeline_name}</span></span>
                <span className="text-[var(--color-dim)]">Status: <span className={statusColors[run.status]}>{run.status.toUpperCase()}</span></span>
                <span className="text-[var(--color-dim)]">Records: <span className="text-white">{run.records_processed}</span></span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 border-b border-white/10 bg-[var(--color-steel)]">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-[var(--color-void)] border border-white/20 rounded px-3 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-[var(--color-spark)] focus:outline-none"
            />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="bg-[var(--color-void)] border border-white/20 rounded px-3 py-2 font-mono text-sm text-white focus:border-[var(--color-spark)] focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors Only</option>
              <option value="warning">Warnings Only</option>
              <option value="info">Info Only</option>
            </select>
            <button
              onClick={() => {
                const logsText = filteredLogs.join('\n')
                navigator.clipboard.writeText(logsText)
              }}
              className="px-4 py-2 bg-[var(--color-wire)] hover:bg-[var(--color-concrete)] text-white rounded font-mono text-sm transition-colors"
            >
              📋 COPY
            </button>
          </div>
          <div className="mt-2 text-xs text-[var(--color-dim)] font-mono">
            Showing {filteredLogs.length} of {logs.length} log entries
          </div>
        </div>

        {/* Logs */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-220px)] bg-[var(--color-void)]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-dim)] font-mono">
              {searchTerm || filterLevel !== 'all' ? (
                <>
                  <div className="text-4xl mb-2">🔍</div>
                  <p>No logs match your filters</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">📜</div>
                  <p>No logs available</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((line, idx) => (
                <div
                  key={idx}
                  className="font-mono text-xs py-1 px-2 rounded hover:bg-white/5 transition-colors"
                >
                  <span className="text-[var(--color-dim)] mr-3">{String(idx + 1).padStart(4, '0')}</span>
                  <span className={getLineClass(line)}>{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[var(--color-steel)] flex justify-between items-center text-xs font-mono text-[var(--color-dim)]">
          <div>
            Started: {new Date(run.started_at).toLocaleString()}
          </div>
          {run.completed_at && (
            <div>
              Completed: {new Date(run.completed_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LogsViewer
