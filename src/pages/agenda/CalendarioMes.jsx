import { useMemo } from 'react';
import { DIAS_SEMANA, ESTADOS_ACTIVIDAD, celdasMes } from '../../utils/agenda';
import { hoyISO } from '../../utils/suelo';

export default function CalendarioMes({ anio, mes, actividadesPorDia, diaSel, onSelDia }) {
  const celdas = useMemo(() => celdasMes(anio, mes), [anio, mes]);
  const hoy = hoyISO();

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {celdas.map((iso, i) => {
          if (!iso) {
            return (
              <div
                key={`vacio-${i}`}
                className="min-h-[3.5rem] border-b border-r border-stone-100 bg-stone-50/50 sm:min-h-[6.5rem]"
              />
            );
          }

          const items = actividadesPorDia[iso] || [];
          const esHoy = iso === hoy;
          const seleccionado = iso === diaSel;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelDia(iso)}
              className={`flex min-h-[3.5rem] flex-col items-stretch gap-1 border-b border-r border-stone-100 p-1.5 text-left transition hover:bg-green-50/60 sm:min-h-[6.5rem] ${
                seleccionado ? 'bg-green-50 ring-2 ring-inset ring-green-600' : ''
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  esHoy ? 'bg-green-700 text-white' : 'text-stone-700'
                }`}
              >
                {Number(iso.slice(8))}
              </span>

              <span className="hidden flex-col gap-1 sm:flex">
                {items.slice(0, 2).map((a) => (
                  <span
                    key={a.id}
                    className={`truncate rounded border px-1.5 py-0.5 text-[11px] font-medium ${ESTADOS_ACTIVIDAD[a.estado].chip}`}
                  >
                    {a.tipos_actividad?.nombre ?? 'Actividad'}
                  </span>
                ))}
                {items.length > 2 && (
                  <span className="text-[11px] font-semibold text-stone-500">+{items.length - 2} más</span>
                )}
              </span>

              {items.length > 0 && (
                <span className="flex flex-wrap gap-0.5 sm:hidden">
                  {items.slice(0, 4).map((a) => (
                    <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${ESTADOS_ACTIVIDAD[a.estado].punto}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}