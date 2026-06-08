
(() => {
  "use strict";

  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debounce = (fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

  const createScrollLock = (lenis) => {
    const locks = new Set();

    const apply = () => {
      if (locks.size) {
        document.body.classList.add("no-scroll");
        lenis?.stop?.();
      } else {
        document.body.classList.remove("no-scroll");
        lenis?.start?.();
      }
    };

    return {
      lock: (key) => {
        if (!key) return;
        locks.add(key);
        apply();
      },
      unlock: (key) => {
        if (!key) return;
        locks.delete(key);
        apply();
      },
      reset: () => {
        locks.clear();
        apply();
      },
      has: (key) => locks.has(key),
    };
  };

  const state = {
    multiplier: 1,
    swipers: {},
  };

  // ======================
  // Lenis
  // ======================
  const initLenis = () => {
    if (typeof Lenis === "undefined") return null;
    const lenis = new Lenis({ autoRaf: true });
    window.lenis = lenis;
    return lenis;
  };

  // ======================
  // Multiplier / s()
  // ======================
  const getWidthMultiplier = () => {
    const w = window.innerWidth;
    const minSide = Math.min(window.innerWidth, window.innerHeight);

    if (w <= 767) return minSide / 375;
    if (w <= 1024) return minSide / 768;
    return window.innerWidth / 1920;
  };

  const updateMultiplier = () => {
    state.multiplier = getWidthMultiplier();
  };

  const s = (value) => value * state.multiplier;

  // ======================
  // Header
  // ======================
  const initHeaderDropdown = (toggleSelector, menuSelector) => {
    const toggle = $(toggleSelector);
    const menu = $(menuSelector);

    if (!toggle || !menu) {
      return;
    }

    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      menu.classList.toggle('is-open', !isOpen);
    });

    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) {
        closeMenu();
      }
    });
  };

  const initHeaderCatalog = () => initHeaderDropdown('.header__catalog-toggle', '.header__catalog-menu');
  const initHeaderNav = () => initHeaderDropdown('.header__nav-toggle', '.header__nav-menu');

  const initMobileMenu = ({ scrollLock } = {}) => {
    const burger = document.querySelector('.header__burger');
    const menu = document.getElementById('header-mobile');
    const closeBtn = menu?.querySelector('.header-mobile__close');
    const overlay = menu?.querySelector('.header-mobile__overlay');

    if (!burger || !menu) return;

    const open = () => {
      menu.classList.add('open');
      burger.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      scrollLock?.lock?.('mobile-menu');
    };

    const close = () => {
      menu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      scrollLock?.unlock?.('mobile-menu');
    };

    burger.addEventListener('click', () => {
      burger.getAttribute('aria-expanded') === 'true' ? close() : open();
    });

    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);

    menu.querySelectorAll('.header-mobile__link').forEach((link) => {
      link.addEventListener('click', close);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  };

  const initHeaderScroll = () => {
    const header = document.querySelector('.header');
    if (!header) return;

    const handleScroll = () => {
      header.classList.toggle('scroll', window.scrollY > 40);
    };
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  // ======================
  // Swiper - Hero
  // ======================
  const initHeroSwiper = () => {
    if (typeof Swiper === 'undefined') return;
    if (!document.querySelector('.home-hero__swiper')) return;

    const heroSwiper = new Swiper('.home-hero__swiper', {
      loop: true,
      effect: 'fade',
      fadeEffect: {
        crossFade: true,
      },
      speed: 900,
      autoplay: {
        delay: 7000,
        disableOnInteraction: false,
      },
      allowTouchMove: true,
    });

    const titleElement = document.querySelector('.home-hero__title');
    const slides = document.querySelectorAll('.home-hero__swiper .swiper-slide');
    const thumbs = document.querySelectorAll('.home-hero__thumb');

    const updateHeroState = () => {
      const realIndex = heroSwiper.realIndex;
      if (titleElement) titleElement.textContent = slides[realIndex]?.dataset.title || '';

      thumbs.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === realIndex);
      });
    };

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        heroSwiper.slideToLoop(index);
      });
    });

    heroSwiper.on('slideChange', updateHeroState);
    updateHeroState();
  };

  // ======================
  // Swiper - Work
  // ======================
  const initWorkSwiper = () => {
    if (typeof Swiper === 'undefined') return;

    state.swipers.work = new Swiper('.workSwiper', {
      slidesPerView: 'auto',
      spaceBetween: s(16),
      grabCursor: true,
      loop: false,
    });
  };

  // ======================
  // Swiper - Mission
  // ======================
  const initMissionSwiper = () => {
    if (typeof Swiper === 'undefined') return;

    state.swipers.mission = new Swiper('.missionSwiper', {
      slidesPerView: 'auto',
      spaceBetween: s(8),
      grabCursor: true,
      loop: false,
    });
  };

  // ======================
  // Swiper - How it works
  // ======================
  const initHowSwiper = () => {
    if (typeof Swiper === 'undefined') return;

    state.swipers.how = new Swiper('.howSwiper', {
      slidesPerView: 'auto',
      spaceBetween: s(8),
      grabCursor: true,
      loop: false,
    });
  };

  // ======================
  // FAQ accordion
  // ======================
  const collapseAnswer = (answer) => {
    if (!answer) return;
    if (answer.style.height === "auto" || !answer.style.height) {
      answer.style.height = answer.scrollHeight + "px";
      answer.offsetHeight;
    }
    answer.style.height = "0";
  };

  const initFaq = () => {
    $$(".faq__item").forEach((item) => {
      const btn = item.querySelector(".faq__q");
      const answer = item.querySelector(".faq__a");
      if (!btn || !answer) return;

      btn.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");

        $$(".faq__item.open").forEach((other) => {
          other.classList.remove("open");
          other.querySelector(".faq__q")?.setAttribute("aria-expanded", "false");
          collapseAnswer(other.querySelector(".faq__a"));
        });

        if (!isOpen) {
          item.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
          answer.style.height = answer.scrollHeight + "px";
          answer.addEventListener("transitionend", () => {
            answer.style.height = "auto";
            window.lenis?.resize();
          }, { once: true });
        } else {
          window.lenis?.resize();
        }
      });
    });
  };

  // ======================
  // Phone mask
  // ======================
  const initPhoneMask = () => {
    const inputs = $$('input[type="tel"]');
    if (!inputs.length) return;

    const matrix = "+7 (___) ___ ____";

    const mask = function (event) {
      const key = event.key;
      const pos = this.selectionStart ?? this.value.length;

      if (pos < 3 && event.type === "keydown") event.preventDefault();

      const def = matrix.replace(/\D/g, "");
      const val = this.value.replace(/\D/g, "");

      let i = 0;
      let newValue = matrix.replace(/[_\d]/g, (a) =>
        i < val.length ? val.charAt(i++) || def.charAt(i) : a
      );

      i = newValue.indexOf("_");
      if (i !== -1) {
        if (i < 5) i = 3;
        newValue = newValue.slice(0, i);
      }

      let reg = matrix
        .substring(0, this.value.length)
        .replace(/_+/g, (a) => `\\d{1,${a.length}}`)
        .replace(/[+()]/g, "\\$&");

      reg = new RegExp(`^${reg}$`);

      if (!reg.test(this.value) || this.value.length < 5 || /^\d$/.test(key)) {
        this.value = newValue;
      }

      if (event.type === "blur" && this.value.length < 5) this.value = "";
    };

    inputs.forEach((input) => {
      input.addEventListener("input", mask, false);
      input.addEventListener("focus", mask, false);
      input.addEventListener("blur", mask, false);
      input.addEventListener("keydown", mask, false);
    });
  };

  // ======================
  // Modals
  // ======================
  const initModals = ({ scrollLock }) => {
    const wrapper = $(".modals");
    if (!wrapper) return;

    const modals = $$(".modal", wrapper);
    const getModalByType = (type) => wrapper.querySelector(`.modal[data-type="${type}"]`);

    const showWrapper = () => {
      wrapper.style.opacity = 1;
      wrapper.style.pointerEvents = "auto";
      scrollLock?.lock?.("modal");
    };

    const hideWrapper = () => {
      wrapper.style.opacity = 0;
      wrapper.style.pointerEvents = "none";
      scrollLock?.unlock?.("modal");
    };

    const openModal = (type) => {
      modals.forEach((m) => {
        m.style.display = "none";
        m.style.removeProperty("transform");
      });

      const modal = getModalByType(type);
      if (!modal) return;

      modal.style.display = "block";
      showWrapper();

      if (window.gsap) {
        window.gsap.fromTo(modal, { y: -100 }, { y: 0, duration: 0.5, ease: "power3.out" });
      }
    };

    const closeCurrentModal = () => {
      const current = modals.find((m) => getComputedStyle(m).display !== "none");

      const finish = () => {
        if (current) current.style.display = "none";
        hideWrapper();
      };

      if (current && window.gsap) {
        window.gsap.to(current, {
          y: -100,
          duration: 0.4,
          ease: "power3.in",
          onComplete: () => {
            current.style.removeProperty("transform");
            finish();
          },
        });
      } else {
        finish();
      }
    };

    $$(".modal-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const type = btn.dataset.type;
        if (!type) return;
        openModal(type);
      });
    });

    wrapper.addEventListener("click", (e) => {
      if (e.target === wrapper || e.target.closest(".modal__close")) closeCurrentModal();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && wrapper.style.pointerEvents === "auto") closeCurrentModal();
    });

    // Form submissions → show thanks modal
    $$("form[novalidate]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        let valid = true;
        $$("[required]", form).forEach((field) => {
          const empty =
            field.type === "checkbox" ? !field.checked : !field.value.trim();
          if (empty) valid = false;
        });

        if (!valid) return;

        form.reset();
        openModal("thanks");
      });
    });
  };

  // ======================
  // Swiper - Product Gallery
  // ======================
  const initProductGallery = () => {
    if (typeof Swiper === 'undefined') return;
    if (!document.querySelector('.productMainSwiper')) return;

    const thumbsSwiper = new Swiper('.productThumbsSwiper', {
      slidesPerView: 'auto',
      spaceBetween: s(8),
      watchSlidesProgress: true,
      grabCursor: true,
    });

    new Swiper('.productMainSwiper', {
      effect: 'fade',
      fadeEffect: { crossFade: true },
      thumbs: { swiper: thumbsSwiper },
    });
  };

  // ======================
  // Product tabs
  // ======================
  const initProductTabs = () => {
    const btns = $$('.product-tabs__btn');
    if (!btns.length) return;

    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        btns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        $$('.product-tabs__pane').forEach((pane) => {
          pane.classList.toggle('active', pane.dataset.pane === tab);
        });
      });
    });
  };

  // ======================
  // Product qty
  // ======================
  const initProductQty = () => {
    $$('.product-qty').forEach((wrap) => {
      const minus = wrap.querySelector('.product-qty__btn:first-child');
      const plus = wrap.querySelector('.product-qty__btn:last-of-type');
      const value = wrap.querySelector('.product-qty__value');
      if (!minus || !plus || !value) return;

      minus.addEventListener('click', () => {
        const current = parseInt(value.textContent, 10);
        if (current > 1) value.textContent = current - 1;
      });

      plus.addEventListener('click', () => {
        const current = parseInt(value.textContent, 10);
        value.textContent = current + 1;
      });
    });
  };

  // ======================
  // Swiper - Catalog Categories
  // ======================
  const initCategoriesSwiper = () => {
    if (typeof Swiper === 'undefined') return;
    if (!document.querySelector('.categoriesSwiper')) return;

    state.swipers.categories = new Swiper('.categoriesSwiper', {
      slidesPerView: 'auto',
      spaceBetween: s(8),
      grabCursor: true,
      loop: false,
    });
  };

  // ======================
  // Mobile filter drawer
  // ======================
  const initMobileFilter = ({ scrollLock } = {}) => {
    const sidebar = document.querySelector('.catalog__sidebar');
    if (!sidebar) return;

    const toggle = document.querySelector('.catalog__filter-toggle');
    const overlay = document.querySelector('.catalog-filter-overlay');
    const closeBtn = sidebar.querySelector('.catalog__sidebar-close');

    const open = () => {
      sidebar.classList.add('open');
      overlay?.classList.add('visible');
      scrollLock?.lock?.('mobile-filter');
    };

    const close = () => {
      sidebar.classList.remove('open');
      overlay?.classList.remove('visible');
      scrollLock?.unlock?.('mobile-filter');
    };

    toggle?.addEventListener('click', open);
    overlay?.addEventListener('click', close);
    closeBtn?.addEventListener('click', close);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) close();
    });
  };

  // ======================
  // Catalog filters accordion
  // ======================
  const initCatalogFilters = () => {
    $$(".catalog-filter").forEach((filter) => {
      const btn = filter.querySelector(".catalog-filter__header");
      const body = filter.querySelector(".catalog-filter__body");
      if (!btn || !body) return;

      btn.addEventListener("click", () => {
        filter.classList.toggle("open");
        body.addEventListener("transitionend", () => window.lenis?.resize(), { once: true });
      });
    });
  };

  // ======================
  // Catalog tabs
  // ======================
  const filterCatalogCards = (activeTab) => {
    $$(".product-card").forEach((card) => {
      const category = card.dataset.category;
      const show = activeTab === "all" || category === activeTab;
      card.classList.toggle("is-hidden", !show);
      card.classList.remove("is-subtab-hidden");
    });
  };

  const initCatalogTabs = () => {
    const tabs = $$(".catalog-tabs__button");
    if (!tabs.length) return;

    const activeOnLoad = tabs.find((t) => t.classList.contains("active"));
    if (activeOnLoad) filterCatalogCards(activeOnLoad.dataset.tab);

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        filterCatalogCards(tab.dataset.tab);
        state.swipers.homeCatalog?.slideTo(0);

        const categoryTabs = $$(".category-tabs__button");
        if (categoryTabs.length) {
          categoryTabs.forEach((t) => t.classList.remove("active"));
          categoryTabs[0].classList.add("active");
        }
      });
    });
  };

  // ======================
  // Category sub-tabs
  // ======================
  const initCategoryTabs = () => {
    const tabs = $$(".category-tabs__button");
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        const activeSubtab = tab.dataset.subtab;
        $$(".product-card").forEach((card) => {
          const subcategory = card.dataset.subcategory;
          const show = activeSubtab === "all" || subcategory === activeSubtab;
          card.classList.toggle("is-subtab-hidden", !show);
        });
      });
    });
  };

  // ======================
  // Sort
  // ======================
  const sortProducts = (type) => {
    const grid = document.querySelector(".catalog__grid");
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll(".product-card"));

    const comparators = {
      popular:    (a, b) => (parseInt(b.dataset.popularity) || 0) - (parseInt(a.dataset.popularity) || 0),
      "price-asc":  (a, b) => (parseFloat(a.dataset.price) || 0) - (parseFloat(b.dataset.price) || 0),
      "price-desc": (a, b) => (parseFloat(b.dataset.price) || 0) - (parseFloat(a.dataset.price) || 0),
      new:        (a, b) => (parseInt(b.dataset.date) || 0) - (parseInt(a.dataset.date) || 0),
    };

    const fn = comparators[type];
    if (!fn) return;

    cards.sort(fn).forEach((card) => grid.appendChild(card));
  };

  const initSort = () => {
    $$(".catalog-sort").forEach((sort) => {
      const toggle = sort.querySelector(".catalog-sort__toggle");
      const menu = sort.querySelector(".catalog-sort__menu");
      const label = sort.querySelector(".catalog-sort__label");
      if (!toggle || !menu) return;

      const close = () => {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
      };

      toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isOpen));
        menu.classList.toggle("is-open", !isOpen);
      });

      $$(".catalog-sort__option", sort).forEach((opt) => {
        opt.addEventListener("click", () => {
          $$(".catalog-sort__option", sort).forEach((o) => o.classList.remove("active"));
          opt.classList.add("active");
          if (label) label.textContent = opt.textContent.trim();
          close();
          sortProducts(opt.dataset.sort);
        });
      });

      document.addEventListener("click", (e) => {
        if (!sort.contains(e.target)) close();
      });
    });
  };

  // ======================
  // Swiper - Home Catalog (mobile slider)
  // ======================
  const initHomeCatalogSwiper = () => {
    if (typeof Swiper === 'undefined') return;
    if (!document.querySelector('.homeCatalogSwiper')) return;

    state.swipers.homeCatalog = new Swiper('.homeCatalogSwiper', {
      slidesPerView: 1.2,
      spaceBetween: s(8),
      grabCursor: true,
      breakpoints: {
        768: {
          enabled: false,
        }
      }
    });
  };

  // ======================
  // Swiper - Services (mobile slider)
  // ======================
  const initServicesSwiper = () => {
    if (typeof Swiper === 'undefined') return;
    if (!document.querySelector('.servicesSwiper')) return;

    state.swipers.services = new Swiper('.servicesSwiper', {
      slidesPerView: 1.2,
      spaceBetween: s(8),
      grabCursor: true,
      breakpoints: {
        768: {
          enabled: false,
        }
      }
    });
  };

  // ======================
  // Swiper - News (mobile slider)
  // ======================
  const initNewsSwiper = () => {
    if (typeof Swiper === 'undefined') return;
    if (!document.querySelector('.newsSwiper')) return;

    state.swipers.news = new Swiper('.newsSwiper', {
      slidesPerView: 1.2,
      spaceBetween: s(8),
      grabCursor: true,
      breakpoints: {
        768: {
          enabled: false,
        }
      }
    });
  };

  // ======================
  // Cart button toggle
  // ======================
  const initCartButtons = () => {
    $$('.product-card__btn-cart').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.product-card');
        if (!card) return;
        card.classList.toggle('product-card--in-cart');
      });
    });
  };

  // ======================
  // Scroll Animations
  // ======================
  const initScrollAnimations = () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    if (window.lenis) {
      window.lenis.on('scroll', () => ScrollTrigger.update());
    }

    const st = (trigger) => ({ trigger, start: 'top 88%', once: true });

    // Section titles — each gets its own trigger
    gsap.utils.toArray('.title-indent').forEach((el) => {
      gsap.from(el, { opacity: 0, y: 28, duration: 0.7, ease: 'power2.out', scrollTrigger: st(el) });
    });

    // Feedback section — split left / right
    gsap.utils.toArray('.feedback__content').forEach((el) => {
      gsap.from(el, { opacity: 0, x: -50, duration: 0.8, ease: 'power2.out', scrollTrigger: st(el) });
    });
    gsap.utils.toArray('.feedback__img').forEach((el) => {
      gsap.from(el, { opacity: 0, x: 50, duration: 0.8, ease: 'power2.out', scrollTrigger: st(el) });
    });

    // Home-about section — content slides from right
    gsap.utils.toArray('.home-about__content').forEach((el) => {
      gsap.from(el, { opacity: 0, y: 60, duration: 0.9, ease: 'power2.out', scrollTrigger: st(el) });
    });

    // Inner page hero — split left / right
    gsap.utils.toArray('.hero__content').forEach((el) => {
      gsap.from(el, { opacity: 0, x: -40, duration: 0.8, delay: 0.1, ease: 'power2.out', scrollTrigger: st(el) });
    });
    gsap.utils.toArray('.hero__img').forEach((el) => {
      gsap.from(el, { opacity: 0, x: 40, duration: 0.8, delay: 0.2, ease: 'power2.out', scrollTrigger: st(el) });
    });

    // About exp — text + image + stats stagger
    gsap.utils.toArray('.about-exp__content').forEach((el) => {
      gsap.from(el, { opacity: 0, y: 30, duration: 0.7, ease: 'power2.out', scrollTrigger: st(el) });
    });
    gsap.utils.toArray('.about-exp__img').forEach((el) => {
      gsap.from(el, { opacity: 0, scale: 0.95, duration: 0.8, ease: 'power2.out', scrollTrigger: st(el) });
    });
    const statsWrap = document.querySelector('.about-exp__stats');
    if (statsWrap) {
      gsap.from(gsap.utils.toArray('.about-exp__stat'), {
        opacity: 0, y: 20, duration: 0.6, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: st(statsWrap),
      });
    }

    // Service features grid — stagger
    const featuresGrid = document.querySelector('.service-features__grid');
    if (featuresGrid) {
      gsap.from(gsap.utils.toArray('.service-feature', featuresGrid), {
        opacity: 0, y: 25, duration: 0.6, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: st(featuresGrid),
      });
    }

    // Services cards grid (non-swiper pages) — stagger
    gsap.utils.toArray('.services__grid').forEach((grid) => {
      if (grid.classList.contains('swiper')) return;
      gsap.from(gsap.utils.toArray('.services-card', grid), {
        opacity: 0, y: 25, duration: 0.6, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: st(grid),
      });
    });

    // FAQ items — stagger
    const faqList = document.querySelector('.faq__list');
    if (faqList) {
      gsap.from(gsap.utils.toArray('.faq__item', faqList), {
        opacity: 0, y: 20, duration: 0.5, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: st(faqList),
      });
    }

    // Work / Mission / How sliders — animate as whole block
    gsap.utils.toArray('.work__slider, .mission__slider, .how__slider').forEach((el) => {
      gsap.from(el, { opacity: 0, y: 30, duration: 0.7, ease: 'power2.out', scrollTrigger: st(el) });
    });

    // Home swiper sections (catalog / services / news) — animate container
    ['.homeCatalogSwiper', '.servicesSwiper', '.newsSwiper'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) gsap.from(el, { opacity: 0, y: 25, duration: 0.7, ease: 'power2.out', scrollTrigger: st(el) });
    });

    // Section footer CTAs
    gsap.utils.toArray('.home-catalog__footer, .home-services__footer, .news__footer').forEach((el) => {
      gsap.from(el, { opacity: 0, y: 15, duration: 0.5, ease: 'power1.out', scrollTrigger: st(el) });
    });

    // Contact groups — stagger + map
    const contactWrap = document.querySelector('.contact__wrap');
    if (contactWrap) {
      gsap.from(gsap.utils.toArray('.contact-group', contactWrap), {
        opacity: 0, y: 20, duration: 0.6, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: st(contactWrap),
      });
      const mapEl = document.querySelector('.contact-map');
      if (mapEl) {
        gsap.from(mapEl, { opacity: 0, y: 25, duration: 0.7, delay: 0.2, ease: 'power2.out', scrollTrigger: st(mapEl) });
      }
    }

    // Catalog page product cards — stagger
    const catalogGrid = document.querySelector('.catalog__grid');
    if (catalogGrid) {
      gsap.from(gsap.utils.toArray('.product-card', catalogGrid), {
        opacity: 0, y: 20, duration: 0.5, stagger: 0.06, ease: 'power2.out',
        scrollTrigger: st(catalogGrid),
      });
    }
  };

  // ======================
  // Map iframe scroll fix
  // ======================
  const initMapScrollFix = () => {
    const mapWrap = document.querySelector('.contact-map');
    if (!mapWrap) return;

    mapWrap.addEventListener('click', () => mapWrap.classList.add('is-active'));

    document.addEventListener('click', (e) => {
      if (!mapWrap.contains(e.target)) mapWrap.classList.remove('is-active');
    });
  };

    // ======================
  // Boot
  // ======================
  document.addEventListener("DOMContentLoaded", () => {
    const lenis = initLenis();
    updateMultiplier();

    const scrollLock = createScrollLock(lenis);

    initHeroSwiper();
    initHomeCatalogSwiper();
    initServicesSwiper();
    initNewsSwiper();
    initWorkSwiper();
    initHowSwiper();
    initMissionSwiper();
    initModals({ scrollLock });
    initFaq();
    initProductGallery();
    initProductTabs();
    initProductQty();
    initCategoriesSwiper();
    initCatalogFilters();
    initCatalogTabs();
    initCategoryTabs();
    initSort();
    initCartButtons();
    initMobileMenu({ scrollLock });
    initMobileFilter({ scrollLock });
    initMapScrollFix();
    initHeaderScroll();
    initHeaderCatalog();
    initHeaderNav();
    initScrollAnimations();

    if (typeof Fancybox !== "undefined") Fancybox.bind("[data-fancybox]");

    window.addEventListener("resize", debounce(() => {
      updateMultiplier();
      const { work, mission, how, categories, homeCatalog, services, news } = state.swipers;
      if (work)        { work.params.spaceBetween = s(16);  work.update(); }
      if (mission)     { mission.params.spaceBetween = s(8); mission.update(); }
      if (how)         { how.params.spaceBetween = s(8);    how.update(); }
      if (categories)  { categories.params.spaceBetween = s(8); categories.update(); }
      if (homeCatalog) { homeCatalog.params.spaceBetween = s(8); homeCatalog.update(); }
      if (services)    { services.params.spaceBetween = s(8);    services.update(); }
      if (news)        { news.params.spaceBetween = s(8);        news.update(); }
    }, 150));
  });
})();