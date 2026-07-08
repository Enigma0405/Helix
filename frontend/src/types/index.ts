// ============================================================
// Project Helix — TypeScript Type Definitions
// ============================================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'analyst' | 'reviewer' | 'viewer';
  org_id: string;
  org_name?: string;
  avatar_url?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ============================================================
// Investigation
// ============================================================
export type InvestigationSeverity = 'critical' | 'high' | 'medium' | 'low';
export type InvestigationStatus = 'open' | 'in_progress' | 'pending_review' | 'closed';

export interface Investigation {
  id: string;
  title: string;
  description: string | null;
  severity: InvestigationSeverity;
  status: InvestigationStatus;
  created_by: string;
  created_by_name?: string | null;
  org_id: string;
  assignee_ids?: string[];
  reviewer_ids?: string[];
  created_at: string;
  updated_at: string;
  evidence_count?: number;
  hypothesis_count?: number;
  task_count?: number;
}

export interface CreateInvestigationDto {
  title: string;
  description: string;
  severity: InvestigationSeverity;
}

export interface UpdateInvestigationDto {
  title?: string;
  description?: string;
  severity?: InvestigationSeverity;
  status?: InvestigationStatus;
}

export interface InvestigationsListResponse {
  items: Investigation[];
  total: number;
  page: number;
  size: number;
}

export interface InvestigationFilters {
  status?: InvestigationStatus;
  severity?: InvestigationSeverity;
  search?: string;
  page?: number;
  size?: number;
}

// ============================================================
// Evidence
// ============================================================
export type EvidenceStatus = 'uploaded' | 'processing' | 'processed' | 'failed';

export interface EvidenceItem {
  id: string;
  investigation_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size?: number;
  status: EvidenceStatus;
  chunk_count?: number;
  error_message?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface EvidenceChunk {
  id: string;
  evidence_id: string;
  chunk_index: number;
  text: string;
  metadata: Record<string, unknown>;
  embedding_id?: string | null;
}

// ============================================================
// Hypothesis
// ============================================================
export type HypothesisStatus = 'pending' | 'accepted' | 'rejected' | 'modified';

export interface Citation {
  chunk_id: string;
  text: string;
  score: number;
  source: string;
  page?: number | null;
}

export interface Hypothesis {
  id: string;
  investigation_id: string;
  title: string;
  content: string;
  evidence_citations: Citation[];
  confidence_score: number | null;
  grounding_score: number | null;
  status: HypothesisStatus;
  created_at: string;
  updated_at?: string;
}

export interface GenerateHypothesesDto {
  investigation_id: string;
  query?: string;
  max_hypotheses?: number;
}

export interface UpdateHypothesisDto {
  status?: HypothesisStatus;
  title?: string;
  content?: string;
}

// ============================================================
// CAPA (Corrective and Preventive Action)
// ============================================================
export type CapaStatus = 'draft' | 'review' | 'approved';

export interface CAPA {
  id: string;
  investigation_id: string;
  content: string;
  status: CapaStatus;
  approved_by: string | null;
  approved_by_name?: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface GenerateCapaDto {
  investigation_id: string;
}

export interface UpdateCapaDto {
  content?: string;
  status?: CapaStatus;
}

// ============================================================
// Audit Log
// ============================================================
export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'approved'
  | 'rejected'
  | 'accepted'
  | 'evidence_uploaded'
  | 'evidence_processed'
  | 'hypotheses_generated'
  | 'capa_generated'
  | 'capa_approved';

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction | string;
  actor_id: string;
  actor_name?: string | null;
  timestamp: string;
  diff: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

// ============================================================
// Task
// ============================================================
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  investigation_id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string | null;
  assignee_name?: string | null;
  due_date?: string | null;
  created_at: string;
}

// ============================================================
// AI Provider / Runtime
// ============================================================
export interface AIProviderInfo {
  provider: string;
  model: string;
  hardware: string;
  status: 'online' | 'degraded' | 'offline';
}

// ============================================================
// Dashboard
// ============================================================
export interface DashboardStats {
  open_investigations: number;
  in_progress_investigations: number;
  pending_review_investigations: number;
  closed_this_month: number;
  total_evidence: number;
  total_hypotheses: number;
}

// ============================================================
// Generic API types
// ============================================================
export interface APIError {
  detail: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
