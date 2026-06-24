"use client";

import { useEffect, useRef, useState } from "react";

const LIMIT = 8;

const strip = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

function normalizeItems(arr) {
  if (!arr) return [];
  return arr.map((it) => (typeof it === "string" ? { name: it } : it));
}

// module-level cache so origin + destination share a single fetch
const sourceCache = new Map();

function rankItems(items, query) {
  if (!query) return items.slice(0, LIMIT);
  const q = query.trim().toLowerCase();
  const qn = strip(q);
  const out = [];
  for (const it of items) {
    const nn = strip(it.name || "");
    const code = (it.code || "").toLowerCase();
    let s = -1;
    if (code && code === q) s = 0;
    else if (code && code.startsWith(q)) s = 1;
    else if (nn.startsWith(qn)) s = 2;
    else if (nn.includes(qn)) s = 3;
    else if (code && code.includes(q)) s = 4;
    if (s >= 0) out.push([s, (it.name || "").length, it]);
  }
  out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return out.slice(0, LIMIT).map((x) => x[2]);
}

/* ===================== Combobox (type-ahead) ===================== */
export function Combobox({
  value,
  onChange,
  source,
  items,
  placeholder,
  invalid,
  minChars = 1,
}) {
  const [data, setData] = useState(() => normalizeItems(items));
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const wrapRef = useRef(null);

  // load remote source once (cached across instances)
  useEffect(() => {
    if (!source) return;
    const cached = sourceCache.get(source);
    if (cached?.data) {
      setData(cached.data);
      return;
    }
    let active = true;
    const promise =
      cached?.promise ||
      fetch(source)
        .then((r) => r.json())
        .then(normalizeItems);
    sourceCache.set(source, { promise });
    promise
      .then((d) => {
        sourceCache.set(source, { data: d, promise });
        if (active) setData(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [source]);

  // keep static items in sync
  useEffect(() => {
    if (items) setData(normalizeItems(items));
  }, [items]);

  // close on outside click
  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = value || "";
  const show = minChars === 0 || q.trim().length >= minChars;
  const matches = show ? rankItems(data, q) : [];
  const isOpen = open && matches.length > 0;

  function pick(it) {
    onChange(it.code ? `${it.name} (${it.code})` : it.name);
    setOpen(false);
    setHi(-1);
  }
  function onKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) setOpen(true);
      else setHi((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (isOpen && hi >= 0) {
        e.preventDefault();
        pick(matches[hi]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="combo" ref={wrapRef}>
      <input
        type="text"
        className={invalid ? "invalid" : ""}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHi(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {isOpen && (
        <ul className="combo-menu" role="listbox">
          {matches.map((it, i) => (
            <li
              key={(it.code || it.name) + i}
              className={`combo-opt ${i === hi ? "hi" : ""}`}
              role="option"
              aria-selected={i === hi}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(it);
              }}
            >
              <span className="combo-name">{it.name}</span>
              {it.code && <span className="combo-code">{it.code}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ===================== Custom Select ===================== */
export function Select({ value, onChange, options, placeholder, invalid }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(o) {
    onChange(o);
    setOpen(false);
  }
  function onKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHi(Math.max(0, options.indexOf(value)));
      } else setHi((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && hi >= 0) pick(options[hi]);
      else setOpen((o) => !o);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="sel" ref={ref}>
      <button
        type="button"
        className={`sel-btn ${invalid ? "invalid" : ""} ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? "" : "sel-ph"}>{value || placeholder}</span>
        <svg className="chev" viewBox="0 0 24 24" fill="none">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul className="sel-menu" role="listbox">
          {options.map((o, i) => (
            <li
              key={o}
              className={`sel-opt ${o === value ? "on" : ""} ${
                i === hi ? "hi" : ""
              }`}
              role="option"
              aria-selected={o === value}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o);
              }}
            >
              <span>{o}</span>
              {o === value && (
                <svg className="tick" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
