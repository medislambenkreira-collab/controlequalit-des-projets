import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, UserPlus, Calendar, CheckCircle2, XCircle, MessageSquare, FileText, AlertTriangle, Eye, Download, FileCheck } from 'lucide-react';
import { useStore } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { DI_STATUS_LABELS, RESULT_LABELS, fmtDate, fmtDateTime, NCR_STATUS_LABELS } from '../utils/format';
import { Modal } from '../components/Modal';
import type { InspectionRequest, InspectionReport, NonConformity, InspectionResult, ChecklistResult } from '../types';
import { generatePV } from '../utils/pdf';

function WorkflowStep({ label, done, current }: { label: string; done?: boolean; current?: boolean }) {
  return (
    <div className={`flex-1 text-center text-xs font-medium py-2 px-2 border-b-4 ${done ? 'border-green-500 text-green-700 bg-green-50' : current ? 'border-primary-500 text-primary-700 bg-primary-50' : 'border-slate-200 text-slate-400'}`}>
      {label}
    </div>
  );
}

export function DIDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, currentUser, userById, projectById, phaseById, disciplineById, qpItemById, genId, genPVNumber, genNCRNumber, log, notify } = useStore();

  const di = state.inspectionRequests.find(x => x.id === id);
  const project = projectById(di?.projectId);
  const phase = phaseById(di?.phaseId);
  const disc = disciplineById(di?.disciplineId);
  const qpItem = qpItemById(di?.qualityPlanItemId);
  const inspector = userById(di?.inspectorId);
  const requester = userById(di?.requestedById);
  const report = state.inspectionReports.find(r => r.id === di?.reportId);
  const ncrs = state.nonConformities.filter(n => n.inspectionRequestId === di?.id);

  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'accept'|'reject'|'info'|''>('');
  const [reviewComment, setReviewComment] = useState('');
  const [assignModal, setAssignModal] = useState(false);
  const [assignInspector, setAssignInspector] = useState(di?.inspectorId || '');
  const [assignDate, setAssignDate] = useState(di?.scheduledDate || '');
  const [assignTime, setAssignTime] = useState(di?.scheduledTime || '09:00');
  const [assignLoc, setAssignLoc] = useState(di?.scheduledLocation || di?.location || '');
  const [inspectionModal, setInspectionModal] = useState(false);
  const [result, setResult] = useState<InspectionResult>('conform');
  const [obs, setObs] = useState(di?.observations || '');
  const [conclusion, setConclusion] = useState('');
  const [checklist, setChecklist] = useState<ChecklistResult[]>([]);
  const [ncrModal, setNcrModal] = useState(false);
  const [ncrDesc, setNcrDesc] = useState('');
  const [ncrReq, setNcrReq] = useState('');
  const [ncrResp, setNcrResp] = useState('');
  const [ncrDue, setNcrDue] = useState('');

  const inspectors = state.users.filter(u => u.role === 'qc_inspector' && u.active && project?.memberIds.includes(u.id));

  if (!di || !project) return <div className="card p-8 text-center">Demande introuvable. <Link to="/di" className="text-primary-600 underline">Retour</Link></div>;

  const s = DI_STATUS_LABELS[di.status];

  // Build default checklist from PCQ item
  const defaultChecklist = useMemo<ChecklistResult[]>(() => {
    if (checklist.length > 0) return checklist;
    const base: ChecklistResult[] = [
      { point: 'Vérification documents de référence (PCQ, ITP, procédure)', requirement: 'Documents approuvés et à disposition', result: 'C' },
      { point: 'Identification du matériel / zone', requirement: 'Conforme aux plans / spécifications', result: 'C' },
      { point: `Contrôle selon activité : ${qpItem?.activity || 'inspection'}`, requirement: qpItem?.acceptanceCriteria || 'Conforme aux critères d\'acceptation', result: 'C' },
      { point: 'Qualité d\'exécution', requirement: 'Conforme aux procédures et bonnes pratiques', result: 'C' },
      { point: 'Traçabilité (matériaux, soudeurs, etc.)', requirement: 'Documents et certificats disponibles', result: 'C' },
    ];
    return base;
  }, [qpItem, checklist.length]); // eslint-disable-line

  const openInspection = () => {
    if (checklist.length === 0) setChecklist(defaultChecklist);
    setResult(di.result || 'conform');
    setObs(di.observations || '');
    setConclusion(di.resultComment || '');
    setInspectionModal(true);
  };

  const submitReview = () => {
    const newStatus = reviewAction === 'accept' ? 'accepted' : reviewAction === 'reject' ? 'rejected' : 'info_requested';
    const updated: InspectionRequest = { ...di, status: newStatus as InspectionRequest['status'], reviewComment, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_DI', di: updated });
    log('inspection_request', di.id, 'REVIEWED', `${newStatus} - ${reviewComment}`);
    notify(di.requestedById, `DI ${di.number} - ${DI_STATUS_LABELS[newStatus].label}`, reviewComment || `Votre demande a été ${DI_STATUS_LABELS[newStatus].label.toLowerCase()}`, `/di/${di.id}`);
    setReviewModal(false); setReviewAction(''); setReviewComment('');
  };

  const submitAssign = () => {
    if (!assignInspector || !assignDate) { alert('Inspecteur et date sont obligatoires'); return; }
    const updated: InspectionRequest = { ...di, status: 'planned', inspectorId: assignInspector, scheduledDate: assignDate, scheduledTime: assignTime, scheduledLocation: assignLoc, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_DI', di: updated });
    log('inspection_request', di.id, 'ASSIGNED', `Inspecteur: ${userById(assignInspector)?.fullName}, ${assignDate} ${assignTime}`);
    notify(assignInspector, 'Inspection planifiée', `La DI ${di.number} vous est affectée le ${fmtDate(assignDate)} à ${assignTime}`, `/di/${di.id}`);
    notify(di.requestedById, `DI ${di.number} planifiée`, `Inspection programmée le ${fmtDate(assignDate)} à ${assignTime}`, `/di/${di.id}`);
    setAssignModal(false);
  };

  const startInspection = () => {
    const updated: InspectionRequest = { ...di, status: 'in_progress', updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_DI', di: updated });
    log('inspection_request', di.id, 'STARTED', 'Inspection en cours');
    openInspection();
  };

  const saveInspectionResult = (generateReport: boolean) => {
    const now = new Date().toISOString();
    const updated: InspectionRequest = { ...di, status: generateReport ? 'reported' : 'in_progress', result, observations: obs, resultComment: conclusion, checklistResults: checklist, updatedAt: now };
    dispatch({ type: 'UPDATE_DI', di: updated });
    log('inspection_request', di.id, 'RESULT', RESULT_LABELS[result]);

    if (generateReport) {
      // Auto-generate PV
      const pv: InspectionReport = {
        id: genId(), number: genPVNumber(), inspectionRequestId: di.id, projectId: di.projectId,
        date: now, inspectorId: di.inspectorId!, constructionManagerId: di.requestedById,
        qcManagerId: project.qcManagerId, result, conclusion: conclusion || RESULT_LABELS[result],
        signatures: [
          { role: 'Inspecteur QC', name: inspector?.fullName || '', signedAt: now },
        ],
        createdAt: now,
      };
      dispatch({ type: 'ADD_REPORT', report: pv });
      const finalDI: InspectionRequest = { ...updated, reportId: pv.id };
      dispatch({ type: 'UPDATE_DI', di: finalDI });
      log('inspection_report', pv.id, 'GENERATED', pv.number);
      notify(project.qcManagerId, 'PV généré', `Le ${pv.number} a été généré pour la ${di.number}`, `/reports/${pv.id}`);
      notify(di.requestedById, 'PV disponible', `Le ${pv.number} est disponible pour la ${di.number}`, `/reports/${pv.id}`);
    }
    setInspectionModal(false);
  };

  const updateCheck = (i: number, field: keyof ChecklistResult, value: string) => {
    setChecklist(prev => prev.map((c,idx) => idx===i ? { ...c, [field]: value } : c));
  };

  const createNCR = () => {
    if (!ncrDesc || !ncrDue) { alert('Description et délai sont obligatoires'); return; }
    const now = new Date().toISOString();
    const ncr: NonConformity = {
      id: genId(), number: genNCRNumber(), projectId: di.projectId, reportId: di.reportId!, inspectionRequestId: di.id,
      phaseId: di.phaseId, disciplineId: di.disciplineId, description: ncrDesc, requirement: ncrReq || (qpItem?.acceptanceCriteria || ''),
      reference: report?.number, date: now, responsibleId: ncrResp || di.requestedById, dueDate: ncrDue,
      evidence: [], status: 'open', createdAt: now,
    };
    dispatch({ type: 'ADD_NCR', ncr });
    log('non_conformity', ncr.id, 'CREATED', ncr.number + ': ' + ncrDesc);
    notify(ncr.responsibleId!, 'Écart à traiter', `${ncr.number} - ${ncrDesc}`, `/ncr/${ncr.id}`);
    notify(project.qcManagerId, 'Nouvelle non-conformité', `${ncr.number} ouverte sur ${di.number}`, `/ncr/${ncr.id}`);
    setNcrModal(false);
    setNcrDesc(''); setNcrReq(''); setNcrResp(''); setNcrDue('');
  };

  const downloadPV = () => {
    if (report) generatePV(report, di, project, { phase, disc, qpItem, inspector, requester, qcManager: userById(project.qcManagerId), checklist });
  };

  // Workflow steps
  const stepIndex = ['submitted','under_review','accepted','planned','in_progress','reported'].indexOf(di.status);
  const isQC = currentUser?.role === 'qc_manager' || currentUser?.role === 'admin';
  const isInspector = currentUser?.id === di.inspectorId || currentUser?.role === 'admin' || currentUser?.role === 'qc_manager';
  const isRequester = currentUser?.id === di.requestedById;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link to="/di" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary-600"><ArrowLeft size={14}/> Retour aux DI</Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{di.number}</h1>
            <StatusBadge color={s.color} bg={s.bg} label={s.label}/>
          </div>
          <div className="text-sm text-slate-500 mt-1">{project.code} - {project.name}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(di.status==='submitted' && isQC) && <button onClick={()=>{setReviewAction('accept');setReviewModal(true);}} className="btn-success"><CheckCircle2 size={16}/> Accepter</button>}
          {(di.status==='submitted' && isQC) && <button onClick={()=>{setReviewAction('info');setReviewModal(true);}} className="btn-secondary"><MessageSquare size={16}/> Demander infos</button>}
          {(di.status==='submitted' && isQC) && <button onClick={()=>{setReviewAction('reject');setReviewModal(true);}} className="btn-danger"><XCircle size={16}/> Rejeter</button>}
          {(di.status==='accepted' && isQC) && <button onClick={()=>{setAssignModal(true);setAssignInspector(di.inspectorId||'');setAssignDate(di.scheduledDate||'');setAssignTime(di.scheduledTime||'09:00');setAssignLoc(di.scheduledLocation||di.location);}} className="btn-primary"><UserPlus size={16}/> Affecter un inspecteur</button>}
          {(di.status==='planned' && isInspector && (currentUser?.id===di.inspectorId || isQC)) && <button onClick={startInspection} className="btn-primary"><FileCheck size={16}/> Démarrer l'inspection</button>}
          {(di.status==='in_progress' && isInspector) && <button onClick={openInspection} className="btn-primary"><FileCheck size={16}/> Saisir les résultats</button>}
          {(di.status==='reported' && isQC && result !== 'conform') && <button onClick={()=>setNcrModal(true)} className="btn-danger"><AlertTriangle size={16}/> Créer un écart (NCR)</button>}
          {report && <button onClick={downloadPV} className="btn-secondary"><Download size={16}/> Télécharger PV</button>}
          {report && <Link to={`/reports/${report.id}`} className="btn-secondary"><Eye size={16}/> Consulter PV</Link>}
        </div>
      </div>

      {/* Workflow bar */}
      <div className="card p-2 hidden md:flex">
        <WorkflowStep label="Soumission" done={['submitted','under_review','accepted','planned','in_progress','reported'].includes(di.status)} current={di.status==='submitted'}/>
        <WorkflowStep label="Revue QC" done={['accepted','planned','in_progress','reported'].includes(di.status) || di.status==='rejected'} current={di.status==='under_review'}/>
        <WorkflowStep label="Acceptation" done={['planned','in_progress','reported'].includes(di.status)} current={di.status==='accepted'}/>
        <WorkflowStep label="Planification" done={['in_progress','reported'].includes(di.status)} current={di.status==='planned'}/>
        <WorkflowStep label="Inspection" done={['reported'].includes(di.status)} current={di.status==='in_progress'}/>
        <WorkflowStep label="PV / Clôture" done={di.status==='reported' || di.status==='closed'} current={di.status==='reported'}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Informations de la demande</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><div className="text-xs text-slate-500 uppercase">Lot</div><div className="font-medium text-slate-800">{di.lot || '-'}</div></div>
              <div><div className="text-xs text-slate-500 uppercase">Niveau de contrôle</div><div className="font-medium text-slate-800">{di.controlLevel}</div></div>
              <div><div className="text-xs text-slate-500 uppercase">Phase</div><div className="font-medium text-slate-800">{phase?.name}</div></div>
              <div><div className="text-xs text-slate-500 uppercase">Corps d'état</div><div className="font-medium text-slate-800">{disc?.name}</div></div>
              <div className="md:col-span-2"><div className="text-xs text-slate-500 uppercase">Description</div><div className="text-slate-800">{di.description}</div></div>
              <div><div className="text-xs text-slate-500 uppercase">Zone / Localisation</div><div className="font-medium text-slate-800">{di.location}</div></div>
              <div><div className="text-xs text-slate-500 uppercase">Date souhaitée</div><div className="font-medium text-slate-800">{fmtDate(di.desiredDate)}</div></div>
              {qpItem && <>
                <div><div className="text-xs text-slate-500 uppercase">Référence PCQ</div><div className="font-mono text-slate-800">Ligne {qpItem.number} - Point {qpItem.controlPoint}</div></div>
                <div><div className="text-xs text-slate-500 uppercase">ITP / Procédure</div><div className="font-mono text-slate-800">{di.itpReference || qpItem.itpReference} / {qpItem.procedure}</div></div>
                <div className="md:col-span-2"><div className="text-xs text-slate-500 uppercase">Critère d'acceptation</div><div className="text-slate-700 text-xs bg-slate-50 p-2 rounded">{qpItem.acceptanceCriteria}</div></div>
              </>}
              {di.scheduledDate && <>
                <div><div className="text-xs text-slate-500 uppercase">Date planifiée</div><div className="font-semibold text-primary-700">{fmtDate(di.scheduledDate)} {di.scheduledTime}</div></div>
                <div><div className="text-xs text-slate-500 uppercase">Lieu inspection</div><div className="font-medium">{di.scheduledLocation}</div></div>
                <div><div className="text-xs text-slate-500 uppercase">Inspecteur</div><div className="font-medium">{inspector?.fullName || '-'}</div></div>
              </>}
              {di.comments && <div className="md:col-span-2"><div className="text-xs text-slate-500 uppercase">Commentaires du demandeur</div><div className="text-slate-700 text-xs bg-slate-50 p-2 rounded italic">{di.comments}</div></div>}
              {di.reviewComment && <div className="md:col-span-2"><div className="text-xs text-slate-500 uppercase">Commentaire de revue QC</div><div className="text-amber-700 text-xs bg-amber-50 border border-amber-200 p-2 rounded">{di.reviewComment}</div></div>}
            </div>
          </div>

          {di.checklistResults && di.checklistResults.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Résultats du contrôle</h3>
              <div className="table-wrap">
                <table className="data">
                  <thead><tr><th>Point contrôlé</th><th>Exigence</th><th>Résultat</th><th>Commentaire</th></tr></thead>
                  <tbody>
                    {di.checklistResults.map((c,i) => (
                      <tr key={i}>
                        <td className="text-xs">{c.point}</td>
                        <td className="text-xs">{c.requirement}</td>
                        <td><span className={`status-badge ${c.result==='C'?'bg-green-100 text-green-700':c.result==='NC'?'bg-red-100 text-red-700':'bg-slate-100 text-slate-600'}`}>{c.result==='C'?'Conforme':c.result==='NC'?'Non conforme':'N/A'}</span></td>
                        <td className="text-xs">{c.comment || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {di.observations && <div className="mt-4 p-3 bg-slate-50 rounded text-sm"><strong>Observations :</strong> {di.observations}</div>}
              {di.result && <div className="mt-2 p-3 rounded text-sm font-semibold text-center" style={{background: di.result==='conform'?'#d1fae5':di.result==='non_conform'?'#fee2e2':'#fef3c7', color: di.result==='conform'?'#065f46':di.result==='non_conform'?'#991b1b':'#92400e'}}>
                RÉSULTAT : {RESULT_LABELS[di.result].toUpperCase()}
              </div>}
            </div>
          )}

          {report && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileText size={18}/> PV de Contrôle <span className="font-mono text-primary-700">{report.number}</span></h3>
                <button onClick={downloadPV} className="btn-secondary text-xs"><Download size={14}/> PDF</button>
              </div>
              <div className="text-sm text-slate-600"><strong>Conclusion :</strong> {report.conclusion}</div>
              <div className="text-xs text-slate-500 mt-2">Émis le {fmtDateTime(report.date)} par {inspector?.fullName}</div>
            </div>
          )}

          {ncrs.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-red-600"/> Écarts associés ({ncrs.length})</h3>
              <div className="space-y-2">
                {ncrs.map(n => {
                  const ns = NCR_STATUS_LABELS[n.status];
                  const resp = userById(n.responsibleId);
                  return (
                    <Link to={`/ncr/${n.id}`} key={n.id} className="block p-3 border border-slate-200 rounded-lg hover:bg-red-50">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-red-700">{n.number}</span>
                        <StatusBadge color={ns.color} bg={ns.bg} label={ns.label}/>
                      </div>
                      <div className="text-sm text-slate-800 mt-1">{n.description}</div>
                      <div className="text-xs text-slate-500 mt-1">Resp: {resp?.fullName||'-'} • Échéance: {fmtDate(n.dueDate)}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Intervenants</h3>
            <div className="space-y-3 text-sm">
              <div><div className="text-xs text-slate-500 uppercase">Demandeur</div><div className="font-medium">{requester?.fullName}</div><div className="text-xs text-slate-500">{requester?.email}</div></div>
              <div><div className="text-xs text-slate-500 uppercase">Inspecteur QC</div><div className="font-medium">{inspector?.fullName || 'Non affecté'}</div>{inspector && <div className="text-xs text-slate-500">{inspector.email}</div>}</div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Traçabilité</h3>
            <div className="space-y-2 text-xs">
              {state.auditLogs.filter(l => l.entityId === di.id || l.entityId === report?.id || ncrs.some(n => n.id === l.entityId)).slice(0,10).map(l => {
                const u = userById(l.userId);
                return <div key={l.id} className="flex gap-2"><span className="text-slate-400">{fmtDate(l.timestamp)}</span><span><strong>{u?.fullName}</strong> {l.action.toLowerCase()}</span></div>;
              })}
              <div className="flex gap-2"><span className="text-slate-400">{fmtDate(di.createdAt)}</span><span>Création de la demande</span></div>
            </div>
          </div>

          {di.attachments && di.attachments.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Documents joints à la demande</h3>
              <ul className="space-y-2 text-sm">
                {di.attachments.map(a => (
                  <li key={a.id} className="flex items-center gap-2 p-2 border border-slate-200 rounded text-xs">
                    <FileText size={14}/> {a.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Modal open={reviewModal} onClose={()=>setReviewModal(false)} title={reviewAction==='accept'?'Accepter la demande':reviewAction==='reject'?'Rejeter la demande':'Demande d\'informations complémentaires'}
        footer={<><button className="btn-secondary" onClick={()=>setReviewModal(false)}>Annuler</button><button className={reviewAction==='reject'?'btn-danger':reviewAction==='accept'?'btn-success':'btn-primary'} onClick={submitReview}>Confirmer</button></>}>
        <div className="space-y-3">
          <label className="label">Commentaire (sera envoyé au demandeur)</label>
          <textarea className="input" rows={4} value={reviewComment} onChange={e=>setReviewComment(e.target.value)} placeholder="Expliquez votre décision..."/>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal open={assignModal} onClose={()=>setAssignModal(false)} title="Affecter l'inspection"
        footer={<><button className="btn-secondary" onClick={()=>setAssignModal(false)}>Annuler</button><button className="btn-primary" onClick={submitAssign}><Calendar size={16}/> Planifier</button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><label className="label">Inspecteur</label><select className="input" value={assignInspector} onChange={e=>setAssignInspector(e.target.value)}>
            <option value="">-- Sélectionner --</option>
            {(inspectors.length?inspectors:state.users.filter(u=>u.role==='qc_inspector'&&u.active)).map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select></div>
          <div><label className="label">Date</label><input type="date" className="input" value={assignDate} onChange={e=>setAssignDate(e.target.value)}/></div>
          <div><label className="label">Heure</label><input type="time" className="input" value={assignTime} onChange={e=>setAssignTime(e.target.value)}/></div>
          <div className="md:col-span-2"><label className="label">Lieu de rendez-vous</label><input className="input" value={assignLoc} onChange={e=>setAssignLoc(e.target.value)}/></div>
        </div>
      </Modal>

      {/* Inspection Modal */}
      <Modal open={inspectionModal} onClose={()=>setInspectionModal(false)} title="Réaliser l'inspection" size="xl"
        footer={<><button className="btn-secondary" onClick={()=>setInspectionModal(false)}>Fermer</button>
          <button className="btn-secondary" onClick={()=>saveInspectionResult(false)}>Enregistrer brouillon</button>
          <button className="btn-primary" onClick={()=>saveInspectionResult(true)}><FileText size={16}/> Valider & générer PV</button></>}>
        <div className="space-y-4">
          <div>
            <label className="label">Résultat de l'inspection</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(['conform','conform_with_obs','non_conform','postponed','cancelled'] as InspectionResult[]).map(r => (
                <button key={r} onClick={()=>setResult(r)} className={`p-3 rounded-md border text-sm font-medium ${result===r ? (r==='conform'?'bg-green-100 border-green-500 text-green-800':r==='non_conform'?'bg-red-100 border-red-500 text-red-800':r==='conform_with_obs'?'bg-amber-100 border-amber-500 text-amber-800':'bg-slate-100 border-slate-400') : 'border-slate-200 hover:bg-slate-50'}`}>
                  {RESULT_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Check-list de contrôle</label>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Point</th><th>Exigence</th><th className="w-32">Résultat</th><th>Commentaire</th></tr></thead>
                <tbody>
                  {checklist.map((c, i) => (
                    <tr key={i}>
                      <td className="text-xs">{c.point}</td>
                      <td className="text-xs">{c.requirement}</td>
                      <td>
                        <select className="input text-xs py-1" value={c.result} onChange={e=>updateCheck(i,'result',e.target.value)}>
                          <option value="C">Conforme</option><option value="NC">Non conforme</option><option value="NA">N/A</option>
                        </select>
                      </td>
                      <td><input className="input text-xs py-1" value={c.comment||''} onChange={e=>updateCheck(i,'comment',e.target.value)}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn-ghost text-xs mt-2" onClick={()=>setChecklist([...checklist, {point:'',requirement:'',result:'C'}])}>+ Ajouter un point</button>
          </div>
          <div><label className="label">Observations</label><textarea className="input" rows={3} value={obs} onChange={e=>setObs(e.target.value)}/></div>
          <div><label className="label">Conclusion / commentaire</label><textarea className="input" rows={2} value={conclusion} onChange={e=>setConclusion(e.target.value)} placeholder="Commentaire global..."/></div>
        </div>
      </Modal>

      {/* NCR Modal */}
      <Modal open={ncrModal} onClose={()=>setNcrModal(false)} title="Déclarer un écart (NCR)" size="lg"
        footer={<><button className="btn-secondary" onClick={()=>setNcrModal(false)}>Annuler</button><button className="btn-danger" onClick={createNCR}><AlertTriangle size={16}/> Créer la NCR</button></>}>
        <div className="space-y-3">
          <div><label className="label">Description de l'écart *</label><textarea className="input" rows={3} value={ncrDesc} onChange={e=>setNcrDesc(e.target.value)} placeholder="Décrivez précisément la non-conformité..."/></div>
          <div><label className="label">Exigence non respectée</label><input className="input" value={ncrReq} onChange={e=>setNcrReq(e.target.value)} placeholder="Ex: Compacité ≥ 95% OPM"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Responsable de l'action corrective</label>
              <select className="input" value={ncrResp} onChange={e=>setNcrResp(e.target.value)}>
                <option value="">-- Sélectionner --</option>
                {state.users.filter(u=>u.active).map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
            <div><label className="label">Délai de clôture *</label><input type="date" className="input" value={ncrDue} onChange={e=>setNcrDue(e.target.value)}/></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
