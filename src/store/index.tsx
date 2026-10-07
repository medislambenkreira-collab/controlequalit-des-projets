import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import type { User, Project, Phase, Discipline, QualityPlan, QualityPlanItem, QualityPlanRevision, InspectionRequest, InspectionReport, NonConformity, Notification, Document, AuditLog, Attachment } from '../types';
import * as seed from './seedData';

const STORAGE_KEY = 'qc_app_state_v1';

export interface AppState {
  users: User[];
  currentUserId: string | null;
  projects: Project[];
  phases: Phase[];
  disciplines: Discipline[];
  qualityPlans: QualityPlan[];
  qualityPlanItems: QualityPlanItem[];
  qualityPlanRevisions: QualityPlanRevision[];
  inspectionRequests: InspectionRequest[];
  inspectionReports: InspectionReport[];
  nonConformities: NonConformity[];
  notifications: Notification[];
  documents: Document[];
  auditLogs: AuditLog[];
}

const initialState: AppState = {
  users: seed.seedUsers,
  currentUserId: null,
  projects: [seed.seedProject, seed.seedProject2],
  phases: seed.seedPhases,
  disciplines: seed.seedDisciplines,
  qualityPlans: [seed.seedQualityPlan, seed.seedQualityPlan2],
  qualityPlanItems: seed.seedQPItems,
  qualityPlanRevisions: [],
  inspectionRequests: [seed.seedDI1, seed.seedDI2, seed.seedDI3],
  inspectionReports: [seed.seedPV],
  nonConformities: [seed.seedNCR],
  notifications: [],
  documents: [],
  auditLogs: [],
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return initialState;
}

function saveState(s: AppState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

type Action =
  | { type: 'LOGIN'; userId: string }
  | { type: 'LOGOUT' }
  | { type: 'RESET' }
  | { type: 'ADD_USER'; user: User }
  | { type: 'UPDATE_USER'; user: User }
  | { type: 'DELETE_USER'; id: string }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'ADD_PHASE'; phase: Phase }
  | { type: 'UPDATE_PHASE'; phase: Phase }
  | { type: 'DELETE_PHASE'; id: string }
  | { type: 'ADD_DISCIPLINE'; discipline: Discipline }
  | { type: 'ADD_QP'; qp: QualityPlan }
  | { type: 'ADD_QP_ITEM'; item: QualityPlanItem }
  | { type: 'UPDATE_QP_ITEM'; item: QualityPlanItem }
  | { type: 'DELETE_QP_ITEM'; id: string }
  | { type: 'ADD_DI'; di: InspectionRequest }
  | { type: 'UPDATE_DI'; di: InspectionRequest }
  | { type: 'ADD_REPORT'; report: InspectionReport }
  | { type: 'ADD_NCR'; ncr: NonConformity }
  | { type: 'UPDATE_NCR'; ncr: NonConformity }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; id: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'ADD_AUDIT'; log: AuditLog }
  | { type: 'ADD_DOCUMENT'; doc: Document };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN': return { ...state, currentUserId: action.userId };
    case 'LOGOUT': return { ...state, currentUserId: null };
    case 'RESET': return initialState;
    case 'ADD_USER': return { ...state, users: [...state.users, action.user] };
    case 'UPDATE_USER': return { ...state, users: state.users.map(u => u.id === action.user.id ? action.user : u) };
    case 'DELETE_USER': return { ...state, users: state.users.filter(u => u.id !== action.id) };
    case 'ADD_PROJECT': return { ...state, projects: [...state.projects, action.project] };
    case 'UPDATE_PROJECT': return { ...state, projects: state.projects.map(p => p.id === action.project.id ? action.project : p) };
    case 'DELETE_PROJECT': return { ...state, projects: state.projects.filter(p => p.id !== action.id) };
    case 'ADD_PHASE': return { ...state, phases: [...state.phases, action.phase] };
    case 'UPDATE_PHASE': return { ...state, phases: state.phases.map(p => p.id === action.phase.id ? action.phase : p) };
    case 'DELETE_PHASE': return { ...state, phases: state.phases.filter(p => p.id !== action.id) };
    case 'ADD_DISCIPLINE': return { ...state, disciplines: [...state.disciplines, action.discipline] };
    case 'ADD_QP': return { ...state, qualityPlans: [...state.qualityPlans, action.qp] };
    case 'ADD_QP_ITEM': return { ...state, qualityPlanItems: [...state.qualityPlanItems, action.item] };
    case 'UPDATE_QP_ITEM': return { ...state, qualityPlanItems: state.qualityPlanItems.map(i => i.id === action.item.id ? action.item : i) };
    case 'DELETE_QP_ITEM': return { ...state, qualityPlanItems: state.qualityPlanItems.filter(i => i.id !== action.id) };
    case 'ADD_DI': return { ...state, inspectionRequests: [...state.inspectionRequests, action.di] };
    case 'UPDATE_DI': return { ...state, inspectionRequests: state.inspectionRequests.map(d => d.id === action.di.id ? action.di : d) };
    case 'ADD_REPORT': return { ...state, inspectionReports: [...state.inspectionReports, action.report] };
    case 'ADD_NCR': return { ...state, nonConformities: [...state.nonConformities, action.ncr] };
    case 'UPDATE_NCR': return { ...state, nonConformities: state.nonConformities.map(n => n.id === action.ncr.id ? action.ncr : n) };
    case 'ADD_NOTIFICATION': return { ...state, notifications: [action.notification, ...state.notifications] };
    case 'MARK_NOTIFICATION_READ': return { ...state, notifications: state.notifications.map(n => n.id === action.id ? { ...n, read: true } : n) };
    case 'MARK_ALL_NOTIFICATIONS_READ': return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
    case 'ADD_AUDIT': return { ...state, auditLogs: [action.log, ...state.auditLogs] };
    case 'ADD_DOCUMENT': return { ...state, documents: [...state.documents, action.doc] };
    default: return state;
  }
}

interface StoreContextValue {
  state: AppState;
  currentUser: User | null;
  dispatch: React.Dispatch<Action>;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  notify: (userId: string, title: string, message: string, link?: string) => void;
  log: (entityType: string, entityId: string, action: string, details?: string) => void;
  genId: () => string;
  genDINumber: () => string;
  genPVNumber: () => string;
  genNCRNumber: () => string;
  userById: (id?: string) => User | undefined;
  projectById: (id?: string) => Project | undefined;
  phaseById: (id?: string) => Phase | undefined;
  disciplineById: (id?: string) => Discipline | undefined;
  qpItemById: (id?: string) => QualityPlanItem | undefined;
  resetData: () => void;
  visibleProjects: Project[];
  visibleDI: InspectionRequest[];
  hasRole: (...roles: User['role'][]) => boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function pad(n: number, width: number) { return String(n).padStart(width, '0'); }

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  useEffect(() => { saveState(state); }, [state]);

  const currentUser = useMemo(() => state.users.find(u => u.id === state.currentUserId) || null, [state.users, state.currentUserId]);

  const login = useCallback((email: string, password: string): User | null => {
    const u = state.users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === password && x.active);
    if (u) dispatch({ type: 'LOGIN', userId: u.id });
    return u || null;
  }, [state.users]);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  const notify = useCallback((userId: string, title: string, message: string, link?: string) => {
    dispatch({ type: 'ADD_NOTIFICATION', notification: { id: `notif_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, userId, title, message, link, read: false, createdAt: new Date().toISOString() } });
  }, []);

  const log = useCallback((entityType: string, entityId: string, action: string, details?: string) => {
    if (!state.currentUserId) return;
    dispatch({ type: 'ADD_AUDIT', log: { id: `log_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, entityType, entityId, action, userId: state.currentUserId, timestamp: new Date().toISOString(), details } });
  }, [state.currentUserId]);

  const genId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
  const year = new Date().getFullYear();
  const genDINumber = () => `DI-${year}-${pad(state.inspectionRequests.filter(d=>d.number.startsWith(`DI-${year}`)).length+1,6)}`;
  const genPVNumber = () => `PV-${year}-${pad(state.inspectionReports.filter(r=>r.number.startsWith(`PV-${year}`)).length+1,6)}`;
  const genNCRNumber = () => `NCR-${year}-${pad(state.nonConformities.filter(n=>n.number.startsWith(`NCR-${year}`)).length+1,5)}`;

  const userById = (id?: string) => state.users.find(u => u.id === id);
  const projectById = (id?: string) => state.projects.find(p => p.id === id);
  const phaseById = (id?: string) => state.phases.find(p => p.id === id);
  const disciplineById = (id?: string) => state.disciplines.find(d => d.id === id);
  const qpItemById = (id?: string) => state.qualityPlanItems.find(i => i.id === id);

  const resetData = () => { dispatch({ type: 'RESET' }); localStorage.removeItem(STORAGE_KEY); };

  const visibleProjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return state.projects;
    return state.projects.filter(p => p.memberIds.includes(currentUser.id) || p.constructionManagerId === currentUser.id || p.qcManagerId === currentUser.id);
  }, [currentUser, state.projects]);

  const visibleDI = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin' || currentUser.role === 'qc_manager' || currentUser.role === 'client') return state.inspectionRequests.filter(di => visibleProjects.some(p => p.id === di.projectId));
    if (currentUser.role === 'construction_manager') return state.inspectionRequests.filter(di => di.requestedById === currentUser.id || visibleProjects.some(p => p.id === di.projectId && p.constructionManagerId === currentUser.id));
    if (currentUser.role === 'qc_inspector') return state.inspectionRequests.filter(di => di.inspectorId === currentUser.id);
    return state.inspectionRequests;
  }, [currentUser, state.inspectionRequests, visibleProjects]);

  const hasRole = useCallback((...roles: User['role'][]) => currentUser ? roles.includes(currentUser.role) : false, [currentUser]);

  const value: StoreContextValue = {
    state, currentUser, dispatch, login, logout, notify, log, genId, genDINumber, genPVNumber, genNCRNumber,
    userById, projectById, phaseById, disciplineById, qpItemById, resetData, visibleProjects, visibleDI, hasRole,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// Helper to extract file data as base64 data URL for attachments (MVP only)
export function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        name: file.name, size: file.size, type: file.type,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
