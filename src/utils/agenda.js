import { formatearDia, hoyISO } from './suelo';

export const ESTADOS_ACTIVIDAD = {
  pendiente: {
    nombre: 'Pendiente',
    clase: 'bg-amber-100 text-amber-800',
    chip: 'bg-amber-50 text-amber-800 border-amber-200',
    punto: 'bg-amber-500',
  },
  en_proceso: {
    nombre: 'En proceso',
    clase: 'bg-blue-100 text-blue-800',
    chip: 'bg-blue-50 text-blue-800 border-blue-200',
    punto: 'bg-blue-500',
  },
  completada: {
    nombre: 'Completada',
    clase: 'bg-green-100 text-green-800',
    chip: 'bg-green-50 text-green-800 border-green-200',
    punto: 'bg-green-600',
  },
  cancelada: {
    nombre: 'Cancelada',
    clase: 'bg-stone-200 text-stone-600',
    chip: 'bg-stone-100 text-stone-500 border-stone-200 line-through',
    punto: 'bg-stone-400',
  },
};

export const PRIORIDADES = {
  alta: { nombre: 'Alta', clase: 'bg-red-100 text-red-700' },
  media: { nombre: 'Media', clase: 'bg-amber-100 text-amber-800' },
  baja: { nombre: 'Baja', clase: 'bg-sky-100 text-sky-800' },
};

export const UNIDADES = [
  { valor: 'ha', nombre: 'Hectáreas (ha)', corto: 'ha' },
  { valor: 'litros', nombre: 'Litros (L)', corto: 'L' },
  { valor: 'kg', nombre: 'Kilogramos (kg)', corto: 'kg' },
  { valor: 'horas', nombre: 'Horas (h)', corto: 'h' },
  { valor: 'jornales', nombre: 'Jornales', corto: 'jornales' },
  { valor: 'plantas', nombre: 'Plantas', corto: 'plantas' },
  { valor: 'unidades', nombre: 'Unidades', corto: 'unid.' },
];

export const cortoUnidad = (valor) => UNIDADES.find((u) => u.valor === valor)?.corto ?? valor ?? '';

export const FRECUENCIAS = [
  { valor: 'cada_x_dias', nombre: 'Cada cierto número de días' },
  { valor: 'semanal', nombre: 'Semanal (cada 7 días)' },
  { valor: 'quincenal', nombre: 'Quincenal (cada 15 días)' },
  { valor: 'mensual', nombre: 'Mensual' },
];

export function textoRecurrencia(r) {
  if (!r) return '';
  const base =
    r.frecuencia === 'cada_x_dias'
      ? `Cada ${r.intervalo_dias} días`
      : { semanal: 'Semanal', quincenal: 'Quincenal (cada 15 días)', mensual: 'Mensual' }[r.frecuencia];
  return `${base}, hasta el ${formatearDia(r.fecha_fin)}`;
}

/* ------------------------------ Roles y estado ------------------------------ */
export const esGestor = (rol) => rol === 'Administrador' || rol === 'Capataz';

export const estaCerrada = (a) => a.estado === 'completada' || a.estado === 'cancelada';

export const estaAtrasada = (a) => !estaCerrada(a) && a.fecha_programada < hoyISO();

export const nombreTrab = (t) => (t ? `${t.nombres} ${t.apellidos}`.trim() : 'Sin asignar');

// Trabajador marcado como responsable de la actividad (o null)
export function responsableDe(actividad, mapaTrab) {
  const asignaciones = actividad.asignaciones_tarea || [];
  const r = asignaciones.find((s) => s.es_responsable);
  return r ? mapaTrab[r.trabajador_id] || null : null;
}

/* -------------------------------- Calendario -------------------------------- */
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const dos = (n) => String(n).padStart(2, '0');
const aISO = (anio, mes, dia) => `${anio}-${dos(mes + 1)}-${dos(dia)}`;

export function rangoMes(anio, mes) {
  const ultimo = new Date(anio, mes + 1, 0).getDate();
  return { desde: aISO(anio, mes, 1), hasta: aISO(anio, mes, ultimo) };
}

// Celdas del calendario con la semana empezando en lunes (null = celda vacía)
export function celdasMes(anio, mes) {
  const desfase = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const total = new Date(anio, mes + 1, 0).getDate();
  const celdas = Array(desfase).fill(null);
  for (let d = 1; d <= total; d += 1) celdas.push(aISO(anio, mes, d));
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

export function tituloDia(iso) {
  const texto = new Date(`${iso}T00:00:00`).toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/* ------------------------------- Repeticiones ------------------------------- */
export const MAX_REPETICIONES = 100;

// Calcula las fechas de una serie (misma lógica que la función de la base de datos)
export function calcularFechas(inicio, frecuencia, intervalo, fin) {
  if (!inicio) return [];
  if (!frecuencia) return [inicio];
  if (!fin || fin < inicio) return [];

  const base = new Date(`${inicio}T00:00:00`);
  const fechas = [];

  for (let i = 0; i <= 400; i += 1) {
    let fecha;
    if (frecuencia === 'mensual') {
      fecha = new Date(base.getFullYear(), base.getMonth() + i, base.getDate());
      // Si el mes no tiene ese día (por ejemplo el 31), se usa el último día del mes
      if (fecha.getDate() !== base.getDate()) {
        fecha = new Date(base.getFullYear(), base.getMonth() + i + 1, 0);
      }
    } else {
      const dias =
        frecuencia === 'semanal' ? 7 : frecuencia === 'quincenal' ? 15 : Number(intervalo);
      if (!dias || dias < 1) return [];
      fecha = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i * dias);
    }
    const iso = fecha.toLocaleDateString('en-CA');
    if (iso > fin) break;
    fechas.push(iso);
  }
  return fechas;
}