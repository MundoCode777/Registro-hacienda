import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle, CalendarCheck, Eye, EyeOff, Leaf, Loader2, Package, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const traducirError = (msg = '') => {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('already registered')) return 'Este correo ya está registrado.';
  if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('Email not confirmed')) return 'Debes confirmar tu correo antes de ingresar.';
  if (msg.includes('rate limit')) return 'Demasiados intentos. Espera un momento.';
  return msg || 'Ocurrió un error. Intenta de nuevo.';
};

export default function Login() {
  const { session, perfil, signIn, signUp } = useAuth();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);

  if (session && perfil) return <Navigate to="/" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setAviso('');
    setCargando(true);
    try {
      if (modoRegistro) {
        const data = await signUp(nombre.trim(), correo.trim(), password);
        if (!data.session) {
          setAviso('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.');
          setModoRegistro(false);
        }
      } else {
        await signIn(correo.trim(), password);
      }
    } catch (err) {
      setError(traducirError(err.message));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel decorativo */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-green-800 via-green-900 to-green-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-green-600/20" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-green-500/10" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600">
            <Leaf className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">Hacienda La Querencia</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">
            Agenda digital para planificar, <br /> ejecutar y recomendar.
          </h1>
          <p className="mt-4 max-w-md text-green-200">
            Programa las actividades agrícolas, da seguimiento en campo y recibe recomendaciones
            de insumos para cada cultivo.
          </p>

          <ul className="mt-10 space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-green-400" /> Programación y seguimiento de actividades
            </li>
            <li className="flex items-center gap-3">
              <Sprout className="h-5 w-5 text-green-400" /> Control de lotes, cultivos y siembras
            </li>
            <li className="flex items-center gap-3">
              <Package className="h-5 w-5 text-green-400" /> Inventario y recomendaciones de insumos
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-green-400">© Hacienda La Querencia</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-700 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">La Querencia</span>
          </div>

          <h2 className="text-2xl font-extrabold">
            {modoRegistro ? 'Crear cuenta' : 'Bienvenido de nuevo'}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {modoRegistro
              ? 'Regístrate para acceder al sistema.'
              : 'Ingresa tus credenciales para continuar.'}
          </p>

          <form onSubmit={enviar} className="mt-8 space-y-5">
            {modoRegistro && (
              <div>
                <label className="label">Nombre completo</label>
                <input
                  className="input"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Luis Rodríguez"
                  required
                />
              </div>
            )}

            <div>
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                className="input"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  type={verPassword ? 'text' : 'password'}
                  className="input pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {verPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {aviso && (
              <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{aviso}</div>
            )}

            <button type="submit" disabled={cargando} className="btn-primary w-full">
              {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
              {modoRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            {modoRegistro ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setModoRegistro(!modoRegistro);
                setError('');
                setAviso('');
              }}
              className="font-semibold text-green-700 hover:underline"
            >
              {modoRegistro ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}