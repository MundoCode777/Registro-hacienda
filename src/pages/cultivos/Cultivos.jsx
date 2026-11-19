import { useState } from 'react';
import { CalendarRange, Leaf, Sprout, Sprout as SproutIcon } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import TabSiembras from './TabSiembras';
import TabCultivos from './TabCultivos';
import TabEtapas from './TabEtapas';

const TABS = [
  { clave: 'siembras', nombre: 'Siembras', icono: SproutIcon },
  { clave: 'cultivos', nombre: 'Cultivos', icono: Leaf },
  { clave: 'etapas', nombre: 'Etapas fenológicas', icono: CalendarRange },
];

export default function Cultivos() {
  const [tab, setTab] = useState('siembras');

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icono={Sprout}
        titulo="Cultivos"
        descripcion="Catálogo de cultivos, etapas fenológicas y siembras por lote."
      />
      <Tabs tabs={TABS} activa={tab} onChange={setTab} />

      {tab === 'siembras' && <TabSiembras />}
      {tab === 'cultivos' && <TabCultivos />}
      {tab === 'etapas' && <TabEtapas />}
    </div>
  );
}