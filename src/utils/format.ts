import { format, parseISO, isBefore, isToday, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export const fmtDate = (iso?: string) => iso ? format(parseISO(iso), 'dd/MM/yyyy') : '-';
export const fmtDateTime = (iso?: string) => iso ? format(parseISO(iso), 'dd/MM/yyyy HH:mm') : '-';
export const fmtDateInput = (iso?: string) => {
  if (!iso) return '';
  try { return format(parseISO(iso), 'yyyy-MM-dd'); } catch { return iso.slice(0,10); }
};
export const fmtMonth = (iso?: string) => iso ? format(parseISO(iso), 'MMM yyyy', { locale: fr }) : '-';
export const daysAgo = (iso?: string) => iso ? differenceInDays(new Date(), parseISO(iso)) : 0;
export const isOverdue = (iso?: string) => iso ? isBefore(parseISO(iso), new Date()) && !isToday(parseISO(iso)) : false;
export const fmtBytes = (bytes?: number) => {
  if (!bytes) return '0 B';
  const u = ['B','KB','MB','GB']; const i = Math.floor(Math.log(bytes)/Math.log(1024));
  return `${(bytes/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`;
};

export const DI_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Brouillon', color: 'text-slate-700', bg: 'bg-slate-100' },
  submitted: { label: 'Soumise', color: 'text-blue-700', bg: 'bg-blue-100' },
  under_review: { label: 'En revue', color: 'text-amber-700', bg: 'bg-amber-100' },
  info_requested: { label: 'Infos compl.', color: 'text-orange-700', bg: 'bg-orange-100' },
  accepted: { label: 'Acceptée', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  rejected: { label: 'Rejetée', color: 'text-red-700', bg: 'bg-red-100' },
  planned: { label: 'Planifiée', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  in_progress: { label: 'En cours', color: 'text-purple-700', bg: 'bg-purple-100' },
  completed: { label: 'Terminée', color: 'text-slate-700', bg: 'bg-slate-200' },
  reported: { label: 'PV généré', color: 'text-teal-700', bg: 'bg-teal-100' },
  closed: { label: 'Clôturée', color: 'text-green-800', bg: 'bg-green-100' },
  cancelled: { label: 'Annulée', color: 'text-slate-600', bg: 'bg-slate-200' },
  postponed: { label: 'Reportée', color: 'text-yellow-700', bg: 'bg-yellow-100' },
};

export const NCR_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Ouvert', color: 'text-red-700', bg: 'bg-red-100' },
  action_in_progress: { label: 'Action en cours', color: 'text-amber-700', bg: 'bg-amber-100' },
  evidence_submitted: { label: 'Preuve soumise', color: 'text-blue-700', bg: 'bg-blue-100' },
  under_verification: { label: 'En vérification', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  rejected: { label: 'Rejeté', color: 'text-red-700', bg: 'bg-red-100' },
  closed: { label: 'Clôturé', color: 'text-green-800', bg: 'bg-green-100' },
};

export const PROJECT_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  preparation: { label: 'Préparation', color: 'text-slate-700', bg: 'bg-slate-100' },
  ongoing: { label: 'En cours', color: 'text-blue-700', bg: 'bg-blue-100' },
  suspended: { label: 'Suspendu', color: 'text-orange-700', bg: 'bg-orange-100' },
  completed: { label: 'Terminé', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  closed: { label: 'Clôturé', color: 'text-green-800', bg: 'bg-green-100' },
};

export const RESULT_LABELS: Record<string, string> = {
  conform: 'Conforme',
  conform_with_obs: 'Conforme avec observations',
  non_conform: 'Non conforme',
  postponed: 'Reportée',
  cancelled: 'Annulée',
};

export const CP_LABELS: Record<string, { label: string; color: string }> = {
  H: { label: 'H (Hold Point)', color: 'bg-red-100 text-red-800 border-red-300' },
  W: { label: 'W (Witness)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  R: { label: 'R (Review)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  S: { label: 'S (Surveillance)', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  I: { label: 'I (Inspection)', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  construction_manager: 'Responsable Construction',
  qc_manager: 'Responsable QC',
  qc_inspector: 'Inspecteur QC',
  client: 'Client / Superviseur',
};
