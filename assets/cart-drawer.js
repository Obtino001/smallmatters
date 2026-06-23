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
        this._updateQueue = Promise.resolve();
    }

    wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    clearLoadingStates() {
        this.querySelectorAll('.WI_cartLoadingin').forEach((el) => el.classList.remove('WI_cartLoadingActive'));
        const block = this.querySelector('.WI_loadingCartItemBlock');
        if (block) block.style.display = 'none';
    }

    getItemKeys(container) {
        if (!container) return [];
        return [...container.querySelectorAll('.WI_cartDrawer_item')]
            .map((el) => el.getAttribute('data-itemKey'))
            .filter(Boolean);
    }

    findCartItem(key) {
        if (!key) return null;
        return this.querySelector(`.WI_cartDrawer_item[data-itemKey="${CSS.escape(key)}"]`);
    }

    pulseElement(el, className) {
        if (!el) return;
        el.classList.remove(className);
        void el.offsetWidth;
        el.classList.add(className);
        el.addEventListener('animationend', () => el.classList.remove(className), { once: true });
    }

    animateNewItems(container, addedKeys) {
        addedKeys.forEach((key, index) => {
            const el = container.querySelector(`.WI_cartDrawer_item[data-itemKey="${CSS.escape(key)}"]`);
            if (!el) return;
            el.classList.add('wi-cart-item--entering');
            el.style.transitionDelay = `${Math.min(index * 0.06, 0.24)}s`;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => el.classList.add('wi-cart-item--entered'));
            });
            setTimeout(() => {
                el.classList.remove('wi-cart-item--entering', 'wi-cart-item--entered');
                el.style.transitionDelay = '';
            }, 700);
        });
    }

    connectedCallback() {
        this.clickOncart();
        this.quickAddUpdate();
        this.setupCartForms();
        this.totalSaving();
        // this.freeShipping();
        this.cartTermsCondition();
        this.loadRecommendations();
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
        if (event.target.closest('.WI_cartDrawerCls')) {
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
        this.openCart();
        const addedKey = parsedState?.items?.length
            ? parsedState.items[parsedState.items.length - 1].key
            : null;
        this.updateCart({ mode: 'add', itemKey: addedKey });
    }
    // =========================================================

    updateCart(options = {}) {
        this._updateQueue = this._updateQueue.then(() => this._performCartUpdate(options));
        return this._updateQueue;
    }

    async _performCartUpdate(options = {}) {
        const { mode = 'refresh', itemKey = null } = options;

        try {
            const currentCart = this.querySelector('.WI_cartDrawerin_cart');
            const oldKeys = this.getItemKeys(currentCart);
            const hadEmptyState = !!currentCart?.querySelector('.WI_cartDrawerin_cart_empty');

            if (mode === 'remove' && itemKey) {
                const removingItem = this.findCartItem(itemKey);
                if (removingItem) {
                    removingItem.classList.add('wi-cart-item--removing');
                    await this.wait(420);
                }
            }

            this.classList.add('wi-cart-updating');

            const res = await fetch('/?sections=cart-drawer,cart-icon-bubble');
            const data = await res.json();
            const parsedHTML = new DOMParser().parseFromString(data['cart-drawer'], 'text/html');
            const newCartItems = parsedHTML.querySelector('.WI_cartDrawerin_cart');

            if (newCartItems && currentCart) {
                const newKeys = this.getItemKeys(newCartItems);
                const addedKeys = newKeys.filter((key) => !oldKeys.includes(key));
                const hasEmptyState = !!newCartItems.querySelector('.WI_cartDrawerin_cart_empty');

                currentCart.innerHTML = newCartItems.innerHTML;

                if (hadEmptyState && !hasEmptyState) {
                    const body = currentCart.querySelector('.WI_cartDrawerin_cart_body');
                    if (body) {
                        body.classList.add('wi-cart-body--fade-in');
                        body.addEventListener('animationend', () => body.classList.remove('wi-cart-body--fade-in'), { once: true });
                    }
                }

                if (addedKeys.length) {
                    this.animateNewItems(currentCart, addedKeys);
                }

                if (itemKey && (mode === 'update' || mode === 'add')) {
                    const updatedItem = this.findCartItem(itemKey);
                    if (updatedItem && !addedKeys.includes(itemKey)) {
                        this.pulseElement(updatedItem, 'wi-cart-item--updating');
                    }
                }

                const countEl = currentCart.querySelector('.WI_cartDrawer_count');
                if (countEl && newKeys.length !== oldKeys.length) {
                    this.pulseElement(countEl, 'wi-cart-count--bump');
                }

                const total = currentCart.querySelector('.WI_cartDrawer_total_price');
                if (total) {
                    this.pulseElement(total, 'wi-cart-total--pulse');
                }
            }

            const newUpsell = parsedHTML.querySelector('.WI_cartDrawerin_upsell');
            const currentUpsell = this.querySelector('.WI_cartDrawerin_upsell');
            if (newUpsell && currentUpsell) {
                currentUpsell.innerHTML = newUpsell.innerHTML;
            }

            this.loadRecommendations();

            const cartBubble = document.querySelector('#cart-icon-bubble');
            if (cartBubble && data['cart-icon-bubble']) {
                cartBubble.innerHTML = data['cart-icon-bubble'];
            }

            this.totalSaving();
            this.cartTermsCondition();
        } catch (err) {
            console.error('WIcartDrawer Update Error:', err);
        } finally {
            this.classList.remove('wi-cart-updating');
            this.clearLoadingStates();
        }
    }

    loadRecommendations() {
        const dataEl = this.querySelector('#cart-drawer-data');
        if (!dataEl) return;
        
        const firstProductId = dataEl.getAttribute('data-first-product-id');
        const cartHandlesAttr = dataEl.getAttribute('data-cart-handles');
        if (!firstProductId) return;

        const baseUrl = window.Shopify && Shopify.routes ? Shopify.routes.root : '/';
        const cartHandles = cartHandlesAttr ? cartHandlesAttr.split(',') : [];

        function formatMoney(cents) {
            const amt = (cents / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            return amt + ' kr';
        }

        /* ---- COMPLETE THE LOOK (complementary) ---- */
        fetch(`${baseUrl}recommendations/products.json?product_id=${firstProductId}&limit=4&intent=complementary`)
            .then(r => r.json())
            .then(data => {
                const prods = (data.products || []).filter(p => !cartHandles.includes(p.handle) && p.available);
                const section = this.querySelector('#WI_complete_look_section');
                if (!section) return;

                if (!prods.length) {
                    section.style.display = 'none';
                    return;
                }

                const prod = prods[0];
                section.style.display = '';

                let optionsHTML = '';
                if (prod.variants.length > 1) {
                    prod.options.forEach((opt, oi) => {
                        const optName = typeof opt === 'object' ? opt.name : opt;
                        const vals = [...new Set(prod.variants.map(v => v.options[oi]))];
                        optionsHTML += `<div class="WI_complete_look_option_group">
                            <span class="WI_complete_look_option_label">${optName}:</span>
                            <div class="WI_complete_look_option_values">
                                ${vals.map((v, vi) => `<button type="button" class="WI_complete_look_option_val${vi === 0 ? ' selected' : ''}" data-option-index="${oi}" data-value="${v}">${v}</button>`).join('')}
                            </div>
                        </div>`;
                    });
                }

                const variantsJSON = JSON.stringify(prod.variants.map(v => ({ id: v.id, options: v.options, available: v.available })));
                const imgSrc = prod.featured_image ? (prod.featured_image.replace(/\.([^.]+)$/, '_150x.$1')) : '';

                section.querySelector('.WI_complete_look_body').innerHTML = `
                    <div class="WI_complete_look_product" data-variants='${variantsJSON}'>
                        <div class="WI_complete_look_img">
                            <img src="${imgSrc}" alt="${prod.title}">
                        </div>
                        <div class="WI_complete_look_info">
                            <div class="WI_complete_look_info_top">
                                <span class="WI_complete_look_title">${prod.title}</span>
                                <span class="WI_complete_look_price">${formatMoney(prod.price)}</span>
                            </div>
                            <div class="WI_complete_look_options">${optionsHTML}</div>
                            <div class="WI_complete_look_form">
                                <input type="hidden" name="id" class="WI_complete_look_variant_id" value="${prod.variants[0].id}">
                                <button type="button" class="WI_complete_look_add_btn">+ LEGG TIL</button>
                            </div>
                        </div>
                    </div>`;
            })
            .catch(() => {});

        /* ---- YOU MAY ALSO LIKE (related) ---- */
        fetch(`${baseUrl}recommendations/products.json?product_id=${firstProductId}&limit=8&intent=related`)
            .then(r => r.json())
            .then(data => {
                const prods = (data.products || []).filter(p => !cartHandles.includes(p.handle) && p.available);
                const section = this.querySelector('#WI_also_like_section');
                if (!section) return;

                if (!prods.length) {
                    section.style.display = 'none';
                    return;
                }

                section.style.display = '';
                const list = section.querySelector('.WI_also_like_list');
                list.innerHTML = prods.slice(0, 6).map(prod => {
                    const imgSrc = prod.featured_image ? (prod.featured_image.replace(/\.([^.]+)$/, '_250x.$1')) : '';
                    return `<div class="WI_also_like_item">
                        <div class="WI_also_like_item_img">
                            <a href="${prod.url}"><img src="${imgSrc}" alt="${prod.title}"></a>
                        </div>
                        <a href="${prod.url}" class="WI_also_like_item_title">${prod.title}</a>
                        <span class="WI_also_like_item_price">${formatMoney(prod.price)}</span>
                    </div>`;
                }).join('');
            })
            .catch(() => {});
    }

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
            const itemEl = rOOt.closest('.WI_cartDrawer_item');
            itemEl?.querySelector('.WI_cartLoadingin')?.classList.add('WI_cartLoadingActive');
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
            await this.updateCart({ mode: 'update', itemKey: keyID });
        }
    }

    async decQuantity(event) {
        if (event.target.matches('.WI_cartDrawer_minus')) {
            let rOOt = event.target;
            let keyID = rOOt.closest('[data-itemKey]').getAttribute('data-itemKey');
            let quantity = Number(rOOt.parentElement.parentElement.querySelector('input').value);
            let newQuantity = quantity - 1;
            const itemEl = rOOt.closest('.WI_cartDrawer_item');
            itemEl?.querySelector('.WI_cartLoadingin')?.classList.add('WI_cartLoadingActive');

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
            const updateMode = newQuantity === 0 ? 'remove' : 'update';
            await this.updateCart({ mode: updateMode, itemKey: keyID });
        }
    }

    async revQuantity(event) {
        if (event.target.matches('.cartDrawerRemove')) {
            let rOOt = event.target;
            let keyID = rOOt.closest('[data-itemKey]').getAttribute('data-itemKey');
            let quantity = 0;
            const itemEl = rOOt.closest('.WI_cartDrawer_item');
            itemEl?.querySelector('.WI_cartLoadingin')?.classList.add('WI_cartLoadingActive');
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
            await this.updateCart({ mode: 'remove', itemKey: keyID });
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
                
                const currencyCode = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'NOK';
                const localeCode = currencyCode === 'NOK' ? 'nb-NO' : 'en-US';
                if (savedMoney) savedMoney.innerHTML = "-" + (totalSaving / 100).toLocaleString(localeCode, {
                    style: 'currency',
                    currency: currencyCode,
                    currencyDisplay: 'symbol'
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
                        await this.updateCart({ mode: 'add' });
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
                        // NEW LOGIC: Redirect to checkout with discount applied
                        window.location.href = '/checkout?discount=' + encodeURIComponent(input.value);
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
                await this.updateCart({ mode: 'add' });
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