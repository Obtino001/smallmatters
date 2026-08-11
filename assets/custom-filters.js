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
if (!customElements.get('exercer-filters')) {
  const EXR_IN_STOCK_PARAM = 'filter.v.availability';
  const EXR_IN_STOCK_VALUE = '1';

  class ExercerFilters extends HTMLElement {
    constructor() {
      super();
      this.drawer = null;
      this.overlay = null;
      this.form = null;
      this.debounceTimer = null;
      this.isLoading = false;
      this.onPopStateBound = this.onPopState.bind(this);
      this._formBound = false;
      this._accordionsBound = false;
      this._fetchController = null;
      this._pendingUrl = null;
      this._skipHistory = false;
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
      this.lockInStockFilters();

      window.addEventListener('popstate', this.onPopStateBound);

      // Keep in-stock in the URL quietly — do NOT refetch the whole grid on load
      // (that was causing the visible "reload again and again" feel).
      const urlWithStock = this.ensureInStockFilter(window.location.href);
      if (urlWithStock !== window.location.href) {
        history.replaceState({}, '', urlWithStock);
      }

      const runStockFilter = () => {
        this.revealScrollTriggers(document.getElementById('ProductGridContainer'));
        this.applyVariantStockFilter();
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runStockFilter, { once: true });
      } else {
        requestAnimationFrame(runStockFilter);
      }
    }

    disconnectedCallback() {
      window.removeEventListener('popstate', this.onPopStateBound);
      if (this._fetchController) {
        this._fetchController.abort();
        this._fetchController = null;
      }
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

    /* ---- Accordions (delegated once; survives AJAX re-render) ---- */
    bindAccordions() {
      if (!this.form || this._accordionsBound) return;
      this._accordionsBound = true;
      this.form.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-exr-trigger]');
        if (!trigger || !this.form.contains(trigger)) return;
        e.preventDefault();
        const details = trigger.closest('[data-exr-group]');
        if (!details) return;
        if (details.hasAttribute('open')) {
          details.removeAttribute('open');
        } else {
          details.setAttribute('open', '');
        }
      });
    }

    ensureInStockFilter(url) {
      const parsed = new URL(url, window.location.origin);
      if (!parsed.searchParams.has(EXR_IN_STOCK_PARAM)) {
        parsed.searchParams.set(EXR_IN_STOCK_PARAM, EXR_IN_STOCK_VALUE);
      }
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    stripPageParam(url) {
      // A filter/sort/tag action must always restart at page 1
      const parsed = new URL(url, window.location.origin);
      parsed.searchParams.delete('page');
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    get sectionId() {
      return this.dataset.exrSectionId || '';
    }

    resolveFetchURL(url) {
      const parsed = new URL(url, window.location.origin);
      const params = parsed.searchParams.toString();

      if (this.sectionId) {
        return `${parsed.pathname}?section_id=${encodeURIComponent(this.sectionId)}${params ? `&${params}` : ''}`;
      }

      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    lockInStockFilters() {
      // Just enforce the checked state; the change handler in bindForm keeps it
      // locked. (No per-input listeners here — they would stack on re-render.)
      this.querySelectorAll('[data-exr-in-stock-locked]').forEach((input) => {
        input.checked = true;
      });
    }

    /* ---- Form (checkbox / price changes) — bound once, fully delegated ---- */
    bindForm() {
      if (!this.form || this._formBound) return;
      this._formBound = true;

      // Checkbox / radio changes (change bubbles, so it survives re-render)
      this.form.addEventListener('change', (e) => {
        if (e.target.matches('[data-exr-in-stock-locked]')) {
          e.target.checked = true;
          return;
        }

        // Debounce so a single click = a single fetch
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.submitFilters();
        }, 500);
      });

      // Price range: submit on Enter (keydown bubbles → delegated)
      this.form.addEventListener('keydown', (e) => {
        if (e.target.matches('[data-exr-price-input]') && e.key === 'Enter') {
          e.preventDefault();
          this.submitFilters();
        }
      });

      // Price range: submit on blur (focusout bubbles → delegated)
      this.form.addEventListener('focusout', (e) => {
        if (e.target.matches('[data-exr-price-input]')) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(() => {
            this.submitFilters();
          }, 400);
        }
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
          this.fetchAndRender(url, { pushHistory: true });
        }
      });
    }

    /* ---- Sort ---- */
    bindSort() {
      const sortSelects = this.querySelectorAll('[data-exr-sort]');
      if (!sortSelects.length) return;
      sortSelects.forEach((select) => {
        select.addEventListener('change', () => {
          // Keep toolbar + drawer sort dropdowns in sync
          sortSelects.forEach((other) => {
            if (other !== select) other.value = select.value;
          });
          this.submitFilters();
        });
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

      params.set(EXR_IN_STOCK_PARAM, EXR_IN_STOCK_VALUE);

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
      const url = this.ensureInStockFilter(this.buildURL());
      this.fetchAndRender(url, { pushHistory: true });
    }

    /* ---- Fetch & Render ---- */
    async fetchAndRender(url, options = {}) {
      const pushHistory = options.pushHistory !== false;
      url = this.stripPageParam(this.ensureInStockFilter(url));

      // Coalesce: keep only the latest URL if a fetch is already running
      if (this.isLoading) {
        this._pendingUrl = { url, pushHistory };
        if (this._fetchController) {
          this._fetchController.abort();
          this._fetchController = null;
        }
        return;
      }

      this.isLoading = true;

      const controller = new AbortController();
      this._fetchController = controller;
      const fetchUrl = this.resolveFetchURL(url);

      this.setLoading(true);

      if (pushHistory && !this._skipHistory) {
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (current !== url) {
          history.pushState({}, '', url);
        } else {
          history.replaceState({}, '', url);
        }
      } else {
        history.replaceState({}, '', url);
      }
      this._skipHistory = false;

      try {
        const response = await fetch(fetchUrl, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          signal: controller.signal
        });
        const html = await response.text();
        if (controller.signal.aborted) return;

        const doc = new DOMParser().parseFromString(html, 'text/html');

        this.updateProductGrid(doc);
        this.updateFilters(doc);
        this.updateProductCount(doc);
        this.applyVariantStockFilter();
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[ExercerFilters] fetch error:', err);
      } finally {
        if (this._fetchController === controller) {
          this._fetchController = null;
        }
        this.isLoading = false;
        this.setLoading(false);

        if (this._pendingUrl) {
          const next = this._pendingUrl;
          this._pendingUrl = null;
          this.fetchAndRender(next.url, { pushHistory: next.pushHistory });
        }
      }
    }

    updateProductGrid(doc) {
      const newGrid = doc.getElementById('ProductGridContainer');
      const currentGrid = document.getElementById('ProductGridContainer');
      if (newGrid && currentGrid) {
        currentGrid.innerHTML = newGrid.innerHTML;
        // Dawn scroll-reveal starts at opacity ~0; after AJAX it never
        // re-observes, so products stay invisible unless we cancel it.
        this.revealScrollTriggers(currentGrid);
      }
    }

    revealScrollTriggers(root) {
      const scope = root || document;
      scope.querySelectorAll('.scroll-trigger').forEach((el) => {
        el.classList.add('scroll-trigger--cancel');
      });
      if (scope.classList?.contains('scroll-trigger')) {
        scope.classList.add('scroll-trigger--cancel');
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

      // The <form> element itself persists (only its innards were swapped), so
      // the delegated listeners from connectedCallback still work — do NOT
      // re-bind here or listeners would stack and cause multiple fetches.
      this.form = this.querySelector('[data-exr-form]');
      this.lockInStockFilters();
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
        if (!grid.querySelector('.exr-spinner')) {
          const spinner = document.createElement('div');
          spinner.className = 'exr-spinner';
          grid.appendChild(spinner);
        }
      } else {
        grid.classList.remove('exr-loading');
        const spinner = grid.querySelector('.exr-spinner');
        if (spinner) spinner.remove();
        this.revealScrollTriggers(grid);
      }
    }

    /* ---- Browser back/forward ---- */
    onPopState() {
      this._skipHistory = true;
      this.fetchAndRender(window.location.href, { pushHistory: false });
    }

    /* ---- Client-side Variant Stock Filtering ---- */
    applyVariantStockFilter() {
      const params = new URLSearchParams(window.location.search);
      const optionFilters = {}; // key: option name (lowercase), value: array of selected values
      
      for (const [key, value] of params.entries()) {
        if (key.startsWith('filter.v.option.')) {
          const optionName = key.replace('filter.v.option.', '').toLowerCase();
          if (!optionFilters[optionName]) {
            optionFilters[optionName] = [];
          }
          optionFilters[optionName].push(value.toLowerCase());
        }
      }

      const productCards = document.querySelectorAll('#ProductGridContainer .grid__item');
      
      // If no option filters are active, show all cards
      if (Object.keys(optionFilters).length === 0) {
        productCards.forEach(item => {
          item.style.display = '';
        });
        return;
      }

      // Check each product card
      let visibleCount = 0;
      productCards.forEach(card => {
        try {
          const scriptTag = card.querySelector('script[type="application/json"]');
          if (!scriptTag) return;
          const productData = JSON.parse(scriptTag.textContent);
          
          // Find which option index (1, 2, 3) corresponds to which filter
          const optionMappings = {}; // key: optionKey (e.g. 'option1'), value: array of selected values
          let hasRelevantFilter = false;
          
          if (productData.options) {
            productData.options.forEach((optName, index) => {
              const lowerOptName = optName.toLowerCase();
              if (optionFilters[lowerOptName]) {
                optionMappings[`option${index + 1}`] = optionFilters[lowerOptName];
                hasRelevantFilter = true;
              }
            });
          }

          if (!hasRelevantFilter) {
            card.style.display = '';
            visibleCount++;
            return;
          }

          // Check if ANY variant matches the selected filters AND is available
          const hasAvailableMatchingVariant = productData.variants.some(variant => {
            let matchesAllFilters = true;
            
            for (const optKey in optionMappings) {
              const selectedValues = optionMappings[optKey];
              const variantValue = variant[optKey] ? variant[optKey].toLowerCase() : '';
              if (!selectedValues.includes(variantValue)) {
                matchesAllFilters = false;
                break;
              }
            }
            
            return matchesAllFilters && variant.available;
          });

          if (hasAvailableMatchingVariant) {
            card.style.display = '';
            visibleCount++;
          } else {
            card.style.display = 'none';
          }

        } catch (e) {
          console.error('Error applying variant stock filter', e);
        }
      });
    }
  }

  customElements.define('exercer-filters', ExercerFilters);
}
