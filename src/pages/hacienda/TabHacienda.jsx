import { useState } from 'react';
import { AlertCircle, Loader2, Mail, MapPin, Pencil, Phone, Ruler, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CampoCoordenadas from '../../components/ui/CampoCoordenadas';
import { guardarHacienda } from '../../services/haciendaService';
import { mensajeError } from '../../utils/errores';
import { aNumero, aTexto, fmt } from '../../utils/suelo';

const aForm = (h) => ({
  nombre: h?.nombre ?? 'Hacienda La Querencia',
  ubicacion: h?.ubicacion ?? '',
  extension_ha: aTexto(h?.extension_ha),
  propietario: h?.propietario ?? '',
  telefono: h?.telefono ?? '',
  correo: h?.correo ?? '',
  latitud: aTexto(h?.latitud),
  longitud: aTexto(h?.longitud),
});

function Dato({ icono: Icono, etiqueta, valor }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <Icono className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500">{etiqueta}</p>
        <p className="font-semibold">{valor || '—'}</p>
      </div>
    </div>
  );
}

export default function TabHacienda({ hacienda, onGuardada }) {
  const { puede } = useAuth();
  const puedeCrear = puede('hacienda', 'crear');
  const puedeEditar = puede('hacienda', 'actualizar');

  const [editando, setEditando] = useState(!hacienda);
  const [form, setForm] = useState(aForm(hacienda));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const guardada = await guardarHacienda(
        {
          nombre: form.nombre.trim(),
          ubicacion: form.ubicacion.trim() || null,
          extension_ha: aNumero(form.extension_ha),
          propietario: form.propietario.trim() || null,
          telefono: form.telefono.trim() || null,
          correo: form.correo.trim() || null,
          latitud: aNumero(form.latitud),
          longitud: aNumero(form.longitud),
        },
        hacienda?.id
      );
      onGuardada(guardada);
      setForm(aForm(guardada));
      setEditando(false);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar la hacienda.'));
    } finally {
      setGuardando(false);
    }
  };

  if (!hacienda && !puedeCrear) {
    return (
      <div className="card p-12 text-center">
        <p className="font-semibold">Aún no se ha registrado la hacienda</p>
        <p className="text-sm text-stone-500">Pide al administrador que complete sus datos.</p>
      </div>
    );
  }

  /* ----------------------------- Vista ----------------------------- */
  if (!editando && hacienda) {
    return (
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold">{hacienda.nombre}</h2>
            <p className="text-sm text-stone-500">Registro maestro del sistema</p>
          </div>
          {puedeEditar && (
            <button
              onClick={() => {
                setForm(aForm(hacienda));
                setEditando(true);
              }}
              className="btn-ghost border border-stone-300"
            >
              <Pencil className="h-4 w-4" /> Editar
            </button>
          )}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Dato icono={MapPin} etiqueta="Ubicación" valor={hacienda.ubicacion} />
          <Dato icono={Ruler} etiqueta="Extensión total" valor={`${fmt(hacienda.extension_ha)} ha`} />
          <Dato icono={User} etiqueta="Propietario" valor={hacienda.propietario} />
          <Dato icono={Phone} etiqueta="Teléfono" valor={hacienda.telefono} />
          <Dato icono={Mail} etiqueta="Correo" valor={hacienda.correo} />
          <Dato
            icono={MapPin}
            etiqueta="Coordenadas GPS"
            valor={
              hacienda.latitud != null && hacienda.longitud != null
                ? `${hacienda.latitud}, ${hacienda.longitud}`
                : ''
            }
          />
        </div>
      </div>
    );
  }

  /* ---------------------------- Formulario ---------------------------- */
  return (
    <form onSubmit={guardar} className="card max-w-3xl space-y-5 p-6">
      <h2 className="text-lg font-bold">{hacienda ? 'Editar hacienda' : 'Registrar la hacienda'}</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Nombre</label>
          <input className="input" value={form.nombre} onChange={set('nombre')} required />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Ubicación</label>
          <input
            className="input"
            placeholder="Cantón, provincia o sector"
            value={form.ubicacion}
            onChange={set('ubicacion')}
          />
        </div>

        <div>
          <label className="label">Extensión total (ha)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="input"
            value={form.extension_ha}
            onChange={set('extension_ha')}
            required
          />
        </div>

        <div>
          <label className="label">Propietario</label>
          <input className="input" value={form.propietario} onChange={set('propietario')} />
        </div>

        <div>
          <label className="label">Teléfono</label>
          <input className="input" value={form.telefono} onChange={set('telefono')} />
        </div>

        <div>
          <label className="label">Correo</label>
          <input type="email" className="input" value={form.correo} onChange={set('correo')} />
        </div>

        <div className="sm:col-span-2">
          <CampoCoordenadas
            latitud={form.latitud}
            longitud={form.longitud}
            onChange={(c) => setForm({ ...form, ...c })}
          />
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
          Guardar
        </button>
        {hacienda && (
          <button type="button" onClick={() => setEditando(false)} className="btn-ghost">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}