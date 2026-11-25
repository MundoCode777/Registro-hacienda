import { supabase } from './supabaseClient';

export async function listarTrabajadores() {
  const { data, error } = await supabase
    .from('trabajadores')
    .select('*')
    .order('apellidos')
    .order('nombres');
  if (error) throw error;
  return data || [];
}

export async function guardarTrabajador(valores, id) {
  const consulta = id
    ? supabase.from('trabajadores').update(valores).eq('id', id)
    : supabase.from('trabajadores').insert(valores);
  const { data, error } = await consulta.select().single();
  if (error) throw error;
  return data;
}

// Solo el administrador puede leer la lista de usuarios (regla de seguridad del Módulo 1)
export async function listarUsuariosAcceso() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre_completo, correo, trabajador_id, activo')
    .order('nombre_completo');
  if (error) throw error;
  return data || [];
}

// Vincula una cuenta de acceso con un trabajador (o la desvincula si usuarioId es null)
export async function vincularUsuario(trabajadorId, usuarioId) {
  const { error: errorLimpiar } = await supabase
    .from('usuarios')
    .update({ trabajador_id: null })
    .eq('trabajador_id', trabajadorId);
  if (errorLimpiar) throw errorLimpiar;

  if (usuarioId) {
    const { error } = await supabase
      .from('usuarios')
      .update({ trabajador_id: trabajadorId })
      .eq('id', usuarioId);
    if (error) throw error;
  }
}

export async function resumenPersonal() {
  const { count, error } = await supabase
    .from('trabajadores')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'activo');
  if (error) throw error;
  return { activos: count || 0 };
}