
import { Sparkles, Loader2, Mic, MicOff, X, AlertCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/geminiService';
import { NewSpesa, AppSettings } from '../types';

interface SmartEntryProps {
  onAdd: (expense: NewSpesa) => void;
  settings: AppSettings;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
};

export const SmartEntry: React.FC<SmartEntryProps> = ({ onAdd, settings }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [preview, setPreview] = useState<Partial<NewSpesa> | null>(null);
  const [hasError, setHasError] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleMagicAnalysis(transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleMagicAnalysis = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsLoading(true);
    setHasError(false);
    
    try {
      const result = await aiService.parseSmartEntry(textToParse, settings);
      if (result) setPreview(result);
    } catch (error: any) {
      console.error("AI Entry Error:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAdd = () => {
    if (preview?.utente && preview.tipologia && preview.importo && preview.data) {
      onAdd(preview as NewSpesa);
      setPreview(null);
      setInput('');
    }
  };

  return (
    <div className="bg-indigo-700 p-5 md:p-6 rounded-3xl shadow-xl text-white mb-6 border border-white/10 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <h3 className="font-black text-xs uppercase tracking-widest">IA Smart Entry</h3>
        </div>
      </div>
      <div className="relative z-10">
        <input
          type="text" 
          value={input} 
          onChange={(e) => { setInput(e.target.value); setHasError(false); }}
          placeholder='Es: "15 euro pizza Federica"'
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/40 pr-24 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleMagicAnalysis(input)}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()} className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button onClick={() => handleMagicAnalysis(input)} disabled={isLoading || !input.trim()} className="bg-white text-indigo-700 p-2.5 rounded-xl shadow-lg disabled:opacity-50 transition-all hover:bg-indigo-50">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {hasError && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl relative z-10">
          <p className="text-[11px] text-red-100 flex items-center gap-2 tracking-wide font-medium">
            <AlertCircle className="w-4 h-4" /> Non sono riuscito ad elaborare la richiesta.
          </p>
        </div>
      )}
      {preview && (
        <div className="mt-4 p-5 bg-white/10 rounded-2xl border border-white/20 relative z-10 animate-in zoom-in-95">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Anteprima</span>
            <button onClick={() => setPreview(null)} className="p-1"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-black/20 p-3 rounded-xl">
              <span className="block text-[8px] opacity-50 uppercase font-black mb-1">Chi</span>
              <span className="font-bold">{preview.utente || '?'}</span>
            </div>
            <div className="bg-black/20 p-3 rounded-xl">
              <span className="block text-[8px] opacity-50 uppercase font-black mb-1">Cifra</span>
              <span className="font-bold">{formatCurrency(preview.importo || 0)}</span>
            </div>
          </div>
          <button onClick={confirmAdd} className="w-full bg-white text-indigo-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">Conferma</button>
        </div>
      )}
    </div>
  );
};
