import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ abierto, titulo, onCerrar, children, ancho = 'max-w-xl' }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const alPulsar = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div
        className={`card max-h-[92vh] w-full ${ancho} overflow-y-auto rounded-b-none p-6 sm:rounded-b-2xl`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button onClick={onCerrar} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}