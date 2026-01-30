
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Bot, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { aiService } from '../services/geminiService';
import { Spesa } from '../types';

interface AIAssistantProps {
  spese: Spesa[];
}

// Utility per la decodifica audio PCM raw (Gemini TTS)
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ spese }) => {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant', content: string, id: string }[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.continuous = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleAsk = async (forcedQuery?: string) => {
    const targetQuery = forcedQuery || query;
    if (!targetQuery.trim()) return;
    
    const userMsg = targetQuery;
    setQuery('');
    const userMsgId = Math.random().toString(36).substring(7);
    setConversation(prev => [...prev, { role: 'user', content: userMsg, id: userMsgId }]);
    
    setIsAnalyzing(true);
    const analysis = await aiService.getAnalysis(spese, userMsg);
    const assistantMsgId = Math.random().toString(36).substring(7);
    setConversation(prev => [...prev, { role: 'assistant', content: analysis, id: assistantMsgId }]);
    setIsAnalyzing(false);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleSpeak = async (text: string, msgId: string) => {
    if (isSpeaking === msgId) {
      setIsSpeaking(null);
      return;
    }

    setIsSpeaking(msgId);
    const base64Audio = await aiService.generateSpeech(text);
    
    if (base64Audio) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(null);
        source.start();
      } catch (err) {
        console.error("Audio Playback Error:", err);
        setIsSpeaking(null);
      }
    } else {
      setIsSpeaking(null);
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col h-[600px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-sm tracking-tight">Analista Strategico AI</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supporto Vocale Attivo</p>
          </div>
        </div>
        <div className="flex gap-2">
           <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-indigo-500 animate-pulse' : 'bg-slate-200'}`}></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {conversation.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-sm border border-slate-100">
              <Bot className="w-10 h-10" />
            </div>
            <p className="text-slate-500 font-bold text-sm">Ciao! Chiedimi un'analisi dei vostri benefit.</p>
            <p className="text-slate-400 text-xs mt-2 italic px-10 leading-relaxed">"Come sono andate le spese di questo mese?" o "Chi ha speso di più in alimentari?"</p>
          </div>
        )}
        
        {conversation.map((msg, i) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
            }`}>
              {msg.content}
              
              {msg.role === 'assistant' && (
                <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                  <button 
                    onClick={() => handleSpeak(msg.content, msg.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                      isSpeaking === msg.id 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-500'
                    }`}
                  >
                    {isSpeaking === msg.id ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                        <span className="text-[9px] font-black uppercase tracking-widest">In riproduzione...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Ascolta</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-widest px-1">
              {msg.role === 'user' ? 'Tu' : 'Analista AI'}
            </span>
          </div>
        ))}
        
        {isAnalyzing && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce delay-150"></div>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sto analizzando i dati...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex items-center gap-3 bg-slate-100/80 p-1.5 rounded-[24px] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white transition-all shadow-inner">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Chiedi un'analisi..."
            className="flex-1 bg-transparent border-none px-4 py-3 text-sm font-medium focus:ring-0 outline-none placeholder:text-slate-400"
          />
          
          <button
            onClick={toggleListening}
            className={`p-3 rounded-2xl transition-all shadow-sm ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-red-200' 
                : 'bg-white text-slate-400 hover:text-indigo-600'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={() => handleAsk()}
            disabled={isAnalyzing || !query.trim()}
            className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
