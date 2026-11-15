import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Bell, CheckCheck, Inbox, Loader2, Send } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotificaciones } from '../../context/NotificacionesContext';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import { formatearFecha } from '../../utils/formato';

/* ---------------------- Bandeja de entrada ---------------------- */
function Recibidas() {
  const { perfil } = useAuth();
  const { version, recargar, noLeidas } = useNotificaciones();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('notificacion_destinatarios')
      .select(
        'id, leida, fecha_lectura, created_at, notificaciones(id, asunto, mensaje, fecha_envio, remitente_nombre)'
      )
      .eq('usuario_id', perfil.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (err) setError('No se pudieron cargar las notificaciones.');
    setItems(data || []);
    setCargando(false);
  }, [perfil.id]);

  // Se vuelve a cargar cuando llega una notificación nueva (tiempo real)
  useEffect(() => {
    cargar();
  }, [cargar, version]);

  const marcarLeida = async (item) => {
    if (item.leida) return;
    await supabase
      .from('notificacion_destinatarios')
      .update({ leida: true, fecha_lectura: new Date().toISOString() })
      .eq('id', item.id);
    recargar();
  };

  const marcarTodas = async () => {
    await supabase
      .from('notificacion_destinatarios')
      .update({ leida: true, fecha_lectura: new Date().toISOString() })
      .eq('usuario_id', perfil.id)
      .eq('leida', false);
    recargar();
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
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {noLeidas > 0 && (
        <div className="mb-4 flex justify-end">
          <button onClick={marcarTodas} className="btn-ghost text-green-700">
            <CheckCheck className="h-4 w-4" /> Marcar todas como leídas
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <Bell className="h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold">No tienes notificaciones</p>
          <p className="text-sm text-stone-500">Cuando recibas un mensaje aparecerá aquí.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const n = item.notificaciones;
            if (!n) return null;
            return (
              <button
                key={item.id}
                onClick={() => marcarLeida(item)}
                className={`card block w-full p-5 text-left transition hover:shadow-md ${
                  item.leida ? 'opacity-70' : 'border-green-300 bg-green-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {!item.leida && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-green-600" />}
                    <div>
                      <p className="font-bold">{n.asunto}</p>
                      <p className="mt-1 whitespace-pre-line text-sm text-stone-600">{n.mensaje}</p>
                      <p className="mt-3 text-xs text-stone-500">
                        De {n.remitente_nombre || 'Sistema'} · {formatearFecha(n.fecha_envio)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.leida ? 'bg-stone-200 text-stone-600' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {item.leida ? 'Leída' : 'Nueva'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------- Formulario de envío ---------------------- */
function Enviar() {
  const [tipo, setTipo] = useState('usuario'); // 'usuario' | 'rol'
  const [destino, setDestino] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    (async () => {
      const [u, r] = await Promise.all([
        supabase.rpc('listar_destinatarios'),
        supabase.from('roles').select('*').order('nivel', { ascending: false }),
      ]);
      setUsuarios(u.data || []);
      setRoles(r.data || []);
    })();
  }, []);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    if (!destino) {
      setError('Selecciona un destinatario.');
      return;
    }
    setEnviando(true);
    const { error: err } = await supabase.rpc('enviar_notificacion', {
      p_asunto: asunto.trim(),
      p_mensaje: mensaje.trim(),
      p_usuario_id: tipo === 'usuario' ? destino : null,
      p_rol_id: tipo === 'rol' ? Number(destino) : null,
    });
    setEnviando(false);

    if (err) {
      setError(err.message || 'No se pudo enviar la notificación.');
      return;
    }
    setExito('Notificación enviada correctamente.');
    setAsunto('');
    setMensaje('');
    setDestino('');
  };

  return (
    <form onSubmit={enviar} className="card max-w-2xl space-y-5 p-6">
      <div>
        <label className="label">Enviar a</label>
        <div className="flex gap-2">
          {[
            { clave: 'usuario', nombre: 'Un usuario' },
            { clave: 'rol', nombre: 'Todo un rol' },
          ].map((op) => (
            <button
              type="button"
              key={op.clave}
              onClick={() => {
                setTipo(op.clave);
                setDestino('');
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                tipo === op.clave
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {op.nombre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{tipo === 'usuario' ? 'Usuario' : 'Rol'}</label>
        <select
          className="input"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          required
        >
          <option value="">Selecciona…</option>
          {tipo === 'usuario'
            ? usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre_completo} ({u.rol})
                </option>
              ))
            : roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
        </select>
      </div>

      <div>
        <label className="label">Asunto</label>
        <input
          className="input"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          maxLength={120}
          placeholder="Ej. Fumigación del lote 3 mañana"
          required
        />
      </div>

      <div>
        <label className="label">Mensaje</label>
        <textarea
          className="input min-h-[120px] resize-y"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe el mensaje…"
          required
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {exito && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{exito}</div>}

      <button type="submit" disabled={enviando} className="btn-primary">
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Enviar notificación
      </button>
    </form>
  );
}

/* ---------------------- Página ---------------------- */
export default function Notificaciones() {
  const { puedeEnviarNotificaciones } = useAuth();
  const [tab, setTab] = useState('recibidas');

  const tabs = [{ clave: 'recibidas', nombre: 'Recibidas', icono: Inbox }];
  if (puedeEnviarNotificaciones) tabs.push({ clave: 'enviar', nombre: 'Enviar', icono: Send });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        icono={Bell}
        titulo="Notificaciones"
        descripcion="Comunicación interna con trazabilidad entre capataz y trabajadores."
      />
      {tabs.length > 1 && <Tabs tabs={tabs} activa={tab} onChange={setTab} />}

      {tab === 'recibidas' && <Recibidas />}
      {tab === 'enviar' && puedeEnviarNotificaciones && <Enviar />}
    </div>
  );
}