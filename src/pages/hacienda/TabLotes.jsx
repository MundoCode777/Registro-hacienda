import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Layers, Loader2, MapPin, Pencil, Plus, Power, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import CampoCoordenadas from '../../components/ui/CampoCoordenadas';
import { guardarLote, listarLotes } from '../../services/haciendaService';
import { mensajeError } from '../../utils/errores';
import { TIPOS_SUELO, aNumero, aTexto, fmt, nombreTipoSuelo } from '../../utils/suelo';

const VACIO = {
  nombre: '',
  area_ha: '',
  tipo_suelo: 'franco',
  latitud: '',
  longitud: '',
  observaciones: '',
};

/* ----------------------------- Formulario ----------------------------- */
function FormLote({ lote, hacienda, disponible, onGuardado, onCerrar }) {
  const [form, setForm] = useState(
    lote
      ? {
          nombre: lote.nombre,
          area_ha: aTexto(lote.area_ha),
          tipo_suelo: lote.tipo_suelo,
          latitud: aTexto(lote.latitud),
          longitud: aTexto(lote.longitud),
          observaciones: lote.observaciones ?? '',
        }
      : VACIO
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  // Al editar un lote activo, su propia área vuelve a estar disponible
  const maximo = lote?.estado === 'activo' ? disponible + Number(lote.area_ha) : disponible;

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await guardarLote(
        {
          hacienda_id: hacienda.id,
          nombre: form.nombre.trim(),
          area_ha: aNumero(form.area_ha),
          tipo_suelo: form.tipo_suelo,
          latitud: aNumero(form.latitud),
          longitud: aNumero(form.longitud),
          observaciones: form.observaciones.trim() || null,
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
      <div>
        <label className="label">Nombre del lote</label>
        <input
          className="input"
          placeholder="Ej. Lote 1"
          value={form.nombre}
          onChange={set('nombre')}
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Área (ha)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="input"
            value={form.area_ha}
            onChange={set('area_ha')}
            required
          />
          <p className="mt-1 text-xs text-stone-500">Disponibles: {fmt(Math.max(maximo, 0))} ha</p>
        </div>
        <div>
          <label className="label">Tipo de suelo</label>
          <select className="input" value={form.tipo_suelo} onChange={set('tipo_suelo')}>
            {TIPOS_SUELO.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <CampoCoordenadas
        latitud={form.latitud}
        longitud={form.longitud}
        onChange={(c) => setForm({ ...form, ...c })}
      />

      <div>
        <label className="label">Observaciones</label>
        <textarea
          className="input min-h-[80px] resize-y"
          value={form.observaciones}
          onChange={set('observaciones')}
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
          {lote ? 'Guardar cambios' : 'Crear lote'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ------------------------------- Pestaña ------------------------------- */
export default function TabLotes({ hacienda }) {
  const { puede } = useAuth();
  const puedeCrear = puede('hacienda', 'crear');
  const puedeEditar = puede('hacienda', 'actualizar');

  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('activo'); // activo | inactivo | todos
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null); // null | { lote: objeto | null }

  const cargar = useCallback(async () => {
    try {
      setLotes(await listarLotes(hacienda.id));
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los lotes.'));
    } finally {
      setCargando(false);
    }
  }, [hacienda.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const areaUsada = useMemo(
    () => lotes.filter((l) => l.estado === 'activo').reduce((s, l) => s + Number(l.area_ha), 0),
    [lotes]
  );
  const extension = Number(hacienda.extension_ha);
  const disponible = extension - areaUsada;
  const porcentaje = Math.min(100, (areaUsada / extension) * 100);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return lotes.filter(
      (l) => (filtro === 'todos' || l.estado === filtro) && l.nombre.toLowerCase().includes(q)
    );
  }, [lotes, filtro, busqueda]);

  const cambiarEstado = async (lote) => {
    const nuevo = lote.estado === 'activo' ? 'inactivo' : 'activo';
    if (
      nuevo === 'inactivo' &&
      !window.confirm(`¿Desactivar "${lote.nombre}"? Dejará de aparecer al programar actividades.`)
    ) {
      return;
    }
    setError('');
    try {
      await guardarLote({ estado: nuevo }, lote.id);
      await cargar();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cambiar el estado del lote.'));
    }
  };

  const alGuardar = async () => {
    setModal(null);
    await cargar();
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
      {/* Barra de hectáreas */}
      <div className="card mb-6 p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm text-stone-500">Hectáreas asignadas a lotes activos</p>
            <p className="text-2xl font-extrabold">
              {fmt(areaUsada)} <span className="text-base font-medium text-stone-500">de {fmt(extension)} ha</span>
            </p>
          </div>
          <p className="text-sm font-semibold text-green-700">{fmt(Math.max(disponible, 0))} ha disponibles</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full rounded-full transition-all ${porcentaje > 90 ? 'bg-amber-500' : 'bg-green-600'}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            className="input pl-10"
            placeholder="Buscar lote"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
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
          <button onClick={() => setModal({ lote: null })} className="btn-primary ml-auto">
            <Plus className="h-4 w-4" /> Nuevo lote
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Tarjetas */}
      {visibles.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <Layers className="h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold">No hay lotes para mostrar</p>
          <p className="text-sm text-stone-500">
            {puedeCrear ? 'Crea el primer lote con el botón "Nuevo lote".' : 'Aún no se han creado lotes.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((l) => (
            <div key={l.id} className={`card p-5 ${l.estado === 'inactivo' ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold">{l.nombre}</h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    l.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {l.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <p className="mt-3 text-3xl font-extrabold text-green-800">
                {fmt(l.area_ha)} <span className="text-sm font-medium text-stone-500">ha</span>
              </p>
              <p className="mt-1 text-sm text-stone-600">Suelo {nombreTipoSuelo(l.tipo_suelo).toLowerCase()}</p>

              {l.latitud != null && l.longitud != null && (
                <p className="mt-2 flex items-center gap-1 text-xs text-stone-500">
                  <MapPin className="h-3.5 w-3.5" /> {l.latitud}, {l.longitud}
                </p>
              )}
              {l.observaciones && <p className="mt-3 text-sm text-stone-500">{l.observaciones}</p>}

              {puedeEditar && (
                <div className="mt-4 flex gap-2 border-t border-stone-100 pt-4">
                  <button onClick={() => setModal({ lote: l })} className="btn-ghost flex-1 !py-2">
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button onClick={() => cambiarEstado(l)} className="btn-ghost flex-1 !py-2">
                    <Power className="h-4 w-4" /> {l.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        abierto={Boolean(modal)}
        titulo={modal?.lote ? `Editar ${modal.lote.nombre}` : 'Nuevo lote'}
        onCerrar={() => setModal(null)}
      >
        {modal && (
          <FormLote
            lote={modal.lote}
            hacienda={hacienda}
            disponible={disponible}
            onGuardado={alGuardar}
            onCerrar={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}