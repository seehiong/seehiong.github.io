/**
 * Image lazy loading and animation script
 */

// Initialize images for lazy loading
function initImage() {
  const imgDefer = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.onload = () => {
            img.removeAttribute('data-src');
            img.classList.add('loaded');
          };
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
    
    imgDefer.forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    imgDefer.forEach(img => {
      img.src = img.dataset.src;
    });
  }
  
  // Initialize scroll animations
  initScrollAnimation();
}

// Detect elements in viewport for animation
function initScrollAnimation() {
  const animatedElements = document.querySelectorAll('.nr-scroll-animation');
  
  if ('IntersectionObserver' in window) {
    const animationObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          animationObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    });
    
    animatedElements.forEach(element => {
      animationObserver.observe(element);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    animatedElements.forEach(element => {
      element.classList.add('animated');
    });
  }
}

// For initial page load
document.addEventListener('DOMContentLoaded', () => {
  // This will be called by the script in index.html
  // initImage();
  
  // Add smooth scrolling effect
  document.documentElement.style.scrollBehavior = 'smooth';
});