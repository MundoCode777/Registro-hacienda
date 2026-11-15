import { Hammer } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function ModuloPendiente({ modulo }) {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader icono={modulo.icono} titulo={modulo.nombre} descripcion={modulo.descripcion} />

      <div className="card flex flex-col items-center p-12 text-center">
        <Hammer className="h-10 w-10 text-amber-500" />
        <h2 className="mt-4 text-lg font-bold">Módulo en construcción</h2>
        <p className="mt-1 max-w-md text-sm text-stone-500">
          Este módulo se desarrollará en las siguientes fases del proyecto.
        </p>
      </div>
    </div>
  );
}