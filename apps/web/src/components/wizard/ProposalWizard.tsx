import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../../stores/wizard';
import { WizardProgress } from './WizardProgress';
import {
  ClientInfoStep,
  ProjectDetailsStep,
  ScopeTimelineStep,
  BudgetStep,
  TemplateSelectionStep,
  ReviewStep,
} from './WizardStepForms';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export function ProposalWizard() {
  const navigate = useNavigate();
  const {
    sessionId,
    currentStep,
    completedSteps,
    data,
    errors,
    steps,
    loading,
    initializeWizard,
    fetchSteps,
    nextStep,
    previousStep,
    completeWizard,
    cancelWizard,
    updateData,
  } = useWizardStore();

  const [currentStepData, setCurrentStepData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSteps();
    if (!sessionId) {
      initializeWizard();
    }
  }, []);

  useEffect(() => {
    // Load current step data
    setCurrentStepData({ ...data });
  }, [currentStep, data]);

  const handleFieldChange = (field: string, value: any) => {
    setCurrentStepData((prev) => ({ ...prev, [field]: value }));
    updateData({ [field]: value });
  };

  const handleNext = async () => {
    await nextStep(currentStepData);
  };

  const handlePrevious = async () => {
    await previousStep();
  };

  const handleComplete = async () => {
    try {
      const proposalId = await completeWizard();
      navigate(`/proposals/${proposalId}`);
    } catch (error) {
      console.error('Failed to complete wizard:', error);
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
      await cancelWizard();
      navigate('/');
    }
  };

  if (!steps.length || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wizard...</p>
        </div>
      </div>
    );
  }

  const currentStepInfo = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ClientInfoStep
            data={currentStepData}
            errors={errors}
            onChange={handleFieldChange}
          />
        );
      case 1:
        return (
          <ProjectDetailsStep
            data={currentStepData}
            errors={errors}
            onChange={handleFieldChange}
          />
        );
      case 2:
        return (
          <ScopeTimelineStep
            data={currentStepData}
            errors={errors}
            onChange={handleFieldChange}
          />
        );
      case 3:
        return (
          <BudgetStep
            data={currentStepData}
            errors={errors}
            onChange={handleFieldChange}
          />
        );
      case 4:
        return (
          <TemplateSelectionStep
            data={currentStepData}
            errors={errors}
            onChange={handleFieldChange}
          />
        );
      case 5:
        return (
          <ReviewStep
            data={currentStepData}
            errors={errors}
            onChange={handleFieldChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create New Proposal</h1>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress indicator */}
          <WizardProgress
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Main content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep || loading}
            className={`inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg font-medium ${
              isFirstStep || loading
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="px-6 py-3 text-gray-700 font-medium hover:text-gray-900"
            >
              Cancel
            </button>

            {isLastStep ? (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Create Proposal
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
