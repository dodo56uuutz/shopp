const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
async function request(path, options) {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json" } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Request failed");
  return response.status === 204 ? null : response.json();
}
function initTabs() {
  document.querySelectorAll(".admin-tabs button").forEach(button => { button.onclick = () => { document.querySelectorAll(".admin-tabs button").forEach(item => item.classList.remove("active")); document.querySelectorAll(".tab-content").forEach(item => item.classList.remove("active")); button.classList.add("active"); document.getElementById(button.dataset.tab).classList.add("active"); }; });
}
async function loadProducts() {
  const box = document.getElementById("admin-products");
  try {
    const products = await request("/api/products");
    if (!products.length) { box.innerHTML = '<p class="empty">No products yet.</p>'; return; }
    box.innerHTML = products.map(product => `<div class="admin-item"><img src="${escapeHtml(product.image || "https://placehold.co/60x60?text=Item")}" alt="${escapeHtml(product.name)}"><div class="info"><h4>${escapeHtml(product.name)}</h4><div class="price">${Number(product.price).toFixed(2)} MAD</div></div><button class="del-btn" data-id="${product.id}">Delete</button></div>`).join("");
    box.querySelectorAll(".del-btn").forEach(button => { button.onclick = async () => { if (!confirm("Delete this product?")) return; await request(`/api/products/${button.dataset.id}`, { method: "DELETE" }); loadProducts(); }; });
  } catch { box.innerHTML = '<p class="empty">Products could not be loaded.</p>'; }
}
async function addProduct() {
  const payload = { name: document.getElementById("p-name").value.trim(), price: Number(document.getElementById("p-price").value), image: document.getElementById("p-image").value.trim(), description: document.getElementById("p-desc").value.trim() };
  if (!payload.name || !payload.price) return alert("Name and price are required.");
  try { await request("/api/products", { method: "POST", body: JSON.stringify(payload) }); ["p-name", "p-price", "p-image", "p-desc"].forEach(id => { document.getElementById(id).value = ""; }); await loadProducts(); }
  catch { alert("The product could not be saved."); }
}
async function loadOrders() {
  const box = document.getElementById("admin-orders");
  try {
    const orders = await request("/api/orders"); if (!orders.length) { box.innerHTML = '<p class="empty">No orders yet.</p>'; return; }
    box.innerHTML = orders.map(order => { let items = []; try { items = JSON.parse(order.items); } catch {} return `<div class="order-card"><div class="order-head"><span>${escapeHtml(order.customer)} — ${escapeHtml(order.phone)}</span><span class="badge">${escapeHtml(order.status)}</span></div><ul>${items.map(item => `<li>${escapeHtml(item.name)} × ${item.qty} — ${(item.price * item.qty).toFixed(2)} MAD</li>`).join("")}</ul><p style="margin-top:8px;font-weight:700">Total: ${Number(order.total).toFixed(2)} MAD</p></div>`; }).join("");
  } catch { box.innerHTML = '<p class="empty">Orders could not be loaded.</p>'; }
}
document.addEventListener("DOMContentLoaded", () => { initTabs(); document.getElementById("add-product-btn").onclick = addProduct; loadProducts(); loadOrders(); });
