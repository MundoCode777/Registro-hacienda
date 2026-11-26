import { useState } from 'react';
import { AlertCircle, Link2, Loader2, RefreshCw, UserPlus, UserX } from 'lucide-react';
import {
  crearCuentaAcceso,
  guardarTrabajador,
  vincularUsuario,
} from '../../services/personalService';
import { mensajeError } from '../../utils/errores';
import { mostrarCredenciales } from '../../utils/alertas';
import { ESPECIALIDADES, cedulaValida } from '../../utils/personal';
import { hoyISO } from '../../utils/suelo';

const OPCIONES_ACCESO = [
  {
    clave: 'ninguno',
    nombre: 'Sin acceso al sistema',
    ayuda: 'Solo aparece en la lista de personal.',
    icono: UserX,
  },
  {
    clave: 'nueva',
    nombre: 'Crear cuenta de acceso',
    ayuda: 'Se crea ahora con correo y contraseña. Verá sus actividades asignadas.',
    icono: UserPlus,
  },
  {
    clave: 'existente',
    nombre: 'Vincular una cuenta existente',
    ayuda: 'Para quien ya se registró en la aplicación.',
    icono: Link2,
  },
];

const generarPassword = () => {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(8);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => letras[b % letras.length]).join('');
};

const textoErrorAcceso = (err) =>
  err.code === '23505'
    ? 'esa cuenta ya está vinculada a otro trabajador.'
    : mensajeError(err);

export default function FormTrabajador({ trabajador, usuarios, esAdmin, onGuardado, onCerrar }) {
  const usuarioInicial = trabajador
    ? usuarios.find((u) => u.trabajador_id === trabajador.id)?.id ?? ''
    : '';

  const [form, setForm] = useState({
    nombres: trabajador?.nombres ?? '',
    apellidos: trabajador?.apellidos ?? '',
    cedula: trabajador?.cedula ?? '',
    cargo: trabajador?.cargo ?? '',
    especialidad: trabajador?.especialidad ?? 'jornalero',
    telefono: trabajador?.telefono ?? '',
    correo: trabajador?.correo ?? '',
    fecha_ingreso: trabajador?.fecha_ingreso ?? '',
    observaciones: trabajador?.observaciones ?? '',
  });
  const [modoAcceso, setModoAcceso] = useState(usuarioInicial ? 'existente' : 'ninguno');
  const [usuarioId, setUsuarioId] = useState(usuarioInicial);
  const [cuentaNueva, setCuentaNueva] = useState({ correo: '', password: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  // Cuentas que se pueden vincular: libres o la que ya tiene este trabajador
  const cuentas = usuarios.filter((u) => !u.trabajador_id || u.id === usuarioInicial);

  const avisoCedula = form.cedula.length === 10 && !cedulaValida(form.cedula);
  const correoCuenta = (cuentaNueva.correo || form.correo).trim();

  const guardar = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(form.cedula)) {
      setError('La cédula debe tener exactamente 10 dígitos.');
      return;
    }
    if (esAdmin && modoAcceso === 'nueva') {
      if (!correoCuenta) {
        setError('Escribe el correo con el que ingresará el trabajador.');
        return;
      }
      if (cuentaNueva.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }
    if (esAdmin && modoAcceso === 'existente' && !usuarioId) {
      setError('Selecciona la cuenta que quieres vincular.');
      return;
    }

    setGuardando(true);
    let guardado;
    try {
      guardado = await guardarTrabajador(
        {
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          cedula: form.cedula,
          cargo: form.cargo.trim() || null,
          especialidad: form.especialidad,
          telefono: form.telefono.trim() || null,
          correo: form.correo.trim() || null,
          fecha_ingreso: form.fecha_ingreso || null,
          observaciones: form.observaciones.trim() || null,
        },
        trabajador?.id
      );
    } catch (err) {
      setError(
        err.code === '23505'
          ? 'Ya existe un trabajador con esa cédula.'
          : mensajeError(err, 'No se pudo guardar el trabajador.')
      );
      setGuardando(false);
      return;
    }

    // Acceso al sistema (solo el administrador)
    let aviso = '';
    let credenciales = null;
    if (esAdmin) {
      try {
        if (modoAcceso === 'nueva') {
          const nuevoId = await crearCuentaAcceso({
            nombre: `${form.nombres} ${form.apellidos}`.trim(),
            correo: correoCuenta,
            password: cuentaNueva.password,
          });
          credenciales = {
            nombre: `${form.nombres} ${form.apellidos}`.trim(),
            correo: correoCuenta,
            password: cuentaNueva.password,
          };
          await vincularUsuario(guardado.id, nuevoId);
        } else if (modoAcceso === 'existente' && usuarioId !== usuarioInicial) {
          await vincularUsuario(guardado.id, usuarioId);
        } else if (modoAcceso === 'ninguno' && usuarioInicial) {
          await vincularUsuario(guardado.id, null);
        }
      } catch (err) {
        aviso = credenciales
          ? `La cuenta se creó, pero no se pudo vincular al trabajador: ${textoErrorAcceso(err)} Edítalo y usa "Vincular una cuenta existente".`
          : `El trabajador se guardó, pero no se pudo configurar el acceso: ${textoErrorAcceso(err)}`;
      }
    }

    setGuardando(false);
    if (credenciales) await mostrarCredenciales(credenciales);
    onGuardado(aviso);
  };

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Nombres</label>
          <input className="input" value={form.nombres} onChange={set('nombres')} required />
        </div>
        <div>
          <label className="label">Apellidos</label>
          <input className="input" value={form.apellidos} onChange={set('apellidos')} required />
        </div>

        <div>
          <label className="label">Cédula</label>
          <input
            className="input"
            inputMode="numeric"
            maxLength={10}
            placeholder="10 dígitos"
            value={form.cedula}
            onChange={(e) => setForm({ ...form, cedula: e.target.value.replace(/\D/g, '') })}
            required
          />
          {avisoCedula && (
            <p className="mt-1 text-xs text-amber-700">
              Este número no parece una cédula ecuatoriana válida. Revísalo antes de guardar.
            </p>
          )}
        </div>
        <div>
          <label className="label">Fecha de ingreso</label>
          <input type="date" max={hoyISO()} className="input" value={form.fecha_ingreso} onChange={set('fecha_ingreso')} />
        </div>

        <div>
          <label className="label">Especialidad</label>
          <select className="input" value={form.especialidad} onChange={set('especialidad')}>
            {ESPECIALIDADES.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Cargo</label>
          <input className="input" placeholder="Ej. Fumigador" value={form.cargo} onChange={set('cargo')} />
        </div>

        <div>
          <label className="label">Teléfono</label>
          <input className="input" inputMode="tel" value={form.telefono} onChange={set('telefono')} />
        </div>
        <div>
          <label className="label">Correo de contacto</label>
          <input type="email" className="input" value={form.correo} onChange={set('correo')} />
        </div>
      </div>

      {esAdmin && (
        <div className="rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-semibold">Acceso al sistema</p>
          <p className="mb-3 text-xs text-stone-500">
            Para que el trabajador vea sus actividades en la Agenda necesita una cuenta vinculada.
          </p>

          <div className="space-y-2">
            {OPCIONES_ACCESO.map(({ clave, nombre, ayuda, icono: Icono }) => (
              <label
                key={clave}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  modoAcceso === clave
                    ? 'border-green-600 bg-green-50/60'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="modoAcceso"
                  checked={modoAcceso === clave}
                  onChange={() => setModoAcceso(clave)}
                  className="mt-1 accent-green-700"
                />
                <Icono className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
                <span>
                  <span className="block text-sm font-semibold">{nombre}</span>
                  <span className="block text-xs text-stone-500">{ayuda}</span>
                </span>
              </label>
            ))}
          </div>

          {modoAcceso === 'nueva' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Correo de acceso</label>
                <input
                  type="email"
                  className="input"
                  placeholder={form.correo || 'correo@ejemplo.com'}
                  value={cuentaNueva.correo}
                  onChange={(e) => setCuentaNueva({ ...cuentaNueva, correo: e.target.value })}
                />
                <p className="mt-1 text-xs text-stone-500">
                  Si lo dejas vacío se usa el correo de contacto.
                </p>
              </div>
              <div>
                <label className="label">Contraseña</label>
                <div className="flex gap-2">
                  <input
                    className="input font-mono"
                    placeholder="Mínimo 6 caracteres"
                    value={cuentaNueva.password}
                    onChange={(e) => setCuentaNueva({ ...cuentaNueva, password: e.target.value })}
                  />
                  <button
                    type="button"
                    title="Generar contraseña"
                    onClick={() => setCuentaNueva({ ...cuentaNueva, password: generarPassword() })}
                    className="btn-ghost shrink-0 border border-stone-300 !px-3"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {modoAcceso === 'existente' && (
            <div className="mt-4">
              <label className="label">Cuenta</label>
              {cuentas.length === 0 ? (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  No hay cuentas libres para vincular. Usa la opción "Crear cuenta de acceso".
                </p>
              ) : (
                <select className="input" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
                  <option value="">Selecciona…</option>
                  {cuentas.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre_completo} · {u.correo}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      )}

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
          {trabajador ? 'Guardar cambios' : 'Registrar trabajador'}
        </button>
        <button type="button" onClick={onCerrar} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}