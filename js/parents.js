document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('parent-login-section');
    const dashboard = document.getElementById('parent-dashboard');
    const loginBtn = document.getElementById('parent-login-btn');
    const logoutBtn = document.getElementById('parent-logout-btn');
    const loginMessage = document.getElementById('parent-login-message');

    // --- Check login status ---
    if (sessionStorage.getItem('parentChildId')) {
        loginSection.style.display = 'none';
        dashboard.classList.remove('hidden');
        loadParentData();
    }

    // --- Parent Login ---
    loginBtn.addEventListener('click', async () => {
        const parentMobile = document.getElementById('parent-mobile-login').value;
        if (!parentMobile) {
            loginMessage.textContent = 'Please enter your mobile number.';
            loginMessage.className = 'message error';
            return;
        }

        const studentsRef = db.collection('students');
        const snapshot = await studentsRef.where('parentMobile', '==', parentMobile).limit(1).get();

        if (snapshot.empty) {
            loginMessage.textContent = 'No student found registered with this parent mobile number.';
            loginMessage.className = 'message error';
            return;
        }

        snapshot.forEach(doc => {
            sessionStorage.setItem('parentChildId', doc.id); // Store student's ID (their mobile)
            sessionStorage.setItem('parentChildName', `${doc.data().firstName} ${doc.data().lastName}`);
            loginSection.style.display = 'none';
            dashboard.classList.remove('hidden');
            loadParentData();
        });
    });

    // --- Parent Logout ---
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('parentChildId');
        sessionStorage.removeItem('parentChildName');
        window.location.reload();
    });

    // --- Load Data ---
    function loadParentData() {
        const studentId = sessionStorage.getItem('parentChildId');
        const studentName = sessionStorage.getItem('parentChildName');
        
        document.getElementById('child-name-header').textContent = `Dashboard for ${studentName}`;
        
        const attendanceList = document.getElementById('attendance-list');
        const performanceList = document.getElementById('performance-list');

        // Load Attendance
        db.collection('students').doc(studentId).collection('attendance')
          .orderBy('date', 'desc').limit(30).get()
          .then(snapshot => {
              attendanceList.innerHTML = '';
              if (snapshot.empty) {
                  attendanceList.innerHTML = '<li>No attendance records found.</li>';
                  return;
              }
              snapshot.forEach(doc => {
                  const data = doc.data();
                  const li = document.createElement('li');
                  li.textContent = `Date: ${data.date} - Status: ${data.status}`;
                  attendanceList.appendChild(li);
              });
          });

        // Load Performance
        db.collection('students').doc(studentId).collection('performance')
          .orderBy('date', 'desc').limit(30).get()
          .then(snapshot => {
              performanceList.innerHTML = '';
              if (snapshot.empty) {
                  performanceList.innerHTML = '<li>No performance notes found.</li>';
                  return;
              }
              snapshot.forEach(doc => {
                  const data = doc.data();
                  const li = document.createElement('li');
                  li.innerHTML = `<strong>${data.date}:</strong> ${data.note}`;
                  performanceList.appendChild(li);
              });
          });
    }
});
