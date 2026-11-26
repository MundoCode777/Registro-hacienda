import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Ban, Droplets, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import FormAplicacion from './FormAplicacion';
import {
  anularAplicacion,
  listarAplicacionesActividad,
  listarInsumos,
} from '../../services/insumosService';
import { mensajeError } from '../../utils/errores';
import { mostrarError, notificar } from '../../utils/alertas';
import { pedirTexto } from '../../utils/dialogos';
import { nombreTrab } from '../../utils/agenda';
import { nombreEtapa } from '../../utils/cultivos';
import { costoAplicacion, cortoUnidadInsumo, dinero } from '../../utils/insumos';
import { fmt, formatearDia } from '../../utils/suelo';

export default function PanelInsumos({ actividad, mapaTrab, puedeActualizar, gestor }) {
  const { puede, perfil } = useAuth();
  const verCostos = puede('insumos', 'leer');

  const [items, setItems] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState('');

  const puedeRegistrar = puedeActualizar && actividad.estado !== 'cancelada';
  const puedeAnular = gestor && puedeActualizar;

  const cargar = useCallback(async () => {
    try {
      const [a, i] = await Promise.all([
        listarAplicacionesActividad(actividad.id),
        listarInsumos().catch(() => []),
      ]);
      setItems(a);
      setInsumos(i);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las aplicaciones.'));
    } finally {
      setCargando(false);
    }
  }, [actividad.id]);

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

  const trabajadoresActivos = useMemo(
    () => Object.values(mapaTrab).filter((t) => t.estado === 'activo'),
    [mapaTrab]
  );

  // Responsable por defecto: el de la actividad o, si no hay, el trabajador de esta cuenta
  const responsableInicial = useMemo(() => {
    const r = (actividad.asignaciones_tarea || []).find((s) => s.es_responsable);
    if (r) return r.trabajador_id;
    return trabajadoresActivos.some((t) => t.id === perfil.trabajador_id) ? perfil.trabajador_id : '';
  }, [actividad.asignaciones_tarea, trabajadoresActivos, perfil.trabajador_id]);

  const costoTotal = items
    .filter((a) => a.estado === 'registrada')
    .reduce((suma, a) => suma + costoAplicacion(a.aplicacion_consumos), 0);

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
      <div className="flex justify-center p-10">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {puedeRegistrar && !registrando && (
        <div className="mb-5">
          <button onClick={() => setRegistrando(true)} disabled={insumos.length === 0} className="btn-primary">
            <Plus className="h-4 w-4" /> Registrar aplicación
          </button>
          {insumos.length === 0 && (
            <p className="mt-2 text-xs text-stone-500">
              No hay insumos disponibles. El administrador debe crearlos en el módulo Insumos y registrar su ingreso.
            </p>
          )}
        </div>
      )}

      {registrando && (
        <div className="mb-5">
          <FormAplicacion
            actividad={actividad}
            insumos={insumos}
            trabajadores={trabajadoresActivos}
            responsableInicial={responsableInicial}
            onGuardado={async () => {
              setRegistrando(false);
              await cargar();
              notificar('Aplicación registrada y stock descontado');
            }}
            onCancelar={() => setRegistrando(false)}
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 p-8 text-center">
          <Droplets className="h-9 w-9 text-stone-300" />
          <p className="mt-2 font-semibold">Sin insumos aplicados</p>
          <p className="text-sm text-stone-500">Aquí aparecerán los fertilizantes y productos usados en esta actividad.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((a) => {
              const insumo = mapaInsumo[a.insumo_id];
              const unidad = cortoUnidadInsumo(insumo?.unidad_medida);
              const anulada = a.estado === 'anulada';
              return (
                <div key={a.id} className={`rounded-2xl border p-4 ${anulada ? 'border-stone-200 bg-stone-50 text-stone-400' : 'border-stone-200'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className={`font-bold ${anulada ? 'line-through' : ''}`}>
                        {insumo?.nombre_comercial ?? 'Insumo'}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatearDia(a.fecha_aplicacion)}
                        {a.etapa ? ` · ${nombreEtapa(a.etapa)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {anulada && (
                        <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600">
                          Anulada
                        </span>
                      )}
                      {!anulada && puedeAnular && (
                        <button
                          onClick={() => anular(a)}
                          title="Anular aplicación"
                          className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-stone-500">Cantidad</p>
                      <p className="font-semibold">
                        {fmt(a.cantidad_total, 3)} {unidad}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-stone-500">Dosis × área</p>
                      <p className="font-semibold">
                        {fmt(a.dosis_aplicada_ha, 3)} × {fmt(a.area_tratada_ha)} ha
                      </p>
                    </div>
                    {verCostos && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-stone-500">Costo</p>
                        <p className="font-semibold">{dinero(costoAplicacion(a.aplicacion_consumos))}</p>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-stone-500">
                    {a.equipo_usado ? `Equipo: ${a.equipo_usado}` : 'Sin equipo indicado'}
                    {a.trabajador_id ? ` · Responsable: ${nombreTrab(mapaTrab[a.trabajador_id])}` : ''}
                  </p>
                  {a.observaciones && <p className="mt-1 text-sm text-stone-600">{a.observaciones}</p>}
                  {anulada && a.motivo_anulacion && (
                    <p className="mt-2 text-xs">Motivo de la anulación: {a.motivo_anulacion}</p>
                  )}
                </div>
              );
            })}
          </div>

          {verCostos && costoTotal > 0 && (
            <p className="mt-4 text-right text-sm text-stone-600">
              Costo total de insumos de esta actividad: <strong className="text-stone-900">{dinero(costoTotal)}</strong>
            </p>
          )}
        </>
      )}
    </div>
  );
}