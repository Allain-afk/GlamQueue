import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { sendMessageToGemini, isGeminiConfigured, type ChatMessage } from '../services/geminiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function SimpleChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I\'m here to help you learn more about GlamQueue. How can I assist you today?',
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

      const geminiResponse = await sendMessageToGemini(query, conversationHistory);
      
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

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      left: '20px', 
      zIndex: 1000 
    }}>
      {/* Chat Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e91e8c, #f06292)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(233, 30, 140, 0.4)',
          transition: 'all 0.3s ease'
        }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '0',
          width: '350px',
          height: '500px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #e91e8c, #f06292)',
            padding: '16px 20px',
            color: 'white'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              GlamQueue Assistant
            </h3>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              Online
            </span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '20px',
            background: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto'
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                }}
              >
                {message.sender === 'bot' && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e91e8c, #f06292)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    <Bot size={16} />
                  </div>
                )}
                <div style={{
                  background: message.sender === 'user' 
                    ? 'linear-gradient(135deg, #e91e8c, #f06292)' 
                    : 'white',
                  color: message.sender === 'user' ? 'white' : '#1a1a1a',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  maxWidth: '80%',
                  whiteSpace: 'pre-wrap'
                }}>
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '16px 20px',
            background: 'white',
            borderTop: '1px solid #e5e5e5',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) {
                  handleSend();
                }
              }}
              placeholder={isLoading ? "Thinking..." : "Ask about GlamQueue..."}
              disabled={isLoading}
              style={{
                flex: 1,
                border: '1px solid #e5e5e5',
                borderRadius: '20px',
                padding: '12px 16px',
                fontSize: '14px',
                outline: 'none',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'wait' : 'text'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: (inputValue.trim() && !isLoading)
                  ? 'linear-gradient(135deg, #e91e8c, #f06292)' 
                  : '#e5e5e5',
                border: 'none',
                color: 'white',
                cursor: (inputValue.trim() && !isLoading) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? (
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
