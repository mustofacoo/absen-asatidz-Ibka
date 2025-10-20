
        const app = {
            data: {
                teachers: [],
                attendances: [],
                schedules: [],
                subjects: []
            },
            currentPage: 'dashboard',

            saveToStorage() {
                localStorage.setItem('pesantrenData', JSON.stringify(this.data));
            },

            loadFromStorage() {
                const saved = localStorage.getItem('pesantrenData');
                if (saved) {
                    this.data = JSON.parse(saved);
                }
            },
            
init() {
    this.loadFromStorage();
    // Jika data kosong, load sample data
    if (this.data.teachers.length === 0) {
        this.loadSampleData();
        this.saveToStorage();
    }
    this.renderNav();
    this.setTodayDate();
    this.renderDashboard();
    this.setupSubjectInput();
},

            
            
            loadSampleData() {
                this.data.teachers = [
                    { id: 1, name: 'Ustadz Neman Agustono', subjects: ['Bahasa Arab', 'Tafsir'], classes: '1, 2, 3' },
                    { id: 2, name: 'Ustadz Didik H', subjects: ['Hadits', 'Iman'], classes: '12,3' }
                ];
            },
            
            setTodayDate() {
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('attendanceDate').value = today;
                // HAPUS baris journalDate dan journalFormDate
                
                const currentMonth = today.substring(0, 7);
                document.getElementById('reportMonth').value = currentMonth;
            },
                        
            renderNav() {
                const pages = [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'teachers', label: 'Data Pengajar' },
                    { id: 'attendance', label: 'Absensi' },
                    { id: 'schedule', label: 'Jadwal' },  // UBAH dari 'journal' ke 'schedule'
                    { id: 'reports', label: 'Laporan' }
                ];
                
                const nav = document.getElementById('nav');
                nav.innerHTML = pages.map(p => 
                    `<button class="${p.id === this.currentPage ? 'active' : ''}" 
                            onclick="app.changePage('${p.id}')">${p.label}</button>`
                ).join('');
            },

            changePage(pageId) {
                this.currentPage = pageId;
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(pageId).classList.add('active');
                this.renderNav();
                
                if (pageId === 'dashboard') this.renderDashboard();
                if (pageId === 'teachers') this.renderTeachers();
                if (pageId === 'attendance') this.loadAttendanceForDate();
                if (pageId === 'schedule') {
                    this.updateScheduleTeacherSelect();
                    this.loadSchedules();
                }
                if (pageId === 'reports') {
                    this.updateReportTeacherSelect();
                    this.loadReport();
                }
            },
            
            renderDashboard() {
                const today = new Date().toISOString().split('T')[0];
                const todayAttendances = this.data.attendances.filter(a => a.date === today);
                
                const hadir = todayAttendances.filter(a => a.status === 'hadir').length;
                const terlambat = todayAttendances.filter(a => a.status === 'terlambat').length;
                const izin = todayAttendances.filter(a => a.status === 'izin').length;
                const sakit = todayAttendances.filter(a => a.status === 'sakit').length;
                
                const stats = document.getElementById('dashboardStats');
                stats.innerHTML = `
                    <div class="stat-card">
                        <h3>Total Pengajar</h3>
                        <div class="value">${this.data.teachers.length}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Hadir Tepat Waktu</h3>
                        <div class="value">${hadir}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Terlambat</h3>
                        <div class="value">${terlambat}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Izin</h3>
                        <div class="value">${izin}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Sakit</h3>
                        <div class="value">${sakit}</div>
                    </div>
                `;
                
                const todayDiv = document.getElementById('todayAttendance');
                if (todayAttendances.length === 0) {
                    todayDiv.innerHTML = '<div class="empty-state">Belum ada absensi hari ini</div>';
                } else {
                // Di bagian todayDiv.innerHTML, UBAH menjadi:
                todayDiv.innerHTML = '<table><thead><tr><th>Nama</th><th>Mapel/Kelas</th><th>Status</th><th>Waktu</th><th>Catatan</th></tr></thead><tbody>' +
                    todayAttendances.map(a => {
                        const teacher = this.data.teachers.find(t => t.id === a.teacherId);
                        return `<tr>
                            <td>${teacher ? teacher.name : '-'}</td>
                            <td>${a.subject || '-'} / ${a.class || '-'}</td>
                            <td><span class="tag status-${a.status}">${a.status.toUpperCase()}</span></td>
                            <td>${a.time || '-'}</td>
                            <td>${a.notes || '-'}</td>
                        </tr>`;
                    }).join('') + '</tbody></table>';
                }
            },
            
            renderTeachers() {
                const tbody = document.getElementById('teachersList');
                if (this.data.teachers.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada data pengajar</td></tr>';
                    return;
                }
                
                tbody.innerHTML = this.data.teachers.map(t => `
                    <tr>
                        <td>${t.name}</td>
                        <td>${t.subjects.map(s => `<span class="tag">${s}</span>`).join(' ')}</td>
                        <td>${t.classes}</td>
                        <td class="actions">
                            <button onclick="app.editTeacher(${t.id})">Edit</button>
                            <button class="danger" onclick="app.deleteTeacher(${t.id})">Hapus</button>
                        </td>
                    </tr>
                `).join('');
            },
            
            showTeacherModal(teacher = null) {
                const modal = document.getElementById('teacherModal');
                const title = document.getElementById('teacherModalTitle');
                const form = document.getElementById('teacherForm');
                
                form.reset();
                this.data.subjects = [];
                this.renderSubjectsChips();
                
                if (teacher) {
                    title.textContent = 'Edit Pengajar';
                    document.getElementById('teacherId').value = teacher.id;
                    document.getElementById('teacherName').value = teacher.name;
                    document.getElementById('teacherClass').value = teacher.classes;
                    this.data.subjects = [...teacher.subjects];
                    this.renderSubjectsChips();
                } else {
                    title.textContent = 'Tambah Pengajar';
                    document.getElementById('teacherId').value = '';
                }
                
                modal.classList.add('active');
            },
            
            setupSubjectInput() {
                const input = document.getElementById('subjectInput');
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = input.value.trim();
                        if (value && !this.data.subjects.includes(value)) {
                            this.data.subjects.push(value);
                            this.renderSubjectsChips();
                            input.value = '';
                        }
                    }
                });
            },
            
            renderSubjectsChips() {
                const container = document.getElementById('subjectsChips');
                container.innerHTML = this.data.subjects.map((s, i) => `
                    <div class="chip">
                        ${s}
                        <span class="chip-remove" onclick="app.removeSubject(${i})">×</span>
                    </div>
                `).join('');
            },
            
            removeSubject(index) {
                this.data.subjects.splice(index, 1);
                this.renderSubjectsChips();
            },
            
            saveTeacher(e) {
                e.preventDefault();
                
                if (this.data.subjects.length === 0) {
                    alert('Tambahkan minimal satu mata pelajaran');
                    return;
                }
                
                const id = document.getElementById('teacherId').value;
                const teacher = {
                    id: id ? parseInt(id) : Date.now(),
                    name: document.getElementById('teacherName').value,
                    subjects: [...this.data.subjects],
                    classes: document.getElementById('teacherClass').value
                };
                
                if (id) {
                    const index = this.data.teachers.findIndex(t => t.id === parseInt(id));
                    this.data.teachers[index] = teacher;
                } else {
                    this.data.teachers.push(teacher);
                }
                
                this.closeModal();
                this.renderTeachers();
                this.saveToStorage();
            },
            
            editTeacher(id) {
                const teacher = this.data.teachers.find(t => t.id === id);
                if (teacher) this.showTeacherModal(teacher);
            },
            
            deleteTeacher(id) {
                if (confirm('Yakin ingin menghapus pengajar ini?')) {
                    this.data.teachers = this.data.teachers.filter(t => t.id !== id);
                    this.renderTeachers();
                    this.saveToStorage();
                }
                
            },
            
            closeModal() {
                document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
            },
                        
            loadAttendanceForDate() {
                const date = document.getElementById('attendanceDate').value;
                const container = document.getElementById('attendanceList');
                
                if (!date) {
                    container.innerHTML = '<div class="empty-state">Pilih tanggal terlebih dahulu</div>';
                    return;
                }
                
                // Dapatkan hari dari tanggal
                const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const dateObj = new Date(date + 'T00:00:00');
                const dayName = dayNames[dateObj.getDay()];
                
                // Filter jadwal berdasarkan hari
                const todaySchedules = this.data.schedules.filter(s => s.day === dayName);
                
                if (todaySchedules.length === 0) {
                    container.innerHTML = '<div class="empty-state">Tidak ada jadwal mengajar pada hari ini</div>';
                    return;
                }
                
                container.innerHTML = todaySchedules.map(schedule => {
                    const teacher = this.data.teachers.find(t => t.id === schedule.teacherId);
                    const existing = this.data.attendances.find(a => 
                        a.date === date && 
                        a.teacherId === schedule.teacherId && 
                        a.scheduleId === schedule.id
                    );
                    
                    return `
                        <div class="attendance-row">
                            <div class="name">
                                <strong>${teacher ? teacher.name : '-'}</strong><br>
                                <small>${schedule.subject} - ${schedule.class} (${schedule.startTime}-${schedule.endTime})</small>
                            </div>
                            <select id="status-${schedule.id}">
                                <option value="hadir" ${existing?.status === 'hadir' ? 'selected' : ''}>Tepat Waktu</option>
                                <option value="terlambat" ${existing?.status === 'terlambat' ? 'selected' : ''}>Terlambat</option>
                                <option value="izin" ${existing?.status === 'izin' ? 'selected' : ''}>Izin</option>
                                <option value="sakit" ${existing?.status === 'sakit' ? 'selected' : ''}>Sakit</option>
                                <option value="alpha" ${existing?.status === 'alpha' ? 'selected' : ''}>Alpha</option>
                            </select>
                            <input type="time" id="time-${schedule.id}" value="${existing?.time || schedule.startTime}">
                            <textarea id="notes-${schedule.id}" placeholder="Catatan (opsional)">${existing?.notes || ''}</textarea>
                        </div>
                    `;
                }).join('');
            },
            
            
            saveAttendance() {
                const date = document.getElementById('attendanceDate').value;
                if (!date) {
                    alert('Pilih tanggal terlebih dahulu');
                    return;
                }
                
                // Hapus absensi lama untuk tanggal ini
                this.data.attendances = this.data.attendances.filter(a => a.date !== date);
                
                // Dapatkan jadwal hari ini
                const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const dateObj = new Date(date + 'T00:00:00');
                const dayName = dayNames[dateObj.getDay()];
                const todaySchedules = this.data.schedules.filter(s => s.day === dayName);
                
                // Simpan absensi untuk setiap jadwal
                todaySchedules.forEach(schedule => {
                    const status = document.getElementById(`status-${schedule.id}`).value;
                    const time = document.getElementById(`time-${schedule.id}`).value;
                    const notes = document.getElementById(`notes-${schedule.id}`).value;
                    
                    this.data.attendances.push({
                        id: Date.now() + Math.random(),
                        date,
                        teacherId: schedule.teacherId,
                        scheduleId: schedule.id,
                        subject: schedule.subject,
                        class: schedule.class,
                        status,
                        time,
                        notes
                    });
                });
                
                this.saveToStorage();
                alert('Absensi berhasil disimpan');
                this.renderDashboard();
            },
            
            updateScheduleTeacherSelect() {
                const select1 = document.getElementById('scheduleTeacher');
                const select2 = document.getElementById('scheduleFormTeacher');
                
                const options = this.data.teachers.map(t => 
                    `<option value="${t.id}">${t.name}</option>`
                ).join('');
                
                select1.innerHTML = '<option value="">Semua Pengajar</option>' + options;
                select2.innerHTML = '<option value="">Pilih Pengajar</option>' + options;
                
                // PERBAIKAN: Clone node untuk remove semua listener
                const newSelect2 = select2.cloneNode(true);
                select2.parentNode.replaceChild(newSelect2, select2);
                
                newSelect2.addEventListener('change', () => {
                    const teacherId = parseInt(newSelect2.value);
                    const teacher = this.data.teachers.find(t => t.id === teacherId);
                    const subjectSelect = document.getElementById('scheduleFormSubject');
                    
                    if (teacher) {
                        subjectSelect.innerHTML = teacher.subjects.map(s => 
                            `<option value="${s}">${s}</option>`
                        ).join('');
                    } else {
                        subjectSelect.innerHTML = '<option value="">Pilih Pengajar Dulu</option>';
                    }
                });
            },

loadSchedules() {
    const day = document.getElementById('scheduleDay').value;
    const teacherId = document.getElementById('scheduleTeacher').value;
    const container = document.getElementById('scheduleList');
    
    let filtered = this.data.schedules;
    if (day) filtered = filtered.filter(s => s.day === day);
    if (teacherId) filtered = filtered.filter(s => s.teacherId === parseInt(teacherId));
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada jadwal</div>';
        return;
    }
    
    // Group by day
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const grouped = {};
    days.forEach(d => grouped[d] = []);
    filtered.forEach(s => grouped[s.day].push(s));
    
    container.innerHTML = days.map(d => {
        if (grouped[d].length === 0) return '';
        return `
            <h3 style="margin-top: 20px; margin-bottom: 10px; color: #2c5f2d;">${d}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Pengajar</th>
                        <th>Mapel</th>
                        <th>Kelas</th>
                        <th>Jam</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${grouped[d].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(s => {
                        const teacher = this.data.teachers.find(t => t.id === s.teacherId);
                        return `<tr>
                            <td>${teacher ? teacher.name : '-'}</td>
                            <td>${s.subject}</td>
                            <td>${s.class}</td>
                            <td>${s.startTime} - ${s.endTime}</td>
                            <td class="actions">
                                <button class="danger" onclick="app.deleteSchedule(${s.id})">Hapus</button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
    }).join('');
},

showScheduleModal() {
    document.getElementById('scheduleModal').classList.add('active');
    this.updateScheduleTeacherSelect();
},

saveSchedule(e) {
    e.preventDefault();
    
    const schedule = {
        id: Date.now(),
        teacherId: parseInt(document.getElementById('scheduleFormTeacher').value),
        subject: document.getElementById('scheduleFormSubject').value,
        day: document.getElementById('scheduleFormDay').value,
        startTime: document.getElementById('scheduleFormStart').value,
        endTime: document.getElementById('scheduleFormEnd').value,
        class: document.getElementById('scheduleFormClass').value
    };
    
    this.data.schedules.push(schedule);
    this.saveToStorage();
    this.closeModal();
    this.loadSchedules();
    alert('Jadwal berhasil disimpan');
},

deleteSchedule(id) {
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
        this.data.schedules = this.data.schedules.filter(s => s.id !== id);
        this.saveToStorage();
        this.loadSchedules();
    }
},
            
            updateReportTeacherSelect() {
                const select = document.getElementById('reportTeacher');
                select.innerHTML = '<option value="">Pilih Pengajar</option>' +
                    this.data.teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            },
            
            loadReport() {
                const month = document.getElementById('reportMonth').value;
                const teacherId = document.getElementById('reportTeacher').value;
                const container = document.getElementById('reportContent');
                
                if (!month || !teacherId) {
                    container.innerHTML = '<div class="empty-state">Pilih bulan dan pengajar terlebih dahulu</div>';
                    return;
                }
                
                const teacher = this.data.teachers.find(t => t.id === parseInt(teacherId));
                if (!teacher) return;
                
                const [year, monthNum] = month.split('-');
                const daysInMonth = new Date(year, monthNum, 0).getDate();
                
                const attendances = this.data.attendances.filter(a => 
                    a.date.startsWith(month) && a.teacherId === parseInt(teacherId)
                );
                
                const hadir = attendances.filter(a => a.status === 'hadir').length;
                const terlambat = attendances.filter(a => a.status === 'terlambat').length;
                const izin = attendances.filter(a => a.status === 'izin').length;
                const sakit = attendances.filter(a => a.status === 'sakit').length;
                
                let totalMinutesLate = 0;
                attendances.forEach(a => {
                    if (a.status === 'terlambat' && a.time) {
                        const [hours, minutes] = a.time.split(':').map(Number);
                        const targetMinutes = 7 * 60;
                        const actualMinutes = hours * 60 + minutes;
                        if (actualMinutes > targetMinutes) {
                            totalMinutesLate += actualMinutes - targetMinutes;
                        }
                    }
                });
                
                container.innerHTML = `
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Total Hari Kerja</h3>
                            <div class="value">${daysInMonth}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Hadir Tepat Waktu</h3>
                            <div class="value">${hadir}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Terlambat</h3>
                            <div class="value">${terlambat}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Total Menit Terlambat</h3>
                            <div class="value">${totalMinutesLate}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Izin</h3>
                            <div class="value">${izin}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Sakit</h3>
                            <div class="value">${sakit}</div>
                        </div>
                    </div>
                    
                    <h3 style="margin-top: 30px; margin-bottom: 15px;">Detail Kehadiran</h3>
                    ${attendances.length === 0 ? '<div class="empty-state">Belum ada data kehadiran</div>' : `
                        <table>
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Mapel/Kelas</th>
                                    <th>Status</th>
                                    <th>Waktu</th>
                                    <th>Catatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${attendances.sort((a, b) => a.date.localeCompare(b.date)).map(a => `
                                    <tr>
                                        <td>${a.date}</td>
                                        <td>${a.subject || '-'} / ${a.class || '-'}</td>
                                        <td><span class="tag status-${a.status}">${a.status.toUpperCase()}</span></td>
                                        <td>${a.time || '-'}</td>
                                        <td>${a.notes || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                `;
            },
            
        downloadCSV() {
            const month = document.getElementById('reportMonth').value;
            const teacherId = document.getElementById('reportTeacher').value;
            
            if (!month || !teacherId) {
                alert('Pilih bulan dan pengajar terlebih dahulu');
                return;
            }
            
            const teacher = this.data.teachers.find(t => t.id === parseInt(teacherId));
            if (!teacher) return;
            
            const attendances = this.data.attendances.filter(a => 
                a.date.startsWith(month) && a.teacherId === parseInt(teacherId)
            );
            
            let csv = 'LAPORAN KEHADIRAN\n';
            csv += `Pengajar: ${teacher.name}\n`;
            csv += `Periode: ${month}\n\n`;
            csv += 'Tanggal,Mapel,Kelas,Status,Waktu,Catatan\n';
            
            attendances.sort((a, b) => a.date.localeCompare(b.date)).forEach(a => {
                csv += `${a.date},${a.subject || ''},${a.class || ''},${a.status},${a.time || ''},${(a.notes || '').replace(/,/g, ';')}\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `laporan_${teacher.name.replace(/\s/g, '_')}_${month}.csv`;
            link.click();
        }
        };
        
        document.addEventListener('DOMContentLoaded', () => app.init());
        
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                app.closeModal();
            }
        });
