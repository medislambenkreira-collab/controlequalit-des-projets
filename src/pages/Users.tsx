import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { Modal } from '../components/Modal';
import { ROLE_LABELS } from '../utils/format';
import type { User, Role } from '../types';

export function Users() {
  const { state, dispatch, hasRole, genId, log } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User>>({ role: 'qc_inspector', active: true });

  if (!hasRole('admin')) return <div className="card p-8 text-center text-slate-500">Accès réservé à l'administrateur.</div>;

  const openCreate = () => { setEditing(null); setForm({ role: 'qc_inspector', active: true, fullName: '', email: '', password: '', phone: '' }); setShowModal(true); };
  const openEdit = (u: User) => { setEditing(u); setForm({ ...u }); setShowModal(true); };

  const save = () => {
    if (!form.fullName || !form.email || !form.password) { alert('Nom, email et mot de passe sont obligatoires'); return; }
    if (editing) {
      dispatch({ type: 'UPDATE_USER', user: { ...editing, ...form } as User });
      log('user', editing.id, 'MODIFIED', form.fullName);
    } else {
      const u: User = { id: genId(), email: form.email!, password: form.password!, fullName: form.fullName!, role: form.role as Role, phone: form.phone, active: form.active !== false, createdAt: new Date().toISOString() };
      dispatch({ type: 'ADD_USER', user: u });
      log('user', u.id, 'CREATED', u.fullName);
    }
    setShowModal(false);
  };

  const remove = (u: User) => {
    if (!confirm(`Supprimer l'utilisateur ${u.fullName} ?`)) return;
    dispatch({ type: 'DELETE_USER', id: u.id });
    log('user', u.id, 'DELETED', u.fullName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-sm text-slate-500">{state.users.length} utilisateur(s)</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16}/> Nouvel utilisateur</button>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Téléphone</th><th>Statut</th><th className="w-24">Actions</th></tr></thead>
          <tbody>
            {state.users.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">{u.fullName.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
                    <div className="font-medium">{u.fullName}</div>
                  </div>
                </td>
                <td className="text-xs">{u.email}</td>
                <td><span className="status-badge bg-slate-100 text-slate-700">{ROLE_LABELS[u.role]}</span></td>
                <td className="text-xs">{u.phone||'-'}</td>
                <td>{u.active ? <span className="status-badge bg-green-100 text-green-700">Actif</span> : <span className="status-badge bg-slate-100 text-slate-600">Inactif</span>}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={()=>openEdit(u)} className="p-1 text-slate-500 hover:text-primary-600"><Pencil size={14}/></button>
                    <button onClick={()=>remove(u)} className="p-1 text-slate-500 hover:text-red-600"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Modifier utilisateur':'Nouvel utilisateur'}
        footer={<><button className="btn-secondary" onClick={()=>setShowModal(false)}>Annuler</button><button className="btn-primary" onClick={save}>Enregistrer</button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><label className="label">Nom complet *</label><input className="input" value={form.fullName||''} onChange={e=>setForm({...form,fullName:e.target.value})}/></div>
          <div><label className="label">Email *</label><input type="email" className="input" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div><label className="label">Mot de passe *</label><input type="text" className="input" value={form.password||''} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          <div><label className="label">Rôle</label>
            <select className="input" value={form.role} onChange={e=>setForm({...form,role:e.target.value as Role})}>
              {Object.entries(ROLE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label className="label">Téléphone</label><input className="input" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
          <div className="md:col-span-2 flex items-center gap-2"><input type="checkbox" id="active" checked={form.active!==false} onChange={e=>setForm({...form,active:e.target.checked})}/><label htmlFor="active" className="text-sm">Compte actif</label></div>
        </div>
      </Modal>
    </div>
  );
}
