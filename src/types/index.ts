// Domain types for QC Management Application

export type Role = 'admin' | 'construction_manager' | 'qc_manager' | 'qc_inspector' | 'client';

export interface User {
  id: string;
  email: string;
  password: string; // (in MVP, demo only)
  fullName: string;
  role: Role;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export type ProjectStatus = 'preparation' | 'ongoing' | 'suspended' | 'completed' | 'closed';

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  epc: string;
  site: string;
  region: string;
  startDate: string;
  plannedEndDate: string;
  constructionManagerId: string;
  qcManagerId: string;
  status: ProjectStatus;
  progress: number;
  description: string;
  memberIds: string[];
  createdAt: string;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  order: number;
}

export interface Discipline {
  id: string;
  name: string;
}

export type ControlPointType = 'H' | 'W' | 'R' | 'S' | 'I';

export interface QualityPlanItem {
  id: string;
  qualityPlanId: string;
  number: number;
  phaseId: string;
  disciplineId: string;
  activity: string;
  subActivity?: string;
  documentReference?: string;
  acceptanceCriteria?: string;
  controlMethod?: string;
  responsible?: string;
  frequency?: string;
  controlPoint: ControlPointType;
  holdPoint: boolean;
  witnessPoint: boolean;
  surveillance: boolean;
  inspection: boolean;
  record: string;
  itpReference?: string;
  procedure?: string;
  checklist?: string;
}

export interface QualityPlanRevision {
  id: string;
  qualityPlanId: string;
  revision: string;
  date: string;
  authorId: string;
  reason: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approverId?: string;
}

export interface QualityPlan {
  id: string;
  projectId: string;
  name: string;
  currentRevision: string;
  createdAt: string;
}

export type DIStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'info_requested'
  | 'accepted'
  | 'rejected'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'reported'
  | 'closed'
  | 'cancelled'
  | 'postponed';

export type InspectionResult = 'conform' | 'conform_with_obs' | 'non_conform' | 'postponed' | 'cancelled';

export interface InspectionRequest {
  id: string;
  number: string; // DI-YYYY-NNNNNN
  projectId: string;
  lot: string;
  phaseId: string;
  disciplineId: string;
  qualityPlanItemId: string;
  itpReference?: string;
  description: string;
  location: string;
  requestDate: string;
  desiredDate: string;
  requestedById: string;
  controlLevel: string;
  comments?: string;
  attachments: Attachment[];
  status: DIStatus;
  inspectorId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledLocation?: string;
  reviewComment?: string;
  result?: InspectionResult;
  resultComment?: string;
  checklistResults?: ChecklistResult[];
  observations?: string;
  reportId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistResult {
  point: string;
  requirement: string;
  result: 'C' | 'NC' | 'NA'; // Conform / Non Conform / Non Applicable
  comment?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // base64 for MVP
  uploadedAt: string;
}

export interface InspectionReport {
  id: string;
  number: string; // PV-YYYY-NNNNNN
  inspectionRequestId: string;
  projectId: string;
  date: string;
  inspectorId: string;
  constructionManagerId?: string;
  qcManagerId?: string;
  clientRepId?: string;
  result: InspectionResult;
  conclusion: string;
  signatures: { role: string; name: string; signedAt?: string }[];
  createdAt: string;
}

export type NCRStatus = 'open' | 'action_in_progress' | 'evidence_submitted' | 'under_verification' | 'rejected' | 'closed';

export interface NonConformity {
  id: string;
  number: string; // NCR-YYYY-NNNNNN
  projectId: string;
  reportId: string;
  inspectionRequestId: string;
  phaseId: string;
  disciplineId: string;
  description: string;
  requirement: string;
  reference?: string;
  date: string;
  responsibleId?: string;
  dueDate: string;
  correctiveAction?: string;
  cause?: string;
  evidence?: Attachment[];
  verifierId?: string;
  verificationComment?: string;
  status: NCRStatus;
  closedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  number: string;
  revision: string;
  category: string;
  date: string;
  authorId: string;
  phaseId?: string;
  disciplineId?: string;
  status: string;
  attachment?: Attachment;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  timestamp: string;
  details?: string;
}
