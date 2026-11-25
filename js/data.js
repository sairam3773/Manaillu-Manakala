/* Static catalogue data and decorative placeholder artwork for MiMk. */

(function () {
  "use strict";

  // Decorative SVG used as a stand-in until a real product photo is uploaded.
  function artwork(text, from, to, accent) {
    var safe = String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">',
      '<defs>',
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0" stop-color="' + from + '"/>',
      '<stop offset="1" stop-color="' + to + '"/>',
      '</linearGradient>',
      '<pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse">',
      '<circle cx="22" cy="22" r="3" fill="' + accent + '" opacity="0.28"/>',
      '<path d="M0 22h44M22 0v44" stroke="' + accent + '" stroke-width="0.5" opacity="0.16"/>',
      '</pattern>',
      '</defs>',
      '<rect width="600" height="600" fill="url(#g)"/>',
      '<rect width="600" height="600" fill="url(#p)"/>',
      '<circle cx="300" cy="268" r="150" fill="none" stroke="' + accent + '" stroke-width="2" opacity="0.55"/>',
      '<circle cx="300" cy="268" r="126" fill="none" stroke="' + accent + '" stroke-width="1" opacity="0.4"/>',
      '<path d="M300 128v280M160 268h280" stroke="' + accent + '" stroke-width="1" opacity="0.32"/>',
      '<text x="300" y="272" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="' + accent + '">' + safe + '</text>',
      '<text x="300" y="312" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" letter-spacing="5" fill="' + accent + '" opacity="0.8">MIMK</text>',
      '<rect x="24" y="24" width="552" height="552" fill="none" stroke="' + accent + '" stroke-width="2" opacity="0.35"/>',
      '</svg>'
    ].join("");
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  window.MIMK_CATEGORIES = [
    { name: "Paintings", icon: "\u{1F3A8}", note: "Walls with a story" },
    { name: "Home Decor", icon: "\u{1F3E1}", note: "Warm little corners" },
    { name: "Jewellery", icon: "\u{1F48D}", note: "Wearable art" },
    { name: "Textiles", icon: "\u{1F9F6}", note: "Woven by hand" },
    { name: "Pottery", icon: "\u{1F3FA}", note: "Earth and fire" },
    { name: "Gifts", icon: "\u{1F381}", note: "Thoughtful finds" }
  ];

  window.MIMK_SEED_PRODUCTS = [
    {
      id: "seed-1",
      name: "Warli Harvest Wall Plate",
      category: "Paintings",
      price: 1499,
      description: "Hand-painted tribal motifs on a terracotta plate, ready to hang.",
      image: artwork("Warli", "#b8543f", "#7c2d27", "#ffe9c8"),
      featured: true,
      stock: 10,
      active: true,
      createdAt: 1706000000000
    },
    {
      id: "seed-2",
      name: "Brass Diya Pair",
      category: "Home Decor",
      price: 899,
      description: "A pair of polished brass lamps for festivals and quiet evenings.",
      image: artwork("Brass", "#c99a4e", "#8b5e22", "#fff3d2"),
      featured: true,
      stock: 10,
      active: true,
      createdAt: 1706100000000
    },
    {
      id: "seed-3",
      name: "Kalamkari Silk Scarf",
      category: "Textiles",
      price: 2199,
      description: "Soft silk with hand-block floral prints in earthy, festive tones.",
      image: artwork("Kalamkari", "#7a8f5c", "#3f5d3c", "#f4e8c8"),
      featured: true,
      stock: 10,
      active: true,
      createdAt: 1706200000000
    },
    {
      id: "seed-4",
      name: "Terracotta Planter Set",
      category: "Pottery",
      price: 1199,
      description: "Three rustic planters with a natural clay finish and drainage holes.",
      image: artwork("Clay", "#c0785a", "#8a4a34", "#f8e4d0"),
      featured: false,
      stock: 10,
      active: true,
      createdAt: 1706300000000
    },
    {
      id: "seed-5",
      name: "Oxidised Silver Jhumkas",
      category: "Jewellery",
      price: 1350,
      description: "Lightweight statement earrings with intricate hand-finished detailing.",
      image: artwork("Jhumka", "#6f6f7a", "#3d3d49", "#e8d9b8"),
      featured: true,
      stock: 10,
      active: true,
      createdAt: 1706400000000
    },
    {
      id: "seed-6",
      name: "Jute Basket with Handle",
      category: "Gifts",
      price: 749,
      description: "A sturdy woven basket that works for flowers, books or little gifts.",
      image: artwork("Jute", "#d3b07a", "#9a7440", "#fff0d0"),
      featured: false,
      stock: 10,
      active: true,
      createdAt: 1706500000000
    },
    {
      id: "seed-7",
      name: "Madhubani Canvas Panel",
      category: "Paintings",
      price: 2899,
      description: "Fine line work and vivid natural pigments on a stretched canvas.",
      image: artwork("Madhubani", "#a8435c", "#5e2237", "#ffe0c8"),
      featured: true,
      stock: 10,
      active: true,
      createdAt: 1706600000000
    },
    {
      id: "seed-8",
      name: "Hand-carved Wooden Tray",
      category: "Home Decor",
      price: 1650,
      description: "Mango wood tray with a carved border, perfect for tea service.",
      image: artwork("Wood", "#a57343", "#68421f", "#f6e2c0"),
      featured: false,
      stock: 10,
      active: true,
      createdAt: 1706700000000
    },
    {
      id: "seed-9",
      name: "Block Cotton Cushion Cover",
      category: "Textiles",
      price: 649,
      description: "Breathable cotton with a hand-printed motif in indigo and ivory.",
      image: artwork("Indigo", "#587aa4", "#29466d", "#f0e6d0"),
      featured: false,
      stock: 10,
      active: true,
      createdAt: 1706800000000
    },
    {
      id: "seed-10",
      name: "Glazed Ceramic Coffee Mugs",
      category: "Pottery",
      price: 999,
      description: "Set of two wheel-thrown mugs with a soft, food-safe glaze.",
      image: artwork("Ceramic", "#8ba5a0", "#4d6c68", "#f2f0e2"),
      featured: false,
      stock: 10,
      active: true,
      createdAt: 1706900000000
    },
    {
      id: "seed-11",
      name: "Temple Coin Necklace",
      category: "Jewellery",
      price: 2450,
      description: "Layered gold-toned coins with a traditional temple finish.",
      image: artwork("Temple", "#d2a94e", "#966920", "#fff4d6"),
      featured: false,
      stock: 10,
      active: true,
      createdAt: 1707000000000
    },
    {
      id: "seed-12",
      name: "Festive Gift Hamper Box",
      category: "Gifts",
      price: 1899,
      description: "A reusable keepsake box filled with handmade little surprises.",
      image: artwork("Hamper", "#b5654e", "#7b3a2c", "#ffe9cc"),
      featured: false,
      stock: 10,
      active: true,
      createdAt: 1707100000000
    }
  ];
})();
