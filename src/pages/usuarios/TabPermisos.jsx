import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Info, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { MODULOS_CONFIGURABLES } from '../../config/modulos';

const ACCIONES = [
  { clave: 'crear', nombre: 'Crear' },
  { clave: 'leer', nombre: 'Leer' },
  { clave: 'actualizar', nombre: 'Actualizar' },
  { clave: 'eliminar', nombre: 'Eliminar' },
];

export default function TabPermisos() {
  const [roles, setRoles] = useState([]);
  const [rolId, setRolId] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarPermisos = useCallback(async (id) => {
    const { data, error: err } = await supabase
      .from('permisos_modulo')
      .select('*')
      .eq('rol_id', id);
    if (err) setError('No se pudieron cargar los permisos.');
    setPermisos(data || []);
    setCargando(false);
  }, []);

  // Cargar roles al abrir la pestaña
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('roles').select('*').order('nivel', { ascending: false });
      setRoles(data || []);
      if (data?.length) setRolId(data[data.length - 1].id); // empieza en el rol de menor nivel
    })();
  }, []);

  useEffect(() => {
    if (rolId) {
      setCargando(true);
      cargarPermisos(rolId);
    }
  }, [rolId, cargarPermisos]);

  const rolActual = roles.find((r) => r.id === rolId);
  const bloqueado = rolActual?.nombre === 'Administrador';

  const alternar = async (modulo, accion) => {
    const fila = permisos.find((p) => p.modulo === modulo);
    if (!fila || bloqueado) return;

    setError('');
    const nuevo = !fila[accion];
    setPermisos((prev) => prev.map((p) => (p.id === fila.id ? { ...p, [accion]: nuevo } : p)));

    const { error: err } = await supabase
      .from('permisos_modulo')
      .update({ [accion]: nuevo })
      .eq('id', fila.id);

    if (err) {
      setError('No se pudo guardar el cambio.');
      cargarPermisos(rolId);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setRolId(r.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              rolId === r.id
                ? 'border-green-700 bg-green-700 text-white'
                : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {r.nombre}
          </button>
        ))}
      </div>

      {rolActual && (
        <p className="mb-4 text-sm text-stone-500">{rolActual.descripcion}</p>
      )}

      {bloqueado && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          El Administrador siempre tiene acceso total, por eso sus permisos no se pueden modificar.
        </div>
      )}

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
                  <th className="px-5 py-3">Módulo</th>
                  {ACCIONES.map((a) => (
                    <th key={a.clave} className="px-5 py-3 text-center">
                      {a.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {MODULOS_CONFIGURABLES.map(({ clave, nombre, icono: Icono }) => {
                  const fila = permisos.find((p) => p.modulo === clave);
                  return (
                    <tr key={clave} className="hover:bg-stone-50/60">
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-3 font-semibold">
                          <Icono className="h-5 w-5 text-green-700" /> {nombre}
                        </span>
                      </td>
                      {ACCIONES.map((a) => (
                        <td key={a.clave} className="px-5 py-4 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 cursor-pointer rounded accent-green-700 disabled:cursor-not-allowed"
                            checked={Boolean(fila?.[a.clave])}
                            disabled={bloqueado || !fila}
                            onChange={() => alternar(clave, a.clave)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-stone-500">
        Los cambios se guardan al instante y se aplican a cada usuario la próxima vez que inicie sesión.
      </p>
    </div>
  );
}