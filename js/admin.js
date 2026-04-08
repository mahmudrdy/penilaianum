// admin.js
document.addEventListener('DOMContentLoaded', () => {
    
    // Auth guard: harus login sebagai admin
    if (!localStorage.getItem('adminData')) {
        window.location.href = 'index.html';
        return;
    }

    if (!window.db) {
        window.utils.showError('Error', 'Firestore belum terhubung.');
        return;
    }
    const { collection, getDocs, addDoc, doc, getDoc, setDoc, deleteDoc, updateDoc, query, orderBy } = window.firestore;

    // --- LOGOUT LOGIC ---
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminData');
            window.location.href = 'index.html';
        });
    }

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
    const navMapel = document.getElementById('nav-mapel');
    const navSiswa = document.getElementById('nav-siswa');
    const navRekap = document.getElementById('nav-rekap');
    const navPengaturan = document.getElementById('nav-pengaturan');
    const sectionGuru = document.getElementById('section-guru');
    const sectionMapel = document.getElementById('section-mapel');
    const sectionSiswa = document.getElementById('section-siswa');
    const sectionRekap = document.getElementById('section-rekap');
    const sectionPengaturan = document.getElementById('section-pengaturan');
    const pageTitle = document.getElementById('pageTitle');
    const btnResetData = document.getElementById('btnResetData');
    const studentClassSelect = document.getElementById('studentClass');
    const rekapClassFilters = document.getElementById('rekapClassFilters');
    const btnAddClass = document.getElementById('btnAddClass');
    const classTableBody = document.getElementById('classTableBody');

    const resetNavLinks = () => {
        navGuru.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-400 rounded-lg font-medium transition hover:bg-slate-800 hover:text-white";
        navMapel.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-400 rounded-lg font-medium transition hover:bg-slate-800 hover:text-white";
        navSiswa.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-400 rounded-lg font-medium transition hover:bg-slate-800 hover:text-white";
        navRekap.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-400 rounded-lg font-medium transition hover:bg-slate-800 hover:text-white";
        navPengaturan.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-400 rounded-lg font-medium transition hover:bg-slate-800 hover:text-white";
    };

    navGuru.addEventListener('click', () => {
        sectionGuru.classList.remove('hidden'); sectionGuru.classList.add('grid');
        sectionMapel.classList.add('hidden'); sectionMapel.classList.remove('grid');
        sectionSiswa.classList.add('hidden'); sectionSiswa.classList.remove('grid');
        sectionRekap.classList.add('hidden'); 
        sectionPengaturan.classList.add('hidden'); 
        resetNavLinks();
        navGuru.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg font-medium transition";
        pageTitle.textContent = "Manajemen Data Guru";
        if(window.innerWidth < 768) toggleSidebar();
        loadTeachers();
    });

    navMapel.addEventListener('click', () => {
        sectionMapel.classList.remove('hidden'); sectionMapel.classList.add('grid');
        sectionGuru.classList.add('hidden'); sectionGuru.classList.remove('grid');
        sectionSiswa.classList.add('hidden'); sectionSiswa.classList.remove('grid');
        sectionRekap.classList.add('hidden');
        sectionPengaturan.classList.add('hidden');
        resetNavLinks();
        navMapel.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg font-medium transition";
        pageTitle.textContent = "Mata Pelajaran";
        if(window.innerWidth < 768) toggleSidebar();
        loadSubjects();
    });

    navSiswa.addEventListener('click', () => {
        sectionSiswa.classList.remove('hidden'); sectionSiswa.classList.add('grid');
        sectionGuru.classList.add('hidden'); sectionGuru.classList.remove('grid');
        sectionMapel.classList.add('hidden'); sectionMapel.classList.remove('grid');
        sectionRekap.classList.add('hidden');
        sectionPengaturan.classList.add('hidden');
        resetNavLinks();
        navSiswa.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg font-medium transition";
        pageTitle.textContent = "Data Siswa";
        if(window.innerWidth < 768) toggleSidebar();
        loadStudents();
    });

    navRekap.addEventListener('click', () => {
        sectionRekap.classList.remove('hidden'); 
        sectionGuru.classList.add('hidden'); sectionGuru.classList.remove('grid');
        sectionMapel.classList.add('hidden'); sectionMapel.classList.remove('grid');
        sectionSiswa.classList.add('hidden'); sectionSiswa.classList.remove('grid');
        sectionPengaturan.classList.add('hidden');
        resetNavLinks();
        navRekap.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg font-medium transition";
        pageTitle.textContent = "Rekap Nilai UM";
        if(window.innerWidth < 768) toggleSidebar();
        loadRekapNilai(currentRekapClass);
    });

    navPengaturan.addEventListener('click', () => {
        sectionPengaturan.classList.remove('hidden');
        sectionGuru.classList.add('hidden'); sectionGuru.classList.remove('grid');
        sectionMapel.classList.add('hidden'); sectionMapel.classList.remove('grid');
        sectionSiswa.classList.add('hidden'); sectionSiswa.classList.remove('grid');
        sectionRekap.classList.add('hidden');
        resetNavLinks();
        navPengaturan.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg font-medium transition";
        pageTitle.textContent = "Pengaturan";
        if(window.innerWidth < 768) toggleSidebar();
        loadAdminTokens();
    });

    // --- SECTION 1: GURU & MAPEL ---
    const subjectForm = document.getElementById('subjectForm');
    const subjectNameInput = document.getElementById('subjectName');
    const subjectCategorySelect = document.getElementById('subjectCategory');
    const teacherForm = document.getElementById('teacherForm');
    const teacherNameInput = document.getElementById('teacherName');
    const teacherSubjectSelect = document.getElementById('teacherSubject');
    const teacherTableBody = document.getElementById('teacherTableBody');
    const teacherCountSpan = document.getElementById('teacherCount');
    const subjectTableBody = document.getElementById('subjectTableBody');
    const subjectCountSpan = document.getElementById('subjectCount');
    
    // New Subject Fields
    const subjectTypeSelect = document.getElementById('subjectType');
    const subjectTargetClassSelect = document.getElementById('subjectTargetClass');
    const subjectTypeContainer = document.getElementById('subjectTypeContainer');
    const subjectTargetClassContainer = document.getElementById('subjectTargetClassContainer');
    const btnExportAllClass = document.getElementById('btnExportAllClass');

    // Toggle visibility logic
    const updateSubjectFieldsVisibility = () => {
        const category = subjectCategorySelect.value;
        const type = subjectTypeSelect.value;
        
        if (category === 'Pesantren') {
            subjectTypeContainer.classList.add('hidden');
            subjectTargetClassContainer.classList.add('hidden');
        } else {
            subjectTypeContainer.classList.remove('hidden');
            if (type === 'Peminatan') {
                subjectTargetClassContainer.classList.remove('hidden');
            } else {
                subjectTargetClassContainer.classList.add('hidden');
            }
        }
    };

    subjectCategorySelect.addEventListener('change', updateSubjectFieldsVisibility);
    subjectTypeSelect.addEventListener('change', updateSubjectFieldsVisibility);

    let subjectsList = [];

    const loadSubjects = async () => {
        try {
            const querySnapshot = await getDocs(collection(window.db, "subjects"));
            subjectsList = [];
            subjectTableBody.innerHTML = '';
            let count = 0;
            querySnapshot.forEach((docSnap) => {
                count++;
                const sub = { id: docSnap.id, ...docSnap.data() };
                subjectsList.push(sub);
                
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 transition";
                
                let typeBadge = '';
                if (sub.category === 'Nasional') {
                    const isPeminatan = sub.type === 'Peminatan';
                    typeBadge = `<span class="ml-2 ${isPeminatan ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'} px-2 py-0.5 rounded border text-[10px]">
                        ${isPeminatan ? 'Peminatan ' + (sub.targetClass || '') : 'Umum'}
                    </span>`;
                }

                tr.innerHTML = `
                    <td class="px-4 py-3 text-slate-400">${count}</td>
                    <td class="px-4 py-3 font-bold text-slate-800">
                        ${sub.name}
                        ${typeBadge}
                    </td>
                    <td class="px-4 py-3">
                        <span class="${sub.category === 'Nasional' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'} px-2 py-1 rounded border text-xs">
                            ${sub.category || 'Nasional'}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <button class="delete-subject text-red-500 hover:text-red-700" data-id="${sub.id}"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;
                subjectTableBody.appendChild(tr);
            });
            
            if (count === 0) {
                subjectTableBody.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400 italic">Belum ada mata pelajaran.</td></tr>`;
            }
            subjectCountSpan.textContent = count;

            // Update Teacher Subject Dropdown (Categorized)
            teacherSubjectSelect.innerHTML = '<option value="">-- Pilih Pelajaran --</option>';
            
            const groupNasionalUmum = document.createElement('optgroup');
            groupNasionalUmum.label = "NASIONAL - UMUM";
            const groupNasionalPeminatan = document.createElement('optgroup');
            groupNasionalPeminatan.label = "NASIONAL - PEMINATAN";
            const groupPesantren = document.createElement('optgroup');
            groupPesantren.label = "PONDOK PESANTREN";
            
            subjectsList.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub.name; 
                
                if (sub.category === 'Pesantren') {
                    opt.textContent = sub.name;
                    groupPesantren.appendChild(opt);
                } else {
                    if (sub.type === 'Peminatan') {
                        opt.textContent = `${sub.name} (${sub.targetClass || 'Semua'})`;
                        groupNasionalPeminatan.appendChild(opt);
                    } else {
                        opt.textContent = sub.name;
                        groupNasionalUmum.appendChild(opt);
                    }
                }
            });

            if (groupNasionalUmum.children.length > 0) teacherSubjectSelect.appendChild(groupNasionalUmum);
            if (groupNasionalPeminatan.children.length > 0) teacherSubjectSelect.appendChild(groupNasionalPeminatan);
            if (groupPesantren.children.length > 0) teacherSubjectSelect.appendChild(groupPesantren);

            attachSubjectListeners();
        } catch(err) { console.error(err); }
    };

    const attachSubjectListeners = () => {
        document.querySelectorAll('.delete-subject').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const result = await Swal.fire({
                    title: 'Hapus Pelajaran?',
                    text: "Pastikan tidak ada guru yang menggunakan pelajaran ini!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Ya, Hapus!'
                });
                if (result.isConfirmed) {
                    window.utils.showLoading("Menghapus...");
                    await deleteDoc(doc(window.db, "subjects", id));
                    window.utils.showSuccess('Terhapus!', "Mata pelajaran telah dihapus.");
                    loadSubjects();
                }
            });
        });
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
                    tr.className = "hover:bg-slate-50 transition";
                    tr.innerHTML = `
                        <td class="px-4 py-3 font-bold text-slate-800">${teacher.name}</td>
                        <td class="px-4 py-3"><span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">${teacher.subject}</span></td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <code class="bg-slate-100 px-2 py-1 rounded text-indigo-600 font-bold">${token}</code>
                                <button class="copy-tkn text-slate-400 hover:text-indigo-600" data-token="${token}"><i class="fa-regular fa-copy"></i></button>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-right">
                            <button class="delete-teacher text-red-500 hover:text-red-700" data-token="${token}">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </td>
                    `;
                    teacherTableBody.appendChild(tr);
                });
                attachTeacherListeners();
            } else {
                teacherTableBody.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400 italic">Belum ada guru.</td></tr>`;
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
                    window.utils.showSuccess('Terhapus!', "Data guru telah dihapus.");
                    loadTeachers();
                }
            });
        });
    };

    subjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.utils.showLoading("Menyimpan...");
        try {
            const cat = subjectCategorySelect.value;
            const type = cat === 'Nasional' ? subjectTypeSelect.value : 'Umum';
            const target = (cat === 'Nasional' && type === 'Peminatan') ? subjectTargetClassSelect.value : '';

            await addDoc(collection(window.db, "subjects"), { 
                name: subjectNameInput.value.trim(),
                category: cat,
                type: type,
                targetClass: target
            });
            window.utils.showSuccess("Berhasil", "Mata pelajaran ditambahkan.");
            subjectForm.reset(); 
            subjectTargetClassContainer.classList.add('hidden');
            loadSubjects();
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
                    tr.className = "hover:bg-slate-50 transition";
                    tr.innerHTML = `
                        <td class="px-4 py-3 text-slate-500 font-mono">${s.nis || '-'}</td>
                        <td class="px-4 py-3 font-bold text-slate-800">${s.name}</td>
                        <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">${s.kelas || '-'}</span></td>
                        <td class="px-4 py-3 text-xs text-slate-400">${new Date(s.createdAt).toLocaleDateString()}</td>
                        <td class="px-4 py-3 text-right">
                            <div class="flex justify-end gap-1">
                                <button class="edit-student text-indigo-500 hover:bg-slate-100 p-1.5 rounded" data-id="${docSnap.id}" data-nis="${s.nis || ''}" data-name="${s.name}" data-kelas="${s.kelas || ''}"><i class="fa-solid fa-user-pen"></i></button>
                                <button class="delete-student text-rose-500 hover:bg-slate-100 p-1.5 rounded" data-id="${docSnap.id}"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </td>
                    `;
                    studentTableBody.appendChild(tr);
                });
                attachStudentListeners();
            } else {
                studentTableBody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400 italic">Belum ada siswa yang didaftarkan.</td></tr>`;
            }
            studentCountSpan.textContent = count;
        } catch(err) { console.error(err); }
    };

    const attachStudentListeners = () => {
        document.querySelectorAll('.delete-student').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const c = await Swal.fire({ title: 'Hapus Siswa?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya'});
                if (c.isConfirmed) {
                    window.utils.showLoading("Menghapus...");
                    await deleteDoc(doc(window.db, "students", id));
                    window.utils.showSuccess('Terhapus!', "Data siswa telah dihapus.");
                    loadStudents();
                }
            });
        });

        document.querySelectorAll('.edit-student').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                const oldNis = btn.dataset.nis;
                const oldName = btn.dataset.name;
                const oldKelas = btn.dataset.kelas;

                // Build class options
                let classOptions = '';
                classesList.forEach(c => {
                    classOptions += `<option value="${c.name}" ${c.name === oldKelas ? 'selected' : ''}>${c.name}</option>`;
                });

                const { value: formValues } = await Swal.fire({
                    title: 'Edit Data Siswa',
                    html: `
                        <div class="text-left space-y-3">
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase">NIS / Nomor Absen</label>
                                <input id="swal-nis" class="swal2-input !mt-1 !w-full !mx-0" value="${oldNis}" placeholder="Opsional">
                            </div>
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase">Nama Siswa</label>
                                <input id="swal-name" class="swal2-input !mt-1 !w-full !mx-0" value="${oldName}" placeholder="Nama Lengkap">
                            </div>
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase">Kelas</label>
                                <select id="swal-kelas" class="swal2-input !mt-1 !w-full !mx-0">
                                    <option value="">-- Pilih Kelas --</option>
                                    ${classOptions}
                                </select>
                            </div>
                        </div>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    confirmButtonColor: '#4f46e5',
                    preConfirm: () => {
                        const name = document.getElementById('swal-name').value.trim();
                        if (!name) {
                            Swal.showValidationMessage('Nama siswa wajib diisi');
                            return false;
                        }
                        return {
                            nis: document.getElementById('swal-nis').value.trim(),
                            name: name,
                            kelas: document.getElementById('swal-kelas').value
                        }
                    }
                });

                if (formValues) {
                    window.utils.showLoading("Mengupdate...");
                    try {
                        await updateDoc(doc(window.db, "students", id), formValues);
                        window.utils.showSuccess("Berhasil", "Data siswa telah diperbarui.");
                        loadStudents();
                    } catch(err) {
                        window.utils.showError("Gagal", err.message);
                    }
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

    // --- NEW: CLASS MANAGEMENT ---
    let classesList = [];

    const loadClasses = async () => {
        try {
            const querySnapshot = await getDocs(collection(window.db, "classes"));
            classesList = [];
            querySnapshot.forEach(docSnap => {
                classesList.push({ id: docSnap.id, ...docSnap.data() });
            });

            // Sort alphabetical
            classesList.sort((a, b) => a.name.localeCompare(b.name));

            // Populate Student Form
            studentClassSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';
            subjectTargetClassSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';
            classesList.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name; opt.textContent = c.name;
                studentClassSelect.appendChild(opt.cloneNode(true));
                subjectTargetClassSelect.appendChild(opt);
            });

            // Populate Rekap Filters
            renderRekapFilters();
            
            // Populate Class Table in Settings
            renderClassTable();

        } catch(err) { console.error(err); }
    };

    const renderRekapFilters = () => {
        rekapClassFilters.innerHTML = '';
        classesList.forEach((c, index) => {
            const btn = document.createElement('button');
            const isActive = c.name === currentRekapClass;
            btn.className = `rekap-class-btn px-4 py-1.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`;
            btn.textContent = c.name;
            btn.dataset.class = c.name;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.rekap-class-btn').forEach(b => {
                    b.className = 'rekap-class-btn px-4 py-1.5 rounded-lg text-sm font-medium transition bg-white text-slate-600 hover:bg-slate-100 border border-slate-200';
                });
                btn.className = 'rekap-class-btn px-4 py-1.5 rounded-lg text-sm font-medium transition bg-indigo-600 text-white shadow-sm';
                loadRekapNilai(c.name);
            });
            rekapClassFilters.appendChild(btn);
        });

        if (classesList.length > 0 && !classesList.find(c => c.name === currentRekapClass)) {
            currentRekapClass = classesList[0].name;
            renderRekapFilters();
        }
    };

    const renderClassTable = () => {
        classTableBody.innerHTML = '';
        classesList.forEach((c, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-4 py-2 text-slate-400 font-medium">${i + 1}</td>
                <td class="px-4 py-2 font-bold text-slate-800">${c.name}</td>
                <td class="px-4 py-2 text-right">
                    <div class="flex justify-end gap-1">
                        <button class="edit-class text-indigo-500 hover:bg-slate-100 p-1.5 rounded" data-id="${c.id}" data-name="${c.name}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="delete-class text-rose-500 hover:bg-slate-100 p-1.5 rounded" data-id="${c.id}" data-name="${c.name}"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            classTableBody.appendChild(tr);
        });
        attachClassListeners();
    };

    const attachClassListeners = () => {
        document.querySelectorAll('.edit-class').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const oldName = btn.dataset.name;
                const { value: newName } = await Swal.fire({
                    title: 'Edit Nama Kelas',
                    input: 'text',
                    inputValue: oldName,
                    showCancelButton: true,
                    confirmButtonColor: '#4f46e5',
                });
                if (newName && newName !== oldName) {
                    window.utils.showLoading("Mengupdate Serta Sinkronisasi...");
                    try {
                        // 1. Update Class Name
                        await updateDoc(doc(window.db, "classes", id), { name: newName });

                        // 2. Sync Students
                        const sSnap = await getDocs(query(collection(window.db, "students"), window.firestore.where("kelas", "==", oldName)));
                        for (const sDoc of sSnap.docs) {
                            await updateDoc(doc(window.db, "students", sDoc.id), { kelas: newName });
                        }

                        // 3. Sync Subjects (Peminatan)
                        const subSnap = await getDocs(query(collection(window.db, "subjects"), window.firestore.where("targetClass", "==", oldName)));
                        for (const subDoc of subSnap.docs) {
                            await updateDoc(doc(window.db, "subjects", subDoc.id), { targetClass: newName });
                        }

                        window.utils.showSuccess("Berhasil", `Kelas diupdate ke ${newName} dan ${sSnap.size} siswa telah disinkronkan.`);
                        loadClasses();
                        loadStudents();
                        loadSubjects();
                    } catch (err) {
                        window.utils.showError("Gagal Sinkronisasi", err.message);
                    }
                }
            });
        });

        document.querySelectorAll('.delete-class').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const result = await Swal.fire({
                    title: 'Hapus Kelas?',
                    text: "Tindakan ini menghapus filter kelas, tetapi tidak data siswa.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Ya, Hapus'
                });
                if (result.isConfirmed) {
                    window.utils.showLoading("Menghapus...");
                    await deleteDoc(doc(window.db, "classes", id));
                    window.utils.showSuccess("Terhapus", "Kelas telah dihapus.");
                    loadClasses();
                }
            });
        });
    };

    btnAddClass.addEventListener('click', async () => {
        const { value: name } = await Swal.fire({
            title: 'Tambah Kelas Baru',
            input: 'text',
            inputPlaceholder: 'Cth: XII MIPA 1',
            showCancelButton: true,
            confirmButtonColor: '#059669',
        });
        if (name) {
            window.utils.showLoading("Menyimpan...");
            await addDoc(collection(window.db, "classes"), { name: name.trim() });
            window.utils.showSuccess("Berhasil", "Kelas baru ditambahkan.");
            loadClasses();
        }
    });

    // --- SECTION 3: NILAI UM ---
    let currentRekapClass = "";
    const rekapTableHead = document.getElementById('rekapTableHead');
    const rekapTableBody = document.getElementById('rekapTableBody');
    const rekapStudentCount = document.getElementById('rekapStudentCount');

    let cachedMapels = null;
    let cachedAllStudents = null;
    let cachedAllGrades = null;

    const fetchAllRekapData = async () => {
        const subjSnap = await getDocs(collection(window.db, "subjects"));
        const subjectCategoryMap = {};
        subjSnap.forEach(d => {
            const data = d.data();
            subjectCategoryMap[data.name] = {
                category: data.category || "Nasional",
                type: data.type || "Umum",
                targetClass: data.targetClass || ""
            };
        });

        const tSnap = await getDocs(collection(window.db, "teachers"));
        cachedMapels = {};
        tSnap.forEach(d => { 
            const subjName = d.data().subject;
            const meta = subjectCategoryMap[subjName] || { category: "Nasional", type: "Umum", targetClass: "" };
            cachedMapels[d.id] = { name: subjName, ...meta };
        });

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
            } catch(e) { cachedAllGrades[tkn] = {}; }
        }
    };

    const loadRekapNilai = async (kelas) => {
        currentRekapClass = kelas;
        rekapTableBody.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400 font-italic">Memuat data...</td></tr>`;

        try {
            if (!cachedMapels) await fetchAllRekapData();
            const filteredStudents = cachedAllStudents
                .filter(s => s.kelas === kelas)
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

            rekapStudentCount.textContent = filteredStudents.length;

            rekapTableHead.innerHTML = `<tr>
                <th class="px-4 py-2 text-center w-12">No</th>
                <th class="px-4 py-2">NISN</th>
                <th class="px-4 py-2">Nama Siswa</th>
                <th class="px-4 py-2 text-center w-28">Aksi</th>
            </tr>`;

            if (filteredStudents.length === 0) {
                rekapTableBody.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">Tidak ada siswa di kelas <b>${kelas}</b>.</td></tr>`;
                return;
            }

            let bodyHTML = '';
            filteredStudents.forEach((s, idx) => {
                bodyHTML += `<tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td class="px-4 py-3 text-center text-slate-400">${idx + 1}</td>
                    <td class="px-4 py-3 text-sm font-mono text-slate-500">${s.nis || '-'}</td>
                    <td class="px-4 py-3 font-bold text-slate-800">${s.name}</td>
                    <td class="px-4 py-3 text-center">
                        <button class="btn-export-siswa bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded transition shadow-sm" data-student-id="${s.id}">
                            Excel
                        </button>
                    </td>
                </tr>`;
            });

            rekapTableBody.innerHTML = bodyHTML;
            attachRekapExportListeners();

        } catch(err) { console.error(err); }
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

        // --- SHARED STYLES ---
        const borderThin = {
            top: { style: "thin", color: { rgb: "334155" } },
            bottom: { style: "thin", color: { rgb: "334155" } },
            left: { style: "thin", color: { rgb: "334155" } },
            right: { style: "thin", color: { rgb: "334155" } }
        };

        const styleTitle = {
            font: { bold: true, sz: 14, color: { rgb: "1E1B4B" } },
            alignment: { horizontal: "center", vertical: "center" }
        };

        const styleHeader = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F46E5" } },
            border: borderThin,
            alignment: { horizontal: "center", vertical: "center" }
        };

        const styleLabel = {
            font: { bold: true, color: { rgb: "475569" } },
            fill: { fgColor: { rgb: "F1F5F9" } },
            border: borderThin
        };

        const styleCell = {
            border: borderThin,
            alignment: { horizontal: "left", vertical: "center" }
        };

        const styleScore = {
            border: borderThin,
            alignment: { horizontal: "center", vertical: "center" },
            numFmt: "0"
        };

        const styleAvg = {
            font: { bold: true, color: { rgb: "047857" } },
            fill: { fgColor: { rgb: "ECFDF5" } },
            border: borderThin,
            alignment: { horizontal: "center", vertical: "center" },
            numFmt: "0.0"
        };

        const buildSheet = (sheetTitle, filterCategory) => {
            const filteredTokens = tokenKeys.filter(tkn => {
                const mapel = cachedMapels[tkn];
                const catMatch = (filterCategory === "Nasional") ? (mapel.category === "Nasional" || !mapel.category) : (mapel.category === "Pesantren");
                if (!catMatch) return false;
                if (filterCategory === "Nasional" && mapel.type === 'Peminatan') {
                    return mapel.targetClass === student.kelas;
                }
                return true;
            });

            // Grid Layout
            const wsData = [
                [{ v: sheetTitle, s: styleTitle }, "", "", "", ""],
                [{ v: "LAPORAN HASIL UJIAN MADRASAH", s: { font: { sz: 10, italic: true }, alignment: { horizontal: "center" } } }, "", "", "", ""],
                [],
                [{ v: "Nama Siswa", s: styleLabel }, { v: student.name, s: styleCell }, "", { v: "NIS", s: styleLabel }, { v: student.nis || '-', s: styleScore }],
                [{ v: "Kelas", s: styleLabel }, { v: student.kelas || '-', s: styleCell }, "", { v: "Tanggal", s: styleLabel }, { v: new Date().toLocaleDateString('id-ID'), s: styleScore }],
                [],
                [
                    { v: "No", s: styleHeader },
                    { v: "Mata Pelajaran", s: styleHeader },
                    { v: "Nilai Praktek", s: styleHeader },
                    { v: "Nilai Tulis", s: styleHeader },
                    { v: "Rata-rata UM", s: styleHeader }
                ]
            ];

            filteredTokens.forEach((tkn, i) => {
                const grades = cachedAllGrades[tkn] ? cachedAllGrades[tkn][studentId] : null;
                const g = grades || { praktek: 0, tulis: 0, average: 0 };
                wsData.push([
                    { v: i + 1, s: styleScore },
                    { v: cachedMapels[tkn].name, s: styleCell },
                    { v: Number(g.praktek || 0), s: styleScore, t: 'n' },
                    { v: Number(g.tulis || 0), s: styleScore, t: 'n' },
                    { v: Number(g.average || 0), s: styleAvg, t: 'n' }
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            
            // Merging headers
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
            ];
            
            // Column Widths
            ws['!cols'] = [
                { wch: 5 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
            ];

            return ws;
        };

        const wsNasional = buildSheet("DATA NILAI KURIKULUM NASIONAL", "Nasional");
        XLSX.utils.book_append_sheet(wb, wsNasional, "Nasional");

        const wsPesantren = buildSheet("DATA NILAI KURIKULUM PESANTREN", "Pesantren");
        XLSX.utils.book_append_sheet(wb, wsPesantren, "Pesantren");

        XLSX.writeFile(wb, `Raport_UM_${student.name.replace(/\s+/g, '_')}.xlsx`);
    };

    const exportAllClass = async (kelas) => {
        if (!kelas) return;
        window.utils.showLoading("Menyiapkan Rekapitulasi...");
        try {
            // Always refresh data to ensure latest subjects/grades are included
            await fetchAllRekapData();
            
            const filteredStudents = cachedAllStudents.filter(s => s.kelas === kelas).sort((a,b) => (a.name || "").localeCompare(b.name || ""));
            if (filteredStudents.length === 0) {
                window.utils.hideLoading();
                window.utils.showError("Data Kosong", "Tidak ada siswa di kelas ini.");
                return;
            }

            const wb = XLSX.utils.book_new();

            const buildBulkSheet = (sheetName, filterCategory) => {
                const tokenKeys = Object.keys(cachedMapels);
                const applicableTokens = tokenKeys.filter(tkn => {
                    const mapel = cachedMapels[tkn];
                    // Normalizing category match (Case-insensitive or fallback)
                    const mapelCat = (mapel.category || "Nasional");
                    const catMatch = (filterCategory === "Nasional") ? (mapelCat === "Nasional") : (mapelCat === "Pesantren");
                    
                    if (!catMatch) return false;
                    
                    // Specific filtering for Peminatan in Nasional curriculum
                    if (filterCategory === "Nasional" && mapel.type === 'Peminatan') {
                        return mapel.targetClass === kelas;
                    }
                    return true;
                });

                // Style Definitions
                const borderThin = { top: {style:"thin"}, bottom:{style:"thin"}, left:{style:"thin"}, right:{style:"thin"} };
                const sHeader = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0F172A" } }, border: borderThin, alignment: { horizontal: "center", vertical: "center" } };
                const sCell = { border: borderThin, alignment: { vertical: "center" } };
                const sNo = { ...sCell, alignment: { horizontal: "center" } };
                const sName = { ...sCell, font: { bold: true } };
                const sAvgHeader = { ...sHeader, fill: { fgColor: { rgb: "059669" } } };

                // Build Headers
                const headers = [
                    { v: "No", s: sHeader },
                    { v: "NIS", s: sHeader },
                    { v: "Nama Lengkap", s: sHeader }
                ];
                
                let gradeColCount = 0;
                applicableTokens.forEach(tkn => {
                    headers.push({ v: cachedMapels[tkn].name, s: sHeader });
                    gradeColCount++;
                });
                headers.push({ v: "Rata-rata UM", s: sAvgHeader });

                const wsData = [
                    [{ v: "REKAPITULASI NILAI " + filterCategory.toUpperCase() + " - KELAS: " + kelas, s: { font: { bold: true, sz: 14, color: { rgb: "1E1B4B" } }, alignment: { horizontal: "center" } } }],
                    [{ v: "Tanggal Ekspor: " + new Date().toLocaleDateString('id-ID'), s: { alignment: { horizontal: "center" } } }],
                    [],
                    headers
                ];

                filteredStudents.forEach((st, idx) => {
                    const row = [
                        { v: idx + 1, s: sNo },
                        { v: st.nis || '-', s: sNo },
                        { v: st.name, s: sName }
                    ];

                    let total = 0, count = 0;
                    applicableTokens.forEach(tkn => {
                        const grades = cachedAllGrades[tkn] ? cachedAllGrades[tkn][st.id] : null;
                        const um = grades ? Number(grades.average) || 0 : 0;
                        row.push({ v: um, t: 'n', s: sNo });
                        if (um > 0) { total += um; count++; }
                    });

                    const avg = count > 0 ? (total / count) : 0;
                    row.push({ v: Number(avg.toFixed(1)), t: 'n', s: { ...sNo, font: { bold: true }, fill: { fgColor: { rgb: "F0FDF4" } } } });
                    wsData.push(row);
                });

                const ws = XLSX.utils.aoa_to_sheet(wsData);
                
                // Merges for title (Row 1 & 2)
                const totalCols = 3 + gradeColCount + 1; // No, NIS, Name + Mapels + Avg
                ws['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }
                ];

                // Column Widths
                const colWidths = [{ wpx: 40 }, { wpx: 100 }, { wpx: 250 }];
                applicableTokens.forEach(() => colWidths.push({ wpx: 130 }));
                colWidths.push({ wpx: 100 });
                ws['!cols'] = colWidths;

                return ws;
            };

            XLSX.utils.book_append_sheet(wb, buildBulkSheet("Kurikulum Nasional", "Nasional"), "Nasional");
            XLSX.utils.book_append_sheet(wb, buildBulkSheet("Pondok Pesantren", "Pesantren"), "Pesantren");
            
            XLSX.writeFile(wb, `Rekap_Nilai_UM_${kelas.replace(/\s+/g, '_')}.xlsx`);
            window.utils.showSuccess("Export Berhasil", `Laporan kelas ${kelas} telah diunduh.`);
        } catch(err) { 
            console.error(err);
            window.utils.showError("Gagal Ekspor", err.message);
        }
    };

    btnExportAllClass.addEventListener('click', () => exportAllClass(currentRekapClass));

    // --- PENGATURAN ---
    const adminTokenTableBody = document.getElementById('adminTokenTableBody');
    const btnGenerateAdminToken = document.getElementById('btnGenerateAdminToken');

    const loadAdminTokens = async () => {
        adminTokenTableBody.innerHTML = `<tr><td colspan="3" class="px-4 py-8 text-center text-slate-400 italic">Memuat token...</td></tr>`;
        try {
            const snap = await getDocs(collection(window.db, "admin_token"));
            let html = '', count = 0;
            snap.forEach(d => {
                count++;
                html += `<tr class="hover:bg-slate-50 transition">
                    <td class="px-4 py-3 text-slate-400 font-mono text-xs">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-indigo-600 truncate max-w-[120px]">${d.id}</span>
                            <button class="copy-admin-tkn text-slate-300 hover:text-indigo-600 transition" data-token="${d.id}">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase tracking-tighter">Aktif</span></td>
                    <td class="px-4 py-3 text-right">
                        <button class="btn-delete-admin-token text-rose-500 hover:text-rose-700 transition" data-id="${d.id}"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                </tr>`;
            });
            adminTokenTableBody.innerHTML = count === 0 ? `<tr><td colspan="3" class="px-4 py-8 text-center text-slate-400">Belum ada token admin.</td></tr>` : html;
            attachAdminTokenListeners();
        } catch(e) { console.error(e); }
    };

    const attachAdminTokenListeners = () => {
        document.querySelectorAll('.copy-admin-tkn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const token = e.currentTarget.dataset.token;
                navigator.clipboard.writeText(token);
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Token Admin Tersalin', showConfirmButton: false, timer: 1500 });
            });
        });

        document.querySelectorAll('.btn-delete-admin-token').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const result = await Swal.fire({ 
                    title: 'Hapus Token Admin?', 
                    text: "Token ini tidak akan bisa digunakan lagi!",
                    icon: 'warning', 
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Ya, Hapus'
                });
                if (result.isConfirmed) {
                    await deleteDoc(doc(window.db, "admin_token", id));
                    loadAdminTokens();
                }
            });
        });
    };

    btnGenerateAdminToken.addEventListener('click', async () => {
        const { value: confirm } = await Swal.fire({
            title: 'Generate Token Admin Baru?',
            text: "Token akan dibuat secara otomatis untuk akses administratif.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Generate',
            confirmButtonColor: '#4f46e5'
        });

        if (confirm) {
            window.utils.showLoading("Generating...");
            try {
                const newToken = window.utils.generateToken();
                await setDoc(doc(window.db, "admin_token", newToken), {
                    createdAt: new Date().toISOString(),
                    role: 'admin'
                });
                window.utils.showSuccess("Token Berhasil Dibuat", `Token Baru: <b>${newToken}</b>`);
                loadAdminTokens();
            } catch(err) {
                window.utils.showError("Gagal", err.message);
            }
        }
    });

    btnResetData.addEventListener('click', async () => {
        const c1 = await Swal.fire({ 
            title: 'RESET SELURUH DATABASE?', 
            text: "Semua Data Siswa, Guru, Mapel, dan Nilai akan dihapus PERMANEN. Tindakan ini tidak dapat dibatalkan!", 
            icon: 'warning', 
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            confirmButtonText: 'Hapus Semua Data',
            cancelButtonText: 'Batal'
        });
        if (!c1.isConfirmed) return;

        const c2 = await Swal.fire({ 
            title: 'KONFIRMASI AKHIR', 
            text: "Silakan ketik 'Hapus Semua' untuk mengkonfirmasi penghapusan total:", 
            input: 'text', 
            icon: 'error',
            confirmButtonColor: '#be123c',
            confirmButtonText: 'KONFIRMASI HAPUS PERMANEN',
            preConfirm: (v) => {
                if (v !== 'Hapus Semua') {
                    Swal.showValidationMessage('Teks konfirmasi salah!');
                    return false;
                }
                return true;
            }
        });
        if (!c2.isConfirmed) return;

        window.utils.showLoading("Membersihkan Database...");
        try {
            const currentAdminId = localStorage.getItem('adminData');
            
            // Cleanup grade collections
            const tSnap = await getDocs(collection(window.db, "teachers"));
            for (const d of tSnap.docs) {
                const gQS = await getDocs(collection(window.db, `grades_${d.id}`));
                for (const gDoc of gQS.docs) {
                    await deleteDoc(doc(window.db, `grades_${d.id}`, gDoc.id));
                }
            }
            
            const wipe = async (col) => {
                const qs = await getDocs(collection(window.db, col));
                for (const d of qs.docs) {
                    if (col === "admin_token" && d.id === currentAdminId) continue;
                    await deleteDoc(doc(window.db, col, d.id));
                }
            };

            await wipe("students");
            await wipe("teachers");
            await wipe("subjects");
            await wipe("classes");
            await wipe("admin_token");
            
            window.utils.hideLoading();
            await Swal.fire({ icon: 'success', title: 'Data Berhasil Direset' });
            location.reload();
        } catch(err) { 
            window.utils.hideLoading();
            window.utils.showError("Gagal Reset", err.message);
        }
    });

    // --- DATA MIGRATION ---
    const runClassMigration = async () => {
        // Migration XII IPA -> MIPA
        try {
            const oldName = "XII IPA";
            const newName = "MIPA";
            
            // Check if XII IPA exists in classes
            const classSnap = await getDocs(query(collection(window.db, "classes"), window.firestore.where("name", "==", oldName)));
            if (!classSnap.empty) {
                console.log(`Migrating ${oldName} to ${newName}...`);
                for (const cDoc of classSnap.docs) {
                    await updateDoc(doc(window.db, "classes", cDoc.id), { name: newName });
                    
                    // Sync Students
                    const sSnap = await getDocs(query(collection(window.db, "students"), window.firestore.where("kelas", "==", oldName)));
                    for (const sDoc of sSnap.docs) {
                        await updateDoc(doc(window.db, "students", sDoc.id), { kelas: newName });
                    }

                    // Sync Subjects
                    const subSnap = await getDocs(query(collection(window.db, "subjects"), window.firestore.where("targetClass", "==", oldName)));
                    for (const subDoc of subSnap.docs) {
                        await updateDoc(doc(window.db, "subjects", subDoc.id), { targetClass: newName });
                    }
                }
                console.log("Migration complete.");
                loadClasses(); loadStudents(); loadSubjects();
            }
        } catch (e) { console.error("Migration Error:", e); }
    };

    // INIT
    runClassMigration();
    loadSubjects(); loadTeachers(); loadStudents(); loadClasses(); loadAdminTokens();
});
