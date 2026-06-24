"use client";

import { useMemo, useState } from "react";
import { CONFIG } from "@/lib/config";
import { COMMODITIES } from "@/lib/ports";
import { Combobox, Select } from "./ui";

const CONTAINERS = [
  { key: "20DV", label: "20′ Dry Standard", w: 30, h: 19 },
  { key: "40DV", label: "40′ Dry Standard", w: 52, h: 19 },
  { key: "40HC", label: "40′ High Cube", w: 52, h: 24 },
  { key: "45HC", label: "45′ High Cube", w: 60, h: 24 },
];

const SCOPES = ["Port → Port", "Door → Port", "Port → Door", "Door → Door"];
const EQUIPMENT = ["Dry", "Reefer", "NOR", "Special"];
const INCOTERMS = ["CIF", "FOB", "EXW", "FCA", "CFR", "DAP", "DDP"];

const INITIAL = {
  // Step 1 — route
  shipmentType: "FCL",
  origin: "",
  destination: "",
  serviceScope: "Port → Port",
  pickupAddress: "",
  deliveryAddress: "",
  earliest: true,
  readyDate: "",
  incoterm: "CIF",
  // Step 2 — cargo
  equipment: "Dry",
  containers: { "20DV": 0, "40DV": 0, "40HC": 0, "45HC": 0 },
  weightPerContainer: "",
  lclPackages: "",
  lclWeight: "",
  lclVolume: "",
  commodity: "",
  hazardous: false,
  unNumber: "",
  imoClass: "",
  packingGroup: "",
  reeferTemp: "",
  ventilation: "",
  humidity: "",
  specialType: "Flat Rack",
  dimensions: "",
  cargoValue: "",
  services: {
    customs: false,
    insurance: false,
    haulage: false,
    warehousing: false,
  },
  // Step 3 — contact
  name: "",
  company: "",
  phone: "+91 ",
  notes: "",
  consent: false,
  website: "", // honeypot — leave empty
};

export default function QuoteForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [refNo, setRefNo] = useState("");

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const setContainer = (key, delta) =>
    setForm((f) => ({
      ...f,
      containers: {
        ...f.containers,
        [key]: Math.max(0, f.containers[key] + delta),
      },
    }));
  const setContainerValue = (key, raw) => {
    const n = Math.min(999, parseInt(String(raw).replace(/\D/g, ""), 10) || 0);
    setForm((f) => ({
      ...f,
      containers: { ...f.containers, [key]: n },
    }));
  };
  const toggleService = (key) =>
    setForm((f) => ({
      ...f,
      services: { ...f.services, [key]: !f.services[key] },
    }));

  const totalContainers = Object.values(form.containers).reduce(
    (a, b) => a + b,
    0
  );
  const needPickup = form.serviceScope.startsWith("Door");
  const needDelivery = form.serviceScope.endsWith("Door");

  // ---------- validation ----------
  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.origin.trim()) e.origin = "Where does it ship from?";
      if (!form.destination.trim()) e.destination = "Where is it going?";
      if (needPickup && !form.pickupAddress.trim())
        e.pickupAddress = "Pickup city / zip needed for door collection.";
      if (needDelivery && !form.deliveryAddress.trim())
        e.deliveryAddress = "Delivery city / zip needed for door delivery.";
      if (!form.earliest && !form.readyDate)
        e.readyDate = "Pick a date or choose 'at the earliest'.";
    }
    if (s === 2) {
      if (form.shipmentType === "FCL") {
        if (totalContainers === 0) e.containers = "Add at least one container.";
        if (!String(form.weightPerContainer).trim())
          e.weightPerContainer = "Approx. weight per container needed.";
      } else {
        if (!String(form.lclWeight).trim())
          e.lclWeight = "Total weight needed.";
        if (!String(form.lclVolume).trim())
          e.lclVolume = "Total volume (CBM) needed.";
      }
      if (!form.commodity.trim()) e.commodity = "What are you shipping?";
      if (form.hazardous) {
        if (!form.unNumber.trim()) e.unNumber = "UN number required for DG.";
        if (!form.imoClass.trim()) e.imoClass = "IMO class required for DG.";
      }
    }
    if (s === 3) {
      if (!form.name.trim()) e.name = "Required.";
      if (!form.company.trim()) e.company = "Required.";
      if (form.phone.replace(/\D/g, "").length < 8)
        e.phone = "Enter a valid number with country code.";
      if (!form.consent) e.consent = "Please accept to continue.";
    }
    return e;
  }

  function next() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  function back() {
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() {
    setForm(INITIAL);
    setErrors({});
    setStep(1);
  }

  async function submit() {
    const e = validateStep(3);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setRefNo(data.ref);
        setStep(4);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setServerError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setServerError("Network error. Please check your connection and retry.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- success screen ----------
  if (step === 4) {
    const waText = encodeURIComponent(
      `Hi, I just requested a quote (Ref #${refNo})`
    );
    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${waText}`;
    const mailUrl = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(
      `Quote follow-up — Ref #${refNo}`
    )}`;
    return (
      <div className="card">
        <div className="card-body success">
          <div className="check-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M20 6L9 17l-5-5"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2>Thanks — your request is in.</h2>
          <p>
            We&apos;ll get back to you with your quote within{" "}
            <strong>{CONFIG.responseTime}</strong> ({CONFIG.businessHours}).
          </p>
          <div className="refbox">Ref #{refNo}</div>

          <ul className="next-steps">
            <li>Our team is pricing your route and cargo now.</li>
            <li>Need it faster? Reach us directly below.</li>
          </ul>

          <div className="socials">
            <a className="social wa" href={waUrl} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15h-.01c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 01-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.16 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
              </svg>
              WhatsApp
            </a>
            <a className="social mail" href={mailUrl}>
              <svg viewBox="0 0 24 24">
                <path d="M2 5.5C2 4.67 2.67 4 3.5 4h17c.83 0 1.5.67 1.5 1.5v13c0 .83-.67 1.5-1.5 1.5h-17C2.67 20 2 19.33 2 18.5v-13zm2 .5v.34l8 5 8-5V6H4zm16 2.3-7.47 4.67a1 1 0 01-1.06 0L4 8.3V18h16V8.3z" />
              </svg>
              Email
            </a>
            <a
              className="social li"
              href={CONFIG.linkedinUrl}
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24">
                <path d="M4.98 3.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM3 9h4v12H3V9zm6 0h3.8v1.64h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9V9z" />
              </svg>
              LinkedIn
            </a>
          </div>

          <button className="btn-link" onClick={reset} style={{ marginTop: 14 }}>
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  // ---------- wizard ----------
  return (
    <div className="card">
      <Steps step={step} />
      <div className="card-body">
        {step === 1 && (
          <Step1
            form={form}
            set={set}
            errors={errors}
            today={today}
            needPickup={needPickup}
            needDelivery={needDelivery}
          />
        )}
        {step === 2 && (
          <Step2
            form={form}
            set={set}
            errors={errors}
            setContainer={setContainer}
            setContainerValue={setContainerValue}
            toggleService={toggleService}
          />
        )}
        {step === 3 && <Step3 form={form} set={set} errors={errors} />}

        {serverError && <div className="alert">{serverError}</div>}

        <div className="nav">
          {step > 1 ? (
            <button className="btn btn-ghost" onClick={back}>
              Back
            </button>
          ) : (
            <button className="btn btn-ghost" onClick={reset}>
              Reset
            </button>
          )}
          <div className="spacer" />
          {step < 3 ? (
            <button className="btn btn-primary" onClick={next}>
              Continue
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Get my quote"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== Progress header ===================== */
function Steps({ step }) {
  const items = ["Route", "Cargo", "Contact"];
  return (
    <div className="steps">
      {items.map((label, i) => {
        const n = i + 1;
        const state = step > n ? "done" : step === n ? "active" : "";
        return (
          <div key={label} style={{ display: "contents" }}>
            <div className={`step-item ${state}`}>
              <span className="step-dot">{n}</span>
              <span className="step-label">{label}</span>
            </div>
            {n < 3 && <span className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}

/* ===================== Container icon (line-art, sized) ===================== */
function ContainerIcon({ w, h }) {
  const x = (64 - w) / 2;
  const y = (32 - h) / 2;
  const lines = [];
  for (let lx = x + 4; lx < x + w - 3; lx += 4) lines.push(lx);
  return (
    <svg className="cicon" viewBox="0 0 64 32" preserveAspectRatio="xMidYMid meet">
      <rect x={x} y={y} width={w} height={h} rx="1.5" />
      {lines.map((lx) => (
        <line key={lx} x1={lx} y1={y + 3} x2={lx} y2={y + h - 3} />
      ))}
    </svg>
  );
}

/* ===================== Step 1 — Route ===================== */
function Step1({ form, set, errors, today, needPickup, needDelivery }) {
  return (
    <>
      <div className="section-title">Route details</div>

      <div className="field" style={{ marginBottom: 18 }}>
        <label>Shipment type</label>
        <div className="seg">
          {["FCL", "LCL"].map((t) => (
            <button
              key={t}
              className={form.shipmentType === t ? "on" : ""}
              onClick={() => set("shipmentType", t)}
              type="button"
            >
              {t === "FCL" ? "FCL — Full container" : "LCL — Loose cargo"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid">
        <div className="field">
          <label>
            Origin / Loading port<span className="req">*</span>
          </label>
          <Combobox
            source="/ports.json"
            minChars={2}
            placeholder="Search port or code"
            value={form.origin}
            invalid={!!errors.origin}
            onChange={(v) => set("origin", v)}
          />
          {errors.origin && <span className="err">{errors.origin}</span>}
        </div>

        <div className="field">
          <label>
            Destination port<span className="req">*</span>
          </label>
          <Combobox
            source="/ports.json"
            minChars={2}
            placeholder="Search port or code"
            value={form.destination}
            invalid={!!errors.destination}
            onChange={(v) => set("destination", v)}
          />
          {errors.destination && (
            <span className="err">{errors.destination}</span>
          )}
        </div>

        <div className="field full">
          <label>
            Where should we handle it?<span className="req">*</span>
          </label>
          <Select
            value={form.serviceScope}
            onChange={(v) => set("serviceScope", v)}
            options={SCOPES}
          />
          <span className="hint">
            “Door” means we arrange inland pickup or delivery too.
          </span>
        </div>

        {needPickup && (
          <div className="field">
            <label>
              Pickup address / zip<span className="req">*</span>
            </label>
            <input
              type="text"
              value={form.pickupAddress}
              className={errors.pickupAddress ? "invalid" : ""}
              onChange={(e) => set("pickupAddress", e.target.value)}
            />
            {errors.pickupAddress && (
              <span className="err">{errors.pickupAddress}</span>
            )}
          </div>
        )}
        {needDelivery && (
          <div className="field">
            <label>
              Delivery address / zip<span className="req">*</span>
            </label>
            <input
              type="text"
              value={form.deliveryAddress}
              className={errors.deliveryAddress ? "invalid" : ""}
              onChange={(e) => set("deliveryAddress", e.target.value)}
            />
            {errors.deliveryAddress && (
              <span className="err">{errors.deliveryAddress}</span>
            )}
          </div>
        )}

        <div className="field full">
          <label>Cargo ready date</label>
          <div className="seg">
            <button
              type="button"
              className={form.earliest ? "on" : ""}
              onClick={() => set("earliest", true)}
            >
              At the earliest
            </button>
            <button
              type="button"
              className={!form.earliest ? "on" : ""}
              onClick={() => set("earliest", false)}
            >
              Choose a date
            </button>
          </div>
          {!form.earliest && (
            <>
              <input
                type="date"
                min={today}
                value={form.readyDate}
                className={errors.readyDate ? "invalid" : ""}
                onChange={(e) => set("readyDate", e.target.value)}
                style={{ marginTop: 10 }}
              />
              {errors.readyDate && (
                <span className="err">{errors.readyDate}</span>
              )}
            </>
          )}
        </div>

        <div className="field full">
          <label>Incoterm</label>
          <Select
            value={form.incoterm}
            onChange={(v) => set("incoterm", v)}
            options={INCOTERMS}
          />
        </div>
      </div>
    </>
  );
}

/* ===================== Step 2 — Cargo ===================== */
function Step2({
  form,
  set,
  errors,
  setContainer,
  setContainerValue,
  toggleService,
}) {
  return (
    <>
      <div className="section-title">Cargo details</div>

      <div className="field" style={{ marginBottom: 18 }}>
        <label>Equipment type</label>
        <div className="tabs">
          {EQUIPMENT.map((eq) => (
            <button
              key={eq}
              type="button"
              className={form.equipment === eq ? "on" : ""}
              onClick={() => set("equipment", eq)}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {form.shipmentType === "FCL" ? (
        <div className="field">
          <label>
            Container size &amp; quantity<span className="req">*</span>
          </label>
          <div className="cgrid">
            {CONTAINERS.map((c) => {
              const qty = form.containers[c.key];
              return (
                <div key={c.key} className={`ccard ${qty > 0 ? "has" : ""}`}>
                  <ContainerIcon w={c.w} h={c.h} />
                  <div className="clabel">{c.label}</div>
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() => setContainer(c.key, -1)}
                      disabled={qty === 0}
                      aria-label={`Remove ${c.label}`}
                    >
                      −
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="count"
                      value={qty}
                      maxLength={3}
                      aria-label={`${c.label} quantity`}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setContainerValue(c.key, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setContainer(c.key, 1)}
                      aria-label={`Add ${c.label}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.containers && (
            <span className="err">{errors.containers}</span>
          )}

          <div className="field" style={{ marginTop: 18 }}>
            <label>
              Approx. weight per container (KG)<span className="req">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={form.weightPerContainer}
              className={errors.weightPerContainer ? "invalid" : ""}
              onChange={(e) => set("weightPerContainer", e.target.value)}
            />
            {errors.weightPerContainer && (
              <span className="err">{errors.weightPerContainer}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="grid">
          <div className="field">
            <label>No. of packages / pallets</label>
            <input
              type="number"
              min="0"
              value={form.lclPackages}
              onChange={(e) => set("lclPackages", e.target.value)}
            />
          </div>
          <div className="field">
            <label>
              Total weight (KG)<span className="req">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={form.lclWeight}
              className={errors.lclWeight ? "invalid" : ""}
              onChange={(e) => set("lclWeight", e.target.value)}
            />
            {errors.lclWeight && (
              <span className="err">{errors.lclWeight}</span>
            )}
          </div>
          <div className="field">
            <label>
              Total volume (CBM)<span className="req">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.lclVolume}
              className={errors.lclVolume ? "invalid" : ""}
              onChange={(e) => set("lclVolume", e.target.value)}
            />
            {errors.lclVolume && (
              <span className="err">{errors.lclVolume}</span>
            )}
          </div>
          <div className="field">
            <label>Dimensions (optional)</label>
            <input
              type="text"
              value={form.dimensions}
              onChange={(e) => set("dimensions", e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="field" style={{ marginTop: 18 }}>
        <label>
          Commodity<span className="req">*</span>
        </label>
        <Combobox
          items={COMMODITIES}
          minChars={0}
          placeholder="What are you shipping?"
          value={form.commodity}
          invalid={!!errors.commodity}
          onChange={(v) => set("commodity", v)}
        />
        {errors.commodity && <span className="err">{errors.commodity}</span>}
      </div>

      <div style={{ marginTop: 16 }}>
        <Check
          label="Hazardous / Dangerous goods"
          on={form.hazardous}
          onClick={() => set("hazardous", !form.hazardous)}
        />
      </div>

      {form.hazardous && (
        <div className="reveal">
          <div className="grid">
            <div className="field">
              <label>
                UN number<span className="req">*</span>
              </label>
              <input
                type="text"
                value={form.unNumber}
                className={errors.unNumber ? "invalid" : ""}
                onChange={(e) => set("unNumber", e.target.value)}
              />
              {errors.unNumber && (
                <span className="err">{errors.unNumber}</span>
              )}
            </div>
            <div className="field">
              <label>
                IMO / IMDG class<span className="req">*</span>
              </label>
              <input
                type="text"
                value={form.imoClass}
                className={errors.imoClass ? "invalid" : ""}
                onChange={(e) => set("imoClass", e.target.value)}
              />
              {errors.imoClass && (
                <span className="err">{errors.imoClass}</span>
              )}
            </div>
            <div className="field">
              <label>Packing group (optional)</label>
              <Select
                value={form.packingGroup}
                onChange={(v) => set("packingGroup", v)}
                options={["I", "II", "III"]}
                placeholder="—"
              />
            </div>
          </div>
        </div>
      )}

      {form.equipment === "Reefer" && (
        <div className="reveal">
          <div className="grid">
            <div className="field">
              <label>Temperature setpoint (°C)</label>
              <input
                type="number"
                value={form.reeferTemp}
                onChange={(e) => set("reeferTemp", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Ventilation (optional)</label>
              <input
                type="text"
                value={form.ventilation}
                onChange={(e) => set("ventilation", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Humidity % (optional)</label>
              <input
                type="number"
                value={form.humidity}
                onChange={(e) => set("humidity", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {form.equipment === "Special" && (
        <div className="reveal">
          <div className="grid">
            <div className="field">
              <label>Special type</label>
              <Select
                value={form.specialType}
                onChange={(v) => set("specialType", v)}
                options={["Flat Rack", "Open Top", "Platform", "Out-of-gauge (OOG)"]}
              />
            </div>
            <div className="field">
              <label>Cargo dimensions</label>
              <input
                type="text"
                value={form.dimensions}
                onChange={(e) => set("dimensions", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="section-title mt">Additional services (optional)</div>
      <div className="checks">
        <Check
          label="Customs clearance"
          on={form.services.customs}
          onClick={() => toggleService("customs")}
        />
        <Check
          label="Cargo insurance"
          on={form.services.insurance}
          onClick={() => toggleService("insurance")}
        />
        <Check
          label="Inland haulage"
          on={form.services.haulage}
          onClick={() => toggleService("haulage")}
        />
        <Check
          label="Warehousing"
          on={form.services.warehousing}
          onClick={() => toggleService("warehousing")}
        />
      </div>
    </>
  );
}

/* ===================== Step 3 — Contact ===================== */
function Step3({ form, set, errors }) {
  return (
    <>
      <div className="section-title">Your details</div>

      <div className="grid">
        <div className="field">
          <label>
            Full name<span className="req">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            className={errors.name ? "invalid" : ""}
            onChange={(e) => set("name", e.target.value)}
          />
          {errors.name && <span className="err">{errors.name}</span>}
        </div>
        <div className="field">
          <label>
            Company<span className="req">*</span>
          </label>
          <input
            type="text"
            value={form.company}
            className={errors.company ? "invalid" : ""}
            onChange={(e) => set("company", e.target.value)}
          />
          {errors.company && <span className="err">{errors.company}</span>}
        </div>
        <div className="field full">
          <label>
            WhatsApp number<span className="req">*</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            className={errors.phone ? "invalid" : ""}
            onChange={(e) => set("phone", e.target.value)}
          />
          {errors.phone && <span className="err">{errors.phone}</span>}
        </div>
        <div className="field full">
          <label>Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>

      {/* honeypot — hidden from humans, catches bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(e) => set("website", e.target.value)}
        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
        aria-hidden="true"
      />

      <label
        className={`check consent ${form.consent ? "on" : ""}`}
        style={{ marginTop: 18 }}
      >
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => set("consent", e.target.checked)}
        />
        <span>
          I agree to be contacted about my quote and accept the privacy policy.
        </span>
      </label>
      {errors.consent && <span className="err">{errors.consent}</span>}
    </>
  );
}

/* ===================== Small shared components ===================== */
function Check({ label, on, onClick }) {
  return (
    <label className={`check ${on ? "on" : ""}`}>
      <input type="checkbox" checked={on} onChange={onClick} />
      <span>{label}</span>
    </label>
  );
}
