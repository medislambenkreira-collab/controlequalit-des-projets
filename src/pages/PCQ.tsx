import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Copy, Download, Upload, Search, Filter, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useStore } from '../store';
import { Modal } from '../components/Modal';
import { CP_LABELS, fmtDate } from '../utils/format';
import type { QualityPlanItem, ControlPointType } from '../types';

export function PCQ() {
  const { state, dispatch, visibleProjects, genId, log, hasRole, projectById, phaseById, disciplineById, currentUser } = useStore();
  const [sp, setSp] = useSearchParams();
  const initialProject = sp.get('project') || visibleProjects[0]?.id || '';
  const [projectId, setProjectId] = useState(initialProject);
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [discFilter, setDiscFilter] = useState('');
  const [cpFilter, setCpFilter] = useState('');
  const [editing, setEditing] = useState<QualityPlanItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const project = projectById(projectId);
  const phases = useMemo(() => state.phases.filter(p => p.projectId === projectId).sort((a,b)=>a.order-b.order), [state.phases, projectId]);
  const qp = state.qualityPlans.find(q => q.projectId === projectId);
  const items = useMemo(() => state.qualityPlanItems.filter(i => i.qualityPlanId === qp?.id), [state.qualityPlanItems, qp]);

  const filtered = useMemo(() => items.filter(i =>
    (!search || i.activity.toLowerCase().includes(search.toLowerCase()) || (i.subActivity||'').toLowerCase().includes(search.toLowerCase())) &&
    (!phaseFilter || i.phaseId === phaseFilter) &&
    (!discFilter || i.disciplineId === discFilter) &&
    (!cpFilter || i.controlPoint === cpFilter)
  ), [items, search, phaseFilter, discFilter, cpFilter]);

  const emptyItem = (): QualityPlanItem => ({
    id: genId(), qualityPlanId: qp?.id || '', number: items.length + 1,
    phaseId: phases[0]?.id || '', disciplineId: state.disciplines[0]?.id || '',
    activity: '', subActivity: '', documentReference: '', acceptanceCriteria: '', controlMethod: '',
    responsible: 'QC Inspector', frequency: '100%', controlPoint: 'W',
    holdPoint: false, witnessPoint: true, surveillance: false, inspection: true, record: 'Checklist + PV',
    itpReference: '', procedure: '', checklist: '',
  });

  const [form, setForm] = useState<QualityPlanItem>(emptyItem());

  const openCreate = () => { if (!qp) return; setEditing(null); setForm(emptyItem()); setModalOpen(true); };
  const openEdit = (it: QualityPlanItem) => { setEditing(it); setForm({...it}); setModalOpen(true); };

  const save = () => {
    if (!form.activity || !form.phaseId || !form.disciplineId) { alert('Activité, phase et corps d\'état sont obligatoires'); return; }
    const toSave: QualityPlanItem = {
      ...form,
      holdPoint: form.controlPoint === 'H',
      witnessPoint: form.controlPoint === 'W',
      surveillance: form.controlPoint === 'S',
      inspection: form.controlPoint === 'I' || form.controlPoint === 'W' || form.controlPoint === 'H',
    };
    if (editing) {
      dispatch({ type: 'UPDATE_QP_ITEM', item: toSave });
      log('qp_item', toSave.id, 'MODIFIED', toSave.activity);
    } else {
      dispatch({ type: 'ADD_QP_ITEM', item: toSave });
      log('qp_item', toSave.id, 'CREATED', toSave.activity);
    }
    setModalOpen(false);
  };

  const remove = (it: QualityPlanItem) => {
    if (!confirm(`Supprimer la ligne "${it.activity}" ?`)) return;
    dispatch({ type: 'DELETE_QP_ITEM', id: it.id });
    log('qp_item', it.id, 'DELETED', it.activity);
  };

  const duplicate = (it: QualityPlanItem) => {
    const copy: QualityPlanItem = { ...it, id: genId(), number: items.length + 1, activity: it.activity + ' (copie)' };
    dispatch({ type: 'ADD_QP_ITEM', item: copy });
    log('qp_item', copy.id, 'CREATED', 'Duplication de ' + it.activity);
  };

  const exportExcel = () => {
    const data = filtered.map((it, idx) => ({
      'N°': idx + 1,
      'Phase': phaseById(it.phaseId)?.name || '',
      'Corps d\'état': disciplineById(it.disciplineId)?.name || '',
      'Activité': it.activity,
      'Sous-activité': it.subActivity || '',
      'Référence document': it.documentReference || '',
      'Critère d\'acceptation': it.acceptanceCriteria || '',
      'Méthode de contrôle': it.controlMethod || '',
      'Responsable': it.responsible || '',
      'Fréquence': it.frequency || '',
      'Point de contrôle': it.controlPoint,
      'Hold Point': it.holdPoint ? 'X' : '',
      'Witness Point': it.witnessPoint ? 'X' : '',
      'Surveillance': it.surveillance ? 'X' : '',
      'Inspection': it.inspection ? 'X' : '',
      'Enregistrement': it.record,
      'ITP': it.itpReference || '',
      'Procédure': it.procedure || '',
      'Checklist': it.checklist || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PCQ');
    XLSX.writeFile(wb, `PCQ_${project?.code || 'projet'}_Rev${qp?.currentRevision || '00'}.xlsx`);
  };

  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !qp) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(ws);
        let count = 0;
        rows.forEach((r, idx) => {
          const phase = phases.find(p => p.name === r['Phase']);
          const disc = state.disciplines.find(d => d.name === r['Corps d\'état']);
          if (!r['Activité']) return;
          const item: QualityPlanItem = {
            id: genId(), qualityPlanId: qp.id, number: items.length + count + 1,
            phaseId: phase?.id || phases[0]?.id || '',
            disciplineId: disc?.id || state.disciplines[0]?.id || '',
            activity: r['Activité'],
            subActivity: r['Sous-activité'] || '',
            documentReference: r['Référence document'] || '',
            acceptanceCriteria: r["Critère d'acceptation"] || '',
            controlMethod: r['Méthode de contrôle'] || '',
            responsible: r['Responsable'] || '',
            frequency: r['Fréquence'] || '100%',
            controlPoint: (r['Point de contrôle'] as ControlPointType) || 'W',
            holdPoint: r['Hold Point'] === 'X',
            witnessPoint: r['Witness Point'] === 'X',
            surveillance: r['Surveillance'] === 'X',
            inspection: r['Inspection'] === 'X',
            record: r['Enregistrement'] || 'Checklist + PV',
            itpReference: r['ITP'] || '',
            procedure: r['Procédure'] || '',
            checklist: r['Checklist'] || '',
          };
          dispatch({ type: 'ADD_QP_ITEM', item }); count++;
        });
        log('quality_plan', qp.id, 'IMPORTED', `${count} lignes importées`);
        alert(`${count} lignes importées avec succès.`);
      } catch (err) {
        alert('Erreur lors de l\'import : ' + (err as Error).message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // If no QP exists for project, we'll create one on mount via button
  const ensureQP = () => {
    if (!qp && project) {
      const newQP = { id: genId(), projectId: project.id, name: `PCQ - ${project.name}`, currentRevision: '00', createdAt: new Date().toISOString() };
      dispatch({ type: 'ADD_QP', qp: newQP });
      log('quality_plan', newQP.id, 'CREATED', newQP.name);
    }
  };

  const canEdit = hasRole('admin','qc_manager');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plan de Contrôle Qualité (PCQ)</h1>
          <p className="text-sm text-slate-500">Structurez vos inspections par phase et corps d'état.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="btn-secondary cursor-pointer"><Upload size={16}/> Importer Excel<input type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel}/></label>
          <button onClick={exportExcel} className="btn-secondary"><FileSpreadsheet size={16}/> Exporter Excel</button>
          {canEdit && <button onClick={() => { ensureQP(); setTimeout(openCreate, 100); }} className="btn-primary"><Plus size={16}/> Ajouter une ligne</button>}
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="label">Projet</label>
            <select className="input" value={projectId} onChange={e => { setProjectId(e.target.value); setSp({ project: e.target.value }); }}>
              {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <label className="label">Recherche</label>
            <Search size={16} className="absolute left-3 top-[34px] text-slate-400"/>
            <input className="input pl-9" placeholder="Activité..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div>
            <label className="label">Phase</label>
            <select className="input" value={phaseFilter} onChange={e=>setPhaseFilter(e.target.value)}>
              <option value="">Toutes</option>
              {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Corps d'état</label>
            <select className="input" value={discFilter} onChange={e=>setDiscFilter(e.target.value)}>
              <option value="">Tous</option>
              {state.disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400"/>
          {(['H','W','R','S','I'] as ControlPointType[]).map(cp => (
            <button key={cp} onClick={() => setCpFilter(cpFilter===cp?'':cp)}
              className={`px-2 py-1 rounded text-xs border ${cpFilter===cp ? 'bg-primary-600 text-white border-primary-600' : CP_LABELS[cp].color}`}>
              {CP_LABELS[cp].label}
            </button>
          ))}
          {cpFilter && <button onClick={()=>setCpFilter('')} className="text-xs text-slate-500 underline">Effacer</button>}
        </div>
      </div>

      {!qp ? (
        <div className="card p-10 text-center">
          <p className="text-slate-500 mb-4">Aucun PCQ n'existe encore pour ce projet.</p>
          <button onClick={ensureQP} className="btn-primary">Créer le PCQ</button>
        </div>
      ) : (
        <>
          <div className="card p-4 bg-primary-50 border-primary-200 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm text-slate-600">PCQ en vigueur - <span className="font-bold">Révision {qp.currentRevision}</span></div>
              <div className="text-xs text-slate-500">{qp.name} • {filtered.length} activité(s) • Créé le {fmtDate(qp.createdAt)}</div>
            </div>
            <div className="text-xs text-slate-600">Les Hold Points <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 font-semibold">H</span> nécessitent une notification obligatoire.</div>
          </div>

          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Phase</th>
                  <th>Corps d'état</th>
                  <th>Activité</th>
                  <th>Référence</th>
                  <th>Critère</th>
                  <th>Méthode</th>
                  <th>Point</th>
                  <th>Resp.</th>
                  <th>Fréq.</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it, idx) => {
                  const cp = CP_LABELS[it.controlPoint];
                  return (
                    <tr key={it.id}>
                      <td className="font-mono text-xs">{idx+1}</td>
                      <td>{phaseById(it.phaseId)?.name || '-'}</td>
                      <td>{disciplineById(it.disciplineId)?.name || '-'}</td>
                      <td>
                        <div className="font-medium text-slate-900">{it.activity}</div>
                        {it.subActivity && <div className="text-xs text-slate-500">{it.subActivity}</div>}
                      </td>
                      <td className="text-xs font-mono">{it.documentReference || it.itpReference || '-'}</td>
                      <td className="text-xs max-w-[200px]">{it.acceptanceCriteria}</td>
                      <td className="text-xs">{it.controlMethod}</td>
                      <td><span className={`px-2 py-0.5 rounded border text-xs font-semibold ${cp.color}`}>{it.controlPoint}</span></td>
                      <td className="text-xs">{it.responsible}</td>
                      <td className="text-xs">{it.frequency}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link to={`/di/new?qpItem=${it.id}&project=${projectId}`} className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700">DI</Link>
                          {canEdit && <>
                            <button onClick={()=>openEdit(it)} className="p-1 text-slate-500 hover:text-primary-600"><Pencil size={14}/></button>
                            <button onClick={()=>duplicate(it)} className="p-1 text-slate-500 hover:text-primary-600"><Copy size={14}/></button>
                            <button onClick={()=>remove(it)} className="p-1 text-slate-500 hover:text-red-600"><Trash2 size={14}/></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length===0 && <tr><td colSpan={11} className="text-center py-6 text-slate-500">Aucune activité.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing?'Modifier une activité PCQ':'Ajouter une activité au PCQ'} size="lg"
        footer={<><button className="btn-secondary" onClick={()=>setModalOpen(false)}>Annuler</button><button className="btn-primary" onClick={save}>Enregistrer</button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Phase *</label>
            <select className="input" value={form.phaseId} onChange={e=>setForm({...form,phaseId:e.target.value})}>
              {phases.map(p => <option key={p.id} value={p.id}>{p.order}. {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Corps d'état *</label>
            <select className="input" value={form.disciplineId} onChange={e=>setForm({...form,disciplineId:e.target.value})}>
              {state.disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Activité *</label><input className="input" value={form.activity} onChange={e=>setForm({...form,activity:e.target.value})}/></div>
          <div className="md:col-span-2"><label className="label">Sous-activité</label><input className="input" value={form.subActivity||''} onChange={e=>setForm({...form,subActivity:e.target.value})}/></div>
          <div><label className="label">Référence document</label><input className="input font-mono" value={form.documentReference||''} onChange={e=>setForm({...form,documentReference:e.target.value})}/></div>
          <div><label className="label">ITP</label><input className="input font-mono" value={form.itpReference||''} onChange={e=>setForm({...form,itpReference:e.target.value})}/></div>
          <div className="md:col-span-2"><label className="label">Critère d'acceptation</label><input className="input" value={form.acceptanceCriteria||''} onChange={e=>setForm({...form,acceptanceCriteria:e.target.value})}/></div>
          <div className="md:col-span-2"><label className="label">Méthode de contrôle</label><input className="input" value={form.controlMethod||''} onChange={e=>setForm({...form,controlMethod:e.target.value})}/></div>
          <div><label className="label">Responsable</label><input className="input" value={form.responsible||''} onChange={e=>setForm({...form,responsible:e.target.value})}/></div>
          <div><label className="label">Fréquence</label><input className="input" value={form.frequency||''} onChange={e=>setForm({...form,frequency:e.target.value})}/></div>
          <div>
            <label className="label">Type de point de contrôle</label>
            <select className="input" value={form.controlPoint} onChange={e=>setForm({...form,controlPoint:e.target.value as ControlPointType})}>
              <option value="H">H - Hold Point</option>
              <option value="W">W - Witness Point</option>
              <option value="R">R - Review</option>
              <option value="S">S - Surveillance</option>
              <option value="I">I - Inspection</option>
            </select>
          </div>
          <div><label className="label">Enregistrement</label><input className="input" value={form.record} onChange={e=>setForm({...form,record:e.target.value})}/></div>
          <div><label className="label">Procédure</label><input className="input font-mono" value={form.procedure||''} onChange={e=>setForm({...form,procedure:e.target.value})}/></div>
          <div><label className="label">Check-list</label><input className="input" value={form.checklist||''} onChange={e=>setForm({...form,checklist:e.target.value})}/></div>
        </div>
      </Modal>
    </div>
  );
}
