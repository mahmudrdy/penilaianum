// login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const tokenInput = document.getElementById('token');

    // Cek jika sudah login sebagai guru
    if (localStorage.getItem('teacherData')) {
        window.location.href = 'teacher.html';
        return;
    }
    // Cek jika sudah login sebagai admin
    if (localStorage.getItem('adminData')) {
        window.location.href = 'admin.html';
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = tokenInput.value.trim().toUpperCase();
        
        if (!token) {
            window.utils.showError("Error", "Token tidak boleh kosong!");
            return;
        }

        if (!window.db) {
            window.utils.showError("Error", "Firestore tidak terhubung.");
            return;
        }

        window.utils.showLoading("Memverifikasi Token...");

        try {
            const { doc, getDoc } = window.firestore;

            // 1) Cek apakah token adalah token ADMIN
            const adminRef = doc(window.db, "admin_token", token);
            const adminSnap = await getDoc(adminRef);

            if (adminSnap.exists()) {
                localStorage.setItem('adminData', JSON.stringify({ token: token }));
                window.utils.hideLoading();
                await window.utils.showSuccess("Login Admin", "Selamat datang, Administrator!");
                window.location.href = 'admin.html';
                return;
            }

            // 2) Cek apakah token adalah token GURU
            const teacherRef = doc(window.db, "teachers", token);
            const teacherSnap = await getDoc(teacherRef);

            window.utils.hideLoading();

            if (teacherSnap.exists()) {
                const teacherData = teacherSnap.data();
                localStorage.setItem('teacherData', JSON.stringify({
                    token: token,
                    name: teacherData.name,
                    subject: teacherData.subject
                }));
                await window.utils.showSuccess("Berhasil Login", `Selamat datang, ${teacherData.name}!`);
                window.location.href = 'teacher.html';
            } else {
                window.utils.showError("Akses Ditolak", "Token tidak ditemukan atau tidak valid.");
            }
        } catch (error) {
            window.utils.hideLoading();
            console.error(error);
            window.utils.showError("Error Jaringan", "Terjadi kesalahan saat memverifikasi token.");
        }
    });
});
