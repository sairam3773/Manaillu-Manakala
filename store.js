/* Shared storage, helpers and fake-but-simple admin session for MiMk. */

(function () {
  "use strict";

  var KEYS = {
    products: "mimk_products_v1",
    cart: "mimk_cart_v1",
    orders: "mimk_orders_v1",
    session: "mimk_admin_session"
  };

  var ADMIN = { username: "admin", password: "Deepika@2006" };
  var memory = {};
  var useApi = /^https?:$/.test(window.location.protocol);

  // When served through server.py, both pages share one origin and one data.json.
  // Directly from disk, each page falls back to its own localStorage.
  function parsedArray(key) {
    try {
      var value = JSON.parse(read(key));
      return Array.isArray(value) ? value : [];
    } catch (err) {
      return [];
    }
  }

  function normalizeProducts(list) {
    var changed = false;
    list.forEach(function (product) {
      if (product && product.stock == null) { product.stock = 10; changed = true; }
    });
    return changed;
  }

  function applyServerState(data) {
    var changed = false;
    var map = { products: KEYS.products, cart: KEYS.cart, orders: KEYS.orders };
    Object.keys(map).forEach(function (name) {
      if (!Array.isArray(data[name])) return;
      if (name === "products") normalizeProducts(data[name]);
      var serialized = JSON.stringify(data[name]);
      if (serialized !== memory[map[name]]) {
        memory[map[name]] = serialized;
        try { window.localStorage.setItem(map[name], serialized); } catch (err) { /* ignore */ }
        changed = true;
      }
    });
    if (changed) window.dispatchEvent(new CustomEvent("mimk:storage-sync"));
  }

  function apiSave() {
    if (!useApi) return;
    var payload = {
      products: parsedArray(KEYS.products),
      cart: parsedArray(KEYS.cart),
      orders: parsedArray(KEYS.orders)
    };
    window.fetch("api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(function () { /* server unavailable */ });
  }

  function apiLoad() {
    if (!useApi) return;
    window.fetch("api/data", { cache: "no-store" })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        var local = {
          products: parsedArray(KEYS.products),
          cart: parsedArray(KEYS.cart),
          orders: parsedArray(KEYS.orders)
        };
        var pushedLocal = false;
        ["products", "cart", "orders"].forEach(function (name) {
          if ((!data[name] || !data[name].length) && local[name].length) {
            data[name] = local[name];
            pushedLocal = true;
          }
        });
        applyServerState(data);
        if (pushedLocal) apiSave();
      })
      .catch(function () { /* server unavailable */ });
  }

  function read(key) {
    if (Object.prototype.hasOwnProperty.call(memory, key)) return memory[key];
    try {
      var value = window.localStorage.getItem(key);
      if (value !== null) { memory[key] = value; return value; }
    } catch (err) { /* storage unavailable */ }
    return null;
  }

  function write(key, value) {
    memory[key] = value;
    try { window.localStorage.setItem(key, value); } catch (err) { /* storage unavailable */ }
    apiSave();
  }

  function readJSON(key, fallback) {
    var raw = read(key);
    if (!raw) return fallback;
    try {
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) { write(key, JSON.stringify(value)); }

  function getProducts() {
    var stored = readJSON(KEYS.products, null);
    if (!Array.isArray(stored) || stored.length === 0) {
      stored = (window.MIMK_SEED_PRODUCTS || []).slice();
      writeJSON(KEYS.products, stored);
    }
    if (normalizeProducts(stored)) writeJSON(KEYS.products, stored);
    return stored;
  }

  function saveProducts(list) { writeJSON(KEYS.products, list); }

  function getProduct(id) {
    var all = getProducts();
    for (var i = 0; i < all.length; i += 1) {
      if (String(all[i].id) === String(id)) return all[i];
    }
    return null;
  }

  function addProduct(product) {
    var all = getProducts();
    product.id = "p-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    product.createdAt = Date.now();
    product.stock = Math.max(0, Number(product.stock) || 0);
    all.unshift(product);
    saveProducts(all);
    return product;
  }

  function updateProduct(product) {
    var all = getProducts();
    product.stock = Math.max(0, Number(product.stock) || 0);
    for (var i = 0; i < all.length; i += 1) {
      if (String(all[i].id) === String(product.id)) {
        all[i] = Object.assign({}, all[i], product);
        break;
      }
    }
    saveProducts(all);
    return product;
  }

  function deleteProduct(id) {
    saveProducts(getProducts().filter(function (p) { return String(p.id) !== String(id); }));
    var cart = getCart().filter(function (item) { return String(item.id) !== String(id); });
    writeJSON(KEYS.cart, cart);
  }

  function getCart() {
    var cart = readJSON(KEYS.cart, []);
    return Array.isArray(cart) ? cart : [];
  }

  function saveCart(cart) { writeJSON(KEYS.cart, cart); }

  function stockLimit(id) {
    var product = getProduct(id);
    return product && product.stock != null ? Math.max(0, Number(product.stock)) : 99;
  }

  function addToCart(id, qty) {
    var cart = getCart();
    var limit = stockLimit(id);
    if (limit < 1) return cart;
    var amount = qty || 1;
    var found = false;
    cart.forEach(function (item) {
      if (String(item.id) === String(id)) {
        item.qty = Math.min(limit, item.qty + amount);
        found = true;
      }
    });
    if (!found) cart.push({ id: String(id), qty: Math.min(limit, amount) });
    saveCart(cart);
    return cart;
  }

  function setQty(id, qty) {
    var limit = stockLimit(id);
    var cart = getCart().map(function (item) {
      if (String(item.id) === String(id)) item.qty = Math.min(limit, Number(qty));
      return item;
    }).filter(function (item) { return item.qty > 0; });
    saveCart(cart);
    return cart;
  }

  function removeFromCart(id) {
    saveCart(getCart().filter(function (item) { return String(item.id) !== String(id); }));
    return getCart();
  }

  function clearCart() { saveCart([]); }

  function getOrders() {
    var orders = readJSON(KEYS.orders, []);
    return Array.isArray(orders) ? orders : [];
  }

  function saveOrders(orders) { writeJSON(KEYS.orders, orders); }

  function addOrder(order) {
    var orders = getOrders();
    order.id = "MiMk-" + String(Date.now()).slice(-8);
    order.createdAt = Date.now();
    order.status = "New";
    orders.unshift(order);
    saveOrders(orders);
    return order;
  }

  function cartCount() {
    return getCart().reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function cartTotal() {
    return getCart().reduce(function (sum, item) {
      var product = getProduct(item.id);
      return sum + (product ? Number(product.price) * item.qty : 0);
    }, 0);
  }

  function login(username, password) {
    if (String(username).trim() === ADMIN.username && password === ADMIN.password) {
      try { window.sessionStorage.setItem(KEYS.session, "1"); }
      catch (err) { memory[KEYS.session] = "1"; }
      return true;
    }
    return false;
  }

  function isLoggedIn() {
    try { return window.sessionStorage.getItem(KEYS.session) === "1"; }
    catch (err) { return memory[KEYS.session] === "1"; }
  }

  function logout() {
    try { window.sessionStorage.removeItem(KEYS.session); }
    catch (err) { delete memory[KEYS.session]; }
  }

  function money(value) {
    return "\u20B9" + Number(value || 0).toLocaleString("en-IN");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function placeholderImage(name) {
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' +
      '<rect width="400" height="400" fill="#efe4d4"/>' +
      '<text x="200" y="210" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#812f29">MiMk</text>' +
      '</svg>'
    );
  }

  // Resize uploaded images before storing them so localStorage does not fill up.
  function resizeImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || file.type.indexOf("image/") !== 0) {
        reject(new Error("Please choose an image file."));
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("Could not read that file.")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("Could not open that image.")); };
        img.onload = function () {
          var max = 900;
          var scale = Math.min(1, max / Math.max(img.width, img.height));
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          var ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function toast(message, elementId) {
    var el = document.getElementById(elementId || "toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    window.clearTimeout(el._timer);
    el._timer = window.setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  [KEYS.products, KEYS.cart, KEYS.orders].forEach(read);
  getProducts();
  apiLoad();

  window.MimkStore = {
    KEYS: KEYS,
    ADMIN_USER: ADMIN.username,
    getProducts: getProducts,
    saveProducts: saveProducts,
    getProduct: getProduct,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    setQty: setQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    getOrders: getOrders,
    saveOrders: saveOrders,
    addOrder: addOrder,
    cartCount: cartCount,
    cartTotal: cartTotal,
    login: login,
    isLoggedIn: isLoggedIn,
    logout: logout,
    money: money,
    escapeHtml: escapeHtml,
    placeholderImage: placeholderImage,
    resizeImage: resizeImage,
    toast: toast
  };
})();
