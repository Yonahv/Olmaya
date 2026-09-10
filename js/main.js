// ===========================================================
// OLMAYA WINERY — site scripts
// ===========================================================

// Every section below is guarded against missing elements, since not
// every page (e.g. thank-you.html) includes the full site markup —
// only index.html has the gallery/contact form/etc.

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- header shadow on scroll ---------------------------------
const header = document.getElementById("site-header");
if (header) {
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// ---- mobile nav toggle ----------------------------------------
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");
if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  mainNav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mainNav.classList.remove("open");
      document.body.style.overflow = "";
    })
  );
}

// ---- gallery lightbox --------------------------------------------
const figures = Array.from(document.querySelectorAll(".gallery-grid figure"));
const lightbox = document.getElementById("lightbox");
if (figures.length && lightbox) {
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-cap");
  let lbIndex = 0;

  function openLightbox(i) {
    lbIndex = i;
    const fig = figures[lbIndex];
    lbImg.src = fig.dataset.full;
    lbImg.alt = fig.querySelector("img").alt;
    lbCap.textContent = fig.dataset.caption || "";
    lightbox.classList.add("open");
  }
  function closeLightbox() {
    lightbox.classList.remove("open");
  }
  function showRelative(delta) {
    lbIndex = (lbIndex + delta + figures.length) % figures.length;
    openLightbox(lbIndex);
  }

  figures.forEach((fig, i) => fig.addEventListener("click", () => openLightbox(i)));
  document.getElementById("lb-close").addEventListener("click", closeLightbox);
  document.getElementById("lb-prev").addEventListener("click", () => showRelative(-1));
  document.getElementById("lb-next").addEventListener("click", () => showRelative(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showRelative(-1);
    if (e.key === "ArrowRight") showRelative(1);
  });
}

// ---- localized strings (override via window.SITE_STRINGS before this script loads) ----
const STRINGS = Object.assign(
  {
    sending: "Sending…",
    thankYou: "Thank you — your message is on its way.",
    errorPrefix: "Something went wrong sending that. You can also email us directly at ",
  },
  window.SITE_STRINGS || {}
);

// ---- shared form submit helper ------------------------------------
async function submitForm(form, statusEl, submitBtn, { onSuccess } = {}) {
  statusEl.textContent = "";
  statusEl.className = "form-status";

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = STRINGS.sending;

  try {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Request failed");

    statusEl.textContent = STRINGS.thankYou;
    statusEl.className = "form-status ok";
    if (onSuccess) onSuccess(data);
    form.reset();
  } catch (err) {
    statusEl.innerHTML =
      STRINGS.errorPrefix +
      '<a href="mailto:yonah@olmayawines.com">yonah@olmayawines.com</a>.';
    statusEl.className = "form-status err";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
}

// ---- contact form ---------------------------------------------------
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");
const contactSubmit = document.getElementById("contact-submit");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitForm(contactForm, contactStatus, contactSubmit);
  });
}
