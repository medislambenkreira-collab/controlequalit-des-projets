import type { User, Project, Phase, Discipline, QualityPlan, QualityPlanItem, InspectionRequest, InspectionReport, NonConformity } from '../types';

export const now = () => new Date().toISOString();
const d = (offsetDays = 0) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString();
};

export const seedUsers: User[] = [
  { id: 'u1', email: 'admin@qc.com', password: 'admin123', fullName: 'Karim Benali', role: 'admin', phone: '+213 555 000 001', active: true, createdAt: d(-30) },
  { id: 'u2', email: 'construction@qc.com', password: 'construction123', fullName: 'Mohamed Saidi', role: 'construction_manager', phone: '+213 555 000 002', active: true, createdAt: d(-28) },
  { id: 'u3', email: 'qc@qc.com', password: 'qc123', fullName: 'Ahmed Boudiaf', role: 'qc_manager', phone: '+213 555 000 003', active: true, createdAt: d(-28) },
  { id: 'u4', email: 'inspector@qc.com', password: 'inspector123', fullName: 'Yacine Hamdi', role: 'qc_inspector', phone: '+213 555 000 004', active: true, createdAt: d(-28) },
  { id: 'u5', email: 'inspector2@qc.com', password: 'inspector123', fullName: 'Farid Zerhouni', role: 'qc_inspector', phone: '+213 555 000 005', active: true, createdAt: d(-27) },
  { id: 'u6', email: 'client@qc.com', password: 'client123', fullName: 'Pierre Dupont (Client)', role: 'client', phone: '+33 1 23 45 67 89', active: true, createdAt: d(-25) },
];

export const seedDisciplines: Discipline[] = [
  { id: 'd1', name: 'Civil' },
  { id: 'd2', name: 'Mechanical Equipment' },
  { id: 'd3', name: 'Piping' },
  { id: 'd4', name: 'Welding' },
  { id: 'd5', name: 'Pipeline' },
  { id: 'd6', name: 'Electrical' },
  { id: 'd7', name: 'Instrumentation' },
  { id: 'd8', name: 'Structural Steel' },
  { id: 'd9', name: 'Painting / Coating' },
  { id: 'd10', name: 'Tank' },
  { id: 'd11', name: 'HVAC' },
  { id: 'd12', name: 'Fire Fighting' },
  { id: 'd13', name: 'Insulation' },
  { id: 'd14', name: 'Telecom' },
  { id: 'd15', name: 'Testing' },
  { id: 'd16', name: 'Pre-commissioning' },
];

const defaultPhases = ['Engineering','Procurement','Civil Works','Mechanical Works','Piping','Welding','Electrical','Instrumentation','Structural Works','Painting / Coating','Pipeline','Testing','Pre-commissioning','Commissioning','Final Acceptance'];

export const seedProject: Project = {
  id: 'p1',
  name: 'Construction unité de traitement gaz Hassi R\'Mel',
  code: 'HRM-GTP-001',
  client: 'Sonatrach',
  epc: 'EPC Consortium Algeria',
  site: 'Hassi R\'Mel',
  region: 'Laghouat',
  startDate: '2026-03-01',
  plannedEndDate: '2027-12-31',
  constructionManagerId: 'u2',
  qcManagerId: 'u3',
  status: 'ongoing',
  progress: 32,
  description: 'Construction d\'une unité de traitement de gaz de 10 Mm³/j incluant systèmes de séparation, compression, déshydratation et comptage.',
  memberIds: ['u2','u3','u4','u5','u6'],
  createdAt: d(-60),
};

export const seedProject2: Project = {
  id: 'p2',
  name: 'Pipeline GR5 - Extension Sud',
  code: 'PL-GR5-EXT-002',
  client: 'Sonatrach TRC',
  epc: 'Cosider Pipelines',
  site: 'Ghardaïa',
  region: 'Ghardaïa',
  startDate: '2026-06-01',
  plannedEndDate: '2027-06-30',
  constructionManagerId: 'u2',
  qcManagerId: 'u3',
  status: 'ongoing',
  progress: 15,
  description: 'Extension de 120 km de pipeline gaz 36" avec stations de sectionnement.',
  memberIds: ['u2','u3','u4','u6'],
  createdAt: d(-40),
};

export const seedPhases: Phase[] = defaultPhases.map((name, i) => ({
  id: `ph-p1-${i+1}`, projectId: 'p1', name, order: i+1,
})).concat(defaultPhases.slice(0,10).map((name, i) => ({
  id: `ph-p2-${i+1}`, projectId: 'p2', name, order: i+1,
})));

export const seedQualityPlan: QualityPlan = {
  id: 'qp1', projectId: 'p1', name: 'Plan de Contrôle Qualité - Projet HRM-GTP', currentRevision: '01', createdAt: d(-45),
};
export const seedQualityPlan2: QualityPlan = {
  id: 'qp2', projectId: 'p2', name: 'PCQ Pipeline GR5 Extension', currentRevision: '00', createdAt: d(-30),
};

const makeQPItem = (id: string, qpId: string, num: number, phaseId: string, discId: string,
  activity: string, subActivity: string, cp: 'H'|'W'|'R'|'S'|'I', ref: string, crit: string, method: string): QualityPlanItem => ({
  id, qualityPlanId: qpId, number: num, phaseId, disciplineId: discId, activity, subActivity,
  documentReference: ref, acceptanceCriteria: crit, controlMethod: method, responsible: 'QC Inspector', frequency: '100%',
  controlPoint: cp, holdPoint: cp==='H', witnessPoint: cp==='W', surveillance: cp==='S', inspection: cp==='I'||cp==='W',
  record: 'Checklist + PV', itpReference: `ITP-${num.toString().padStart(3,'0')}`, procedure: `PR-QC-${num.toString().padStart(3,'0')}`,
});

export const seedQPItems: QualityPlanItem[] = [
  makeQPItem('qpi1','qp1',1,'ph-p1-3','d1','Terrassement des foules','Vérification compactage','H','NFC EN 1997','Compacité ≥ 95% OPM','Essai plaque / Densimètre'),
  makeQPItem('qpi2','qp1',2,'ph-p1-3','d8','Réception semelles béton','Contrôle géométrique','W','NFC DTU 13.1','Tolérances ±10mm','Niveau / Théodolite'),
  makeQPItem('qpi3','qp1',3,'ph-p1-4','d2','Pose des équipements','Alignement pompe centrifuge','H','API 610','Alignement radial ≤ 0.05mm','Cadran / Laser'),
  makeQPItem('qpi4','qp1',4,'ph-p1-6','d4','Soudage joints 12"','Inspection visuelle du joint','W','API 1104 / ASME IX','Pas de défaut > acceptable','Visuel VT 100%'),
  makeQPItem('qpi5','qp1',5,'ph-p1-6','d4','Soudage joints 12"','Radiographie contrôle','R','API 1104','Critères acceptation §9','RT 10%'),
  makeQPItem('qpi6','qp1',6,'ph-p1-5','d3','Pose tuyauterie 24"','Vérification alignement','W','ASME B31.3','Alignement / pente','Niveau laser'),
  makeQPItem('qpi7','qp1',7,'ph-p1-5','d3','Epreuve hydraulique','Pression test','H','ASME B31.3','1.5 x Pression de service','Manomètre étalonné'),
  makeQPItem('qpi8','qp1',8,'ph-p1-7','d6','Câblage électrique','Continuité et isolement','I','NFC 15-100','Isolement > 1MΩ','Mégohmmètre'),
  makeQPItem('qpi9','qp1',9,'ph-p1-8','d7','Boucle instrumentation','Calibration instruments','W','ISA RP 52.1','Erreur ≤ 0.5% PE','Calibrateur'),
  makeQPItem('qpi10','qp1',10,'ph-p1-10','d9','Peinture époxy','Contrôle épaisseur / adhérence','I','ISO 12944','DFT conforme / Adhérence > 3MPa','Contrôleur / Pull-off'),
  makeQPItem('qpi11','qp1',11,'ph-p1-12','d12','Système incendie','Test déluge skid','H','NFPA 15','Toutes buses opérationnelles','Test eau'),
  makeQPItem('qpi12','qp1',12,'ph-p1-13','d15','Pre-commissioning','Checklist pré-mise en service','S','Project Spec','Items checklist complétés','Vérification documentaire'),
];

export const seedDI1: InspectionRequest = {
  id: 'di1', number: 'DI-2026-000124', projectId: 'p1', lot: 'Lot 03 - Piping Area A',
  phaseId: 'ph-p1-6', disciplineId: 'd4', qualityPlanItemId: 'qpi4', itpReference: 'ITP-004',
  description: 'Inspection visuelle du joint soudé 12" ligne LG-1200-VAP-12" joint n°42',
  location: 'Area A - Rack R1 - Joint 42',
  requestDate: d(-2), desiredDate: d(1), requestedById: 'u2', controlLevel: 'Normal',
  comments: 'Soudure terminée par soudeur S-012 selon WPS PQR-023',
  attachments: [], status: 'accepted', createdAt: d(-2), updatedAt: d(-1),
};

export const seedDI2: InspectionRequest = {
  id: 'di2', number: 'DI-2026-000125', projectId: 'p1', lot: 'Lot 03 - Piping Area A',
  phaseId: 'ph-p1-6', disciplineId: 'd4', qualityPlanItemId: 'qpi4', itpReference: 'ITP-004',
  description: 'Inspection visuelle du joint soudé 12" ligne LG-1200-VAP-12" joint n°45',
  location: 'Area A - Rack R1 - Joint 45',
  requestDate: d(-1), desiredDate: d(2), requestedById: 'u2', controlLevel: 'Hold Point',
  comments: 'Hold point selon PCQ - Présence QC et Client requise',
  attachments: [], status: 'planned', inspectorId: 'u4', scheduledDate: d(2).split('T')[0], scheduledTime: '09:00', scheduledLocation: 'Area A - Rack R1',
  createdAt: d(-1), updatedAt: d(-1),
};

export const seedDI3: InspectionRequest = {
  id: 'di3', number: 'DI-2026-000123', projectId: 'p1', lot: 'Lot 02 - Civil Tank Area',
  phaseId: 'ph-p1-3', disciplineId: 'd1', qualityPlanItemId: 'qpi1', itpReference: 'ITP-001',
  description: 'Vérification compacité remblai fondation Tk-001',
  location: 'Tank Farm - Tk-001',
  requestDate: d(-5), desiredDate: d(-3), requestedById: 'u2', controlLevel: 'Hold Point',
  comments: '',
  attachments: [], status: 'reported', inspectorId: 'u4', scheduledDate: d(-3).split('T')[0], scheduledTime: '10:00', scheduledLocation: 'Tank Farm Tk-001',
  result: 'non_conform', observations: 'Compacité mesurée 91% inférieure à l\'exigence 95% OPM - Zone Est de la foule',
  resultComment: 'Non-conformité majeure - reprise nécessaire', reportId: 'pv1',
  checklistResults: [
    { point: 'Identification zone', requirement: 'Zones de foule identifiées', result: 'C' },
    { point: 'Matériel', requirement: 'Matériel conforme à la procédure', result: 'C' },
    { point: 'Compacité Zone Ouest', requirement: '≥ 95% OPM', result: 'C', comment: '96.2%' },
    { point: 'Compacité Zone Est', requirement: '≥ 95% OPM', result: 'NC', comment: '91.0%' },
    { point: 'Compacité Zone Centre', requirement: '≥ 95% OPM', result: 'C', comment: '95.8%' },
  ],
  createdAt: d(-5), updatedAt: d(-3),
};

export const seedPV: InspectionReport = {
  id: 'pv1', number: 'PV-2026-000098', inspectionRequestId: 'di3', projectId: 'p1',
  date: d(-3), inspectorId: 'u4', constructionManagerId: 'u2', qcManagerId: 'u3',
  result: 'non_conform', conclusion: 'Non conforme - Reprise du compactage zone Est requise',
  signatures: [
    { role: 'Inspecteur QC', name: 'Yacine Hamdi', signedAt: d(-3) },
    { role: 'Responsable Construction', name: 'Mohamed Saidi', signedAt: d(-3) },
    { role: 'Responsable QC', name: 'Ahmed Boudiaf', signedAt: d(-3) },
  ],
  createdAt: d(-3),
};

export const seedNCR: NonConformity = {
  id: 'ncr1', number: 'NCR-2026-000045', projectId: 'p1', reportId: 'pv1', inspectionRequestId: 'di3',
  phaseId: 'ph-p1-3', disciplineId: 'd1',
  description: 'Compacité du remblai zone Est fondation Tk-001 inférieure aux exigences (91% pour 95% demandé)',
  requirement: 'Compacité ≥ 95% OPM selon NFC EN 1997', reference: 'PV-2026-000098 / ITP-001',
  date: d(-3), responsibleId: 'u2', dueDate: d(7),
  correctiveAction: 'Décompactage zone Est, apport de matériau concassé 0/31.5, compactage par couches de 30cm, nouveau contrôle densité',
  cause: 'Compactage insuffisant lors de la dernière passe - nombre de passes inférieur à la procédure',
  evidence: [], status: 'action_in_progress', createdAt: d(-3),
};
