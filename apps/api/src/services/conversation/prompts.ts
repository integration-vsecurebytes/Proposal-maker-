import { ConversationPhase } from '@proposal-gen/shared';

export const SYSTEM_PROMPT = `Act as an enterprise proposal requirements collector. Your job is to gather information from the user to create an enterprise business proposal. You must ONLY ask questions and collect answers - NEVER provide answers, suggestions, or make assumptions.

Task
Ask ONE clear question to collect the next required piece of information for the enterprise proposal.

Requirements
1. Ask ONLY questions - do not provide answers or examples in your question
2. Use information already provided in the conversation - NEVER ask for it again
3. If the user already answered a question, acknowledge it and move to the next missing information
4. Keep questions brief and direct (one sentence maximum)
5. Format: "[Phase X of 14] {your question here}"

Context
You are collecting information through 14 comprehensive phases:
1. Client Info: Enterprise client/organization details
2. Project Details: Project title, type, and objectives
3. Technical Architecture: Technology stack, integrations, security
4. Scope: Deliverables, in/out of scope
5. Methodology: Development approach, QA, risk management
6. Team & Resources: Team structure, roles, expertise
7. Detailed Deliverables: Phase-by-phase breakdown
8. Timeline: Start/end dates, milestones
9. Stakeholders: Key decision makers, approval workflow
10. Success Metrics: KPIs, performance benchmarks
11. Risks: Risk analysis and mitigation strategies
12. Budget: Budget range and payment terms
13. Visual Preferences: Charts, diagrams, branding preferences
14. Final Review: Confirm all collected information

Constraints
1. Ask exactly ONE question per response
2. NEVER repeat a question that was already asked or answered
3. NEVER provide example answers or suggestions to the user
4. NEVER make assumptions - only use what the user explicitly states
5. If information is already provided, skip to the next missing piece
6. Acknowledge previous answer before asking next question
7. No meta commentary or explanations
8. Think silently and show only the final question

Self Check
Before asking, confirm that:
1. This question was NOT already asked in the conversation history
2. The user has NOT already provided this information
3. You are asking for the next logically missing piece of information
4. You are NOT providing any example answers

Deliver only the question.`;

export const PHASE_DESCRIPTIONS: Record<ConversationPhase, string> = {
  client_info: 'Gathering client and company information',
  project_details: 'Understanding project requirements and objectives',
  technical_architecture: 'Exploring technical requirements and architecture',
  scope: 'Defining project scope and deliverables',
  methodology: 'Establishing development methodology and approach',
  team_resources: 'Planning team structure and resources',
  detailed_deliverables: 'Breaking down deliverables by phase',
  timeline: 'Establishing project timeline and milestones',
  stakeholders: 'Identifying key stakeholders and decision makers',
  success_metrics: 'Defining success criteria and KPIs',
  risks: 'Analyzing risks and mitigation strategies',
  budget: 'Discussing budget and payment terms',
  visual_preferences: 'Configuring visual elements and branding',
  final_review: 'Reviewing all collected information',
  complete: 'Requirements gathering complete',
};

export const PHASE_INTRO_PROMPTS: Record<ConversationPhase, string> = {
  client_info: `[Phase 1 of 14] Let's start with your client. What is the name of the enterprise client or organization?`,

  project_details: `[Phase 2 of 14] Great! Now, what is the title of this enterprise project?`,

  technical_architecture: `[Phase 3 of 14] Let's discuss the technical aspects. What are the main technology components or systems involved?`,

  scope: `[Phase 4 of 14] What are the primary deliverables and outcomes for this project?`,

  methodology: `[Phase 5 of 14] What development methodology would you like us to follow? (e.g., Agile, Waterfall, Hybrid)`,

  team_resources: `[Phase 6 of 14] Tell me about the team structure. What key roles and expertise are needed?`,

  detailed_deliverables: `[Phase 7 of 14] Let's break down the deliverables by project phase. What are the key phases and their deliverables?`,

  timeline: `[Phase 8 of 14] What are the project start and target completion dates?`,

  stakeholders: `[Phase 9 of 14] Who are the key stakeholders and decision-makers for this project?`,

  success_metrics: `[Phase 10 of 14] How will we measure success? What are the key performance indicators or success criteria?`,

  risks: `[Phase 11 of 14] What potential risks or challenges should we address in the proposal?`,

  budget: `[Phase 12 of 14] What is the budget range for this project?`,

  visual_preferences: `[Phase 13 of 14] Would you like specific types of charts, diagrams, or visual elements in the proposal?`,

  final_review: `[Phase 14 of 14] Let me summarize what we've collected so far. Please review and confirm if everything looks correct.`,

  complete: `✓ Perfect! I have everything needed. Generating your comprehensive enterprise proposal now...`,
};

export const DATA_EXTRACTION_PROMPT = `CRITICAL: Extract structured data from the conversation while PRESERVING all existing data.

IMPORTANT RULES:
1. NEVER overwrite existing data with null or undefined
2. ONLY add NEW information found in the conversation
3. If data already exists, keep it unchanged unless the user explicitly provides a different value
4. Be accurate and conservative - don't make up information

Return a JSON object with the following structure:
{
  "extractedData": {
    // Client Information
    "clientName": "string or null",
    "clientCompany": "string or null",
    "clientEmail": "string or null",
    "clientPhone": "string or null",
    "clientIndustry": "string or null",

    // Project Details
    "projectTitle": "string or null",
    "projectType": "string or null",
    "objectives": "string or null",
    "requirements": ["array of strings"] or null,
    "deliverables": ["array of strings"] or null,

    // Technical Architecture
    "systemComponents": ["array of strings"] or null,
    "technologyStack": {"frontend": [], "backend": [], "database": [], "infrastructure": []} or null,
    "integrations": [{"system": "string", "type": "string", "complexity": "low|medium|high"}] or null,
    "securityRequirements": ["array of strings"] or null,
    "complianceNeeds": ["array of strings"] or null,
    "scalabilityRequirements": "string or null",

    // Scope
    "scope": "string or null",
    "inScope": ["array of strings"] or null,
    "outOfScope": ["array of strings"] or null,
    "assumptions": ["array of strings"] or null,

    // Methodology
    "developmentMethodology": "agile|waterfall|hybrid|custom or null",
    "qualityAssurance": "string or null",
    "riskManagement": "string or null",
    "communicationApproach": "string or null",

    // Team & Resources
    "teamStructure": [{"role": "string", "count": number, "skills": [], "allocation": number}] or null,
    "keyPersonnel": [{"name": "string", "role": "string", "expertise": []}] or null,
    "clientResponsibilities": ["array of strings"] or null,

    // Detailed Deliverables
    "deliverablesByPhase": [{"phase": "string", "deliverables": [], "acceptanceCriteria": []}] or null,
    "documentationRequirements": ["array of strings"] or null,
    "trainingRequirements": ["array of strings"] or null,

    // Timeline
    "timeline": "string or null",
    "startDate": "string or null",
    "endDate": "string or null",
    "milestones": [{"name": "string", "date": "string", "description": "string"}] or null,

    // Stakeholders
    "keyStakeholders": [{"name": "string", "role": "string", "department": "string", "decisionLevel": "primary|secondary|informed"}] or null,
    "approvalWorkflow": "string or null",
    "communicationPlan": "string or null",

    // Success Metrics
    "kpis": [{"metric": "string", "target": "string", "measurement": "string"}] or null,
    "performanceBenchmarks": ["array of strings"] or null,
    "roiExpectations": "string or null",
    "successCriteria": ["array of strings"] or null,

    // Risks
    "identifiedRisks": [{"risk": "string", "likelihood": "low|medium|high", "impact": "low|medium|high", "mitigation": "string"}] or null,
    "dependencies": ["array of strings"] or null,
    "contingencyPlans": ["array of strings"] or null,
    "riskFactors": ["array of strings"] or null,
    "painPoints": ["array of strings"] or null,

    // Budget
    "budget": "string or null",
    "budgetRange": {"min": number, "max": number} or null,
    "paymentTerms": "string or null",
    "paymentSchedule": [{"milestone": "string", "percentage": number, "amount": number}] or null,

    // Visual Preferences
    "preferredChartTypes": {"budget": [], "timeline": [], "technical": []} or null,
    "diagramComplexity": "simple|moderate|detailed or null",
    "colorSchemePreference": "string or null",
    "brandingGuidelines": "string or null",
    "needsCharts": boolean or null,
    "chartTypes": ["array of strings"] or null,
    "needsDiagrams": boolean or null,
    "diagramTypes": ["array of strings"] or null,

    // Technologies
    "technologies": ["array of strings"] or null,
    "platforms": ["array of strings"] or null,
    "teamSize": number or null
  }
}

REMEMBER: Only return fields with actual values. Return null only for fields where NO information exists.`;

export function getNextQuestionPrompt(
  phase: ConversationPhase,
  extractedData: any,
  conversationHistory: string
): string {
  const phaseQuestionMap: Record<ConversationPhase, string> = {
    client_info: '1',
    project_details: '2',
    technical_architecture: '3',
    scope: '4',
    methodology: '5',
    team_resources: '6',
    detailed_deliverables: '7',
    timeline: '8',
    stakeholders: '9',
    success_metrics: '10',
    risks: '11',
    budget: '12',
    visual_preferences: '13',
    final_review: '14',
    complete: '14',
  };

  return `INFORMATION ALREADY COLLECTED (NEVER ASK FOR THESE AGAIN):
${JSON.stringify(extractedData, null, 2)}

FULL CONVERSATION HISTORY:
${conversationHistory}

CURRENT PHASE: ${phase}
PHASE NUMBER: ${phaseQuestionMap[phase]} of 14

WHAT INFORMATION IS STILL MISSING FOR THIS PHASE:
${phase === 'client_info' ? 'Client name, company, industry (if provided, move to next phase)' : ''}
${phase === 'project_details' ? 'Project title, type, objectives (if provided, move to next phase)' : ''}
${phase === 'technical_architecture' ? 'Technology stack, integrations, security requirements (if provided, move to next phase)' : ''}
${phase === 'scope' ? 'Scope, deliverables, in/out of scope (if provided, move to next phase)' : ''}
${phase === 'methodology' ? 'Development methodology, QA approach (if provided, move to next phase)' : ''}
${phase === 'team_resources' ? 'Team structure, roles, expertise (if provided, move to next phase)' : ''}
${phase === 'detailed_deliverables' ? 'Deliverables by phase, acceptance criteria (if provided, move to next phase)' : ''}
${phase === 'timeline' ? 'Timeline, start/end dates, milestones (if provided, move to next phase)' : ''}
${phase === 'stakeholders' ? 'Key stakeholders, decision makers, approval workflow (if provided, move to next phase)' : ''}
${phase === 'success_metrics' ? 'KPIs, success criteria, ROI expectations (if provided, move to next phase)' : ''}
${phase === 'risks' ? 'Identified risks, mitigation strategies (if provided, move to next phase)' : ''}
${phase === 'budget' ? 'Budget range, payment terms (if provided, move to next phase)' : ''}
${phase === 'visual_preferences' ? 'Charts/diagrams preference - OPTIONAL (can skip)' : ''}
${phase === 'final_review' ? 'Confirm all information is correct' : ''}

STRICT RULES:
1. Review "INFORMATION ALREADY COLLECTED" - If a field has ANY value, it is ALREADY ANSWERED - DO NOT ask for it
2. Review "FULL CONVERSATION HISTORY" - If a question was already asked, DO NOT ask it again in any form
3. If the user just provided an answer, acknowledge it briefly and ask for the NEXT missing piece
4. Ask ONLY for information - do NOT provide examples, suggestions, or sample answers
5. ONE question only - keep it under 15 words
6. Format: "[Phase {number} of 14] {brief acknowledgment if applicable} {question}"

OUTPUT ONLY THE QUESTION. NO EXPLANATIONS.`;
}

export function getPhaseCompletionPrompt(
  phase: ConversationPhase,
  extractedData: any
): string {
  const requirements: Record<ConversationPhase, string[]> = {
    client_info: ['clientName', 'clientCompany'],
    project_details: ['projectTitle', 'projectType'],
    technical_architecture: ['systemComponents', 'technologyStack'],
    scope: ['scope', 'deliverables'],
    methodology: ['developmentMethodology'],
    team_resources: ['teamStructure'],
    detailed_deliverables: ['deliverablesByPhase'],
    timeline: ['timeline', 'startDate'],
    stakeholders: ['keyStakeholders'],
    success_metrics: ['kpis', 'successCriteria'],
    risks: ['identifiedRisks'],
    budget: ['budget'],
    visual_preferences: [],
    final_review: [],
    complete: [],
  };

  const required = requirements[phase] || [];
  const missing = required.filter((field) => !extractedData[field]);

  return `Phase: ${phase}
Required fields: ${required.join(', ')}
Missing fields: ${missing.join(', ') || 'none'}

Is this phase complete? Return "true" or "false" only.`;
}
