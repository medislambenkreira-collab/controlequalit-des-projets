import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { useStore } from '../store';
import { fmtDateTime } from '../utils/format';

export function Notifications() {
  const { state, currentUser, dispatch } = useStore();
  const notifs = state.notifications.filter(n => n.userId === currentUser?.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));

  const markRead = (id: string) => dispatch({ type: 'MARK_NOTIFICATION_READ', id });
  const markAll = () => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">{notifs.filter(n=>!n.read).length} non lue(s)</p>
        </div>
        {notifs.some(n=>!n.read) && <button className="btn-secondary" onClick={markAll}><Check size={16}/> Tout marquer comme lu</button>}
      </div>

      <div className="card">
        {notifs.length === 0 ? (
          <div className="p-10 text-center text-slate-500"><Bell size={40} className="mx-auto mb-3 opacity-20"/>Aucune notification.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifs.map(n => (
              <li key={n.id} className={`p-4 hover:bg-slate-50 ${!n.read ? 'bg-primary-50/30' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${!n.read ? 'bg-primary-600' : 'bg-transparent'}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Link to={n.link || '#'} onClick={()=>markRead(n.id)} className="font-semibold text-slate-900 hover:text-primary-600">{n.title}</Link>
                      <span className="text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                  </div>
                  {!n.read && <button onClick={()=>markRead(n.id)} className="text-xs text-primary-600 hover:underline">Marquer lu</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
