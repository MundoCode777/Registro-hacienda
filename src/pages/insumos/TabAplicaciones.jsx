import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Ban, Droplets, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { anularAplicacion, listarAplicaciones, listarInsumos } from '../../services/insumosService';
import { listarTrabajadoresBasico } from '../../services/agendaService';
import { mensajeError } from '../../utils/errores';
import { mostrarError, notificar } from '../../utils/alertas';
import { pedirTexto } from '../../utils/dialogos';
import { esGestor, nombreTrab } from '../../utils/agenda';
import { nombreEtapa } from '../../utils/cultivos';
import { costoAplicacion, cortoUnidadInsumo, dinero } from '../../utils/insumos';
import { fmt, formatearDia } from '../../utils/suelo';

export default function TabAplicaciones() {
  const { rol, puede } = useAuth();
  const puedeAnular = esGestor(rol) && puede('agenda', 'actualizar');

  const [aplicaciones, setAplicaciones] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroInsumo, setFiltroInsumo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('registrada');

  const cargar = useCallback(async () => {
    try {
      const [a, i, t] = await Promise.all([
        listarAplicaciones(),
        listarInsumos().catch(() => []),
        listarTrabajadoresBasico().catch(() => []),
      ]);
      setAplicaciones(a);
      setInsumos(i);
      setTrabajadores(t);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las aplicaciones.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mapaInsumo = useMemo(() => {
    const m = {};
    insumos.forEach((i) => {
      m[i.id] = i;
    });
    return m;
  }, [insumos]);

  const mapaTrab = useMemo(() => {
    const m = {};
    trabajadores.forEach((t) => {
      m[t.id] = t;
    });
    return m;
  }, [trabajadores]);

  const visibles = useMemo(
    () =>
      aplicaciones.filter(
        (a) =>
          (filtroEstado === 'todas' || a.estado === filtroEstado) &&
          (!filtroInsumo || a.insumo_id === filtroInsumo)
      ),
    [aplicaciones, filtroEstado, filtroInsumo]
  );

  const costoTotal = useMemo(
    () =>
      visibles
        .filter((a) => a.estado === 'registrada')
        .reduce((suma, a) => suma + costoAplicacion(a.aplicacion_consumos), 0),
    [visibles]
  );

  const anular = async (a) => {
    const motivo = await pedirTexto({
      titulo: '¿Anular esta aplicación?',
      texto: 'El stock utilizado volverá a los lotes de donde salió. Esta acción no se puede deshacer.',
      placeholder: 'Ej. Se registró por error, cantidad mal digitada…',
      confirmar: 'Sí, anular',
    });
    if (!motivo) return;
    try {
      await anularAplicacion(a.id, motivo);
      await cargar();
      notificar('Aplicación anulada y stock devuelto');
    } catch (err) {
      mostrarError('No se pudo anular la aplicación', mensajeError(err));
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="input !w-auto" value={filtroInsumo} onChange={(e) => setFiltroInsumo(e.target.value)}>
          <option value="">Todos los insumos</option>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre_comercial}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {[
            { clave: 'registrada', nombre: 'Registradas' },
            { clave: 'anulada', nombre: 'Anuladas' },
            { clave: 'todas', nombre: 'Todas' },
          ].map((f) => (
            <button
              key={f.clave}
              onClick={() => setFiltroEstado(f.clave)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                filtroEstado === f.clave
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {f.nombre}
            </button>
          ))}
        </div>

        <p className="ml-auto text-sm text-stone-600">
          Costo de las registradas: <strong className="text-stone-900">{dinero(costoTotal)}</strong>
        </p>
      </div>

      <p className="mb-4 text-xs text-stone-500">
        Las aplicaciones se registran desde cada actividad, en la pestaña Insumos del detalle de la Agenda. Se muestran las
        últimas 300.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <Droplets className="h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold">No hay aplicaciones para mostrar</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Insumo</th>
                  <th className="px-4 py-3">Actividad</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Dosis × área</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Costo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visibles.map((a) => {
                  const insumo = mapaInsumo[a.insumo_id];
                  const unidad = cortoUnidadInsumo(insumo?.unidad_medida);
                  const anulada = a.estado === 'anulada';
                  return (
                    <tr key={a.id} className={anulada ? 'bg-stone-50 text-stone-400' : 'hover:bg-stone-50/60'}>
                      <td className="px-4 py-3">{formatearDia(a.fecha_aplicacion)}</td>
                      <td className="px-4 py-3 font-semibold">
                        {insumo?.nombre_comercial ?? 'Insumo'}
                        {a.etapa && <p className="text-xs font-normal text-stone-500">{nombreEtapa(a.etapa)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {a.actividades?.tipos_actividad?.nombre ?? '—'}
                        <p className="text-xs text-stone-500">{a.actividades?.lotes?.nombre ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {fmt(a.cantidad_total, 3)} {unidad}
                      </td>
                      <td className="px-4 py-3">
                        {fmt(a.dosis_aplicada_ha, 3)} × {fmt(a.area_tratada_ha)} ha
                      </td>
                      <td className="px-4 py-3">{a.trabajador_id ? nombreTrab(mapaTrab[a.trabajador_id]) : '—'}</td>
                      <td className="px-4 py-3">{dinero(costoAplicacion(a.aplicacion_consumos))}</td>
                      <td className="px-4 py-3 text-right">
                        {anulada ? (
                          <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600">
                            Anulada
                          </span>
                        ) : (
                          puedeAnular && (
                            <button
                              onClick={() => anular(a)}
                              title="Anular aplicación"
                              className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}