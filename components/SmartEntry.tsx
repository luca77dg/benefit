
import React, { useState } from 'react';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { aiService } from '../services/geminiService';
import { NewSpesa } from '../types';

interface SmartEntryProps {
  onAdd: (expense: NewSpesa) => void;
}

export const SmartEntry: React.FC<SmartEntryProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<Partial<NewSpesa> | null>(null);

  const handleMagic = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    const result = await aiService.parseSmartEntry(input);
    setPreview(result);
    setIsLoading(false);
  };

  const confirmAdd = () => {
    if (preview && preview.utente && preview.tipologia && preview.importo && preview.data) {
      onAdd(preview as NewSpesa);
      setPreview(null);
      setInput('');
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" />
        <h3 className="font-semibold text-lg">Smart Entry IA</h3>
      </div>
      
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Es: "Federica ha speso 45 euro di benzina ieri"'
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all pr-12"
          onKeyDown={(e) => e.key === 'Enter' && handleMagic()}
        />
        <button
          onClick={handleMagic}
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-indigo-600 p-2 rounded-lg hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        </button>
      </div>

      {preview && (
        <div className="mt-4 p-4 bg-white/20 rounded-xl border border-white/30 animate-in slide-in-from-top-4 duration-300">
          <p className="text-sm font-medium mb-3">AI ha rilevato:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="opacity-70 block">Utente</span>
              <span className="font-bold">{preview.utente || 'Da definire'}</span>
            </div>
            <div>
              <span className="opacity-70 block">Categoria</span>
              <span className="font-bold">{preview.tipologia}</span>
            </div>
            <div>
              <span className="opacity-70 block">Importo</span>
              <span className="font-bold">€{preview.importo}</span>
            </div>
            <div>
              <span className="opacity-70 block">Data</span>
              <span className="font-bold">{preview.data}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => setPreview(null)}
              className="px-3 py-1 text-xs hover:underline"
            >
              Annulla
            </button>
            <button 
              onClick={confirmAdd}
              disabled={!preview.utente}
              className="bg-white text-indigo-600 px-4 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:shadow-md transition-all disabled:opacity-50"
            >
              <Plus className="w-3 h-3" /> Conferma e Aggiungi
            </button>
          </div>
          {!preview.utente && (
            <p className="mt-2 text-[10px] italic text-white/80">
              * Nota: specifica chi ha speso (Luca/Federica) nel testo per aggiungere direttamente.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
