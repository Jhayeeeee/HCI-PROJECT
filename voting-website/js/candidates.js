window.draftBallot = window.draftBallot || {};
window.existingPositionsGlobal = [];

// Auto-check for election closure or admin remote status change
setInterval(() => {
    let status = localStorage.getItem('electionStatus');
    if (status === 'open') {
        const savedTargetStr = localStorage.getItem('electionTargetTime') || "2026-03-10T08:00";
        const countDownDate = new Date(savedTargetStr).getTime();
        const distance = countDownDate - new Date().getTime();
        if (distance < 0) {
            localStorage.setItem('electionStatus', 'closed');
            localStorage.removeItem('isLoggedIn');
            alert("Election time has ended! You will now be securely logged out.");
            window.location.href = '../Login.html';
        }
    }
    
    if (status === 'closed') {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            localStorage.removeItem('isLoggedIn');
            alert("Voting has formally closed! You are being securely logged out.");
            window.location.href = '../Login.html';
        }
    }
    
    if (window.lastKnownStatus && window.lastKnownStatus !== localStorage.getItem('electionStatus')) {
        loadCandidatesData();
    }
    window.lastKnownStatus = localStorage.getItem('electionStatus');
}, 1000);

// Load data from Admin Panel
function loadCandidatesData() {
    const candidatesStr = localStorage.getItem('electionCandidates');
    const candidates = candidatesStr ? JSON.parse(candidatesStr) : [];
    const status = localStorage.getItem('electionStatus') || 'upcoming';

    // Timer sync for Voting availability
    const savedTargetStr = localStorage.getItem('electionTargetTime') || "2026-03-10T08:00";
    const countDownDate = new Date(savedTargetStr).getTime();
    const isVotingOpen = (status === 'open');

    const banner = document.getElementById('countdownBanner');
    if (status === 'concluded') {
        banner.innerHTML = 'Election Concluded';
        banner.className = 'banner-badge banner-concluded';
    } else if (status === 'closed') {
        banner.innerHTML = 'VOTING CLOSED';
        banner.className = 'banner-badge banner-closed';
    } else if (isVotingOpen) {
        banner.innerHTML = 'VOTING OPEN';
        banner.className = 'banner-badge banner-open';
    } else {
        banner.innerHTML = 'Election Not Started';
        banner.className = 'banner-badge banner-upcoming';
    }

    // Render Candidates
    const section = document.getElementById('candidatesSection');
    
    if (section) {
        let container = document.getElementById('candidatesContainer');
        if (!container) {
            const grid = document.getElementById('candidatesGrid');
            if (grid) { grid.outerHTML = '<div id="candidatesContainer"></div>'; }
            container = document.getElementById('candidatesContainer');
        }
        
        container.innerHTML = ''; // Clear default

        if (candidates.length === 0) {
            container.innerHTML = '<p class="no-candidates-msg">No candidates have been registered yet.</p>';
            return;
        }

        // Fixed position order to make it hierarchical
        const positionOrder = ["President", "Vice President", "Secretary", "Treasurer", "Auditor", "P.R.O."];
        
        // Find positions that actually have candidates
        const existingPositions = [...new Set(candidates.map(c => c.position))];
        window.existingPositionsGlobal = existingPositions;
        
        // Sort positions by the predefined order, fallback to alphabetical
        existingPositions.sort((a, b) => {
            let indexA = positionOrder.indexOf(a);
            let indexB = positionOrder.indexOf(b);
            if (indexA === -1) indexA = 999;
            if (indexB === -1) indexB = 999;
            return indexA - indexB;
        });
        
        const history = JSON.parse(localStorage.getItem('myVotingHistory') || '[]');
        
        // Action Bar UI switch
        const actionBar = document.getElementById('ballotActionBar');
        if (status !== 'concluded' && isVotingOpen && history.length === 0 && candidates.length > 0) {
            if (actionBar) {
                actionBar.style.display = 'flex';
                document.body.style.paddingBottom = '80px';
                const progressText = document.getElementById('ballotProgress');
                if (progressText) {
                    progressText.innerText = `Selections: ${Object.keys(window.draftBallot).length} / ${existingPositions.length}`;
                }
            }
        } else {
            if (actionBar) {
                actionBar.style.display = 'none';
                document.body.style.paddingBottom = '0';
            }
        }

        existingPositions.forEach(pos => {
            const posWrapper = document.createElement('div');
            posWrapper.className = 'position-group';
            
            const posTitle = document.createElement('h3');
            posTitle.className = 'position-title';
            posTitle.innerText = pos;
            
            const posGrid = document.createElement('div');
            posGrid.className = 'candidates-grid position-grid-mt'; 
            // Note: position-grid-mt is just marginTop: 20px, I'll add it to dashboard.css if not there
            
            const candsInPos = candidates.filter(c => c.position === pos);
            const maxVotes = Math.max(...candsInPos.map(c => c.votes || 0));
            
            candsInPos.forEach(cand => {
                const card = document.createElement('div');
                card.className = 'candidate-public-card';
                
                let winnerBadge = '';
                const hasVotedGlobally = history.length > 0;
                const canSeeLiveVotes = status === 'concluded' || hasVotedGlobally;

                // Display winner based on Admin manual selection
                if (status === 'concluded') {
                    const isWinner = cand.isWinner === true;
                    if (isWinner) { 
                        winnerBadge = '<div class="winner-badge winner-badge-concluded">WINNER</div>';
                        card.classList.add('card-concluded-winner');
                    } else {
                        card.classList.add('card-dimmed');
                    }
                } else if (canSeeLiveVotes && maxVotes > 0 && (cand.votes || 0) === maxVotes) {
                    // Highlight the current leader before conclusion
                    winnerBadge = '<div class="leader-badge"> CURRENT LEADER</div>';
                    card.classList.add('card-leader');
                }

                let voteBadge = canSeeLiveVotes ? `<div class="cand-votes cand-votes-badge"> ${cand.votes || 0} Votes</div>` : '';

                let voteButtonHtml = '';
                let isSelected = window.draftBallot[cand.position] === cand.id;

                if (status !== 'concluded' && isVotingOpen) {
                    if (hasVotedGlobally) {
                        voteButtonHtml = `<button disabled class="btn-vote btn-vote-voted"> Voted</button>`;
                    } else if (isSelected) {
                        card.classList.add('card-selected');
                        voteButtonHtml = `<button onclick="selectCandidate('${cand.id}', '${cand.position}')" class="btn-vote btn-vote-selected"><i class="fas fa-check"></i> Selected</button>`;
                    } else {
                        voteButtonHtml = `<button onclick="selectCandidate('${cand.id}', '${cand.position}')" class="btn-vote btn-vote-select"> Select for ${cand.position}</button>`;
                    }
                } else if (status === 'closed') {
                    voteButtonHtml = `<button disabled class="btn-vote btn-vote-closed">Voting Closed</button>`;
                } else if (status === 'concluded') {
                    voteButtonHtml = `<button disabled class="btn-vote btn-vote-result">Final Result</button>`;
                } else {
                    voteButtonHtml = `<button disabled class="btn-vote btn-vote-upcoming">Voting Not Started</button>`;
                }

                const avatarSrc = cand.photo ? cand.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.name)}&background=random`;
                
                card.innerHTML = `
                    ${winnerBadge}
                    <div class="cand-avatar">
                        <img src="${avatarSrc}" alt="${cand.name}" class="cand-avatar-img-fit">
                    </div>
                    ${voteBadge}
                    <div class="cand-info">
                        <h4>${cand.name}</h4>
                        ${cand.college ? `<span class="college">${cand.college}</span>` : ''}
                        <span class="cand-party">${cand.party}</span>
                        ${cand.quote ? `<p class="cand-quote cand-quote-mt">"${cand.quote}"</p>` : ''}
                        ${voteButtonHtml}
                    </div>
                `;
                posGrid.appendChild(card);
            });
            
            posWrapper.appendChild(posTitle);
            posWrapper.appendChild(posGrid);
            container.appendChild(posWrapper);
        });
    }
}

document.addEventListener('DOMContentLoaded', loadCandidatesData);

window.selectCandidate = function(id, position) {
    if (window.draftBallot[position] === id) {
        delete window.draftBallot[position];
    } else {
        window.draftBallot[position] = id;
    }
    loadCandidatesData();
};

window.clearBallot = function() {
    if (Object.keys(window.draftBallot).length === 0) return;
    if (confirm("Are you sure you want to clear all your current selections?")) {
        window.draftBallot = {};
        loadCandidatesData();
    }
};

window.submitBallot = function() {
    const selectedCount = Object.keys(window.draftBallot).length;
    const requiredCount = window.existingPositionsGlobal.length;
    
    if (selectedCount < requiredCount) {
        alert("Please select a candidate for ALL positions before submitting.\\n(" + selectedCount + " of " + requiredCount + " selected)");
        return;
    }
    
    if (confirm("Are you ready to cast your final, secure vote? This action cannot be undone.")) {
        const candidatesStr = localStorage.getItem('electionCandidates');
        if (!candidatesStr) return;
        
        let candidates = JSON.parse(candidatesStr);
        let history = JSON.parse(localStorage.getItem('myVotingHistory') || '[]');
        
        // Save votes
        for (const [position, id] of Object.entries(window.draftBallot)) {
            const index = candidates.findIndex(c => c.id === id);
            if (index !== -1) {
                if (!candidates[index].votes) {
                    candidates[index].votes = 0;
                }
                candidates[index].votes++;
                
                history.push({
                    id: candidates[index].id,
                    name: candidates[index].name,
                    position: candidates[index].position,
                    photo: candidates[index].photo,
                    party: candidates[index].party,
                    timestamp: new Date().toLocaleString()
                });
            }
        }
        
        localStorage.setItem('electionCandidates', JSON.stringify(candidates));
        localStorage.setItem('myVotingHistory', JSON.stringify(history));
        
        window.draftBallot = {};
        alert("Your complete ballot has been securely recorded! Thank you for voting.");
        loadCandidatesData(); // Redraw UI to "Voted" state
    }
};

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
        document.querySelectorAll('.profile-icon img').forEach(img => {
            img.src = savedPhoto;
            img.classList.add('sidebar-avatar-fit');
        });
    }
}

// Initial check
checkAuthAndStatus();
setInterval(checkAuthAndStatus, 1000);

document.addEventListener('DOMContentLoaded', () => {
    syncSidebarUI();
});
