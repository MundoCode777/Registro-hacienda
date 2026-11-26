import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ClipboardList, Loader2, Pencil, Plus, Power } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import { guardarTipo, listarTipos } from '../../services/agendaService';
import { mensajeError } from '../../utils/errores';
import { confirmar, mostrarError, notificar } from '../../utils/alertas';
import { UNIDADES, cortoUnidad } from '../../utils/agenda';

function FormTipo({ tipo, onGuardado, onCerrar }) {
  const [form, setForm] = useState({
    nombre: tipo?.nombre ?? '',
    descripcion: tipo?.descripcion ?? '',
    unidad_medida: tipo?.unidad_medida ?? 'ha',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await guardarTipo(
        {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          unidad_medida: form.unidad_medida,
        },
        tipo?.id
      );
      onGuardado();
    } catch (err) {
      setError(
        err.code === '23505'
          ? 'Ya existe un tipo de actividad con ese nombre.'
          : mensajeError(err, 'No se pudo guardar el tipo de actividad.')
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div>
        <label className="label">Nombre</label>
        <input className="input" placeholder="Ej. Riego" value={form.nombre} onChange={set('nombre')} required />
      </div>
      <div>
        <label className="label">Unidad de medida</label>
        <select className="input" value={form.unidad_medida} onChange={set('unidad_medida')}>
          {UNIDADES.map((u) => (
            <option key={u.valor} value={u.valor}>
              {u.nombre}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-stone-500">Con esta unidad se mide la cantidad de trabajo de la actividad.</p>
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea className="input min-h-[80px] resize-y" value={form.descripcion} onChange={set('descripcion')} />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={guardando} className="btn-primary">
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {tipo ? 'Guardar cambios' : 'Crear tipo'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function TabTipos() {
  const { puede } = useAuth();
  const puedeCrear = puede('agenda', 'crear');
  const puedeEditar = puede('agenda', 'actualizar');

  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setTipos(await listarTipos());
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los tipos de actividad.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarEstado = async (t) => {
    const desactivar = t.estado === 'activo';
    if (desactivar) {
      const acepta = await confirmar({
        titulo: `¿Desactivar "${t.nombre}"?`,
        texto: 'No se podrá usar en nuevas actividades. Las ya programadas se conservan.',
        confirmar: 'Sí, desactivar',
        peligro: true,
      });
      if (!acepta) return;
    }
    try {
      await guardarTipo({ estado: desactivar ? 'inactivo' : 'activo' }, t.id);
      await cargar();
      notificar(desactivar ? 'Tipo desactivado' : 'Tipo activado');
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">Catálogo de actividades que se pueden programar.</p>
        {puedeCrear && (
          <button onClick={() => setModal({ tipo: null })} className="btn-primary">
            <Plus className="h-4 w-4" /> Nuevo tipo
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {tipos.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <ClipboardList className="h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold">No hay tipos de actividad</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {tipos.map((t) => (
            <div key={t.id} className={`card flex flex-col p-5 ${t.estado === 'inactivo' ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold">{t.nombre}</h3>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                  {cortoUnidad(t.unidad_medida)}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">{t.descripcion || 'Sin descripción'}</p>
              {t.estado === 'inactivo' && (
                <p className="mt-3 text-xs font-semibold text-stone-500">Tipo inactivo</p>
              )}

              {puedeEditar && (
                <div className="mt-auto flex gap-2 border-t border-stone-100 pt-4">
                  <button onClick={() => setModal({ tipo: t })} className="btn-ghost mt-4 flex-1 !py-2">
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button onClick={() => cambiarEstado(t)} className="btn-ghost mt-4 flex-1 !py-2">
                    <Power className="h-4 w-4" /> {t.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        abierto={Boolean(modal)}
        titulo={modal?.tipo ? `Editar ${modal.tipo.nombre}` : 'Nuevo tipo de actividad'}
        onCerrar={() => setModal(null)}
      >
        {modal && (
          <FormTipo
            tipo={modal.tipo}
            onGuardado={async () => {
              setModal(null);
              await cargar();
              notificar('Tipo de actividad guardado');
            }}
            onCerrar={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}