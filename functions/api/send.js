// Cloudflare Pages Function
// Handles POSTs from the Order form and the Contact form on the Olmaya site,
// and emails the details to the winery via Resend (https://resend.com).
//
// Setup (see README.md for full details):
//   1. In the Cloudflare Pages project settings -> Environment variables,
//      add a secret named RESEND_API_KEY with your Resend API key.
//   2. Optionally add TO_EMAIL (defaults to yonah@olmayawines.com) and
//      FROM_EMAIL (defaults to "Olmaya Winery <onboarding@resend.dev>" —
//      once you verify olmayawines.com in Resend, set this to something
//      like "Olmaya Winery <orders@olmayawines.com>").

const DEFAULT_TO = "yonah@olmayawines.com";
const DEFAULT_FROM = "Olmaya Winery <onboarding@resend.dev>";

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildOrderEmail(d) {
  const classic = parseInt(d.qtyClassic, 10) || 0;
  const noSulfite = parseInt(d.qtyNoSulfite, 10) || 0;
  const total = classic * 100 + noSulfite * 120;

  const subject = `New order from ${d.name || "website visitor"} (${classic + noSulfite} bottle${classic + noSulfite === 1 ? "" : "s"})`;

  const html = `
    <h2>New order — Olmaya website</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><b>Name</b></td><td>${escapeHtml(d.name)}</td></tr>
      <tr><td><b>Email</b></td><td>${escapeHtml(d.email)}</td></tr>
      <tr><td><b>Phone</b></td><td>${escapeHtml(d.phone)}</td></tr>
      <tr><td><b>Delivery address</b></td><td>${escapeHtml(d.address)}</td></tr>
      <tr><td><b>Classic</b></td><td>${classic} &times; &#8362;100</td></tr>
      <tr><td><b>No Added Sulfites</b></td><td>${noSulfite} &times; &#8362;120</td></tr>
      <tr><td><b>Estimated total</b></td><td>&#8362;${total}</td></tr>
      <tr><td><b>Notes</b></td><td>${escapeHtml(d.notes || "—")}</td></tr>
    </table>
    <p style="color:#888;font-size:12px">Buyer was redirected to the Grow payment link after submitting this form.</p>
  `;
  return { subject, html };
}

function buildContactEmail(d) {
  const subject = `New message from ${d.name || "website visitor"} (Olmaya site)`;
  const html = `
    <h2>New contact message — Olmaya website</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><b>Name</b></td><td>${escapeHtml(d.name)}</td></tr>
      <tr><td><b>Email</b></td><td>${escapeHtml(d.email)}</td></tr>
    </table>
    <p>${escapeHtml(d.message).replace(/\n/g, "<br>")}</p>
  `;
  return { subject, html };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  if (!data.name || !data.email) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  const { subject, html } =
    data.formType === "order" ? buildOrderEmail(data) : buildContactEmail(data);

  if (!env.RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Email is not configured yet (missing RESEND_API_KEY)." }),
      { status: 500 }
    );
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || DEFAULT_FROM,
      to: [env.TO_EMAIL || DEFAULT_TO],
      reply_to: data.email,
      subject,
      html,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    return new Response(JSON.stringify({ error: "Email send failed", detail: errText }), {
      status: 502,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
