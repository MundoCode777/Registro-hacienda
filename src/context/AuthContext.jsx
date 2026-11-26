import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};

// Módulos disponibles para cualquier usuario autenticado
const SIEMPRE_PERMITIDOS = ['dashboard', 'notificaciones'];

// Tiempo mínimo entre actualizaciones automáticas del perfil (milisegundos)
const ESPERA_REFRESCO = 15000;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const ultimaCarga = useRef(0);

  // 1) Escuchar la sesión de Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
      if (!nuevaSesion) {
        setPerfil(null);
        setPermisos([]);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // 2) Cargar perfil y permisos del usuario.
  // En una actualización silenciosa, un fallo de red no cierra el acceso.
  const cargarPerfil = useCallback(async (userId, silencioso = false) => {
    ultimaCarga.current = Date.now();

    const { data: p, error } = await supabase
      .from('usuarios')
      .select('*, roles(id, nombre)')
      .eq('id', userId)
      .single();

    if (error || !p) {
      if (!silencioso) {
        setPerfil(null);
        setPermisos([]);
        setLoading(false);
      }
      return;
    }

    const { data: perms } = await supabase
      .from('permisos_modulo')
      .select('*')
      .eq('rol_id', p.rol_id);

    setPerfil(p);
    setPermisos(perms || []);
    setLoading(false);
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    if (userId) cargarPerfil(userId);
  }, [userId, cargarPerfil]);

  // 3) Al volver a la pestaña o ventana, se actualiza el perfil (rol, permisos y vínculo
  // con su ficha de trabajador) sin tener que cerrar sesión.
  useEffect(() => {
    if (!userId) return undefined;

    const alVolver = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - ultimaCarga.current < ESPERA_REFRESCO) return;
      cargarPerfil(userId, true);
    };

    window.addEventListener('focus', alVolver);
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.removeEventListener('focus', alVolver);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [userId, cargarPerfil]);

  // 4) Acciones
  const registrarSesion = async () => {
    const { data: sesionId } = await supabase.rpc('registrar_login', {
      p_dispositivo: navigator.userAgent.slice(0, 200),
    });
    if (sesionId) localStorage.setItem('sesion_id', sesionId);
  };

  const signIn = async (correo, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password });
    if (error) throw error;
    await registrarSesion();
  };

  const signUp = async (nombre, correo, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password,
      options: { data: { nombre_completo: nombre } },
    });
    if (error) throw error;
    if (data.session) await registrarSesion();
    return data;
  };

  const signOut = async () => {
    const sesionId = localStorage.getItem('sesion_id');
    if (sesionId) {
      await supabase.rpc('cerrar_sesion', { p_id: sesionId });
      localStorage.removeItem('sesion_id');
    }
    await supabase.auth.signOut();
  };

  // 5) Permisos por módulo y acción
  const puede = (modulo, accion = 'leer') => {
    if (SIEMPRE_PERMITIDOS.includes(modulo)) return true;
    const p = permisos.find((x) => x.modulo === modulo);
    return Boolean(p && p[accion]);
  };

  const rol = perfil?.roles?.nombre ?? null;

  const value = {
    session,
    perfil,
    rol,
    esAdmin: rol === 'Administrador',
    puedeEnviarNotificaciones: rol === 'Administrador' || rol === 'Capataz',
    loading,
    signIn,
    signUp,
    signOut,
    puede,
    recargarPerfil: () => userId && cargarPerfil(userId, true),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}