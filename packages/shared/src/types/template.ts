export interface TemplateSchema {
  template_name: string;
  style: 'formal' | 'modern' | 'creative' | 'minimal';
  branding: {
    // Core Colors
    primary_color: string;
    secondary_color: string;
    accent_color?: string;
    success_color?: string;
    warning_color?: string;
    error_color?: string;

    // Neutral Color Palette
    neutral_colors?: {
      gray100?: string;
      gray200?: string;
      gray300?: string;
      gray700?: string;
      gray900?: string;
    };

    // Typography
    heading_font: string;
    body_font: string;
    heading_sizes?: {
      h1?: string;
      h2?: string;
      h3?: string;
    };
    heading_weights?: {
      h1?: number;
      h2?: number;
      h3?: number;
    };
    line_heights?: {
      heading?: number;
      body?: number;
    };

    // Layout & Spacing
    section_spacing?: string;
    paragraph_spacing?: string;
    visual_element_spacing?: string;

    // Visual Style Preferences
    visual_style?: 'modern' | 'formal' | 'creative' | 'minimal';
    color_intensity?: 'subtle' | 'balanced' | 'vibrant';
  };
  assets?: {
    cover_image?: string;
    company_logo?: string;
    client_logo?: string;
  };
  sections: TemplateSection[];

  // Enhanced Table Styling
  table_styles: {
    header_bg_color: string;
    header_text_color: string;
    alternating_rows: boolean;
    row_odd_bg?: string;
    row_even_bg?: string;
    border_color?: string;
    border_width?: string;
    cell_padding?: string;
    font_size?: string;
  };

  // Enhanced Chart Styling
  chart_styles?: {
    colors: string[];
    font_family?: string;
    grid_color?: string;
    background_color?: string;
  };

  // Diagram Theme Configuration
  diagram_styles?: {
    theme?: 'default' | 'forest' | 'dark' | 'neutral';
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
  };

  // Callout Box Styling
  callout_styles?: {
    info?: { border: string; background: string; icon: string };
    success?: { border: string; background: string; icon: string };
    warning?: { border: string; background: string; icon: string };
    tip?: { border: string; background: string; icon: string };
    note?: { border: string; background: string; icon: string };
  };

  signature_block?: {
    required: boolean;
    parties: number;
    copies_per_party: number;
  };
}

export interface TemplateSection {
  order: number;
  id: string;
  number?: string;
  title: string;
  type: 'heading1' | 'heading2' | 'heading3' | 'special' | 'auto_generated';
  content_type?: 'paragraphs' | 'bullets' | 'table' | 'mixed' | 'chart' | 'diagram';
  has_subsections?: boolean;
  required?: boolean;
  purpose?: string;
  supports_chart?: boolean;
  supports_diagram?: boolean;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  schema: TemplateSchema;
  styles?: any;
  assets?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
