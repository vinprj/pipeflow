import { useEffect } from 'react'
import type { Notification } from '../types'

interface NotificationPanelProps {
  notifications: Notification[]
  onMarkRead: (id: number) => void
  onMarkAllRead: () => void
}

const NotificationPanel = ({ notifications, onMarkRead, onMarkAllRead }: NotificationPanelProps) => {
  const unreadCount = notifications.filter(n => !n.read).length

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Show browser notification for new unread notifications
  useEffect(() => {
    const latestUnread = notifications.find(n => !n.read)
    
    if (latestUnread && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new window.Notification('PipeFlow', {
        body: latestUnread.message,
        icon: latestUnread.type === 'success' ? '✅' : '❌',
        tag: `notification-${latestUnread.id}`, // Prevent duplicates
      })

      notification.onclick = () => {
        window.focus()
        onMarkRead(latestUnread.id)
        notification.close()
      }
    }
  }, [notifications])

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500/30 bg-green-500/5'
      case 'error': return 'border-red-500/30 bg-red-500/5'
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/5'
      default: return 'border-blue-500/30 bg-blue-500/5'
    }
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-[var(--color-steel)]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white font-mono">🔔 NOTIFICATIONS</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold font-mono animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-[var(--color-spark)] hover:text-[var(--color-spark)]/80 font-mono transition-colors"
          >
            MARK ALL READ
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-dim)] font-mono">
            <div className="text-4xl mb-2">📭</div>
            <div>NO NOTIFICATIONS</div>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 cursor-pointer transition-all border-b border-white/5 ${
                !notification.read 
                  ? getTypeStyles(notification.type) 
                  : 'hover:bg-white/5'
              }`}
              onClick={() => !notification.read && onMarkRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getIcon(notification.type)}</span>
                <div className="flex-1">
                  <p className={`text-sm ${!notification.read ? 'font-medium text-white' : 'text-gray-300'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-[var(--color-dim)] font-mono mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-[var(--color-spark)] rounded-full mt-1"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationPanel
