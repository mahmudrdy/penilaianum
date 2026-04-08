// teacher.js
document.addEventListener('DOMContentLoaded', () => {

    const teacherDataRaw = localStorage.getItem('teacherData');
    if (!teacherDataRaw) {
        window.location.href = 'index.html'; 
        return;
    }

    const teacherData = JSON.parse(teacherDataRaw);
    const { collection, getDocs, doc, setDoc, query, orderBy } = window.firestore;

    const hpName = document.getElementById('headerTeacherName');
    const hpSubj = document.getElementById('headerTeacherSubject');
    const studentsTableBody = document.getElementById('studentsTableBody');
    const statsCount = document.getElementById('statsCount');
    const logoutBtn = document.getElementById('logoutBtn');
    const btnSaveAll = document.getElementById('btnSaveAll');

    hpName.textContent = teacherData.name;
    hpSubj.textContent = `Mapel: ${teacherData.subject}`;

    const filterContainer = document.getElementById('filterContainer');
    const collectionName = `grades_${teacherData.token}`;
    
    let allStudents = [];
    let savedGrades = {};
    let currentFilter = 'SEMUA';

    const loadClassFilters = async () => {
        try {
            const classSnap = await getDocs(collection(window.db, "classes"));
            let classesList = [];
            classSnap.forEach(docSnap => classesList.push(docSnap.data().name));
            classesList.sort();

            filterContainer.innerHTML = '';
            
            // "Semua" button
            const btnAll = document.createElement('button');
            btnAll.className = `filter-btn ${currentFilter === 'SEMUA' ? 'active bg-white shadow-sm text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'} flex-1 md:flex-none text-center px-4 py-2 rounded-lg text-sm transition`;
            btnAll.textContent = 'Semua';
            btnAll.dataset.filter = 'SEMUA';
            btnAll.addEventListener('click', handleFilterClick);
            filterContainer.appendChild(btnAll);

            // Dynamic class buttons
            classesList.forEach(className => {
                const btn = document.createElement('button');
                btn.className = `filter-btn ${currentFilter === className ? 'active bg-white shadow-sm text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'} flex-1 md:flex-none text-center px-4 py-2 rounded-lg text-sm transition`;
                btn.textContent = className;
                btn.dataset.filter = className;
                btn.addEventListener('click', handleFilterClick);
                filterContainer.appendChild(btn);
            });
        } catch (e) {
            console.error("Gagal memuat filter kelas:", e);
        }
    };

    const handleFilterClick = (e) => {
        const btn = e.currentTarget;
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.className = "filter-btn flex-1 md:flex-none text-center text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition";
        });
        btn.className = "filter-btn active flex-1 md:flex-none text-center bg-white shadow-sm text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold transition";
        
        currentFilter = btn.dataset.filter;
        renderTable();
    };

    const loadData = async () => {
        try {
            // 0. Ambil Filter Kelas Dinamis
            await loadClassFilters();

            // 1. Ambil Semua Siswa (dari Admin)
            let qSiswa;
            let snapshotSiswa;
            try {
                qSiswa = query(collection(window.db, "students"), orderBy("createdAt", "asc"));
                snapshotSiswa = await getDocs(qSiswa);
            } catch(e) {
                // fallback tanpa order (index requirement bypass)
                snapshotSiswa = await getDocs(collection(window.db, "students"));
            }
            
            allStudents = [];
            snapshotSiswa.forEach(docSnap => {
                allStudents.push({ id: docSnap.id, ...docSnap.data() });
            });

            // 2. Ambil Semua Nilai yang sudah disimpan guru ini
            const snapshotGrades = await getDocs(collection(window.db, collectionName));
            savedGrades = {};
            snapshotGrades.forEach(docSnap => {
                savedGrades[docSnap.id] = docSnap.data(); // Key id siswa karena kita akan gunakan ID siswa sebagai ID document grade
            });

            // Sort by kelas then by name
            allStudents.sort((a, b) => {
                const kA = a.kelas || "Lainnya";
                const kB = b.kelas || "Lainnya";
                if (kA < kB) return -1;
                if (kA > kB) return 1;
                return (a.name || "").localeCompare(b.name || "");
            });

            renderTable();

        } catch (err) {
            console.error(err);
            studentsTableBody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-red-500">Gagal memuat data: ${err.message}</td></tr>`;
        }
    };

    const renderTable = () => {
        studentsTableBody.innerHTML = '';
        
        let filteredStudents = allStudents;
        if (currentFilter !== 'SEMUA') {
            filteredStudents = allStudents.filter(s => (s.kelas || "Lainnya") === currentFilter);
        }

        if (filteredStudents.length === 0) {
            studentsTableBody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-400">Tidak ada data siswa untuk kategori ini.</td></tr>`;
            statsCount.textContent = `0 Siswa Dinilai`;
            return;
        }

        let totalGraded = 0;
        let currentKelas = null;

        filteredStudents.forEach(student => {
            const hasGrade = savedGrades[student.id] !== undefined;
            if (hasGrade) totalGraded++;

            const grade = hasGrade ? savedGrades[student.id] : { praktek: '', tulis: '', average: 0 };
            const kelasSiswa = student.kelas || "Lainnya";

            // Insert header if new class
            if (kelasSiswa !== currentKelas) {
                currentKelas = kelasSiswa;
                const headerRow = document.createElement('tr');
                headerRow.className = "bg-indigo-50 border-y border-indigo-100";
                headerRow.innerHTML = `<td colspan="6" class="px-4 py-2.5 font-bold text-indigo-700 tracking-wide text-xs uppercase"><i class="fa-solid fa-users-rectangle mr-2"></i> KELAS: ${currentKelas}</td>`;
                studentsTableBody.appendChild(headerRow);
            }

            const tr = document.createElement('tr');
            tr.className = `border-b border-slate-100 transition ${hasGrade ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`;
            
            tr.innerHTML = `
                <td class="px-4 py-3 font-medium text-slate-500">${student.nis || '-'}</td>
                <td class="px-4 py-3 font-bold text-slate-800">
                    ${student.name}
                    ${hasGrade ? '<i class="fa-solid fa-check-circle text-emerald-500 ml-2 text-xs" title="Tersimpan"></i>' : ''}
                </td>
                <td class="px-4 py-3">
                    <input type="number" id="praktek_${student.id}" value="${grade.praktek}" min="0" max="100" class="grade-input w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white" placeholder="0-100">
                </td>
                <td class="px-4 py-3">
                    <input type="number" id="tulis_${student.id}" value="${grade.tulis}" min="0" max="100" class="grade-input w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white" placeholder="0-100">
                </td>
                <td class="px-4 py-3 font-bold text-center ${hasGrade ? 'text-emerald-600' : 'text-slate-400'}" id="avg_${student.id}">
                    ${hasGrade ? grade.average.toFixed(2) : '-'}
                </td>
                <td class="px-4 py-3 text-right">
                    <button class="save-btn px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition" data-id="${student.id}" data-name="${student.name}">
                        ${hasGrade ? 'Update' : 'Simpan'}
                    </button>
                </td>
            `;
            studentsTableBody.appendChild(tr);
        });

        statsCount.textContent = `${totalGraded} dari ${allStudents.length} Siswa Dinilai`;
        attachRowListeners();
    };

    const attachRowListeners = () => {
        // Auto-calculate logic per row
        allStudents.forEach(student => {
            const pInput = document.getElementById(`praktek_${student.id}`);
            const tInput = document.getElementById(`tulis_${student.id}`);
            const avgDiv = document.getElementById(`avg_${student.id}`);

            const calc = () => {
                let p = parseFloat(pInput.value);
                let t = parseFloat(tInput.value);
                if (isNaN(p) && isNaN(t)) { avgDiv.textContent = '-'; avgDiv.className = "px-4 py-3 font-bold text-center text-slate-400"; return; }
                p = isNaN(p) ? 0 : p; t = isNaN(t) ? 0 : t;
                const avg = (p + t) / 2;
                avgDiv.textContent = avg.toFixed(2);
                avgDiv.className = `px-4 py-3 font-bold text-center ${avg >= 75 ? 'text-emerald-600' : 'text-amber-500'}`;
            };

            pInput.addEventListener('input', calc);
            tInput.addEventListener('input', calc);
        });

        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const name = e.currentTarget.dataset.name;
                const pVal = document.getElementById(`praktek_${id}`).value;
                const tVal = document.getElementById(`tulis_${id}`).value;

                if (pVal === "" || tVal === "" || isNaN(pVal) || isNaN(tVal)) {
                    window.utils.showError('Nilai Kosong', 'Kedua kolom nilai harus diisi (0-100).');
                    return;
                }

                const p = Number(pVal);
                const t = Number(tVal);

                if (p < 0 || p > 100 || t < 0 || t > 100) {
                    window.utils.showError('Invalid', 'Nilai harus berada di rentang 0 - 100.');
                    return;
                }

                const avg = Number(((p + t) / 2).toFixed(2));
                
                // --- HARDENING: Lock UI ---
                btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                btn.disabled = true;

                try {
                    // --- HARDENING: Validate Session & Token ---
                    const tRef = doc(window.db, "teachers", teacherData.token);
                    const tSnap = await window.firestore.getDoc(tRef);
                    if (!tSnap.exists()) {
                        throw new Error("Sesi tidak valid atau guru telah dihapus dari sistem.");
                    }

                    // --- EXECUTION: Save to Firestore ---
                    await setDoc(doc(window.db, collectionName, id), {
                        studentId: id,
                        studentName: name,
                        praktek: p,
                        tulis: t,
                        average: avg,
                        updatedAt: new Date().toISOString()
                    });

                    // --- SUCCESS: Update Local State ---
                    savedGrades[id] = { praktek: p, tulis: t, average: avg };
                    Swal.fire({ 
                        toast: true, 
                        position: 'top-end', 
                        icon: 'success', 
                        title: 'Nilai ' + name + ' Berhasil Tersimpan!', 
                        showConfirmButton: false, 
                        timer: 1500 
                    });
                    renderTable();
                } catch(err) {
                    console.error("Save Error:", err);
                    window.utils.showError('Gagal Menyimpan', `Pesan: ${err.message}. Pastikan koneksi internet stabil.`);
                    btn.innerHTML = 'Gagal - Ulangi';
                    btn.disabled = false;
                }
            });
        });
    };

    btnSaveAll.addEventListener('click', async () => {
        let filteredStudents = allStudents;
        if (currentFilter !== 'SEMUA') {
            filteredStudents = allStudents.filter(s => (s.kelas || "Lainnya") === currentFilter);
        }

        if (filteredStudents.length === 0) return;

        const result = await Swal.fire({
            title: 'Simpan Semua Nilai?',
            text: `Semua nilai yang Anda masukkan untuk kelas ${currentFilter} akan disimpan secara massal.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Ya, Simpan Semua',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            const { writeBatch } = window.firestore;
            const batch = writeBatch(window.db);
            let hasChanges = false;
            let invalidCount = 0;
            let currentValidChanges = [];

            filteredStudents.forEach(student => {
                const pInput = document.getElementById(`praktek_${student.id}`);
                const tInput = document.getElementById(`tulis_${student.id}`);
                
                if (pInput && tInput) {
                    const pVal = pInput.value;
                    const tVal = tInput.value;

                    // Hanya simpan jika nilai valid dan lengkap
                    if (pVal !== "" && tVal !== "" && !isNaN(pVal) && !isNaN(tVal)) {
                        const p = Number(pVal);
                        const t = Number(tVal);

                        if (p >= 0 && p <= 100 && t >= 0 && t <= 100) {
                            const avg = Number(((p + t) / 2).toFixed(2));
                            const docRef = doc(window.db, collectionName, student.id);
                            
                            batch.set(docRef, {
                                studentId: student.id,
                                studentName: student.name,
                                praktek: p,
                                tulis: t,
                                average: avg,
                                updatedAt: new Date().toISOString()
                            });

                            currentValidChanges.push({ id: student.id, p, t, avg });
                            hasChanges = true;
                        } else {
                            invalidCount++;
                        }
                    } else if (pVal !== "" || tVal !== "") {
                        invalidCount++;
                    }
                }
            });

            if (!hasChanges) {
                window.utils.showError('Gagal', 'Tidak ada nilai valid yang bisa disimpan. Pastikan Praktek dan Tulis sudah diisi lengkap (0-100).');
                return;
            }

            if (invalidCount > 0) {
                const confirmIncomplete = await Swal.fire({
                    title: 'Nilai Belum Lengkap',
                    text: `Ada ${invalidCount} siswa yang nilainya belum lengkap atau tidak valid (di luar 0-100) dan tidak akan ikut tersimpan. Lanjutkan simpan yang valid saja?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#10b981',
                    confirmButtonText: 'Ya, Lanjutkan'
                });
                if (!confirmIncomplete.isConfirmed) return;
            }

            try {
                window.utils.showLoading("Menyimpan semua data ke Cloud...");
                
                // --- HARDENING: Validate Session & Token ---
                const tRef = doc(window.db, "teachers", teacherData.token);
                const tSnap = await window.firestore.getDoc(tRef);
                if (!tSnap.exists()) {
                    throw new Error("Sesi tidak valid. Akun guru ini mungkin telah dihapus.");
                }

                // --- EXECUTION: Batch Commit ---
                await batch.commit();

                // --- SUCCESS: Update Local State ---
                currentValidChanges.forEach(item => {
                    savedGrades[item.id] = { praktek: item.p, tulis: item.t, average: item.avg };
                });

                window.utils.hideLoading();
                await window.utils.showSuccess("Berhasil Disimpan", `${currentValidChanges.length} data nilai telah berhasil masuk ke database pusat.`);
                renderTable();
            } catch (err) {
                window.utils.hideLoading();
                console.error("Batch Save Error:", err);
                window.utils.showError('Gagal Simpan Massal', `Pesan: ${err.message}. Silakan coba lagi nanti.`);
            }
        }
    });

    logoutBtn.addEventListener('click', () => {
        Swal.fire({
            title: 'Keluar?', text: "Anda akan keluar dari sesi ini.", icon: 'question',
            showCancelButton: true, confirmButtonColor: '#10b981', cancelButtonColor: '#94a3b8', confirmButtonText: 'Ya, Keluar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('teacherData');
                window.location.href = 'index.html';
            }
        })
    });

    loadData();
});
