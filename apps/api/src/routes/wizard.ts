import { Router, type IRouter } from 'express';
import { wizardService, WIZARD_STEPS } from '../services/wizard';
import type { WizardState } from '../services/wizard';

const router: IRouter = Router();

// In-memory wizard sessions (in production, use Redis or database)
const wizardSessions = new Map<string, WizardState>();

/**
 * GET /api/wizard/steps
 * Get all wizard steps metadata
 */
router.get('/steps', (req, res) => {
  res.json({
    success: true,
    steps: WIZARD_STEPS,
  });
});

/**
 * POST /api/wizard/init
 * Initialize a new wizard session
 */
router.post('/init', async (req, res, next) => {
  try {
    const sessionId = `wizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const state = await wizardService.initializeWizard();

    wizardSessions.set(sessionId, state);

    res.json({
      success: true,
      sessionId,
      state,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wizard/:sessionId
 * Get current wizard state
 */
router.get('/:sessionId', (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const state = wizardSessions.get(sessionId);

    if (!state) {
      return res.status(404).json({ error: 'Wizard session not found' });
    }

    res.json({
      success: true,
      state,
      currentStepInfo: WIZARD_STEPS[state.currentStep],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wizard/:sessionId/next
 * Move to next wizard step
 */
router.post('/:sessionId/next', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const stepData = req.body;

    const state = wizardSessions.get(sessionId);
    if (!state) {
      return res.status(404).json({ error: 'Wizard session not found' });
    }

    const newState = await wizardService.nextStep(state, stepData);
    wizardSessions.set(sessionId, newState);

    res.json({
      success: true,
      state: newState,
      currentStepInfo: WIZARD_STEPS[newState.currentStep],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wizard/:sessionId/previous
 * Move to previous wizard step
 */
router.post('/:sessionId/previous', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const state = wizardSessions.get(sessionId);
    if (!state) {
      return res.status(404).json({ error: 'Wizard session not found' });
    }

    const newState = await wizardService.previousStep(state);
    wizardSessions.set(sessionId, newState);

    res.json({
      success: true,
      state: newState,
      currentStepInfo: WIZARD_STEPS[newState.currentStep],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wizard/:sessionId/goto/:stepIndex
 * Jump to specific wizard step
 */
router.post('/:sessionId/goto/:stepIndex', async (req, res, next) => {
  try {
    const { sessionId, stepIndex } = req.params;

    const state = wizardSessions.get(sessionId);
    if (!state) {
      return res.status(404).json({ error: 'Wizard session not found' });
    }

    const newState = await wizardService.goToStep(state, parseInt(stepIndex, 10));
    wizardSessions.set(sessionId, newState);

    res.json({
      success: true,
      state: newState,
      currentStepInfo: WIZARD_STEPS[newState.currentStep],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wizard/clients/search
 * Search for existing clients
 */
router.get('/clients/search', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const clients = await wizardService.searchClients(q);

    res.json({
      success: true,
      clients,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wizard/clients/autofill
 * Auto-fill client details from existing client
 */
router.post('/clients/autofill', async (req, res, next) => {
  try {
    const { clientName, clientCompany } = req.body;

    if (!clientName || !clientCompany) {
      return res.status(400).json({ error: 'clientName and clientCompany are required' });
    }

    const clientData = await wizardService.autofillClient(clientName, clientCompany);

    if (!clientData) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({
      success: true,
      clientData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wizard/:sessionId/complete
 * Complete wizard and create proposal
 */
router.post('/:sessionId/complete', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const state = wizardSessions.get(sessionId);
    if (!state) {
      return res.status(404).json({ error: 'Wizard session not found' });
    }

    // Validate all steps are completed
    if (state.currentStep !== WIZARD_STEPS.length - 1) {
      return res.status(400).json({ error: 'Please complete all wizard steps first' });
    }

    // Create proposal
    const proposalId = await wizardService.createProposal(state.data);

    // Clean up session
    wizardSessions.delete(sessionId);

    res.json({
      success: true,
      proposalId,
      message: 'Proposal created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/wizard/:sessionId
 * Cancel wizard and delete session
 */
router.delete('/:sessionId', (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const deleted = wizardSessions.delete(sessionId);

    if (!deleted) {
      return res.status(404).json({ error: 'Wizard session not found' });
    }

    res.json({
      success: true,
      message: 'Wizard session cancelled',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
