// Load data from Admin Panel
function loadCandidatesData() {
    const candidatesStr = localStorage.getItem('electionCandidates');
    const candidates = candidatesStr ? JSON.parse(candidatesStr) : [];
    const status = localStorage.getItem('electionStatus') || 'upcoming';

    // Timer sync for Voting availability
    const savedTargetStr = localStorage.getItem('electionTargetTime') || "2026-03-10T08:00";
    const countDownDate = new Date(savedTargetStr).getTime();
    const nowMs = new Date().getTime();
    const isVotingOpen = (countDownDate - nowMs) < 0;

    const banner = document.getElementById('countdownBanner');
    if (status === 'concluded') {
        banner.innerHTML = 'Election Concluded';
        banner.style.background = '#e74c3c';
    } else if (isVotingOpen) {
        banner.innerHTML = 'Voting is OPEN';
        banner.style.background = '#2ecc71';
    } else {
        banner.innerHTML = 'Election Not Started';
        banner.style.background = '#ffd700';
        banner.style.color = '#856600';
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
        
        // Sort positions by the predefined order, fallback to alphabetical
        existingPositions.sort((a, b) => {
            let indexA = positionOrder.indexOf(a);
            let indexB = positionOrder.indexOf(b);
            if (indexA === -1) indexA = 999;
            if (indexB === -1) indexB = 999;
            return indexA - indexB;
        });

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
            const history = JSON.parse(localStorage.getItem('myVotingHistory') || '[]');
            
            candsInPos.forEach(cand => {
                const card = document.createElement('div');
                card.className = 'candidate-public-card';
                
                let winnerBadge = '';
                // Display winner based on Admin manual selection
                if (status === 'concluded') {
                    const isWinner = cand.isWinner === true;
                    if (isWinner) { 
                        winnerBadge = '<div class="winner-badge" style="background:#2ecc71; color:white;">WINNER</div>';
                        card.style.borderTop = "5px solid #2ecc71";
                    } else {
                        card.style.opacity = '0.6'; // dim the non-winners
                    }
                } else if (maxVotes > 0 && (cand.votes || 0) === maxVotes) {
                    // Highlight the current leader before conclusion
                    winnerBadge = '<div style="position:absolute; top:0; left:0; background:#f1c40f; color:#856600; padding:4px 12px; font-size:0.75em; font-weight:800; border-bottom-right-radius:10px; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);"> CURRENT LEADER</div>';
                    card.style.border = "2px solid #f1c40f";
                    card.style.boxShadow = "0 8px 20px rgba(241, 196, 15, 0.15)";
                }

                let voteBadge = `<div class="cand-votes" style="background:#e74c3c; color:white; font-weight:bold; display:inline-block; padding:5px 15px; border-radius:20px; margin-bottom:10px; font-size:0.9em;"> ${cand.votes || 0} Votes</div>`;

                let voteButtonHtml = '';
                const hasVotedThisPos = history.some(h => h.position === cand.position);
                const votedForThisCand = history.some(h => h.id === cand.id);

                if (status !== 'concluded' && isVotingOpen) {
                    if (votedForThisCand) {
                        voteButtonHtml = `<button disabled style="margin-top:15px; width:100%; background: #bdc3c7; color: #fff; border:none; padding:10px; border-radius:5px; cursor:not-allowed; font-weight:bold;"> Voted</button>`;
                    } else if (hasVotedThisPos) {
                        voteButtonHtml = `<button disabled style="margin-top:15px; width:100%; background: #ecf0f1; color: #95a5a6; border:none; padding:10px; border-radius:5px; cursor:not-allowed; font-weight:bold;">Position Filled</button>`;
                    } else {
                        voteButtonHtml = `<button onclick="voteForCandidate('${cand.id}')" style="margin-top:15px; width:100%; background: #2ecc71; color: #fff; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold; transition: background 0.3s;"> Vote for ${cand.name}</button>`;
                    }
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

// Expose vote function
window.voteForCandidate = function(id) {
    const candidatesStr = localStorage.getItem('electionCandidates');
    if (!candidatesStr) return;
    
    let candidates = JSON.parse(candidatesStr);
    const index = candidates.findIndex(c => c.id === id);
    if (index === -1) return;
    
    const cand = candidates[index];
    let history = JSON.parse(localStorage.getItem('myVotingHistory') || '[]');
    
    if (history.some(h => h.position === cand.position)) {
        alert("You have already cast your vote for the position of " + cand.position + "!");
        return;
    }

    if (confirm("Cast your final, secure vote for " + cand.name + " (" + cand.position + ")? This action cannot be undone.")) {
        if (!candidates[index].votes) {
           candidates[index].votes = 0;
        }
        candidates[index].votes++;
        localStorage.setItem('electionCandidates', JSON.stringify(candidates));
        
        history.push({
            id: cand.id,
            name: cand.name,
            position: cand.position,
            party: cand.party,
            timestamp: new Date().toLocaleString()
        });
        localStorage.setItem('myVotingHistory', JSON.stringify(history));
                
        alert("Your vote has been securely recorded!");
        loadCandidatesData(); // Redraw UI immediately
    }
};

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
