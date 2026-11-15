import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { formatearFecha } from '../../utils/formato';

export default function TabUsuarios() {
  const { perfil, puede } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(null);

  const puedeEditar = puede('usuarios', 'actualizar');

  const cargar = useCallback(async () => {
    const [u, r] = await Promise.all([
      supabase.from('usuarios').select('*, roles(nombre)').order('created_at'),
      supabase.from('roles').select('*').order('nivel', { ascending: false }),
    ]);
    if (u.error || r.error) setError('No se pudieron cargar los usuarios.');
    setUsuarios(u.data || []);
    setRoles(r.data || []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const actualizar = async (id, cambios) => {
    setError('');
    setGuardando(id);
    const { error: err } = await supabase.from('usuarios').update(cambios).eq('id', id);
    if (err) setError(err.message || 'No se pudo guardar el cambio.');
    await cargar();
    setGuardando(null);
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => `${u.nombre_completo} ${u.correo}`.toLowerCase().includes(q));
  }, [usuarios, busqueda]);

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          className="input pl-10"
          placeholder="Buscar por nombre o correo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

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
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3">Último ingreso</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtrados.map((u) => {
                  const esYo = u.id === perfil.id;
                  const bloqueado = !puedeEditar || esYo || guardando === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-stone-50/60">
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {u.nombre_completo}{' '}
                          {esYo && <span className="text-xs font-medium text-green-700">(tú)</span>}
                        </p>
                        <p className="text-xs text-stone-500">{u.correo}</p>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          className="input !w-auto !py-1.5"
                          value={u.rol_id}
                          disabled={bloqueado}
                          onChange={(e) => actualizar(u.id, { rol_id: Number(e.target.value) })}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-stone-600">
                        {formatearFecha(u.ultimo_login, 'Nunca')}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          disabled={bloqueado}
                          onClick={() => actualizar(u.id, { activo: !u.activo })}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed ${
                            u.activo
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-stone-500">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}