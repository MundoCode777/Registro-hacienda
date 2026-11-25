import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle, CalendarCheck, Eye, EyeOff, Leaf, Loader2, Package, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { enviarRecuperacion, traducirErrorAuth } from '../services/authService';

const TEXTOS = {
  login: {
    titulo: 'Bienvenido de nuevo',
    subtitulo: 'Ingresa tus credenciales para continuar.',
    boton: 'Iniciar sesión',
  },
  registro: {
    titulo: 'Crear cuenta',
    subtitulo: 'Regístrate para acceder al sistema.',
    boton: 'Crear cuenta',
  },
  recuperar: {
    titulo: 'Recuperar contraseña',
    subtitulo: 'Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.',
    boton: 'Enviar enlace',
  },
};

export default function Login() {
  const { session, perfil, signIn, signUp } = useAuth();
  const [modo, setModo] = useState('login'); // login | registro | recuperar
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);

  if (session && perfil) return <Navigate to="/" replace />;

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setError('');
    setAviso('');
    setPassword('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setAviso('');
    setCargando(true);
    try {
      if (modo === 'recuperar') {
        await enviarRecuperacion(correo);
        setAviso(
          'Si el correo está registrado, recibirás un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.'
        );
      } else if (modo === 'registro') {
        const data = await signUp(nombre.trim(), correo.trim(), password);
        if (!data.session) {
          cambiarModo('login');
          setAviso('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.');
        }
      } else {
        await signIn(correo.trim(), password);
      }
    } catch (err) {
      setError(traducirErrorAuth(err.message));
    } finally {
      setCargando(false);
    }
  };

  const texto = TEXTOS[modo];

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

          <h2 className="text-2xl font-extrabold">{texto.titulo}</h2>
          <p className="mt-1 text-sm text-stone-500">{texto.subtitulo}</p>

          <form onSubmit={enviar} className="mt-8 space-y-5">
            {modo === 'registro' && (
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

            {modo !== 'recuperar' && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-stone-700">Contraseña</label>
                  {modo === 'login' && (
                    <button
                      type="button"
                      onClick={() => cambiarModo('recuperar')}
                      className="text-sm font-semibold text-green-700 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
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
            )}

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
              {texto.boton}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            {modo === 'recuperar' ? (
              <button
                type="button"
                onClick={() => cambiarModo('login')}
                className="font-semibold text-green-700 hover:underline"
              >
                Volver al inicio de sesión
              </button>
            ) : (
              <>
                {modo === 'registro' ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => cambiarModo(modo === 'registro' ? 'login' : 'registro')}
                  className="font-semibold text-green-700 hover:underline"
                >
                  {modo === 'registro' ? 'Inicia sesión' : 'Regístrate'}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}