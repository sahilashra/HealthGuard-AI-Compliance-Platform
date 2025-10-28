import React from 'react';
import { ComplianceScoreProps } from '@/types/healthguard';
import { Shield, TrendingUp } from 'lucide-react';

export const ComplianceScore: React.FC<ComplianceScoreProps> = ({
  score,
  loading = false,
  onScoreClick
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 70) return 'from-yellow-500 to-amber-600';
    if (score >= 50) return 'from-orange-500 to-red-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  const circumference = 2 * Math.PI * 70; // radius = 70
  const offset = circumference - (score / 100) * circumference;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
      onClick={onScoreClick}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Compliance Score
        </h3>
        <div className={`flex items-center gap-1 text-sm font-medium ${getScoreColor(score)}`}>
          <TrendingUp className="w-4 h-4" />
          {getScoreLabel(score)}
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* Circular Progress */}
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90 w-48 h-48">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={`${getScoreGradient(score).split(' ')[0].replace('from-', '')}`} stopColor="currentColor" />
                <stop offset="100%" className={`${getScoreGradient(score).split(' ')[1].replace('to-', '')}`} stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-gray-500 text-sm mt-1">out of 100</span>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="w-full mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((score / 100) * 45)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Requirements Met</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((1 - score / 100) * 45)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Violations Found</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((score / 100) * 120)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Test Cases</div>
          </div>
        </div>
      </div>
    </div>
  );
};
