import { diasEntre } from './cultivos';
import { hoyISO } from './suelo';

export const CATEGORIAS = [
  { valor: 'fertilizante', nombre: 'Fertilizante', clase: 'bg-green-100 text-green-800' },
  { valor: 'herbicida', nombre: 'Herbicida', clase: 'bg-amber-100 text-amber-800' },
  { valor: 'fungicida', nombre: 'Fungicida', clase: 'bg-purple-100 text-purple-800' },
  { valor: 'insecticida', nombre: 'Insecticida', clase: 'bg-red-100 text-red-700' },
  { valor: 'abono_organico', nombre: 'Abono orgánico', clase: 'bg-lime-100 text-lime-800' },
];

export const nombreCategoria = (valor) => CATEGORIAS.find((c) => c.valor === valor)?.nombre ?? valor;
export const claseCategoria = (valor) =>
  CATEGORIAS.find((c) => c.valor === valor)?.clase ?? 'bg-stone-100 text-stone-600';

export const UNIDADES_INSUMO = [
  { valor: 'kg', nombre: 'Kilogramos (kg)', corto: 'kg' },
  { valor: 'litros', nombre: 'Litros (L)', corto: 'L' },
  { valor: 'sacos', nombre: 'Sacos', corto: 'sacos' },
  { valor: 'unidades', nombre: 'Unidades', corto: 'unid.' },
];

export const cortoUnidadInsumo = (valor) =>
  UNIDADES_INSUMO.find((u) => u.valor === valor)?.corto ?? valor ?? '';

export const FUENTES = [
  { valor: 'tecnico', nombre: 'Técnico', clase: 'bg-green-100 text-green-800' },
  { valor: 'sistema', nombre: 'Sistema', clase: 'bg-blue-100 text-blue-800' },
  { valor: 'historial', nombre: 'Historial', clase: 'bg-purple-100 text-purple-800' },
];

export const nombreFuente = (valor) => FUENTES.find((f) => f.valor === valor)?.nombre ?? valor;
export const claseFuente = (valor) =>
  FUENTES.find((f) => f.valor === valor)?.clase ?? 'bg-stone-100 text-stone-600';

const textoDias = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

export function estadoStock(insumo) {
  const stock = Number(insumo.stock_disponible || 0);
  const minimo = Number(insumo.stock_minimo || 0);
  if (stock <= 0) return { texto: 'Sin stock', clase: 'bg-red-100 text-red-700', nivel: 'critico' };
  if (minimo > 0 && stock <= minimo) {
    return { texto: 'Stock bajo', clase: 'bg-amber-100 text-amber-800', nivel: 'bajo' };
  }
  return { texto: 'Disponible', clase: 'bg-green-100 text-green-800', nivel: 'ok' };
}

export function estadoVencimiento(fecha) {
  if (!fecha) return { texto: 'Sin vencimiento', clase: 'bg-stone-100 text-stone-600', nivel: 'ninguno' };
  const d = diasEntre(hoyISO(), fecha);
  if (d < 0) {
    return { texto: `Vencido hace ${textoDias(Math.abs(d))}`, clase: 'bg-red-100 text-red-700', nivel: 'vencido' };
  }
  if (d === 0) return { texto: 'Vence hoy', clase: 'bg-amber-100 text-amber-800', nivel: 'proximo' };
  if (d <= 30) {
    return { texto: `Vence en ${textoDias(d)}`, clase: 'bg-amber-100 text-amber-800', nivel: 'proximo' };
  }
  return { texto: 'Vigente', clase: 'bg-green-100 text-green-800', nivel: 'ok' };
}

export const costoAplicacion = (consumos = []) =>
  consumos.reduce((suma, c) => suma + Number(c.cantidad) * Number(c.costo_unitario), 0);

export const dinero = (valor) =>
  Number(valor || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

// Agrupa las aplicaciones registradas por cultivo, etapa e insumo y propone como
// recomendación las combinaciones repetidas que todavía no tienen una.
export function sugerenciasHistorial(aplicaciones, recomendaciones, minimo = 2) {
  const grupos = {};
  aplicaciones.forEach((a) => {
    if (a.estado !== 'registrada' || !a.cultivo_id || !a.etapa) return;
    const clave = `${a.cultivo_id}|${a.etapa}|${a.insumo_id}`;
    if (!grupos[clave]) {
      grupos[clave] = { cultivo_id: a.cultivo_id, etapa: a.etapa, insumo_id: a.insumo_id, veces: 0, suma: 0 };
    }
    grupos[clave].veces += 1;
    grupos[clave].suma += Number(a.dosis_aplicada_ha);
  });

  const existentes = new Set(
    recomendaciones.map((r) => `${r.cultivo_id}|${r.etapa ?? ''}|${r.insumo_id}`)
  );

  return Object.values(grupos)
    .filter((g) => g.veces >= minimo && !existentes.has(`${g.cultivo_id}|${g.etapa}|${g.insumo_id}`))
    .map((g) => ({ ...g, dosis: Math.round((g.suma / g.veces) * 1000) / 1000 }))
    .sort((a, b) => b.veces - a.veces);
}