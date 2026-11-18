import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, FlaskConical, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import {
  eliminarAnalisis,
  guardarAnalisis,
  listarAnalisis,
  listarLotes,
} from '../../services/haciendaService';
import { mensajeError } from '../../utils/errores';
import { aNumero, fmt, formatearDia, hoyISO, interpretarPH } from '../../utils/suelo';

const VACIO = {
  fecha_analisis: hoyISO(),
  laboratorio: '',
  ph: '',
  nitrogeno: '',
  fosforo: '',
  potasio: '',
  materia_organica: '',
  observaciones: '',
};

/* ----------------------------- Formulario ----------------------------- */
function FormAnalisis({ loteId, onGuardado, onCerrar }) {
  const [form, setForm] = useState({ ...VACIO, fecha_analisis: hoyISO() });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await guardarAnalisis({
        lote_id: loteId,
        fecha_analisis: form.fecha_analisis,
        laboratorio: form.laboratorio.trim() || null,
        ph: aNumero(form.ph),
        nitrogeno: aNumero(form.nitrogeno),
        fosforo: aNumero(form.fosforo),
        potasio: aNumero(form.potasio),
        materia_organica: aNumero(form.materia_organica),
        observaciones: form.observaciones.trim() || null,
      });
      onGuardado();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar el análisis.'));
    } finally {
      setGuardando(false);
    }
  };

  const numero = (campo, etiqueta, max) => (
    <div>
      <label className="label">{etiqueta}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        max={max}
        className="input"
        value={form[campo]}
        onChange={set(campo)}
        required
      />
    </div>
  );

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Fecha del análisis</label>
          <input
            type="date"
            max={hoyISO()}
            className="input"
            value={form.fecha_analisis}
            onChange={set('fecha_analisis')}
            required
          />
        </div>
        <div>
          <label className="label">Laboratorio</label>
          <input className="input" value={form.laboratorio} onChange={set('laboratorio')} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {numero('ph', 'pH (0 a 14)', 14)}
        {numero('materia_organica', 'Materia orgánica (%)', 100)}
        {numero('nitrogeno', 'Nitrógeno (ppm)')}
        {numero('fosforo', 'Fósforo (ppm)')}
        {numero('potasio', 'Potasio (ppm)')}
      </div>

      <div>
        <label className="label">Observaciones</label>
        <textarea
          className="input min-h-[70px] resize-y"
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
          Guardar análisis
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ------------------------------- Pestaña ------------------------------- */
function Valor({ etiqueta, valor, unidad, extra }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">{etiqueta}</p>
      <p className="mt-1 text-2xl font-extrabold">
        {valor} <span className="text-sm font-medium text-stone-500">{unidad}</span>
      </p>
      {extra}
    </div>
  );
}

export default function TabAnalisis({ hacienda }) {
  const { puede } = useAuth();
  const puedeCrear = puede('hacienda', 'crear');
  const puedeEliminar = puede('hacienda', 'eliminar');

  const [lotes, setLotes] = useState([]);
  const [loteId, setLoteId] = useState('');
  const [analisis, setAnalisis] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);

  // Cargar lotes al abrir la pestaña
  useEffect(() => {
    (async () => {
      try {
        const data = await listarLotes(hacienda.id);
        setLotes(data);
        const primero = data.find((l) => l.estado === 'activo') || data[0];
        if (primero) setLoteId(primero.id);
      } catch (err) {
        setError(mensajeError(err, 'No se pudieron cargar los lotes.'));
      } finally {
        setCargando(false);
      }
    })();
  }, [hacienda.id]);

  const cargarAnalisis = useCallback(async (id) => {
    setCargandoAnalisis(true);
    try {
      setAnalisis(await listarAnalisis(id));
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los análisis.'));
    } finally {
      setCargandoAnalisis(false);
    }
  }, []);

  useEffect(() => {
    if (loteId) cargarAnalisis(loteId);
  }, [loteId, cargarAnalisis]);

  const eliminar = async (a) => {
    if (!window.confirm('¿Eliminar este análisis? Esta acción no se puede deshacer.')) return;
    setError('');
    try {
      await eliminarAnalisis(a.id);
      await cargarAnalisis(loteId);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar el análisis.'));
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  if (lotes.length === 0) {
    return (
      <div className="card flex flex-col items-center p-12 text-center">
        <FlaskConical className="h-10 w-10 text-stone-300" />
        <p className="mt-3 font-semibold">Aún no hay lotes</p>
        <p className="text-sm text-stone-500">Crea un lote en la pestaña Lotes para registrar su análisis de suelo.</p>
      </div>
    );
  }

  const actual = analisis[0];
  const ph = actual ? interpretarPH(actual.ph) : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <label className="label">Lote</label>
          <select className="input" value={loteId} onChange={(e) => setLoteId(e.target.value)}>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
                {l.estado === 'inactivo' ? ' (inactivo)' : ''}
              </option>
            ))}
          </select>
        </div>
        {puedeCrear && (
          <button onClick={() => setModal(true)} className="btn-primary ml-auto">
            <Plus className="h-4 w-4" /> Nuevo análisis
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {cargandoAnalisis ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-7 w-7 animate-spin text-green-700" />
        </div>
      ) : !actual ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <FlaskConical className="h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold">Este lote no tiene análisis de suelo</p>
          <p className="text-sm text-stone-500">
            {puedeCrear ? 'Registra el primero con el botón "Nuevo análisis".' : 'Aún no se ha registrado ninguno.'}
          </p>
        </div>
      ) : (
        <>
          {/* Último análisis */}
          <div className="card mb-6 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Último análisis</h2>
              <p className="text-sm text-stone-500">
                {formatearDia(actual.fecha_analisis)}
                {actual.laboratorio ? ` · ${actual.laboratorio}` : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <Valor
                etiqueta="pH"
                valor={fmt(actual.ph)}
                extra={
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ph.clase}`}>
                    {ph.texto}
                  </span>
                }
              />
              <Valor etiqueta="Nitrógeno" valor={fmt(actual.nitrogeno)} unidad="ppm" />
              <Valor etiqueta="Fósforo" valor={fmt(actual.fosforo)} unidad="ppm" />
              <Valor etiqueta="Potasio" valor={fmt(actual.potasio)} unidad="ppm" />
              <Valor etiqueta="Materia orgánica" valor={fmt(actual.materia_organica)} unidad="%" />
            </div>

            {actual.observaciones && (
              <p className="mt-4 text-sm text-stone-600">{actual.observaciones}</p>
            )}
          </div>

          {/* Historial */}
          <h3 className="mb-3 font-bold">Historial</h3>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3">Laboratorio</th>
                    <th className="px-5 py-3">pH</th>
                    <th className="px-5 py-3">N (ppm)</th>
                    <th className="px-5 py-3">P (ppm)</th>
                    <th className="px-5 py-3">K (ppm)</th>
                    <th className="px-5 py-3">M.O. (%)</th>
                    {puedeEliminar && <th className="px-5 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {analisis.map((a) => (
                    <tr key={a.id} className="hover:bg-stone-50/60">
                      <td className="px-5 py-3 font-medium">{formatearDia(a.fecha_analisis)}</td>
                      <td className="px-5 py-3 text-stone-600">{a.laboratorio || '—'}</td>
                      <td className="px-5 py-3">{fmt(a.ph)}</td>
                      <td className="px-5 py-3">{fmt(a.nitrogeno)}</td>
                      <td className="px-5 py-3">{fmt(a.fosforo)}</td>
                      <td className="px-5 py-3">{fmt(a.potasio)}</td>
                      <td className="px-5 py-3">{fmt(a.materia_organica)}</td>
                      {puedeEliminar && (
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => eliminar(a)}
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal abierto={modal} titulo="Nuevo análisis de suelo" onCerrar={() => setModal(false)}>
        {modal && (
          <FormAnalisis
            loteId={loteId}
            onGuardado={async () => {
              setModal(false);
              await cargarAnalisis(loteId);
            }}
            onCerrar={() => setModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}