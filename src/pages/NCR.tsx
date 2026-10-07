import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, AlertTriangle, Upload, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useStore, fileToAttachment } from '../store';
import { Modal } from '../components/Modal';
import { NCR_STATUS_LABELS, fmtDate, isOverdue } from '../utils/format';

export function NCRList() {
  const { state, visibleProjects, projectById, userById, phaseById, disciplineById } = useStore();
  const [sp] = useSearchParams();
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState(sp.get('project')||'');
  const [statusFilter, setStatusFilter] = useState('');

  const ncrs = state.nonConformities.filter(n => visibleProjects.some(p=>p.id===n.projectId));
  const filtered = ncrs.filter(n =>
    (!search || n.number.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase())) &&
    (!projectFilter || n.projectId === projectFilter) &&
    (!statusFilter || n.status === statusFilter)
  ).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Écarts / Non-Conformités (NCR)</h1>
        <p className="text-sm text-slate-500">{filtered.length} écart(s)</p>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="input pl-9" placeholder="Rechercher NCR, description..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(NCR_STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input" value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}>
          <option value="">Tous les projets</option>
          {visibleProjects.map(p=><option key={p.id} value={p.id}>{p.code}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(n => {
          const s = NCR_STATUS_LABELS[n.status];
          const resp = userById(n.responsibleId);
          const overdue = n.status !== 'closed' && isOverdue(n.dueDate);
          return (
            <Link to={`/ncr/${n.id}`} key={n.id} className="card p-4 hover:shadow-md transition-shadow block">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-red-700">{n.number}</span>
                    <span className={`status-badge ${s.bg} ${s.color}`}>{s.label}</span>
                    {overdue && <span className="status-badge bg-red-500 text-white"><Clock size={10}/> EN RETARD</span>}
                  </div>
                  <div className="text-sm font-medium text-slate-900">{n.description}</div>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                    <span>{projectById(n.projectId)?.code}</span>
                    <span>{phaseById(n.phaseId)?.name} / {disciplineById(n.disciplineId)?.name}</span>
                    <span>Resp: {resp?.fullName||'-'}</span>
                    <span>Échéance: {fmtDate(n.dueDate)}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length===0 && <div className="card p-10 text-center text-slate-500">Aucun écart enregistré.</div>}
      </div>
    </div>
  );
}

export function NCRDetail() {
  const params = window.location.pathname.split('/');
  const id = params[params.length-1];
  const { state, dispatch, currentUser, projectById, userById, phaseById, disciplineById, log, notify, genId } = useStore();
  const ncr = state.nonConformities.find(n => n.id === id);
  const report = state.inspectionReports.find(r => r.id === ncr?.reportId);
  const di = state.inspectionRequests.find(d => d.id === ncr?.inspectionRequestId);
  const [actionModal, setActionModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);
  const [cause, setCause] = useState(ncr?.cause||'');
  const [corrAction, setCorrAction] = useState(ncr?.correctiveAction||'');
  const [responsible, setResponsible] = useState(ncr?.responsibleId||'');
  const [dueDate, setDueDate] = useState(ncr?.dueDate.slice(0,10)||'');
  const [verifyResult, setVerifyResult] = useState<'accept'|'reject'|'info'>('accept');
  const [verifyComment, setVerifyComment] = useState('');

  if (!ncr) return <div className="card p-8 text-center">Écart introuvable.</div>;
  const proj = projectById(ncr.projectId);
  const s = NCR_STATUS_LABELS[ncr.status];
  const resp = userById(ncr.responsibleId);
  const verifier = userById(ncr.verifierId);
  const isQC = currentUser?.role === 'qc_manager' || currentUser?.role === 'admin';
  const isResponsible = currentUser?.id === ncr.responsibleId;

  const saveAction = () => {
    if (!corrAction || !responsible || !dueDate) { alert('Action corrective, responsable et délai sont obligatoires'); return; }
    dispatch({ type: 'UPDATE_NCR', ncr: { ...ncr, cause, correctiveAction: corrAction, responsibleId: responsible, dueDate, status: 'action_in_progress' } });
    log('non_conformity', ncr.id, 'UPDATED', 'Action corrective définie');
    notify(responsible, 'Action corrective assignée', `${ncr.number} - vous êtes responsable de l'action corrective`, `/ncr/${ncr.id}`);
    setActionModal(false);
  };

  const uploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files||[]);
    const atts = await Promise.all(files.map(fileToAttachment));
    dispatch({ type: 'UPDATE_NCR', ncr: { ...ncr, evidence: [...(ncr.evidence||[]), ...atts], status: 'evidence_submitted' } });
    log('non_conformity', ncr.id, 'EVIDENCE_ADDED', `${atts.length} preuve(s) ajoutée(s)`);
    notify(proj?.qcManagerId || '', 'Preuve disponible', `${ncr.number} - preuve soumise pour vérification`, `/ncr/${ncr.id}`);
    e.target.value = '';
  };

  const submitVerify = () => {
    const newStatus = verifyResult === 'accept' ? 'closed' : verifyResult === 'reject' ? 'rejected' : 'open';
    dispatch({ type: 'UPDATE_NCR', ncr: { ...ncr, status: newStatus as any, verifierId: currentUser?.id, verificationComment: verifyComment, closedAt: verifyResult==='accept'?new Date().toISOString():undefined } });
    log('non_conformity', ncr.id, 'VERIFIED', `${newStatus}: ${verifyComment}`);
    if (ncr.responsibleId) notify(ncr.responsibleId, `NCR ${ncr.number} - ${NCR_STATUS_LABELS[newStatus].label}`, verifyComment||'Verifiée', `/ncr/${ncr.id}`);
    setVerifyModal(false); setVerifyComment('');
  };

  const requestVerify = () => {
    dispatch({ type: 'UPDATE_NCR', ncr: { ...ncr, status: 'under_verification' } });
    log('non_conformity', ncr.id, 'SUBMITTED', 'Demande de vérification');
    notify(proj?.qcManagerId || '', 'Vérification requise', `${ncr.number} en attente de vérification`, `/ncr/${ncr.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to="/ncr" className="text-sm text-slate-600 hover:text-primary-600">← Retour aux NCR</Link>
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-red-700 font-mono">{ncr.number}</h1><span className={`status-badge ${s.bg} ${s.color}`}>{s.label}</span></div>
            <div className="text-sm text-slate-500 mt-1">{proj?.code} - {proj?.name}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(ncr.status==='open' && (isResponsible || isQC)) && <button className="btn-primary" onClick={()=>{setCause(ncr.cause||'');setCorrAction(ncr.correctiveAction||'');setResponsible(ncr.responsibleId||'');setDueDate(ncr.dueDate.slice(0,10));setActionModal(true);}}>Définir l'action corrective</button>}
            {(ncr.status==='action_in_progress' && isResponsible) && <label className="btn-success cursor-pointer"><Upload size={16}/> Soumettre preuve<input type="file" multiple className="hidden" onChange={uploadEvidence}/></label>}
            {(ncr.status==='evidence_submitted' && isResponsible) && <button className="btn-primary" onClick={requestVerify}>Demander vérification QC</button>}
            {(ncr.status==='under_verification' && isQC) && <button className="btn-primary" onClick={()=>setVerifyModal(true)}><CheckCircle2 size={16}/> Vérifier la preuve</button>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><div className="text-xs text-slate-500 uppercase">Phase / Corps d'état</div><div>{phaseById(ncr.phaseId)?.name} / {disciplineById(ncr.disciplineId)?.name}</div></div>
          <div><div className="text-xs text-slate-500 uppercase">PV associé / DI</div><div className="font-mono">{report?.number} / {di?.number}</div></div>
          <div className="md:col-span-2"><div className="text-xs text-slate-500 uppercase">Description de l'écart</div><div className="bg-red-50 p-3 rounded border border-red-200">{ncr.description}</div></div>
          <div className="md:col-span-2"><div className="text-xs text-slate-500 uppercase">Exigence non respectée</div><div className="p-3 bg-slate-50 rounded">{ncr.requirement}</div></div>
          <div><div className="text-xs text-slate-500 uppercase">Responsable</div><div className="font-medium">{resp?.fullName}</div></div>
          <div><div className="text-xs text-slate-500 uppercase">Échéance</div><div className={`font-medium ${isOverdue(ncr.dueDate) && ncr.status!=='closed' ? 'text-red-600' : ''}`}>{fmtDate(ncr.dueDate)} {isOverdue(ncr.dueDate) && ncr.status!=='closed' && <span className="ml-1">(en retard)</span>}</div></div>
          {ncr.cause && <div className="md:col-span-2"><div className="text-xs text-slate-500 uppercase">Cause</div><div>{ncr.cause}</div></div>}
          {ncr.correctiveAction && <div className="md:col-span-2"><div className="text-xs text-slate-500 uppercase">Action corrective</div><div className="bg-blue-50 p-3 rounded border border-blue-200">{ncr.correctiveAction}</div></div>}
          {ncr.verificationComment && <div className="md:col-span-2"><div className="text-xs text-slate-500 uppercase">Commentaire de vérification ({verifier?.fullName})</div><div>{ncr.verificationComment}</div></div>}
          {ncr.closedAt && <div className="md:col-span-2"><div className="text-xs text-slate-500 uppercase">Clôturé le</div><div className="text-green-700 font-semibold">{fmtDate(ncr.closedAt)}</div></div>}
        </div>
      </div>

      {ncr.evidence && ncr.evidence.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Preuves de clôture ({ncr.evidence.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ncr.evidence.map(a => (
              <div key={a.id} className="border border-slate-200 rounded p-2 text-xs flex items-center gap-2">
                {a.type?.startsWith('image') && a.dataUrl ? <img src={a.dataUrl} className="w-10 h-10 object-cover rounded" alt=""/> : <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">📎</div>}
                <div className="flex-1 truncate">{a.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={actionModal} onClose={()=>setActionModal(false)} title="Définir l'action corrective"
        footer={<><button className="btn-secondary" onClick={()=>setActionModal(false)}>Annuler</button><button className="btn-primary" onClick={saveAction}>Enregistrer</button></>}>
        <div className="space-y-3">
          <div><label className="label">Cause de l'écart</label><textarea className="input" rows={2} value={cause} onChange={e=>setCause(e.target.value)}/></div>
          <div><label className="label">Action corrective *</label><textarea className="input" rows={3} value={corrAction} onChange={e=>setCorrAction(e.target.value)} placeholder="Description détaillée de l'action..."/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Responsable *</label><select className="input" value={responsible} onChange={e=>setResponsible(e.target.value)}><option value="">--</option>{state.users.filter(u=>u.active).map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select></div>
            <div><label className="label">Délai *</label><input type="date" className="input" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></div>
          </div>
        </div>
      </Modal>

      <Modal open={verifyModal} onClose={()=>setVerifyModal(false)} title="Vérification QC"
        footer={<><button className="btn-secondary" onClick={()=>setVerifyModal(false)}>Annuler</button><button className={verifyResult==='accept'?'btn-success':verifyResult==='reject'?'btn-danger':'btn-primary'} onClick={submitVerify}>Valider</button></>}>
        <div className="space-y-3">
          <div>
            <label className="label">Décision</label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={()=>setVerifyResult('accept')} className={`p-3 rounded border ${verifyResult==='accept'?'bg-green-100 border-green-500 text-green-800 font-semibold':'border-slate-200'}`}><CheckCircle2 size={16} className="inline mr-1"/>Acceptée (clôturer)</button>
              <button onClick={()=>setVerifyResult('reject')} className={`p-3 rounded border ${verifyResult==='reject'?'bg-red-100 border-red-500 text-red-800 font-semibold':'border-slate-200'}`}><XCircle size={16} className="inline mr-1"/>Refusée</button>
              <button onClick={()=>setVerifyResult('info')} className={`p-3 rounded border ${verifyResult==='info'?'bg-amber-100 border-amber-500 text-amber-800 font-semibold':'border-slate-200'}`}><Clock size={16} className="inline mr-1"/>Complément</button>
            </div>
          </div>
          <div><label className="label">Commentaire</label><textarea className="input" rows={3} value={verifyComment} onChange={e=>setVerifyComment(e.target.value)}/></div>
        </div>
      </Modal>
    </div>
  );
}
