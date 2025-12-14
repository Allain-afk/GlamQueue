import Swal from 'sweetalert2';

const glamToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  // Use Tailwind classes; keep buttonsStyling off so SweetAlert2 doesn't override.
  buttonsStyling: false,
  customClass: {
    popup: 'rounded-xl border border-gray-200 shadow-lg',
    title: 'text-sm font-semibold text-gray-900',
  },
});

export async function glamConfirm(options: {
  title: string;
  text?: string;
  confirmText: string;
  cancelText?: string;
}): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning',
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmText,
    cancelButtonText: options.cancelText ?? 'Cancel',
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-2xl border border-gray-200 shadow-2xl',
      title: 'text-lg font-bold text-gray-900',
      htmlContainer: 'text-sm text-gray-600',
      actions: 'gap-2',
      confirmButton:
        'px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700',
      cancelButton:
        'px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50',
    },
  });

  return result.isConfirmed;
}

export function glamSuccess(message: string) {
  glamToast.fire({ icon: 'success', title: message });
}

export function glamError(message: string) {
  glamToast.fire({ icon: 'error', title: message });
}

export function glamWarning(message: string) {
  glamToast.fire({ icon: 'warning', title: message });
}

export function glamInfo(message: string) {
  glamToast.fire({ icon: 'info', title: message });
}

export async function glamInfoDialog(options: {
  title: string;
  text: string;
  confirmText?: string;
}) {
  await Swal.fire({
    icon: 'info',
    title: options.title,
    text: options.text,
    confirmButtonText: options.confirmText ?? 'OK',
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-2xl border border-gray-200 shadow-2xl',
      title: 'text-lg font-bold text-gray-900',
      htmlContainer: 'text-sm text-gray-600',
      actions: 'gap-2',
      confirmButton:
        'px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700',
    },
  });
}
