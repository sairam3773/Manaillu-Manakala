/* Storefront behaviour: catalogue, filters, cart and checkout. */

(function () {
  "use strict";

  var S = window.MimkStore;
  var state = { category: "All", search: "", sort: "featured" };

  var grid = document.getElementById("productGrid");
  var emptyState = document.getElementById("emptyState");
  var countLabel = document.getElementById("productCount");
  var chips = document.getElementById("filterChips");
  var categoryGrid = document.getElementById("categoryGrid");
  var searchInput = document.getElementById("shopSearch");
  var sortSelect = document.getElementById("sortSelect");
  var drawer = document.getElementById("cartDrawer");
  var overlay = document.getElementById("cartOverlay");
  var cartItems = document.getElementById("cartItems");
  var checkoutModal = document.getElementById("checkoutModal");

  function categories() {
    return (window.MIMK_CATEGORIES || []).map(function (c) { return c.name; });
  }

  function renderCategories() {
    if (!categoryGrid) return;
    categoryGrid.innerHTML = (window.MIMK_CATEGORIES || []).map(function (cat) {
      return [
        '<button class="category-card" type="button" data-category="', S.escapeHtml(cat.name), '">',
        '<span class="category-icon">', cat.icon, '</span>',
        '<strong>', S.escapeHtml(cat.name), '</strong>',
        '<small>', S.escapeHtml(cat.note), '</small>',
        '</button>'
      ].join("");
    }).join("");
  }

  function renderChips() {
    if (!chips) return;
    var names = ["All"].concat(categories());
    chips.innerHTML = names.map(function (name) {
      return '<button type="button" class="chip' + (state.category === name ? " active" : "") +
        '" data-category="' + S.escapeHtml(name) + '">' + S.escapeHtml(name) + "</button>";
    }).join("");
  }

  function visibleProducts() {
    var list = S.getProducts().filter(function (p) { return p.active !== false; });

    if (state.category !== "All") {
      list = list.filter(function (p) { return p.category === state.category; });
    }
    if (state.search) {
      var q = state.search.toLowerCase();
      list = list.filter(function (p) {
        return (p.name + " " + p.category + " " + (p.description || "")).toLowerCase().indexOf(q) !== -1;
      });
    }

    list.sort(function (a, b) {
      switch (state.sort) {
        case "price-low": return Number(a.price) - Number(b.price);
        case "price-high": return Number(b.price) - Number(a.price);
        case "name": return String(a.name).localeCompare(String(b.name));
        case "newest": return Number(b.createdAt || 0) - Number(a.createdAt || 0);
        default:
          if (Boolean(b.featured) !== Boolean(a.featured)) return b.featured ? 1 : -1;
          return Number(b.createdAt || 0) - Number(a.createdAt || 0);
      }
    });
    return list;
  }

  function renderProducts() {
    if (!grid) return;
    var list = visibleProducts();
    countLabel.textContent = list.length + (list.length === 1 ? " piece" : " pieces") + " to explore";

    grid.innerHTML = list.map(function (p) {
      var tag = p.featured ? '<span class="product-tag">Featured</span>' : "";
      return [
        '<article class="product-card">',
        '<div class="product-media">',
        '<img src="', S.escapeHtml(p.image || S.placeholderImage(p.name)), '" alt="', S.escapeHtml(p.name), '" loading="lazy" />',
        tag,
        '</div>',
        '<div class="product-body">',
        '<span class="product-cat">', S.escapeHtml(p.category), '</span>',
        '<span class="stock-note', Number(p.stock) === 0 ? ' out' : '', '">',
        Number(p.stock) === 0 ? "Out of stock" : Number(p.stock) + " in stock",
        '</span>',
        '<h3 class="product-name">', S.escapeHtml(p.name), '</h3>',
        '<p class="product-desc">', S.escapeHtml(p.description || "A handpicked piece for your home."), '</p>',
        '<div class="product-bottom">',
        '<span class="price">', S.money(p.price), '</span>',
        '<button class="add-btn" type="button" data-add="', S.escapeHtml(p.id), '"',
        Number(p.stock) === 0 ? " disabled" : "", '>',
        Number(p.stock) === 0 ? "Sold out" : "Add to cart", '</button>',
        '</div></div></article>'
      ].join("");
    }).join("");

    emptyState.hidden = list.length !== 0;
  }

  function renderCart() {
    var cart = S.getCart();
    var count = S.cartCount();
    var total = S.cartTotal();

    document.getElementById("cartCount").textContent = count;
    document.getElementById("drawerCount").textContent = "(" + count + ")";
    document.getElementById("cartTotal").textContent = S.money(total);
    document.getElementById("modalTotal").textContent = S.money(total);
    document.getElementById("checkoutBtn").disabled = cart.length === 0;

    if (!cart.length) {
      cartItems.innerHTML = '<div class="cart-empty"><span class="big">&#9748;</span><p>Your cart is waiting for something lovely.</p></div';
      return;
    }

    cartItems.innerHTML = cart.map(function (item) {
      var p = S.getProduct(item.id);
      if (!p) return "";
      return [
        '<div class="cart-item" data-item="', S.escapeHtml(item.id), '">',
        '<img src="', S.escapeHtml(p.image || S.placeholderImage(p.name)), '" alt="" />',
        '<div>',
        '<h4>', S.escapeHtml(p.name), '</h4>',
        '<span class="unit">', S.money(p.price), ' each</span>',
        '<div class="row">',
        '<span class="qty">',
        '<button type="button" data-qty="-1" aria-label="Decrease quantity">&minus;</button>',
        '<span>', item.qty, '</span>',
        '<button type="button" data-qty="1" aria-label="Increase quantity">+</button>',
        '</span>',
        '<strong>', S.money(Number(p.price) * item.qty), '</strong>',
        '</div>',
        '<div class="row"><button class="remove-item" type="button" data-remove>Remove</button></div>',
        '</div></div>'
      ].join("");
    }).join("");
  }

  function openCart() {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
  }

  function closeCart() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
  }

  function resetCheckoutView() {
    document.getElementById("checkoutForm").hidden = false;
    document.getElementById("checkoutTitle").hidden = false;
    document.getElementById("checkoutTitle").textContent = "Almost there";
    document.querySelector(".modal-sub").hidden = false;
    document.getElementById("orderSuccess").hidden = true;
  }

  function openCheckout() {
    if (!S.cartCount()) return;
    resetCheckoutView();
    checkoutModal.hidden = false;
    document.getElementById("custName").focus();
  }

  function closeCheckout() { checkoutModal.hidden = true; }

  // Events
  categoryGrid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-category]");
    if (!btn) return;
    state.category = btn.getAttribute("data-category");
    state.search = "";
    if (searchInput) searchInput.value = "";
    renderChips();
    renderProducts();
    document.getElementById("products").scrollIntoView({ behavior: "smooth" });
  });

  chips.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-category]");
    if (!btn) return;
    state.category = btn.getAttribute("data-category");
    renderChips();
    renderProducts();
  });

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      state.search = searchInput.value.trim();
      renderProducts();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      state.sort = sortSelect.value;
      renderProducts();
    });
  }

  document.getElementById("resetFilters").addEventListener("click", function () {
    state.category = "All";
    state.search = "";
    sortSelect.value = "featured";
    state.sort = "featured";
    searchInput.value = "";
    renderChips();
    renderProducts();
  });

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-add]");
    if (!btn) return;
    S.addToCart(btn.getAttribute("data-add"), 1);
    renderCart();
    S.toast("Added to your cart");
    openCart();
  });

  cartItems.addEventListener("click", function (e) {
    var itemEl = e.target.closest("[data-item]");
    if (!itemEl) return;
    var id = itemEl.getAttribute("data-item");
    var current = S.getCart().filter(function (i) { return String(i.id) === id; })[0];
    if (!current) return;

    var qtyBtn = e.target.closest("[data-qty]");
    if (qtyBtn) {
      var next = current.qty + Number(qtyBtn.getAttribute("data-qty"));
      S.setQty(id, next);
      renderCart();
      if (next <= 0) S.toast("Item removed from cart");
    }
    if (e.target.closest("[data-remove]")) {
      S.removeFromCart(id);
      renderCart();
      S.toast("Item removed");
    }
  });

  document.querySelector(".cart-toggle").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  document.getElementById("checkoutBtn").addEventListener("click", openCheckout);
  document.getElementById("closeCheckout").addEventListener("click", closeCheckout);
  checkoutModal.addEventListener("click", function (e) { if (e.target === checkoutModal) closeCheckout(); });

  document.getElementById("checkoutForm").addEventListener("submit", function (e) {
    e.preventDefault();

    var cart = S.getCart();
    var items = cart.map(function (item) {
      var p = S.getProduct(item.id);
      return p
        ? { id: p.id, name: p.name, price: Number(p.price), qty: item.qty }
        : null;
    }).filter(Boolean);

    if (!items.length) return;

    var total = items.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    var order = S.addOrder({
      name: document.getElementById("custName").value.trim(),
      whatsapp: document.getElementById("custWhatsapp").value.trim(),
      town: document.getElementById("custTown").value.trim(),
      customer: {
        name: document.getElementById("custName").value.trim(),
        whatsapp: document.getElementById("custWhatsapp").value.trim(),
        door: document.getElementById("custDoor").value.trim(),
        street: document.getElementById("custStreet").value.trim(),
        town: document.getElementById("custTown").value.trim(),
        mandal: document.getElementById("custMandal").value.trim(),
        district: document.getElementById("custDistrict").value.trim(),
        state: document.getElementById("custState").value.trim(),
        pin: document.getElementById("custPin").value.trim()
      },
      items: items,
      total: total
    });

    items.forEach(function (item) {
      var product = S.getProduct(item.id);
      if (product) {
        S.updateProduct({
          id: product.id,
          stock: Math.max(0, (Number(product.stock) || 0) - item.qty)
        });
      }
    });

    this.reset();
    S.clearCart();
    renderCart();
    closeCart();

    document.getElementById("checkoutForm").hidden = true;
    document.getElementById("checkoutTitle").hidden = true;
    document.querySelector(".modal-sub").hidden = true;
    document.getElementById("orderRef").textContent = order.id;
    document.getElementById("orderSuccess").hidden = false;
  });

  document.getElementById("doneOrder").addEventListener("click", function () {
    closeCheckout();
    resetCheckoutView();
  });

  document.querySelector(".search-toggle").addEventListener("click", function () {
    var wrap = document.getElementById("mobileSearchWrap");
    wrap.hidden = !wrap.hidden;
    if (!wrap.hidden) wrap.querySelector("input").focus();
  });

  document.getElementById("headerSearch").addEventListener("input", function () {
    state.search = this.value.trim();
    state.category = "All";
    searchInput.value = this.value;
    renderChips();
    renderProducts();
    document.getElementById("products").scrollIntoView({ behavior: "smooth" });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!checkoutModal.hidden) closeCheckout();
    else if (drawer.classList.contains("open")) closeCart();
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  window.addEventListener("mimk:storage-sync", function () {
    renderProducts();
    renderCart();
  });

  renderCategories();
  renderChips();
  renderProducts();
  renderCart();
})();
