// Get dynamic target time or fallback to default
const savedTargetStr = localStorage.getItem('electionTargetTime') || "2026-03-10T08:00";
const countDownDate = new Date(savedTargetStr).getTime();

// Update the count down every 1 second
const x = setInterval(function() {
    const now = new Date().getTime();
    const distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Output the result in elements with id
    document.getElementById("days").innerText = days < 10 ? "0" + days : days;
    document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
    document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
    document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;

    // If the count down is over, enable voting
    if (distance < 0) {
        clearInterval(x);
        document.getElementById("countdown").innerHTML = "<div class='voting-open-msg'>VOTING IS NOW OPEN</div>";
        
        const voteBtn = document.getElementById("voteBtn");
        const status = localStorage.getItem('electionStatus') || 'upcoming';
        
        if (status !== 'concluded') {
            voteBtn.disabled = false;
            voteBtn.classList.add("active-vote");
            voteBtn.innerHTML = "Vote Now";
            voteBtn.onclick = () => window.location.href = 'candidates.html';
            
            // Update badge
            const badge = document.querySelector(".status-badge");
            badge.innerText = "Ongoing";
            badge.className = "status-badge ongoing";
        }
    }
}, 1000);

// Load data from Admin Panel
function loadDashboardData() {
    const status = localStorage.getItem('electionStatus') || 'upcoming';

    // Handle Election Status
    if (status === 'concluded') {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.innerHTML = '<strong>Election Concluded!</strong> The final results have been announced.';
            welcomeMessage.style.color = '#e74c3c';
        }

        const voteBtn = document.getElementById("voteBtn");
        if (voteBtn) {
            voteBtn.disabled = false; // Enable to send to results
            voteBtn.className = "vote-button";
            voteBtn.style.background = "#0055a4";
            voteBtn.style.cursor = "pointer";
            voteBtn.innerHTML = "View Election Results";
            voteBtn.onclick = () => window.location.href = 'results.html';
            
            document.getElementById("countdown").innerHTML = "<div class='voting-open-msg' style='color:#e74c3c;'>ELECTION HAS ENDED</div>";
            clearInterval(x); // Stops the countdown
        }
        
        const badge = document.querySelector(".status-badge");
        if (badge) {
            badge.innerText = "Concluded";
            badge.className = "status-badge";
            badge.style.backgroundColor = "#e74c3c";
            badge.style.color = "#fff";
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
        list.innerHTML = '<li><p style="color: #666; font-style: italic;">No new announcements at this time.</p></li>';
        return;
    }

    // Display top 5 recent announcements
    announcements.slice(0, 5).forEach(ann => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="date" style="font-weight:bold; color:#0055a4; display:block; margin-bottom:5px;">${ann.title}</span>
            <p style="margin:0; line-height:1.4;">${ann.content}</p>
        `;
        list.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    loadAnnouncements();
});

// Sync custom profile photo globally
document.addEventListener('DOMContentLoaded', () => {
    const savedPhoto = localStorage.getItem('myProfilePhoto');
    if (savedPhoto) {
        document.querySelectorAll('.profile-icon img').forEach(img => {
            img.src = savedPhoto;
            img.style.objectFit = 'cover';
        });
    }
});
