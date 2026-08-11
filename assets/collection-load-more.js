/* ============================================================================
   <collection-load-more>

   Progressive enhancement over the theme's numbered pagination.

   The server always renders real pagination links; this component hides them
   and appends the next page in place when the button is clicked.

   Design notes:
   - The next page URL is read from the rendered pagination markup (matching
     ?page=current+1) instead of being calculated. That keeps filters, sort
     and locale prefixes intact and cannot drift out of sync.
   - Appends are deduped by product handle, so a double click or a repeated
     page can never render the same product twice.
   - The element lives inside #ProductGridContainer, so an AJAX filter render
     replaces it and connectedCallback re-runs with clean state.
   ============================================================================ */

if (!customElements.get('collection-load-more')) {
  class CollectionLoadMore extends HTMLElement {
    connectedCallback() {
      this.button = this.querySelector('[data-load-more]');
      this.label = this.querySelector('[data-load-more-label]');
      this.ui = this.querySelector('[data-load-more-ui]');
      this.paginationWrap = this.querySelector('[data-load-more-pagination]');
      this.countEl = this.querySelector('[data-load-more-count]');
      this.doneEl = this.querySelector('[data-load-more-done]');
      this.barEl = this.querySelector('[data-load-more-bar]');
      this.trackEl = this.querySelector('[data-load-more-track]');

      if (!this.button || !this.paginationWrap) return;

      this.sectionId = this.dataset.sectionId || '';
      this.total = parseInt(this.dataset.total, 10) || 0;
      this.countTemplate = this.dataset.countText || '';
      this.isLoading = false;

      // Only take over once JS is confirmed to run
      this.classList.add('collection-load-more--ready');
      if (this.ui) this.ui.hidden = false;

      this.button.addEventListener('click', (event) => {
        event.preventDefault();
        this.loadMore();
      });

      this.syncState();
    }

    get grid() {
      return document.querySelector('#ProductGridContainer #product-grid');
    }

    /* Resolve the "next page" link from rendered pagination markup. */
    nextUrlFrom(root) {
      const wrapper = root.querySelector('.pagination-wrapper');
      if (!wrapper) return null;

      const currentPage = parseInt(wrapper.dataset.page, 10) || 1;
      const links = wrapper.querySelectorAll('a[href]');

      for (const link of links) {
        const href = link.getAttribute('href');
        if (!href) continue;
        try {
          const url = new URL(href, window.location.origin);
          if (parseInt(url.searchParams.get('page'), 10) === currentPage + 1) {
            return `${url.pathname}${url.search}`;
          }
        } catch (e) {
          /* ignore malformed href */
        }
      }
      return null;
    }

    sectionUrl(url) {
      const parsed = new URL(url, window.location.origin);
      if (this.sectionId) parsed.searchParams.set('section_id', this.sectionId);
      return `${parsed.pathname}${parsed.search}`;
    }

    productKey(item) {
      const link = item.querySelector('a[href*="/products/"]');
      if (!link) return null;
      try {
        return new URL(link.getAttribute('href'), window.location.origin).pathname;
      } catch (e) {
        return null;
      }
    }

    visibleCount() {
      const items = document.querySelectorAll('#ProductGridContainer .collection-grid-item');
      return Array.from(items).filter((item) => item.style.display !== 'none').length;
    }

    syncState() {
      const hasNext = Boolean(this.nextUrlFrom(this));

      this.button.hidden = !hasNext;
      if (this.doneEl) this.doneEl.hidden = hasNext;
      if (this.trackEl) this.trackEl.hidden = !this.total;

      const shown = this.visibleCount();
      // On the last page the variant filter may have hidden cards, so the
      // server total would read as unreachable. Trust what is on screen.
      const total = hasNext ? Math.max(this.total, shown) : shown;

      if (this.countEl) {
        if (this.countTemplate && total) {
          this.countEl.textContent = this.countTemplate
            .replace('[shown]', shown)
            .replace('[total]', total);
          this.countEl.hidden = false;
        } else {
          this.countEl.hidden = true;
        }
      }

      if (this.barEl && total) {
        this.barEl.style.width = `${Math.min((shown / total) * 100, 100)}%`;
      }
    }

    setBusy(state) {
      this.classList.toggle('collection-load-more--loading', state);
      this.button.disabled = state;
      this.button.setAttribute('aria-busy', state ? 'true' : 'false');
    }

    async loadMore() {
      if (this.isLoading) return;

      const nextUrl = this.nextUrlFrom(this);
      if (!nextUrl) {
        this.syncState();
        return;
      }

      this.isLoading = true;
      this.setBusy(true);

      try {
        const response = await fetch(this.sectionUrl(nextUrl), {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        const grid = this.grid;
        const newItems = doc.querySelectorAll('#ProductGridContainer .collection-grid-item');

        if (grid && newItems.length) {
          const seen = new Set(
            Array.from(grid.querySelectorAll('.collection-grid-item'))
              .map((item) => this.productKey(item))
              .filter(Boolean)
          );

          const fragment = document.createDocumentFragment();
          newItems.forEach((item) => {
            const key = this.productKey(item);
            if (key && seen.has(key)) return;
            if (key) seen.add(key);
            // Dawn's reveal animation never re-observes injected nodes
            item.classList.add('scroll-trigger--cancel');
            fragment.appendChild(item);
          });
          grid.appendChild(fragment);
        }

        // Swap in the fetched pagination so the next click advances one page
        const freshPagination = doc.querySelector('.pagination-wrapper');
        this.paginationWrap.innerHTML = freshPagination ? freshPagination.outerHTML : '';

        // Re-apply the variant/stock filtering owned by the filter component
        const filters = document.querySelector('exercer-filters');
        if (filters && typeof filters.applyVariantStockFilter === 'function') {
          filters.applyVariantStockFilter();
        }

        this.syncState();
      } catch (error) {
        console.error('[collection-load-more]', error);
        // Fall back to the real pagination links rather than dead-ending
        this.classList.remove('collection-load-more--ready');
        if (this.ui) this.ui.hidden = true;
      } finally {
        this.isLoading = false;
        this.setBusy(false);
      }
    }
  }

  customElements.define('collection-load-more', CollectionLoadMore);
}
