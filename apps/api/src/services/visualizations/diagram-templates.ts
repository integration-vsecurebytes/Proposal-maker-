import { ExtractedData } from '@proposal-gen/shared';

export interface MermaidDiagram {
  type: 'mermaid';
  code: string;
  caption?: string;
  diagramType: 'flowchart' | 'sequence' | 'gantt' | 'architecture' | 'er' | 'mindmap' | 'timeline';
}

export class DiagramGenerationService {
  /**
   * Generate system architecture diagram
   */
  generateSystemArchitecture(extractedData: ExtractedData): MermaidDiagram | null {
    if (!extractedData.systemComponents?.length && !extractedData.technologyStack) {
      return null;
    }

    let code = 'graph TB\n';
    code += '    subgraph "Client Layer"\n';

    if (extractedData.technologyStack?.frontend?.length) {
      extractedData.technologyStack.frontend.forEach((tech, idx) => {
        code += `        FE${idx}["${tech}"]\n`;
      });
    } else {
      code += '        FE0["Web Application"]\n';
    }

    code += '    end\n\n';
    code += '    subgraph "Application Layer"\n';

    if (extractedData.technologyStack?.backend?.length) {
      extractedData.technologyStack.backend.forEach((tech, idx) => {
        code += `        BE${idx}["${tech}"]\n`;
      });
    } else {
      code += '        BE0["API Server"]\n';
    }

    code += '    end\n\n';
    code += '    subgraph "Data Layer"\n';

    if (extractedData.technologyStack?.database?.length) {
      extractedData.technologyStack.database.forEach((tech, idx) => {
        code += `        DB${idx}[("${tech}")]\n`;
      });
    } else {
      code += '        DB0[("Database")]\n';
    }

    code += '    end\n\n';

    // Add connections
    code += '    FE0 --> BE0\n';
    code += '    BE0 --> DB0\n';

    // Add integrations if available
    if (extractedData.integrations?.length) {
      code += '\n    subgraph "External Systems"\n';
      extractedData.integrations.forEach((integration, idx) => {
        code += `        EXT${idx}["${integration.system}"]\n`;
      });
      code += '    end\n\n';
      extractedData.integrations.forEach((_, idx) => {
        code += `    BE0 -.->|"${extractedData.integrations![idx].type}"| EXT${idx}\n`;
      });
    }

    return {
      type: 'mermaid',
      code,
      caption: 'System Architecture Overview',
      diagramType: 'architecture',
    };
  }

  /**
   * Generate project workflow/methodology flowchart
   */
  generateProjectWorkflow(extractedData: ExtractedData): MermaidDiagram | null {
    if (!extractedData.developmentMethodology) {
      return null;
    }

    const methodology = extractedData.developmentMethodology.toLowerCase();
    let code = '';

    if (methodology === 'agile') {
      code = `graph LR
    A[Product Backlog] --> B[Sprint Planning]
    B --> C[Sprint Backlog]
    C --> D[Daily Standup]
    D --> E[Development]
    E --> D
    E --> F[Testing/QA]
    F --> G[Sprint Review]
    G --> H[Sprint Retrospective]
    H --> I{More Work?}
    I -->|Yes| B
    I -->|No| J[Release]

    style A fill:#e1f5ff
    style J fill:#d4edda`;
    } else if (methodology === 'waterfall') {
      code = `graph TD
    A[Requirements] --> B[Design]
    B --> C[Implementation]
    C --> D[Verification]
    D --> E[Deployment]
    E --> F[Maintenance]

    style A fill:#e1f5ff
    style F fill:#d4edda`;
    } else {
      // Generic workflow
      code = `graph LR
    A[Planning] --> B[Design]
    B --> C[Development]
    C --> D[Testing]
    D --> E[Deployment]
    E --> F[Review]
    F --> G{Iteration?}
    G -->|Yes| A
    G -->|No| H[Complete]

    style A fill:#e1f5ff
    style H fill:#d4edda`;
    }

    return {
      type: 'mermaid',
      code,
      caption: `${extractedData.developmentMethodology} Development Workflow`,
      diagramType: 'flowchart',
    };
  }

  /**
   * Generate team organization chart
   */
  generateTeamStructure(extractedData: ExtractedData): MermaidDiagram | null {
    if (!extractedData.teamStructure?.length && !extractedData.keyPersonnel?.length) {
      return null;
    }

    let code = 'graph TD\n';
    code += '    PM["Project Manager"]\n';

    if (extractedData.teamStructure && extractedData.teamStructure.length > 0) {
      extractedData.teamStructure.forEach((member, idx) => {
        const roleId = `R${idx}`;
        code += `    ${roleId}["${member.role} (${member.count})"]\n`;
        code += `    PM --> ${roleId}\n`;
      });
    }

    if (extractedData.keyPersonnel && extractedData.keyPersonnel.length > 0) {
      code += '\n';
      extractedData.keyPersonnel.forEach((person, idx) => {
        const personId = `KP${idx}`;
        code += `    ${personId}["${person.role}\\n${person.name || 'TBD'}"]\n`;
        code += `    PM --> ${personId}\n`;
      });
    }

    code += '\n    style PM fill:#ffd700';

    return {
      type: 'mermaid',
      code,
      caption: 'Team Organization Structure',
      diagramType: 'flowchart',
    };
  }

  /**
   * Generate integration flow diagram
   */
  generateIntegrationFlow(extractedData: ExtractedData): MermaidDiagram | null {
    if (!extractedData.integrations?.length) {
      return null;
    }

    let code = 'sequenceDiagram\n';
    code += '    participant Client\n';
    code += '    participant API\n';

    extractedData.integrations.forEach((integration) => {
      const extSystem = integration.system.replace(/\s+/g, '');
      code += `    participant ${extSystem}\n`;
    });

    code += '\n    Client->>API: Request\n';

    extractedData.integrations.forEach((integration) => {
      const extSystem = integration.system.replace(/\s+/g, '');
      code += `    API->>${extSystem}: ${integration.type}\n`;
      code += `    ${extSystem}-->>API: Response\n`;
    });

    code += '    API-->>Client: Final Response\n';

    return {
      type: 'mermaid',
      code,
      caption: 'System Integration Flow',
      diagramType: 'sequence',
    };
  }

  /**
   * Generate timeline/Gantt chart
   */
  generateTimelineRoadmap(extractedData: ExtractedData): MermaidDiagram | null {
    if (!extractedData.deliverablesByPhase?.length && !extractedData.milestones?.length) {
      return null;
    }

    const startDate = extractedData.startDate || new Date().toISOString().split('T')[0];
    let code = `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD

    section Phases\n`;

    if (extractedData.deliverablesByPhase && extractedData.deliverablesByPhase.length > 0) {
      extractedData.deliverablesByPhase.forEach((phase, idx) => {
        // Calculate dates (simple distribution)
        const phaseId = `phase${idx}`;
        code += `    ${phase.phase} :${phaseId}, ${startDate}, 30d\n`;
      });
    }

    if (extractedData.milestones && extractedData.milestones.length > 0) {
      code += '\n    section Milestones\n';
      extractedData.milestones.forEach((milestone) => {
        const milestoneDate = milestone.date || startDate;
        code += `    ${milestone.name} :milestone, ${milestoneDate}, 0d\n`;
      });
    }

    return {
      type: 'mermaid',
      code,
      caption: 'Project Timeline & Roadmap',
      diagramType: 'gantt',
    };
  }

  /**
   * Generate deployment architecture diagram
   */
  generateDeploymentDiagram(extractedData: ExtractedData): MermaidDiagram | null {
    if (!extractedData.technologyStack?.infrastructure?.length) {
      return null;
    }

    let code = 'graph TB\n';
    code += '    subgraph "Infrastructure"\n';

    extractedData.technologyStack.infrastructure.forEach((tech, idx) => {
      code += `        INFRA${idx}["${tech}"]\n`;
    });

    code += '    end\n\n';
    code += '    subgraph "Application"\n';

    if (extractedData.technologyStack.backend?.length) {
      code += '        APP["Application Servers"]\n';
    }

    if (extractedData.technologyStack.database?.length) {
      code += '        DB[("Database Cluster")]\n';
    }

    code += '    end\n\n';

    code += '    INFRA0 --> APP\n';
    code += '    APP --> DB\n';

    return {
      type: 'mermaid',
      code,
      caption: 'Deployment Architecture',
      diagramType: 'architecture',
    };
  }

  /**
   * Generate stakeholder mindmap
   */
  generateStakeholderMap(extractedData: ExtractedData): MermaidDiagram | null {
    if (!extractedData.keyStakeholders?.length) {
      return null;
    }

    let code = 'mindmap\n';
    code += '  root((Project Stakeholders))\n';

    // Group by decision level
    const primary = extractedData.keyStakeholders.filter(s => s.decisionLevel === 'primary');
    const secondary = extractedData.keyStakeholders.filter(s => s.decisionLevel === 'secondary');
    const informed = extractedData.keyStakeholders.filter(s => s.decisionLevel === 'informed' || !s.decisionLevel);

    if (primary.length > 0) {
      code += '    Primary Decision Makers\n';
      primary.forEach(s => {
        code += `      ${s.role}\n`;
      });
    }

    if (secondary.length > 0) {
      code += '    Secondary Stakeholders\n';
      secondary.forEach(s => {
        code += `      ${s.role}\n`;
      });
    }

    if (informed.length > 0) {
      code += '    Informed Parties\n';
      informed.forEach(s => {
        code += `      ${s.role}\n`;
      });
    }

    return {
      type: 'mermaid',
      code,
      caption: 'Stakeholder Map',
      diagramType: 'mindmap',
    };
  }

  /**
   * Generate risk flowchart
   */
  generateRiskFlowchart(extractedData: ExtractedData): MermaidDiagram | null {
    if (!extractedData.identifiedRisks?.length) {
      return null;
    }

    // Create a risk management process flowchart
    let code = `graph TD
    A[Identify Risk] --> B{Assess Impact}
    B -->|High| C[High Priority]
    B -->|Medium| D[Medium Priority]
    B -->|Low| E[Low Priority]

    C --> F[Immediate Mitigation]
    D --> G[Plan Mitigation]
    E --> H[Monitor]

    F --> I[Document & Track]
    G --> I
    H --> I

    I --> J{Risk Resolved?}
    J -->|No| K[Adjust Strategy]
    J -->|Yes| L[Close Risk]
    K --> B

    style C fill:#ffcccc
    style D fill:#ffffcc
    style E fill:#ccffcc
    style L fill:#d4edda`;

    return {
      type: 'mermaid',
      code,
      caption: 'Risk Management Process',
      diagramType: 'flowchart',
    };
  }

  /**
   * Generate project overview mindmap
   */
  generateProjectOverviewMindmap(extractedData: ExtractedData): MermaidDiagram | null {
    if (!extractedData.projectTitle) {
      return null;
    }

    let code = 'mindmap\n';
    code += `  root((${extractedData.projectTitle}))\n`;

    if (extractedData.objectives) {
      code += '    Objectives\n';
      code += `      ${extractedData.objectives.substring(0, 50)}...\n`;
    }

    if (extractedData.deliverables?.length) {
      code += '    Deliverables\n';
      extractedData.deliverables.slice(0, 3).forEach(d => {
        code += `      ${d}\n`;
      });
    }

    if (extractedData.technologies?.length) {
      code += '    Technologies\n';
      extractedData.technologies.slice(0, 3).forEach(t => {
        code += `      ${t}\n`;
      });
    }

    if (extractedData.successCriteria?.length) {
      code += '    Success Criteria\n';
      extractedData.successCriteria.slice(0, 3).forEach(s => {
        code += `      ${s}\n`;
      });
    }

    return {
      type: 'mermaid',
      code,
      caption: 'Project Overview',
      diagramType: 'mindmap',
    };
  }

  /**
   * Generate all applicable diagrams from extracted data
   */
  generateAllDiagrams(extractedData: ExtractedData): MermaidDiagram[] {
    const diagrams: MermaidDiagram[] = [];

    const overviewMindmap = this.generateProjectOverviewMindmap(extractedData);
    if (overviewMindmap) diagrams.push(overviewMindmap);

    const systemArchitecture = this.generateSystemArchitecture(extractedData);
    if (systemArchitecture) diagrams.push(systemArchitecture);

    const projectWorkflow = this.generateProjectWorkflow(extractedData);
    if (projectWorkflow) diagrams.push(projectWorkflow);

    const teamStructure = this.generateTeamStructure(extractedData);
    if (teamStructure) diagrams.push(teamStructure);

    const integrationFlow = this.generateIntegrationFlow(extractedData);
    if (integrationFlow) diagrams.push(integrationFlow);

    const timelineRoadmap = this.generateTimelineRoadmap(extractedData);
    if (timelineRoadmap) diagrams.push(timelineRoadmap);

    const deploymentDiagram = this.generateDeploymentDiagram(extractedData);
    if (deploymentDiagram) diagrams.push(deploymentDiagram);

    const stakeholderMap = this.generateStakeholderMap(extractedData);
    if (stakeholderMap) diagrams.push(stakeholderMap);

    const riskFlowchart = this.generateRiskFlowchart(extractedData);
    if (riskFlowchart) diagrams.push(riskFlowchart);

    return diagrams;
  }
}

export const diagramGenerationService = new DiagramGenerationService();
