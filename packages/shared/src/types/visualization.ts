export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'radar'
  | 'polarArea';

export type DiagramType =
  | 'flowchart'
  | 'sequence'
  | 'gantt'
  | 'architecture'
  | 'erDiagram';

export interface ChartConfig {
  type: ChartType;
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
  options?: any;
}

export interface DiagramConfig {
  type: DiagramType;
  title: string;
  code: string; // Mermaid code
}

export interface Visualization {
  id: string;
  proposalId: string;
  sectionId: string;
  type: 'chart' | 'diagram';
  config: ChartConfig | DiagramConfig;
  createdAt: Date;
  updatedAt?: Date;
}

export interface GenerateChartRequest {
  proposalId: string;
  sectionId: string;
  chartType: ChartType;
  title: string;
  context?: string; // Context for AI generation
}

export interface GenerateDiagramRequest {
  proposalId: string;
  sectionId: string;
  diagramType: DiagramType;
  description: string;
}
