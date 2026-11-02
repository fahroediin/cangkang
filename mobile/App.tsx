import * as HP from "./src/house-performance";
import * as FR from "./src/flock-report";
import { traceBatch, traceBatchCsv, traceOrders, traceOrdersCsv, traceOrdersSummary, traceOrdersHtml, traceOrdersSummaryCsv, traceOrderQuickFilter, traceOrderDrilldown, traceOrderViewSnapshot, emptyTraceSavedFilters, validateTraceSavedFilters, addTraceSavedFilter, removeTraceSavedFilter, type TraceSavedFilters, traceOrderPagination, type TraceOrderView, type TraceOrderDimension, type TraceOrderQuickChoice, traceOrderStatusLabel, traceOrderSortLabel, traceOrdersPage, validateTraceOrderFilters, type TraceOrderFilters, type TraceOrderScope, type TraceOrderStatus } from "./src/traceability";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { File, Paths } from "expo-file-system";
import * as D from "./src/domain";
import { stockAlerts, shortageKg, stockReportCsv, stockReportHtml, rebalanceStock, transferPlanCsv, batchTransferPlan, batchTransferCsv, prepareCandidateTransfer, assertCandidateCurrent, validateCandidateTransfer, type CandidateAllocation, type AlertLot } from "./src/stock-alerts";
import { loadState, persist, loadTraceSavedFilters, persistTraceSavedFilters, loadMonitorSavedFilters, persistMonitorSavedFilters } from "./src/storage";
import { styles as S, colors as C } from "./src/theme";
const money = (v: number) => "Rp" + Math.round(v).toLocaleString("id-ID");
const num = (v: number) =>
  v.toLocaleString("id-ID", { maximumFractionDigits: 6 });
const uuid = (prefix: string) => prefix + "-" + Crypto.randomUUID();
const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Terjadi kesalahan. Silakan coba lagi.";
const h = (v: unknown) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
type Page =
  | "Beranda"
  | "Pesan"
  | "Aktivitas"
  | "Kelola"
  | "Batch"
  | "Produksi"
  | "Kandang"
  | "Keuangan"
  | "Keluhan"
  | "Peringatan"
  | "Jadwal"
  | "Pengaturan"
  | "Panduan";
type Field = {
  key: string;
  label: string;
  value?: string;
  number?: boolean;
  multiline?: boolean;
  options?: { value: string; label: string }[];
  optional?: boolean;
};
type Form = {
  title: string;
  help?: string;
  fields: Field[];
  save: (values: Record<string, string>) => Promise<void>;
  submit?: string;
};
function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        S.button,
        secondary && S.secondary,
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={S.buttonText}>{title}</Text>
    </Pressable>
  );
}
function Badge({ text }: { text: string }) {
  return (
    <View style={S.badge}>
      <Text style={S.badgeText}>{text}</Text>
    </View>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return <View style={S.card}>{children}</View>;
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <View style={S.notice}>
      <Text style={S.body}>{children}</Text>
    </View>
  );
}
function Chips({
  values,
  value,
  onChange,
}: {
  values: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={S.row}>
      {values.map((x) => (
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: value === x.value }}
          key={x.value}
          onPress={() => onChange(x.value)}
          style={[S.chip, value === x.value && S.chipActive]}
        >
          <Text style={[S.chipText, value === x.value && S.chipActiveText]}>
            {x.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View>
      <Text style={S.label}>
        {field.label}
        {field.optional ? " (opsional)" : ""}
      </Text>
      {field.options ? (
        <Chips values={field.options} value={value} onChange={onChange} />
      ) : (
        <TextInput
          accessibilityLabel={field.label}
          value={value}
          onChangeText={onChange}
          style={[
            S.input,
            field.multiline && { minHeight: 90, textAlignVertical: "top" },
          ]}
          multiline={field.multiline}
          keyboardType={
            ["lat", "lng"].includes(field.key)
              ? "default"
              : field.number
                ? "decimal-pad"
                : "default"
          }
          autoCapitalize={field.number ? "none" : "sentences"}
          maxLength={field.multiline ? 500 : 200}
        />
      )}
    </View>
  );
}
function FormModal({ form, close }: { form: Form | null; close: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    if (form) {
      setValues(
        Object.fromEntries(
          form.fields.map((f) => [
            f.key,
            f.value ?? f.options?.[0]?.value ?? "",
          ]),
        ),
      );
      setError("");
    }
  }, [form]);
  async function submit() {
    if (!form || saving) return;
    setError("");
    for (const f of form.fields)
      if (!f.optional && !values[f.key]?.trim()) {
        setError("Isi " + f.label + ".");
        return;
      }
    setSaving(true);
    try {
      await form.save(values);
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      visible={!!form}
      animationType="slide"
      onRequestClose={() => {
        if (!saving) close();
      }}
    >
      <SafeAreaView style={S.modalRoot}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={S.header}>
            <View style={S.between}>
              <Text style={[S.h2, { flex: 1 }]}>{form?.title}</Text>
              <Button
                title="Tutup"
                secondary
                disabled={saving}
                onPress={close}
              />
            </View>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={S.content}
          >
            {form?.help && <Note>{form.help}</Note>}
            {form?.fields.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={values[f.key] || ""}
                onChange={(v) => setValues((old) => ({ ...old, [f.key]: v }))}
              />
            ))}
            {!!error && (
              <View accessibilityRole="alert" style={S.error}>
                <Text style={S.errorText}>{error}</Text>
              </View>
            )}
            <Button
              title={saving ? "Menyimpan…" : form?.submit || "Simpan"}
              disabled={saving}
              onPress={() => void submit()}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const options = (values: string[]) =>
  values.map((value) => ({ value, label: value }));
const pOptions = D.products.map((label, value) => ({
  label,
  value: String(value),
}));
const numeric = (v: string) => Number(v.replace(",", "."));
function Main() {
  const exportBusy = useRef(false);
  const savedTraceRef=useRef<TraceSavedFilters|null>(null),savedTraceLock=useRef(false);
  const [savedTrace,setSavedTrace]=useState<TraceSavedFilters|null>(null),[savedTraceBusy,setSavedTraceBusy]=useState(false),[savedTraceError,setSavedTraceError]=useState("");
  const savedMonitorRef=useRef<FR.MonitorFilterStore|null>(null),savedMonitorLock=useRef(false);
  const [performanceFilters,setPerformanceFilters]=useState<HP.PerformanceFilters>(()=>HP.recentPerformancePeriod(D.today()));
  const [monitorFavoriteOnly,setMonitorFavoriteOnly]=useState(false);
  const [savedMonitor,setSavedMonitor]=useState<FR.MonitorFilterStore|null>(null),[savedMonitorBusy,setSavedMonitorBusy]=useState(false),[savedMonitorError,setSavedMonitorError]=useState("");
  const [flockFilters,setFlockFilters]=useState<FR.MonitorFilters>(FR.emptyMonitorFilters()),[flockReportPage,setFlockReportPage]=useState(1);
  const [traceId,setTraceId]=useState<string|null>(null);
  const [tracePage,setTracePage]=useState(1);
  const [tracePageSize,setTracePageSize]=useState(20);
  const [traceBack,setTraceBack]=useState<TraceOrderView|null>(null);
  const [traceFilters,setTraceFilters]=useState<TraceOrderFilters>({category:"",from:"",to:""});
  const [traceScope,setTraceScope]=useState<TraceOrderScope>("family"),[traceStatus,setTraceStatus]=useState<TraceOrderStatus>("all");
  const [data, setData] = useState<D.State | null>(null),
    [loadError, setLoadError] = useState(""),
    [page, setPage] = useState<Page>("Beranda"),
    [form, setForm] = useState<Form | null>(null),
    [orderId, setOrderId] = useState<string | null>(null),
    [category, setCategory] = useState<D.Category>("Perorangan"),
    [cart, setCart] = useState<
      { product: D.Product; unit: D.Unit; quantity: number }[]
    >([]),
    [location, setLocation] = useState<{ lat: number; lng: number } | null>(
      null,
    ),
    [locating, setLocating] = useState(false),
    [date, setDate] = useState(D.today()),
    [selectedDepot, setSelectedDepot] = useState(""),
    [draftContact, setDraftContact] = useState<D.ReorderDraft | null>(null),
    [planContext, setPlanContext] = useState<{
      id: string;
      date: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("Semua"),
    [alertDay, setAlertDay] = useState(D.today()),
    [alertDepot, setAlertDepot] = useState(""),
    [alertKg, setAlertKg] = useState(20),
    [alertDays, setAlertDays] = useState(3);
  const filteredFlockRows=useMemo(()=>{
    const ids=data?.houses?.map(h=>h.id)||[],filters=flockFilters.house&&!ids.includes(flockFilters.house)?FR.emptyMonitorFilters():flockFilters;
    return FR.filterMonitorRows((data?.flockMovements||[]).map(m=>({...m,status:"executed",health:"closed"})),filters,ids);
  },[data,flockFilters]);
  useEffect(()=>{if(data&&flockFilters.house&&!data.houses?.some(h=>h.id===flockFilters.house)){setFlockFilters(FR.emptyMonitorFilters());setFlockReportPage(1);}},[data,flockFilters.house]);
  const current = useRef<D.State | null>(null),
    lock = useRef(false);
  async function load() {
    setLoadError("");
    try {
      const s = await loadState();
      current.current = s;
      setData(s);
      await reloadSavedTrace();
      await reloadSavedMonitor();
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (orderId) {
        setOrderId(null);
        return true;
      }
      if (!["Beranda", "Pesan", "Aktivitas", "Kelola"].includes(page)) {
        setPage("Kelola");
        return true;
      }
      if (page !== "Beranda") {
        setPage("Beranda");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [page, orderId]);
  async function change(fn: (s: D.State) => void) {
    if (lock.current) throw Error("Tunggu penyimpanan selesai.");
    if (!current.current) throw Error("Data belum siap.");
    lock.current = true;
    setBusy(true);
    try {
      const before = current.current,
        next = JSON.parse(JSON.stringify(before)) as D.State;
      fn(next);
      next.revision = before.revision + 1;
      D.validateState(next);
      await persist(next, before.revision);
      current.current = next;
      setData(next);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const act = (fn: () => Promise<unknown>) => {
    void fn().catch((e) => Alert.alert("Periksa kembali", errorMessage(e)));
  };
  function confirm(title: string, message: string, fn: () => Promise<unknown>) {
    Alert.alert(title, message, [
      { text: "Kembali", style: "cancel" },
      { text: "Lanjutkan", onPress: () => act(fn) },
    ]);
  }
  const open = (
    title: string,
    fields: Field[],
    save: Form["save"],
    help?: string,
    submit?: string,
  ) => setForm({ title, fields, save, help, submit });
  const depotOptions =
    data?.depots.map((d) => ({ value: d.id, label: d.name })) || [];
  async function gps() {
    setLocating(true);
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (!p.granted) {
        Alert.alert(
          "Izin lokasi belum diberikan",
          "Anda tetap bisa memasukkan koordinat secara manual.",
        );
        return;
      }
      if (!(await Location.hasServicesEnabledAsync()))
        throw Error("Aktifkan layanan lokasi di pengaturan ponsel.");
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setSelectedDepot("");
    } catch (e) {
      Alert.alert("Lokasi belum tersedia", errorMessage(e));
    } finally {
      setLocating(false);
    }
  }
  function manualLocation() {
    open(
      "Koordinat pelanggan",
      [
        {
          key: "lat",
          label: "Lintang (-90 sampai 90)",
          value: String(location?.lat ?? ""),
          number: true,
        },
        {
          key: "lng",
          label: "Bujur (-180 sampai 180)",
          value: String(location?.lng ?? ""),
          number: true,
        },
      ],
      async (v) => {
        const lat = numeric(v.lat),
          lng = numeric(v.lng);
        if (
          !Number.isFinite(lat) ||
          Math.abs(lat) > 90 ||
          !Number.isFinite(lng) ||
          Math.abs(lng) > 180
        )
          throw Error("Koordinat tidak valid.");
        setLocation({ lat, lng });
        setSelectedDepot("");
      },
      "Gunakan koordinat alamat pengantaran agar depo yang direkomendasikan sesuai tujuan. GPS hanya diakses saat Anda menekan tombol lokasi.",
    );
  }
  async function exportStockReport(format: "csv" | "pdf" | "plan" | "batch", filtersReport: ReturnType<typeof stockAlerts>, scope: string) {
    if (exportBusy.current) return;
    exportBusy.current = true;
    setBusy(true);
    try {
      const snapshot = current.current!;
      const scopeIds=new Set(filtersReport.balances.map(b=>b.depot));
      const lots=snapshot.lots.map(l=>({id:l.id,depot:l.depotId,product:l.product,kg:l.kg,eggs:l.eggs,harvest:l.harvest,expiry:l.expiry,status:l.quality,approved:true}));
      const report=stockAlerts(snapshot.depots.filter(d=>scopeIds.has(d.id)).map(d=>d.id),lots,filtersReport.day,filtersReport.minKg,filtersReport.horizon);
      const createdAt = new Date().toISOString();
      if (!(await Sharing.isAvailableAsync())) throw Error("Berbagi berkas tidak tersedia di perangkat ini.");
      const depotName = (id:string)=>snapshot.depots.find(d=>d.id===id)?.name || id;
      if(format !== "pdf") {
        const file = new File(Paths.cache,(format==="batch"?"PamanKu-Batch-":format==="plan"?"PamanKu-Simulasi-":"PamanKu-Stok-")+report.day+"-"+Date.now()+".csv");
        file.write(format==="batch"?batchTransferCsv(report,lots,depotName,id=>id,scope,createdAt):format==="plan"?transferPlanCsv(report,depotName,scope,createdAt):stockReportCsv(report,depotName,id=>id,scope,createdAt));
        await Sharing.shareAsync(file.uri,{mimeType:"text/csv",UTI:"public.comma-separated-values-text",dialogTitle:"Simpan laporan stok"});
      } else {
        const file = await Print.printToFileAsync({html:stockReportHtml(report,depotName,id=>id,scope,createdAt,lots)});
        await Sharing.shareAsync(file.uri,{mimeType:"application/pdf",UTI:"com.adobe.pdf",dialogTitle:"Bagikan laporan stok PDF"});
      }
    } finally { exportBusy.current = false; setBusy(false); }
  }
  function nativeTrace(id:string) {
    return traceBatch(current.current!.lots.map(l=>({id:l.id,parentId:l.parentId,depot:l.depotId,product:l.product,kg:l.kg,eggs:l.eggs,status:l.quality,harvest:l.harvest,expiry:l.expiry})),id);
  }
  function nativeTraceOrders(id:string,scope:TraceOrderScope,status:TraceOrderStatus,filters:TraceOrderFilters=traceFilters) {
    return traceOrders(nativeTrace(id),current.current!.orders.map(o=>({id:o.id,name:o.name,category:o.category,status:o.status,date:o.date,depot:o.depotId,allocations:o.allocations})),scope,status,filters);
  }
  async function reloadSavedTrace() {
    if(savedTraceLock.current)return;
    savedTraceLock.current=true;setSavedTraceBusy(true);
    try{const value=await loadTraceSavedFilters();savedTraceRef.current=value;setSavedTrace(value);setSavedTraceError("");}
    catch(e){savedTraceRef.current=null;setSavedTrace(null);setSavedTraceError(errorMessage(e));}
    finally{savedTraceLock.current=false;setSavedTraceBusy(false);}
  }
  async function commitSavedTrace(transform:(value:TraceSavedFilters)=>TraceSavedFilters) {
    if(savedTraceLock.current||!savedTraceRef.current)throw Error("Tunggu daftar filter siap atau muat ulang.");
    const previous=savedTraceRef.current,next=transform(previous);
    savedTraceLock.current=true;setSavedTraceBusy(true);
    try{await persistTraceSavedFilters(next,previous.revision);savedTraceRef.current=next;setSavedTrace(next);setSavedTraceError("");}
    catch(e){setSavedTraceError(errorMessage(e));throw e;}
    finally{savedTraceLock.current=false;setSavedTraceBusy(false);}
  }
  function saveTraceFilterForm(id:string) {
    setForm({title:"Simpan filter pemeriksaan",help:"Maksimal 10 filter pada perangkat ini. Nama unik per batch, maksimal 60 karakter. Tanggal disimpan tetap; bukan jadwal otomatis. Tidak ikut cadangan transaksi dan tidak sinkron dengan web.",fields:[{key:"name",label:"Nama filter"}],save:async v=>{nativeTraceOrders(id,traceScope,traceStatus);const view=traceOrderViewSnapshot({lotId:id,scope:traceScope,status:traceStatus,page:1,pageSize:tracePageSize,filters:traceFilters});await commitSavedTrace(current=>addTraceSavedFilter(current,uuid("VIEW"),v.name,view));}});
  }
  function applySavedTrace(id:string,savedId:string) {
    try{const item=savedTraceRef.current?.items.find(x=>x.id===savedId);if(!item)throw Error("Filter tersimpan tidak ditemukan.");const view=traceOrderViewSnapshot(item.view,id);if(view.filters.depot&&!current.current!.depots.some(d=>d.id===view.filters.depot))throw Error("Depo pada filter tidak ditemukan.");nativeTraceOrders(id,view.scope,view.status,view.filters);setTraceScope(view.scope);setTraceStatus(view.status);setTraceFilters(view.filters);setTracePageSize(view.pageSize??20);setTracePage(1);setTraceBack(null);}catch(e){Alert.alert("Filter tidak dapat dipakai",errorMessage(e));}
  }
  function renderSavedTrace(id:string) {
    const entries=savedTrace?.items.filter(x=>x.view.lotId===id)||[],disabled=savedTraceBusy||!savedTrace||Boolean(savedTraceError);
    return <View><Text style={S.h2}>Filter pemeriksaan tersimpan · v5.0</Text><Note>Disimpan lokal untuk batch ini; tanggal tetap, maksimum 10 filter seluruh perangkat. Memanggil filter mulai halaman pertama, memakai data terkini, dan menghapus riwayat kembali. Tidak ikut cadangan transaksi atau sinkronisasi web.</Note>{Boolean(savedTraceError)&&<Note>{savedTraceError}</Note>}<Button title="Muat ulang filter tersimpan" secondary disabled={savedTraceBusy} onPress={()=>void reloadSavedTrace()} /><Button title="Simpan filter yang diterapkan" secondary disabled={disabled||busy||(savedTrace?.items.length||0)>=10} onPress={()=>saveTraceFilterForm(id)} /><Text style={S.small}>{entries.length} filter untuk batch ini · {savedTrace?.items.length||0}/10 pada perangkat</Text>{!entries.length&&<Text style={S.body}>Belum ada filter tersimpan untuk batch ini.</Text>}{(savedTrace?.items||[]).map(item=><View key={item.id}><Text style={S.h2}>{item.name}</Text><Text style={S.small}>Batch {item.view.lotId}</Text><Button title="Pakai filter tersimpan" secondary disabled={disabled||busy||item.view.lotId!==id} onPress={()=>applySavedTrace(id,item.id)} /><Button title="Hapus filter tersimpan" secondary disabled={disabled||busy} onPress={()=>void commitSavedTrace(value=>removeTraceSavedFilter(value,item.id)).catch(e=>Alert.alert("Hapus filter gagal",errorMessage(e)))} /></View>)}</View>;
  }
  function drillTraceOrders(id:string,dimension:TraceOrderDimension,value:string) {
    try {
      const next=traceOrderDrilldown(traceFilters,traceStatus,dimension,value);
      if(next.filters.depot&&!current.current!.depots.some(d=>d.id===next.filters.depot))throw Error("Depo pesanan tidak ditemukan.");
      nativeTraceOrders(id,traceScope,next.status,next.filters);
      const previous=traceOrderViewSnapshot({lotId:id,scope:traceScope,status:traceStatus,page:traceOrderPagination(nativeTraceOrders(id,traceScope,traceStatus),tracePage,tracePageSize).page,pageSize:tracePageSize,filters:traceFilters});
      setTraceBack(previous);setTraceStatus(next.status);setTraceFilters(next.filters);setTracePage(1);
    }catch(e){Alert.alert("Pilihan ringkasan gagal",errorMessage(e));}
  }
  function undoTraceDrill(id:string) {
    try {
      if(!traceBack)throw Error("Belum ada klik ringkasan yang bisa dikembalikan.");
      const previous=traceOrderViewSnapshot(traceBack,id);
      if(previous.filters.depot&&!current.current!.depots.some(d=>d.id===previous.filters.depot))throw Error("Depo pesanan pada riwayat tidak ditemukan.");
      const report=nativeTraceOrders(id,previous.scope,previous.status,previous.filters),visible=traceOrderPagination(report,previous.page,previous.pageSize??20);
      setTraceScope(previous.scope);setTraceStatus(previous.status);setTraceFilters(previous.filters);setTracePage(visible.page);setTracePageSize(visible.pageSize);setTraceBack(null);
    }catch(e){Alert.alert("Kembali ke filter gagal",errorMessage(e));}
  }
  function applyQuickTraceOrders(id:string,choice:TraceOrderQuickChoice) {
    try {
      const quick=traceOrderQuickFilter(traceFilters,choice,D.today());
      if(quick.filters.depot&&!current.current!.depots.some(d=>d.id===quick.filters.depot))throw Error("Depo pesanan tidak ditemukan.");
      nativeTraceOrders(id,traceScope,quick.status,quick.filters);
      setTraceBack(null);setTraceStatus(quick.status);setTraceFilters(quick.filters);setTracePage(1);
    }catch(e){Alert.alert("Pilihan cepat gagal",errorMessage(e));}
  }
  function traceOrderFilterForm(id:string) {
    setForm({title:"Cari & filter pesanan batch",help:"Tanggal YYYY-MM-DD, inklusif. Kosongkan salah satu batas untuk rentang terbuka; kosongkan keduanya untuk semua tanggal. Pesanan tanpa tanggal valid dikecualikan saat rentang aktif. Filter berlaku pada daftar, ringkasan, CSV dan PDF, tanpa mengubah data.",fields:[{key:"query",label:"Nomor pesanan / nama pelanggan (opsional, maks. 100 karakter)",value:traceFilters.query||"",optional:true},{key:"category",label:"Kategori pembeli",value:traceFilters.category,optional:true,options:[{value:"",label:"Semua kategori"},...D.categories.map(x=>({value:x,label:x}))]},{key:"status",label:"Status pesanan",value:traceStatus,options:["all","notCancelled","Diproses","Dalam pengiriman","Selesai","Dibatalkan"].map(value=>({value,label:traceOrderStatusLabel(value as TraceOrderStatus)}))},{key:"depot",label:"Depo pesanan (opsional)",value:traceFilters.depot||"",optional:true,options:[{value:"",label:"Semua depo pesanan"},...current.current!.depots.map(d=>({value:d.id,label:d.name}))]},{key:"sort",label:"Urutan daftar",value:traceFilters.sort||"dateAsc",options:["dateAsc","dateDesc","nameAsc","idAsc"].map(value=>({value,label:traceOrderSortLabel(value)}))},{key:"from",label:"Tanggal kirim mulai YYYY-MM-DD (opsional)",value:traceFilters.from,optional:true},{key:"to",label:"Tanggal kirim sampai YYYY-MM-DD (opsional)",value:traceFilters.to,optional:true}],save:async v=>{const next=validateTraceOrderFilters({category:v.category,from:v.from.trim(),to:v.to.trim(),query:v.query,depot:v.depot,sort:v.sort});if(next.depot&&!current.current!.depots.some(d=>d.id===next.depot))throw Error("Depo pesanan tidak ditemukan.");nativeTraceOrders(id,traceScope,v.status as TraceOrderStatus,next);setTraceBack(null);setTraceStatus(v.status as TraceOrderStatus);setTraceFilters(next);setTracePage(1);}});
  }
  async function exportTraceOrders(id:string,format:"csv"|"pdf"|"summary"="csv") {
    if(exportBusy.current)return;exportBusy.current=true;setBusy(true);
    try {
      const snapshot=current.current!,report=nativeTraceOrders(id,traceScope,traceStatus),createdAt=new Date().toISOString();
      const depotName=(id:string)=>snapshot.depots.find(d=>d.id===id)?.name||id;
      const content=format==="pdf"?traceOrdersHtml(report,depotName,createdAt):format==="summary"?traceOrdersSummaryCsv(report,depotName,createdAt):traceOrdersCsv(report,depotName,createdAt);
      if(!(await Sharing.isAvailableAsync()))throw Error("Berbagi berkas tidak tersedia.");
      if(format==="pdf"){
        const file=await Print.printToFileAsync({html:content});
        await Sharing.shareAsync(file.uri,{mimeType:"application/pdf",UTI:"com.adobe.pdf",dialogTitle:"Bagikan pesanan terkait batch PDF"});
      }else{
        const file=new File(Paths.cache,(format==="summary"?"PamanKu-Ringkasan-Batch-":"PamanKu-Pesanan-Batch-")+Date.now()+".csv");file.write(content);
        await Sharing.shareAsync(file.uri,{mimeType:"text/csv",UTI:"public.comma-separated-values-text",dialogTitle:"Simpan pesanan terkait batch"});
      }
    } finally {exportBusy.current=false;setBusy(false);}
  }
  function tracePageSizeForm(id:string) {
    setForm({title:"Jumlah pesanan per halaman",help:"Pilihan baru kembali ke halaman pertama. Filter, riwayat klik ringkasan dan ekspor seluruh hasil tetap.",fields:[{key:"size",label:"Pesanan per halaman",value:String(tracePageSize),options:[10,20,50].map(value=>({value:String(value),label:String(value)}))}],save:async v=>{const visible=traceOrderPagination(nativeTraceOrders(id,traceScope,traceStatus),1,Number(v.size));setTracePageSize(visible.pageSize);setTracePage(1);}});
  }
  function traceJumpForm(id:string) {
    const visible=traceOrderPagination(nativeTraceOrders(id,traceScope,traceStatus),tracePage,tracePageSize);
    setForm({title:"Ke halaman tertentu",help:"Masukkan bilangan bulat positif. Jika melebihi halaman terakhir, daftar menuju halaman terakhir. Data memakai kondisi terkini; filter dan riwayat tetap.",fields:[{key:"page",label:"Nomor halaman (1–"+visible.pages+")",value:String(visible.page),number:true}],save:async v=>{const next=traceOrderPagination(nativeTraceOrders(id,traceScope,traceStatus),v.page,tracePageSize);setTracePage(next.page);}});
  }
  function renderTraceOrders(id:string) {
    const report=nativeTraceOrders(id,traceScope,traceStatus),summary=traceOrdersSummary(report),visible=traceOrderPagination(report,tracePage,tracePageSize);
    return <View><Text style={S.h2}>Pesanan terkait batch · v5.0</Text>{renderSavedTrace(id)}<Text style={S.h2}>Pilihan cepat pekerjaan harian</Text><View style={S.row}><Button title="Diproses hari ini" secondary disabled={busy} onPress={()=>applyQuickTraceOrders(id,"processingToday")} /><Button title="Dalam pengiriman hari ini" secondary disabled={busy} onPress={()=>applyQuickTraceOrders(id,"shippingToday")} /><Button title="Diproses lewat tanggal" secondary disabled={busy} onPress={()=>applyQuickTraceOrders(id,"overdueProcessing")} /></View><Note>Tanggal perangkat saat tombol ditekan. Cakupan, depo dan urutan dipertahankan; pencarian dan kategori dikosongkan. Lewat tanggal = masih Diproses dengan tanggal kirim sebelum hari ini, tanpa menilai slot jam. Tanggal kosong dikecualikan. Filter tidak bergeser otomatis saat hari berganti; tekan ulang untuk hari terbaru.</Note><View style={S.row}><Button title={traceScope==="family"?"Cakupan: seluruh keluarga":"Cakupan: batch ini saja"} secondary onPress={()=>{setTraceBack(null);setTraceScope(traceScope==="family"?"batch":"family");setTracePage(1)}} /><Button title={"Status: "+traceOrderStatusLabel(traceStatus)} secondary onPress={()=>traceOrderFilterForm(id)} /></View><Text style={S.body}>Depo pesanan: {data!.depots.find(d=>d.id===traceFilters.depot)?.name||"Semua depo pesanan"}{"\n"}Urutan: {traceOrderSortLabel(traceFilters.sort)}{"\n"}Pencarian: {traceFilters.query||"Tanpa pencarian"}{"\n"}Kategori: {traceFilters.category||"Semua kategori"}{"\n"}Tanggal kirim: {traceFilters.from||"Tanpa batas awal"} s.d. {traceFilters.to||"Tanpa batas akhir"} (inklusif)</Text><Button title="Cari & filter pesanan batch" secondary onPress={()=>traceOrderFilterForm(id)} /><Button title="Reset pencarian, kategori & tanggal" secondary onPress={()=>{setTraceBack(null);setTraceFilters({...traceFilters,category:"",from:"",to:"",query:""});setTracePage(1)}} /><Button title="Reset seluruh filter" secondary onPress={()=>{setTracePageSize(20);setTraceBack(null);setTraceScope("family");setTraceStatus("all");setTraceFilters({category:"",from:"",to:"",query:"",depot:"",sort:"dateAsc"});setTracePage(1)}} /><Note>Rentang aktif mengecualikan pesanan tanpa tanggal kirim valid. Alokasi tercatat yang cocok, bukan jumlah terkirim atau saldo stok. Pesanan batal dapat tetap memiliki referensi; retur tidak dikurangkan. Daftar ini membantu pemeriksaan, bukan daftar recall terverifikasi.</Note><Text style={S.body}>{report.count} pesanan · {report.cancelled} dibatalkan · {summary.batchCount} ID batch cocok</Text><Text style={S.h2}>Ringkasan pesanan · ketuk untuk menyaring</Text><Button title="Kembali sebelum klik ringkasan" secondary disabled={busy||!traceBack||traceBack.lotId!==id} onPress={()=>undoTraceDrill(id)} /><Note>Memulihkan filter dan halaman sebelum klik terakhir, memakai data terkini. Halaman disesuaikan bila hasil berkurang. Hanya satu langkah; perubahan filter manual, pilihan cepat, reset atau membuka telusur ulang menghapus riwayat.</Note><Note>Angka dihitung dari seluruh hasil filter saat ini. Ketuk kategori, status atau depo untuk mengganti satu filter tersebut dan kembali ke halaman pertama. Pencarian, tanggal, cakupan dan urutan tetap. Angka nol dapat dipilih dan bisa menghasilkan daftar kosong. Tidak mengubah status pesanan.</Note><Text style={S.h2}>Kategori pembeli</Text><Button title={(report.filters.category?"":"✓ ")+"Semua kategori"} secondary disabled={busy} onPress={()=>drillTraceOrders(id,"category","")} />{summary.categories.map(x=><Button key={x.label} title={(report.filters.category===x.label?"✓ ":"")+x.label+" · "+x.count} secondary disabled={busy} onPress={()=>drillTraceOrders(id,"category",x.label)} />)}<Text style={S.h2}>Status pesanan</Text><Button title={(report.status==="all"?"✓ ":"")+"Semua status"} secondary disabled={busy} onPress={()=>drillTraceOrders(id,"status","all")} />{summary.statuses.map(x=><Button key={x.label} title={(report.status===x.label?"✓ ":"")+x.label+" · "+x.count} secondary disabled={busy} onPress={()=>drillTraceOrders(id,"status",x.label)} />)}<Text style={S.h2}>Depo pesanan</Text><Button title={(report.filters.depot?"":"✓ ")+"Semua depo pesanan"} secondary disabled={busy} onPress={()=>drillTraceOrders(id,"depot","")} />{summary.depots.map(x=><Button key={x.label} title={(report.filters.depot===x.label?"✓ ":"")+(data!.depots.find(d=>d.id===x.label)?.name||x.label)+" · "+x.count} secondary disabled={busy} onPress={()=>drillTraceOrders(id,"depot",x.label)} />)}{!report.count&&<Text style={S.body}>Tidak ada pesanan dengan referensi alokasi yang cocok.</Text>}{visible.rows.map(o=><Card key={o.id}><Text style={S.h2}>{o.id} · {o.name}</Text><Text style={S.body}>{o.category} · {o.status}{"\n"}{o.date} · {data!.depots.find(d=>d.id===o.depot)?.name||o.depot}{"\n"}{num(o.kg)} kg / {num(o.eggs)} butir alokasi cocok{"\n"}{o.lotIds.join("; ")}</Text><Button title="Buka detail pesanan" secondary onPress={()=>setOrderId(o.id)} /></Card>)}<Text style={S.body}>Menampilkan {visible.start}–{visible.end} dari {visible.count} pesanan · halaman {visible.page}/{visible.pages}</Text><View style={S.row}><Button title="Halaman pertama" secondary disabled={visible.page===1} onPress={()=>setTracePage(1)} /><Button title="Sebelumnya" secondary disabled={visible.page===1} onPress={()=>setTracePage(visible.page-1)} /><Button title="Berikutnya" secondary disabled={visible.page===visible.pages} onPress={()=>setTracePage(visible.page+1)} /><Button title="Halaman terakhir" secondary disabled={visible.page===visible.pages} onPress={()=>setTracePage(visible.pages)} /></View><Button title={"Baris per halaman: "+visible.pageSize} secondary onPress={()=>tracePageSizeForm(id)} /><Button title="Ke halaman tertentu" secondary onPress={()=>traceJumpForm(id)} /><Note>{visible.pageSize} pesanan per halaman. Ringkasan, CSV dan PDF mencakup seluruh hasil filter, termasuk halaman lain.</Note><Button title="Bagikan pesanan batch CSV" disabled={busy} onPress={()=>void exportTraceOrders(id).catch(e=>Alert.alert("Ekspor gagal",errorMessage(e)))} /><Button title="Bagikan ringkasan CSV" secondary disabled={busy} onPress={()=>void exportTraceOrders(id,"summary").catch(e=>Alert.alert("Ekspor gagal",errorMessage(e)))} /><Button title="Bagikan pesanan batch PDF" secondary disabled={busy} onPress={()=>void exportTraceOrders(id,"pdf").catch(e=>Alert.alert("Ekspor gagal",errorMessage(e)))} /></View>;
  }
  async function exportTrace(id:string) {
    if(exportBusy.current)return;exportBusy.current=true;setBusy(true);
    try {
      const snapshot=current.current!,report=nativeTrace(id);
      const csv=traceBatchCsv(report,id=>snapshot.depots.find(d=>d.id===id)?.name||id,new Date().toISOString());
      if(!(await Sharing.isAvailableAsync()))throw Error("Berbagi berkas tidak tersedia.");
      const file=new File(Paths.cache,"PamanKu-Telusur-"+Date.now()+".csv");file.write(csv);
      await Sharing.shareAsync(file.uri,{mimeType:"text/csv",UTI:"public.comma-separated-values-text",dialogTitle:"Simpan telusur batch"});
    } finally {exportBusy.current=false;setBusy(false);}
  }
  async function exportBackup() {
    if (!current.current) return;
    const file = new File(
      Paths.cache,
      "PamanKu-Native-" + D.today() + ".json",
    );
    file.write(JSON.stringify(current.current, null, 2));
    if (!(await Sharing.isAvailableAsync()))
      throw Error("Berbagi berkas tidak tersedia di perangkat ini.");
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      UTI: "public.json",
      dialogTitle: "Simpan cadangan PamanKu",
    });
  }
  async function importBackup() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/plain"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const item = result.assets[0];
    if ((item.size || 0) > 5_000_000) throw Error("Maksimal cadangan 5 MB.");
    const text = await new File(item.uri).text();
    if (text.length > 5_000_000) throw Error("Maksimal cadangan 5 MB.");
    const incoming = D.validateState(JSON.parse(text));
    confirm(
      "Pulihkan cadangan?",
      `${incoming.orders.length} pesanan, ${incoming.plans.length} jadwal dan ${incoming.lots.length} batch akan mengganti seluruh catatan perangkat. Cadangkan data saat ini terlebih dahulu.`,
      async () => {
        await change((s) => {
          const revision = s.revision;
          Object.assign(s, incoming);
          s.revision = revision;
          D.audit(s, "Pemulihan cadangan native");
        });
        setCart([]);
        setDraftContact(null);
        setPlanContext(null);
        setSelectedDepot("");
        setOrderId(null);
      },
    );
  }
  async function invoice(o: D.Order) {
    const s = current.current!,
      f = D.financial(s, o),
      html = `<!doctype html><html><meta charset="utf-8"><style>body{font:14px Helvetica;color:#33251b;padding:32px}h1{color:#704529}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:12px;border-bottom:1px solid #e4ccac}.total{text-align:right;line-height:1.8}</style><h1>PamanKu</h1><h2>INVOICE ${h(o.id)}</h2><p>${h(o.name)} · ${h(o.category)}<br>${h(o.address)}<br>${h(o.phone)}</p><p>${h(s.depots.find((d) => d.id === o.depotId)?.name)} · Kirim ${h(o.date)} · Jatuh tempo ${h(o.due)}<br>Status ${h(o.status)}</p><table><tr><th>Produk</th><th>Jumlah</th><th>Harga</th><th>Subtotal</th></tr>${o.lines.map((l) => `<tr><td>${h(D.products[l.product])}</td><td>${l.quantity} ${l.unit}</td><td>${money(l.price)}</td><td>${money(Math.round(l.price * l.quantity))}</td></tr>`).join("")}</table><p class="total">Nilai awal ${money(o.total)}<br>Nota kredit ${money(f.credit)}<br>Tagihan bersih ${money(f.net)}<br>Dana diterima ${money(f.paid)}<br>Refund tercatat ${money(f.refund)}<br><b>Sisa tagihan ${money(f.balance)}</b></p><h3>Batch</h3><ul>${o.allocations.map((a) => `<li>${h(a.lotId)} — ${num(a.kg)} kg / ${a.eggs} butir</li>`).join("")}</ul><p>Kurir ${h(o.courier || "Belum ditugaskan")} · Penerima ${h(o.recipient || "Belum tercatat")}</p><p>Pembayaran dan refund adalah catatan manual. ${s.demo ? "DATA CONTOH — BUKAN TAGIHAN NYATA" : ""}</p></html>`;
    const file = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync())
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
      });
    else await Print.printAsync({ uri: file.uri });
  }
  function addProduct(product: D.Product) {
    open(
      "Tambah " + D.products[product],
      [
        {
          key: "unit",
          label: "Satuan pembelian",
          options: options(["kg", "butir"]),
        },
        { key: "quantity", label: "Jumlah", number: true, value: "1" },
      ],
      async (v) => {
        const quantity = numeric(v.quantity);
        if (!D.qty(quantity, v.unit === "butir") || quantity <= 0)
          throw Error("Isi jumlah positif; butir harus bilangan bulat.");
        setCart((c) => {
          const old = c.find((l) => l.product === product && l.unit === v.unit);
          return old
            ? c.map((l) =>
                l === old ? { ...l, quantity: l.quantity + quantity } : l,
              )
            : [...c, { product, unit: v.unit as D.Unit, quantity }];
        });
      },
    );
  }
  function startReorder(draft: D.ReorderDraft, plan?: D.PurchasePlan) {
    const apply = async () => {
      setCart(
        draft.lines.map(({ product, unit, quantity }) => ({
          product,
          unit,
          quantity,
        })),
      );
      setCategory(draft.category);
      setDate(draft.date);
      setDraftContact(draft);
      setPlanContext(plan ? { id: plan.id, date: plan.nextDate } : null);
      setSelectedDepot("");
      setLocation(null);
      setOrderId(null);
      setPage("Pesan");
    };
    confirm(
      "Siapkan pembelian",
      `${cart.length ? "Keranjang saat ini akan diganti. " : ""}Harga memakai daftar terbaru. Periksa alamat, tanggal, lokasi dan stok depo sebelum mengonfirmasi pesanan.`,
      apply,
    );
  }
  function purchasePlanForm(o: D.Order, existing?: D.PurchasePlan) {
    open(
      existing ? "Ubah jadwal pembelian" : "Jadwalkan pembelian telur",
      [
        {
          key: "label",
          label: "Nama jadwal",
          value: existing?.label || `Telur untuk ${o.name}`,
        },
        {
          key: "nextDate",
          label: "Tanggal pembelian berikutnya (YYYY-MM-DD)",
          value: existing?.nextDate || D.today(),
        },
        {
          key: "interval",
          label: "Ulangi setiap",
          value: String(existing?.intervalDays || 7),
          options: [
            { value: "7", label: "1 minggu" },
            { value: "14", label: "2 minggu" },
            { value: "28", label: "4 minggu" },
          ],
        },
        {
          key: "name",
          label: "Nama pelanggan / perusahaan",
          value: existing?.name || o.name,
        },
        {
          key: "phone",
          label: "Nomor telepon",
          value: existing?.phone || o.phone,
        },
        {
          key: "address",
          label: "Alamat lengkap",
          value: existing?.address || o.address,
          multiline: true,
        },
      ],
      async (v) => {
        await change((s) =>
          D.savePurchasePlan(s, {
            id: existing?.id || uuid("JP"),
            sourceOrderId: o.id,
            label: v.label.trim(),
            name: v.name.trim(),
            phone: v.phone.trim(),
            address: v.address.trim(),
            category: existing?.category || o.category,
            lines: (existing?.lines || o.lines).map(
              ({ product, unit, quantity }) => ({ product, unit, quantity }),
            ),
            slot: existing?.slot || o.slot,
            notes: existing?.notes || o.notes,
            nextDate: v.nextDate,
            intervalDays: Number(v.interval) as D.PurchasePlan["intervalDays"],
            active: existing?.active ?? true,
          }),
        );
        setOrderId(null);
        setPage("Jadwal");
      },
      "Jadwal tersimpan di perangkat. Aplikasi tidak membuat pesanan otomatis atau mengirim notifikasi latar belakang. Produk dan kategori mengikuti pesanan asal; jumlah dapat disesuaikan saat menyiapkan keranjang.",
    );
  }
  function checkout(depotId: string) {
    const rows = cart.map((l) => ({
      ...l,
      price:
        current.current!.prices[category][l.product][l.unit === "kg" ? 0 : 1],
    }));
    open(
      "Alamat & jadwal",
      [
        {
          key: "name",
          label: "Nama pelanggan / perusahaan",
          value: draftContact?.name,
        },
        { key: "phone", label: "Nomor telepon", value: draftContact?.phone },
        {
          key: "address",
          label: "Alamat lengkap",
          multiline: true,
          value: draftContact?.address,
        },
        {
          key: "slot",
          label: "Waktu pengiriman",
          options: options(["Pagi (08–12)", "Siang (12–16)", "Sore (16–18)"]),
          value: draftContact?.slot,
        },
        { key: "due", label: "Jatuh tempo (YYYY-MM-DD)", value: date },
        {
          key: "notes",
          label: "Catatan pengantaran",
          optional: true,
          multiline: true,
          value: draftContact?.notes,
        },
      ],
      async (v) => {
        await change((s) => {
          const ranked = D.rankedDepots(s, rows, date, location).find(
            (r) => r.depot.id === depotId,
          );
          if (!ranked?.available)
            throw Error(ranked?.reason || "Depo tidak ditemukan.");
          const input = {
            id: uuid("TF"),
            name: v.name.trim(),
            phone: v.phone.trim(),
            address: v.address.trim(),
            category,
            depotId,
            date,
            slot: v.slot,
            due: v.due,
            notes: v.notes,
            lines: rows,
          };
          if (planContext)
            D.placePlannedOrder(s, planContext.id, planContext.date, input);
          else D.placeOrder(s, input);
        });
        setCart([]);
        setDraftContact(null);
        setPlanContext(null);
        setPage("Aktivitas");
      },
      `${category} · ${current.current!.depots.find((d) => d.id === depotId)?.name} · ${date}. Jumlah kg/butir dan harga disimpan saat pemesanan. Berat atau hitungan pelengkap masih berupa alokasi sampai ditimbang. Pesanan dicatat lokal pada perangkat ini.`,
      "Buat pesanan lokal",
    );
  }
  function lotForm() {
    open(
      "Tambah batch telur",
      [
        { key: "depotId", label: "Depo penyimpanan", options: depotOptions },
        {
          key: "product",
          label: "Varian",
          options: [
            { value: "", label: "Belum diklasifikasikan" },
            ...pOptions,
          ],
          optional: true,
        },
        { key: "kg", label: "Berat fisik (kg)", number: true },
        { key: "eggs", label: "Jumlah fisik (butir)", number: true },
        {
          key: "harvest",
          label: "Tanggal panen (YYYY-MM-DD)",
          value: D.today(),
          optional: true,
        },
        { key: "expiry", label: "Batas jual (YYYY-MM-DD)", optional: true },
        {
          key: "quality",
          label: "Status kualitas",
          options: options(["Karantina", "Aktif", "Diblokir"]),
        },
        { key: "note", label: "Asal dan catatan pemeriksaan", multiline: true },
      ],
      async (v) =>
        change((s) =>
          D.addLot(s, {
            id: uuid("LOT"),
            parentId: null,
            depotId: v.depotId,
            product: v.product === "" ? null : (Number(v.product) as D.Product),
            kg: numeric(v.kg),
            eggs: numeric(v.eggs),
            harvest: v.harvest,
            expiry: v.expiry,
            quality: v.quality as D.Quality,
            note: v.note,
          }),
        ),
      "Status aktif dan varian harus dipastikan sebelum batch tersedia untuk pesanan.",
    );
  }
  function editLot(l: D.Lot) {
    const used = data!.orders.some((o) =>
      o.allocations.some((a) => a.lotId === l.id),
    );
    open(
      "Kualitas & klasifikasi batch",
      [
        {
          key: "product",
          label: "Varian",
          value: l.product === null ? "" : String(l.product),
          options: [
            { value: "", label: "Belum diklasifikasikan" },
            ...pOptions,
          ],
          optional: true,
        },
        {
          key: "quality",
          label: "Status kualitas",
          value: l.quality,
          options: options(["Aktif", "Karantina", "Diblokir"]),
        },
        {
          key: "harvest",
          label: "Tanggal panen (YYYY-MM-DD)",
          value: l.harvest,
          optional: true,
        },
        {
          key: "expiry",
          label: "Batas jual (YYYY-MM-DD)",
          value: l.expiry,
          optional: true,
        },
        { key: "note", label: "Alasan pemeriksaan", multiline: true },
      ],
      async (v) =>
        change((s) => {
          const row = s.lots.find((x) => x.id === l.id)!;
          const product =
            v.product === "" ? null : (Number(v.product) as D.Product);
          if (used && product !== row.product)
            throw Error(
              "Varian batch yang sudah dipakai pesanan tidak dapat diganti.",
            );
          row.product = product;
          row.quality = v.quality as D.Quality;
          row.harvest = v.harvest;
          row.expiry = v.expiry;
          row.note = v.note;
          D.audit(s, "Pemeriksaan batch " + l.id + " · " + v.note);
        }),
    );
  }
  function sortLot(l: D.Lot) {
    open(
      "Sortir sebagian batch",
      [
        { key: "product", label: "Varian hasil sortir", options: pOptions },
        { key: "kg", label: "Berat hasil sortir (kg)", number: true },
        { key: "eggs", label: "Jumlah hasil sortir (butir)", number: true },
        { key: "note", label: "Catatan pemeriksaan kualitas", multiline: true },
      ],
      async (v) =>
        change((s) =>
          D.splitLot(
            s,
            l.id,
            Number(v.product) as D.Product,
            numeric(v.kg),
            numeric(v.eggs),
            uuid("LOT"),
            v.note,
          ),
        ),
      "Hasil sortir dipisahkan menjadi batch aktif. Total stok tidak bertambah. Pastikan hasil pemeriksaan layak dijual.",
    );
  }
  function correction(l: D.Lot) {
    open(
      "Koreksi hasil stok opname",
      [
        {
          key: "direction",
          label: "Arah koreksi",
          options: options(["Kurangi", "Tambah"]),
        },
        { key: "kg", label: "Selisih berat (kg)", number: true, value: "0" },
        { key: "eggs", label: "Selisih butir", number: true, value: "0" },
        { key: "note", label: "Alasan dan bukti pemeriksaan", multiline: true },
      ],
      async (v) =>
        change((s) =>
          D.correctLot(
            s,
            l.id,
            numeric(v.kg),
            numeric(v.eggs),
            v.direction === "Tambah",
            v.note,
          ),
        ),
      "Koreksi hanya saldo bebas. Alokasi pesanan yang sudah dibuat tetap dipertahankan. Jangan mencatat ulang barang yang sama.",
    );
  }
  function transferFromCandidate(report:ReturnType<typeof stockAlerts>,renderedLots:AlertLot[],choice:CandidateAllocation) {
    try {
      const normalize=(s:D.State)=>s.lots.map(l=>({id:l.id,depot:l.depotId,product:l.product,kg:l.kg,eggs:l.eggs,harvest:l.harvest,expiry:l.expiry,status:l.quality,approved:true}));
      const draft=prepareCandidateTransfer(report,renderedLots,choice,D.today());
      assertCandidateCurrent(draft,normalize(current.current!),D.today());
      const sourceName=current.current!.depots.find(d=>d.id===choice.from)?.name||choice.from;
      const targetName=current.current!.depots.find(d=>d.id===choice.to)?.name||choice.to;
      let completed=false;
      open("Transfer dari kandidat batch",[
        {key:"kg",label:"Berat fisik kg maksimal "+num(choice.kg),number:true,value:String(choice.kg)},
        {key:"eggs",label:"Butir fisik hasil hitung",number:true},
        {key:"note",label:"Catatan pemeriksaan dan serah terima",multiline:true}
      ],async v=>{
        if(completed)throw Error("Transfer ini sudah disimpan. Buat ulang simulasi.");
        await change(s=>{
          const accepted=validateCandidateTransfer(draft,normalize(s),D.today(),{lotId:choice.lotId,to:choice.to,kg:numeric(v.kg),eggs:numeric(v.eggs),note:v.note});
          D.transfer(s,accepted.lotId,accepted.to,accepted.kg,accepted.eggs,uuid("LOT"),accepted.note);
        });
        completed=true;
      },`${sourceName} → ${targetName} · ${choice.lotId}. Periksa hasil fisik. Kg boleh dikurangi dari usulan; butir wajib diisi. Batch dan tujuan mengikuti kandidat. Batal tidak mengubah stok. Perubahan saldo atau kondisi mengharuskan simulasi baru.`,"Konfirmasi transfer fisik");
    } catch(e) { Alert.alert("Periksa kandidat",errorMessage(e)); }
  }
  function transferLot(l: D.Lot) {
    open(
      "Transfer antar depo",
      [
        {
          key: "to",
          label: "Depo tujuan",
          options: depotOptions.filter((d) => d.value !== l.depotId),
        },
        { key: "kg", label: "Berat dipindahkan (kg)", number: true },
        { key: "eggs", label: "Butir dipindahkan", number: true },
        { key: "note", label: "Catatan serah terima", multiline: true },
      ],
      async (v) =>
        change((s) =>
          D.transfer(
            s,
            l.id,
            v.to,
            numeric(v.kg),
            numeric(v.eggs),
            uuid("LOT"),
            v.note,
          ),
        ),
      `Tersedia bebas ${num(l.kg)} kg / ${l.eggs} butir. Status kualitas dan asal batch dipertahankan.`,
    );
  }
  async function reloadSavedMonitor(){
    if(savedMonitorLock.current)return;savedMonitorLock.current=true;setSavedMonitorBusy(true);
    try{const value=await loadMonitorSavedFilters();savedMonitorRef.current=value;setSavedMonitor(value);setSavedMonitorError("");}
    catch(e){savedMonitorRef.current=null;setSavedMonitor(null);setSavedMonitorError(errorMessage(e));}
    finally{savedMonitorLock.current=false;setSavedMonitorBusy(false);}
  }
  async function commitSavedMonitor(transform:(value:FR.MonitorFilterStore)=>FR.MonitorFilterStore){
    if(savedMonitorLock.current||!savedMonitorRef.current)throw Error("Muat ulang daftar filter monitor terlebih dahulu.");
    const previous=savedMonitorRef.current,next=transform(previous);savedMonitorLock.current=true;setSavedMonitorBusy(true);
    try{await persistMonitorSavedFilters(next,previous.revision);savedMonitorRef.current=next;setSavedMonitor(next);setSavedMonitorError("");}
    catch(e){setSavedMonitorError(errorMessage(e));throw e;}finally{savedMonitorLock.current=false;setSavedMonitorBusy(false);}
  }
  function saveMonitorForm(){
    open("Simpan filter riwayat mutasi",[{key:"name",label:"Nama filter (maks60)"}],async v=>{FR.validateMonitorFilters(flockFilters,data!.houses!.map(h=>h.id));await commitSavedMonitor(store=>FR.addMonitorSavedFilter(store,uuid("MON"),v.name,"ledger",flockFilters));},"Maksimal 10 filter pribadi pada perangkat. Tanggal disimpan tetap; tidak ikut backup transaksi atau sinkronisasi tim.");
  }
  function duplicateSavedMonitorForm(id:string){
    open("Duplikasi filter mutasi",[{key:"name",label:"Nama filter baru (maks60)"}],async v=>{await commitSavedMonitor(store=>{const item=store.items.find(x=>x.id===id);if(!item||item.source!=="ledger")throw Error("Filter lokal tidak tersedia.");FR.validateMonitorFilters(item.filters,current.current!.houses!.map(h=>h.id));return FR.duplicateMonitorSavedFilter(store,id,uuid("MON"),v.name);});},"Menyalin isi filter tersimpan ke ID baru. Filter asli tetap; maksimal 10 pada perangkat.");
  }
  function renameSavedMonitorForm(id:string){
    const item=savedMonitorRef.current?.items.find(x=>x.id===id);if(!item)return;
    open("Ubah nama filter mutasi",[{key:"name",label:"Nama filter (maks60)",value:item.name}],async v=>{await commitSavedMonitor(store=>FR.renameMonitorSavedFilter(store,id,v.name));},"Mengubah nama saja; isi, ID dan urutan filter tetap.");
  }
  function updateSavedMonitorForm(id:string){
    const item=savedMonitorRef.current?.items.find(x=>x.id===id);if(!item)return;
    const filters={...flockFilters};
    confirm("Perbarui isi filter?",item.name+" akan memakai pilihan yang sudah diterapkan: "+describeSavedMonitor(filters)+". Nama tetap; tidak mengubah transaksi.",async()=>{FR.validateMonitorFilters(filters,current.current!.houses!.map(h=>h.id));await commitSavedMonitor(store=>FR.updateMonitorSavedFilter(store,id,"ledger",filters));});
  }
  function describeSavedMonitor(f:FR.MonitorFilters){
    return [(FR.kindLabels[f.kind]||"Semua jenis"),f.house?(data!.houses!.find(h=>h.id===f.house)?.name||"Kandang tidak tersedia"):"Semua kandang",(f.from||"Tanpa batas awal")+" s.d. "+(f.to||"Tanpa batas akhir"),f.query?"Cari: "+f.query:"Tanpa pencarian"].join(" · ");
  }
  function applySavedMonitor(id:string){
    try{const item=savedMonitorRef.current?.items.find(x=>x.id===id);if(!item||item.source!=="ledger")throw Error("Filter lokal tidak tersedia.");const value=FR.validateMonitorFilters(item.filters,current.current!.houses!.map(h=>h.id));setFlockFilters(value);setFlockReportPage(1);}
    catch(e){Alert.alert("Filter tidak dapat dipakai",errorMessage(e));}
  }
  function setSavedMonitorFavorite(id:string,favorite:boolean){
    act(()=>commitSavedMonitor(store=>{const item=store.items.find(x=>x.id===id);if(!item)throw Error("Filter lokal tidak tersedia.");if(favorite){if(item.source!=="ledger")throw Error("Sumber tidak tersedia.");FR.validateMonitorFilters(item.filters,current.current!.houses!.map(h=>h.id));}return FR.setMonitorSavedFavorite(store,id,favorite);}));
  }
  function renderSavedMonitor(){
    const disabled=savedMonitorBusy||!savedMonitor||Boolean(savedMonitorError);
    return <View><Text style={S.h2}>Filter mutasi tersimpan</Text><Note>Pribadi pada perangkat, maksimal10. Data terbaru dipakai saat filter diterapkan. Berbeda dari filter portal tim dan tidak ikut backup transaksi.</Note>{Boolean(savedMonitorError)&&<Note>{savedMonitorError}</Note>}<Button title="Muat ulang filter mutasi tersimpan" secondary disabled={savedMonitorBusy} onPress={()=>void reloadSavedMonitor()} /><Button title="Simpan filter mutasi yang diterapkan" secondary disabled={disabled||busy||(savedMonitor?.items.length||0)>=10} onPress={saveMonitorForm} /><Button title={monitorFavoriteOnly?"Tampilkan semua filter mutasi":"Hanya favorit mutasi"} secondary onPress={()=>setMonitorFavoriteOnly(!monitorFavoriteOnly)} /><Text style={S.small}>{savedMonitor?.items.length||0}/10 filter · {savedMonitor?.items.filter(x=>x.favorite).length||0} favorit</Text>{monitorFavoriteOnly&&!savedMonitor?.items.some(x=>x.favorite)&&<Note>Belum ada filter favorit. Tampilkan semua filter untuk menandai favorit.</Note>}{FR.listMonitorSavedFilters(savedMonitor?.items||[],monitorFavoriteOnly).map(item=><Card key={item.id}><Text style={S.h2}>{item.favorite?"★ ":""}{item.name}</Text><Button title={item.favorite?"Lepas favorit mutasi":"Jadikan favorit mutasi"} secondary disabled={disabled||busy||(!item.favorite&&(item.source!=="ledger"||Boolean(item.filters.house&&!data!.houses!.some(h=>h.id===item.filters.house))))} onPress={()=>setSavedMonitorFavorite(item.id,!item.favorite)} /><Note>{item.source==="ledger"?describeSavedMonitor(item.filters):"Sumber tidak tersedia di perangkat"}</Note><Button title="Duplikasi filter mutasi" secondary disabled={disabled||busy||(savedMonitor?.items.length||0)>=10||item.source!=="ledger"||Boolean(item.filters.house&&!data!.houses!.some(h=>h.id===item.filters.house))} onPress={()=>duplicateSavedMonitorForm(item.id)} /><Button title="Ubah nama filter mutasi" secondary disabled={disabled||busy} onPress={()=>renameSavedMonitorForm(item.id)} /><Button title="Perbarui isi dari filter mutasi aktif" secondary disabled={disabled||busy} onPress={()=>updateSavedMonitorForm(item.id)} /><Button title="Pakai filter mutasi tersimpan" secondary disabled={disabled||busy||item.source!=="ledger"||Boolean(item.filters.house&&!data!.houses!.some(h=>h.id===item.filters.house))} onPress={()=>applySavedMonitor(item.id)} /><Button title="Hapus filter mutasi tersimpan" secondary disabled={disabled||busy} onPress={()=>confirm("Hapus filter?",item.name,()=>commitSavedMonitor(store=>FR.removeMonitorSavedFilter(store,item.id)))} /></Card>)}</View>;
  }
  function localPerformance(state:D.State){
    const copy=structuredClone(state);D.ensureHouseMaster(copy);
    return HP.housePerformance(copy.houses!.map(h=>({id:h.id,code:h.code,name:h.name,population:D.housePopulation(copy,h.id)})),copy.production,performanceFilters);
  }
  function performanceForm(){
    open("Periode ringkasan kandang",[{key:"from",label:"Dari YYYY-MM-DD",value:performanceFilters.from},{key:"to",label:"Sampai YYYY-MM-DD",value:performanceFilters.to},{key:"house",label:"Kandang",optional:true,value:performanceFilters.house,options:[{value:"",label:"Semua kandang lokal"},...data!.houses!.map(h=>({value:h.id,label:h.code+" · "+h.name}))]}],async v=>{setPerformanceFilters(HP.validatePerformanceFilters({from:v.from,to:v.to,house:v.house||""},current.current!.houses!.map(h=>h.id)));},"Maksimal 366 hari. Populasi memakai saldo kini; hari tanpa catatan bukan produksi nol.");
  }
  async function exportLocalPerformance(){
    const report=localPerformance(current.current!),csv=HP.housePerformanceCsv(report,{workspace:"Data lokal perangkat",generated:new Date().toISOString()}),file=new File(Paths.cache,"PamanKu-Ringkasan-Kandang-v6.0-"+Date.now()+".csv");file.write("\uFEFF"+csv);
    if(await Sharing.isAvailableAsync())await Sharing.shareAsync(file.uri,{mimeType:"text/csv",dialogTitle:"Ringkasan kandang PamanKu"});else throw Error("Menu berbagi tidak tersedia pada perangkat ini.");
  }
  function renderLocalPerformance(){
    try{const r=localPerformance(data!),s=r.summary,n=(v:number|null)=>v===null?"—":num(v);
    return <Card><Text style={S.h2}>Ringkasan operasional kandang</Text><Note>{r.filters.from} s.d. {r.filters.to}. Populasi adalah saldo kini; hari tanpa catatan bukan produksi nol.</Note><Button title="Atur periode ringkasan kandang" secondary onPress={performanceForm} /><Button title="Ekspor CSV ringkasan kandang" secondary onPress={()=>act(exportLocalPerformance)} /><Text style={S.body}>Populasi kini {n(s.population)} · {s.populationMissing} kandang belum diketahui. Telur baik {n(s.eggs)} butir / {n(s.kg)} kg. Pakan {n(s.feed)} kg · Mortalitas {n(s.dead)} ekor. Kelengkapan {n(s.coveragePercent)}%.</Text>{r.rows.map(x=><View key={x.id}><Text style={S.h2}>{x.code} · {x.name}</Text><Text style={S.body}>Populasi kini {n(x.population)} · Telur baik {n(x.eggs)} butir / {n(x.kg)} kg · Rusak {n(x.broken)} butir. Pakan {n(x.feed)} kg · Mortalitas {n(x.dead)} ekor. {x.recordedDays}/{r.days} hari tercatat, {x.missingDays} tanpa catatan. Rata-rata {n(x.eggsPerRecordedDay)} butir/hari tercatat; {n(x.feedPerKg)} kg pakan/kg telur.</Text></View>)}<Note>Data lokal perangkat. Rasio catatan periode, bukan persentase hen-day atau FCR biologis terverifikasi.</Note></Card>;
    }catch(e){return <Card><Text style={S.h2}>Ringkasan kandang</Text><Note>{errorMessage(e)}</Note><Button title="Atur ulang periode ringkasan" secondary onPress={performanceForm} /></Card>}
  }
  function flockFilterForm(){
    open("Filter riwayat mutasi lokal",[
      {key:"kind",label:"Jenis",value:flockFilters.kind,options:[{value:"all",label:"Semua jenis"},...Object.entries(FR.kindLabels).map(([value,label])=>({value,label}))]},
      {key:"house",label:"Kandang",optional:true,value:flockFilters.house,options:[{value:"",label:"Semua kandang"},...data!.houses!.map(h=>({value:h.id,label:h.code+" · "+h.name}))]},
      {key:"from",optional:true,label:"Dari YYYY-MM-DD (boleh kosong)",value:flockFilters.from},
      {key:"to",optional:true,label:"Sampai YYYY-MM-DD (boleh kosong)",value:flockFilters.to},
      {key:"query",optional:true,label:"Cari ID, nama atau catatan (maks80)",value:flockFilters.query},
    ],async v=>{const f=FR.validateMonitorFilters({...flockFilters,...v},data!.houses!.map(h=>h.id));setFlockFilters(f);setFlockReportPage(1);},"Periode inklusif memakai tanggal mutasi. Filter hanya mengubah tampilan, tidak mengubah populasi.");
  }
  function flockForm() {
    const houses=data!.houses!.filter(h=>h.active&&h.initialPopulation!==null&&h.capacity!==null&&h.depotId);
    if(!houses.length){Alert.alert("Lengkapi master kandang","Isi kapasitas, populasi awal dan depo terlebih dahulu.");return;}
    open("Mutasi populasi ayam",[
      {key:"kind",label:"Jenis mutasi",options:["in","out","transfer"].map((value,i)=>({value,label:["Ayam masuk","Ayam keluar / afkir","Pindah kandang"][i]}))},
      {key:"date",label:"Tanggal YYYY-MM-DD",value:D.today()},
      {key:"fromHouseId",label:"Asal (diabaikan untuk ayam masuk)",options:houses.map(h=>({value:h.id,label:h.code+" · "+h.name}))},
      {key:"toHouseId",label:"Tujuan (diabaikan untuk ayam keluar)",options:houses.map(h=>({value:h.id,label:h.code+" · "+h.name}))},
      {key:"quantity",label:"Jumlah ekor",number:true},
      {key:"note",label:"Alasan dan referensi",multiline:true},
    ],async v=>change(s=>D.recordFlockMovement(s,{id:uuid("FLK"),date:v.date,kind:v.kind as D.FlockMovement["kind"],fromHouseId:v.kind==="in"?null:v.fromHouseId,toHouseId:v.kind==="out"?null:v.toHouseId,quantity:numeric(v.quantity),note:v.note})),"Saldo dan kapasitas diperiksa. Riwayat tidak bisa dihapus. Tanggal harus sama atau sesudah transaksi kandang terakhir.");
  }
  function houseForm(house?: D.House) {
    open(house ? "Ubah kandang" : "Tambah kandang", [
      {key:"code",label:"Kode kandang",value:house?.code},
      {key:"name",label:"Nama kandang",value:house?.name},
      {key:"farmLocation",label:"Lokasi farm",value:house?.farmLocation},
      {key:"depotId",label:"Depo hasil panen",value:house?.depotId||undefined,options:depotOptions},
      {key:"capacity",label:"Kapasitas ekor",number:true,value:house?.capacity?.toString()},
      {key:"initialPopulation",label:"Populasi awal ekor",number:true,value:house?.initialPopulation?.toString()},
    ],async v=>change(s=>D.saveHouse(s,{id:house?.id||uuid("HSE"),code:v.code,name:v.name,farmLocation:v.farmLocation,depotId:v.depotId,capacity:numeric(v.capacity),initialPopulation:numeric(v.initialPopulation),active:house?.active??true})),"Kode dan nama harus unik. Populasi awal serta depo terkunci setelah ada produksi. Mode lokal ini pribadi; penugasan operator tersedia di portal tim.");
  }
  function production() {
    if(!data!.houses?.some(h=>h.active)){Alert.alert("Belum ada kandang aktif","Tambahkan atau aktifkan kandang di Kelola → Master kandang.");return;}
    open(
      "Catat produksi harian",
      [
        { key: "date", label: "Tanggal (YYYY-MM-DD)", value: D.today() },
        {
          key: "houseId",
          label: "Kandang",
          options: data!.houses!.filter(h=>h.active).map(h=>({value:h.id,label:h.code+" · "+h.name})),
        },
        { key: "depotId", label: "Depo hasil panen", options: depotOptions },
        { key: "eggs", label: "Telur baik (butir)", number: true },
        { key: "kg", label: "Berat telur baik (kg)", number: true },
        {
          key: "broken",
          label: "Telur rusak (butir)",
          number: true,
          value: "0",
        },
        { key: "feed", label: "Pakan terpakai (kg)", number: true, value: "0" },
        { key: "dead", label: "Mortalitas (ekor)", number: true, value: "0" },
      ],
      async (v) =>
        change((s) => {
          if (!D.dateOK(v.date) || v.date > D.today())
            throw Error("Tanggal produksi tidak valid.");
          const house=D.houseForProduction(s,v.houseId,v.date,v.depotId,numeric(v.dead));
          const r = {
            id: uuid("PRD"),
            date: v.date,
            house: house.name,
            houseId: house.id,
            eggs: numeric(v.eggs),
            kg: numeric(v.kg),
            broken: numeric(v.broken),
            feed: numeric(v.feed),
            dead: numeric(v.dead),
          };
          if (
            !D.qty(r.eggs, true) ||
            !D.qty(r.kg) ||
            !D.qty(r.broken, true) ||
            !D.qty(r.feed) ||
            !D.qty(r.dead, true) ||
            (r.eggs === 0) !== (r.kg === 0)
          )
            throw Error("Jumlah produksi tidak valid.");
          s.production.unshift(r);
          if (r.eggs > 0)
            D.addLot(s, {
              id: uuid("LOT"),
              parentId: null,
              depotId: v.depotId,
              product: null,
              kg: r.kg,
              eggs: r.eggs,
              harvest: r.date,
              expiry: "",
              quality: "Karantina",
              note: "Hasil " + r.house + " · " + r.id,
            });
          D.audit(s, "Produksi " + r.id);
        }),
      "Hasil panen masuk batch karantina. Klasifikasikan varian dan periksa kualitas sebelum dijual.",
    );
  }
  function packing(o: D.Order) {
    open(
      "Hitung & timbang fisik",
      o.allocations
        .flatMap((a, i) => [
          {
            key: "kg" + i,
            label: `${D.products[o.lines[a.line].product]} · ${a.lotId.slice(0, 12)} · kg`,
            value: String(a.kg),
            number: true,
          },
          {
            key: "eggs" + i,
            label: `Batch yang sama · butir`,
            value: String(a.eggs),
            number: true,
          },
        ])
        .concat([
          {
            key: "note",
            label: "Catatan pemeriksaan",
            value: "",
            number: false,
          },
        ]),
      async (v) =>
        change((s) =>
          D.packOrder(
            s,
            o.id,
            o.allocations.map((a, i) => ({
              ...a,
              kg: numeric(v["kg" + i]),
              eggs: numeric(v["eggs" + i]),
            })),
            v.note,
          ),
        ),
      "Timbang dan hitung setiap alokasi. Satuan yang dibeli harus tetap sesuai pesanan; harga invoice tidak berubah.",
    );
  }
  function caseForm(o: D.Order) {
    open(
      "Catat keluhan / retur",
      [{ key: "description", label: "Keluhan pelanggan", multiline: true }],
      async (v) =>
        change((s) =>
          D.createCase(s, {
            id: uuid("CASE"),
            orderId: o.id,
            description: v.description,
            created: new Date().toISOString(),
            returns: [],
            credit: 0,
            refund: 0,
            reference: "",
            resolution: "",
          }),
        ),
    );
  }
  function returnForm(c: D.Case) {
    const o = data!.orders.find((o) => o.id === c.orderId)!;
    const fields: Field[] = o.lines.flatMap((l, i) => [
      {
        key: "kg" + i,
        label: D.products[l.product] + " diterima (kg)",
        number: true,
        value: "0",
      },
      {
        key: "eggs" + i,
        label: "Jumlah kembali (butir)",
        number: true,
        value: "0",
      },
    ]);
    open(
      "Penerimaan retur fisik",
      fields,
      async (v) =>
        change((s) => {
          const items = o.lines
            .map((_, i) => ({
              line: i,
              kg: numeric(v["kg" + i]),
              eggs: numeric(v["eggs" + i]),
              lotId: uuid("RET"),
            }))
            .filter((r) => r.kg !== 0 || r.eggs !== 0);
          D.intakeReturn(s, c.id, items);
        }),
      "Diterima sekali per kasus, maksimal jumlah kiriman dikurangi retur sebelumnya. Barang kembali masuk karantina. Isi 0 pada item yang tidak diretur.",
    );
  }
  if (!data)
    return (
      <SafeAreaView
        style={[S.root, { padding: 24, justifyContent: "center", gap: 20 }]}
      >
        <Text style={S.brand}>PamanKu</Text>
        {loadError ? (
          <>
            <Text style={S.errorText}>{loadError}</Text>
            <Button title="Coba muat kembali" onPress={() => void load()} />
            <Text style={S.small}>
              Data tidak dihapus ketika pemuatan gagal.
            </Text>
          </>
        ) : (
          <ActivityIndicator color={C.brown} />
        )}
      </SafeAreaView>
    );
  const order = orderId ? data.orders.find((o) => o.id === orderId) : null;
  const lines: D.Line[] = cart.map((l) => ({
    ...l,
    price: data.prices[category][l.product][l.unit === "kg" ? 0 : 1],
  }));
  const rankings =
    cart.length && D.dateOK(date)
      ? D.rankedDepots(data, lines, date, location)
      : [];
  const chosen =
    rankings.find((r) => r.depot.id === selectedDepot) ||
    rankings.find((r) => r.available);
  const free = data.lots.reduce((n, l) => n + l.kg, 0),
    sellable = data.lots
      .filter((l) => D.eligible(l, D.today()))
      .reduce((n, l) => n + l.kg, 0),
    balance = data.orders.reduce((n, o) => n + D.financial(data, o).balance, 0);
  function renderOrder(o: D.Order) {
    const f = D.financial(data!, o);
    return (
      <>
        <Button
          title="← Semua pesanan"
          secondary
          onPress={() => setOrderId(null)}
        />
        <Text style={S.h1}>{o.name}</Text>
        <Text style={S.small}>{o.id}</Text>
        <Card>
          <Badge text={o.status} />
          <Text style={S.h2}>{money(f.net)}</Text>
          <Text style={S.body}>
            {o.category} · {data!.depots.find((d) => d.id === o.depotId)?.name}
            {"\n"}
            {o.address}
            {"\n"}
            {o.phone}
            {"\n"}Kirim {o.date} · {o.slot}
            {"\n"}Jatuh tempo {o.due}
          </Text>
          {o.lines.map((l, i) => (
            <View key={i} style={S.between}>
              <Text style={S.body}>
                {D.products[l.product]}
                {"\n"}
                {num(l.quantity)} {l.unit}
              </Text>
              <Text style={S.label}>
                {money(Math.round(l.quantity * l.price))}
              </Text>
            </View>
          ))}
          <View style={S.divider} />
          <Text style={S.body}>
            Nilai awal {money(o.total)}
            {"\n"}Nota kredit {money(f.credit)}
            {"\n"}Pembayaran {money(f.paid)}
            {"\n"}Refund {money(f.refund)}
            {"\n"}Sisa tagihan {money(f.balance)}
            {f.refundDue > 0 ? "\nRefund tertunda " + money(f.refundDue) : ""}
          </Text>
          <Button
            title="Bagikan invoice PDF"
            secondary
            onPress={() => act(() => invoice(o))}
          />
          <Button
            title="Pesan lagi"
            onPress={() => startReorder(D.reorderDraft(data!, o.id))}
          />
          <Button
            title="Buat jadwal pembelian"
            secondary
            onPress={() => purchasePlanForm(o)}
          />
        </Card>
        <Card>
          <Text style={S.h2}>Penyiapan & pengantaran</Text>
          <Text style={S.body}>
            Hasil fisik: {o.packed ? "Sudah diperiksa" : "Belum ditimbang"}
            {"\n"}Kurir: {o.courier || "Belum ditugaskan"}
            {"\n"}Penerima: {o.recipient || "Belum tercatat"}
          </Text>
          {o.allocations.map((a, i) => (
            <Text key={i} style={S.small}>
              {a.lotId}
              {"\n"}
              {num(a.kg)} kg / {a.eggs} butir
            </Text>
          ))}
          {o.status === "Diproses" && (
            <>
              <Button
                title="Catat hitung & timbang"
                onPress={() => packing(o)}
              />
              <Button
                title="Mulai pengiriman"
                secondary
                onPress={() =>
                  open(
                    "Mulai pengiriman",
                    [{ key: "courier", label: "Nama kurir" }],
                    async (v) => change((s) => D.dispatch(s, o.id, v.courier)),
                  )
                }
              />
              {f.paid === 0 && (
                <Button
                  title="Batalkan pesanan"
                  secondary
                  onPress={() =>
                    confirm(
                      "Batalkan pesanan?",
                      "Alokasi dikembalikan ke batch asal satu kali.",
                      () => change((s) => D.cancelOrder(s, o.id)),
                    )
                  }
                />
              )}
            </>
          )}
          {o.status === "Dalam pengiriman" && (
            <Button
              title="Catat serah terima"
              onPress={() =>
                open(
                  "Serah terima",
                  [{ key: "recipient", label: "Nama penerima barang" }],
                  async (v) => change((s) => D.receive(s, o.id, v.recipient)),
                )
              }
            />
          )}
        </Card>
        {o.status !== "Dibatalkan" && (
          <Card>
            <Text style={S.h2}>Pembayaran & layanan</Text>
            {f.balance > 0 && (
              <Button
                title="Catat pembayaran diterima"
                onPress={() =>
                  open(
                    "Pembayaran manual",
                    [
                      {
                        key: "amount",
                        label: "Jumlah diterima (Rp)",
                        number: true,
                        value: String(f.balance),
                      },
                      {
                        key: "date",
                        label: "Tanggal (YYYY-MM-DD)",
                        value: D.today(),
                      },
                      {
                        key: "reference",
                        label: "Metode dan referensi transaksi",
                      },
                    ],
                    async (v) =>
                      change((s) =>
                        D.recordPayment(s, {
                          id: uuid("PAY"),
                          orderId: o.id,
                          amount: numeric(v.amount),
                          date: v.date,
                          reference: v.reference,
                        }),
                      ),
                    "Catat hanya setelah dana diterima. Aplikasi tidak menagih atau mengirim uang.",
                  )
                }
              />
            )}
            <Button
              title="Catat keluhan / retur"
              secondary
              onPress={() => caseForm(o)}
            />
            {data!.payments
              .filter((p) => p.orderId === o.id)
              .map((p) => (
                <Text key={p.id} style={S.body}>
                  {p.date} · {money(p.amount)}
                  {"\n"}
                  {p.reference}
                </Text>
              ))}
            {data!.cases
              .filter((c) => c.orderId === o.id)
              .map((c) => (
                <View key={c.id}>
                  <Text style={S.body}>
                    {c.description} · kredit {money(c.credit)}
                  </Text>
                  <Button
                    title="Tindak lanjut kasus"
                    secondary
                    onPress={() => {
                      setOrderId(null);
                      setPage("Keluhan");
                    }}
                  />
                </View>
              ))}
          </Card>
        )}
      </>
    );
  }
  let content: React.ReactNode;
  if (order) content = renderOrder(order);
  else if (page === "Beranda")
    content = (
      <>
        <Text style={S.eyebrow}>Peternakan & distribusi · Banten</Text>
        <View style={S.hero}>
          <View style={S.between}>
            <View style={{ flex: 1 }}>
              <Text style={S.heroTitle}>
                Telur segar,{"\n"}dari depo terdekat.
              </Text>
            </View>
            <View style={[S.egg, { backgroundColor: "#E8C8A0" }]}>
              <View
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: 20,
                  backgroundColor: C.yolk,
                }}
              />
            </View>
          </View>
          <Text style={S.heroText}>
            Pilih kg atau butir. Kelola stok, pengantaran, dan tagihan dari satu
            aplikasi.
          </Text>
          <Button
            title="Mulai pesan telur →"
            onPress={() => setPage("Pesan")}
          />
        </View>
        <View style={S.row}>
          <View style={S.stat}>
            <Text style={S.small}>Stok layak jual</Text>
            <Text style={S.statValue}>{num(sellable)} kg</Text>
          </View>
          <View style={S.stat}>
            <Text style={S.small}>Dalam proses</Text>
            <Text style={S.statValue}>
              {data.orders.filter((o) => o.status === "Diproses").length}
            </Text>
          </View>
        </View>
        <Card>
          <View style={S.between}>
            <Text style={S.h2}>Hari ini</Text>
            <Badge text={D.today()} />
          </View>
          <Text style={S.body}>
            Produksi{" "}
            {num(
              data.production
                .filter((p) => p.date === D.today())
                .reduce((n, p) => n + p.eggs, 0),
            )}{" "}
            butir{"\n"}Total stok bebas {num(free)} kg{"\n"}Piutang{" "}
            {money(balance)}
          </Text>
          <Button
            title="Lihat operasional"
            secondary
            onPress={() => setPage("Kelola")}
          />
        </Card>
        {data.orders.length === 0 && (
          <Note>
            Mulai dengan stok nyata melalui Kelola → Batch, atau muat data
            contoh di Pengaturan. Koordinat depo awal masih contoh.
          </Note>
        )}
        {data.plans.some((p) => p.active && p.nextDate <= D.today()) && (
          <Card>
            <Text style={S.h2}>Pembelian rutin perlu dikonfirmasi</Text>
            <Text style={S.body}>
              {
                data.plans.filter((p) => p.active && p.nextDate <= D.today())
                  .length
              }{" "}
              jadwal jatuh hari ini atau sudah lewat.
            </Text>
            <Button title="Periksa jadwal" onPress={() => setPage("Jadwal")} />
          </Card>
        )}
        <Text style={S.h2}>Pesanan terbaru</Text>
        {data.orders.slice(0, 3).map((o) => (
          <Pressable
            accessibilityRole="button"
            key={o.id}
            onPress={() => setOrderId(o.id)}
          >
            <Card>
              <View style={S.between}>
                <Text style={S.h2}>{o.name}</Text>
                <Badge text={o.status} />
              </View>
              <Text style={S.body}>
                {o.date} · {money(D.financial(data, o).net)}
              </Text>
            </Card>
          </Pressable>
        ))}
      </>
    );
  else if (page === "Pesan")
    content = (
      <>
        <Text style={S.eyebrow}>Langsung dari peternakan</Text>
        <Text style={S.h1}>Pesan telur</Text>
        {draftContact && (
          <Card>
            <Badge
              text={planContext ? "Dari jadwal pembelian" : "Pemesanan ulang"}
            />
            <Text style={S.body}>
              {draftContact.name}
              {"\n"}Periksa harga terbaru, tanggal, alamat dan lokasi tujuan.
            </Text>
            <Button
              title="Lepas data pesanan asal"
              secondary
              onPress={() => {
                setDraftContact(null);
                setPlanContext(null);
              }}
            />
          </Card>
        )}
        <Text style={S.body}>
          Harga mengikuti kategori pembeli dan satuan yang Anda pilih.
        </Text>
        <Chips
          values={options(D.categories)}
          value={category}
          onChange={(v) => setCategory(v as D.Category)}
        />
        {D.products.map((name, i) => (
          <Card key={name}>
            <View style={S.row}>
              <View
                style={[
                  S.egg,
                  { backgroundColor: [C.shell, "#EED9BC", "#BA8C63"][i] },
                ]}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 20,
                    backgroundColor: C.yolk,
                  }}
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={S.h2}>{name}</Text>
                <Text style={S.body}>
                  {money(data.prices[category][i][0])} / kg{"\n"}
                  {money(data.prices[category][i][1])} / butir
                </Text>
              </View>
            </View>
            <Button
              title="+ Tambah ke keranjang"
              secondary
              onPress={() => addProduct(i as D.Product)}
            />
          </Card>
        ))}
        {cart.length > 0 && (
          <>
            <Card>
              <Text style={S.h2}>Keranjang Anda</Text>
              {lines.map((l, i) => (
                <View key={i} style={S.between}>
                  <View style={{ flex: 1 }}>
                    <Text style={S.body}>
                      {D.products[l.product]} · {num(l.quantity)} {l.unit}
                    </Text>
                    <Text style={S.label}>
                      {money(Math.round(l.quantity * l.price))}
                    </Text>
                  </View>
                  <Button
                    title="Hapus"
                    secondary
                    onPress={() =>
                      setCart((c) => c.filter((_, index) => index !== i))
                    }
                  />
                </View>
              ))}
              <Text style={S.h2}>
                {money(
                  lines.reduce(
                    (n, l) => n + Math.round(l.price * l.quantity),
                    0,
                  ),
                )}
              </Text>
              <Text style={S.small}>
                Ongkir demo Rp0. Harga ini belum mencakup kebijakan ongkir
                operasional.
              </Text>
            </Card>
            <Card>
              <Text style={S.h2}>Lokasi & depo pengirim</Text>
              <FieldInput
                field={{ key: "date", label: "Tanggal kirim (YYYY-MM-DD)" }}
                value={date}
                onChange={(v) => {
                  setDate(v);
                  setSelectedDepot("");
                }}
              />
              <Button
                title={locating ? "Mencari lokasi…" : "Gunakan GPS ponsel"}
                disabled={locating}
                onPress={() => void gps()}
              />
              <Button
                title="Masukkan koordinat alamat"
                secondary
                onPress={manualLocation}
              />
              <Text style={S.small}>
                {location
                  ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} · Jarak garis lurus`
                  : "Belum ada lokasi. Depo ditampilkan berdasarkan ketersediaan, tanpa peringkat jarak."}
              </Text>
              {!D.dateOK(date) && (
                <Text style={S.errorText}>Format tanggal belum valid.</Text>
              )}
              {rankings.map((r) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: chosen?.depot.id === r.depot.id,
                    disabled: !r.available,
                  }}
                  key={r.depot.id}
                  disabled={!r.available}
                  onPress={() => setSelectedDepot(r.depot.id)}
                  style={[
                    S.card,
                    {
                      backgroundColor:
                        chosen?.depot.id === r.depot.id ? "#FFF3CB" : C.cream,
                      opacity: r.available ? 1 : 0.65,
                    },
                  ]}
                >
                  <Text style={S.h2}>
                    {r.depot.name}
                    {chosen?.depot.id === r.depot.id ? " ✓" : ""}
                  </Text>
                  <Text style={S.body}>
                    {r.km === null
                      ? "Lokasi pelanggan belum diisi"
                      : num(r.km) + " km"}{" "}
                    · {r.available ? "Stok tersedia" : r.reason}
                  </Text>
                  {!r.depot.verified && (
                    <Text style={S.small}>
                      Koordinat contoh; belum diverifikasi.
                    </Text>
                  )}
                </Pressable>
              ))}
              <Button
                title="Lanjutkan pesanan"
                disabled={
                  busy ||
                  !chosen?.available ||
                  !D.dateOK(date) ||
                  date < D.today()
                }
                onPress={() => chosen && checkout(chosen.depot.id)}
              />
            </Card>
          </>
        )}
      </>
    );
  else if (page === "Aktivitas")
    content = (
      <>
        <Text style={S.eyebrow}>Pesanan & pengantaran</Text>
        <Text style={S.h1}>Aktivitas</Text>
        <Button
          title={`Jadwal pembelian (${data.plans.filter((p) => p.active).length} aktif)`}
          secondary
          onPress={() => setPage("Jadwal")}
        />
        <Chips
          values={options([
            "Semua",
            "Diproses",
            "Dalam pengiriman",
            "Selesai",
            "Dibatalkan",
          ])}
          value={filter}
          onChange={setFilter}
        />
        {data.orders
          .filter((o) => filter === "Semua" || o.status === filter)
          .map((o) => (
            <Pressable
              key={o.id}
              accessibilityRole="button"
              onPress={() => setOrderId(o.id)}
            >
              <Card>
                <View style={S.between}>
                  <Text style={[S.h2, { flex: 1 }]}>{o.name}</Text>
                  <Badge text={o.status} />
                </View>
                <Text style={S.body}>
                  {o.category} · {o.date}
                  {"\n"}
                  {data.depots.find((d) => d.id === o.depotId)?.name}
                </Text>
                <View style={S.between}>
                  <Text style={S.h2}>{money(D.financial(data, o).net)}</Text>
                  <Text style={S.link}>Buka detail →</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        {!data.orders.length && (
          <Note>
            Pesanan yang dibuat akan muncul di sini. Semua catatan pada versi
            ini tersimpan di perangkat.
          </Note>
        )}
      </>
    );
  else if (page === "Jadwal")
    content = (
      <>
        <Text style={S.eyebrow}>Pembelian rutin</Text>
        <Text style={S.h1}>Jadwal pembelian</Text>
        <Note>
          Jadwal lokal, perlu konfirmasi setiap pembelian. Harga dan stok
          diperiksa saat checkout. Tidak ada pesanan otomatis atau notifikasi di
          latar belakang.
        </Note>
        {!data.plans.length && (
          <Card>
            <Text style={S.body}>
              Buka detail pesanan lalu pilih Buat jadwal pembelian. Tersedia
              interval 1, 2 atau 4 minggu.
            </Text>
          </Card>
        )}
        {[...data.plans]
          .sort(
            (a, b) =>
              Number(b.active) - Number(a.active) ||
              a.nextDate.localeCompare(b.nextDate),
          )
          .map((p) => (
            <Card key={p.id}>
              <Badge
                text={
                  !p.active
                    ? "Dijeda"
                    : p.nextDate <= D.today()
                      ? "Perlu dikonfirmasi"
                      : "Terjadwal"
                }
              />
              <Text style={S.h2}>{p.label}</Text>
              <Text style={S.body}>
                {p.name} · {p.category}
                {"\n"}
                {p.address}
                {"\n"}Berikutnya {p.nextDate} · setiap {p.intervalDays / 7}{" "}
                minggu
              </Text>
              {p.lines.map((l, i) => (
                <Text style={S.small} key={i}>
                  {D.products[l.product]} · {num(l.quantity)} {l.unit}
                </Text>
              ))}
              <Button
                title="Siapkan pesanan"
                disabled={!p.active || busy}
                onPress={() => startReorder(D.plannedDraft(data, p.id), p)}
              />
              <Button
                title="Ubah jadwal & alamat"
                secondary
                onPress={() =>
                  purchasePlanForm(
                    data.orders.find((o) => o.id === p.sourceOrderId)!,
                    p,
                  )
                }
              />
              <Button
                title={p.active ? "Jeda jadwal" : "Aktifkan jadwal"}
                secondary
                disabled={busy}
                onPress={() =>
                  act(() =>
                    change((s) => D.setPurchasePlanActive(s, p.id, !p.active)),
                  )
                }
              />
            </Card>
          ))}
      </>
    );
  else if (page === "Kelola")
    content = (
      <>
        <Text style={S.eyebrow}>Ruang operasional</Text>
        <Text style={S.h1}>Kelola peternakan</Text>
        <Text style={S.body}>
          Menu operator pada perangkat yang sama. Ini bukan pemisahan hak akses
          pengguna.
        </Text>
        {(
          [
            ["Kandang", "Master kandang", "Tambah kandang, kapasitas, populasi dan status"],
            ["Peringatan", "Peringatan stok · v5.0", "Stok menipis, batas jual, dan batch perlu tinjauan"],
            [
              "Jadwal",
              "Pembelian rutin",
              "Pemesanan ulang dan jadwal 1, 2 atau 4 minggu",
            ],
            [
              "Batch",
              "Stok & varian",
              "Klasifikasi, kualitas, dan transfer antar depo",
            ],
            [
              "Produksi",
              "Produksi kandang",
              "Panen, telur rusak, pakan, dan mortalitas",
            ],
            [
              "Keuangan",
              "Tagihan & biaya",
              "Piutang, pembayaran, dan pengeluaran",
            ],
            [
              "Keluhan",
              "Keluhan & retur",
              "Karantina barang, nota kredit, dan refund",
            ],
            [
              "Pengaturan",
              "Pengaturan & cadangan",
              "Koordinat depo, harga, dan backup JSON",
            ],
            [
              "Panduan",
              "Panduan penggunaan",
              "Alur kerja dan batas versi mobile",
            ],
          ] as const
        ).map(([target, title, desc]) => (
          <Pressable
            key={target}
            accessibilityRole="button"
            onPress={() => setPage(target)}
          >
            <Card>
              <Text style={S.h2}>{title} →</Text>
              <Text style={S.body}>{desc}</Text>
            </Card>
          </Pressable>
        ))}
      </>
    );
  else if (page === "Peringatan") {
    const alertLots=data.lots.map(l=>({id:l.id,depot:l.depotId,product:l.product,kg:l.kg,eggs:l.eggs,harvest:l.harvest,expiry:l.expiry,status:l.quality,approved:true}));
    const report = stockAlerts(data.depots.filter(d => !alertDepot || d.id === alertDepot).map(d => d.id), data.lots.map(l => ({id:l.id,depot:l.depotId,product:l.product,kg:l.kg,eggs:l.eggs,harvest:l.harvest,expiry:l.expiry,status:l.quality,approved:true})), alertDay, alertKg, alertDays);
    const batchPlan=batchTransferPlan(report,alertLots);
    const plan = rebalanceStock(report);
    const depotName = (id:string) => data.depots.find(d=>d.id===id)?.name || id;
    const variant = (p:number|null) => p===null ? "Belum diklasifikasikan" : ["Telur reguler","Telur pilihan","Telur ekonomis"][p];
    content = <>
      <Text style={S.eyebrow}>PamanKu v5.0</Text><Text style={S.h1}>Peringatan stok</Text>
      <Note>Saldo bebas yang layak dijual, sesudah alokasi pesanan. Periksa setiap hari. Tanggal acuan bukan rekonstruksi stok historis. Tidak ada notifikasi latar belakang atau perubahan kualitas otomatis.</Note>
      <Text style={S.body}>{alertDay} · di bawah {num(alertKg)} kg · batas jual s.d. {report.end}</Text>
      <Button title="Ubah filter peringatan" onPress={()=>setForm({title:"Filter peringatan",help:"Berlaku pada tampilan sesi ini; tidak mengubah data stok.",fields:[{key:"day",label:"Tanggal acuan YYYY-MM-DD",value:alertDay},{key:"depot",label:"Depo",value:alertDepot,options:[{value:"",label:"Semua depo"},...data.depots.map(d=>({value:d.id,label:d.name}))]},{key:"kg",label:"Ambang stok kg",value:String(alertKg),number:true},{key:"days",label:"Rentang hari",value:String(alertDays),number:true}],save:async v=>{if(!v.kg.trim()||!v.days.trim())throw Error("Ambang dan hari wajib diisi.");const kg=Number(v.kg.replace(",",".")),days=Number(v.days);stockAlerts([],[],v.day,kg,days);setAlertDay(v.day);setAlertDepot(v.depot);setAlertKg(kg);setAlertDays(days);}})} />
      <View style={S.row}>
      <Button title="Ekspor stok CSV" disabled={busy} onPress={()=>void exportStockReport("csv",report,alertDepot?depotName(alertDepot):"Semua depo").catch(e=>Alert.alert("Ekspor gagal",errorMessage(e)))} />
      <Button title="Bagikan laporan PDF" secondary disabled={busy} onPress={()=>void exportStockReport("pdf",report,alertDepot?depotName(alertDepot):"Semua depo").catch(e=>Alert.alert("Ekspor gagal",errorMessage(e)))} />
      </View>
      <Note>Laporan mengikuti filter yang tampil. Kekurangan adalah selisih ke ambang kg, bukan order pembelian. Simpan berkas melalui menu berbagi; laporan tidak dapat dipakai untuk memulihkan data.</Note>
      <Text style={S.h2}>Stok menipis · {report.low.length}</Text>
      {!report.low.length && <Text style={S.body}>Tidak ada stok di bawah ambang.</Text>}
      {report.low.map(b=><Card key={b.depot+"-"+b.product}><Text style={S.h2}>{depotName(b.depot)}</Text><Text style={S.body}>{variant(b.product)} · {num(b.kg)} kg / {num(b.eggs)} butir · Kurang {num(shortageKg(b.kg,alertKg))} kg ke ambang</Text></Card>)}
      <Text style={S.h2}>Simulasi transfer · {num(plan.totalKg)} kg</Text>
      <Note>Hanya usulan kg dari saldo bebas yang layak. Pilih Semua depo untuk meninjau sumber. Simulasi menjaga sumber minimal pada ambang; kandidat batch FEFO menjadi acuan pemeriksaan, tanpa memilih rute atau mengubah stok. Hitung butir dan timbang sebelum mencatat transfer fisik.</Note>
      {plan.moves.map((m,i)=><Card key={i}><Text style={S.h2}>{depotName(m.from)} → {depotName(m.to)}</Text><Text style={S.body}>{variant(m.product)} · usulan {num(m.kg)} kg</Text></Card>)}
      {!plan.moves.length && <Text style={S.body}>Tidak ada usulan transfer dalam cakupan ini.</Text>}
      <Text style={S.h2}>Kebutuhan belum tertutup · {num(plan.unfilledKg)} kg</Text>
      {plan.unfilled.map((m,i)=><Text key={i} style={S.body}>{depotName(m.depot)} · {variant(m.product)} · {num(m.kg)} kg</Text>)}
      <Button title="Ekspor simulasi CSV" secondary disabled={busy} onPress={()=>void exportStockReport("plan",report,alertDepot?depotName(alertDepot):"Semua depo").catch(e=>Alert.alert("Ekspor gagal",errorMessage(e)))} />
      <Text style={S.h2}>Kandidat batch FEFO · {num(batchPlan.allocatedKg)} kg</Text>
      <Note>Urutan batas jual terdekat, lalu tanggal panen dan ID. Tanggal kosong diprioritaskan setelah tanggal yang diketahui. Gunakan tanggal acuan hari ini untuk Siapkan transfer kandidat. Butir fisik tetap wajib; stok berubah hanya setelah konfirmasi berhasil.</Note>
      {batchPlan.allocations.map((a,i)=><Card key={i}><Text style={S.h2}>{depotName(a.from)} → {depotName(a.to)}</Text><Text style={S.body}>{variant(a.product)} · kandidat {num(a.kg)} kg</Text><Text style={S.small}>{a.lotId}</Text><Text style={S.body}>Panen {a.harvest||"belum diketahui"} · Batas jual {a.expiry||"belum diatur"}</Text><Button title="Siapkan transfer kandidat" secondary disabled={busy||alertDay!==D.today()} onPress={()=>transferFromCandidate(report,alertLots,a)} /></Card>)}
      {!batchPlan.allocations.length && <Text style={S.body}>Tidak ada kandidat batch transfer dalam cakupan ini.</Text>}
      {batchPlan.unallocated.length>0 && <Note>{num(batchPlan.unallocatedKg)} kg usulan belum dapat dirinci. Periksa saldo batch dan buat ulang simulasi.</Note>}
      <Button title="Ekspor kandidat batch CSV" secondary disabled={busy} onPress={()=>void exportStockReport("batch",report,alertDepot?depotName(alertDepot):"Semua depo").catch(e=>Alert.alert("Ekspor gagal",errorMessage(e)))} />
      <Button title="Buka batch untuk transfer fisik" secondary onPress={()=>setPage("Batch")} />
      <Text style={S.h2}>Mendekati batas jual · {report.expiring.length}</Text>
      {!report.expiring.length && <Text style={S.body}>Tidak ada batch layak jual dalam rentang ini.</Text>}
      {report.expiring.map(l=><Card key={l.id}><Text style={S.h2}>{depotName(l.depot)} · {variant(l.product)}</Text><Text style={S.body}>{l.id} · batas {l.expiry} · {num(l.kg)} kg / {num(l.eggs)} butir</Text></Card>)}
      <Text style={S.h2}>Perlu tinjauan · {report.review.length}</Text>
      {!report.review.length && <Text style={S.body}>Tidak ada batch yang perlu tinjauan pada saldo bebas.</Text>}
      {report.review.map(({lot:l,reasons})=><Card key={l.id}><Text style={S.h2}>{depotName(l.depot)} · {variant(l.product)}</Text><Text style={S.body}>{l.id} · {num(l.kg)} kg / {num(l.eggs)} butir</Text><Text style={S.body}>{reasons.join(" · ")}</Text></Card>)}
      <Button title="Periksa stok di menu Batch" onPress={()=>setPage("Batch")} secondary />
    </>;
  }
  else if (page === "Batch")
    content = (
      <>
        <Text style={S.h1}>Stok per batch</Text>
        <View style={S.row}>
          <Badge text={num(sellable) + " kg layak jual"} />
          <Badge text={data.lots.length + " batch"} />
        </View>
        <Button title="+ Tambah batch" onPress={lotForm} />
        {data.lots.map((l) => (
          <Card key={l.id}>
            <View style={S.between}>
              <Text style={S.h2}>
                {l.product === null
                  ? "Belum diklasifikasikan"
                  : D.products[l.product]}
              </Text>
              <Badge text={l.quality} />
            </View>
            <Text style={S.small}>{l.id}</Text>
            <Text style={S.body}>
              {data.depots.find((d) => d.id === l.depotId)?.name}
              {"\n"}
              {num(l.kg)} kg / {num(l.eggs)} butir bebas{"\n"}Panen{" "}
              {l.harvest || "belum diketahui"} · Batas jual{" "}
              {l.expiry || "belum ditetapkan"}
              {"\n"}
              {l.note}
            </Text>
            <Button title={traceId===l.id?"Tutup telusur asal":"Telusuri asal & cabang"} secondary onPress={()=>{try{nativeTrace(l.id);if(traceId!==l.id){setTracePageSize(20);setTraceBack(null);setTraceScope("family");setTraceStatus("all");setTracePage(1);setTraceFilters({category:"",from:"",to:""});}setTraceId(traceId===l.id?null:l.id)}catch(e){Alert.alert("Telusur gagal",errorMessage(e))}}} />
            {traceId===l.id && (()=>{try{const t=nativeTrace(l.id);return <View><Text style={S.h2}>Telusur batch · v5.0</Text><Note>Saldo bebas saat ini, bukan jumlah transfer awal atau bukti asal panen. Seluruh cabang keluarga ditampilkan lintas depo dan varian, termasuk batch kosong.</Note><Text style={S.body}>Rantai asal: {t.ancestors.map(x=>x.id).join(" → ")}</Text><Text style={S.body}>{t.family.length} batch · {num(t.kg)} kg / {num(t.eggs)} butir bebas</Text>{t.family.map(x=><View key={x.id}><Text style={S.h2}>{x.id===t.selected?"● ":""}{x.id}</Text><Text style={S.body}>Induk: {x.parentId||"Akar"} · tingkat {x.depth}{"\n"}{data.depots.find(d=>d.id===x.depot)?.name||x.depot} · {x.product===null?"Belum diklasifikasikan":D.products[x.product]} · {x.status}{"\n"}{num(x.kg)} kg / {num(x.eggs)} butir · Panen {x.harvest||"belum diketahui"} · Batas {x.expiry||"belum diatur"}</Text></View>)}{renderTraceOrders(l.id)}<Button title="Bagikan telusur CSV" disabled={busy} onPress={()=>void exportTrace(l.id).catch(e=>Alert.alert("Ekspor gagal",errorMessage(e)))} /></View>}catch(e){return <Note>{errorMessage(e)}</Note>}})()}
            {l.parentId && (
              <Text style={S.small}>Asal batch: {l.parentId}</Text>
            )}
            <Button
              title="Periksa kualitas / klasifikasi"
              secondary
              onPress={() => editLot(l)}
            />
            {l.kg > 0 && l.eggs > 0 && (
              <>
                <Button
                  title="Sortir sebagian batch"
                  secondary
                  onPress={() => sortLot(l)}
                />
                <Button
                  title="Transfer antar depo"
                  secondary
                  onPress={() => transferLot(l)}
                />
              </>
            )}
            <Button
              title="Koreksi stok opname"
              secondary
              onPress={() => correction(l)}
            />
            <Text style={S.small}>
              Dipakai{" "}
              {
                data.orders.filter((o) =>
                  o.allocations.some((a) => a.lotId === l.id),
                ).length
              }{" "}
              pesanan.
            </Text>
          </Card>
        ))}
        {!data.lots.length && (
          <Note>
            Belum ada stok. Tambahkan batch fisik atau catat hasil produksi.
          </Note>
        )}
      </>
    );
  else if (page === "Kandang")
    content = <>
      <Text style={S.h1}>Master kandang</Text>
      {renderLocalPerformance()}
      <Button title="+ Tambah kandang" onPress={()=>houseForm()} />
      <Button title="Catat mutasi ayam lokal" onPress={flockForm} />
      <Note>Persetujuan tim v6.0: Ajukan → Setujui/Tolak → Jalankan melalui portal. Data lokal ini pribadi dan tidak memakai persetujuan multiuser.</Note>
      <Button title="Buka persetujuan tim online" secondary onPress={()=>act(()=>Linking.openURL("https://telurfarm-banten.tangwanan.chatgpt.site/team.html").then(()=>undefined))} />
      <Note>Kandang aktif tersedia untuk produksi baru. Data tim dan penugasan operator dikelola melalui portal online; master lokal ini terpisah. Populasi = awal + masuk − keluar ± pindah − mortalitas. Riwayat mutasi disimpan dalam backup lokal.</Note>
      {data.houses!.map(h=><Card key={h.id}>
        <Text style={S.h2}>{h.code} · {h.name}</Text>
        <Badge text={h.active?"AKTIF":"TIDAK AKTIF"} />
        <Text style={S.body}>{h.farmLocation}{"\n"}Depo: {data.depots.find(d=>d.id===h.depotId)?.name||"Belum ditetapkan"}{"\n"}Kapasitas: {h.capacity??"Belum diisi"} · Populasi awal: {h.initialPopulation??"Belum diisi"}{"\n"}Perkiraan populasi: {D.housePopulation(data,h.id)??"Belum diketahui"}</Text>
        <Button title="Ubah kandang" secondary onPress={()=>houseForm(h)} />
        <Button title={h.active?"Nonaktifkan kandang":"Aktifkan kandang"} secondary onPress={()=>confirm(h.active?"Nonaktifkan kandang?":"Aktifkan kandang?","Riwayat produksi tetap disimpan. Status hanya menentukan pilihan untuk produksi baru.",()=>change(s=>D.setHouseActive(s,h.id,!h.active)))} />
      </Card>)}
      <Text style={S.h2}>Riwayat mutasi ayam</Text>
      {renderSavedMonitor()}
      <Button title="Filter riwayat mutasi" secondary onPress={flockFilterForm} />
      <Button title="Reset filter mutasi" secondary onPress={()=>{setFlockFilters(FR.emptyMonitorFilters());setFlockReportPage(1);}} />
      <Note>{filteredFlockRows.length} transaksi cocok · Kandang {data.houses?.find(h=>h.id===flockFilters.house)?.name||"Semua"} · jenis {FR.kindLabels[flockFilters.kind]||"Semua"} · {flockFilters.from||"Awal"} s.d. {flockFilters.to||"Akhir"}{flockFilters.query?" · Cari: "+flockFilters.query:""}. Data lokal, terpisah dari pengajuan tim.</Note>
      {!filteredFlockRows.length&&<Note>Tidak ada mutasi yang cocok dengan filter.</Note>}
      {FR.monitorPage(filteredFlockRows,flockReportPage,20).rows.map(m=><Card key={m.id}><Text style={S.h2}>{m.date} · {FR.kindLabels[m.kind]} · {m.quantity} ekor</Text><Text style={S.body}>{m.fromName||"—"} → {m.toName||"—"}{"\n"}{m.note}</Text></Card>)}
      <Text style={S.body}>Halaman {FR.monitorPage(filteredFlockRows,flockReportPage,20).page} / {FR.monitorPage(filteredFlockRows,flockReportPage,20).totalPages}</Text>
      <Button title="Riwayat sebelumnya" secondary disabled={FR.monitorPage(filteredFlockRows,flockReportPage,20).page===1} onPress={()=>setFlockReportPage(FR.monitorPage(filteredFlockRows,flockReportPage,20).page-1)} />
      <Button title="Riwayat berikutnya" secondary disabled={FR.monitorPage(filteredFlockRows,flockReportPage,20).page===FR.monitorPage(filteredFlockRows,flockReportPage,20).totalPages} onPress={()=>setFlockReportPage(FR.monitorPage(filteredFlockRows,flockReportPage,20).page+1)} />
    </>;
  else if (page === "Produksi")
    content = (
      <>
        <Text style={S.h1}>Produksi kandang</Text>
        <Button title="+ Catat hasil harian" onPress={production} />
        <Note>
          Hasil panen masuk batch belum diklasifikasikan. Pakan adalah jumlah
          terpakai; biaya pembeliannya dicatat terpisah di Keuangan.
        </Note>
        {data.production.map((p) => (
          <Card key={p.id}>
            <Text style={S.h2}>
              {p.house} · {p.date}
            </Text>
            <Text style={S.body}>
              {num(p.eggs)} butir baik / {num(p.kg)} kg{"\n"}Rusak {p.broken} ·
              Pakan {num(p.feed)} kg · Mati {p.dead} ekor
            </Text>
          </Card>
        ))}
      </>
    );
  else if (page === "Keuangan")
    content = (
      <>
        <Text style={S.h1}>Tagihan & biaya</Text>
        <View style={S.row}>
          <View style={S.stat}>
            <Text style={S.small}>Piutang</Text>
            <Text style={S.statValue}>{money(balance)}</Text>
          </View>
          <View style={S.stat}>
            <Text style={S.small}>Biaya tercatat</Text>
            <Text style={S.statValue}>
              {money(data.expenses.reduce((n, e) => n + e.amount, 0))}
            </Text>
          </View>
        </View>
        <Button
          title="+ Catat biaya"
          onPress={() =>
            open(
              "Biaya operasional",
              [
                {
                  key: "date",
                  label: "Tanggal (YYYY-MM-DD)",
                  value: D.today(),
                },
                { key: "label", label: "Jenis biaya dan keterangan" },
                { key: "amount", label: "Jumlah (Rp)", number: true },
              ],
              async (v) =>
                change((s) => {
                  if (
                    !D.dateOK(v.date) ||
                    v.date > D.today() ||
                    !Number.isSafeInteger(numeric(v.amount)) ||
                    numeric(v.amount) <= 0
                  )
                    throw Error("Tanggal atau nilai biaya tidak valid.");
                  s.expenses.unshift({
                    id: uuid("COST"),
                    date: v.date,
                    label: v.label,
                    amount: numeric(v.amount),
                  });
                  D.audit(s, "Biaya " + v.label);
                }),
            )
          }
        />
        <Text style={S.h2}>Piutang & hak refund</Text>
        {data.orders
          .filter((o) => {
            const f = D.financial(data, o);
            return f.balance > 0 || f.refundDue > 0;
          })
          .map((o) => {
            const f = D.financial(data, o);
            return (
              <Pressable key={o.id} onPress={() => setOrderId(o.id)}>
                <Card>
                  <Text style={S.h2}>{o.name}</Text>
                  <Badge
                    text={
                      o.due < D.today()
                        ? "Lewat jatuh tempo"
                        : "Belum lewat jatuh tempo"
                    }
                  />
                  <Text style={S.body}>
                    Jatuh tempo {o.due}
                    {"\n"}Saldo {money(f.balance)} · Refund tertunda{" "}
                    {money(f.refundDue)}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        <Text style={S.h2}>Pengeluaran tercatat</Text>
        {data.expenses.map((e) => (
          <Card key={e.id}>
            <Text style={S.h2}>{e.label}</Text>
            <Text style={S.body}>
              {e.date} · {money(e.amount)}
            </Text>
          </Card>
        ))}
        <Note>
          Laporan ini adalah catatan operasional dan belum menghitung laba
          bersih, penyusutan, atau seluruh HPP.
        </Note>
      </>
    );
  else if (page === "Keluhan")
    content = (
      <>
        <Text style={S.h1}>Keluhan & retur</Text>
        <Note>
          Kasus baru dibuat dari detail pesanan. Penerimaan barang, nota kredit,
          dan pengembalian dana dicatat terpisah.
        </Note>
        {data.cases.map((c) => {
          const o = data.orders.find((o) => o.id === c.orderId)!;
          return (
            <Card key={c.id}>
              <Badge text={c.resolution ? "Ditutup" : "Terbuka"} />
              <Text style={S.h2}>{o.name}</Text>
              <Text style={S.body}>
                {c.description}
                {"\n"}Retur{" "}
                {c.returns.length ? "diterima ke karantina" : "belum diterima"}
                {"\n"}Kredit {money(c.credit)} · Refund {money(c.refund)}
                {c.resolution ? "\nPenyelesaian: " + c.resolution : ""}
              </Text>
              <Button
                title="Lihat pesanan"
                secondary
                onPress={() => setOrderId(o.id)}
              />
              {!c.resolution && (
                <>
                  {["Dalam pengiriman", "Selesai"].includes(o.status) &&
                    !c.returns.length && (
                      <Button
                        title="Terima retur fisik"
                        onPress={() => returnForm(c)}
                      />
                    )}
                  <Button
                    title="Setujui nota kredit"
                    secondary
                    disabled={c.credit > 0}
                    onPress={() =>
                      open(
                        "Nota kredit manual",
                        [
                          {
                            key: "amount",
                            label: "Jumlah disetujui (Rp)",
                            number: true,
                          },
                        ],
                        async (v) =>
                          change((s) =>
                            D.creditCase(s, c.id, numeric(v.amount)),
                          ),
                        "Keterangan kasus menjadi dasar persetujuan kredit. Catatan yang disimpan tidak dapat diubah.",
                      )
                    }
                  />
                  <Button
                    title="Catat refund yang sudah dibayar"
                    secondary
                    disabled={
                      D.financial(data, o).refundDue === 0 ||
                      c.credit === c.refund
                    }
                    onPress={() =>
                      open(
                        "Refund manual",
                        [
                          {
                            key: "amount",
                            label: "Dana dikembalikan (Rp)",
                            number: true,
                          },
                          {
                            key: "reference",
                            label: "Metode dan referensi pembayaran",
                          },
                        ],
                        async (v) =>
                          change((s) =>
                            D.refundCase(
                              s,
                              c.id,
                              numeric(v.amount),
                              v.reference,
                            ),
                          ),
                        "Aplikasi tidak mengirim uang. Catat setelah dana benar-benar dikembalikan.",
                      )
                    }
                  />
                  <Button
                    title="Tutup kasus"
                    secondary
                    onPress={() =>
                      open(
                        "Penyelesaian kasus",
                        [
                          {
                            key: "resolution",
                            label: "Hasil penyelesaian",
                            multiline: true,
                          },
                        ],
                        async (v) =>
                          change((s) => {
                            const row = s.cases.find((x) => x.id === c.id)!;
                            if (
                              Math.min(
                                row.credit - row.refund,
                                D.financial(
                                  s,
                                  s.orders.find((x) => x.id === row.orderId)!,
                                ).refundDue,
                              ) > 0
                            )
                              throw Error(
                                "Selesaikan hak refund kasus ini sebelum menutup.",
                              );
                            row.resolution = v.resolution;
                            D.audit(s, "Penutupan kasus " + row.id);
                          }),
                      )
                    }
                  />
                </>
              )}
            </Card>
          );
        })}
      </>
    );
  else if (page === "Pengaturan")
    content = (
      <>
        <Text style={S.h1}>Pengaturan</Text>
        <Card>
          <Text style={S.h2}>Cadangan perangkat</Text>
          <Text style={S.body}>
            Cadangan native memuat data pelanggan. Formatnya terpisah dari
            cadangan web v3.x.
          </Text>
          <Button
            title="Ekspor cadangan JSON"
            onPress={() => act(exportBackup)}
          />
          <Button
            title="Pulihkan cadangan native"
            secondary
            onPress={() => act(importBackup)}
          />
          <Text style={S.small}>Revisi lokal {data.revision} · SQLite</Text>
        </Card>
        <Text style={S.h2}>Lokasi depo</Text>
        {data.depots.map((d) => (
          <Card key={d.id}>
            <Text style={S.h2}>{d.name}</Text>
            <Text style={S.body}>
              {d.lat}, {d.lng}
              {"\n"}Radius {d.radius || "tanpa batas"} km ·{" "}
              {d.verified ? "Sudah diverifikasi operator" : "Koordinat contoh"}
            </Text>
            <Button
              title="Atur koordinat & radius"
              secondary
              onPress={() =>
                open(
                  "Pengaturan " + d.name,
                  [
                    {
                      key: "lat",
                      label: "Lintang",
                      value: String(d.lat),
                      number: true,
                    },
                    {
                      key: "lng",
                      label: "Bujur",
                      value: String(d.lng),
                      number: true,
                    },
                    {
                      key: "radius",
                      label: "Radius km (0 = tanpa batas)",
                      value: String(d.radius),
                      number: true,
                    },
                    {
                      key: "verified",
                      label: "Verifikasi operator",
                      value: d.verified ? "ya" : "tidak",
                      options: [
                        { value: "ya", label: "Lokasi nyata sudah diperiksa" },
                        { value: "tidak", label: "Belum diverifikasi" },
                      ],
                    },
                  ],
                  async (v) =>
                    change((s) => {
                      const row = s.depots.find((x) => x.id === d.id)!;
                      row.lat = numeric(v.lat);
                      row.lng = numeric(v.lng);
                      row.radius = numeric(v.radius);
                      row.verified = v.verified === "ya";
                      D.audit(s, "Koordinat depo " + d.name);
                    }),
                )
              }
            />
          </Card>
        ))}
        <Card>
          <Text style={S.h2}>Harga penjualan</Text>
          <Button
            title="Ubah harga per kategori"
            secondary
            onPress={() =>
              open(
                "Harga telur",
                [
                  {
                    key: "category",
                    label: "Kategori pembeli",
                    options: options(D.categories),
                  },
                  { key: "product", label: "Produk", options: pOptions },
                  { key: "kg", label: "Harga per kg (Rp)", number: true },
                  { key: "butir", label: "Harga per butir (Rp)", number: true },
                ],
                async (v) =>
                  change((s) => {
                    s.prices[v.category as D.Category][Number(v.product)] = [
                      numeric(v.kg),
                      numeric(v.butir),
                    ];
                    D.audit(
                      s,
                      "Harga " +
                        v.category +
                        " · " +
                        D.products[Number(v.product)],
                    );
                  }),
                "Harga baru hanya digunakan pada pesanan berikutnya; invoice lama tetap memakai harga tersimpan.",
              )
            }
          />
        </Card>
        <Card>
          <Text style={S.h2}>Data awal & contoh</Text>
          <Button
            title="Muat data contoh"
            secondary
            disabled={
              data.orders.length > 0 ||
              data.lots.length > 0 ||
              data.production.length > 0
            }
            onPress={() =>
              confirm(
                "Muat data contoh?",
                "Mengisi stok simulasi. Koordinat tetap contoh, dan transaksi bukan penjualan nyata.",
                () =>
                  change((s) => {
                    if (s.orders.length || s.lots.length || s.production.length)
                      throw Error("Data contoh hanya untuk perangkat kosong.");
                    const revision = s.revision;
                    Object.assign(s, D.demoState());
                    s.revision = revision;
                  }),
              )
            }
          />
          <Button
            title="Mulai data operasional kosong"
            secondary
            onPress={() =>
              confirm(
                "Ganti seluruh data perangkat?",
                "Semua catatan lokal akan diganti data kosong. Ekspor cadangan sebelum melanjutkan.",
                () =>
                  change((s) => {
                    const revision = s.revision;
                    Object.assign(s, D.baseState());
                    s.revision = revision;
                  }),
              )
            }
          />
        </Card>
        <Card>
          <Text style={S.h2}>Aktivitas operator terakhir</Text>
          {data.audit.slice(0, 10).map((a, i) => (
            <Text key={i} style={S.small}>
              {new Date(a.time).toLocaleString("id-ID")} · {a.text}
            </Text>
          ))}
        </Card>
        <Note>
          Versi 3.5.0 native · Penyimpanan lokal. Login pelanggan/kurir,
          sinkronisasi server, payment gateway, dan notifikasi jarak jauh belum
          dihubungkan.
        </Note>
        <Button
          title="Buka aplikasi web PamanKu"
          secondary
          onPress={() =>
            act(() =>
              Linking.openURL(
                "https://telurfarm-banten.tangwanan.chatgpt.site",
              ),
            )
          }
        />
      </>
    );
  else
    content = (
      <>
        <Text style={S.h1}>Panduan native</Text>
        <Card><Text style={S.h2}>Filter tersimpan v5.0</Text><Text style={S.body}>Pada pesanan terkait batch, simpan filter yang sudah diterapkan dengan nama unik per batch. Maksimum 10 filter pada perangkat. Pakai filter memulihkan cakupan/status/kategori/pencarian/tanggal/depo/urutan/ukuran halaman, mulai halaman pertama dan menghapus riwayat kembali. Data tetap terkini. Hapus hanya menghapus pengaturan filter. Tanggal disimpan tetap; tekan pilihan cepat harian untuk tanggal baru lalu simpan sebagai filter baru. Filter tidak ikut cadangan transaksi atau sinkronisasi web. Muat ulang daftar jika penyimpanan bermasalah; data transaksi tidak diubah.</Text></Card>
        <Card><Text style={S.h2}>Navigasi daftar v5.0</Text><Text style={S.body}>Pada daftar pesanan terkait batch, pilih Baris per halaman (10, 20 atau 50); perubahan ukuran kembali ke halaman pertama. Gunakan Halaman pertama/terakhir atau Ke halaman tertentu. Nomor harus bilangan bulat positif; melebihi batas menuju halaman terakhir. Riwayat Kembali sebelum klik ringkasan memulihkan ukuran dan nomor halaman. Ringkasan/CSV/PDF mencakup seluruh hasil filter. Reset seluruh filter dan membuka telusur ulang kembali ke 20 baris. Ukuran hanya untuk sesi, tidak mengubah transaksi.</Text></Card>
        <Card><Text style={S.h2}>Kembali sebelum klik ringkasan v5.0</Text><Text style={S.body}>Setelah mengetuk kategori/status/depo atau tombol Semua pada ringkasan, tekan Kembali sebelum klik ringkasan. Cakupan, status, pencarian, kategori, tanggal, depo, urutan dan halaman sebelumnya dipulihkan. Hanya klik terakhir tersedia; sesudah kembali riwayat habis. Filter manual, pilihan cepat, reset dan membuka telusur ulang menghapus riwayat. Data tetap terkini, bukan data lama; halaman disesuaikan bila hasil berkurang. Tidak membatalkan transaksi atau mengubah stok/status.</Text></Card>
        <Card><Text style={S.h2}>Ringkasan interaktif v5.0</Text><Text style={S.body}>Di pesanan terkait batch, ketuk kategori, status atau depo pada ringkasan untuk mengganti filter tersebut. Semua kategori/Semua status/Semua depo pesanan hanya mengosongkan filter kelompok itu. Filter lain, cakupan dan urutan tetap, halaman kembali pertama. Ringkasan dihitung ulang dari hasil filter yang sudah berlaku; angka nol bisa dipilih. Nilai yang dipilih ditandai ✓. Tindakan ini hanya menyaring daftar dan laporan, tidak mengubah status/stok atau mengirim pesan. CSV/PDF tetap berupa laporan statis.</Text></Card>
        <Card><Text style={S.h2}>Pilihan cepat harian v5.0</Text><Text style={S.body}>Di pesanan terkait batch, tekan Diproses hari ini, Dalam pengiriman hari ini atau Diproses lewat tanggal. Tanggal mengikuti perangkat saat tombol ditekan. Pilihan cepat mengganti status/rentang, mengosongkan pencarian/kategori, mempertahankan cakupan/depo/urutan dan kembali ke halaman pertama. Lewat tanggal berarti masih Diproses sebelum hari ini; tanggal kosong tidak termasuk. Filter tetap sampai diubah; tekan ulang setelah pergantian hari. Daftar dan semua laporan memakai filter tanggal/status yang diterapkan; tidak mengubah status atau mengirim pengingat.</Text></Card>
        <Card><Text style={S.h2}>Pemeriksaan operasional v5.0</Text><Text style={S.body}>Cari & filter pesanan batch kini memuat depo pesanan, status spesifik (Diproses/Dalam pengiriman/Selesai/Dibatalkan) dan urutan tanggal terlama/terbaru, nama atau nomor. Filter depo mengikuti depo pesanan, bukan lokasi stok batch terkini. Pilihan urutan berlaku juga pada CSV/PDF rincian. Ringkasan depo dan Bagikan ringkasan CSV mencakup semua hasil filter. Reset seluruh filter mengembalikan cakupan keluarga, semua status/depo, tanpa pencarian/tanggal, urutan tanggal terlama dan halaman pertama. Tidak mengubah stok/status atau mengirim pesan.</Text></Card>
        <Card><Text style={S.h2}>Pencarian & halaman v5.0</Text><Text style={S.body}>Pada pesanan terkait batch, pilih Cari & filter pesanan batch. Masukkan sebagian nomor pesanan atau nama pelanggan (maksimal 100 karakter); pencarian mengabaikan kapital dan menyamakan spasi. Kata dicocokkan sebagai teks utuh, bukan perintah atau regex. Terapkan untuk mencari bersama kategori/tanggal/cakupan/status. Daftar menampilkan 20 pesanan per halaman; gunakan Sebelumnya/Berikutnya. Ringkasan, CSV dan PDF mencakup semua halaman hasil filter. Mengubah filter kembali ke halaman pertama; reset pencarian/kategori/tanggal mempertahankan cakupan/status.</Text></Card>
        <Card><Text style={S.h2}>Filter kategori & tanggal v5.0</Text><Text style={S.body}>Pada pesanan terkait batch, pilih Filter kategori & tanggal kirim. Pilih Perorangan, Wholesale, Hotel/Resort atau Semua kategori. Tanggal awal/akhir opsional dan inklusif; rentang aktif mengecualikan pesanan tanpa tanggal valid. Terapkan filter agar daftar, ringkasan, CSV dan PDF konsisten. Reset kategori & tanggal tidak mengubah cakupan batch atau filter status. Filter hanya untuk sesi dan kembali default saat telusur dibuka ulang.</Text></Card>
        <Card><Text style={S.h2}>Laporan PDF pesanan batch v5.0</Text><Text style={S.body}>Di daftar pesanan terkait batch, ringkasan menampilkan jumlah pesanan per kategori pembeli dan status. Bagikan pesanan batch PDF membuat snapshot saat tombol ditekan, mengikuti cakupan dan filter status yang tampil. Simpan melalui menu berbagi perangkat. PDF menyertakan ID batch, waktu UTC, ringkasan dan rincian alokasi cocok. Jumlah bukan volume terkirim; laporan tidak melakukan recall atau mengubah data.</Text></Card>
        <Card><Text style={S.h2}>Pesanan terkait batch v5.0</Text><Text style={S.body}>Kelola → Batch → Telusuri asal & cabang. Pilih cakupan batch ini saja atau seluruh keluarga dan filter semua status atau tanpa dibatalkan. Daftar memperlihatkan jumlah alokasi yang cocok, bukan volume pengiriman atau saldo stok. Buka detail pesanan untuk tindak lanjut, atau Bagikan pesanan batch CSV untuk snapshot saat ekspor. Pesanan tanpa referensi batch tidak dapat ditemukan lewat daftar ini. Membuka daftar tidak mengubah status atau mengirim pesan.</Text></Card>
        <Card><Text style={S.h2}>Telusur asal & cabang v5.0</Text><Text style={S.body}>Buka Kelola → Batch → Telusuri asal & cabang. Periksa rantai akar sampai batch terpilih dan seluruh keluarga lintas depo. Induk, tingkat, kualitas, varian dan saldo bebas saat ini ditampilkan; termasuk batch kosong. Bagikan telusur CSV menyimpan snapshot saat ekspor. Saldo bukan jumlah transfer awal; hubungan batch bukan bukti asal panen. Tutup telusur tidak mengubah stok.</Text></Card>
        <Card><Text style={S.h2}>Transfer kandidat dan laporan v5.0</Text><Text style={S.body}>Buka Kelola → Peringatan stok. Terapkan tanggal, depo, ambang dan rentang. Ekspor stok CSV atau laporan PDF; pilih Semua depo untuk simulasi transfer. Ekspor simulasi CSV menyimpan usulan kg dan kebutuhan yang belum tertutup. Kandidat batch FEFO dan ekspor batch CSV membantu memilih sumber untuk pemeriksaan; tanggal dan butir fisik tetap diperiksa. Pada tanggal acuan hari ini pilih Siapkan transfer kandidat, isi butir serta catatan, lalu konfirmasi. Jika saldo berubah, batalkan dan buat ulang simulasi. Periksa batch dan butir fisik sebelum transfer; laporan bukan cadangan JSON dan tidak mengubah stok.</Text></Card>
        <Card>
          <Text style={S.h2}>Pemesanan ulang & jadwal</Text>
          <Text style={S.body}>
            Buka detail pesanan → Pesan lagi atau Buat jadwal pembelian. Buka
            Aktivitas → Jadwal pembelian untuk menyiapkan pesanan, mengubah
            jadwal/alamat, atau menjeda. Interval 1, 2 dan 4 minggu. Harga dan
            stok diperiksa kembali; jadwal maju hanya setelah pesanan berhasil
            disimpan.
          </Text>
          <Text style={S.small}>
            Jadwal lokal tidak mengirim pesanan atau notifikasi otomatis. Jika
            pesanan dibatalkan, tanggal jadwal tidak dimundurkan otomatis; ubah
            melalui menu jadwal.
          </Text>
        </Card>
        {[
          [
            "1. Siapkan usaha",
            "Atur titik depo nyata dan radius. Tambahkan stok fisik per batch, lalu pastikan varian dan kualitas aktif. Gunakan data contoh hanya untuk mencoba.",
          ],
          [
            "2. Catat produksi",
            "Catat panen kandang, pakan, rusak, dan mortalitas. Hasil telur baik masuk karantina sampai diklasifikasikan.",
          ],
          [
            "3. Buat pesanan",
            "Pilih kategori, kg atau butir, tanggal kirim, dan koordinat alamat tujuan. Depo diurutkan menurut ketersediaan serta jarak garis lurus. Batch dengan batas jual terdekat dialokasikan lebih dahulu.",
          ],
          [
            "4. Timbang dan antar",
            "Periksa jumlah fisik sebelum mulai pengiriman. Nilai invoice tetap mengikuti satuan pembelian. Isi kurir, kemudian catat nama penerima saat serah terima.",
          ],
          [
            "5. Tagihan dan layanan",
            "Catat dana diterima secara manual. Buat keluhan dari detail pesanan, terima retur ke karantina, setujui kredit, dan catat refund setelah dana dikembalikan.",
          ],
          [
            "6. Cadangkan",
            "Ekspor JSON secara rutin. Pulihkan hanya berkas PamanKu Native. Invoice PDF dapat dibagikan melalui menu berbagi ponsel.",
          ],
          [
            "Batas versi ini",
            "Aplikasi memakai komponen native Android/iOS, bukan WebView. Data hanya lokal pada perangkat. Tidak ada login multiuser, sinkronisasi dengan web, transfer bank otomatis, GPS kurir di latar belakang, atau akun pelanggan terpisah. Uji perangkat dan UAT operasional sebelum pemakaian nyata.",
          ],
        ].map(([title, body]) => (
          <Card key={title}>
            <Text style={S.h2}>{title}</Text>
            <Text style={S.body}>{body}</Text>
          </Card>
        ))}
      </>
    );
  return (
    <SafeAreaView style={S.root} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <View style={S.header}>
        <View style={S.between}>
          <Text style={S.brand}>
            PamanKu<Text style={{ fontSize: 12 }}> ●</Text>
          </Text>
          <Badge text={data.demo ? "DATA CONTOH" : "6.0 · LOKAL PRIBADI"} />
        </View>
        {busy && (
          <Text accessibilityLiveRegion="polite" style={S.small}>
            Menyimpan perubahan…
          </Text>
        )}
      </View>
      <ScrollView
        key={orderId || page}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={S.content}
      >
        {!order &&
          !["Beranda", "Pesan", "Aktivitas", "Kelola"].includes(page) && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setPage("Kelola")}
            >
              <Text style={S.link}>← Kelola peternakan</Text>
            </Pressable>
          )}
        {page === "Kelola" && !order && <Card>
          <Text style={S.h2}>Ruang kerja tim dan akses v6.0</Text>
          <Text style={S.body}>Masuk melalui portal online untuk bekerja sesuai peran. Data tim disimpan di server dan terpisah dari salinan SQLite perangkat ini. Mode lokal belum memiliki login atau RBAC multiuser.</Text>
          <Button title="Buka portal tim online" onPress={() => act(() => Linking.openURL("https://telurfarm-banten.tangwanan.chatgpt.site/team.html").then(() => undefined))} />
        </Card>}
        {content}
      </ScrollView>
      <View style={S.nav}>
        {(["Beranda", "Pesan", "Aktivitas", "Kelola"] as const).map((p, i) => (
          <Pressable
            key={p}
            accessibilityRole="tab"
            accessibilityState={{ selected: page === p && !orderId }}
            onPress={() => {
              setOrderId(null);
              setPage(p);
            }}
            style={S.navItem}
          >
            <Text
              style={{ fontSize: 20, color: page === p ? C.brown : C.muted }}
            >
              {["⌂", "◉", "≡", "▦"][i]}
            </Text>
            <Text style={[S.navText, page === p && S.navActive]}>
              {p}
              {p === "Pesan" && cart.length ? " (" + cart.length + ")" : ""}
            </Text>
          </Pressable>
        ))}
      </View>
      <FormModal form={form} close={() => setForm(null)} />
    </SafeAreaView>
  );
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <SafeAreaView
        style={[S.root, { padding: 24, justifyContent: "center", gap: 20 }]}
      >
        <Text style={S.h1}>Aplikasi perlu dimuat ulang</Text>
        <Text style={S.body}>Data tersimpan tetap dipertahankan.</Text>
        <Text style={S.small}>{this.state.error}</Text>
        <Button
          title="Coba lagi"
          onPress={() => this.setState({ error: "" })}
        />
      </SafeAreaView>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Main />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
