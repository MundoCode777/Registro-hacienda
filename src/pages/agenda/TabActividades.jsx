import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Loader2,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import CalendarioMes from './CalendarioMes';
import TarjetaActividad from './TarjetaActividad';
import FormActividad from './FormActividad';
import DetalleActividad from './DetalleActividad';
import {
  listarActividades,
  listarSiembrasEnCurso,
  listarTipos,
  listarTrabajadoresBasico,
} from '../../services/agendaService';
import { listarLotesBasico } from '../../services/cultivosService';
import { mensajeError } from '../../utils/errores';
import { notificar } from '../../utils/alertas';
import { hoyISO } from '../../utils/suelo';
import {
  MESES,
  PRIORIDADES,
  esGestor,
  estaAtrasada,
  estaCerrada,
  rangoMes,
  tituloDia,
} from '../../utils/agenda';

const FILTROS_ESTADO = [
  { clave: 'todas', nombre: 'Todas' },
  { clave: 'activas', nombre: 'Activas' },
  { clave: 'atrasadas', nombre: 'Atrasadas' },
  { clave: 'completada', nombre: 'Completadas' },
  { clave: 'cancelada', nombre: 'Canceladas' },
];

export default function TabActividades() {
  const { rol, perfil, puede } = useAuth();
  const gestor = esGestor(rol);
  const puedeProgramar = puede('agenda', 'crear');
  const hoy = hoyISO();

  const [anio, setAnio] = useState(Number(hoy.slice(0, 4)));
  const [mes, setMes] = useState(Number(hoy.slice(5, 7)) - 1);
  const [vista, setVista] = useState('calendario');
  const [diaSel, setDiaSel] = useState(hoy);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroLote, setFiltroLote] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const [actividades, setActividades] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [siembras, setSiembras] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [formulario, setFormulario] = useState(null); // { actividad, fecha }
  const [abiertaId, setAbiertaId] = useState(null);
  const peticion = useRef(0);

  const rango = useMemo(() => rangoMes(anio, mes), [anio, mes]);

  const cargar = useCallback(async () => {
    const id = peticion.current + 1;
    peticion.current = id;
    try {
      const datos = await listarActividades(rango.desde, rango.hasta);
      if (id !== peticion.current) return; // llegó una petición más nueva
      setActividades(datos);
      setError('');
    } catch (err) {
      if (id === peticion.current) setError(mensajeError(err, 'No se pudo cargar la agenda.'));
    } finally {
      if (id === peticion.current) setCargando(false);
    }
  }, [rango]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Catálogos para formularios y filtros
  useEffect(() => {
    (async () => {
      try {
        const [t, l, s, w] = await Promise.all([
          listarTipos(),
          listarLotesBasico(),
          listarSiembrasEnCurso(),
          listarTrabajadoresBasico(),
        ]);
        setTipos(t);
        setLotes(l);
        setSiembras(s);
        setTrabajadores(w);
      } catch (err) {
        setError(mensajeError(err, 'No se pudieron cargar los datos de apoyo.'));
      }
    })();
  }, []);

  const mapaTrab = useMemo(() => {
    const m = {};
    trabajadores.forEach((t) => {
      m[t.id] = t;
    });
    return m;
  }, [trabajadores]);

  const visibles = useMemo(
    () =>
      actividades.filter((a) => {
        if (filtroEstado === 'atrasadas') {
          if (!estaAtrasada(a)) return false;
        } else {
          if (a.fecha_programada < rango.desde || a.fecha_programada > rango.hasta) return false;
          if (filtroEstado === 'activas' && estaCerrada(a)) return false;
          if ((filtroEstado === 'completada' || filtroEstado === 'cancelada') && a.estado !== filtroEstado) {
            return false;
          }
        }
        if (filtroPrioridad && a.prioridad !== filtroPrioridad) return false;
        if (filtroLote && a.lote_id !== filtroLote) return false;
        if (filtroTipo && a.tipo_actividad_id !== filtroTipo) return false;
        return true;
      }),
    [actividades, filtroEstado, filtroPrioridad, filtroLote, filtroTipo, rango]
  );

  const totalAtrasadas = useMemo(() => actividades.filter(estaAtrasada).length, [actividades]);

  const porDia = useMemo(() => {
    const m = {};
    visibles.forEach((a) => {
      (m[a.fecha_programada] ||= []).push(a);
    });
    return m;
  }, [visibles]);

  const grupos = useMemo(() => {
    const m = new Map();
    visibles.forEach((a) => {
      if (!m.has(a.fecha_programada)) m.set(a.fecha_programada, []);
      m.get(a.fecha_programada).push(a);
    });
    return [...m.entries()];
  }, [visibles]);

  const delDia = diaSel ? porDia[diaSel] || [] : [];
  const abierta = actividades.find((a) => a.id === abiertaId) || null;

  const cambiarMes = (delta) => {
    const f = new Date(anio, mes + delta, 1);
    setAnio(f.getFullYear());
    setMes(f.getMonth());
    setDiaSel(null);
  };

  const irHoy = () => {
    setAnio(Number(hoy.slice(0, 4)));
    setMes(Number(hoy.slice(5, 7)) - 1);
    setDiaSel(hoy);
  };

  const elegirEstado = (clave) => {
    setFiltroEstado(clave);
    if (clave === 'atrasadas') setVista('lista');
  };

  const alGuardarForm = async (mensaje, fecha) => {
    setFormulario(null);
    if (fecha) {
      setAnio(Number(fecha.slice(0, 4)));
      setMes(Number(fecha.slice(5, 7)) - 1);
      setDiaSel(fecha);
    }
    await cargar();
    notificar(mensaje);
  };

  const hayLotes = lotes.some((l) => l.estado === 'activo');
  const hayTipos = tipos.some((t) => t.estado === 'activo');
  const puedeAbrirForm = puedeProgramar && hayLotes && hayTipos;

  if (!gestor && !perfil.trabajador_id) {
    return (
      <div className="card flex flex-col items-center p-12 text-center">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <p className="mt-3 font-semibold">Tu cuenta aún no está vinculada a un trabajador</p>
        <p className="mt-1 max-w-md text-sm text-stone-500">
          Pide al administrador que vincule tu usuario con tu ficha en el módulo Personal. Después cierra sesión y
          vuelve a entrar para ver tus actividades.
        </p>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div>
      {/* Barra superior */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => cambiarMes(-1)} className="btn-ghost !px-2.5" title="Mes anterior">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="min-w-[9.5rem] text-center text-lg font-extrabold">
            {MESES[mes]} {anio}
          </h2>
          <button onClick={() => cambiarMes(1)} className="btn-ghost !px-2.5" title="Mes siguiente">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <button onClick={irHoy} className="btn-ghost border border-stone-300 !py-2">
          Hoy
        </button>

        <div className="flex rounded-xl border border-stone-300 bg-white p-1">
          {[
            { clave: 'calendario', nombre: 'Calendario', icono: CalendarDays },
            { clave: 'lista', nombre: 'Lista', icono: List },
          ].map(({ clave, nombre, icono: Icono }) => (
            <button
              key={clave}
              onClick={() => setVista(clave)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                vista === clave ? 'bg-green-700 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Icono className="h-4 w-4" /> {nombre}
            </button>
          ))}
        </div>

        {puedeProgramar && (
          <button
            onClick={() => setFormulario({ actividad: null, fecha: diaSel || hoy })}
            disabled={!puedeAbrirForm}
            className="btn-primary ml-auto"
          >
            <Plus className="h-4 w-4" /> Programar actividad
          </button>
        )}
      </div>

      {puedeProgramar && !puedeAbrirForm && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Para programar actividades necesitas al menos un lote activo (módulo Hacienda) y un tipo de actividad activo.
        </p>
      )}

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTROS_ESTADO.map((f) => (
          <button
            key={f.clave}
            onClick={() => elegirEstado(f.clave)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              filtroEstado === f.clave
                ? 'border-green-700 bg-green-700 text-white'
                : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {f.nombre}
          </button>
        ))}

        <select className="input !w-auto !py-1.5 text-sm" value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)}>
          <option value="">Toda prioridad</option>
          {Object.entries(PRIORIDADES).map(([valor, p]) => (
            <option key={valor} value={valor}>
              {p.nombre}
            </option>
          ))}
        </select>
        <select className="input !w-auto !py-1.5 text-sm" value={filtroLote} onChange={(e) => setFiltroLote(e.target.value)}>
          <option value="">Todos los lotes</option>
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>
        <select className="input !w-auto !py-1.5 text-sm" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {totalAtrasadas > 0 && filtroEstado !== 'atrasadas' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {totalAtrasadas === 1 ? 'Hay 1 actividad atrasada.' : `Hay ${totalAtrasadas} actividades atrasadas.`}
          </span>
          <button onClick={() => elegirEstado('atrasadas')} className="font-semibold underline">
            Verlas
          </button>
        </div>
      )}

      {/* Contenido */}
      {vista === 'calendario' ? (
        <>
          <CalendarioMes
            anio={anio}
            mes={mes}
            actividadesPorDia={porDia}
            diaSel={diaSel}
            onSelDia={setDiaSel}
          />

          {diaSel && (
            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">{tituloDia(diaSel)}</h3>
                {puedeAbrirForm && (
                  <button
                    onClick={() => setFormulario({ actividad: null, fecha: diaSel })}
                    className="btn-ghost border border-stone-300 !py-1.5 text-sm"
                  >
                    <Plus className="h-4 w-4" /> Programar para este día
                  </button>
                )}
              </div>
              {delDia.length === 0 ? (
                <p className="rounded-xl bg-stone-100 p-4 text-sm text-stone-500">No hay actividades este día.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {delDia.map((a) => (
                    <TarjetaActividad key={a.id} actividad={a} mapaTrab={mapaTrab} onAbrir={setAbiertaId} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : grupos.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <CalendarDays className="h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold">No hay actividades para mostrar</p>
          <p className="text-sm text-stone-500">Prueba con otro mes o cambia los filtros.</p>
        </div>
      ) : (
        grupos.map(([fecha, items]) => (
          <div key={fecha} className="mb-6">
            <h3 className="mb-2 text-sm font-bold text-stone-600">{tituloDia(fecha)}</h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((a) => (
                <TarjetaActividad key={a.id} actividad={a} mapaTrab={mapaTrab} onAbrir={setAbiertaId} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Formulario */}
      <Modal
        abierto={Boolean(formulario)}
        titulo={formulario?.actividad ? 'Editar actividad' : 'Programar actividad'}
        onCerrar={() => setFormulario(null)}
        ancho="max-w-2xl"
      >
        {formulario && (
          <FormActividad
            actividad={formulario.actividad}
            fechaInicial={formulario.fecha}
            tipos={tipos}
            lotes={lotes}
            siembras={siembras}
            trabajadores={trabajadores}
            onGuardado={alGuardarForm}
            onCerrar={() => setFormulario(null)}
          />
        )}
      </Modal>

      {/* Detalle */}
      <Modal
        abierto={Boolean(abierta)}
        titulo={abierta?.tipos_actividad?.nombre ?? 'Actividad'}
        onCerrar={() => setAbiertaId(null)}
        ancho="max-w-3xl"
      >
        {abierta && (
          <DetalleActividad
            actividad={abierta}
            mapaTrab={mapaTrab}
            trabajadores={trabajadores}
            onCambio={cargar}
            onEditar={(a) => {
              setAbiertaId(null);
              setFormulario({ actividad: a, fecha: a.fecha_programada });
            }}
          />
        )}
      </Modal>
    </div>
  );
}