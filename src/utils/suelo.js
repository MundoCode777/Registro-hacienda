export const TIPOS_SUELO = [
  { valor: 'franco', nombre: 'Franco' },
  { valor: 'arcilloso', nombre: 'Arcilloso' },
  { valor: 'arenoso', nombre: 'Arenoso' },
  { valor: 'limoso', nombre: 'Limoso' },
  { valor: 'franco-arcilloso', nombre: 'Franco-arcilloso' },
  { valor: 'franco-arenoso', nombre: 'Franco-arenoso' },
  { valor: 'franco-limoso', nombre: 'Franco-limoso' },
];

export const nombreTipoSuelo = (valor) =>
  TIPOS_SUELO.find((t) => t.valor === valor)?.nombre ?? valor ?? '—';

// Interpretación sencilla del pH para quien no es agrónomo
export const interpretarPH = (ph) => {
  const n = Number(ph);
  if (ph === null || ph === undefined || Number.isNaN(n)) {
    return { texto: '—', clase: 'bg-stone-100 text-stone-600' };
  }
  if (n < 5.5) return { texto: 'Ácido', clase: 'bg-red-100 text-red-700' };
  if (n < 6.5) return { texto: 'Ligeramente ácido', clase: 'bg-amber-100 text-amber-700' };
  if (n <= 7.5) return { texto: 'Neutro', clase: 'bg-green-100 text-green-800' };
  return { texto: 'Alcalino', clase: 'bg-blue-100 text-blue-700' };
};

// Convierte el texto de un input en número (o null si está vacío)
export const aNumero = (valor) =>
  valor === '' || valor === null || valor === undefined ? null : Number(valor);

// Convierte un valor de la base de datos en texto para un input
export const aTexto = (valor) => (valor === null || valor === undefined ? '' : String(valor));

export const fmt = (valor, decimales = 2) =>
  valor === null || valor === undefined
    ? '—'
    : Number(valor).toLocaleString('es-EC', { maximumFractionDigits: decimales });

// Fecha de hoy como YYYY-MM-DD en hora local
export const hoyISO = () => new Date().toLocaleDateString('en-CA');

export const formatearDia = (fecha) =>
  fecha
    ? new Date(`${fecha}T00:00:00`).toLocaleDateString('es-EC', { dateStyle: 'medium' })
    : '—';