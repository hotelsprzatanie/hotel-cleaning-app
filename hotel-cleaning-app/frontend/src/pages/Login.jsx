import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleDigit(digit) {
    if (pin.length < 4) {
      setPin((p) => p + digit);
      setError('');
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  async function handleSubmit() {
    if (pin.length !== 4) return;
    setLoading(true);
    try {
      await login(pin);
    } catch (e) {
      setError(e.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  // Automatyczne logowanie po wpisaniu 4 cyfr
  if (pin.length === 4 && !loading) {
    setTimeout(handleSubmit, 80);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-700 p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏨</div>
          <h1 className="text-xl font-bold text-slate-800">Hotel Cleaning</h1>
          <p className="text-slate-500 text-sm mt-1">Wpisz swój PIN</p>
        </div>

        {/* Wskaźnik cyfr */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < pin.length ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-red-600 text-sm mb-4">{error}</p>
        )}

        {/* Klawiatura numeryczna */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(String(d))}
              className="aspect-square rounded-xl bg-slate-100 text-slate-800 text-xl font-semibold hover:bg-slate-200 active:bg-slate-300 transition-colors"
              disabled={loading}
            >
              {d}
            </button>
          ))}
          <div /> {/* puste miejsce */}
          <button
            onClick={() => handleDigit('0')}
            className="aspect-square rounded-xl bg-slate-100 text-slate-800 text-xl font-semibold hover:bg-slate-200 active:bg-slate-300 transition-colors"
            disabled={loading}
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="aspect-square rounded-xl bg-slate-100 text-slate-500 text-xl hover:bg-slate-200 active:bg-slate-300 transition-colors flex items-center justify-center"
            disabled={loading}
          >
            ⌫
          </button>
        </div>

        {loading && (
          <p className="text-center text-slate-400 text-sm mt-4">Logowanie...</p>
        )}
      </div>
    </div>
  );
}
