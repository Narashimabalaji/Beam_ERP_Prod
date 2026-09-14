import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Send, Bot, User } from 'lucide-react';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I\'m your Beam ERP Assistant powered by NVIDIA AI. Ask me anything about your invoices, orders, customers, or Beam services! ✨' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        prompt: userMessage.content,
        session_id: sessionId
      });
      
      if (response.data.session_id) setSessionId(response.data.session_id);
      setMessages(prev => [...prev, { role: 'ai', content: response.data.response }]);
    } catch (error) {
      console.error("Error communicating with AI", error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
      {/* Header */}
      <div className="bg-brand-50 px-6 py-4 border-b border-brand-100 flex items-center gap-3">
        <div className="p-2 bg-brand-700 text-white rounded-lg">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-brand-900">ERP AI Assistant</h2>
          <p className="text-xs text-brand-500">Always ready to help</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-brand-50/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-brand-100 text-brand-700' : 'bg-brand-700 text-white'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-brand-700 text-white rounded-tr-none' : 'bg-white text-brand-800 border border-brand-100 rounded-tl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 flex-shrink-0 rounded-full bg-brand-700 text-white flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="px-4 py-3 bg-white border border-brand-100 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <div className="w-2 h-2 bg-brand-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-brand-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            className="flex-1 px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-brand-50 text-brand-900"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-brand-700 hover:bg-brand-800 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md shadow-brand-200"
          >
            Send <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
