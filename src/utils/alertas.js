import Swal from 'sweetalert2';

// Estilos con las mismas clases de la app (botones verdes, bordes redondeados)
const clases = (peligro = false) => ({
  popup: '!rounded-2xl !p-6 !font-sans',
  title: '!text-xl !font-extrabold !text-stone-800',
  htmlContainer: '!text-sm !text-stone-600',
  actions: '!gap-3',
  confirmButton: peligro
    ? 'btn bg-red-600 text-white shadow-sm hover:bg-red-700'
    : 'btn-primary',
  cancelButton: 'btn-ghost border border-stone-300',
});

const base = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: true,
  allowOutsideClick: false,
});

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: { popup: '!rounded-xl !font-sans' },
});

const escapar = (texto = '') =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Pregunta de confirmación. Devuelve true si el usuario acepta.
export async function confirmar({
  titulo,
  texto,
  confirmar: textoConfirmar = 'Confirmar',
  peligro = false,
}) {
  const resultado = await base.fire({
    titleText: titulo,
    text: texto,
    icon: 'warning',
    iconColor: peligro ? '#dc2626' : '#f59e0b',
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: 'Cancelar',
    customClass: clases(peligro),
  });
  return resultado.isConfirmed;
}

// Aviso pequeño que aparece arriba a la derecha y se cierra solo
export function notificar(titulo, icono = 'success') {
  return toast.fire({ icon: icono, title: titulo });
}

// Ventana de error con el mensaje
export function mostrarError(titulo, texto) {
  return base.fire({
    titleText: titulo,
    text: texto,
    icon: 'error',
    confirmButtonText: 'Entendido',
    customClass: clases(),
  });
}

// Datos de acceso de una cuenta recién creada (la contraseña no se vuelve a mostrar)
export function mostrarCredenciales({ nombre, correo, password }) {
  return base.fire({
    titleText: 'Cuenta de acceso creada',
    icon: 'success',
    iconColor: '#16a34a',
    html: `
      <p style="margin-bottom:14px">
        Entrega estos datos a <strong>${escapar(nombre)}</strong>.
        La contraseña no se volverá a mostrar.
      </p>
      <div style="text-align:left;background:#f5f5f4;border-radius:12px;padding:14px 16px;line-height:1.9">
        <div><span style="color:#78716c">Correo:</span> <strong>${escapar(correo)}</strong></div>
        <div><span style="color:#78716c">Contraseña:</span>
          <strong style="font-family:monospace;font-size:1.05em">${escapar(password)}</strong>
        </div>
      </div>
    `,
    confirmButtonText: 'Listo, ya los anoté',
    focusCancel: false,
    customClass: clases(),
  });
}