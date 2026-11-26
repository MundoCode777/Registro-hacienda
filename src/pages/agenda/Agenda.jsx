import { useState } from 'react';
import { CalendarDays, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import TabActividades from './TabActividades';
import TabTipos from './TabTipos';
import { esGestor } from '../../utils/agenda';

export default function Agenda() {
  const { rol } = useAuth();
  const [tab, setTab] = useState('actividades');

  const tabs = [{ clave: 'actividades', nombre: 'Actividades', icono: CalendarDays }];
  if (esGestor(rol)) tabs.push({ clave: 'tipos', nombre: 'Tipos de actividad', icono: ClipboardList });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icono={CalendarDays}
        titulo="Agenda de actividades"
        descripcion="Programa el trabajo del campo, asigna al personal y da seguimiento con evidencias."
      />
      {tabs.length > 1 && <Tabs tabs={tabs} activa={tab} onChange={setTab} />}

      {tab === 'actividades' && <TabActividades />}
      {tab === 'tipos' && esGestor(rol) && <TabTipos />}
    </div>
  );
}