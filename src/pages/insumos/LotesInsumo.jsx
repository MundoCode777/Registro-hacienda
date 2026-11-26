import { Ban, Pencil, PackagePlus } from 'lucide-react';
import { cortoUnidadInsumo, dinero, estadoVencimiento } from '../../utils/insumos';
import { fmt, formatearDia } from '../../utils/suelo';

export default function LotesInsumo({ insumo, lotes, puedeCrear, puedeEditar, onIngreso, onEditar, onBaja }) {
  const unidad = cortoUnidadInsumo(insumo.unidad_medida);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          Stock disponible:{' '}
          <strong className="text-stone-900">
            {fmt(insumo.stock_disponible, 3)} {unidad}
          </strong>
        </p>
        {puedeCrear && insumo.estado === 'activo' && (
          <button onClick={onIngreso} className="btn-primary">
            <PackagePlus className="h-4 w-4" /> Registrar ingreso
          </button>
        )}
      </div>

      {lotes.length === 0 ? (
        <p className="rounded-xl bg-stone-100 p-6 text-center text-sm text-stone-500">
          Este insumo aún no tiene ingresos registrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Ingreso</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Inicial</th>
                <th className="px-4 py-3">Disponible</th>
                <th className="px-4 py-3">Costo</th>
                <th className="px-4 py-3">Proveedor</th>
                {puedeEditar && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {lotes.map((l) => {
                const venc = estadoVencimiento(l.fecha_vencimiento);
                const baja = l.estado === 'baja';
                const sinConsumo = Number(l.cantidad_actual) === Number(l.cantidad_inicial);
                return (
                  <tr key={l.id} className={baja ? 'bg-stone-50 text-stone-400' : 'hover:bg-stone-50/60'}>
                    <td className="px-4 py-3">{formatearDia(l.fecha_ingreso)}</td>
                    <td className="px-4 py-3">
                      {baja ? (
                        <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
                          De baja
                        </span>
                      ) : (
                        <>
                          <p>{l.fecha_vencimiento ? formatearDia(l.fecha_vencimiento) : '—'}</p>
                          {l.fecha_vencimiento && (
                            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${venc.clase}`}>
                              {venc.texto}
                            </span>
                          )}
                        </>
                      )}
                      {baja && l.motivo_baja && <p className="mt-1 text-xs">{l.motivo_baja}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {fmt(l.cantidad_inicial, 3)} {unidad}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {fmt(l.cantidad_actual, 3)} {unidad}
                    </td>
                    <td className="px-4 py-3">{dinero(l.costo_unitario)}</td>
                    <td className="px-4 py-3">{l.proveedor || '—'}</td>
                    {puedeEditar && (
                      <td className="px-4 py-3">
                        {!baja && (
                          <div className="flex justify-end gap-1">
                            {sinConsumo && (
                              <button
                                onClick={() => onEditar(l)}
                                title="Editar"
                                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => onBaja(l)}
                              title="Dar de baja"
                              className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-stone-500">
        Al aplicar, el sistema descuenta primero del lote que vence antes y no usa lotes vencidos.
      </p>
    </div>
  );
}