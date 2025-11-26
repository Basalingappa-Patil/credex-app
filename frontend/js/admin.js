// API_URL is now global, defined in config.js

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || user.role !== 'admin') {
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

async function loadDashboard() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();

            document.getElementById('totalCandidates').textContent = data.stats.totalCandidates;
            document.getElementById('totalEmployers').textContent = data.stats.totalEmployers;
            document.getElementById('totalCredentials').textContent = data.stats.totalCredentials;
            document.getElementById('verifiedCredentials').textContent = data.stats.verifiedCredentials;
            document.getElementById('totalIssuers').textContent = data.stats.totalIssuers;
            document.getElementById('totalVerifications').textContent = data.stats.totalVerifications;
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadCandidates() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/admin/candidates`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('candidatesList');

            if (data.candidates.length === 0) {
                container.innerHTML = '<p class="text-muted">No candidates found</p>';
                return;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Skills</th>
                            <th>Score</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.candidates.map(c => `
                            <tr>
                                <td>${c.name}</td>
                                <td>${c.email}</td>
                                <td>${c.skillCount || 0}</td>
                                <td>${Math.round(c.overallScore || 0)}</td>
                                <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button onclick="deleteUser('${c._id}')" class="btn-danger btn-sm">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading candidates:', error);
    }
}

async function loadIssuers() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/admin/issuers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('issuersList');

            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Trust Score</th>
                            <th>Credentials</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.issuers.map(i => `
                            <tr>
                                <td>${i.name}</td>
                                <td>${i.type}</td>
                                <td>${i.trustScore}/100</td>
                                <td>${i.credentialCount || 0}</td>
                                <td>${i.isActive ? '✓ Active' : '✗ Inactive'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading issuers:', error);
    }
}

async function loadVerificationLogs() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/admin/verification-logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('verificationLogs');

            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Workflow ID</th>
                            <th>Type</th>
                            <th>Candidate</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Started</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.logs.map(log => `
                            <tr>
                                <td>${log.workflowId.substring(0, 8)}...</td>
                                <td>${log.type}</td>
                                <td>${log.candidateId?.name || 'N/A'}</td>
                                <td>${log.status}</td>
                                <td>${log.duration ? (log.duration / 1000).toFixed(2) + 's' : '-'}</td>
                                <td>${new Date(log.startedAt).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading logs:', error);
    }
}

async function loadBecknLogs() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/admin/beckn-logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('becknLogs');

            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Action</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.logs.map(log => `
                            <tr>
                                <td>${log.transactionId.substring(0, 8)}...</td>
                                <td>${log.action}</td>
                                <td>${log.role}</td>
                                <td>${log.status}</td>
                                <td>${new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading Beckn logs:', error);
    }
}

async function loadErrors() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/admin/errors`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('errorsList');

            if (data.errors.length === 0) {
                container.innerHTML = '<p class="text-muted">No errors found</p>';
                return;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Workflow ID</th>
                            <th>Type</th>
                            <th>Candidate</th>
                            <th>Error</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.errors.map(err => `
                            <tr>
                                <td>${err.workflowId.substring(0, 8)}...</td>
                                <td>${err.type}</td>
                                <td>${err.candidateId?.name || 'N/A'}</td>
                                <td>${err.errorMessage || 'Unknown error'}</td>
                                <td>${new Date(err.startedAt).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading errors:', error);
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }

    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('User deleted successfully', 'success');
            // Refresh current view
            const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
            if (activeTab === 'candidates') loadCandidates();
            if (activeTab === 'employers') loadEmployers();
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Failed to delete user', 'error');
    }
}

async function loadEmployers() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/admin/employers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('employersList');

            if (data.employers.length === 0) {
                container.innerHTML = '<p class="text-muted">No employers found</p>';
                return;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Employer ID</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.employers.map(e => `
                            <tr>
                                <td>${e.name}</td>
                                <td>${e.email}</td>
                                <td>${e.employerId || '-'}</td>
                                <td>${new Date(e.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button onclick="deleteUser('${e._id}')" class="btn-danger btn-sm">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading employers:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupLogout();
    loadDashboard();
    loadCandidates();

    const tabBtns = document.querySelectorAll('.admin-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.admin-section .tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}Tab`) {
                    content.classList.add('active');
                }
            });

            switch (tabName) {
                case 'candidates':
                    loadCandidates();
                    break;
                case 'employers':
                    loadEmployers();
                    break;
                case 'issuers':
                    loadIssuers();
                    break;
                case 'logs':
                    loadVerificationLogs();
                    break;
                case 'beckn':
                    loadBecknLogs();
                    break;
                case 'errors':
                    loadErrors();
                    break;
            }
        });
    });
});


function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Style based on type
    let bg = '#333';
    if (type === 'success') bg = '#22c55e';
    if (type === 'error') bg = '#ef4444';
    if (type === 'warning') bg = '#f97316';

    toast.style.cssText = `
        background: ${bg};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-size: 14px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        min-width: 250px;
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
