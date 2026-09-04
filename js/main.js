// ===========================================================
// OLMAYA WINERY — site scripts
// ===========================================================

// ---- CONFIG -------------------------------------------------
// TODO: replace with your real Grow payment link once you have it.
// The order form sends the buyer's details to you first (via /api/send),
// then redirects them here to actually pay.
const GROW_LINK = "https://grow.link/REPLACE_WITH_YOUR_GROW_LINK";

// ---------------------------------------------------------------
document.getElementById("year").textContent = new Date().getFullYear();

// ---- header shadow on scroll ---------------------------------
const header = document.getElementById("site-header");
const onScroll = () => {
  header.classList.toggle("scrolled", window.scrollY > 8);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// ---- mobile nav toggle ----------------------------------------
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");
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

// ---- quantity steppers ------------------------------------------
document.querySelectorAll(".qty-inc, .qty-dec").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    let val = parseInt(input.value, 10) || 0;
    val += btn.classList.contains("qty-inc") ? 1 : -1;
    if (val < 0) val = 0;
    input.value = val;
  });
});

// ---- gallery lightbox --------------------------------------------
const figures = Array.from(document.querySelectorAll(".gallery-grid figure"));
const lightbox = document.getElementById("lightbox");
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
  submitBtn.textContent = "Sending…";

  try {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Request failed");

    statusEl.textContent = "Thank you — your message is on its way.";
    statusEl.className = "form-status ok";
    if (onSuccess) onSuccess(data);
    form.reset();
  } catch (err) {
    statusEl.innerHTML =
      'Something went wrong sending that. You can also email us directly at ' +
      '<a href="mailto:yonah@olmayawines.com">yonah@olmayawines.com</a>.';
    statusEl.className = "form-status err";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
}

// ---- order form -----------------------------------------------------
const orderForm = document.getElementById("order-form");
const orderStatus = document.getElementById("order-status");
const orderSubmit = document.getElementById("order-submit");

orderForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const qtyClassic = parseInt(document.getElementById("qty-classic").value, 10) || 0;
  const qtyNoSulfite = parseInt(document.getElementById("qty-nosulfite").value, 10) || 0;

  if (qtyClassic + qtyNoSulfite === 0) {
    orderStatus.textContent = "Please select at least one bottle.";
    orderStatus.className = "form-status err";
    return;
  }

  orderStatus.textContent = "Sending your order details…";
  orderStatus.className = "form-status";

  submitForm(orderForm, orderStatus, orderSubmit, {
    onSuccess: () => {
      orderStatus.textContent = "Got it — taking you to payment…";
      orderStatus.className = "form-status ok";
      setTimeout(() => {
        window.location.href = GROW_LINK;
      }, 900);
    },
  });
});

// ---- contact form ---------------------------------------------------
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");
const contactSubmit = document.getElementById("contact-submit");

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  submitForm(contactForm, contactStatus, contactSubmit);
});
