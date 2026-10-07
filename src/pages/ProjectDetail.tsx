import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, ClipboardList, FileCheck, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { PROJECT_STATUS_LABELS, fmtDate, ROLE_LABELS } from '../utils/format';
import type { Phase } from '../types';

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, projectById, userById, genId, log, hasRole, notify } = useStore();
  const project = projectById(id);
  const [phaseModal, setPhaseModal] = useState(false);
  const [phaseForm, setPhaseForm] = useState<Partial<Phase>>({});
  const [editPhase, setEditPhase] = useState<Phase | null>(null);
  const [newDisc, setNewDisc] = useState('');

  if (!project) return <div className="card p-8 text-center">Projet introuvable. <Link to="/projects" className="text-primary-600 underline">Retour</Link></div>;

  const phases = state.phases.filter(p => p.projectId === project.id).sort((a,b) => a.order - b.order);
  const diCount = state.inspectionRequests.filter(d => d.projectId === project.id).length;
  const pvCount = state.inspectionReports.filter(r => r.projectId === project.id).length;
  const ncrCount = state.nonConformities.filter(n => n.projectId === project.id).length;

  const openAddPhase = () => { setEditPhase(null); setPhaseForm({ projectId: project.id, name: '', order: phases.length + 1 }); setPhaseModal(true); };
  const openEditPhase = (ph: Phase) => { setEditPhase(ph); setPhaseForm(ph); setPhaseModal(true); };
  const savePhase = () => {
    if (!phaseForm.name) return;
    if (editPhase) {
      dispatch({ type: 'UPDATE_PHASE', phase: { ...editPhase, ...phaseForm } as Phase });
      log('phase', editPhase.id, 'MODIFIED', phaseForm.name);
    } else {
      const ph: Phase = { id: genId(), projectId: project.id, name: phaseForm.name!, order: phaseForm.order || phases.length + 1 };
      dispatch({ type: 'ADD_PHASE', phase: ph });
      log('phase', ph.id, 'CREATED', ph.name);
    }
    setPhaseModal(false);
  };
  const deletePhase = (ph: Phase) => {
    if (!confirm(`Supprimer la phase "${ph.name}" ?`)) return;
    dispatch({ type: 'DELETE_PHASE', id: ph.id });
    log('phase', ph.id, 'DELETED', ph.name);
  };

  const addDiscipline = () => {
    if (!newDisc.trim()) return;
    dispatch({ type: 'ADD_DISCIPLINE', discipline: { id: genId(), name: newDisc.trim() } });
    log('discipline', 'global', 'CREATED', newDisc);
    setNewDisc('');
  };

  const canEdit = hasRole('admin');
  const cm = userById(project.constructionManagerId);
  const qm = userById(project.qcManagerId);
  const status = PROJECT_STATUS_LABELS[project.status];

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary-600"><ArrowLeft size={14}/> Retour aux projets</Link>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-primary-200 text-sm font-mono">{project.code}</div>
              <h1 className="text-2xl font-bold mt-1">{project.name}</h1>
              <div className="text-primary-100 mt-2">{project.description}</div>
            </div>
            <StatusBadge color={status.color.replace('text-','text-')} bg={status.bg} label={status.label}/>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div><div className="text-xs text-slate-500 uppercase">Client</div><div className="font-semibold text-slate-800">{project.client||'-'}</div></div>
          <div><div className="text-xs text-slate-500 uppercase">EPC</div><div className="font-semibold text-slate-800">{project.epc||'-'}</div></div>
          <div><div className="text-xs text-slate-500 uppercase">Site / Région</div><div className="font-semibold text-slate-800">{project.site} / {project.region||'-'}</div></div>
          <div><div className="text-xs text-slate-500 uppercase">Durée</div><div className="font-semibold text-slate-800">{fmtDate(project.startDate)} → {fmtDate(project.plannedEndDate)}</div></div>
          <div><div className="text-xs text-slate-500 uppercase">Resp. Construction</div><div className="font-semibold text-slate-800">{cm?.fullName||'-'} ({cm && ROLE_LABELS[cm.role]})</div></div>
          <div><div className="text-xs text-slate-500 uppercase">Resp. QC</div><div className="font-semibold text-slate-800">{qm?.fullName||'-'} ({qm && ROLE_LABELS[qm.role]})</div></div>
          <div className="col-span-2">
            <div className="text-xs text-slate-500 uppercase mb-1">Avancement : {project.progress}%</div>
            <div className="w-full bg-slate-200 rounded-full h-3"><div className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full" style={{width: `${project.progress}%`}}/></div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 grid grid-cols-3 gap-4">
          <Link to={`/pcq?project=${project.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition">
            <ClipboardList className="text-blue-600" size={24}/>
            <div><div className="font-semibold text-slate-900">{state.qualityPlans.filter(q=>q.projectId===project.id).length}</div><div className="text-xs text-slate-600">PCQ</div></div>
          </Link>
          <Link to={`/di?project=${project.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition">
            <FileCheck className="text-amber-600" size={24}/>
            <div><div className="font-semibold text-slate-900">{diCount}</div><div className="text-xs text-slate-600">Demandes d'inspection</div></div>
          </Link>
          <Link to={`/ncr?project=${project.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 hover:bg-red-100 transition">
            <AlertTriangle className="text-red-600" size={24}/>
            <div><div className="font-semibold text-slate-900">{ncrCount}</div><div className="text-xs text-slate-600">Écarts (NCR)</div></div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Phases du projet</h2>
            {canEdit && <button onClick={openAddPhase} className="btn-secondary"><Plus size={14}/> Ajouter une phase</button>}
          </div>
          <ol className="space-y-2">
            {phases.map(ph => (
              <li key={ph.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">{ph.order}</div>
                <div className="flex-1 font-medium text-slate-800">{ph.name}</div>
                {canEdit && <>
                  <button onClick={()=>openEditPhase(ph)} className="p-1.5 text-slate-500 hover:text-primary-600"><Pencil size={14}/></button>
                  <button onClick={()=>deletePhase(ph)} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={14}/></button>
                </>}
              </li>
            ))}
            {phases.length===0 && <p className="text-sm text-slate-500 text-center py-6">Aucune phase définie.</p>}
          </ol>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Corps d'état (référentiel)</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input className="input" placeholder="Nouveau corps d'état..." value={newDisc} onChange={e=>setNewDisc(e.target.value)}/>
            <button onClick={addDiscipline} className="btn-primary"><Plus size={16}/> Ajouter</button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
            {state.disciplines.map(d => <span key={d.id} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-sm">{d.name}</span>)}
          </div>
        </div>
      </div>

      <Modal open={phaseModal} onClose={()=>setPhaseModal(false)} title={editPhase? 'Modifier la phase' : 'Ajouter une phase'}
        footer={<><button className="btn-secondary" onClick={()=>setPhaseModal(false)}>Annuler</button><button className="btn-primary" onClick={savePhase}>Enregistrer</button></>}>
        <div className="space-y-3">
          <div><label className="label">Nom de la phase</label><input className="input" value={phaseForm.name||''} onChange={e=>setPhaseForm({...phaseForm,name:e.target.value})}/></div>
          <div><label className="label">Ordre</label><input type="number" className="input" value={phaseForm.order||0} onChange={e=>setPhaseForm({...phaseForm,order:Number(e.target.value)})}/></div>
        </div>
      </Modal>
    </div>
  );
}
