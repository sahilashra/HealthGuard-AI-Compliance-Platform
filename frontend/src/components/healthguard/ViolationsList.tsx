import React from 'react';
import { ViolationsListProps, Violation } from '@/types/healthguard';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';

export const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
  onViolationClick,
  loading = false
}) => {
  const getSeverityIcon = (severity: Violation['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityBadgeColor = (severity: Violation['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityBorderColor = (severity: Violation['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (violations.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 rounded-full p-3">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          No Violations Found
        </h3>
        <p className="text-green-700">
          Your documentation meets all compliance requirements!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Compliance Violations ({violations.length})
        </h3>
        <div className="flex gap-2">
          {(['critical', 'high', 'medium', 'low'] as const).map((severity) => {
            const count = violations.filter(v => v.severity === severity).length;
            if (count === 0) return null;
            return (
              <span
                key={severity}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityBadgeColor(severity)}`}
              >
                {severity.toUpperCase()}: {count}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {violations.map((violation) => (
          <div
            key={violation.id}
            onClick={() => onViolationClick?.(violation)}
            className={`
              bg-white rounded-lg border-l-4 border border-gray-200 p-6 
              hover:shadow-md transition-shadow cursor-pointer
              ${getSeverityBorderColor(violation.severity)}
            `}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getSeverityIcon(violation.severity)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {violation.title}
                  </h4>
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0
                    ${getSeverityBadgeColor(violation.severity)}
                  `}>
                    {violation.severity.toUpperCase()}
                  </span>
                </div>

                <p className="text-gray-700 mb-3">
                  {violation.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Section: </span>
                    <span className="text-gray-600">{violation.section}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Impact: </span>
                    <span className="text-gray-600">{violation.impact}</span>
                  </div>
                </div>

                {violation.suggestedFix && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      💡 Suggested Fix:
                    </p>
                    <p className="text-sm text-blue-800">
                      {violation.suggestedFix}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
