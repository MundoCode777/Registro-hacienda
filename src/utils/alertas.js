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