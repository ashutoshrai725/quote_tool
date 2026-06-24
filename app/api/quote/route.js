import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Escape user text so it can't break Telegram's HTML formatting.
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const CONTAINER_LABELS = {
  "20DV": "20′ Dry Standard",
  "40DV": "40′ Dry Standard",
  "40HC": "40′ High Cube",
  "45HC": "45′ High Cube",
};

function buildMessage(d, ref) {
  const L = [];
  L.push(`🆕 <b>New Quote Request</b> — <code>${ref}</code>`);
  L.push("");

  // Route
  L.push(`📍 <b>Route:</b> ${esc(d.origin)} → ${esc(d.destination)}`);
  L.push(`🚚 <b>Scope:</b> ${esc(d.serviceScope)}`);
  if (d.pickupAddress) L.push(`     ↳ Pickup: ${esc(d.pickupAddress)}`);
  if (d.deliveryAddress) L.push(`     ↳ Delivery: ${esc(d.deliveryAddress)}`);
  L.push(
    `📅 <b>Ready:</b> ${d.earliest ? "At the earliest" : esc(d.readyDate)}`
  );
  if (d.incoterm) L.push(`📑 <b>Incoterm:</b> ${esc(d.incoterm)}`);
  L.push("");

  // Cargo
  L.push(
    `📦 <b>Cargo</b> (${esc(d.shipmentType)} · ${esc(d.equipment)})`
  );
  if (d.shipmentType === "FCL") {
    const c = d.containers || {};
    Object.keys(CONTAINER_LABELS).forEach((k) => {
      if (c[k] > 0) L.push(`     • ${c[k]} × ${CONTAINER_LABELS[k]}`);
    });
    if (d.weightPerContainer)
      L.push(`     • ~${esc(d.weightPerContainer)} kg / container`);
  } else {
    L.push(
      `     • ${esc(d.lclPackages || "?")} pkg · ${esc(
        d.lclWeight
      )} kg · ${esc(d.lclVolume)} CBM`
    );
    if (d.dimensions) L.push(`     • Dims: ${esc(d.dimensions)}`);
  }
  L.push(`     • Commodity: ${esc(d.commodity)}`);
  if (d.hazardous)
    L.push(
      `     • ⚠️ DG: UN ${esc(d.unNumber)} · Class ${esc(d.imoClass)}${
        d.packingGroup ? ` · PG ${esc(d.packingGroup)}` : ""
      }`
    );
  if (d.equipment === "Reefer")
    L.push(
      `     • ❄️ ${esc(d.reeferTemp)}°C${
        d.ventilation ? ` · vent ${esc(d.ventilation)}` : ""
      }${d.humidity ? ` · hum ${esc(d.humidity)}%` : ""}`
    );
  if (d.equipment === "Special")
    L.push(
      `     • 📐 ${esc(d.specialType)}${
        d.dimensions ? ` · ${esc(d.dimensions)}` : ""
      }`
    );
  if (d.cargoValue) L.push(`     • Value: ${esc(d.cargoValue)}`);

  const svc = [];
  if (d.services?.customs) svc.push("Customs");
  if (d.services?.insurance) svc.push("Insurance");
  if (d.services?.haulage) svc.push("Inland haulage");
  if (d.services?.warehousing) svc.push("Warehousing");
  if (svc.length) L.push(`     • Services: ${svc.join(", ")}`);

  L.push("");
  L.push("──────────────");
  L.push(`👤 <b>${esc(d.name)}</b>${d.company ? ` — ${esc(d.company)}` : ""}`);
  L.push(`📱 WhatsApp: ${esc(d.phone)}`);
  if (d.notes) L.push(`📝 ${esc(d.notes)}`);

  return L.join("\n");
}

export async function POST(req) {
  let d;
  try {
    d = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields. Pretend success, send nothing.
  if (d.website) {
    return NextResponse.json({ ok: true, ref: "SPOT-000000" });
  }

  const ref = "SPOT-" + Date.now().toString().slice(-6);
  const text = buildMessage(d, ref);

  // Backstop log so a lead is never lost, even if Telegram is down/unset.
  console.log(`\n=== New quote ${ref} ===\n`, JSON.stringify(d, null, 2));

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "[quote] Telegram not configured — set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local. Lead logged above."
    );
    return NextResponse.json({ ok: true, ref, delivered: false });
  }

  // One-tap "reply on WhatsApp" button to the customer's own number.
  const phoneDigits = String(d.phone || "").replace(/\D/g, "");
  const reply_markup = phoneDigits
    ? {
        inline_keyboard: [
          [
            {
              text: `💬 WhatsApp ${d.name || "customer"}`,
              url: `https://wa.me/${phoneDigits}`,
            },
          ],
        ],
      }
    : undefined;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup,
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      console.error("[quote] Telegram send failed:", res.status, body);
      // Still return ok so the customer isn't blocked — lead is logged above.
      return NextResponse.json({ ok: true, ref, delivered: false });
    }
    return NextResponse.json({ ok: true, ref, delivered: true });
  } catch (err) {
    console.error("[quote] Telegram error:", err);
    return NextResponse.json({ ok: true, ref, delivered: false });
  }
}
