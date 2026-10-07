import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Search, FolderOpen } from 'lucide-react';
import { useStore } from '../store';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { PROJECT_STATUS_LABELS, fmtDate } from '../utils/format';
import type { Project, ProjectStatus } from '../types';

const STATUSES: ProjectStatus[] = ['preparation','ongoing','suspended','completed','closed'];

export function Projects() {
  const { state, dispatch, visibleProjects, currentUser, userById, genId, log, notify, hasRole } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const canEdit = hasRole('admin');
  const canCreate = hasRole('admin');

  const emptyProject = (): Project => ({
    id: genId(), name: '', code: '', client: '', epc: '', site: '', region: '',
    startDate: new Date().toISOString().slice(0,10), plannedEndDate: '',
    constructionManagerId: state.users.find(u=>u.role==='construction_manager')?.id || '',
    qcManagerId: state.users.find(u=>u.role==='qc_manager')?.id || '',
    status: 'preparation', progress: 0, description: '', memberIds: [],
    createdAt: new Date().toISOString(),
  });

  const [form, setForm] = useState<Project>(emptyProject());

  const openCreate = () => { setEditing(null); setForm(emptyProject()); setShowModal(true); };
  const openEdit = (p: Project) => { setEditing(p); setForm({...p}); setShowModal(true); };

  const save = () => {
    if (!form.name || !form.code) { alert('Nom et numéro du projet sont obligatoires'); return; }
    const members = new Set(form.memberIds);
    if (form.constructionManagerId) members.add(form.constructionManagerId);
    if (form.qcManagerId) members.add(form.qcManagerId);
    const toSave: Project = { ...form, memberIds: Array.from(members) };
    if (editing) {
      dispatch({ type: 'UPDATE_PROJECT', project: toSave });
      log('project', toSave.id, 'MODIFIED', `Projet ${toSave.name}`);
    } else {
      dispatch({ type: 'ADD_PROJECT', project: toSave });
      log('project', toSave.id, 'CREATED', `Projet ${toSave.name} créé`);
      if (toSave.constructionManagerId) notify(toSave.constructionManagerId, 'Affectation projet', `Vous avez été affecté au projet ${toSave.name}`);
      if (toSave.qcManagerId) notify(toSave.qcManagerId, 'Affectation projet', `Vous avez été nommé Responsable QC du projet ${toSave.name}`);
    }
    setShowModal(false);
  };

  const remove = (p: Project) => {
    if (!confirm(`Supprimer le projet ${p.name} ?`)) return;
    dispatch({ type: 'DELETE_PROJECT', id: p.id });
    log('project', p.id, 'DELETED', p.name);
  };

  const toggleMember = (uid: string) => {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(uid) ? f.memberIds.filter(x => x !== uid) : [...f.memberIds, uid],
    }));
  };

  const filtered = visibleProjects.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || p.status === statusFilter)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projets</h1>
          <p className="text-sm text-slate-500">{filtered.length} projet(s)</p>
        </div>
        {canCreate && <button onClick={openCreate} className="btn-primary"><Plus size={16}/> Nouveau projet</button>}
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="input pl-9" placeholder="Rechercher un projet..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="input max-w-[200px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(s => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s].label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => {
          const cm = userById(p.constructionManagerId);
          const qm = userById(p.qcManagerId);
          const s = PROJECT_STATUS_LABELS[p.status];
          return (
            <div key={p.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-24 bg-gradient-to-br from-primary-500 to-primary-700 relative p-4">
                <div className="absolute top-3 right-3"><StatusBadge color={s.color} bg={s.bg} label={s.label}/></div>
                <div className="flex items-center gap-2 text-white/90 text-xs mt-1">
                  <FolderOpen size={14}/><span className="font-mono">{p.code}</span>
                </div>
                <h3 className="text-white font-bold text-lg leading-tight mt-1 line-clamp-2">{p.name}</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><div className="text-slate-500">Client</div><div className="font-medium text-slate-800">{p.client||'-'}</div></div>
                  <div><div className="text-slate-500">Site</div><div className="font-medium text-slate-800">{p.site||'-'}</div></div>
                  <div><div className="text-slate-500">Début</div><div className="font-medium text-slate-800">{fmtDate(p.startDate)}</div></div>
                  <div><div className="text-slate-500">Fin prévue</div><div className="font-medium text-slate-800">{fmtDate(p.plannedEndDate)}</div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Avancement</span><span className="font-semibold text-slate-800">{p.progress}%</span></div>
                  <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-primary-500 h-2 rounded-full" style={{width: `${p.progress}%`}}/></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex-1">
                    <div className="text-slate-400 text-[10px]">Resp. Construction</div>
                    <div className="font-medium truncate">{cm?.fullName || '-'}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-slate-400 text-[10px]">Resp. QC</div>
                    <div className="font-medium truncate">{qm?.fullName || '-'}</div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Link to={`/projects/${p.id}`} className="btn-secondary flex-1 justify-center"><Eye size={14}/> Consulter</Link>
                  {canEdit && <>
                    <button onClick={() => openEdit(p)} className="btn-ghost px-2" title="Modifier"><Pencil size={14}/></button>
                    <button onClick={() => remove(p)} className="btn-ghost px-2 text-red-600 hover:bg-red-50" title="Supprimer"><Trash2 size={14}/></button>
                  </>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500">Aucun projet.</div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier le projet' : 'Nouveau projet'} size="lg"
        footer={<><button className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button><button className="btn-primary" onClick={save}>Enregistrer</button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label">Nom du projet *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label className="label">Numéro / Affaire *</label><input className="input" value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></div>
          <div><label className="label">Client</label><input className="input" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/></div>
          <div><label className="label">EPC / Contractant</label><input className="input" value={form.epc} onChange={e=>setForm({...form,epc:e.target.value})}/></div>
          <div><label className="label">Site</label><input className="input" value={form.site} onChange={e=>setForm({...form,site:e.target.value})}/></div>
          <div><label className="label">Région</label><input className="input" value={form.region} onChange={e=>setForm({...form,region:e.target.value})}/></div>
          <div><label className="label">Date de début</label><input type="date" className="input" value={form.startDate.slice(0,10)} onChange={e=>setForm({...form,startDate:e.target.value})}/></div>
          <div><label className="label">Date de fin prévue</label><input type="date" className="input" value={form.plannedEndDate.slice(0,10)} onChange={e=>setForm({...form,plannedEndDate:e.target.value})}/></div>
          <div>
            <label className="label">Responsable Construction</label>
            <select className="input" value={form.constructionManagerId} onChange={e=>setForm({...form,constructionManagerId:e.target.value})}>
              <option value="">-- Sélectionner --</option>
              {state.users.filter(u=>u.role==='construction_manager'||u.role==='admin').map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Responsable QC</label>
            <select className="input" value={form.qcManagerId} onChange={e=>setForm({...form,qcManagerId:e.target.value})}>
              <option value="">-- Sélectionner --</option>
              {state.users.filter(u=>u.role==='qc_manager'||u.role==='admin').map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value as ProjectStatus})}>
              {STATUSES.map(s => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Avancement (%)</label>
            <input type="number" min="0" max="100" className="input" value={form.progress} onChange={e=>setForm({...form,progress:Number(e.target.value)})}/>
          </div>
          <div className="md:col-span-2"><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
          <div className="md:col-span-2">
            <label className="label">Membres du projet</label>
            <div className="border border-slate-200 rounded-md p-3 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {state.users.filter(u=>u.active).map(u => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.memberIds.includes(u.id)} onChange={()=>toggleMember(u.id)}/>
                  {u.fullName} <span className="text-xs text-slate-400">({u.role})</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
