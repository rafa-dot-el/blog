// Show navbar when footer is visible
// This ensures the navbar appears when user scrolls to the bottom

(function() {
  'use strict';

  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');

  if (!header || !footer) {
    return;
  }

  // Track if footer is currently visible
  let footerIsVisible = false;

  // Check if footer is in viewport
  function isFooterVisible() {
    const footerRect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    // Footer is visible if any part of it is in the viewport
    return footerRect.top < windowHeight && footerRect.bottom > 0;
  }

  // Handle scroll event
  function handleScroll() {
    footerIsVisible = isFooterVisible();

    if (footerIsVisible) {
      header.classList.add('footer-visible');
      // Force show by removing hide animation and adding show animation
      header.classList.remove('slideOutDown');
      header.classList.add('slideInUp');
    } else {
      header.classList.remove('footer-visible');
    }
  }

  // Override the class changes if footer is visible
  const observer = new MutationObserver(function(mutations) {
    if (footerIsVisible) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // If footer is visible, prevent hiding the header
          if (header.classList.contains('slideOutDown')) {
            header.classList.remove('slideOutDown');
            header.classList.add('slideInUp');
          }
        }
      });
    }
  });

  // Start observing the header for class changes
  observer.observe(header, {
    attributes: true,
    attributeFilter: ['class']
  });

  // Add scroll listener with throttling for performance
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Check on page load
  handleScroll();

  console.log('Navbar footer visibility handler enabled');
})();
