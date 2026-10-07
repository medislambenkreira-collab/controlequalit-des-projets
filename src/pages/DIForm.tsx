import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Paperclip } from 'lucide-react';
import { useStore, fileToAttachment } from '../store';
import type { InspectionRequest } from '../types';

export function DIForm() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { state, dispatch, currentUser, visibleProjects, genId, genDINumber, log, notify, qpItemById } = useStore();

  const presetProject = sp.get('project') || visibleProjects[0]?.id || '';
  const presetQpItem = sp.get('qpItem');

  const [projectId, setProjectId] = useState(presetProject);
  const project = visibleProjects.find(p => p.id === projectId);
  const phases = useMemo(() => state.phases.filter(p => p.projectId === projectId).sort((a,b)=>a.order-b.order), [state.phases, projectId]);
  const qp = state.qualityPlans.find(q => q.projectId === projectId);
  const qpItems = useMemo(() => state.qualityPlanItems.filter(i => i.qualityPlanId === qp?.id), [state.qualityPlanItems, qp]);

  const [phaseId, setPhaseId] = useState('');
  const [disciplineId, setDisciplineId] = useState('');
  const [qpItemId, setQpItemId] = useState(presetQpItem || '');
  const [lot, setLot] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [controlLevel, setControlLevel] = useState('Normal');
  const [comments, setComments] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [itpReference, setItpReference] = useState('');

  // When QP item is selected (preset or changed), populate fields
  useEffect(() => {
    if (qpItemId) {
      const it = qpItemById(qpItemId);
      if (it) {
        setPhaseId(it.phaseId);
        setDisciplineId(it.disciplineId);
        setItpReference(it.itpReference || '');
        setDescription(prev => prev || `Inspection - ${it.activity}${it.subActivity?' / '+it.subActivity:''}`);
      }
    }
  }, [qpItemId]); // eslint-disable-line

  const filteredItems = qpItems.filter(i =>
    (!phaseId || i.phaseId === phaseId) && (!disciplineId || i.disciplineId === disciplineId)
  );

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files||[]);
    const atts = await Promise.all(files.map(fileToAttachment));
    setAttachments(prev => [...prev, ...atts]);
    e.target.value = '';
  };

  const save = (submit: boolean) => {
    if (!projectId || !qpItemId || !description || !location || !desiredDate) {
      alert('Veuillez remplir tous les champs obligatoires (projet, activité PCQ, description, zone, date souhaitée).');
      return;
    }
    const now = new Date().toISOString();
    const di: InspectionRequest = {
      id: genId(),
      number: genDINumber(),
      projectId, lot, phaseId, disciplineId, qualityPlanItemId: qpItemId, itpReference,
      description, location, requestDate: now, desiredDate,
      requestedById: currentUser!.id, controlLevel, comments, attachments,
      status: submit ? 'submitted' : 'draft',
      createdAt: now, updatedAt: now,
    };
    dispatch({ type: 'ADD_DI', di });
    log('inspection_request', di.id, submit ? 'SUBMITTED' : 'CREATED', di.number);
    if (submit) {
      // Notify QC manager
      const proj = state.projects.find(p => p.id === projectId);
      if (proj?.qcManagerId) notify(proj.qcManagerId, 'Nouvelle demande d\'inspection', `${di.number} - ${di.description}`, `/di/${di.id}`);
    }
    navigate(`/di/${di.id}`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/di" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary-600"><ArrowLeft size={14}/> Retour aux DI</Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle Demande d'Inspection</h1>
        <p className="text-sm text-slate-500">Remplissez ce formulaire pour soumettre une demande au service Qualité.</p>
      </div>

      <div className="card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Projet *</label>
            <select className="input" value={projectId} onChange={e=>setProjectId(e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lot / Secteur</label>
            <input className="input" value={lot} onChange={e=>setLot(e.target.value)} placeholder="Ex: Lot 03 - Area A"/>
          </div>
          <div>
            <label className="label">Phase</label>
            <select className="input" value={phaseId} onChange={e=>setPhaseId(e.target.value)}>
              <option value="">Toutes (filtrer)</option>
              {phases.map(p => <option key={p.id} value={p.id}>{p.order}. {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Corps d'état</label>
            <select className="input" value={disciplineId} onChange={e=>setDisciplineId(e.target.value)}>
              <option value="">Tous (filtrer)</option>
              {state.disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Activité PCQ * <span className="text-slate-400 text-xs">(référence obligatoire)</span></label>
            <select className="input" value={qpItemId} onChange={e=>setQpItemId(e.target.value)} required>
              <option value="">-- Sélectionner une activité du PCQ --</option>
              {filteredItems.map((it, i) => <option key={it.id} value={it.id}>{it.number}. [{it.controlPoint}] {it.activity} {it.subActivity? '('+it.subActivity+')':''}</option>)}
              {filteredItems.length===0 && <option value="" disabled>Aucune activité disponible pour ce filtre</option>}
            </select>
          </div>
          <div>
            <label className="label">Référence ITP</label>
            <input className="input font-mono" value={itpReference} onChange={e=>setItpReference(e.target.value)}/>
          </div>
          <div>
            <label className="label">Niveau de contrôle</label>
            <select className="input" value={controlLevel} onChange={e=>setControlLevel(e.target.value)}>
              <option>Normal</option>
              <option>Hold Point</option>
              <option>Witness Point</option>
              <option>Surveillance</option>
              <option>Revue documentaire</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description des travaux *</label>
            <textarea className="input" rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Décrivez précisément les travaux à inspecter..."/>
          </div>
          <div><label className="label">Zone / Localisation *</label><input className="input" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Ex: Area A - Rack R1 - Joint 42"/></div>
          <div><label className="label">Date souhaitée *</label><input type="date" className="input" value={desiredDate} onChange={e=>setDesiredDate(e.target.value)}/></div>
          <div className="md:col-span-2">
            <label className="label">Commentaires</label>
            <textarea className="input" rows={2} value={comments} onChange={e=>setComments(e.target.value)} placeholder="Références WPS/PQR, soudeur, matériel utilisé..."/>
          </div>
          <div className="md:col-span-2">
            <label className="label">Documents joints</label>
            <label className="btn-secondary cursor-pointer inline-flex"><Paperclip size={16}/> Ajouter des fichiers<input type="file" multiple className="hidden" onChange={handleFile}/></label>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((a,i) => <li key={i} className="text-xs flex items-center gap-2 text-slate-600"><Paperclip size={12}/> {a.name} <button onClick={()=>setAttachments(attachments.filter((_,j)=>j!==i))} className="text-red-500 hover:underline">×</button></li>)}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={() => save(false)}><Save size={16}/> Enregistrer en brouillon</button>
        <button className="btn-primary" onClick={() => save(true)}><Send size={16}/> Soumettre la demande</button>
      </div>
    </div>
  );
}
