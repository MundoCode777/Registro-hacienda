import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { guardarTrabajador, vincularUsuario } from '../../services/personalService';
import { mensajeError } from '../../utils/errores';
import { ESPECIALIDADES, cedulaValida } from '../../utils/personal';
import { hoyISO } from '../../utils/suelo';

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
  const [usuarioId, setUsuarioId] = useState(usuarioInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  // Cuentas que se pueden vincular: libres o la que ya tiene este trabajador
  const cuentas = usuarios.filter((u) => !u.trabajador_id || u.id === usuarioInicial);

  const avisoCedula = form.cedula.length === 10 && !cedulaValida(form.cedula);

  const guardar = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(form.cedula)) {
      setError('La cédula debe tener exactamente 10 dígitos.');
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

    // Vincular la cuenta de acceso (solo si el administrador la cambió)
    let aviso = '';
    if (esAdmin && usuarioId !== usuarioInicial) {
      try {
        await vincularUsuario(guardado.id, usuarioId || null);
      } catch (err) {
        aviso =
          err.code === '23505'
            ? 'El trabajador se guardó, pero esa cuenta ya está vinculada a otro trabajador.'
            : `El trabajador se guardó, pero no se pudo vincular la cuenta: ${mensajeError(err)}`;
      }
    }

    setGuardando(false);
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
          <label className="label">Correo</label>
          <input type="email" className="input" value={form.correo} onChange={set('correo')} />
        </div>
      </div>

      {esAdmin && (
        <div>
          <label className="label">Cuenta de acceso al sistema (opcional)</label>
          <select className="input" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            <option value="">Sin cuenta vinculada</option>
            {cuentas.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre_completo} · {u.correo}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-stone-500">
            Vincula a este trabajador con su usuario para que, en la Agenda, vea sus propias actividades.
          </p>
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