interface Props {
  title: string
  value: number | string
  color?: 'green' | 'red' | 'yellow' | 'blue'
}

function StatsCard({ title, value, color = 'blue' }: Props) {
  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  )
}

export default StatsCard
