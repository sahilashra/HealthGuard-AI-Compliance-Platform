import React from 'react';

interface ExecutiveSummaryProps {
  summary: string;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ summary }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-bold">Executive Summary</h2>
      <p className="mt-2">{summary}</p>
    </div>
  );
};

export default ExecutiveSummary;
