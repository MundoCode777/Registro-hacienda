import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Leaf, Loader2, Pencil, Plus, Power, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import { guardarCultivo, listarCultivos } from '../../services/cultivosService';
import { mensajeError } from '../../utils/errores';
import { TIPOS_CULTIVO, nombreTipo, textoRango } from '../../utils/cultivos';
import { aNumero, aTexto } from '../../utils/suelo';

const VACIO = {
  nombre_comun: '',
  nombre_cientifico: '',
  variedad: '',
  tipo: 'anual',
  ciclo_dias: '',
  temp_min_c: '',
  temp_max_c: '',
  precipitacion_min_mm: '',
  precipitacion_max_mm: '',
};

/* ----------------------------- Formulario ----------------------------- */
function FormCultivo({ cultivo, onGuardado, onCerrar }) {
  const [form, setForm] = useState(
    cultivo
      ? {
          nombre_comun: cultivo.nombre_comun,
          nombre_cientifico: cultivo.nombre_cientifico ?? '',
          variedad: cultivo.variedad ?? '',
          tipo: cultivo.tipo,
          ciclo_dias: aTexto(cultivo.ciclo_dias),
          temp_min_c: aTexto(cultivo.temp_min_c),
          temp_max_c: aTexto(cultivo.temp_max_c),
          precipitacion_min_mm: aTexto(cultivo.precipitacion_min_mm),
          precipitacion_max_mm: aTexto(cultivo.precipitacion_max_mm),
        }
      : VACIO
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setError('');

    const tMin = aNumero(form.temp_min_c);
    const tMax = aNumero(form.temp_max_c);
    const pMin = aNumero(form.precipitacion_min_mm);
    const pMax = aNumero(form.precipitacion_max_mm);
    if (tMin !== null && tMax !== null && tMin > tMax) {
      setError('La temperatura mínima no puede ser mayor que la máxima.');
      return;
    }
    if (pMin !== null && pMax !== null && pMin > pMax) {
      setError('La precipitación mínima no puede ser mayor que la máxima.');
      return;
    }

    setGuardando(true);
    try {
      await guardarCultivo(
        {
          nombre_comun: form.nombre_comun.trim(),
          nombre_cientifico: form.nombre_cientifico.trim() || null,
          variedad: form.variedad.trim(),
          tipo: form.tipo,
          ciclo_dias: aNumero(form.ciclo_dias),
          temp_min_c: tMin,
          temp_max_c: tMax,
          precipitacion_min_mm: pMin,
          precipitacion_max_mm: pMax,
        },
        cultivo?.id
      );
      onGuardado();
    } catch (err) {
      setError(
        err.code === '23505'
          ? 'Ya existe un cultivo con ese nombre y esa variedad.'
          : mensajeError(err, 'No se pudo guardar el cultivo.')
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Nombre común</label>
          <input className="input" placeholder="Ej. Cacao" value={form.nombre_comun} onChange={set('nombre_comun')} required />
        </div>
        <div>
          <label className="label">Variedad</label>
          <input className="input" placeholder="Ej. CCN-51" value={form.variedad} onChange={set('variedad')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Nombre científico</label>
          <input className="input" placeholder="Ej. Theobroma cacao" value={form.nombre_cientifico} onChange={set('nombre_cientifico')} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={form.tipo} onChange={set('tipo')}>
            {TIPOS_CULTIVO.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Ciclo de vida (días)</label>
          <input type="number" min="1" step="1" className="input" value={form.ciclo_dias} onChange={set('ciclo_dias')} required />
          <p className="mt-1 text-xs text-stone-500">Días desde la siembra hasta la cosecha.</p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold">Condiciones óptimas</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Temperatura mínima (°C)</label>
            <input type="number" step="0.1" className="input" value={form.temp_min_c} onChange={set('temp_min_c')} />
          </div>
          <div>
            <label className="label">Temperatura máxima (°C)</label>
            <input type="number" step="0.1" className="input" value={form.temp_max_c} onChange={set('temp_max_c')} />
          </div>
          <div>
            <label className="label">Precipitación mínima (mm/año)</label>
            <input type="number" min="0" step="1" className="input" value={form.precipitacion_min_mm} onChange={set('precipitacion_min_mm')} />
          </div>
          <div>
            <label className="label">Precipitación máxima (mm/año)</label>
            <input type="number" min="0" step="1" className="input" value={form.precipitacion_max_mm} onChange={set('precipitacion_max_mm')} />
          </div>
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
          {cultivo ? 'Guardar cambios' : 'Crear cultivo'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ------------------------------- Pestaña ------------------------------- */
export default function TabCultivos() {
  const { puede } = useAuth();
  const puedeCrear = puede('cultivos', 'crear');
  const puedeEditar = puede('cultivos', 'actualizar');

  const [cultivos, setCultivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('activo');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setCultivos(await listarCultivos());
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los cultivos.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return cultivos.filter(
      (c) =>
        (filtro === 'todos' || c.estado === filtro) &&
        `${c.nombre_comun} ${c.variedad} ${c.nombre_cientifico ?? ''}`.toLowerCase().includes(q)
    );
  }, [cultivos, filtro, busqueda]);

  const cambiarEstado = async (c) => {
    const nuevo = c.estado === 'activo' ? 'inactivo' : 'activo';
    if (nuevo === 'inactivo' && !window.confirm(`¿Desactivar "${c.nombre_comun}"? No podrá usarse en nuevas siembras.`)) {
      return;
    }
    setError('');
    try {
      await guardarCultivo({ estado: nuevo }, c.id);
      await cargar();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cambiar el estado.'));
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input className="input pl-10" placeholder="Buscar cultivo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        <div className="flex gap-2">
          {[
            { clave: 'activo', nombre: 'Activos' },
            { clave: 'inactivo', nombre: 'Inactivos' },
            { clave: 'todos', nombre: 'Todos' },
          ].map((f) => (
            <button
              key={f.clave}
              onClick={() => setFiltro(f.clave)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                filtro === f.clave
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {f.nombre}
            </button>
          ))}
        </div>

        {puedeCrear && (
          <button onClick={() => setModal({ cultivo: null })} className="btn-primary ml-auto">
            <Plus className="h-4 w-4" /> Nuevo cultivo
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <Leaf className="h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold">No hay cultivos para mostrar</p>
          <p className="text-sm text-stone-500">
            {puedeCrear ? 'Crea el primero con el botón "Nuevo cultivo".' : 'Aún no se han registrado cultivos.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((c) => (
            <div key={c.id} className={`card p-5 ${c.estado === 'inactivo' ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{c.nombre_comun}</h3>
                  {c.variedad && <p className="text-sm font-medium text-green-700">{c.variedad}</p>}
                  {c.nombre_cientifico && <p className="text-xs italic text-stone-500">{c.nombre_cientifico}</p>}
                </div>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                  {nombreTipo(c.tipo)}
                </span>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Ciclo</dt>
                  <dd className="font-semibold">{c.ciclo_dias} días</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Temperatura</dt>
                  <dd className="font-semibold">{textoRango(c.temp_min_c, c.temp_max_c, '°C')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Precipitación</dt>
                  <dd className="font-semibold">{textoRango(c.precipitacion_min_mm, c.precipitacion_max_mm, 'mm')}</dd>
                </div>
              </dl>

              {c.estado === 'inactivo' && (
                <p className="mt-3 text-xs font-semibold text-stone-500">Cultivo inactivo</p>
              )}

              {puedeEditar && (
                <div className="mt-4 flex gap-2 border-t border-stone-100 pt-4">
                  <button onClick={() => setModal({ cultivo: c })} className="btn-ghost flex-1 !py-2">
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button onClick={() => cambiarEstado(c)} className="btn-ghost flex-1 !py-2">
                    <Power className="h-4 w-4" /> {c.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        abierto={Boolean(modal)}
        titulo={modal?.cultivo ? `Editar ${modal.cultivo.nombre_comun}` : 'Nuevo cultivo'}
        onCerrar={() => setModal(null)}
      >
        {modal && (
          <FormCultivo
            cultivo={modal.cultivo}
            onGuardado={async () => {
              setModal(null);
              await cargar();
            }}
            onCerrar={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}