import React from 'react';
import { BeforeAfterProps } from '@/types/healthguard';
import { ArrowRight, Clock, Zap } from 'lucide-react';

export const BeforeAfter: React.FC<BeforeAfterProps> = ({
  beforeValue,
  afterValue,
  beforeLabel = 'Before',
  afterLabel = 'After',
  metric
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center gap-2 mb-8">
        <Zap className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">
          {metric || 'Transformation Impact'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Before */}
        <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200 min-h-[180px] flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <Clock className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-sm font-medium text-red-900 uppercase tracking-wide whitespace-nowrap">
              {beforeLabel}
            </span>
          </div>
          <div className="text-3xl font-bold text-red-900 mb-3 break-words hyphens-auto">
            {beforeValue}
          </div>
          <div className="text-sm text-red-700 break-words leading-relaxed hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            Manual, time-consuming process
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center items-center flex-shrink-0">
          <div className="bg-blue-100 rounded-full p-4">
            <ArrowRight className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* After */}
        <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200 min-h-[180px] flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <Zap className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium text-green-900 uppercase tracking-wide whitespace-nowrap">
              {afterLabel}
            </span>
          </div>
          <div className="text-3xl font-bold text-green-900 mb-3 break-words hyphens-auto">
            {afterValue}
          </div>
          <div className="text-sm text-green-700 break-words leading-relaxed hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            Automated, AI-powered efficiency
          </div>
        </div>
      </div>
    </div>
  );
};
