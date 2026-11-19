import { hoyISO } from './suelo';

export const TIPOS_CULTIVO = [
  { valor: 'anual', nombre: 'Anual' },
  { valor: 'semestral', nombre: 'Semestral' },
  { valor: 'perenne', nombre: 'Perenne' },
];

export const nombreTipo = (valor) => TIPOS_CULTIVO.find((t) => t.valor === valor)?.nombre ?? valor;

export const ETAPAS = [
  { valor: 'germinacion', nombre: 'Germinación', color: 'bg-lime-400' },
  { valor: 'desarrollo_vegetativo', nombre: 'Desarrollo vegetativo', color: 'bg-green-600' },
  { valor: 'floracion', nombre: 'Floración', color: 'bg-pink-400' },
  { valor: 'fructificacion', nombre: 'Fructificación', color: 'bg-orange-400' },
  { valor: 'maduracion', nombre: 'Maduración', color: 'bg-amber-500' },
  { valor: 'cosecha', nombre: 'Cosecha', color: 'bg-yellow-700' },
];

export const nombreEtapa = (valor) => ETAPAS.find((e) => e.valor === valor)?.nombre ?? valor;
export const colorEtapa = (valor) => ETAPAS.find((e) => e.valor === valor)?.color ?? 'bg-stone-400';

export const ESTADOS_SIEMBRA = {
  en_curso: { nombre: 'En curso', clase: 'bg-green-100 text-green-800' },
  cosechado: { nombre: 'Cosechado', clase: 'bg-amber-100 text-amber-800' },
  perdido: { nombre: 'Perdido', clase: 'bg-red-100 text-red-700' },
};

/* ------------------------------ Fechas ------------------------------ */
const aFecha = (iso) => new Date(`${iso}T00:00:00`);

export const sumarDias = (iso, dias) => {
  if (!iso || dias === null || dias === undefined || dias === '') return '';
  const d = aFecha(iso);
  d.setDate(d.getDate() + Number(dias));
  return d.toLocaleDateString('en-CA');
};

export const diasEntre = (desde, hasta) =>
  Math.round((aFecha(hasta) - aFecha(desde)) / 86400000);

export const diasDesde = (iso) => diasEntre(iso, hoyISO());

/* --------------------------- Etapas fenológicas --------------------------- */
export const ordenarEtapas = (etapas) => [...etapas].sort((a, b) => a.dia_inicio - b.dia_inicio);

// Etapa en la que está una siembra según los días transcurridos
export function etapaActual(etapas, dias) {
  if (dias < 0) return { texto: 'Por iniciar', etapa: null };
  const ordenadas = ordenarEtapas(etapas);
  if (ordenadas.length === 0) return { texto: 'Sin etapas definidas', etapa: null };

  const actual = ordenadas.find((e) => dias >= e.dia_inicio && dias <= e.dia_fin);
  if (actual) return { texto: nombreEtapa(actual.nombre), etapa: actual };

  const ultima = ordenadas[ordenadas.length - 1];
  return dias > ultima.dia_fin
    ? { texto: 'Ciclo cumplido', etapa: null }
    : { texto: 'Etapa no definida', etapa: null };
}

// Rangos de días del ciclo (0 a ciclo) que no pertenecen a ninguna etapa
export function diasSinEtapa(etapas, ciclo) {
  const huecos = [];
  let cursor = 0;
  ordenarEtapas(etapas).forEach((e) => {
    if (e.dia_inicio > cursor) huecos.push([cursor, e.dia_inicio - 1]);
    cursor = Math.max(cursor, e.dia_fin + 1);
  });
  if (cursor <= ciclo) huecos.push([cursor, ciclo]);
  return huecos;
}

export const textoRango = (min, max, unidad) => {
  if (min == null && max == null) return '—';
  if (min != null && max != null) return `${min} – ${max} ${unidad}`;
  return `${min ?? max} ${unidad}`;
};