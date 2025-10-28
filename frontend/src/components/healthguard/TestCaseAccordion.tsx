import React, { useState } from 'react';
import { TestCaseAccordionProps, TestCase } from '@/types/healthguard';
import { ChevronDown, ChevronUp, Copy, Check, AlertCircle } from 'lucide-react';

export const TestCaseAccordion: React.FC<TestCaseAccordionProps> = ({
  testCases,
  onTestCaseSelect,
  onCopy,
  selectedIds = []
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleCopy = (testCase: TestCase, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const text = `
Test Case: ${testCase.title}

Description: ${testCase.description}

Steps:
${testCase.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Expected Result: ${testCase.expectedResult}

Compliance Standards: ${testCase.complianceStandards.join(', ')}
Priority: ${testCase.priority.toUpperCase()}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedId(testCase.id);
    
    if (onCopy) {
      onCopy(testCase);
    }

    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPriorityColor = (priority: TestCase['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (testCases.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No test cases generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Generated Test Cases ({testCases.length})
        </h3>
        <div className="text-sm text-gray-600">
          {selectedIds.length > 0 && `${selectedIds.length} selected`}
        </div>
      </div>

      {testCases.map((testCase) => {
        const isExpanded = expandedIds.includes(testCase.id);
        const isSelected = selectedIds.includes(testCase.id);
        const isCopied = copiedId === testCase.id;

        return (
          <div
            key={testCase.id}
            className={`
              bg-white rounded-lg border transition-all
              ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            {/* Header */}
            <div
              onClick={() => toggleExpand(testCase.id)}
              className="flex items-center justify-between p-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 flex-1">
                {onTestCaseSelect && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onTestCaseSelect(testCase.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                )}
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {testCase.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(testCase.priority)}`}>
                      {testCase.priority.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {testCase.complianceStandards.slice(0, 2).join(', ')}
                      {testCase.complianceStandards.length > 2 && ` +${testCase.complianceStandards.length - 2}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCopy(testCase, e)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy test case"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="pt-4 space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                    <p className="text-gray-700">{testCase.description}</p>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Test Steps</h5>
                    <ol className="list-decimal list-inside space-y-2">
                      {testCase.steps.map((step, index) => (
                        <li key={index} className="text-gray-700">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Expected Result</h5>
                    <p className="text-gray-700 bg-green-50 border border-green-200 rounded-lg p-3">
                      {testCase.expectedResult}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Compliance Standards</h5>
                    <div className="flex flex-wrap gap-2">
                      {testCase.complianceStandards.map((standard, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
                        >
                          {standard}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
