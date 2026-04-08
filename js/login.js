// login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const tokenInput = document.getElementById('token');

    // Cek jika sudah login
    if (localStorage.getItem('teacherData')) {
        window.location.href = 'teacher.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = tokenInput.value.trim();
        
        if (!token) {
            window.utils.showError("Error", "Token tidak boleh kosong!");
            return;
        }

        if (!window.db) {
            window.utils.showError("Error", "Firestore tidak terhubung.");
            return;
        }

        window.utils.showLoading("Mencari Token...");

        try {
            // Firestore: cek document dengan id token di collection teachers
            const { doc, getDoc } = window.firestore;
            const docRef = doc(window.db, "teachers", token);
            const docSnap = await getDoc(docRef);

            window.utils.hideLoading();

            if (docSnap.exists()) {
                const teacherData = docSnap.data();
                
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
            window.utils.showError("Error Jaringan", "Terjadi kesalahan saat memverifikasi token. Pastikan Firestore rules sudah terbuka.");
        }
    });
});
