import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb, MapPin } from 'lucide-react';
import { diasDesde, etapaActual, sumarDias } from '../../utils/cultivos';
import { claseFuente, cortoUnidadInsumo, nombreFuente } from '../../utils/insumos';
import { fmt, formatearDia, hoyISO } from '../../utils/suelo';

export default function AplicarAhora({ siembras, etapas, recomendaciones, insumos }) {
  const tarjetas = useMemo(() => {
    const hoy = hoyISO();
    const mapaInsumo = {};
    insumos.forEach((i) => {
      mapaInsumo[i.id] = i;
    });
    const etapasPorCultivo = {};
    etapas.forEach((e) => {
      if (!etapasPorCultivo[e.cultivo_id]) etapasPorCultivo[e.cultivo_id] = [];
      etapasPorCultivo[e.cultivo_id].push(e);
    });

    return siembras.map((s) => {
      const dias = diasDesde(s.fecha_siembra);
      const etapa = etapaActual(etapasPorCultivo[s.cultivo_id] || [], dias);
      const nombreEtapa = etapa.etapa?.nombre ?? null;

      const items = recomendaciones
        .filter(
          (r) =>
            r.estado === 'activo' &&
            r.cultivo_id === s.cultivo_id &&
            (r.etapa === null || r.etapa === nombreEtapa)
        )
        .map((r) => {
          const insumo = mapaInsumo[r.insumo_id];
          const necesaria = Number(r.dosis_ha) * Number(s.area_ha);
          const stock = Number(insumo?.stock_disponible || 0);
          const carencia = Number(insumo?.tiempo_carencia_dias || 0);
          return {
            rec: r,
            insumo,
            necesaria,
            stock,
            falta: Math.max(necesaria - stock, 0),
            carencia,
            choqueCarencia: carencia > 0 && sumarDias(hoy, carencia) > s.fecha_estimada_cosecha,
          };
        });

      return { siembra: s, dias, etapa, items };
    });
  }, [siembras, etapas, recomendaciones, insumos]);

  if (tarjetas.length === 0) {
    return (
      <div className="card flex flex-col items-center p-12 text-center">
        <Lightbulb className="h-10 w-10 text-stone-300" />
        <p className="mt-3 font-semibold">No hay siembras en curso</p>
        <p className="text-sm text-stone-500">Cuando registres siembras en el módulo Cultivos, aquí verás qué aplicar en cada una.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-500">
        El sistema cruza la etapa actual de cada siembra con las recomendaciones, el stock de bodega y el tiempo de
        carencia. Las cantidades son para toda el área sembrada.
      </p>

      {tarjetas.map(({ siembra: s, dias, etapa, items }) => (
        <div key={s.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">
                {s.cultivos?.nombre_comun}
                {s.cultivos?.variedad && <span className="text-sm font-medium text-green-700"> · {s.cultivos.variedad}</span>}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-stone-600">
                <MapPin className="h-3.5 w-3.5" /> {s.lotes?.nombre ?? 'Lote'} · {fmt(s.area_ha)} ha
              </p>
            </div>
            <div className="text-right text-sm">
              <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-800">{etapa.texto}</span>
              <p className="mt-1 text-xs text-stone-500">
                {dias < 0 ? 'Siembra programada' : `Día ${dias}`} · cosecha estimada {formatearDia(s.fecha_estimada_cosecha)}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="mt-4 rounded-xl bg-stone-100 p-3 text-sm text-stone-600">
              No hay recomendaciones registradas para esta etapa. Agrégalas en la vista "Todas las recomendaciones".
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map(({ rec, insumo, necesaria, stock, falta, carencia, choqueCarencia }) => {
                const unidad = cortoUnidadInsumo(insumo?.unidad_medida);
                const inactivo = insumo && insumo.estado !== 'activo';
                return (
                  <div key={rec.id} className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">{insumo?.nombre_comercial ?? 'Insumo'}</p>
                        <p className="text-sm text-stone-600">
                          {fmt(rec.dosis_ha, 3)} {unidad}/ha · total{' '}
                          <strong>
                            {fmt(necesaria, 3)} {unidad}
                          </strong>
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${claseFuente(rec.fuente)}`}>
                        {nombreFuente(rec.fuente)}
                      </span>
                    </div>

                    {rec.momento_aplicacion && (
                      <p className="mt-2 text-sm text-stone-700">
                        <strong>Cuándo:</strong> {rec.momento_aplicacion}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-stone-600">{rec.justificacion}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {inactivo ? (
                        <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600">
                          Insumo inactivo
                        </span>
                      ) : falta > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          Stock insuficiente: hay {fmt(stock, 3)} {unidad} y faltan {fmt(falta, 3)} {unidad}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Stock suficiente ({fmt(stock, 3)} {unidad})
                        </span>
                      )}

                      {choqueCarencia && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          Carencia de {carencia} días: la cosecha estimada es antes de que termine
                        </span>
                      )}
                      {!choqueCarencia && carencia > 0 && (
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                          Carencia: {carencia} días
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}