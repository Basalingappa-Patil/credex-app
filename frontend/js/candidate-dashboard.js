// API_URL is now global, defined in config.js

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return null;
    }
    return token;
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/index.html';
        });
    }
}

async function loadDashboard() {
    const token = checkAuth();
    if (!token) return;

    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userProfileId').textContent = user.profileId || 'Not Set';

    try {
        const response = await fetch(`${API_URL}/candidate/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();

            document.getElementById('skillCount').textContent = data.skillGraph.skillCount || 0;
            document.getElementById('credentialCount').textContent = data.credentialCount || 0;
            document.getElementById('overallScore').textContent =
                Math.round(data.skillGraph.overallScore || 0);

            displaySkills(data.skillGraph.skills || []);
            displayCredentials(data.credentials || []);
            displayStrengthAreas(data.skillGraph.strengthAreas || []);
        } else if (response.status === 401) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function displaySkills(skills) {
    const skillsList = document.getElementById('skillsList');

    if (skills.length === 0) {
        skillsList.innerHTML = '<p class="text-muted">No skills verified yet. Add credentials to get started.</p>';
        return;
    }

    skillsList.innerHTML = skills.slice(0, 10).map(skill => `
        <div class="skill-item">
            <strong>${skill.skillName}</strong>
            <span class="skill-badge level-${skill.nsqfLevel}">NSQF Level ${skill.nsqfLevel}</span>
            <div style="margin-top: 0.5rem;">
                <small>Proficiency: ${skill.proficiency}% | Recency: ${skill.recencyScore}%</small>
            </div>
        </div>
    `).join('');
}

function displayCredentials(credentials) {
    const credentialsList = document.getElementById('credentialsList');

    if (credentials.length === 0) {
        credentialsList.innerHTML = '<p class="text-muted">No credentials added yet.</p>';
        return;
    }

    credentialsList.innerHTML = credentials.slice(0, 5).map(cred => `
        <div class="credential-item">
            <div style="flex-grow: 1;">
                <strong>${cred.title || 'Untitled'}</strong>
                <div><small>${cred.issuerName}</small></div>
                <div style="margin-top: 0.5rem;">
                    <span class="skill-badge ${cred.verificationStatus === 'verified' ? 'level-6' : 'level-2'}">
                        ${cred.verificationStatus}
                    </span>
                </div>
            </div>
            <button class="btn-delete" onclick="deleteCredential('${cred._id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.5rem;">
                🗑️
            </button>
        </div>
    `).join('');
}

async function deleteCredential(credentialId) {
    // Confirmation removed as per user request
    // if (!confirm('Are you sure you want to delete this credential? This will also remove associated skills.')) {
    //     return;
    // }

    const token = checkAuth();
    if (!token) return;

    console.log('Sending delete request for:', credentialId);

    try {
        const response = await fetch(`${API_URL}/candidate/credentials/${credentialId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Delete response status:', response.status);

        if (response.ok) {
            // Reload dashboard to reflect changes
            loadDashboard();
        } else {
            const data = await response.json();
            console.error('Delete failed:', data);
            alert('Failed to delete credential: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting credential');
    }
}

function displayStrengthAreas(areas) {
    const strengthAreas = document.getElementById('strengthAreas');

    if (areas.length === 0) {
        strengthAreas.innerHTML = '<p class="text-muted">No strength areas identified yet.</p>';
        return;
    }

    strengthAreas.innerHTML = areas.map(area =>
        `<span class="strength-badge">${area}</span>`
    ).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    setupLogout();
    loadDashboard();

    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', async () => {
        const token = checkAuth();
        if (!token) return;

        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';

        try {
            const response = await fetch(`${API_URL}/candidate/refresh-verification`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await loadDashboard();
                alert('Verification refreshed successfully!');
            }
        } catch (error) {
            console.error('Error refreshing:', error);
            alert('Failed to refresh verification');
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.textContent = '🔄 Refresh Verification';
        }
    });
});
