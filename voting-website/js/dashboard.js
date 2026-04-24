// Update the count down every 1 second
function updateCountdown() {
    let status = localStorage.getItem('electionStatus') || 'upcoming';
    
    const startStr = localStorage.getItem('electionStartTime') || "2026-12-31T08:00";
    const endStr = localStorage.getItem('electionTargetTime') || "2026-12-31T23:59";
    
    const now = new Date().getTime();
    
    // Auto-Open if time reached
    if (status === 'upcoming' && (new Date(startStr).getTime() - now) <= 0) {
        localStorage.setItem('electionStatus', 'open');
        status = 'open';
    }
    
    // Aggressive Auto-Logout if Election Closed dynamically while user is on dashboard
    if (status === 'closed') {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            localStorage.removeItem('isLoggedIn');
            alert("Voting has formally closed! You are being securely logged out.");
            window.location.href = 'Login.html';
        }
    }

    const titleEl = document.querySelector('.countdown-container h3');

    if (status === 'upcoming') {
        const distance = new Date(startStr).getTime() - now;
        if (titleEl) titleEl.innerText = "Voting Opens In:";
        
        const countdownEl = document.getElementById("countdown");
        if (countdownEl && countdownEl.querySelector('.time-box') === null) {
            // Re-draw timer if it was deleted
            countdownEl.innerHTML = `
                <div class="time-box"><span id="days">00</span><label>Days</label></div>
                <div class="time-box"><span id="hours">00</span><label>Hours</label></div>
                <div class="time-box"><span id="minutes">00</span><label>Minutes</label></div>
                <div class="time-box"><span id="seconds">00</span><label>Seconds</label></div>
            `;
        }
        
        // Output the result in elements with id if they exist
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const daysEl = document.getElementById("days");
        if (daysEl && distance > 0) {
            daysEl.innerText = days < 10 ? "0" + days : days;
            document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
            document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
            document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
        }
    } else if (status === 'concluded' || status === 'closed') {
        if (titleEl) titleEl.innerText = "Election Status:";
        const countdownEl = document.getElementById("countdown");
        if (countdownEl && !countdownEl.innerHTML.includes('TIMER CONCLUDED')) {
            countdownEl.innerHTML = "<div class='voting-open-msg'>TIMER CONCLUDED</div>";
        }
    } else if (status === 'open') {
        if (titleEl) titleEl.innerText = "Voting Closes In:";
        const distance = new Date(endStr).getTime() - now;
        
        if (distance >= 0) {
            // Time calculations for days, hours, minutes and seconds
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Output the result in elements with id if they exist
            const daysEl = document.getElementById("days");
            if (daysEl) {
                daysEl.innerText = days < 10 ? "0" + days : days;
                document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
                document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
                document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
            }
        } else {
            // Auto-Close Trigger
            localStorage.setItem('electionStatus', 'closed');
            const countdownEl = document.getElementById("countdown");
            if (countdownEl) {
                countdownEl.innerHTML = "<div class='voting-open-msg'>TIME IS UP - ELECTION CLOSED</div>";
            }
            // Auto Kick Feature
            localStorage.removeItem('isLoggedIn');
            alert("Election time has ended! You will now be securely logged out.");
            window.location.href = 'Login.html';
        }
    }
    
    // Auto-refresh dynamic dashboard state
    loadDashboardData();
}

const x = setInterval(updateCountdown, 1000);

// Real-time synchronization across tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'electionStatus' || e.key === 'electionAnnouncements' || e.key === 'electionStartTime' || e.key === 'electionTargetTime') {
        loadDashboardData();
        loadAnnouncements();
    }
});

// Load data from Admin Panel
function loadDashboardData() {
    const status = localStorage.getItem('electionStatus') || 'upcoming';
    const voteBtn = document.getElementById("voteBtn");
    const badge = document.querySelector(".status-badge");

    // Handle Election Status
    if (status === 'concluded') {   
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.innerHTML = '<strong>Election Concluded!</strong> The final results have been announced.';
            welcomeMessage.classList.add('welcome-message-concluded');
        }

        if (voteBtn) {
            voteBtn.disabled = false;
            voteBtn.className = "vote-button vote-btn-concluded";
            voteBtn.innerHTML = "<i class='fas fa-chart-bar'></i> View Election Results";
            voteBtn.onclick = () => window.location.href = 'pages/results.html';
            
            const countdownEl = document.getElementById("countdown");
            if (countdownEl) {
                countdownEl.innerHTML = "<div class='voting-open-msg voting-ended-msg'>ELECTION HAS ENDED</div>";
            }
        }
        
        if (badge) {
            badge.innerText = "Concluded";
            badge.className = "status-badge concluded";
        }
    } else if (status === 'open') {
        const hasVoted = localStorage.getItem('myVotingHistory') !== null;
        
        if (voteBtn) {
            voteBtn.disabled = false;
            voteBtn.classList.add("active-vote");
            
            if (hasVoted) {
                // Smart Transparency feature: Voted users can see live stats on candidates page
                voteBtn.innerHTML = "<i class='fas fa-chart-line'></i> View Live Leaderboard";
                voteBtn.classList.add('vote-btn-voted');
                voteBtn.onclick = () => window.location.href = 'pages/candidates.html';
            } else {
                voteBtn.innerHTML = "Vote Now";
                voteBtn.classList.remove('vote-btn-voted');
                voteBtn.onclick = () => window.location.href = 'pages/candidates.html';
            }
        }
        if (badge) {
            badge.innerText = "Voting  OPEN";
            badge.className = "status-badge ongoing";
        }
    } else if (status === 'closed') {
        if (voteBtn) {
            voteBtn.disabled = true;
            voteBtn.className = "vote-button vote-btn-closed";
            voteBtn.innerHTML = "Voting Closed";
            voteBtn.onclick = null;
        }
        if (badge) {
            badge.innerText = "Voting CLOSED";
            badge.className = "status-badge concluded"; // Reusing concluded for red style
        }
    } else {
        // Upcoming
        if (voteBtn) {
            voteBtn.disabled = true;
            voteBtn.className = "vote-button vote-btn-upcoming";
            voteBtn.innerHTML = "Voting Not Started";
        }
        if (badge) {
            badge.innerText = "Upcoming";
            badge.className = "status-badge upcoming";
        }
    }
}

// Load Announcements
function loadAnnouncements() {
    const list = document.getElementById('dynamicAnnouncements');
    if (!list) return;

    const data = localStorage.getItem('electionAnnouncements');
    const announcements = data ? JSON.parse(data) : [];
    
    list.innerHTML = '';
    
    if (announcements.length === 0) {
        list.innerHTML = '<li><p class="announcement-empty-msg">No new announcements at this time.</p></li>';
        return;
    }

    // Display top 5 recent announcements
    announcements.slice(0, 5).forEach(ann => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="announcement-item-title">${ann.title}</span>
            <p class="announcement-item-content">${ann.content}</p>
        `;
        list.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateCountdown(); // Run immediately to avoid 1s delay
    loadDashboardData();
    loadAnnouncements();
});

// Sync custom profile photo globally
document.addEventListener('DOMContentLoaded', () => {
    const savedPhoto = localStorage.getItem('myProfilePhoto');
    if (savedPhoto) {
        document.querySelectorAll('.profile-icon img').forEach(img => {
            img.src = savedPhoto;
            img.classList.add('sidebar-avatar-fit');
        });
    }
});
