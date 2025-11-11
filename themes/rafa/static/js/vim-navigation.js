// Vim Navigation
// Provides vim-style keyboard navigation for the page
// j/k: scroll down/up
// Alt+j/k: jump to next/previous navigation bar component
// Ctrl+j/k: jump to next/previous code block
// J/K: jump to next/previous heading
// G: scroll to bottom
// gg: scroll to top
// f: show link hints

(function() {
  'use strict';

  let gPressed = false;
  let gTimer = null;
  let linkHintsActive = false;
  let hintElements = [];
  let currentHintInput = ''; // Track multi-character hint input
  const scrollAmount = 120; // pixels to scroll for j/k
  const scrollDuration = 100; // smooth scroll duration in ms

  // Generate hint labels with consistent length based on total links
  // 1-26 links: single char (a-z)
  // 27-676 links: two chars (aa-zz)
  // 677+ links: three or more chars
  function generateHintLabel(index, totalLinks) {
    const chars = 'abcdefghijklmnopqrstuvwxyz';

    if (totalLinks <= 26) {
      // Single character hints
      return chars[index];
    } else if (totalLinks <= 676) {
      // Two character hints (26 * 26 = 676)
      const first = Math.floor(index / 26);
      const second = index % 26;
      return chars[first] + chars[second];
    } else {
      // Three or more characters (original algorithm)
      let label = '';
      let num = index;
      do {
        label = chars[num % 26] + label;
        num = Math.floor(num / 26) - 1;
      } while (num >= 0);
      return label;
    }
  }

  // Show link hints
  function showLinkHints() {
    // Get all clickable links
    const links = Array.from(document.querySelectorAll('a[href]')).filter(link => {
      const rect = link.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0; // visible links only
    });

    if (links.length === 0) return;

    linkHintsActive = true;
    hintElements = [];
    currentHintInput = ''; // Reset input when showing hints

    const totalLinks = links.length;

    links.forEach((link, index) => {
      const label = generateHintLabel(index, totalLinks);
      const rect = link.getBoundingClientRect();

      // Create hint overlay
      const hint = document.createElement('span');
      hint.textContent = label;
      hint.className = 'vim-link-hint';
      hint.style.position = 'absolute';
      hint.style.left = (rect.left + window.scrollX) + 'px';
      hint.style.top = (rect.top + window.scrollY) + 'px';
      hint.style.background = '#ff0';
      hint.style.color = '#000';
      hint.style.padding = '2px 4px';
      hint.style.fontSize = '11px';
      hint.style.fontFamily = 'monospace';
      hint.style.fontWeight = 'bold';
      hint.style.border = '1px solid #000';
      hint.style.borderRadius = '2px';
      hint.style.zIndex = '9999';
      hint.style.textTransform = 'uppercase';
      hint.style.pointerEvents = 'none';

      document.body.appendChild(hint);
      hintElements.push({ hint, link, label });
    });
  }

  // Hide link hints
  function hideLinkHints() {
    hintElements.forEach(({ hint }) => {
      hint.remove();
    });
    hintElements = [];
    linkHintsActive = false;
    currentHintInput = ''; // Reset input state
  }

  // Handle hint key press - builds multi-character input
  function handleHintKey(key) {
    // Build up the hint string
    currentHintInput += key.toLowerCase();

    const matchingHints = hintElements.filter(({ label }) =>
      label.startsWith(currentHintInput)
    );

    if (matchingHints.length === 0) {
      hideLinkHints();
      return;
    }

    if (matchingHints.length === 1 && matchingHints[0].label === currentHintInput) {
      // Exact match - open link
      const { link } = matchingHints[0];
      hideLinkHints();

      // Check if link is internal (same origin) or external
      const isInternal = link.hostname === window.location.hostname ||
                         link.href.startsWith('/') ||
                         link.href.startsWith('#');

      if (isInternal) {
        // Internal link - navigate in same window
        window.location.href = link.href;
      } else {
        // External link - open in new window
        window.open(link.href, '_blank');
      }
      return;
    }

    // Filter hints
    hintElements.forEach(({ hint, label }) => {
      if (!label.startsWith(currentHintInput)) {
        hint.remove();
      }
    });
    hintElements = matchingHints;
  }

  // Get all headings (h1-h6) in the main content
  function getHeadings() {
    const content = document.querySelector('.content, main, article, body');
    return Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  }

  // Get all code blocks and result blocks
  function getCodeBlocks() {
    return Array.from(document.querySelectorAll('pre, .highlight, pre.example'));
  }

  // Get all high-level navigation bar components
  function getNavBarComponents() {
    const components = [];
    const header = document.querySelector('#site-header');
    if (!header) return components;

    // Get site branding (Home link)
    const branding = header.querySelector('.site-branding a');
    if (branding) components.push(branding);

    // Get navigation menu items
    const navItems = header.querySelectorAll('.site-nav a');
    navItems.forEach(item => components.push(item));

    // Get header buttons (image, toc, features, menu)
    const buttons = header.querySelectorAll('.hdr-btn');
    buttons.forEach(btn => components.push(btn));

    // Get social icons
    const socialIcons = header.querySelectorAll('.hdr-social a');
    socialIcons.forEach(icon => components.push(icon));

    return components;
  }

  // Find next/previous navigation bar component relative to current focus
  function findNavBarComponent(direction) {
    const components = getNavBarComponents();
    if (components.length === 0) return null;

    const activeElement = document.activeElement;
    const currentIndex = components.indexOf(activeElement);

    if (direction === 'next') {
      if (currentIndex === -1) {
        // No component focused, return first
        return components[0];
      }
      // Return next component, or loop to first
      return components[(currentIndex + 1) % components.length];
    } else {
      if (currentIndex === -1) {
        // No component focused, return last
        return components[components.length - 1];
      }
      // Return previous component, or loop to last
      return components[(currentIndex - 1 + components.length) % components.length];
    }
  }

  // Smooth scroll to element or position
  function smoothScrollTo(target) {
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Find next/previous heading relative to current scroll position
  function findHeading(direction) {
    const headings = getHeadings();
    const currentScroll = window.pageYOffset;

    if (direction === 'next') {
      return headings.find(h => h.offsetTop > currentScroll + 10);
    } else {
      return headings.reverse().find(h => h.offsetTop < currentScroll - 10);
    }
  }

  // Find next/previous code block relative to current scroll position
  function findCodeBlock(direction) {
    const blocks = getCodeBlocks();
    const currentScroll = window.pageYOffset;

    if (direction === 'next') {
      return blocks.find(b => b.offsetTop > currentScroll + 10);
    } else {
      return blocks.reverse().find(b => b.offsetTop < currentScroll - 10);
    }
  }

  // Handle keydown events
  document.addEventListener('keydown', function(e) {
    // Ignore if user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable) {
      return;
    }

    const key = e.key;

    // If link hints are active, handle hint navigation
    if (linkHintsActive) {
      if (key === 'Escape' || key === 'Esc') {
        e.preventDefault();
        hideLinkHints();
        return;
      }

      if (key.length === 1 && key.match(/[a-z]/i)) {
        e.preventDefault();
        handleHintKey(key);
        return;
      }

      // Any other key cancels hint mode
      e.preventDefault();
      hideLinkHints();
      return;
    }

    // Handle 'g' for gg combination
    if (key === 'g') {
      if (gPressed) {
        // Second 'g' - scroll to top
        e.preventDefault();
        smoothScrollTo(0);
        gPressed = false;
        clearTimeout(gTimer);
      } else {
        // First 'g' - wait for second 'g'
        gPressed = true;
        gTimer = setTimeout(() => {
          gPressed = false;
        }, 500); // Reset after 500ms
      }
      return;
    }

    // Reset 'g' state for any other key
    if (gPressed && key !== 'g') {
      gPressed = false;
      clearTimeout(gTimer);
    }

    switch(key) {
      case 'f':
        // Show link hints
        e.preventDefault();
        showLinkHints();
        break;

      case 'j':
        if (e.altKey) {
          // Alt+j - Jump to next navigation bar component
          e.preventDefault();
          const nextNav = findNavBarComponent('next');
          if (nextNav) {
            nextNav.focus();
          }
        } else if (e.ctrlKey) {
          // Ctrl+j - Jump to next code block
          e.preventDefault();
          const nextBlock = findCodeBlock('next');
          if (nextBlock) {
            smoothScrollTo(nextBlock);
          }
        } else {
          // Scroll down
          e.preventDefault();
          window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
        break;

      case 'k':
        if (e.altKey) {
          // Alt+k - Jump to previous navigation bar component
          e.preventDefault();
          const prevNav = findNavBarComponent('prev');
          if (prevNav) {
            prevNav.focus();
          }
        } else if (e.ctrlKey) {
          // Ctrl+k - Jump to previous code block
          e.preventDefault();
          const prevBlock = findCodeBlock('prev');
          if (prevBlock) {
            smoothScrollTo(prevBlock);
          }
        } else {
          // Scroll up
          e.preventDefault();
          window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        }
        break;

      case 'J':
        // Jump to next heading
        e.preventDefault();
        const nextHeading = findHeading('next');
        if (nextHeading) {
          smoothScrollTo(nextHeading);
        }
        break;

      case 'K':
        // Jump to previous heading
        e.preventDefault();
        const prevHeading = findHeading('prev');
        if (prevHeading) {
          smoothScrollTo(prevHeading);
        }
        break;

      case 'G':
        // Scroll to bottom
        e.preventDefault();
        smoothScrollTo(document.body.scrollHeight);
        break;
    }
  });

  console.log('Vim navigation enabled: j/k (scroll), Alt+j/k (navbar), Ctrl+j/k (code blocks), J/K (headings), gg (top), G (bottom), f (link hints)');
})();
