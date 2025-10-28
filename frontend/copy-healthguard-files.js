// HealthGuard Component Installer
// Run with: node copy-healthguard-files.js

const fs = require('fs');
const path = require('path');

console.log('🚀 Installing HealthGuard Components...\n');

// All component files content
const files = {
  'ComplianceScore.tsx': `import React, { useEffect, useState } from 'react';
import { ComplianceScoreProps } from '../../types/healthguard';

export default function ComplianceScore({
  score,
  loading = false,
  onScoreClick
}: ComplianceScoreProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (loading) return;

    let rafId: number;
    const start = performance.now();
    const duration = 900;

    function animate(now: number) {
      const t = Math.min(1, (now - start) / duration);
      // Ease out quad
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setAnimated(Math.round(eased * score));
      if (t < 1) rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [score, loading]);

  const getRiskLevel = (s: number): string => {
    if (s >= 75) return 'LOW RISK';
    if (s >= 50) return 'MEDIUM RISK';
    return 'HIGH RISK';
  };

  const getRiskColor = (s: number): string => {
    if (s >= 75) return '#2ECC71';
    if (s >= 50) return '#FFD166';
    return '#FF6B6B';
  };

  const getRiskBgClass = (s: number): string => {
    if (s >= 75) return 'bg-green-50 text-success';
    if (s >= 50) return 'bg-yellow-50 text-high';
    return 'bg-red-50 text-accent';
  };

  const getExecutiveSummary = (s: number): string => {
    if (s < 50) {
      return 'Immediate remediation required — core security controls missing.';
    }
    if (s < 75) {
      return 'Address identified gaps and add MFA, encryption, and audit retention rules.';
    }
    return 'Good baseline — continue expanding coverage and add continuous validations.';
  };

  const stroke = 8;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  if (loading) {
    return (
      <div className="flex items-center gap-6 animate-pulse">
        <div className="w-40 h-40 bg-gray-200 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-6 flex-wrap"
      onClick={onScoreClick}
      role="region"
      aria-label={\`Compliance score: \${score}%, Risk level: \${getRiskLevel(score)}\`}
    >
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg 
          viewBox="0 0 140 140" 
          className="w-40 h-40"
          role="img"
          aria-label={\`Circular progress showing \${animated}%\`}
        >
          <defs>
            <linearGradient id="g1" x1="1" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="50%" stopColor="#FFD166" />
              <stop offset="100%" stopColor="#00A86B" />
            </linearGradient>
          </defs>
          
          <g transform="translate(70,70)">
            {/* Background circle */}
            <circle
              r={radius}
              stroke="#E6EDF8"
              strokeWidth={stroke}
              fill="none"
            />
            
            {/* Progress circle */}
            <circle
              r={radius}
              stroke="url(#g1)"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={\`\${circumference}\`}
              strokeDashoffset={Math.max(0, offset)}
              style={{
                transition: 'stroke-dashoffset 900ms ease-in-out'
              }}
              transform="rotate(-90)"
            />
          </g>
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div 
            className="text-2xl font-heading"
            style={{ color: getRiskColor(score) }}
          >
            {animated}%
          </div>
          <div className="text-sm text-gray-500">
            Compliance Score
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-[200px] space-y-4">
        <div className="inline-flex items-center gap-2 flex-wrap">
          <span className={\`px-3 py-1 rounded-full text-sm font-medium \${getRiskBgClass(score)}\`}>
            {getRiskLevel(score)}
          </span>
          <div className="text-sm text-gray-600">Risk Level</div>
        </div>

        <div className="text-sm text-gray-600 max-w-xs">
          <strong>Executive summary:</strong> {getExecutiveSummary(score)}
        </div>
      </div>
    </div>
  );
}`
};

// Write all files
Object.keys(files).forEach(filename => {
  const filepath = path.join(__dirname, 'src', 'components', 'healthguard', filename);
  fs.writeFileSync(filepath, files[filename]);
  console.log(`✅ Written: ${filename}`);
});

console.log('\n🎉 Installation complete!');
console.log('\n📋 Next steps:');
console.log('1. npm install lucide-react');
console.log('2. Check HEALTHGUARD_INSTALLATION.md for configuration');
