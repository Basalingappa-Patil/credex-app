document.addEventListener('DOMContentLoaded', () => {
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    const scrollThreshold = 100; // Minimum scroll amount before hiding

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
            // Scroll Down
            navbar.classList.add('navbar-hidden');
            navbar.classList.remove('navbar-visible');
        } else {
            // Scroll Up
            navbar.classList.remove('navbar-hidden');
            navbar.classList.add('navbar-visible');
        }

        lastScrollTop = scrollTop;
    });
});
