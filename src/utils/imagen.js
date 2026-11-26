// Pide la ubicación actual del dispositivo
export function obtenerUbicacion() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu dispositivo no permite obtener la ubicación.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision: pos.coords.accuracy,
        }),
      (err) => {
        const mensajes = {
          1: 'Debes permitir el acceso a la ubicación para guardar la evidencia.',
          2: 'No se pudo determinar tu ubicación. Revisa que el GPS esté activo.',
          3: 'La ubicación tardó demasiado. Intenta de nuevo en un lugar abierto.',
        };
        reject(new Error(mensajes[err.code] || 'No se pudo obtener la ubicación.'));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });
}

async function cargarImagen(archivo) {
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(archivo, { imageOrientation: 'from-image' });
    } catch (err) {
      // si falla, se usa el método clásico
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

// Reduce la foto, le escribe fecha, hora y coordenadas, y la devuelve como JPEG
export async function prepararEvidencia(archivo, { latitud, longitud, fecha }) {
  const origen = await cargarImagen(archivo);
  const anchoOriginal = origen.naturalWidth || origen.width;
  const altoOriginal = origen.naturalHeight || origen.height;

  const escala = Math.min(1, 1280 / Math.max(anchoOriginal, altoOriginal));
  const ancho = Math.round(anchoOriginal * escala);
  const alto = Math.round(altoOriginal * escala);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(origen, 0, 0, ancho, alto);
  if (typeof origen.close === 'function') origen.close();

  const tam = Math.max(14, Math.round(ancho / 45));
  const banda = Math.round(tam * 3.1);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
  ctx.fillRect(0, alto - banda, ancho, banda);
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${tam}px sans-serif`;
  ctx.textBaseline = 'top';

  const linea1 = fecha.toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
  const linea2 = `Lat ${latitud.toFixed(6)}   Lon ${longitud.toFixed(6)}`;
  ctx.fillText(linea1, Math.round(tam * 0.6), alto - banda + Math.round(tam * 0.45));
  ctx.fillText(linea2, Math.round(tam * 0.6), alto - banda + Math.round(tam * 1.65));

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))),
      'image/jpeg',
      0.82
    );
  });
}