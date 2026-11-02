export type Category = "Perorangan" | "Wholesale" | "Hotel/Resort";
export type Unit = "kg" | "butir";
export type Quality = "Aktif" | "Karantina" | "Diblokir";
export type Product = 0 | 1 | 2;
export type Depot = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  radius: number;
  verified: boolean;
};
export type Lot = {
  id: string;
  parentId: string | null;
  depotId: string;
  product: Product | null;
  kg: number;
  eggs: number;
  harvest: string;
  expiry: string;
  quality: Quality;
  note: string;
};
export type Line = {
  product: Product;
  unit: Unit;
  quantity: number;
  price: number;
};
export type Allocation = {
  lotId: string;
  line: number;
  kg: number;
  eggs: number;
};
export type Order = {
  id: string;
  created: string;
  name: string;
  phone: string;
  address: string;
  category: Category;
  depotId: string;
  date: string;
  slot: string;
  due: string;
  lines: Line[];
  allocations: Allocation[];
  total: number;
  status: "Diproses" | "Dalam pengiriman" | "Selesai" | "Dibatalkan";
  packed: boolean;
  courier: string;
  recipient: string;
  notes: string;
};
export type Payment = {
  id: string;
  orderId: string;
  amount: number;
  date: string;
  reference: string;
};
export type Case = {
  id: string;
  orderId: string;
  description: string;
  created: string;
  returns: { line: number; kg: number; eggs: number; lotId: string }[];
  credit: number;
  refund: number;
  reference: string;
  resolution: string;
};
export type House = {
  id: string; code: string; name: string; farmLocation: string;
  depotId: string | null; capacity: number | null;
  initialPopulation: number | null; active: boolean;
};
export type FlockMovement = {
  id: string; date: string; kind: "in" | "out" | "transfer";
  fromHouseId: string | null; toHouseId: string | null;
  fromName: string; toName: string; quantity: number; note: string;
};
export type State = {
  schema: 2;
  app: "TelurFarm Native";
  revision: number;
  demo: boolean;
  depots: Depot[];
  houses?: House[];
  flockMovements?: FlockMovement[];
  lots: Lot[];
  orders: Order[];
  plans: PurchasePlan[];
  payments: Payment[];
  cases: Case[];
  production: {
    id: string;
    date: string;
    house: string;
    houseId?: string;
    eggs: number;
    kg: number;
    broken: number;
    feed: number;
    dead: number;
  }[];
  expenses: { id: string; date: string; label: string; amount: number }[];
  prices: Record<Category, number[][]>;
  audit: { time: string; text: string }[];
};
export type PurchasePlan = {
  id: string;
  sourceOrderId: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  category: Category;
  lines: Omit<Line, "price">[];
  slot: string;
  notes: string;
  nextDate: string;
  intervalDays: 7 | 14 | 28;
  active: boolean;
};
export type ReorderDraft = Pick<
  Order,
  "name" | "phone" | "address" | "category" | "slot" | "notes"
> & { lines: Line[]; date: string };
export const categories: Category[] = [
  "Perorangan",
  "Wholesale",
  "Hotel/Resort",
];
export const products = ["Telur reguler", "Telur pilihan", "Telur ekonomis"];
export const round = (n: number) => Math.round(n * 1e6) / 1e6;
export const today = () => new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
export function dateOK(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
function check(v: unknown, message: string): asserts v {
  if (!v) throw Error(message);
}
export function qty(n: number, integer = false) {
  return Number.isFinite(n) && n >= 0 && (!integer || Number.isSafeInteger(n));
}
export function baseState(): State {
  return {
    schema: 2,
    app: "TelurFarm Native",
    revision: 0,
    demo: false,
    depots: [
      {
        id: "anyer",
        name: "Depo Anyer",
        area: "Anyer, Banten",
        lat: -6.064,
        lng: 105.901,
        radius: 0,
        verified: false,
      },
      {
        id: "cilegon",
        name: "Depo Cilegon",
        area: "Cilegon, Banten",
        lat: -6.016,
        lng: 106.053,
        radius: 0,
        verified: false,
      },
      {
        id: "serang",
        name: "Depo Serang",
        area: "Serang, Banten",
        lat: -6.12,
        lng: 106.15,
        radius: 0,
        verified: false,
      },
    ],
    houses: defaultHouses(),
    lots: [],
    orders: [],
    plans: [],
    payments: [],
    cases: [],
    production: [],
    expenses: [],
    prices: {
      Perorangan: [
        [24000, 1500],
        [26000, 1700],
        [22000, 1400],
      ],
      Wholesale: [
        [23000, 1450],
        [25000, 1600],
        [21000, 1350],
      ],
      "Hotel/Resort": [
        [23500, 1500],
        [25500, 1650],
        [21500, 1400],
      ],
    },
    audit: [],
  };
}
export function demoState(): State {
  const s = baseState();
  s.demo = true;
  for (const d of s.depots)
    for (const product of [0, 1, 2] as Product[])
      s.lots.push({
        id: `demo-${d.id}-${product}`,
        parentId: null,
        depotId: d.id,
        product,
        kg: 60,
        eggs: 960,
        harvest: today(),
        expiry: "",
        quality: "Aktif",
        note: "Data contoh; bukan stok nyata",
      });
  return s;
}
export function audit(s: State, text: string) {
  s.audit.unshift({ time: new Date().toISOString(), text });
  s.audit = s.audit.slice(0, 1000);
}
export function distance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const r = Math.PI / 180,
    dlat = (b.lat - a.lat) * r,
    dlng = (b.lng - a.lng) * r,
    q =
      Math.sin(dlat / 2) ** 2 +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(Math.max(0, 1 - q)));
}
export function eligible(l: Lot, date: string) {
  return (
    l.product !== null &&
    l.quality === "Aktif" &&
    (!l.harvest || l.harvest <= date) &&
    (!l.expiry || l.expiry >= date)
  );
}
export function allocate(
  s: State,
  depotId: string,
  lines: Line[],
  date: string,
): { allocations: Allocation[]; lots: Lot[] } {
  check(dateOK(date), "Tanggal pengiriman tidak valid.");
  check(lines.length > 0, "Keranjang kosong.");
  const lots = s.lots.map((l) => ({ ...l })),
    allocations: Allocation[] = [];
  lines.forEach((line, index) => {
    check(
      [0, 1, 2].includes(line.product) &&
        ["kg", "butir"].includes(line.unit) &&
        qty(line.quantity, line.unit === "butir") &&
        line.quantity > 0 &&
        Number.isSafeInteger(line.price) &&
        line.price > 0,
      "Produk, satuan, jumlah, atau harga tidak valid.",
    );
    let remaining = line.quantity;
    const candidates = lots
      .filter(
        (l) =>
          l.depotId === depotId &&
          l.product === line.product &&
          eligible(l, date) &&
          l.kg > 0 &&
          l.eggs > 0,
      )
      .sort(
        (a, b) =>
          (a.expiry || "9999").localeCompare(b.expiry || "9999") ||
          (a.harvest || "9999").localeCompare(b.harvest || "9999") ||
          a.id.localeCompare(b.id),
      );
    for (const l of candidates) {
      if (remaining <= 1e-6) break;
      let kg = 0,
        eggs = 0;
      if (line.unit === "kg") {
        kg = Math.min(remaining, l.kg);
        eggs = Math.min(l.eggs, Math.ceil((kg / l.kg) * l.eggs - 1e-9));
      } else {
        eggs = Math.min(remaining, l.eggs);
        kg = round((eggs / l.eggs) * l.kg);
      }
      if (kg <= 0 || eggs <= 0) continue;
      l.kg = round(l.kg - kg);
      l.eggs -= eggs;
      remaining = round(remaining - (line.unit === "kg" ? kg : eggs));
      allocations.push({ lotId: l.id, line: index, kg, eggs });
    }
    check(
      remaining <= 1e-6,
      `${products[line.product]} tidak cukup di depo untuk tanggal kirim.`,
    );
  });
  return { allocations, lots };
}
export function rankedDepots(
  s: State,
  lines: Line[],
  date: string,
  location: { lat: number; lng: number } | null,
) {
  return s.depots
    .map((depot) => {
      const km = location ? distance(location, depot) : null;
      let reason = "";
      try {
        allocate(s, depot.id, lines, date);
      } catch (e) {
        reason = (e as Error).message;
      }
      if (km !== null && depot.radius > 0 && km > depot.radius)
        reason = "Di luar radius layanan";
      return { depot, km, available: !reason, reason };
    })
    .sort(
      (a, b) =>
        Number(b.available) - Number(a.available) ||
        (a.km ?? Infinity) - (b.km ?? Infinity),
    );
}
export function placeOrder(
  s: State,
  input: Omit<
    Order,
    | "allocations"
    | "total"
    | "status"
    | "packed"
    | "courier"
    | "recipient"
    | "created"
  >,
) {
  check(!s.orders.some((o) => o.id === input.id), "Nomor pesanan sudah ada.");
  check(
    input.name.trim() && input.phone.trim() && input.address.trim(),
    "Isi nama, telepon, dan alamat.",
  );
  check(categories.includes(input.category), "Kategori tidak valid.");
  check(
    dateOK(input.date) && input.date >= today() && dateOK(input.due),
    "Tanggal pengiriman atau jatuh tempo tidak valid.",
  );
  const expected = input.lines.map((l) => ({
    ...l,
    price: s.prices[input.category][l.product][l.unit === "kg" ? 0 : 1],
  }));
  const plan = allocate(s, input.depotId, expected, input.date);
  s.lots = plan.lots;
  s.orders.unshift({
    ...input,
    lines: expected,
    allocations: plan.allocations,
    total: expected.reduce((n, l) => n + Math.round(l.price * l.quantity), 0),
    status: "Diproses",
    packed: false,
    courier: "",
    recipient: "",
    created: new Date().toISOString(),
  });
  audit(s, "Pesanan " + input.id);
}
export function reorderDraft(
  s: State,
  orderId: string,
  date = today(),
): ReorderDraft {
  const o = s.orders.find((o) => o.id === orderId);
  check(o, "Pesanan asal tidak ditemukan.");
  check(
    dateOK(date) && date >= today(),
    "Pilih tanggal hari ini atau setelahnya.",
  );
  return {
    name: o.name,
    phone: o.phone,
    address: o.address,
    category: o.category,
    slot: o.slot,
    notes: o.notes,
    date,
    lines: o.lines.map((l) => ({
      product: l.product,
      unit: l.unit,
      quantity: l.quantity,
      price: s.prices[o.category][l.product][l.unit === "kg" ? 0 : 1],
    })),
  };
}
function validatePurchasePlan(s: State, p: PurchasePlan) {
  check(
    p &&
      typeof p === "object" &&
      typeof p.id === "string" &&
      p.id.length > 0 &&
      p.id.length <= 100,
    "ID jadwal tidak valid.",
  );
  check(
    s.orders.some((o) => o.id === p.sourceOrderId),
    "Pesanan asal jadwal tidak ditemukan.",
  );
  for (const text of [p.label, p.name, p.phone, p.address, p.slot])
    check(
      typeof text === "string" && text.trim().length > 0 && text.length <= 2000,
      "Lengkapi nama jadwal, pelanggan, telepon, alamat dan slot.",
    );
  check(
    typeof p.notes === "string" &&
      p.notes.length <= 5000 &&
      categories.includes(p.category) &&
      dateOK(p.nextDate) &&
      [7, 14, 28].includes(p.intervalDays) &&
      typeof p.active === "boolean",
    "Jadwal pembelian tidak valid.",
  );
  check(
    Array.isArray(p.lines) &&
      p.lines.length > 0 &&
      p.lines.length <= 100 &&
      p.lines.every(
        (l) =>
          l &&
          [0, 1, 2].includes(l.product) &&
          ["kg", "butir"].includes(l.unit) &&
          qty(l.quantity, l.unit === "butir") &&
          l.quantity > 0,
      ),
    "Isi produk dan jumlah jadwal dengan benar.",
  );
}
export function savePurchasePlan(s: State, p: PurchasePlan) {
  validatePurchasePlan(s, p);
  check(p.nextDate >= today(), "Tanggal berikutnya tidak boleh di masa lalu.");
  const index = s.plans.findIndex((x) => x.id === p.id);
  const saved = {
    ...p,
    lines: p.lines.map(({ product, unit, quantity }) => ({
      product,
      unit,
      quantity,
    })),
  };
  if (index < 0) s.plans.unshift(saved);
  else s.plans[index] = saved;
  audit(s, "Simpan jadwal " + p.label);
}
export function setPurchasePlanActive(s: State, id: string, active: boolean) {
  const p = s.plans.find((p) => p.id === id);
  check(p, "Jadwal tidak ditemukan.");
  p.active = active;
  audit(s, (active ? "Aktifkan " : "Jeda ") + "jadwal " + p.label);
}
export function plannedDraft(s: State, id: string): ReorderDraft {
  const p = s.plans.find((p) => p.id === id);
  check(p && p.active, "Jadwal tidak ditemukan atau sedang dijeda.");
  return {
    name: p.name,
    phone: p.phone,
    address: p.address,
    category: p.category,
    slot: p.slot,
    notes: p.notes,
    date: p.nextDate < today() ? today() : p.nextDate,
    lines: p.lines.map((l) => ({
      ...l,
      price: s.prices[p.category][l.product][l.unit === "kg" ? 0 : 1],
    })),
  };
}
export function nextOccurrence(
  anchor: string,
  intervalDays: number,
  after: string,
) {
  check(
    dateOK(anchor) && dateOK(after) && [7, 14, 28].includes(intervalDays),
    "Tanggal atau interval jadwal tidak valid.",
  );
  const start = Date.parse(anchor + "T12:00:00Z"),
    cutoff = Date.parse(after + "T12:00:00Z");
  const steps = Math.max(
    1,
    Math.floor((cutoff - start) / (intervalDays * 86400000)) + 1,
  );
  const next = new Date(start + steps * intervalDays * 86400000)
    .toISOString()
    .slice(0, 10);
  check(dateOK(next), "Tanggal berikutnya melewati rentang yang didukung.");
  return next;
}
export function placePlannedOrder(
  s: State,
  id: string,
  expectedDate: string,
  input: Parameters<typeof placeOrder>[1],
) {
  const p = s.plans.find((p) => p.id === id);
  check(
    p && p.active && p.nextDate === expectedDate,
    "Jadwal telah berubah. Buka kembali jadwal sebelum memesan.",
  );
  check(
    input.date >= expectedDate,
    "Tanggal kirim tidak boleh lebih awal dari jadwal yang dipilih.",
  );
  const next = nextOccurrence(p.nextDate, p.intervalDays, input.date);
  placeOrder(s, input);
  p.nextDate = next;
  audit(s, "Pesanan dari jadwal " + p.label + "; berikutnya " + next);
}
export function financial(s: State, o: Order) {
  const paid = s.payments
      .filter((p) => p.orderId === o.id)
      .reduce((a, p) => a + p.amount, 0),
    cases = s.cases.filter((c) => c.orderId === o.id),
    credit = cases.reduce((a, c) => a + c.credit, 0),
    refund = cases.reduce((a, c) => a + c.refund, 0),
    net = o.status === "Dibatalkan" ? 0 : o.total - credit;
  return {
    paid,
    credit,
    refund,
    net,
    balance: Math.max(0, net - paid + refund),
    refundDue: Math.max(0, paid - refund - net),
  };
}
export function cancelOrder(s: State, id: string) {
  const o = s.orders.find((o) => o.id === id);
  check(
    o && o.status === "Diproses" && financial(s, o).paid === 0,
    "Hanya pesanan belum dikirim dan belum dibayar dapat dibatalkan.",
  );
  for (const a of o.allocations) {
    const l = s.lots.find((l) => l.id === a.lotId)!;
    l.kg = round(l.kg + a.kg);
    l.eggs += a.eggs;
  }
  o.status = "Dibatalkan";
  audit(s, "Pembatalan " + id);
}
export function packOrder(
  s: State,
  id: string,
  measured: Allocation[],
  note: string,
) {
  const o = s.orders.find((o) => o.id === id);
  check(
    o && o.status === "Diproses" && note.trim(),
    "Pesanan atau catatan timbang tidak valid.",
  );
  const work = s.lots.map((l) => ({ ...l }));
  for (const a of o.allocations) {
    const l = work.find((l) => l.id === a.lotId)!;
    l.kg = round(l.kg + a.kg);
    l.eggs += a.eggs;
  }
  for (const a of measured) {
    const l = work.find((l) => l.id === a.lotId);
    check(
      l &&
        Number.isInteger(a.line) &&
        o.lines[a.line] &&
        l.depotId === o.depotId &&
        l.product === o.lines[a.line].product &&
        eligible(l, o.date > today() ? o.date : today()) &&
        qty(a.kg) &&
        a.kg > 0 &&
        qty(a.eggs, true) &&
        a.eggs > 0 &&
        a.kg <= l.kg + 1e-6 &&
        a.eggs <= l.eggs,
      "Hasil ukur melebihi stok, varian berbeda, atau batch tidak layak.",
    );
    l.kg = round(Math.max(0, l.kg - a.kg));
    l.eggs -= a.eggs;
  }
  o.lines.forEach((line, i) => {
    const rows = measured.filter((a) => a.line === i),
      kg = rows.reduce((s, a) => s + a.kg, 0),
      eggs = rows.reduce((s, a) => s + a.eggs, 0);
    check(
      rows.length &&
        Math.abs((line.unit === "kg" ? kg : eggs) - line.quantity) < 1e-6,
      "Hasil fisik harus sesuai jumlah pada satuan pembelian.",
    );
  });
  s.lots = work;
  o.allocations = measured;
  o.packed = true;
  o.notes = note;
  audit(s, "Hitung dan timbang " + id);
}
export function dispatch(s: State, id: string, courier: string) {
  const o = s.orders.find((o) => o.id === id);
  check(
    o &&
      o.status === "Diproses" &&
      o.packed &&
      courier.trim() &&
      o.date <= today(),
    "Timbang pesanan, isi kurir, dan periksa tanggal kirim.",
  );
  check(
    o.allocations.every((a) =>
      eligible(s.lots.find((l) => l.id === a.lotId)!, today()),
    ),
    "Batch tidak layak untuk dikirim.",
  );
  o.status = "Dalam pengiriman";
  o.courier = courier.trim();
  audit(s, "Mulai antar " + id);
}
export function receive(s: State, id: string, recipient: string) {
  const o = s.orders.find((o) => o.id === id);
  check(
    o && o.status === "Dalam pengiriman" && recipient.trim(),
    "Isi nama penerima untuk pesanan yang sedang dikirim.",
  );
  o.status = "Selesai";
  o.recipient = recipient.trim();
  audit(s, "Diterima " + recipient + " · " + id);
}
export function recordPayment(s: State, p: Payment) {
  const o = s.orders.find((o) => o.id === p.orderId);
  check(
    o &&
      o.status !== "Dibatalkan" &&
      Number.isSafeInteger(p.amount) &&
      p.amount > 0 &&
      p.amount <= financial(s, o).balance &&
      dateOK(p.date) &&
      p.date <= today() &&
      p.reference.trim() &&
      !s.payments.some((x) => x.id === p.id),
    "Jumlah pembayaran, tanggal, atau referensi tidak valid.",
  );
  s.payments.unshift(p);
  audit(s, "Pembayaran " + p.orderId);
}
export function createCase(s: State, c: Case) {
  const o = s.orders.find((o) => o.id === c.orderId);
  check(
    o &&
      o.status !== "Dibatalkan" &&
      c.description.trim() &&
      !s.cases.some((x) => x.id === c.id),
    "Pesanan atau keluhan tidak valid.",
  );
  check(
    c.credit === 0 && c.refund === 0 && c.returns.length === 0,
    "Kasus baru harus tanpa transaksi.",
  );
  s.cases.unshift(c);
  audit(s, "Keluhan " + c.orderId);
}
export function intakeReturn(
  s: State,
  caseId: string,
  items: { line: number; kg: number; eggs: number; lotId: string }[],
) {
  const c = s.cases.find((c) => c.id === caseId),
    o = c && s.orders.find((o) => o.id === c.orderId);
  check(
    c &&
      o &&
      !c.resolution &&
      ["Dalam pengiriman", "Selesai"].includes(o.status) &&
      c.returns.length === 0 &&
      items.length,
    "Retur hanya diterima sekali per kasus setelah pengiriman.",
  );
  const seen = new Set<number>();
  for (const item of items) {
    check(
      Number.isInteger(item.line) &&
        o.lines[item.line] &&
        !seen.has(item.line) &&
        qty(item.kg) &&
        item.kg > 0 &&
        qty(item.eggs, true) &&
        item.eggs > 0 &&
        !s.lots.some((l) => l.id === item.lotId),
      "Rincian retur tidak valid.",
    );
    seen.add(item.line);
    const prior = s.cases
        .filter((x) => x.orderId === o.id)
        .flatMap((x) => x.returns)
        .filter((r) => r.line === item.line),
      shipped = o.allocations.filter((a) => a.line === item.line);
    check(
      prior.reduce((n, r) => n + r.kg, 0) + item.kg <=
        shipped.reduce((n, a) => n + a.kg, 0) + 1e-6 &&
        prior.reduce((n, r) => n + r.eggs, 0) + item.eggs <=
          shipped.reduce((n, a) => n + a.eggs, 0),
      "Retur melebihi jumlah dikirim.",
    );
  }
  for (const item of items)
    s.lots.push({
      id: item.lotId,
      parentId: null,
      depotId: o.depotId,
      product: o.lines[item.line].product,
      kg: item.kg,
      eggs: item.eggs,
      harvest: "",
      expiry: "",
      quality: "Karantina",
      note: "Retur " + c.id + " · asal batch belum dipastikan",
    });
  c.returns = items;
  audit(s, "Terima retur " + caseId);
}
export function creditCase(s: State, id: string, amount: number) {
  const c = s.cases.find((c) => c.id === id),
    o = c && s.orders.find((o) => o.id === c.orderId);
  check(
    c &&
      o &&
      !c.resolution &&
      ["Dalam pengiriman", "Selesai"].includes(o.status) &&
      c.credit === 0 &&
      Number.isSafeInteger(amount) &&
      amount > 0 &&
      amount <= o.total - financial(s, o).credit,
    "Nota kredit melebihi sisa nilai pesanan atau belum boleh dibuat.",
  );
  c.credit = amount;
  audit(s, "Nota kredit " + id);
}
export function refundCase(
  s: State,
  id: string,
  amount: number,
  reference: string,
) {
  const c = s.cases.find((c) => c.id === id),
    o = c && s.orders.find((o) => o.id === c.orderId);
  check(
    c &&
      o &&
      !c.resolution &&
      reference.trim() &&
      Number.isSafeInteger(amount) &&
      amount > 0 &&
      amount <= c.credit - c.refund &&
      amount <= financial(s, o).refundDue,
    "Refund melebihi hak pengembalian atau referensi kosong.",
  );
  c.refund += amount;
  c.reference = c.reference ? c.reference + "; " + reference : reference;
  audit(s, "Refund manual " + id + " · " + amount + " · " + reference);
}
export function addLot(s: State, l: Lot) {
  check(
    !s.lots.some((x) => x.id === l.id) &&
      s.depots.some((d) => d.id === l.depotId) &&
      qty(l.kg) &&
      l.kg > 0 &&
      qty(l.eggs, true) &&
      l.eggs > 0 &&
      [null, 0, 1, 2].includes(l.product) &&
      ["Aktif", "Karantina", "Diblokir"].includes(l.quality) &&
      (!l.harvest || dateOK(l.harvest)) &&
      (!l.expiry || dateOK(l.expiry)) &&
      (!l.harvest || !l.expiry || l.expiry >= l.harvest) &&
      l.note.trim(),
    "Batch, jumlah, tanggal, atau catatan tidak valid.",
  );
  s.lots.push(l);
  audit(s, "Batch baru " + l.id);
}
export function transfer(
  s: State,
  id: string,
  to: string,
  kg: number,
  eggs: number,
  newId: string,
  note: string,
) {
  const l = s.lots.find((l) => l.id === id);
  check(
    l &&
      to !== l.depotId &&
      s.depots.some((d) => d.id === to) &&
      qty(kg) &&
      kg > 0 &&
      kg <= l.kg &&
      qty(eggs, true) &&
      eggs > 0 &&
      eggs <= l.eggs &&
      !s.lots.some((l) => l.id === newId) &&
      note.trim(),
    "Transfer batch tidak valid.",
  );
  l.kg = round(l.kg - kg);
  l.eggs -= eggs;
  s.lots.push({ ...l, id: newId, parentId: l.id, depotId: to, kg, eggs, note });
  audit(s, "Transfer " + id + " ke " + to);
}
export function validateState(v: unknown): State {
  check(v && typeof v === "object", "Berkas tidak valid.");
  const raw = v as
    | State
    | (Omit<State, "schema" | "plans"> & { schema: 1; plans?: never });
  if (raw.schema === 1)
    check(
      !("plans" in raw),
      "Cadangan lama memuat jadwal yang tidak sesuai schema.",
    );
  const s = (
    raw.schema === 1 ? { ...raw, schema: 2, plans: [] } : raw
  ) as State;
  ensureHouseMaster(s);
  check(
    s.app === "TelurFarm Native" &&
      s.schema === 2 &&
      Number.isSafeInteger(s.revision) &&
      s.revision >= 0 &&
      typeof s.demo === "boolean",
    "Berkas bukan cadangan PamanKu / TelurFarm Native v1/v2.",
  );
  for (const key of [
    "depots",
    "lots",
    "orders",
    "plans",
    "payments",
    "cases",
    "production",
    "expenses",
    "audit",
  ] as const)
    check(
      Array.isArray(s[key]) && s[key].length < 50000,
      "Struktur data tidak valid: " + key,
    );
  check(s.depots.length > 0 && s.depots.length <= 100, "Depo tidak valid.");
  const unique = (rows: { id: string }[]) =>
    rows.every(
      (r) => typeof r.id === "string" && r.id.length > 0 && r.id.length <= 100,
    ) && new Set(rows.map((r) => r.id)).size === rows.length;
  for (const rows of [
    s.depots,
    s.lots,
    s.orders,
    s.plans,
    s.payments,
    s.cases,
    s.production,
    s.expenses,
  ])
    check(unique(rows), "ID ganda atau tidak valid.");
  for (const d of s.depots)
    check(
      typeof d.name === "string" &&
        typeof d.area === "string" &&
        Number.isFinite(d.lat) &&
        Math.abs(d.lat) <= 90 &&
        Number.isFinite(d.lng) &&
        Math.abs(d.lng) <= 180 &&
        qty(d.radius) &&
        typeof d.verified === "boolean",
      "Koordinat depo tidak valid.",
    );
  for (const c of categories)
    check(
      Array.isArray(s.prices[c]) &&
        s.prices[c].length === 3 &&
        s.prices[c].every(
          (p) =>
            p.length === 2 && p.every((n) => Number.isSafeInteger(n) && n > 0),
        ),
      "Harga tidak valid.",
    );
  for (const l of s.lots) {
    check(
      s.depots.some((d) => d.id === l.depotId) &&
        [null, 0, 1, 2].includes(l.product) &&
        qty(l.kg) &&
        qty(l.eggs, true) &&
        ["Aktif", "Karantina", "Diblokir"].includes(l.quality) &&
        typeof l.note === "string" &&
        (!l.harvest || dateOK(l.harvest)) &&
        (!l.expiry || dateOK(l.expiry)) &&
        (!l.harvest || !l.expiry || l.expiry >= l.harvest),
      "Batch tidak valid.",
    );
    let parent = l.parentId;
    const visited = new Set([l.id]);
    while (parent) {
      check(!visited.has(parent), "Siklus batch tidak valid.");
      visited.add(parent);
      const next = s.lots.find((x) => x.id === parent);
      check(next, "Asal batch tidak ditemukan.");
      parent = next.parentId;
    }
  }
  for (const o of s.orders) {
    check(
      s.depots.some((d) => d.id === o.depotId) &&
        categories.includes(o.category) &&
        ["Diproses", "Dalam pengiriman", "Selesai", "Dibatalkan"].includes(
          o.status,
        ) &&
        typeof o.name === "string" &&
        typeof o.address === "string" &&
        typeof o.phone === "string" &&
        typeof o.courier === "string" &&
        typeof o.recipient === "string" &&
        typeof o.notes === "string" &&
        typeof o.slot === "string" &&
        typeof o.packed === "boolean" &&
        Number.isFinite(Date.parse(o.created)) &&
        dateOK(o.date) &&
        dateOK(o.due) &&
        Array.isArray(o.lines) &&
        o.lines.length > 0 &&
        o.lines.length <= 20 &&
        Array.isArray(o.allocations) &&
        o.allocations.length <= 1000,
      "Pesanan tidak valid.",
    );
    for (const l of o.lines)
      check(
        [0, 1, 2].includes(l.product) &&
          ["kg", "butir"].includes(l.unit) &&
          qty(l.quantity, l.unit === "butir") &&
          l.quantity > 0 &&
          Number.isSafeInteger(l.price) &&
          l.price > 0,
        "Item pesanan tidak valid.",
      );
    check(
      o.total ===
        o.lines.reduce((n, l) => n + Math.round(l.price * l.quantity), 0),
      "Nilai invoice tidak sesuai.",
    );
    for (const a of o.allocations) {
      const lot = s.lots.find((l) => l.id === a.lotId);
      check(
        lot &&
          Number.isInteger(a.line) &&
          o.lines[a.line] &&
          lot.product === o.lines[a.line].product &&
          lot.depotId === o.depotId &&
          qty(a.kg) &&
          a.kg > 0 &&
          qty(a.eggs, true) &&
          a.eggs > 0,
        "Alokasi tidak valid.",
      );
    }
    o.lines.forEach((line, i) =>
      check(
        Math.abs(
          o.allocations
            .filter((a) => a.line === i)
            .reduce((n, a) => n + (line.unit === "kg" ? a.kg : a.eggs), 0) -
            line.quantity,
        ) < 1e-6,
        "Jumlah alokasi tidak sesuai.",
      ),
    );
  }
  for (const p of s.payments)
    check(
      s.orders.some((o) => o.id === p.orderId && o.status !== "Dibatalkan") &&
        Number.isSafeInteger(p.amount) &&
        p.amount > 0 &&
        dateOK(p.date) &&
        typeof p.reference === "string" &&
        p.reference.trim(),
      "Pembayaran tidak valid.",
    );
  for (const c of s.cases) {
    const o = s.orders.find((o) => o.id === c.orderId);
    check(
      o &&
        o.status !== "Dibatalkan" &&
        typeof c.description === "string" &&
        c.description.trim() &&
        typeof c.resolution === "string" &&
        typeof c.reference === "string" &&
        Number.isFinite(Date.parse(c.created)) &&
        qty(c.credit, true) &&
        qty(c.refund, true) &&
        c.refund <= c.credit &&
        Array.isArray(c.returns),
      "Kasus tidak valid.",
    );
    const seen = new Set<number>();
    for (const r of c.returns) {
      check(
        o.lines[r.line] &&
          Number.isInteger(r.line) &&
          !seen.has(r.line) &&
          qty(r.kg) &&
          r.kg > 0 &&
          qty(r.eggs, true) &&
          r.eggs > 0 &&
          s.lots.some(
            (l) =>
              l.id === r.lotId &&
              l.product === o.lines[r.line].product &&
              l.depotId === o.depotId,
          ),
        "Retur tidak valid.",
      );
      seen.add(r.line);
    }
  }
  for (const o of s.orders) {
    const f = financial(s, o);
    check(
      f.paid <= o.total &&
        f.credit <= o.total &&
        f.refund <= Math.max(0, f.paid - (o.total - f.credit)),
      "Saldo keuangan tidak valid.",
    );
    o.lines.forEach((_, i) => {
      const returned = s.cases
          .filter((c) => c.orderId === o.id)
          .flatMap((c) => c.returns)
          .filter((r) => r.line === i),
        shipped = o.allocations.filter((a) => a.line === i);
      check(
        returned.reduce((n, r) => n + r.kg, 0) <=
          shipped.reduce((n, a) => n + a.kg, 0) + 1e-6 &&
          returned.reduce((n, r) => n + r.eggs, 0) <=
            shipped.reduce((n, a) => n + a.eggs, 0),
        "Retur melebihi pengiriman.",
      );
    });
  }
  for (const p of s.plans) validatePurchasePlan(s, p);
  for (const p of s.production)
    check(
      dateOK(p.date) &&
        typeof p.house === "string" &&
        qty(p.eggs, true) &&
        qty(p.kg) &&
        qty(p.broken, true) &&
        qty(p.feed) &&
        qty(p.dead, true),
      "Produksi tidak valid.",
    );
  for (const e of s.expenses)
    check(
      dateOK(e.date) &&
        typeof e.label === "string" &&
        Number.isSafeInteger(e.amount) &&
        e.amount > 0,
      "Biaya tidak valid.",
    );
  for (const a of s.audit)
    check(
      typeof a.text === "string" && Number.isFinite(Date.parse(a.time)),
      "Log tidak valid.",
    );
  validateFlockMovements(s);
  return s;
}
export function splitLot(
  s: State,
  id: string,
  product: Product,
  kg: number,
  eggs: number,
  newId: string,
  note: string,
) {
  const l = s.lots.find((l) => l.id === id);
  check(
    l &&
      l.quality !== "Diblokir" &&
      [0, 1, 2].includes(product) &&
      qty(kg) &&
      kg > 0 &&
      kg <= l.kg &&
      qty(eggs, true) &&
      eggs > 0 &&
      eggs <= l.eggs &&
      !s.lots.some((l) => l.id === newId) &&
      note.trim(),
    "Jumlah sortir, varian, atau batch sumber tidak valid.",
  );
  l.kg = round(l.kg - kg);
  l.eggs -= eggs;
  s.lots.push({
    ...l,
    id: newId,
    parentId: l.id,
    product,
    kg,
    eggs,
    quality: "Aktif",
    note,
  });
  audit(s, "Sortir " + id + " → " + newId + " · " + note);
}
export function correctLot(
  s: State,
  id: string,
  kg: number,
  eggs: number,
  increase: boolean,
  note: string,
) {
  const l = s.lots.find((l) => l.id === id);
  check(
    l &&
      qty(kg) &&
      qty(eggs, true) &&
      (kg > 0 || eggs > 0) &&
      note.trim() &&
      (increase || (kg <= l.kg && eggs <= l.eggs)),
    "Koreksi stok tidak valid.",
  );
  l.kg = round(l.kg + (increase ? kg : -kg));
  l.eggs += increase ? eggs : -eggs;
  audit(
    s,
    "Koreksi batch " +
      id +
      " · " +
      (increase ? "+" : "−") +
      kg +
      " kg / " +
      eggs +
      " butir · " +
      note,
  );
}

// v5.2 additive master; schema 2 transaction backups remain compatible.
export function defaultHouses(): House[] {
  return ["A","B","C"].map(c=>({id:"house-"+c.toLowerCase(),code:"KDG-"+c,name:"Kandang "+c,farmLocation:"Belum diatur",depotId:null,capacity:null,initialPopulation:null,active:true}));
}
const houseKey=(s:string)=>s.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("id-ID");
export function ensureHouseMaster(s: State) {
  check(Array.isArray(s.production)&&Array.isArray(s.depots),"Struktur produksi dan depo tidak valid.");
  if(s.houses===undefined){
    s.houses=defaultHouses();
    const names=[...new Set(s.production.map(p=>p.house))].sort();
    for(const name of names){
      check(typeof name==="string"&&name.trim().length>0&&name.length<=100,"Nama kandang lama tidak valid.");
      if(!s.houses.some(h=>houseKey(h.name)===houseKey(name)))s.houses.push({id:"house-history-"+s.houses.length,code:"ARSIP-"+s.houses.length,name:name.trim(),farmLocation:"Belum diatur",depotId:null,capacity:null,initialPopulation:null,active:true});
    }
  }
  check(Array.isArray(s.houses)&&s.houses.length<=500,"Master kandang tidak valid atau melebihi 500.");
  const ids=new Set<string>(),codes=new Set<string>(),names=new Set<string>();
  for(const h of s.houses){
    check(typeof h.id==="string"&&h.id.length>0&&h.id.length<=100&&!ids.has(h.id)&&typeof h.code==="string"&&/^[A-Z0-9_-]{1,30}$/.test(h.code)&&!codes.has(h.code)&&typeof h.name==="string"&&h.name.trim().length>0&&h.name.length<=100&&!names.has(houseKey(h.name))&&typeof h.farmLocation==="string"&&h.farmLocation.trim().length>0&&h.farmLocation.length<=300&&typeof h.active==="boolean"&&(h.depotId===null||s.depots.some(d=>d.id===h.depotId))&&(h.capacity===null||(Number.isSafeInteger(h.capacity)&&h.capacity>0&&h.capacity<=10000000))&&(h.initialPopulation===null||(Number.isSafeInteger(h.initialPopulation)&&h.initialPopulation>=0&&h.initialPopulation<=10000000))&&(h.capacity===null||h.initialPopulation===null||h.initialPopulation<=h.capacity),"Isi master kandang tidak valid atau kode/nama duplikat.");
    ids.add(h.id);codes.add(h.code);names.add(houseKey(h.name));
  }
  for(const p of s.production){
    if(p.houseId===undefined){const h=s.houses.find(h=>houseKey(h.name)===houseKey(p.house));check(h,"Kandang produksi tidak dikenal.");p.houseId=h.id;}
    check(typeof p.houseId==="string"&&ids.has(p.houseId),"Referensi kandang produksi tidak valid.");
  }
}
export function housePopulation(s:State,id:string):number|null {
  if(s.houses===undefined||s.production.some(p=>p.houseId===undefined))ensureHouseMaster(s);const h=s.houses!.find(h=>h.id===id);check(h,"Kandang tidak ditemukan.");
  return h.initialPopulation===null?null:h.initialPopulation-s.production.filter(p=>p.houseId===id).reduce((n,p)=>n+p.dead,0)+(s.flockMovements||[]).reduce((n,m)=>n+(m.toHouseId===id?m.quantity:0)-(m.fromHouseId===id?m.quantity:0),0);
}
export function saveHouse(s:State,input:House) {
  ensureHouseMaster(s);const old=s.houses!.find(h=>h.id===input.id),hasHistory=s.production.some(p=>p.houseId===input.id)||(s.flockMovements||[]).some(m=>m.fromHouseId===input.id||m.toHouseId===input.id);
  check(old||s.houses!.length<500,"Maksimal 500 kandang.");
  check(Number.isSafeInteger(input.capacity)&&input.capacity!>0&&Number.isSafeInteger(input.initialPopulation)&&input.initialPopulation!>=0&&input.initialPopulation!<=input.capacity!,"Kapasitas dan populasi awal harus bilangan bulat; populasi tidak melebihi kapasitas.");
  check(!old||!hasHistory||old.initialPopulation===null||old.initialPopulation===input.initialPopulation,"Populasi awal terkunci setelah ada produksi; histori tidak boleh diubah.");
  check(!old||!hasHistory||old.depotId===null||old.depotId===input.depotId,"Depo kandang terkunci setelah ada produksi.");
  check(input.depotId!==null,"Pilih depo hasil panen kandang.");
  const value={...input,code:input.code.normalize("NFKC").trim().toUpperCase(),name:input.name.trim().replace(/\s+/g," "),farmLocation:input.farmLocation.trim()};
  const next=structuredClone(s);next.houses=next.houses!.filter(h=>h.id!==value.id);next.houses.push(value);ensureHouseMaster(next);
  check(housePopulation(next,value.id)!>=0,"Populasi awal kurang dari mortalitas yang sudah tercatat.");
  validateFlockMovements(next);
  s.houses=next.houses;audit(s,(old?"Ubah":"Tambah")+" kandang "+value.code+" · "+value.name);
}
export function setHouseActive(s:State,id:string,active:boolean) {
  ensureHouseMaster(s);const h=s.houses!.find(h=>h.id===id);check(h&&typeof active==="boolean","Kandang atau status tidak valid.");h.active=active;audit(s,(active?"Aktifkan":"Nonaktifkan")+" kandang "+h.code);
}
export function houseForProduction(s:State,id:string,date:string,depotId:string,dead:number):House {
  ensureHouseMaster(s);const h=s.houses!.find(h=>h.id===id);
  check(h&&h.active,"Kandang tidak ditemukan atau tidak aktif.");
  check(s.depots.some(d=>d.id===depotId)&&(!h.depotId||h.depotId===depotId),"Depo hasil panen harus sesuai master kandang.");
  check(!s.production.some(p=>p.houseId===id&&p.date===date),"Produksi kandang pada tanggal tersebut sudah dicatat.");
  check(!(s.flockMovements||[]).some(m=>(m.fromHouseId===id||m.toHouseId===id)&&m.date>date),"Tanggal produksi mendahului mutasi populasi terakhir. Gunakan tanggal yang sama atau sesudahnya.");
  check(qty(dead,true),"Mortalitas tidak valid.");const pop=housePopulation(s,id);check(pop===null||dead<=pop,"Mortalitas melebihi populasi tercatat.");return h;
}

// v5.3 append-only population ledger. No destructive edit or removal command.
export function validateFlockMovements(s:State) {
  if(s.flockMovements===undefined)return; // old schema 2 backups remain unchanged
  check(Array.isArray(s.flockMovements)&&s.flockMovements.length<=10000,"Riwayat mutasi populasi tidak valid atau melebihi 10.000.");
  const ids=new Set<string>(),involved=new Set<string>();
  for(const m of s.flockMovements){
    check(typeof m.id==="string"&&m.id.length>0&&m.id.length<=100&&!ids.has(m.id)&&dateOK(m.date)&&m.date<=today()&&["in","out","transfer"].includes(m.kind)&&Number.isSafeInteger(m.quantity)&&m.quantity>0&&m.quantity<=10000000&&typeof m.note==="string"&&m.note.trim().length>0&&m.note.length<=300&&typeof m.fromName==="string"&&m.fromName.length<=100&&typeof m.toName==="string"&&m.toName.length<=100,"Mutasi populasi tidak valid.");
    check(m.kind==="in"?m.fromHouseId===null&&typeof m.toHouseId==="string":m.kind==="out"?typeof m.fromHouseId==="string"&&m.toHouseId===null:typeof m.fromHouseId==="string"&&typeof m.toHouseId==="string"&&m.fromHouseId!==m.toHouseId,"Asal dan tujuan mutasi tidak valid.");
    ids.add(m.id);
    for(const id of [m.fromHouseId,m.toHouseId])if(id!==null){const h=s.houses!.find(h=>h.id===id);check(h&&h.initialPopulation!==null&&h.capacity!==null,"Kandang mutasi harus memiliki kapasitas dan populasi awal.");involved.add(id);}
  }
  for(const id of involved){
    const h=s.houses!.find(h=>h.id===id)!;
    const days=new Map<string,number>();
    for(const p of s.production.filter(p=>p.houseId===id)){check(qty(p.dead,true),"Mortalitas tidak valid.");days.set(p.date,(days.get(p.date)||0)-p.dead);}
    for(const m of s.flockMovements){const delta=(m.toHouseId===id?m.quantity:0)-(m.fromHouseId===id?m.quantity:0);if(delta)days.set(m.date,(days.get(m.date)||0)+delta);}
    let pop=h.initialPopulation!;
    for(const [date,delta] of [...days.entries()].sort(([a],[b])=>a.localeCompare(b))){check(dateOK(date),"Tanggal populasi tidak valid.");pop+=delta;check(pop>=0&&pop<=h.capacity!,"Saldo populasi harian negatif atau melebihi kapasitas kandang.");}
  }
}
export function recordFlockMovement(s:State,input:Pick<FlockMovement,"id"|"date"|"kind"|"fromHouseId"|"toHouseId"|"quantity"|"note">) {
  ensureHouseMaster(s);validateFlockMovements(s);
  check(dateOK(input.date)&&input.date<=today(),"Tanggal mutasi tidak valid atau di masa depan.");
  check(["in","out","transfer"].includes(input.kind)&&Number.isSafeInteger(input.quantity)&&input.quantity>0&&input.quantity<=10000000,"Jumlah mutasi harus bilangan bulat positif.");
  check(input.kind==="in"?input.fromHouseId===null&&typeof input.toHouseId==="string":input.kind==="out"?typeof input.fromHouseId==="string"&&input.toHouseId===null:typeof input.fromHouseId==="string"&&typeof input.toHouseId==="string"&&input.fromHouseId!==input.toHouseId,"Pilih asal dan tujuan yang sesuai jenis mutasi.");
  const from=s.houses!.find(h=>h.id===input.fromHouseId),to=s.houses!.find(h=>h.id===input.toHouseId);
  for(const id of [input.fromHouseId,input.toHouseId])if(id!==null){
    const h=s.houses!.find(h=>h.id===id);check(h&&h.active&&h.initialPopulation!==null&&h.capacity!==null&&h.depotId!==null,"Pilih kandang aktif dengan kapasitas, depo dan populasi awal lengkap.");
    check(!s.production.some(p=>p.houseId===id&&p.date>input.date)&&!(s.flockMovements||[]).some(m=>(m.fromHouseId===id||m.toHouseId===id)&&m.date>input.date),"Tanggal mutasi mendahului transaksi kandang terakhir. Gunakan tanggal yang sama atau sesudahnya.");
  }
  if(from)check(housePopulation(s,from.id)!>=input.quantity,"Ayam keluar melebihi populasi kandang asal.");
  if(to)check(housePopulation(s,to.id)!+input.quantity<=to.capacity!,"Ayam masuk melebihi kapasitas kandang tujuan.");
  check(typeof input.note==="string","Catatan mutasi wajib diisi.");
  const record:FlockMovement={...input,note:input.note.trim(),fromName:from?.name||"",toName:to?.name||""};
  const next=structuredClone(s);next.flockMovements=[...(next.flockMovements||[]),record];validateFlockMovements(next);
  s.flockMovements=next.flockMovements;audit(s,"Mutasi populasi "+record.kind+" · "+record.quantity+" ekor · "+record.note);
}
