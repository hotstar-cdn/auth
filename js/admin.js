document.addEventListener('DOMContentLoaded', () => {
    const adminLoginSection = document.getElementById('admin-login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    // --- Check for login status ---
    if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
        adminLoginSection.style.display = 'block';
        adminDashboard.classList.add('hidden');
    } else {
        adminLoginSection.style.display = 'none';
        adminDashboard.classList.remove('hidden');
        initializeApp();
    }

    // --- Admin Login ---
    adminLoginBtn.addEventListener('click', () => {
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;
        const messageDiv = document.getElementById('admin-login-message');

        // IMPORTANT: Hardcoded credentials for demonstration ONLY.
        // In a real app, store admin users in a separate Firestore collection.
        if (user === 'admin' && pass === 'admin123') {
            sessionStorage.setItem('adminLoggedIn', 'true');
            adminLoginSection.style.display = 'none';
            adminDashboard.classList.remove('hidden');
            initializeApp();
        } else {
            messageDiv.textContent = 'Invalid credentials.';
            messageDiv.className = 'message error';
        }
    });

    // --- Admin Logout ---
    adminLogoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.reload();
    });

    // --- Initialize Dashboard ---
    function initializeApp() {
        const studentsTableBody = document.getElementById('students-table-body');
        const studentSelect = document.getElementById('student-select-for-marks');
        
        // Real-time listener for students collection
        db.collection('students').onSnapshot(snapshot => {
            studentsTableBody.innerHTML = ''; // Clear table
            studentSelect.innerHTML = '<option value="">-- Select a Student --</option>'; // Clear select

            snapshot.forEach(doc => {
                const student = doc.data();
                const studentId = doc.id; // Mobile number is the ID
                
                // Populate student table
                const row = document.createElement('tr');
                row.setAttribute('data-id', studentId);
                row.innerHTML = `
                    <td><input type="checkbox" class="student-checkbox"></td>
                    <td>${student.firstName} ${student.lastName}</td>
                    <td>${student.class}</td>
                    <td>${studentId}</td>
                    <td>${student.isActivated ? '<span style="color:green;">Active</span>' : '<span style="color:red;">Pending</span>'}</td>
                    <td class="actions-buttons">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                `;
                studentsTableBody.appendChild(row);

                // Populate student dropdown for attendance/performance
                const option = document.createElement('option');
                option.value = studentId;
                option.textContent = `${student.firstName} ${student.lastName} (${studentId})`;
                studentSelect.appendChild(option);
            });
        });

        // Event Delegation for Edit/Delete buttons
        studentsTableBody.addEventListener('click', e => {
            const studentId = e.target.closest('tr').dataset.id;
            if (e.target.classList.contains('delete-btn')) {
                if (confirm(`Are you sure you want to delete student ${studentId}?`)) {
                    db.collection('students').doc(studentId).delete();
                }
            }
            if (e.target.classList.contains('edit-btn')) {
                // Simple prompt for editing class. A modal form would be better.
                const newClass = prompt(`Enter new class for ${studentId}:`);
                if (newClass) {
                    db.collection('students').doc(studentId).update({ class: newClass });
                }
            }
        });

        // --- Bulk Actions ---
        const getSelectedStudentIds = () => {
            const ids = [];
            document.querySelectorAll('.student-checkbox:checked').forEach(checkbox => {
                ids.push(checkbox.closest('tr').dataset.id);
            });
            return ids;
        };

        document.getElementById('activate-selected-btn').addEventListener('click', async () => {
            const ids = getSelectedStudentIds();
            if (ids.length === 0) return alert('No students selected.');
            const batch = db.batch();
            ids.forEach(id => {
                const ref = db.collection('students').doc(id);
                batch.update(ref, { isActivated: true });
            });
            await batch.commit();
            alert('Selected students activated.');
        });
        
        document.getElementById('delete-selected-btn').addEventListener('click', async () => {
            const ids = getSelectedStudentIds();
            if (ids.length === 0) return alert('No students selected.');
            if (!confirm(`Are you sure you want to delete ${ids.length} students?`)) return;
            const batch = db.batch();
            ids.forEach(id => {
                const ref = db.collection('students').doc(id);
                batch.delete(ref);
            });
            await batch.commit();
            alert('Selected students deleted.');
        });
        
        document.getElementById('bulk-class-change').addEventListener('change', async (e) => {
            const newClass = e.target.value;
            if (!newClass) return;
            const ids = getSelectedStudentIds();
            if (ids.length === 0) {
                 alert('No students selected.');
                 e.target.value = "";
                 return;
            }
            const batch = db.batch();
            ids.forEach(id => {
                const ref = db.collection('students').doc(id);
                batch.update(ref, { class: newClass });
            });
            await batch.commit();
            alert(`Class changed to ${newClass} for selected students.`);
            e.target.value = ""; // Reset dropdown
        });

        // Select All Checkbox
        document.getElementById('select-all-checkbox').addEventListener('change', e => {
            document.querySelectorAll('.student-checkbox').forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });

        // --- Mark Attendance & Performance ---
        const markMessage = document.getElementById('mark-message');
        document.getElementById('mark-attendance-btn').addEventListener('click', () => {
            const studentId = studentSelect.value;
            const date = document.getElementById('record-date').value;
            const status = document.getElementById('attendance-status').value;
            if (!studentId || !date) return alert('Please select a student and a date.');

            db.collection('students').doc(studentId).collection('attendance').add({
                date,
                status,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                markMessage.textContent = 'Attendance marked successfully.';
                markMessage.className = 'message success';
            });
        });

        document.getElementById('add-performance-btn').addEventListener('click', () => {
            const studentId = studentSelect.value;
            const date = document.getElementById('record-date').value;
            const note = document.getElementById('performance-note').value;
            if (!studentId || !date || !note) return alert('Please select student, date, and add a note.');

            db.collection('students').doc(studentId).collection('performance').add({
                date,
                note,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                markMessage.textContent = 'Performance note added.';
                markMessage.className = 'message success';
                document.getElementById('performance-note').value = '';
            });
        });

        // --- Add Teacher ---
        document.getElementById('add-teacher-form').addEventListener('submit', async e => {
            e.preventDefault();
            const teacherMessage = document.getElementById('teacher-message');
            const mobile = document.getElementById('teacher-mobile').value;
            
            const teacherData = {
                fullName: document.getElementById('teacher-name').value,
                subject: document.getElementById('teacher-subject').value,
                classes: document.getElementById('teacher-class').value,
                password: document.getElementById('teacher-password').value, // HASH in real app
            };

            await db.collection('teachers').doc(mobile).set(teacherData);
            teacherMessage.textContent = 'Teacher added successfully.';
            teacherMessage.className = 'message success';
            e.target.reset();
        });
    }
});
