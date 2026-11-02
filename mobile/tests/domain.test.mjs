import test from "node:test";
import assert from "node:assert/strict";
import * as D from "../src/domain.ts";
function purchasePlan(s) {
  const o = s.orders[0];
  return {
    id: "plan-a",
    sourceOrderId: o.id,
    label: "Pasokan hotel mingguan",
    name: o.name,
    phone: o.phone,
    address: o.address,
    category: o.category,
    lines: o.lines.map(({ product, unit, quantity }) => ({
      product,
      unit,
      quantity,
    })),
    slot: o.slot,
    notes: o.notes,
    nextDate: D.today(),
    intervalDays: 7,
    active: true,
  };
}
const line = (product = 0, unit = "kg", quantity = 1) => ({
  product,
  unit,
  quantity,
  price: 24000,
});
function ordered() {
  const s = D.demoState();
  D.placeOrder(s, {
    id: "test-order",
    name: "Hotel A",
    phone: "0812",
    address: "Anyer",
    category: "Hotel/Resort",
    depotId: "anyer",
    date: D.today(),
    due: D.today(),
    slot: "Pagi",
    notes: "",
    lines: [line()],
  });
  return s;
}
function shipped(paid = false) {
  const s = ordered(),
    o = s.orders[0];
  D.packOrder(s, o.id, o.allocations, "Pemeriksaan fisik");
  D.dispatch(s, o.id, "Kurir A");
  D.receive(s, o.id, "PIC Hotel");
  if (paid)
    D.recordPayment(s, {
      id: "pay",
      orderId: o.id,
      amount: o.total,
      date: D.today(),
      reference: "Transfer diterima",
    });
  return s;
}
function newCase(s, id = "case") {
  D.createCase(s, {
    id,
    orderId: s.orders[0].id,
    description: "Butir rusak",
    created: new Date().toISOString(),
    returns: [],
    credit: 0,
    refund: 0,
    reference: "",
    resolution: "",
  });
}
test("starts empty; demo is explicit; strict backup roundtrip", () => {
  assert.equal(D.baseState().lots.length, 0);
  assert.equal(D.demoState().demo, true);
  const s = shipped(true);
  assert.deepEqual(D.validateState(JSON.parse(JSON.stringify(s))), s);
});
test("legacy backup migrates without losing stock, orders or revision", () => {
  const s = ordered();
  s.revision = 8;
  const old = JSON.parse(JSON.stringify(s));
  delete old.plans;
  old.schema = 1;
  const migrated = D.validateState(old);
  assert.equal(migrated.schema, 2);
  assert.deepEqual(migrated.plans, []);
  assert.deepEqual(migrated.orders, s.orders);
  assert.deepEqual(migrated.lots, s.lots);
  assert.equal(migrated.revision, 8);
  assert.equal(old.schema, 1);
  assert.equal("plans" in old, false);
});
test("reorder uses current category prices, keeps original immutable and does not reserve stock", () => {
  const s = ordered(),
    o = s.orders[0];
  s.prices["Hotel/Resort"][0][0] = 29000;
  const before = JSON.stringify(s),
    draft = D.reorderDraft(s, o.id);
  assert.equal(draft.lines[0].price, 29000);
  assert.equal(draft.name, "Hotel A");
  assert.equal(draft.date, D.today());
  draft.lines[0].quantity = 3;
  assert.equal(JSON.stringify(s), before);
  assert.throws(() => D.reorderDraft(s, "missing"));
});
test("schedule does not reserve stock or create orders, and roundtrips backup", () => {
  const s = ordered(),
    lots = JSON.stringify(s.lots);
  const p = purchasePlan(s);
  D.savePurchasePlan(s, p);
  p.lines[0].quantity = 4;
  assert.equal(s.plans[0].lines[0].quantity, 1);
  assert.equal(JSON.stringify(s.lots), lots);
  assert.equal(s.orders.length, 1);
  assert.deepEqual(D.validateState(JSON.parse(JSON.stringify(s))), s);
});
test("paused schedule cannot prepare or confirm an order", () => {
  const s = ordered();
  D.savePurchasePlan(s, purchasePlan(s));
  D.setPurchasePlanActive(s, "plan-a", false);
  assert.throws(() => D.plannedDraft(s, "plan-a"));
  const before = JSON.stringify(s);
  assert.throws(() =>
    D.placePlannedOrder(s, "plan-a", D.today(), {
      ...s.orders[0],
      id: "repeat",
    }),
  );
  assert.equal(JSON.stringify(s), before);
  D.setPurchasePlanActive(s, "plan-a", true);
  assert.equal(D.plannedDraft(s, "plan-a").category, "Hotel/Resort");
});
test("schedule intervals cross leap day and year without timezone drift", () => {
  assert.equal(D.nextOccurrence("2028-02-25", 7, "2028-02-25"), "2028-03-03");
  assert.equal(D.nextOccurrence("2026-12-25", 14, "2026-12-25"), "2027-01-08");
  assert.equal(D.nextOccurrence("2026-01-01", 7, "2026-01-22"), "2026-01-29");
  assert.equal(D.nextOccurrence("2026-01-01", 28, "2026-02-05"), "2026-02-26");
  assert.throws(() => D.nextOccurrence("2026-02-30", 7, D.today()));
});
test("successful planned checkout advances once; stale duplicate confirmation rejected", () => {
  const s = ordered();
  D.savePurchasePlan(s, purchasePlan(s));
  const expected = s.plans[0].nextDate;
  D.placePlannedOrder(s, "plan-a", expected, { ...s.orders[0], id: "repeat" });
  assert.equal(s.orders.length, 2);
  assert.equal(s.plans[0].nextDate, D.nextOccurrence(expected, 7, expected));
  const before = JSON.stringify(s);
  assert.throws(() =>
    D.placePlannedOrder(s, "plan-a", expected, {
      ...s.orders[0],
      id: "duplicate",
    }),
  );
  assert.equal(JSON.stringify(s), before);
  D.validateState(s);
});
test("insufficient stock does not advance schedule or create partially reserved order", () => {
  const s = ordered();
  D.savePurchasePlan(s, purchasePlan(s));
  const before = JSON.stringify(s);
  assert.throws(() =>
    D.placePlannedOrder(s, "plan-a", D.today(), {
      ...s.orders[0],
      id: "repeat",
      lines: [line(0, "kg", 10000)],
    }),
  );
  assert.equal(JSON.stringify(s), before);
});
test("overdue plan prepares today and skips missed dates only after confirmation", () => {
  const s = ordered();
  D.savePurchasePlan(s, purchasePlan(s));
  s.plans[0].nextDate = "2020-01-01";
  const draft = D.plannedDraft(s, "plan-a");
  assert.equal(draft.date, D.today());
  assert.equal(s.plans[0].nextDate, "2020-01-01");
  D.placePlannedOrder(s, "plan-a", "2020-01-01", {
    ...s.orders[0],
    id: "repeat",
  });
  assert(s.plans[0].nextDate > D.today());
});
test("schedule validation rejects corrupt backups and invalid quantities", () => {
  const s = ordered(),
    p = purchasePlan(s);
  for (const patch of [
    { intervalDays: 0 },
    { active: "yes" },
    { sourceOrderId: "missing" },
    { nextDate: "2026-02-30" },
    { lines: [{ product: 0, unit: "butir", quantity: 1.2 }] },
  ])
    assert.throws(() => D.savePurchasePlan(s, { ...p, ...patch }));
  D.savePurchasePlan(s, p);
  const duplicate = structuredClone(s);
  duplicate.plans.push(structuredClone(duplicate.plans[0]));
  assert.throws(() => D.validateState(duplicate));
  const missing = structuredClone(s);
  delete missing.plans;
  assert.throws(() => D.validateState(missing));
  const falseLegacy = structuredClone(s);
  falseLegacy.schema = 1;
  assert.throws(() => D.validateState(falseLegacy));
});
test("nearest depot is filtered by exact variant, service radius and stock", () => {
  const s = D.demoState();
  s.lots.find((l) => l.depotId === "anyer" && l.product === 1).quality =
    "Karantina";
  const r = D.rankedDepots(s, [line(1)], D.today(), s.depots[0]);
  assert.equal(r[0].depot.id, "cilegon");
  s.depots[1].radius = 0.1;
  assert.equal(
    D.rankedDepots(s, [line(1)], D.today(), s.depots[0])[0].depot.id,
    "serang",
  );
});
test("distance stable and unknown customer location has no invented distance", () => {
  assert.equal(D.distance({ lat: 0, lng: 0 }, { lat: 0, lng: 0 }), 0);
  assert(D.distance({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) > 111);
  assert(
    D.rankedDepots(D.demoState(), [line()], D.today(), null).every(
      (r) => r.km === null,
    ),
  );
});
test("FEFO and future harvest gate", () => {
  const s = D.demoState(),
    l = s.lots[0];
  s.lots.push({ ...l, id: "early", expiry: D.today(), kg: 1, eggs: 16 });
  const p = D.allocate(s, "anyer", [line()], D.today());
  assert.equal(p.allocations[0].lotId, "early");
  s.lots[0].harvest = "2099-01-01";
  assert.throws(() => D.allocate(s, "anyer", [line(0, "kg", 3)], D.today()));
  assert.equal(l.kg, 60);
});
test("mixed kg and pieces reserve one shared pool atomically", () => {
  const s = D.demoState();
  const before = JSON.stringify(s);
  assert.throws(() =>
    D.allocate(
      s,
      "anyer",
      [line(0, "kg", 59), line(0, "butir", 32)],
      D.today(),
    ),
  );
  assert.equal(JSON.stringify(s), before);
  const p = D.allocate(
    s,
    "anyer",
    [line(0, "kg", 1), line(0, "butir", 10)],
    D.today(),
  );
  assert.equal(
    p.allocations.reduce((n, a) => n + a.eggs, 0),
    26,
  );
  assert(Math.abs(p.lots[0].kg - (60 - 1 - 0.625)) < 1e-6);
});
test("prices are category snapshots and cannot be supplied by checkout", () => {
  const s = ordered(),
    o = s.orders[0];
  assert.equal(o.total, 23500);
  s.prices["Hotel/Resort"][0][0] = 99999;
  assert.equal(o.total, 23500);
  D.validateState(s);
});
test("cancellation restores roots once and cannot cancel a paid order", () => {
  const s = ordered(),
    id = s.orders[0].id;
  assert.equal(s.lots[0].kg, 59);
  D.cancelOrder(s, id);
  assert.equal(s.lots[0].kg, 60);
  assert.throws(() => D.cancelOrder(s, id));
  const p = ordered();
  D.recordPayment(p, {
    id: "pay",
    orderId: p.orders[0].id,
    amount: 1000,
    date: D.today(),
    reference: "Tunai",
  });
  assert.throws(() => D.cancelOrder(p, p.orders[0].id));
});
test("physical measurement preserves invoice and rejects partial mutations", () => {
  const s = ordered(),
    o = s.orders[0],
    before = JSON.stringify(s);
  assert.throws(() =>
    D.packOrder(s, o.id, [{ ...o.allocations[0], kg: 2 }], "Timbang"),
  );
  assert.equal(JSON.stringify(s), before);
  D.packOrder(s, o.id, [{ ...o.allocations[0], eggs: 17 }], "17 butir aktual");
  assert.equal(o.total, 23500);
  assert.equal(o.allocations[0].eggs, 17);
  assert.equal(s.lots[0].eggs, 943);
  D.validateState(s);
});
test("dispatch needs physical packing, courier, and live lot eligibility", () => {
  const s = ordered(),
    o = s.orders[0];
  assert.throws(() => D.dispatch(s, o.id, "Kurir"));
  D.packOrder(s, o.id, o.allocations, "Cek");
  s.lots[0].quality = "Diblokir";
  assert.throws(() => D.dispatch(s, o.id, "Kurir"));
  s.lots[0].quality = "Aktif";
  D.dispatch(s, o.id, "Kurir");
  assert.throws(() => D.receive(s, o.id, ""));
  D.receive(s, o.id, "PIC");
  assert.equal(o.status, "Selesai");
});
test("return intake is single, aggregate capped, and quarantined", () => {
  const s = shipped();
  newCase(s);
  D.intakeReturn(s, "case", [{ line: 0, kg: 0.5, eggs: 8, lotId: "return" }]);
  assert.equal(s.lots.at(-1).quality, "Karantina");
  assert(!D.eligible(s.lots.at(-1), D.today()));
  assert.throws(() =>
    D.intakeReturn(s, "case", [
      { line: 0, kg: 0.1, eggs: 1, lotId: "duplicate" },
    ]),
  );
  newCase(s, "case2");
  const before = JSON.stringify(s);
  assert.throws(() =>
    D.intakeReturn(s, "case2", [
      { line: 0, kg: 0.6, eggs: 9, lotId: "excess" },
    ]),
  );
  assert.equal(JSON.stringify(s), before);
  D.validateState(s);
});
test("credit reduces unpaid debt; full paid credit produces bounded manual refund", () => {
  const s = shipped(true),
    o = s.orders[0];
  newCase(s);
  D.creditCase(s, "case", 3000);
  assert.equal(D.financial(s, o).refundDue, 3000);
  assert.throws(() => D.refundCase(s, "case", 4000, "Transfer"));
  D.refundCase(s, "case", 3000, "Bukti transfer refund");
  assert.equal(D.financial(s, o).refundDue, 0);
  assert.equal(D.financial(s, o).balance, 0);
  D.validateState(s);
  const unpaid = shipped();
  newCase(unpaid);
  D.creditCase(unpaid, "case", 3000);
  assert.equal(D.financial(unpaid, unpaid.orders[0]).balance, 20500);
  assert.equal(D.financial(unpaid, unpaid.orders[0]).refundDue, 0);
});
test("multiple case refund entitlement shared, closed cases cannot mutate", () => {
  const s = shipped(true);
  newCase(s);
  newCase(s, "case2");
  D.creditCase(s, "case", 3000);
  D.creditCase(s, "case2", 2000);
  D.refundCase(s, "case", 3000, "Paid A");
  assert.throws(() => D.refundCase(s, "case2", 3000, "Over"));
  D.refundCase(s, "case2", 2000, "Paid B");
  s.cases[0].resolution = "Selesai";
  assert.throws(() =>
    D.intakeReturn(s, "case2", [{ line: 0, kg: 1, eggs: 16, lotId: "bad" }]),
  );
  D.validateState(s);
});
test("transfer conserves quantity and provenance and quality", () => {
  const s = D.demoState();
  s.lots[0].quality = "Karantina";
  const before = s.lots.reduce((n, l) => n + l.kg, 0);
  D.transfer(s, s.lots[0].id, "serang", 2, 32, "moved", "Serah terima");
  assert.equal(
    s.lots.reduce((n, l) => n + l.kg, 0),
    before,
  );
  assert.equal(s.lots.at(-1).parentId, s.lots[0].id);
  assert.equal(s.lots.at(-1).quality, "Karantina");
  D.validateState(s);
});
test("backup rejects corrupt money, alocations, parent cycles and over-returns", () => {
  const source = shipped(true);
  newCase(source);
  D.intakeReturn(source, "case", [
    { line: 0, kg: 0.1, eggs: 1, lotId: "return" },
  ]);
  for (const corrupt of [
    (s) => s.orders[0].total++,
    (s) => (s.orders[0].allocations[0].kg += 1),
    (s) => (s.lots[0].parentId = s.lots[0].id),
    (s) => (s.cases[0].returns[0].kg = 999),
    (s) => (s.payments[0].amount = 999999),
    (s) => (s.depots[0].lat = NaN),
  ]) {
    const bad = structuredClone(source);
    corrupt(bad);
    assert.throws(() => D.validateState(bad));
  }
});
test("invalid dates, fractional pieces, and zero orders rejected", () => {
  assert.equal(D.dateOK("2026-02-30"), false);
  assert.equal(D.dateOK("2026-99-99"), false);
  assert.equal(D.dateOK("2024-02-29"), true);
  assert.throws(() =>
    D.allocate(D.demoState(), "anyer", [line(0, "butir", 1.5)], D.today()),
  );
  assert.throws(() => D.allocate(D.demoState(), "anyer", [], D.today()));
});
test("partial sorting conserves total; blocked source and excess correction rejected", () => {
  const s = D.demoState(),
    kg = s.lots.reduce((n, l) => n + l.kg, 0),
    eggs = s.lots.reduce((n, l) => n + l.eggs, 0),
    id = s.lots[0].id;
  D.splitLot(s, id, 1, 2, 32, "sorted", "Diperiksa layak jual");
  assert.equal(
    s.lots.reduce((n, l) => n + l.kg, 0),
    kg,
  );
  assert.equal(
    s.lots.reduce((n, l) => n + l.eggs, 0),
    eggs,
  );
  assert.equal(s.lots.at(-1).product, 1);
  s.lots[0].quality = "Diblokir";
  assert.throws(() => D.splitLot(s, id, 1, 2, 32, "blocked", "Tidak boleh"));
  D.correctLot(s, id, 0, 1, false, "Selisih hitungan");
  assert.throws(() => D.correctLot(s, id, 9999, 0, false, "Excess"));
  D.validateState(s);
});
