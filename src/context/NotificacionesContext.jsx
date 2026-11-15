import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const NotificacionesContext = createContext({
  noLeidas: 0,
  version: 0,
  recargar: () => {},
});

export const useNotificaciones = () => useContext(NotificacionesContext);

export function NotificacionesProvider({ children }) {
  const { perfil } = useAuth();
  const userId = perfil?.id;
  const [noLeidas, setNoLeidas] = useState(0);
  const [version, setVersion] = useState(0); // cambia cada vez que hay novedades

  const recargar = useCallback(async () => {
    if (!userId) return;
    const { count } = await supabase
      .from('notificacion_destinatarios')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .eq('leida', false);
    setNoLeidas(count || 0);
    setVersion((v) => v + 1);
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    recargar();

    // Tiempo real: se actualiza al llegar una notificación nueva
    const canal = supabase
      .channel(`notificaciones-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacion_destinatarios',
          filter: `usuario_id=eq.${userId}`,
        },
        () => recargar()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [userId, recargar]);

  return (
    <NotificacionesContext.Provider value={{ noLeidas, version, recargar }}>
      {children}
    </NotificacionesContext.Provider>
  );
}