import React, { useEffect, useState } from 'react';
import { ImpactMetricsProps } from '@/types/healthguard';
import { TrendingUp } from 'lucide-react';

export const ImpactMetrics: React.FC<ImpactMetricsProps> = ({
  metrics,
  animate = true
}) => {
  const [displayValues, setDisplayValues] = useState<number[]>(
    animate ? metrics.map(() => 0) : metrics.map(m => m.value)
  );

  useEffect(() => {
    if (!animate) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      
      setDisplayValues(
        metrics.map(metric => 
          Math.round((metric.value * currentStep) / steps)
        )
      );

      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayValues(metrics.map(m => m.value));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [metrics, animate]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Impact Metrics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">
                {metric.label}
              </div>
              {metric.icon && (
                <div className="text-blue-600">
                  {metric.icon}
                </div>
              )}
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">
                {displayValues[index].toLocaleString()}
              </span>
              {metric.suffix && (
                <span className="text-xl font-medium text-gray-600">
                  {metric.suffix}
                </span>
              )}
            </div>

            {/* Visual bar */}
            <div className="mt-4 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: animate
                    ? `${(displayValues[index] / metric.value) * 100}%`
                    : '100%'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
