import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarRange, Info, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import {
  eliminarEtapa,
  guardarEtapa,
  listarCultivos,
  listarEtapas,
} from '../../services/cultivosService';
import { mensajeError } from '../../utils/errores';
import {
  ETAPAS,
  colorEtapa,
  diasSinEtapa,
  nombreEtapa,
  ordenarEtapas,
} from '../../utils/cultivos';
import { aNumero, aTexto } from '../../utils/suelo';

/* ----------------------------- Formulario ----------------------------- */
function FormEtapa({ cultivo, etapa, etapas, onGuardado, onCerrar }) {
  const usadas = etapas.filter((e) => e.id !== etapa?.id).map((e) => e.nombre);
  const disponibles = ETAPAS.filter((e) => !usadas.includes(e.valor));
  const siguienteInicio = etapas.length ? Math.max(...etapas.map((e) => e.dia_fin)) + 1 : 0;

  const [form, setForm] = useState(
    etapa
      ? {
          nombre: etapa.nombre,
          dia_inicio: aTexto(etapa.dia_inicio),
          dia_fin: aTexto(etapa.dia_fin),
          caracteristicas: etapa.caracteristicas ?? '',
        }
      : {
          nombre: disponibles[0]?.valor ?? '',
          dia_inicio: String(siguienteInicio),
          dia_fin: '',
          caracteristicas: '',
        }
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    const inicio = aNumero(form.dia_inicio);
    const fin = aNumero(form.dia_fin);
    if (fin < inicio) {
      setError('El día final no puede ser menor que el día inicial.');
      return;
    }
    setGuardando(true);
    try {
      await guardarEtapa(
        {
          cultivo_id: cultivo.id,
          nombre: form.nombre,
          dia_inicio: inicio,
          dia_fin: fin,
          caracteristicas: form.caracteristicas.trim() || null,
        },
        etapa?.id
      );
      onGuardado();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar la etapa.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div>
        <label className="label">Etapa</label>
        <select className="input" value={form.nombre} onChange={set('nombre')} required>
          {disponibles.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Día inicial</label>
          <input type="number" min="0" step="1" className="input" value={form.dia_inicio} onChange={set('dia_inicio')} required />
        </div>
        <div>
          <label className="label">Día final</label>
          <input type="number" min="0" max={cultivo.ciclo_dias} step="1" className="input" value={form.dia_fin} onChange={set('dia_fin')} required />
        </div>
      </div>
      <p className="-mt-2 text-xs text-stone-500">
        Los días se cuentan desde la siembra (día 0). El ciclo de {cultivo.nombre_comun} es de {cultivo.ciclo_dias} días.
      </p>

      <div>
        <label className="label">Características</label>
        <textarea
          className="input min-h-[90px] resize-y"
          placeholder="Qué ocurre en esta etapa"
          value={form.caracteristicas}
          onChange={set('caracteristicas')}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={guardando} className="btn-primary">
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {etapa ? 'Guardar cambios' : 'Agregar etapa'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ------------------------------- Pestaña ------------------------------- */
export default function TabEtapas() {
  const { puede } = useAuth();
  const puedeCrear = puede('cultivos', 'crear');
  const puedeEditar = puede('cultivos', 'actualizar');
  const puedeEliminar = puede('cultivos', 'eliminar');

  const [cultivos, setCultivos] = useState([]);
  const [cultivoId, setCultivoId] = useState('');
  const [etapas, setEtapas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoEtapas, setCargandoEtapas] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | { etapa: objeto | null }

  useEffect(() => {
    (async () => {
      try {
        const data = await listarCultivos();
        setCultivos(data);
        const primero = data.find((c) => c.estado === 'activo') || data[0];
        if (primero) setCultivoId(primero.id);
      } catch (err) {
        setError(mensajeError(err, 'No se pudieron cargar los cultivos.'));
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const cargarEtapas = useCallback(async (id) => {
    setCargandoEtapas(true);
    try {
      setEtapas(await listarEtapas(id));
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las etapas.'));
    } finally {
      setCargandoEtapas(false);
    }
  }, []);

  useEffect(() => {
    if (cultivoId) cargarEtapas(cultivoId);
  }, [cultivoId, cargarEtapas]);

  const cultivo = cultivos.find((c) => c.id === cultivoId);
  const ordenadas = useMemo(() => ordenarEtapas(etapas), [etapas]);
  const huecos = useMemo(
    () => (cultivo ? diasSinEtapa(etapas, cultivo.ciclo_dias) : []),
    [etapas, cultivo]
  );

  const eliminar = async (e) => {
    if (!window.confirm(`¿Eliminar la etapa "${nombreEtapa(e.nombre)}"?`)) return;
    setError('');
    try {
      await eliminarEtapa(e.id);
      await cargarEtapas(cultivoId);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar la etapa.'));
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  if (cultivos.length === 0) {
    return (
      <div className="card flex flex-col items-center p-12 text-center">
        <CalendarRange className="h-10 w-10 text-stone-300" />
        <p className="mt-3 font-semibold">Aún no hay cultivos</p>
        <p className="text-sm text-stone-500">Crea un cultivo en la pestaña Cultivos para definir sus etapas.</p>
      </div>
    );
  }

  const total = cultivo.ciclo_dias + 1; // días 0 a ciclo
  const completas = ETAPAS.length === etapas.length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-sm">
          <label className="label">Cultivo</label>
          <select className="input" value={cultivoId} onChange={(e) => setCultivoId(e.target.value)}>
            {cultivos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_comun}
                {c.variedad ? ` · ${c.variedad}` : ''}
                {c.estado === 'inactivo' ? ' (inactivo)' : ''}
              </option>
            ))}
          </select>
        </div>
        {puedeCrear && !completas && (
          <button onClick={() => setModal({ etapa: null })} className="btn-primary ml-auto">
            <Plus className="h-4 w-4" /> Nueva etapa
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {cargandoEtapas ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-7 w-7 animate-spin text-green-700" />
        </div>
      ) : (
        <>
          {/* Línea de tiempo */}
          <div className="card mb-6 p-5">
            <div className="mb-3 flex items-center justify-between text-sm">
              <p className="font-semibold">Ciclo de {cultivo.ciclo_dias} días</p>
              <p className="text-stone-500">{etapas.length} de {ETAPAS.length} etapas definidas</p>
            </div>

            <div className="relative h-10 overflow-hidden rounded-xl bg-stone-100">
              {ordenadas.map((e) => (
                <div
                  key={e.id}
                  title={`${nombreEtapa(e.nombre)}: días ${e.dia_inicio} a ${e.dia_fin}`}
                  className={`absolute top-0 h-full ${colorEtapa(e.nombre)} border-r border-white/60`}
                  style={{
                    left: `${(e.dia_inicio / total) * 100}%`,
                    width: `${((e.dia_fin - e.dia_inicio + 1) / total) * 100}%`,
                  }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-stone-500">
              <span>Día 0</span>
              <span>Día {cultivo.ciclo_dias}</span>
            </div>

            {etapas.length > 0 && huecos.length > 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Días sin etapa definida:{' '}
                  {huecos.map(([a, b]) => (a === b ? `día ${a}` : `${a} a ${b}`)).join(', ')}.
                </span>
              </div>
            )}
          </div>

          {/* Lista */}
          {ordenadas.length === 0 ? (
            <div className="card flex flex-col items-center p-12 text-center">
              <CalendarRange className="h-10 w-10 text-stone-300" />
              <p className="mt-3 font-semibold">Este cultivo no tiene etapas definidas</p>
              <p className="text-sm text-stone-500">
                {puedeCrear
                  ? 'Agrega la primera con el botón "Nueva etapa". Sin etapas, las siembras no muestran su etapa actual.'
                  : 'Aún no se han definido.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordenadas.map((e) => (
                <div key={e.id} className="card flex items-start gap-4 p-5">
                  <span className={`mt-1 h-4 w-4 shrink-0 rounded-full ${colorEtapa(e.nombre)}`} />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-bold">{nombreEtapa(e.nombre)}</h3>
                      <p className="text-sm font-semibold text-green-700">
                        Días {e.dia_inicio} a {e.dia_fin}
                      </p>
                    </div>
                    {e.caracteristicas && <p className="mt-1 text-sm text-stone-600">{e.caracteristicas}</p>}
                  </div>
                  <div className="flex gap-1">
                    {puedeEditar && (
                      <button
                        onClick={() => setModal({ etapa: e })}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {puedeEliminar && (
                      <button
                        onClick={() => eliminar(e)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        abierto={Boolean(modal)}
        titulo={modal?.etapa ? `Editar ${nombreEtapa(modal.etapa.nombre)}` : 'Nueva etapa fenológica'}
        onCerrar={() => setModal(null)}
      >
        {modal && (
          <FormEtapa
            cultivo={cultivo}
            etapa={modal.etapa}
            etapas={etapas}
            onGuardado={async () => {
              setModal(null);
              await cargarEtapas(cultivoId);
            }}
            onCerrar={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}