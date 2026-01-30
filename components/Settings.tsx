
import React, { useState, useRef } from 'react';
import { AppSettings, SupabaseConfig, Spesa } from '../types';
import { 
  UserPlus, Trash2, CheckCircle2, Pencil, Cloud, Copy, 
  RefreshCw, Tag, FolderPlus, Download, Upload, Database, 
  AlertTriangle, Smartphone, Share, Sparkles, HelpCircle, ExternalLink, Key, Zap
} from 'lucide-react';
import { db } from '../services/database';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
  onRefresh: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onRefresh }) => {
  const [newUtente, setNewUtente] = useState('');
  const [newCategoria, setNewCategoria] = useState('');
  const [syncCode, setSyncCode] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    if (confirm(`Rimuovere l'utente ${name}? Tutte le sue spese rimarranno ma l'utente non sarà più selezionabile.`)) {
      const saldi = { ...(settings.saldiIniziali || {}) };
      delete saldi[name];
      onUpdate({ ...settings, utenti: settings.utenti.filter(u => u !== name), saldiIniziali: saldi });
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

  const handleSaldoChange = (user: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const saldi = { ...(settings.saldiIniziali || {}) };
    saldi[user] = numValue;
    onUpdate({ ...settings, saldiIniziali: saldi });
  };

  const addCategoria = () => {
    if (newCategoria.trim() && !settings.categorie.includes(newCategoria.trim())) {
      onUpdate({ ...settings, categorie: [...settings.categorie, newCategoria.trim()] });
      setNewCategoria('');
    }
  };

  const removeCategoria = (cat: string) => {
    if (confirm(`Rimuovere la categoria "${cat}"?`)) {
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

  const handleConnectSupabase = async () => {
    setIsSyncing(true);
    const newSettings = { ...settings, supabase: { ...tempSupabase, connected: true } };
    await db.saveSettings(newSettings);
    onUpdate(newSettings);
    try {
      await db.getSpese();
      // Dopo la connessione, forziamo una sincronizzazione dei saldi iniziali
      await db.syncLocalToCloud();
      alert("Database collegato e dati sincronizzati!");
    } catch (e) {
      alert("Errore di connessione. Controlla URL e Key.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async () => {
    const spese = await db.getSpese();
    const backupData = { settings, spese, timestamp: new Date().toISOString(), version: "1.0" };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benefitsync_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.settings || !data.spese) throw new Error();
        if (confirm("Attenzione! L'importazione sovrascriverà tutti i dati. Continuare?")) {
          await db.importAllData(data);
          alert("Dati importati correttamente!");
          onRefresh();
        }
      } catch { alert("Backup non valido."); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 max-w-4xl mx-auto">
      
      {/* 1. Sincronizzazione Cloud */}
      <div className="bg-indigo-900 text-white p-6 md:p-10 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Cloud className="w-32 h-32" /></div>
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-1 flex items-center gap-2">
              <Cloud className="w-4 h-4" /> Sincronizzazione Cloud
            </h3>
            <p className="text-sm text-indigo-100/70 font-medium">Condividi le spese in tempo reale tra dispositivi.</p>
          </div>
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" /> {showGuide ? 'Chiudi Guida' : 'Come fare?'}
          </button>
        </div>

        {showGuide && (
          <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4 animate-in zoom-in-95">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300">Guida Rapida Supabase</h4>
            <ol className="text-xs space-y-3 text-indigo-100/80">
              <li className="flex gap-3"><span className="w-5 h-5 bg-indigo-500/30 rounded flex items-center justify-center shrink-0">1</span> <span>Vai su <strong>Supabase</strong> e crea un nuovo progetto.</span></li>
              <li className="flex gap-3"><span className="w-5 h-5 bg-indigo-500/30 rounded flex items-center justify-center shrink-0">2</span> <span>Apri l'<strong>SQL Editor</strong> e incolla lo schema (tasto destro -> incolla).</span></li>
              <li className="flex gap-3"><span className="w-5 h-5 bg-indigo-500/30 rounded flex items-center justify-center shrink-0">3</span> <span>Vai in <strong>Database -> Replication</strong> e abilita il Realtime per le tabelle.</span></li>
              <li className="flex gap-3"><span className="w-5 h-5 bg-indigo-500/30 rounded flex items-center justify-center shrink-0">4</span> <span>Incolla qui sotto l'<strong>URL</strong> e la <strong>Anon Key</strong> (sez. API).</span></li>
            </ol>
            <a href="https://supabase.com/dashboard" target="_blank" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white font-bold text-[10px] uppercase mt-2">
              Vai al Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <div className="space-y-4 relative z-10">
          <div className="relative group">
            <Database className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" placeholder="Supabase Project URL" value={tempSupabase.url} onChange={(e) => setTempSupabase({...tempSupabase, url: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-white/20" />
          </div>
          <div className="relative group">
            <Key className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="password" placeholder="Supabase Anon Key" value={tempSupabase.key} onChange={(e) => setTempSupabase({...tempSupabase, key: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-white/20" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={handleConnectSupabase} 
              disabled={isSyncing} 
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                settings.supabase?.connected ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-900'
              }`}
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : settings.supabase?.connected ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              {settings.supabase?.connected ? 'Configurazione Salvata' : 'Collega e Attiva Realtime'}
            </button>
            
            {settings.supabase?.connected && (
              <button 
                onClick={() => {
                  setIsSyncing(true);
                  db.syncLocalToCloud().then(s => {
                    setIsSyncing(false);
                    alert(s ? "Sincronizzazione completata!" : "Errore durante la sincronizzazione.");
                  });
                }} 
                className="bg-indigo-700/50 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Forza Sincro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Gestione Utenti e Saldi */}
      <div className="bg-white p-6 md:p-10 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-500" /> Utenti e Saldi Iniziali
        </h3>
        
        <div className="relative mb-8">
          <input 
            type="text" 
            value={newUtente} 
            onChange={(e) => setNewUtente(e.target.value)} 
            placeholder="Aggiungi utente (es. Luca)..." 
            onKeyDown={(e) => e.key === 'Enter' && addUtente()} 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all pr-16" 
          />
          <button onClick={addUtente} className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all"><Plus className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          {settings.utenti.map(u => (
            <div key={u} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-indigo-200">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                  u === 'Luca' ? 'bg-blue-600 text-white' : u === 'Federica' ? 'bg-pink-600 text-white' : 'bg-slate-700 text-white'
                }`}>
                  {u[0].toUpperCase()}
                </div>
                <div>
                  {editingUtente?.original === u ? (
                    <input 
                      autoFocus 
                      value={editingUtente.current} 
                      onChange={(e) => setEditingUtente({...editingUtente, current: e.target.value})} 
                      onKeyDown={(e) => e.key === 'Enter' && renameUtente()} 
                      onBlur={renameUtente} 
                      className="font-black text-slate-800 bg-white px-3 py-1 rounded-lg outline-none border-2 border-indigo-200" 
                    />
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-lg tracking-tight">{u}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Profilo Utente</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex flex-col items-end px-5 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm group-hover:border-indigo-200 transition-colors">
                  <span className="text-[9px] font-black uppercase text-slate-400 mb-0.5 tracking-wider">Saldi già spesi (€)</span>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      step="0.01" 
                      value={settings.saldiIniziali?.[u] || ''} 
                      onChange={(e) => handleSaldoChange(u, e.target.value)} 
                      className="bg-transparent font-black text-slate-800 outline-none w-24 text-right text-base" 
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditingUtente({ original: u, current: u })} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => removeUtente(u)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Gestione Categorie */}
      <div className="bg-white p-6 md:p-10 rounded-[32px] border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2 px-1">
          <Tag className="w-4 h-4 text-emerald-500" /> Categorie Spesa
        </h3>
        <div className="relative mb-8">
          <input 
            type="text" 
            value={newCategoria} 
            onChange={(e) => setNewCategoria(e.target.value)} 
            placeholder="Esempio: Netflix, Amazon, Palestra..." 
            onKeyDown={(e) => e.key === 'Enter' && addCategoria()} 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all pr-16" 
          />
          <button onClick={addCategoria} className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-3 rounded-xl shadow-lg hover:bg-emerald-700 transition-all"><FolderPlus className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.categorie.map(c => (
            <div key={c} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Tag className="w-4 h-4" />
                </div>
                {editingCategoria?.original === c ? (
                  <input autoFocus value={editingCategoria.current} onChange={(e) => setEditingCategoria({...editingCategoria, current: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && renameCategoria()} onBlur={renameCategoria} className="font-bold text-slate-700 bg-white px-2 py-1 rounded outline-none w-full border border-emerald-200" />
                ) : <span className="font-bold text-slate-700">{c}</span>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingCategoria({ original: c, current: c })} className="p-2 text-slate-300 hover:text-emerald-600"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => removeCategoria(c)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Backup e Installazione */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[32px] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
              <Database className="w-4 h-4" /> Esporta & Importa
            </h3>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed">Scarica una copia dei tuoi dati sul telefono per sicurezza o per caricarli su un altro dispositivo.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="flex-1 bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all">
              <Download className="w-6 h-6 text-indigo-400" />
              <span className="text-[9px] font-black uppercase">Backup</span>
            </button>
            <button onClick={handleImportClick} className="flex-1 bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all">
              <Upload className="w-6 h-6 text-emerald-400" />
              <span className="text-[9px] font-black uppercase">Ripristina</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-indigo-50 shadow-sm flex flex-col justify-between relative group">
          <div className="absolute -right-4 -top-4 text-indigo-50 group-hover:scale-110 transition-transform"><Smartphone className="w-24 h-24" /></div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Versione Web App
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Aggiungi BenefitSync alla schermata Home del tuo iPhone o Android per usarlo come un'App nativa a tutto schermo.</p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl">
             <Share className="w-5 h-5 text-indigo-600" />
             <span className="text-[10px] font-bold text-indigo-900 leading-tight">Usa il tasto "Condividi" e poi "Aggiungi alla Home"</span>
          </div>
        </div>
      </div>

    </div>
  );
};
