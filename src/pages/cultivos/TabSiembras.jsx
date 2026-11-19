import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Sprout,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import {
  guardarSiembra,
  listarCultivos,
  listarLotesBasico,
  listarSiembras,
  listarTodasEtapas,
} from '../../services/cultivosService';
import { mensajeError } from '../../utils/errores';
import { ESTADOS_SIEMBRA, diasDesde, diasEntre, etapaActual, sumarDias } from '../../utils/cultivos';
import { aNumero, aTexto, fmt, formatearDia, hoyISO } from '../../utils/suelo';

/* ------------------------- Formulario de siembra ------------------------- */
function FormSiembra({ siembra, lotes, cultivos, siembras, onGuardado, onCerrar }) {
  const [form, setForm] = useState(
    siembra
      ? {
          lote_id: siembra.lote_id,
          cultivo_id: siembra.cultivo_id,
          fecha_siembra: siembra.fecha_siembra,
          fecha_estimada_cosecha: siembra.fecha_estimada_cosecha,
          area_ha: aTexto(siembra.area_ha),
          densidad: aTexto(siembra.densidad),
          observaciones: siembra.observaciones ?? '',
        }
      : {
          lote_id: '',
          cultivo_id: '',
          fecha_siembra: hoyISO(),
          fecha_estimada_cosecha: '',
          area_ha: '',
          densidad: '',
          observaciones: '',
        }
  );

  const cultivoSel = cultivos.find((c) => c.id === form.cultivo_id);
  const calculada = cultivoSel ? sumarDias(form.fecha_siembra, cultivoSel.ciclo_dias) : '';

  // La fecha estimada se calcula sola hasta que el usuario la cambie a mano
  const [manual, setManual] = useState(
    siembra
      ? siembra.fecha_estimada_cosecha !== sumarDias(siembra.fecha_siembra, siembra.cultivos?.ciclo_dias)
      : false
  );
  const estimada = manual ? form.fecha_estimada_cosecha : calculada;

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const lotesOpc = lotes.filter((l) => l.estado === 'activo' || l.id === siembra?.lote_id);
  const cultivosOpc = cultivos.filter((c) => c.estado === 'activo' || c.id === siembra?.cultivo_id);

  const loteSel = lotes.find((l) => l.id === form.lote_id);
  const ocupada = siembras
    .filter((s) => s.lote_id === form.lote_id && s.estado === 'en_curso' && s.id !== siembra?.id)
    .reduce((suma, s) => suma + Number(s.area_ha), 0);
  const libre = loteSel ? Math.max(Number(loteSel.area_ha) - ocupada, 0) : null;

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    if (!estimada) {
      setError('Selecciona un cultivo o indica la fecha estimada de cosecha.');
      return;
    }
    if (estimada < form.fecha_siembra) {
      setError('La fecha estimada de cosecha no puede ser anterior a la siembra.');
      return;
    }
    setGuardando(true);
    try {
      await guardarSiembra(
        {
          lote_id: form.lote_id,
          cultivo_id: form.cultivo_id,
          fecha_siembra: form.fecha_siembra,
          fecha_estimada_cosecha: estimada,
          area_ha: aNumero(form.area_ha),
          densidad: aNumero(form.densidad),
          observaciones: form.observaciones.trim() || null,
        },
        siembra?.id
      );
      onGuardado();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar la siembra.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Lote</label>
          <select className="input" value={form.lote_id} onChange={set('lote_id')} required>
            <option value="">Selecciona…</option>
            {lotesOpc.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre} ({fmt(l.area_ha)} ha)
              </option>
            ))}
          </select>
          {libre !== null && <p className="mt-1 text-xs text-stone-500">Libres para sembrar: {fmt(libre)} ha</p>}
        </div>
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
          <label className="label">Fecha de siembra</label>
          <input type="date" className="input" value={form.fecha_siembra} onChange={set('fecha_siembra')} required />
        </div>
        <div>
          <label className="label">Cosecha estimada</label>
          <input
            type="date"
            className="input"
            value={estimada}
            min={form.fecha_siembra}
            onChange={(e) => {
              setManual(true);
              setForm({ ...form, fecha_estimada_cosecha: e.target.value });
            }}
            required
          />
          <p className="mt-1 text-xs text-stone-500">
            {manual ? 'Ajustada manualmente.' : 'Se calcula con el ciclo del cultivo.'}
          </p>
        </div>

        <div>
          <label className="label">Área sembrada (ha)</label>
          <input type="number" step="0.01" min="0.01" className="input" value={form.area_ha} onChange={set('area_ha')} required />
        </div>
        <div>
          <label className="label">Densidad (plantas/ha)</label>
          <input type="number" step="1" min="1" className="input" value={form.densidad} onChange={set('densidad')} />
        </div>
      </div>

      <div>
        <label className="label">Observaciones</label>
        <textarea className="input min-h-[80px] resize-y" value={form.observaciones} onChange={set('observaciones')} />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={guardando} className="btn-primary">
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {siembra ? 'Guardar cambios' : 'Registrar siembra'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ------------------------ Formulario de cierre ------------------------ */
function FormCierre({ siembra, tipo, onGuardado, onCerrar }) {
  const esCosecha = tipo === 'cosechado';
  const [fecha, setFecha] = useState(hoyISO());
  const [obs, setObs] = useState(esCosecha ? siembra.observaciones ?? '' : '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await guardarSiembra(
        {
          estado: tipo,
          fecha_cosecha_real: esCosecha ? fecha : null,
          observaciones: obs.trim() || null,
        },
        siembra.id
      );
      onGuardado();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo actualizar la siembra.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-5">
      <p className="text-sm text-stone-600">
        {esCosecha
          ? 'Al marcarla como cosechada, la siembra se cierra y el área del lote queda libre.'
          : 'Al marcarla como perdida, la siembra se cierra y el área del lote queda libre.'}
      </p>

      {esCosecha && (
        <div>
          <label className="label">Fecha real de cosecha</label>
          <input
            type="date"
            className="input"
            value={fecha}
            min={siembra.fecha_siembra}
            max={hoyISO()}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>
      )}

      <div>
        <label className="label">{esCosecha ? 'Observaciones (opcional)' : 'Motivo de la pérdida'}</label>
        <textarea
          className="input min-h-[90px] resize-y"
          placeholder={esCosecha ? 'Rendimiento, calidad, notas…' : 'Ej. Inundación, plaga, sequía…'}
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          required={!esCosecha}
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
          {esCosecha ? 'Marcar como cosechada' : 'Marcar como perdida'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ------------------------------- Pestaña ------------------------------- */
export default function TabSiembras() {
  const { puede } = useAuth();
  const puedeCrear = puede('cultivos', 'crear');
  const puedeEditar = puede('cultivos', 'actualizar');

  const [siembras, setSiembras] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cultivos, setCultivos] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('en_curso');
  const [filtroLote, setFiltroLote] = useState('');
  const [modal, setModal] = useState(null); // { tipo: 'form' | 'cosechado' | 'perdido', siembra }

  const cargar = useCallback(async () => {
    try {
      const [s, l, c, e] = await Promise.all([
        listarSiembras(),
        listarLotesBasico(),
        listarCultivos(),
        listarTodasEtapas(),
      ]);
      setSiembras(s);
      setLotes(l);
      setCultivos(c);
      setEtapas(e);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las siembras.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const etapasPorCultivo = useMemo(() => {
    const mapa = {};
    etapas.forEach((e) => {
      (mapa[e.cultivo_id] ||= []).push(e);
    });
    return mapa;
  }, [etapas]);

  const visibles = useMemo(
    () =>
      siembras.filter(
        (s) =>
          (filtroEstado === 'todos' || s.estado === filtroEstado) &&
          (!filtroLote || s.lote_id === filtroLote)
      ),
    [siembras, filtroEstado, filtroLote]
  );

  const alGuardar = async () => {
    setModal(null);
    await cargar();
  };

  const hayLotes = lotes.some((l) => l.estado === 'activo');
  const hayCultivos = cultivos.some((c) => c.estado === 'activo');
  const puedeRegistrar = puedeCrear && hayLotes && hayCultivos;

  if (cargando) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { clave: 'en_curso', nombre: 'En curso' },
            { clave: 'cosechado', nombre: 'Cosechadas' },
            { clave: 'perdido', nombre: 'Perdidas' },
            { clave: 'todos', nombre: 'Todas' },
          ].map((f) => (
            <button
              key={f.clave}
              onClick={() => setFiltroEstado(f.clave)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                filtroEstado === f.clave
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {f.nombre}
            </button>
          ))}
        </div>

        <select className="input !w-auto" value={filtroLote} onChange={(e) => setFiltroLote(e.target.value)}>
          <option value="">Todos los lotes</option>
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>

        {puedeCrear && (
          <button
            onClick={() => setModal({ tipo: 'form', siembra: null })}
            disabled={!puedeRegistrar}
            className="btn-primary ml-auto"
          >
            <Plus className="h-4 w-4" /> Registrar siembra
          </button>
        )}
      </div>

      {puedeCrear && !puedeRegistrar && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Para registrar una siembra necesitas al menos un lote activo (módulo Hacienda) y un cultivo activo
          (pestaña Cultivos).
        </p>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <Sprout className="h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold">No hay siembras para mostrar</p>
          <p className="text-sm text-stone-500">
            {puedeRegistrar ? 'Registra la primera con el botón "Registrar siembra".' : 'Aún no hay siembras registradas.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((s) => {
            const estado = ESTADOS_SIEMBRA[s.estado];
            const enCurso = s.estado === 'en_curso';
            const dias = diasDesde(s.fecha_siembra);
            const total = Math.max(diasEntre(s.fecha_siembra, s.fecha_estimada_cosecha), 1);
            const pct = Math.min(100, Math.max(0, (dias / total) * 100));
            const restantes = total - dias;
            const etapa = etapaActual(etapasPorCultivo[s.cultivo_id] || [], dias);

            return (
              <div key={s.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">
                      {s.cultivos?.nombre_comun}
                      {s.cultivos?.variedad && (
                        <span className="text-sm font-medium text-green-700"> · {s.cultivos.variedad}</span>
                      )}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-stone-600">
                      <MapPin className="h-3.5 w-3.5" /> {s.lotes?.nombre ?? 'Lote'} · {fmt(s.area_ha)} ha
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estado.clase}`}>{estado.nombre}</span>
                </div>

                {enCurso ? (
                  <>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-800">{etapa.texto}</span>
                      <span className="text-stone-500">{dias < 0 ? 'Programada' : `Día ${dias}`}</span>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className={`mt-2 text-xs ${restantes < 0 ? 'font-semibold text-amber-700' : 'text-stone-500'}`}>
                      {restantes < 0
                        ? `Cosecha atrasada ${Math.abs(restantes)} días`
                        : restantes === 0
                        ? 'Cosecha estimada para hoy'
                        : `Faltan ${restantes} días para la cosecha`}
                    </p>
                  </>
                ) : (
                  <div className="mt-4 rounded-xl bg-stone-50 p-3 text-sm text-stone-600">
                    {s.estado === 'cosechado'
                      ? `Cosechada el ${formatearDia(s.fecha_cosecha_real)}`
                      : 'Siembra perdida'}
                  </div>
                )}

                <dl className="mt-4 space-y-1 text-xs text-stone-500">
                  <div className="flex justify-between">
                    <dt>Siembra</dt>
                    <dd className="font-medium text-stone-700">{formatearDia(s.fecha_siembra)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Cosecha estimada</dt>
                    <dd className="font-medium text-stone-700">{formatearDia(s.fecha_estimada_cosecha)}</dd>
                  </div>
                  {s.densidad && (
                    <div className="flex justify-between">
                      <dt>Densidad</dt>
                      <dd className="font-medium text-stone-700">{fmt(s.densidad, 0)} plantas/ha</dd>
                    </div>
                  )}
                </dl>

                {s.observaciones && <p className="mt-3 text-sm text-stone-600">{s.observaciones}</p>}

                {puedeEditar && enCurso && (
                  <div className="mt-auto flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                    <button onClick={() => setModal({ tipo: 'form', siembra: s })} className="btn-ghost flex-1 !px-2 !py-2">
                      <Pencil className="h-4 w-4" /> Editar
                    </button>
                    <button onClick={() => setModal({ tipo: 'cosechado', siembra: s })} className="btn-ghost flex-1 !px-2 !py-2 text-green-700">
                      <CheckCircle2 className="h-4 w-4" /> Cosechar
                    </button>
                    <button onClick={() => setModal({ tipo: 'perdido', siembra: s })} className="btn-ghost flex-1 !px-2 !py-2 text-red-600">
                      <XCircle className="h-4 w-4" /> Perdida
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        abierto={modal?.tipo === 'form'}
        titulo={modal?.siembra ? 'Editar siembra' : 'Registrar siembra'}
        onCerrar={() => setModal(null)}
      >
        {modal?.tipo === 'form' && (
          <FormSiembra
            siembra={modal.siembra}
            lotes={lotes}
            cultivos={cultivos}
            siembras={siembras}
            onGuardado={alGuardar}
            onCerrar={() => setModal(null)}
          />
        )}
      </Modal>

      <Modal
        abierto={modal?.tipo === 'cosechado' || modal?.tipo === 'perdido'}
        titulo={modal?.tipo === 'cosechado' ? 'Registrar cosecha' : 'Registrar pérdida'}
        onCerrar={() => setModal(null)}
      >
        {(modal?.tipo === 'cosechado' || modal?.tipo === 'perdido') && (
          <FormCierre siembra={modal.siembra} tipo={modal.tipo} onGuardado={alGuardar} onCerrar={() => setModal(null)} />
        )}
      </Modal>
    </div>
  );
}