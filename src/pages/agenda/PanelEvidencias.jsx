import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, ExternalLink, Loader2, MapPin } from 'lucide-react';
import { listarEvidencias, subirEvidencia } from '../../services/agendaService';
import { mensajeError } from '../../utils/errores';
import { notificar } from '../../utils/alertas';
import { formatearFecha } from '../../utils/formato';
import { obtenerUbicacion, prepararEvidencia } from '../../utils/imagen';
import { nombreTrab } from '../../utils/agenda';

export default function PanelEvidencias({ actividad, mapaTrab, puedeActualizar, onCambio }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [paso, setPaso] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const ubicacionRef = useRef(null);

  const puedeSubir = puedeActualizar && actividad.estado !== 'cancelada';

  const cargar = useCallback(async () => {
    try {
      setItems(await listarEvidencias(actividad.id));
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las evidencias.'));
    } finally {
      setCargando(false);
    }
  }, [actividad.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // La ubicación se pide en el mismo momento en que se abre la cámara
  const abrirCamara = () => {
    setError('');
    ubicacionRef.current = obtenerUbicacion().catch((err) => ({ error: err }));
    inputRef.current?.click();
  };

  const alElegir = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;

    try {
      setPaso('Obteniendo ubicación…');
      let ubicacion = ubicacionRef.current ? await ubicacionRef.current : null;
      ubicacionRef.current = null;
      if (!ubicacion) ubicacion = await obtenerUbicacion().catch((err) => ({ error: err }));
      if (ubicacion.error) throw ubicacion.error;

      setPaso('Procesando imagen…');
      const imagen = await prepararEvidencia(archivo, {
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
        fecha: new Date(),
      });

      setPaso('Subiendo…');
      await subirEvidencia({
        actividadId: actividad.id,
        imagen,
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
        precision: ubicacion.precision,
      });

      await cargar();
      await onCambio();
      notificar('Evidencia guardada');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar la evidencia.'));
    } finally {
      setPaso('');
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
      {puedeSubir && (
        <div className="mb-5 rounded-2xl bg-stone-50 p-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={alElegir}
          />
          <button type="button" onClick={abrirCamara} disabled={Boolean(paso)} className="btn-primary">
            {paso ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {paso || 'Tomar foto de evidencia'}
          </button>
          <p className="mt-2 text-xs text-stone-500">
            La foto se guarda con la fecha, la hora y tu ubicación. Debes permitir el acceso al GPS.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 p-8 text-center">
          <Camera className="h-9 w-9 text-stone-300" />
          <p className="mt-2 font-semibold">Sin evidencias fotográficas</p>
          <p className="text-sm text-stone-500">Las fotos verifican que el trabajo se hizo en el lugar.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((ev) => {
            const quien = ev.trabajador_id ? nombreTrab(mapaTrab[ev.trabajador_id]) : ev.subida_por_nombre;
            return (
              <div key={ev.id} className="overflow-hidden rounded-2xl border border-stone-200">
                {ev.url ? (
                  <a href={ev.url} target="_blank" rel="noreferrer" className="block">
                    <img src={ev.url} alt="Evidencia de la actividad" className="h-52 w-full object-cover" loading="lazy" />
                  </a>
                ) : (
                  <div className="flex h-52 items-center justify-center bg-stone-100 text-sm text-stone-400">
                    Imagen no disponible
                  </div>
                )}
                <div className="space-y-1 p-3 text-xs text-stone-600">
                  <p className="font-semibold text-stone-800">{formatearFecha(ev.tomada_en)}</p>
                  {quien && <p>Por {quien}</p>}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${ev.latitud}&mlon=${ev.longitud}#map=18/${ev.latitud}/${ev.longitud}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-green-700 hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {Number(ev.latitud).toFixed(5)}, {Number(ev.longitud).toFixed(5)}
                    {ev.precision_m != null && ` (±${Math.round(ev.precision_m)} m)`}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}