import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  HardHat,
  IdCard,
  Link2,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import FormTrabajador from './FormTrabajador';
import {
  guardarTrabajador,
  listarTrabajadores,
  listarUsuariosAcceso,
} from '../../services/personalService';
import { mensajeError } from '../../utils/errores';
import { confirmar, mostrarError, notificar } from '../../utils/alertas';
import {
  ESPECIALIDADES,
  claseEspecialidad,
  iniciales,
  nombreCompleto,
  nombreEspecialidad,
} from '../../utils/personal';
import { formatearDia } from '../../utils/suelo';

function Resumen({ etiqueta, valor }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">{etiqueta}</p>
      <p className="mt-1 text-2xl font-extrabold">{valor}</p>
    </div>
  );
}

export default function Personal() {
  const { puede, esAdmin } = useAuth();
  const puedeCrear = puede('personal', 'crear');
  const puedeEditar = puede('personal', 'actualizar');

  const [trabajadores, setTrabajadores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activo');
  const [filtroEsp, setFiltroEsp] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null); // null | { trabajador: objeto | null }

  const cargar = useCallback(async () => {
    try {
      const [t, u] = await Promise.all([
        listarTrabajadores(),
        esAdmin ? listarUsuariosAcceso() : Promise.resolve([]),
      ]);
      setTrabajadores(t);
      setUsuarios(u);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar el personal.'));
    } finally {
      setCargando(false);
    }
  }, [esAdmin]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cuentaPorTrabajador = useMemo(() => {
    const mapa = {};
    usuarios.forEach((u) => {
      if (u.trabajador_id) mapa[u.trabajador_id] = u;
    });
    return mapa;
  }, [usuarios]);

  const conteo = useMemo(() => {
    const activos = trabajadores.filter((t) => t.estado === 'activo');
    const porEsp = (esp) => activos.filter((t) => t.especialidad === esp).length;
    return {
      activos: activos.length,
      agronomo: porEsp('agronomo'),
      tecnico: porEsp('tecnico'),
      jornalero: porEsp('jornalero'),
    };
  }, [trabajadores]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return trabajadores.filter(
      (t) =>
        (filtroEstado === 'todos' || t.estado === filtroEstado) &&
        (!filtroEsp || t.especialidad === filtroEsp) &&
        `${nombreCompleto(t)} ${t.cargo ?? ''} ${puedeEditar ? t.cedula : ''}`.toLowerCase().includes(q)
    );
  }, [trabajadores, filtroEstado, filtroEsp, busqueda, puedeEditar]);

  const cambiarEstado = async (t) => {
    const desactivar = t.estado === 'activo';

    if (desactivar) {
      const acepta = await confirmar({
        titulo: `¿Desactivar a ${nombreCompleto(t)}?`,
        texto:
          'No podrá asignarse a nuevas actividades. Podrás volver a activarlo cuando quieras.',
        confirmar: 'Sí, desactivar',
        peligro: true,
      });
      if (!acepta) return;
    }

    try {
      await guardarTrabajador({ estado: desactivar ? 'inactivo' : 'activo' }, t.id);
      await cargar();
      notificar(desactivar ? 'Trabajador desactivado' : 'Trabajador activado');
    } catch (err) {
      mostrarError('No se pudo cambiar el estado', mensajeError(err));
    }
  };

  const alGuardar = async (mensaje) => {
    setModal(null);
    setAviso(mensaje || '');
    await cargar();
    if (!mensaje) notificar('Trabajador guardado correctamente');
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icono={HardHat}
        titulo="Personal"
        descripcion="Trabajadores de la hacienda, su especialidad y datos de contacto."
      />

      {cargando ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-7 w-7 animate-spin text-green-700" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Resumen etiqueta="Trabajadores activos" valor={conteo.activos} />
            <Resumen etiqueta="Agrónomos" valor={conteo.agronomo} />
            <Resumen etiqueta="Técnicos" valor={conteo.tecnico} />
            <Resumen etiqueta="Jornaleros" valor={conteo.jornalero} />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                className="input pl-10"
                placeholder="Buscar por nombre o cargo"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <select className="input !w-auto" value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)}>
              <option value="">Todas las especialidades</option>
              {ESPECIALIDADES.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.nombre}
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

            {puedeCrear && (
              <button onClick={() => setModal({ trabajador: null })} className="btn-primary ml-auto">
                <Plus className="h-4 w-4" /> Nuevo trabajador
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {aviso && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {aviso}
            </div>
          )}

          {visibles.length === 0 ? (
            <div className="card flex flex-col items-center p-12 text-center">
              <Users className="h-10 w-10 text-stone-300" />
              <p className="mt-3 font-semibold">No hay trabajadores para mostrar</p>
              <p className="text-sm text-stone-500">
                {puedeCrear ? 'Registra el primero con el botón "Nuevo trabajador".' : 'Aún no se han registrado trabajadores.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((t) => {
                const cuenta = cuentaPorTrabajador[t.id];
                return (
                  <div key={t.id} className={`card flex flex-col p-5 ${t.estado === 'inactivo' ? 'opacity-70' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-base font-bold text-green-800">
                        {iniciales(t)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold">{nombreCompleto(t)}</h3>
                        <p className="truncate text-sm text-stone-500">{t.cargo || 'Sin cargo definido'}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${claseEspecialidad(t.especialidad)}`}>
                        {nombreEspecialidad(t.especialidad)}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-1.5 text-sm text-stone-600">
                      {t.telefono && (
                        <li className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-stone-400" /> {t.telefono}
                        </li>
                      )}
                      {t.correo && (
                        <li className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-stone-400" /> <span className="truncate">{t.correo}</span>
                        </li>
                      )}
                      {puedeEditar && (
                        <li className="flex items-center gap-2">
                          <IdCard className="h-4 w-4 text-stone-400" /> {t.cedula}
                        </li>
                      )}
                      {t.fecha_ingreso && (
                        <li className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-stone-400" /> Ingreso: {formatearDia(t.fecha_ingreso)}
                        </li>
                      )}
                    </ul>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {t.estado === 'inactivo' && (
                        <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600">
                          Inactivo
                        </span>
                      )}
                      {cuenta && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">
                          <Link2 className="h-3 w-3" /> Con acceso al sistema
                        </span>
                      )}
                    </div>

                    {t.observaciones && <p className="mt-3 text-sm text-stone-500">{t.observaciones}</p>}

                    {puedeEditar && (
                      <div className="mt-auto flex gap-2 border-t border-stone-100 pt-4">
                        <button onClick={() => setModal({ trabajador: t })} className="btn-ghost mt-4 flex-1 !py-2">
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <button onClick={() => cambiarEstado(t)} className="btn-ghost mt-4 flex-1 !py-2">
                          <Power className="h-4 w-4" /> {t.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        abierto={Boolean(modal)}
        titulo={modal?.trabajador ? `Editar a ${nombreCompleto(modal.trabajador)}` : 'Nuevo trabajador'}
        onCerrar={() => setModal(null)}
      >
        {modal && (
          <FormTrabajador
            trabajador={modal.trabajador}
            usuarios={usuarios}
            esAdmin={esAdmin}
            onGuardado={alGuardar}
            onCerrar={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}