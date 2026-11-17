// Pure India counter sample for the /in/pos/ ads LP.
// All money is integer paise. Exclusive GST 5% (cafe default) when GST is on;
// optional service; Cash and UPI stay exact (no Malaysia-style cash rounding).

/** Sample menu — India cafe seed prices (paise). */
export const SAMPLE_MENU = Object.freeze([
  Object.freeze({ id: "filter-coffee", name: "Filter Coffee", pricePaise: 4000 }),
  Object.freeze({ id: "masala-chai", name: "Masala Chai", pricePaise: 3000 }),
  Object.freeze({ id: "butter-croissant", name: "Butter Croissant", pricePaise: 8000 }),
  Object.freeze({ id: "chicken-sandwich", name: "Chicken Sandwich", pricePaise: 12000 }),
  Object.freeze({ id: "brownie", name: "Chocolate Brownie", pricePaise: 9000 }),
]);

/** Default bill: Filter Coffee ×2 + Chicken Sandwich ×1. */
export const DEFAULT_QTY = Object.freeze({
  "filter-coffee": 2,
  "chicken-sandwich": 1,
});

export const GST_RATE = 5;
export const DEFAULT_SERVICE_PCT = 10;

export function menuById(id) {
  return SAMPLE_MENU.find((m) => m.id === id) || null;
}

export function clampQty(q) {
  const n = Math.round(Number(q) || 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(99, n);
}

/**
 * @param {Record<string, number>} qtyById
 * @returns {{ id: string, name: string, qty: number, unitPaise: number, linePaise: number }[]}
 */
export function buildLines(qtyById = {}) {
  const lines = [];
  for (const item of SAMPLE_MENU) {
    const qty = clampQty(qtyById[item.id]);
    if (!qty) continue;
    const unitPaise = Math.max(0, Math.round(item.pricePaise));
    lines.push({
      id: item.id,
      name: item.name,
      qty,
      unitPaise,
      linePaise: unitPaise * qty,
    });
  }
  return lines;
}

/**
 * Exclusive GST (India cafe default 5%), optional service on subtotal, then GST on (subtotal + service).
 * Cash and UPI leave the total exact.
 *
 * @param {object} opts
 * @param {Record<string, number>} [opts.qty]
 * @param {boolean} [opts.gstOn=true]
 * @param {boolean} [opts.serviceOn=false]
 * @param {number} [opts.servicePct=10]
 * @param {'upi'|'cash'|'card'} [opts.pay='upi']
 */
export function calcBill({
  qty = DEFAULT_QTY,
  gstOn = true,
  serviceOn = false,
  servicePct = DEFAULT_SERVICE_PCT,
  pay = "upi",
} = {}) {
  const lines = buildLines(qty);
  const subtotalPaise = lines.reduce((sum, line) => sum + line.linePaise, 0);
  const servicePaise = serviceOn
    ? Math.round((subtotalPaise * Math.max(0, Number(servicePct) || 0)) / 100)
    : 0;
  const taxablePaise = subtotalPaise + servicePaise;
  const gstPaise = gstOn ? Math.round((taxablePaise * GST_RATE) / 100) : 0;
  const totalPaise = taxablePaise + gstPaise;
  return {
    lines,
    subtotalPaise,
    servicePaise,
    gstPaise,
    gstRate: gstOn ? GST_RATE : 0,
    // Split for display only (equal CGST / SGST halves of the GST line).
    cgstPaise: Math.floor(gstPaise / 2),
    sgstPaise: gstPaise - Math.floor(gstPaise / 2),
    totalPaise,
    pay,
    isCash: pay === "cash",
  };
}

/** Format paise as "₹40.00". Always two decimals for a bill. */
export function formatInr(paise) {
  const n = Math.round(Number(paise) || 0);
  const neg = n < 0;
  const abs = Math.abs(n);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${neg ? "-" : ""}₹${whole}.${frac}`;
}

export function emptyQty() {
  const q = {};
  for (const item of SAMPLE_MENU) q[item.id] = 0;
  return q;
}

export function withDefaultQty() {
  const q = emptyQty();
  for (const [id, n] of Object.entries(DEFAULT_QTY)) q[id] = clampQty(n);
  return q;
}

/** Progressive-enhancement mount for the India hero counter widget. */
export function mountBillWidget(root, opts = {}) {
  if (!root || typeof document === "undefined") return null;
  const state = {
    qty: withDefaultQty(),
    gstOn: opts.gstOn !== false,
    serviceOn: !!opts.serviceOn,
    pay: opts.pay === "cash" || opts.pay === "card" ? opts.pay : "upi",
  };

  const menuEl = root.querySelector("[data-lp-bill-menu]");
  const linesEl = root.querySelector("[data-lp-bill-lines]");
  const subEl = root.querySelector("[data-lp-bill-subtotal]");
  const svcRow = root.querySelector("[data-lp-bill-service-row]");
  const svcEl = root.querySelector("[data-lp-bill-service]");
  const gstRow = root.querySelector("[data-lp-bill-gst-row]");
  const gstEl = root.querySelector("[data-lp-bill-gst]");
  const totalEl = root.querySelector("[data-lp-bill-total]");
  const payEl = root.querySelector("[data-lp-bill-pay]");

  function renderMenu() {
    if (!menuEl) return;
    menuEl.textContent = "";
    for (const item of SAMPLE_MENU) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lp-bill-item";
      btn.setAttribute("data-id", item.id);
      const name = document.createElement("span");
      name.className = "lp-bill-item-name";
      name.textContent = item.name;
      const price = document.createElement("span");
      price.className = "lp-bill-item-price";
      price.textContent = formatInr(item.pricePaise);
      const qty = document.createElement("span");
      qty.className = "lp-bill-item-qty";
      qty.setAttribute("data-qty", item.id);
      qty.textContent = String(state.qty[item.id] || 0);
      btn.appendChild(name);
      btn.appendChild(price);
      btn.appendChild(qty);
      btn.addEventListener("click", () => {
        state.qty[item.id] = clampQty((state.qty[item.id] || 0) + 1);
        render();
      });
      menuEl.appendChild(btn);
    }
  }

  function renderLines(bill) {
    if (!linesEl) return;
    linesEl.textContent = "";
    if (!bill.lines.length) {
      const empty = document.createElement("p");
      empty.className = "lp-bill-empty";
      empty.textContent = "Tap a dish to add it.";
      linesEl.appendChild(empty);
      return;
    }
    for (const line of bill.lines) {
      const row = document.createElement("div");
      row.className = "lp-bill-line";
      const left = document.createElement("span");
      left.textContent = `${line.qty}× ${line.name}`;
      const right = document.createElement("span");
      right.textContent = formatInr(line.linePaise);
      const dec = document.createElement("button");
      dec.type = "button";
      dec.className = "lp-bill-dec";
      dec.setAttribute("aria-label", `Remove one ${line.name}`);
      dec.textContent = "−";
      dec.addEventListener("click", () => {
        state.qty[line.id] = clampQty((state.qty[line.id] || 0) - 1);
        render();
      });
      row.appendChild(left);
      row.appendChild(right);
      row.appendChild(dec);
      linesEl.appendChild(row);
    }
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function show(el, on) {
    if (!el) return;
    el.hidden = !on;
  }

  function render() {
    const bill = calcBill(state);
    renderLines(bill);
    for (const item of SAMPLE_MENU) {
      const q = root.querySelector(`[data-qty="${item.id}"]`);
      if (q) q.textContent = String(state.qty[item.id] || 0);
    }
    setText(subEl, formatInr(bill.subtotalPaise));
    setText(svcEl, formatInr(bill.servicePaise));
    setText(gstEl, formatInr(bill.gstPaise));
    setText(totalEl, formatInr(bill.totalPaise));
    show(svcRow, bill.servicePaise > 0);
    show(gstRow, bill.gstPaise > 0);
    if (payEl) {
      payEl.textContent =
        bill.pay === "cash" ? "Cash" : bill.pay === "card" ? "Card" : "UPI";
    }
  }

  root.querySelectorAll("[data-lp-bill-toggle]").forEach((el) => {
    el.addEventListener("click", () => {
      const key = el.getAttribute("data-lp-bill-toggle");
      if (key === "gst") state.gstOn = !state.gstOn;
      if (key === "service") state.serviceOn = !state.serviceOn;
      if (key === "pay-upi") state.pay = "upi";
      if (key === "pay-cash") state.pay = "cash";
      render();
    });
  });

  const clearBtn = root.querySelector("[data-lp-bill-clear]");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      state.qty = emptyQty();
      render();
    });
  }

  const resetBtn = root.querySelector("[data-lp-bill-reset]");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      state.qty = withDefaultQty();
      state.gstOn = true;
      state.serviceOn = false;
      state.pay = "upi";
      render();
    });
  }

  renderMenu();
  render();
  return { state, render, calc: () => calcBill(state) };
}

if (typeof document !== "undefined") {
  const boot = () => {
    const root = document.getElementById("lpBill");
    if (root) mountBillWidget(root);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}
