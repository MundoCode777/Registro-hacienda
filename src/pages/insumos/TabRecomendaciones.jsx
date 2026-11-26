import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Lightbulb, Loader2, Pencil, Plus, Power, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import AplicarAhora from './AplicarAhora';
import FormRecomendacion from './FormRecomendacion';
import {
  guardarRecomendacion,
  listarAplicaciones,
  listarInsumos,
  listarRecomendaciones,
} from '../../services/insumosService';
import { listarCultivos, listarSiembras, listarTodasEtapas } from '../../services/cultivosService';
import { mensajeError } from '../../utils/errores';
import { confirmar, mostrarError, notificar } from '../../utils/alertas';
import { nombreEtapa } from '../../utils/cultivos';
import { claseFuente, cortoUnidadInsumo, nombreFuente, sugerenciasHistorial } from '../../utils/insumos';
import { fmt } from '../../utils/suelo';

export default function TabRecomendaciones() {
  const { puede } = useAuth();
  const puedeCrear = puede('insumos', 'crear');
  const puedeEditar = puede('insumos', 'actualizar');

  const [vista, setVista] = useState('ahora'); // ahora | todas
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [cultivos, setCultivos] = useState([]);
  const [siembras, setSiembras] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroCultivo, setFiltroCultivo] = useState('');
  const [modal, setModal] = useState(null); // { recomendacion, inicial }

  const cargar = useCallback(async () => {
    try {
      const [r, i, c, s, e, a] = await Promise.all([
        listarRecomendaciones(),
        listarInsumos(),
        listarCultivos(),
        listarSiembras().catch(() => []),
        listarTodasEtapas().catch(() => []),
        listarAplicaciones(500).catch(() => []),
      ]);
      setRecomendaciones(r);
      setInsumos(i);
      setCultivos(c);
      setSiembras(s.filter((x) => x.estado === 'en_curso'));
      setEtapas(e);
      setAplicaciones(a);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las recomendaciones.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mapaInsumo = useMemo(() => {
    const m = {};
    insumos.forEach((i) => {
      m[i.id] = i;
    });
    return m;
  }, [insumos]);

  const mapaCultivo = useMemo(() => {
    const m = {};
    cultivos.forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, [cultivos]);

  const nombreCultivo = (id) => {
    const c = mapaCultivo[id];
    return c ? `${c.nombre_comun}${c.variedad ? ` · ${c.variedad}` : ''}` : 'Cultivo';
  };

  const visibles = useMemo(
    () => recomendaciones.filter((r) => !filtroCultivo || r.cultivo_id === filtroCultivo),
    [recomendaciones, filtroCultivo]
  );

  const sugerencias = useMemo(
    () => sugerenciasHistorial(aplicaciones, recomendaciones),
    [aplicaciones, recomendaciones]
  );

  const cambiarEstado = async (r) => {
    const desactivar = r.estado === 'activo';
    if (desactivar) {
      const acepta = await confirmar({
        titulo: '¿Desactivar esta recomendación?',
        texto: 'Dejará de aparecer en la vista "Qué aplicar ahora".',
        confirmar: 'Sí, desactivar',
        peligro: true,
      });
      if (!acepta) return;
    }
    try {
      await guardarRecomendacion({ estado: desactivar ? 'inactivo' : 'activo' }, r.id);
      await cargar();
      notificar(desactivar ? 'Recomendación desactivada' : 'Recomendación activada');
    } catch (err) {
      mostrarError('No se pudo cambiar el estado', mensajeError(err));
    }
  };

  const desdeSugerencia = (g) => {
    const insumo = mapaInsumo[g.insumo_id];
    setModal({
      recomendacion: null,
      inicial: {
        cultivo_id: g.cultivo_id,
        etapa: g.etapa,
        insumo_id: g.insumo_id,
        dosis_ha: g.dosis,
        fuente: 'historial',
        justificacion: `Basada en ${g.veces} aplicaciones registradas${insumo ? ` de ${insumo.nombre_comercial}` : ''} en esta etapa del cultivo.`,
      },
    });
  };

  if (cargando) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-stone-300 bg-white p-1">
          {[
            { clave: 'ahora', nombre: 'Qué aplicar ahora' },
            { clave: 'todas', nombre: 'Todas las recomendaciones' },
          ].map((v) => (
            <button
              key={v.clave}
              onClick={() => setVista(v.clave)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                vista === v.clave ? 'bg-green-700 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {v.nombre}
            </button>
          ))}
        </div>

        {puedeCrear && (
          <button onClick={() => setModal({ recomendacion: null, inicial: null })} className="btn-primary ml-auto">
            <Plus className="h-4 w-4" /> Nueva recomendación
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {vista === 'ahora' ? (
        <AplicarAhora siembras={siembras} etapas={etapas} recomendaciones={recomendaciones} insumos={insumos} />
      ) : (
        <>
          {puedeCrear && sugerencias.length > 0 && (
            <div className="mb-6 rounded-2xl border border-purple-200 bg-purple-50/60 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-purple-900">
                <Sparkles className="h-4 w-4" /> Sugerencias del historial
              </p>
              <div className="space-y-2">
                {sugerencias.map((g) => (
                  <div
                    key={`${g.cultivo_id}-${g.etapa}-${g.insumo_id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm"
                  >
                    <p>
                      <strong>{mapaInsumo[g.insumo_id]?.nombre_comercial ?? 'Insumo'}</strong> en{' '}
                      {nombreCultivo(g.cultivo_id)}, etapa {nombreEtapa(g.etapa).toLowerCase()}:{' '}
                      {g.veces} aplicaciones, dosis promedio {fmt(g.dosis, 3)}{' '}
                      {cortoUnidadInsumo(mapaInsumo[g.insumo_id]?.unidad_medida)}/ha.
                    </p>
                    <button onClick={() => desdeSugerencia(g)} className="btn-ghost border border-purple-300 !py-1.5 text-purple-800">
                      Crear recomendación
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 max-w-xs">
            <select className="input" value={filtroCultivo} onChange={(e) => setFiltroCultivo(e.target.value)}>
              <option value="">Todos los cultivos</option>
              {cultivos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_comun}
                  {c.variedad ? ` · ${c.variedad}` : ''}
                </option>
              ))}
            </select>
          </div>

          {visibles.length === 0 ? (
            <div className="card flex flex-col items-center p-12 text-center">
              <Lightbulb className="h-10 w-10 text-stone-300" />
              <p className="mt-3 font-semibold">No hay recomendaciones registradas</p>
              <p className="text-sm text-stone-500">
                {puedeCrear ? 'Crea la primera con el botón "Nueva recomendación".' : 'Aún no se han registrado.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((r) => {
                const insumo = mapaInsumo[r.insumo_id];
                return (
                  <div key={r.id} className={`card flex flex-col p-5 ${r.estado === 'inactivo' ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold">{insumo?.nombre_comercial ?? 'Insumo'}</h3>
                        <p className="truncate text-sm text-stone-600">{nombreCultivo(r.cultivo_id)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${claseFuente(r.fuente)}`}>
                        {nombreFuente(r.fuente)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">
                        {r.etapa ? nombreEtapa(r.etapa) : 'Cualquier etapa'}
                      </span>
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-800">
                        {fmt(r.dosis_ha, 3)} {cortoUnidadInsumo(insumo?.unidad_medida)}/ha
                      </span>
                    </div>

                    {r.momento_aplicacion && (
                      <p className="mt-3 text-sm text-stone-700">
                        <strong>Cuándo:</strong> {r.momento_aplicacion}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-stone-600">{r.justificacion}</p>
                    {r.estado === 'inactivo' && <p className="mt-3 text-xs font-semibold text-stone-500">Recomendación inactiva</p>}

                    {puedeEditar && (
                      <div className="mt-auto flex gap-2 border-t border-stone-100 pt-4">
                        <button
                          onClick={() => setModal({ recomendacion: r, inicial: null })}
                          className="btn-ghost mt-4 flex-1 !py-2"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <button onClick={() => cambiarEstado(r)} className="btn-ghost mt-4 flex-1 !py-2">
                          <Power className="h-4 w-4" /> {r.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        abierto={Boolean(modal)}
        titulo={modal?.recomendacion ? 'Editar recomendación' : 'Nueva recomendación'}
        onCerrar={() => setModal(null)}
        ancho="max-w-2xl"
      >
        {modal && (
          <FormRecomendacion
            recomendacion={modal.recomendacion}
            inicial={modal.inicial}
            cultivos={cultivos}
            insumos={insumos}
            onGuardado={async () => {
              setModal(null);
              await cargar();
              notificar('Recomendación guardada');
            }}
            onCerrar={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}