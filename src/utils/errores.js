// Convierte errores técnicos de Supabase/PostgreSQL en mensajes claros
export function mensajeError(err, porDefecto = 'Ocurrió un error. Intenta de nuevo.') {
  if (!err) return porDefecto;
  const msg = err.message || '';

  if (err.code === '23505') return 'Ya existe un registro con ese nombre.';
  if (err.code === '42501' || msg.includes('row-level security')) {
    return 'No tienes permiso para realizar esta acción.';
  }
  if (err.code === '23514') return 'Algún valor está fuera del rango permitido.';
  if (err.code === '23503') {
    return 'Este registro está relacionado con otros datos y no se puede modificar.';
  }
  return msg || porDefecto;
}