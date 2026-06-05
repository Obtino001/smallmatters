class WIquickAdd extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.clickOnSingleVariant();
    this.clickOnMobileIcon();
  }

  // Helper: Centralized function to update and open the drawer
  triggerCartUpdate() {
    // 1. Update the HTML (using the global function from WIcartDrawer)
    if (window.refreshedCartDrawer) {
      window.refreshedCartDrawer();
    }
    
    // 2. Force the drawer to open (Trigger the event WIcartDrawer listens for)
    document.dispatchEvent(new Event('opencart'));
    
    // 3. Fallback for other themes
    document.dispatchEvent(new Event('updateCart'));
  }

  // Helper: Check if upsell is in cart
  async isUpsellInCart(upsellVariantId) {
    if (!upsellVariantId) return false;
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      return cart.items.some(item => item.variant_id == upsellVariantId);
    } catch (error) {
      console.error('Error checking cart:', error);
      return false;
    }
  }

  clickOnMobileIcon() {
    if (this.querySelector(".WI_mobileQuickViewBtn")) {
      this.querySelector(".WI_mobileQuickViewBtn").addEventListener("click", async (e) => {
        var selectedVariant = "";

        // Clone content to the mobile drawer
        document.querySelector('wi-quickaddproduct-info').innerHTML = this.nextElementSibling.innerHTML;
        
        // Show Mobile Drawer
        const mobileDrawerMain = document.querySelector('.WI_mobileQuickAddDrawer_main');
        const mobileDrawerIn = document.querySelector('.WI_mobileQuickAffDrawer_in');
        
        mobileDrawerMain.style.display = "flex";
        setTimeout(function() {
          mobileDrawerIn.classList.add('shOw');
        }, 100);

        // Close Mobile Drawer Logic
        const closeMobileDrawer = () => {
             mobileDrawerIn.classList.remove('shOw');
             setTimeout(function() {
                mobileDrawerMain.style.display = "none";
             }, 100);
        };

        document.querySelector('.WI_mobileQuickAffDrawer_cls').addEventListener("click", closeMobileDrawer);

        let mainContainer = document.querySelector('wi-quickaddproduct-info');
        let multiVariants = mainContainer.querySelector('.WI_quickAdd_multi-variants');
        let WI_quickAdd_atc = mainContainer.querySelector('.quickATC');

        // --- Logic for Bundle/Multi Variants ---
        if (multiVariants) {
          const ldJsonScript = mainContainer.querySelector('.product-bundle-data');
          const productData = JSON.parse(ldJsonScript.textContent);

          const firstAvailable = productData.variants.find(v => v.available);
          if (firstAvailable) {
            selectedVariant = firstAvailable.id;
            const preCheckInput = mainContainer.querySelector(`input[value="${selectedVariant}"]`);
            if (preCheckInput) {
              preCheckInput.checked = true;
              preCheckInput.parentElement?.classList.add('active');
              WI_quickAdd_atc.removeAttribute('disabled');
            }
          }

          const bundle = mainContainer.querySelectorAll('input');
          bundle.forEach(selects => {
            selects.addEventListener('change', function() {
              const selectedOptions = Array.from(mainContainer.querySelectorAll('input:checked')).map(input => input.value);
              const matchedVariant = productData.variants.find(variant =>
                variant.options.every(opt => selectedOptions.includes(opt))
              );

              if (matchedVariant) {
                selectedVariant = matchedVariant.id;
                if (matchedVariant.available) {
                  WI_quickAdd_atc.removeAttribute('disabled');
                } else {
                  WI_quickAdd_atc.setAttribute('disabled', 'disabled');
                }
              }
            });
          });

          // Mobile Add to Cart (Multi Variant)
          WI_quickAdd_atc.addEventListener("click", async (e) => {
            e.preventDefault();
            const Mspan = mainContainer.querySelector('.Ma-span');
            const spinner = mainContainer.querySelector('.loading-overlay__spinner');
            spinner.classList.remove('hidden');
            Mspan.classList.add('hidden');

            const upsellVariantId = WI_quickAdd_atc.dataset.upsellVariantId;
            let items = [{ id: selectedVariant, quantity: 1 }];

            if (upsellVariantId) {
              const upsellExists = await this.isUpsellInCart(upsellVariantId);
              if (!upsellExists) {
                items.push({ id: upsellVariantId, quantity: 1 });
              }
            }

            let formData = { items: items };

            await fetch("/cart/add", {
              method: "post",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            });

            // Close mobile drawer so we can see the real cart drawer
            closeMobileDrawer();
            
            // Trigger Updates
            this.triggerCartUpdate();

            spinner.classList.add('hidden');
            Mspan.classList.remove('hidden');
          });

        } else {
          // --- Logic for Simple/Input Variants ---
          document.querySelectorAll('wi-quickaddproduct-info .WI_quickAddProduct_options input').forEach(input => {
            if (input.checked) {
              selectedVariant = input.value;
              if (input.dataset.available) {
                WI_quickAdd_atc.removeAttribute('disabled');
              } else {
                WI_quickAdd_atc.setAttribute('disabled', 'disabled');
              }
            }

            input.addEventListener('change', function() {
              if (input.checked) {
                selectedVariant = input.value;
                if (input.dataset.available) {
                  WI_quickAdd_atc.removeAttribute('disabled');
                } else {
                  WI_quickAdd_atc.setAttribute('disabled', 'disabled');
                }
              }
            });
          });

          // Mobile Add to Cart (Simple Variant)
          document.querySelector("wi-quickaddproduct-info .quickATC").addEventListener("click", async (e) => {
            e.preventDefault();

            const MquickATC = document.querySelector("wi-quickaddproduct-info .quickATC");
            const Mspan = MquickATC.querySelector('.Ma-span');
            const spinner = MquickATC.querySelector('.loading-overlay__spinner');
            spinner.classList.remove('hidden');
            Mspan.classList.add('hidden');

            const upsellVariantId = MquickATC.dataset.upsellVariantId;
            let items = [{ id: selectedVariant, quantity: 1 }];

            if (upsellVariantId) {
              const upsellExists = await this.isUpsellInCart(upsellVariantId);
              if (!upsellExists) {
                items.push({ id: upsellVariantId, quantity: 1 });
              }
            }

            let formData = { items: items };

            await fetch("/cart/add", {
              method: "post",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            });

            // Close mobile drawer
            closeMobileDrawer();

            // Trigger Updates
            this.triggerCartUpdate();

            spinner.classList.add('hidden');
            Mspan.classList.remove('hidden');
          });
        }
      });
    }
  }

  clickOnSingleVariant() {
    let multiVariants = this.querySelector('.WI_quickAdd_multi-variants');
    let mainContainer = this;

    // --- Desktop/Inline Multi Variants ---
    if (multiVariants) {
      const ldJsonScript = this.querySelector('.product-bundle-data');
      let WI_quickAdd_atc = this.querySelector('.WI_multiVariantAdd_atc');
      var bundle = this.querySelectorAll('input');

      bundle.forEach(selects => {
        selects.addEventListener('change', function() {
          var bundle_checked = mainContainer.querySelectorAll('input:checked');
          var selectedOptions = [];
          bundle_checked.forEach(select => {
            selectedOptions.push(select.value);
          });
          const productData = JSON.parse(ldJsonScript.textContent);

          if (WI_quickAdd_atc.dataset.optionsLength == selectedOptions.length) {
            var matchedVariant = productData.variants.find(variant => {
              var pass = true;
              for (var i = 0; i < selectedOptions.length; i++) {
                if (selectedOptions.indexOf(variant.options[i]) === -1) {
                  pass = false;
                  break;
                }
              }
              return pass;
            });
          }
          WI_quickAdd_atc.setAttribute('data-variantid', matchedVariant.id);
          if (matchedVariant.available) {
            WI_quickAdd_atc.removeAttribute('disabled', 'disabled');
          } else {
            WI_quickAdd_atc.setAttribute('disabled', 'disabled');
          }
        });
      });

      WI_quickAdd_atc.addEventListener("click", async (e) => {
        e.preventDefault();
        const Mspan = this.querySelector('.Ma-span');
        const spinner = this.querySelector('.loading-overlay__spinner');
        spinner.classList.remove('hidden');
        Mspan.classList.add('hidden');

        await this.clickOnATC(
          WI_quickAdd_atc.getAttribute("data-variantid"),
          WI_quickAdd_atc.dataset.upsellVariantId
        );

        spinner.classList.add('hidden');
        Mspan.classList.remove('hidden');
      });

      this.querySelectorAll(".WI_quickAdd_atc").forEach((variant) => {
        variant.addEventListener("click", async (e) => {
          e.preventDefault();
          const Mspan = variant.querySelector('.Ma-span');
          const spinner = variant.querySelector('.loading-overlay__spinner');

          if (spinner) spinner.classList.remove('hidden');
          if (Mspan) Mspan.classList.add('hidden');

          await mainContainer.clickOnATC(
            variant.getAttribute("data-variantid"),
            variant.dataset.upsellVariantId
          );

          if (spinner) spinner.classList.add('hidden');
          if (Mspan) Mspan.classList.remove('hidden');
        });
      });
    } 
    // --- Desktop/Inline Simple Variants ---
    else {
      if (this.querySelector('.WI_completeLook_options')) {
        let selectElement = this.querySelector('.WI_completeLook_options');
        let WI_quickAdd_atc = this.querySelector('.WI_quickAdd_atc');
        selectElement.addEventListener('change', function() {
          WI_quickAdd_atc.setAttribute("data-variantid", this.value);
        });
      }
    }

    if (!multiVariants) {
      this.querySelectorAll(".WI_quickAdd_atc").forEach((variant) => {
        variant.addEventListener("click", async (e) => {
          e.preventDefault();
          const Mspan = variant.querySelector('.Ma-span');
          const spinner = variant.querySelector('.loading-overlay__spinner');

          if (spinner) spinner.classList.remove('hidden');
          if (Mspan) Mspan.classList.add('hidden');

          await mainContainer.clickOnATC(
            variant.getAttribute("data-variantid"),
            variant.dataset.upsellVariantId
          );

          if (spinner) spinner.classList.add('hidden');
          if (Mspan) Mspan.classList.remove('hidden');
        });
      });
    }
  }

  // Handle the final fetch and Trigger Update
  async clickOnATC(variantID, upsellVariantId) {
    let items = [{ id: variantID, quantity: 1 }];

    // Only add upsell if it exists and is NOT already in cart
    if (upsellVariantId) {
      const upsellExists = await this.isUpsellInCart(upsellVariantId);
      if (!upsellExists) {
        items.push({ id: upsellVariantId, quantity: 1 });
      }
    }

    let formData = { items: items };

    await fetch("/cart/add", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    // Trigger Updates
    this.triggerCartUpdate();
  }
}

customElements.define("wi-quickadd", WIquickAdd);