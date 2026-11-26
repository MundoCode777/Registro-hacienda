import { useState } from 'react';
import { AlertCircle, Info, Loader2 } from 'lucide-react';
import { guardarLoteInventario } from '../../services/insumosService';
import { mensajeError } from '../../utils/errores';
import { cortoUnidadInsumo } from '../../utils/insumos';
import { aNumero, aTexto, hoyISO } from '../../utils/suelo';

export default function FormLote({ lote, insumoId, insumos, onGuardado, onCerrar }) {
  const consumido = Boolean(lote) && Number(lote.cantidad_actual) < Number(lote.cantidad_inicial);

  const [form, setForm] = useState({
    insumo_id: lote?.insumo_id ?? insumoId ?? '',
    cantidad_inicial: aTexto(lote?.cantidad_inicial),
    fecha_ingreso: lote?.fecha_ingreso ?? hoyISO(),
    fecha_vencimiento: lote?.fecha_vencimiento ?? '',
    costo_unitario: aTexto(lote?.costo_unitario),
    proveedor: lote?.proveedor ?? '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const opciones = insumos.filter((i) => i.estado === 'activo' || i.id === lote?.insumo_id);
  const insumoSel = insumos.find((i) => i.id === form.insumo_id);
  const unidad = cortoUnidadInsumo(insumoSel?.unidad_medida);

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await guardarLoteInventario(
        {
          insumo_id: form.insumo_id,
          cantidad_inicial: aNumero(form.cantidad_inicial),
          fecha_ingreso: form.fecha_ingreso,
          fecha_vencimiento: form.fecha_vencimiento || null,
          costo_unitario: aNumero(form.costo_unitario) ?? 0,
          proveedor: form.proveedor.trim() || null,
        },
        lote?.id
      );
      onGuardado();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar el lote.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-5">
      {consumido && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Este lote ya tuvo consumo, por eso no se puede cambiar el insumo ni la cantidad ingresada.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Insumo</label>
          <select
            className="input"
            value={form.insumo_id}
            onChange={set('insumo_id')}
            disabled={consumido}
            required
          >
            <option value="">Selecciona…</option>
            {opciones.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre_comercial} ({cortoUnidadInsumo(i.unidad_medida)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Cantidad ingresada {unidad && `(${unidad})`}</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            className="input"
            value={form.cantidad_inicial}
            onChange={set('cantidad_inicial')}
            disabled={consumido}
            required
          />
        </div>
        <div>
          <label className="label">Costo por {unidad || 'unidad'} (USD)</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            className="input"
            value={form.costo_unitario}
            onChange={set('costo_unitario')}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="label">Fecha de ingreso</label>
          <input
            type="date"
            max={hoyISO()}
            className="input"
            value={form.fecha_ingreso}
            onChange={set('fecha_ingreso')}
            required
          />
        </div>
        <div>
          <label className="label">Fecha de vencimiento</label>
          <input
            type="date"
            min={form.fecha_ingreso}
            className="input"
            value={form.fecha_vencimiento}
            onChange={set('fecha_vencimiento')}
          />
          <p className="mt-1 text-xs text-stone-500">Déjala vacía si el producto no vence.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Proveedor</label>
          <input className="input" value={form.proveedor} onChange={set('proveedor')} />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={guardando} className="btn-primary">
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {lote ? 'Guardar cambios' : 'Registrar ingreso'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}