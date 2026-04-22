// Authentication Check
if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
    window.location.href = 'admin-login.html';
}

function adminLogout() {
    if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem('isAdminLoggedIn');
        window.location.href = 'admin-login.html';
    }
}

/**
 * Admin logic for PLM Voting Portal
 * Handles LocalStorage interactions
 */

// Helper to get candidates from LocalStorage
function getCandidates() {
    const candidatesStr = localStorage.getItem('electionCandidates');
    return candidatesStr ? JSON.parse(candidatesStr) : [];
}

// Helper to save candidates to LocalStorage
function saveCandidates(candidates) {
    localStorage.setItem('electionCandidates', JSON.stringify(candidates));
}

// Function to get the overall election status ('upcoming' or 'concluded')
function getElectionStatus() {
    return localStorage.getItem('electionStatus') || 'upcoming';
}

// Function to save the overall election status
function setElectionStatus(status) {
    localStorage.setItem('electionStatus', status);
}

// Renders the candidate table dynamically
function renderCandidatesList() {
    const candidates = getCandidates();
    const status = getElectionStatus();
    const tbody = document.getElementById('candidateTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (candidates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-empty-msg">No candidates registered yet. Start adding candidates!</td></tr>';
        return;
    }

    // --- AUTO-WINNER CALCULATION ---
    // If status is concluded, find the person with the highest votes for each unique position
    const winners = {};
    if (status === 'concluded') {
        candidates.forEach(c => {
            const currentVotes = c.votes || 0;
            if (!winners[c.position] || currentVotes > winners[c.position].votes) {
                winners[c.position] = { id: c.id, votes: currentVotes };
            }
        });
    }

    candidates.forEach((candidate) => {
        // Automatic Winner Detection logic
        const isWinner = status === 'concluded' && winners[candidate.position] && winners[candidate.position].id === candidate.id && candidate.votes > 0;
        
        const rowClass = isWinner ? 'winner-row' : '';
        const winnerBadge = isWinner ? '<span class="candidate-winner-badge">WINNER</span>' : '';

        const avatarSrc = candidate.photo ? candidate.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=random`;

        const tr = document.createElement('tr');
        if (rowClass) tr.className = rowClass;
        tr.innerHTML = `
            <td>
                <div class="candidate-info-cell">
                    <img src="${avatarSrc}" class="candidate-avatar-img">
                    <div>
                        <div class="candidate-name-text">${candidate.name}</div>
                    </div>
                    ${winnerBadge}
                </div>
            </td>
            <td class="candidate-position-text">${candidate.position}</td>
            <td><span class="candidate-party-badge">${candidate.party}</span></td>
            <td><strong class="candidate-votes-text">${candidate.votes || 0}</strong></td>
            <td>
                <button class="btn btn-danger candidate-action-btn ${status === 'upcoming' ? 'btn-active' : 'btn-locked'}" onclick="deleteCandidate('${candidate.id}')" ${status === 'upcoming' ? '' : 'disabled'}>
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Side-bar Toggle for Desktop (Collapse) and Mobile (Overlay)
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    // Detect mobile or desktop
    if (window.innerWidth > 992) {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('adminSidebarCollapsed', sidebar.classList.contains('collapsed'));
    } else {
        sidebar.classList.toggle('open');
    }
}

// Toggle winner status for a candidate manually (REMOVED: Now Automatic)
/* 
window.toggleWinner = function(id) {
    ...
}
*/

// Updates the UI banner for election status
function renderElectionStatus() {
    const status = localStorage.getItem('electionStatus') || 'upcoming';
    const badge = document.getElementById('electionStatusBadge');
    
    // Disable/Enable the new explicit buttons based on state
    const btnOpen = document.getElementById('ctrlOpen');
    const btnClose = document.getElementById('ctrlClose');
    const btnAnnounce = document.getElementById('ctrlAnnounce');
    const btnReset = document.getElementById('ctrlReset');
    
    // Reset all buttons to enabled first (except reset, always enabled)
    if (btnOpen) { btnOpen.disabled = false; btnOpen.classList.remove('btn-locked'); btnOpen.classList.add('btn-active'); }
    if (btnClose) { btnClose.disabled = false; btnClose.classList.remove('btn-locked'); btnClose.classList.add('btn-active'); }
    if (btnAnnounce) { btnAnnounce.disabled = false; btnAnnounce.classList.remove('btn-locked'); btnAnnounce.classList.add('btn-active'); }

    if (status === 'upcoming') {
        if (badge) {
            badge.innerText = "Upcoming / Prep Mode";
            badge.className = "status-badge upcoming";
        }
        if (btnClose) { btnClose.disabled = true; btnClose.classList.add('btn-locked'); btnClose.classList.remove('btn-active'); }
        if (btnAnnounce) { btnAnnounce.disabled = true; btnAnnounce.classList.add('btn-locked'); btnAnnounce.classList.remove('btn-active'); }
    } else if (status === 'open') {
        if (badge) {
            badge.innerText = "Voting is OPEN";
            badge.className = "status-badge ongoing";
        }
        if (btnOpen) { btnOpen.disabled = true; btnOpen.classList.add('btn-locked'); btnOpen.classList.remove('btn-active'); }
        if (btnAnnounce) { btnAnnounce.disabled = true; btnAnnounce.classList.add('btn-locked'); btnAnnounce.classList.remove('btn-active'); }
    } else if (status === 'closed') {
        if (badge) {
            badge.innerText = "Voting is CLOSED";
            badge.className = "status-badge concluded"; // Reusing concluded for red style if defined, or just status-badge
        }
        if (btnOpen) { btnOpen.disabled = true; btnOpen.classList.add('btn-locked'); btnOpen.classList.remove('btn-active'); }
        if (btnClose) { btnClose.disabled = true; btnClose.classList.add('btn-locked'); btnClose.classList.remove('btn-active'); }
    } else if (status === 'concluded') {
        if (badge) {
            badge.innerText = "Election Concluded";
            badge.className = "status-badge concluded";
        }
        if (btnOpen) { btnOpen.disabled = true; btnOpen.classList.add('btn-locked'); btnOpen.classList.remove('btn-active'); }
        if (btnClose) { btnClose.disabled = true; btnClose.classList.add('btn-locked'); btnClose.classList.remove('btn-active'); }
        if (btnAnnounce) { btnAnnounce.disabled = true; btnAnnounce.classList.add('btn-locked'); btnAnnounce.classList.remove('btn-active'); }
    }

    // Disable add candidate features if not upcoming
    const btnAddCand = document.querySelector('#addCandidateForm button[type="submit"]');
    if (btnAddCand) {
        if (status !== 'upcoming') {
            btnAddCand.disabled = true;
            btnAddCand.classList.add('btn-locked');
            btnAddCand.innerHTML = '<i class="fas fa-lock"></i> Adding Locked';
            btnAddCand.title = 'Cannot add candidates while the election is active or concluded.';
        } else {
            btnAddCand.disabled = false;
            btnAddCand.classList.remove('btn-locked');
            btnAddCand.innerHTML = '<i class="fas fa-plus"></i> Add Candidate';
            btnAddCand.title = '';
        }
    }
}

// Add New Candidate Form Submission
if (document.getElementById('addCandidateForm')) {
    document.getElementById('addCandidateForm').addEventListener('submit', function(e) {
        e.preventDefault();

        if (getElectionStatus() !== 'upcoming') {
            alert('Security Lock: Candidates cannot be added while the election is active or concluded.');
            return;
        }

        const name = document.getElementById('candidateName').value;
        const position = document.getElementById('candidatePosition').value;
        const party = document.getElementById('candidateParty').value;
        const collegeSelect = document.getElementById('candidateCollege');
        const college = collegeSelect.options[collegeSelect.selectedIndex].text;
        const photoInput = document.getElementById('candidatePhoto');
        const formElement = this;

        const saveCandidate = (photoData) => {
            const candidates = getCandidates();
            const newId = 'cand_' + Date.now();
            
            candidates.push({
                id: newId,
                name: name,
                position: position,
                party: party,
                college: college,
                photo: photoData,
                votes: 0 // Initialize votes (could be used later)
            });

            saveCandidates(candidates);
            formElement.reset();
            renderCandidatesList();
            alert(`Candidate ${name} successfully added!`);
        };

        if (photoInput && photoInput.files && photoInput.files[0]) {
            const file = photoInput.files[0];
            if (file.size > 2000000) { // Limit to 2MB for LocalStorage limit prevention
                alert("File is too large! Please upload a photo smaller than 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onload = function(event) {
                saveCandidate(event.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            saveCandidate(null);
        }
    });
}

// Delete candidate function attached to the window object so inline event listeners can find it
window.deleteCandidate = function(id) {
    if (getElectionStatus() !== 'upcoming') {
        alert('Security Lock: Candidates cannot be deleted while the election is active or concluded.');
        return;
    }
    if (confirm('Are you sure you want to delete this candidate?')) {
        const candidates = getCandidates();
        const updatedCandidates = candidates.filter(c => c.id !== id);
        saveCandidates(updatedCandidates);
        renderCandidatesList();
    }
}

// Election settings logic
function getElectionTargetTime() {
    return localStorage.getItem('electionTargetTime') || "2026-03-31T08:00";
}
function getElectionStartTime() {
    return localStorage.getItem('electionStartTime') || "2026-03-20T08:00";
}

if (document.getElementById('electionSettingsForm')) {
    document.getElementById('electionTargetTime').value = getElectionTargetTime();
    document.getElementById('electionStartTime').value = getElectionStartTime();
    
    document.getElementById('electionSettingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const targetTime = document.getElementById('electionTargetTime').value;
        const startTime = document.getElementById('electionStartTime').value;
        localStorage.setItem('electionTargetTime', targetTime);
        localStorage.setItem('electionStartTime', startTime);
        alert('Election start and closure rules updated successfully!');
    });
}

// --- ANNOUNCEMENT LOGIC ---

// Helper to get announcements from LocalStorage
function getAnnouncements() {
    const data = localStorage.getItem('electionAnnouncements');
    return data ? JSON.parse(data) : [];
}

// Helper to save announcements to LocalStorage
function saveAnnouncements(announcements) {
    localStorage.setItem('electionAnnouncements', JSON.stringify(announcements));
}

// Render Announcements List
function renderAnnouncementsList() {
    const tbody = document.getElementById('announcementTableBody');
    if (!tbody) return;
    
    const announcements = getAnnouncements();
    tbody.innerHTML = '';

    if (announcements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="table-empty-msg">No active announcements.</td></tr>';
        return;
    }

    announcements.forEach((ann) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="announcement-title-cell">${ann.title}</div>
                <div class="announcement-date-text">${new Date(ann.date).toLocaleDateString()}</div>
            </td>
            <td class="announcement-content-cell">${ann.content.substring(0, 100)}${ann.content.length > 100 ? '...' : ''}</td>
            <td>
                <button class="btn btn-danger announcement-action-btn" onclick="deleteAnnouncement('${ann.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Delete announcement
window.deleteAnnouncement = function(id) {
    if (confirm('Are you sure you want to delete this announcement?')) {
        let announcements = getAnnouncements();
        announcements = announcements.filter(a => a.id !== id);
        saveAnnouncements(announcements);
        renderAnnouncementsList();
    }
}

// Add New Announcement Submission
if (document.getElementById('addAnnouncementForm')) {
    document.getElementById('addAnnouncementForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        
        const announcements = getAnnouncements();
        announcements.unshift({
            id: 'ann_' + Date.now(),
            title: title,
            content: content,
            date: new Date().toISOString()
        });
        
        saveAnnouncements(announcements);
        this.reset();
        renderAnnouncementsList();
        alert('Announcement successfully posted!');
    });
}

// Initialize admin panel on load
document.addEventListener('DOMContentLoaded', () => {
    // Apply Sidebar preference
    const sidebar = document.getElementById('sidebar');
    if (sidebar && localStorage.getItem('adminSidebarCollapsed') === 'true' && window.innerWidth > 992) {
        sidebar.classList.add('collapsed');
    }

    // Sidebar User Info Init
    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName) sidebarName.innerText = "System Admin";
    
    const sidebarRole = document.getElementById('sidebarUserRole');
    if (sidebarRole) {
        sidebarRole.innerText = "Administrator";
    }
    if (document.getElementById('candidateTableBody')) {
        renderCandidatesList();
        renderElectionStatus();
    }
    if (document.getElementById('announcementTableBody')) {
        renderAnnouncementsList();
    }

    // Manual Control Logic
    const btnOpen = document.getElementById('ctrlOpen');
    const btnClose = document.getElementById('ctrlClose');
    const btnAnnounce = document.getElementById('ctrlAnnounce');
    const btnReset = document.getElementById('ctrlReset');

    if (btnOpen) {
        btnOpen.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm("Are you sure you want to OPEN the election now? Students will be able to log in and vote immediately.")) {
                localStorage.setItem('electionStatus', 'open');
                alert("Election successfully opened!");
                renderElectionStatus();
            }
        });
    }

    if (btnClose) {
        btnClose.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm("Are you sure you want to physically CLOSE the voting? All students will be kicked out immediately.")) {
                localStorage.setItem('electionStatus', 'closed');
                localStorage.removeItem('isLoggedIn'); // Force active students out
                alert("Election forcibly closed.");
                renderElectionStatus();
            }
        });
    }

    if (btnAnnounce) {
        btnAnnounce.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm("Are you sure you want to ANNOUNCE WINNERS? This is permanent and public.")) {
                localStorage.setItem('electionStatus', 'concluded');
                alert("Results are now officially public on the Dashboard!");
                renderElectionStatus();
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', function(e) {
            e.preventDefault();
            const confirm1 = confirm("⚠️ DANGER: Are you absolutely sure you want to FACTORY RESET?");
            if (confirm1) {
                const confirm2 = prompt("Type 'RESET' to wipe all candidates and votes.");
                if (confirm2 === "RESET") {
                    localStorage.removeItem('electionCandidates');
                    localStorage.removeItem('myVotingHistory');
                    localStorage.setItem('electionStatus', 'upcoming');
                    alert("System completely wiped and reset.");
                    renderCandidatesList();
                    renderElectionStatus();
                } else {
                    alert("Reset cancelled.");
                }
            }
        });
    }
});
