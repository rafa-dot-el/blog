// TOC Active Section Highlighter
// Highlights the current section and its parent in the table of contents

(function() {
  'use strict';

  const toc = document.getElementById('TableOfContents');
  if (!toc) return;

  const abstractLink = document.querySelector('.toc-abstract-link');
  const tocLinks = Array.from(toc.querySelectorAll('a'));
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

  // Handle Abstract link click
  if (abstractLink) {
    abstractLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Update TOC immediately after scroll completes
      setTimeout(updateActiveTocItem, 300);
    });
  }

  // Handle TOC link clicks - update highlight after scroll
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Recalculate section positions after layout changes
      sections = getSections();

      // Let the default anchor behavior happen
      // Then update the TOC highlighting after scroll completes
      setTimeout(() => {
        sections = getSections();
        updateActiveTocItem();
      }, 350);
    });
  });

  // Get all heading elements with their corresponding TOC links
  function getSections() {
    return Array.from(headings).map(heading => {
      const id = heading.getAttribute('id');
      if (!id) return null;

      const link = tocLinks.find(link => link.getAttribute('href') === `#${id}`);
      if (!link) return null;

      return {
        heading: heading,
        link: link,
        top: heading.offsetTop
      };
    }).filter(Boolean);
  }

  let sections = getSections();

  function updateActiveTocItem() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset;
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + windowHeight;
    const isNearBottom = (scrollTop + windowHeight) >= documentHeight - 50;

    // Remove all active classes and expanded state
    tocLinks.forEach(link => {
      link.classList.remove('active');
      const parent = link.parentElement?.parentElement?.previousElementSibling;
      if (parent && parent.tagName === 'A') {
        parent.classList.remove('active-parent');
      }
    });

    // Remove all expanded classes from list items
    const allListItems = toc.querySelectorAll('li');
    allListItems.forEach(li => li.classList.remove('expanded'));

    if (abstractLink) {
      abstractLink.classList.remove('active');
    }

    // If at the top of the page (before first heading), highlight Abstract
    if (sections.length > 0 && viewportTop < sections[0].top - 100) {
      if (abstractLink) {
        abstractLink.classList.add('active');
      }
      return;
    }

    // Find the section that should be active
    // A section is active if its heading is in the top 20% of the viewport
    // or if 80% of the viewport is showing this section's content
    let currentSection = null;
    const topThreshold = viewportTop + (windowHeight * 0.2); // Top 20% of viewport

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const nextSection = sections[i + 1];

      // Check if this heading is in the top 20% of the viewport
      if (section.top >= viewportTop && section.top <= topThreshold) {
        currentSection = section;
        break;
      }

      // Check if we've scrolled past this heading
      if (section.top <= viewportTop) {
        currentSection = section;

        // Continue checking if the next section should be active instead
        if (nextSection) {
          const nextSectionTop = nextSection.top;
          // Calculate section boundaries
          const sectionBottom = nextSectionTop;

          // Calculate how much of the viewport is showing this section
          const visibleTop = Math.max(section.top, viewportTop);
          const visibleBottom = Math.min(sectionBottom, viewportBottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          const viewportOccupancy = visibleHeight / windowHeight;

          // If less than 20% of this section is visible, don't activate it
          if (viewportOccupancy < 0.2 && nextSection.top <= viewportBottom) {
            // The next section is visible, continue to check it
            continue;
          }
        }
      }
    }

    // If we're near the bottom, always select the last section
    if (isNearBottom && sections.length > 0) {
      currentSection = sections[sections.length - 1];
    }

    // Add active class to current section
    if (currentSection) {
      currentSection.link.classList.add('active');

      // Expand all parent list items up the tree
      let parentLi = currentSection.link.parentElement;
      while (parentLi) {
        if (parentLi.tagName === 'LI') {
          parentLi.classList.add('expanded');

          // Also add active-parent to the direct parent link
          const parentUl = parentLi.parentElement;
          if (parentUl && parentUl.previousElementSibling && parentUl.previousElementSibling.tagName === 'A') {
            parentUl.previousElementSibling.classList.add('active-parent');
          }
        }
        parentLi = parentLi.parentElement;
      }
    }
  }

  // Throttle scroll event for performance
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        updateActiveTocItem();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial update
  updateActiveTocItem();

  console.log('TOC active section highlighter enabled');
})();
