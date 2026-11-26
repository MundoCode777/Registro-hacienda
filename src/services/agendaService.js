import { supabase } from './supabaseClient';
import { hoyISO } from '../utils/suelo';

const SELECT_ACTIVIDAD =
  '*, lotes(nombre), tipos_actividad(nombre, unidad_medida), cultivos(nombre_comun, variedad), asignaciones_tarea(*)';

const idUnico = () =>
  window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/* ---------------------------- Tipos de actividad ---------------------------- */
export async function listarTipos() {
  const { data, error } = await supabase.from('tipos_actividad').select('*').order('nombre');
  if (error) throw error;
  return data || [];
}

export async function guardarTipo(valores, id) {
  const consulta = id
    ? supabase.from('tipos_actividad').update(valores).eq('id', id)
    : supabase.from('tipos_actividad').insert(valores);
  const { data, error } = await consulta.select().single();
  if (error) throw error;
  return data;
}

/* ------------------------------ Datos de apoyo ------------------------------ */
// Vista con nombre y especialidad de los trabajadores (no incluye cédula ni contacto)
export async function listarTrabajadoresBasico() {
  const { data, error } = await supabase.from('trabajadores_basico').select('*').order('apellidos');
  if (error) throw error;
  return data || [];
}

export async function listarSiembrasEnCurso() {
  const { data, error } = await supabase
    .from('siembras')
    .select('id, lote_id, fecha_siembra, cultivos(nombre_comun, variedad)')
    .eq('estado', 'en_curso')
    .order('fecha_siembra', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* ------------------------------- Actividades ------------------------------- */
// Trae las actividades del rango y, además, todas las atrasadas de cualquier mes
export async function listarActividades(desde, hasta) {
  const [delRango, atrasadas] = await Promise.all([
    supabase
      .from('actividades')
      .select(SELECT_ACTIVIDAD)
      .gte('fecha_programada', desde)
      .lte('fecha_programada', hasta),
    supabase
      .from('actividades')
      .select(SELECT_ACTIVIDAD)
      .in('estado', ['pendiente', 'en_proceso'])
      .lt('fecha_programada', hoyISO()),
  ]);
  if (delRango.error) throw delRango.error;
  if (atrasadas.error) throw atrasadas.error;

  const mapa = new Map();
  [...(delRango.data || []), ...(atrasadas.data || [])].forEach((a) => mapa.set(a.id, a));
  return [...mapa.values()].sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada));
}

export async function actualizarActividad(valores, id) {
  const { data, error } = await supabase
    .from('actividades')
    .update(valores)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Crea la actividad (y sus repeticiones y equipo) en una sola operación
export async function programarActividad(payload) {
  const { data, error } = await supabase.rpc('programar_actividad', { p: payload });
  if (error) throw error;
  return data;
}

export async function cancelarSerie(recurrenciaId, desde, motivo) {
  const { data, error } = await supabase.rpc('cancelar_serie', {
    p_recurrencia: recurrenciaId,
    p_desde: desde,
    p_motivo: motivo,
  });
  if (error) throw error;
  return data || 0;
}

export async function obtenerRecurrencia(id) {
  const { data, error } = await supabase
    .from('recurrencias_actividad')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ----------------------------- Asignación de tareas ----------------------------- */
export async function agregarAsignacion(valores) {
  const { error } = await supabase.from('asignaciones_tarea').insert(valores);
  if (error) throw error;
}

export async function guardarAsignacion(valores, id) {
  const { error } = await supabase.from('asignaciones_tarea').update(valores).eq('id', id);
  if (error) throw error;
}

export async function quitarAsignacion(id) {
  const { error } = await supabase.from('asignaciones_tarea').delete().eq('id', id);
  if (error) throw error;
}

export async function cambiarResponsable(actividadId, asignacionId) {
  const { error: errorQuitar } = await supabase
    .from('asignaciones_tarea')
    .update({ es_responsable: false })
    .eq('actividad_id', actividadId)
    .eq('es_responsable', true);
  if (errorQuitar) throw errorQuitar;

  const { error } = await supabase
    .from('asignaciones_tarea')
    .update({ es_responsable: true })
    .eq('id', asignacionId);
  if (error) throw error;
}

/* -------------------------------- Seguimiento -------------------------------- */
export async function listarSeguimientos(actividadId) {
  const { data, error } = await supabase
    .from('seguimientos_actividad')
    .select('*')
    .eq('actividad_id', actividadId)
    .order('fecha_reporte', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function registrarSeguimiento(valores) {
  const { error } = await supabase.from('seguimientos_actividad').insert(valores);
  if (error) throw error;
}

/* --------------------------------- Evidencias --------------------------------- */
export async function listarEvidencias(actividadId) {
  const { data, error } = await supabase
    .from('evidencias_actividad')
    .select('*')
    .eq('actividad_id', actividadId)
    .order('tomada_en', { ascending: false });
  if (error) throw error;

  const filas = data || [];
  if (filas.length === 0) return [];

  const { data: firmadas, error: errorFirma } = await supabase.storage
    .from('evidencias')
    .createSignedUrls(
      filas.map((f) => f.ruta_archivo),
      3600
    );
  if (errorFirma) throw errorFirma;

  const urls = {};
  (firmadas || []).forEach((f) => {
    if (f.signedUrl) urls[f.path] = f.signedUrl;
  });
  return filas.map((f) => ({ ...f, url: urls[f.ruta_archivo] || null }));
}

export async function subirEvidencia({ actividadId, imagen, latitud, longitud, precision }) {
  const ruta = `${actividadId}/${idUnico()}.jpg`;

  const { error: errorSubida } = await supabase.storage
    .from('evidencias')
    .upload(ruta, imagen, { contentType: 'image/jpeg', upsert: false });
  if (errorSubida) throw errorSubida;

  const { error } = await supabase.from('evidencias_actividad').insert({
    actividad_id: actividadId,
    ruta_archivo: ruta,
    latitud,
    longitud,
    precision_m: precision,
  });
  if (error) {
    await supabase.storage.from('evidencias').remove([ruta]);
    throw error;
  }
}

/* ---------------------- Resumen para el Inicio ---------------------- */
export async function resumenAgenda() {
  const hoy = hoyISO();
  const [deHoy, atrasadas] = await Promise.all([
    supabase
      .from('actividades')
      .select('id', { count: 'exact', head: true })
      .eq('fecha_programada', hoy)
      .in('estado', ['pendiente', 'en_proceso']),
    supabase
      .from('actividades')
      .select('id', { count: 'exact', head: true })
      .lt('fecha_programada', hoy)
      .in('estado', ['pendiente', 'en_proceso']),
  ]);
  if (deHoy.error) throw deHoy.error;
  if (atrasadas.error) throw atrasadas.error;
  return { hoy: deHoy.count || 0, atrasadas: atrasadas.count || 0 };
}