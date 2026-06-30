/* Homepage filter drawer – loads facets from /collections/all, redirects on apply */

if (!customElements.get('home-filter-widget')) {
  class HomeFilterWidget extends HTMLElement {
    constructor() {
      super();
      this.filtersLoaded = false;
      this.filtersLoading = false;
      this.onKeydownBound = null;
    }

    connectedCallback() {
      this.openBtn = this.querySelector('[data-home-filter-open]');
      this.drawer = this.querySelector('[data-home-filter-drawer]');
      this.overlay = this.querySelector('[data-home-filter-overlay]');
      this.body = this.querySelector('[data-home-filter-body]');
      this.submitBtn = this.querySelector('[data-home-filter-submit]');
      this.sectionId = this.dataset.sectionId || '';
      this.fetchUrl = this.dataset.filterFetch || '';

      this.openBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });

      this.overlay?.addEventListener('click', () => this.close());

      this.querySelectorAll('[data-home-filter-close]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.close();
        });
      });

      this.onKeydownBound = (e) => {
        if (e.key === 'Escape') this.close();
      };
      document.addEventListener('keydown', this.onKeydownBound);

      this.schedulePrefetch();
    }

    schedulePrefetch() {
      if (!this.fetchUrl || this.filtersLoaded) return;

      const prefetch = () => {
        if (this.filtersLoaded || this.filtersLoading) return;
        this.loadFilters();
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(prefetch, { timeout: 4000 });
      } else {
        setTimeout(prefetch, 2500);
      }
    }

    disconnectedCallback() {
      if (this.onKeydownBound) {
        document.removeEventListener('keydown', this.onKeydownBound);
      }
    }

    lockInStockFilters() {
      this.querySelectorAll('[data-exr-in-stock-locked]').forEach((input) => {
        input.checked = true;
        input.addEventListener('change', () => {
          input.checked = true;
        });
      });
    }

    async loadFilters() {
      if (this.filtersLoaded || this.filtersLoading || !this.fetchUrl) return;
      this.filtersLoading = true;

      const loading = this.querySelector('[data-home-filter-loading]');
      if (loading) loading.classList.add('is-active');

      try {
        const response = await fetch(this.fetchUrl, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await response.json();
        const html = data['home-filter-facets'];

        if (!html || !this.body) {
          throw new Error('Filter section not found');
        }

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const mount = doc.querySelector('[data-home-filter-facets]');
        if (!mount) {
          throw new Error('Filter form not found');
        }

        this.body.innerHTML = mount.innerHTML;

        const form = this.body.querySelector('[data-home-filter-form]');
        if (form) {
          const formId = `home-filter-form-${this.sectionId}`;
          form.id = formId;
          if (this.submitBtn) {
            this.submitBtn.setAttribute('form', formId);
            this.submitBtn.disabled = false;
          }
        }

        this.lockInStockFilters();
        this.filtersLoaded = true;
      } catch (err) {
        console.error('[HomeFilterWidget] load error:', err);
        if (this.body) {
          this.body.innerHTML = '<p class="home-filter-error">Could not load filters. <a href="/collections/all">Go to all products</a></p>';
        }
      } finally {
        this.filtersLoading = false;
        const loadingEl = this.querySelector('[data-home-filter-loading]');
        if (loadingEl) loadingEl.classList.remove('is-active');
      }
    }

    open() {
      this.drawer?.classList.add('is-open');
      this.overlay?.classList.add('is-visible');
      document.body.classList.add('home-filter-open');
      document.body.style.overflow = 'hidden';
      if (!this.filtersLoaded) {
        this.loadFilters();
      }
    }

    close() {
      this.drawer?.classList.remove('is-open');
      this.overlay?.classList.remove('is-visible');
      document.body.classList.remove('home-filter-open');
      document.body.style.overflow = '';
    }
  }

  customElements.define('home-filter-widget', HomeFilterWidget);
}
