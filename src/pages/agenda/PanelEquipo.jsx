import { useState } from 'react';
import { Loader2, Star, Trash2, UserPlus, Users } from 'lucide-react';
import {
  agregarAsignacion,
  cambiarResponsable,
  guardarAsignacion,
  quitarAsignacion,
} from '../../services/agendaService';
import { mensajeError } from '../../utils/errores';
import { confirmar, mostrarError, notificar } from '../../utils/alertas';
import { nombreEspecialidad } from '../../utils/personal';
import { aNumero } from '../../utils/suelo';
import { estaCerrada, nombreTrab } from '../../utils/agenda';

function Estrellas({ valor, editable, onCambiar }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!editable}
          onClick={() => onCambiar(valor === n ? null : n)}
          className={editable ? 'cursor-pointer' : 'cursor-default'}
          title={`${n} de 5`}
        >
          <Star className={`h-5 w-5 ${n <= (valor || 0) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function PanelEquipo({
  actividad,
  mapaTrab,
  trabajadores,
  gestor,
  puedeActualizar,
  miTrabajadorId,
  onCambio,
}) {
  const asignaciones = actividad.asignaciones_tarea || [];
  const cerrada = estaCerrada(actividad);
  const cancelada = actividad.estado === 'cancelada';
  const puedeGestionar = gestor && puedeActualizar && !cerrada;

  const asignados = new Set(asignaciones.map((s) => s.trabajador_id));
  const disponibles = trabajadores.filter((t) => t.estado === 'activo' && !asignados.has(t.id));
  const hayResponsable = asignaciones.some((s) => s.es_responsable);
  const ordenadas = [...asignaciones].sort((a, b) => Number(b.es_responsable) - Number(a.es_responsable));

  const [nuevoId, setNuevoId] = useState('');
  const [horas, setHoras] = useState('');
  const [agregando, setAgregando] = useState(false);

  const ejecutar = async (accion, mensaje) => {
    try {
      await accion();
      await onCambio();
      if (mensaje) notificar(mensaje);
    } catch (err) {
      mostrarError('No se pudo completar la acción', mensajeError(err));
    }
  };

  const agregar = async (e) => {
    e.preventDefault();
    if (!nuevoId) return;
    setAgregando(true);
    await ejecutar(
      () =>
        agregarAsignacion({
          actividad_id: actividad.id,
          trabajador_id: nuevoId,
          horas_estimadas: aNumero(horas),
          es_responsable: !hayResponsable,
        }),
      'Trabajador asignado'
    );
    setNuevoId('');
    setHoras('');
    setAgregando(false);
  };

  const quitar = async (s, t) => {
    const acepta = await confirmar({
      titulo: `¿Quitar a ${nombreTrab(t)}?`,
      texto: 'Se retirará de esta actividad.',
      confirmar: 'Sí, quitar',
      peligro: true,
    });
    if (acepta) ejecutar(() => quitarAsignacion(s.id), 'Trabajador retirado');
  };

  const guardarHoras = (s, valor) => {
    const nuevo = valor === '' ? null : Number(valor);
    const actual = s.horas_reales === null ? null : Number(s.horas_reales);
    if (nuevo === actual) return;
    ejecutar(() => guardarAsignacion({ horas_reales: nuevo }, s.id), 'Horas registradas');
  };

  return (
    <div>
      {ordenadas.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 p-8 text-center">
          <Users className="h-9 w-9 text-stone-300" />
          <p className="mt-2 font-semibold">Aún no hay personal asignado</p>
          <p className="text-sm text-stone-500">
            {puedeGestionar ? 'Agrega al primer trabajador abajo.' : 'El capataz asignará al equipo.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordenadas.map((s) => {
            const t = mapaTrab[s.trabajador_id];
            const esMia = s.trabajador_id === miTrabajadorId;
            const editaHoras = puedeActualizar && !cancelada && (gestor || esMia);
            const editaNota = gestor && puedeActualizar && actividad.estado === 'completada';

            return (
              <div key={s.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{nombreTrab(t)}</p>
                    <p className="text-xs text-stone-500">{t ? nombreEspecialidad(t.especialidad) : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.es_responsable ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                        Responsable
                      </span>
                    ) : (
                      puedeGestionar && (
                        <button
                          type="button"
                          className="btn-ghost !px-2 !py-1 text-xs"
                          onClick={() =>
                            ejecutar(() => cambiarResponsable(actividad.id, s.id), 'Responsable actualizado')
                          }
                        >
                          Hacer responsable
                        </button>
                      )
                    )}
                    {puedeGestionar && (
                      <button
                        type="button"
                        title="Quitar de la actividad"
                        onClick={() => quitar(s, t)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-stone-500">Horas estimadas</p>
                    <p className="mt-1 font-semibold">{s.horas_estimadas ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-stone-500">Horas reales</p>
                    {editaHoras ? (
                      <input
                        key={`${s.id}-${s.horas_reales}`}
                        type="number"
                        step="0.5"
                        min="0"
                        className="input mt-1 !w-28 !py-1.5"
                        defaultValue={s.horas_reales ?? ''}
                        onBlur={(e) => guardarHoras(s, e.target.value)}
                        placeholder="0"
                      />
                    ) : (
                      <p className="mt-1 font-semibold">{s.horas_reales ?? '—'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-stone-500">Desempeño</p>
                    <div className="mt-1">
                      <Estrellas
                        valor={s.calificacion}
                        editable={editaNota}
                        onCambiar={(n) => ejecutar(() => guardarAsignacion({ calificacion: n }, s.id), 'Calificación guardada')}
                      />
                      {!editaNota && !s.calificacion && actividad.estado !== 'completada' && (
                        <p className="text-[11px] text-stone-400">Se califica al completar</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {puedeGestionar && (
        <form onSubmit={agregar} className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl bg-stone-50 p-4">
          <div className="min-w-[12rem] flex-1">
            <label className="label">Agregar trabajador</label>
            <select className="input" value={nuevoId} onChange={(e) => setNuevoId(e.target.value)} required>
              <option value="">Selecciona…</option>
              {disponibles.map((t) => (
                <option key={t.id} value={t.id}>
                  {nombreTrab(t)} · {nombreEspecialidad(t.especialidad)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="label">Horas est.</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              className="input"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />
          </div>
          <button type="submit" disabled={agregando || !nuevoId} className="btn-primary">
            {agregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Asignar
          </button>
        </form>
      )}
    </div>
  );
}