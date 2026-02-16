import type { PipelineRun } from '../types'

interface Props {
  name: string
  displayName: string
  description: string
  onTrigger: () => void
  lastRun?: {
    status: string
    started_at: string
    records_processed: number
  }
}

function PipelineCard({ name, displayName, description, onTrigger, lastRun }: Props) {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    running: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">{displayName}</h3>
        {lastRun && (
          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[lastRun.status as keyof typeof statusColors] || 'bg-gray-100'}`}>
            {lastRun.status}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      {lastRun && (
        <div className="text-xs text-gray-500 mb-4">
          <p>Records: {lastRun.records_processed}</p>
          <p>{new Date(lastRun.started_at).toLocaleString()}</p>
        </div>
      )}
      
      <button
        onClick={onTrigger}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
      >
        Run Pipeline
      </button>
    </div>
  )
}

export default PipelineCard
