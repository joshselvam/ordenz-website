// Pure MY counter sample for the /my/pos/ ads LP.
// All money is integer sen. Matches OrdenZ Malaysia rules: exclusive SST 6%, optional service,
// cash rounds to 5 sen; DuitNow/card stay exact.

/** Sample menu — prices from the OrdenZ Malaysia demo seed (sen). */
export const SAMPLE_MENU = Object.freeze([
  Object.freeze({ id: "teh-tarik", name: "Teh Tarik", priceSen: 350 }),
  Object.freeze({ id: "kopi-o", name: "Kopi O", priceSen: 280 }),
  Object.freeze({ id: "kaya-toast", name: "Kaya Butter Toast", priceSen: 450 }),
  Object.freeze({ id: "nasi-lemak", name: "Nasi Lemak", priceSen: 890 }),
  Object.freeze({ id: "roti-canai", name: "Roti Canai", priceSen: 250 }),
]);

/** Default bill: Teh Tarik ×2 + Nasi Lemak ×1. */
export const DEFAULT_QTY = Object.freeze({
  "teh-tarik": 2,
  "nasi-lemak": 1,
});

export const SST_RATE = 6;
export const DEFAULT_SERVICE_PCT = 10;
export const CASH_STEP_SEN = 5;

/** Round minor units to Malaysia's 5-sen cash step (same idea as countries.js roundCash). */
export function roundCash(sen, step = CASH_STEP_SEN) {
  const n = Math.round(Number(sen) || 0);
  const s = Math.max(1, Math.round(Number(step) || 1));
  return s <= 1 ? n : Math.round(n / s) * s;
}

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
 * @returns {{ id: string, name: string, qty: number, unitSen: number, lineSen: number }[]}
 */
export function buildLines(qtyById = {}) {
  const lines = [];
  for (const item of SAMPLE_MENU) {
    const qty = clampQty(qtyById[item.id]);
    if (!qty) continue;
    const unitSen = Math.max(0, Math.round(item.priceSen));
    lines.push({
      id: item.id,
      name: item.name,
      qty,
      unitSen,
      lineSen: unitSen * qty,
    });
  }
  return lines;
}

/**
 * Exclusive SST (MY default), optional service on subtotal, then SST on (subtotal + service).
 * Cash pay applies 5-sen rounding; DuitNow/card leave the total exact.
 *
 * @param {object} opts
 * @param {Record<string, number>} [opts.qty]
 * @param {boolean} [opts.sstOn=true]
 * @param {boolean} [opts.serviceOn=false]
 * @param {number} [opts.servicePct=10]
 * @param {'duitnow'|'cash'|'card'} [opts.pay='duitnow']
 */
export function calcBill({
  qty = DEFAULT_QTY,
  sstOn = true,
  serviceOn = false,
  servicePct = DEFAULT_SERVICE_PCT,
  pay = "duitnow",
} = {}) {
  const lines = buildLines(qty);
  const subtotalSen = lines.reduce((sum, line) => sum + line.lineSen, 0);
  const serviceSen = serviceOn
    ? Math.round((subtotalSen * Math.max(0, Number(servicePct) || 0)) / 100)
    : 0;
  const taxableSen = subtotalSen + serviceSen;
  const sstSen = sstOn ? Math.round((taxableSen * SST_RATE) / 100) : 0;
  const beforeRoundSen = taxableSen + sstSen;
  const isCash = pay === "cash";
  const totalSen = isCash ? roundCash(beforeRoundSen, CASH_STEP_SEN) : beforeRoundSen;
  const roundingSen = totalSen - beforeRoundSen;
  return {
    lines,
    subtotalSen,
    serviceSen,
    sstSen,
    sstRate: sstOn ? SST_RATE : 0,
    roundingSen,
    totalSen,
    pay,
    isCash,
  };
}

/** Format sen as "RM12.50". Always two decimals for a bill. */
export function formatRm(sen) {
  const n = Math.round(Number(sen) || 0);
  const neg = n < 0;
  const abs = Math.abs(n);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${neg ? "-" : ""}RM${whole}.${frac}`;
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

/** Progressive-enhancement mount for the hero counter widget. */
export function mountBillWidget(root, opts = {}) {
  if (!root || typeof document === "undefined") return null;
  const state = {
    qty: withDefaultQty(),
    sstOn: opts.sstOn !== false,
    serviceOn: !!opts.serviceOn,
    pay: opts.pay === "cash" || opts.pay === "card" ? opts.pay : "duitnow",
  };

  const menuEl = root.querySelector("[data-lp-bill-menu]");
  const linesEl = root.querySelector("[data-lp-bill-lines]");
  const subEl = root.querySelector("[data-lp-bill-subtotal]");
  const svcRow = root.querySelector("[data-lp-bill-service-row]");
  const svcEl = root.querySelector("[data-lp-bill-service]");
  const sstRow = root.querySelector("[data-lp-bill-sst-row]");
  const sstEl = root.querySelector("[data-lp-bill-sst]");
  const roundRow = root.querySelector("[data-lp-bill-rounding-row]");
  const roundEl = root.querySelector("[data-lp-bill-rounding]");
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
      price.textContent = formatRm(item.priceSen);
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
      right.textContent = formatRm(line.lineSen);
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
    setText(subEl, formatRm(bill.subtotalSen));
    setText(svcEl, formatRm(bill.serviceSen));
    setText(sstEl, formatRm(bill.sstSen));
    setText(roundEl, formatRm(bill.roundingSen));
    setText(totalEl, formatRm(bill.totalSen));
    show(svcRow, bill.serviceSen > 0);
    show(sstRow, bill.sstSen > 0);
    show(roundRow, bill.roundingSen !== 0);
    if (payEl) {
      payEl.textContent =
        bill.pay === "cash" ? "Cash · 5-sen rounding" : bill.pay === "card" ? "Card" : "DuitNow";
    }
  }

  root.querySelectorAll("[data-lp-bill-toggle]").forEach((el) => {
    el.addEventListener("click", () => {
      const key = el.getAttribute("data-lp-bill-toggle");
      if (key === "sst") state.sstOn = !state.sstOn;
      if (key === "service") state.serviceOn = !state.serviceOn;
      if (key === "pay-duitnow") state.pay = "duitnow";
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
      state.sstOn = true;
      state.serviceOn = false;
      state.pay = "duitnow";
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
