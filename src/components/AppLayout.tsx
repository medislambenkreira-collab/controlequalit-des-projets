import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, ClipboardList, Search as SearchIcon, CalendarDays, FileCheck,
  FileText, AlertTriangle, Paperclip, BarChart3, Bell, Users, Settings, LogOut, Menu, X, ShieldCheck,
} from 'lucide-react';
import { useStore } from '../store';
import { ROLE_LABELS } from '../utils/format';

interface NavItem { to: string; label: string; icon: React.ReactNode; roles?: string[]; }

const NAV: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: <LayoutDashboard size={18}/> },
  { to: '/projects', label: 'Projets', icon: <FolderOpen size={18}/> },
  { to: '/pcq', label: 'PCQ', icon: <ClipboardList size={18}/> },
  { to: '/di', label: 'Demandes d\'inspection', icon: <SearchIcon size={18}/> },
  { to: '/schedule', label: 'Programme inspection', icon: <CalendarDays size={18}/> },
  { to: '/inspections', label: 'Inspections', icon: <FileCheck size={18}/> },
  { to: '/reports', label: 'PV / Rapports', icon: <FileText size={18}/> },
  { to: '/ncr', label: 'Écarts / NCR', icon: <AlertTriangle size={18}/> },
  { to: '/documents', label: 'Documents', icon: <Paperclip size={18}/> },
  { to: '/stats', label: 'Statistiques', icon: <BarChart3 size={18}/> },
  { to: '/notifications', label: 'Notifications', icon: <Bell size={18}/> },
  { to: '/users', label: 'Utilisateurs', icon: <Users size={18}/>, roles: ['admin'] },
  { to: '/settings', label: 'Paramètres', icon: <Settings size={18}/>, roles: ['admin'] },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, state, hasRole } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadNotifs = state.notifications.filter(n => n.userId === currentUser?.id && !n.read).length;

  const handleLogout = () => { logout(); navigate('/login'); };

  const filteredNav = NAV.filter(item => !item.roles || item.roles.some(r => hasRole(r as any)));

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform`}>
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <ShieldCheck size={20} className="text-white"/>
          </div>
          <div>
            <div className="font-bold text-white leading-tight">QualitéQC</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Contrôle Qualité</div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto p-1 text-slate-400"><X size={18}/></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {filteredNav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-primary-600 text-white border-l-4 border-primary-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
                }`
              }>
              {item.icon}
              <span>{item.label}</span>
              {item.to === '/notifications' && unreadNotifs > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{unreadNotifs}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
              {currentUser?.fullName.split(' ').map(p => p[0]).slice(0,2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{currentUser?.fullName}</div>
              <div className="text-xs text-slate-400 truncate">{currentUser && ROLE_LABELS[currentUser.role]}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-800 hover:bg-red-600 text-slate-200 rounded-md transition-colors">
            <LogOut size={16}/> Déconnexion
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}/>}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 rounded-md hover:bg-slate-100"><Menu size={22}/></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800">Plateforme Contrôle Qualité</h2>
              <span className="hidden sm:inline px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded">Industrie - Hydrocarbures</span>
            </div>
          </div>
          <NavLink to="/notifications" className="relative p-2 rounded-md hover:bg-slate-100 text-slate-600">
            <Bell size={20}/>
            {unreadNotifs > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unreadNotifs}</span>}
          </NavLink>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
