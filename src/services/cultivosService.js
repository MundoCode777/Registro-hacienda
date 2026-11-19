import { supabase } from './supabaseClient';
import { hoyISO } from '../utils/suelo';
import { sumarDias } from '../utils/cultivos';

/* ------------------------------ Cultivos ------------------------------ */
export async function listarCultivos() {
  const { data, error } = await supabase
    .from('cultivos')
    .select('*')
    .order('nombre_comun')
    .order('variedad');
  if (error) throw error;
  return data || [];
}

export async function guardarCultivo(valores, id) {
  const consulta = id
    ? supabase.from('cultivos').update(valores).eq('id', id)
    : supabase.from('cultivos').insert(valores);
  const { data, error } = await consulta.select().single();
  if (error) throw error;
  return data;
}

/* ------------------------------- Etapas ------------------------------- */
export async function listarEtapas(cultivoId) {
  const { data, error } = await supabase
    .from('etapas_fenologicas')
    .select('*')
    .eq('cultivo_id', cultivoId)
    .order('dia_inicio');
  if (error) throw error;
  return data || [];
}

export async function listarTodasEtapas() {
  const { data, error } = await supabase.from('etapas_fenologicas').select('*').order('dia_inicio');
  if (error) throw error;
  return data || [];
}

export async function guardarEtapa(valores, id) {
  const consulta = id
    ? supabase.from('etapas_fenologicas').update(valores).eq('id', id)
    : supabase.from('etapas_fenologicas').insert(valores);
  const { data, error } = await consulta.select().single();
  if (error) throw error;
  return data;
}

export async function eliminarEtapa(id) {
  const { error } = await supabase.from('etapas_fenologicas').delete().eq('id', id);
  if (error) throw error;
}

/* ------------------------------ Siembras ------------------------------ */
export async function listarSiembras() {
  const { data, error } = await supabase
    .from('siembras')
    .select('*, lotes(nombre), cultivos(nombre_comun, variedad, ciclo_dias)')
    .order('fecha_siembra', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function guardarSiembra(valores, id) {
  const consulta = id
    ? supabase.from('siembras').update(valores).eq('id', id)
    : supabase.from('siembras').insert(valores);
  const { data, error } = await consulta.select().single();
  if (error) throw error;
  return data;
}

// Lotes con su área (para el formulario de siembras)
export async function listarLotesBasico() {
  const { data, error } = await supabase
    .from('lotes')
    .select('id, nombre, area_ha, estado')
    .order('nombre');
  if (error) throw error;
  return data || [];
}

/* ---------------------- Resumen para el Inicio ---------------------- */
export async function resumenCultivos() {
  const { data, error } = await supabase
    .from('siembras')
    .select('fecha_estimada_cosecha')
    .eq('estado', 'en_curso');
  if (error) throw error;

  const limite = sumarDias(hoyISO(), 30);
  const enCurso = data || [];
  return {
    enCurso: enCurso.length,
    cosechasProximas: enCurso.filter((s) => s.fecha_estimada_cosecha <= limite).length,
  };
}