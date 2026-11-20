// "Ask about Jof" chat widget. Talks to the Worker at /api/chat.
// Sends the question plus the last few turns, shows the answer as plain text,
// and offers the contact form when the Worker suggests it.
(function () {
  "use strict";

  var API =
    location.hostname === "jofdavies.com" || location.hostname === "www.jofdavies.com"
      ? "/api/chat"
      : "https://jofdavies.com/api/chat";
  var STORE_KEY = "jof-chat-v2";
  var MAX_TURNS = 6;
  var SUGGESTIONS = [
    "What has Jof automated with AI?",
    "What kind of role is he looking for?",
    "How strong is his CRM and data experience?",
    "Does he know Python and SQL?"
  ];
  var INTRO =
    "Hello. I answer questions about Jof Davies from a reference library he maintains: his roles, projects, tools and the way he works. If something is not in the library I will say so.";

  var css =
    "#hn-chat-launcher{position:fixed;right:20px;bottom:20px;z-index:2000;display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:999px;border:1px solid #4a9eff;background:#0d1b30;color:#f3f6fb;font:700 14px/1 ui-monospace,'Cascadia Mono',Consolas,'Courier New',monospace;letter-spacing:.04em;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.45)}" +
    "#hn-chat-launcher:hover{background:#4a9eff;color:#04101f}" +
    "#hn-chat-launcher i{width:9px;height:9px;border-radius:50%;background:#7ee2a8;display:inline-block}" +
    "#hn-chat-window{position:fixed;right:20px;bottom:78px;z-index:2000;width:380px;max-width:calc(100vw - 24px);height:560px;max-height:calc(100vh - 110px);display:none;flex-direction:column;background:#0b1524;color:#d5deea;border:1px solid #2c4a73;border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.55);font:15px/1.55 'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif}" +
    "#hn-chat-window.open{display:flex}" +
    ".hn-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;background:#101d31;border-bottom:1px solid #1f3350}" +
    ".hn-head strong{font:700 13px/1.2 ui-monospace,'Cascadia Mono',Consolas,monospace;letter-spacing:.08em;text-transform:uppercase;color:#f3f6fb}" +
    ".hn-head small{display:block;color:#95a7bf;font-size:12px;margin-top:2px}" +
    ".hn-head button{background:none;border:0;color:#95a7bf;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px}" +
    ".hn-head button:hover{color:#fff}" +
    "#hn-chat-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}" +
    ".hn-msg{max-width:88%;padding:10px 12px;border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere}" +
    ".hn-bot{align-self:flex-start;background:#101d31;border:1px solid #1f3350;border-bottom-left-radius:4px}" +
    ".hn-user{align-self:flex-end;background:#1b3a66;color:#f3f6fb;border-bottom-right-radius:4px}" +
    ".hn-thinking{color:#95a7bf;font-style:italic}" +
    ".hn-action{align-self:flex-start;background:none;border:1px solid #4a9eff;color:#8cc4ff;border-radius:999px;padding:6px 14px;font:700 12px/1.2 ui-monospace,Consolas,monospace;letter-spacing:.05em;text-transform:uppercase;cursor:pointer}" +
    ".hn-action:hover{background:#4a9eff;color:#04101f}" +
    ".hn-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}" +
    ".hn-chips button{background:rgba(74,158,255,.09);border:1px solid rgba(74,158,255,.3);color:#8cc4ff;border-radius:999px;padding:6px 11px;font:13px/1.25 'Segoe UI',system-ui,sans-serif;cursor:pointer;text-align:left}" +
    ".hn-chips button:hover{background:rgba(74,158,255,.22);color:#fff}" +
    "#hn-chat-form{display:flex;gap:8px;padding:10px;background:#101d31;border-top:1px solid #1f3350}" +
    "#hn-chat-input{flex:1;min-width:0;background:#08101c;border:1px solid #2c4a73;border-radius:8px;color:#f3f6fb;font:inherit;padding:9px 11px}" +
    "#hn-chat-input:focus{outline:2px solid #4a9eff;border-color:#4a9eff}" +
    "#hn-chat-send{background:#4a9eff;border:0;border-radius:8px;color:#04101f;font:700 13px/1 ui-monospace,Consolas,monospace;letter-spacing:.05em;text-transform:uppercase;padding:0 14px;cursor:pointer}" +
    "#hn-chat-send:disabled{opacity:.5;cursor:default}" +
    ".hn-note{padding:0 14px 8px;color:#6f819b;font-size:11.5px}" +
    "@media (max-width:520px){#hn-chat-window{right:0;left:0;bottom:0;width:100%;max-width:100%;height:82vh;max-height:82vh;border-radius:14px 14px 0 0}#hn-chat-launcher{right:14px;bottom:14px}}" +
    "@media print{#hn-chat-launcher,#hn-chat-window{display:none!important}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var launcher = document.createElement("button");
  launcher.id = "hn-chat-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-haspopup", "dialog");
  launcher.innerHTML = "<i></i>Ask about Jof";
  document.body.appendChild(launcher);

  var win = document.createElement("div");
  win.id = "hn-chat-window";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", "Ask about Jof");
  win.innerHTML =
    '<div class="hn-head"><div><strong>Ask about Jof</strong><small>AI assistant, answers from his reference library</small></div>' +
    '<button type="button" aria-label="Close chat">&times;</button></div>' +
    '<div id="hn-chat-messages" aria-live="polite"></div>' +
    '<div class="hn-chips"></div>' +
    '<form id="hn-chat-form" autocomplete="off">' +
    '<input id="hn-chat-input" type="text" maxlength="400" placeholder="Ask about his work, skills or availability" aria-label="Your question">' +
    '<button id="hn-chat-send" type="submit">Send</button></form>' +
    '<div class="hn-note">Answers are generated by AI from Jof\'s own records. Check anything important with him.</div>';
  document.body.appendChild(win);

  var messages = win.querySelector("#hn-chat-messages");
  var chips = win.querySelector(".hn-chips");
  var form = win.querySelector("#hn-chat-form");
  var input = win.querySelector("#hn-chat-input");
  var send = win.querySelector("#hn-chat-send");
  var history = [];
  var busy = false;

  function load() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]");
      if (Array.isArray(saved)) history = saved.slice(-MAX_TURNS * 2);
    } catch (e) {
      history = [];
    }
  }

  function save() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-MAX_TURNS * 2)));
    } catch (e) {
      /* storage unavailable: the chat still works for this page */
    }
  }

  function addMessage(text, who) {
    var el = document.createElement("div");
    el.className = "hn-msg " + (who === "user" ? "hn-user" : "hn-bot");
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function addContactButton() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hn-action";
    btn.textContent = "Contact Jof";
    btn.addEventListener("click", function () {
      if (typeof window.openContactModal === "function") window.openContactModal();
    });
    messages.appendChild(btn);
    messages.scrollTop = messages.scrollHeight;
  }

  function renderChips() {
    chips.innerHTML = "";
    if (history.length) return;
    SUGGESTIONS.forEach(function (q) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = q;
      b.addEventListener("click", function () {
        ask(q);
      });
      chips.appendChild(b);
    });
  }

  function open(question) {
    win.classList.add("open");
    launcher.setAttribute("aria-expanded", "true");
    if (question) ask(question);
    else input.focus();
  }

  function close() {
    win.classList.remove("open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  function ask(question) {
    question = (question || "").trim();
    if (!question || busy) return;
    busy = true;
    send.disabled = true;
    input.value = "";
    chips.innerHTML = "";
    addMessage(question, "user");
    var thinking = addMessage("Looking that up...", "bot");
    thinking.classList.add("hn-thinking");

    var prior = history.slice(-MAX_TURNS * 2);
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question, history: prior })
    })
      .then(function (res) {
        if (res.status === 429) throw new Error("limit");
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then(function (data) {
        var answer = String(data.answer || "").trim();
        var token = /ACTION:\s*OPEN_CONTACT/i;
        var wantsContact =
          token.test(answer) ||
          data.action === "open-contact-form" ||
          data.action === "suggest-contact" ||
          data.appendContactLine === true;
        answer = answer.replace(/[ \t]*ACTION:\s*OPEN_CONTACT\b[ \t]*/gi, "").trim();
        if (!answer) answer = "I do not have an answer for that. The contact form will reach Jof directly.";
        thinking.remove();
        addMessage(answer, "bot");
        if (wantsContact) addContactButton();
        history.push({ role: "user", content: question });
        history.push({ role: "assistant", content: answer });
        save();
      })
      .catch(function (err) {
        thinking.remove();
        addMessage(
          err && err.message === "limit"
            ? "The assistant has reached its limit for now. Please use the contact form and Jof will answer himself."
            : "Sorry, the assistant could not answer just then. Please try again, or use the contact form.",
          "bot"
        );
        addContactButton();
      })
      .then(function () {
        busy = false;
        send.disabled = false;
        input.focus();
      });
  }

  launcher.addEventListener("click", function () {
    if (win.classList.contains("open")) close();
    else open();
  });
  win.querySelector(".hn-head button").addEventListener("click", close);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(input.value);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && win.classList.contains("open")) {
      var modal = document.getElementById("contactModal");
      if (!modal || !modal.classList.contains("open")) close();
    }
  });
  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open-chat]");
    if (!opener) return;
    e.preventDefault();
    open(opener.getAttribute("data-question") || "");
  });

  window.openJofChat = open;

  load();
  addMessage(INTRO, "bot");
  for (var i = 0; i < history.length; i++) {
    addMessage(history[i].content, history[i].role === "user" ? "user" : "bot");
  }
  renderChips();

  // A link to any page ending in #chat opens the assistant directly.
  if (location.hash === "#chat") open();
})();
