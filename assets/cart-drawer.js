class WIcartDrawer extends HTMLElement {
    constructor() {
        super();
        this.addEventListener('click', this.closeCart.bind(this));
        this.addEventListener('click', this.incQuantity.bind(this));
        this.addEventListener('click', this.decQuantity.bind(this));
        this.addEventListener('click', this.revQuantity.bind(this));
        this.addEventListener('click', this.cartBgclick.bind(this));
        this.addEventListener('click', this.handleCartClicks.bind(this));
        this.addEventListener('input', this.handleCartInputs.bind(this));
        this.addEventListener('submit', this.handleCartSubmits.bind(this));
        this.isProcessing = false;
    }

    connectedCallback() {
        this.clickOncart();
        this.quickAddUpdate();
        this.setupCartForms();
        this.totalSaving();
        // this.freeShipping();
        this.cartTermsCondition();
        // Bind this function globally so other scripts can call it
        window.refreshedCartDrawer = this.updateCart.bind(this);
    }

    clickOncart() {
        let cartIcon = document.querySelector('#cart-icon-bubble');
        if (cartIcon) {
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCart();
            });
        }
        document.addEventListener('opencart', () => {
            this.openCart();
            let loadingCartBlock = document.querySelector('.WI_loadingCartItemBlock');
            let emptyCart = document.querySelector('.WI_cartDrawerin_cart_empty');

            if (loadingCartBlock) loadingCartBlock.style.display = "block";
            if (emptyCart) emptyCart.style.display = "none";
        });
    }

    openCart() {
        let cartDrawer = this.querySelector('.WI_cartDrawerin');
        let cartDrawerUpsell = this.querySelector('.WI_cartDrawerin_upsell');
        this.style.display = "flex";
        this.classList.add('active');
        setTimeout(() => {
            this.style.backgroundColor = 'rgba(0,0,0,0.5)';
            cartDrawer.style.transform = 'translateX(0)';
            setTimeout(() => {
                if (cartDrawerUpsell) cartDrawerUpsell.classList.add('WI_cartDrawerin_upsell_active');
            }, 200);
        }, 10);
    }

    closeCart(event) {
        if (event.target.matches('.WI_cartDrawerCls')) {
            this.closeCartdrawer();
        }
    }

    closeCartdrawer() {
        let cartDrawer = this.querySelector('.WI_cartDrawerin');
        let cartDrawerUpsell = this.querySelector('.WI_cartDrawerin_upsell');
        this.classList.remove('active');
        if (cartDrawerUpsell) cartDrawerUpsell.classList.remove('WI_cartDrawerin_upsell_active');
        setTimeout(() => {
            this.style.backgroundColor = 'rgba(0,0,0,0)';
            cartDrawer.style.transform = 'translateX(100%)';
            setTimeout(() => {
                this.style.display = "none";
            }, 230);
        }, 10);
    }

    cartBgclick(event) {
        if (event.target.matches('wi-cartdrawer')) {
            this.closeCartdrawer();
        }
    }

    // =========================================================
    // ✅ ADD THIS METHOD HERE TO FIX THE ERROR
    // =========================================================
    renderContents(parsedState) {
        console.log("Product added via product-form.js");
        // Open the drawer
        this.openCart();
        
        // Trigger your existing update logic
        this.updateCart();
    }
    // =========================================================

    // ----------- NEW SEAMLESS UPDATE FUNCTION -----------
    async updateCart() {
        try {
            // 1. Fetch JSON with both sections (Drawer + Bubble)
            let res = await fetch('/?sections=cart-drawer,cart-icon-bubble');
            let data = await res.json();

            // 2. Parse the HTML from the JSON response
            const parsedHTML = new DOMParser().parseFromString(data['cart-drawer'], 'text/html');

            // 3. Update the Cart Items Container
            // We look for your specific class inside the fetched HTML
            let newCartItems = parsedHTML.querySelector('.WI_cartDrawerin_cart');
            let currentCartItems = this.querySelector('.WI_cartDrawerin_cart');

            if (newCartItems && currentCartItems) {
                currentCartItems.innerHTML = newCartItems.innerHTML;
            }

            // 4. Update the Upsell Container (if it exists in the response)
            let newUpsell = parsedHTML.querySelector('.WI_cartDrawerin_upsell');
            let currentUpsell = this.querySelector('.WI_cartDrawerin_upsell');
            if (newUpsell && currentUpsell) {
                currentUpsell.innerHTML = newUpsell.innerHTML;
            }

            // 5. Update the Cart Icon Bubble (using the other section data)
            const cartBubble = document.querySelector('#cart-icon-bubble');
            if (cartBubble) {
                cartBubble.innerHTML = data['cart-icon-bubble'];
            }

            // 6. Re-run calculations
            this.totalSaving();
            
            this.cartTermsCondition();

        } catch (err) {
            console.error("WIcartDrawer Update Error:", err);
        }
        // this.freeShipping();
    }
    // ----------------------------------------------------

    quickAddUpdate() {
        document.addEventListener('updateCart', () => {
            this.updateCart();
        })
    }

    async incQuantity(event) {
        if (event.target.matches('.WI_cartDrawer_plus')) {
            let rOOt = event.target;
            let keyID = rOOt.closest('[data-itemKey]').getAttribute('data-itemKey');
            let quantity = Number(rOOt.parentElement.parentElement.querySelector('input').value);
            let newQuantity = quantity + 1;
            this.querySelector('.WI_cartLoadingin').classList.add('WI_cartLoadingActive');
            await fetch('/cart/update.js', {
                method: 'post',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    updates: {
                        [keyID]: newQuantity
                    }
                })
            });
            this.updateCart();
        }
    }

    async decQuantity(event) {
        if (event.target.matches('.WI_cartDrawer_minus')) {
            let rOOt = event.target;
            let keyID = rOOt.closest('[data-itemKey]').getAttribute('data-itemKey');
            let quantity = Number(rOOt.parentElement.parentElement.querySelector('input').value);
            let newQuantity = quantity - 1;
            this.querySelector('.WI_cartLoadingin').classList.add('WI_cartLoadingActive');

            await fetch('/cart/update.js', {
                method: 'post',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    updates: {
                        [keyID]: newQuantity
                    }
                })
            });
            this.updateCart();
        }
    }

    async revQuantity(event) {
        if (event.target.matches('.cartDrawerRemove')) {
            let rOOt = event.target;
            let keyID = rOOt.closest('[data-itemKey]').getAttribute('data-itemKey');
            let quantity = 0;
            this.querySelector('.WI_cartLoadingin').classList.add('WI_cartLoadingActive');
            await fetch('/cart/update.js', {
                method: 'post',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    updates: {
                        [keyID]: quantity
                    }
                })
            });
            this.updateCart();
        }
    }


    async totalSaving() {
        let lineItem = document.querySelectorAll('.WI_cartDrawer_item');
        let totalSaving = 0;
        lineItem.forEach(item => {
            let totalSavingData = item.getAttribute('data-savingPrice');
            totalSaving += Number(totalSavingData);
        });
        setTimeout(() => {
            let indicator = document.querySelector('.savingIndiactor');
            let savedMoney = document.querySelector('.savedMoney');
            if (totalSaving > 0) {
                if (indicator) indicator.style.display = 'flex';
                
                // CHANGED LOCALE TO nb-NO AND CURRENCY TO NOK
                if (savedMoney) savedMoney.innerHTML = "-" + (totalSaving / 100).toLocaleString('nb-NO', {
                    style: 'currency',
                    currency: 'NOK',
                    currencyDisplay: 'symbol' // 'symbol' displays "kr", 'code' displays "NOK"
                });
            }
        }, 100);
    }

    setupCartForms() {
        this.attachFormListeners();
        const observer = new MutationObserver(() => {
            this.attachFormListeners();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    attachFormListeners() {
        const allForms = document.querySelectorAll('form[action="/cart/add"]');
        allForms.forEach(form => {
            if (form.closest('product-form')) return; // Ignore forms handled by product-form.js
            if (form.hasAttribute('data-wi-cart-attached')) return;
            form.setAttribute('data-wi-cart-attached', 'true');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (this.isProcessing) return;
                this.isProcessing = true;

                try {
                    const formData = new FormData(form);
                    let loadingCartBlock = document.querySelector('.WI_loadingCartItemBlock');
                    let emptyCart = document.querySelector('.WI_cartDrawerin_cart_empty');

                    if (loadingCartBlock) loadingCartBlock.style.display = "block";
                    if (emptyCart) emptyCart.style.display = "none";

                    // Open the cart immediately
                    this.openCart();

                    const response = await fetch('/cart/add.js', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        // REMOVED MODAL/BACKDROP CODE HERE AS REQUESTED

                        // Trigger the seamless update
                        await this.updateCart();
                        this.isProcessing = false;
                    } else {
                        console.error('Failed to add to cart');
                        this.isProcessing = false;
                    }
                } catch (error) {
                    console.error('Error adding to cart:', error);
                    this.isProcessing = false;
                }
            }, true);
        });
    }

    cartTermsCondition() {
        let cartForm = this.querySelector('form');
        let checkbox = this.querySelector('#terms');
        let errorText = this.querySelector('.MA-text-red');

        if (!cartForm || !checkbox) return;

        cartForm.addEventListener('submit', (e) => {
            if (!checkbox.checked) {
                e.preventDefault();
                errorText.classList.add('active');
                setTimeout(function() {
                    errorText.classList.remove('active');
                }, 3000);
            }
        });
    }

    handleCartClicks(event) {
        // 1. Complete the Look Option Picker
        if (event.target.classList.contains('WI_complete_look_option_val')) {
            const btn = event.target;
            const valuesGroup = btn.closest('.WI_complete_look_option_values');
            if (valuesGroup) {
                valuesGroup.querySelectorAll('.WI_complete_look_option_val').forEach(el => el.classList.remove('selected'));
                btn.classList.add('selected');
                
                const container = btn.closest('.WI_complete_look_product');
                if (container) {
                    const selectedOptions = [];
                    container.querySelectorAll('.WI_complete_look_option_values').forEach(group => {
                        const selected = group.querySelector('.WI_complete_look_option_val.selected');
                        if (selected) {
                            selectedOptions.push(selected.getAttribute('data-value'));
                        }
                    });
                    
                    const select = container.querySelector('.WI_complete_look_variant_select');
                    const hiddenInput = container.querySelector('.WI_complete_look_variant_id');
                    if (select && hiddenInput) {
                        const options = select.options;
                        const matchString = selectedOptions.join(',');
                        for (let i = 0; i < options.length; i++) {
                            if (options[i].getAttribute('data-options') === matchString) {
                                select.value = options[i].value;
                                hiddenInput.value = options[i].value;
                                break;
                            }
                        }
                    }
                }
            }
        }

        // 2. Carousel Arrow Left
        if (event.target.closest('.WI_also_like_prev')) {
            const alsoLikeSection = event.target.closest('.WI_also_like');
            if (alsoLikeSection) {
                const list = alsoLikeSection.querySelector('.WI_also_like_list');
                if (list) list.scrollBy({ left: -140, behavior: 'smooth' });
            }
        }

        // 3. Carousel Arrow Right
        if (event.target.closest('.WI_also_like_next')) {
            const alsoLikeSection = event.target.closest('.WI_also_like');
            if (alsoLikeSection) {
                const list = alsoLikeSection.querySelector('.WI_also_like_list');
                if (list) list.scrollBy({ left: 140, behavior: 'smooth' });
            }
        }

        // 4. Discount Code Apply Button Click
        if (event.target.classList.contains('WI_discount_btn')) {
            const btn = event.target;
            const wrap = btn.closest('.WI_discount_wrap');
            if (wrap) {
                const input = wrap.querySelector('.WI_discount_input');
                if (input && input.value) {
                    const form = wrap.closest('form');
                    if (form) {
                        let discountHidden = form.querySelector('input[name="discount"]');
                        if (!discountHidden) {
                            discountHidden = document.createElement('input');
                            discountHidden.type = 'hidden';
                            discountHidden.name = 'discount';
                            form.appendChild(discountHidden);
                        }
                        discountHidden.value = input.value;
                        btn.textContent = 'APPLIED';
                        btn.style.backgroundColor = '#E2ECF5';
                        btn.style.borderColor = '#000';
                        setTimeout(() => {
                            btn.textContent = 'APPLY';
                            btn.style.backgroundColor = '';
                            btn.style.borderColor = '';
                        }, 3000);
                    }
                }
            }
        }

        // 5. Complete the Look Add Button Click
        if (event.target.closest('.WI_complete_look_add_btn')) {
            const btn = event.target.closest('.WI_complete_look_add_btn');
            const form = btn.closest('.WI_complete_look_form');
            if (form) {
                this.addCompleteLookAjax(form, btn);
            }
        }
    }

    handleCartInputs(event) {
        // Sync discount input text if typed
        if (event.target.classList.contains('WI_discount_input')) {
            const input = event.target;
            const form = input.closest('form');
            if (form) {
                let discountHidden = form.querySelector('input[name="discount"]');
                if (!discountHidden) {
                    discountHidden = document.createElement('input');
                    discountHidden.type = 'hidden';
                    discountHidden.name = 'discount';
                    form.appendChild(discountHidden);
                }
                discountHidden.value = input.value;
            }
        }
    }

    async handleCartSubmits(event) {
        // AJAX submission interceptor for Complete the Look Form
        if (event.target.classList.contains('WI_complete_look_form')) {
            event.preventDefault();
            event.stopPropagation();
            const form = event.target;
            const btn = form.querySelector('.WI_complete_look_add_btn');
            if (btn) btn.closest('.WI_complete_look_form') ? this.addCompleteLookAjax(form, btn) : null;
        }
    }

    async addCompleteLookAjax(form, btn) {
        if (this.isProcessing) return;
        this.isProcessing = true;
        if (btn) btn.disabled = true;

        try {
            const idInput = form.querySelector('input[name="id"], select[name="id"]');
            if (!idInput) throw new Error("No variant ID input found");
            const variantId = idInput.value;

            let loadingCartBlock = this.querySelector('.WI_loadingCartItemBlock');
            let emptyCart = this.querySelector('.WI_cartDrawerin_cart_empty');

            if (loadingCartBlock) loadingCartBlock.style.display = "block";
            if (emptyCart) emptyCart.style.display = "none";

            const response = await fetch('/cart/add.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: [{
                        id: variantId,
                        quantity: 1
                    }]
                })
            });

            if (response.ok) {
                await this.updateCart();
            } else {
                console.error('Failed to add to cart:', await response.text());
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            if (btn) btn.disabled = false;
            this.isProcessing = false;
        }
    }
}
customElements.define("wi-cartdrawer", WIcartDrawer);