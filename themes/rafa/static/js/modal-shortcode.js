// Universal Modal Handler for Shortcode-generated Modals
(function() {
  'use strict';

  const loadedContent = new Map();

  // Load modal content
  function loadModalContent(modalId, contentPath, container) {
    // Check if already loaded
    if (loadedContent.has(modalId)) {
      container.innerHTML = loadedContent.get(modalId);
      return;
    }

    // Construct full URL
    const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/');
    const contentUrl = contentPath.startsWith('/') ? contentPath : `${baseUrl}/${contentPath}`;

    fetch(contentUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load content');
        }
        return response.text();
      })
      .then(html => {
        // Parse the HTML and extract the features-modal-body content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyContent = doc.querySelector('.features-modal-body');

        if (bodyContent) {
          const content = bodyContent.innerHTML;
          loadedContent.set(modalId, content);
          container.innerHTML = content;
        } else {
          throw new Error('Content not found');
        }
      })
      .catch(error => {
        console.error('Error loading modal content:', error);
        container.innerHTML = '<div class="features-modal-body"><p>Error loading content.</p></div>';
      });
  }

  // Open modal
  function openModal(modalId, contentPath, container) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    loadModalContent(modalId, contentPath, container);
    modal.classList.add('show');
  }

  // Close modal
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('show');
  }

  // Initialize all modal triggers
  document.addEventListener('DOMContentLoaded', function() {
    // Handle trigger buttons
    const triggerButtons = document.querySelectorAll('.modal-trigger-btn');
    triggerButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const modalId = this.getAttribute('data-modal-id');
        const contentPath = this.getAttribute('data-content-path');
        const modal = document.getElementById(modalId);
        const container = modal ? modal.querySelector('.modal-body-container') : null;

        if (modal && container) {
          openModal(modalId, contentPath, container);
        }
      });
    });

    // Handle close buttons
    const closeButtons = document.querySelectorAll('.modal-close-btn');
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const modalId = this.getAttribute('data-modal-id');
        closeModal(modalId);
      });
    });

    // Handle clicking outside modal
    const modals = document.querySelectorAll('.modal-shortcode');
    modals.forEach(modal => {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      });
    });

    // Handle Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal-shortcode.show');
        openModals.forEach(modal => closeModal(modal.id));
      }
    });
  });

  console.log('Modal shortcode handler enabled');
})();
