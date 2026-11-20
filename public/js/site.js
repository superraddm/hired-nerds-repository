// Shared behaviour for every page: navigation, footer year, contact form, video posters.
(function () {
  "use strict";

  // ---- Navigation toggle (phone) ----
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---- Footer year ----
  document.querySelectorAll(".year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---- Contact form (one modal, injected once) ----
  var modal = document.createElement("div");
  modal.id = "contactModal";
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "contactTitle");
  modal.innerHTML =
    '<div class="modal-content">' +
    '<button type="button" class="close" aria-label="Close contact form">&times;</button>' +
    '<h2 id="contactTitle">Contact Jof</h2>' +
    '<p class="muted">This goes straight to my inbox. I reply to every genuine message.</p>' +
    '<form id="contactForm" novalidate>' +
    '<div class="form-group"><label for="cf-name">Your name</label><input type="text" id="cf-name" name="name" autocomplete="name" required></div>' +
    '<div class="form-group"><label for="cf-email">Your email</label><input type="email" id="cf-email" name="email" autocomplete="email" required></div>' +
    '<div class="form-group"><label for="cf-subject">Subject</label><input type="text" id="cf-subject" name="subject" required></div>' +
    '<div class="form-group"><label for="cf-message">Message</label><textarea id="cf-message" name="message" rows="6" required></textarea></div>' +
    '<button type="submit" class="submit-btn">Send message</button>' +
    '<p class="form-status" role="status" aria-live="polite" hidden></p>' +
    "</form></div>";
  document.body.appendChild(modal);

  var form = modal.querySelector("#contactForm");
  var status = modal.querySelector(".form-status");
  var lastFocus = null;

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = "form-status" + (kind ? " " + kind : "");
    status.hidden = !text;
  }

  function openContactModal() {
    lastFocus = document.activeElement;
    modal.classList.add("open");
    setStatus("", "");
    var first = modal.querySelector("#cf-name");
    if (first) first.focus();
  }

  function closeContactModal() {
    modal.classList.remove("open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.openContactModal = openContactModal;
  window.closeContactModal = closeContactModal;

  modal.querySelector(".close").addEventListener("click", closeContactModal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeContactModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeContactModal();
  });
  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open-contact]");
    if (opener) {
      e.preventDefault();
      openContactModal();
    }
  });

  // A link to any page ending in #contact opens the form directly.
  if (location.hash === "#contact") openContactModal();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim()
    };
    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setStatus("Please fill in all four fields.", "err");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setStatus("That email address does not look right.", "err");
      return;
    }
    var button = form.querySelector(".submit-btn");
    button.disabled = true;
    setStatus("Sending...", "");
    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("send failed");
        form.reset();
        setStatus("Sent. Thank you, I will reply by email.", "ok");
      })
      .catch(function () {
        setStatus("That did not send. Please try again, or message me on LinkedIn.", "err");
      })
      .then(function () {
        button.disabled = false;
      });
  });

  // ---- YouTube posters: load the player only when asked ----
  document.addEventListener("click", function (e) {
    var poster = e.target.closest(".yt-poster");
    if (!poster) return;
    var id = poster.getAttribute("data-youtube-id");
    if (!id || !/^[\w-]{6,20}$/.test(id)) return;
    var wrap = document.createElement("div");
    wrap.className = "video-embed";
    var frame = document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1";
    frame.title = poster.getAttribute("aria-label") || "Video";
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    frame.allowFullscreen = true;
    wrap.appendChild(frame);
    poster.replaceWith(wrap);
  });
})();
