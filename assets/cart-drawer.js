class WIcartDrawer extends HTMLElement {
    constructor() {
        super();
        this.addEventListener('click', this.closeCart.bind(this));
        this.addEventListener('click', this.incQuantity.bind(this));
        this.addEventListener('click', this.decQuantity.bind(this));
        this.addEventListener('click', this.revQuantity.bind(this));
        this.addEventListener('click', this.cartBgclick.bind(this));
        this.isProcessing = false;
    }

    connectedCallback() {
        this.clickOncart();
        this.quickAddUpdate();
        this.setupCartForms();
        this.totalSaving();
        // this.freeShipping();
        this.cartTermsCondition();
        this.addToCart();
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
        if (cartDrawerUpsell) cartDrawerUpsell.classList.remove('WI_cartDrawerin_upsell_active');
        setTimeout(() => {
            this.style.backgroundColor = 'rgba(0,0,0,0)';
            cartDrawer.style.transform = 'translateX(100%)';
            setTimeout(() => {
                this.style.display = "none";
            }, 310);
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

    addToCart() {
        const allForms = document.querySelectorAll('form[action="/cart/add"]');
        allForms.forEach(form => {
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
}
customElements.define("wi-cartdrawer", WIcartDrawer);