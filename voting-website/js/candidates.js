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
        banner.style.background = '#e74c3c';
    } else if (status === 'closed') {
        banner.innerHTML = 'VOTING CLOSED';
        banner.style.background = 'red';
        banner.style.color = '#fff';
        banner.style.borderRadius = '10px';
        banner.style.fontSize = '0.95rem';
        banner.style.padding = '6px 10px';  
    } else if (isVotingOpen) {
        banner.innerHTML = 'VOTING OPEN';
        banner.style.background = '#2ecc71';
        banner.style.color = '#fff';
        banner.style.borderRadius = '10px';
        banner.style.fontSize = '0.95rem';
        banner.style.padding = '6px 10px';  
    } else {
        banner.innerHTML = 'Election Not Started';
        banner.style.background = '#ffd700';
        banner.style.color = '#856600';
        banner.style.borderRadius = '10px';
        banner.style.fontSize = '0.95rem';
        banner.style.padding = '6px 10px';  
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
            container.innerHTML = '<p style="color:#666; font-size:1.1em; text-align: center; padding: 40px;">No candidates have been registered yet.</p>';
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
            posWrapper.style.marginBottom = '50px';
            
            const posTitle = document.createElement('h3');
            posTitle.style.borderBottom = '3px solid #0055a4';
            posTitle.style.paddingBottom = '10px';
            posTitle.style.color = '#090969ff';
            posTitle.style.display = 'inline-block';
            posTitle.style.textTransform = 'uppercase';
            posTitle.style.letterSpacing = '1px';
            posTitle.innerText = pos;
            
            const posGrid = document.createElement('div');
            posGrid.className = 'candidates-grid'; 
            posGrid.style.marginTop = '20px';
            
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
                        winnerBadge = '<div class="winner-badge" style="background:#2ecc71; color:white;">WINNER</div>';
                        card.style.borderTop = "5px solid #2ecc71";
                    } else {
                        card.style.opacity = '0.6'; // dim the non-winners
                    }
                } else if (canSeeLiveVotes && maxVotes > 0 && (cand.votes || 0) === maxVotes) {
                    // Highlight the current leader before conclusion
                    winnerBadge = '<div style="position:absolute; top:0; left:0; background:#f1c40f; color:#856600; padding:4px 12px; font-size:0.75em; font-weight:800; border-bottom-right-radius:10px; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);"> CURRENT LEADER</div>';
                    card.style.border = "2px solid #f1c40f";
                    card.style.boxShadow = "0 8px 20px rgba(241, 196, 15, 0.15)";
                }

                let voteBadge = canSeeLiveVotes ? `<div class="cand-votes" style="background:#e74c3c; color:white; font-weight:bold; display:inline-block; padding:5px 15px; border-radius:20px; margin-bottom:10px; font-size:0.9em;"> ${cand.votes || 0} Votes</div>` : '';

                let voteButtonHtml = '';
                let isSelected = window.draftBallot[cand.position] === cand.id;

                if (status !== 'concluded' && isVotingOpen) {
                    if (hasVotedGlobally) {
                        voteButtonHtml = `<button disabled style="margin-top:15px; width:100%; background: #bdc3c7; color: #fff; border:none; padding:10px; border-radius:5px; cursor:not-allowed; font-weight:bold;"> Voted</button>`;
                    } else if (isSelected) {
                        card.style.borderTop = "none";
                        card.style.border = "3px solid #2ecc71";
                        card.style.boxShadow = "0 8px 20px rgba(46, 204, 113, 0.25)";
                        card.style.transform = "scale(1.02)";
                        voteButtonHtml = `<button onclick="selectCandidate('${cand.id}', '${cand.position}')" style="margin-top:15px; width:100%; background: #2ecc71; color: #fff; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold; transition: background 0.3s;"><i class="fas fa-check"></i> Selected</button>`;
                    } else {
                        voteButtonHtml = `<button onclick="selectCandidate('${cand.id}', '${cand.position}')" style="margin-top:15px; width:100%; background: #0055a4; color: #fff; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold; transition: background 0.3s;"> Select for ${cand.position}</button>`;
                    }
                } else if (status === 'closed') {
                    voteButtonHtml = `<button disabled style="margin-top:15px; width:100%; background: #f39c12; color: #fff; border:none; padding:10px; border-radius:5px; cursor:not-allowed; font-weight:bold;">Voting Closed</button>`;
                } else if (status === 'concluded') {
                    voteButtonHtml = `<button disabled style="margin-top:15px; width:100%; background: #bdc3c7; color: #fff; border:none; padding:10px; border-radius:5px; cursor:not-allowed; font-weight:bold;">Final Result</button>`;
                } else {
                    voteButtonHtml = `<button disabled style="margin-top:15px; width:100%; background: #bdc3c7; color: #fff; border:none; padding:10px; border-radius:5px; cursor:not-allowed; font-weight:bold;">Voting Not Started</button>`;
                }

                const avatarSrc = cand.photo ? cand.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.name)}&background=random`;
                
                card.innerHTML = `
                    ${winnerBadge}
                    <div class="cand-avatar">
                        <img src="${avatarSrc}" alt="${cand.name}" style="object-fit:cover;">
                    </div>
                    ${voteBadge}
                    <div class="cand-info">
                        <h4>${cand.name}</h4>
                        ${cand.college ? `<span class="college">${cand.college}</span>` : ''}
                        <span class="cand-party">${cand.party}</span>
                        ${cand.quote ? `<p class="cand-quote" style="margin-top: 10px;">"${cand.quote}"</p>` : ''}
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
            img.style.objectFit = 'cover';
        });
        document.querySelectorAll('.profile-icon img').forEach(img => {
            img.src = savedPhoto;
            img.style.objectFit = 'cover';
        });
    }
}

// Initial check
checkAuthAndStatus();
setInterval(checkAuthAndStatus, 1000);

document.addEventListener('DOMContentLoaded', () => {
    syncSidebarUI();
});
