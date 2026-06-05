document.addEventListener("DOMContentLoaded", function() {
    // Select all details elements within the header menu
    const allDetails = document.querySelectorAll('details[id^="Details-HeaderMenu-"]');

    allDetails.forEach((details) => {
      const summary = details.querySelector('summary');

      // Open on hover
      details.addEventListener('mouseenter', () => {
        details.setAttribute('open', 'true');
        summary.setAttribute('aria-expanded', 'true');
      });

      // Close on mouse leave
      details.addEventListener('mouseleave', () => {
        details.removeAttribute('open');
        summary.setAttribute('aria-expanded', 'false');
      });
    });
  });