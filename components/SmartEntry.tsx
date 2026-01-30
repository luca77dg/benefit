
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Plus, AlertCircle, Mic, MicOff, Keyboard, X } from 'lucide-react';
import { aiService } from '../services/geminiService';
import { NewSpesa, Utente, Tipologia } from '../types';

interface SmartEntryProps {
  onAdd: (expense: NewSpesa) => void;
}

export const SmartEntry: React.FC<SmartEntryProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [preview, setPreview] = useState<Partial<NewSpesa> | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleMagicAnalysis(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        alert("Il tuo browser non supporta il riconoscimento vocale.");
        return;
      }
      setPreview(null);
      recognitionRef.current.start();
    }
  };

  const handleMagicAnalysis = async (textToParse: string) => {
    const trimmedInput = textToParse.trim();
    if (!trimmedInput) return;

    setIsLoading(true);
    try {
      const result = await aiService.parseSmartEntry(trimmedInput);
      if (result) {
        setPreview(result);
      } else {
        alert("L'IA non è riuscita a estrarre dati validi. Prova a essere più specifico.");
      }
    } catch (error) {
      alert("Errore nell'analisi. Verifica la connessione.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntryTrigger = () => {
    setPreview({
      utente: undefined,
      tipologia: 'Spesa',
      importo: 0,
      data: new Date().toISOString().split('T')[0],
      note: ''
    });
    setInput('');
  };

  const confirmAdd = () => {
    if (preview && preview.utente && preview.tipologia && preview.importo && preview.data) {
      onAdd(preview as NewSpesa);
      setPreview(null);
      setInput('');
    }
  };

  const updatePreview = (key: keyof NewSpesa, value: any) => {
    if (preview) {
      setPreview({ ...preview, [key]: value });
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white mb-8 border border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <h3 className="font-bold text-lg tracking-tight">Smart Entry IA</h3>
        </div>
        <div className="flex items-center gap-4">
          {isListening && (
            <div className="flex items-center gap-2 animate-pulse text-red-200 text-[10px] font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              In ascolto...
            </div>
          )}
          <button 
            onClick={handleManualEntryTrigger}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/5"
          >
            <Keyboard className="w-3.5 h-3.5" /> Manuale
          </button>
        </div>
      </div>
      
      <div className="relative group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Dì o scrivi: "Luca ha speso 45 euro di benzina oggi"'
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all pr-28 text-sm md:text-base"
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleMagicAnalysis(input)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center min-w-[44px] min-h-[44px] ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={() => handleMagicAnalysis(input)}
            disabled={isLoading || isListening}
            className="bg-white text-indigo-600 p-2.5 rounded-xl hover:bg-indigo-50 active:scale-95 disabled:opacity-50 transition-all shadow-md flex items-center justify-center min-w-[44px] min-h-[44px]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {preview && (
        <div className="mt-5 p-5 bg-white/15 rounded-2xl border border-white/20 animate-in slide-in-from-top-4 duration-300 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-white/70">Revisione dati (puoi modificarli)</p>
            <button onClick={() => setPreview(null)} className="text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Chi */}
            <div className="bg-black/10 p-3 rounded-xl">
              <label className="opacity-50 block text-[9px] font-bold uppercase mb-1">Chi</label>
              <select 
                value={preview.utente || ''} 
                onChange={(e) => updatePreview('utente', e.target.value as Utente)}
                className={`bg-transparent font-black w-full outline-none appearance-none cursor-pointer ${!preview.utente ? 'text-amber-300' : 'text-white'}`}
              >
                <option value="" disabled className="text-slate-800">Scegli...</option>
                <option value="Luca" className="text-slate-800">Luca</option>
                <option value="Federica" className="text-slate-800">Federica</option>
              </select>
            </div>

            {/* Categoria */}
            <div className="bg-black/10 p-3 rounded-xl">
              <label className="opacity-50 block text-[9px] font-bold uppercase mb-1">Categoria</label>
              <select 
                value={preview.tipologia} 
                onChange={(e) => updatePreview('tipologia', e.target.value as Tipologia)}
                className="bg-transparent font-black w-full outline-none appearance-none cursor-pointer text-white"
              >
                <option value="Spesa" className="text-slate-800">Spesa</option>
                <option value="Welfare" className="text-slate-800">Welfare</option>
                <option value="Benzina" className="text-slate-800">Benzina</option>
              </select>
            </div>

            {/* Importo */}
            <div className="bg-black/10 p-3 rounded-xl">
              <label className="opacity-50 block text-[9px] font-bold uppercase mb-1">Importo (€)</label>
              <input 
                type="number" step="0.01"
                value={preview.importo}
                onChange={(e) => updatePreview('importo', parseFloat(e.target.value))}
                className="bg-transparent font-black w-full outline-none text-white"
              />
            </div>

            {/* Data */}
            <div className="bg-black/10 p-3 rounded-xl">
              <label className="opacity-50 block text-[9px] font-bold uppercase mb-1">Data</label>
              <input 
                type="date"
                value={preview.data}
                onChange={(e) => updatePreview('data', e.target.value)}
                className="bg-transparent font-black w-full outline-none text-white text-xs"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end items-center gap-4">
            <button 
              onClick={confirmAdd}
              disabled={!preview.utente || !preview.importo}
              className="bg-white text-indigo-700 px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:shadow-lg active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Conferma e Salva
            </button>
          </div>

          {!preview.utente && (
            <div className="mt-4 flex items-center gap-2 justify-center text-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-wide italic">Seleziona chi ha pagato per salvare</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
