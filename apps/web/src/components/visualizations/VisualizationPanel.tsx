import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ChartPreview } from './ChartPreview';
import { DiagramPreview } from './DiagramPreview';
import { Loader2, Sparkles } from 'lucide-react';
import type { ChartType, DiagramType, ChartConfig, DiagramConfig } from '@proposal-gen/shared';
import { getApiUrl } from '../../lib/api';

const API_BASE_URL = getApiUrl();

interface VisualizationPanelProps {
  proposalId: string;
  sectionId: string;
  onVisualizationCreated?: (visualization: any) => void;
}

export function VisualizationPanel({
  proposalId,
  sectionId,
  onVisualizationCreated,
}: VisualizationPanelProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'diagram'>('chart');
  const [generating, setGenerating] = useState(false);

  // Chart state
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartTitle, setChartTitle] = useState('');
  const [chartContext, setChartContext] = useState('');
  const [chartPreview, setChartPreview] = useState<ChartConfig | null>(null);

  // Diagram state
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const [diagramDescription, setDiagramDescription] = useState('');
  const [diagramPreview, setDiagramPreview] = useState<DiagramConfig | null>(null);

  const handleGenerateChart = async () => {
    if (!chartTitle) {
      alert('Please enter a chart title');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/visualizations/chart/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId,
            sectionId,
            chartType,
            title: chartTitle,
            context: chartContext,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setChartPreview(data.visualization.config);
        onVisualizationCreated?.(data.visualization);
      } else {
        alert('Failed to generate chart');
      }
    } catch (error) {
      console.error('Error generating chart:', error);
      alert('Failed to generate chart. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateDiagram = async () => {
    if (!diagramDescription) {
      alert('Please enter a diagram description');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/visualizations/diagram/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId,
            sectionId,
            diagramType,
            description: diagramDescription,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setDiagramPreview(data.visualization.config);
        onVisualizationCreated?.(data.visualization);
      } else {
        alert('Failed to generate diagram');
      }
    } catch (error) {
      console.error('Error generating diagram:', error);
      alert('Failed to generate diagram. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chart' | 'diagram')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Charts</TabsTrigger>
            <TabsTrigger value="diagram">Diagrams</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chart-type">Chart Type</Label>
                <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                  <SelectTrigger id="chart-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="doughnut">Doughnut Chart</SelectItem>
                    <SelectItem value="radar">Radar Chart</SelectItem>
                    <SelectItem value="polarArea">Polar Area Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chart-title">Chart Title</Label>
                <Input
                  id="chart-title"
                  placeholder="e.g., Cost Breakdown by Phase"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chart-context">Additional Context (Optional)</Label>
                <Textarea
                  id="chart-context"
                  placeholder="Provide any specific details for the chart generation..."
                  value={chartContext}
                  onChange={(e) => setChartContext(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleGenerateChart}
                disabled={generating || !chartTitle}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Chart
                  </>
                )}
              </Button>

              {chartPreview && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-sm font-medium mb-3">Preview</h4>
                  <ChartPreview config={chartPreview} height={300} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="diagram" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagram-type">Diagram Type</Label>
                <Select
                  value={diagramType}
                  onValueChange={(v) => setDiagramType(v as DiagramType)}
                >
                  <SelectTrigger id="diagram-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flowchart">Flowchart</SelectItem>
                    <SelectItem value="sequence">Sequence Diagram</SelectItem>
                    <SelectItem value="gantt">Gantt Chart</SelectItem>
                    <SelectItem value="architecture">Architecture Diagram</SelectItem>
                    <SelectItem value="erDiagram">ER Diagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagram-description">Description</Label>
                <Textarea
                  id="diagram-description"
                  placeholder="Describe what you want to visualize. E.g., 'Project implementation workflow with phases: discovery, design, development, testing, deployment'"
                  value={diagramDescription}
                  onChange={(e) => setDiagramDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleGenerateDiagram}
                disabled={generating || !diagramDescription}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Diagram
                  </>
                )}
              </Button>

              {diagramPreview && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-sm font-medium mb-3">Preview</h4>
                  <DiagramPreview config={diagramPreview} />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
