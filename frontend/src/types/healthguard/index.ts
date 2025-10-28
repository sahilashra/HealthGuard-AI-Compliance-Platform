// Core Types
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';
export type ProcessingStep = 'parsing' | 'analyzing' | 'generating' | 'complete';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

// Component Props
export interface HeroProps {
  filesProcessed?: number;
  testCases?: number;
  timeSaved?: string; // e.g., "40s"
}

export interface FileUploadProps {
  onFileUpload?: (file: File) => void;
  onUploadComplete?: (fileId: string) => void;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

export interface ComplianceScoreProps {
  score: number; // 0-100
  loading?: boolean;
  onScoreClick?: () => void;
}

export interface Violation {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  section: string;
  suggestedFix?: string;
  impact: string;
}

export interface ViolationsListProps {
  violations: Violation[];
  onViolationClick?: (violation: Violation) => void;
  loading?: boolean;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  complianceStandards: string[];
  priority: 'high' | 'medium' | 'low';
  selected?: boolean;
}

export interface TestCaseAccordionProps {
  testCases: TestCase[];
  onTestCaseSelect?: (id: string) => void;
  onCopy?: (testCase: TestCase) => void;
  selectedIds?: string[];
}

export interface ProcessingTimelineProps {
  currentStep: ProcessingStep;
  currentMessage?: string;
  steps?: Array<{
    id: ProcessingStep;
    label: string;
    description: string;
  }>;
}

export interface ExportButtonProps {
  selectedCount?: number;
  onExport?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface ImpactMetric {
  label: string;
  value: number;
  suffix?: string;
  icon?: React.ReactNode;
}

export interface ImpactMetricsProps {
  metrics: ImpactMetric[];
  animate?: boolean;
}

export interface BeforeAfterProps {
  beforeValue: string;
  afterValue: string;
  beforeLabel?: string;
  afterLabel?: string;
  metric?: string;
}

// Gap Analysis Types
export interface MissingRequirement {
  standard: string;
  requirement: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
}

export interface CoverageGap {
  area: string;
  current_coverage: string;
  target_coverage: string;
  action_items: string[];
}

export interface RiskArea {
  area: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigation: string;
}

export interface TraceabilityMatrix {
  requirements_count: number;
  test_cases_count: number;
  coverage_percentage: number;
  untested_requirements: string[];
}

export interface GapAnalysis {
  missing_requirements: MissingRequirement[];
  coverage_gaps: CoverageGap[];
  risk_areas: RiskArea[];
  traceability_matrix: TraceabilityMatrix;
}

export interface GapAnalysisProps {
  gapAnalysis: GapAnalysis | null;
  loading?: boolean;
}

// API Response Types
export interface AnalysisResult {
  complianceScore: number;
  violations: Violation[];
  testCases: TestCase[];
  gapAnalysis?: GapAnalysis;
  processingTime: number;
  recommendations: string[];
}

export interface UploadResponse {
  fileId: string;
  fileName: string;
  status: 'processing' | 'complete' | 'error';
  message?: string;
}
