function validateLogin() {
    const emailField = document.getElementById('email');
    const passField = document.getElementById('password');
    const message = document.getElementById('message');

    const emailValue = emailField.value;
    const passValue = passField.value;

    if(emailValue === "EMAIL_SCHOOLADDRESS" && passValue === "1234"){
        const status = localStorage.getItem('electionStatus') || 'upcoming';

        if (status === 'closed') {
            if(message){
                message.innerText = "Voting has ended. Awaiting results.";
                message.className = "error-message admin-error";
            }
            return;
        }

        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = "dashboard.html"
    }
    else{
        if(message){
            message.innerText = "Invalid Username or Password!";
            message.className = "error-message admin-error";
        }
        console.log("Login failed.");
        passField.focus();
    }
}

function loginWithMicrosoft(){
    alert("Redirecting to Microsoft Login...")
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        validateLogin(); 
    }
});

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('togglePassword');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}