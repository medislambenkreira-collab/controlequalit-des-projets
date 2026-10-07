import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User } from 'lucide-react';
import { useStore } from '../store';
import { DI_STATUS_LABELS, fmtDate, isOverdue } from '../utils/format';

export function Inspections() {
  const { state, currentUser, visibleProjects, projectById, userById, disciplineById } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const isInspector = currentUser?.role === 'qc_inspector';

  const inspections = useMemo(() => {
    let list = state.inspectionRequests.filter(d => visibleProjects.some(p => p.id === d.projectId));
    if (isInspector) list = list.filter(d => d.inspectorId === currentUser?.id);
    list = list.filter(d => ['planned','in_progress','completed','reported'].includes(d.status));
    return list;
  }, [state.inspectionRequests, visibleProjects, isInspector, currentUser]);

  const filtered = inspections.filter(d =>
    (!search || d.number.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || d.status === statusFilter)
  ).sort((a,b) => (a.scheduledDate||'').localeCompare(b.scheduledDate||''));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isInspector ? 'Mes inspections' : 'Inspections en cours'}</h1>
        <p className="text-sm text-slate-500">{filtered.length} inspection(s)</p>
      </div>

      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="input max-w-[200px]" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="planned">Planifiée</option>
          <option value="in_progress">En cours</option>
          <option value="reported">Terminée/PV</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(d => {
          const s = DI_STATUS_LABELS[d.status];
          const overdue = d.status==='planned' && d.scheduledDate && isOverdue(d.scheduledDate);
          const insp = userById(d.inspectorId);
          return (
            <Link to={`/di/${d.id}`} key={d.id} className="card p-4 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-primary-700">{d.number}</span>
                <span className={`status-badge ${s.bg} ${s.color} ${overdue?'ring-2 ring-red-400':''}`}>{s.label}{overdue && ' (en retard)'}</span>
              </div>
              <div className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">{d.description}</div>
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1"><Calendar size={12}/>{d.scheduledDate ? fmtDate(d.scheduledDate) + ' ' + (d.scheduledTime||'') : 'Non planifiée'}</div>
                <div className="flex items-center gap-1"><User size={12}/>{insp?.fullName||'Non affecté'}</div>
                <div className="flex items-center gap-1">🏗️ {projectById(d.projectId)?.code} • {disciplineById(d.disciplineId)?.name}</div>
              </div>
            </Link>
          );
        })}
        {filtered.length===0 && <div className="col-span-full card p-10 text-center text-slate-500">Aucune inspection.</div>}
      </div>
    </div>
  );
}
