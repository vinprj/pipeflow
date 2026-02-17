interface Props {
  title: string
  value: string | number
  color?: 'green' | 'red' | 'yellow' | 'blue'
  icon?: string
}

function StatsCard({ title, value, color, icon }: Props) {
  const colorConfig = {
    green: {
      border: 'border-green-500/50',
      bg: 'bg-green-500/5',
      text: 'text-green-400',
      glow: 'shadow-green-500/20'
    },
    red: {
      border: 'border-red-500/50',
      bg: 'bg-red-500/5',
      text: 'text-red-400',
      glow: 'shadow-red-500/20'
    },
    yellow: {
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/5',
      text: 'text-yellow-400',
      glow: 'shadow-yellow-500/20'
    },
    blue: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/5',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20'
    }
  }

  const config = color ? colorConfig[color] : {
    border: 'border-[var(--color-spark)]/30',
    bg: 'bg-[var(--color-spark)]/5',
    text: 'text-[var(--color-spark)]',
    glow: 'shadow-[var(--color-spark)]/20'
  }

  return (
    <div className={`glass-card rounded-lg p-5 border-l-4 ${config.border} ${config.bg} hover:shadow-lg ${config.glow} transition-all group`}>
      <div className="flex justify-between items-start mb-3">
        <div className="text-sm font-mono text-[var(--color-dim)] uppercase tracking-wider">
          {title}
        </div>
        {icon && (
          <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
        )}
      </div>
      <div className={`text-4xl font-bold font-mono ${config.text} group-hover:scale-105 transition-transform`}>
        {value}
      </div>
    </div>
  )
}

export default StatsCard
