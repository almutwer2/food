"use strict";

/*
 * إعدادات شهي — عدّل رقم واتساب المطعم ومعرّفات Sanity قبل الإطلاق.
 * رقم واتساب يجب أن يكون بصيغة دولية، مع رمز الدولة ومن دون علامة +.
 * لا تضع أي Write/Editor Token من Sanity في هذا الملف.
 */
const CONFIG = Object.freeze({
  whatsappNumber: "249XXXXXXXXX", // مثال: 249912345678 — استبدله برقم المطعم الحقيقي
  sanityProjectId: "", // معرّف مشروع Sanity العام، مثل abc123xy
  sanityDataset: "production",
  sanityApiVersion: "2025-05-21",
  deliveryFee: 2500,
  freeDeliveryThreshold: 30000,
  promoCode: "SHAHI10",
  promoPercent: 10,
  maximumQuantity: 99,
});

const CATEGORY_LABELS = Object.freeze({
  mains: "الأطباق الرئيسية",
  sides: "المقبلات",
  drinks: "المشروبات",
  dessert: "التحلية",
});
const CATEGORY_ORDER = ["mains", "sides", "drinks", "dessert"];
const FALLBACK_IMAGE = "images/hero-feast.jpg";
const CART_STORAGE_KEY = "shehi-cart-v1";

const DEMO_PRODUCTS = [
  {
    _id: "tawook",
    name: "طاووق على الفحم",
    description: "دجاج طري بتتبيلة شهي، مع أرز عطري وصلصة الثوم.",
    price: 14500,
    categorySlug: "mains",
    categoryName: "الأطباق الرئيسية",
    imageUrl: "images/hero-feast.jpg",
    badge: "الأكثر طلبًا",
  },
  {
    _id: "smash-burger",
    name: "برجر شهي",
    description: "قطعتان لحم مشوي، جبنة ذايبة، وصوصنا الخاص.",
    price: 16500,
    categorySlug: "mains",
    categoryName: "الأطباق الرئيسية",
    imageUrl: "images/smash-burger.jpg",
    badge: "اختيار الشيف",
  },
  {
    _id: "chicken-fatteh",
    name: "فتّة دجاج بيتية",
    description: "خبز محمّص وأرز ودجاج، مع صوص الثوم والمكسرات.",
    price: 13500,
    categorySlug: "mains",
    categoryName: "الأطباق الرئيسية",
    imageUrl: "images/fattah.jpg",
    badge: "وصفة بيتية",
  },
  {
    _id: "family-feast",
    name: "صحن اللّمة",
    description: "تشكيلة مشاوي وأرز تكفي لمة الأهل والأصحاب.",
    price: 36000,
    categorySlug: "mains",
    categoryName: "الأطباق الرئيسية",
    imageUrl: "images/hero-feast.jpg",
    badge: "يكفي ٣–٤ أشخاص",
  },
  {
    _id: "lemon-mint",
    name: "ليمون بالنعناع",
    description: "ليمون طازج ونعناع أخضر، منعش من أول رشفة.",
    price: 4500,
    categorySlug: "drinks",
    categoryName: "المشروبات",
    imageUrl: "images/lemon-mint.jpg",
    badge: "منعش",
  },
  {
    _id: "kunafa",
    name: "كنافة بالقشطة",
    description: "كنافة ذهبية، قشطة ناعمة، ورشة فستق.",
    price: 8500,
    categorySlug: "dessert",
    categoryName: "التحلية",
    imageUrl: "images/kunafa.jpg",
    badge: "حلو اليوم",
  },
];

const elements = {
  categoryTabs: document.getElementById("categoryTabs"),
  menuGrid: document.getElementById("menuGrid"),
  menuCount: document.getElementById("menuCount"),
  menuStatus: document.getElementById("menuStatus"),
  freeDeliveryThresholdBanner: document.getElementById("freeDeliveryThresholdBanner"),
  cartFreeDeliveryHint: document.getElementById("cartFreeDeliveryHint"),
  menuSearch: document.getElementById("menuSearch"),
  clearSearch: document.getElementById("clearSearch"),
  noResults: document.getElementById("noResults"),
  resetFilters: document.getElementById("resetFilters"),
  headerCartCount: document.getElementById("headerCartCount"),
  openCart: document.getElementById("openCart"),
  closeCart: document.getElementById("closeCart"),
  cartDrawer: document.getElementById("cartDrawer"),
  cartOverlay: document.getElementById("cartOverlay"),
  cartItems: document.getElementById("cartItems"),
  cartEmpty: document.getElementById("cartEmpty"),
  cartExtras: document.getElementById("cartExtras"),
  checkoutForm: document.getElementById("checkoutForm"),
  checkoutButton: document.getElementById("checkoutButton"),
  cartSubtotal: document.getElementById("cartSubtotal"),
  cartDiscount: document.getElementById("cartDiscount"),
  discountLine: document.getElementById("discountLine"),
  cartDelivery: document.getElementById("cartDelivery"),
  cartTotal: document.getElementById("cartTotal"),
  deliveryProgressText: document.getElementById("deliveryProgressText"),
  deliveryProgressAmount: document.getElementById("deliveryProgressAmount"),
  deliveryProgressFill: document.getElementById("deliveryProgressFill"),
  promoCode: document.getElementById("promoCode"),
  applyPromo: document.getElementById("applyPromo"),
  promoMessage: document.getElementById("promoMessage"),
  customerName: document.getElementById("customerName"),
  customerPhone: document.getElementById("customerPhone"),
  customerAddress: document.getElementById("customerAddress"),
  orderNotes: document.getElementById("orderNotes"),
  mobileCartBar: document.getElementById("mobileCartBar"),
  mobileCartButton: document.getElementById("mobileCartButton"),
  mobileCartCount: document.getElementById("mobileCartCount"),
  mobileCartTotal: document.getElementById("mobileCartTotal"),
  toast: document.getElementById("toast"),
  currentYear: document.getElementById("currentYear"),
};

let products = DEMO_PRODUCTS.map(normalizeProduct).filter(Boolean);
let selectedCategory = "all";
let searchTerm = "";
let promoApplied = false;
let cart = loadCart();
let toastTimer = 0;
let lastFocusedElement = null;

function normalizeProduct(item) {
  if (!item || typeof item !== "object") return null;

  const id = String(item._id ?? item.id ?? "").trim();
  const name = String(item.name ?? "").trim();
  const price = Number(item.price?.amount ?? item.price);
  if (!id || !name || !Number.isFinite(price) || price < 0) return null;

  const sourceCategory = item.category && typeof item.category === "object" ? item.category : {};
  const rawCategory = item.categorySlug ?? sourceCategory.slug?.current ?? sourceCategory.slug ?? (typeof item.category === "string" ? item.category : "");
  const categorySlug = String(rawCategory || "mains").trim().toLowerCase();
  const categoryName = String(item.categoryName ?? sourceCategory.name ?? sourceCategory.title ?? CATEGORY_LABELS[categorySlug] ?? "أطباقنا").trim();
  const imageUrl = item.imageUrl ?? item.image?.asset?.url ?? item.image ?? FALLBACK_IMAGE;

  return {
    id,
    name,
    description: String(item.description ?? "").trim(),
    price: Math.round(price * 100) / 100,
    categorySlug,
    categoryName,
    imageUrl: typeof imageUrl === "string" ? imageUrl : FALLBACK_IMAGE,
    imageAlt: String(item.imageAlt ?? item.image?.alt ?? name),
    badge: String(item.badge ?? "").trim(),
    available: item.available !== false && item.isAvailable !== false,
  };
}

function toCents(amount) {
  const number = Number(amount);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number * 100);
}

function formatAmount(cents) {
  const safeCents = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
  const fixedAmount = (safeCents / 100).toFixed(2);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(fixedAmount));
}

function formatCurrency(cents) {
  return `${formatAmount(cents)} ج.س`;
}

function formatArabicNumber(number) {
  return new Intl.NumberFormat("ar-SD", { maximumFractionDigits: 0 }).format(number);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function safeImageURL(value) {
  const source = String(value ?? "").trim();
  if (!source) return FALLBACK_IMAGE;
  if (/^(\.\/)?images\//i.test(source)) return source;

  try {
    const parsed = new URL(source, window.location.href);
    if (parsed.protocol === "https:") return parsed.href;
    if (parsed.protocol === "http:" && parsed.origin === window.location.origin) return parsed.href;
  } catch (_error) {
    // A broken image URL falls back to a local, bundled photo.
  }
  return FALLBACK_IMAGE;
}

function loadCart() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
    return Object.fromEntries(Object.entries(stored)
      .map(([id, quantity]) => [String(id), Math.max(0, Math.min(CONFIG.maximumQuantity, Math.floor(Number(quantity))))])
      .filter(([id, quantity]) => id && Number.isFinite(quantity) && quantity > 0));
  } catch (_error) {
    return {};
  }
}

function saveCart() {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (_error) {
    // The cart remains usable for the current visit if storage is unavailable.
  }
}

function getCartEntries() {
  return Object.entries(cart)
    .map(([id, quantity]) => {
      const product = products.find((candidate) => candidate.id === id && candidate.available);
      const safeQuantity = Math.max(0, Math.min(CONFIG.maximumQuantity, Math.floor(Number(quantity))));
      return product && safeQuantity > 0 ? { product, quantity: safeQuantity } : null;
    })
    .filter(Boolean);
}

function getCartTotals(entries = getCartEntries()) {
  const subtotalCents = entries.reduce((total, entry) => total + toCents(entry.product.price) * entry.quantity, 0);
  const discountCents = promoApplied ? Math.round((subtotalCents * CONFIG.promoPercent) / 100) : 0;
  const thresholdCents = toCents(CONFIG.freeDeliveryThreshold);
  const deliveryCents = subtotalCents > 0 && subtotalCents < thresholdCents ? toCents(CONFIG.deliveryFee) : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents + deliveryCents);
  return { subtotalCents, discountCents, deliveryCents, totalCents, thresholdCents };
}

function normalizeForSearch(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

function categoryLabel(slug, fallback = "أطباقنا") {
  return CATEGORY_LABELS[slug] || fallback || "أطباقنا";
}

function renderCategoryTabs() {
  const known = CATEGORY_ORDER.filter((slug) => products.some((product) => product.categorySlug === slug));
  const custom = [...new Set(products.map((product) => product.categorySlug))]
    .filter((slug) => slug && slug !== "all" && !CATEGORY_ORDER.includes(slug));
  const categories = ["all", ...known, ...custom];
  if (!categories.includes(selectedCategory)) selectedCategory = "all";

  elements.categoryTabs.innerHTML = categories.map((slug) => {
    const label = slug === "all"
      ? "كل الأطباق"
      : categoryLabel(slug, products.find((product) => product.categorySlug === slug)?.categoryName);
    const active = selectedCategory === slug;
    return `<button class="category-tab${active ? " is-active" : ""}" type="button" data-category="${escapeHTML(slug)}" aria-pressed="${active}">${escapeHTML(label)}</button>`;
  }).join("");
}

function getFilteredProducts() {
  const normalizedSearch = normalizeForSearch(searchTerm);
  return products.filter((product) => {
    if (!product.available) return false;
    if (selectedCategory !== "all" && product.categorySlug !== selectedCategory) return false;
    if (!normalizedSearch) return true;
    const searchable = normalizeForSearch(`${product.name} ${product.description} ${product.categoryName}`);
    return searchable.includes(normalizedSearch);
  });
}

function renderProducts() {
  const filtered = getFilteredProducts();
  elements.menuCount.textContent = `عرض ${formatArabicNumber(filtered.length)} من الأطباق`;
  elements.noResults.hidden = filtered.length > 0;
  elements.menuGrid.hidden = filtered.length === 0;

  if (!filtered.length) {
    elements.menuGrid.innerHTML = "";
    return;
  }

  elements.menuGrid.innerHTML = filtered.map((product) => {
    const image = escapeHTML(safeImageURL(product.imageUrl));
    const alt = escapeHTML(product.imageAlt || product.name);
    const badge = product.badge ? `<span class="food-badge">${escapeHTML(product.badge)}</span>` : "";
    const price = formatAmount(toCents(product.price));
    const category = categoryLabel(product.categorySlug, product.categoryName);
    return `
      <article class="food-card">
        <div class="food-card-image-wrap">
          <img class="food-card-image" src="${image}" alt="${alt}" loading="lazy" decoding="async" />
          ${badge}
        </div>
        <div class="food-card-content">
          <div class="food-card-heading">
            <div><h3>${escapeHTML(product.name)}</h3><div class="food-card-category">${escapeHTML(category)}</div></div>
          </div>
          <p class="food-card-description">${escapeHTML(product.description)}</p>
          <div class="food-card-footer">
            <span class="food-price" dir="ltr">${price}<small> ج.س</small></span>
            <button class="add-button" type="button" data-add-to-cart="${escapeHTML(product.id)}" aria-label="أضف ${escapeHTML(product.name)} إلى السلة">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
              <span>أضف</span>
            </button>
          </div>
        </div>
      </article>`;
  }).join("");
}

function setMenuStatus(message = "", state = "") {
  elements.menuStatus.textContent = message;
  elements.menuStatus.classList.toggle("is-loading", state === "loading");
}

async function fetchSanityProducts() {
  const projectId = String(CONFIG.sanityProjectId).trim();
  const dataset = String(CONFIG.sanityDataset).trim();
  if (!/^[a-z0-9-]{6,32}$/i.test(projectId) || !/^[a-z0-9_-]+$/i.test(dataset)) return null;

  const query = `*[_type == "product" && coalesce(isAvailable, true) == true && defined(name) && defined(price)] | order(order asc) { _id, name, description, price, badge, "imageUrl": image.asset->url, "imageAlt": image.alt, "category": category->{"name": title, "slug": slug.current} }`;
  const endpoint = `https://${projectId}.api.sanity.io/v${encodeURIComponent(CONFIG.sanityApiVersion)}/data/query/${encodeURIComponent(dataset)}?query=${encodeURIComponent(query)}&perspective=published`;
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Sanity responded with ${response.status}`);

  const payload = await response.json();
  if (!Array.isArray(payload.result)) throw new Error("Unexpected Sanity response");
  return payload.result.map(normalizeProduct).filter((product) => product && product.available);
}

async function loadCatalog() {
  renderCategoryTabs();
  renderProducts();
  renderCart();

  if (!/^[a-z0-9-]{6,32}$/i.test(String(CONFIG.sanityProjectId).trim())) return;

  setMenuStatus("لحظة ونجهّز لك قائمة اليوم...", "loading");
  try {
    const remoteProducts = await fetchSanityProducts();
    if (remoteProducts?.length) {
      products = remoteProducts;
      const availableIds = new Set(products.map((product) => product.id));
      cart = Object.fromEntries(Object.entries(cart).filter(([id]) => availableIds.has(id)));
      saveCart();
      setMenuStatus("قائمة اليوم محدّثة من مطبخ شهي.");
    } else {
      setMenuStatus("القائمة المحدثة غير متاحة الآن؛ نعرض أطباق اليوم.");
    }
  } catch (error) {
    console.warn("Could not load the public Sanity catalog; keeping the local menu.", error);
    setMenuStatus("تعذّر تحديث القائمة الآن؛ نعرض أطباق اليوم.");
  }

  renderCategoryTabs();
  renderProducts();
  renderCart();
}

function showToast(message, type = "success", duration = 2600) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", type === "error");
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), duration);
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId && item.available);
  if (!product) {
    showToast("هذا الطبق غير متاح حاليًا.", "error");
    return;
  }
  const current = Number(cart[productId]) || 0;
  if (current >= CONFIG.maximumQuantity) {
    showToast(`الحد الأقصى ${formatArabicNumber(CONFIG.maximumQuantity)} من الطبق الواحد.`, "error");
    return;
  }
  cart[productId] = current + 1;
  saveCart();
  renderCart();
  showToast(`انضاف ${product.name} لسلّتك ✳`);
}

function updateQuantity(productId, nextQuantity) {
  const quantity = Math.floor(Number(nextQuantity));
  if (!Number.isFinite(quantity) || quantity <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = Math.min(CONFIG.maximumQuantity, quantity);
  }
  if (Object.keys(cart).length === 0) promoApplied = false;
  saveCart();
  renderCart();
}

function renderCart() {
  const entries = getCartEntries();
  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const { subtotalCents, discountCents, deliveryCents, totalCents, thresholdCents } = getCartTotals(entries);
  const hasItems = entries.length > 0;

  elements.cartItems.innerHTML = entries.map(({ product, quantity }) => {
    const productId = escapeHTML(product.id);
    const image = escapeHTML(safeImageURL(product.imageUrl));
    const alt = escapeHTML(product.imageAlt || product.name);
    const unitPrice = formatAmount(toCents(product.price));
    const itemTotal = formatAmount(toCents(product.price) * quantity);
    return `
      <article class="cart-item">
        <div class="cart-item-image"><img src="${image}" alt="${alt}" loading="lazy" /></div>
        <div class="cart-item-main">
          <strong>${escapeHTML(product.name)}</strong>
          <span class="cart-item-unit" dir="ltr">${unitPrice} ج.س / للواحد</span>
          <div class="cart-item-controls" aria-label="الكمية">
            <button class="qty-button" type="button" data-quantity-action="decrease" data-product-id="${productId}" aria-label="أنقص ${escapeHTML(product.name)}">−</button>
            <span class="qty-value">${formatArabicNumber(quantity)}</span>
            <button class="qty-button" type="button" data-quantity-action="increase" data-product-id="${productId}" aria-label="زِد ${escapeHTML(product.name)}">+</button>
          </div>
        </div>
        <div class="cart-item-side">
          <strong class="cart-item-total" dir="ltr">${itemTotal} ج.س</strong>
          <button class="remove-item" type="button" data-quantity-action="remove" data-product-id="${productId}" aria-label="احذف ${escapeHTML(product.name)} من السلة">حذف</button>
        </div>
      </article>`;
  }).join("");

  elements.cartEmpty.hidden = hasItems;
  elements.cartItems.hidden = !hasItems;
  elements.cartExtras.hidden = !hasItems;
  elements.checkoutForm.hidden = !hasItems;
  elements.checkoutButton.disabled = !hasItems;
  elements.headerCartCount.textContent = formatArabicNumber(totalQuantity);
  elements.openCart.setAttribute("aria-label", `افتح سلة الطلب، ${formatArabicNumber(totalQuantity)} أصناف`);
  elements.mobileCartBar.hidden = !hasItems;
  elements.mobileCartCount.textContent = `${formatArabicNumber(totalQuantity)} ${totalQuantity === 1 ? "صنف" : "أصناف"}`;
  elements.mobileCartTotal.textContent = formatCurrency(totalCents);
  elements.cartSubtotal.textContent = formatCurrency(subtotalCents);
  elements.cartDiscount.textContent = `− ${formatCurrency(discountCents)}`;
  elements.discountLine.hidden = !promoApplied || !hasItems;
  elements.cartDelivery.textContent = hasItems && deliveryCents === 0 ? "مجاني" : formatCurrency(deliveryCents);
  elements.cartTotal.textContent = formatCurrency(totalCents);

  if (subtotalCents >= thresholdCents && hasItems) {
    elements.deliveryProgressText.textContent = "مبروك! التوصيل علينا.";
    elements.deliveryProgressAmount.textContent = "توصيل مجاني";
  } else if (hasItems) {
    const remaining = thresholdCents - subtotalCents;
    elements.deliveryProgressText.textContent = "باقي لك للتوصيل المجاني";
    elements.deliveryProgressAmount.textContent = `${formatAmount(remaining)} ج.س`;
  } else {
    elements.deliveryProgressText.textContent = "";
    elements.deliveryProgressAmount.textContent = "";
  }
  const progress = thresholdCents > 0 ? Math.min(100, (subtotalCents / thresholdCents) * 100) : 0;
  elements.deliveryProgressFill.style.width = `${progress.toFixed(2)}%`;

  if (!hasItems) {
    promoApplied = false;
    elements.promoCode.value = "";
    elements.promoMessage.textContent = `استخدم ${CONFIG.promoCode} لخصم ${formatArabicNumber(CONFIG.promoPercent)}٪ على طلبك.`;
    elements.promoMessage.classList.remove("is-success", "is-error");
  }
}

function setPromoMessage(message, type = "") {
  elements.promoMessage.textContent = message;
  elements.promoMessage.classList.toggle("is-success", type === "success");
  elements.promoMessage.classList.toggle("is-error", type === "error");
}

function applyPromo() {
  if (!getCartEntries().length) {
    showToast("أضف طبقًا إلى سلّتك أولًا.", "error");
    return;
  }
  const enteredCode = elements.promoCode.value.trim().toUpperCase();
  if (enteredCode !== CONFIG.promoCode) {
    promoApplied = false;
    renderCart();
    setPromoMessage("الرمز غير صحيح. جرّب SHAHI10.", "error");
    showToast("رمز الخصم غير صحيح.", "error");
    return;
  }
  promoApplied = true;
  renderCart();
  setPromoMessage(`تم تفعيل خصم ${formatArabicNumber(CONFIG.promoPercent)}٪ — بالعافية!`, "success");
  showToast("خصمك صار جاهز ✳");
}

function openCart() {
  if (elements.cartDrawer.classList.contains("is-open")) return;
  lastFocusedElement = document.activeElement;
  elements.cartOverlay.classList.add("is-active");
  elements.cartOverlay.setAttribute("aria-hidden", "false");
  elements.cartDrawer.classList.add("is-open");
  elements.cartDrawer.setAttribute("aria-hidden", "false");
  elements.cartDrawer.inert = false;
  document.body.classList.add("drawer-open");
  window.requestAnimationFrame(() => elements.closeCart.focus());
}

function closeCart() {
  if (!elements.cartDrawer.classList.contains("is-open")) return;
  elements.cartOverlay.classList.remove("is-active");
  elements.cartOverlay.setAttribute("aria-hidden", "true");
  elements.cartDrawer.classList.remove("is-open");
  elements.cartDrawer.setAttribute("aria-hidden", "true");
  elements.cartDrawer.inert = true;
  document.body.classList.remove("drawer-open");
  if (lastFocusedElement instanceof HTMLElement && document.contains(lastFocusedElement)) lastFocusedElement.focus();
}

function handleDrawerKeydown(event) {
  if (!elements.cartDrawer.classList.contains("is-open")) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeCart();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...elements.cartDrawer.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    .filter((node) => !node.closest("[hidden]") && node.getClientRects().length > 0);
  if (!focusable.length) {
    event.preventDefault();
    elements.cartDrawer.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function cleanPhoneNumber(value) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
}

function createOrderMessage({ name, phone, address, notes }) {
  const entries = getCartEntries();
  const { subtotalCents, discountCents, deliveryCents, totalCents } = getCartTotals(entries);
  const itemLines = entries.map(({ product, quantity }) => {
    const lineTotal = toCents(product.price) * quantity;
    return `• ${product.name} × ${formatArabicNumber(quantity)} — ${formatAmount(toCents(product.price))} ج.س للواحد | ${formatAmount(lineTotal)} ج.س`;
  });
  const message = [
    "*طلب جديد من شهي ✳*",
    "",
    "*الأصناف:*",
    ...itemLines,
    "",
    `المجموع الفرعي: ${formatCurrency(subtotalCents)}`,
    ...(promoApplied ? [`خصم ${CONFIG.promoCode} (${formatArabicNumber(CONFIG.promoPercent)}٪): − ${formatCurrency(discountCents)}`] : []),
    `التوصيل: ${deliveryCents === 0 ? "مجاني" : formatCurrency(deliveryCents)}`,
    `*الإجمالي: ${formatCurrency(totalCents)}*`,
    "",
    "*بيانات التوصيل:*",
    `الاسم: ${name}`,
    `رقم التواصل: ${phone}`,
    `العنوان: ${address}`,
    ...(notes ? [`ملاحظة: ${notes}`] : []),
  ];
  return message.join("\n");
}

function markInvalidField(field, message) {
  field.setAttribute("aria-invalid", "true");
  field.focus();
  field.scrollIntoView({ block: "center", behavior: "smooth" });
  showToast(message, "error", 3600);
}

function handleCheckout(event) {
  event.preventDefault();
  const entries = getCartEntries();
  if (!entries.length) {
    showToast("سلّتك فاضية — اختار طبقك أولًا.", "error");
    return;
  }

  const name = elements.customerName.value.trim();
  const customerPhone = elements.customerPhone.value.trim();
  const customerDigits = cleanPhoneNumber(customerPhone);
  const address = elements.customerAddress.value.trim();
  const notes = elements.orderNotes.value.trim();

  if (name.length < 2) return markInvalidField(elements.customerName, "اكتب اسم المستلم عشان نجهز الطلب.");
  if (customerDigits.length < 8 || customerDigits.length > 15) return markInvalidField(elements.customerPhone, "تأكد من كتابة رقم تواصل صحيح.");
  if (address.length < 5) return markInvalidField(elements.customerAddress, "أضف عنوانًا واضحًا للتوصيل.");

  const restaurantPhone = cleanPhoneNumber(CONFIG.whatsappNumber);
  if (!/^\d{10,15}$/.test(restaurantPhone)) {
    showToast("أضف رقم واتساب المطعم الحقيقي في إعدادات script.js أولًا.", "error", 5200);
    return;
  }

  const message = createOrderMessage({ name, phone: customerDigits, address, notes });
  const whatsappUrl = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(message)}`;
  elements.checkoutButton.disabled = true;
  elements.checkoutButton.querySelector("span").textContent = "جاري فتح واتساب...";
  window.location.assign(whatsappUrl);
}

function resetFilters() {
  selectedCategory = "all";
  searchTerm = "";
  elements.menuSearch.value = "";
  elements.clearSearch.hidden = true;
  renderCategoryTabs();
  renderProducts();
}

function initializeEventListeners() {
  elements.categoryTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    selectedCategory = button.dataset.category;
    renderCategoryTabs();
    renderProducts();
  });

  elements.menuGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-to-cart]");
    if (button) addToCart(button.dataset.addToCart);
  });

  elements.menuSearch.addEventListener("input", () => {
    searchTerm = elements.menuSearch.value;
    elements.clearSearch.hidden = !searchTerm;
    renderProducts();
  });

  elements.clearSearch.addEventListener("click", () => {
    elements.menuSearch.value = "";
    searchTerm = "";
    elements.clearSearch.hidden = true;
    elements.menuSearch.focus();
    renderProducts();
  });

  elements.resetFilters.addEventListener("click", resetFilters);
  elements.openCart.addEventListener("click", openCart);
  elements.mobileCartButton.addEventListener("click", openCart);
  elements.closeCart.addEventListener("click", closeCart);
  elements.cartOverlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", handleDrawerKeydown);
  elements.applyPromo.addEventListener("click", applyPromo);
  elements.promoCode.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyPromo();
    }
  });

  elements.cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quantity-action]");
    if (!button) return;
    const productId = button.dataset.productId;
    const current = Number(cart[productId]) || 0;
    switch (button.dataset.quantityAction) {
      case "increase":
        if (current >= CONFIG.maximumQuantity) {
          showToast(`الحد الأقصى ${formatArabicNumber(CONFIG.maximumQuantity)} من الطبق الواحد.`, "error");
          return;
        }
        updateQuantity(productId, current + 1);
        break;
      case "decrease":
        updateQuantity(productId, current - 1);
        break;
      case "remove":
        updateQuantity(productId, 0);
        showToast("انحذف الطبق من سلّتك.");
        break;
      default:
        break;
    }
  });

  elements.checkoutForm.addEventListener("submit", handleCheckout);
  [elements.customerName, elements.customerPhone, elements.customerAddress, elements.orderNotes].forEach((field) => {
    field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
  });

  const continueShopping = document.getElementById("continueShopping");
  continueShopping.addEventListener("click", closeCart);
}

function initialize() {
  if (!elements.categoryTabs || !elements.menuGrid || !elements.cartDrawer) return;
  elements.currentYear.textContent = String(new Date().getFullYear());
  const freeDeliveryLabel = `${formatArabicNumber(CONFIG.freeDeliveryThreshold)} ج.س`;
  elements.freeDeliveryThresholdBanner.textContent = freeDeliveryLabel;
  elements.cartFreeDeliveryHint.textContent = freeDeliveryLabel;
  initializeEventListeners();
  loadCatalog();
}

document.addEventListener("DOMContentLoaded", initialize);
