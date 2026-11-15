import {
  LayoutDashboard,
  Map,
  Sprout,
  CalendarDays,
  Package,
  HardHat,
  ShieldCheck,
  Bell,
} from 'lucide-react';

// "clave" coincide con la columna "modulo" de la tabla permisos_modulo.
// "dashboard" y "notificaciones" están disponibles para todos los roles.
export const MODULOS = [
  {
    clave: 'dashboard',
    nombre: 'Inicio',
    ruta: '/',
    icono: LayoutDashboard,
    descripcion: 'Resumen general de la hacienda.',
  },
  {
    clave: 'agenda',
    nombre: 'Agenda de actividades',
    ruta: '/agenda',
    icono: CalendarDays,
    descripcion: 'Programación, seguimiento, recurrencia y evidencia fotográfica.',
  },
  {
    clave: 'hacienda',
    nombre: 'Hacienda y lotes',
    ruta: '/hacienda',
    icono: Map,
    descripcion: 'Hacienda, lotes o parcelas y análisis de suelo.',
  },
  {
    clave: 'cultivos',
    nombre: 'Cultivos',
    ruta: '/cultivos',
    icono: Sprout,
    descripcion: 'Cultivos, siembras y etapas fenológicas.',
  },
  {
    clave: 'insumos',
    nombre: 'Insumos y recomendaciones',
    ruta: '/insumos',
    icono: Package,
    descripcion: 'Inventario, recomendaciones y aplicación de insumos.',
  },
  {
    clave: 'personal',
    nombre: 'Personal',
    ruta: '/personal',
    icono: HardHat,
    descripcion: 'Trabajadores y asignación de tareas.',
  },
  {
    clave: 'usuarios',
    nombre: 'Usuarios y accesos',
    ruta: '/usuarios',
    icono: ShieldCheck,
    descripcion: 'Usuarios, roles, permisos y sesiones.',
  },
  {
    clave: 'notificaciones',
    nombre: 'Notificaciones',
    ruta: '/notificaciones',
    icono: Bell,
    descripcion: 'Mensajes internos entre capataz, administrador y trabajadores.',
  },
];

// Módulos cuyos permisos se pueden configurar por rol
export const MODULOS_CONFIGURABLES = MODULOS.filter(
  (m) => !['dashboard', 'notificaciones'].includes(m.clave)
);