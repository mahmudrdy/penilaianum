// Fungsi utilitas untuk SweetAlert2 Notifikasi
export const showSuccess = (title, text) => {
    return Swal.fire({
        icon: 'success',
        title: title,
        html: text, // Menggunakan html agar tag <br> dan <b> terbaca dengan benar
        confirmButtonColor: '#10b981',
        customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-2 font-medium'
        }
    });
};

export const showToast = (title, icon = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
    Toast.fire({
        icon: icon,
        title: title
    });
};

export const showError = (title, text) => {
    return Swal.fire({
        icon: 'error',
        title: title,
        html: text, // Menggunakan html agar tag HTML terbaca
        confirmButtonColor: '#f43f5e',
        customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-2 font-medium'
        }
    });
};

export const showLoading = (title) => {
    Swal.fire({
        title: title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
        customClass: {
            popup: 'rounded-2xl'
        }
    });
};

export const hideLoading = () => {
    Swal.close();
};

export const generateToken = () => {
    // Menghasilkan token acak 6 karakter kombinasi angka dan huruf besar
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TKN-${token}`;
};

window.utils = {
    showSuccess,
    showToast,
    showError,
    showLoading,
    hideLoading,
    generateToken
};
