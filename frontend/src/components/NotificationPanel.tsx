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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="divide-y max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => !notification.read && onMarkRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getIcon(notification.type)}</span>
                <div className="flex-1">
                  <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
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
