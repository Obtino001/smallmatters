class MaAddToCart extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.clickOnSingleVariant();
  }
  clickOnSingleVariant() {
    var selectedVariant = '';
    this.querySelectorAll('.WI_quickAddProduct_options input').forEach(input => {
      input.addEventListener('change', function(){
        if(input.checked){
          selectedVariant = input.value;
          console.log('test: ',document.querySelector('wi-quickaddproduct-info'));
        }
      });
    });
    this.querySelectorAll(".quickATC").forEach((variant) => {
      variant.addEventListener("click", async (e) => {
        e.preventDefault();
        
          const Mspan = this.querySelector('span'); 
          const spinner = this.querySelector('.loading-overlay__spinner'); 
        
          this.addEventListener('click', function(e) {
            spinner.classList.remove('hidden');
            Mspan.classList.add('hidden');
          });
        
        let formData = {
          items: [{ id: selectedVariant, quantity: 1 }],
        };
        await fetch("/cart/add", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        
        let loadingCartBlock = document.querySelector('.WI_loadingCartItemBlock');
        let emptyCart =  document.querySelector('.WI_cartDrawerin_cart_empty');
        let wicartdrawer = document.querySelector('wi-cartdrawer');
        
        if (loadingCartBlock != null) {
            loadingCartBlock.style.display = "block";
        }
        if (emptyCart != null) {
            emptyCart.style.display = "none";
        }
        refreshedCartDrawer();
        // openCart();
        // updateCart();
        // totalSaving();
        // freeShipping();
        
        spinner.classList.add('hidden');
        Mspan.classList.remove('hidden');
        
        function openCart() {
          let cartDrawer = wicartdrawer.querySelector('.WI_cartDrawerin');
          let cartDrawerUpsell = wicartdrawer.querySelector('.WI_cartDrawerin_upsell');
          wicartdrawer.style.display = "flex";
          setTimeout(() => {
              wicartdrawer.style.backgroundColor = 'rgba(0,0,0,0.5)';
              cartDrawer.style.transform = 'translateX(0)';
              setTimeout(() => {
                  cartDrawerUpsell.classList.add('WI_cartDrawerin_upsell_active');
              },200);
          },10);
        }

        function updateCart(){
          fetch('/?section_id=wi-cartdrawer')
          .then(response => {
              if (!response.ok) {
                  throw new Error('Failed to fetch section');
              }
              return response.text();  // Return the section HTML as text
          })
          .then(sectionHTML => {
              const parser = new DOMParser();
              const html = parser.parseFromString(sectionHTML, 'text/html');
              console.log(html);
              let cartItems = html.querySelector('.WI_cartDrawerin_cart').innerHTML;
              document.querySelector('.WI_cartDrawerin_cart').innerHTML = cartItems;
              let cartCount = document.querySelectorAll('[data-cart-count]');
              // let wiTotalItems = html.querySelector('.WI_totalitems').value;
              // cartCount.forEach(item => {
              //   item.innerText = wiTotalItems;
              // });
          })
        .catch(error => {
            console.error('Error fetching section:', error);
        });

        }
          function totalSaving() {
              let lineItem = document.querySelectorAll('.WI_cartDrawer_item');
              let totalSaving = 0;
              lineItem.forEach(item=>{
                  let totalSavingData = item.getAttribute('data-savingPrice');
                  totalSaving += Number(totalSavingData);
              });
              setTimeout(() => {
                  console.log(totalSaving / 100);
                  if (totalSaving > 0) {
                      document.querySelector('.savingIndiactor').style.display = 'flex';
                      document.querySelector('.savedMoney').innerHTML = "-"+(totalSaving / 100).toLocaleString('da-DK', { style: 'currency', currency: 'DKK' });
                  }
              }, 100);
           }

          async function freeShipping() {
              let shippingRes = await fetch('/cart.js');
              let shippingData = await shippingRes.json();
              console.log('cart: ',shippingData);
              let cartBubble = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                <g id="Group_45" data-name="Group 45" transform="translate(-1220 -20)">
                  <g id="Path_7" data-name="Path 7" transform="translate(1220 20)">
                    <path d="M 18 19.5 L 2 19.5 C 1.172899961471558 19.5 0.5 18.82710075378418 0.5 18 L 0.5 2 C 0.5 1.172899961471558 1.172899961471558 0.5 2 0.5 L 18 0.5 C 18.82710075378418 0.5 19.5 1.172899961471558 19.5 2 L 19.5 18 C 19.5 18.82710075378418 18.82710075378418 19.5 18 19.5 Z" stroke="none"></path>
                    <path d="M 2 1 C 1.448600769042969 1 1 1.448600769042969 1 2 L 1 18 C 1 18.55139923095703 1.448600769042969 19 2 19 L 18 19 C 18.55139923095703 19 19 18.55139923095703 19 18 L 19 2 C 19 1.448600769042969 18.55139923095703 1 18 1 L 2 1 M 2 0 L 18 0 C 19.10457038879395 0 20 0.8954296112060547 20 2 L 20 18 C 20 19.10457038879395 19.10457038879395 20 18 20 L 2 20 C 0.8954296112060547 20 0 19.10457038879395 0 18 L 0 2 C 0 0.8954296112060547 0.8954296112060547 0 2 0 Z" stroke="none" fill="#000"></path>
                  </g>
                  <g id="Ellipse_170" data-name="Ellipse 170" transform="translate(1225 20)" fill="none" stroke="#fff" stroke-width="1">
                    <circle cx="5" cy="5" r="5" stroke="none"></circle>
                    <circle cx="5" cy="5" r="4.5" fill="none"></circle>
                  </g>
                  <rect id="Rectangle_50" data-name="Rectangle 50" width="13" height="5" transform="translate(1224 20)"></rect>
                </g>
              </svg>
              <span class="visually-hidden">Cart</span><div class="cart-count-bubble"><span aria-hidden="true">${shippingData.item_count}</span><span class="visually-hidden">1 item</span>
            </div>`;
              let cartCount = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                <g id="Group_45" data-name="Group 45" transform="translate(-1220 -20)">
                  <g id="Rectangle_49" data-name="Rectangle 49" transform="translate(1220 20)" fill="none" stroke="#000" stroke-width="1">
                    <rect width="20" height="20" rx="2" stroke="none"></rect>
                    <rect x="0.5" y="0.5" width="19" height="19" rx="1.5" fill="none"></rect>
                  </g>
                  <g id="Ellipse_170" data-name="Ellipse 170" transform="translate(1225 20)" fill="none" stroke="#000" stroke-width="1">
                    <circle cx="5" cy="5" r="5" stroke="none"></circle>
                    <circle cx="5" cy="5" r="4.5" fill="none"></circle>
                  </g>
                  <rect id="Rectangle_50" data-name="Rectangle 50" width="13" height="4" transform="translate(1224 21)" fill="#fff"></rect>
                </g>
              </svg>
              <span class="visually-hidden">Cart</span>`;
            setTimeout(() => {
              let freeShippingValue = Number(wicartdrawer.querySelector('.freeShippingValue').value);
              let freeShippingPara = wicartdrawer.querySelector('#freeShippingTxt');
              
              let freeShippingProgressBar = wicartdrawer.querySelector('.WI_freeShippingBar_progress');
              let cartPrice = Math.round(shippingData.total_price/100);
              console.log(shippingData.total_price );
              console.log(cartPrice < freeShippingValue, freeShippingPara, shippingData);
              if (cartPrice < freeShippingValue) {
                  let shippingPriceDiffer = freeShippingValue - cartPrice;
                  freeShippingPara.innerHTML = "køb for <strong style='color:rgba(0,0,0,1);'>"+shippingPriceDiffer+" kr.</strong> mere, og få fri fragt";
                  let shippingPercent = parseInt(cartPrice/freeShippingValue*100);
      	        freeShippingProgressBar.style.width = shippingPercent+"%";
              }
              else{
                  freeShippingPara.innerHTML = "Tillykke! Du har opnået gratis fragt."
        	      freeShippingProgressBar.style.width = '100%';
              }
              if(shippingData.total_price > 0){
                document.querySelector('#cart-icon-bubble').innerHTML = cartBubble;
              }else{
                document.querySelector('#cart-icon-bubble').innerHTML = cartCount;
              }
             }, 100);
          }

          async function cartIcon(){
            
            
          }
      });
    });
  }
}
customElements.define("ma-addtocart", MaAddToCart);