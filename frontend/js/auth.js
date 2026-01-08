const API_URL = window.API_URL || 'http://localhost:5001/api';

// University Data and Autocomplete Logic
const fallbackUniversities = [
    "KLE TECHNOLOGICAL UNIVERSITY, HUBLI", "REVA UNIVERSITY, BANGALORE", "Visvesvaraya Technological University (VTU), Belagavi",
    "Bangalore University", "Manipal Academy of Higher Education", "Christ University", "PES University",
    "Jain University", "MS Ramaiah University of Applied Sciences", "Dayananda Sagar University",
    "Alliance University", "Azim Premji University", "CMR University", "Garden City University",
    "Presidency University", "Rai Technology University", "Reva University", "KLE University",
    "JSS Academy of Higher Education & Research", "NITTE (Deemed to be University)", "Yenepoya (Deemed to be University)",
    "Sri Siddhartha Academy of Higher Education", "KLE Academy of Higher Education and Research",
    "Jawaharlal Nehru Centre for Advanced Scientific Research", "Indian Institute of Science (IISc)",
    "Indian Institute of Management Bangalore (IIMB)", "National Law School of India University (NLSIU)",
    "National Institute of Fashion Technology (NIFT)", "National Institute of Design (NID)",
    "International Institute of Information Technology Bangalore (IIITB)",
    "Tumkur University", "Davangere University", "Gulbarga University", "Karnatak University, Dharwad",
    "Mangalore University", "Mysore University", "Kuvempu University", "Kannada University",
    "Karnataka State Open University", "Karnataka State Women's University",
    "Rajiv Gandhi University of Health Sciences", "Visvesvaraya Technological University",
    "Indian Institute of Technology Bombay", "Indian Institute of Technology Delhi",
    "Indian Institute of Technology Madras", "Indian Institute of Technology Kanpur",
    "Indian Institute of Technology Kharagpur", "Indian Institute of Technology Roorkee",
    "Indian Institute of Technology Guwahati", "Indian Institute of Technology Hyderabad",
    "Delhi University", "Jawaharlal Nehru University", "Banaras Hindu University",
    "Anna University", "Vellore Institute of Technology", "BITS Pilani",
    "Stanford University", "Massachusetts Institute of Technology (MIT)", "Harvard University",
    "University of Oxford", "University of Cambridge", "California Institute of Technology"
];

async function fetchUniversities() {
    let apiUniversities = [];
    try {
        const response = await fetch('http://universities.hipolabs.com/search?country=India');
        if (response.ok) {
            const data = await response.json();
            apiUniversities = data.map(u => u.name);
        }
    } catch (error) {
        console.warn('Failed to fetch from API, using fallback list only:', error);
    }
    return [...new Set([...fallbackUniversities, ...apiUniversities])];
}

function autocomplete(inp, arr) {
    let currentFocus;
    inp.addEventListener("input", function (e) {
        var a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        let count = 0;
        for (i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                if (count > 10) break;
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function (e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                a.appendChild(b);
                count++;
            }
        }
    });
    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

// Initialize Autocomplete
fetchUniversities().then(universities => {
    const universityInput = document.getElementById("universityName");
    if (universityInput) {
        autocomplete(universityInput, universities);
    }
});

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    const roleSelect = document.getElementById('role');
    const employerFields = document.getElementById('employerFields');
    const candidateFields = document.getElementById('candidateFields');

    roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'employer') {
            employerFields.style.display = 'block';
            candidateFields.style.display = 'none';
        } else if (roleSelect.value === 'admin') {
            // Admin might not need specific fields or can share employer fields if needed
            employerFields.style.display = 'none';
            candidateFields.style.display = 'none';
        } else {
            employerFields.style.display = 'none';
            candidateFields.style.display = 'block';
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value,
            profileId: document.getElementById('profileId').value,
            universityName: document.getElementById('universityName').value,
            employerId: document.getElementById('employerId').value
        };

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (data.user.role === 'candidate') {
                    window.location.href = '/candidate-dashboard.html';
                } else if (data.user.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/employer-verify.html';
                }
            } else {
                errorDiv.textContent = data.error || 'Signup failed';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            errorDiv.textContent = 'Network error. Please try again.';
            errorDiv.classList.add('show');
        }
    });
}

if (window.location.pathname.includes('login.html')) {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');

        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (data.user.role === 'candidate') {
                    window.location.href = '/candidate-dashboard.html';
                } else if (data.user.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/employer-verify.html';
                }
            } else {
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            errorDiv.textContent = 'Network error. Please try again.';
            errorDiv.classList.add('show');
        }
    });
}

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
