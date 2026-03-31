function validateLogin() {
    const usernameField = document.getElementById('username');
    const passField = document.getElementById('password');
    const message = document.getElementById('message');

    const usernameValue = usernameField.value;
    const passValue = passField.value;

    if(usernameValue === "student" && passValue === "1234"){
        const status = localStorage.getItem('electionStatus') || 'upcoming';
        const startStr = localStorage.getItem('electionStartTime') || "2026-03-20T08:00";
        const startDate = new Date(startStr).getTime();
        const now = new Date().getTime();

        if (status === 'closed') {
            if(message){
                message.innerText = "Voting has ended. Awaiting results.";
                message.style.color = "red";
            }
            return;
        }

        if (status === 'upcoming' && now < startDate) {
            if(message){
                const formattedDate = new Date(startStr).toLocaleString();
                message.innerText = "System Locked: Election portal opens on\\n" + formattedDate;
                message.style.color = "red";
            }
            return;
        }

        localStorage.setItem('isLoggedIn', 'true');
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
    alert("Redirecting to Microsoft Login...")
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        validateLogin(); // 
    }
});

// Real-time Countdown Timer for Login Page
function runTimerLogic() {
    let status = localStorage.getItem('electionStatus') || 'upcoming';
    const startStr = localStorage.getItem('electionStartTime') || "2026-12-31T08:00";
    const startDate = new Date(startStr).getTime();
    const now = new Date().getTime();
    const distance = startDate - now;
    
    // Auto-Open the election if it's upcoming but the start time has been reached!
    if (status === 'upcoming' && distance <= 0) {
        localStorage.setItem('electionStatus', 'open');
        status = 'open';
    }
    
    const timerContainer = document.getElementById('loginTimerContainer');
    const timerValues = document.getElementById('loginTimerValues');
    const timerTitle = timerContainer ? timerContainer.querySelector('h4') : null;
    
    const usernameBtn = document.getElementById('username');
    const passBtn = document.getElementById('password');
    const loginBtn = document.querySelector('.login-button');
    const msBtn = document.querySelector('.microsoft-button');
    
    if (timerContainer) timerContainer.style.display = 'block'; // Always show the status board
    
    // Disable UI visually if the election hasn't started and it's physically in the future
    if (status === 'upcoming') {
        if (timerContainer) {
            timerContainer.style.background = '#ffeaa7';
            timerContainer.style.borderColor = '#fdcb6e';
        }
        if (timerTitle) {
            timerTitle.innerText = "Election Opens In:";
            timerTitle.style.color = "#d35400";
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        if (timerValues) {
            timerValues.style.display = 'block';
            timerValues.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
        
        // Lock inputs
        if (usernameBtn) usernameBtn.disabled = true;
        if (passBtn) passBtn.disabled = true;
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.style.background = '#bdc3c7';
            loginBtn.style.cursor = 'not-allowed';
            loginBtn.innerText = "Locked";
        }
        if (msBtn) {
            msBtn.disabled = true;
            msBtn.style.background = '#bdc3c7';
            msBtn.style.cursor = 'not-allowed';
            msBtn.innerText = "Locked";
        }
    } else if (status === 'open') {
        if (timerContainer) {
            timerContainer.style.background = '#e8f8f5';
            timerContainer.style.borderColor = '#2ecc71';
        }
        if (timerTitle) {
            timerTitle.innerText = "Voting is Currently OPEN!";
            timerTitle.style.color = "#27ae60";
        }
        if (timerValues) timerValues.style.display = 'none';

        // Unlock inputs
        if (usernameBtn) usernameBtn.disabled = false;
        if (passBtn) passBtn.disabled = false;
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.style.background = '';
            loginBtn.style.cursor = 'pointer';
            loginBtn.innerText = "Login";
        }
        if (msBtn) {
            msBtn.disabled = false;
            msBtn.style.background = '';
            msBtn.style.cursor = 'pointer';
            msBtn.innerText = "Sign in with Microsoft Account";
        }
    } else if (status === 'closed') {
        if (timerContainer) {
            timerContainer.style.background = '#fadbd8';
            timerContainer.style.borderColor = '#e74c3c';
        }
        if (timerTitle) {
            timerTitle.innerText = "Voting has Ended.";
            timerTitle.style.color = "#c0392b";
        }
        if (timerValues) {
            timerValues.style.display = 'block';
            timerValues.innerText = "No longer accepting ballots";
            timerValues.style.color = "#c0392b";
            timerValues.style.fontSize = "1em";
        }

        // Lock inputs
        if (usernameBtn) usernameBtn.disabled = true;
        if (passBtn) passBtn.disabled = true;
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.style.background = '#bdc3c7';
            loginBtn.style.cursor = 'not-allowed';
            loginBtn.innerText = "Closed";
        }
        if (msBtn) {
            msBtn.disabled = true;
            msBtn.style.background = '#bdc3c7';
            msBtn.style.cursor = 'not-allowed';
            msBtn.innerText = "Closed";
        }
    } else if (status === 'concluded') {
        if (timerContainer) {
            timerContainer.style.background = '#e8f8f5';
            timerContainer.style.borderColor = '#0055a4';
        }
        if (timerTitle) {
            timerTitle.innerText = "Election Concluded";
            timerTitle.style.color = "#0055a4";
        }
        if (timerValues) {
            timerValues.style.display = 'block';
            timerValues.innerText = "Login to view Results";
            timerValues.style.color = "#0055a4";
            timerValues.style.fontSize = "1em";
        }

        // Unlock inputs for viewing results
        if (usernameBtn) usernameBtn.disabled = false;
        if (passBtn) passBtn.disabled = false;
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.style.background = '';
            loginBtn.style.cursor = 'pointer';
            loginBtn.innerText = "Login to view Results";
        }
        if (msBtn) {
            msBtn.disabled = false;
            msBtn.style.background = '';
            msBtn.style.cursor = 'pointer';
            msBtn.innerText = "Sign in with Microsoft Account";
        }
    }
}

// Run immediately on load, then every second
document.addEventListener('DOMContentLoaded', () => {
    runTimerLogic();
    setInterval(runTimerLogic, 1000);
});