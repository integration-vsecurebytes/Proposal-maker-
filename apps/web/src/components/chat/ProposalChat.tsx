import { useState, useEffect, useRef } from 'react';
import { useConversationStore } from '../../stores/conversation';
import { conversationApi } from '../../lib/api';
import { MessageBubble } from './MessageBubble';
import { DataSidebar } from './DataSidebar';
import { Button } from '../ui/button';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import type { Message } from '@proposal-gen/shared';

interface ProposalChatProps {
  templateId: string;
  onComplete?: (conversationId: string) => void;
}

export function ProposalChat({ templateId, onComplete }: ProposalChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    conversationId,
    messages,
    extractedData,
    currentPhase,
    isComplete,
    progress,
    phaseDescription,
    isLoading,
    error,
    setConversationId,
    addMessage,
    setExtractedData,
    setCurrentPhase,
    setProgress,
    setPhaseDescription,
    setIsComplete,
    setIsLoading,
    setError,
  } = useConversationStore();

  // Start conversation on mount
  useEffect(() => {
    const startConversation = async () => {
      if (!conversationId) {
        try {
          setIsLoading(true);
          const response = await conversationApi.start(templateId);

          setConversationId(response.conversationId);
          setCurrentPhase(response.currentPhase);
          setProgress(response.progress);

          // Add initial message
          const initialMessage: Message = {
            role: 'assistant',
            content: response.message,
            timestamp: new Date(),
          };
          addMessage(initialMessage);
        } catch (err: any) {
          console.error('Error starting conversation:', err);
          setError(err.response?.data?.error || 'Failed to start conversation');
        } finally {
          setIsLoading(false);
        }
      }
    };

    startConversation();
  }, [templateId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle complete callback
  useEffect(() => {
    if (isComplete && conversationId && onComplete) {
      onComplete(conversationId);
    }
  }, [isComplete, conversationId, onComplete]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    addMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await conversationApi.chat(conversationId, userMessage.content);

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };
      addMessage(assistantMessage);

      // Update state
      setExtractedData(response.extractedData);
      setCurrentPhase(response.currentPhase);
      setProgress(response.progress);
      setPhaseDescription(response.phaseDescription || '');
      setIsComplete(response.isComplete);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-background">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 bg-muted/30">
          <h2 className="text-lg font-semibold">Proposal Requirements</h2>
          <p className="text-sm text-muted-foreground mt-1">{phaseDescription}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-3">
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-muted/30">
          {isComplete ? (
            <div className="flex items-center justify-center gap-3 py-4 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <p className="font-medium">Requirements gathering complete!</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your response..."
                className="flex-1 px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="lg"
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Data Sidebar */}
      <DataSidebar
        extractedData={extractedData}
        progress={progress}
        currentPhase={currentPhase || ''}
      />
    </div>
  );
}
