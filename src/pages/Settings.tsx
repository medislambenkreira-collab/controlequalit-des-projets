import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Database, Shield } from 'lucide-react';
import { useStore } from '../store';

export function Settings() {
  const { resetData, state, hasRole } = useStore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500">Configuration de la plateforme QualitéQC.</p>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Database size={18}/> Données</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
          <div className="p-3 bg-slate-50 rounded"><div className="text-xs text-slate-500">Projets</div><div className="font-bold text-lg">{state.projects.length}</div></div>
          <div className="p-3 bg-slate-50 rounded"><div className="text-xs text-slate-500">DI</div><div className="font-bold text-lg">{state.inspectionRequests.length}</div></div>
          <div className="p-3 bg-slate-50 rounded"><div className="text-xs text-slate-500">PV</div><div className="font-bold text-lg">{state.inspectionReports.length}</div></div>
          <div className="p-3 bg-slate-50 rounded"><div className="text-xs text-slate-500">NCR</div><div className="font-bold text-lg">{state.nonConformities.length}</div></div>
        </div>
        {hasRole('admin') && <button onClick={() => { if (confirm('Réinitialiser toutes les données de démo ?')) resetData(); }} className="btn-danger"><RotateCcw size={16}/> Réinitialiser les données de démonstration</button>}
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Shield size={18}/> Sécurité & Rôles (RBAC)</h3>
        <div className="text-sm text-slate-600 space-y-2">
          <p>L'application implémente un contrôle d'accès par rôle. Chaque utilisateur n'accède qu'aux projets et fonctionnalités correspondant à ses droits.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
            <li><strong>Administrateur:</strong> accès complet, gestion des utilisateurs et paramètres.</li>
            <li><strong>Responsable Construction:</strong> création et suivi des DI.</li>
            <li><strong>Responsable QC:</strong> revue, affectation, génération PV, vérification NCR.</li>
            <li><strong>Inspecteur QC:</strong> réalisation des inspections, saisie des résultats.</li>
            <li><strong>Client:</strong> consultation.</li>
          </ul>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 mb-3">À propos</h3>
        <div className="text-sm text-slate-600 space-y-1">
          <div><strong>QualitéQC</strong> v1.0 (MVP) - Application de gestion du Contrôle Qualité pour projets de construction (secteur hydrocarbures).</div>
          <div>Technologies: React + TypeScript + Tailwind CSS. Persistance locale (MVP) - Backend Supabase prévu pour la version production.</div>
          <div className="mt-3"><Link to="/users" className="text-primary-600 hover:underline">Gérer les utilisateurs →</Link></div>
        </div>
      </div>
    </div>
  );
}
