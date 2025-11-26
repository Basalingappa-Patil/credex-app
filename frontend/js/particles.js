document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Track mouse position
    let mouse = { x: -1000, y: -1000, radius: 250 };

    // Configuration for the constellation effect
    const config = {
        particleColor: 'rgba(255, 255, 255, 0.4)',
        lineColor: 'rgba(255, 255, 255, 0.05)',
        particleAmount: Math.floor((width * height) / 12000), // Density based on screen size
        defaultSpeed: 0.2,
        variantSpeed: 0.3,
        linkRadius: 160, // Distance to connect particles
    };

    // Resize canvas
    const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    resize();

    const particles = [];

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.speed = config.defaultSpeed + Math.random() * config.variantSpeed;
            this.directionAngle = Math.floor(Math.random() * 360);
            this.vector = {
                x: Math.cos(this.directionAngle) * this.speed,
                y: Math.sin(this.directionAngle) * this.speed
            };
            this.r = Math.random() * 1.5 + 0.5; // Random size between 0.5 and 2
        }

        update() {
            // Mouse Attraction
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If particle is within mouse radius, pull it towards mouse
            if (distance < mouse.radius) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (mouse.radius - distance) / mouse.radius;
                const attractionStrength = 2;

                // Apply attraction force
                this.x += forceDirectionX * force * attractionStrength;
                this.y += forceDirectionY * force * attractionStrength;
            }

            this.border();
            this.x += this.vector.x;
            this.y += this.vector.y;
        }

        border() {
            // Bounce off edges
            if (this.x >= width || this.x <= 0) this.vector.x *= -1;
            if (this.y >= height || this.y <= 0) this.vector.y *= -1;

            // Wrap around failsafe for resizing
            if (this.x > width) this.x = width;
            if (this.y > height) this.y = height;
            if (this.x < 0) this.x = 0;
            if (this.y < 0) this.y = 0;
        }

        draw() {
            if (!ctx) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = config.particleColor;
            ctx.fill();
        }
    }

    const init = () => {
        particles.length = 0;
        const amount = Math.floor((width * height) / 15000);
        for (let i = 0; i < amount; i++) {
            particles.push(new Particle());
        }
    };

    const linkParticles = () => {
        for (let i = 0; i < particles.length; i++) {
            // Link to other particles
            for (let j = i + 1; j < particles.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(particles[i].x - particles[j].x, 2) +
                    Math.pow(particles[i].y - particles[j].y, 2)
                );

                if (distance < config.linkRadius) {
                    const opacity = 1 - (distance / config.linkRadius);
                    if (!ctx) return;
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.15})`;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }

            // Link to Mouse
            const dx = mouse.x - particles[i].x;
            const dy = mouse.y - particles[i].y;
            const mouseDist = Math.sqrt(dx * dx + dy * dy);

            if (mouseDist < config.linkRadius) {
                if (!ctx) return;
                const opacity = 1 - (mouseDist / config.linkRadius);
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`; // Slightly brighter connection to mouse
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }
    };

    const animate = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        linkParticles();
        animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
        resize();
        init();
    };

    const handleMouseMove = (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
        mouse.x = -1000;
        mouse.y = -1000;
    }

    init();
    animate();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
});
