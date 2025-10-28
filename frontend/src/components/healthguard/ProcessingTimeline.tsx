import React from 'react';
import { ProcessingTimelineProps, ProcessingStep } from '@/types/healthguard';
import { FileText, Brain, FileCheck, CheckCircle, Loader2 } from 'lucide-react';

const defaultSteps = [
  {
    id: 'parsing' as ProcessingStep,
    label: 'Parsing Document',
    description: 'Extracting text and structure from your document'
  },
  {
    id: 'analyzing' as ProcessingStep,
    label: 'Analyzing Compliance',
    description: 'Identifying requirements and potential violations'
  },
  {
    id: 'generating' as ProcessingStep,
    label: 'Generating Tests',
    description: 'Creating comprehensive test cases'
  },
  {
    id: 'complete' as ProcessingStep,
    label: 'Complete',
    description: 'Analysis finished successfully'
  }
];

export const ProcessingTimeline: React.FC<ProcessingTimelineProps> = ({
  currentStep,
  currentMessage,
  steps = defaultSteps
}) => {
  const getStepIcon = (stepId: ProcessingStep, isActive: boolean, isComplete: boolean) => {
    const iconClass = `w-6 h-6 ${isActive ? 'animate-pulse' : ''}`;
    
    if (isComplete) {
      return <CheckCircle className={`${iconClass} text-green-600`} />;
    }
    
    if (isActive) {
      return <Loader2 className={`${iconClass} text-blue-600 animate-spin`} />;
    }

    switch (stepId) {
      case 'parsing':
        return <FileText className={`${iconClass} text-gray-400`} />;
      case 'analyzing':
        return <Brain className={`${iconClass} text-gray-400`} />;
      case 'generating':
        return <FileCheck className={`${iconClass} text-gray-400`} />;
      case 'complete':
        return <CheckCircle className={`${iconClass} text-gray-400`} />;
      default:
        return <FileText className={`${iconClass} text-gray-400`} />;
    }
  };

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Processing Status</h3>
      
      <div className="relative">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = index < currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-6 top-12 w-0.5 h-12 -ml-px transition-colors duration-500
                    ${isComplete ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}

              {/* Step content */}
              <div className="flex items-start gap-4 pb-8">
                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                  transition-colors duration-500
                  ${isComplete ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-gray-100'}
                `}>
                  {getStepIcon(step.id, isActive, isComplete)}
                </div>

                {/* Text */}
                <div className="flex-1 pt-1">
                  <h4 className={`
                    font-medium transition-colors duration-300
                    ${isComplete ? 'text-green-900' : isActive ? 'text-blue-900' : 'text-gray-500'}
                  `}>
                    {step.label}
                  </h4>
                  <p className={`
                    text-sm mt-1 transition-colors duration-300
                    ${isComplete ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-500'}
                  `}>
                    {isActive && currentMessage ? currentMessage : step.description}
                  </p>

                  {/* Progress indicator for active step */}
                  {isActive && (
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                    </div>
                  )}

                  {/* Checkmark for completed steps */}
                  {isComplete && (
                    <div className="mt-2 text-xs font-medium text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall progress */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-medium text-gray-900">
            {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
