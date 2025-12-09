import { db } from '../../db';
import { proposals, conversations } from '../../db/schema';
import { eq, like, or } from 'drizzle-orm';

/**
 * Wizard step definitions
 */
export const WIZARD_STEPS = [
  {
    id: 'client_info',
    title: 'Client Information',
    description: 'Enter client details or select from existing clients',
    fields: ['clientName', 'clientCompany', 'clientEmail', 'clientPhone'],
    required: ['clientName', 'clientCompany'],
  },
  {
    id: 'project_details',
    title: 'Project Details',
    description: 'Describe the project scope and objectives',
    fields: ['projectTitle', 'projectType', 'industry', 'description'],
    required: ['projectTitle', 'projectType'],
  },
  {
    id: 'scope_timeline',
    title: 'Scope & Timeline',
    description: 'Define project scope and timeline',
    fields: ['scope', 'timeline', 'startDate', 'endDate'],
    required: ['scope', 'timeline'],
  },
  {
    id: 'budget',
    title: 'Budget & Pricing',
    description: 'Set budget and pricing structure',
    fields: ['budget', 'pricingModel', 'paymentTerms'],
    required: ['budget'],
  },
  {
    id: 'template',
    title: 'Template Selection',
    description: 'Choose a proposal template',
    fields: ['templateId'],
    required: ['templateId'],
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Review all details before creating proposal',
    fields: [],
    required: [],
  },
] as const;

export type WizardStepId = typeof WIZARD_STEPS[number]['id'];

export interface WizardState {
  currentStep: number;
  completedSteps: number[];
  data: Record<string, any>;
  proposalId?: string;
  errors?: Record<string, string>;
}

export class WizardService {
  /**
   * Initialize a new wizard session
   */
  async initializeWizard(): Promise<WizardState> {
    return {
      currentStep: 0,
      completedSteps: [],
      data: {},
    };
  }

  /**
   * Validate current step data
   */
  validateStep(stepIndex: number, data: Record<string, any>): { valid: boolean; errors: Record<string, string> } {
    const step = WIZARD_STEPS[stepIndex];
    if (!step) {
      return { valid: false, errors: { step: 'Invalid step index' } };
    }

    const errors: Record<string, string> = {};

    // Check required fields
    for (const field of step.required) {
      if (!data[field] || data[field].trim() === '') {
        errors[field] = `${this.formatFieldName(field)} is required`;
      }
    }

    // Additional validation rules
    if (step.id === 'client_info') {
      if (data.clientEmail && !this.isValidEmail(data.clientEmail)) {
        errors.clientEmail = 'Invalid email format';
      }
      if (data.clientPhone && !this.isValidPhone(data.clientPhone)) {
        errors.clientPhone = 'Invalid phone format';
      }
    }

    if (step.id === 'budget') {
      if (data.budget && isNaN(parseFloat(data.budget))) {
        errors.budget = 'Budget must be a valid number';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Move to next step
   */
  async nextStep(state: WizardState, stepData: Record<string, any>): Promise<WizardState> {
    const validation = this.validateStep(state.currentStep, stepData);

    if (!validation.valid) {
      return {
        ...state,
        errors: validation.errors,
      };
    }

    // Merge step data
    const updatedData = { ...state.data, ...stepData };

    // Mark current step as completed
    const completedSteps = [...state.completedSteps];
    if (!completedSteps.includes(state.currentStep)) {
      completedSteps.push(state.currentStep);
    }

    // Move to next step
    const nextStep = Math.min(state.currentStep + 1, WIZARD_STEPS.length - 1);

    return {
      currentStep: nextStep,
      completedSteps,
      data: updatedData,
      proposalId: state.proposalId,
      errors: undefined,
    };
  }

  /**
   * Move to previous step
   */
  async previousStep(state: WizardState): Promise<WizardState> {
    return {
      ...state,
      currentStep: Math.max(0, state.currentStep - 1),
      errors: undefined,
    };
  }

  /**
   * Jump to specific step (only if already completed or current)
   */
  async goToStep(state: WizardState, stepIndex: number): Promise<WizardState> {
    if (stepIndex < 0 || stepIndex >= WIZARD_STEPS.length) {
      throw new Error('Invalid step index');
    }

    // Can only jump to completed steps or the next uncompleted step
    const canJump =
      state.completedSteps.includes(stepIndex) ||
      stepIndex === state.currentStep ||
      stepIndex === Math.max(...state.completedSteps) + 1;

    if (!canJump) {
      throw new Error('Cannot jump to this step yet');
    }

    return {
      ...state,
      currentStep: stepIndex,
      errors: undefined,
    };
  }

  /**
   * Search for existing clients by name or company
   */
  async searchClients(query: string): Promise<Array<{
    clientName: string;
    clientCompany: string;
    clientEmail?: string;
    clientPhone?: string;
    lastProposalDate?: Date;
    proposalCount: number;
  }>> {
    if (!query || query.length < 2) {
      return [];
    }

    const searchPattern = `%${query}%`;

    // Get unique clients from proposals
    const results = await db
      .select({
        clientName: proposals.clientName,
        clientCompany: proposals.clientCompany,
        createdAt: proposals.createdAt,
      })
      .from(proposals)
      .where(
        or(
          like(proposals.clientName, searchPattern),
          like(proposals.clientCompany, searchPattern)
        )
      )
      .orderBy(proposals.createdAt)
      .limit(10);

    // Group by client
    const clientMap = new Map<string, any>();

    for (const result of results) {
      const key = `${result.clientName}_${result.clientCompany}`;

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          clientName: result.clientName,
          clientCompany: result.clientCompany,
          lastProposalDate: result.createdAt,
          proposalCount: 1,
        });
      } else {
        const existing = clientMap.get(key);
        existing.proposalCount++;
        if (result.createdAt && result.createdAt > existing.lastProposalDate) {
          existing.lastProposalDate = result.createdAt;
        }
      }
    }

    return Array.from(clientMap.values());
  }

  /**
   * Auto-fill client details from existing client
   */
  async autofillClient(clientName: string, clientCompany: string): Promise<Record<string, any> | null> {
    const [lastProposal] = await db
      .select()
      .from(proposals)
      .where(
        eq(proposals.clientName, clientName)
      )
      .orderBy(proposals.createdAt)
      .limit(1);

    if (!lastProposal) {
      return null;
    }

    return {
      clientName: lastProposal.clientName,
      clientCompany: lastProposal.clientCompany,
      // Add more fields if available in extractedData
      ...(lastProposal.extractedData as any)?.client || {},
    };
  }

  /**
   * Create proposal from wizard data
   */
  async createProposal(wizardData: Record<string, any>): Promise<string> {
    const [proposal] = await db
      .insert(proposals)
      .values({
        templateId: wizardData.templateId,
        clientName: wizardData.clientName,
        clientCompany: wizardData.clientCompany,
        projectTitle: wizardData.projectTitle,
        projectType: wizardData.projectType,
        scope: wizardData.scope,
        timeline: wizardData.timeline,
        budget: wizardData.budget,
        extractedData: {
          client: {
            name: wizardData.clientName,
            company: wizardData.clientCompany,
            email: wizardData.clientEmail,
            phone: wizardData.clientPhone,
          },
          project: {
            title: wizardData.projectTitle,
            type: wizardData.projectType,
            industry: wizardData.industry,
            description: wizardData.description,
          },
          scope: wizardData.scope,
          timeline: {
            duration: wizardData.timeline,
            startDate: wizardData.startDate,
            endDate: wizardData.endDate,
          },
          budget: {
            amount: wizardData.budget,
            pricingModel: wizardData.pricingModel,
            paymentTerms: wizardData.paymentTerms,
          },
        },
        status: 'draft',
      })
      .returning();

    return proposal.id;
  }

  /**
   * Helper: Format field name for display
   */
  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Helper: Validate phone format
   */
  private isValidPhone(phone: string): boolean {
    // Simple validation - at least 10 digits
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  }
}

export const wizardService = new WizardService();
