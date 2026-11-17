import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SAMPLE_MENU,
  DEFAULT_QTY,
  SST_RATE,
  CASH_STEP_SEN,
  roundCash,
  calcBill,
  buildLines,
  formatRm,
  clampQty,
  withDefaultQty,
  menuById,
} from "../src/assets/lp-bill.mjs";

test("sample menu matches OrdenZ MY demo seed prices in sen", () => {
  assert.equal(SAMPLE_MENU.length, 5);
  assert.equal(menuById("teh-tarik").priceSen, 350);
  assert.equal(menuById("kopi-o").priceSen, 280);
  assert.equal(menuById("kaya-toast").priceSen, 450);
  assert.equal(menuById("nasi-lemak").priceSen, 890);
  assert.equal(menuById("roti-canai").priceSen, 250);
  for (const item of SAMPLE_MENU) {
    assert.ok(Number.isInteger(item.priceSen));
    assert.ok(item.priceSen > 0);
  }
});

test("default bill is Teh Tarik×2 + Nasi Lemak×1 with SST on, service off, DuitNow", () => {
  assert.deepEqual(DEFAULT_QTY, { "teh-tarik": 2, "nasi-lemak": 1 });
  const bill = calcBill();
  assert.equal(bill.subtotalSen, 350 * 2 + 890);
  assert.equal(bill.subtotalSen, 1590);
  assert.equal(bill.serviceSen, 0);
  assert.equal(bill.sstRate, SST_RATE);
  assert.equal(bill.sstSen, Math.round((1590 * 6) / 100)); // 95
  assert.equal(bill.sstSen, 95);
  assert.equal(bill.roundingSen, 0);
  assert.equal(bill.totalSen, 1685);
  assert.equal(bill.pay, "duitnow");
  assert.equal(bill.isCash, false);
  assert.equal(formatRm(bill.totalSen), "RM16.85");
});

test("integer sen only — no floating money in lines or totals", () => {
  const bill = calcBill({ qty: { "teh-tarik": 1, "roti-canai": 3 } });
  assert.ok(Number.isInteger(bill.subtotalSen));
  assert.ok(Number.isInteger(bill.sstSen));
  assert.ok(Number.isInteger(bill.serviceSen));
  assert.ok(Number.isInteger(bill.totalSen));
  for (const line of bill.lines) {
    assert.ok(Number.isInteger(line.unitSen));
    assert.ok(Number.isInteger(line.lineSen));
    assert.equal(line.lineSen, line.unitSen * line.qty);
  }
});

test("Malaysian cash 5-sen rounding; DuitNow stays exact", () => {
  assert.equal(CASH_STEP_SEN, 5);
  assert.equal(roundCash(1682), 1680);
  assert.equal(roundCash(1683), 1685);
  assert.equal(roundCash(12), 10);
  assert.equal(roundCash(13), 15);
  assert.equal(roundCash(0), 0);

  // Subtotal that yields a non-5 total before cash rounding: 280 (Kopi O) + SST 17 = 297
  const duit = calcBill({ qty: { "kopi-o": 1 }, sstOn: true, serviceOn: false, pay: "duitnow" });
  assert.equal(duit.totalSen, 280 + 17);
  assert.equal(duit.roundingSen, 0);

  const cash = calcBill({ qty: { "kopi-o": 1 }, sstOn: true, serviceOn: false, pay: "cash" });
  assert.equal(cash.totalSen, roundCash(297));
  assert.equal(cash.totalSen, 295);
  assert.equal(cash.roundingSen, -2);
});

test("SST off leaves tax at zero; service adds then SST applies on top", () => {
  const noTax = calcBill({ qty: DEFAULT_QTY, sstOn: false, serviceOn: false, pay: "duitnow" });
  assert.equal(noTax.sstSen, 0);
  assert.equal(noTax.totalSen, 1590);

  const withSvc = calcBill({
    qty: DEFAULT_QTY,
    sstOn: true,
    serviceOn: true,
    servicePct: 10,
    pay: "duitnow",
  });
  assert.equal(withSvc.serviceSen, Math.round((1590 * 10) / 100)); // 159
  assert.equal(withSvc.sstSen, Math.round(((1590 + 159) * 6) / 100)); // 105
  assert.equal(withSvc.totalSen, 1590 + 159 + 105);
});

test("qty helpers and formatRm stay safe", () => {
  assert.equal(clampQty(-1), 0);
  assert.equal(clampQty(100), 99);
  assert.equal(clampQty(2.7), 3);
  assert.equal(formatRm(0), "RM0.00");
  assert.equal(formatRm(5), "RM0.05");
  assert.equal(formatRm(350), "RM3.50");
  const q = withDefaultQty();
  assert.equal(q["teh-tarik"], 2);
  assert.equal(q["nasi-lemak"], 1);
  assert.equal(q["kopi-o"], 0);
  assert.deepEqual(
    buildLines({ "teh-tarik": 2 }).map((l) => l.lineSen),
    [700]
  );
});
