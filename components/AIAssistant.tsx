
import React, { useState } from 'react';
import { MessageSquare, Send, Loader2, Bot } from 'lucide-react';
import { aiService } from '../services/geminiService';
import { Spesa } from '../types';

interface AIAssistantProps {
  spese: Spesa[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ spese }) => {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);

  const handleAsk = async () => {
    if (!query.trim()) return;
    
    const userMsg = query;
    setQuery('');
    setConversation(prev => [...prev, { role: 'user', content: userMsg }]);
    
    setIsAnalyzing(true);
    const analysis = await aiService.getAnalysis(spese, userMsg);
    setConversation(prev => [...prev, { role: 'assistant', content: analysis }]);
    setIsAnalyzing(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <Bot className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-slate-700">Analista AI Strategico</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {conversation.length === 0 && (
          <div className="text-center py-10">
            <Bot className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Chiedimi qualcosa sui vostri benefit.<br/>"Chi ha speso di più in benzina questo mese?"</p>
          </div>
        )}
        {conversation.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-xs text-slate-500">Sto analizzando i dati...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Chiedi un'analisi o una previsione..."
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
          <button
            onClick={handleAsk}
            disabled={isAnalyzing || !query.trim()}
            className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
