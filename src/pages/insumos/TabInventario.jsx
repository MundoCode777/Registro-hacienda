import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Loader2,
  Package,
  PackagePlus,
  Search,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import FormLote from './FormLote';
import LotesInsumo from './LotesInsumo';
import { darDeBajaLote, listarInsumos, listarLotesInventario } from '../../services/insumosService';
import { mensajeError } from '../../utils/errores';
import { mostrarError, notificar } from '../../utils/alertas';
import { pedirTexto } from '../../utils/dialogos';
import { sumarDias } from '../../utils/cultivos';
import {
  CATEGORIAS,
  claseCategoria,
  cortoUnidadInsumo,
  dinero,
  estadoStock,
  estadoVencimiento,
  nombreCategoria,
} from '../../utils/insumos';
import { fmt, formatearDia, hoyISO } from '../../utils/suelo';

function Resumen({ icono: Icono, etiqueta, valor, alerta }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          alerta ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
        }`}
      >
        <Icono className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500">{etiqueta}</p>
        <p className="text-xl font-extrabold">{valor}</p>
      </div>
    </div>
  );
}

export default function TabInventario() {
  const { puede } = useAuth();
  const puedeCrear = puede('insumos', 'crear');
  const puedeEditar = puede('insumos', 'actualizar');

  const [insumos, setInsumos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [soloAlertas, setSoloAlertas] = useState(false);
  // { tipo: 'lotes', insumoId } | { tipo: 'form', insumoId, lote, volver }
  const [modal, setModal] = useState(null);

  const hoy = hoyISO();
  const limite = sumarDias(hoy, 30);

  const cargar = useCallback(async () => {
    try {
      const [i, l] = await Promise.all([listarInsumos(), listarLotesInventario()]);
      setInsumos(i);
      setLotes(l);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar el inventario.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const lotesConSaldo = useMemo(
    () => lotes.filter((l) => l.estado === 'activo' && Number(l.cantidad_actual) > 0),
    [lotes]
  );

  const infoPorInsumo = useMemo(() => {
    const mapa = {};
    lotesConSaldo.forEach((l) => {
      if (!mapa[l.insumo_id]) mapa[l.insumo_id] = { vencidos: 0, proximo: null };
      const info = mapa[l.insumo_id];
      if (!l.fecha_vencimiento) return;
      if (l.fecha_vencimiento < hoy) info.vencidos += 1;
      else if (!info.proximo || l.fecha_vencimiento < info.proximo) info.proximo = l.fecha_vencimiento;
    });
    return mapa;
  }, [lotesConSaldo, hoy]);

  const mapaInsumo = useMemo(() => {
    const m = {};
    insumos.forEach((i) => {
      m[i.id] = i;
    });
    return m;
  }, [insumos]);

  const resumen = useMemo(() => {
    const activos = insumos.filter((i) => i.estado === 'activo');
    const bajos = activos.filter((i) => estadoStock(i).nivel !== 'ok' && Number(i.stock_minimo) > 0);
    const vencidos = lotesConSaldo.filter((l) => l.fecha_vencimiento && l.fecha_vencimiento < hoy);
    const porVencer = lotesConSaldo.filter(
      (l) => l.fecha_vencimiento && l.fecha_vencimiento >= hoy && l.fecha_vencimiento <= limite
    );
    const valor = lotesConSaldo
      .filter((l) => !l.fecha_vencimiento || l.fecha_vencimiento >= hoy)
      .reduce((suma, l) => suma + Number(l.cantidad_actual) * Number(l.costo_unitario), 0);
    return { activos: activos.length, bajos, vencidos, porVencer, valor };
  }, [insumos, lotesConSaldo, hoy, limite]);

  const tieneAlerta = useCallback(
    (i) => {
      const info = infoPorInsumo[i.id];
      return (
        estadoStock(i).nivel !== 'ok' ||
        Boolean(info && (info.vencidos > 0 || (info.proximo && info.proximo <= limite)))
      );
    },
    [infoPorInsumo, limite]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return insumos.filter(
      (i) =>
        i.estado === 'activo' &&
        (!categoria || i.categoria === categoria) &&
        `${i.nombre_comercial} ${i.nombre_generico ?? ''}`.toLowerCase().includes(q) &&
        (!soloAlertas || tieneAlerta(i))
    );
  }, [insumos, busqueda, categoria, soloAlertas, tieneAlerta]);

  const insumoModal = modal ? mapaInsumo[modal.insumoId] : null;

  const cerrarForm = () => setModal((m) => (m?.volver ? { tipo: 'lotes', insumoId: m.insumoId } : null));

  const alGuardarLote = async () => {
    await cargar();
    cerrarForm();
    notificar('Lote guardado');
  };

  const darDeBaja = async (lote) => {
    const unidad = cortoUnidadInsumo(mapaInsumo[lote.insumo_id]?.unidad_medida);
    const motivo = await pedirTexto({
      titulo: '¿Dar de baja este lote?',
      texto: `El saldo de ${fmt(lote.cantidad_actual, 3)} ${unidad} dejará de contar como stock. Esta acción no se puede deshacer.`,
      placeholder: 'Ej. Producto vencido, empaque dañado…',
      confirmar: 'Sí, dar de baja',
    });
    if (!motivo) return;
    try {
      await darDeBajaLote(lote.id, motivo);
      await cargar();
      notificar('Lote dado de baja');
    } catch (err) {
      mostrarError('No se pudo dar de baja el lote', mensajeError(err));
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>
    );
  }

  const hayAlertas = resumen.bajos.length + resumen.vencidos.length + resumen.porVencer.length > 0;
  const nombreDe = (id) => mapaInsumo[id]?.nombre_comercial ?? 'Insumo';

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Resumen icono={Package} etiqueta="Insumos activos" valor={resumen.activos} />
        <Resumen icono={AlertTriangle} etiqueta="Con stock bajo" valor={resumen.bajos.length} alerta={resumen.bajos.length > 0} />
        <Resumen
          icono={AlertTriangle}
          etiqueta="Lotes por vencer"
          valor={resumen.porVencer.length + resumen.vencidos.length}
          alerta={resumen.porVencer.length + resumen.vencidos.length > 0}
        />
        <Resumen icono={Wallet} etiqueta="Valor del inventario" valor={dinero(resumen.valor)} />
      </div>

      {hayAlertas && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="mb-2 flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4" /> Requieren atención
          </p>
          <ul className="space-y-1">
            {resumen.vencidos.map((l) => (
              <li key={l.id}>
                <strong>{nombreDe(l.insumo_id)}</strong>: lote vencido el {formatearDia(l.fecha_vencimiento)} con{' '}
                {fmt(l.cantidad_actual, 3)} {cortoUnidadInsumo(mapaInsumo[l.insumo_id]?.unidad_medida)} sin usar. No se
                aplicará; dalo de baja.
              </li>
            ))}
            {resumen.porVencer.map((l) => (
              <li key={l.id}>
                <strong>{nombreDe(l.insumo_id)}</strong>: un lote vence el {formatearDia(l.fecha_vencimiento)} y quedan{' '}
                {fmt(l.cantidad_actual, 3)} {cortoUnidadInsumo(mapaInsumo[l.insumo_id]?.unidad_medida)}.
              </li>
            ))}
            {resumen.bajos.map((i) => (
              <li key={i.id}>
                <strong>{i.nombre_comercial}</strong>: quedan {fmt(i.stock_disponible, 3)}{' '}
                {cortoUnidadInsumo(i.unidad_medida)} (mínimo {fmt(i.stock_minimo, 3)}).
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input className="input pl-10" placeholder="Buscar insumo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <select className="input !w-auto" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.nombre}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {[
            { clave: false, nombre: 'Todos' },
            { clave: true, nombre: 'Con alerta' },
          ].map((f) => (
            <button
              key={String(f.clave)}
              onClick={() => setSoloAlertas(f.clave)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                soloAlertas === f.clave
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {f.nombre}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <Boxes className="h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold">No hay insumos para mostrar</p>
          <p className="text-sm text-stone-500">Crea los insumos en la pestaña Catálogo y luego registra su ingreso aquí.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((i) => {
            const estado = estadoStock(i);
            const info = infoPorInsumo[i.id];
            const venc = info?.proximo ? estadoVencimiento(info.proximo) : null;
            const unidad = cortoUnidadInsumo(i.unidad_medida);
            return (
              <div key={i.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold">{i.nombre_comercial}</h3>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${claseCategoria(i.categoria)}`}>
                      {nombreCategoria(i.categoria)}
                    </span>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${estado.clase}`}>
                    {estado.texto}
                  </span>
                </div>

                <p className="mt-4 text-3xl font-extrabold text-green-800">
                  {fmt(i.stock_disponible, 3)} <span className="text-sm font-medium text-stone-500">{unidad}</span>
                </p>
                {Number(i.stock_minimo) > 0 && (
                  <p className="text-xs text-stone-500">
                    Mínimo de alerta: {fmt(i.stock_minimo, 3)} {unidad}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {venc && venc.nivel !== 'ok' && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${venc.clase}`}>
                      Próximo lote: {venc.texto.toLowerCase()}
                    </span>
                  )}
                  {info?.vencidos > 0 && (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                      {info.vencidos} {info.vencidos === 1 ? 'lote vencido' : 'lotes vencidos'}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex gap-2 border-t border-stone-100 pt-4">
                  <button
                    onClick={() => setModal({ tipo: 'lotes', insumoId: i.id })}
                    className="btn-ghost mt-4 flex-1 !py-2"
                  >
                    <Boxes className="h-4 w-4" /> Lotes
                  </button>
                  {puedeCrear && (
                    <button
                      onClick={() => setModal({ tipo: 'form', insumoId: i.id, lote: null, volver: false })}
                      className="btn-primary mt-4 flex-1 !py-2"
                    >
                      <PackagePlus className="h-4 w-4" /> Ingreso
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        abierto={modal?.tipo === 'lotes' && Boolean(insumoModal)}
        titulo={insumoModal ? `Lotes de ${insumoModal.nombre_comercial}` : 'Lotes'}
        onCerrar={() => setModal(null)}
        ancho="max-w-4xl"
      >
        {modal?.tipo === 'lotes' && insumoModal && (
          <LotesInsumo
            insumo={insumoModal}
            lotes={[...lotes.filter((l) => l.insumo_id === insumoModal.id)].sort((a, b) =>
              b.fecha_ingreso.localeCompare(a.fecha_ingreso)
            )}
            puedeCrear={puedeCrear}
            puedeEditar={puedeEditar}
            onIngreso={() => setModal({ tipo: 'form', insumoId: insumoModal.id, lote: null, volver: true })}
            onEditar={(l) => setModal({ tipo: 'form', insumoId: insumoModal.id, lote: l, volver: true })}
            onBaja={darDeBaja}
          />
        )}
      </Modal>

      <Modal
        abierto={modal?.tipo === 'form'}
        titulo={modal?.lote ? 'Editar lote' : 'Registrar ingreso de insumo'}
        onCerrar={cerrarForm}
      >
        {modal?.tipo === 'form' && (
          <FormLote
            lote={modal.lote}
            insumoId={modal.insumoId}
            insumos={insumos}
            onGuardado={alGuardarLote}
            onCerrar={cerrarForm}
          />
        )}
      </Modal>
    </div>
  );
}