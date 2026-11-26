import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, FlaskConical, Loader2, Pencil, Plus, Power, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import { guardarInsumo, listarInsumos } from '../../services/insumosService';
import { mensajeError } from '../../utils/errores';
import { confirmar, mostrarError, notificar } from '../../utils/alertas';
import {
  CATEGORIAS,
  UNIDADES_INSUMO,
  claseCategoria,
  cortoUnidadInsumo,
  nombreCategoria,
} from '../../utils/insumos';
import { aNumero, aTexto, fmt } from '../../utils/suelo';

/* ----------------------------- Formulario ----------------------------- */
function FormInsumo({ insumo, onGuardado, onCerrar }) {
  const [form, setForm] = useState({
    nombre_comercial: insumo?.nombre_comercial ?? '',
    nombre_generico: insumo?.nombre_generico ?? '',
    categoria: insumo?.categoria ?? 'fertilizante',
    unidad_medida: insumo?.unidad_medida ?? 'kg',
    dosis_recomendada_ha: aTexto(insumo?.dosis_recomendada_ha),
    tiempo_carencia_dias: aTexto(insumo?.tiempo_carencia_dias ?? 0),
    stock_minimo: aTexto(insumo?.stock_minimo ?? 0),
    ficha_tecnica: insumo?.ficha_tecnica ?? '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const unidad = cortoUnidadInsumo(form.unidad_medida);

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await guardarInsumo(
        {
          nombre_comercial: form.nombre_comercial.trim(),
          nombre_generico: form.nombre_generico.trim() || null,
          categoria: form.categoria,
          unidad_medida: form.unidad_medida,
          dosis_recomendada_ha: aNumero(form.dosis_recomendada_ha),
          tiempo_carencia_dias: aNumero(form.tiempo_carencia_dias) ?? 0,
          stock_minimo: aNumero(form.stock_minimo) ?? 0,
          ficha_tecnica: form.ficha_tecnica.trim() || null,
        },
        insumo?.id
      );
      onGuardado();
    } catch (err) {
      setError(
        err.code === '23505'
          ? 'Ya existe un insumo con ese nombre comercial.'
          : mensajeError(err, 'No se pudo guardar el insumo.')
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Nombre comercial</label>
          <input className="input" value={form.nombre_comercial} onChange={set('nombre_comercial')} required />
        </div>
        <div>
          <label className="label">Nombre genérico</label>
          <input className="input" placeholder="Ingrediente activo" value={form.nombre_generico} onChange={set('nombre_generico')} />
        </div>

        <div>
          <label className="label">Categoría</label>
          <select className="input" value={form.categoria} onChange={set('categoria')}>
            {CATEGORIAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Unidad de medida</label>
          <select className="input" value={form.unidad_medida} onChange={set('unidad_medida')}>
            {UNIDADES_INSUMO.map((u) => (
              <option key={u.valor} value={u.valor}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Dosis recomendada ({unidad}/ha)</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            className="input"
            value={form.dosis_recomendada_ha}
            onChange={set('dosis_recomendada_ha')}
            required
          />
        </div>
        <div>
          <label className="label">Tiempo de carencia (días)</label>
          <input
            type="number"
            step="1"
            min="0"
            className="input"
            value={form.tiempo_carencia_dias}
            onChange={set('tiempo_carencia_dias')}
          />
          <p className="mt-1 text-xs text-stone-500">Días mínimos entre la aplicación y la cosecha.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Stock mínimo de alerta ({unidad})</label>
          <input
            type="number"
            step="0.001"
            min="0"
            className="input"
            value={form.stock_minimo}
            onChange={set('stock_minimo')}
          />
          <p className="mt-1 text-xs text-stone-500">
            Cuando el stock total baje de esta cantidad, el sistema lo marcará como stock bajo. Usa 0 para no alertar.
          </p>
        </div>
      </div>

      <div>
        <label className="label">Ficha técnica</label>
        <textarea
          className="input min-h-[110px] resize-y"
          placeholder="Composición, modo de uso, precauciones, toxicidad…"
          value={form.ficha_tecnica}
          onChange={set('ficha_tecnica')}
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
          {insumo ? 'Guardar cambios' : 'Crear insumo'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ------------------------------- Pestaña ------------------------------- */
export default function TabCatalogo() {
  const { puede } = useAuth();
  const puedeCrear = puede('insumos', 'crear');
  const puedeEditar = puede('insumos', 'actualizar');

  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('activo');
  const [categoria, setCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setInsumos(await listarInsumos());
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar el catálogo.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return insumos.filter(
      (i) =>
        (filtro === 'todos' || i.estado === filtro) &&
        (!categoria || i.categoria === categoria) &&
        `${i.nombre_comercial} ${i.nombre_generico ?? ''}`.toLowerCase().includes(q)
    );
  }, [insumos, filtro, categoria, busqueda]);

  const cambiarEstado = async (i) => {
    const desactivar = i.estado === 'activo';
    if (desactivar) {
      const acepta = await confirmar({
        titulo: `¿Desactivar "${i.nombre_comercial}"?`,
        texto: 'No podrá usarse en nuevas aplicaciones ni recomendaciones. El historial se conserva.',
        confirmar: 'Sí, desactivar',
        peligro: true,
      });
      if (!acepta) return;
    }
    try {
      await guardarInsumo({ estado: desactivar ? 'inactivo' : 'activo' }, i.id);
      await cargar();
      notificar(desactivar ? 'Insumo desactivado' : 'Insumo activado');
    } catch (err) {
      mostrarError('No se pudo cambiar el estado', mensajeError(err));
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
          <input className="input pl-10" placeholder="Buscar insumo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        <select className="input !w-auto" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.nombre}
            </option>
          ))}
        </select>

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
          <button onClick={() => setModal({ insumo: null })} className="btn-primary ml-auto">
            <Plus className="h-4 w-4" /> Nuevo insumo
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
          <FlaskConical className="h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold">No hay insumos para mostrar</p>
          <p className="text-sm text-stone-500">
            {puedeCrear ? 'Crea el primero con el botón "Nuevo insumo".' : 'Aún no se han registrado insumos.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((i) => (
            <div key={i.id} className={`card flex flex-col p-5 ${i.estado === 'inactivo' ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold">{i.nombre_comercial}</h3>
                  {i.nombre_generico && <p className="truncate text-sm text-stone-500">{i.nombre_generico}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${claseCategoria(i.categoria)}`}>
                  {nombreCategoria(i.categoria)}
                </span>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Dosis recomendada</dt>
                  <dd className="font-semibold">
                    {fmt(i.dosis_recomendada_ha, 3)} {cortoUnidadInsumo(i.unidad_medida)}/ha
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Carencia</dt>
                  <dd className="font-semibold">{i.tiempo_carencia_dias} días</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Stock mínimo</dt>
                  <dd className="font-semibold">
                    {Number(i.stock_minimo) > 0
                      ? `${fmt(i.stock_minimo, 3)} ${cortoUnidadInsumo(i.unidad_medida)}`
                      : 'Sin alerta'}
                  </dd>
                </div>
              </dl>

              {i.ficha_tecnica && <p className="mt-3 line-clamp-3 text-sm text-stone-500">{i.ficha_tecnica}</p>}
              {i.estado === 'inactivo' && <p className="mt-3 text-xs font-semibold text-stone-500">Insumo inactivo</p>}

              {puedeEditar && (
                <div className="mt-auto flex gap-2 border-t border-stone-100 pt-4">
                  <button onClick={() => setModal({ insumo: i })} className="btn-ghost mt-4 flex-1 !py-2">
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button onClick={() => cambiarEstado(i)} className="btn-ghost mt-4 flex-1 !py-2">
                    <Power className="h-4 w-4" /> {i.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        abierto={Boolean(modal)}
        titulo={modal?.insumo ? `Editar ${modal.insumo.nombre_comercial}` : 'Nuevo insumo'}
        onCerrar={() => setModal(null)}
        ancho="max-w-2xl"
      >
        {modal && (
          <FormInsumo
            insumo={modal.insumo}
            onGuardado={async () => {
              setModal(null);
              await cargar();
              notificar('Insumo guardado');
            }}
            onCerrar={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}