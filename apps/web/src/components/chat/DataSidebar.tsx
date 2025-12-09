import { ExtractedData } from '@proposal-gen/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

interface DataSidebarProps {
  extractedData: ExtractedData;
  progress: number;
  currentPhase: string;
}

export function DataSidebar({ extractedData, progress, currentPhase }: DataSidebarProps) {
  const renderField = (label: string, value: any) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    return (
      <div className="mb-3">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        {Array.isArray(value) ? (
          <ul className="text-sm space-y-1">
            {value.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Circle className="w-1.5 h-1.5 mt-1.5 fill-current" />
                <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
        ) : typeof value === 'object' ? (
          <p className="text-sm">{JSON.stringify(value, null, 2)}</p>
        ) : (
          <p className="text-sm">{value}</p>
        )}
      </div>
    );
  };

  const hasClientInfo =
    extractedData.clientName || extractedData.clientCompany || extractedData.clientEmail;
  const hasProjectInfo =
    extractedData.projectTitle || extractedData.projectType || extractedData.objectives;
  const hasScope = extractedData.scope || extractedData.inScope || extractedData.deliverables;
  const hasTimeline = extractedData.timeline || extractedData.startDate || extractedData.endDate;
  const hasBudget = extractedData.budget || extractedData.budgetRange;

  return (
    <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Progress</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground capitalize">
            {currentPhase?.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {hasClientInfo && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <CardTitle className="text-sm">Client Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {renderField('Client Name', extractedData.clientName)}
              {renderField('Company', extractedData.clientCompany)}
              {renderField('Email', extractedData.clientEmail)}
              {renderField('Phone', extractedData.clientPhone)}
              {renderField('Industry', extractedData.clientIndustry || extractedData.industry)}
            </CardContent>
          </Card>
        )}

        {hasProjectInfo && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <CardTitle className="text-sm">Project Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {renderField('Project Title', extractedData.projectTitle)}
              {renderField('Project Type', extractedData.projectType)}
              {renderField('Objectives', extractedData.objectives)}
              {renderField('Requirements', extractedData.requirements)}
              {renderField('Deliverables', extractedData.deliverables)}
              {renderField('Technologies', extractedData.technologies)}
              {renderField('Platforms', extractedData.platforms)}
            </CardContent>
          </Card>
        )}

        {hasScope && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <CardTitle className="text-sm">Scope</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {renderField('Description', extractedData.scope)}
              {renderField('In Scope', extractedData.inScope)}
              {renderField('Out of Scope', extractedData.outOfScope)}
              {renderField('Assumptions', extractedData.assumptions)}
            </CardContent>
          </Card>
        )}

        {hasTimeline && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <CardTitle className="text-sm">Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {renderField('Duration', extractedData.timeline)}
              {renderField('Start Date', extractedData.startDate)}
              {renderField('End Date', extractedData.endDate)}
              {renderField('Milestones', extractedData.milestones)}
            </CardContent>
          </Card>
        )}

        {hasBudget && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <CardTitle className="text-sm">Budget</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {renderField('Budget', extractedData.budget)}
              {renderField('Budget Range', extractedData.budgetRange)}
              {renderField('Payment Terms', extractedData.paymentTerms)}
              {renderField('Payment Schedule', extractedData.paymentSchedule)}
            </CardContent>
          </Card>
        )}

        {Object.keys(extractedData).length === 0 && (
          <Card>
            <CardHeader>
              <CardDescription className="text-center">
                Extracted information will appear here as you provide details
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
