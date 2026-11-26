import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Ban,
  Camera,
  CheckCircle2,
  Droplets,
  Loader2,
  Pencil,
  Play,
  Repeat,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Tabs from '../../components/ui/Tabs';
import PanelEquipo from './PanelEquipo';
import PanelSeguimiento from './PanelSeguimiento';
import PanelEvidencias from './PanelEvidencias';
import PanelInsumos from './PanelInsumos';
import {
  actualizarActividad,
  cancelarSerie,
  obtenerRecurrencia,
} from '../../services/agendaService';
import { mensajeError } from '../../utils/errores';
import { mostrarError, notificar } from '../../utils/alertas';
import { aNumero, fmt, formatearDia, hoyISO } from '../../utils/suelo';
import {
  ESTADOS_ACTIVIDAD,
  PRIORIDADES,
  cortoUnidad,
  esGestor,
  estaAtrasada,
  estaCerrada,
  textoRecurrencia,
} from '../../utils/agenda';

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-stone-500">{etiqueta}</p>
      <p className="mt-0.5 font-semibold">{valor || '—'}</p>
    </div>
  );
}

export default function DetalleActividad({ actividad: a, mapaTrab, trabajadores, onCambio, onEditar }) {
  const { rol, puede, perfil } = useAuth();
  const gestor = esGestor(rol);
  const puedeActualizar = puede('agenda', 'actualizar');
  const cerrada = estaCerrada(a);
  const unidad = cortoUnidad(a.tipos_actividad?.unidad_medida);

  const [seccion, setSeccion] = useState('resumen');
  const [accion, setAccion] = useState(null); // null | 'completar' | 'cancelar'
  const [recurrencia, setRecurrencia] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');

  const [fechaEj, setFechaEj] = useState(hoyISO());
  const [cantidadReal, setCantidadReal] = useState('');
  const [motivo, setMotivo] = useState('');
  const [cancelarSiguientes, setCancelarSiguientes] = useState(false);

  useEffect(() => {
    let activo = true;
    if (a.recurrencia_id) {
      obtenerRecurrencia(a.recurrencia_id)
        .then((r) => {
          if (activo) setRecurrencia(r);
        })
        .catch(() => {});
    } else {
      setRecurrencia(null);
    }
    return () => {
      activo = false;
    };
  }, [a.recurrencia_id]);

  const estado = ESTADOS_ACTIVIDAD[a.estado];
  const prioridad = PRIORIDADES[a.prioridad];
  const asignados = (a.asignaciones_tarea || []).length;

  const tabs = [
    { clave: 'resumen', nombre: 'Resumen', icono: CheckCircle2 },
    { clave: 'equipo', nombre: `Equipo (${asignados})`, icono: Users },
    { clave: 'seguimiento', nombre: 'Seguimiento', icono: TrendingUp },
    { clave: 'insumos', nombre: 'Insumos', icono: Droplets },
    { clave: 'evidencias', nombre: 'Evidencias', icono: Camera },
  ];

  const iniciar = async () => {
    try {
      await actualizarActividad({ estado: 'en_proceso' }, a.id);
      await onCambio();
      notificar('Actividad iniciada');
    } catch (err) {
      mostrarError('No se pudo iniciar la actividad', mensajeError(err));
    }
  };

  const completar = async (e) => {
    e.preventDefault();
    setErrorAccion('');
    setTrabajando(true);
    try {
      await actualizarActividad(
        {
          estado: 'completada',
          fecha_ejecucion: fechaEj,
          cantidad_realizada: aNumero(cantidadReal),
        },
        a.id
      );
      setAccion(null);
      await onCambio();
      notificar('Actividad completada');
    } catch (err) {
      setErrorAccion(mensajeError(err, 'No se pudo completar la actividad.'));
    } finally {
      setTrabajando(false);
    }
  };

  const cancelar = async (e) => {
    e.preventDefault();
    setErrorAccion('');
    setTrabajando(true);
    try {
      await actualizarActividad({ estado: 'cancelada', motivo_cancelacion: motivo.trim() }, a.id);
      let extra = 0;
      if (a.recurrencia_id && cancelarSiguientes) {
        extra = await cancelarSerie(a.recurrencia_id, a.fecha_programada, motivo.trim());
      }
      setAccion(null);
      await onCambio();
      notificar(extra > 0 ? `Se cancelaron ${extra + 1} actividades` : 'Actividad cancelada');
    } catch (err) {
      setErrorAccion(mensajeError(err, 'No se pudo cancelar la actividad.'));
    } finally {
      setTrabajando(false);
    }
  };

  const cierraForm = () => {
    setAccion(null);
    setErrorAccion('');
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}>{estado.nombre}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${prioridad.clase}`}>
          Prioridad {prioridad.nombre.toLowerCase()}
        </span>
        {estaAtrasada(a) && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Atrasada</span>
        )}
        {a.recurrencia_id && (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
            <Repeat className="h-3 w-3" /> Repetitiva
          </span>
        )}
      </div>

      <Tabs tabs={tabs} activa={seccion} onChange={setSeccion} />

      {seccion === 'resumen' && (
        <div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Dato etiqueta="Lote" valor={a.lotes?.nombre} />
            <Dato
              etiqueta="Cultivo"
              valor={
                a.cultivos
                  ? `${a.cultivos.nombre_comun}${a.cultivos.variedad ? ` · ${a.cultivos.variedad}` : ''}`
                  : 'Actividad general del lote'
              }
            />
            <Dato etiqueta="Fecha programada" valor={formatearDia(a.fecha_programada)} />
            <Dato
              etiqueta="Fecha de ejecución"
              valor={a.fecha_ejecucion ? formatearDia(a.fecha_ejecucion) : null}
            />
            <Dato
              etiqueta="Cantidad prevista"
              valor={a.cantidad_prevista ? `${fmt(a.cantidad_prevista)} ${unidad}` : null}
            />
            <Dato
              etiqueta="Cantidad realizada"
              valor={a.cantidad_realizada != null ? `${fmt(a.cantidad_realizada)} ${unidad}` : null}
            />
            {recurrencia && (
              <div className="sm:col-span-2">
                <Dato etiqueta="Repetición" valor={textoRecurrencia(recurrencia)} />
              </div>
            )}
          </div>

          <div className="mt-5">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold">Avance</span>
              <span>{a.avance} %</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${a.avance}%` }} />
            </div>
          </div>

          {a.observaciones && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-stone-500">Observaciones</p>
              <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{a.observaciones}</p>
            </div>
          )}
          {a.motivo_cancelacion && (
            <div className="mt-5 rounded-xl bg-stone-100 p-3 text-sm text-stone-700">
              <strong>Motivo de la cancelación:</strong> {a.motivo_cancelacion}
            </div>
          )}

          {!cerrada && !accion && (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-stone-100 pt-5">
              {puedeActualizar && a.estado === 'pendiente' && (
                <button onClick={iniciar} className="btn-ghost border border-stone-300">
                  <Play className="h-4 w-4" /> Iniciar
                </button>
              )}
              {puedeActualizar && (
                <button onClick={() => setAccion('completar')} className="btn-primary">
                  <CheckCircle2 className="h-4 w-4" /> Completar
                </button>
              )}
              {gestor && puedeActualizar && (
                <>
                  <button onClick={() => onEditar(a)} className="btn-ghost border border-stone-300">
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button onClick={() => setAccion('cancelar')} className="btn-ghost border border-red-200 text-red-600">
                    <Ban className="h-4 w-4" /> Cancelar
                  </button>
                </>
              )}
            </div>
          )}

          {accion === 'completar' && (
            <form onSubmit={completar} className="mt-6 space-y-4 rounded-2xl border border-green-200 bg-green-50/50 p-4">
              <p className="text-sm font-bold text-green-900">Completar actividad</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Fecha de ejecución</label>
                  <input
                    type="date"
                    className="input"
                    value={fechaEj}
                    max={hoyISO()}
                    onChange={(e) => setFechaEj(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Cantidad realizada ({unidad})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    value={cantidadReal}
                    onChange={(e) => setCantidadReal(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              {errorAccion && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {errorAccion}
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={trabajando} className="btn-primary">
                  {trabajando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar
                </button>
                <button type="button" onClick={cierraForm} className="btn-ghost">
                  Volver
                </button>
              </div>
            </form>
          )}

          {accion === 'cancelar' && (
            <form onSubmit={cancelar} className="mt-6 space-y-4 rounded-2xl border border-red-200 bg-red-50/50 p-4">
              <p className="text-sm font-bold text-red-800">Cancelar actividad</p>
              <div>
                <label className="label">Motivo de la cancelación</label>
                <textarea
                  className="input min-h-[80px] resize-y"
                  placeholder="Ej. Lluvia, falta de insumos…"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                />
              </div>
              {a.recurrencia_id && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={cancelarSiguientes}
                    onChange={(e) => setCancelarSiguientes(e.target.checked)}
                    className="h-4 w-4 accent-red-600"
                  />
                  También cancelar las repeticiones pendientes posteriores
                </label>
              )}
              {errorAccion && (
                <div className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {errorAccion}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={trabajando}
                  className="btn bg-red-600 text-white shadow-sm hover:bg-red-700"
                >
                  {trabajando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cancelar actividad
                </button>
                <button type="button" onClick={cierraForm} className="btn-ghost">
                  Volver
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {seccion === 'equipo' && (
        <PanelEquipo
          actividad={a}
          mapaTrab={mapaTrab}
          trabajadores={trabajadores}
          gestor={gestor}
          puedeActualizar={puedeActualizar}
          miTrabajadorId={perfil.trabajador_id}
          onCambio={onCambio}
        />
      )}

      {seccion === 'seguimiento' && (
        <PanelSeguimiento actividad={a} puedeActualizar={puedeActualizar} onCambio={onCambio} />
      )}

      {seccion === 'insumos' && (
        <PanelInsumos actividad={a} mapaTrab={mapaTrab} puedeActualizar={puedeActualizar} gestor={gestor} />
      )}

      {seccion === 'evidencias' && (
        <PanelEvidencias
          actividad={a}
          mapaTrab={mapaTrab}
          puedeActualizar={puedeActualizar}
          onCambio={onCambio}
        />
      )}
    </div>
  );
}