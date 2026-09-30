import { db } from "./config.js";
import {
  ref, onValue, push, set, remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ---------- Visitor identity ---------- */
function getVisitorId(){
  let id = localStorage.getItem("visitorId");
  if(!id){
    id = "v_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("visitorId", id);
  }
  return id;
}

/* ---------- Escape HTML (safety) ---------- */
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* ---------- Render messages ---------- */
function renderMessages(box, data){
  const list = Object.values(data).sort((a, b) => a.ts - b.ts);
  box.innerHTML = list.map(m =>
    `<div class="chat-msg ${m.from === "visitor" ? "me" : "other"}">
       ${escapeHtml(m.text)}
     </div>`
  ).join("");
  box.scrollTop = box.scrollHeight;
}

/* ---------- Init chat widget ---------- */
export function initChat(){
  const toggle = document.getElementById("chat-toggle");
  const win = document.getElementById("chat-window");
  const closeBtn = document.getElementById("chat-close");
  const sendBtn = document.getElementById("chat-send");
  const input = document.getElementById("chat-input");
  const box = document.getElementById("chat-messages");

  if(!toggle || !win) return;

  toggle.onclick = () => win.classList.toggle("open");
  closeBtn.onclick = () => win.classList.remove("open");

  const visitorId = getVisitorId();
  const msgsRef = ref(db, "chats/" + visitorId + "/messages");

  // Mark visitor as active + store last seen
  set(ref(db, "chats/" + visitorId + "/info"), {
    visitorId,
    lastSeen: Date.now()
  });

  onValue(msgsRef, snap => renderMessages(box, snap.val() || {}));

  function sendMsg(){
    const text = input.value.trim();
    if(!text) return;
    push(msgsRef, { from: "visitor", text, ts: Date.now() });
    set(ref(db, "chats/" + visitorId + "/info/lastSeen"), Date.now());
    input.value = "";
  }

  sendBtn.onclick = sendMsg;
  input.addEventListener("keydown", e => {
    if(e.key === "Enter") sendMsg();
  });
}

/* ---------- Admin: reply to a visitor ---------- */
export function sendAdminReply(visitorId, text){
  if(!text) return;
  const msgsRef = ref(db, "chats/" + visitorId + "/messages");
  push(msgsRef, { from: "admin", text, ts: Date.now() });
}

/* ---------- Admin: listen to all conversations ---------- */
export function listenAllChats(callback){
  onValue(ref(db, "chats"), snap => {
    callback(snap.val() || {});
  });
}

/* ---------- Admin: delete a conversation ---------- */
export function deleteConversation(visitorId){
  remove(ref(db, "chats/" + visitorId));
}
