import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { useStore } from '../store';
import { DI_STATUS_LABELS, fmtDate } from '../utils/format';

export function Stats() {
  const { state, visibleProjects, visibleDI } = useStore();

  const byMonth = useMemo(() => {
    const m: Record<string, { inspections: number; ncrs: number }> = {};
    visibleDI.forEach(d => {
      const key = (d.scheduledDate || d.requestDate).slice(0,7);
      m[key] = m[key] || { inspections: 0, ncrs: 0 };
      m[key].inspections++;
    });
    state.nonConformities.filter(n=>visibleProjects.some(p=>p.id===n.projectId)).forEach(n => {
      const key = n.date.slice(0,7);
      m[key] = m[key] || { inspections: 0, ncrs: 0 };
      m[key].ncrs++;
    });
    return Object.entries(m).sort().map(([k,v]) => ({ mois: k.slice(5)+'/'+k.slice(0,4), ...v }));
  }, [visibleDI, state.nonConformities, visibleProjects]);

  const byProject = useMemo(() => visibleProjects.map(p => ({
    name: p.code,
    inspections: visibleDI.filter(d=>d.projectId===p.id).length,
    ncrs: state.nonConformities.filter(n=>n.projectId===p.id).length,
  })), [visibleProjects, visibleDI, state.nonConformities]);

  const byDiscipline = useMemo(() => {
    const g: Record<string, { inspections: number; ncrs: number }> = {};
    visibleDI.forEach(d => {
      const n = state.disciplines.find(x=>x.id===d.disciplineId)?.name || '?';
      g[n] = g[n] || { inspections: 0, ncrs: 0 };
      g[n].inspections++;
    });
    state.nonConformities.filter(n=>visibleProjects.some(p=>p.id===n.projectId)).forEach(n => {
      const nm = state.disciplines.find(x=>x.id===n.disciplineId)?.name || '?';
      g[nm] = g[nm] || { inspections: 0, ncrs: 0 };
      g[nm].ncrs++;
    });
    return Object.entries(g).map(([name, v]) => ({ name, ...v }));
  }, [visibleDI, state.nonConformities, state.disciplines, visibleProjects]);

  const byPhase = useMemo(() => {
    const g: Record<string, number> = {};
    state.nonConformities.filter(n=>visibleProjects.some(p=>p.id===n.projectId)).forEach(n => {
      const nm = state.phases.find(x=>x.id===n.phaseId)?.name || '?';
      g[nm] = (g[nm]||0)+1;
    });
    return Object.entries(g).map(([name, value]) => ({ name, value }));
  }, [state.nonConformities, state.phases, visibleProjects]);

  const diStatus = useMemo(() => {
    const g: Record<string, number> = {};
    visibleDI.forEach(d => { g[d.status] = (g[d.status]||0)+1; });
    return Object.entries(g).map(([k, v]) => ({ name: DI_STATUS_LABELS[k]?.label || k, value: v }));
  }, [visibleDI]);

  const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
  const totalNC = state.nonConformities.filter(n=>visibleProjects.some(p=>p.id===n.projectId)).length;
  const closedNC = state.nonConformities.filter(n=>n.status==='closed'&&visibleProjects.some(p=>p.id===n.projectId)).length;
  const closeRate = totalNC ? Math.round(closedNC/totalNC*100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Statistiques & Indicateurs Qualité</h1>
        <p className="text-sm text-slate-500">Analyse de la performance qualité. Taux de clôture des NCR: <span className="font-bold text-green-700">{closeRate}%</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Évolution Inspections vs Écarts</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={byMonth}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey="mois" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Line type="monotone" dataKey="inspections" stroke="#2563eb" strokeWidth={2} name="Inspections"/><Line type="monotone" dataKey="ncrs" stroke="#ef4444" strokeWidth={2} name="Écarts"/></LineChart>
          </ResponsiveContainer></div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">DI par statut</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={diStatus} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={(e)=>`${e.name}: ${e.value}`} fontSize={11}>{diStatus.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart>
          </ResponsiveContainer></div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Par projet</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={byProject}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="inspections" fill="#3b82f6" name="Inspections"/><Bar dataKey="ncrs" fill="#ef4444" name="Écarts"/></BarChart>
          </ResponsiveContainer></div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Par corps d'état</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDiscipline} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={120}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="inspections" fill="#0ea5e9"/><Bar dataKey="ncrs" fill="#f97316"/></BarChart>
          </ResponsiveContainer></div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Écarts par phase de construction</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={byPhase}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey="name" tick={{fontSize:10}} angle={-10} textAnchor="end" height={60}/><YAxis tick={{fontSize:11}}/><Tooltip contentStyle={{fontSize:12}}/><Bar dataKey="value" fill="#dc2626" radius={[4,4,0,0]}/></BarChart>
          </ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}
