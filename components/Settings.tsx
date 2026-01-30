
import React, { useState, useRef } from 'react';
import { AppSettings, SupabaseConfig, Spesa } from '../types';
import { 
  UserPlus, Trash2, CheckCircle2, Pencil, Cloud, Copy, 
  RefreshCw, Tag, FolderPlus, Download, Upload, Database, 
  AlertTriangle
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
      alert("Database collegato correttamente!");
    } catch (e) {
      alert("Errore di connessione a Supabase.");
    } finally {
      setIsSyncing(false);
    }
  };

  const generateSyncCode = () => {
    const config = {
      u: settings.supabase?.url,
      k: settings.supabase?.key,
      set: { utenti: settings.utenti, categorie: settings.categorie, saldi: settings.saldiIniziali }
    };
    navigator.clipboard.writeText(btoa(JSON.stringify(config)));
    alert("Codice copiato!");
  };

  const importSyncCode = () => {
    try {
      const config = JSON.parse(atob(syncCode.trim()));
      onUpdate({
        ...settings,
        utenti: config.set.utenti,
        categorie: config.set.categorie,
        saldiIniziali: config.set.saldi,
        supabase: { url: config.u, key: config.k, connected: !!config.u }
      });
      setSyncCode('');
      alert("Configurazione importata!");
    } catch (e) { alert("Codice non valido."); }
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
          alert("Dati importati!");
          onRefresh();
        }
      } catch { alert("Backup non valido."); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="bg-indigo-900 text-white p-6 md:p-10 rounded-[32px] border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Cloud className="w-32 h-32" /></div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-6 flex items-center gap-2">
          <Cloud className="w-4 h-4" /> Sincronizzazione Cloud
        </h3>
        <div className="space-y-4 relative z-10">
          <input type="text" placeholder="Supabase URL" value={tempSupabase.url} onChange={(e) => setTempSupabase({...tempSupabase, url: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-white/30 transition-all" />
          <input type="password" placeholder="Anon Key" value={tempSupabase.key} onChange={(e) => setTempSupabase({...tempSupabase, key: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-white/30 transition-all" />
          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={handleConnectSupabase} disabled={isSyncing} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${settings.supabase?.connected ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-900'}`}>{isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}{settings.supabase?.connected ? 'Database Collegato' : 'Collega Database'}</button>
            {settings.supabase?.connected && <button onClick={() => db.syncLocalToCloud().then(s => alert(s ? "Sincronizzato!" : "Errore"))} className="bg-indigo-700 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10">Sincronizza Locali</button>}
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row gap-3">
            <button onClick={generateSyncCode} className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-3 rounded-xl text-xs font-bold transition-all"><Copy className="w-4 h-4" /> Copia Config</button>
            <div className="flex-1 flex gap-2">
              <input type="text" placeholder="Incolla codice..." value={syncCode} onChange={(e) => setSyncCode(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none" />
              <button onClick={importSyncCode} className="bg-indigo-500 px-4 py-3 rounded-xl text-xs font-bold">Importa</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-md p-6 md:p-10 rounded-[32px] border border-white shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Gestione Utenti</h3>
        <div className="relative mb-6">
          <input type="text" value={newUtente} onChange={(e) => setNewUtente(e.target.value)} placeholder="Aggiungi utente..." onKeyDown={(e) => e.key === 'Enter' && addUtente()} className="w-full bg-slate-100/50 border border-slate-200/50 rounded-2xl px-6 py-4 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all pr-16" />
          <button onClick={addUtente} className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg"><UserPlus className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {settings.utenti.map(u => (
            <div key={u} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 group shadow-sm transition-all hover:border-indigo-100">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${u === 'Luca' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>{u[0]}</div>
                {editingUtente?.original === u ? (
                  <input autoFocus value={editingUtente.current} onChange={(e) => setEditingUtente({...editingUtente, current: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && renameUtente()} onBlur={renameUtente} className="font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded outline-none w-full" />
                ) : <span className="font-bold text-slate-700">{u}</span>}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end px-4 py-2 bg-indigo-50/50 border border-indigo-100/50 rounded-xl min-w-[120px]">
                  <span className="text-[8px] font-black uppercase text-indigo-400 mb-0.5 tracking-wider">Già spesi</span>
                  <div className="flex items-center gap-1">
                    <input type="number" step="0.01" value={settings.saldiIniziali?.[u] || ''} onChange={(e) => handleSaldoChange(u, e.target.value)} className="bg-transparent font-black text-indigo-700 outline-none w-20 text-right text-sm" />
                    <span className="text-sm font-black text-indigo-700">€</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditingUtente({ original: u, current: u })} className="p-2 text-slate-300 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => removeUtente(u)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-md p-6 md:p-10 rounded-[32px] border border-white shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Gestione Categorie</h3>
        <div className="relative mb-6">
          <input type="text" value={newCategoria} onChange={(e) => setNewCategoria(e.target.value)} placeholder="Aggiungi categoria (es. Amazon, Sport)..." onKeyDown={(e) => e.key === 'Enter' && addCategoria()} className="w-full bg-slate-100/50 border border-slate-200/50 rounded-2xl px-6 py-4 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all pr-16" />
          <button onClick={addCategoria} className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-2.5 rounded-xl shadow-lg"><FolderPlus className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {settings.categorie.map(c => (
            <div key={c} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 group shadow-sm transition-all hover:border-emerald-100">
              <div className="flex items-center gap-3 flex-1">
                <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
                {editingCategoria?.original === c ? (
                  <input autoFocus value={editingCategoria.current} onChange={(e) => setEditingCategoria({...editingCategoria, current: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && renameCategoria()} onBlur={renameCategoria} className="font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded outline-none w-full text-sm" />
                ) : <span className="font-bold text-slate-700 text-sm">{c}</span>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingCategoria({ original: c, current: c })} className="p-2 text-slate-300 hover:text-emerald-600"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => removeCategoria(c)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 text-white p-6 md:p-10 rounded-[32px] border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Database className="w-32 h-32" /></div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
          <Database className="w-4 h-4" /> Archivio e Backup
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <button onClick={handleExport} className="flex flex-col items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all text-left group"><div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform"><Download className="w-6 h-6" /></div><div><p className="font-bold text-sm mb-1">Esporta Dati</p><p className="text-[10px] text-slate-400 font-medium">Scarica un file JSON con tutte le spese e le configurazioni.</p></div></button>
          <button onClick={handleImportClick} className="flex flex-col items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all text-left group"><div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform"><Upload className="w-6 h-6" /></div><div><p className="font-bold text-sm mb-1">Importa Backup</p><p className="text-[10px] text-slate-400 font-medium">Carica un file JSON per ripristinare i dati (sovrascrive tutto).</p></div></button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3"><AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><p className="text-[9px] text-amber-200/70 font-medium leading-relaxed uppercase tracking-wider">Consiglio: Effettua un backup settimanale per sicurezza. I dati importati sostituiranno interamente quelli presenti sul dispositivo.</p></div>
      </div>
    </div>
  );
};
