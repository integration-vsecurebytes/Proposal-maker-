export interface Proposal {
  id: string;
  templateId: string;
  clientName: string;
  clientCompany: string;
  projectTitle: string;
  projectType?: string;
  scope?: string;
  objectives?: string;
  budget?: string;
  timeline?: string;
  technologies?: string[];
  generatedContent?: GeneratedContent;
  visualizations?: VisualizationConfig;
  placeholders?: Record<string, string>;
  branding?: BrandingConfig;
  status: 'draft' | 'in_progress' | 'generated' | 'reviewed' | 'sent';
  createdAt: Date;
  updatedAt?: Date;
}

export interface GeneratedContent {
  metadata: {
    client_name: string;
    company_name: string;
    project_title: string;
    date: string;
  };
  executive_summary: {
    problem_statement: string;
    solution_overview: string;
    technologies: string[];
  };
  scope: {
    sections: Array<{
      number: string;
      title: string;
      items: any[];
    }>;
    out_of_scope: string[];
  };
  solution_overview: {
    components: Array<{
      number: string;
      title: string;
      key_components: string[];
      technical_flow?: string[];
    }>;
  };
  delivery_framework: {
    phases: Array<{
      name: string;
      points: string[];
    }>;
  };
  work_breakdown: {
    phases: Array<{
      phase_number: string;
      phase_name: string;
      activities: string[];
      deliverables: string[];
    }>;
  };
  pricing: {
    currency: string;
    items: Array<{
      phase: string;
      duration: string;
      amount: string;
    }>;
    total: string;
    notes: string;
  };
  payment_schedule: {
    milestones: Array<{
      id: string;
      description: string;
      percentage: number;
    }>;
  };
  governance: {
    intro: string;
    governance_points: Array<{
      title: string;
      description: string;
    }>;
    risks: Array<{
      risk: string;
      mitigation: string;
    }>;
  };
  assumptions: string[];
  customer_obligations: string[];
  legal: {
    client_info: string;
    limitation_of_scope: string;
    confidentiality: string;
    legal_notice: string;
  };
  diagrams?: {
    architecture?: string;
    flow?: string;
    timeline?: string;
    sequence?: string;
  };
  charts?: Record<string, any>; // Use visualization types instead
}

export interface VisualizationConfig {
  sections: Record<string, {
    preferredType: 'table' | 'chart' | 'diagram' | 'none';
    chartType?: 'bar' | 'pie' | 'line' | 'radar';
    diagramType?: 'architecture' | 'flow' | 'gantt' | 'sequence';
    showVisualization: boolean;
    customColors?: string[];
  }>;
}

export interface DynamicPlaceholders {
  '{{company_name}}': string;
  '{{company_logo}}': string;
  '{{company_website}}': string;
  '{{client_name}}': string;
  '{{client_company}}': string;
  '{{client_logo}}': string;
  '{{project_title}}': string;
  '{{project_subtitle}}': string;
  '{{date}}': string;
  '{{start_date}}': string;
  '{{timeline}}': string;
  '{{currency}}': string;
  '{{total_amount}}': string;
  '{{version}}': string;
}

export interface BrandingConfig {
  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  successColor?: string;
  warningColor?: string;

  // Typography
  fontFamily?: string;
  headingFont?: string;

  // Logos
  companyLogo?: string;
  clientLogo?: string;

  // Header customization
  header?: {
    enabled: boolean;
    logo?: string;
    logoPosition?: 'left' | 'center' | 'right';
    text?: string;
    textPosition?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    height?: number;
  };

  // Footer customization
  footer?: {
    enabled: boolean;
    logo?: string;
    logoPosition?: 'left' | 'center' | 'right';
    companyInfo?: string;
    contactInfo?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    backgroundColor?: string;
    height?: number;
    showPageNumbers?: boolean;
  };

  // Thank you slide
  thankYouSlide?: {
    enabled: boolean;
    title?: string;
    message?: string;
    logo?: string;
    backgroundColor?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
  };

  // Back cover
  backCover?: {
    enabled: boolean;
    logo?: string;
    tagline?: string;
    socialMedia?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      website?: string;
    };
    backgroundColor?: string;
    backgroundImage?: string;
  };

  // Cover page
  coverPage?: {
    layout?: 'minimal' | 'standard' | 'modern' | 'elegant';
    showClientLogo?: boolean;
    showCompanyLogo?: boolean;
    backgroundImage?: string;
    backgroundColor?: string;
  };
}
