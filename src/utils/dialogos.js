import Swal from 'sweetalert2';

// Pide un texto obligatorio (por ejemplo, el motivo de una baja o una anulación).
// Devuelve el texto escrito, o null si la persona cancela.
export async function pedirTexto({
  titulo,
  texto,
  placeholder = '',
  confirmar = 'Confirmar',
  peligro = true,
}) {
  const resultado = await Swal.fire({
    titleText: titulo,
    text: texto,
    input: 'textarea',
    inputPlaceholder: placeholder,
    icon: 'warning',
    iconColor: peligro ? '#dc2626' : '#f59e0b',
    showCancelButton: true,
    confirmButtonText: confirmar,
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    buttonsStyling: false,
    allowOutsideClick: false,
    inputValidator: (valor) =>
      !valor || !valor.trim() ? 'Escribe el motivo para continuar.' : undefined,
    customClass: {
      popup: '!rounded-2xl !p-6 !font-sans',
      title: '!text-xl !font-extrabold !text-stone-800',
      htmlContainer: '!text-sm !text-stone-600',
      input: '!rounded-xl !border-stone-300 !text-sm',
      actions: '!gap-3',
      confirmButton: peligro
        ? 'btn bg-red-600 text-white shadow-sm hover:bg-red-700'
        : 'btn-primary',
      cancelButton: 'btn-ghost border border-stone-300',
    },
  });
  return resultado.isConfirmed ? resultado.value.trim() : null;
}