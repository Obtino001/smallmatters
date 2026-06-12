/* ============================================================================
   CUSTOM FILTER SYSTEM - Exercer JS
   100% custom Web Component. Zero Dawn dependency.
   ============================================================================ */

/**
 * <exercer-filters> – Main Web Component
 * Handles:
 *  - Drawer open/close
 *  - Accordion expand/collapse
 *  - AJAX filter fetching
 *  - URL push/pop state
 *  - Active tags removal
 *  - Product count updates
 *  - Loading states
 *  - Sort by
 *  - Price range
 *  - Browser back/forward support
 */
class ExercerFilters extends HTMLElement {
  constructor() {
    super();
    this.drawer = null;
    this.overlay = null;
    this.form = null;
    this.debounceTimer = null;
    this.isLoading = false;
    this.onPopStateBound = this.onPopState.bind(this);
  }

  connectedCallback() {
    this.drawer = this.querySelector('[data-exr-drawer]');
    this.overlay = this.querySelector('[data-exr-overlay]');
    this.form = this.querySelector('[data-exr-form]');

    this.bindTriggers();
    this.bindClose();
    this.bindOverlay();
    this.bindForm();
    this.bindActiveTags();
    this.bindSort();
    this.bindAccordions();

    window.addEventListener('popstate', this.onPopStateBound);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.onPopStateBound);
  }

  /* ---- Drawer open / close ---- */
  bindTriggers() {
    document.querySelectorAll('[data-exr-open]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    });
  }

  bindClose() {
    this.querySelectorAll('[data-exr-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeDrawer();
      });
    });
  }

  bindOverlay() {
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeDrawer());
    }
  }

  openDrawer() {
    if (this.drawer) {
      this.drawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    if (this.overlay) {
      this.overlay.classList.add('is-visible');
    }
  }

  closeDrawer() {
    if (this.drawer) {
      this.drawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    if (this.overlay) {
      this.overlay.classList.remove('is-visible');
    }
  }

  /* ---- Accordions ---- */
  bindAccordions() {
    this.querySelectorAll('[data-exr-group]').forEach(details => {
      const trigger = details.querySelector('[data-exr-trigger]');
      if (!trigger) return;
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (details.hasAttribute('open')) {
          details.removeAttribute('open');
        } else {
          details.setAttribute('open', '');
        }
      });
    });
  }

  /* ---- Form (checkbox / price changes) ---- */
  bindForm() {
    if (!this.form) return;

    this.form.addEventListener('change', (e) => {
      // Debounce for rapid clicking
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.submitFilters();
        if (window.innerWidth < 990) {
          this.closeDrawer();
        }
      }, 350);
    });

    // Price range inputs – submit on Enter or blur
    this.form.querySelectorAll('[data-exr-price-input]').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitFilters();
          if (window.innerWidth < 990) {
            this.closeDrawer();
          }
        }
      });
      input.addEventListener('blur', () => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.submitFilters();
          if (window.innerWidth < 990) {
            this.closeDrawer();
          }
        }, 400);
      });
    });
  }

  /* ---- Active Tag removal ---- */
  bindActiveTags() {
    this.addEventListener('click', (e) => {
      const tag = e.target.closest('[data-exr-remove]');
      if (!tag) return;
      e.preventDefault();
      const url = tag.getAttribute('href') || tag.dataset.exrRemove;
      if (url) {
        this.fetchAndRender(url);
      }
    });
  }

  /* ---- Sort ---- */
  bindSort() {
    const sortSelect = this.querySelector('[data-exr-sort]');
    if (!sortSelect) return;
    sortSelect.addEventListener('change', () => {
      this.submitFilters();
    });
  }

  /* ---- Build URL from form ---- */
  buildURL() {
    const formData = new FormData(this.form);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (value !== '' && value !== undefined) {
        params.append(key, value);
      }
    }

    // Grab sort_by if present
    const sortSelect = this.querySelector('[data-exr-sort]');
    if (sortSelect && sortSelect.value) {
      params.set('sort_by', sortSelect.value);
    }

    const queryString = params.toString();
    return `${window.location.pathname}${queryString ? '?' + queryString : ''}`;
  }

  /* ---- Submit filters ---- */
  submitFilters() {
    const url = this.buildURL();
    this.fetchAndRender(url);
  }

  /* ---- Fetch & Render ---- */
  async fetchAndRender(url) {
    if (this.isLoading) return;
    this.isLoading = true;

    // Show loading
    this.setLoading(true);

    // Push to history
    history.pushState({}, '', url);

    try {
      const response = await fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Update product grid
      this.updateProductGrid(doc);

      // Update this filter component
      this.updateFilters(doc);

      // Update product count in toolbar and footer
      this.updateProductCount(doc);

    } catch (err) {
      console.error('[ExercerFilters] fetch error:', err);
    } finally {
      this.isLoading = false;
      this.setLoading(false);
    }
  }

  updateProductGrid(doc) {
    const newGrid = doc.getElementById('ProductGridContainer');
    const currentGrid = document.getElementById('ProductGridContainer');
    if (newGrid && currentGrid) {
      currentGrid.innerHTML = newGrid.innerHTML;
    }
  }

  updateFilters(doc) {
    const newComponent = doc.querySelector('exercer-filters');
    if (!newComponent) return;

    // Update form
    const newForm = newComponent.querySelector('[data-exr-form]');
    const currentForm = this.querySelector('[data-exr-form]');
    if (newForm && currentForm) {
      currentForm.innerHTML = newForm.innerHTML;
    }

    // Update active tags
    const newTags = newComponent.querySelector('[data-exr-active-tags]');
    const currentTags = this.querySelector('[data-exr-active-tags]');
    if (newTags && currentTags) {
      currentTags.innerHTML = newTags.innerHTML;
    }

    // Update product count button
    const newCountBtn = newComponent.querySelector('[data-exr-count]');
    const currentCountBtn = this.querySelector('[data-exr-count]');
    if (newCountBtn && currentCountBtn) {
      currentCountBtn.textContent = newCountBtn.textContent;
    }

    // Re-bind events on new DOM
    this.form = this.querySelector('[data-exr-form]');
    this.bindForm();
    this.bindAccordions();
  }

  updateProductCount(doc) {
    // Update the toolbar product count
    const newToolbarCount = doc.querySelector('[data-exr-toolbar-count]');
    const currentToolbarCount = document.querySelector('[data-exr-toolbar-count]');
    if (newToolbarCount && currentToolbarCount) {
      currentToolbarCount.textContent = newToolbarCount.textContent;
    }
  }

  setLoading(state) {
    const grid = document.getElementById('ProductGridContainer');
    if (!grid) return;
    if (state) {
      grid.classList.add('exr-loading');
      // Add spinner if not present
      if (!grid.querySelector('.exr-spinner')) {
        const spinner = document.createElement('div');
        spinner.className = 'exr-spinner';
        grid.appendChild(spinner);
      }
    } else {
      grid.classList.remove('exr-loading');
      const spinner = grid.querySelector('.exr-spinner');
      if (spinner) spinner.remove();
    }
  }

  /* ---- Browser back/forward ---- */
  onPopState() {
    this.fetchAndRender(window.location.href);
  }
}

customElements.define('exercer-filters', ExercerFilters);
