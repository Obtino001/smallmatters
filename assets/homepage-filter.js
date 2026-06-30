/* Homepage fixed filter button – drawer only, redirects on apply */

if (!customElements.get('home-filter-widget')) {
  class HomeFilterWidget extends HTMLElement {
    connectedCallback() {
      this.openBtn = this.querySelector('[data-home-filter-open]');
      this.drawer = this.querySelector('[data-home-filter-drawer]');
      this.overlay = this.querySelector('[data-home-filter-overlay]');
      this.form = this.querySelector('[data-home-filter-form]');

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

      this.lockInStockFilters();

      document.addEventListener('keydown', this.onKeydownBound = (e) => {
        if (e.key === 'Escape') this.close();
      });
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this.onKeydownBound);
    }

    lockInStockFilters() {
      this.querySelectorAll('[data-exr-in-stock-locked]').forEach((input) => {
        input.checked = true;
        input.addEventListener('change', () => {
          input.checked = true;
        });
      });
    }

    open() {
      this.drawer?.classList.add('is-open');
      this.overlay?.classList.add('is-visible');
      document.body.classList.add('home-filter-open');
      document.body.style.overflow = 'hidden';
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
