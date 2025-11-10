// Features Modal Handler
(function() {
  'use strict';

  const featuresBtn = document.getElementById('features-btn');
  const featuresModal = document.getElementById('features-modal');
  const featuresClose = document.getElementById('features-close');
  const featuresBodyContainer = document.getElementById('features-modal-body-container');

  if (!featuresBtn || !featuresModal || !featuresClose || !featuresBodyContainer) return;

  let contentLoaded = false;

  // Load features content
  function loadFeaturesContent() {
    if (contentLoaded) return;

    fetch('/blog/site-features/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load features content');
        }
        return response.text();
      })
      .then(html => {
        // Parse the HTML and extract the features-modal-body content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyContent = doc.querySelector('.features-modal-body');

        if (bodyContent) {
          featuresBodyContainer.innerHTML = bodyContent.innerHTML;
          contentLoaded = true;
        } else {
          throw new Error('Features content not found');
        }
      })
      .catch(error => {
        console.error('Error loading features:', error);
        featuresBodyContainer.innerHTML = '<div class="features-modal-body"><p>Error loading features content.</p></div>';
      });
  }

  // Open modal
  featuresBtn.addEventListener('click', function(e) {
    e.preventDefault();
    loadFeaturesContent();
    featuresModal.classList.add('show');
  });

  // Close modal on close button
  featuresClose.addEventListener('click', function() {
    featuresModal.classList.remove('show');
  });

  // Close modal when clicking outside the modal content
  featuresModal.addEventListener('click', function(e) {
    if (e.target === featuresModal) {
      featuresModal.classList.remove('show');
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && featuresModal.classList.contains('show')) {
      featuresModal.classList.remove('show');
    }
  });

  console.log('Features modal enabled');
})();
