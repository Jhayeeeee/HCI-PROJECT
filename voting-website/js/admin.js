// Authentication Check
if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
    window.location.href = 'admin-login.html';
}

function adminLogout() {
    localStorage.removeItem('isAdminLoggedIn');
    window.location.href = 'admin-login.html';
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
    tbody.innerHTML = '';

    if (candidates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888; padding: 20px;">No candidates registered yet. Start adding candidates!</td></tr>';
        return;
    }

    candidates.forEach((candidate) => {
        const isWinner = status === 'concluded' && candidate.isWinner === true;
        const rowStyle = isWinner ? 'background-color: #e8f8f5; border-left: 4px solid #39aa72ff;' : '';
        const winnerBadge = isWinner ? '<span style="color: #08863dff; font-weight: bold; margin-left: 10px;"> WINNER</span>' : '';

        let declareBtn = '';
        if (status === 'concluded') {
            if (isWinner) {
                declareBtn = `<button class="btn btn-warning" style="background:#f39c12; color:white; padding:5px 10px; font-size:0.8em; margin-right:5px; border:none; border-radius:4px; cursor:pointer;" onclick="toggleWinner('${candidate.id}')"><i class="fas fa-times"></i> Revoke Win</button>`;
            } else {
                declareBtn = `<button class="btn btn-success" style="background:#2ecc71; color:white; padding:5px 10px; font-size:0.8em; margin-right:5px; border:none; border-radius:4px; cursor:pointer;" onclick="toggleWinner('${candidate.id}')"> Declare Winner</button>`;
            }
        }

        const avatarSrc = candidate.photo ? candidate.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=random`;

        const tr = document.createElement('tr');
        tr.style = rowStyle;
        tr.innerHTML = `
            <td style="display:flex; align-items:center; gap:10px;">
                <img src="${avatarSrc}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                <strong>${candidate.name}</strong> ${winnerBadge}
            </td>
            <td>${candidate.position}</td>
            <td>${candidate.party}</td>
            <td><strong>${candidate.votes || 0}</strong></td>
            <td>
                ${declareBtn}
                <button class="btn btn-danger" style="padding:5px 10px; font-size:0.8em; border:none; border-radius:4px; cursor:pointer;" onclick="deleteCandidate('${candidate.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Toggle winner status for a candidate manually
window.toggleWinner = function(id) {
    const candidates = getCandidates();
    const index = candidates.findIndex(c => c.id === id);
    if (index !== -1) {
        if (!candidates[index].isWinner) {
            const position = candidates[index].position;
            candidates.forEach(c => {
                if (c.position === position && c.id !== id) {
                    c.isWinner = false;
                }
            });
            candidates[index].isWinner = true;
        } else {
            candidates[index].isWinner = false;
        }
        
        saveCandidates(candidates);
        renderCandidatesList();
    }
}

// Updates the UI banner for election status
function renderElectionStatus() {
    const status = getElectionStatus();
    const badge = document.getElementById('electionStatusBadge');
    const toggleBtn = document.getElementById('toggleElectionBtn');

    if (status === 'concluded') {
        badge.textContent = 'Winner Announced';
        badge.className = 'status-badge concluded';
        toggleBtn.innerHTML = '<i class="fas fa-undo"></i> Reset Election';
        toggleBtn.style.color = "#fff";
        toggleBtn.style.backgroundColor = "rgba(46, 204, 113, 0.4)";
    } else {
        badge.textContent = 'Registration / Voting Open';
        badge.className = 'status-badge upcoming';
        toggleBtn.innerHTML = 'Announce Winner';
        toggleBtn.style.backgroundColor = "transparent";
    }
}

// Add New Candidate Form Submission
if (document.getElementById('addCandidateForm')) {
    document.getElementById('addCandidateForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('candidateName').value;
        const position = document.getElementById('candidatePosition').value;
        const party = document.getElementById('candidateParty').value;
        const collegeSelect = document.getElementById('candidateCollege');
        const college = collegeSelect.options[collegeSelect.selectedIndex].text;
        const quote = document.getElementById('candidateQuote').value;
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
    if (confirm('Are you sure you want to delete this candidate?')) {
        const candidates = getCandidates();
        const updatedCandidates = candidates.filter(c => c.id !== id);
        saveCandidates(updatedCandidates);
        renderCandidatesList();
    }
}

// Toggle Election Status Announcer
if (document.getElementById('toggleElectionBtn')) {
    document.getElementById('toggleElectionBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const currentStatus = getElectionStatus();
        
        if (currentStatus === 'concluded') {
            if (confirm('Are you sure you want to reset the election? This removes the winner announcement.')) {
                setElectionStatus('upcoming');
                
                // Reset votes and winner status for all candidates
                const candidates = getCandidates();
                candidates.forEach(c => {
                    c.votes = 0;
                    c.isWinner = false;
                });
                saveCandidates(candidates);
                
                // Clear voting history so users can vote again
                localStorage.removeItem('myVotingHistory');
                
                renderElectionStatus();
                renderCandidatesList();
            }
        } else {
            if (confirm('Are you sure you want to officially announce the winner? This will securely conclude the election and display the winner on the public dashboard.')) {
                setElectionStatus('concluded');
                renderElectionStatus();
                alert('Success! The election is concluded and winners will now show on the main dashboard.');
            }
        }
    });
}

// Election settings logic
function getElectionTargetTime() {
    return localStorage.getItem('electionTargetTime') || "2026-03-10T08:00";
}
function setElectionTargetTime(dateStr) {
    localStorage.setItem('electionTargetTime', dateStr);
}

if (document.getElementById('electionSettingsForm')) {
    document.getElementById('electionTargetTime').value = getElectionTargetTime();
    
    document.getElementById('electionSettingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const targetTime = document.getElementById('electionTargetTime').value;
        setElectionTargetTime(targetTime);
        alert('Dashboard countdown timer updated successfully!');
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
            <td><strong>${ann.title}</strong></td>
            <td>${ann.content.substring(0, 50)}${ann.content.length > 50 ? '...' : ''}</td>
            <td>
                <button class="btn btn-danger" style="padding:5px 10px; font-size:0.8em; border:none; border-radius:4px; cursor:pointer;" onclick="deleteAnnouncement('${ann.id}')">
                    <i class="fas fa-trash"></i> Delete
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
    if (document.getElementById('candidateTableBody')) {
        renderCandidatesList();
        renderElectionStatus();
    }
    if (document.getElementById('announcementTableBody')) {
        renderAnnouncementsList();
    }
});
