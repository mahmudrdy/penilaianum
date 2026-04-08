// admin.js
document.addEventListener('DOMContentLoaded', () => {
    
    if (!window.db) {
        window.utils.showError('Error', 'Firestore belum terhubung.');
        return;
    }
    const { collection, getDocs, addDoc, doc, setDoc, deleteDoc, query, orderBy } = window.firestore;

    // --- NAVIGATION LOGIC ---
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    const toggleSidebar = () => {
        sidebar.classList.toggle('-translate-x-full');
        sidebarOverlay.classList.toggle('hidden');
    };

    menuToggleBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    const navGuru = document.getElementById('nav-guru');
    const navSiswa = document.getElementById('nav-siswa');
    const navRekap = document.getElementById('nav-rekap');
    const sectionGuru = document.getElementById('section-guru');
    const sectionSiswa = document.getElementById('section-siswa');
    const sectionRekap = document.getElementById('section-rekap');
    const pageTitle = document.getElementById('pageTitle');

    const resetNavLinks = () => {
        navGuru.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-400 rounded-xl font-medium transition hover:bg-slate-800 hover:text-white";
        navSiswa.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-400 rounded-xl font-medium transition hover:bg-slate-800 hover:text-white";
        navRekap.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-400 rounded-xl font-medium transition hover:bg-slate-800 hover:text-white";
    };

    navGuru.addEventListener('click', () => {
        sectionGuru.classList.remove('hidden'); sectionGuru.classList.add('grid');
        sectionSiswa.classList.add('hidden'); sectionSiswa.classList.remove('grid');
        sectionRekap.classList.add('hidden'); sectionRekap.classList.remove('grid');
        resetNavLinks();
        navGuru.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium transition hover:bg-slate-800";
        pageTitle.textContent = "Manajemen Guru & Mata Pelajaran";
        if(window.innerWidth < 768) toggleSidebar();
    });

    navSiswa.addEventListener('click', () => {
        sectionSiswa.classList.remove('hidden'); sectionSiswa.classList.add('grid');
        sectionGuru.classList.add('hidden'); sectionGuru.classList.remove('grid');
        sectionRekap.classList.add('hidden'); sectionRekap.classList.remove('grid');
        resetNavLinks();
        navSiswa.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium transition hover:bg-slate-800";
        pageTitle.textContent = "Basis Data Siswa Utama";
        if(window.innerWidth < 768) toggleSidebar();
    });

    navRekap.addEventListener('click', () => {
        sectionRekap.classList.remove('hidden'); sectionRekap.classList.add('grid');
        sectionGuru.classList.add('hidden'); sectionGuru.classList.remove('grid');
        sectionSiswa.classList.add('hidden'); sectionSiswa.classList.remove('grid');
        resetNavLinks();
        navRekap.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium transition hover:bg-slate-800";
        pageTitle.textContent = "Rekap Nilai UM";
        if(window.innerWidth < 768) toggleSidebar();
        loadRekapNilai(currentRekapClass);
    });

    // --- SECTION 1: GURU & MAPEL ---
    const subjectForm = document.getElementById('subjectForm');
    const subjectNameInput = document.getElementById('subjectName');
    const teacherForm = document.getElementById('teacherForm');
    const teacherNameInput = document.getElementById('teacherName');
    const teacherSubjectSelect = document.getElementById('teacherSubject');
    const teacherTableBody = document.getElementById('teacherTableBody');
    const teacherCountSpan = document.getElementById('teacherCount');

    let subjectsList = [];

    const loadSubjects = async () => {
        try {
            const querySnapshot = await getDocs(collection(window.db, "subjects"));
            subjectsList = [];
            querySnapshot.forEach((docSnap) => {
                subjectsList.push({ id: docSnap.id, name: docSnap.data().name });
            });
            teacherSubjectSelect.innerHTML = '<option value="">-- Pilih Pelajaran --</option>';
            subjectsList.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub.name; 
                opt.textContent = sub.name;
                teacherSubjectSelect.appendChild(opt);
            });
        } catch(err) { console.error(err); }
    };

    const loadTeachers = async () => {
        try {
            const querySnapshot = await getDocs(collection(window.db, "teachers"));
            teacherTableBody.innerHTML = '';
            let count = 0;
            if (!querySnapshot.empty) {
                querySnapshot.forEach((docSnap) => {
                    count++;
                    const token = docSnap.id; 
                    const teacher = docSnap.data();
                    const tr = document.createElement('tr');
                    tr.className = "border-b border-slate-100 hover:bg-slate-50 transition";
                    tr.innerHTML = `
                        <td class="px-4 py-4 font-medium text-slate-800">${teacher.name}</td>
                        <td class="px-4 py-4"><span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-200">${teacher.subject}</span></td>
                        <td class="px-4 py-4"><div class="flex items-center gap-2">
                            <code class="bg-slate-100 px-2 py-1 rounded text-emerald-600 font-bold">${token}</code>
                            <button class="copy-tkn text-slate-400 hover:text-emerald-500" data-token="${token}"><i class="fa-regular fa-copy"></i></button>
                        </div></td>
                        <td class="px-4 py-4 text-right"><button class="delete-teacher text-red-400 hover:text-red-600" data-token="${token}"><i class="fa-solid fa-trash-can"></i></button></td>
                    `;
                    teacherTableBody.appendChild(tr);
                });
                attachTeacherListeners();
            } else {
                teacherTableBody.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">Belum ada guru.</td></tr>`;
            }
            teacherCountSpan.textContent = count;
        } catch(err) {}
    };

    const attachTeacherListeners = () => {
        document.querySelectorAll('.copy-tkn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const token = e.currentTarget.dataset.token;
                navigator.clipboard.writeText(token);
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Tersalin: ' + token, showConfirmButton: false, timer: 1500 });
            });
        });
        document.querySelectorAll('.delete-teacher').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const token = e.currentTarget.dataset.token;
                const c = await Swal.fire({ title: 'Hapus Guru?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya!'});
                if (c.isConfirmed) {
                    window.utils.showLoading("Menghapus...");
                    await deleteDoc(doc(window.db, "teachers", token));
                    window.utils.showSuccess('Terhapus!', "");
                    loadTeachers();
                }
            });
        });
    };

    subjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.utils.showLoading("Menyimpan...");
        try {
            await addDoc(collection(window.db, "subjects"), { name: subjectNameInput.value.trim() });
            window.utils.showSuccess("Berhasil", "Mata pelajaran ditambahkan.");
            subjectForm.reset(); loadSubjects();
        } catch(err) { window.utils.showError("Error", err.message); }
    });

    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.utils.showLoading("Menyimpan...");
        try {
            const newToken = window.utils.generateToken(); 
            await setDoc(doc(window.db, "teachers", newToken), {
                name: teacherNameInput.value.trim(), subject: teacherSubjectSelect.value, createdAt: new Date().toISOString()
            });
            window.utils.showSuccess("Guru Ditambahkan!", `Token: <b>${newToken}</b>`);
            teacherForm.reset(); loadTeachers();
        } catch(err) { window.utils.showError("Error", err.message); }
    });

    // --- SECTION 2: DATA SISWA ---
    const studentForm = document.getElementById('studentForm');
    const studentNISInput = document.getElementById('studentNIS');
    const studentNameNewInput = document.getElementById('studentNameNew');
    const studentClassSelect = document.getElementById('studentClass');
    const studentTableBody = document.getElementById('studentTableBody');
    const studentCountSpan = document.getElementById('studentCount');

    const loadStudents = async () => {
        try {
            const q = query(collection(window.db, "students"), orderBy("createdAt", "asc"));
            const querySnapshot = await getDocs(q);
            studentTableBody.innerHTML = '';
            let count = 0;
            if (!querySnapshot.empty) {
                querySnapshot.forEach((docSnap) => {
                    count++;
                    const s = docSnap.data();
                    const tr = document.createElement('tr');
                    tr.className = "border-b border-slate-100 hover:bg-slate-50";
                    tr.innerHTML = `
                        <td class="px-4 py-3 font-medium text-slate-500">${s.nis || '-'}</td>
                        <td class="px-4 py-3 font-bold text-slate-800">${s.name}</td>
                        <td class="px-4 py-3"><span class="px-2 py-1 rounded bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">${s.kelas || '-'}</span></td>
                        <td class="px-4 py-3 text-xs text-slate-400">${new Date(s.createdAt).toLocaleDateString()}</td>
                        <td class="px-4 py-3 text-right">
                            <button class="delete-student text-red-400 hover:text-red-600" data-id="${docSnap.id}"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                    `;
                    studentTableBody.appendChild(tr);
                });
                attachStudentListeners();
            } else {
                studentTableBody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Belum ada siswa yang didaftarkan.</td></tr>`;
            }
            studentCountSpan.textContent = count;
        } catch(err) {
            console.error(err);
            // Fallback unindexed
            try {
                const qs2 = await getDocs(collection(window.db, "students"));
                studentTableBody.innerHTML = ''; let count=0;
                qs2.forEach(docSnap => { count++; studentTableBody.innerHTML += `<tr><td class="px-4 py-3" colspan="3">${docSnap.data().name} (${docSnap.data().kelas || '-'})</td><td colspan="2"><button class="delete-student text-red-400" data-id="${docSnap.id}">Hapus</button></td></tr>`; });
                studentCountSpan.textContent = count; attachStudentListeners();
            } catch(e) {}
        }
    };

    const attachStudentListeners = () => {
        document.querySelectorAll('.delete-student').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const c = await Swal.fire({ title: 'Hapus Siswa?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya'});
                if (c.isConfirmed) {
                    window.utils.showLoading("Menghapus...");
                    await deleteDoc(doc(window.db, "students", id));
                    window.utils.showSuccess('Terhapus!', "");
                    loadStudents();
                }
            });
        });
    };

    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.utils.showLoading("Menyimpan...");
        try {
            await addDoc(collection(window.db, "students"), { 
                nis: studentNISInput.value.trim(), 
                name: studentNameNewInput.value.trim(), 
                kelas: studentClassSelect.value,
                createdAt: new Date().toISOString() 
            });
            window.utils.showSuccess("Berhasil", "Data siswa berhasil ditambahkan.");
            studentForm.reset(); 
            loadStudents();
        } catch(err) { window.utils.showError("Error", err.message); }
    });

    // --- SECTION 3: NILAI UM (INTERAKTIF + EKSPOR PER SISWA) ---
    let currentRekapClass = "XII IPA";
    const rekapTableHead = document.getElementById('rekapTableHead');
    const rekapTableBody = document.getElementById('rekapTableBody');
    const rekapStudentCount = document.getElementById('rekapStudentCount');

    // Cache data so we don't re-fetch on every tab click
    let cachedMapels = null; // { token: subjectName }
    let cachedAllStudents = null; // [{ id, name, nis, kelas, ... }]
    let cachedAllGrades = null; // { token: { studentId: gradeData } }

    const fetchAllRekapData = async () => {
        const tSnap = await getDocs(collection(window.db, "teachers"));
        cachedMapels = {};
        tSnap.forEach(d => { cachedMapels[d.id] = d.data().subject; });

        const sSnap = await getDocs(collection(window.db, "students"));
        cachedAllStudents = [];
        sSnap.forEach(d => cachedAllStudents.push({ id: d.id, ...d.data() }));

        const tokenKeys = Object.keys(cachedMapels);
        cachedAllGrades = {};
        for (const tkn of tokenKeys) {
            try {
                const gSnap = await getDocs(collection(window.db, `grades_${tkn}`));
                cachedAllGrades[tkn] = {};
                gSnap.forEach(g => { cachedAllGrades[tkn][g.id] = g.data(); });
            } catch(e) {
                cachedAllGrades[tkn] = {};
            }
        }
    };

    const loadRekapNilai = async (kelas) => {
        currentRekapClass = kelas;

        rekapTableBody.innerHTML = `<tr><td colspan="20" class="px-4 py-10 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-indigo-500"></i><br>Memuat data nilai...</td></tr>`;

        try {
            if (!cachedMapels) {
                await fetchAllRekapData();
            }

            const tokenKeys = Object.keys(cachedMapels);
            const filteredStudents = cachedAllStudents
                .filter(s => s.kelas === kelas)
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

            rekapStudentCount.textContent = filteredStudents.length;

            // Build header
            let headerHTML = `<tr>
                <th class="px-3 py-3 text-center w-12 whitespace-nowrap">No</th>
                <th class="px-4 py-3 whitespace-nowrap">NISN</th>
                <th class="px-4 py-3 whitespace-nowrap">Nama Lengkap</th>
                <th class="px-3 py-3 text-center whitespace-nowrap w-28">Aksi</th></tr>`;
            rekapTableHead.innerHTML = headerHTML;

            // Build body
            if (filteredStudents.length === 0) {
                rekapTableBody.innerHTML = `<tr><td colspan="4" class="px-4 py-14 text-center text-slate-400"><i class="fa-solid fa-inbox text-4xl mb-3 block text-slate-300"></i>Belum ada siswa di kelas <b>${kelas}</b>.</td></tr>`;
                return;
            }

            let bodyHTML = '';
            filteredStudents.forEach((s, idx) => {
                bodyHTML += `<tr class="group">
                    <td class="px-3 py-3 text-center text-xs font-semibold text-slate-400">${idx + 1}</td>
                    <td class="px-4 py-3"><code class="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded font-mono">${s.nis || '-'}</code></td>
                    <td class="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">${s.name}</td>
                    <td class="px-3 py-3 text-center">
                        <button class="btn-export-siswa bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5" data-student-id="${s.id}" title="Ekspor nilai ${s.name}">
                            <i class="fa-solid fa-download text-[10px]"></i> Excel
                        </button>
                    </td>
                </tr>`;
            });

            rekapTableBody.innerHTML = bodyHTML;

            // Attach per-student export listeners
            attachRekapExportListeners();

        } catch(err) {
            console.error(err);
            rekapTableBody.innerHTML = `<tr><td colspan="20" class="px-4 py-10 text-center text-red-500">Error: ${err.message}</td></tr>`;
        }
    };

    const attachRekapExportListeners = () => {
        document.querySelectorAll('.btn-export-siswa').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const studentId = e.currentTarget.dataset.studentId;
                exportSingleStudent(studentId);
            });
        });
    };

    const exportSingleStudent = (studentId) => {
        const student = cachedAllStudents.find(s => s.id === studentId);
        if (!student) return;

        const tokenKeys = Object.keys(cachedMapels);
        const wb = XLSX.utils.book_new();

        // ====== STYLE DEFINITIONS ======
        const borderThin = {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } }
        };

        const sTitle = {
            font: { name: "Calibri", sz: 14, bold: true, color: { rgb: "1E3A5F" } },
            alignment: { horizontal: "left", vertical: "center" }
        };

        const sLabel = {
            font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "475569" } },
            fill: { fgColor: { rgb: "F1F5F9" } },
            border: borderThin,
            alignment: { horizontal: "left", vertical: "center" }
        };

        const sValue = {
            font: { name: "Calibri", sz: 11, color: { rgb: "1E293B" } },
            fill: { fgColor: { rgb: "FFFFFF" } },
            border: borderThin,
            alignment: { horizontal: "left", vertical: "center" }
        };

        const sHeader = {
            font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4338CA" } },
            border: borderThin,
            alignment: { horizontal: "center", vertical: "center", wrapText: true }
        };

        const sHeaderLeft = {
            ...sHeader,
            alignment: { horizontal: "left", vertical: "center", wrapText: true }
        };

        const sNo = {
            font: { name: "Calibri", sz: 10, color: { rgb: "64748B" } },
            border: borderThin,
            alignment: { horizontal: "center", vertical: "center" }
        };

        const sMapel = {
            font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } },
            border: borderThin,
            alignment: { horizontal: "left", vertical: "center" }
        };

        const sNilai = {
            font: { name: "Calibri", sz: 11, color: { rgb: "1E293B" } },
            border: borderThin,
            alignment: { horizontal: "center", vertical: "center" },
            numFmt: "0"
        };

        const sNilaiUM = {
            font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "065F46" } },
            fill: { fgColor: { rgb: "D1FAE5" } },
            border: borderThin,
            alignment: { horizontal: "center", vertical: "center" },
            numFmt: "0.0"
        };

        const sNoAlt = { ...sNo, fill: { fgColor: { rgb: "F8FAFC" } } };
        const sMapelAlt = { ...sMapel, fill: { fgColor: { rgb: "F8FAFC" } } };
        const sNilaiAlt = { ...sNilai, fill: { fgColor: { rgb: "F8FAFC" } } };
        const sNilaiUMAlt = {
            ...sNilaiUM,
            fill: { fgColor: { rgb: "ECFDF5" } }
        };

        // ====== BUILD SHEET DATA ======
        const wsData = [
            [{ v: "REKAP NILAI UJIAN MADRASAH", s: sTitle }, "", "", "", ""],
            [],
            [{ v: "Nama Siswa", s: sLabel }, { v: student.name, s: sValue }, "", "", ""],
            [{ v: "NIS / No. Absen", s: sLabel }, { v: student.nis || '-', s: sValue }, "", "", ""],
            [{ v: "Kelas", s: sLabel }, { v: student.kelas || '-', s: sValue }, "", "", ""],
            [],
            [
                { v: "No", s: sHeader },
                { v: "Mata Pelajaran", s: sHeaderLeft },
                { v: "Nilai Praktek", s: sHeader },
                { v: "Nilai Tulis", s: sHeader },
                { v: "Nilai UM", s: sHeader }
            ]
        ];

        tokenKeys.forEach((tkn, i) => {
            const grades = cachedAllGrades[tkn] ? cachedAllGrades[tkn][studentId] : null;
            const g = grades || { praktek: 0, tulis: 0, average: 0 };
            const praktek = g.praktek !== '' && g.praktek !== undefined ? Number(g.praktek) : 0;
            const tulis = g.tulis !== '' && g.tulis !== undefined ? Number(g.tulis) : 0;
            const um = g.average !== '' && g.average !== undefined ? Number(g.average) : 0;

            const isAlt = i % 2 === 1;
            wsData.push([
                { v: i + 1, t: "n", s: isAlt ? sNoAlt : sNo },
                { v: cachedMapels[tkn], s: isAlt ? sMapelAlt : sMapel },
                { v: praktek, t: "n", s: isAlt ? sNilaiAlt : sNilai },
                { v: tulis, t: "n", s: isAlt ? sNilaiAlt : sNilai },
                { v: um, t: "n", s: isAlt ? sNilaiUMAlt : sNilaiUM }
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Column widths
        ws['!cols'] = [
            { wpx: 45 },   // No
            { wpx: 220 },  // Mata Pelajaran
            { wpx: 110 },  // Nilai Praktek
            { wpx: 110 },  // Nilai Tulis
            { wpx: 110 }   // Nilai UM
        ];

        // Row heights
        ws['!rows'] = [
            { hpx: 32 },  // Title
            { hpx: 10 },  // Spacer
            { hpx: 24 },  // Nama
            { hpx: 24 },  // NIS
            { hpx: 24 },  // Kelas
            { hpx: 10 },  // Spacer
            { hpx: 30 }   // Header
        ];
        // Data rows
        tokenKeys.forEach(() => {
            ws['!rows'].push({ hpx: 26 });
        });

        // Merge cells for title
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }  // Title row merge
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Nilai UM");

        const safeName = (student.name || "Siswa").replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
        XLSX.writeFile(wb, `Nilai_UM_${safeName}.xlsx`);
    };

    // Class tab switching
    document.querySelectorAll('.rekap-class-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const kelas = e.currentTarget.dataset.class;
            document.querySelectorAll('.rekap-class-btn').forEach(b => {
                b.className = 'rekap-class-btn flex-1 sm:flex-none text-center text-slate-500 hover:text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium transition';
            });
            e.currentTarget.className = 'rekap-class-btn active flex-1 sm:flex-none text-center bg-white shadow-sm text-indigo-600 px-5 py-2.5 rounded-lg text-sm font-bold transition';
            cachedMapels = null;
            loadRekapNilai(kelas);
        });
    });

    // INIT
    loadSubjects();
    loadTeachers();
    loadStudents();

});
