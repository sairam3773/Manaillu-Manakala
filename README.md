# Mana Illu Mana Kala (MiMk)

A responsive e-commerce storefront with a protected admin panel for adding products.

## Run it

**Recommended:** double-click `start-site.bat`, then use:

- Storefront: `http://localhost:8000/index.html`
- Admin panel: `http://localhost:8000/admin.html`

Or run `python server.py` manually. The small server keeps products, cart and orders in `data.json`, so orders placed on the storefront appear in **Admin → Orders**.

You can also open `index.html` directly, but browsers give each local file its own storage; in that mode orders will not carry over to `admin.html`.

## Admin login

| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `Deepika@2006` |

Only the admin can add, edit or delete products. Those changes appear on the storefront immediately.

## What is included

- Product catalogue with 12 sample art/craft products
- Category browsing, search, sorting and product filters
- Shopping cart with quantity controls and a demo checkout flow
- Admin dashboard with product stats, product table, add/edit/delete
- Image upload (auto-resized) or image URL for product photos
- Your logo at `assets/logo.jpg` used in the header, footer, login and favicon

## Good to know

- Products, cart and orders are saved in `data.json` when you use the local server. The admin session stays in `sessionStorage` and ends when the browser tab closes.
- Checkout collects full delivery details (door/apartment, street, village/town, mandal, district, state, PIN and WhatsApp number). No payment is taken; after submitting, the customer sees “we will contact you in whatsapp” and the order appears under **Admin → Orders**.
- The credentials above live in `js/store.js`. This client-side login is suitable for a demo/local site only.
  Before putting the site online, move authentication and product data to a real backend.
- Replace the sample products in `js/data.js` or clear browser storage to start with an empty catalogue.
