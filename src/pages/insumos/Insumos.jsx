import { useState } from 'react';
import { Boxes, Droplets, FlaskConical, Lightbulb, Package } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import TabInventario from './TabInventario';
import TabCatalogo from './TabCatalogo';
import TabRecomendaciones from './TabRecomendaciones';
import TabAplicaciones from './TabAplicaciones';

const TABS = [
  { clave: 'inventario', nombre: 'Inventario', icono: Boxes },
  { clave: 'catalogo', nombre: 'Catálogo de insumos', icono: FlaskConical },
  { clave: 'recomendaciones', nombre: 'Recomendaciones', icono: Lightbulb },
  { clave: 'aplicaciones', nombre: 'Aplicaciones', icono: Droplets },
];

export default function Insumos() {
  const [tab, setTab] = useState('inventario');

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icono={Package}
        titulo="Insumos y recomendaciones"
        descripcion="Inventario de bodega, recomendaciones por cultivo y etapa, y registro de aplicaciones."
      />
      <Tabs tabs={TABS} activa={tab} onChange={setTab} />

      {tab === 'inventario' && <TabInventario />}
      {tab === 'catalogo' && <TabCatalogo />}
      {tab === 'recomendaciones' && <TabRecomendaciones />}
      {tab === 'aplicaciones' && <TabAplicaciones />}
    </div>
  );
}