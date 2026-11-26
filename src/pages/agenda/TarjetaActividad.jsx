import { MapPin, Repeat, User } from 'lucide-react';
import {
  ESTADOS_ACTIVIDAD,
  PRIORIDADES,
  cortoUnidad,
  estaAtrasada,
  nombreTrab,
  responsableDe,
} from '../../utils/agenda';
import { fmt, formatearDia } from '../../utils/suelo';

export default function TarjetaActividad({ actividad: a, mapaTrab, onAbrir }) {
  const estado = ESTADOS_ACTIVIDAD[a.estado];
  const prioridad = PRIORIDADES[a.prioridad];
  const responsable = responsableDe(a, mapaTrab);
  const total = (a.asignaciones_tarea || []).length;
  const atrasada = estaAtrasada(a);
  const mostrarAvance = a.estado !== 'cancelada' && (a.avance > 0 || a.estado === 'en_proceso');

  return (
    <button
      type="button"
      onClick={() => onAbrir(a.id)}
      className="card block w-full p-4 text-left transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="block">
          <span className="block font-bold">{a.tipos_actividad?.nombre ?? 'Actividad'}</span>
          <span className="mt-0.5 flex items-center gap-1 text-sm text-stone-600">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {a.lotes?.nombre ?? 'Lote'}
            {a.cultivos?.nombre_comun ? ` · ${a.cultivos.nombre_comun}` : ''}
          </span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${estado.clase}`}>
          {estado.nombre}
        </span>
      </span>

      <span className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-stone-500">{formatearDia(a.fecha_programada)}</span>
        <span className={`rounded-full px-2 py-0.5 font-semibold ${prioridad.clase}`}>{prioridad.nombre}</span>
        {atrasada && <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">Atrasada</span>}
        {a.recurrencia_id && <Repeat className="h-3.5 w-3.5 text-stone-400" />}
        {a.cantidad_prevista && (
          <span className="text-stone-500">
            {fmt(a.cantidad_prevista)} {cortoUnidad(a.tipos_actividad?.unidad_medida)}
          </span>
        )}
      </span>

      {mostrarAvance && (
        <span className="mt-3 block">
          <span className="block h-2 overflow-hidden rounded-full bg-stone-100">
            <span className="block h-full rounded-full bg-green-600" style={{ width: `${a.avance}%` }} />
          </span>
          <span className="mt-1 block text-right text-[11px] text-stone-500">{a.avance} %</span>
        </span>
      )}

      <span className="mt-3 flex items-center gap-1.5 text-sm text-stone-600">
        <User className="h-4 w-4 shrink-0 text-stone-400" />
        {responsable ? nombreTrab(responsable) : total > 0 ? 'Equipo asignado' : 'Sin responsable'}
        {total > 1 && <span className="text-xs text-stone-400">+{total - 1}</span>}
      </span>
    </button>
  );
}