import { db } from "./config.js";
import {
  ref, onValue, push, set, remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ---------- Tabs ---------- */
function initTabs(){
  document.querySelectorAll(".admin-tabs button").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".admin-tabs button").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    };
  });
}

/* ---------- Products ---------- */
function addProduct(){
  const name = document.getElementById("p-name").value.trim();
  const price = document.getElementById("p-price").value.trim();
  const image = document.getElementById("p-image").value.trim();
  const desc = document.getElementById("p-desc").value.trim();

  if(!name || !price) return alert("Name and price are required!");

  const productRef = push(ref(db, "products"));
  set(productRef, { name, price: +price, image, desc, ts: Date.now() });

  document.getElementById("p-name").value = "";
  document.getElementById("p-price").value = "";
  document.getElementById("p-image").value = "";
  document.getElementById("p-desc").value = "";
  alert("Product saved!");
}

function renderAdminProducts(products){
  const box = document.getElementById("admin-products");
  const list = Object.entries(products);

  if(list.length === 0){
    box.innerHTML = '<p class="empty">No products yet.</p>';
    return;
  }

  box.innerHTML = list.map(([id, p]) => `
    <div class="admin-item">
      <img src="${p.image || 'https://via.placeholder.com/60'}" alt="${p.name}">
      <div class="info">
        <h4>${p.name}</h4>
        <div class="price">${p.price} MAD</div>
      </div>
      <button class="del-btn" data-id="${id}">Delete</button>
    </div>`).join("");

  box.querySelectorAll(".del-btn").forEach(btn => {
    btn.onclick = () => {
      if(confirm("Delete this product?"))
        remove(ref(db, "products/" + btn.dataset.id));
    };
  });
}

/* ---------- Orders ---------- */
function renderOrders(orders){
  const box = document.getElementById("admin-orders");
  const list = Object.entries(orders).sort((a, b) => b[1].ts - a[1].ts);

  if(list.length === 0){
    box.innerHTML = '<p class="empty">No orders yet.</p>';
    return;
  }

  box.innerHTML = list.map(([id, o]) => `
    <div class="order-card">
      <div class="order-head">
        <span>${o.customer} — ${o.phone}</span>
        <span class="badge">${o.status}</span>
      </div>
      <ul>
        ${(o.items || []).map(i => `<li>${i.name} × ${i.qty} — ${(i.price * i.qty).toFixed(2)} MAD</li>`).join("")}
      </ul>
      <p style="margin-top:8px;font-weight:700">Total: ${o.total} MAD</p>
    </div>`).join("");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  document.getElementById("add-product-btn").onclick = addProduct;

  onValue(ref(db, "products"), snap => renderAdminProducts(snap.val() || {}));
  onValue(ref(db, "orders"), snap => renderOrders(snap.val() || {}));
});
