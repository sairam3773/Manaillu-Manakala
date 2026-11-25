/* Admin authentication and product management for MiMk. */

(function () {
  "use strict";

  var S = window.MimkStore;
  var editingId = null;
  var pendingImage = "";

  var loginScreen = document.getElementById("loginScreen");
  var adminShell = document.getElementById("adminShell");
  var productForm = document.getElementById("productForm");
  var pName = document.getElementById("pName");
  var pCategory = document.getElementById("pCategory");
  var pPrice = document.getElementById("pPrice");
  var pStock = document.getElementById("pStock");
  var pDescription = document.getElementById("pDescription");
  var pFile = document.getElementById("pFile");
  var pImageUrl = document.getElementById("pImageUrl");
  var pFeatured = document.getElementById("pFeatured");
  var pActive = document.getElementById("pActive");
  var preview = document.getElementById("imagePreview");
  var previewImg = document.getElementById("previewImg");
  var adminSearch = document.getElementById("adminSearch");

  function showAdmin() {
    loginScreen.hidden = true;
    adminShell.hidden = false;
    renderAll();
  }

  function showLogin() {
    adminShell.hidden = true;
    loginScreen.hidden = false;
    document.getElementById("loginError").hidden = true;
    document.getElementById("adminPass").value = "";
  }

  // ---- Navigation ----
  function goTo(view) {
    var titles = { overview: "Overview", products: "Products", orders: "Orders", add: "Add product" };
    ["overview", "products", "orders", "add"].forEach(function (name) {
      var el = document.getElementById("view-" + name);
      if (el) el.hidden = name !== view;
    });
    document.querySelectorAll(".admin-nav-item").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-view") === view);
    });
    var title = document.getElementById("viewTitle");
    if (title) title.textContent = titles[view] || "Overview";
    document.querySelector(".admin-sidebar").classList.remove("open");
    if (view === "overview") renderAll();
    if (view === "products") renderProductsTable();
    if (view === "orders") renderOrders();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".admin-nav-item").forEach(function (btn) {
    btn.addEventListener("click", function () { goTo(btn.getAttribute("data-view")); });
  });
  document.querySelectorAll("[data-go]").forEach(function (btn) {
    btn.addEventListener("click", function () { goTo(btn.getAttribute("data-go")); });
  });

  // ---- Login ----
  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var user = document.getElementById("adminUser").value;
    var pass = document.getElementById("adminPass").value;
    var error = document.getElementById("loginError");
    if (S.login(user, pass)) {
      error.hidden = true;
      this.reset();
      showAdmin();
    } else {
      error.textContent = "Incorrect username or password. Please try again.";
      error.hidden = false;
    }
  });

  document.getElementById("showPass").addEventListener("click", function () {
    var field = document.getElementById("adminPass");
    var reveal = field.type === "password";
    field.type = reveal ? "text" : "password";
    this.textContent = reveal ? "Hide" : "Show";
  });

  document.getElementById("logoutBtn").addEventListener("click", function () {
    S.logout();
    resetForm();
    showLogin();
  });

  document.getElementById("sidebarToggle").addEventListener("click", function () {
    document.querySelector(".admin-sidebar").classList.toggle("open");
  });

  // ---- Category options ----
  function fillCategories() {
    var names = categories();
    pCategory.innerHTML = names.map(function (name) {
      return '<option value="' + S.escapeHtml(name) + '">' + S.escapeHtml(name) + "</option>";
    }).join("");
  }

  function categories() {
    return (window.MIMK_CATEGORIES || []).map(function (c) { return c.name; });
  }

  // ---- Overview + tables ----
  function renderAll() {
    var all = S.getProducts();
    document.getElementById("statProducts").textContent = all.length;
    document.getElementById("statActive").textContent = all.filter(function (p) { return p.active !== false; }).length;
    document.getElementById("statFeatured").textContent = all.filter(function (p) { return p.featured; }).length;
    document.getElementById("statCategories").textContent = new Set(all.map(function (p) { return p.category; })).size;
    document.getElementById("statOrders").textContent = S.getOrders().length;

    var recent = all.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }).slice(0, 5);
    document.getElementById("recentTable").innerHTML = recent.length
      ? recent.map(function (p) { return row(p, false); }).join("")
      : '<tr><td colspan="5" class="table-empty">No products yet. Add your first one!</td></tr>';

    renderProductsTable();
    renderOrders();
  }

  function statusBadges(p) {
    var out = p.active === false
      ? '<span class="badge hidden">Hidden</span>'
      : '<span class="badge live">Live</span>';
    if (p.featured) out += ' <span class="badge star">Featured</span>';
    return out;
  }

  function row(p, actions) {
    return [
      "<tr>",
      '<td><div class="cell-product"><img src="', S.escapeHtml(p.image || S.placeholderImage(p.name)), '" alt="" />',
      "<div><strong>", S.escapeHtml(p.name), "</strong><small>", S.escapeHtml(p.description || ""), "</small></div></div></td>",
      "<td>", S.escapeHtml(p.category), "</td>",
      "<td>", S.money(p.price), "</td>",
      "<td>", p.stock == null ? "-" : p.stock, "</td>",
      "<td>", statusBadges(p), "</td>",
      actions
        ? '<td><div class="row-actions"><button type="button" data-edit="' + S.escapeHtml(p.id) + '">Edit</button>' +
          '<button type="button" class="danger" data-delete="' + S.escapeHtml(p.id) + '">Delete</button></div></td>'
        : "",
      "</tr>"
    ].join("");
  }

  function renderProductsTable() {
    var q = (adminSearch.value || "").trim().toLowerCase();
    var all = S.getProducts().filter(function (p) {
      return !q || (p.name + " " + p.category).toLowerCase().indexOf(q) !== -1;
    });
    var tbody = document.getElementById("productsTable");
    tbody.innerHTML = all.map(function (p) { return row(p, true); }).join("");
    document.getElementById("productsEmpty").hidden = all.length !== 0;
  }

  if (adminSearch) adminSearch.addEventListener("input", renderProductsTable);

  // ---- Orders ----
  function shortAddress(o) {
    var c = o.customer || {};
    return [c.town || o.town, c.mandal, c.district, c.state].filter(Boolean).join(", ");
  }

  function renderOrders() {
    var search = document.getElementById("orderSearch");
    var q = (search.value || "").trim().toLowerCase();
    var orders = S.getOrders().filter(function (o) {
      if (!q) return true;
      var c = o.customer || {};
      return (o.id + " " + (o.name || c.name || "") + " " + (o.whatsapp || c.whatsapp || "") +
        " " + shortAddress(o) + " " + (c.pin || "")).toLowerCase().indexOf(q) !== -1;
    });

    document.getElementById("ordersTable").innerHTML = orders.length
      ? orders.map(function (o) {
        var c = o.customer || {};
        var itemCount = (o.items || []).reduce(function (sum, i) { return sum + i.qty; }, 0);
        return [
          "<tr>",
          "<td><strong>", S.escapeHtml(o.id), "</strong></td>",
          "<td>", S.escapeHtml(o.name || c.name || "-"), "</td>",
          "<td>", S.escapeHtml(o.whatsapp || c.whatsapp || "-"), "</td>",
          "<td>", S.escapeHtml(shortAddress(o) || "-"), "</td>",
          "<td>", itemCount, (itemCount === 1 ? " item" : " items"), "</td>",
          "<td>", S.money(o.total), "</td>",
          "<td>", new Date(o.createdAt).toLocaleString("en-IN"), "</td>",
          '<td><div class="row-actions"><button type="button" data-order="' + S.escapeHtml(o.id) + '">View details</button></div></td>',
          "</tr>"
        ].join("");
      }).join("")
      : '<tr><td colspan="8" class="table-empty">No orders yet. Orders placed on the store will appear here.</td></tr>';

    document.getElementById("ordersEmpty").hidden = orders.length !== 0;
  }

  function openOrder(id) {
    var o = S.getOrders().filter(function (item) { return String(item.id) === String(id); })[0];
    if (!o) return;
    var c = o.customer || {};
    var address = [
      c.door,
      c.street,
      c.town || o.town,
      c.mandal,
      c.district,
      c.state,
      c.pin ? "PIN " + c.pin : ""
    ].filter(Boolean);

    document.getElementById("orderModalRef").textContent = o.id + " \u00b7 placed " + new Date(o.createdAt).toLocaleString("en-IN");
    document.getElementById("orderModalBody").innerHTML = [
      '<div class="order-detail-grid">',
      "<div><span>Customer</span><strong>", S.escapeHtml(o.name || c.name || "-"), "</strong></div>",
      "<div><span>WhatsApp</span><strong>", S.escapeHtml(o.whatsapp || c.whatsapp || "-"), "</strong></div>",
      '<div class="full"><span>Delivery address</span><strong>', S.escapeHtml(address.join(", ")), "</strong></div>",
      "</div>",
      "<h3>Items</h3>",
      '<div class="order-items">',
      (o.items || []).map(function (i) {
        return "<div><span>", S.escapeHtml(i.name), " &times; ", i.qty, "</span><strong>", S.money(i.price * i.qty), "</strong></div>";
      }).join(""),
      "</div>",
      '<div class="order-total">Total <strong>', S.money(o.total), "</strong></div>",
      '<p class="order-status">Status: <strong>', S.escapeHtml(o.status || "New"), "</strong></p>"
    ].join("");
    document.getElementById("orderModal").hidden = false;
  }

  function closeOrder() { document.getElementById("orderModal").hidden = true; }

  document.getElementById("orderSearch").addEventListener("input", renderOrders);

  document.getElementById("ordersTable").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-order]");
    if (btn) openOrder(btn.getAttribute("data-order"));
  });

  document.getElementById("closeOrderModal").addEventListener("click", closeOrder);
  document.getElementById("doneOrderModal").addEventListener("click", closeOrder);
  document.getElementById("orderModal").addEventListener("click", function (e) {
    if (e.target === this) closeOrder();
  });

  document.getElementById("productsTable").addEventListener("click", function (e) {
    var edit = e.target.closest("[data-edit]");
    var del = e.target.closest("[data-delete]");
    if (edit) {
      var product = S.getProduct(edit.getAttribute("data-edit"));
      if (product) startEdit(product);
    }
    if (del) {
      var target = S.getProduct(del.getAttribute("data-delete"));
      if (target && window.confirm('Delete "' + target.name + '" from the store?')) {
        S.deleteProduct(target.id);
        renderAll();
        S.toast("Product deleted", "adminToast");
      }
    }
  });

  // ---- Image handling ----
  function imageMode() {
    var checked = productForm.querySelector('input[name="imageMode"]:checked');
    return checked ? checked.value : "upload";
  }

  function showPreview(src) {
    if (!src) { preview.hidden = true; return; }
    previewImg.src = src;
    preview.hidden = false;
  }

  function syncImageFields() {
    var mode = imageMode();
    document.getElementById("uploadWrap").hidden = mode !== "upload";
    document.getElementById("urlWrap").hidden = mode !== "url";
    if (mode === "upload") {
      pendingImage = "";
      showPreview("");
    } else {
      pImageUrl.value = pendingImage && /^https?:\/\//i.test(pendingImage) ? pendingImage : "";
      showPreview(pendingImage);
    }
  }

  productForm.querySelectorAll('input[name="imageMode"]').forEach(function (radio) {
    radio.addEventListener("change", syncImageFields);
  });

  pFile.addEventListener("change", function () {
    var file = this.files && this.files[0];
    if (!file) return;
    S.resizeImage(file).then(function (dataUrl) {
      pendingImage = dataUrl;
      showPreview(dataUrl);
    }).catch(function (err) {
      S.toast(err.message, "adminToast");
    });
  });

  pImageUrl.addEventListener("input", function () {
    var value = this.value.trim();
    pendingImage = /^https?:\/\//i.test(value) ? value : "";
    showPreview(pendingImage);
  });

  // ---- Add / edit form ----
  function startEdit(p) {
    editingId = p.id;
    pendingImage = p.image || "";
    document.getElementById("formTitle").textContent = "Edit product";
    document.getElementById("saveBtn").textContent = "Update product";
    document.getElementById("cancelEdit").hidden = false;
    document.getElementById("productId").value = p.id;
    pName.value = p.name;
    pCategory.value = categories().indexOf(p.category) !== -1 ? p.category : categories()[0];
    pPrice.value = p.price;
    pStock.value = p.stock == null ? 1 : p.stock;
    pDescription.value = p.description || "";
    pFeatured.checked = Boolean(p.featured);
    pActive.checked = p.active !== false;
    var urlMode = productForm.querySelector('input[name="imageMode"][value="url"]');
    urlMode.checked = true;
    syncImageFields();
    goTo("add");
  }

  function resetForm() {
    editingId = null;
    pendingImage = "";
    productForm.reset();
    document.getElementById("formTitle").textContent = "Add a product";
    document.getElementById("saveBtn").textContent = "Save product";
    document.getElementById("cancelEdit").hidden = true;
    document.getElementById("productId").value = "";
    showPreview("");
    syncImageFields();
  }

  document.getElementById("cancelEdit").addEventListener("click", function () {
    resetForm();
    goTo("products");
  });

  document.getElementById("resetBtn").addEventListener("click", function () {
    window.setTimeout(function () { pendingImage = ""; showPreview(""); syncImageFields(); }, 0);
  });

  productForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var mode = imageMode();
    var image = pendingImage;
    if (!image) image = S.placeholderImage(pName.value || "MiMk");

    var product = {
      name: pName.value.trim(),
      category: pCategory.value,
      price: Number(pPrice.value),
      stock: Math.max(0, Number(pStock.value)),
      description: pDescription.value.trim(),
      image: image,
      featured: pFeatured.checked,
      active: pActive.checked
    };

    var existing = editingId ? S.getProduct(editingId) : null;
    if (existing) {
      product.id = existing.id;
      product.createdAt = existing.createdAt;
      S.updateProduct(product);
      S.toast("Product updated", "adminToast");
    } else {
      S.addProduct(product);
      S.toast("Product added to your store", "adminToast");
    }

    resetForm();
    renderAll();
    goTo("products");
  });

  window.addEventListener("mimk:storage-sync", function () {
    if (S.isLoggedIn() && !adminShell.hidden) renderAll();
  });

  document.getElementById("fileModeTip").hidden = /^https?:$/.test(window.location.protocol);

  fillCategories();
  resetForm();

  if (S.isLoggedIn()) showAdmin();
  else showLogin();
})();
