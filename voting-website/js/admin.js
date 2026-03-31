// Authentication Check
if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
    window.location.href = 'admin-login.html';
}

function adminLogout() {
    if (confirm("Are you sure you want to log out of the Admin Panel?")) {
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
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888; padding: 20px;">No candidates registered yet. Start adding candidates!</td></tr>';
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
        const winnerBadge = isWinner ? '<span class="candidate-winner-badge" style="font-weight:bold; color:red;">WINNER</span>' : '';

        const avatarSrc = candidate.photo ? candidate.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=random`;

        const tr = document.createElement('tr');
        if (rowClass) tr.className = rowClass;
        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${avatarSrc}" style="width:36px; height:36px; border-radius:10px; object-fit:cover; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div>
                        <div style="font-weight: 700; color: #1e293b; font-size:0.95em;">${candidate.name}</div>
                    </div>
                    ${winnerBadge}
                </div>
            </td>
            <td style="font-weight: 600; color: #0055a4;">${candidate.position}</td>
            <td><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 0.8em; font-weight: 600;">${candidate.party}</span></td>
            <td><strong style="font-size: 1.1em; color: #0f172a;">${candidate.votes || 0}</strong></td>
            <td>
                <button class="btn btn-danger" style="padding:6px 10px; font-size:0.8em; border:none; border-radius:6px; opacity:${status === 'upcoming' ? '1' : '0.5'}; cursor:${status === 'upcoming' ? 'pointer' : 'not-allowed'};" onclick="deleteCandidate('${candidate.id}')" ${status === 'upcoming' ? '' : 'disabled'}>
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
    if (btnOpen) { btnOpen.disabled = false; btnOpen.style.opacity = '1'; }
    if (btnClose) { btnClose.disabled = false; btnClose.style.opacity = '1'; }
    if (btnAnnounce) { btnAnnounce.disabled = false; btnAnnounce.style.opacity = '1'; }

    if (status === 'upcoming') {
        if (badge) {
            badge.innerText = "Upcoming / Prep Mode";
            badge.className = "status-badge upcoming";
            badge.style.backgroundColor = "#ffd700";
            badge.style.color = "#856600";
        }
        if (btnClose) { btnClose.disabled = true; btnClose.style.opacity = '0.5'; }
        if (btnAnnounce) { btnAnnounce.disabled = true; btnAnnounce.style.opacity = '0.5'; }
    } else if (status === 'open') {
        if (badge) {
            badge.innerText = "Voting is OPEN";
            badge.className = "status-badge ongoing";
            badge.style.backgroundColor = "#2ecc71";
            badge.style.color = "#white";
        }
        if (btnOpen) { btnOpen.disabled = true; btnOpen.style.opacity = '0.5'; }
        if (btnAnnounce) { btnAnnounce.disabled = true; btnAnnounce.style.opacity = '0.5'; }
    } else if (status === 'closed') {
        if (badge) {
            badge.innerText = "Voting CLOSED";
            badge.className = "status-badge";
            badge.style.backgroundColor = "#f39c12";
            badge.style.color = "white";
        }
        if (btnOpen) { btnOpen.disabled = true; btnOpen.style.opacity = '0.5'; }
        if (btnClose) { btnClose.disabled = true; btnClose.style.opacity = '0.5'; }
    } else if (status === 'concluded') {
        if (badge) {
            badge.innerText = "Election Concluded";
            badge.className = "status-badge";
            badge.style.backgroundColor = "#0055a4";
            badge.style.color = "white";
        }
        if (btnOpen) { btnOpen.disabled = true; btnOpen.style.opacity = '0.5'; }
        if (btnClose) { btnClose.disabled = true; btnClose.style.opacity = '0.5'; }
        if (btnAnnounce) { btnAnnounce.disabled = true; btnAnnounce.style.opacity = '0.5'; }
    }

    // Disable add candidate features if not upcoming
    const btnAddCand = document.querySelector('#addCandidateForm button[type="submit"]');
    if (btnAddCand) {
        if (status !== 'upcoming') {
            btnAddCand.disabled = true;
            btnAddCand.style.opacity = '0.5';
            btnAddCand.innerHTML = '<i class="fas fa-lock"></i> Adding Locked';
            btnAddCand.title = 'Cannot add candidates while the election is active or concluded.';
        } else {
            btnAddCand.disabled = false;
            btnAddCand.style.opacity = '1';
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
        const quoteEl = document.getElementById('candidateQuote');
        const quote = quoteEl ? quoteEl.value : "";
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
                quote: quote,
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
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #888; padding: 20px;">No active announcements.</td></tr>';
        return;
    }

    announcements.forEach((ann) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight: 700; color: #1e293b; margin-bottom: 4px;">${ann.title}</div>
                <div style="font-size: 0.8em; color: #94a3b8;">${new Date(ann.date).toLocaleDateString()}</div>
            </td>
            <td style="max-width: 300px; color: #64748b; font-size: 0.9em;">${ann.content.substring(0, 100)}${ann.content.length > 100 ? '...' : ''}</td>
            <td>
                <button class="btn btn-danger" style="padding:8px 12px; font-size:0.85em; border:none; border-radius:6px; cursor:pointer;" onclick="deleteAnnouncement('${ann.id}')">
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
        sidebarRole.style.color = "#cbd5e1";
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
