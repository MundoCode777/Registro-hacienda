import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { formatearFecha, resumirDispositivo } from '../../utils/formato';

export default function TabSesiones() {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('sesiones')
        .select('*, usuarios(nombre_completo, correo)')
        .order('fecha_inicio', { ascending: false })
        .limit(100);
      if (err) setError('No se pudo cargar el historial de sesiones.');
      setSesiones(data || []);
      setCargando(false);
    })();
  }, []);

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {cargando ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-7 w-7 animate-spin text-green-700" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Inicio</th>
                  <th className="px-5 py-3">Cierre</th>
                  <th className="px-5 py-3">Dispositivo</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sesiones.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/60">
                    <td className="px-5 py-4">
                      <p className="font-semibold">{s.usuarios?.nombre_completo ?? '—'}</p>
                      <p className="text-xs text-stone-500">{s.usuarios?.correo}</p>
                    </td>
                    <td className="px-5 py-4 text-stone-600">{formatearFecha(s.fecha_inicio)}</td>
                    <td className="px-5 py-4 text-stone-600">{formatearFecha(s.fecha_cierre)}</td>
                    <td className="px-5 py-4 text-stone-600">{resumirDispositivo(s.dispositivo)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          s.estado === 'activa'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {s.estado === 'activa' ? 'Activa' : 'Cerrada'}
                      </span>
                    </td>
                  </tr>
                ))}
                {sesiones.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-stone-500">
                      Aún no hay sesiones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-stone-500">Se muestran las últimas 100 sesiones.</p>
    </div>
  );
}