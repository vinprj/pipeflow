import { useState, useEffect } from 'react'
import PipelineCard from './components/PipelineCard'
import PipelineList from './components/PipelineList'
import StatsCard from './components/StatsCard'
import type { PipelineRun, Stats } from './types'

function App() {
  const [runs, setRuns] = useState<PipelineRun[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null)

  const fetchData = async () => {
    try {
      const [runsRes, statsRes] = await Promise.all([
        fetch('/api/pipelines'),
        fetch('/api/stats')
      ])
      const runsData = await runsRes.json()
      const statsData = await statsRes.json()
      setRuns(runsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleTrigger = async (pipeline: string) => {
    try {
      const response = await fetch(`/api/pipelines/${pipeline}/trigger`, {
        method: 'POST'
      })
      await response.json()
      fetchData()
    } catch (error) {
      console.error('Error triggering pipeline:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading PipeFlow...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">PipeFlow</h1>
          <p className="text-gray-600">ETL Pipeline Dashboard</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatsCard title="Total Runs" value={stats.total_runs} />
            <StatsCard title="Successful" value={stats.successful_runs} color="green" />
            <StatsCard title="Failed" value={stats.failed_runs} color="red" />
            <StatsCard title="Success Rate" value={`${stats.success_rate}%`} color={stats.success_rate > 70 ? 'green' : 'yellow'} />
          </div>
        )}

        {/* Pipeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <PipelineCard
            name="csv_ingestion"
            displayName="CSV Ingestion"
            description="Extract data from CSV files, transform, and load to database"
            onTrigger={() => handleTrigger('csv-ingestion')}
            lastRun={stats?.latest_runs?.csv_ingestion}
          />
          <PipelineCard
            name="api_fetch"
            displayName="API Data Fetch"
            description="Fetch data from external APIs and store in database"
            onTrigger={() => handleTrigger('api-fetch')}
            lastRun={stats?.latest_runs?.api_fetch}
          />
          <PipelineCard
            name="data_aggregation"
            displayName="Data Aggregation"
            description="Aggregate and compute metrics from existing data"
            onTrigger={() => handleTrigger('aggregation')}
            lastRun={stats?.latest_runs?.data_aggregation}
          />
        </div>

        {/* Pipeline Runs List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Pipeline Runs</h2>
          </div>
          <PipelineList runs={runs} onSelect={setSelectedRun} />
        </div>
      </main>

      {/* Logs Modal */}
      {selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold">Pipeline Logs</h3>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              <pre className="text-sm bg-gray-50 p-4 rounded whitespace-pre-wrap font-mono">
                {selectedRun.logs || 'No logs available'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
