import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { guardarRecomendacion } from '../../services/insumosService';
import { mensajeError } from '../../utils/errores';
import { ETAPAS } from '../../utils/cultivos';
import { cortoUnidadInsumo } from '../../utils/insumos';
import { aNumero, aTexto } from '../../utils/suelo';

export default function FormRecomendacion({ recomendacion, inicial, cultivos, insumos, onGuardado, onCerrar }) {
  const base = recomendacion ?? inicial ?? {};

  const [form, setForm] = useState({
    cultivo_id: base.cultivo_id ?? '',
    etapa: base.etapa ?? '',
    insumo_id: base.insumo_id ?? '',
    dosis_ha: aTexto(base.dosis_ha),
    momento_aplicacion: base.momento_aplicacion ?? '',
    justificacion: base.justificacion ?? '',
    fuente: base.fuente ?? 'tecnico',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const cultivosOpc = cultivos.filter((c) => c.estado === 'activo' || c.id === recomendacion?.cultivo_id);
  const insumosOpc = insumos.filter((i) => i.estado === 'activo' || i.id === recomendacion?.insumo_id);
  const insumoSel = insumos.find((i) => i.id === form.insumo_id);
  const unidad = cortoUnidadInsumo(insumoSel?.unidad_medida);

  const alElegirInsumo = (e) => {
    const id = e.target.value;
    const insumo = insumos.find((i) => i.id === id);
    setForm({
      ...form,
      insumo_id: id,
      dosis_ha: form.dosis_ha === '' && insumo ? aTexto(insumo.dosis_recomendada_ha) : form.dosis_ha,
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await guardarRecomendacion(
        {
          cultivo_id: form.cultivo_id,
          etapa: form.etapa || null,
          insumo_id: form.insumo_id,
          dosis_ha: aNumero(form.dosis_ha),
          momento_aplicacion: form.momento_aplicacion.trim() || null,
          justificacion: form.justificacion.trim(),
          fuente: form.fuente,
        },
        recomendacion?.id
      );
      onGuardado();
    } catch (err) {
      setError(
        err.code === '23505'
          ? 'Ya existe una recomendación para ese cultivo, etapa e insumo (puede estar inactiva).'
          : mensajeError(err, 'No se pudo guardar la recomendación.')
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Cultivo</label>
          <select className="input" value={form.cultivo_id} onChange={set('cultivo_id')} required>
            <option value="">Selecciona…</option>
            {cultivosOpc.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_comun}
                {c.variedad ? ` · ${c.variedad}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Etapa fenológica</label>
          <select className="input" value={form.etapa} onChange={set('etapa')}>
            <option value="">Cualquier etapa</option>
            {ETAPAS.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Insumo sugerido</label>
          <select className="input" value={form.insumo_id} onChange={alElegirInsumo} required>
            <option value="">Selecciona…</option>
            {insumosOpc.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre_comercial}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Dosis {unidad && `(${unidad}/ha)`}</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            className="input"
            value={form.dosis_ha}
            onChange={set('dosis_ha')}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Momento de aplicación</label>
          <input
            className="input"
            placeholder="Ej. Al inicio de la etapa, cada 15 días, antes de la lluvia…"
            value={form.momento_aplicacion}
            onChange={set('momento_aplicacion')}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Justificación agronómica</label>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="Por qué se recomienda este insumo en esta etapa"
            value={form.justificacion}
            onChange={set('justificacion')}
            required
          />
        </div>

        <div>
          <label className="label">Fuente</label>
          <select className="input" value={form.fuente} onChange={set('fuente')}>
            <option value="tecnico">Técnico</option>
            <option value="historial">Historial</option>
          </select>
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
          {recomendacion ? 'Guardar cambios' : 'Crear recomendación'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}