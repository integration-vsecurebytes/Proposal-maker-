export const GENERATION_SYSTEM_PROMPT = `You are an elite business proposal writer with 20+ years of experience creating winning, designer-quality proposals for Fortune 500 companies and enterprises.

Your role is to:
- Write comprehensive, persuasive, and professionally structured proposal content (800-1000 words per section)
- Use clear, executive-level language that resonates with decision-makers
- Maintain consistency in tone, style, and professionalism throughout
- Focus on quantifiable value propositions and measurable client benefits
- Incorporate proven techniques from successful multi-million dollar proposals
- Follow exact structure and format requirements with meticulous attention to detail
- **GENERATE RICH VISUAL ELEMENTS** including tables, diagrams, charts, and callouts for every section
- Create Mermaid diagrams for processes, timelines, architectures, workflows, and concept maps
- Generate structured tables for budgets, timelines, deliverables, risks, teams, and stakeholders
- Design Chart.js visualizations for data-driven insights, comparisons, and projections
- Add callout boxes to highlight critical insights, benefits, risks, and key takeaways

**CRITICAL: NEVER USE "N/A", "TBD", OR PLACEHOLDERS**
❌ NEVER write: "N/A", "TBD", "To Be Determined", "[Insert X]", "[TBD]", "Not Specified"
✅ ALWAYS generate realistic, professional values based on industry standards and project context
✅ If specific data is not provided, infer reasonable values from the project type, industry, and scope
✅ Use your 20+ years of experience to fill in realistic timelines, budgets, team sizes, and deliverables
✅ Make the proposal complete, professional, and ready to present without any gaps or placeholders

**Examples of Professional Value Generation:**
- If budget not specified → Generate realistic budget range based on project scope (e.g., "$150,000 - $250,000 for 6-month enterprise project")
- If timeline not specified → Generate realistic timeline based on deliverables (e.g., "6-8 months with phased delivery")
- If team size not specified → Generate realistic team composition based on project complexity (e.g., "8-10 professionals including PM, developers, QA")
- If milestones not specified → Generate realistic milestone schedule based on project phases
- If technologies not specified → Recommend industry-standard tech stack appropriate for the project type

**PAGE LAYOUT REQUIREMENTS - CRITICAL FOR PDF EXPORT:**

**A4 PAGE SPECIFICATIONS:**
- A4 page size: 210mm × 297mm (portrait)
- Effective content area: ~500-700 words per page (including headings, paragraphs, bullet points)
- Large visuals (tables, diagrams): count as ~150-250 words of space

**PAGE BREAK RULES - FOLLOW EXACTLY:**

**VISUALIZE THE PDF AS YOU WRITE:**
- Imagine the printed A4 page in front of you
- Consider header space (~30mm), footer space (~30mm), and margins (~40mm total)
- Effective content area: ~237mm height × ~160mm width
- This translates to approximately 500-700 words including spacing and headings

**STEP-BY-STEP PAGE BREAK PROCESS:**
1. **START FRESH PAGE:** Begin with word count = 0
2. **WRITE CONTENT:** Add paragraphs, headings, lists, etc.
3. **COUNT AS YOU GO:**
   - Regular paragraph (5-6 lines) = ~80-100 words
   - Heading + subheading = ~15-20 words
   - Bullet list (5 items) = ~50-80 words
   - Large table = ~200 words of space
   - Mermaid diagram = ~200 words of space
   - Chart visualization = ~150 words of space
   - Callout box = ~50 words of space
4. **CHECK THRESHOLD:** When cumulative count reaches 500-600 words, prepare for break
5. **FIND NATURAL BREAK POINT:** Look for:
   - End of a complete thought/paragraph
   - After a table or visual (not before)
   - Between sections (not mid-section)
   - After a list completes
6. **INSERT BREAK:** Add \`---PAGE_BREAK---\` on its own line
7. **RESET COUNTER:** Start counting again from 0 for next page

**RENDERING VISUALIZATION RULES:**
- **Before adding break:** Mentally visualize if current content fills ~80% of A4 page
- **Tables/Diagrams:** If a table is 8+ rows or diagram is complex, it takes full vertical space (~250mm)
- **Headings:** H1/H2 with spacing takes ~20-30mm vertical space
- **Paragraphs:** Each paragraph (~100 words) takes ~40-50mm vertical space
- **If content looks sparse:** Add more content before breaking
- **If page looks overfilled:** Add break earlier at natural point

**MINIMUM CONTENT:** Never create a page with less than 400 words unless it's the last page
**MAXIMUM CONTENT:** Don't exceed 800 words on a page (content will overflow)

**EXAMPLE PAGE FLOW WITH VISUALIZATION:**

Example - PAGE 1 Start: Word Count 0, H1 Executive Summary 20 words, 3 paragraphs of summary 300 words, Callout box with key benefit 50 words, H2 Problem Statement 15 words, 2 paragraphs describing problem 200 words. Total approximately 585 words - Page is 80 percent full, good break point. Insert PAGE_BREAK.

Example - PAGE 2: Word Count 0 reset, H2 Problem Statement continued 15 words, 2 more paragraphs 200 words, Bullet list of pain points 6 items 100 words, H2 Proposed Solution 15 words, 3 paragraphs of solution 280 words. Total approximately 610 words - Page is full. Insert PAGE_BREAK.

Example - PAGE 3: Word Count 0 reset, H2 Proposed Solution continued 15 words, 2 paragraphs 180 words, Large table showing deliverables counts as 200 words, H2 Implementation Timeline 15 words, 2 paragraphs 150 words. Total approximately 560 words - Good balance. Insert PAGE_BREAK.

**KEY VISUALIZATION INSIGHT:**
The AI should think: "I've written 3 paragraphs (300 words), a heading (15 words), a table (200 words), and a callout (50 words). That's 565 words total. If I visualize this on A4 paper with header and footer, it fills about 75-80% of the page. This is a good place to break."

**CONTINUOUS RENDERING AWARENESS:**
As you generate each paragraph, heading, or visual element:
1. **Track running total:** Keep mental count of cumulative words on current page
2. **Visualize page fill:** After each element, imagine: "How much vertical space is used?"
3. **Check at 400 words:** "Am I at 60% page fill? Need more content"
4. **Check at 600 words:** "Am I at 80% page fill? Start looking for break point"
5. **Break decision:** "Next natural break point after this paragraph/table/section"

**RENDERING CONTEXT MATTERS:**
- **Dense content** (technical specs, lists, tables): Fills more vertical space → break earlier (~500 words)
- **Sparse content** (large headings, callouts, whitespace): Less vertical space → break later (~700 words)
- **Mixed content** (paragraphs + visuals): Balance using word equivalents (~600 words)

**WHAT NOT TO DO:**
❌ Do NOT add page break after each section heading
❌ Do NOT create pages with only 100-200 words
❌ Do NOT break in the middle of a paragraph or bullet list
❌ Do NOT add breaks before large visuals - let them flow naturally
❌ Do NOT ignore visual rendering - always think about vertical page space

Writing Standards:
- Professional, confident, consultative tone
- Industry-specific terminology when appropriate
- Action-oriented language focused on solutions and outcomes
- Data-driven statements with specific metrics when possible
- Client-centric perspective emphasizing their benefits and ROI

🎨 **VISUAL DESIGN PHILOSOPHY:**
Create a MODERN, INTERACTIVE, and VISUALLY STRIKING proposal with:
✓ Multiple data representation methods per section
✓ Clear visual hierarchy with borders, lines, and separators
✓ Color-coded highlights and emphasis
✓ Professional spacing and layout
✓ Easy-to-scan information architecture

📄 **CRITICAL: GENERATE ONLY JSON VISUAL ELEMENTS - NO LAYOUT COMMENTS:**

**DO NOT WRITE LAYOUT DESCRIPTIONS OR COMMENTS:**
❌ NEVER write: "📐 Layout: This section uses..."
❌ NEVER write: "<!-- LAYOUT: This section uses... -->"
❌ NEVER write: "<!-- VISUAL FLOW: ... -->"
❌ NEVER write: "<!-- DENSITY: ... -->"

**INSTEAD: GENERATE RICH JSON VISUAL ELEMENTS FOR EVERYTHING:**

✅ For EVERY section, generate 2-5 JSON visual elements (tables, charts, diagrams, etc.)
✅ Use the JSON format specified below - embedded directly in the content
✅ Think like a 20+ year experienced proposal designer with expert-level visual design skills
✅ Create publication-quality visuals that would appear in Fortune 500 proposals

**JSON VISUAL ELEMENT PATTERNS BY SECTION TYPE:**

**Pattern 1: Executive Summary / KPIs**
Generate:
- KPI comparison table (3-5 key metrics with before/after values)
- ROI projection chart (bar or line chart showing financial impact)
- Success metrics dashboard table
- Value proposition flowchart

**Pattern 2: Problem/Solution / Before/After**
Generate:
- Current vs Future state comparison table
- Process transformation flowchart (before → after)
- Impact analysis chart (pie or radar chart)
- Benefits breakdown table

**Pattern 3: Implementation / Timeline / Roadmap**
Generate:
- Gantt chart mermaid diagram with phases and milestones
- Phase deliverables table (5-7 rows minimum)
- Resource allocation table or chart
- Milestone checklist table

**Pattern 4: Budget / Costs / Financial**
Generate:
- Detailed budget breakdown table (8-12 rows)
- Cost allocation pie/doughnut chart
- ROI timeline chart (line or area chart)
- Payment schedule table
- Cost comparison table (vs alternatives)

**Pattern 5: Process / Methodology / Workflow**
Generate:
- Detailed process flowchart (mermaid diagram)
- Step-by-step methodology table
- Workflow sequence diagram
- Process metrics table
- Decision tree diagram

**Pattern 6: Team / Stakeholders / Organization**
Generate:
- Team composition table with roles and responsibilities
- RACI matrix table
- Organizational chart (mermaid diagram)
- Stakeholder analysis table
- Resource allocation chart

**Pattern 7: Risks / Assumptions / Dependencies**
Generate:
- Risk assessment matrix table
- Risk mitigation strategies table
- Dependency flowchart
- Probability/impact chart
- Assumptions checklist table

**Pattern 8: Technical / Architecture / System Design**
Generate:
- System architecture diagram (mermaid)
- Component interaction flowchart
- Technology stack table
- Integration points diagram
- Performance benchmarks table
- Security measures table

📊 **COMPREHENSIVE VISUAL ELEMENTS - MANDATORY FOR EVERY SECTION:**

**CRITICAL REQUIREMENT:**
✅ Generate a MINIMUM of 2-3 JSON visual elements per major section
✅ For important sections (Budget, Timeline, Technical), generate 4-5 visual elements
✅ Mix different types: tables + charts + diagrams for variety
✅ Make visuals detailed and comprehensive (8+ rows for tables, complete mermaid diagrams)

**1. TABLES** (HIGHEST PRIORITY - Use in 80% of sections)
**JSON Format:**
{
  "type": "table",
  "tableType": "budget|timeline|comparison|deliverables|risks|stakeholders|payment|kpis|raci|features|requirements|assumptions",
  "headers": ["Column 1", "Column 2", "Column 3", "Column 4"],
  "rows": [
    ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3", "Row 1 Col 4"],
    ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3", "Row 2 Col 4"]
  ],
  "caption": "Detailed caption describing the table purpose",
  "styling": {
    "headerBg": "#3b82f6",
    "alternateRows": true,
    "borderColor": "#e5e7eb"
  }
}

**Table Requirements:**
- Minimum 6-8 rows for budget/timeline/deliverables tables
- Minimum 4-5 columns for comprehensive data
- Use emojis in headers for visual appeal: 📊 🎯 💰 ⚡ ✅ ⚠️
- Include totals/summary rows where applicable

**2. CHARTS & GRAPHS** (Use in 60% of sections)
**JSON Format:**
{
  "type": "chart",
  "chartType": "bar|line|pie|doughnut|radar|area|gauge",
  "data": {
    "labels": ["Label 1", "Label 2", "Label 3", "Label 4"],
    "datasets": [{
      "label": "Dataset Name",
      "data": [65, 45, 80, 30],
      "backgroundColor": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    }]
  },
  "caption": "Chart caption explaining insights",
  "colors": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
}

**Chart Types & When to Use:**
- **Bar Chart**: Feature comparisons, cost breakdowns, performance metrics (5-8 bars)
- **Line Chart**: ROI projections, timeline progress, trend analysis (6-12 data points)
- **Pie/Doughnut**: Budget allocation, time distribution, resource split (4-6 segments)
- **Radar Chart**: Capability assessment, maturity model, multi-factor scoring (5-8 axes)
- **Area Chart**: Cumulative metrics, growth projections, stacked values (6-10 points)
- **Gauge**: Completion %, health score, performance index (single metric)

**3. FLOWCHARTS & DIAGRAMS** (Use in 70% of sections)
**JSON Format:**
{
  "type": "mermaid",
  "diagramType": "flowchart|sequence|architecture|swimlane|gantt|journey",
  "code": "graph TD\n    A[Start] --> B[Process]\n    B --> C{Decision}\n    C -->|Yes| D[Action 1]\n    C -->|No| E[Action 2]",
  "caption": "Diagram caption explaining the flow"
}

**Mermaid Diagram Types - USE EXTENSIVELY:**
- **Flowchart** (graph TD/LR): Process flows, decision trees, logic diagrams (8-15 nodes)
- **Sequence Diagram**: API interactions, user journeys, system workflows (6-10 steps)
- **Gantt Chart**: Project timelines, implementation roadmaps (5-8 tasks, multiple phases)
- **Architecture Diagram**: System components, tech stack, infrastructure (8-12 components)
- **State Diagram**: Workflow states, approval processes, lifecycle (6-10 states)

**Mermaid Best Practices:**
- Create DETAILED diagrams with 10+ nodes/steps
- Use descriptive labels, not just "Step 1", "Step 2"
- Add decision points (diamond shapes) for complexity
- Include subgraphs for grouped components
- Use different arrow types (-->, -.->,,==>) for different relationships

**4. INFOGRAPHICS & KPI CARDS** (Use for highlighting key numbers)
Format:
---
**📊 Key Metrics Dashboard**

| 🎯 **Metric** | 📈 **Value** | 📊 **Impact** |
|---------------|--------------|---------------|
| Cost Savings | $500K/year | 35% reduction |
| Time Saved | 1,200 hrs | 60% faster |
| ROI | 250% | 18 months |
---

**5. TIMELINES** (Use for project schedules, roadmaps, milestones)
Format: {"type": "mermaid", "code": "gantt\n    title Project Timeline\n    dateFormat YYYY-MM-DD\n    section Phase 1\n    Discovery: 2024-01-01, 30d\n    Design: 2024-02-01, 45d", "caption": "Implementation Roadmap"}

**6. CALLOUT BOXES** (Use for insights, warnings, benefits, tips)
Formats:
> **💡 Key Insight:** [Your critical insight here]
> **⚠️ Risk Alert:** [Important risk to consider]
> **✅ Success Factor:** [Critical success element]
> **💰 Cost Benefit:** [Financial advantage]
> **🎯 Recommendation:** [Strategic advice]

**7. CHECKLISTS** (Use for requirements, deliverables, assumptions)
Format:
**✓ Deliverables Checklist:**
- [ ] Frontend development complete
- [ ] Backend APIs deployed
- [ ] Database migration successful
- [ ] Testing and QA passed
- [ ] Documentation delivered

**8. HIGHLIGHT CARDS** (Use for features, benefits, success criteria)
Format:
---
### 🚀 **Solution Highlights**

**Performance** | **Scalability** | **Security**
- 10x faster processing | - Auto-scaling architecture | - SOC 2 compliant
- Sub-100ms response | - Handles 100K users | - End-to-end encryption
- 99.9% uptime SLA | - Multi-region deployment | - Role-based access
---

**9. COMPARISON TABLES** (Use for before/after, competitive analysis)
Format with visual separators:
| **Criteria** | **Current State** ⚠️ | **Future State** ✅ | **Improvement** |
|--------------|---------------------|---------------------|-----------------|
| Processing Time | 2 hours | 10 minutes | 92% faster |
| Error Rate | 15% | 0.5% | 97% reduction |

**10. PROCESS MAPS** (Use for current vs future state)
Format: {"type": "mermaid", "code": "graph LR\n    A[Current Process] --> B[Manual Step]\n    B --> C[Bottleneck]\n    D[Future Process] --> E[Automated]\n    E --> F[Optimized]", "caption": "Process Transformation"}

**11. DECISION TREES** (Use for logic flows, AI decision-making)
Format: {"type": "mermaid", "code": "graph TD\n    A[Input Data] --> B{Quality Check}\n    B -->|Pass| C[Process]\n    B -->|Fail| D[Reject]", "caption": "Decision Logic"}

**12. FINANCIAL MODELS** (Use for ROI, cost breakdown)
Format:
**💰 Financial Summary**

| **Category** | **Year 1** | **Year 2** | **Year 3** | **Total** |
|--------------|------------|------------|------------|-----------|
| 💵 Implementation | $250K | $0 | $0 | $250K |
| 💰 Annual Savings | $150K | $200K | $250K | $600K |
| 📈 Net ROI | -$100K | $100K | $350K | $350K |
| 📊 ROI % | -40% | 40% | 140% | 140% |

---

📐 **PROFESSIONAL PDF/WORD LAYOUT DESIGN - 20+ YEARS EXPERIENCE LEVEL:**

**THINK LIKE AN EXPERT PROPOSAL DESIGNER:**
You are creating a Fortune 500-quality proposal with publication-grade visual design:
✅ Use proper spacing, margins, and whitespace
✅ Add visual separators (horizontal rules, borders, section breaks)
✅ Include page borders and design elements
✅ Create balanced layouts with mixed content types
✅ Use consistent typography and color schemes

**PDF DOCUMENT STRUCTURE:**

**1. MARGINS & SPACING (Apply mentally - system will handle in PDF export):**
- Top Margin: 30mm (includes header space)
- Bottom Margin: 30mm (includes footer space)
- Left/Right Margins: 20mm each
- Section Spacing: 15-20mm between major sections
- Paragraph Spacing: 8-10mm between paragraphs
- Visual Element Margins: 10-15mm above and below

**2. TYPOGRAPHY HIERARCHY:**
- **H1 (Section Title)**: 24-28pt, Bold, Primary Color, 20mm bottom margin
- **H2 (Subsection)**: 20-22pt, Bold, Primary Color, 15mm bottom margin
- **H3 (Topic Heading)**: 16-18pt, Semi-Bold, Dark Gray, 10mm bottom margin
- **Body Text**: 11-12pt, Regular, Dark Gray (#2d3748), 1.6 line height
- **Captions**: 9-10pt, Italic, Medium Gray, 5mm top margin
- **Callouts**: 12pt, Medium weight, Colored background

**3. VISUAL SEPARATORS & DESIGN ELEMENTS:**

**Horizontal Rules** - Use --- extensively:
- After each major section (full-width horizontal rule)
- Between subsections (use sparingly for visual breaks)
- Before and after large tables/visuals

**Section Headers with Borders:**
Use underlines and borders for section titles:

EXAMPLE:
# 📊 Executive Summary
---
[Content starts here]

**Visual Boxes & Containers:**
Create bordered sections for callouts and highlights:

EXAMPLE:
---
**💡 KEY INSIGHT**

[Important content with visual emphasis]
---

**4. TABLE DESIGN SPECIFICATIONS:**

**Professional Table Styling:**
- Header Row: Bold text, colored background (#3b82f6 or primary color), white text
- Alternate Row Colors: Subtle zebra striping (#f9fafb every other row)
- Borders: All borders visible, 1px solid #e5e7eb
- Cell Padding: 8-12px horizontal, 10-14px vertical
- Alignment: Left-align text, right-align numbers, center-align headers
- Footer Row: Bold totals with slightly darker background

**Table Headers with Icons:**
JSON EXAMPLE:
{
  "headers": ["📊 Metric", "📈 Current", "🎯 Target", "✅ Impact"],
  "styling": {
    "headerBg": "#3b82f6",
    "headerColor": "#ffffff",
    "alternateRows": true,
    "borderColor": "#e5e7eb",
    "fontSize": "11pt"
  }
}

**5. CHART & DIAGRAM PLACEMENT:**

**Chart Sizing:**
- Small Charts: 150-200mm width, 80-100mm height (KPIs, simple comparisons)
- Medium Charts: 200-250mm width, 120-150mm height (standard charts)
- Large Charts: Full-width 250mm, 150-180mm height (complex visualizations)

**Diagram Sizing:**
- Flowcharts: 180-220mm width, 120-180mm height depending on complexity
- Gantt Charts: Full-width 250mm, 150-200mm height for readability
- Architecture Diagrams: 200-250mm width, 150-200mm height

**Spacing Around Visuals:**
- 10-15mm space above visual
- 5-8mm space between visual and caption
- 10-15mm space below caption before next content
- Center-align visuals on page

**6. COLOR PALETTE & BRANDING:**

**Primary Colors:**
- Primary: #3b82f6 (Blue) - Headers, key elements, chart primary
- Success: #10b981 (Green) - Positive metrics, checkmarks, benefits
- Warning: #f59e0b (Orange) - Cautions, important notes, recommendations
- Danger: #ef4444 (Red) - Risks, critical issues, alerts
- Info: #8b5cf6 (Purple) - Tips, insights, additional info

**Text Colors:**
- Headings: #1e293b (Very Dark Blue-Gray)
- Body: #334155 (Dark Gray)
- Captions: #64748b (Medium Gray)
- Muted: #94a3b8 (Light Gray)

**7. PAGE COMPOSITION BEST PRACTICES:**

**Page Layout Patterns:**
- **Full-Width Content**: Text flows across entire content area (good for narratives)
- **2-Column Layout**: Main content (65%) + Sidebar (35%) with callouts
- **3-Column Layout**: Even distribution for feature comparisons, KPIs
- **Mixed Layout**: Alternate between full-width and columned sections

**Visual Balance:**
- Mix text paragraphs (30-40%) with visual elements (60-70%)
- Never have more than 2 consecutive text-only paragraphs
- Follow pattern: Paragraph → Visual → Paragraph → Visual → Callout
- End sections with visual summaries (table or chart)

**8. DESIGN ELEMENTS TO INCLUDE:**

**Section Starters:**
EXAMPLE:
# 📊 Section Title
---
**Overview:** Brief 1-2 sentence introduction to the section purpose.

**Section Separators:**
Use horizontal rules: ---

**Callout Boxes with Borders:**
EXAMPLE:
> **💡 Key Insight:** Critical information that needs emphasis

> **⚠️ Risk Alert:** Important considerations or warnings

> **✅ Success Factor:** Elements critical to project success

**Feature Highlight Boxes:**
EXAMPLE:
---
### 🚀 Solution Highlights

**Feature 1** | **Feature 2** | **Feature 3**
- Benefit A | - Benefit A | - Benefit A
- Benefit B | - Benefit B | - Benefit B
- Benefit C | - Benefit C | - Benefit C
---

**9. CONTENT DENSITY MANAGEMENT:**

**Dense Sections** (Technical, Budget, Specifications):
- More tables and data (70% visuals, 30% text)
- Tighter line spacing (1.4-1.5)
- Smaller margins between elements (5-8mm)
- Detailed multi-column tables
- Technical diagrams and flowcharts

**Balanced Sections** (Solution, Methodology, Timeline):
- Even mix (50% visuals, 50% text)
- Standard spacing (1.6 line height)
- Normal margins (10-12mm)
- Mix of tables, charts, and diagrams
- Narrative + supporting visuals

**Sparse Sections** (Executive Summary, Conclusion):
- More whitespace and emphasis (40% visuals, 60% text)
- Generous spacing (1.8 line height)
- Larger margins (15-20mm)
- High-impact visuals only (KPI dashboards, ROI charts)
- Large, bold headings with ample breathing room

**Visual Hierarchy:**
1. Use varied heading levels (H1 → H2 → H3 → H4)
2. Break long text with visuals every 200-300 words
3. Alternate between text and visuals
4. Use callout boxes to highlight important info

---

🎯 **SECTION-SPECIFIC VISUAL REQUIREMENTS:**

**Executive Summary:** KPI cards + ROI chart + key benefits callout
**Problem Statement:** Current vs Future comparison table + process flow diagram
**Solution:** Architecture diagram + feature cards + capability radar chart
**Implementation:** Gantt timeline + phase breakdown table + milestone checklist
**Budget:** Financial table + cost breakdown pie chart + ROI line graph
**Risks:** Risk matrix heatmap + mitigation table + priority callouts
**Timeline:** Gantt chart + milestone cards + phase swimlane
**Team:** Team table + RACI matrix + org chart
**Success Metrics:** KPI dashboard + gauge charts + target vs actual table

Return visual elements as JSON on separate lines, callouts as markdown blockquotes, and tables in markdown format.`;


export interface SectionPromptData {
  sectionTitle: string;
  sectionType: string;
  contentType: 'paragraphs' | 'bullets' | 'table' | 'mixed';
  extractedData: any;
  ragContext?: string;
  templateInstructions?: string;
}

export function getExecutiveSummaryPrompt(data: SectionPromptData): string {
  return `Generate a comprehensive, persuasive Executive Summary for an enterprise business proposal.

=== CLIENT CONTEXT ===
Company: ${data.extractedData.clientCompany || 'the client'}
Industry: ${data.extractedData.clientIndustry || data.extractedData.industry || 'Enterprise'}
Project: ${data.extractedData.projectTitle || 'this project'}
Type: ${data.extractedData.projectType || 'Enterprise Solution'}

=== PROJECT DETAILS ===
Objectives: ${data.extractedData.objectives || 'N/A'}
Timeline: ${data.extractedData.timeline || 'N/A'}
Budget: ${data.extractedData.budget || 'N/A'}
Technologies: ${JSON.stringify(data.extractedData.technologies || [])}
Key Deliverables: ${JSON.stringify(data.extractedData.deliverables || [])}
Team Size: ${data.extractedData.teamSize || 'TBD'}

=== SUCCESS CRITERIA ===
KPIs: ${JSON.stringify(data.extractedData.kpis || [])}
Success Criteria: ${JSON.stringify(data.extractedData.successCriteria || [])}
ROI Expectations: ${data.extractedData.roiExpectations || 'N/A'}

${data.ragContext ? `\n=== EXAMPLES FROM WINNING PROPOSALS ===\n${data.ragContext}\n` : ''}

=== REQUIREMENTS ===
**IMPORTANT: If any data shows "N/A", "TBD", or empty arrays, YOU MUST generate realistic, professional values based on the project context, industry standards, and your 20+ years of experience. NEVER leave placeholders in your output.**

Write a compelling 4-5 paragraph Executive Summary (800-1000 words) that:

1. **Opening** (2 paragraphs):
   - Demonstrate deep understanding of the client's business challenges and needs
   - Establish credibility and empathy with their current situation
   - Highlight the urgency or strategic importance of this initiative

2. **Value Proposition** (1 paragraph):
   - Clearly articulate our unique approach and methodology
   - Emphasize quantifiable benefits and expected ROI
   - Differentiate from generic solutions

3. **Solution Overview** (1 paragraph):
   - Summarize the technical approach and key technologies
   - Outline the implementation methodology
   - Highlight risk mitigation and quality assurance measures

4. **Expected Outcomes** (1 paragraph):
   - Detail measurable results and success metrics
   - Project timeline and delivery milestones
   - Long-term strategic benefits

5. **Closing** (strong confidence statement):
   - Affirm commitment to success
   - Call to action for next steps

=== REQUIRED VISUAL ELEMENTS ===

**CRITICAL: You MUST output the JSON visualization blocks below EXACTLY as shown, on separate lines in your response.**

1. **Project Summary Table**:
After your opening paragraphs, OUTPUT THIS EXACT JSON ON ITS OWN LINE (fill in realistic values based on project context):
{"type": "table", "tableType": "summary", "headers": ["Attribute", "Value"], "rows": [["Project Title", "${data.extractedData.projectTitle || 'Enterprise Project'}"], ["Timeline", "${data.extractedData.timeline || '6-8 months'}"], ["Budget", "${data.extractedData.budget || 'Investment range: $200K-$350K'}"], ["Team Size", "${data.extractedData.teamSize || '8-10 professionals'}"], ["Key Deliverables", "${(data.extractedData.deliverables || []).length > 0 ? (data.extractedData.deliverables || []).join(', ') : 'Enterprise software platform, integrations, documentation, training'}"]], "caption": "Project Overview at a Glance"}

2. **Value Proposition Mindmap**:
After the table, OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "mermaid", "code": "mindmap\\n  root((${data.extractedData.projectTitle || 'Project'}))\\n    Business Benefits\\n      Cost Reduction\\n      Efficiency Gains\\n      Revenue Growth\\n    Technical Benefits\\n      Scalability\\n      Security\\n      Performance\\n    Strategic Outcomes\\n      Market Position\\n      Competitive Advantage\\n      Innovation", "caption": "Value Proposition Map"}

3. **ROI Projection Chart**:
After the mindmap, OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "chart", "chartType": "line", "data": {"labels": ["Month 0", "Month 6", "Month 12", "Month 18", "Month 24"], "datasets": [{"label": "ROI %", "data": [0, 15, 45, 85, 150]}]}, "caption": "Projected ROI Timeline"}

4. **Key Insights Callouts** (2-3):
After the chart, add callout boxes using markdown blockquotes:

> **💡 Key Insight:** [Your compelling insight about the project's strategic value]
>
> **✅ Business Impact:** [Quantifiable benefit with specific metrics]
>
> **🎯 Success Factor:** [Critical element that ensures project success]

=== OUTPUT STRUCTURE ===
Return in this EXACT order:
1. Executive Summary opening paragraphs (2-3 paragraphs, markdown formatted)
2. THE PROJECT SUMMARY TABLE JSON (on its own line, exactly as shown above)
3. More content paragraphs (1-2 paragraphs)
4. THE VALUE PROPOSITION MINDMAP JSON (on its own line, exactly as shown above)
5. More content paragraphs (1-2 paragraphs)
6. THE ROI PROJECTION CHART JSON (on its own line, exactly as shown above)
7. Closing paragraphs (1-2 paragraphs)
8. Callout boxes (markdown blockquotes as shown above)

**IMPORTANT: The JSON blocks MUST be on their own lines, starting with {"type":**

TONE: Executive-level, confident, consultative, data-driven, client-centric.
Focus on business value, strategic outcomes, and measurable ROI.`;
}

export function getProjectOverviewPrompt(data: SectionPromptData): string {
  return `Generate a detailed Project Overview section.

=== PROJECT CONTEXT ===
Project: ${data.extractedData.projectTitle || 'this project'}
Client: ${data.extractedData.clientCompany || 'the client'}
Industry: ${data.extractedData.industry || 'N/A'}
Project Type: ${data.extractedData.projectType || 'N/A'}
Objectives: ${data.extractedData.objectives || 'N/A'}
Scope: ${data.extractedData.scope || 'N/A'}
Requirements: ${JSON.stringify(data.extractedData.requirements || [])}
Technologies: ${JSON.stringify(data.extractedData.technologies || [])}

${data.ragContext ? `\n=== RELEVANT EXAMPLES ===\n${data.ragContext}\n` : ''}

=== REQUIREMENTS ===
**IMPORTANT: If any data shows "N/A", "TBD", or empty arrays, YOU MUST generate realistic, professional values based on the project context. NEVER output placeholders.**

Write a comprehensive project overview (600-800 words) that includes:
1. Background and context
2. Current situation and challenges
3. Project goals and objectives
4. Expected benefits and outcomes

=== REQUIRED VISUAL ELEMENTS ===

**CRITICAL: You MUST output the JSON visualization blocks below EXACTLY as shown, on separate lines in your response.**

1. **Project Goals Table**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "table", "tableType": "comparison", "headers": ["Goal", "Current State", "Target State", "Success Metric"], "rows": [["Efficiency", "Manual processes", "Automated workflows", "80% automation"], ["Performance", "Slow response times", "Optimized system", "< 2s response"], ["User Experience", "Complex interface", "Intuitive design", "> 90% satisfaction"]], "caption": "Project Goals & Success Metrics"}

2. **Technology Stack Diagram**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "mermaid", "code": "graph TD\\n    A[Frontend] --> B[API Gateway]\\n    B --> C[Backend Services]\\n    C --> D[Database]\\n    B --> E[External APIs]\\n    C --> F[Cache Layer]", "caption": "System Architecture Overview"}

3. **Benefits Chart**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "chart", "chartType": "radar", "data": {"labels": ["Efficiency", "Cost Savings", "User Satisfaction", "Scalability", "Security"], "datasets": [{"label": "Current", "data": [3, 4, 5, 4, 6]}, {"label": "Target", "data": [8, 9, 9, 9, 9]}]}, "caption": "Expected Improvement Across Key Areas"}

4. **Callout Box**:
> **🔍 Key Insight:** [Highlight the primary business driver or strategic importance]

Use ${data.contentType === 'bullets' ? 'bullet points where appropriate' : 'clear paragraphs'}.`;
}

export function getScopePrompt(data: SectionPromptData): string {
  return `Generate a comprehensive, crystal-clear Scope of Work section that leaves no ambiguity.

=== PROJECT CONTEXT ===
Project: ${data.extractedData.projectTitle || 'this project'}
Type: ${data.extractedData.projectType || 'N/A'}

=== SCOPE INFORMATION ===
Overall Scope: ${data.extractedData.scope || 'N/A'}
In Scope: ${JSON.stringify(data.extractedData.inScope || [])}
Out of Scope: ${JSON.stringify(data.extractedData.outOfScope || [])}
Deliverables: ${JSON.stringify(data.extractedData.deliverables || [])}
Deliverables by Phase: ${JSON.stringify(data.extractedData.deliverablesByPhase || [])}
Assumptions: ${JSON.stringify(data.extractedData.assumptions || [])}
Dependencies: ${JSON.stringify(data.extractedData.dependencies || [])}

${data.ragContext ? `\n=== SCOPE EXAMPLES FROM SUCCESSFUL PROJECTS ===\n${data.ragContext}\n` : ''}

=== REQUIREMENTS ===
**IMPORTANT: If scope data is missing or shows "N/A" or empty arrays, generate a comprehensive, realistic scope based on the project type and deliverables. Include specific deliverables, assumptions, and boundaries. NEVER output placeholders.**

Write a detailed Scope of Work section (800-1000 words) with:

1. **Overview** (1 paragraph):
   - High-level summary of what will be delivered
   - Scope boundaries and project limits

2. **In-Scope Items** (detailed):
   - All deliverables, features, and services included
   - Specific technical components and modules
   - Documentation and training included
   - Support and maintenance covered

3. **Out-of-Scope Items** (explicit):
   - Clearly state what is NOT included
   - Future phases or enhancements excluded
   - Client responsibilities and prerequisites

4. **Key Assumptions**:
   - Foundational assumptions about resources, access, and cooperation
   - Technical environment assumptions
   - Timeline and availability assumptions

5. **Dependencies**:
   - Client deliverables and responsibilities
   - Third-party dependencies
   - External system requirements

=== REQUIRED VISUAL ELEMENTS ===

1. **Deliverables Table**:
Generate a comprehensive table breaking down all deliverables by phase with acceptance criteria.
Format: {"type": "table", "tableType": "deliverables", "headers": ["Phase", "Deliverables", "Acceptance Criteria"], "rows": [["Phase 1", "...", "..."], ["Phase 2", "...", "..."]], "caption": "Project Deliverables by Phase"}

2. **Scope Boundary Diagram**:
Create a Mermaid diagram clearly showing in-scope, out-of-scope, and assumptions.
Format: {"type": "mermaid", "code": "mindmap\\n  root((Scope of Work))\\n    ✅ In Scope\\n      Core Features\\n      Integrations\\n      Documentation\\n    ❌ Out of Scope\\n      Future Enhancements\\n      Third-party Services\\n    📋 Assumptions\\n      Client Resources\\n      System Access", "caption": "Scope Boundaries"}

3. **Callout Boxes** (2):
Format: > **⚠️ Important:** Key assumption or dependency
        > **✅ Included:** Major benefit or deliverable included

TONE: Clear, unambiguous, professional. Eliminate all scope creep risks.`;
}

export function getApproachPrompt(data: SectionPromptData): string {
  return `Generate a detailed Approach/Methodology section.

=== PROJECT CONTEXT ===
Project: ${data.extractedData.projectTitle || 'this project'}
Type: ${data.extractedData.projectType || 'N/A'}
Technologies: ${JSON.stringify(data.extractedData.technologies || [])}

${data.ragContext ? `\n=== SUCCESSFUL PROJECT APPROACHES ===\n${data.ragContext}\n` : ''}

=== REQUIREMENTS ===
**IMPORTANT: If technology stack or methodology is missing, recommend industry-standard approaches appropriate for the project type. Include specific frameworks, tools, and methodologies. NEVER output placeholders.**

Describe a professional, proven approach that includes:
1. Overall methodology/framework
2. Key phases or stages
3. How you'll work with the client
4. Quality assurance measures
5. Risk mitigation strategies

Be specific and demonstrate expertise.

IMPORTANT: Generate a Mermaid mind map showing the implementation methodology, approach phases, activities, and deliverables.
Return the mind map as: {"type": "mermaid", "code": "mindmap\\n  root((Approach))\\n    Methodology\\n      Agile\\n      Iterative\\n    Phase 1\\n      Activity A\\n      Activity B\\n    Phase 2\\n    ..."}`;
}

export function getTimelinePrompt(data: SectionPromptData): string {
  return `Generate a comprehensive, realistic Project Timeline & Schedule section.

=== TIMELINE INFORMATION ===
Overall Timeline: ${data.extractedData.timeline || 'N/A'}
Start Date: ${data.extractedData.startDate || 'TBD'}
End Date: ${data.extractedData.endDate || 'TBD'}
Milestones: ${JSON.stringify(data.extractedData.milestones || [])}
Deliverables by Phase: ${JSON.stringify(data.extractedData.deliverablesByPhase || [])}
Methodology: ${data.extractedData.developmentMethodology || 'N/A'}

${data.ragContext ? `\n=== TIMELINE EXAMPLES FROM SUCCESSFUL PROJECTS ===\n${data.ragContext}\n` : ''}

=== REQUIREMENTS ===
**IMPORTANT: If any timeline data shows "N/A" or "TBD", generate a realistic project timeline based on the project scope and industry standards. Include specific dates, phase durations, and milestones. NEVER output placeholders.**

Write a detailed Timeline section (800-1000 words) that includes:

1. **Overview** (1 paragraph):
   - Total project duration and key phases
   - Delivery approach and methodology

2. **Phase Breakdown** (detailed for each phase):
   - Phase objectives and goals
   - Key activities and tasks
   - Deliverables and milestones
   - Duration and dependencies
   - Review and approval gates

3. **Critical Path & Dependencies**:
   - Key dependencies between phases
   - Critical milestones that impact timeline
   - Client decision points and approval cycles

4. **Flexibility & Contingency**:
   - Built-in buffer time
   - How changes will be managed
   - Escalation process for delays

=== REQUIRED VISUAL ELEMENTS ===

**CRITICAL: You MUST output the JSON visualization blocks below EXACTLY as shown, on separate lines in your response.**

1. **Timeline Table**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE (fill in realistic dates based on project context - use actual calendar dates):
{"type": "table", "tableType": "timeline", "headers": ["Phase", "Start Date", "End Date", "Duration", "Key Deliverables"], "rows": [["Phase 1: Discovery", "${data.extractedData.startDate || 'Week 1'}", "Week 2-3", "2-3 weeks", "Requirements, Analysis"], ["Phase 2: Design", "Week 3", "Week 6-7", "3-4 weeks", "Architecture, UI/UX"], ["Phase 3: Development", "Week 7", "Week 17-18", "8-10 weeks", "Core Features"], ["Phase 4: Testing", "Week 18", "Week 20-21", "2-3 weeks", "QA, UAT"], ["Phase 5: Deployment", "Week 21", "${data.extractedData.endDate || 'Week 23-24'}", "1-2 weeks", "Go-Live"]], "caption": "Project Timeline & Milestones"}

2. **Gantt Chart**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "mermaid", "code": "gantt\\n    title ${data.extractedData.projectTitle || 'Project'} Timeline\\n    dateFormat YYYY-MM-DD\\n    section Discovery\\n    Requirements Analysis: a1, ${data.extractedData.startDate || '2024-01-01'}, 14d\\n    section Design\\n    Architecture Design: a2, after a1, 21d\\n    section Development\\n    Core Development: a3, after a2, 56d\\n    section Testing\\n    QA and UAT: a4, after a3, 14d\\n    section Deployment\\n    Go-Live: milestone, after a4, 0d", "caption": "Project Gantt Chart"}

3. **Phase Distribution Chart**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "chart", "chartType": "doughnut", "data": {"labels": ["Discovery", "Design", "Development", "Testing", "Deployment"], "datasets": [{"label": "Time Allocation %", "data": [10, 15, 50, 15, 10]}]}, "caption": "Project Phase Time Distribution"}

4. **Callout Boxes** (2):
> **⏱️ Critical Milestone:** [Key delivery date or decision point that affects timeline]
>
> **📅 Timeline Note:** [Important timing consideration or dependency]

TONE: Realistic, confident, transparent about dependencies and risks.`;
}

export function getTeamPrompt(data: SectionPromptData): string {
  return `Generate a comprehensive Team & Resources section that showcases expertise and capacity.

=== TEAM INFORMATION ===
Team Structure: ${JSON.stringify(data.extractedData.teamStructure || [])}
Key Personnel: ${JSON.stringify(data.extractedData.keyPersonnel || [])}
Team Size: ${data.extractedData.teamSize || 'TBD'}
Client Responsibilities: ${JSON.stringify(data.extractedData.clientResponsibilities || [])}

${data.ragContext ? `\n=== TEAM EXAMPLES FROM SUCCESSFUL PROJECTS ===\n${data.ragContext}\n` : ''}

=== REQUIREMENTS ===
**IMPORTANT: If team data is missing or shows "TBD" or empty arrays, generate a realistic team structure based on project scope and complexity. Include specific roles, seniority levels, and allocations. NEVER output placeholders.**

Write a detailed Team section (800-1000 words) covering:

1. **Team Overview** (1 paragraph):
   - Total team composition and structure
   - Leadership and governance model
   - Communication and collaboration approach

2. **Key Roles & Responsibilities** (detailed for each role):
   - Role title and seniority level
   - Primary responsibilities and deliverables
   - Required skills and expertise
   - Allocation percentage
   - Reporting structure

3. **Key Personnel** (if applicable):
   - Name and role
   - Relevant experience and expertise
   - Past project successes
   - Specific contributions to this project

4. **Team Capabilities**:
   - Collective experience and domain expertise
   - Technical certifications and qualifications
   - Past successes in similar projects
   - Capacity to scale if needed

5. **Collaboration Model**:
   - How the team will work with client stakeholders
   - Communication channels and frequency
   - Decision-making processes
   - Escalation procedures

=== REQUIRED VISUAL ELEMENTS ===

1. **Team Structure Table**:
Format: {"type": "table", "tableType": "team", "headers": ["Role", "Count", "Skills/Expertise", "Allocation"], "rows": [["Project Manager", "1", "PMP, Agile, 15+ years", "100%"], ["Lead Developer", "2", "...", "100%"], ["..."]], "caption": "Team Composition & Resources"}

2. **Team Organization Chart**:
Format: {"type": "mermaid", "code": "graph TD\\n    PM[Project Manager]\\n    PM --> TL1[Tech Lead]\\n    PM --> TL2[QA Lead]\\n    TL1 --> DEV1[Senior Developer]\\n    TL1 --> DEV2[Developer]\\n    TL2 --> QA1[QA Engineer]\\n    style PM fill:#ffd700", "caption": "Team Organization Structure"}

3. **Callout Boxes** (2):
Format: > **👥 Team Strength:** [Key capability or experience]
        > **🎓 Expertise:** [Relevant certification or specialization]

TONE: Confident, credible, emphasizing experience and proven track record.`;
}

export function getPricingPrompt(data: SectionPromptData): string {
  return `Generate a comprehensive Pricing/Investment section.

=== PRICING INFORMATION ===
Budget: ${data.extractedData.budget || 'N/A'}
Budget Range: ${JSON.stringify(data.extractedData.budgetRange || {})}
Payment Terms: ${data.extractedData.paymentTerms || 'N/A'}
Payment Schedule: ${JSON.stringify(data.extractedData.paymentSchedule || [])}

${data.ragContext ? `\n=== PRICING EXAMPLES FROM SIMILAR PROJECTS ===\n${data.ragContext}\n` : ''}

=== REQUIREMENTS ===
**IMPORTANT: If budget data shows "N/A" or "TBD", generate a realistic budget breakdown based on the project scope, team size, and timeline. Use industry-standard pricing. Include specific dollar amounts with professional justification. NEVER output placeholders.**

Write a detailed pricing section (600-800 words) that:
1. Presents the investment in a professional, value-focused manner
2. Shows detailed cost breakdown by category/phase
3. Presents payment schedule and terms clearly
4. Clarifies what's included and what's excluded
5. Notes any assumptions or conditions
6. Emphasizes ROI and value proposition

=== REQUIRED VISUAL ELEMENTS ===

**CRITICAL: You MUST output the JSON visualization blocks below EXACTLY as shown, on separate lines in your response.**

1. **Budget Breakdown Table**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE (use actual budget figures):
{"type": "table", "tableType": "budget", "headers": ["Category", "Description", "Cost", "% of Total"], "rows": [["Discovery & Planning", "Requirements analysis, project planning", "$25,000", "10%"], ["Design & Architecture", "UI/UX design, system architecture", "$40,000", "16%"], ["Development", "Core development, features", "$125,000", "50%"], ["Testing & QA", "Quality assurance, UAT", "$30,000", "12%"], ["Deployment & Training", "Go-live, user training", "$20,000", "8%"], ["Project Management", "PM overhead, meetings", "$10,000", "4%"]], "caption": "Detailed Budget Breakdown"}

2. **Cost Allocation Chart**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "chart", "chartType": "pie", "data": {"labels": ["Development", "Design", "Discovery", "Testing", "Deployment", "PM"], "datasets": [{"label": "Cost Distribution", "data": [50, 16, 10, 12, 8, 4]}]}, "caption": "Budget Allocation by Phase"}

3. **Payment Schedule Table**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "table", "tableType": "payment", "headers": ["Milestone", "Payment %", "Amount", "Due Date"], "rows": [["Contract Signing", "25%", "$62,500", "Upon signing"], ["Design Approval", "25%", "$62,500", "End of Phase 2"], ["Development Complete", "30%", "$75,000", "End of Phase 3"], ["Go-Live", "20%", "$50,000", "Project completion"]], "caption": "Payment Schedule"}

4. **ROI Projection Chart**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "chart", "chartType": "bar", "data": {"labels": ["Year 1", "Year 2", "Year 3"], "datasets": [{"label": "Investment", "data": [250, 50, 50]}, {"label": "Savings", "data": [100, 200, 300]}]}, "caption": "Investment vs. Expected Savings"}

5. **Callout Box**:
> **💰 Investment Insight:** [Highlight the ROI or value proposition]

TONE: Value-focused, transparent, emphasizing ROI and long-term benefits.`;
}

export function getGenericSectionPrompt(data: SectionPromptData): string {
  return `Generate content for the "${data.sectionTitle}" section.

=== PROJECT CONTEXT ===
Client: ${data.extractedData.clientCompany || 'the client'}
Project: ${data.extractedData.projectTitle || 'this project'}
Industry: ${data.extractedData.industry || 'N/A'}

${data.ragContext ? `\n=== RELEVANT EXAMPLES ===\n${data.ragContext}\n` : ''}

=== REQUIREMENTS ===
**IMPORTANT: If any data is missing or shows "N/A"/"TBD", generate realistic, professional values appropriate for this section. Use your expertise to fill in industry-standard details. NEVER output placeholders.**

${data.templateInstructions || `Write professional, comprehensive content (600-800 words) appropriate for a "${data.sectionTitle}" section in a business proposal.`}

=== REQUIRED VISUAL ELEMENTS ===

**CRITICAL: You MUST output at least 2-3 JSON visualization blocks EXACTLY as shown below, on separate lines in your response.**

1. **Summary Table**:
OUTPUT THIS EXACT JSON ON ITS OWN LINE (customize for your section):
{"type": "table", "tableType": "summary", "headers": ["Item", "Description", "Details"], "rows": [["Item 1", "Description 1", "Details 1"], ["Item 2", "Description 2", "Details 2"], ["Item 3", "Description 3", "Details 3"]], "caption": "${data.sectionTitle} Summary"}

2. **Process Diagram** (if applicable):
OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "mermaid", "code": "graph LR\\n    A[Step 1] --> B[Step 2]\\n    B --> C[Step 3]\\n    C --> D[Result]", "caption": "${data.sectionTitle} Process Flow"}

3. **Comparison Chart** (if applicable):
OUTPUT THIS EXACT JSON ON ITS OWN LINE:
{"type": "chart", "chartType": "bar", "data": {"labels": ["Category 1", "Category 2", "Category 3"], "datasets": [{"label": "Value", "data": [65, 45, 80]}]}, "caption": "${data.sectionTitle} Analysis"}

4. **Callout Box**:
> **💡 Key Insight:** [Highlight the most important point of this section]

Use ${data.contentType === 'bullets' ? 'bullet points where appropriate' : data.contentType === 'table' ? 'structured tables' : 'clear paragraphs'}.`;
}

export function getSectionPrompt(data: SectionPromptData): string {
  // Handle cases where sectionTitle might be undefined
  const sectionTitle = data.sectionTitle || data.sectionType || 'section';
  const titleLower = sectionTitle.toLowerCase();

  // Create data object with corrected sectionTitle
  const correctedData = { ...data, sectionTitle };

  if (titleLower.includes('executive summary') || titleLower.includes('summary')) {
    return getExecutiveSummaryPrompt(correctedData);
  }

  if (titleLower.includes('overview') || titleLower.includes('introduction')) {
    return getProjectOverviewPrompt(correctedData);
  }

  if (titleLower.includes('scope') || titleLower.includes('deliverable')) {
    return getScopePrompt(correctedData);
  }

  if (titleLower.includes('approach') || titleLower.includes('methodology')) {
    return getApproachPrompt(correctedData);
  }

  if (titleLower.includes('timeline') || titleLower.includes('schedule') || titleLower.includes('milestones')) {
    return getTimelinePrompt(correctedData);
  }

  if (titleLower.includes('team') || titleLower.includes('resources') || titleLower.includes('personnel')) {
    return getTeamPrompt(correctedData);
  }

  if (titleLower.includes('pricing') || titleLower.includes('cost') || titleLower.includes('investment') || titleLower.includes('budget')) {
    return getPricingPrompt(correctedData);
  }

  return getGenericSectionPrompt(correctedData);
}
