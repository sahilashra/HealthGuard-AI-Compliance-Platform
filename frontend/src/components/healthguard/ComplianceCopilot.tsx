import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ComplianceCopilotProps {
  complianceContext?: string;
}

export const ComplianceCopilot: React.FC<ComplianceCopilotProps> = ({ complianceContext }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI Compliance Assistant. I can help you understand HIPAA, FDA 21 CFR Part 11, and ISO 13485 requirements. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // For now, use demo mode (skip API call since backend endpoint doesn't exist yet)
    // Later: connect to real Gemini API
    const demoResponse = getDemoResponse(input);

    // Simulate realistic AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: demoResponse,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const getDemoResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    // Handle greetings
    if (lowerQuestion.match(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)[\s!?]*$/i)) {
      return `Hello! 👋 I'm your AI Compliance Assistant.

I'm here to help you with healthcare compliance questions. I specialize in:

📋 **HIPAA** - Privacy and security requirements
⚕️ **FDA 21 CFR Part 11** - Electronic records & signatures
🏥 **ISO 13485** - Medical device quality management
🧪 **Test Case Creation** - Compliance testing best practices

**Try asking me:**
- "What are the key HIPAA requirements?"
- "How do I create FDA compliant test cases?"
- "Explain ISO 13485 documentation requirements"
- "How do I fix common compliance violations?"

What would you like to know about compliance?`;
    }

    if (lowerQuestion.includes('hipaa')) {
      return `**HIPAA Compliance Overview:**

HIPAA (Health Insurance Portability and Accountability Act) requires:

1. **Privacy Rule (§164.502)**: Protect all PHI (Protected Health Information)
2. **Security Rule (§164.312)**:
   - Administrative safeguards
   - Physical safeguards
   - Technical safeguards (encryption, access controls)

3. **Breach Notification Rule**: Report breaches within 60 days

**Key Requirements:**
✓ Encrypt data at rest and in transit (AES-256)
✓ Implement access controls and audit logging
✓ Conduct regular risk assessments
✓ Train all workforce members

**Penalties:** Up to $1.5M per violation category per year.

Need help with a specific HIPAA requirement?`;
    }

    if (lowerQuestion.includes('fda') || lowerQuestion.includes('21 cfr')) {
      return `**FDA 21 CFR Part 11 Requirements:**

This regulation covers electronic records and signatures for medical devices:

**Core Requirements:**
1. **Validation (§11.10)**: Systems must be validated
2. **Audit Trail (§11.10e)**: Track all changes with:
   - Who made the change
   - What was changed
   - When it was changed
   - Why it was changed

3. **Electronic Signatures (§11.50)**: Must be:
   - Unique to one individual
   - Not reusable/reassignable
   - Linked to their records

**Compliance Checklist:**
✓ System validation documentation
✓ Tamper-proof audit trails
✓ Secure authentication (MFA recommended)
✓ Record retention policies
✓ Procedure and controls documentation

Would you like more details on any specific requirement?`;
    }

    if (lowerQuestion.includes('iso') || lowerQuestion.includes('13485')) {
      return `**ISO 13485:2016 - Medical Devices QMS:**

Key requirements for quality management systems:

**Section 4**: Quality Management System
- Document control (4.2.4)
- Record control (4.2.5)

**Section 7**: Product Realization
- Design and development (7.3)
- Risk management (per ISO 14971)
- Validation and verification

**Section 8**: Measurement, Analysis & Improvement
- Internal audits
- Corrective/preventive actions (CAPA)
- Product monitoring

**Documentation Required:**
✓ Quality manual
✓ Design history file (DHF)
✓ Device master record (DMR)
✓ Device history record (DHR)
✓ Risk management file

Need help with a specific ISO clause?`;
    }

    if (lowerQuestion.includes('test') || lowerQuestion.includes('case')) {
      return `**Compliance Test Case Best Practices:**

**Structure:**
1. **Test Case ID**: Traceable to requirements
2. **Regulatory Mapping**: Which regulation(s) it covers
3. **Test Steps**: Clear, repeatable instructions
4. **Expected Results**: Pass/fail criteria
5. **Traceability**: Link to requirements document

**Example Test Case:**
\`\`\`
TC-HIPAA-001: Verify PHI Encryption
Regulation: HIPAA §164.312(e)(1)
Priority: Critical

Steps:
1. Upload patient record containing PHI
2. Monitor network traffic
3. Verify TLS 1.3 encryption
4. Check database storage encryption

Expected: All PHI encrypted with AES-256
\`\`\`

Want help creating test cases for a specific requirement?`;
    }

    if (lowerQuestion.includes('fix') || lowerQuestion.includes('violation')) {
      return `**Common Compliance Violations & Fixes:**

**1. Missing Encryption**
- **Issue**: PHI transmitted in plaintext
- **Fix**: Implement TLS 1.3 + AES-256 encryption
- **Regulation**: HIPAA §164.312(e)

**2. Incomplete Audit Logs**
- **Issue**: Not logging all access attempts
- **Fix**: Enable comprehensive audit trail
- **Regulation**: FDA 21 CFR Part 11

**3. Weak Authentication**
- **Issue**: Simple passwords, no MFA
- **Fix**: Implement MFA + strong password policy
- **Regulation**: ISO 27001

**4. Missing Documentation**
- **Issue**: No design history file
- **Fix**: Create and maintain DHF per ISO 13485
- **Regulation**: ISO 13485 §7.3.10

Which violation would you like help fixing?`;
    }

    // Default helpful response
    return `I can help you with:

📋 **Compliance Standards:**
- HIPAA requirements and violations
- FDA 21 CFR Part 11 guidelines
- ISO 13485 quality management

🧪 **Test Case Creation:**
- Best practices for compliance testing
- Traceability to requirements
- Risk-based prioritization

🔧 **Issue Resolution:**
- Common violations and fixes
- Implementation guidance
- Audit preparation

**Try asking:**
- "What are the key HIPAA requirements?"
- "How do I create FDA compliant test cases?"
- "What documentation does ISO 13485 require?"

What specific compliance topic would you like to explore?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center gap-2"
      >
        <Bot className="w-6 h-6" />
        <span className="font-medium">AI Compliance Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">AI Compliance Assistant</h3>
            <p className="text-xs text-blue-100">Powered by Google Gemini</p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="hover:bg-white/20 rounded p-1 transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              {message.role === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-gray-700" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              <div className="text-sm break-words prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-li:my-0 prose-ul:my-2 prose-ol:my-2 prose-code:text-xs prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:text-gray-800">
                {message.role === 'user' ? (
                  message.content
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkBreaks, remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="my-1 leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                        ) : (
                          <code className={className}>{children}</code>
                        );
                      },
                      pre: ({ children }) => <pre className="bg-gray-100 text-gray-800 p-2 rounded my-2 overflow-x-auto text-xs">{children}</pre>,
                      h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-2">{children}</h3>,
                      br: () => <br className="my-1" />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-700" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about compliance..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Ask me about HIPAA, FDA 21 CFR, or ISO 13485
        </p>
      </div>
    </div>
  );
};
