import { supabase } from './supabaseClient';

// Envía el correo con el enlace para crear una nueva contraseña
export async function enviarRecuperacion(correo) {
  const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
    redirectTo: `${window.location.origin}/restablecer`,
  });
  if (error) throw error;
}

// Cambia la contraseña del usuario que tiene la sesión de recuperación
export async function actualizarPassword(nueva) {
  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) throw error;
}

// Mensajes de error de autenticación en español
export function traducirErrorAuth(msg = '') {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('already registered')) return 'Este correo ya está registrado.';
  if (msg.includes('should be different')) return 'La nueva contraseña debe ser diferente a la anterior.';
  if (msg.includes('Password should be') || msg.includes('at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('Email not confirmed')) return 'Debes confirmar tu correo antes de ingresar.';
  if (msg.includes('only request this after')) {
    return 'Por seguridad, espera un minuto antes de solicitar otro enlace.';
  }
  if (msg.includes('rate limit')) {
    return 'Se alcanzó el límite de intentos o correos. Espera unos minutos e intenta de nuevo.';
  }
  if (msg.includes('Auth session missing')) return 'El enlace venció. Solicita uno nuevo.';
  if (msg.includes('sending recovery email')) {
    return 'No se pudo enviar el correo. Revisa la configuración de correo en Supabase.';
  }
  return msg || 'Ocurrió un error. Intenta de nuevo.';
}