import { useState, useRef, useEffect } from 'react';
import { Bot, Send, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';
import { generateBusinessInsights, isGeminiConfigured, type ChatMessage } from '../services/geminiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function AnalyticsAIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I\'m your AI Business Insights Assistant. I analyze your salon\'s sales data and provide personalized recommendations to help improve your business. What would you like to know?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Check if Gemini API is configured
      if (!isGeminiConfigured()) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, the AI service is not configured. Please ensure VITE_GEMINI_API_KEY is set in your environment variables.',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      // Build conversation history from messages
      const conversationHistory: ChatMessage[] = messages
        .filter(msg => msg.id !== '1') // Exclude initial greeting
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          content: msg.text
        }));
      
      // Create business context for analytics insights
      const businessContext = `
You are a specialized AI Business Insights Assistant for a salon management platform. 
Your role is to provide actionable business insights, revenue optimization strategies, 
customer retention tactics, and growth recommendations based on salon business data.

Conversation history for context:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

Focus areas:
- Revenue trends and optimization strategies
- Peak hours and scheduling optimization
- Customer retention and loyalty programs
- Service performance analysis
- Growth opportunities and recommendations
- Pricing strategies

Keep responses concise, actionable, and formatted with bullet points where appropriate.
Use emojis sparingly for visual appeal (📊, ⏰, 👥, 🚀, ✨, 💡).
`;

      const geminiResponse = await generateBusinessInsights(businessContext, query);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: geminiResponse.text,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { icon: TrendingUp, text: 'Revenue Insights', query: 'Tell me about revenue trends and optimization strategies' },
    { icon: BarChart3, text: 'Peak Hours', query: 'What are my peak hours and how can I optimize scheduling?' },
    { icon: Lightbulb, text: 'Growth Tips', query: 'How can I improve my business and increase revenue?' },
  ];

  return (
    <div className="analytics-chatbot-container">
      {/* Chat Window - Always Visible */}
      <div className="analytics-chatbot-window">
          {/* Header */}
          <div className="analytics-chatbot-header">
            <div className="analytics-chatbot-header-content">
              <div className="analytics-chatbot-avatar">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="analytics-chatbot-title">AI Business Insights</h3>
                <span className="analytics-chatbot-status">Analyzing your sales data...</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="analytics-chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`analytics-chatbot-message ${message.sender === 'user' ? 'user' : 'bot'}`}
              >
                {message.sender === 'bot' && (
                  <div className="analytics-chatbot-avatar-small">
                    <Bot size={16} />
                  </div>
                )}
                <div className="analytics-chatbot-bubble">
                  <pre className="analytics-chatbot-text">{message.text}</pre>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && !isLoading && (
            <div className="analytics-chatbot-quick-actions">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="analytics-chatbot-quick-action"
                  onClick={async () => {
                    setInputValue(action.query);
                    // Small delay to allow state to update before sending
                    await new Promise(resolve => setTimeout(resolve, 50));
                    const queryToSend = action.query;
                    setInputValue('');
                    
                    const userMessage: Message = {
                      id: Date.now().toString(),
                      text: queryToSend,
                      sender: 'user',
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, userMessage]);
                    setIsLoading(true);

                    try {
                      if (!isGeminiConfigured()) {
                        const errorMessage: Message = {
                          id: (Date.now() + 1).toString(),
                          text: 'Sorry, the AI service is not configured. Please ensure VITE_GEMINI_API_KEY is set in your environment variables.',
                          sender: 'bot',
                          timestamp: new Date(),
                        };
                        setMessages((prev) => [...prev, errorMessage]);
                        setIsLoading(false);
                        return;
                      }

                      const businessContext = `
You are a specialized AI Business Insights Assistant for a salon management platform. 
Your role is to provide actionable business insights, revenue optimization strategies, 
customer retention tactics, and growth recommendations based on salon business data.

Focus areas:
- Revenue trends and optimization strategies
- Peak hours and scheduling optimization
- Customer retention and loyalty programs
- Service performance analysis
- Growth opportunities and recommendations
- Pricing strategies

Keep responses concise, actionable, and formatted with bullet points where appropriate.
Use emojis sparingly for visual appeal (📊, ⏰, 👥, 🚀, ✨, 💡).
`;

                      const geminiResponse = await generateBusinessInsights(businessContext, queryToSend);
                      
                      const botMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        text: geminiResponse.text,
                        sender: 'bot',
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, botMessage]);
                    } catch (error) {
                      console.error('Error generating response:', error);
                      const errorMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        text: 'Sorry, I encountered an error processing your request. Please try again.',
                        sender: 'bot',
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, errorMessage]);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  <action.icon size={16} />
                  <span>{action.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="analytics-chatbot-input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isLoading ? "Thinking..." : "Ask about revenue, peak hours, growth tips..."}
              className="analytics-chatbot-input"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              className="analytics-chatbot-send"
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
    </div>
  );
}

