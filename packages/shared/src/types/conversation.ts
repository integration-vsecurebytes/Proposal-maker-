export interface Conversation {
  id: string;
  proposalId: string;
  messages: Message[];
  extractedData: ExtractedData;
  currentPhase: ConversationPhase;
  isComplete: boolean;
  createdAt: Date;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ExtractedData {
  // Client Information
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientIndustry?: string;
  industry?: string;

  // Project Details
  projectTitle?: string;
  projectType?: string;
  objectives?: string;
  requirements?: string[];
  deliverables?: string[];

  // Scope
  scope?: string;
  inScope?: string[];
  outOfScope?: string[];
  assumptions?: string[];

  // Timeline
  timeline?: string;
  startDate?: string;
  endDate?: string;
  milestones?: Array<{
    name: string;
    date: string;
    description?: string;
  }>;

  // Budget
  budget?: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  paymentTerms?: string;
  paymentSchedule?: Array<{
    milestone: string;
    percentage: number;
    amount?: number;
  }>;

  // Visualization Preferences
  needsCharts?: boolean;
  chartTypes?: string[];
  needsDiagrams?: boolean;
  diagramTypes?: string[];

  // Technologies
  technologies?: string[];
  platforms?: string[];
  integrations?: string[];
  teamSize?: number;

  // Additional
  painPoints?: string[];
  riskFactors?: string[];
  successCriteria?: string[];

  // Technical Architecture (NEW)
  systemComponents?: string[];
  technologyStack?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    infrastructure?: string[];
  };
  securityRequirements?: string[];
  complianceNeeds?: string[];
  scalabilityRequirements?: string;

  // Methodology (NEW)
  developmentMethodology?: 'agile' | 'waterfall' | 'hybrid' | 'custom';
  qualityAssurance?: string;
  riskManagement?: string;
  communicationApproach?: string;

  // Team & Resources (NEW)
  teamStructure?: Array<{
    role: string;
    count: number;
    skills?: string[];
    allocation?: number; // percentage
  }>;
  keyPersonnel?: Array<{
    name?: string;
    role: string;
    expertise: string[];
  }>;
  clientResponsibilities?: string[];

  // Detailed Deliverables (EXPANDED)
  deliverablesByPhase?: Array<{
    phase: string;
    deliverables: string[];
    acceptanceCriteria?: string[];
  }>;
  documentationRequirements?: string[];
  trainingRequirements?: string[];

  // Stakeholders (NEW)
  keyStakeholders?: Array<{
    name?: string;
    role: string;
    department?: string;
    decisionLevel?: 'primary' | 'secondary' | 'informed';
  }>;
  approvalWorkflow?: string;
  communicationPlan?: string;

  // Success Metrics (NEW)
  kpis?: Array<{
    metric: string;
    target: string;
    measurement: string;
  }>;
  performanceBenchmarks?: string[];
  roiExpectations?: string;

  // Risks (EXPANDED)
  identifiedRisks?: Array<{
    risk: string;
    likelihood: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  dependencies?: string[];
  contingencyPlans?: string[];

  // Visual Preferences (EXPANDED)
  preferredChartTypes?: {
    budget?: string[];
    timeline?: string[];
    technical?: string[];
  };
  diagramComplexity?: 'simple' | 'moderate' | 'detailed';
  colorSchemePreference?: string;
  brandingGuidelines?: string;
}

export type ConversationPhase =
  | 'client_info'
  | 'project_details'
  | 'technical_architecture'
  | 'scope'
  | 'methodology'
  | 'team_resources'
  | 'detailed_deliverables'
  | 'timeline'
  | 'stakeholders'
  | 'success_metrics'
  | 'risks'
  | 'budget'
  | 'visual_preferences'
  | 'final_review'
  | 'complete';

export interface ConversationStartRequest {
  templateId: string;
}

export interface ConversationChatRequest {
  conversationId: string;
  message: string;
}

export interface ConversationResponse {
  conversationId: string;
  message: string;
  extractedData: ExtractedData;
  currentPhase: ConversationPhase;
  isComplete: boolean;
  progress: number; // 0-100
  phaseDescription?: string;
}
