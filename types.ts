
export interface Apprentice {
  id: string;
  documentType: string;
  documentNumber: string;
  expeditionCity: string;
  fullName: string;
  initials: string;
  status: 'En formación' | 'Retirado' | 'Certificado';
  approvedCompetencies: number;
  totalCompetencies: number;
  progressPercentage: number;
  photoUrl?: string;
  submissions?: GuideSubmission[]; // Added to track student work
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  type: 'INFO' | 'ALERT';
  date: string;
}

export interface AttendanceRecord {
  date: string;
  evidenceUrl?: string; // NEW: Photo of the class with watermark
  records: {
    [apprenticeId: string]: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  };
}

export interface CompetencyResult {
  id: string;
  code: string;
  description: string;
  status: 'APROBADO' | 'POR EVALUAR';
}

export interface Competency {
  id: string;
  number: string;
  title: string;
  resultsCount: number;
  results: CompetencyResult[];
  isLocked?: boolean;
}

export type DocumentType = 'GUIA' | 'PTC' | 'LDC';

export interface EvaluationItem {
  id: string;
  evidence: string;      // Col 1: Description
  criteria: string;      // Col 2: Criteria
  technique: string;     // Col 3: Technique
  instrument: string;    // Col 3: Instrument
}

// Generic Grid for LDC (Excel-like - Legacy support)
export interface GridContent {
  title?: string;
  headers: string[];
  rows: string[][];
}

// New Structured Checklist Content (LDC)
export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ChecklistContent {
  program: string;
  competency: string;
  rap: string;
  criteria: string;
  instructorName: string;
  evidenceType: 'DESEMPENO' | 'PRODUCTO';
  activityDescription: string;
  items: ChecklistItem[];
}

// Specific Structure for PTC
export interface PTCRow {
  id: string;
  rap: string;
  activity: string;
  deliveryType: 'FISICA' | 'DIGITAL' | 'AMBOS' | null;
  deliveryDate: string;
  delivered: 'SI' | 'NO' | null;
}

export interface PTCContent {
  date: string;
  projectCode: string;
  phase: string;
  instructorName: string;
  rows: PTCRow[];
  instructorSignature?: string; // URL or Base64 (Static/Template)
}

export interface GuideContent {
  reflection: string;       // 3.1
  reflectionImage?: string; // 3.1 Image (Base64 or URL)
  contextualization: string;// 3.2
  appropriation: string;    // 3.3
  transfer: string;         // 3.4
  evaluations: EvaluationItem[]; // 4. Structured Evaluation Grid
}

export interface FichaDocument {
  id: string;
  title: string;
  type: DocumentType;
  uploadDate: string;
  fileName: string;
  fileUrl?: string; 
  guideNumber?: string;
  guideContent?: GuideContent; // Structured content for Guides
  gridContent?: GridContent;   // Legacy LDC
  checklistContent?: ChecklistContent; // New Structured LDC
  ptcContent?: PTCContent;     // Structured content for PTC
}

export interface Ficha {
  id: string;
  number: string;
  program: string;
  startDate?: string; // NEW: Start Date of the program
  endDate?: string;   // NEW: End Date of the program
  apprentices: Apprentice[];
  documents: FichaDocument[];
  attendanceHistory?: AttendanceRecord[]; // NEW: To store history
  visible?: boolean; // NEW: Controls visibility for Coordinator
}

// Interactive Guide Types
export interface GuideSection {
  id: string;
  title: string;
  content: string;
  imageUrl?: string; // Content image provided by instructor
  isActivity: boolean;
  evaluationGrid?: EvaluationItem[]; // Special field for section 4
}

export interface GuideResponse {
  sectionId: string;
  textResponse: string;
  imageUrls: string[]; // Can be images or generic file URLs
}

export interface GuideSubmission {
  guideId: string;
  responses: GuideResponse[];
  signature?: string; 
  signedAt?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  instructorSignature?: string; // New: For the instructor to sign off
  instructorSignedAt?: string;
  // For Checklist (LDC) grading
  checklistGrades?: Record<string, 'CUMPLE' | 'NO_CUMPLE'>;
  checklistObservations?: Record<string, string>;
  checklistResult?: 'CUMPLE' | 'NO_CUMPLE';
}
