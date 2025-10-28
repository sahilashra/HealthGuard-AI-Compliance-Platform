import React, { useState } from 'react';
import { GapAnalysisProps } from '@/types/healthguard';
import { AlertTriangle, TrendingUp, Target, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const GapAnalysis: React.FC<GapAnalysisProps> = ({
  gapAnalysis,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState<'missing' | 'coverage' | 'risks' | 'traceability'>('missing');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'MEDIUM':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!gapAnalysis) {
    return null;
  }

  const tabs = [
    {
      id: 'missing' as const,
      label: 'Missing Requirements',
      count: gapAnalysis.missing_requirements?.length || 0,
      icon: <AlertTriangle className="w-4 h-4" />
    },
    {
      id: 'coverage' as const,
      label: 'Coverage Gaps',
      count: gapAnalysis.coverage_gaps?.length || 0,
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: 'risks' as const,
      label: 'Risk Areas',
      count: gapAnalysis.risk_areas?.length || 0,
      icon: <Target className="w-4 h-4" />
    },
    {
      id: 'traceability' as const,
      label: 'Traceability Matrix',
      count: 1,
      icon: <CheckCircle className="w-4 h-4" />
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          Intelligent Gap Analysis
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          AI-powered analysis identifying missing requirements, coverage gaps, and risk areas
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                border-b-2 whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {tab.icon}
              {tab.label}
              <span className={`
                px-2 py-0.5 rounded-full text-xs
                ${activeTab === tab.id
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Missing Requirements */}
        {activeTab === 'missing' && (
          <div className="space-y-4">
            {gapAnalysis.missing_requirements && gapAnalysis.missing_requirements.length > 0 ? (
              gapAnalysis.missing_requirements.map((req, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      {getPriorityIcon(req.priority)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            {req.standard}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getPriorityColor(req.priority)}`}>
                            {req.priority}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {req.requirement}
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">
                          {req.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No missing requirements identified
              </div>
            )}
          </div>
        )}

        {/* Coverage Gaps */}
        {activeTab === 'coverage' && (
          <div className="space-y-4">
            {gapAnalysis.coverage_gaps && gapAnalysis.coverage_gaps.length > 0 ? (
              gapAnalysis.coverage_gaps.map((gap, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <h4 className="text-base font-semibold text-gray-900 mb-3">
                    {gap.area}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Current Coverage</p>
                      <p className="text-sm text-gray-800">{gap.current_coverage}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Target Coverage</p>
                      <p className="text-sm text-gray-800">{gap.target_coverage}</p>
                    </div>
                  </div>
                  {gap.action_items && gap.action_items.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Action Items:</p>
                      <ul className="space-y-1">
                        {gap.action_items.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-purple-600 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No coverage gaps identified
              </div>
            )}
          </div>
        )}

        {/* Risk Areas */}
        {activeTab === 'risks' && (
          <div className="space-y-4">
            {gapAnalysis.risk_areas && gapAnalysis.risk_areas.length > 0 ? (
              gapAnalysis.risk_areas.map((risk, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border-l-4 border-gray-200 rounded-lg p-4"
                  style={{
                    borderLeftColor:
                      risk.impact === 'CRITICAL' ? '#ef4444' :
                      risk.impact === 'HIGH' ? '#f97316' :
                      risk.impact === 'MEDIUM' ? '#eab308' : '#3b82f6'
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="text-base font-semibold text-gray-900">
                      {risk.area}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(risk.impact)}`}>
                      {risk.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {risk.description}
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs font-medium text-blue-900 mb-1">
                      Mitigation Strategy:
                    </p>
                    <p className="text-sm text-blue-800">
                      {risk.mitigation}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No risk areas identified
              </div>
            )}
          </div>
        )}

        {/* Traceability Matrix */}
        {activeTab === 'traceability' && (
          <div className="space-y-4">
            {gapAnalysis.traceability_matrix && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Requirement-to-Test Traceability
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Requirements</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {gapAnalysis.traceability_matrix.requirements_count}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Test Cases</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {gapAnalysis.traceability_matrix.test_cases_count}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Coverage</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {gapAnalysis.traceability_matrix.coverage_percentage}%
                    </p>
                  </div>
                </div>

                {gapAnalysis.traceability_matrix.untested_requirements &&
                 gapAnalysis.traceability_matrix.untested_requirements.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-orange-900 mb-2">
                      Untested Requirements ({gapAnalysis.traceability_matrix.untested_requirements.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {gapAnalysis.traceability_matrix.untested_requirements.map((req, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded border border-orange-200"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
