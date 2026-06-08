class CustomFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector('form');
    this.sidebarClose = document.querySelector('.collection__sidebar__close');
    this.applyButton = document.getElementById('btn-apply-filters');
    
    this.bindEvents();
  }

  bindEvents() {
    this.form.addEventListener('input', this.debounce((event) => {
      this.onSubmitHandler(event);
    }, 500).bind(this));

    // Handle close buttons and view items button
    if (this.sidebarClose) {
      this.sidebarClose.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeDrawer();
      });
    }
    if (this.applyButton) {
      this.applyButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeDrawer();
      });
    }
  }

  closeDrawer() {
    // Assuming there's a drawer wrapper with class 'expanded'
    const drawer = document.getElementById('filter-groups');
    if (drawer) {
      drawer.classList.remove('expanded');
    }
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const formData = new FormData(this.form);
    const searchParams = new URLSearchParams(formData).toString();
    const url = `${window.location.pathname}?${searchParams}`;

    this.renderPage(url, searchParams);
  }

  renderPage(url, searchParams) {
    this.updateURLHash(searchParams);
    
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

        // Update product grid
        const newProductGrid = parsedHTML.getElementById('ProductGridContainer');
        const currentProductGrid = document.getElementById('ProductGridContainer');
        if (newProductGrid && currentProductGrid) {
          currentProductGrid.innerHTML = newProductGrid.innerHTML;
        }

        // Update filters (keep drawer state)
        const newFilters = parsedHTML.querySelector('custom-filters-form');
        const currentFilters = document.querySelector('custom-filters-form');
        if (newFilters && currentFilters) {
          currentFilters.innerHTML = newFilters.innerHTML;
        }

        // Update active tags
        const newActiveTags = parsedHTML.querySelector('.custom-active-tags');
        const currentActiveTags = document.querySelector('.custom-active-tags');
        if (newActiveTags && currentActiveTags) {
          currentActiveTags.innerHTML = newActiveTags.innerHTML;
        }

        // Update product count
        const newCount = parsedHTML.getElementById('custom-filter-products-count');
        const currentCount = document.getElementById('custom-filter-products-count');
        if (newCount && currentCount) {
          currentCount.innerHTML = newCount.innerHTML;
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        // Re-bind events since HTML was replaced
        this.form = this.querySelector('form');
        this.bindEvents();
      });
  }

  updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
}

customElements.define('custom-filters-form', CustomFiltersForm);

// Handle active tags removal globally
document.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.custom-filter-remove');
  if (removeBtn) {
    e.preventDefault();
    const url = removeBtn.getAttribute('href');
    if (url) {
      const filtersForm = document.querySelector('custom-filters-form');
      if (filtersForm) {
        filtersForm.renderPage(url, url.split('?')[1]);
      }
    }
  }
});
