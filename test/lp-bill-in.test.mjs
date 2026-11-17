import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SAMPLE_MENU,
  DEFAULT_QTY,
  GST_RATE,
  calcBill,
  buildLines,
  formatInr,
  clampQty,
  withDefaultQty,
  menuById,
} from "../src/assets/lp-bill-in.mjs";

test("India sample menu uses integer paise", () => {
  assert.equal(SAMPLE_MENU.length, 5);
  assert.equal(menuById("filter-coffee").pricePaise, 4000);
  assert.equal(menuById("masala-chai").pricePaise, 3000);
  assert.equal(menuById("chicken-sandwich").pricePaise, 12000);
  for (const item of SAMPLE_MENU) {
    assert.ok(Number.isInteger(item.pricePaise));
    assert.ok(item.pricePaise > 0);
  }
});

test("default India bill is Filter Coffee×2 + Chicken Sandwich×1 with GST on, UPI", () => {
  assert.deepEqual(DEFAULT_QTY, { "filter-coffee": 2, "chicken-sandwich": 1 });
  const bill = calcBill();
  assert.equal(bill.subtotalPaise, 4000 * 2 + 12000);
  assert.equal(bill.subtotalPaise, 20000);
  assert.equal(bill.servicePaise, 0);
  assert.equal(bill.gstRate, GST_RATE);
  assert.equal(bill.gstPaise, Math.round((20000 * 5) / 100));
  assert.equal(bill.gstPaise, 1000);
  assert.equal(bill.cgstPaise + bill.sgstPaise, bill.gstPaise);
  assert.equal(bill.totalPaise, 21000);
  assert.equal(bill.pay, "upi");
  assert.equal(formatInr(bill.totalPaise), "₹210.00");
});

test("integer paise only — no floating money", () => {
  const bill = calcBill({ qty: { "masala-chai": 1, "brownie": 2 } });
  assert.ok(Number.isInteger(bill.subtotalPaise));
  assert.ok(Number.isInteger(bill.gstPaise));
  assert.ok(Number.isInteger(bill.totalPaise));
  for (const line of bill.lines) {
    assert.ok(Number.isInteger(line.unitPaise));
    assert.ok(Number.isInteger(line.linePaise));
    assert.equal(line.linePaise, line.unitPaise * line.qty);
  }
});

test("GST off leaves tax at zero; service then GST on top; cash stays exact", () => {
  const noTax = calcBill({ qty: DEFAULT_QTY, gstOn: false, serviceOn: false, pay: "upi" });
  assert.equal(noTax.gstPaise, 0);
  assert.equal(noTax.totalPaise, 20000);

  const withSvc = calcBill({ qty: DEFAULT_QTY, gstOn: true, serviceOn: true, servicePct: 10, pay: "cash" });
  assert.equal(withSvc.servicePaise, 2000);
  assert.equal(withSvc.gstPaise, Math.round((22000 * 5) / 100));
  assert.equal(withSvc.totalPaise, 22000 + withSvc.gstPaise);
  assert.equal(withSvc.isCash, true);

  assert.equal(clampQty(-1), 0);
  assert.equal(clampQty(100), 99);
  assert.deepEqual(withDefaultQty()["filter-coffee"], 2);
  assert.equal(buildLines({ "filter-coffee": 1 }).length, 1);
});
