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
            window.location.href = '/login.html';
        });
    }
}

async function loadSkillProfile() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/candidate/skill-graph`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();

            document.getElementById('overallScore').textContent = Math.round(data.overallScore || 0);
            document.getElementById('skillCount').textContent = data.skillCount || 0;
            document.getElementById('lastUpdated').textContent =
                data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : 'N/A';

            displaySkillsByLevel(data.skills || []);
            displayDetailedSkills(data.skills || []);
        } else if (response.status === 401) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error loading skill profile:', error);
    }
}

function displaySkillsByLevel(skills) {
    const container = document.getElementById('skillsByLevel');

    if (skills.length === 0) {
        container.innerHTML = '<p class="text-muted">No skills to display</p>';
        return;
    }

    const levelGroups = {};
    skills.forEach(skill => {
        const level = skill.nsqfLevel || 1;
        if (!levelGroups[level]) {
            levelGroups[level] = [];
        }
        levelGroups[level].push(skill);
    });

    const sortedLevels = Object.keys(levelGroups).sort((a, b) => b - a);

    container.innerHTML = sortedLevels.map(level => `
        <div class="level-group">
            <h4>NSQF Level ${level}</h4>
            <div class="strength-areas">
                ${levelGroups[level].map(skill =>
        `<span class="skill-badge level-${level}">${skill.skillName}</span>`
    ).join('')}
            </div>
        </div>
    `).join('');
}

function displayDetailedSkills(skills) {
    const container = document.getElementById('detailedSkills');

    if (skills.length === 0) {
        container.innerHTML = '<p class="text-muted">No skills to display</p>';
        return;
    }

    container.innerHTML = skills.map(skill => `
        <div class="skill-detail-card">
            <h4>${skill.skillName}</h4>
            <div style="display: flex; gap: 1rem; margin: 0.75rem 0;">
                <span class="skill-badge level-${skill.nsqfLevel}">Level ${skill.nsqfLevel}</span>
                <span>Proficiency: <strong>${skill.proficiency}%</strong></span>
                <span>Recency: <strong>${skill.recencyScore}%</strong></span>
            </div>
            <div class="skill-sources">
                <strong>Sources:</strong> ${skill.sources.map(src =>
        `${src.issuerName} (${new Date(src.verifiedDate).toLocaleDateString()})`
    ).join(', ')}
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    setupLogout();
    loadSkillProfile();

    const generateQRBtn = document.getElementById('generateQRBtn');
    generateQRBtn.addEventListener('click', async () => {
        const token = checkAuth();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/candidate/qrcode`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                const qrSection = document.getElementById('qrCodeSection');
                const qrContainer = document.getElementById('qrCodeContainer');
                const qrExpiry = document.getElementById('qrExpiry');

                qrContainer.innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
                qrExpiry.textContent = new Date(data.expiresAt).toLocaleString();
                qrSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
            alert('Failed to generate QR code');
        }
    });

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.addEventListener('click', () => {
        alert('Download functionality would export the skill profile as PDF');
    });
});
