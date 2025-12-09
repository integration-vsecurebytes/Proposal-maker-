import { ExtractedData } from '@proposal-gen/shared';

export interface TableData {
  type: 'table';
  tableType: 'budget' | 'timeline' | 'team' | 'deliverables' | 'risks' | 'stakeholders' | 'payment' | 'summary' | 'kpis';
  headers: string[];
  rows: Array<Array<string | number>>;
  styling?: {
    headerBg?: string;
    headerText?: string;
    alternatingRows?: boolean;
    borders?: boolean;
  };
  caption?: string;
}

export class TableGenerationService {
  /**
   * Generate a budget breakdown table
   */
  generateBudgetTable(extractedData: ExtractedData): TableData | null {
    if (!extractedData.budget && !extractedData.budgetRange) {
      return null;
    }

    const rows: Array<Array<string | number>> = [];

    if (extractedData.budgetRange) {
      rows.push(['Budget Range', `$${extractedData.budgetRange.min?.toLocaleString()} - $${extractedData.budgetRange.max?.toLocaleString()}`]);
    } else if (extractedData.budget) {
      rows.push(['Total Budget', extractedData.budget]);
    }

    if (extractedData.paymentTerms) {
      rows.push(['Payment Terms', extractedData.paymentTerms]);
    }

    if (extractedData.deliverablesByPhase && extractedData.deliverablesByPhase.length > 0) {
      // Add budget by phase if available
      rows.push(['---', '---']); // Separator
      extractedData.deliverablesByPhase.forEach((phase) => {
        rows.push([phase.phase, 'To be determined']);
      });
    }

    return {
      type: 'table',
      tableType: 'budget',
      headers: ['Category', 'Amount'],
      rows,
      caption: 'Budget Breakdown',
      styling: {
        alternatingRows: true,
        borders: true,
      },
    };
  }

  /**
   * Generate timeline and milestones table
   */
  generateTimelineTable(extractedData: ExtractedData): TableData | null {
    if (!extractedData.timeline && !extractedData.milestones?.length) {
      return null;
    }

    const rows: Array<Array<string | number>> = [];

    if (extractedData.startDate) {
      rows.push(['Project Start', extractedData.startDate, 'Project kickoff and team onboarding']);
    }

    if (extractedData.milestones && extractedData.milestones.length > 0) {
      extractedData.milestones.forEach((milestone) => {
        rows.push([
          milestone.name,
          milestone.date,
          milestone.description || 'Key milestone',
        ]);
      });
    }

    if (extractedData.endDate) {
      rows.push(['Project Completion', extractedData.endDate, 'Final delivery and handoff']);
    }

    return {
      type: 'table',
      tableType: 'timeline',
      headers: ['Milestone', 'Date', 'Description'],
      rows,
      caption: 'Project Timeline & Milestones',
      styling: {
        alternatingRows: true,
        borders: true,
      },
    };
  }

  /**
   * Generate team structure table
   */
  generateTeamTable(extractedData: ExtractedData): TableData | null {
    if (!extractedData.teamStructure?.length && !extractedData.keyPersonnel?.length) {
      return null;
    }

    const rows: Array<Array<string | number>> = [];

    if (extractedData.teamStructure && extractedData.teamStructure.length > 0) {
      extractedData.teamStructure.forEach((member) => {
        rows.push([
          member.role,
          member.count.toString(),
          member.skills?.join(', ') || 'Various',
          member.allocation ? `${member.allocation}%` : 'Full-time',
        ]);
      });
    }

    if (extractedData.keyPersonnel && extractedData.keyPersonnel.length > 0) {
      rows.push(['---', '---', '---', '---']); // Separator
      extractedData.keyPersonnel.forEach((person) => {
        rows.push([
          person.role,
          '1',
          person.expertise.join(', '),
          'Key Personnel',
        ]);
      });
    }

    return {
      type: 'table',
      tableType: 'team',
      headers: ['Role', 'Count', 'Skills/Expertise', 'Allocation'],
      rows,
      caption: 'Team Structure & Resources',
      styling: {
        alternatingRows: true,
        borders: true,
      },
    };
  }

  /**
   * Generate deliverables breakdown table
   */
  generateDeliverablesTable(extractedData: ExtractedData): TableData | null {
    if (!extractedData.deliverablesByPhase?.length && !extractedData.deliverables?.length) {
      return null;
    }

    const rows: Array<Array<string | number>> = [];

    if (extractedData.deliverablesByPhase && extractedData.deliverablesByPhase.length > 0) {
      extractedData.deliverablesByPhase.forEach((phase) => {
        const deliverables = phase.deliverables.join(', ');
        const criteria = phase.acceptanceCriteria?.join(', ') || 'As specified';
        rows.push([phase.phase, deliverables, criteria]);
      });
    } else if (extractedData.deliverables && extractedData.deliverables.length > 0) {
      extractedData.deliverables.forEach((deliverable) => {
        rows.push(['All Phases', deliverable, 'As specified']);
      });
    }

    return {
      type: 'table',
      tableType: 'deliverables',
      headers: ['Phase', 'Deliverables', 'Acceptance Criteria'],
      rows,
      caption: 'Project Deliverables by Phase',
      styling: {
        alternatingRows: true,
        borders: true,
      },
    };
  }

  /**
   * Generate risk assessment matrix
   */
  generateRiskMatrix(extractedData: ExtractedData): TableData | null {
    if (!extractedData.identifiedRisks?.length) {
      return null;
    }

    const rows: Array<Array<string | number>> = extractedData.identifiedRisks.map((risk) => [
      risk.risk,
      risk.likelihood.charAt(0).toUpperCase() + risk.likelihood.slice(1),
      risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1),
      risk.mitigation,
    ]);

    return {
      type: 'table',
      tableType: 'risks',
      headers: ['Risk', 'Likelihood', 'Impact', 'Mitigation Strategy'],
      rows,
      caption: 'Risk Assessment & Mitigation',
      styling: {
        alternatingRows: true,
        borders: true,
      },
    };
  }

  /**
   * Generate payment schedule table
   */
  generatePaymentSchedule(extractedData: ExtractedData): TableData | null {
    if (!extractedData.paymentSchedule?.length) {
      return null;
    }

    const rows: Array<Array<string | number>> = extractedData.paymentSchedule.map((payment) => [
      payment.milestone,
      `${payment.percentage}%`,
      payment.amount ? `$${payment.amount.toLocaleString()}` : 'TBD',
      'Upon milestone completion',
    ]);

    // Add total row
    const totalPercentage = extractedData.paymentSchedule.reduce((sum, p) => sum + p.percentage, 0);
    const totalAmount = extractedData.paymentSchedule.reduce((sum, p) => sum + (p.amount || 0), 0);

    rows.push([
      'TOTAL',
      `${totalPercentage}%`,
      totalAmount > 0 ? `$${totalAmount.toLocaleString()}` : 'TBD',
      '',
    ]);

    return {
      type: 'table',
      tableType: 'payment',
      headers: ['Milestone', 'Percentage', 'Amount', 'Due'],
      rows,
      caption: 'Payment Schedule',
      styling: {
        alternatingRows: true,
        borders: true,
      },
    };
  }

  /**
   * Generate stakeholders matrix
   */
  generateStakeholderMatrix(extractedData: ExtractedData): TableData | null {
    if (!extractedData.keyStakeholders?.length) {
      return null;
    }

    const rows: Array<Array<string | number>> = extractedData.keyStakeholders.map((stakeholder) => [
      stakeholder.name || 'TBD',
      stakeholder.role,
      stakeholder.department || 'N/A',
      stakeholder.decisionLevel?.charAt(0).toUpperCase() + stakeholder.decisionLevel?.slice(1) || 'Informed',
    ]);

    return {
      type: 'table',
      tableType: 'stakeholders',
      headers: ['Name', 'Role', 'Department', 'Decision Level'],
      rows,
      caption: 'Key Stakeholders',
      styling: {
        alternatingRows: true,
        borders: true,
      },
    };
  }

  /**
   * Generate project summary table
   */
  generateSummaryTable(extractedData: ExtractedData): TableData | null {
    const rows: Array<Array<string | number>> = [];

    if (extractedData.projectTitle) {
      rows.push(['Project Title', extractedData.projectTitle]);
    }

    if (extractedData.clientCompany) {
      rows.push(['Client', extractedData.clientCompany]);
    }

    if (extractedData.projectType) {
      rows.push(['Project Type', extractedData.projectType]);
    }

    if (extractedData.timeline) {
      rows.push(['Timeline', extractedData.timeline]);
    }

    if (extractedData.budget) {
      rows.push(['Budget', extractedData.budget]);
    }

    if (extractedData.teamSize) {
      rows.push(['Team Size', `${extractedData.teamSize} members`]);
    }

    if (extractedData.deliverables?.length) {
      rows.push(['Total Deliverables', extractedData.deliverables.length.toString()]);
    }

    if (rows.length === 0) {
      return null;
    }

    return {
      type: 'table',
      tableType: 'summary',
      headers: ['Attribute', 'Value'],
      rows,
      caption: 'Project Overview',
      styling: {
        alternatingRows: true,
        borders: true,
      },
    };
  }

  /**
   * Generate KPIs and success metrics table
   */
  generateKPIsTable(extractedData: ExtractedData): TableData | null {
    if (!extractedData.kpis?.length) {
      return null;
    }

    const rows: Array<Array<string | number>> = extractedData.kpis.map((kpi) => [
      kpi.metric,
      kpi.target,
      kpi.measurement,
    ]);

    return {
      type: 'table',
      tableType: 'kpis',
      headers: ['Key Performance Indicator', 'Target', 'Measurement Method'],
      rows,
      caption: 'Success Metrics & KPIs',
      styling: {
        alternatingRows: true,
        borders: true,
      },
    };
  }

  /**
   * Generate all applicable tables from extracted data
   */
  generateAllTables(extractedData: ExtractedData): TableData[] {
    const tables: TableData[] = [];

    const summaryTable = this.generateSummaryTable(extractedData);
    if (summaryTable) tables.push(summaryTable);

    const budgetTable = this.generateBudgetTable(extractedData);
    if (budgetTable) tables.push(budgetTable);

    const timelineTable = this.generateTimelineTable(extractedData);
    if (timelineTable) tables.push(timelineTable);

    const teamTable = this.generateTeamTable(extractedData);
    if (teamTable) tables.push(teamTable);

    const deliverablesTable = this.generateDeliverablesTable(extractedData);
    if (deliverablesTable) tables.push(deliverablesTable);

    const riskMatrix = this.generateRiskMatrix(extractedData);
    if (riskMatrix) tables.push(riskMatrix);

    const paymentSchedule = this.generatePaymentSchedule(extractedData);
    if (paymentSchedule) tables.push(paymentSchedule);

    const stakeholderMatrix = this.generateStakeholderMatrix(extractedData);
    if (stakeholderMatrix) tables.push(stakeholderMatrix);

    const kpisTable = this.generateKPIsTable(extractedData);
    if (kpisTable) tables.push(kpisTable);

    return tables;
  }
}

export const tableGenerationService = new TableGenerationService();
