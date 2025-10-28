"use client";

import React, { useState, useEffect } from 'react';
import { Hero } from '@/components/healthguard/Hero';
import { FileUpload } from '@/components/healthguard/FileUpload';
import { ComplianceScore } from '@/components/healthguard/ComplianceScore';
import { ViolationsList } from '@/components/healthguard/ViolationsList';
import { GapAnalysis } from '@/components/healthguard/GapAnalysis';
import { TestCaseAccordion } from '@/components/healthguard/TestCaseAccordion';
import { ProcessingTimeline } from '@/components/healthguard/ProcessingTimeline';
import { ExportButton } from '@/components/healthguard/ExportButton';
import { ComplianceCopilot } from '@/components/healthguard/ComplianceCopilot';
import {
  Violation,
  TestCase,
  ProcessingStep,
  GapAnalysis as GapAnalysisType
} from '@/types/healthguard';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-s3eb5wj3mq-uc.a.run.app';

interface ComplianceAnalysis {
  compliance_score: number;
  risk_level: string;
  violations: { type: string; description: string; suggestion: string; }[];
  gap_analysis?: GapAnalysisType;
  executive_summary: string;
}

interface SseData {
  status: 'complete' | 'export-started' | 'batch-complete' | 'batch-error' | 'pending' | 'inprogress' | 'success' | 'error';
  message?: string;
  results?: Array<{
    test_case_id: string;
    title: string;
    description: string;
    jiraKey?: string;
    jiraLink?: string;
  }>;
  totalBatches?: number;
  totalTestCases?: number;
  jobId?: string;
  issues?: Array<{
    id: string;
    key: string;
    link: string;
    original_test_case_id?: string;
  }>;
  compliance_analysis?: ComplianceAnalysis;
}

export default function Home() {
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('parsing');
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [complianceScore, setComplianceScore] = useState<number>(0);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisType | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [exportProgress, setExportProgress] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [completedBatches, setCompletedBatches] = useState(0);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [filesProcessed, setFilesProcessed] = useState(2847);
  const [totalTestCasesGenerated, setTotalTestCasesGenerated] = useState(15234);

  // Effect for handling SSE during processing
  useEffect(() => {
    if (!fileId || isExporting) return;

    setIsProcessing(true);
    setCurrentStep('parsing');
    const eventSource = new EventSource(`${API_URL}/process?fileId=${fileId}`);
    console.log("Connecting to SSE endpoint for processing with fileId:", fileId);

    const updateListener = (event: MessageEvent) => {
      const data: SseData = JSON.parse(event.data);
      console.log("Received processing SSE event:", data);

      if (data.status === 'complete') {
        // Convert backend test cases to HealthGuard format
        const convertedTestCases: TestCase[] = (data.results || []).map(tc => ({
          id: tc.test_case_id,
          title: tc.title,
          description: tc.description,
          steps: tc.description.split('\n').filter(s => s.trim()),
          expectedResult: 'Compliance requirements met',
          complianceStandards: ['HIPAA', 'FDA 21 CFR Part 11'],
          priority: 'high' as const,
          selected: false
        }));

        setTestCases(convertedTestCases);
        setCurrentStep('complete');

        // Update compliance analysis
        if (data.compliance_analysis) {
          setComplianceScore(data.compliance_analysis.compliance_score);

          const convertedViolations: Violation[] = data.compliance_analysis.violations.map((v, idx) => ({
            id: `v-${idx}`,
            title: v.type,
            description: v.description,
            severity: idx === 0 ? 'critical' : idx === 1 ? 'high' : idx === 2 ? 'medium' : 'low' as const,
            section: 'Compliance',
            suggestedFix: v.suggestion,
            impact: 'Compliance risk'
          }));
          setViolations(convertedViolations);

          // Set gap analysis data if available
          if (data.compliance_analysis.gap_analysis) {
            setGapAnalysis(data.compliance_analysis.gap_analysis);
          }
        }

        setFilesProcessed(prev => prev + 1);
        setTotalTestCasesGenerated(prev => prev + convertedTestCases.length);

        console.log("Processing complete, closing SSE connection.");
        eventSource.close();
        setIsProcessing(false);
      } else if (data.status === 'inprogress') {
        const msg = data.message?.toLowerCase() || '';
        // Update the current message for display
        if (data.message) {
          setCurrentMessage(data.message);
        }
        // Update the step based on message content
        if (msg.includes('parsing')) setCurrentStep('parsing');
        else if (msg.includes('analyzing') || msg.includes('hipaa') || msg.includes('fda') || msg.includes('iso') || msg.includes('gdpr') || msg.includes('compliance') || msg.includes('gap')) setCurrentStep('analyzing');
        else if (msg.includes('test case') || msg.includes('generating') || msg.includes('traceability')) setCurrentStep('generating');
      }
    };

    const errorListener = (error: Event) => {
      console.error("Processing SSE Error:", error);
      eventSource.close();
      setIsProcessing(false);
    };

    eventSource.addEventListener('update', updateListener);
    eventSource.onerror = errorListener;

    return () => {
      eventSource.removeEventListener('update', updateListener);
      eventSource.onerror = null;
      eventSource.close();
      setIsProcessing(false);
    };
  }, [fileId, isExporting]);

  // File upload handler
  const handleFileUpload = async (file: File) => {
    console.log('File uploaded:', file.name);
    setSelectedFile(file);
    setIsProcessing(true);
    setCurrentStep('parsing');

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      if (response.ok) {
        const result = await response.json();
        setFileId(result.fileId);
        console.log('File uploaded successfully, fileId:', result.fileId);
      } else {
        const errorResult = await response.json();
        console.error('Upload failed:', errorResult.message);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setIsProcessing(false);
    }
  };

  const handleTestCaseSelect = (id: string) => {
    setSelectedTestCases(prev =>
      prev.includes(id)
        ? prev.filter(tcId => tcId !== id)
        : [...prev, id]
    );
  };

  const handleCopyTestCase = (testCase: TestCase) => {
    const text = `${testCase.title}\n\n${testCase.description}\n\nSteps:\n${testCase.steps.join('\n')}`;
    navigator.clipboard.writeText(text);
    alert('Test case copied to clipboard!');
  };

  const handleExport = async () => {
    const selected = testCases.filter(tc => selectedTestCases.includes(tc.id));
    if (selected.length === 0) {
      alert("Please select at least one test case to export.");
      return;
    }

    setIsExporting(true);
    setCompletedBatches(0);
    setTotalBatches(0);
    setExportProgress(0);

    try {
      const response = await fetch(`${API_URL}/export-to-jira`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testCases: selected.map(tc => ({
            test_case_id: tc.id,
            title: tc.title,
            description: tc.description
          }))
        }),
      });

      if (response.ok) {
        // Show success message
        alert(`Successfully exported ${selected.length} test case(s) to Jira!`);

        // Reset export state after a short delay to show success
        setTimeout(() => {
          setIsExporting(false);
        }, 1500);
      } else {
        alert("Export failed. Please try again.");
        setIsExporting(false);
      }
    } catch (error) {
      console.error("Jira export initiation error:", error);
      alert("Export failed: Could not connect to server.");
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <Hero
        filesProcessed={filesProcessed}
        testCases={totalTestCasesGenerated}
        timeSaved="40s"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">

        {/* File Upload Section */}
        <section className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-800">Upload Your Compliance Document</h2>
            <p className="text-gray-600">Upload healthcare requirements to generate compliance test cases</p>
          </div>
          <FileUpload
            onFileUpload={handleFileUpload}
            maxSize={10}
            acceptedFormats={['.pdf', '.docx', '.doc']}
          />
        </section>

        {/* Processing Timeline - Auto-minimizes when complete */}
        {(isProcessing || currentStep === 'complete') && testCases.length === 0 && (
          <section className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-800">
                {currentStep === 'complete' ? 'Processing Complete!' : 'Processing Your Document'}
              </h2>
              <p className="text-gray-600">
                {currentStep === 'complete'
                  ? 'Your compliance analysis is ready below'
                  : 'AI is analyzing your compliance requirements'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <ProcessingTimeline currentStep={currentStep} currentMessage={currentMessage} />
            </div>
          </section>
        )}

        {/* Results Section */}
        {testCases.length > 0 && (
          <>
            {/* Compliance Score & Violations */}
            <section className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-800">Compliance Score</h2>
                  <p className="text-gray-600">Overall compliance rating</p>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <ComplianceScore score={complianceScore} loading={isProcessing} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-800">Violations Detected</h2>
                  <p className="text-gray-600">Issues requiring attention</p>
                </div>
                <ViolationsList violations={violations} loading={isProcessing} />
              </div>
            </section>

            {/* Gap Analysis */}
            {gapAnalysis && (
              <section className="space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-800">Gap Analysis</h2>
                  <p className="text-gray-600">AI-identified gaps, coverage analysis, and risk assessment</p>
                </div>
                <GapAnalysis gapAnalysis={gapAnalysis} loading={isProcessing} />
              </section>
            )}

            {/* Test Cases */}
            <section className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-800">Generated Test Cases</h2>
                <p className="text-gray-600">AI-generated compliance test cases ready for export</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <TestCaseAccordion
                  testCases={testCases}
                  onTestCaseSelect={handleTestCaseSelect}
                  onCopy={handleCopyTestCase}
                  selectedIds={selectedTestCases}
                />
              </div>
              <div className="flex justify-center">
                <ExportButton
                  selectedCount={selectedTestCases.length}
                  onExport={handleExport}
                  loading={isExporting}
                  disabled={selectedTestCases.length === 0}
                />
              </div>
            </section>

          </>
        )}

        {/* Footer CTA */}
        <section className="text-center py-12 space-y-6">
          <h2 className="text-4xl font-bold text-gray-800">Ready to Transform Your Compliance Testing?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join hundreds of healthcare organizations using HealthGuard AI to automate compliance testing
          </p>
        </section>
      </div>

      {/* AI Compliance Copilot - Always available */}
      <ComplianceCopilot
        complianceContext={testCases.length > 0 ? `Current compliance score: ${complianceScore}%, ${violations.length} violations detected` : undefined}
      />
    </div>
  );
}
