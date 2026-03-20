import { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, Check } from 'lucide-react';

const STORAGE_KEY = 'avalon_gemini_api_key';

export default function ApiKeyInput() {
  const [key, setKey] = useState('');
  const [masked, setMasked] = useState(true);
  const [saved, setSaved] = useState(false);
  const [useMock, setUseMock] = useState(() => sessionStorage.getItem('USE_MOCK_LLM') === 'true');

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setKey(stored);
      setSaved(true);
    }
  }, []);

  const handleSave = () => {
    if (!key.trim()) return;
    sessionStorage.setItem(STORAGE_KEY, key.trim());
    sessionStorage.setItem('USE_MOCK_LLM', useMock.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggleMock = () => {
    const next = !useMock;
    setUseMock(next);
    sessionStorage.setItem('USE_MOCK_LLM', next.toString());
  };

  const display = masked && key
    ? key.slice(0, 4) + '•'.repeat(Math.max(0, key.length - 8)) + key.slice(-4)
    : key;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <Key size={14} />
        Gemini API Key
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={masked ? 'password' : 'text'}
            value={masked ? key : key}
            placeholder="paste your API key…"
            onChange={(e) => {
              setKey(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 pr-10 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
          />
          <button
            type="button"
            onClick={() => setMasked(!masked)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
          >
            {masked ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
            saved
              ? 'bg-emerald-600/80 text-emerald-100'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {saved ? <Check size={14} /> : null}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {key && masked && (
        <p className="text-xs text-slate-500 font-mono">{display}</p>
      )}

      <div className="flex items-center gap-3 mt-4">
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={useMock} onChange={handleToggleMock} />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          <span className="ml-3 text-sm font-medium text-slate-300 text-indigo-300">啟用開發者 Mock 模式 (測試對話不消耗真實 API 額度)</span>
        </label>
      </div>
    </div>
  );
}
