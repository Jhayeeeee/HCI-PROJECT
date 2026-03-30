function loadResultsData() {
    const candidatesStr = localStorage.getItem('electionCandidates');
    const candidates = candidatesStr ? JSON.parse(candidatesStr) : [];
    const status = localStorage.getItem('electionStatus') || 'upcoming';
    
    const container = document.getElementById('resultsContent');
    
    if (status !== 'concluded') {
        container.innerHTML = `
            <div style="text-align:center; padding: 50px; background: #fff; border-radius:12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <i class="fas fa-lock" style="font-size: 3em; color: #bdc3c7; margin-bottom: 20px;"></i>
                <h2 style="color: #333;">Results Not Available</h2>
                <p style="color: #666;">The election has not been concluded yet. Please check back later when administration officially concludes the voting process.</p>
                <a href="candidates.html" class="btn btn-primary" style="margin-top:20px; display:inline-block; text-decoration:none; background: #0055a4; color: #fff; padding: 10px 20px; border-radius: 5px;"> View Candidates</a>
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
            <div style="text-align:center; padding: 50px; background: #fff; border-radius:12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <i class="fas fa-folder-open" style="font-size: 3em; color: #bdc3c7; margin-bottom: 20px;"></i>
                <h2 style="color: #333;">No Winners Declared</h2>
                <p style="color: #666;">The election has concluded, but no official winners have been designated or no votes were cast.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="section-title" style="margin-top: 30px; margin-bottom: 20px; border-bottom: 3px solid #0055a4; padding-bottom: 15px; font-size: 25px; font-weight: bold;">
            Official Election Results
        </div>
        <p style="color: #555; font-size: 1.1em; margin-bottom: 30px;">Congratulations to the newly elected Student Council members.</p>
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
            <div class="candidate-public-card" style="border-top: 5px solid #f01228ff;">
                <div class="winner-badge" color:white;"> WINNER</div>
                <div class="cand-avatar">
                    <img src="${avatarSrc}" alt="${w.name}" style="object-fit:cover;">
                </div>
                <div class="cand-votes" style="background:#0055a4; color:white; font-weight:bold; display:inline-block; padding:5px 15px; border-radius:20px; margin-bottom:10px; font-size:0.9em;">
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

document.addEventListener('DOMContentLoaded', loadResultsData);

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
