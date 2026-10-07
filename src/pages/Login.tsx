import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store';

export function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const u = login(email.trim(), password);
    if (u) navigate('/');
    else setError('Email ou mot de passe incorrect.');
  };

  const quickLogin = (em: string, pw: string) => { setEmail(em); setPassword(pw); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 to-primary-800 text-white p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
                <ShieldCheck size={28}/>
              </div>
              <div>
                <div className="text-2xl font-bold">QualitéQC</div>
                <div className="text-primary-200 text-sm">Contrôle Qualité Construction</div>
              </div>
            </div>
            <h1 className="text-3xl font-bold leading-tight mb-4">
              Gérez la qualité de vos projets industriels de bout en bout
            </h1>
            <p className="text-primary-100 leading-relaxed">
              Plateforme professionnelle pour le contrôle qualité des projets de construction dans le secteur des hydrocarbures : pipelines, raffineries, stations de compression, ouvrages de génie civil, et plus.
            </p>
          </div>
          <div className="relative mt-8 space-y-3 text-sm">
            <div className="flex items-start gap-2"><div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center mt-0.5 text-xs font-bold">✓</div> Plans de Contrôle Qualité (PCQ)</div>
            <div className="flex items-start gap-2"><div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center mt-0.5 text-xs font-bold">✓</div> Demandes d'inspection et workflow</div>
            <div className="flex items-start gap-2"><div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center mt-0.5 text-xs font-bold">✓</div> Génération automatique de PV</div>
            <div className="flex items-start gap-2"><div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center mt-0.5 text-xs font-bold">✓</div> Gestion des écarts (NCR) et traçabilité complète</div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Connexion</h2>
          <p className="text-slate-500 mb-6">Connectez-vous pour accéder à la plateforme.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required/>
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required/>
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                <AlertCircle size={18}/>{error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full justify-center py-2.5">Se connecter</button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-3 font-semibold uppercase">Comptes de démonstration (cliquez pour remplir) :</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button type="button" onClick={() => quickLogin('admin@qc.com','admin123')} className="text-left p-2 rounded border border-slate-200 hover:bg-slate-50">
                <div className="font-semibold text-slate-800">Administrateur</div>
                <div className="text-slate-500">admin@qc.com / admin123</div>
              </button>
              <button type="button" onClick={() => quickLogin('construction@qc.com','construction123')} className="text-left p-2 rounded border border-slate-200 hover:bg-slate-50">
                <div className="font-semibold text-slate-800">Responsable Construction</div>
                <div className="text-slate-500">construction@qc.com / construction123</div>
              </button>
              <button type="button" onClick={() => quickLogin('qc@qc.com','qc123')} className="text-left p-2 rounded border border-slate-200 hover:bg-slate-50">
                <div className="font-semibold text-slate-800">Responsable QC</div>
                <div className="text-slate-500">qc@qc.com / qc123</div>
              </button>
              <button type="button" onClick={() => quickLogin('inspector@qc.com','inspector123')} className="text-left p-2 rounded border border-slate-200 hover:bg-slate-50">
                <div className="font-semibold text-slate-800">Inspecteur QC</div>
                <div className="text-slate-500">inspector@qc.com / inspector123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
