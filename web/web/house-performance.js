// Generated from shared/house-performance.ts
const HP=(()=>{const exports={};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recentPerformancePeriod = recentPerformancePeriod;
exports.validatePerformanceFilters = validatePerformanceFilters;
exports.housePerformance = housePerformance;
exports.housePerformanceCsv = housePerformanceCsv;
function day(s) { if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s))
    return NaN; const n = Date.parse(s + "T12:00:00Z"); return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === s ? n : NaN; }
function recentPerformancePeriod(today) { const n = day(today); if (!Number.isFinite(n))
    throw Error("Tanggal acuan tidak valid."); return { from: new Date(n - 29 * 86400000).toISOString().slice(0, 10), to: today, house: "" }; }
function validatePerformanceFilters(raw, houseIds) {
    if (!raw || !Number.isFinite(day(raw.from)) || !Number.isFinite(day(raw.to)) || raw.from > raw.to || (day(raw.to) - day(raw.from)) / 86400000 >= 366 || typeof raw.house !== "string" || (raw.house !== "" && !houseIds.includes(raw.house)))
        throw Error("Pilih periode valid maksimal 366 hari dan kandang dalam cakupan.");
    return { from: raw.from, to: raw.to, house: raw.house };
}
function housePerformance(houses, production, raw) {
    const f = validatePerformanceFilters(raw, houses.map(h => h.id)), days = Math.round((day(f.to) - day(f.from)) / 86400000) + 1;
    if (new Set(houses.map(h => h.id)).size !== houses.length || houses.some(h => typeof h.id !== "string" || typeof h.code !== "string" || typeof h.name !== "string" || (h.population !== null && (!Number.isSafeInteger(h.population) || h.population < 0))))
        throw Error("Data kandang tidak valid.");
    const selected = houses.filter(h => !f.house || h.id === f.house), ids = new Set(selected.map(h => h.id)), seen = new Set();
    const scoped = production.filter(p => p.houseId && ids.has(p.houseId) && p.date >= f.from && p.date <= f.to);
    for (const p of scoped) {
        if (typeof p.id !== "string" || seen.has(p.id) || !Number.isFinite(day(p.date)) || [p.eggs, p.kg, p.broken, p.feed, p.dead].some(n => !Number.isFinite(n) || n < 0) || [p.eggs, p.broken, p.dead].some(n => !Number.isSafeInteger(n)))
            throw Error("Data produksi tidak valid.");
        seen.add(p.id);
    }
    const rows = selected.map(h => { const records = scoped.filter(p => p.houseId === h.id), recordedDays = new Set(records.map(p => p.date)).size, sum = (k) => records.reduce((n, p) => n + p[k], 0), eggs = sum("eggs"), kg = sum("kg"), feed = sum("feed"); return { ...h, records: records.length, recordedDays, missingDays: days - recordedDays, coveragePercent: recordedDays / days * 100, eggs, kg, broken: sum("broken"), feed, dead: sum("dead"), eggsPerRecordedDay: recordedDays ? eggs / recordedDays : null, feedPerKg: kg ? feed / kg : null }; });
    const total = (key) => rows.reduce((n, r) => n + r[key], 0), populationKnown = rows.reduce((n, r) => n + (r.population ?? 0), 0), populationMissing = rows.filter(r => r.population === null).length;
    return { filters: f, days, rows, summary: { houses: rows.length, population: populationMissing ? null : populationKnown, populationKnown, populationMissing, eggs: total("eggs"), kg: total("kg"), broken: total("broken"), feed: total("feed"), dead: total("dead"), records: total("records"), recordedHouseDays: total("recordedDays"), coveragePercent: rows.length ? total("recordedDays") / (days * rows.length) * 100 : null } };
}
function cell(v) { let s = String(v ?? ""); if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(s))
    s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }
function housePerformanceCsv(r, context) {
    const lines = [["PamanKu 6.0 — Ringkasan kandang"], ["Ruang kerja", context.workspace], ["Dibuat UTC", context.generated], ["Dari", r.filters.from], ["Sampai", r.filters.to], ["Kandang", r.filters.house || "Semua dalam cakupan"], ["Hari periode", r.days], ["Populasi adalah saldo saat ini, bukan populasi historis periode."], ["Rata-rata telur/hari hanya hari yang memiliki catatan; tanpa catatan bukan produksi nol."], ["Pakan per kg telur adalah rasio catatan periode, bukan FCR biologis terverifikasi."], [], ["Kode", "Kandang", "Populasi kini", "Telur baik butir", "Telur baik kg", "Rusak butir", "Pakan kg", "Mortalitas ekor", "Catatan", "Hari tercatat", "Hari tanpa catatan", "Kelengkapan %", "Telur/hari tercatat", "Pakan kg/kg telur"]];
    for (const x of r.rows)
        lines.push([x.code, x.name, x.population ?? "Belum diketahui", x.eggs, x.kg, x.broken, x.feed, x.dead, x.records, x.recordedDays, x.missingDays, x.coveragePercent, x.eggsPerRecordedDay ?? "", x.feedPerKg ?? ""]);
    return lines.map(x => x.map(cell).join(",")).join("\r\n");
}

return exports;})();
