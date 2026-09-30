const api = {
  async request(path, options) {
    const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Request failed");
    return response.status === 204 ? null : response.json();
  },
  products: () => api.request("/api/products"),
  order: (data) => api.request("/api/orders", { method: "POST", body: JSON.stringify(data) }),
  messages: (id) => api.request(`/api/messages/${encodeURIComponent(id)}`),
  sendMessage: (id, body) => api.request(`/api/messages/${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ body }) }),
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let products = [];

function notify(message, error = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message; toast.className = `toast show${error ? " error" : ""}`;
  clearTimeout(notify.timer); notify.timer = setTimeout(() => { toast.className = "toast"; }, 2800);
}

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); renderCart(); }
function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) existing.qty += 1; else cart.push({ ...product, qty: 1 });
  saveCart(); document.getElementById("cart-panel").classList.add("open");
}

function renderCart() {
  const box = document.getElementById("cart-items");
  document.getElementById("cart-count").textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("cart-total").textContent = cart.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);
  if (!cart.length) { box.innerHTML = '<p class="empty">Your cart is empty</p>'; return; }
  box.innerHTML = cart.map(item => `<div class="cart-item"><img src="${escapeHtml(item.image || "https://placehold.co/60x60?text=Item")}" alt="${escapeHtml(item.name)}"><div class="cart-item-info"><div>${escapeHtml(item.name)} × ${item.qty}</div><div class="price">${(item.price * item.qty).toFixed(2)} MAD</div></div><button class="remove-item" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.name)}">🗑</button></div>`).join("");
  box.querySelectorAll(".remove-item").forEach(button => { button.onclick = () => { cart = cart.filter(item => String(item.id) !== button.dataset.id); saveCart(); }; });
}

function renderProducts() {
  const grid = document.getElementById("products-grid");
  if (!products.length) { grid.innerHTML = '<p class="status-message">No products are available yet.</p>'; return; }
  grid.innerHTML = products.map(product => `<article class="product-card"><img src="${escapeHtml(product.image || "https://placehold.co/460x400?text=Product")}" alt="${escapeHtml(product.name)}" loading="lazy"><div class="product-info"><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description || "")}</p><p class="price">${Number(product.price).toFixed(2)} MAD</p><button class="add-btn" data-id="${product.id}">Add to Cart</button></div></article>`).join("");
  grid.querySelectorAll(".add-btn").forEach(button => { button.onclick = () => { const p = products.find(item => String(item.id) === button.dataset.id); addToCart({ id: p.id, name: p.name, price: Number(p.price), image: p.image }); }; });
}

async function checkout() {
  if (!cart.length) return notify("Your cart is empty", true);
  const customer = prompt("Your name:")?.trim(); if (!customer) return;
  const phone = prompt("Your phone number:")?.trim(); if (!phone) return;
  try { await api.order({ customer, phone, items: cart }); cart = []; saveCart(); document.getElementById("cart-panel").classList.remove("open"); notify("Order placed successfully!"); }
  catch { notify("Could not place the order. Please try again.", true); }
}

function initChat() {
  const win = document.getElementById("chat-window"); const input = document.getElementById("chat-input"); const box = document.getElementById("chat-messages");
  let visitorId = localStorage.getItem("visitorId");
  if (!visitorId) { visitorId = `v_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`; localStorage.setItem("visitorId", visitorId); }
  const load = async () => {
    if (!win.classList.contains("open")) return;
    try { const rows = await api.messages(visitorId); box.innerHTML = rows.map(message => `<div class="chat-msg ${message.sender === "visitor" ? "me" : "other"}">${escapeHtml(message.body)}</div>`).join(""); box.scrollTop = box.scrollHeight; }
    catch { box.innerHTML = '<p class="empty">Chat is temporarily unavailable.</p>'; }
  };
  document.getElementById("chat-toggle").onclick = () => { win.classList.toggle("open"); load(); };
  document.getElementById("chat-close").onclick = () => win.classList.remove("open");
  const send = async () => { const body = input.value.trim(); if (!body) return; input.value = ""; try { await api.sendMessage(visitorId, body); await load(); } catch { notify("Message was not sent", true); } };
  document.getElementById("chat-send").onclick = send;
  input.addEventListener("keydown", event => { if (event.key === "Enter") send(); }); setInterval(load, 8000);
}

document.addEventListener("DOMContentLoaded", async () => {
  renderCart(); initChat();
  document.getElementById("cart-btn").onclick = () => document.getElementById("cart-panel").classList.add("open");
  document.getElementById("cart-close").onclick = () => document.getElementById("cart-panel").classList.remove("open");
  document.getElementById("checkout-btn").onclick = checkout;
  try { products = await api.products(); renderProducts(); } catch { document.getElementById("products-grid").innerHTML = '<p class="status-message">Products could not be loaded. Please try again.</p>'; }
});
