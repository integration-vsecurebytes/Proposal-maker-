# Comprehensive Testing Plan
## Enhanced Proposal Generation System

---

## 1. Unit Testing

### 1.1 Conversation Service Tests
**Location**: `/apps/api/src/services/conversation/__tests__/`

#### Test Cases:
- [ ] **Phase Progression**: Verify all 14 phases execute in correct order
- [ ] **Data Extraction**: Confirm all 45+ fields are correctly extracted from user input
- [ ] **Dynamic Progress Calculation**: Verify progress calculates correctly based on PHASE_ORDER length
- [ ] **Phase Completion Logic**: Test `isPhaseComplete()` for all new phase types
- [ ] **RAG Integration**: Verify RAG context is applied to 6 technical phases
- [ ] **Intelligent Follow-ups**: Test AI generates contextual follow-up questions

**Test Command**:
```bash
pnpm test --filter @proposal-gen/api -- conversation
```

---

### 1.2 Visualization Services Tests
**Location**: `/apps/api/src/services/visualizations/__tests__/`

#### 1.2.1 Table Generation Service
- [ ] **Budget Table**: Generate table with subtotals, taxes, proper formatting
- [ ] **Timeline Table**: Generate phase-based table with milestones
- [ ] **Team Table**: Generate table with roles, allocation percentages
- [ ] **Risk Matrix**: Generate table with likelihood/impact color-coding
- [ ] **Stakeholder Matrix**: Generate table with decision levels
- [ ] **KPIs Table**: Generate table with metrics, targets, measurements
- [ ] **Empty Data Handling**: Return null when insufficient data
- [ ] **Dynamic Field Access**: Tables adapt to available data fields

#### 1.2.2 Diagram Generation Service
- [ ] **System Architecture**: Generate multi-layer architecture diagram
- [ ] **Project Workflow**: Generate flowchart from methodology data
- [ ] **Team Structure**: Generate org chart from team data
- [ ] **Integration Flow**: Generate integration diagram from integrations array
- [ ] **Timeline Roadmap**: Generate Gantt-style timeline
- [ ] **Stakeholder Map**: Generate stakeholder relationship diagram
- [ ] **Mindmap**: Generate project overview mindmap
- [ ] **Mermaid Syntax**: All diagrams have valid Mermaid syntax
- [ ] **Empty Data Handling**: Return null when insufficient data

**Test Command**:
```bash
pnpm test --filter @proposal-gen/api -- visualizations
```

---

### 1.3 Chart/Diagram Image Generation Tests
**Location**: `/apps/api/src/services/documents/__tests__/`

#### 1.3.1 Chart-to-Image Service
- [ ] **PNG Generation**: Chart.js renders to valid PNG buffer
- [ ] **Multiple Chart Types**: Bar, Line, Pie, Doughnut all work
- [ ] **Custom Sizing**: Respects width/height options
- [ ] **Background Color**: Applies custom background colors
- [ ] **Batch Generation**: Generates multiple charts in sequence
- [ ] **Error Handling**: Returns null on invalid chart config

#### 1.3.2 Diagram-to-Image Service
- [ ] **Puppeteer Browser**: Headless browser launches successfully
- [ ] **Mermaid Rendering**: Mermaid SVG renders correctly
- [ ] **PNG Screenshot**: SVG converted to PNG image
- [ ] **Auto-sizing**: Estimates size based on code complexity
- [ ] **Browser Cleanup**: Browser closes on process exit
- [ ] **Multiple Renders**: Reuses browser for batch operations
- [ ] **Error Handling**: Returns null on invalid Mermaid syntax

**Test Command**:
```bash
pnpm test --filter @proposal-gen/api -- documents/chart-to-image
pnpm test --filter @proposal-gen/api -- documents/diagram-to-image
```

---

### 1.4 DOCX Generator Tests
**Location**: `/apps/api/src/services/documents/__tests__/`

#### Test Cases:
- [ ] **Rich Table Formatting**: Tables use template.table_styles
- [ ] **Themed Headers**: Headers use primary_color from branding
- [ ] **Alternating Rows**: Row backgrounds alternate correctly
- [ ] **Chart Embedding**: Charts embedded as PNG images with captions
- [ ] **Diagram Embedding**: Diagrams embedded as PNG images with captions
- [ ] **Callout Boxes**: Callouts rendered with borders and backgrounds
- [ ] **Color Conversion**: `hexToRgb()` and `rgbToHex()` work correctly
- [ ] **Image Resizing**: Images resize to appropriate document dimensions
- [ ] **Caption Rendering**: Captions appear below visual elements
- [ ] **Error Handling**: Continues on visualization failure, doesn't crash

**Test Command**:
```bash
pnpm test --filter @proposal-gen/api -- documents/docx-generator
```

---

### 1.5 Proposal Generator Tests
**Location**: `/apps/api/src/services/proposal/__tests__/`

#### Test Cases:
- [ ] **Visualization Parsing**: Parses all 4 visualization types (table, chart, mermaid, callout)
- [ ] **JSON Extraction**: Correctly extracts JSON blocks from AI output
- [ ] **Callout Parsing**: Parses markdown blockquotes (> **Title:** Content)
- [ ] **Content Cleaning**: Removes visualization JSON from final content
- [ ] **Token Limit**: Supports 4096 tokens for comprehensive content
- [ ] **Section Generation**: Generates 800-1000 word sections
- [ ] **RAG Context**: Applies RAG context to technical sections
- [ ] **Error Recovery**: Saves error state when section generation fails
- [ ] **Incremental Save**: Auto-saves after each section completion
- [ ] **Resume Capability**: Skips already generated sections on retry

**Test Command**:
```bash
pnpm test --filter @proposal-gen/api -- proposal/generator
```

---

## 2. Integration Testing

### 2.1 End-to-End Conversation Flow
**Test Scenario**: Complete conversation from start to finish

#### Steps:
1. Start conversation → Verify phase = 'client_info'
2. Provide client info → Verify phase advances to 'project_details'
3. Continue through all 14 phases → Verify data extraction
4. Complete conversation → Verify extractedData contains 35+ fields
5. Check progress calculation → Verify increments correctly

**Expected Results**:
- All 14 phases execute in sequence
- Progress goes from 0% → 100%
- extractedData populated with all provided information
- No phase is skipped or repeated

**Test Command**:
```bash
pnpm test:e2e --filter @proposal-gen/api -- conversation-flow
```

---

### 2.2 End-to-End Proposal Generation
**Test Scenario**: Generate complete proposal with all visual elements

#### Steps:
1. Create proposal with conversation data
2. Trigger generation → Verify status = 'in_progress'
3. Monitor progress → Verify incremental section completion
4. Wait for completion → Verify status = 'generated'
5. Check generatedContent → Verify all sections have content + visualizations

**Expected Results**:
- All sections generated successfully (or marked with error)
- Each section contains:
  - 800-1000 words of content
  - 2-4 visualizations (tables, charts, diagrams, callouts)
- Visualizations have proper structure (type, data, caption)
- Generation time < 7 minutes
- No server crashes or memory leaks

**Test Command**:
```bash
pnpm test:e2e --filter @proposal-gen/api -- proposal-generation
```

---

### 2.3 End-to-End DOCX Export
**Test Scenario**: Export proposal to DOCX with embedded images

#### Steps:
1. Generate proposal with visualizations
2. Export to DOCX → Verify file generated
3. Open DOCX file → Verify structure
4. Check visual elements → Verify embedded images
5. Verify theming → Check colors, fonts, spacing

**Expected Results**:
- DOCX file size: 5-12 MB (with images)
- File opens in Microsoft Word without errors
- All sections present with correct headings
- Images embedded and visible
- Tables have themed styling (colored headers, alternating rows)
- Callouts have borders and backgrounds
- Cover page, TOC, signature page all present
- Fonts and colors match template branding

**Test Command**:
```bash
pnpm test:e2e --filter @proposal-gen/api -- docx-export
```

---

## 3. Frontend Testing

### 3.1 Component Tests
**Location**: `/apps/web/src/components/preview/__tests__/`

#### 3.1.1 TableRenderer Component
- [ ] **Renders Headers**: Displays all header cells
- [ ] **Renders Rows**: Displays all data rows
- [ ] **Alternating Rows**: Applies odd/even background colors
- [ ] **Themed Styling**: Uses template.table_styles colors
- [ ] **Caption Display**: Shows caption below table
- [ ] **Total Row Detection**: Bolds rows with "Total" in first cell
- [ ] **Responsive**: Horizontal scroll on small screens

#### 3.1.2 CalloutRenderer Component
- [ ] **Renders Title**: Displays callout title
- [ ] **Renders Content**: Displays callout content
- [ ] **Correct Icon**: Shows appropriate icon for type (info, success, warning, tip, note)
- [ ] **Themed Colors**: Applies correct border and background colors
- [ ] **Parse Function**: `parseAndRenderCallouts()` extracts callouts from markdown

#### 3.1.3 ProposalPreview Component
- [ ] **Imports New Components**: TableRenderer and CalloutRenderer imported
- [ ] **Renders Tables**: Tables display using TableRenderer
- [ ] **Renders Callouts**: Callouts display using CalloutRenderer
- [ ] **Renders Charts**: Charts display in bordered containers with captions
- [ ] **Renders Diagrams**: Mermaid diagrams display with captions
- [ ] **Pagination**: Sections paginated correctly (3 per page)
- [ ] **Theme Application**: CSS variables applied from branding

**Test Command**:
```bash
pnpm test --filter @proposal-gen/web -- components/preview
```

---

### 3.2 Visual Regression Testing
**Tools**: Playwright, Percy, or Chromatic

#### Test Cases:
- [ ] **Cover Page**: Logos, title, date positioned correctly
- [ ] **Table of Contents**: All sections listed with page numbers
- [ ] **Text Sections**: Headings, paragraphs, bullets formatted correctly
- [ ] **Tables**: Headers colored, rows alternating, borders visible
- [ ] **Charts**: Chart renders with correct data and colors
- [ ] **Diagrams**: Mermaid diagrams render without errors
- [ ] **Callouts**: Callouts have borders, icons, backgrounds
- [ ] **Theming**: Primary/secondary colors applied consistently
- [ ] **Responsive**: Layout works on desktop, tablet, mobile

**Test Command**:
```bash
pnpm test:visual --filter @proposal-gen/web
```

---

## 4. Performance Testing

### 4.1 Generation Performance
**Metrics to Track**:
- [ ] **Conversation Duration**: < 5 minutes for 14 phases
- [ ] **Section Generation Time**: 10-20 seconds per section
- [ ] **Total Generation Time**: < 7 minutes for 15-20 sections
- [ ] **AI Token Usage**: 15,000-25,000 tokens per proposal (< $0.75 at GPT-4o pricing)
- [ ] **Memory Usage**: < 500 MB during generation
- [ ] **Database Writes**: Incremental saves don't slow down generation

**Test Command**:
```bash
pnpm test:perf --filter @proposal-gen/api -- generation
```

---

### 4.2 Image Generation Performance
**Metrics to Track**:
- [ ] **Chart Generation**: < 1 second per chart
- [ ] **Diagram Generation**: < 3 seconds per diagram (Puppeteer overhead)
- [ ] **Browser Launch**: Reused browser adds < 500ms per diagram
- [ ] **Image Size**: Charts 50-150 KB, Diagrams 100-300 KB
- [ ] **Batch Processing**: 10 images in < 30 seconds

**Test Command**:
```bash
pnpm test:perf --filter @proposal-gen/api -- image-generation
```

---

### 4.3 DOCX Export Performance
**Metrics to Track**:
- [ ] **Export Time**: < 30 seconds for 20-section proposal
- [ ] **File Size**: 5-12 MB with 10-15 embedded images
- [ ] **Memory Usage**: < 300 MB during export
- [ ] **Image Embedding**: < 2 seconds per image
- [ ] **Table Rendering**: < 100ms per table

**Test Command**:
```bash
pnpm test:perf --filter @proposal-gen/api -- docx-export
```

---

## 5. Quality Assurance Testing

### 5.1 AI Content Quality
**Manual Review Required**:
- [ ] **Relevance**: Content matches section purpose and extractedData
- [ ] **Coherence**: Paragraphs flow logically, no contradictions
- [ ] **Completeness**: Sections are 800-1000 words (not truncated)
- [ ] **Professional Tone**: Language is formal, confident, consultative
- [ ] **Accuracy**: No hallucinated data (references only extractedData)
- [ ] **Visual Integration**: Visuals complement text, not redundant
- [ ] **Grammar**: No obvious grammatical errors
- [ ] **Formatting**: No broken markdown, JSON parsing errors

**Test Method**:
1. Generate 5 sample proposals across different industries
2. Review each section manually
3. Rate on scale 1-5 for each quality metric
4. Average score should be ≥ 4.0

---

### 5.2 Visual Element Quality
**Manual Review Required**:
- [ ] **Table Completeness**: All relevant data included
- [ ] **Chart Accuracy**: Data visualized correctly
- [ ] **Diagram Clarity**: Diagrams easy to understand
- [ ] **Color Consistency**: Template colors applied throughout
- [ ] **Label Readability**: Text not cut off, appropriate font sizes
- [ ] **Layout Balance**: Visuals well-distributed, not clustered
- [ ] **Caption Relevance**: Captions accurately describe visuals

**Test Method**:
1. Generate 3 proposals with maximum visual elements
2. Review each visualization type (table, chart, diagram, callout)
3. Verify data accuracy and presentation quality
4. Check DOCX export for image quality

---

### 5.3 Theming Consistency
**Manual Review Required**:
- [ ] **Cover Page**: Primary color on title, logos positioned correctly
- [ ] **Headings**: All H1, H2, H3 use primary/secondary colors
- [ ] **Tables**: Header background matches primary color
- [ ] **Charts**: Chart colors match template.chart_styles.colors
- [ ] **Diagrams**: Mermaid theme uses template colors
- [ ] **Callouts**: Border/background colors from template.callout_styles
- [ ] **Spacing**: Consistent section/paragraph spacing throughout
- [ ] **Fonts**: Heading and body fonts match template

**Test Method**:
1. Create 2 templates with distinct color schemes (blue vs orange)
2. Generate proposals using each template
3. Verify all elements use correct colors
4. Compare web preview vs DOCX export consistency

---

## 6. Error Handling & Edge Cases

### 6.1 Conversation Edge Cases
- [ ] **Empty Input**: AI handles blank responses gracefully
- [ ] **Minimal Input**: Works with sparse data (only 5-10 fields)
- [ ] **Excessive Input**: Handles 1000+ word responses without truncation
- [ ] **Invalid Data**: Rejects malformed dates, negative budgets
- [ ] **Interruption**: Can resume conversation if user stops mid-phase

### 6.2 Generation Edge Cases
- [ ] **No RAG Context**: Generates quality content without RAG
- [ ] **API Failure**: Retries AI calls, falls back to error state
- [ ] **Missing Data**: Generates sections with partial data
- [ ] **Invalid JSON**: Skips malformed visualization JSON
- [ ] **Token Limit Hit**: Completes section even if truncated at 4096 tokens

### 6.3 Export Edge Cases
- [ ] **No Visualizations**: Exports text-only proposals successfully
- [ ] **Large Images**: Handles 2MB+ diagram images
- [ ] **Missing Assets**: DOCX generation succeeds without logos
- [ ] **Invalid Mermaid**: Skips diagram if rendering fails
- [ ] **Chart Errors**: Skips chart if Chart.js config invalid

---

## 7. Browser Compatibility Testing

### 7.1 Web Preview Compatibility
**Browsers to Test**:
- [ ] Chrome 120+
- [ ] Firefox 120+
- [ ] Safari 17+
- [ ] Edge 120+

**Test Cases**:
- [ ] Mermaid diagrams render
- [ ] Chart.js charts render
- [ ] Tables display correctly
- [ ] Callouts display correctly
- [ ] Pagination works
- [ ] Responsive on mobile (390px width)

---

## 8. Accessibility Testing

### 8.1 WCAG 2.1 AA Compliance
- [ ] **Color Contrast**: All text meets 4.5:1 contrast ratio
- [ ] **Keyboard Navigation**: Can navigate preview with keyboard only
- [ ] **Screen Reader**: Headings, tables, images have proper ARIA labels
- [ ] **Alt Text**: All images (charts, diagrams) have descriptive alt text
- [ ] **Focus Indicators**: Visible focus states on interactive elements

**Test Tools**:
- axe DevTools
- WAVE browser extension
- Manual keyboard navigation test

---

## 9. Security Testing

### 9.1 Input Validation
- [ ] **XSS Prevention**: User input sanitized before rendering
- [ ] **SQL Injection**: Drizzle ORM protects against SQL injection
- [ ] **File Upload**: Logo uploads validated (type, size, dimensions)
- [ ] **API Rate Limiting**: OpenAI API calls rate-limited per user

### 9.2 Data Privacy
- [ ] **Proposal Isolation**: Users can only access their own proposals
- [ ] **Asset Isolation**: Users can only access their own assets
- [ ] **Session Security**: JWT tokens expire after 7 days
- [ ] **HTTPS**: All API calls use HTTPS in production

---

## 10. Deployment Testing

### 10.1 Build & Deploy
- [ ] **TypeScript Compilation**: No build errors
- [ ] **Linting**: ESLint passes with no errors
- [ ] **Dependencies**: All packages install successfully
- [ ] **Environment Variables**: All required env vars documented
- [ ] **Database Migration**: Schema migrations run successfully
- [ ] **Asset Storage**: File uploads work in production storage (S3, etc.)

**Test Command**:
```bash
pnpm build
pnpm lint
pnpm db:push
```

---

### 10.2 Production Environment
- [ ] **API Response Time**: < 200ms for read operations
- [ ] **Generation Queue**: Handles 10 concurrent proposals
- [ ] **Error Monitoring**: Sentry captures all errors
- [ ] **Logging**: Structured logs for debugging
- [ ] **Backup**: Database backed up daily
- [ ] **Uptime**: 99.9% uptime SLA

---

## 11. Regression Testing Checklist

After any code changes, verify:
- [ ] All 14 conversation phases still work
- [ ] Existing proposals still render correctly
- [ ] DOCX export still produces valid files
- [ ] No breaking changes to API endpoints
- [ ] Database schema changes are backward compatible

---

## 12. User Acceptance Testing (UAT)

### 12.1 UAT Scenarios
1. **Business Analyst Creates Proposal**:
   - Complete conversation with realistic data
   - Review generated proposal for accuracy
   - Export to DOCX and share with stakeholders
   - Gather feedback on content quality

2. **Sales Executive Uses for Client Pitch**:
   - Generate proposal with aggressive timeline
   - Customize branding with company colors
   - Verify visual elements are client-friendly
   - Export and present in client meeting

3. **Project Manager Creates Technical Proposal**:
   - Provide detailed technical architecture
   - Verify diagrams accurately represent system
   - Check timeline tables match project plan
   - Ensure team structure is clear

### 12.2 UAT Success Criteria
- [ ] 90%+ of users complete conversation without assistance
- [ ] 85%+ satisfied with generated content quality
- [ ] 80%+ find DOCX export professional and usable
- [ ] 95%+ would use system for future proposals
- [ ] < 5% of proposals require major manual edits

---

## 13. Testing Timeline

### Week 1: Unit & Integration Testing
- Days 1-2: Write unit tests for all services
- Days 3-4: Write integration tests for conversation + generation
- Day 5: Run all tests, fix failures

### Week 2: Frontend & Performance Testing
- Days 1-2: Write component tests, visual regression tests
- Days 3-4: Performance testing and optimization
- Day 5: Browser compatibility testing

### Week 3: QA & UAT
- Days 1-2: Manual QA for content quality and theming
- Days 3-4: User acceptance testing with 5 users
- Day 5: Fix bugs and incorporate feedback

### Week 4: Final Verification
- Days 1-2: Regression testing after bug fixes
- Days 3-4: Deployment testing (staging → production)
- Day 5: Production smoke tests, monitoring setup

---

## 14. Test Automation

### 14.1 CI/CD Integration
**GitHub Actions Workflow**:
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:e2e
```

---

## 15. Success Metrics

### Overall Goals:
✅ **100% Unit Test Coverage** for critical services
✅ **95% Integration Test Coverage** for end-to-end flows
✅ **< 5% Bug Rate** in production (first 3 months)
✅ **< 7 min** Average proposal generation time
✅ **< $0.75** Average AI cost per proposal
✅ **4.0+/5.0** User satisfaction score
✅ **99.9%** Uptime in production

---

## Conclusion

This comprehensive testing plan ensures the enhanced proposal generation system meets all quality, performance, and user experience requirements. Each phase builds confidence that the system produces designer-quality proposals with rich visual elements, comprehensive content, and professional theming.

**Next Steps**:
1. Implement unit tests for new services
2. Set up CI/CD test automation
3. Conduct manual QA for first generated proposals
4. Schedule UAT sessions with target users
5. Monitor production metrics post-deployment
