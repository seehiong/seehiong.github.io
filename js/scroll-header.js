// static/js/scroll-header.js
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.nav');
    const scrollThreshold = 50; 

    if (!header) {
        return;
    }

    const handleScroll = () => {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('nav--scrolled');
        } else {
            header.classList.remove('nav--scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 
});