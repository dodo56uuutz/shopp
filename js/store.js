import { db } from "./config.js";
import {
  ref, onValue, push, set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ---------- Cart (localStorage) ---------- */
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function addToCart(product){
  const existing = cart.find(i => i.id === product.id);
  if(existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  saveCart();
  document.getElementById("cart-panel").classList.add("open");
}

function removeFromCart(id){
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

function renderCart(){
  const box = document.getElementById("cart-items");
  const count = document.getElementById("cart-count");
  const total = document.getElementById("cart-total");

  count.textContent = cart.reduce((s, i) => s + i.qty, 0);

  if(cart.length === 0){
    box.innerHTML = '<p class="empty">Your cart is empty</p>';
    total.textContent = "0";
    return;
  }

  box.innerHTML = cart.map(i => `
    <div class="cart-item">
      <img src="${i.image || 'https://via.placeholder.com/60'}" alt="${i.name}">
      <div class="cart-item-info">
        <div>${i.name} × ${i.qty}</div>
        <div class="price">${(i.price * i.qty).toFixed(2)} MAD</div>
      </div>
      <button class="remove-item" data-id="${i.id}">🗑</button>
    </div>`).join("");

  box.querySelectorAll(".remove-item").forEach(btn => {
    btn.onclick = () => removeFromCart(btn.dataset.id);
  });

  total.textContent = cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
}

/* ---------- Products ---------- */
function renderProducts(products){
  const grid = document.getElementById("products-grid");
  const list = Object.entries(products);

  if(list.length === 0){
    grid.innerHTML = '<p class="empty">No products yet. Add some from the Admin Panel.</p>';
    return;
  }

  grid.innerHTML = list.map(([id, p]) => `
    <div class="product-card">
      <img src="${p.image || 'https://via.placeholder.com/230x200'}" alt="${p.name}">
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="price">${p.price} MAD</p>
        <button class="add-btn" data-id="${id}">Add to Cart</button>
      </div>
    </div>`).join("");

  grid.querySelectorAll(".add-btn").forEach(btn => {
    btn.onclick = () => {
      const p = products[btn.dataset.id];
      addToCart({ id: btn.dataset.id, name: p.name, price: +p.price, image: p.image });
    };
  });
}

/* ---------- Checkout ---------- */
function checkout(){
  if(cart.length === 0) return alert("Your cart is empty!");

  const name = prompt("Your name:");
  if(!name) return;
  const phone = prompt("Your phone number:");
  if(!phone) return;

  const orderRef = push(ref(db, "orders"));
  set(orderRef, {
    customer: name,
    phone,
    items: cart,
    total: cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2),
    status: "new",
    ts: Date.now()
  });

  alert("Order placed successfully! We will contact you soon.");
  cart = [];
  saveCart();
  document.getElementById("cart-panel").classList.remove("open");
}

/* ---------- Chat ---------- */
function initChat(){
  const toggle = document.getElementById("chat-toggle");
  const win = document.getElementById("chat-window");
  const close = document.getElementById("chat-close");
  const send = document.getElementById("chat-send");
  const input = document.getElementById("chat-input");

  toggle.onclick = () => win.classList.toggle("open");
  close.onclick = () => win.classList.remove("open");

  let visitorId = localStorage.getItem("visitorId");
  if(!visitorId){
    visitorId = "v_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("visitorId", visitorId);
  }

  const msgsRef = ref(db, "chats/" + visitorId + "/messages");
  onValue(msgsRef, snap => {
    const box = document.getElementById("chat-messages");
    const data = snap.val() || {};
    box.innerHTML = Object.values(data).map(m =>
      `<div class="chat-msg ${m.from === 'visitor' ? 'me' : 'other'}">${m.text}</div>`
    ).join("");
    box.scrollTop = box.scrollHeight;
  });

  function sendMsg(){
    const text = input.value.trim();
    if(!text) return;
    push(msgsRef, { from: "visitor", text, ts: Date.now() });
    input.value = "";
  }

  send.onclick = sendMsg;
  input.addEventListener("keydown", e => { if(e.key === "Enter") sendMsg(); });
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  initChat();

  document.getElementById("cart-btn").onclick = () =>
    document.getElementById("cart-panel").classList.add("open");
  document.getElementById("cart-close").onclick = () =>
    document.getElementById("cart-panel").classList.remove("open");
  document.getElementById("checkout-btn").onclick = checkout;

  onValue(ref(db, "products"), snap => renderProducts(snap.val() || {}));
});
