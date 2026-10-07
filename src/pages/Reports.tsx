import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, FileText, Search } from 'lucide-react';
import { useStore } from '../store';
import { fmtDate, RESULT_LABELS } from '../utils/format';
import { generatePV } from '../utils/pdf';

export function Reports() {
  const { state, visibleProjects, projectById, userById, phaseById, disciplineById, qpItemById } = useStore();
  const [search, setSearch] = useState('');

  const reports = state.inspectionReports.filter(r => visibleProjects.some(p => p.id === r.projectId));
  const filtered = reports.filter(r => {
    const di = state.inspectionRequests.find(d => d.id === r.inspectionRequestId);
    if (!di) return false;
    return !search || r.number.toLowerCase().includes(search.toLowerCase()) || di.number.toLowerCase().includes(search.toLowerCase()) || di.description.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">PV / Rapports d'inspection</h1>
        <p className="text-sm text-slate-500">{filtered.length} PV généré(s)</p>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="input pl-9" placeholder="Rechercher par n° PV, DI..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>N° PV</th><th>DI associée</th><th>Projet</th><th>Activité</th><th>Inspecteur</th><th>Date</th><th>Résultat</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(r => {
              const di = state.inspectionRequests.find(d => d.id === r.inspectionRequestId);
              const proj = projectById(r.projectId);
              const insp = userById(r.inspectorId);
              const qpi = qpItemById(di?.qualityPlanItemId);
              const resultColor = r.result==='conform'?'bg-green-100 text-green-700':r.result==='non_conform'?'bg-red-100 text-red-700':r.result==='conform_with_obs'?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-700';
              return (
                <tr key={r.id}>
                  <td className="font-mono font-semibold text-primary-700">{r.number}</td>
                  <td className="font-mono text-xs">{di?.number}</td>
                  <td className="text-xs">{proj?.code}</td>
                  <td className="text-xs">{qpi?.activity || di?.description.slice(0,60)}</td>
                  <td className="text-xs">{insp?.fullName}</td>
                  <td className="text-xs">{fmtDate(r.date)}</td>
                  <td><span className={`status-badge ${resultColor}`}>{RESULT_LABELS[r.result]}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link to={`/reports/${r.id}`} className="p-1 text-primary-600 hover:bg-primary-50 rounded" title="Voir"><Eye size={14}/></Link>
                      {di && <button onClick={()=>generatePV(r,di,proj!,{phase:phaseById(di.phaseId),disc:disciplineById(di.disciplineId),qpItem:qpi,inspector:insp,requester:userById(di.requestedById),qcManager:userById(proj?.qcManagerId),checklist:di.checklistResults})} className="p-1 text-slate-600 hover:bg-slate-100 rounded" title="Télécharger PDF"><Download size={14}/></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length===0 && <tr><td colSpan={8} className="text-center py-10 text-slate-500">Aucun PV généré.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReportDetail() {
  const { id } = (window as any).location.pathname.split('/').length > 0 ? { id: '' } : { id: '' };
  // Placeholder not used, separate component below
  return null;
}

export function ReportDetailPage() {
  const params = window.location.pathname.split('/');
  const id = params[params.length-1];
  const { state, projectById, userById, phaseById, disciplineById, qpItemById } = useStore();
  const report = state.inspectionReports.find(r => r.id === id);
  if (!report) return <div className="card p-8 text-center">PV introuvable.</div>;
  const di = state.inspectionRequests.find(d => d.id === report.inspectionRequestId);
  const proj = projectById(report.projectId);
  const insp = userById(report.inspectorId);
  const cm = userById(report.constructionManagerId);
  const qpi = qpItemById(di?.qualityPlanItemId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/reports" className="inline-flex items-center gap-1 text-sm text-slate-600">← Retour aux PV</Link>
      <div className="card p-8 border-2 border-primary-200">
        <div className="text-center border-b-2 border-primary-600 pb-4 mb-6">
          <div className="text-xs text-slate-500 mb-1">PROCES-VERBAL DE CONTROLE</div>
          <h1 className="text-2xl font-bold text-primary-800">{report.number}</h1>
          <div className="text-sm text-slate-600 mt-1">En date du {fmtDate(report.date)} - Rév. 00</div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div><div className="text-xs text-slate-500">Projet</div><div className="font-semibold">{proj?.name}</div></div>
          <div><div className="text-xs text-slate-500">N° Affaire</div><div className="font-mono">{proj?.code}</div></div>
          <div><div className="text-xs text-slate-500">Demande d'inspection</div><div className="font-mono">{di?.number}</div></div>
          <div><div className="text-xs text-slate-500">Activité</div><div>{qpi?.activity}</div></div>
          <div><div className="text-xs text-slate-500">Phase</div><div>{phaseById(di?.phaseId)?.name}</div></div>
          <div><div className="text-xs text-slate-500">Corps d'état</div><div>{disciplineById(di?.disciplineId)?.name}</div></div>
          <div><div className="text-xs text-slate-500">Zone</div><div>{di?.location}</div></div>
          <div><div className="text-xs text-slate-500">Inspecteur</div><div className="font-semibold">{insp?.fullName}</div></div>
        </div>

        {di?.checklistResults && (
          <div className="table-wrap mb-6">
            <table className="data">
              <thead><tr><th>Point</th><th>Exigence</th><th>Résultat</th><th>Commentaire</th></tr></thead>
              <tbody>
                {di.checklistResults.map((c,i) => <tr key={i}><td className="text-xs">{c.point}</td><td className="text-xs">{c.requirement}</td><td className="text-xs">{c.result==='C'?'Conforme':c.result==='NC'?'Non conforme':'N/A'}</td><td className="text-xs">{c.comment}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}

        <div className={`p-4 rounded-lg text-center font-bold mb-6 ${report.result==='conform'?'bg-green-50 text-green-800 border-2 border-green-300':report.result==='non_conform'?'bg-red-50 text-red-800 border-2 border-red-300':'bg-amber-50 text-amber-800 border-2 border-amber-300'}`}>
          RESULTAT: {RESULT_LABELS[report.result].toUpperCase()}
        </div>
        <div className="mb-6"><div className="text-xs text-slate-500 mb-1">Conclusion</div><div className="p-3 bg-slate-50 rounded text-sm">{report.conclusion}</div></div>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-200 text-center text-xs">
          <div><div className="border-b border-slate-400 h-16"></div><div className="mt-2 font-semibold">{cm?.fullName || 'Resp. Construction'}</div></div>
          <div><div className="border-b border-slate-400 h-16"></div><div className="mt-2 font-semibold">{insp?.fullName || 'Inspecteur QC'}</div></div>
          <div><div className="border-b border-slate-400 h-16"></div><div className="mt-2 font-semibold">Responsable QC</div></div>
        </div>
        {di && <button onClick={()=>generatePV(report,di,proj!,{phase:phaseById(di.phaseId),disc:disciplineById(di.disciplineId),qpItem:qpi,inspector:insp,requester:cm,qcManager:userById(proj?.qcManagerId),checklist:di.checklistResults})} className="btn-primary mt-6"><Download size={16}/> Télécharger PDF</button>}
      </div>
    </div>
  );
}
