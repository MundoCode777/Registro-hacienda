import { supabase } from './supabaseClient';
import { hoyISO } from '../utils/suelo';
import { sumarDias } from '../utils/cultivos';

/* -------------------------------- Insumos -------------------------------- */
// Lee la vista que incluye el stock disponible de cada insumo
export async function listarInsumos() {
  const { data, error } = await supabase
    .from('insumos_con_stock')
    .select('*')
    .order('nombre_comercial');
  if (error) throw error;
  return data || [];
}

export async function guardarInsumo(valores, id) {
  const consulta = id
    ? supabase.from('insumos').update(valores).eq('id', id)
    : supabase.from('insumos').insert(valores);
  const { data, error } = await consulta.select().single();
  if (error) throw error;
  return data;
}

/* ------------------------------- Inventario ------------------------------- */
export async function listarLotesInventario() {
  const { data, error } = await supabase
    .from('inventario_insumos')
    .select('*')
    .order('fecha_vencimiento', { ascending: true, nullsFirst: false })
    .order('fecha_ingreso', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function guardarLoteInventario(valores, id) {
  const consulta = id
    ? supabase.from('inventario_insumos').update(valores).eq('id', id)
    : supabase.from('inventario_insumos').insert(valores);
  const { data, error } = await consulta.select().single();
  if (error) throw error;
  return data;
}

export async function darDeBajaLote(id, motivo) {
  const { error } = await supabase
    .from('inventario_insumos')
    .update({ estado: 'baja', motivo_baja: motivo })
    .eq('id', id);
  if (error) throw error;
}

/* ---------------------------- Recomendaciones ---------------------------- */
export async function listarRecomendaciones() {
  const { data, error } = await supabase
    .from('recomendaciones_insumo')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function guardarRecomendacion(valores, id) {
  const consulta = id
    ? supabase.from('recomendaciones_insumo').update(valores).eq('id', id)
    : supabase.from('recomendaciones_insumo').insert(valores);
  const { data, error } = await consulta.select().single();
  if (error) throw error;
  return data;
}

/* ------------------------------ Aplicaciones ------------------------------ */
export async function listarAplicaciones(limite = 300) {
  const { data, error } = await supabase
    .from('aplicaciones_insumo')
    .select(
      '*, aplicacion_consumos(cantidad, costo_unitario), actividades(fecha_programada, tipos_actividad(nombre), lotes(nombre))'
    )
    .order('fecha_aplicacion', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data || [];
}

export async function listarAplicacionesActividad(actividadId) {
  const { data, error } = await supabase
    .from('aplicaciones_insumo')
    .select('*, aplicacion_consumos(cantidad, costo_unitario)')
    .eq('actividad_id', actividadId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function registrarAplicacion(payload) {
  const { data, error } = await supabase.rpc('registrar_aplicacion', { p: payload });
  if (error) throw error;
  return data;
}

export async function anularAplicacion(id, motivo) {
  const { error } = await supabase.rpc('anular_aplicacion', { p_id: id, p_motivo: motivo });
  if (error) throw error;
}

/* ---------------------- Resumen para el Inicio ---------------------- */
export async function resumenInsumos() {
  const hoy = hoyISO();
  const limite = sumarDias(hoy, 30);

  const [insumos, lotes] = await Promise.all([
    supabase.from('insumos_con_stock').select('stock_disponible, stock_minimo').eq('estado', 'activo'),
    supabase
      .from('inventario_insumos')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'activo')
      .gt('cantidad_actual', 0)
      .lte('fecha_vencimiento', limite),
  ]);
  if (insumos.error) throw insumos.error;
  if (lotes.error) throw lotes.error;

  const bajoStock = (insumos.data || []).filter(
    (i) => Number(i.stock_minimo) > 0 && Number(i.stock_disponible) <= Number(i.stock_minimo)
  ).length;

  return { bajoStock, porVencer: lotes.count || 0, alertas: bajoStock + (lotes.count || 0) };
}