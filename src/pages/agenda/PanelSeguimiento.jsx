import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, TrendingUp } from 'lucide-react';
import { listarSeguimientos, registrarSeguimiento } from '../../services/agendaService';
import { mensajeError } from '../../utils/errores';
import { notificar } from '../../utils/alertas';
import { formatearFecha } from '../../utils/formato';
import { estaCerrada } from '../../utils/agenda';

export default function PanelSeguimiento({ actividad, puedeActualizar, onCambio }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [valor, setValor] = useState(0);
  const [novedades, setNovedades] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cerrada = estaCerrada(actividad);

  const cargar = useCallback(async () => {
    try {
      setItems(await listarSeguimientos(actividad.id));
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar el seguimiento.'));
    } finally {
      setCargando(false);
    }
  }, [actividad.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ultimo = items.length ? Math.max(...items.map((i) => i.porcentaje)) : 0;

  useEffect(() => {
    setValor(ultimo);
  }, [ultimo]);

  const registrar = async (e) => {
    e.preventDefault();
    setError('');
    if (valor === ultimo && !novedades.trim()) {
      setError('Mueve el avance o escribe una novedad.');
      return;
    }
    setGuardando(true);
    try {
      await registrarSeguimiento({
        actividad_id: actividad.id,
        porcentaje: valor,
        novedades: novedades.trim() || null,
      });
      setNovedades('');
      await cargar();
      await onCambio();
      notificar('Avance registrado');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo registrar el avance.'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div>
      {puedeActualizar && !cerrada && (
        <form onSubmit={registrar} className="mb-6 space-y-4 rounded-2xl bg-stone-50 p-4">
          <div>
            <div className="mb-1 flex items-end justify-between">
              <label className="label !mb-0">Avance de la actividad</label>
              <span className="text-2xl font-extrabold text-green-800">{valor} %</span>
            </div>
            <input
              type="range"
              min={ultimo}
              max={100}
              step={1}
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              disabled={ultimo === 100}
              className="w-full accent-green-700"
            />
            <div className="flex justify-between text-xs text-stone-500">
              <span>{ultimo} % (último)</span>
              {ultimo < 100 && (
                <button type="button" onClick={() => setValor(100)} className="font-semibold text-green-700 hover:underline">
                  Marcar 100 %
                </button>
              )}
            </div>
          </div>

          {ultimo === 100 && (
            <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
              El avance ya está al 100 %. Puedes completar la actividad desde la pestaña Resumen.
            </p>
          )}

          <div>
            <label className="label">Novedades</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Qué se hizo, problemas encontrados, materiales usados…"
              value={novedades}
              onChange={(e) => setNovedades(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={guardando} className="btn-primary">
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar avance
          </button>
        </form>
      )}

      {cerrada && (
        <p className="mb-5 rounded-xl bg-stone-100 p-3 text-sm text-stone-600">
          La actividad está cerrada, por eso ya no admite nuevos reportes.
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 p-8 text-center">
          <TrendingUp className="h-9 w-9 text-stone-300" />
          <p className="mt-2 font-semibold">Sin reportes de avance</p>
          <p className="text-sm text-stone-500">Los reportes aparecerán aquí en orden cronológico.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="flex gap-4 rounded-2xl border border-stone-200 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-extrabold text-green-800">
                {i.porcentaje}%
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-stone-500">
                  {formatearFecha(i.fecha_reporte)} · {i.reportado_por_nombre || 'Usuario'}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-stone-700">
                  {i.novedades || <span className="text-stone-400">Sin novedades</span>}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {!puedeActualizar && !cerrada && error && (
        <p className="mt-4 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}