function validateLogin() {
    const usernameField = document.getElementById('username');
    const passField = document.getElementById('password');
    const message = document.getElementById('message');

    const usernameValue = usernameField.value;
    const passValue = passField.value;

    if(usernameValue === "student" && passValue === "1234"){
        window.location.href = "dashboard.html"
    }
    else{
        if(message){
            message.innerText = "Invalid Username or Password!";
            message.style.color = "red";
        }
        console.log("Login failed.");
        passField.focus();
    }
}

function loginWithMicrosoft(){
    alert("Redirectiong to Microsoft Login...")
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        validateLogin(); // 
    }
});