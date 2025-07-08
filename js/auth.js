document.addEventListener('DOMContentLoaded', () => {
    // --- SIGNUP PAGE LOGIC ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        const classSelect = document.getElementById('class');
        const goalSection = document.getElementById('goal-section');

        classSelect.addEventListener('change', () => {
            const selectedClass = classSelect.value;
            if (selectedClass === '11' || selectedClass === '12') {
                goalSection.classList.remove('hidden');
            } else {
                goalSection.classList.add('hidden');
            }
        });

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('message');
            
            const mobile = document.getElementById('mobile').value;
            if (!mobile || mobile.length < 10) {
                messageDiv.textContent = 'Please enter a valid 10-digit mobile number.';
                messageDiv.className = 'message error';
                return;
            }

            const studentData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                parentName: document.getElementById('parentName').value,
                password: document.getElementById('password').value, // In a real app, HASH this password!
                class: document.getElementById('class').value,
                goal: document.getElementById('class').value > 10 ? document.getElementById('goal').value : null,
                dob: document.getElementById('dob').value,
                address: document.getElementById('address').value,
                parentMobile: document.getElementById('parentMobile').value,
                altEmail: document.getElementById('altEmail').value,
                isActivated: false, // Account is NOT active on creation
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                // Use mobile number as the document ID
                await db.collection('students').doc(mobile).set(studentData);
                messageDiv.textContent = 'Signup successful! Your account is pending admin approval.';
                messageDiv.className = 'message success';
                signupForm.reset();
                setTimeout(() => window.location.href = 'index.html', 3000);
            } catch (error) {
                console.error("Error adding document: ", error);
                messageDiv.textContent = 'Error during signup. The mobile number might already be registered.';
                messageDiv.className = 'message error';
            }
        });
    }

    // --- LOGIN PAGE LOGIC ---
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        let userExists = false;
        const mobileInput = document.getElementById('mobile');
        const passwordField = document.getElementById('password-field');
        const passwordInput = document.getElementById('password');
        const messageDiv = document.getElementById('message');

        continueBtn.addEventListener('click', async () => {
            const mobile = mobileInput.value;
            if (!mobile) {
                messageDiv.textContent = 'Please enter a mobile number.';
                messageDiv.className = 'message error';
                return;
            }

            // If password field is not visible, check user
            if (passwordField.classList.contains('hidden')) {
                const userDoc = await db.collection('students').doc(mobile).get();
                if (userDoc.exists) {
                    userExists = true;
                    passwordField.classList.remove('hidden');
                    mobileInput.disabled = true; // Lock mobile number input
                    continueBtn.textContent = 'Login';
                    messageDiv.textContent = 'User found. Please enter your password.';
                    messageDiv.className = 'message success';
                } else {
                    messageDiv.innerHTML = 'Mobile number not registered. <a href="signup.html">Click here to sign up.</a>';
                    messageDiv.className = 'message error';
                }
            } else { // If password field is visible, perform login
                const password = passwordInput.value;
                const userDoc = await db.collection('students').doc(mobile).get();
                const userData = userDoc.data();

                if (userData.password === password) { // In a real app, compare hashed passwords
                    if (userData.isActivated) {
                        messageDiv.textContent = 'Login successful! Redirecting...';
                        messageDiv.className = 'message success';
                        // Store logged-in user's mobile in session storage to use on profile page
                        sessionStorage.setItem('studentMobile', mobile);
                        window.location.href = 'profile.html';
                    } else {
                        messageDiv.textContent = 'Your Account is not Activated Yet. Please contact the administration.';
                        messageDiv.className = 'message error';
                    }
                } else {
                    messageDiv.textContent = 'Incorrect password. Please try again.';
                    messageDiv.className = 'message error';
                }
            }
        });
    }
});
