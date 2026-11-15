export const formatearFecha = (fecha, vacio = '—') =>
  fecha
    ? new Date(fecha).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
    : vacio;

// Convierte el texto técnico del navegador en algo legible: "Chrome · Windows"
export const resumirDispositivo = (ua = '') => {
  const navegador = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
    ? 'Opera'
    : /Chrome\//.test(ua)
    ? 'Chrome'
    : /Firefox\//.test(ua)
    ? 'Firefox'
    : /Safari\//.test(ua)
    ? 'Safari'
    : 'Navegador';

  const sistema = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad/.test(ua)
    ? 'iOS'
    : /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS/.test(ua)
    ? 'macOS'
    : /Linux/.test(ua)
    ? 'Linux'
    : '';

  return sistema ? `${navegador} · ${sistema}` : navegador;
};