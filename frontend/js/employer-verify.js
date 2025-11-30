const API_URL = 'http://localhost:5001/api';

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

                let docUrl = `/view-document.html?issuer=${encodeURIComponent(c.issuerName)}&name=${encodeURIComponent(candidateName)}&title=${encodeURIComponent(c.title)}&date=${encodeURIComponent(new Date(c.issuedDate).toLocaleDateString())}&skills=${encodeURIComponent(skillsStr)}`;

                // If there is a real file uploaded, link to it directly (or via a viewer)
                if (c.rawData && c.rawData.filePath) {
                    // filePath is like "uploads\filename". We need to convert it to URL path.
                    const filename = c.rawData.filePath.split(/[/\\]/).pop();
                    docUrl = `/uploads/${filename}`;
                }

                const fileLink = ` <a href="${docUrl}" target="_blank" style="color: var(--primary-color); margin-left: 10px; font-weight: bold; text-decoration: underline;">[View Document]</a>`;

                // Add Verify Button if it has a file
                const verifyBtn = c.rawData && c.rawData.hasFile ?
                    ` <button onclick="verifyStoredCertificate('${c._id}')" class="btn btn-sm btn-success" style="margin-left: 10px; padding: 2px 8px; font-size: 0.8rem;">Verify Certificate</button>` : '';

                html += `<li>
                    <strong>${c.title}</strong> - ${c.issuerName}
                    <br><small>Issued: ${new Date(c.issuedDate).toLocaleDateString()}</small>
                    ${fileLink}
                    ${verifyBtn}
                </li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p>No credentials uploaded.</p>`;
        }

        claimsListDiv.innerHTML = html;
    }


    const searchNetworkForm = document.getElementById('searchNetworkForm');
    if (searchNetworkForm) {
        searchNetworkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const skillName = document.getElementById('skillName').value;
            const issuerName = document.getElementById('issuerName').value;
            const resultsDiv = document.getElementById('networkResults');
            const listDiv = document.getElementById('providersList');
            const btn = searchNetworkForm.querySelector('button');

            btn.disabled = true;
            btn.textContent = 'Searching Network...';
            resultsDiv.style.display = 'none';
            listDiv.innerHTML = '';

            try {
                // 1. Initiate Search
                const searchRes = await fetch(`${API_URL}/beckn/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        intent: { skillName, issuerName }
                    })
                });
                const searchData = await searchRes.json();
                const transactionId = searchData.context.transaction_id;

                // 2. Poll for Results
                let attempts = 0;
                const maxAttempts = 10;
                const pollInterval = 2000;

                const poll = setInterval(async () => {
                    attempts++;
                    try {
                        const pollRes = await fetch(`${API_URL}/beckn/results?transactionId=${transactionId}&action=on_search`);
                        const pollData = await pollRes.json();

                        if (pollData.status === 'completed' && pollData.results) {
                            clearInterval(poll);
                            displayProviders(pollData.results.message.catalog.providers);
                            resultsDiv.style.display = 'block';
                            btn.disabled = false;
                            btn.textContent = 'Search Providers';
                        } else if (attempts >= maxAttempts) {
                            clearInterval(poll);
                            alert('Search timed out. No providers found.');
                            btn.disabled = false;
                            btn.textContent = 'Search Providers';
                        }
                    } catch (err) {
                        console.error('Polling error:', err);
                    }
                }, pollInterval);

            } catch (error) {
                console.error('Search error:', error);
                alert('Failed to initiate search');
                btn.disabled = false;
                btn.textContent = 'Search Providers';
            }
        });
    }
    const verifyByCertificateForm = document.getElementById('verifyByCertificateForm');
    if (verifyByCertificateForm) {
        verifyByCertificateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('certificateImage');
            const file = fileInput.files[0];
            const btn = verifyByCertificateForm.querySelector('button');
            const resultDiv = document.getElementById('verificationResult');

            if (!file) {
                alert('Please select a certificate image');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Verifying...';
            resultDiv.style.display = 'none';

            const formData = new FormData();
            formData.append('qrImage', file);

            try {
                const response = await fetch(`${API_URL}/verify/by-qr`, {
                    method: 'POST',
                    body: formData
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
                btn.textContent = 'Verify Certificate';
            }
        });

        // File name display
        const fileInput = document.getElementById('certificateImage');
        fileInput.addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name;
            document.getElementById('fileName').textContent = fileName || '';
        });
    }
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
