document.addEventListener('DOMContentLoaded', async () => {
    const studentMobile = sessionStorage.getItem('studentMobile');
    const profileDetails = document.getElementById('profile-details');
    const statusMessage = document.getElementById('status-message');
    const logoutBtn = document.getElementById('logout-btn');

    if (!studentMobile) {
        window.location.href = 'index.html';
        return;
    }

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('studentMobile');
        window.location.href = 'index.html';
    });

    try {
        const doc = await db.collection('students').doc(studentMobile).get();
        if (doc.exists) {
            const data = doc.data();
            if (data.isActivated) {
                profileDetails.classList.remove('hidden');
                statusMessage.classList.add('hidden');

                document.getElementById('s-name').textContent = `${data.firstName} ${data.lastName}`;
                document.getElementById('s-class').textContent = data.class;
                document.getElementById('s-goal').textContent = data.goal || 'N/A';
                document.getElementById('s-mobile').textContent = studentMobile;
                document.getElementById('s-parentName').textContent = data.parentName;
                document.getElementById('s-parentMobile').textContent = data.parentMobile;
                document.getElementById('s-dob').textContent = data.dob;
                document.getElementById('s-address').textContent = data.address;
            } else {
                // This case is handled on the login page, but as a fallback:
                profileDetails.classList.add('hidden');
                statusMessage.classList.remove('hidden');
            }
        } else {
            console.error('No such document!');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error("Error fetching profile: ", error);
        alert('Could not fetch profile data.');
    }
});
