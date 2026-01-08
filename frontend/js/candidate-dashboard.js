const API_URL = window.API_URL || 'http://localhost:5001/api';

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



            fetchApplications();

        } else if (response.status === 401) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}




// Previously displaySkills

function displayApplications(applications) {
    const listDiv = document.getElementById('applicationsList');
    if (!listDiv) return;

    if (applications.length === 0) {
        listDiv.innerHTML = '<p class="text-muted">You have not applied for any jobs yet.</p>';
        return;
    }

    listDiv.innerHTML = applications.map(app => `
        <div class="credential-item" style="border: 1px solid var(--border-color); padding: 10px; margin-bottom: 8px; border-radius: 6px; background: rgba(255,255,255,0.02);">
            <div style="flex-grow: 1;">
                <strong>${app.jobTitle}</strong>
                <div><small style="color: var(--text-muted);">${new Date(app.createdAt).toLocaleDateString()}</small></div>
            </div>
            <span class="skill-badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">
                ${app.status || 'APPLIED'}
            </span>
        </div>
    `).join('');
}

async function fetchApplications() {
    const listDiv = document.getElementById('applicationsList');
    if (!listDiv) return;

    try {
        const token = checkAuth();
        const response = await fetch(`${API_URL}/candidate/applications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const apps = await response.json();
            displayApplications(apps);
        } else {
            console.error('Failed to fetch applications');
            listDiv.innerHTML = '<p class="text-muted">Failed to load applications.</p>';
        }
    } catch (error) {
        console.error('Error fetching applications:', error);
        listDiv.innerHTML = '<p class="text-muted">Error loading applications.</p>';
    }
}






async function fetchJobs() {
    const listDiv = document.getElementById('jobsList');
    if (!listDiv) return;

    try {
        const token = checkAuth();
        const response = await fetch(`${API_URL}/candidate/jobs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const jobs = await response.json();

        if (response.ok && jobs.length > 0) {
            listDiv.innerHTML = jobs.map(job => `
                <div class="job-card" style="background: rgba(255,255,255,0.05); padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: var(--primary-color); font-size: 1.1rem;">${job.title}</h4>
                        <p style="margin: 0 0 5px 0; font-size: 0.8rem; color: var(--text-muted);">Posted: ${new Date(job.createdAt).toLocaleDateString()}</p>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">Required: ${job.required_skills.join(', ')}</p>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="applyForJob('${job.job_id}')">Apply</button>
                </div>
            `).join('');
        } else {
            listDiv.innerHTML = '<p class="text-muted">No jobs available right now.</p>';
        }
    } catch (error) {
        console.error("Error loading jobs:", error);
        listDiv.innerHTML = '<p class="text-muted">Failed to load jobs.</p>';
    }
}

async function applyForJob(jobId) {
    if (!confirm("Apply for this job? Your profile and skills will be shared.")) return;

    try {
        const token = checkAuth();
        const user = JSON.parse(localStorage.getItem('user'));

        const response = await fetch(`${API_URL}/candidate/jobs/${jobId}/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ student_id: user.profileId })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Applied successfully!");
        } else {
            alert("Application failed: " + (data.error || "Unknown error"));
        }
    } catch (error) {
        console.error(error);
        alert("Network error.");
    }
}

// Expose to window for onclick
window.applyForJob = applyForJob;

document.addEventListener('DOMContentLoaded', () => {
    setupLogout();
    loadDashboard();
    fetchJobs();

    const refreshJobsBtn = document.getElementById('refreshJobsBtn');
    if (refreshJobsBtn) {
        refreshJobsBtn.addEventListener('click', () => {
            fetchJobs();
        });
    }


});
