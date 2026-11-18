import { supabase } from './supabaseClient';

/* ----------------------------- Hacienda ----------------------------- */
export async function obtenerHacienda() {
  const { data, error } = await supabase
    .from('haciendas')
    .select('*')
    .order('created_at')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function guardarHacienda(valores, id) {
  const consulta = id
    ? supabase.from('haciendas').update(valores).eq('id', id)
    : supabase.from('haciendas').insert(valores);
  const { data, error } = await consulta.select().single();
  if (error) throw error;
  return data;
}

/* ------------------------------- Lotes ------------------------------- */
export async function listarLotes(haciendaId) {
  const { data, error } = await supabase
    .from('lotes')
    .select('*')
    .eq('hacienda_id', haciendaId)
    .order('nombre');
  if (error) throw error;
  return data || [];
}

export async function guardarLote(valores, id) {
  const consulta = id
    ? supabase.from('lotes').update(valores).eq('id', id)
    : supabase.from('lotes').insert(valores);
  const { data, error } = await consulta.select().single();
  if (error) throw error;
  return data;
}

/* --------------------------- Análisis de suelo --------------------------- */
export async function listarAnalisis(loteId) {
  const { data, error } = await supabase
    .from('analisis_suelo')
    .select('*')
    .eq('lote_id', loteId)
    .order('fecha_analisis', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function guardarAnalisis(valores) {
  const { data, error } = await supabase.from('analisis_suelo').insert(valores).select().single();
  if (error) throw error;
  return data;
}

export async function eliminarAnalisis(id) {
  const { error } = await supabase.from('analisis_suelo').delete().eq('id', id);
  if (error) throw error;
}

/* ---------------------- Resumen para el Inicio ---------------------- */
export async function resumenHacienda() {
  const hacienda = await obtenerHacienda();
  if (!hacienda) return null;

  const { data, error } = await supabase
    .from('lotes')
    .select('area_ha')
    .eq('hacienda_id', hacienda.id)
    .eq('estado', 'activo');
  if (error) throw error;

  const lotes = data || [];
  return {
    hacienda,
    lotesActivos: lotes.length,
    areaUsada: lotes.reduce((suma, l) => suma + Number(l.area_ha), 0),
  };
}