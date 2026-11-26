import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { registrarAplicacion } from '../../services/insumosService';
import { mensajeError } from '../../utils/errores';
import { nombreEspecialidad } from '../../utils/personal';
import { cortoUnidadInsumo } from '../../utils/insumos';
import { nombreTrab } from '../../utils/agenda';
import { aNumero, aTexto, fmt, hoyISO } from '../../utils/suelo';

export default function FormAplicacion({ actividad, insumos, trabajadores, responsableInicial, onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    insumo_id: '',
    fecha_aplicacion: hoyISO(),
    area_tratada_ha: '',
    dosis_aplicada_ha: '',
    equipo_usado: '',
    trabajador_id: responsableInicial ?? '',
    observaciones: '',
  });
  const [totalManual, setTotalManual] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const insumo = insumos.find((i) => i.id === form.insumo_id);
  const unidad = cortoUnidadInsumo(insumo?.unidad_medida);
  const stock = Number(insumo?.stock_disponible || 0);

  const calculado =
    form.area_tratada_ha && form.dosis_aplicada_ha
      ? String(Math.round(Number(form.area_tratada_ha) * Number(form.dosis_aplicada_ha) * 1000) / 1000)
      : '';
  const total = totalManual !== null ? totalManual : calculado;
  const excede = insumo && Number(total) > stock;

  const alElegirInsumo = (e) => {
    const id = e.target.value;
    const elegido = insumos.find((i) => i.id === id);
    setForm({ ...form, insumo_id: id, dosis_aplicada_ha: elegido ? aTexto(elegido.dosis_recomendada_ha) : '' });
    setTotalManual(null);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    if (excede) {
      setError(`El stock disponible es de ${fmt(stock, 3)} ${unidad}. Registra un ingreso o reduce la cantidad.`);
      return;
    }
    setGuardando(true);
    try {
      await registrarAplicacion({
        actividad_id: actividad.id,
        insumo_id: form.insumo_id,
        fecha_aplicacion: form.fecha_aplicacion,
        area_tratada_ha: aNumero(form.area_tratada_ha),
        dosis_aplicada_ha: aNumero(form.dosis_aplicada_ha),
        cantidad_total: aNumero(total),
        equipo_usado: form.equipo_usado.trim() || null,
        trabajador_id: form.trabajador_id || null,
        observaciones: form.observaciones.trim() || null,
      });
      onGuardado();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo registrar la aplicación.'));
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-4 rounded-2xl border border-green-200 bg-green-50/40 p-4">
      <p className="text-sm font-bold text-green-900">Registrar aplicación de insumo</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Insumo</label>
          <select className="input" value={form.insumo_id} onChange={alElegirInsumo} required>
            <option value="">Selecciona…</option>
            {insumos
              .filter((i) => i.estado === 'activo')
              .map((i) => (
                <option key={i.id} value={i.id} disabled={Number(i.stock_disponible) <= 0}>
                  {i.nombre_comercial} · {fmt(i.stock_disponible, 3)} {cortoUnidadInsumo(i.unidad_medida)} disponibles
                </option>
              ))}
          </select>
          {insumo && Number(insumo.tiempo_carencia_dias) > 0 && (
            <p className="mt-1 text-xs text-amber-700">
              Carencia: {insumo.tiempo_carencia_dias} días mínimos entre esta aplicación y la cosecha.
            </p>
          )}
        </div>

        <div>
          <label className="label">Fecha de aplicación</label>
          <input
            type="date"
            max={hoyISO()}
            className="input"
            value={form.fecha_aplicacion}
            onChange={set('fecha_aplicacion')}
            required
          />
        </div>
        <div>
          <label className="label">Área tratada (ha)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="input"
            value={form.area_tratada_ha}
            onChange={(e) => {
              setForm({ ...form, area_tratada_ha: e.target.value });
              setTotalManual(null);
            }}
            required
          />
        </div>

        <div>
          <label className="label">Dosis aplicada {unidad && `(${unidad}/ha)`}</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            className="input"
            value={form.dosis_aplicada_ha}
            onChange={(e) => {
              setForm({ ...form, dosis_aplicada_ha: e.target.value });
              setTotalManual(null);
            }}
            required
          />
        </div>
        <div>
          <label className="label">Cantidad total utilizada {unidad && `(${unidad})`}</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            className="input"
            value={total}
            onChange={(e) => setTotalManual(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-stone-500">
            {totalManual !== null ? (
              <button type="button" onClick={() => setTotalManual(null)} className="font-semibold text-green-700 hover:underline">
                Volver al cálculo automático
              </button>
            ) : (
              'Se calcula con dosis por área. Puedes ajustarla si usaste otra cantidad.'
            )}
          </p>
          {excede && (
            <p className="mt-1 text-xs font-semibold text-red-600">
              Supera el stock disponible ({fmt(stock, 3)} {unidad}).
            </p>
          )}
        </div>

        <div>
          <label className="label">Equipo usado</label>
          <input
            className="input"
            placeholder="Ej. Bomba de mochila, tractor…"
            value={form.equipo_usado}
            onChange={set('equipo_usado')}
          />
        </div>
        <div>
          <label className="label">Responsable</label>
          <select className="input" value={form.trabajador_id} onChange={set('trabajador_id')}>
            <option value="">Sin indicar</option>
            {trabajadores.map((t) => (
              <option key={t.id} value={t.id}>
                {nombreTrab(t)} · {nombreEspecialidad(t.especialidad)}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Observaciones</label>
          <textarea
            className="input min-h-[70px] resize-y"
            value={form.observaciones}
            onChange={set('observaciones')}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={guardando} className="btn-primary">
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar aplicación
        </button>
        <button type="button" onClick={onCancelar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}