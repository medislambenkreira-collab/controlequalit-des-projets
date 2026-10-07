import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useStore } from '../store';
import { DI_STATUS_LABELS, fmtDate } from '../utils/format';
import { startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isToday, format, parseISO, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Schedule() {
  const { state, visibleProjects, visibleDI, projectById, userById, disciplineById } = useStore();
  const [cursor, setCursor] = useState(new Date());
  const [projectFilter, setProjectFilter] = useState('');
  const [inspectorFilter, setInspectorFilter] = useState('');

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1; // Mon first

  const inspections = useMemo(() => visibleDI.filter(d =>
    d.scheduledDate && ['planned','in_progress','reported','closed'].includes(d.status) &&
    (!projectFilter || d.projectId === projectFilter) &&
    (!inspectorFilter || d.inspectorId === inspectorFilter)
  ), [visibleDI, projectFilter, inspectorFilter]);

  const byDate = useMemo(() => {
    const m: Record<string, typeof inspections> = {};
    inspections.forEach(d => {
      const key = d.scheduledDate!;
      if (!m[key]) m[key] = [];
      m[key].push(d);
    });
    return m;
  }, [inspections]);

  const inspectors = state.users.filter(u => u.role === 'qc_inspector' && u.active);

  const getColor = (status: string) => {
    if (status === 'reported' || status === 'closed') return 'bg-emerald-100 border-emerald-400 text-emerald-800';
    if (status === 'in_progress') return 'bg-purple-100 border-purple-400 text-purple-800';
    const ddate = parseISO(cursor.toISOString()); // placeholder
    void ddate;
    return 'bg-indigo-100 border-indigo-400 text-indigo-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Calendrier des inspections</h1>
        <p className="text-sm text-slate-500">Programme prévisionnel et réalisé.</p>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <Filter size={16} className="text-slate-400"/>
        <select className="input max-w-[200px]" value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}>
          <option value="">Tous les projets</option>
          {visibleProjects.map(p=><option key={p.id} value={p.id}>{p.code}</option>)}
        </select>
        <select className="input max-w-[200px]" value={inspectorFilter} onChange={e=>setInspectorFilter(e.target.value)}>
          <option value="">Tous les inspecteurs</option>
          {inspectors.map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <button className="btn-ghost" onClick={()=>setCursor(subMonths(cursor,1))}><ChevronLeft size={18}/></button>
          <h2 className="text-lg font-semibold text-slate-900 capitalize">{format(cursor, 'MMMM yyyy', { locale: fr })}</h2>
          <button className="btn-ghost" onClick={()=>setCursor(addMonths(cursor,1))}><ChevronRight size={18}/></button>
        </div>
        <div className="grid grid-cols-7 text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => <div key={d} className="p-2 text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {Array.from({ length: startDay }).map((_, i) => <div key={'e'+i} className="bg-slate-50 min-h-[100px]"></div>)}
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const items = byDate[key] || [];
            const isPast = isBefore(day, new Date()) && !isSameDay(day, new Date());
            return (
              <div key={key} className={`bg-white min-h-[100px] p-1 ${isToday(day) ? 'ring-2 ring-primary-500 ring-inset' : ''} ${isPast?'bg-slate-50':''}`}>
                <div className={`text-xs font-semibold p-1 ${isToday(day)?'text-primary-700 bg-primary-50 rounded-full w-6 h-6 flex items-center justify-center':'text-slate-600'}`}>{format(day,'d')}</div>
                <div className="space-y-1 mt-1">
                  {items.slice(0,3).map(d => {
                    const overdue = d.status === 'planned' && isBefore(day, new Date()) && !isSameDay(day, new Date());
                    const color = d.status==='reported'||d.status==='closed'?'bg-emerald-100 border-emerald-300 text-emerald-800':
                      d.status==='in_progress'?'bg-purple-100 border-purple-300 text-purple-800':
                      overdue?'bg-red-100 border-red-300 text-red-800':
                      'bg-indigo-100 border-indigo-300 text-indigo-800';
                    return (
                      <Link to={`/di/${d.id}`} key={d.id} className={`block text-[10px] px-1.5 py-1 rounded border-l-2 ${color} truncate hover:shadow`} title={d.description}>
                        <span className="font-mono font-semibold">{d.scheduledTime} {d.number.split('-').slice(-1)[0]}</span> {disciplineById(d.disciplineId)?.name}
                      </Link>
                    );
                  })}
                  {items.length > 3 && <div className="text-[10px] text-slate-500 px-1">+{items.length-3} autre(s)</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 text-xs flex-wrap card p-4">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-indigo-400"></div>Planifiée</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-400"></div>En cours</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-400"></div>Réalisée</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-400"></div>En retard</div>
      </div>
    </div>
  );
}
