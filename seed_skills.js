const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const Skill = require('./backend/models/Skill');

const skillsData = [
    // Programming Languages -> technical
    { names: ["Java", "JavaScript", "Python", "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin", "Go", "Rust", "TypeScript", "Scala", "Perl", "R", "Matlab", "Dart", "Objective-C", "Shell Scripting", "PowerShell"], category: 'technical' },

    // Web Development -> technical
    { names: ["HTML", "CSS", "React", "Angular", "Vue.js", "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel", "Ruby on Rails", "jQuery", "Bootstrap", "Tailwind CSS", "SASS", "LESS", "GraphQL", "REST API", "WebAssembly"], category: 'technical' },

    // Database -> technical
    { names: ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "Oracle", "SQL Server", "SQLite", "MariaDB", "DynamoDB", "Firebase", "Elasticsearch"], category: 'technical' },

    // Cloud & DevOps -> technical
    { names: ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "Git", "GitHub", "GitLab", "CI/CD", "Terraform", "Ansible", "Puppet", "Chef", "Nagios", "Prometheus", "Grafana", "Heroku", "DigitalOcean"], category: 'technical' },

    // Data Science & AI -> technical
    { names: ["Machine Learning", "Deep Learning", "Data Science", "Artificial Intelligence", "Natural Language Processing", "Computer Vision", "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Tableau", "Power BI", "Big Data", "Hadoop", "Spark"], category: 'technical' },

    // Cybersecurity -> technical
    { names: ["Cybersecurity", "Network Security", "Ethical Hacking", "Penetration Testing", "Cryptography", "Security Auditing", "Incident Response", "Malware Analysis", "Forensics"], category: 'technical' },

    // Mobile Development -> technical
    { names: ["Android Development", "iOS Development", "Flutter", "React Native", "Xamarin", "Ionic"], category: 'technical' },

    // Design -> technical (hard skills)
    { names: ["UI Design", "UX Design", "Graphic Design", "Adobe Photoshop", "Adobe Illustrator", "Adobe XD", "Figma", "Sketch", "InVision", "Prototyping", "Wireframing"], category: 'technical' },

    // Soft Skills -> soft
    { names: ["Communication", "Teamwork", "Problem Solving", "Leadership", "Time Management", "Critical Thinking", "Adaptability", "Creativity", "Project Management", "Public Speaking", "Negotiation"], category: 'soft' },

    // Business & Management -> domain
    { names: ["Agile", "Scrum", "Kanban", "JIRA", "Product Management", "Business Analysis", "Marketing", "SEO", "Content Marketing", "Social Media Marketing", "Sales", "Accounting", "Finance"], category: 'domain' },

    // Engineering -> technical
    { names: ["Data Structures", "Algorithms", "System Design", "Microservices", "Distributed Systems", "Object-Oriented Programming", "Functional Programming"], category: 'technical' }
];

async function seedSkills() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in backend/.env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('✓ Connected to MongoDB');

        console.log('Seeding skills...');
        let count = 0;

        for (const group of skillsData) {
            for (const name of group.names) {
                await Skill.findOneAndUpdate(
                    { normalizedName: name.toLowerCase() },
                    {
                        name: name,
                        normalizedName: name.toLowerCase(),
                        category: group.category,
                        nsqfLevel: 3, // Default base level
                        synonyms: [name.toLowerCase()]
                    },
                    { upsert: true, new: true }
                );
                count++;
            }
        }

        console.log(`✅ Successfully seeded ${count} skills.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding skills:', error);
        process.exit(1);
    }
}

seedSkills();
