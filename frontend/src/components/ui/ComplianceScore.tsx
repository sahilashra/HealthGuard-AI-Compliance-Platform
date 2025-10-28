import React from 'react';

interface ComplianceScoreProps {
  score: number;
  riskLevel: string;
}

const ComplianceScore: React.FC<ComplianceScoreProps> = ({ score, riskLevel }) => {
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'LOW':
        return 'text-green-500';
      case 'MEDIUM':
        return 'text-yellow-500';
      case 'HIGH':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-bold">Compliance Score</h2>
      <p className={`text-4xl font-bold ${getRiskColor()}`}>{score}%</p>
      <p className="text-sm text-gray-500">Risk Level: {riskLevel}</p>
    </div>
  );
};

export default ComplianceScore;
