import type { PipelineRun } from '../types'

interface Props {
  runs: PipelineRun[]
  onSelect: (run: PipelineRun) => void
}

function PipelineList({ runs, onSelect }: Props) {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    running: 'bg-blue-100 text-blue-800',
  }

  const pipelineNames: Record<string, string> = {
    csv_ingestion: 'CSV Ingestion',
    api_fetch: 'API Fetch',
    data_aggregation: 'Aggregation',
  }

  if (runs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No pipeline runs yet. Click "Run Pipeline" to start.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pipeline</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Logs</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {runs.map((run) => {
            const duration = run.completed_at 
              ? `${Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
              : '-'
            
            return (
              <tr key={run.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {pipelineNames[run.pipeline_name] || run.pipeline_name}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[run.status]}`}>
                    {run.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{run.records_processed}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(run.started_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{duration}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelect(run)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    View
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
