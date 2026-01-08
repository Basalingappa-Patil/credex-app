const API_URL = window.API_URL || 'http://localhost:5001/api';

document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

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
        });
    });

    const verifyByIdForm = document.getElementById('verifyByIdForm');

    // Setup Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/index.html';
        });
    }

    const fetchProfileBtn = document.getElementById('fetchProfileBtn');
    const verifyAuthenticityBtn = document.getElementById('verifyAuthenticityBtn');
    const unverifiedClaimsDiv = document.getElementById('unverifiedClaims');
    const claimsListDiv = document.getElementById('claimsList');

    verifyByIdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const candidateId = document.getElementById('candidateId').value;

        fetchProfileBtn.disabled = true;
        fetchProfileBtn.textContent = 'Fetching...';
        unverifiedClaimsDiv.style.display = 'none';
        document.getElementById('verificationResult').style.display = 'none';

        try {
            const response = await fetch(`${API_URL}/verify/claims/${candidateId}`);
            const data = await response.json();

            if (data.success) {
                displayUnverifiedClaims(data.claims, data.candidate.name);
                unverifiedClaimsDiv.style.display = 'block';

                // Set up verify button
                verifyAuthenticityBtn.onclick = () => verifyCandidate(candidateId);
            } else {
                alert('Fetch failed: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to fetch candidate profile');
        } finally {
            fetchProfileBtn.disabled = false;
            fetchProfileBtn.textContent = 'Fetch Profile';
        }
    });

    async function verifyCandidate(candidateId) {
        verifyAuthenticityBtn.disabled = true;
        verifyAuthenticityBtn.textContent = 'Verifying...';

        try {
            const response = await fetch(`${API_URL}/verify/by-id/${candidateId}`);
            const data = await response.json();

            if (data.success) {
                displayVerificationResult(data.verification);
                unverifiedClaimsDiv.style.display = 'none'; // Hide claims after verification
            } else {
                alert('Verification failed: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to verify candidate');
        } finally {
            verifyAuthenticityBtn.disabled = false;
            verifyAuthenticityBtn.textContent = 'Verify Authenticity';
        }
    }

    function displayUnverifiedClaims(claims, candidateName) {
        let html = '';

        if (claims.skills && claims.skills.length > 0) {
            html += `<h4>Self-Declared Skills</h4><ul>`;
            claims.skills.forEach(s => {
                html += `<li>${s.skillName} (Level ${s.nsqfLevel})</li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p>No skills declared.</p>`;
        }

        if (claims.credentials && claims.credentials.length > 0) {
            html += `<h4>Uploaded Credentials</h4><ul>`;
            claims.credentials.forEach(c => {
                // Construct URL for the document viewer
                const skillsStr = c.skills ? c.skills.map(s => s.name).join(',') : '';

                html += `<li>
                    <strong>${c.title}</strong> - ${c.issuerName}
                    <br><small>Issued: ${new Date(c.issuedDate).toLocaleDateString()}</small>
                </li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p>No credentials uploaded.</p>`;
        }

        claimsListDiv.innerHTML = html;
    }


    // Verify by JSON Logic
    const verifyJsonBtn = document.getElementById('verifyJsonBtn');
    const clearJsonBtn = document.getElementById('clearJsonBtn');
    const jsonInput = document.getElementById('jsonInput');
    const jsonResultContainer = document.getElementById('jsonResultContainer');
    const checkItemList = document.querySelector('.check-item-list');

    if (verifyJsonBtn) {
        verifyJsonBtn.addEventListener('click', async () => {
            const jsonText = jsonInput.value.trim();
            if (!jsonText) {
                alert('Please enter JSON text');
                return;
            }

            let jsonObj;
            try {
                jsonObj = JSON.parse(jsonText);
            } catch (e) {
                alert('Invalid JSON format');
                return;
            }

            verifyJsonBtn.disabled = true;
            verifyJsonBtn.textContent = 'Verifying...';
            jsonResultContainer.style.display = 'none';

            try {
                const response = await fetch(`${API_URL}/verify/json`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonObj)
                });
                const data = await response.json();

                if (data.success) {
                    displayJsonVerificationResult(data);
                } else {
                    alert('Verification failed: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to verify JSON');
            } finally {
                verifyJsonBtn.disabled = false;
                verifyJsonBtn.textContent = 'Verify';
            }
        });
    }

    if (clearJsonBtn) {
        clearJsonBtn.addEventListener('click', () => {
            jsonInput.value = '';
            jsonResultContainer.style.display = 'none';
        });
    }

    // Result Tabs Logic
    const resultTabs = document.querySelectorAll('.result-tab');

    resultTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            resultTabs.forEach(t => {
                t.classList.remove('active');
                t.style.borderBottom = 'none';
                t.style.color = '#9ca3af';
            });

            // Add active to clicked
            tab.classList.add('active');
            tab.style.borderBottom = '2px solid #10b981';
            tab.style.color = '#fff';

            // Hide all panes
            document.querySelectorAll('.tab-pane').forEach(pane => pane.style.display = 'none');

            // Show target pane
            const targetId = tab.dataset.target;
            document.getElementById(targetId).style.display = 'block';
        });
    });

    function displayJsonVerificationResult(data) {
        jsonResultContainer.style.display = 'block';
        checkItemList.innerHTML = ''; // Clear previous

        // Reset to first tab
        resultTabs[0].click();

        const isVerified = data.verified;

        // 1. Populate Verified Check List
        const verifiedRow = document.createElement('div');
        verifiedRow.style.padding = '5px 0';
        verifiedRow.style.fontFamily = 'monospace';
        verifiedRow.innerHTML = `<strong>VERIFIED:</strong> <span style="color: ${isVerified ? '#10b981' : '#ef4444'}">${isVerified}</span>`;
        checkItemList.appendChild(verifiedRow);

        if (data.checks) {
            Object.entries(data.checks).forEach(([key, value]) => {
                const row = document.createElement('div');
                row.style.padding = '5px 0';
                row.style.fontFamily = 'monospace';
                row.style.borderBottom = '1px solid #374151'; // Darker border
                row.style.color = '#d1d5db';

                const keySpan = `<span style="text-transform: uppercase;">CHECKS:</span> <span style="color: #9ca3af">${key}:</span>`;

                let valueHtml = '';
                if (value === true || (value.parsed === true) || (value.validated === true) || (value.valid === true) || (value.verified === true)) {
                    valueHtml = `<span style="color: #10b981;">true</span>`;
                    if (typeof value === 'object' && value.proofType) {
                        valueHtml = `<span style="color: #10b981;">${value.proofType}</span>`;
                    }
                } else {
                    valueHtml = `<span style="color: #ef4444;">${value.error || 'false'}</span>`;
                }

                if (key === 'credential-proof' && value.proofType) {
                    valueHtml = `<span style="color: #9ca3af;">${value.proofType}</span>`;
                }

                row.innerHTML = `${keySpan} ${valueHtml}`;
                checkItemList.appendChild(row);
            });
        }

        // 2. Populate Verifier Metadata
        document.getElementById('evalTimestamp').textContent = new Date().toISOString();

        // 3. Populate Document Metadata (Raw JSON / Details)
        // We can show the structure of the input document regarding its type, issuer, etc.
        const inputJson = JSON.parse(document.getElementById('jsonInput').value);
        let docMeta = `Type: ${Array.isArray(inputJson.type) ? inputJson.type.join(', ') : inputJson.type}\n`;
        docMeta += `Issuer: ${typeof inputJson.issuer === 'object' ? inputJson.issuer.id : inputJson.issuer}\n`;
        docMeta += `Issued: ${inputJson.issuanceDate || inputJson.issued}\n`;
        if (inputJson.credentialSubject) {
            docMeta += `Subject: ${inputJson.credentialSubject.id || 'N/A'}\n`;
        }

        document.getElementById('docMetaPre').textContent = docMeta;
    }
    // Post Job Logic
    const postJobForm = document.getElementById('postJobForm');
    if (postJobForm) {
        postJobForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = postJobForm.querySelector('button[type="submit"]');

            // Get user info
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                alert('Please login first');
                return;
            }
            const user = JSON.parse(userStr);

            if (!user.employerId) {
                // Try to infer or alert
                alert('Employer ID missing from profile. Please re-login.');
                return;
            }

            const formData = new FormData(postJobForm);
            const jobData = {
                employer_id: user.employerId,
                title: formData.get('title'),
                skills: formData.get('skills'), // handled as string in backend or array?
                required_skills: formData.get('skills'), // backend expects this key
                description: formData.get('description')
            };

            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';

            try {
                const response = await fetch(`${API_URL}/employer/jobs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jobData)
                });

                if (response.ok) {
                    alert('Job posted successfully!');
                    postJobForm.reset();
                    fetchPostedJobs(); // Refresh list
                } else {
                    const data = await response.json();
                    alert('Failed to post job: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error posting job:', error);
                alert('Network error posting job');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Post Job';
            }
        });
    }

    // Posted Jobs Logic
    const postJobTabBtn = document.querySelector('.tab-btn[data-tab="postJob"]');
    if (postJobTabBtn) {
        postJobTabBtn.addEventListener('click', () => {
            fetchPostedJobs();
        });
    }

    async function fetchPostedJobs() {
        const listDiv = document.getElementById('postedJobsList');
        if (!listDiv) return;

        listDiv.innerHTML = '<p class="text-muted" style="padding: 20px; text-align: center;">Loading jobs...</p>';

        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            if (!user.employerId) {
                listDiv.innerHTML = '<p class="text-muted" style="padding: 20px; text-align: center;">Employer information missing.</p>';
                return;
            }

            const response = await fetch(`${API_URL}/employer/jobs?employer_id=${user.employerId}`);
            const jobs = await response.json();

            if (response.ok) {
                if (jobs.length === 0) {
                    listDiv.innerHTML = '<p class="text-muted" style="padding: 20px; text-align: center;">No active jobs posted.</p>';
                } else {
                    displayPostedJobs(jobs);
                }
            } else {
                listDiv.innerHTML = `<p class="text-muted" style="padding: 20px; text-align: center;">Failed to load: ${jobs.error || 'Unknown error'}</p>`;
            }
        } catch (err) {
            console.error(err);
            listDiv.innerHTML = '<p class="text-muted" style="padding: 20px; text-align: center;">Network error loading jobs.</p>';
        }
    }

    function displayPostedJobs(jobs) {
        const listDiv = document.getElementById('postedJobsList');
        let html = '<div style="display: flex; flex-direction: column; gap: 10px; padding: 15px;">';

        jobs.forEach(job => {
            const skills = Array.isArray(job.required_skills) ? job.required_skills.join(', ') : job.required_skills;
            // job.job_id is the UUID
            html += `
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 5px 0; color: var(--primary-color);">${job.title}</h4>
                    <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: var(--text-muted);">Required: ${skills}</p>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-light); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 400px;">${job.description || ''}</p>
                </div>
                <button class="btn btn-sm btn-outline" style="color: #ef4444; border-color: #ef4444;" onclick="deleteJob('${job.job_id}')">Delete</button>
            </div>
            `;
        });

        html += '</div>';
        listDiv.innerHTML = html;
    }

    // Expose delete function Global
    window.deleteJob = async (jobId) => {
        if (!confirm('Are you sure you want to delete this job? Candidates will no longer see it.')) return;

        try {
            const response = await fetch(`${API_URL}/employer/jobs/${jobId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Refresh list
                fetchPostedJobs();
                alert('Job deleted.');
            } else {
                alert('Failed to delete job.');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting job.');
        }
    };

    // Applications Tab Logic
    const applicationsTabBtn = document.querySelector('.tab-btn[data-tab="applications"]');
    if (applicationsTabBtn) {
        applicationsTabBtn.addEventListener('click', () => {
            fetchApplications();
        });
    }

    async function fetchApplications() {
        const listDiv = document.getElementById('applicantsList');
        listDiv.innerHTML = '<p class="text-muted" style="padding: 20px; text-align: center;">Loading applications...</p>';

        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            if (!user.employerId) {
                listDiv.innerHTML = '<p class="text-muted" style="padding: 20px; text-align: center;">Employer ID not found in profile.</p>';
                return;
            }

            const response = await fetch(`${API_URL}/employer/applications?employer_id=${user.employerId}`);
            const data = await response.json();

            if (response.ok) {
                displayApplications(data);
            } else {
                listDiv.innerHTML = `<p class="text-muted" style="padding: 20px; text-align: center;">Failed to load: ${data.error || 'Unknown error'}</p>`;
            }
        } catch (err) {
            console.error(err);
            listDiv.innerHTML = '<p class="text-muted" style="padding: 20px; text-align: center;">Network error loading applications.</p>';
        }
    }

    function displayApplications(apps) {
        const listDiv = document.getElementById('applicantsList');
        if (!apps || apps.length === 0) {
            listDiv.innerHTML = '<p class="text-muted" style="padding: 20px; text-align: center;">No applications found.</p>';
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
        apps.forEach(app => {
            const skillsStr = (app.skills && app.skills.length > 0) ? app.skills.join(', ') : 'No specific skills listed';
            const jobTitle = app.jobTitle || 'Unknown Job';

            html += `
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; transition: all 0.3s ease;">
                <div>
                    <h4 style="margin: 0 0 5px 0; color: var(--primary-color); font-size: 1.1rem;">${app.candidateName}</h4> 
                    <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: #fbbf24; font-weight: 600;">Applying for: ${jobTitle}</p>
                    <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: var(--text-muted);">USN: <span style="color: var(--text-main); font-family: monospace;">${app.student_id}</span></p>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">Skills: <span style="color: var(--accent-color);">${skillsStr}</span></p>
                </div>
                <div style="text-align: right;">
                    <div style="margin-bottom: 8px;">
                        <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600;">
                            ${app.status || 'APPLIED'}
                        </span>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="window.populateAndVerify('${app.student_id}')" style="padding: 6px 16px; font-size: 0.85rem;">
                        Verify
                    </button>
                </div>
            </div>
            `;
        });
        html += '</div>';
        listDiv.innerHTML = html;
    }

    // Helper to switch tab and verify
    window.populateAndVerify = (id) => {
        // Switch to ID tab
        document.querySelector('.tab-btn[data-tab="id"]').click();
        // Fill input
        document.getElementById('candidateId').value = id;
        // Scroll to form
        document.getElementById('verifyByIdForm').scrollIntoView({ behavior: 'smooth' });
    };

});

function displayProviders(providers) {
    const listDiv = document.getElementById('providersList');
    if (!providers || providers.length === 0) {
        listDiv.innerHTML = '<p>No providers found.</p>';
        return;
    }

    listDiv.innerHTML = providers.map(provider => `
        <div class="provider-card" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
            <h4>${provider.descriptor.name}</h4>
            <p>${provider.descriptor.short_desc}</p>
            <div class="provider-items">
                ${provider.items.map(item => `
                    <div class="item" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span>${item.descriptor.name}</span>
                        <button class="btn btn-sm btn-outline" onclick="selectProvider('${provider.id}', '${item.id}')">
                            Select Service
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Global function to verify stored certificate
window.verifyStoredCertificate = async (credentialId) => {
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    // Hide previous results
    document.getElementById('verificationResult').style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/verify/credential/${credentialId}`, {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
            displayVerificationResult(data.verification);
        } else {
            alert('Verification failed: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to verify certificate');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
};

// Make selectProvider global so it can be called from onclick
window.selectProvider = async (providerId, itemId) => {
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Selecting...';

    try {
        // 1. Select
        const selectRes = await fetch(`${API_URL}/beckn/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order: {
                    provider: { id: providerId },
                    items: [{ id: itemId }]
                }
            })
        });
        const selectData = await selectRes.json();
        const transactionId = selectData.context.transaction_id;

        // Poll for on_select
        const onSelectData = await pollResults(transactionId, 'on_select');

        if (!onSelectData) {
            throw new Error('Select timed out');
        }

        btn.textContent = 'Confirming...';

        // 2. Confirm
        const confirmRes = await fetch(`${API_URL}/beckn/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order: {
                    provider: { id: providerId },
                    items: [{ id: itemId }],
                    billing: { // Mock billing info
                        name: "Employer",
                        email: "employer@example.com"
                    }
                },
                context: { transaction_id: transactionId }
            })
        });

        // Poll for on_confirm
        const onConfirmData = await pollResults(transactionId, 'on_confirm');

        if (onConfirmData) {
            alert('Verification Service Ordered Successfully! Order ID: ' + onConfirmData.message.order.id);
            btn.textContent = 'Ordered';
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-success');
        } else {
            throw new Error('Confirm timed out');
        }

    } catch (error) {
        console.error('Order error:', error);
        alert('Failed to order service: ' + error.message);
        btn.disabled = false;
        btn.textContent = originalText;
    }
};

async function pollResults(transactionId, action) {
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 2000;

    return new Promise((resolve, reject) => {
        const poll = setInterval(async () => {
            attempts++;
            try {
                const res = await fetch(`${API_URL}/beckn/results?transactionId=${transactionId}&action=${action}`);
                const data = await res.json();

                if (data.status === 'completed' && data.results) {
                    clearInterval(poll);
                    resolve(data.results);
                } else if (attempts >= maxAttempts) {
                    clearInterval(poll);
                    resolve(null);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, pollInterval);
    });
}

function displayVerificationResult(verification) {
    const resultDiv = document.getElementById('verificationResult');
    const statusBadge = document.getElementById('verificationStatus');
    const candidateInfo = document.getElementById('candidateInfo');
    const skillsInfo = document.getElementById('skillsInfo');
    const vpJson = document.getElementById('vpJson');

    statusBadge.className = 'status-badge verified';
    statusBadge.textContent = '✓ Verified';

    candidateInfo.innerHTML = `
        <h3>Candidate Information</h3>
        <p><strong>Name:</strong> ${verification.candidateName}</p>
        <p><strong>Overall Score:</strong> ${Math.round(verification.overallScore || 0)}/100</p>
        <p><strong>Total Skills:</strong> ${verification.skillCount}</p>
        <p><strong>Verified At:</strong> ${new Date(verification.timestamp).toLocaleString()}</p>
    `;

    skillsInfo.innerHTML = `
        <h3>Verified Skills</h3>
        ${verification.skills.map(skill => `
            <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
                <strong>${skill.name}</strong>
                <span class="skill-badge level-${skill.nsqfLevel}">Level ${skill.nsqfLevel}</span>
                <div style="margin-top: 0.5rem; font-size: 0.875rem;">
                    Proficiency: ${skill.proficiency}% | Recency: ${skill.recencyScore}%
                </div>
                <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-light);">
                    Sources: ${skill.sources.map(s => s.issuer).join(', ')}
                </div>
            </div>
        `).join('')}
    `;

    // Display raw JSON
    vpJson.textContent = JSON.stringify(verification.verifiablePresentation, null, 2);

    // Add Explanation Block
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'vp-explanation';
    explanationDiv.style.marginTop = '20px';
    explanationDiv.style.padding = '20px';
    explanationDiv.style.background = 'rgba(22, 101, 52, 0.2)'; // Darker green background for better contrast
    explanationDiv.style.border = '1px solid rgba(34, 197, 94, 0.3)';
    explanationDiv.style.borderRadius = '12px';

    explanationDiv.innerHTML = explainVP(verification.verifiablePresentation);

    // Remove existing explanation if any
    const existingExp = document.querySelector('.vp-explanation');
    if (existingExp) existingExp.remove();

    vpJson.parentNode.appendChild(explanationDiv);

    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

function explainVP(vp) {
    if (!vp || !vp.verifiableCredential || vp.verifiableCredential.length === 0) return '';

    const cred = vp.verifiableCredential[0];
    const subject = cred.credentialSubject;
    const proof = vp.proof;

    return `
        <h3 style="color: #4ade80; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
            ✅ Successfully Verified
        </h3>
        <div style="color: #e5e7eb; font-size: 0.95rem; line-height: 1.6;">
            <p style="margin-bottom: 15px;">
                This credential has been cryptographically validated against the <strong>Beckn Protocol</strong> and <strong>ONEST Network</strong> standards. Here is a detailed breakdown of what this verification guarantees:
            </p>
            
            <div style="margin-bottom: 12px;">
                <strong style="color: #fff;">1. Identity Confirmation:</strong>
                <div style="margin-left: 20px; color: #d1d5db;">
                    The individual <em>${subject.name}</em> is the legitimate holder of this credential. Their digital identity (${subject.id}) has been authenticated.
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <strong style="color: #fff;">2. Skill Validation:</strong>
                <div style="margin-left: 20px; color: #d1d5db;">
                    The skill <strong>${subject.skill.name}</strong> has been formally assessed. The candidate has achieved <strong>Level ${subject.skill.nsqfLevel}</strong> proficiency according to the National Skills Qualification Framework (NSQF).
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <strong style="color: #fff;">3. Trusted Issuance:</strong>
                <div style="margin-left: 20px; color: #d1d5db;">
                    This credential was issued by <strong>${subject.skill.sources[0].issuer}</strong>, a recognized entity in the network. The issuer's digital signature confirms they vouch for this data.
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <strong style="color: #fff;">4. Data Integrity (Tamper-Proof):</strong>
                <div style="margin-left: 20px; color: #d1d5db;">
                    The <strong>Ed25519 Digital Signature</strong> below ensures that this document has not been altered by even a single byte since it was issued on ${new Date(cred.issuanceDate).toLocaleDateString()}. Any modification would immediately invalidate this verification.
                </div>
            </div>
        </div>
    `;
}

function displayInvalidResult(reason) {
    const resultDiv = document.getElementById('verificationResult');
    const statusBadge = document.getElementById('verificationStatus');
    const candidateInfo = document.getElementById('candidateInfo');
    const skillsInfo = document.getElementById('skillsInfo');

    statusBadge.className = 'status-badge invalid';
    statusBadge.textContent = '✗ Invalid';

    candidateInfo.innerHTML = `
        <h3>Verification Failed</h3>
        <p><strong>Reason:</strong> ${reason}</p>
    `;

    skillsInfo.innerHTML = '';
    document.getElementById('verifiablePresentation').style.display = 'none';

    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}
