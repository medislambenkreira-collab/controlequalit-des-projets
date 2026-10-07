import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useStore } from '../store';
import { DI_STATUS_LABELS, fmtDate, isOverdue } from '../utils/format';

export function DIList() {
  const { state, visibleDI, visibleProjects, projectById, phaseById, disciplineById, userById, hasRole } = useStore();
  const [sp] = useSearchParams();
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState(sp.get('project')||'');
  const [statusFilter, setStatusFilter] = useState('');

  const canCreate = hasRole('admin','construction_manager','qc_manager');

  const filtered = useMemo(() => visibleDI.filter(d =>
    (!search || d.number.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase()) || d.location.toLowerCase().includes(search.toLowerCase())) &&
    (!projectFilter || d.projectId === projectFilter) &&
    (!statusFilter || d.status === statusFilter)
  ).sort((a,b) => b.requestDate.localeCompare(a.requestDate)), [visibleDI, search, projectFilter, statusFilter]);

  const exportExcel = () => {
    const data = filtered.map(d => ({
      'N° DI': d.number,
      'Projet': projectById(d.projectId)?.name,
      'Lot': d.lot,
      'Phase': phaseById(d.phaseId)?.name,
      'Corps d\'état': disciplineById(d.disciplineId)?.name,
      'Description': d.description,
      'Zone': d.location,
      'Date demande': fmtDate(d.requestDate),
      'Date souhaitée': fmtDate(d.desiredDate),
      'Demandeur': userById(d.requestedById)?.fullName,
      'Inspecteur': userById(d.inspectorId)?.fullName,
      'Date prévue': d.scheduledDate ? fmtDate(d.scheduledDate) : '',
      'Statut': DI_STATUS_LABELS[d.status].label,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DI');
    XLSX.writeFile(wb, `liste_DI_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demandes d'Inspection (DI)</h1>
          <p className="text-sm text-slate-500">{filtered.length} demande(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn-secondary"><FileSpreadsheet size={16}/> Exporter</button>
          {canCreate && <Link to="/di/new" className="btn-primary"><Plus size={16}/> Nouvelle DI</Link>}
        </div>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="input pl-9" placeholder="Rechercher n° DI, description, zone..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="input" value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}>
          <option value="">Tous les projets</option>
          {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
        </select>
        <select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(DI_STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>N° DI</th>
              <th>Projet</th>
              <th>Phase / Corps d'état</th>
              <th>Description</th>
              <th>Zone</th>
              <th>Demandeur</th>
              <th>Date souhaitée</th>
              <th>Inspecteur</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => {
              const s = DI_STATUS_LABELS[d.status];
              const overdue = d.status==='planned' && d.scheduledDate && isOverdue(d.scheduledDate);
              return (
                <tr key={d.id}>
                  <td className="font-mono font-semibold text-primary-700">{d.number}{overdue && <span className="ml-1 text-red-500" title="En retard">⚠</span>}</td>
                  <td className="text-xs max-w-[180px] truncate">{projectById(d.projectId)?.code}</td>
                  <td className="text-xs"><div>{phaseById(d.phaseId)?.name}</div><div className="text-slate-500">{disciplineById(d.disciplineId)?.name}</div></td>
                  <td className="text-xs max-w-[250px] truncate">{d.description}</td>
                  <td className="text-xs">{d.location}</td>
                  <td className="text-xs">{userById(d.requestedById)?.fullName}</td>
                  <td className="text-xs">{fmtDate(d.desiredDate)}</td>
                  <td className="text-xs">{userById(d.inspectorId)?.fullName || '-'}</td>
                  <td><span className={`status-badge ${s.bg} ${s.color}`}>{s.label}</span></td>
                  <td><Link to={`/di/${d.id}`} className="text-primary-600 text-xs font-semibold hover:underline">Ouvrir →</Link></td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-10 text-slate-500">Aucune demande d'inspection.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
