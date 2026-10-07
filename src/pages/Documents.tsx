import React, { useState } from 'react';
import { Plus, Upload, FileText, FolderOpen, Search, Download } from 'lucide-react';
import { useStore, fileToAttachment } from '../store';
import { Modal } from '../components/Modal';
import { fmtDate, fmtBytes } from '../utils/format';
import type { Document } from '../types';

const CATEGORIES = ['Contrat','Spécifications','Plans','Procédures','ITP','PCQ','Check-lists','PV','Rapports','NCR','Preuves','Photos'];

export function Documents() {
  const { state, dispatch, currentUser, visibleProjects, genId, log } = useStore();
  const [projectFilter, setProjectFilter] = useState(visibleProjects[0]?.id || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Document>>({ category: 'Procédures', revision: '00' });

  const docs = state.documents.filter(d => d.projectId === projectFilter)
    .filter(d => !categoryFilter || d.category === categoryFilter)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.number.toLowerCase().includes(search.toLowerCase()));

  const grouped: Record<string, Document[]> = {};
  docs.forEach(d => { (grouped[d.category] ||= []).push(d); });

  const openCreate = () => { setForm({ category: 'Procédures', revision: '00', projectId: projectFilter }); setModalOpen(true); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const att = await fileToAttachment(file);
    setForm(f => ({ ...f, attachment: att, name: f.name || file.name }));
    e.target.value = '';
  };

  const save = () => {
    if (!form.name || !form.number) { alert('Nom et numéro sont obligatoires'); return; }
    const doc: Document = {
      id: genId(), projectId: projectFilter, name: form.name!, number: form.number!,
      revision: form.revision || '00', category: form.category || 'Autres',
      date: form.date || new Date().toISOString(), authorId: currentUser!.id,
      status: form.status || 'Approuvé', attachment: form.attachment,
      phaseId: form.phaseId, disciplineId: form.disciplineId,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_DOCUMENT', doc });
    log('document', doc.id, 'UPLOADED', doc.name);
    setModalOpen(false);
  };

  const downloadAtt = (d: Document) => {
    if (d.attachment?.dataUrl) {
      const a = document.createElement('a');
      a.href = d.attachment.dataUrl; a.download = d.attachment.name; a.click();
    }
  };

  const projPhases = state.phases.filter(p => p.projectId === projectFilter).sort((a,b)=>a.order-b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bibliothèque documentaire</h1>
          <p className="text-sm text-slate-500">Gestion centralisée des documents qualité du projet.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16}/> Ajouter un document</button>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select className="input" value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}>
          {visibleProjects.map(p=><option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
        </select>
        <select className="input" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="card p-10 text-center text-slate-500"><FolderOpen size={40} className="mx-auto mb-3 opacity-30"/>Aucun document.</div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="card">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <FolderOpen size={18} className="text-primary-600"/>
              <h3 className="font-semibold text-slate-900">{cat}</h3>
              <span className="text-xs text-slate-500">({items.length})</span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map(d => {
                const author = state.users.find(u=>u.id===d.authorId);
                return (
                  <div key={d.id} className="p-3 flex items-center gap-3 hover:bg-slate-50">
                    <FileText size={20} className="text-slate-400"/>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{d.name}</div>
                      <div className="text-xs text-slate-500 flex gap-3 flex-wrap mt-0.5">
                        <span className="font-mono">{d.number} Rev.{d.revision}</span>
                        <span>{fmtDate(d.date)}</span>
                        <span>{author?.fullName}</span>
                        <span className={`px-1.5 rounded ${d.status==='Approuvé'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{d.status}</span>
                        {d.attachment && <span>{fmtBytes(d.attachment.size)}</span>}
                      </div>
                    </div>
                    {d.attachment && <button onClick={()=>downloadAtt(d)} className="p-2 text-slate-500 hover:text-primary-600"><Download size={16}/></button>}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="Ajouter un document" size="md"
        footer={<><button className="btn-secondary" onClick={()=>setModalOpen(false)}>Annuler</button><button className="btn-primary" onClick={save}>Enregistrer</button></>}>
        <div className="space-y-3">
          <div><label className="label">Nom *</label><input className="input" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Numéro *</label><input className="input font-mono" value={form.number||''} onChange={e=>setForm({...form,number:e.target.value})}/></div>
            <div><label className="label">Révision</label><input className="input" value={form.revision||''} onChange={e=>setForm({...form,revision:e.target.value})}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Catégorie</label><select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label className="label">Statut</label><select className="input" value={form.status||'Approuvé'} onChange={e=>setForm({...form,status:e.target.value})}><option>Brouillon</option><option>Soumis</option><option>Approuvé</option><option>Obsolete</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Phase</label><select className="input" value={form.phaseId||''} onChange={e=>setForm({...form,phaseId:e.target.value})}><option value="">--</option>{projPhases.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="label">Corps d'état</label><select className="input" value={form.disciplineId||''} onChange={e=>setForm({...form,disciplineId:e.target.value})}><option value="">--</option>{state.disciplines.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          </div>
          <div>
            <label className="label">Fichier</label>
            <label className="btn-secondary cursor-pointer inline-flex"><Upload size={16}/> Téléverser<input type="file" className="hidden" onChange={handleFile}/></label>
            {form.attachment && <div className="mt-2 text-xs text-slate-600">📎 {form.attachment.name} ({fmtBytes(form.attachment.size)})</div>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
