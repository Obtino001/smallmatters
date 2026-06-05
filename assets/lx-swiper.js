class SwiperComponent extends HTMLElement {
  constructor() {
    super();
    this.swiperInstance = null;
    this.currentMode = null;
    this._resizeHandler = this.handleResize.bind(this); // store once
  }

  connectedCallback() {
    this.initSlider();
    window.addEventListener("resize", this._resizeHandler);
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this._resizeHandler);
    this.destroySlider();
  }

  handleResize() {
    const newMode = this.getMode();
    if (newMode !== this.currentMode) {
      this.destroySlider();
      this.initSlider();
    }
  }

  getMode() {
    // Example breakpoint: 768px
    return window.innerWidth >= 850 ? "desktop" : "tablet";
  }

  // 🔹 Desktop config
  getDesktopConfig(list) {
    
    return {
      slidesPerView: Number(this.dataset.desktopSlides) || "auto",
      spaceBetween: Number(this.dataset.desktopSpacebetween) || 20,
      centeredSlides: this.dataset.desktopCenteredslides === "true",
      loop: this.dataset.desktopLoop === "true",
      navigation:
        this.dataset.desktopArrows === "true"
          ? this.dataset.desktopCustomArrows === "true"
            ? {
                nextEl: this.closest(".page-width").querySelector(".next-custom"),
                prevEl: this.closest(".page-width").querySelector(".prev-custom"),
              }
            : {
                nextEl: list.querySelector(".swiper-button-next"),
                prevEl: list.querySelector(".swiper-button-prev"),
              }
          : {},
      pagination:
        this.dataset.desktopPagination === "true"
          ? {
              el: list.querySelector(".swiper-pagination"),
              type: "progressbar",
            }
          : {},
    };

  }

  // 🔹 Tablet/Mobile config
  getTabletConfig(list) {
    return {
      slidesPerView: Number(this.dataset.mobileSlides) || "auto",
      spaceBetween: Number(this.dataset.mobileSpacebetween) || 10,
      centeredSlides: this.dataset.mobileCenteredslides === "true",
      loop: this.dataset.mobileLoop === "true",
      navigation:
        this.dataset.mobileArrows === "true"
          ? this.dataset.mobileCustomArrows === "true"
            ? {
                nextEl: this.closest(".page-width").querySelector(".next-custom"),
                prevEl: this.closest(".page-width").querySelector(".prev-custom"),
              }
            : {
                nextEl: list.querySelector(".swiper-button-next"),
                prevEl: list.querySelector(".swiper-button-prev"),
              }
          : {},
      pagination:
        this.dataset.mobilePagination === "true"
          ? {
              el: list.querySelector(".swiper-pagination"),
              type: "progressbar",
            }
          : {},
    };

  }

  initSlider() {
    const mode = this.getMode();
    this.currentMode = mode;

    

    let list = null;
    if (
      (mode === "desktop" && this.classList.contains("swiper--desktop")) ||
      (mode !== "desktop" && this.classList.contains("swiper--tablet"))
    ) {
      list = this;
    }
    

    if (!list) {
      console.warn(`No swiper element found for mode: ${mode}`);
      return;
    }
    


    // Choose config based on mode
    const config =
      mode === "desktop"
        ? this.getDesktopConfig(list)
        : this.getTabletConfig(list);
    

    this.swiperInstance = new Swiper(list, config);
  }

  destroySlider() {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = null;
    }
  }
}

customElements.define("swiper-component", SwiperComponent);
