// Generated from shared/flock-report.ts
const FR=(()=>{const exports={};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyMonitorFilterStore = exports.healthLabels = exports.kindLabels = exports.statusLabels = exports.emptyMonitorFilters = void 0;
exports.validateMonitorFilters = validateMonitorFilters;
exports.filterMonitorRows = filterMonitorRows;
exports.monitorSummary = monitorSummary;
exports.monitorPage = monitorPage;
exports.csvCell = csvCell;
exports.monitorCsv = monitorCsv;
exports.validateMonitorFilterStore = validateMonitorFilterStore;
exports.addMonitorSavedFilter = addMonitorSavedFilter;
exports.removeMonitorSavedFilter = removeMonitorSavedFilter;
exports.renameMonitorSavedFilter = renameMonitorSavedFilter;
exports.updateMonitorSavedFilter = updateMonitorSavedFilter;
exports.duplicateMonitorSavedFilter = duplicateMonitorSavedFilter;
exports.setMonitorSavedFavorite = setMonitorSavedFavorite;
exports.listMonitorSavedFilters = listMonitorSavedFilters;
const emptyMonitorFilters = () => ({ kind: 'all', house: '', from: '', to: '', query: '', status: 'all', health: 'all' });
exports.emptyMonitorFilters = emptyMonitorFilters;
exports.statusLabels = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak', withdrawn: 'Ditarik', executed: 'Dijalankan' };
exports.kindLabels = { in: 'Masuk', out: 'Keluar / afkir', transfer: 'Pindah kandang' };
exports.healthLabels = { current: 'Sumber sesuai', changed: 'Sumber berubah', blocked: 'Penugasan berubah', closed: 'Selesai' };
const key = (s) => s.normalize('NFKC').toLocaleLowerCase('id-ID');
function validDay(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
    return false; const d = new Date(s + 'T12:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s; }
function validateMonitorFilters(raw, houseIds) {
    if (!raw || !['all', 'in', 'out', 'transfer'].includes(raw.kind) || !['all', 'pending', 'approved', 'rejected', 'withdrawn', 'executed'].includes(raw.status) || !['all', 'current', 'changed', 'blocked', 'closed'].includes(raw.health) || typeof raw.house !== 'string' || (raw.house !== '' && !houseIds.includes(raw.house)) || typeof raw.from !== 'string' || typeof raw.to !== 'string' || (raw.from !== '' && !validDay(raw.from)) || (raw.to !== '' && !validDay(raw.to)) || (raw.from !== '' && raw.to !== '' && raw.from > raw.to) || typeof raw.query !== 'string' || [...raw.query].length > 80)
        throw Error('Filter tidak valid: periksa kandang, periode, atau pencarian maksimal 80 karakter.');
    return { ...raw, query: raw.query.trim() };
}
function filterMonitorRows(rows, filters, houseIds) {
    const f = validateMonitorFilters(filters, houseIds), q = key(f.query);
    return rows.filter(r => (f.kind === 'all' || r.kind === f.kind) && (!f.house || r.fromHouseId === f.house || r.toHouseId === f.house) && (!f.from || r.date >= f.from) && (!f.to || r.date <= f.to) && (f.status === 'all' || r.status === f.status) && (f.health === 'all' || r.health === f.health) && (!q || key([r.id, r.fromName, r.toName, r.note].join(' ')).includes(q))).slice().reverse().sort((a, b) => b.date.localeCompare(a.date));
}
function monitorSummary(rows) { return { count: rows.length, volume: rows.reduce((n, r) => n + r.quantity, 0), pending: rows.filter(r => r.status === 'pending').length, approved: rows.filter(r => r.status === 'approved').length, changed: rows.filter(r => r.health === 'changed').length, blocked: rows.filter(r => r.health === 'blocked').length }; }
function monitorPage(rows, page, size = 25) { if (!Number.isSafeInteger(page) || page < 1 || ![20, 25, 50].includes(size))
    throw Error('Halaman laporan tidak valid.'); const totalPages = Math.max(1, Math.ceil(rows.length / size)), current = Math.min(page, totalPages); return { rows: rows.slice((current - 1) * size, current * size), page: current, totalPages, total: rows.length }; }
function csvCell(value) { let text = String(value ?? ''); if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(text))
    text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }
function monitorCsv(rows, filters, houseIds, context) {
    const f = validateMonitorFilters(filters, houseIds);
    const lines = [['PamanKu 6.0 — Laporan mutasi sesuai cakupan akses'], ['Ruang kerja', context.workspace], ['Peran', context.role], ['Sumber', context.source], ['Waktu ekspor', context.generated], ['Jenis', f.kind], ['Kandang', f.house || 'Semua terlihat'], ['Dari', f.from || 'Tanpa batas'], ['Sampai', f.to || 'Tanpa batas'], ['Pencarian', f.query], ['Status', f.status], ['Kondisi sumber', f.health], ['Jumlah baris', rows.length], ['Volume ekor adalah jumlah transaksi, bukan populasi unik atau saldo kandang.'], [], ['ID', 'Tanggal mutasi', 'Jenis', 'Asal', 'Tujuan', 'Ekor', 'Status', 'Kondisi sumber', 'Alasan', 'Pembuat', 'Pemeriksa']];
    for (const r of rows)
        lines.push([r.id, r.date, exports.kindLabels[r.kind] || r.kind, r.fromName, r.toName, r.quantity, exports.statusLabels[r.status] || r.status, exports.healthLabels[r.health] || r.health, r.note, r.maker || '', r.approver || '']);
    return lines.map(line => line.map(csvCell).join(',')).join('\r\n');
}
const emptyMonitorFilterStore = () => ({ schema: 1, revision: 0, items: [] });
exports.emptyMonitorFilterStore = emptyMonitorFilterStore;
function validateMonitorFilterStore(value) {
    const v = value;
    if (!v || v.schema !== 1 || !Number.isSafeInteger(v.revision) || v.revision < 0 || !Array.isArray(v.items) || v.items.length > 10)
        throw Error('Daftar filter monitor tidak valid atau melebihi 10.');
    const ids = new Set(), names = new Set();
    const items = v.items.map(item => {
        if (!item || typeof item.id !== 'string' || !/^[-A-Za-z0-9_]{1,100}$/.test(item.id) || ids.has(item.id) || typeof item.name !== 'string' || !['requests', 'ledger'].includes(item.source) || !item.filters || typeof item.filters.house !== 'string' || item.filters.house.length > 100)
            throw Error('Isi filter monitor tidak valid.');
        if (item.favorite !== undefined && typeof item.favorite !== 'boolean')
            throw Error('Penanda favorit tidak valid.');
        const name = item.name.trim().replace(/\s+/g, ' '), nameKey = key(name);
        if (!name || [...name].length > 60 || names.has(nameKey))
            throw Error('Nama filter wajib unik dan maksimal 60 karakter.');
        const f = validateMonitorFilters(item.filters, item.filters.house ? [item.filters.house] : []);
        if (item.source === 'ledger' && (f.status !== 'all' || f.health !== 'all'))
            throw Error('Filter ledger tidak memakai status pengajuan atau kondisi sumber.');
        ids.add(item.id);
        names.add(nameKey);
        return { id: item.id, name, source: item.source, ...(item.favorite ? { favorite: true } : {}), filters: { kind: f.kind, house: f.house, from: f.from, to: f.to, query: f.query, status: f.status, health: f.health } };
    });
    return { schema: 1, revision: v.revision, items };
}
function addMonitorSavedFilter(store, id, name, source, filters) {
    const previous = validateMonitorFilterStore(store);
    return validateMonitorFilterStore({ schema: 1, revision: previous.revision + 1, items: [...previous.items, { id, name, source, filters }] });
}
function removeMonitorSavedFilter(store, id) {
    const previous = validateMonitorFilterStore(store);
    if (!previous.items.some(x => x.id === id))
        throw Error('Filter monitor tidak ditemukan.');
    return validateMonitorFilterStore({ schema: 1, revision: previous.revision + 1, items: previous.items.filter(x => x.id !== id) });
}
function renameMonitorSavedFilter(store, id, name) {
    const previous = validateMonitorFilterStore(store);
    if (!previous.items.some(x => x.id === id))
        throw Error('Filter monitor tidak ditemukan.');
    return validateMonitorFilterStore({ schema: 1, revision: previous.revision + 1, items: previous.items.map(x => x.id === id ? { ...x, name } : x) });
}
function updateMonitorSavedFilter(store, id, source, filters) {
    const previous = validateMonitorFilterStore(store);
    if (!previous.items.some(x => x.id === id))
        throw Error('Filter monitor tidak ditemukan.');
    return validateMonitorFilterStore({ schema: 1, revision: previous.revision + 1, items: previous.items.map(x => x.id === id ? { ...x, source, filters } : x) });
}
function duplicateMonitorSavedFilter(store, id, newId, name) {
    const previous = validateMonitorFilterStore(store), item = previous.items.find(x => x.id === id);
    if (!item)
        throw Error('Filter monitor tidak ditemukan.');
    return addMonitorSavedFilter(previous, newId, name, item.source, item.filters);
}
function setMonitorSavedFavorite(store, id, favorite) {
    if (typeof favorite !== 'boolean')
        throw Error('Penanda favorit harus boolean.');
    const previous = validateMonitorFilterStore(store);
    if (!previous.items.some(x => x.id === id))
        throw Error('Filter monitor tidak ditemukan.');
    return validateMonitorFilterStore({ schema: 1, revision: previous.revision + 1, items: previous.items.map(x => x.id === id ? { ...x, favorite } : x) });
}
function listMonitorSavedFilters(items, favoriteOnly = false) {
    return items.filter(x => !favoriteOnly || x.favorite === true).sort((a, b) => Number(b.favorite === true) - Number(a.favorite === true));
}

return exports;})();
