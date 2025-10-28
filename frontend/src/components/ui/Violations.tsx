import React from 'react';

interface Violation {
  type: string;
  description: string;
  suggestion: string;
}

interface ViolationsProps {
  violations: Violation[];
}

const Violations: React.FC<ViolationsProps> = ({ violations }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-bold">Detected Violations</h2>
      {violations.length === 0 ? (
        <p className="text-green-500">No violations detected.</p>
      ) : (
        <ul>
          {violations.map((violation, index) => (
            <li key={index} className="mt-2 border-l-4 border-red-500 pl-4">
              <p className="font-bold">{violation.type}</p>
              <p>{violation.description}</p>
              <p className="text-sm text-gray-500">Suggestion: {violation.suggestion}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Violations;
