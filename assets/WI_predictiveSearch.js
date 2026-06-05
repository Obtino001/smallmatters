class PredictiveSearch extends HTMLElement {
    constructor() {
      super();
  
      this.input = this.querySelector('input[type="search"]');
      this.predictiveSearchResults = this.querySelector('#predictive-search');
  
      this.input.addEventListener('input', this.debounce((event) => {
        this.onChange(event);
      }, 300).bind(this));
      
      this.reset();
    }
    

    onChange() {
      const searchTerm = this.input.value.trim();
  
      if (!searchTerm.length) {
        this.close();
        return;
      }
  
      this.getSearchResults(searchTerm);
    }
  
    getSearchResults(searchTerm) {
      fetch(`${routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&section_id=predictive-search`)
        .then((response) => {
          if (!response.ok) {
            var error = new Error(response.status);
            this.close();
            throw error;
          }
  
          return response.text();
        })
        .then((text) => {
          const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML;
          this.predictiveSearchResults.innerHTML = resultsMarkup;
          this.open();
        })
        .catch((error) => {
          this.close();
          throw error;
        });
    }
  reset() {
    this.querySelector('.saerchClear').addEventListener('click', ()=>{
      this.input.value = "";
      this.onChange();
    })
  }
    open() {
      this.querySelector('.WI_searchUPsell').style.display = 'none';
      this.querySelector('.WI_searchResult').style.display = 'flex';
      this.querySelector('.saerchClear').style.display = 'flex';
    }
  
    close() {
      this.querySelector('.WI_searchUPsell').style.display = 'flex';
      this.querySelector('.WI_searchResult').style.display = 'none';
      this.querySelector('.saerchClear').style.display = 'none';
    }
  
    debounce(fn, wait) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }
  }
  
  customElements.define('predictive-search', PredictiveSearch);
  