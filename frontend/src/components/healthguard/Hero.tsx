import React from 'react';
import { HeroProps } from '@/types/healthguard';
import { Sparkles, Zap, Shield } from 'lucide-react';

export const Hero: React.FC<HeroProps> = ({ 
  filesProcessed = 2847, 
  testCases = 15234, 
  timeSaved = "40s" 
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 px-6">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Compliance Testing</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              HealthGuard AI
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Transform healthcare software compliance documentation into automated test cases in seconds
          </p>

          {/* CTA Button */}
          <div className="flex justify-center items-center pt-6">
            <button
              onClick={() => alert('Demo video coming soon! This would open a demo showcase of HealthGuard AI in action.')}
              className="px-10 py-4 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Watch Demo
              </span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{filesProcessed.toLocaleString()}</div>
              <div className="text-blue-200 mt-2">Documents Processed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{testCases.toLocaleString()}</div>
              <div className="text-blue-200 mt-2">Test Cases Generated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{timeSaved}</div>
              <div className="text-blue-200 mt-2">Average Processing Time</div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 pt-12 opacity-80">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" />
              <span>FDA 21 CFR Part 11</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" />
              <span>ISO 13485</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
