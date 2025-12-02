'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Loader2,
  Bot,
  User,
  Sparkles,
  ChevronDown,
  Plus,
  History,
  MapPin,
  BarChart3,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChatbot, useChatHistory, useChatSessions } from '@/hooks/useApi';
import { useMapStore } from '@/store/mapStore';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
  };
  highlightedParcels?: string[];
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Example prompts for users
const EXAMPLE_PROMPTS = [
  {
    icon: Search,
    text: 'Find agricultural land over 5 acres',
    category: 'Search',
  },
  {
    icon: MapPin,
    text: 'Show parcels near water sources',
    category: 'Location',
  },
  {
    icon: BarChart3,
    text: 'What is the average price per acre?',
    category: 'Analytics',
  },
  {
    icon: Sparkles,
    text: 'Find the best investment opportunities',
    category: 'AI',
  },
];

// Function call icons
const FUNCTION_ICONS: Record<string, typeof Search> = {
  searchParcels: Search,
  getParcelStats: BarChart3,
  getParcelsNearLocation: MapPin,
};

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setHighlightedParcelIds } = useMapStore();
  const chatMutation = useChatbot();
  const { data: sessions } = useChatSessions();
  const { data: historyMessages } = useChatHistory(sessionId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load history when session changes
  useEffect(() => {
    if (historyMessages && historyMessages.length > 0) {
      setMessages(
        historyMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.createdAt),
        }))
      );
    }
  }, [historyMessages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle sending a message
  const handleSend = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();

      const prompt = inputValue.trim();
      if (!prompt || chatMutation.isPending) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');

      try {
        const response = await chatMutation.mutateAsync({
          prompt,
          sessionId: sessionId || undefined,
        });

        // Update session ID
        if (response.sessionId && !sessionId) {
          setSessionId(response.sessionId);
        }

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          functionCall: response.functionCalled
            ? {
                name: response.functionCalled.name,
                args: response.functionCalled.args,
                result: response.functionCalled.result,
              }
            : undefined,
          highlightedParcels: response.highlightedParcels,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Highlight parcels on map
        if (response.highlightedParcels?.length) {
          setHighlightedParcelIds(response.highlightedParcels);
        }
      } catch (error) {
        // Add error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    [inputValue, sessionId, chatMutation, setHighlightedParcelIds]
  );

  // Handle example prompt click
  const handleExampleClick = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  // Start new chat
  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setShowHistory(false);
  };

  // Load session
  const handleLoadSession = (id: string) => {
    setSessionId(id);
    setShowHistory(false);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-background border-l shadow-xl z-30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              Powered by Gemini 2.5
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className="h-8 w-8"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Session History Dropdown */}
      {showHistory && sessions && sessions.length > 0 && (
        <div className="border-b bg-muted/50 p-2 space-y-1 max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            Recent Conversations
          </p>
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleLoadSession(session.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors',
                sessionId === session.id && 'bg-accent'
              )}
            >
              <p className="font-medium truncate">{session.title}</p>
              <p className="text-xs text-muted-foreground">
                {session.messageCount} messages
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            // Welcome state
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Welcome to LANDSCORE AI
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Ask me anything about land parcels, valuations, or use natural
                  language to search and analyze properties.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">
                  Try asking:
                </p>
                {EXAMPLE_PROMPTS.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(example.text)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <example.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{example.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {example.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Message list
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {/* Function call indicator */}
                  {message.functionCall && (
                    <div className="mb-2 pb-2 border-b border-border/50">
                      <div className="flex items-center gap-2 text-xs">
                        {FUNCTION_ICONS[message.functionCall.name] ? (
                          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                            {(() => {
                              const Icon =
                                FUNCTION_ICONS[message.functionCall.name];
                              return <Icon className="h-3 w-3 text-primary" />;
                            })()}
                          </div>
                        ) : (
                          <Sparkles className="h-3 w-3 text-primary" />
                        )}
                        <span className="font-medium">
                          {message.functionCall.name}
                        </span>
                      </div>
                      {message.functionCall.args &&
                        Object.keys(message.functionCall.args).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(message.functionCall.args).map(
                              ([key, value]) => (
                                <Badge
                                  key={key}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {key}: {String(value)}
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Message content */}
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {/* Highlighted parcels indicator */}
                  {message.highlightedParcels &&
                    message.highlightedParcels.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {message.highlightedParcels.length} parcels
                            highlighted on map
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Timestamp */}
                  <p
                    className={cn(
                      'text-[10px] mt-1',
                      message.role === 'user'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading indicator */}
          {chatMutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-muted/30">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about parcels, prices, or anything..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || chatMutation.isPending}
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          AI may produce inaccurate information. Verify important details.
        </p>
      </div>
    </div>
  );
}

export default ChatPanel;
