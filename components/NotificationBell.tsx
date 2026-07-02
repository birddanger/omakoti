import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, AlertTriangle, Clock, ShieldAlert, RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { notificationsService, AppNotification } from '../services/notificationsService';

const POLL_INTERVAL_MS = 60_000;

const iconFor = (n: AppNotification) => {
  switch (n.type) {
    case 'task_overdue':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'task_due':
      return <Clock className="w-4 h-4 text-orange-500" />;
    case 'warranty_expiring':
      return <ShieldAlert className="w-4 h-4 text-amber-500" />;
    default:
      return <RefreshCw className="w-4 h-4 text-blue-500" />;
  }
};

const NotificationBell: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await notificationsService.getAll();
      setItems(res.notifications);
      setUnread(res.unreadCount);
    } catch (err) {
      // Silent: notifications are non-critical UI.
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Close on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (n: AppNotification) => {
    if (n.isRead) return;
    setItems(prev => prev.map(i => (i.id === n.id ? { ...i, isRead: true } : i)));
    setUnread(u => Math.max(0, u - 1));
    try {
      await notificationsService.markRead(n.id);
    } catch {
      load();
    }
  };

  const markAllRead = async () => {
    setItems(prev => prev.map(i => ({ ...i, isRead: true })));
    setUnread(0);
    try {
      await notificationsService.markAllRead();
    } catch {
      load();
    }
  };

  const remove = async (e: React.MouseEvent, n: AppNotification) => {
    e.stopPropagation();
    setItems(prev => prev.filter(i => i.id !== n.id));
    if (!n.isRead) setUnread(u => Math.max(0, u - 1));
    try {
      await notificationsService.remove(n.id);
    } catch {
      load();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label={t('notif.title')}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">{t('notif.title')}</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 font-medium hover:text-blue-700 inline-flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                {t('notif.mark_all_read')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                {t('notif.none')}
              </div>
            ) : (
              items.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`group flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${
                    n.isRead ? 'opacity-60' : 'bg-blue-50/40'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{iconFor(n)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{n.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    {n.dueDate && (
                      <p className="text-[11px] text-slate-400 mt-1">{formatDate(n.dueDate)}</p>
                    )}
                  </div>
                  {!n.isRead && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <button
                    onClick={(e) => remove(e, n)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 flex-shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
