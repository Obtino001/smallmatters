class FAQItem extends HTMLElement {
  constructor() {
    super();
    this.handleToggle = this.handleToggle.bind(this);
  }

  connectedCallback() {
    this.question = this.querySelector(".faqrs-question");
    this.answer = this.querySelector(".faqrs-answer");
    if (this.question && this.answer) {
      this.question.addEventListener("click", this.handleToggle);
    }
  }

  disconnectedCallback() {
    if (this.question) {
      this.question.removeEventListener("click", this.handleToggle);
    }
  }

  handleToggle() {
    const isActive = this.classList.contains("faqrs-active");
    const allItems = document.querySelectorAll("faq-item");
    allItems.forEach(item => item.close());
    if (!isActive) {
      this.open();
    }
  }

  open() {
    this.classList.add("faqrs-active");
    this.answer.style.maxHeight = this.answer.scrollHeight + "px";
    this.question.setAttribute("aria-expanded", "true");
  }

  close() {
    this.classList.remove("faqrs-active");
    if(this.answer) {
        this.answer.style.maxHeight = null;
    }
    if(this.question) {
        this.question.setAttribute("aria-expanded", "false");
    }
  }
}
customElements.define("faq-item", FAQItem);




function refreshedCartDrawer(){
  fetch('/?sections=cart-drawer,cart-icon-bubble')
  .then(res => res.json())
  .then(data => {
    const parsedHTML = new DOMParser().parseFromString(data['cart-drawer'], 'text/html');
    const drawerInner = parsedHTML.querySelector('.drawer__inner');
    const isEmpty = drawerInner?.classList.contains('is-empty');
    console.log('isEmpty: ',isEmpty);
    const parsedState = {
      sections: {
        'cart-drawer': data['cart-drawer'],
        'cart-icon-bubble': data['cart-icon-bubble']
      },
      id: null
    };
    const cartDrawer = document.querySelector('cart-drawer');
    if(!isEmpty){
      cartDrawer.classList.remove('is-empty');
    }
  });
}

document.addEventListener("DOMContentLoaded", function() {
  const footerHeadings = document.querySelectorAll('.footer-block--menu .footer-block__heading');

  footerHeadings.forEach((heading) => {
    heading.addEventListener('click', function() {
      const parentBlock = this.closest('.footer-block--menu');
      parentBlock.classList.toggle('active');
    });
  });
});


class LocalizationForm extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector('form');
    this.countryInput = this.querySelector('input[name="country_code"]');
    this.languageInput = this.querySelector('input[name="language_code"]');
  }

  connectedCallback() {
    this.handleSelection();
    this.closeDropdown();
  }

  handleSelection() {
    const links = this.querySelectorAll('.ma-option');

    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault(); 
        const countryCode = link.getAttribute('data-country-code');
        const languageCode = link.getAttribute('data-language-code');

        if (this.form && countryCode && languageCode) {
          this.countryInput.value = countryCode;
          this.languageInput.value = languageCode;
          this.form.submit();
        }
      });
    });
  }

  closeDropdown() {
    const opener = this.querySelector('.MA-lang-opener');
    if (!opener) return;
    
    document.addEventListener('click', e => {
      if (!this.contains(e.target)) {
        opener.checked = false;
      }
    });
  }
}

if (!customElements.get('localization-form')) {
  customElements.define("localization-form", LocalizationForm);
}

// class ProductVariant extends HTMLElement {
//   constructor() {
//     super();
//     this.handleClick = this.handleClick.bind(this);
//   }

//   connectedCallback() {
//     this.link = this.querySelector('a');
//     this.targetSelector = this.getAttribute('target-selector') || 'product-info';

//     if (this.link) {
//       this.link.addEventListener('click', this.handleClick);
//     }
//   }

//   disconnectedCallback() {
//     if (this.link) {
//       this.link.removeEventListener('click', this.handleClick);
//     }
//   }

//   handleClick(e) {
//     e.preventDefault();
//     const url = this.link.getAttribute('href');
//     const mainContainer = document.querySelector(this.targetSelector);

//     if (mainContainer) mainContainer.style.opacity = '0.5';

//     fetch(url)
//       .then(response => {
//         if (!response.ok) throw new Error('Network error');
//         return response.text();
//       })
//       .then(html => {
//         const parser = new DOMParser();
//         const doc = parser.parseFromString(html, 'text/html');
//         const newContent = doc.querySelector(this.targetSelector);

//         if (newContent && mainContainer) {
//           // 1. Replace the Content (Destroys the old variants)
//           mainContainer.outerHTML = newContent.outerHTML;
          
//           // 2. Update Browser URL
//           window.history.pushState({ path: url }, '', url);
          
//           // 3. RE-SELECT the container (because mainContainer reference is now stale/dead)
//           const refreshedContainer = document.querySelector(this.targetSelector);
//           if (refreshedContainer) refreshedContainer.style.opacity = '1';

//           // 4. FIND THE NEW ACTIVE ELEMENT
//           // We cannot use 'this' because it was removed from the DOM.
//           // We search the document for the link that matches the URL we just loaded.
//           this.setNewActiveVariant(url);

//         } else {
//           console.error('Could not find target container in response');
//           window.location.href = url; 
//         }
//       })
//       .catch(err => {
//         console.error(err);
//         window.location.href = url; 
//       });
//   }

//   setNewActiveVariant(url) {
//     const allVariants = document.querySelectorAll('product-variant');
//     allVariants.forEach(el => el.classList.remove('is-active'));
//     const newActiveLink = document.querySelector(`product-variant a[href="${url}"]`);

//     if (newActiveLink) {
//       // Find the parent <product-variant> of that link
//       const newVariantTag = newActiveLink.closest('product-variant');
//       if (newVariantTag) {
//         newVariantTag.classList.add('is-active');
//       }
//     }
//   }
// }

// if (!customElements.get('product-variant')) {
//   customElements.define('product-variant', ProductVariant);
// }


class CardProduct extends HTMLElement {
  constructor() {
    super();
    this.handleSwatchClick = this.handleSwatchClick.bind(this);
  }

  connectedCallback() {
    const swatches = this.querySelectorAll('.swatch-item');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', this.handleSwatchClick);
    });
  }

  handleSwatchClick(event) {
    const clickedSwatch = event.currentTarget;
    const handle = clickedSwatch.getAttribute('data-handle');
    if (!handle) return;
    this.querySelectorAll('.swatch-item').forEach(swatch => {
      swatch.classList.remove('swatch-item--active');
    });
    clickedSwatch.classList.add('swatch-item--active');
    this.updateTargets(handle);
  }

  updateTargets(activeHandle) {
    const targets = this.querySelectorAll('[data-handle]:not(.swatch-item)');

    targets.forEach(target => {
      if (target.getAttribute('data-handle') === activeHandle) {
        target.style.display = 'block'; 
      } else {
        target.style.display = 'none';
      }
    });
  }
}
customElements.define('card-product', CardProduct);


document.addEventListener('DOMContentLoaded', function() {
  const customTrigger = document.getElementById('custom-vipps-trigger');
  const functionalButton = document.getElementById('vipps-button');

  if (customTrigger && functionalButton) {
    customTrigger.addEventListener('click', function(e) {
      e.preventDefault();
      // This triggers the click event on the actual Vipps custom element
      functionalButton.click();
    });
  }
});