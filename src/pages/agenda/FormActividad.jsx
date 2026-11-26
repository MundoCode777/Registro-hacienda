import { useMemo, useState } from 'react';
import { AlertCircle, Loader2, Repeat } from 'lucide-react';
import { actualizarActividad, programarActividad } from '../../services/agendaService';
import { mensajeError } from '../../utils/errores';
import { nombreEspecialidad } from '../../utils/personal';
import { aNumero, aTexto, formatearDia, hoyISO } from '../../utils/suelo';
import {
  FRECUENCIAS,
  MAX_REPETICIONES,
  PRIORIDADES,
  calcularFechas,
  cortoUnidad,
  nombreTrab,
} from '../../utils/agenda';

export default function FormActividad({
  actividad,
  fechaInicial,
  tipos,
  lotes,
  siembras,
  trabajadores,
  onGuardado,
  onCerrar,
}) {
  const editando = Boolean(actividad);

  const [form, setForm] = useState({
    tipo_actividad_id: actividad?.tipo_actividad_id ?? '',
    lote_id: actividad?.lote_id ?? '',
    siembra_id: actividad?.siembra_id ?? '',
    fecha_programada: actividad?.fecha_programada ?? fechaInicial ?? hoyISO(),
    prioridad: actividad?.prioridad ?? 'media',
    cantidad_prevista: aTexto(actividad?.cantidad_prevista),
    observaciones: actividad?.observaciones ?? '',
  });
  const [seleccion, setSeleccion] = useState({}); // trabajador_id -> { horas }
  const [responsableId, setResponsableId] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [repetir, setRepetir] = useState(false);
  const [rep, setRep] = useState({ frecuencia: 'semanal', intervalo: '3', fin: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const tiposOpc = tipos.filter((t) => t.estado === 'activo' || t.id === actividad?.tipo_actividad_id);
  const lotesOpc = lotes.filter((l) => l.estado === 'activo' || l.id === actividad?.lote_id);
  const siembrasLote = siembras.filter((s) => s.lote_id === form.lote_id);
  const tipoSel = tipos.find((t) => t.id === form.tipo_actividad_id);

  const activos = trabajadores.filter((t) => t.estado === 'activo');
  const visiblesT = activos.filter((t) =>
    nombreTrab(t).toLowerCase().includes(busqueda.trim().toLowerCase())
  );
  const idsSel = Object.keys(seleccion);
  const responsableEfectivo = seleccion[responsableId] ? responsableId : idsSel[0] ?? '';

  const fechas = useMemo(
    () =>
      repetir ? calcularFechas(form.fecha_programada, rep.frecuencia, rep.intervalo, rep.fin) : [],
    [repetir, form.fecha_programada, rep]
  );

  const alternar = (id) => {
    setSeleccion((previa) => {
      const copia = { ...previa };
      if (copia[id]) delete copia[id];
      else copia[id] = { horas: '' };
      return copia;
    });
    if (responsableId === id) setResponsableId('');
  };

  const cambiarHoras = (id, horas) => setSeleccion((previa) => ({ ...previa, [id]: { horas } }));

  const guardar = async (e) => {
    e.preventDefault();
    setError('');

    const base = {
      tipo_actividad_id: form.tipo_actividad_id,
      lote_id: form.lote_id,
      siembra_id: form.siembra_id || null,
      fecha_programada: form.fecha_programada,
      prioridad: form.prioridad,
      cantidad_prevista: aNumero(form.cantidad_prevista),
      observaciones: form.observaciones.trim() || null,
    };

    if (!editando && repetir) {
      if (fechas.length === 0) {
        setError('Revisa la fecha final y la frecuencia de la repetición.');
        return;
      }
      if (fechas.length > MAX_REPETICIONES) {
        setError(`La repetición genera ${fechas.length} actividades. El máximo es ${MAX_REPETICIONES}.`);
        return;
      }
    }

    setGuardando(true);
    try {
      if (editando) {
        await actualizarActividad(base, actividad.id);
        onGuardado('Actividad actualizada', form.fecha_programada);
      } else {
        const trabajadoresPayload = idsSel.map((id) => ({
          trabajador_id: id,
          horas_estimadas: aNumero(seleccion[id].horas),
          es_responsable: id === responsableEfectivo,
        }));
        const recurrencia = repetir
          ? {
              frecuencia: rep.frecuencia,
              intervalo_dias: rep.frecuencia === 'cada_x_dias' ? Number(rep.intervalo) : null,
              fecha_fin: rep.fin,
            }
          : null;

        const total = await programarActividad({ ...base, trabajadores: trabajadoresPayload, recurrencia });
        onGuardado(
          total > 1 ? `Se programaron ${total} actividades` : 'Actividad programada',
          form.fecha_programada
        );
      }
    } catch (err) {
      setError(
        err.code === '23505'
          ? 'Solo puede haber un responsable por actividad.'
          : mensajeError(err, 'No se pudo guardar la actividad.')
      );
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Tipo de actividad</label>
          <select className="input" value={form.tipo_actividad_id} onChange={set('tipo_actividad_id')} required>
            <option value="">Selecciona…</option>
            {tiposOpc.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Lote</label>
          <select
            className="input"
            value={form.lote_id}
            onChange={(e) => setForm({ ...form, lote_id: e.target.value, siembra_id: '' })}
            required
          >
            <option value="">Selecciona…</option>
            {lotesOpc.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Siembra (opcional)</label>
          <select
            className="input"
            value={form.siembra_id}
            onChange={set('siembra_id')}
            disabled={!form.lote_id}
          >
            <option value="">Actividad general del lote (sin siembra)</option>
            {siembrasLote.map((s) => (
              <option key={s.id} value={s.id}>
                {s.cultivos?.nombre_comun}
                {s.cultivos?.variedad ? ` · ${s.cultivos.variedad}` : ''} — sembrado el {formatearDia(s.fecha_siembra)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-stone-500">
            Si eliges una siembra, la actividad queda asociada a su cultivo.
          </p>
        </div>

        <div>
          <label className="label">Fecha programada</label>
          <input
            type="date"
            className="input"
            value={form.fecha_programada}
            onChange={set('fecha_programada')}
            required
          />
        </div>

        <div>
          <label className="label">Prioridad</label>
          <select className="input" value={form.prioridad} onChange={set('prioridad')}>
            {Object.entries(PRIORIDADES).map(([valor, p]) => (
              <option key={valor} value={valor}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">
            Cantidad prevista {tipoSel ? `(${cortoUnidad(tipoSel.unidad_medida)})` : ''}
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="input"
            value={form.cantidad_prevista}
            onChange={set('cantidad_prevista')}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div>
        <label className="label">Observaciones</label>
        <textarea
          className="input min-h-[80px] resize-y"
          value={form.observaciones}
          onChange={set('observaciones')}
        />
      </div>

      {/* Equipo (solo al programar) */}
      {!editando && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Personal asignado</p>
            {activos.length > 8 && (
              <input
                className="input !w-48 !py-1.5 text-xs"
                placeholder="Buscar trabajador"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            )}
          </div>

          {activos.length === 0 ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              No hay trabajadores activos. Regístralos en el módulo Personal para poder asignarlos.
            </p>
          ) : (
            <div className="max-h-56 divide-y divide-stone-100 overflow-y-auto rounded-xl border border-stone-200">
              {visiblesT.map((t) => {
                const marcado = Boolean(seleccion[t.id]);
                return (
                  <div key={t.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      id={`trab-${t.id}`}
                      checked={marcado}
                      onChange={() => alternar(t.id)}
                      className="h-4 w-4 accent-green-700"
                    />
                    <label htmlFor={`trab-${t.id}`} className="flex-1 cursor-pointer text-sm font-medium">
                      {nombreTrab(t)}{' '}
                      <span className="text-xs font-normal text-stone-500">· {nombreEspecialidad(t.especialidad)}</span>
                    </label>
                    {marcado && (
                      <>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          placeholder="Horas"
                          className="input !w-20 !py-1 text-xs"
                          value={seleccion[t.id].horas}
                          onChange={(e) => cambiarHoras(t.id, e.target.value)}
                        />
                        <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-stone-600">
                          <input
                            type="radio"
                            name="responsable"
                            checked={responsableEfectivo === t.id}
                            onChange={() => setResponsableId(t.id)}
                            className="accent-green-700"
                          />
                          Responsable
                        </label>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-1 text-xs text-stone-500">
            Marca a quienes harán la actividad y elige un responsable. Las horas son estimadas.
          </p>
        </div>
      )}

      {/* Repetición (solo al programar) */}
      {!editando && (
        <div className="rounded-2xl border border-stone-200 p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={repetir}
              onChange={(e) => setRepetir(e.target.checked)}
              className="h-4 w-4 accent-green-700"
            />
            <Repeat className="h-4 w-4 text-green-700" /> Repetir esta actividad
          </label>

          {repetir && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className={rep.frecuencia === 'cada_x_dias' ? '' : 'sm:col-span-2'}>
                  <label className="label">Frecuencia</label>
                  <select
                    className="input"
                    value={rep.frecuencia}
                    onChange={(e) => setRep({ ...rep, frecuencia: e.target.value })}
                  >
                    {FRECUENCIAS.map((f) => (
                      <option key={f.valor} value={f.valor}>
                        {f.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {rep.frecuencia === 'cada_x_dias' && (
                  <div>
                    <label className="label">Cada (días)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="input"
                      value={rep.intervalo}
                      onChange={(e) => setRep({ ...rep, intervalo: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="label">Repetir hasta</label>
                  <input
                    type="date"
                    className="input"
                    min={form.fecha_programada}
                    value={rep.fin}
                    onChange={(e) => setRep({ ...rep, fin: e.target.value })}
                    required
                  />
                </div>
              </div>

              {rep.fin && fechas.length > 0 && (
                <p
                  className={`rounded-xl p-3 text-sm ${
                    fechas.length > MAX_REPETICIONES ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'
                  }`}
                >
                  Se programarán <strong>{fechas.length}</strong> actividades, del{' '}
                  {formatearDia(fechas[0])} al {formatearDia(fechas[fechas.length - 1])}.
                  {fechas.length > MAX_REPETICIONES && ` El máximo permitido es ${MAX_REPETICIONES}.`}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={guardando} className="btn-primary">
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {editando ? 'Guardar cambios' : 'Programar actividad'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}