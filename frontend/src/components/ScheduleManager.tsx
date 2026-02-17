import { useState } from 'react'
import type { Schedule } from '../types'

interface ScheduleManagerProps {
  schedules: Schedule[]
  onCreateSchedule: (pipelineName: string, cronExpression: string) => void
  onToggleSchedule: (scheduleId: string) => void
  onDeleteSchedule: (scheduleId: string) => void
}

const ScheduleManager = ({ schedules, onCreateSchedule, onToggleSchedule, onDeleteSchedule }: ScheduleManagerProps) => {
  const [showForm, setShowForm] = useState(false)
  const [pipelineName, setPipelineName] = useState('csv_ingestion')
  const [cronExpression, setCronExpression] = useState('0 * * * *')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateSchedule(pipelineName, cronExpression)
    setShowForm(false)
    setPipelineName('csv_ingestion')
    setCronExpression('0 * * * *')
  }

  const cronPresets = [
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every 6 hours', value: '0 */6 * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Every Monday 9am', value: '0 9 * * 1' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Pipeline Schedules</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          {showForm ? 'Cancel' : '+ Add Schedule'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline</label>
              <select
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="csv_ingestion">CSV Ingestion</option>
                <option value="api_fetch">API Fetch</option>
                <option value="data_aggregation">Data Aggregation</option>
                <option value="json_ingestion">JSON Ingestion</option>
                <option value="web_scraping">Web Scraping</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cron Expression</label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 * * * *"
                className="w-full px-3 py-2 border rounded-md"
              />
              <div className="mt-1 flex flex-wrap gap-1">
                {cronPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setCronExpression(preset.value)}
                    className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="divide-y">
        {schedules.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No schedules configured</div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{schedule.pipeline_name}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {schedule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{schedule.cron_expression}</span>
                  {schedule.last_run_at && (
                    <span className="ml-2">
                      Last run: {new Date(schedule.last_run_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleSchedule(schedule.id)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    schedule.enabled
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {schedule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => onDeleteSchedule(schedule.id)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ScheduleManager
