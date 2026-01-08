const API_URL = 'http://localhost:5001/api';

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

// Comprehensive Fallback list with focus on Karnataka Universities
const fallbackUniversities = [
    // Karnataka Universities
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

    // Other Top Indian Institutes
    "Indian Institute of Technology Bombay", "Indian Institute of Technology Delhi",
    "Indian Institute of Technology Madras", "Indian Institute of Technology Kanpur",
    "Indian Institute of Technology Kharagpur", "Indian Institute of Technology Roorkee",
    "Indian Institute of Technology Guwahati", "Indian Institute of Technology Hyderabad",
    "Delhi University", "Jawaharlal Nehru University", "Banaras Hindu University",
    "Anna University", "Vellore Institute of Technology", "BITS Pilani",

    // Global Top Universities
    "Stanford University", "Massachusetts Institute of Technology (MIT)", "Harvard University",
    "University of Oxford", "University of Cambridge", "California Institute of Technology"
];

const skillsList = [
    // Programming Languages
    "Java", "JavaScript", "Python", "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin", "Go", "Rust", "TypeScript", "Scala", "Perl", "R", "Matlab", "Dart", "Objective-C", "Shell Scripting", "PowerShell",
    // Web Development
    "HTML", "CSS", "React", "Angular", "Vue.js", "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel", "Ruby on Rails", "jQuery", "Bootstrap", "Tailwind CSS", "SASS", "LESS", "GraphQL", "REST API", "WebAssembly",
    // Database
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "Oracle", "SQL Server", "SQLite", "MariaDB", "DynamoDB", "Firebase", "Elasticsearch",
    // Cloud & DevOps
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "Git", "GitHub", "GitLab", "CI/CD", "Terraform", "Ansible", "Puppet", "Chef", "Nagios", "Prometheus", "Grafana", "Heroku", "DigitalOcean",
    // Data Science & AI
    "Machine Learning", "Deep Learning", "Data Science", "Artificial Intelligence", "Natural Language Processing", "Computer Vision", "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Tableau", "Power BI", "Big Data", "Hadoop", "Spark",
    // Cybersecurity
    "Cybersecurity", "Network Security", "Ethical Hacking", "Penetration Testing", "Cryptography", "Security Auditing", "Incident Response", "Malware Analysis", "Forensics",
    // Mobile Development
    "Android Development", "iOS Development", "Flutter", "React Native", "Xamarin", "Ionic",
    // Design
    "UI Design", "UX Design", "Graphic Design", "Adobe Photoshop", "Adobe Illustrator", "Adobe XD", "Figma", "Sketch", "InVision", "Prototyping", "Wireframing",
    // Soft Skills
    "Communication", "Teamwork", "Problem Solving", "Leadership", "Time Management", "Critical Thinking", "Adaptability", "Creativity", "Project Management", "Public Speaking", "Negotiation",
    // Business & Management
    "Agile", "Scrum", "Kanban", "JIRA", "Product Management", "Business Analysis", "Marketing", "SEO", "Content Marketing", "Social Media Marketing", "Sales", "Accounting", "Finance",
    // Engineering
    "Data Structures", "Algorithms", "System Design", "Microservices", "Distributed Systems", "Object-Oriented Programming", "Functional Programming"
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

    // Merge API results with our comprehensive fallback list
    // Use Set to remove duplicates
    const allUniversities = [...new Set([...fallbackUniversities, ...apiUniversities])];
    return allUniversities;
}

function autocomplete(inp, arr, isMulti = false) {
    let currentFocus;

    inp.addEventListener("input", function (e) {
        let a, b, i, val = this.value;

        // For multi-select (skills), we only care about the text after the last comma
        let lastTerm = val;
        let prefix = "";

        if (isMulti) {
            const terms = val.split(',');
            lastTerm = terms[terms.length - 1].trim();
            prefix = terms.slice(0, terms.length - 1).join(', ');
            if (prefix) prefix += ', ';
        }

        closeAllLists();
        if (!lastTerm) return false;
        currentFocus = -1;

        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);

        // Limit results to 50 for performance
        let count = 0;
        for (i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, lastTerm.length).toUpperCase() == lastTerm.toUpperCase()) {
                if (count > 50) break;
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + arr[i].substr(0, lastTerm.length) + "</strong>";
                b.innerHTML += arr[i].substr(lastTerm.length);
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";

                b.addEventListener("click", function (e) {
                    if (isMulti) {
                        inp.value = prefix + this.getElementsByTagName("input")[0].value + ", ";
                    } else {
                        inp.value = this.getElementsByTagName("input")[0].value;
                    }
                    closeAllLists();
                    inp.focus();
                });
                a.appendChild(b);
                count++;
            }
        }
    });

    inp.addEventListener("keydown", function (e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) { // DOWN
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // UP
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // ENTER
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
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setupLogout();

    const token = checkAuth();
    if (!token) return;

    // Initialize Autocomplete with fetched data
    const universities = await fetchUniversities();
    autocomplete(document.getElementById("universityName"), universities);
    autocomplete(document.getElementById("skills"), skillsList, true);

    // Prioritize Date Picker: Open calendar on click
    const dateInput = document.getElementById('issueDate');
    if (dateInput) {
        dateInput.addEventListener('click', function () {
            this.showPicker();
        });
    }

    const form = document.getElementById('addCredentialForm');

    // Create status div if it doesn't exist (since we replaced HTML)
    let statusDiv = document.getElementById('statusMessage');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'statusMessage';
        statusDiv.className = 'status-message';
        form.insertBefore(statusDiv, form.querySelector('.form-actions'));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusDiv.textContent = '';
        statusDiv.classList.remove('show', 'success', 'error');

        // Collect manual entry data
        const formData = new FormData();
        formData.append('universityName', document.getElementById('universityName').value);
        formData.append('credentialTitle', document.getElementById('credentialTitle').value);

        // Handle skills array
        const skillsArray = document.getElementById('skills').value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        skillsArray.forEach(skill => formData.append('skills', skill)); // Append each skill individually

        formData.append('issueDate', document.getElementById('issueDate').value);

        const fileInput = document.getElementById('certificateFile');
        if (fileInput && fileInput.files.length > 0) {
            formData.append('certificateFile', fileInput.files[0]);
            formData.append('hasFile', 'true');
        } else {
            formData.append('hasFile', 'false');
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';

        try {
            const response = await fetch(`${API_URL}/candidate/credentials/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                statusDiv.textContent = 'Credential added successfully! Redirecting...';
                statusDiv.classList.add('show', 'success');

                setTimeout(() => {
                    window.location.href = '/candidate-dashboard.html';
                }, 2000);
            } else {
                statusDiv.textContent = data.error || 'Failed to add credential';
                statusDiv.classList.add('show', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Credential';
            }
        } catch (error) {
            console.error('Add credential error:', error);
            statusDiv.textContent = 'Network error. Please try again.';
            statusDiv.classList.add('show', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Credential';
        }
    });
});
