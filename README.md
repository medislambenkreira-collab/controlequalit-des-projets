# QualitéQC — Application de Gestion du Contrôle Qualité (MVP)

Application web professionnelle de gestion du Contrôle Qualité pour projets de construction dans le secteur des hydrocarbures.

## 🚀 Démarrage

```bash
cd qc-app
npm install
npm run dev
```

L'application est accessible sur http://localhost:5173

## 🔐 Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@qc.com | admin123 |
| Responsable Construction | construction@qc.com | construction123 |
| Responsable QC | qc@qc.com | qc123 |
| Inspecteur QC | inspector@qc.com | inspector123 |
| Client | client@qc.com | client123 |

> Cliquez sur un compte de démo sur la page de connexion pour remplir automatiquement les champs.

## 📦 Fonctionnalités du MVP

- **Authentification sécurisée** avec gestion des rôles (RBAC)
- **Gestion multi-projets** avec statuts, membres, avancement
- **Phases et corps d'état** configurables par projet
- **Plan de Contrôle Qualité (PCQ)** : création, édition, import/export Excel, filtres par phase / corps d'état / type de point (H/W/R/S/I), gestion des Hold Points et Witness Points
- **Workflow complet des Demandes d'Inspection (DI)** : brouillon → soumission → revue QC → acceptation/rejet/demande d'infos → affectation inspecteur → planification → inspection en cours → résultat
- **Inspection** avec check-list dynamique, conformité/non-conformité/observations
- **Génération automatique de PV (PDF)** avec jsPDF + AutoTable (logo/infos/références/résultats/conclusion/signatures)
- **Gestion des Écarts (NCR)** : création automatique, actions correctives, téléversement de preuves, vérification QC, clôture
- **Tableau de bord** avec KPI, graphiques Recharts, évolution inspections/écarts
- **Calendrier des inspections** (vue mois) avec filtres et indicateurs de retard
- **Notifications** in-app lors des transitions du workflow
- **Bibliothèque documentaire** par projet/catégorie
- **Traçabilité complète** (journal d'audit)
- **Export Excel** des DI, PCQ (via SheetJS/xlsx)
- **Recherche et filtres** sur tous les modules
- **Interface responsive** (ordinateur/tablette/téléphone)

## 🏗️ Workflow implémenté

```
PROJET → PHASE → CORPS D'ÉTAT → PCQ → ACTIVITÉ → DI → REVUE QC → AFFECTATION
→ PLANIFICATION → INSPECTION → RÉSULTAT → PV → (ÉCART ? NCR → ACTION CORRECTIVE
→ PREUVE → VÉRIFICATION QC → CLÔTURE : CLÔTURE DI)
```

## 🛠️ Architecture technique

- **Frontend :** React 19 + TypeScript + Vite
- **UI :** Tailwind CSS v4 + Lucide React icons
- **Graphiques :** Recharts
- **PDF :** jsPDF + AutoTable
- **Excel :** SheetJS (xlsx)
- **Dates :** date-fns
- **Router :** React Router v6
- **Persistance :** localStorage (MVP) — facilement remplaçable par Supabase/PostgreSQL/Express

## 📁 Structure du code

```
src/
├── components/     # Composants UI réutilisables (AppLayout, Modal, StatusBadge)
├── pages/          # Pages principales (Dashboard, Projects, PCQ, DI, Inspections, Reports, NCR, Schedule, Documents, Stats, Notifications, Users, Settings)
├── store/          # Context React + Reducer + données seed
├── types/          # Types TypeScript du domaine
└── utils/          # Utilitaires (formatage dates/statuts, génération PDF)
```

## 🔮 Évolutions prévues

- Backend Supabase/PostgreSQL pour la persistance multi-utilisateurs temps réel
- Notifications email/SMS
- Gestion des WPS/PQR, soudeurs, CND, certificats matières
- Application mobile Android (React Native)
- Mode offline chantier
- Signature électronique
- Gestion des audits, fournisseurs, sous-traitants, Mechanical Completion, Pre-Commissioning
- Intégration Excel bidirectionnelle avancée
- Généralisation de l'impression PDF (tous documents)
