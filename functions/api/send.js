// Cloudflare Pages Function
// Handles POSTs from the Contact form on the Olmaya site,
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

  const { subject, html } = buildContactEmail(data);

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
