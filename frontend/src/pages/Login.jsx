import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MAX_PIN = 6;

// Wzór fal jako SVG zakodowany inline
const WaveBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Gradientowe tło */}
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(160deg, #1B4F72 0%, #2E86C1 50%, #1A5276 100%)'
    }} />
    {/* Fale dekoracyjne */}
    <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none">
      <path fill="rgba(255,255,255,0.06)"
        d="M0,80 C360,160 720,0 1080,80 C1260,120 1380,60 1440,80 L1440,200 L0,200 Z" />
      <path fill="rgba(255,255,255,0.04)"
        d="M0,120 C240,60 480,160 720,120 C960,80 1200,160 1440,120 L1440,200 L0,200 Z" />
    </svg>
    {/* Dekoracyjne kółka */}
    <div className="absolute top-16 left-8 w-32 h-32 rounded-full opacity-10"
      style={{ background: '#5DADE2' }} />
    <div className="absolute top-40 right-12 w-20 h-20 rounded-full opacity-10"
      style={{ background: '#AED6F1' }} />
    <div className="absolute bottom-32 left-16 w-16 h-16 rounded-full opacity-10"
      style={{ background: '#5DADE2' }} />
  </div>
);

export default function Login() {
  const { login } = useAuth();
  const [pin, setPin]      = useState('');
  const [error, setError]  = useState('');
  const [loading, setLoad] = useState(false);

  function handleDigit(d) {
    if (pin.length < MAX_PIN) { setPin(p => p + d); setError(''); }
  }
  function handleBack() { setPin(p => p.slice(0, -1)); setError(''); }

  async function handleSubmit() {
    if (pin.length < 4 || loading) return;
    setLoad(true);
    try { await login(pin); }
    catch (e) { setError(e.message); setPin(''); }
    finally { setLoad(false); }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      <WaveBg />

      {/* Logo i tytuł */}
      <div className="relative z-10 text-center mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight">Nordhotels</h1>
        <p className="text-[#5DADE2] text-lg font-light mt-1 tracking-widest uppercase text-sm">
          Reinigungsmanagement
        </p>
      </div>

      {/* Karta z klawiaturą */}
      <div className="relative z-10 bg-white w-full max-w-xs rounded-3xl p-8 animate-in"
        style={{ boxShadow: '0 20px 60px rgba(27,79,114,0.35)' }}>

        {/* Wyświetlacz PIN — kropki */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: MAX_PIN }).map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full transition-all duration-200"
              style={{
                background: i < pin.length ? '#1B4F72' : 'transparent',
                border: `2px solid ${i < pin.length ? '#1B4F72' : '#CBD5E1'}`,
                transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
              }} />
          ))}
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-center">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Klawiatura — okrągłe przyciski */}
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} onClick={() => handleDigit(String(d))} disabled={loading}
              className="aspect-square rounded-2xl text-xl font-semibold text-[#2C3E50]
                         transition-all duration-150 active:scale-90 select-none"
              style={{ background: '#F0F4F8', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
              {d}
            </button>
          ))}
          {/* Backspace */}
          <button onClick={handleBack} disabled={loading}
            className="aspect-square rounded-2xl text-xl text-[#7F8C8D]
                       transition-all duration-150 active:scale-90"
            style={{ background: '#F0F4F8', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
            ⌫
          </button>
          {/* 0 */}
          <button onClick={() => handleDigit('0')} disabled={loading}
            className="aspect-square rounded-2xl text-xl font-semibold text-[#2C3E50]
                       transition-all duration-150 active:scale-90"
            style={{ background: '#F0F4F8', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
            0
          </button>
          {/* OK */}
          <button onClick={handleSubmit} disabled={loading || pin.length < 4}
            className="aspect-square rounded-2xl text-base font-bold transition-all duration-150 active:scale-90"
            style={pin.length >= 4 && !loading
              ? { background: 'linear-gradient(135deg,#1B4F72,#2E86C1)', color: '#fff',
                  boxShadow: '0 4px 14px rgba(27,79,114,0.4)' }
              : { background: '#E8EDF2', color: '#B0BEC5' }}>
            {loading ? '...' : 'OK'}
          </button>
        </div>
      </div>

      <p className="relative z-10 text-[#AED6F1] text-xs mt-8 opacity-70">
        © Nordhotels · Reinigungsmanagement
      </p>
    </div>
  );
}
