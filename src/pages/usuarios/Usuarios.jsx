import { useState } from 'react';
import { History, ShieldCheck, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import TabUsuarios from './TabUsuarios';
import TabPermisos from './TabPermisos';
import TabSesiones from './TabSesiones';

const TABS = [
  { clave: 'usuarios', nombre: 'Usuarios', icono: Users },
  { clave: 'permisos', nombre: 'Permisos por rol', icono: ShieldCheck },
  { clave: 'sesiones', nombre: 'Historial de sesiones', icono: History },
];

export default function Usuarios() {
  const [tab, setTab] = useState('usuarios');

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icono={ShieldCheck}
        titulo="Usuarios y accesos"
        descripcion="Administra cuentas, roles, permisos y el uso del sistema."
      />
      <Tabs tabs={TABS} activa={tab} onChange={setTab} />

      {tab === 'usuarios' && <TabUsuarios />}
      {tab === 'permisos' && <TabPermisos />}
      {tab === 'sesiones' && <TabSesiones />}
    </div>
  );
}