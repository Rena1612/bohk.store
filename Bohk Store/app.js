(function () {
  "use strict";

  var CART_KEY = "bohk-store-cart";

  var state = {
    cart: loadCart(),
    query: "",
    category: "all",
    sort: "default",
    modalProductId: null,
    lastFocused: null,
    layer: null,
  };

  var els = {};

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ---------- init ---------- */

  function init() {
    cacheElements();
    renderCategoryChips();
    bindEvents();
    renderAll();
  }

  function cacheElements() {
    var ids = [
      "logo",
      "search-form",
      "search-input",
      "cart-btn",
      "cart-count",
      "category-chips",
      "sort-select",
      "results-note",
      "product-grid",
      "empty-state",
      "reset-filters",
      "shop-now",
      "backdrop",
      "cart-drawer",
      "cart-title-count",
      "cart-close",
      "cart-items",
      "cart-empty",
      "cart-continue",
      "cart-foot",
      "cart-subtotal",
      "cart-total",
      "checkout-btn",
      "product-modal",
      "modal-close",
      "modal-image",
      "modal-fallback",
      "modal-category",
      "modal-title",
      "modal-price",
      "modal-description",
      "modal-qty",
      "qty-minus",
      "qty-plus",
      "modal-add",
      "toast",
      "checkout-form",
      "view-home",
      "view-checkout",
      "view-confirm",
      "confirm-name",
      "confirm-order",
      "confirm-items",
      "confirm-total",
      "confirm-address",
      "confirm-phone",
      "summary-items",
      "summary-subtotal",
      "summary-total",
    ];
    ids.forEach(function (id) {
      els[id] = document.getElementById(id);
    });
    els.views = [els["view-home"], els["view-checkout"], els["view-confirm"]];
  }

  /* ---------- data helpers ---------- */

  function getProduct(id) {
    return PRODUCTS.find(function (p) {
      return p.id === id;
    });
  }

  function categoryLabel(cat) {
    return CATEGORY_LABELS[cat] || cat;
  }

  function formatPrice(n) {
    return "$" + n.toFixed(2);
  }

  function hueFor(id) {
    return (id * 47) % 360;
  }

  /* ---------- cart (localStorage) ---------- */

  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY));
      if (!Array.isArray(raw)) return [];
      return raw
        .filter(function (item) {
          return item && getProduct(item.id) && Number.isFinite(item.qty) && item.qty > 0;
        })
        .map(function (item) {
          return { id: item.id, qty: Math.min(99, Math.round(item.qty)) };
        });
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  }

  function cartCount() {
    return state.cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function cartTotal() {
    return state.cart.reduce(function (sum, item) {
      var p = getProduct(item.id);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  }

  function addToCart(id, qty) {
    var found = state.cart.find(function (item) {
      return item.id === id;
    });
    if (found) {
      found.qty = Math.min(99, found.qty + qty);
    } else {
      state.cart.push({ id: id, qty: qty });
    }
    saveCart();
    renderAll();
    bumpBadge();
  }

  function setCartQty(id, qty) {
    if (qty < 1) {
      removeFromCart(id);
      return;
    }
    var found = state.cart.find(function (item) {
      return item.id === id;
    });
    if (found) found.qty = Math.min(99, qty);
    saveCart();
    renderAll();
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter(function (item) {
      return item.id !== id;
    });
    saveCart();
    renderAll();
  }

  function clearCart() {
    state.cart = [];
    saveCart();
  }

  function bumpBadge() {
    els["cart-count"].classList.remove("bump");
    void els["cart-count"].offsetWidth;
    els["cart-count"].classList.add("bump");
  }

  /* ---------- product filtering ---------- */

  function getVisibleProducts() {
    var list = PRODUCTS.slice();
    if (state.category !== "all") {
      list = list.filter(function (p) {
        return p.category === state.category;
      });
    }
    var q = state.query.trim().toLowerCase();
    if (q) {
      list = list.filter(function (p) {
        return p.name.toLowerCase().indexOf(q) !== -1;
      });
    }
    if (state.sort === "price-asc") {
      list.sort(function (a, b) {
        return a.price - b.price;
      });
    } else if (state.sort === "price-desc") {
      list.sort(function (a, b) {
        return b.price - a.price;
      });
    }
    return list;
  }

  function renderAll() {
    renderProducts();
    renderCart();
    renderSummary();
  }

  /* ---------- rendering ---------- */

  function renderCategoryChips() {
    els["category-chips"].innerHTML = Object.keys(CATEGORY_LABELS)
      .map(function (cat) {
        return (
          '<button type="button" class="chip" data-cat="' +
          cat +
          '" aria-pressed="' +
          (state.category === cat) +
          '">' +
          CATEGORY_LABELS[cat] +
          "</button>"
        );
      })
      .join("");
    els["category-chips"]
      .querySelectorAll(".chip")
      .forEach(function (chip) {
        chip.classList.toggle("is-active", chip.dataset.cat === state.category);
      });
  }

  function renderProducts() {
    var list = getVisibleProducts();

    els["results-note"].textContent =
      list.length + " product" + (list.length === 1 ? "" : "s");

    els["empty-state"].hidden = list.length > 0;
    els["product-grid"].hidden = list.length === 0;

    els["product-grid"].innerHTML = list
      .map(function (p) {
        return (
          '<article class="card" data-id="' +
          p.id +
          '">' +
          '  <div class="card-media">' +
          '    <span class="card-cat">' +
          categoryLabel(p.category) +
          "</span>" +
          '    <button type="button" class="media-btn" data-action="details" aria-label="View details for ' +
          p.name +
          '">' +
          '      <span class="media-fallback" style="--h:' +
          hueFor(p.id) +
          '" aria-hidden="true">' +
          p.name.charAt(0) +
          "</span>" +
          '      <img src="' +
          p.image +
          '" alt="' +
          p.name +
          '" loading="lazy" decoding="async" />' +
          "    </button>" +
          "  </div>" +
          '  <div class="card-body">' +
          '    <h3 class="card-title">' +
          '      <button type="button" class="title-btn" data-action="details">' +
          p.name +
          "</button>" +
          "    </h3>" +
          '    <div class="card-row">' +
          '      <p class="card-price">' +
          formatPrice(p.price) +
          "</p>" +
          '      <button type="button" class="btn btn-primary btn-sm" data-action="add">Add to cart</button>' +
          "    </div>" +
          "  </div>" +
          "</article>"
        );
      })
      .join("");
  }

  function cartItemHTML(item) {
    var p = getProduct(item.id);
    return (
      '<li class="cart-item" data-id="' +
      p.id +
      '">' +
      '  <img src="' +
      p.image +
      '" alt="' +
      p.name +
      '" />' +
      '  <div>' +
      '    <p class="item-name">' +
      p.name +
      "</p>" +
      '    <p class="item-price">' +
      formatPrice(p.price) +
      " each</p>" +
      '    <div class="qty qty-sm">' +
      '      <button type="button" class="qty-btn" data-action="dec" aria-label="Decrease quantity of ' +
      p.name +
      '">−</button>' +
      '      <span class="cart-qty-num">' +
      item.qty +
      "</span>" +
      '      <button type="button" class="qty-btn" data-action="inc" aria-label="Increase quantity of ' +
      p.name +
      '">+</button>' +
      "    </div>" +
      "  </div>" +
      '  <div class="item-side">' +
      '    <p class="line-total">' +
      formatPrice(p.price * item.qty) +
      "</p>" +
      '    <button type="button" class="link-btn" data-action="remove" aria-label="Remove ' +
      p.name +
      ' from cart">Remove</button>' +
      "  </div>" +
      "</li>"
    );
  }

  function renderCart() {
    var count = cartCount();
    els["cart-count"].textContent = count;
    els["cart-title-count"].textContent = "(" + count + ")";

    var label = "Open cart, " + count + " item" + (count === 1 ? "" : "s");
    els["cart-btn"].setAttribute("aria-label", label);

    var empty = count === 0;
    els["cart-items"].hidden = empty;
    els["cart-foot"].hidden = empty;
    els["cart-empty"].hidden = !empty;

    if (!empty) {
      els["cart-items"].innerHTML = state.cart.map(cartItemHTML).join("");
      els["cart-subtotal"].textContent = formatPrice(cartTotal());
      els["cart-total"].textContent = formatPrice(cartTotal());
      els["checkout-btn"].disabled = false;
    }
  }

  function renderSummary() {
    var empty = state.cart.length === 0;
    els["summary-items"].innerHTML = state.cart
      .map(function (item) {
        var p = getProduct(item.id);
        return (
          "<li><span>" +
          p.name +
          ' <span class="qty-note">× ' +
          item.qty +
          "</span></span><strong>" +
          formatPrice(p.price * item.qty) +
          "</strong></li>"
        );
      })
      .join("");
    els["summary-subtotal"].textContent = formatPrice(cartTotal());
    els["summary-total"].textContent = formatPrice(cartTotal());
    if (empty) showView("home");
  }

  /* ---------- views ---------- */

  function showView(name) {
    var map = { home: "view-home", checkout: "view-checkout", confirm: "view-confirm" };
    els.views.forEach(function (view) {
      view.hidden = view.id !== map[name];
    });
  }

  /* ---------- product modal ---------- */

  function openProductModal(id) {
    var p = getProduct(id);
    if (!p) return;
    state.modalProductId = id;
    state.lastFocused = document.activeElement;

    els["modal-image"].src = p.image;
    els["modal-image"].alt = p.name;
    els["modal-fallback"].style.setProperty("--h", hueFor(p.id));
    els["modal-fallback"].textContent = p.name.charAt(0);
    els["modal-category"].textContent = categoryLabel(p.category);
    els["modal-title"].textContent = p.name;
    els["modal-price"].textContent = formatPrice(p.price);
    els["modal-description"].textContent = p.description;
    els["modal-qty"].value = 1;

    openLayer("modal");
  }

  function closeProductModal() {
    closeLayer();
  }

  function modalAddToCart() {
    var qty = clampQty(els["modal-qty"].value);
    addToCart(state.modalProductId, qty);
    toast("Added to cart");
  }

  function clampQty(value) {
    var n = parseInt(value, 10);
    if (Number.isNaN(n)) return 1;
    return Math.min(99, Math.max(1, n));
  }

  /* ---------- cart drawer ---------- */

  function openCart() {
    state.lastFocused = document.activeElement;
    openLayer("cart");
  }

  function closeCart() {
    closeLayer();
  }

  /* ---------- overlay layer handling ---------- */

  function openLayer(name) {
    state.layer = name;
    document.body.classList.add("no-scroll");
    var layerEl = name === "cart" ? els["cart-drawer"] : els["product-modal"];

    // make the inert layer interactive, then animate it open
    layerEl.inert = false;
    requestAnimationFrame(function () {
      layerEl.classList.add("is-open");
      els["backdrop"].classList.add("is-open");
    });

    var focusTarget =
      name === "cart" ? els["cart-close"] : els["modal-close"];
    setTimeout(function () {
      focusTarget.focus();
    }, 60);
  }

  function closeLayer() {
    if (!state.layer) return;
    var layerEl =
      state.layer === "cart"
        ? els["cart-drawer"]
        : els["product-modal"];

    layerEl.classList.remove("is-open");
    els["backdrop"].classList.remove("is-open");

    setTimeout(function () {
      layerEl.inert = true;
      document.body.classList.remove("no-scroll");
      if (state.lastFocused) state.lastFocused.focus();
      if (state.layer === "modal") {
        els["modal-image"].removeAttribute("src");
        els["modal-image"].removeAttribute("alt");
      }
      state.layer = null;
    }, 360);
  }

  /* ---------- checkout ---------- */

  var validators = {
    name: function (value) {
      return value.trim().length >= 2 || "Please enter your full name.";
    },
    phone: function (value) {
      var v = value.trim();
      var ok =
        /^[\d+\-().\s]{6,20}$/.test(v) && /[0-9]{3}/.test(v.replace(/\D/g, ""));
      return ok || "Please enter a valid phone number.";
    },
    address: function (value) {
      return (
        value.trim().length >= 8 || "Please enter your shipping address."
      );
    },
  };

  function validateField(input) {
    var message = validators[input.name](input.value);
    var ok = message === true;
    input.classList.toggle("is-invalid", !ok);
    input.setAttribute("aria-invalid", String(!ok));
    document.getElementById("err-" + input.name).textContent = ok ? "" : message;
    return ok;
  }

  function handleSubmit(e) {
    e.preventDefault();
    var fields = ["name", "phone", "address"]
      .map(function (name) {
        return document.getElementById("field-" + name);
      })
      .map(validateField);

    if (fields.indexOf(false) !== -1) {
      var firstInvalid = document.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus();
      toast("Please fix the highlighted fields");
      return;
    }

    placeOrder();
  }

  function placeOrder() {
    var orderNumber = "BHK-" + Date.now().toString(36).toUpperCase().slice(-6);
    var total = cartTotal();
    var count = cartCount();
    var name = document.getElementById("field-name").value.trim();
    var phone = document.getElementById("field-phone").value.trim();
    var address = document.getElementById("field-address").value.trim();

    els["confirm-name"].textContent = name;
    els["confirm-order"].textContent = orderNumber;
    els["confirm-items"].textContent =
      count + " item" + (count === 1 ? "" : "s") + " — " + formatPrice(total);
    els["confirm-total"].textContent = formatPrice(total);
    els["confirm-address"].textContent = address;
    els["confirm-phone"].textContent = phone;

    clearCart();
    renderAll();
    els["checkout-form"].reset();
    showView("confirm");
    window.scrollTo({ top: 0, behavior: "smooth" });
    els["confirm-title"].focus();
    toast("Order placed");
  }

  /* ---------- misc UI ---------- */

  function toast(msg) {
    els["toast"].textContent = msg;
    els["toast"].classList.add("is-visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      els["toast"].classList.remove("is-visible");
    }, 2200);
  }

  function trapFocus(e, container) {
    if (e.key !== "Tab") return;
    var focusable = container.querySelectorAll(
      "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    var list = Array.prototype.filter.call(focusable, function (el) {
      return el.offsetParent !== null;
    });
    if (list.length === 0) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ---------- events ---------- */

  function bindEvents() {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLayer();
      var openLayerEl =
        state.layer === "cart" ? els["cart-drawer"] : els["product-modal"];
      if (state.layer) trapFocus(e, openLayerEl);
    });

    document.addEventListener(
      "error",
      function (e) {
        if (e.target.tagName === "IMG") e.target.classList.add("is-broken");
      },
      true
    );

    els["search-input"].addEventListener("input", function () {
      state.query = this.value;
      showView("home");
      renderProducts();
    });

    els["search-form"].addEventListener("submit", function (e) {
      e.preventDefault();
    });

    els["sort-select"].addEventListener("change", function () {
      state.sort = this.value;
      renderProducts();
    });

    els["category-chips"].addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      state.category = chip.dataset.cat;
      renderCategoryChips();
      renderProducts();
    });

    els["product-grid"].addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var id = Number(btn.closest(".card").dataset.id);
      if (btn.dataset.action === "add") {
        addToCart(id, 1);
        toast("Added to cart");
      } else {
        openProductModal(id);
      }
    });

    els["cart-btn"].addEventListener("click", openCart);
    els["cart-close"].addEventListener("click", closeCart);
    els["cart-continue"].addEventListener("click", function () {
      closeCart();
      document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
    });
    els["backdrop"].addEventListener("click", closeLayer);

    els["cart-items"].addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var id = Number(btn.closest(".cart-item").dataset.id);
      var item = state.cart.find(function (i) {
        return i.id === id;
      });
      if (!item) return;
      if (btn.dataset.action === "inc") setCartQty(id, item.qty + 1);
      else if (btn.dataset.action === "dec") setCartQty(id, item.qty - 1);
      else removeFromCart(id);
    });

    els["checkout-btn"].addEventListener("click", function () {
      closeCart();
      showView("checkout");
      renderSummary();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    els["modal-close"].addEventListener("click", closeProductModal);
    els["qty-minus"].addEventListener("click", function () {
      els["modal-qty"].value = Math.max(1, clampQty(els["modal-qty"].value) - 1);
    });
    els["qty-plus"].addEventListener("click", function () {
      els["modal-qty"].value = clampQty(els["modal-qty"].value) + 1;
    });
    els["modal-qty"].addEventListener("change", function () {
      this.value = clampQty(this.value);
    });
    els["modal-add"].addEventListener("click", modalAddToCart);

    els["checkout-form"].addEventListener("submit", handleSubmit);
    ["name", "phone", "address"].forEach(function (name) {
      var input = document.getElementById("field-" + name);
      input.addEventListener("blur", function () {
        if (input.value.trim() !== "") validateField(input);
      });
      input.addEventListener("input", function () {
        if (input.classList.contains("is-invalid")) validateField(input);
      });
    });

    els["logo"].addEventListener("click", function (e) {
      e.preventDefault();
      showView("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    els["shop-now"].addEventListener("click", function (e) {
      e.preventDefault();
      document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
    });

    els["reset-filters"].addEventListener("click", function () {
      state.query = "";
      state.category = "all";
      state.sort = "default";
      els["search-input"].value = "";
      els["sort-select"].value = "default";
      renderCategoryChips();
      renderProducts();
    });

    document.addEventListener("click", function (e) {
      var goto = e.target.closest("[data-goto]");
      if (!goto) return;
      closeLayer();
      showView(goto.dataset.goto);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();