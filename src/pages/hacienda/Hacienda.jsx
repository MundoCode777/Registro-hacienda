import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, FlaskConical, Layers, Loader2, Map as MapIcon, Warehouse } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import TabHacienda from './TabHacienda';
import TabLotes from './TabLotes';
import TabAnalisis from './TabAnalisis';
import { obtenerHacienda } from '../../services/haciendaService';
import { mensajeError } from '../../utils/errores';

const TABS = [
  { clave: 'hacienda', nombre: 'Hacienda', icono: Warehouse },
  { clave: 'lotes', nombre: 'Lotes', icono: Layers },
  { clave: 'analisis', nombre: 'Análisis de suelo', icono: FlaskConical },
];

export default function Hacienda() {
  const [tab, setTab] = useState('hacienda');
  const [hacienda, setHacienda] = useState(undefined); // undefined = cargando
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setHacienda(await obtenerHacienda());
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar la hacienda.'));
      setHacienda(null);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icono={MapIcon}
        titulo="Hacienda y lotes"
        descripcion="Información base de la hacienda, sus lotes y los análisis de suelo."
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <Tabs tabs={TABS} activa={tab} onChange={setTab} />

      {hacienda === undefined ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-7 w-7 animate-spin text-green-700" />
        </div>
      ) : (
        <>
          {tab === 'hacienda' && <TabHacienda hacienda={hacienda} onGuardada={setHacienda} />}

          {tab !== 'hacienda' && !hacienda && (
            <div className="card flex flex-col items-center p-12 text-center">
              <Warehouse className="h-10 w-10 text-stone-300" />
              <p className="mt-3 font-semibold">Primero registra la hacienda</p>
              <p className="text-sm text-stone-500">
                Ve a la pestaña Hacienda y completa sus datos para poder crear lotes.
              </p>
            </div>
          )}

          {tab === 'lotes' && hacienda && <TabLotes hacienda={hacienda} />}
          {tab === 'analisis' && hacienda && <TabAnalisis hacienda={hacienda} />}
        </>
      )}
    </div>
  );
}