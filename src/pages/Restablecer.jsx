import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Leaf, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { actualizarPassword, traducirErrorAuth } from '../services/authService';

export default function Restablecer() {
  // verificando | listo | invalido | exito
  const [estado, setEstado] = useState('verificando');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    // Si el enlace venció, Supabase lo indica en la dirección
    if (/[#?&]error(_code|_description)?=/.test(window.location.hash + window.location.search)) {
      setEstado('invalido');
      return undefined;
    }

    let activo = true;

    const { data: listener } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'PASSWORD_RECOVERY') {
        setEstado((e) => (e === 'verificando' || e === 'invalido' ? 'listo' : e));
      }
    });

    // Respaldo: si tras un instante hay sesión, el enlace fue válido
    const temporizador = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (activo) {
        setEstado((e) => (e === 'verificando' ? (data.session ? 'listo' : 'invalido') : e));
      }
    }, 1200);

    return () => {
      activo = false;
      clearTimeout(temporizador);
      listener.subscription.unsubscribe();
    };
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setGuardando(true);
    try {
      await actualizarPassword(password);
      // Se cierra la sesión de recuperación para que ingreses con la clave nueva
      localStorage.removeItem('sesion_id');
      await supabase.auth.signOut();
      setEstado('exito');
    } catch (err) {
      setError(traducirErrorAuth(err.message));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-stone-100 p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-700 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">La Querencia</span>
        </div>

        <div className="card p-8">
          {estado === 'verificando' && (
            <div className="flex flex-col items-center py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-700" />
              <p className="mt-3 text-sm text-stone-500">Verificando el enlace…</p>
            </div>
          )}

          {estado === 'invalido' && (
            <div className="text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
              <h1 className="mt-3 text-xl font-extrabold">Enlace no válido</h1>
              <p className="mt-2 text-sm text-stone-600">
                Este enlace venció o ya fue usado. Solicita uno nuevo desde el inicio de sesión.
              </p>
              <Link to="/login" className="btn-primary mt-6 w-full">
                Volver al inicio de sesión
              </Link>
            </div>
          )}

          {estado === 'exito' && (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
              <h1 className="mt-3 text-xl font-extrabold">Contraseña actualizada</h1>
              <p className="mt-2 text-sm text-stone-600">
                Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <Link to="/login" className="btn-primary mt-6 w-full">
                Iniciar sesión
              </Link>
            </div>
          )}

          {estado === 'listo' && (
            <form onSubmit={guardar} className="space-y-5">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h1 className="mt-3 text-xl font-extrabold">Crea tu nueva contraseña</h1>
                <p className="mt-1 text-sm text-stone-500">Elige una que puedas recordar.</p>
              </div>

              <div>
                <label className="label">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={ver ? 'text' : 'password'}
                    className="input pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVer(!ver)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {ver ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirmar contraseña</label>
                <input
                  type={ver ? 'text' : 'password'}
                  className="input"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repite la contraseña"
                  minLength={6}
                  required
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={guardando} className="btn-primary w-full">
                {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar contraseña
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}