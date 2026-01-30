
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { UserPlus, FolderPlus, Trash2, CheckCircle2, Pencil, Check, X, Wallet2 } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [newUtente, setNewUtente] = useState('');
  const [newCategoria, setNewCategoria] = useState('');
  
  // Stati per la rinomina
  const [editingUtente, setEditingUtente] = useState<{ original: string, current: string } | null>(null);
  const [editingCategoria, setEditingCategoria] = useState<{ original: string, current: string } | null>(null);

  const addUtente = () => {
    if (newUtente.trim() && !settings.utenti.includes(newUtente.trim())) {
      const saldi = { ...(settings.saldiIniziali || {}) };
      saldi[newUtente.trim()] = 0;
      onUpdate({ ...settings, utenti: [...settings.utenti, newUtente.trim()], saldiIniziali: saldi });
      setNewUtente('');
    }
  };

  const removeUtente = (name: string) => {
    if (confirm(`Rimuovere l'utente ${name}?`)) {
      const saldi = { ...(settings.saldiIniziali || {}) };
      delete saldi[name];
      onUpdate({ ...settings, utenti: settings.utenti.filter(u => u !== name), saldiIniziali: saldi });
    }
  };

  const handleSaldoChange = (user: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const saldi = { ...(settings.saldiIniziali || {}) };
    saldi[user] = numValue;
    onUpdate({ ...settings, saldiIniziali: saldi });
  };

  const renameUtente = () => {
    if (editingUtente && editingUtente.current.trim() && editingUtente.current !== editingUtente.original) {
      const saldi = { ...(settings.saldiIniziali || {}) };
      const val = saldi[editingUtente.original] || 0;
      delete saldi[editingUtente.original];
      saldi[editingUtente.current.trim()] = val;
      
      const newUtenti = settings.utenti.map(u => u === editingUtente.original ? editingUtente.current.trim() : u);
      onUpdate({ ...settings, utenti: newUtenti, saldiIniziali: saldi });
      setEditingUtente(null);
    } else {
      setEditingUtente(null);
    }
  };

  const addCategoria = () => {
    if (newCategoria.trim() && !settings.categorie.includes(newCategoria.trim())) {
      onUpdate({ ...settings, categorie: [...settings.categorie, newCategoria.trim()] });
      setNewCategoria('');
    }
  };

  const removeCategoria = (cat: string) => {
    if (confirm(`Rimuovere la categoria ${cat}?`)) {
      onUpdate({ ...settings, categorie: settings.categorie.filter(c => c !== cat) });
    }
  };

  const renameCategoria = () => {
    if (editingCategoria && editingCategoria.current.trim() && editingCategoria.current !== editingCategoria.original) {
      const newCats = settings.categorie.map(c => c === editingCategoria.original ? editingCategoria.current.trim() : c);
      onUpdate({ ...settings, categorie: newCats });
      setEditingCategoria(null);
    } else {
      setEditingCategoria(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Gestione Utenti */}
      <div className="bg-white/50 backdrop-blur-md p-6 md:p-10 rounded-[32px] border border-white shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Gestione Utenti</h3>
        
        <div className="relative mb-8">
          <input 
            type="text" 
            value={newUtente}
            onChange={(e) => setNewUtente(e.target.value)}
            placeholder="Aggiungi utente"
            className="w-full bg-slate-100/50 border border-slate-200/50 rounded-2xl px-6 py-4 font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all pr-16"
            onKeyDown={(e) => e.key === 'Enter' && addUtente()}
          />
          <button 
            onClick={addUtente}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {settings.utenti.map(u => (
            <div key={u} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-black text-[10px] ${
                  u === 'Luca' ? 'bg-blue-100 text-blue-600' : u === 'Federica' ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {u[0].toUpperCase()}
                </div>
                
                {editingUtente?.original === u ? (
                  <input 
                    autoFocus
                    className="font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-md w-full outline-none focus:ring-1 focus:ring-indigo-500"
                    value={editingUtente.current}
                    onChange={(e) => setEditingUtente({...editingUtente, current: e.target.value})}
                    onKeyDown={(e) => e.key === 'Enter' && renameUtente()}
                    onBlur={renameUtente}
                  />
                ) : (
                  <span className="font-bold text-slate-700 tracking-tight truncate">{u}</span>
                )}
              </div>

              {/* Input per Buoni già spesi */}
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl">
                <Wallet2 className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex flex-col">
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Buoni già spesi</span>
                   <input 
                     type="number"
                     step="0.01"
                     placeholder="0.00"
                     value={settings.saldiIniziali?.[u] || ''}
                     onChange={(e) => handleSaldoChange(u, e.target.value)}
                     className="bg-transparent font-bold text-slate-600 outline-none w-20 text-xs"
                   />
                </div>
              </div>
              
              <div className="flex items-center gap-1 self-end md:self-auto">
                {editingUtente?.original === u ? (
                  <button onClick={renameUtente} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => setEditingUtente({ original: u, current: u })}
                      className="p-2 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => removeUtente(u)} 
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gestione Categorie */}
      <div className="bg-white/50 backdrop-blur-md p-6 md:p-10 rounded-[32px] border border-white shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Gestione Categorie</h3>
        
        <div className="relative mb-8">
          <input 
            type="text" 
            value={newCategoria}
            onChange={(e) => setNewCategoria(e.target.value)}
            placeholder="Esempio: Casa, Salute"
            className="w-full bg-slate-100/50 border border-slate-200/50 rounded-2xl px-6 py-4 font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all pr-16"
            onKeyDown={(e) => e.key === 'Enter' && addCategoria()}
          />
          <button 
            onClick={addCategoria}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <FolderPlus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.categorie.map(c => (
            <div key={c} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all">
              <div className="flex items-center gap-3 flex-1 mr-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                
                {editingCategoria?.original === c ? (
                  <input 
                    autoFocus
                    className="font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-md w-full outline-none focus:ring-1 focus:ring-indigo-500"
                    value={editingCategoria.current}
                    onChange={(e) => setEditingCategoria({...editingCategoria, current: e.target.value})}
                    onKeyDown={(e) => e.key === 'Enter' && renameCategoria()}
                    onBlur={renameCategoria}
                  />
                ) : (
                  <span className="font-bold text-slate-700 tracking-tight">{c}</span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {editingCategoria?.original === c ? (
                  <button onClick={renameCategoria} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => setEditingCategoria({ original: c, current: c })}
                      className="p-2 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => removeCategoria(c)} 
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
