import {emptyMonitorFilterStore,validateMonitorFilterStore,type MonitorFilterStore} from "./flock-report";
import { emptyTraceSavedFilters, validateTraceSavedFilters, type TraceSavedFilters } from "./traceability";
import * as SQLite from "expo-sqlite";
import { baseState, validateState, State } from "./domain";
let connection: Promise<SQLite.SQLiteDatabase> | null = null;
async function database() {
  connection ??= SQLite.openDatabaseAsync("telurfarm-native.db");
  const db = await connection;
  await db.execAsync(
    "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, payload TEXT NOT NULL)",
  );
  return db;
}
export async function loadState(): Promise<State> {
  const db = await database(),
    row = await db.getFirstAsync<{ payload: string }>(
      "SELECT payload FROM app_state WHERE id=1",
    );
  if (row) return validateState(JSON.parse(row.payload));
  const state = baseState();
  await db.runAsync(
    "INSERT INTO app_state(id,revision,payload) VALUES(1,0,?) ON CONFLICT(id) DO NOTHING",
    JSON.stringify(state),
  );
  const saved = await db.getFirstAsync<{ payload: string }>(
    "SELECT payload FROM app_state WHERE id=1",
  );
  return validateState(JSON.parse(saved!.payload));
}
export async function persist(state: State, expected: number) {
  validateState(state);
  const db = await database(),
    result = await db.runAsync(
      "UPDATE app_state SET payload=?,revision=? WHERE id=1 AND revision=?",
      JSON.stringify(state),
      state.revision,
      expected,
    );
  if (result.changes !== 1)
    throw Error(
      "Data berubah. Tutup dan buka kembali aplikasi sebelum melanjutkan.",
    );
}

async function filterPreferencesDB() {
 const db=await database();
 await db.execAsync("CREATE TABLE IF NOT EXISTS app_preferences (key TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL)");
 return db;
}
export async function loadTraceSavedFilters():Promise<TraceSavedFilters> {
 const db=await filterPreferencesDB(),initial=emptyTraceSavedFilters();
 await db.runAsync("INSERT INTO app_preferences(key,revision,payload) VALUES('trace_saved_filters',0,?) ON CONFLICT(key) DO NOTHING",JSON.stringify(initial));
 const row=await db.getFirstAsync<{payload:string}>("SELECT payload FROM app_preferences WHERE key='trace_saved_filters'");
 return validateTraceSavedFilters(JSON.parse(row!.payload));
}
export async function persistTraceSavedFilters(store:TraceSavedFilters,expected:number) {
 const value=validateTraceSavedFilters(store);
 if(!Number.isSafeInteger(expected)||expected<0||value.revision!==expected+1)throw Error("Revisi filter tersimpan tidak valid.");
 const db=await filterPreferencesDB(),result=await db.runAsync("UPDATE app_preferences SET payload=?,revision=? WHERE key='trace_saved_filters' AND revision=?",JSON.stringify(value),value.revision,expected);
 if(result.changes!==1)throw Error("Filter tersimpan berubah. Muat ulang daftar filter sebelum mencoba lagi.");
}

export async function loadMonitorSavedFilters():Promise<MonitorFilterStore> {
 const db=await filterPreferencesDB(),initial=emptyMonitorFilterStore();
 await db.runAsync("INSERT INTO app_preferences(key,revision,payload) VALUES('monitor_saved_filters',0,?) ON CONFLICT(key) DO NOTHING",JSON.stringify(initial));
 const row=await db.getFirstAsync<{payload:string}>("SELECT payload FROM app_preferences WHERE key='monitor_saved_filters'");
 return validateMonitorFilterStore(JSON.parse(row!.payload));
}
export async function persistMonitorSavedFilters(store:MonitorFilterStore,expected:number) {
 const value=validateMonitorFilterStore(store);
 if(!Number.isSafeInteger(expected)||expected<0||value.revision!==expected+1)throw Error("Revisi filter monitor tidak valid.");
 const db=await filterPreferencesDB(),result=await db.runAsync("UPDATE app_preferences SET payload=?,revision=? WHERE key='monitor_saved_filters' AND revision=?",JSON.stringify(value),value.revision,expected);
 if(result.changes!==1)throw Error("Filter monitor berubah. Muat ulang daftar sebelum mencoba lagi.");
}
