import { useState } from 'react';
import { Crosshair, Loader2, Map as MapIcon } from 'lucide-react';

const sonValidas = (lat, lon) =>
  lat !== '' &&
  lon !== '' &&
  !Number.isNaN(Number(lat)) &&
  !Number.isNaN(Number(lon)) &&
  Math.abs(Number(lat)) <= 90 &&
  Math.abs(Number(lon)) <= 180;

export default function CampoCoordenadas({ latitud, longitud, onChange }) {
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [verMapa, setVerMapa] = useState(false);

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setAviso('Tu navegador no permite obtener la ubicación.');
      return;
    }
    setBuscando(true);
    setAviso('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          latitud: pos.coords.latitude.toFixed(6),
          longitud: pos.coords.longitude.toFixed(6),
        });
        setBuscando(false);
      },
      () => {
        setAviso('No se pudo obtener la ubicación. Revisa el permiso del navegador.');
        setBuscando(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const valido = sonValidas(latitud, longitud);
  const lat = Number(latitud);
  const lon = Number(longitud);
  const mapaUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01}%2C${
    lat - 0.01
  }%2C${lon + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Latitud</label>
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            className="input"
            placeholder="-2.283300"
            value={latitud}
            onChange={(e) => onChange({ latitud: e.target.value, longitud })}
          />
        </div>
        <div>
          <label className="label">Longitud</label>
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            className="input"
            placeholder="-79.900000"
            value={longitud}
            onChange={(e) => onChange({ latitud, longitud: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={usarMiUbicacion} disabled={buscando} className="btn-ghost border border-stone-300 !py-2">
          {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
          Usar mi ubicación
        </button>
        {valido && (
          <button type="button" onClick={() => setVerMapa(!verMapa)} className="btn-ghost border border-stone-300 !py-2">
            <MapIcon className="h-4 w-4" /> {verMapa ? 'Ocultar mapa' : 'Ver en mapa'}
          </button>
        )}
      </div>

      {aviso && <p className="mt-2 text-xs text-amber-700">{aviso}</p>}

      {valido && verMapa && (
        <iframe
          title="Ubicación en el mapa"
          src={mapaUrl}
          className="mt-3 h-56 w-full rounded-xl border border-stone-200"
          loading="lazy"
        />
      )}
    </div>
  );
}