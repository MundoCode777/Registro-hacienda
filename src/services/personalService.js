import { createClient } from '@supabase/supabase-js';
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

const traducirErrorCuenta = (msg = '') => {
  if (msg.includes('already registered')) {
    return 'Ese correo ya tiene una cuenta. Usa la opción "Vincular una cuenta existente".';
  }
  if (msg.includes('Password should be') || msg.includes('at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('rate limit')) {
    return 'Se alcanzó el límite de cuentas nuevas por ahora. Espera unos minutos e intenta de nuevo.';
  }
  if (msg.toLowerCase().includes('email')) return 'El correo no es válido.';
  return msg || 'No se pudo crear la cuenta.';
};

// Crea una cuenta nueva SIN cerrar la sesión del administrador.
// Usa un cliente temporal que no guarda sesión; el perfil lo crea la base de datos
// automáticamente con el rol Trabajador.
export async function crearCuentaAcceso({ nombre, correo, password }) {
  const cliente = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'sb-cuenta-nueva',
      },
    }
  );

  const { data, error } = await cliente.auth.signUp({
    email: correo,
    password,
    options: { data: { nombre_completo: nombre } },
  });
  if (error) throw new Error(traducirErrorCuenta(error.message));

  const usuario = data?.user;
  if (!usuario) throw new Error('No se pudo crear la cuenta.');
  // Si el correo ya existía, Supabase puede devolver un usuario sin identidades
  if (Array.isArray(usuario.identities) && usuario.identities.length === 0) {
    throw new Error(traducirErrorCuenta('already registered'));
  }
  return usuario.id;
}

export async function resumenPersonal() {
  const { count, error } = await supabase
    .from('trabajadores')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'activo');
  if (error) throw error;
  return { activos: count || 0 };
}