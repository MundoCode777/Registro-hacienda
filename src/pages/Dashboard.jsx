import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Ruler, Sprout } from 'lucide-react';
import { MODULOS } from '../config/modulos';
import { useAuth } from '../context/AuthContext';
import { resumenHacienda } from '../services/haciendaService';
import { fmt } from '../utils/suelo';

function Estadistica({ icono: Icono, etiqueta, valor, unidad }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <Icono className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500">{etiqueta}</p>
        <p className="text-2xl font-extrabold">
          {valor} {unidad && <span className="text-sm font-medium text-stone-500">{unidad}</span>}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { perfil, rol, puede } = useAuth();
  const [resumen, setResumen] = useState(null);
  const modulos = MODULOS.filter((m) => m.clave !== 'dashboard' && puede(m.clave, 'leer'));
  const veHacienda = puede('hacienda', 'leer');

  useEffect(() => {
    if (!veHacienda) return;
    resumenHacienda()
      .then(setResumen)
      .catch(() => setResumen(null));
  }, [veHacienda]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-3xl bg-gradient-to-r from-green-700 to-green-900 p-8 text-white shadow-sm">
        <p className="text-sm text-green-200">{rol}</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          Hola, {perfil.nombre_completo.split(' ')[0]} 👋
        </h1>
        <p className="mt-2 max-w-xl text-sm text-green-100">
          Bienvenido a la agenda digital de la Hacienda La Querencia. Elige un módulo para comenzar.
        </p>
      </div>

      {resumen && (
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <Estadistica icono={Ruler} etiqueta="Extensión total" valor={fmt(resumen.hacienda.extension_ha)} unidad="ha" />
          <Estadistica icono={Sprout} etiqueta="Hectáreas en uso" valor={fmt(resumen.areaUsada)} unidad="ha" />
          <Estadistica icono={Layers} etiqueta="Lotes activos" valor={resumen.lotesActivos} />
        </div>
      )}

      <h2 className="mb-4 mt-10 text-lg font-bold">Tus módulos</h2>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {modulos.map(({ clave, nombre, ruta, icono: Icono, descripcion }) => (
          <Link
            key={clave}
            to={ruta}
            className="card group p-6 transition hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 transition group-hover:bg-green-700 group-hover:text-white">
              <Icono className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-bold">{nombre}</h3>
            <p className="mt-1 text-sm text-stone-500">{descripcion}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-green-700">
              Abrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}