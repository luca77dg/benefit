
import React, { useState } from 'react';
import { AppSettings, SupabaseConfig } from '../types';
import { UserPlus, FolderPlus, Trash2, CheckCircle2, Pencil, Check, X, Wallet2, Cloud, Copy, Download, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import { db } from '../services/database';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [newUtente, setNewUtente] = useState('');
  const [newCategoria, setNewCategoria] = useState('');
  const [syncCode, setSyncCode] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  
  const [editingUtente, setEditingUtente] = useState<{ original: string, current: string } | null>(null);
  const [editingCategoria, setEditingCategoria] = useState<{ original: string, current: string } | null>(null);

  const [tempSupabase, setTempSupabase] = useState<SupabaseConfig>(
    settings.supabase || { url: '', key: '', connected: false }
  );

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

  const handleConnectSupabase = async () => {
    setIsSyncing(true);
    const newSettings = { ...settings, supabase: { ...tempSupabase, connected: true } };
    await db.saveSettings(newSettings);
    onUpdate(newSettings);
    
    // Prova un caricamento iniziale per verificare la connessione
    try {
      await db.getSpese();
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    } catch (e) {
      alert("Errore di connessione a Supabase. Controlla URL e Key.");
    } finally {
      setIsSyncing(false);
    }
  };

  const generateSyncCode = () => {
    const config = {
      u: settings.supabase?.url,
      k: settings.supabase?.key,
      set: {
        utenti: settings.utenti,
        categorie: settings.categorie,
        saldi: settings.saldiIniziali
      }
    };
    const code = btoa(JSON.stringify(config));
    navigator.clipboard.writeText(code);
    alert("Codice di sincronizzazione copiato negli appunti!");
  };

  const importSyncCode = () => {
    try {
      const config = JSON.parse(atob(syncCode.trim()));
      const newSettings: AppSettings = {
        ...settings,
        utenti: config.set.utenti,
        categorie: config.set.categorie,
        saldiIniziali: config.set.saldi,
        supabase: { url: config.u, key: config.k, connected: !!config.u }
      };
      onUpdate(newSettings);
      setSyncCode('');
      alert("Configurazione importata con successo!");
    } catch (e) {
      alert("Codice non valido.");
    }
  };

  const handleSyncData = async () => {
    if (confirm("Vuoi caricare tutte le tue spese locali attuali sul cloud?")) {
      setIsSyncing(true);
      const success = await db.syncLocalToCloud();
      setIsSyncing(false);
      if (success) alert("Dati sincronizzati con successo!");
      else alert("Errore durante la sincronizzazione.");
    }
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Sincronizzazione Cloud */}
      <div className="bg-indigo-900 text-white p-6 md:p-10 rounded-[32px] border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Cloud className="w-32 h-32" />
        </div>
        
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-6 relative z-10 flex items-center gap-2">
          <Cloud className="w-4 h-4" /> Sincronizzazione Cloud (Supabase)
        </h3>

        <div className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-indigo-300/60 uppercase tracking-widest px-1">Supabase URL</label>
            <input 
              type="text" 
              placeholder="https://your-project.supabase.co"
              value={tempSupabase.url}
              onChange={(e) => setTempSupabase({...tempSupabase, url: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-indigo-300/60 uppercase tracking-widest px-1">Anon Key</label>
            <input 
              type="password" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={tempSupabase.key}
              onChange={(e) => setTempSupabase({...tempSupabase, key: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={handleConnectSupabase}
              disabled={isSyncing}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                settings.supabase?.connected ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-900'
              }`}
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {settings.supabase?.connected ? 'Database Collegato' : 'Collega Database'}
            </button>
            
            {settings.supabase?.connected && (
              <button 
                onClick={handleSyncData}
                className="bg-indigo-700 hover:bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10"
              >
                Sincronizza Dati Locali
              </button>
            )}
          </div>
        </div>

        {/* Configurazione Rapida */}
        <div className="mt-10 pt-8 border-t border-white/10 relative z-10">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-4 px-1">Configurazione Rapida</h4>
          <p className="text-[11px] text-indigo-200/60 mb-6 leading-relaxed">
            Copia il codice di sincronizzazione per configurare un altro dispositivo istantaneamente con gli stessi utenti, categorie e database.
          </p>
          
          <div className="flex flex-col md:flex-row gap-3">
            <button 
              onClick={generateSyncCode}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-xl text-xs font-bold transition-all"
            >
              <Copy className="w-4 h-4" /> Copia Codice
            </button>
            
            <div className="flex-1 flex gap-2">
              <input 
                type="text" 
                placeholder="Incolla codice qui..."
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-white/20"
              />
              <button 
                onClick={importSyncCode}
                className="bg-indigo-500 text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-indigo-400 transition-all"
              >
                Importa
              </button>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
};
