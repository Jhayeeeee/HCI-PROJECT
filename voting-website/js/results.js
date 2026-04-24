function loadResultsData() {
    const candidatesStr = localStorage.getItem('electionCandidates');
    const candidates = candidatesStr ? JSON.parse(candidatesStr) : [];
    const status = localStorage.getItem('electionStatus') || 'upcoming';
    
    const container = document.getElementById('resultsContent');
    
    if (status !== 'concluded') {
        container.innerHTML = `
            <div class="results-locked-card">
                <i class="fas fa-lock results-lock-icon"></i>
                <h2 class="results-locked-title">Results Not Available</h2>
                <p class="results-locked-text">The election has not been concluded yet. Please check back later when administration officially concludes the voting process.</p>
                <a href="${status === 'open' ? 'candidates.html' : '../dashboard.html'}" class="btn btn-primary btn-go-back"> Go Back</a>
            </div>
        `;
        return;
    }

    // Determine winners. First check if Admin explicitly set isWinner
    let winners = candidates.filter(c => c.isWinner === true);
    
    // Fallback automatic calculation if admin didn't select manually
    if (winners.length === 0 && candidates.length > 0) {
        let winnersPerPosition = {};
        const positions = [...new Set(candidates.map(c => c.position))];
        positions.forEach(pos => {
            const candsInPos = candidates.filter(c => c.position === pos);
            const maxVotes = Math.max(...candsInPos.map(c => c.votes || 0));
            // Only assign winner if there are actual votes
            if (maxVotes > 0) {
                const autoWinners = candsInPos.filter(c => (c.votes || 0) === maxVotes);
                winners = winners.concat(autoWinners);
            }
        });
    }
    
    if (winners.length === 0) {
        container.innerHTML = `
            <div class="results-locked-card">
                <i class="fas fa-folder-open results-lock-icon"></i>
                <h2 class="results-locked-title">No Winners Declared</h2>
                <p class="results-locked-text">The election has concluded, but no official winners have been designated or no votes were cast.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="section-title results-section-title">
            Official Election Results
        </div>
        <p class="results-congrats-text">Congratulations to the newly elected Student Council members.</p>
        <div class="candidates-grid">
    `;

    // Map ordered positions for rendering hierarchically
    const positionOrder = ["President", "Vice President", "Secretary", "Treasurer", "Auditor", "P.R.O."];
    winners.sort((a, b) => {
        let indexA = positionOrder.indexOf(a.position);
        let indexB = positionOrder.indexOf(b.position);
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        return indexA - indexB;
    });

    winners.forEach(w => {
        const avatarSrc = w.photo ? w.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}&background=random`;
        html += `
            <div class="candidate-public-card winner-card-red">
                <div class="winner-badge winner-badge-text">WINNER</div>
                <div class="cand-avatar">
                    <img src="${avatarSrc}" alt="${w.name}" class="cand-avatar-img-fit">
                </div>
                <div class="cand-votes cand-votes-blue">
                ${w.votes || 0} Votes
                </div>
                <div class="cand-info">
                    <h4>${w.name}</h4>
                    <span class="cand-pos">${w.position}</span>
                    <span class="cand-party">${w.party}</span>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// Authentication & Security Heartbeat
function checkAuthAndStatus() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '../Login.html';
        return;
    }
    const status = localStorage.getItem('electionStatus') || 'upcoming';
    if (status === 'closed') {
        localStorage.removeItem('isLoggedIn');
        alert("Voting has formally closed! You are being securely logged out.");
        window.location.href = '../Login.html';
    }
}

// Global UI Sync for Sidebar
function syncSidebarUI() {
    const savedPhoto = localStorage.getItem('myProfilePhoto');
    if (savedPhoto) {
        const avatars = document.querySelectorAll('.sidebar-avatar');
        avatars.forEach(img => {
            img.src = savedPhoto;
            img.classList.add('sidebar-avatar-fit');
        });
    }
}

// Initial check
checkAuthAndStatus();
setInterval(checkAuthAndStatus, 1000);

// Real-time synchronization across tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'electionCandidates' || e.key === 'electionStatus') {
        loadResultsData();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    syncSidebarUI();
    loadResultsData();
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
