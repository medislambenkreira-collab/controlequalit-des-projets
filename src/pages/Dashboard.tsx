import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, ClipboardList, AlertTriangle, CheckCircle2, Clock, Calendar as CalendarIcon, TrendingUp, XCircle, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { useStore } from '../store';
import { fmtDate, DI_STATUS_LABELS, isOverdue } from '../utils/format';

export function Dashboard() {
  const { currentUser, state, visibleProjects, visibleDI } = useStore();
  const now = new Date();

  const kpis = useMemo(() => {
    const active = visibleProjects.filter(p => p.status === 'ongoing').length;
    const totalDI = visibleDI.length;
    const openDI = visibleDI.filter(d => ['submitted','under_review','info_requested','accepted','planned'].includes(d.status)).length;
    const doneDI = visibleDI.filter(d => ['reported','closed'].includes(d.status)).length;
    const overdueDI = visibleDI.filter(d => (d.status === 'planned' || d.status === 'accepted') && d.scheduledDate && isOverdue(d.scheduledDate)).length;
    const inProgressDI = visibleDI.filter(d => ['in_progress'].includes(d.status)).length;
    const ncrs = state.nonConformities.filter(n => visibleProjects.some(p => p.id === n.projectId));
    const ncrsOpen = ncrs.filter(n => n.status !== 'closed').length;
    const ncrsClosed = ncrs.filter(n => n.status === 'closed').length;
    const closeRate = ncrs.length ? Math.round((ncrsClosed/ncrs.length)*100) : 0;
    const ncrsOverdue = ncrs.filter(n => n.status !== 'closed' && isOverdue(n.dueDate)).length;
    return { active, totalDI, openDI, doneDI, overdueDI, inProgressDI, ncrsOpen, ncrsClosed, closeRate, ncrsOverdue, ncrsTotal: ncrs.length };
  }, [visibleProjects, visibleDI, state.nonConformities]);

  const inspectionsByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    visibleDI.forEach(d => {
      const key = d.scheduledDate ? d.scheduledDate.slice(0,7) : d.requestDate.slice(0,7);
      months[key] = (months[key]||0)+1;
    });
    return Object.entries(months).sort().map(([k,v]) => ({ mois: k.slice(5)+'/'+k.slice(0,4), inspections: v })).slice(-8);
  }, [visibleDI]);

  const inspectionsByDiscipline = useMemo(() => {
    const g: Record<string, number> = {};
    visibleDI.forEach(d => {
      const name = state.disciplines.find(x => x.id === d.disciplineId)?.name || 'Inconnu';
      g[name] = (g[name]||0)+1;
    });
    return Object.entries(g).map(([name, value]) => ({ name, value })).slice(0,8);
  }, [visibleDI, state.disciplines]);

  const ncrsByStatus = useMemo(() => {
    const g: Record<string, number> = {};
    state.nonConformities.filter(n => visibleProjects.some(p=>p.id===n.projectId)).forEach(n => {
      const label = n.status === 'closed' ? 'Clôturés' : n.status === 'open' ? 'Ouverts' : 'En cours';
      g[label] = (g[label]||0)+1;
    });
    return Object.entries(g).map(([name, value]) => ({ name, value }));
  }, [state.nonConformities, visibleProjects]);

  const upcoming = useMemo(() => {
    return visibleDI
      .filter(d => d.status === 'planned' && d.scheduledDate)
      .sort((a,b) => (a.scheduledDate||'').localeCompare(b.scheduledDate||''))
      .slice(0, 6);
  }, [visibleDI]);

  const PIE_COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6'];

  const kpiCards = [
    { label: 'Projets actifs', value: kpis.active, icon: <FolderOpen size={22}/>, color: 'from-blue-500 to-blue-600' },
    { label: 'DI ouvertes / en attente', value: kpis.openDI, icon: <ClipboardList size={22}/>, color: 'from-amber-500 to-amber-600' },
    { label: 'Inspections en retard', value: kpis.overdueDI, icon: <Clock size={22}/>, color: 'from-red-500 to-red-600' },
    { label: 'Écarts ouverts', value: kpis.ncrsOpen, icon: <AlertTriangle size={22}/>, color: 'from-orange-500 to-orange-600' },
    { label: 'Écarts clôturés', value: kpis.ncrsClosed, icon: <CheckCircle2 size={22}/>, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Écarts en retard', value: kpis.ncrsOverdue, icon: <XCircle size={22}/>, color: 'from-rose-500 to-rose-600' },
    { label: 'Inspections réalisées', value: kpis.doneDI, icon: <CheckCircle2 size={22}/>, color: 'from-teal-500 to-teal-600' },
    { label: 'Taux de clôture', value: `${kpis.closeRate}%`, icon: <TrendingUp size={22}/>, color: 'from-indigo-500 to-indigo-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Bonjour {currentUser?.fullName.split(' ')[0]} 👷</h1>
        <p className="text-primary-100 mt-1">Voici un aperçu de la qualité de vos projets en date du {fmtDate(now.toISOString())}.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((c, i) => (
          <div key={i} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-500 uppercase font-medium tracking-wide">{c.label}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{c.value}</div>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.color} text-white flex items-center justify-center shadow`}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Inspections par mois</h3>
            <Link to="/stats" className="text-primary-600 text-sm flex items-center gap-1 hover:underline">Statistiques <ChevronRight size={16}/></Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inspectionsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="mois" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }}/>
                <Tooltip contentStyle={{ fontSize: 12 }}/>
                <Bar dataKey="inspections" fill="#2563eb" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Écarts par statut</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ncrsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={(e) => `${e.name}: ${e.value}`} labelLine={false} fontSize={11}>
                  {ncrsByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Inspections par corps d'état</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inspectionsByDiscipline} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis type="number" tick={{ fontSize: 11 }}/>
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100}/>
                <Tooltip contentStyle={{ fontSize: 12 }}/>
                <Bar dataKey="value" fill="#0ea5e9" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><CalendarIcon size={18}/> Prochaines inspections</h3>
            <Link to="/schedule" className="text-primary-600 text-sm flex items-center gap-1 hover:underline">Calendrier <ChevronRight size={16}/></Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Aucune inspection planifiée.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(di => {
                const proj = state.projects.find(p => p.id === di.projectId);
                const disc = state.disciplines.find(d => d.id === di.disciplineId);
                const inspector = state.users.find(u => u.id === di.inspectorId);
                const s = DI_STATUS_LABELS[di.status];
                return (
                  <Link key={di.id} to={`/di/${di.id}`} className="block p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-primary-300 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-800">{di.number}</span>
                      <span className={`status-badge ${s.bg} ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="text-xs text-slate-600 truncate">{proj?.name}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>📅 {fmtDate(di.scheduledDate)} {di.scheduledTime||''}</span>
                      <span>•</span>
                      <span>{disc?.name}</span>
                      {inspector && <><span>•</span><span>👷 {inspector.fullName}</span></>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Activité récente (traçabilité)</h3>
        <div className="space-y-2">
          {state.auditLogs.slice(0,8).map(log => {
            const u = state.users.find(x => x.id === log.userId);
            return (
              <div key={log.id} className="flex items-start gap-3 p-2 text-sm">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
                <div className="flex-1">
                  <div className="text-slate-800"><span className="font-medium">{u?.fullName || 'Système'}</span> a {log.action.toLowerCase()} {log.entityType} <span className="font-mono text-xs text-slate-600">{log.entityId}</span></div>
                  {log.details && <div className="text-xs text-slate-500">{log.details}</div>}
                  <div className="text-xs text-slate-400">{fmtDate(log.timestamp)}</div>
                </div>
              </div>
            );
          })}
          {state.auditLogs.length === 0 && <p className="text-sm text-slate-500 text-center py-6">Aucune activité enregistrée pour le moment.</p>}
        </div>
      </div>
    </div>
  );
}
