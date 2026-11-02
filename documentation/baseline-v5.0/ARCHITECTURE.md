# Diagram teknis TelurFarm 5.0

Diagram relasi berikut bersifat logis di payload JSON, bukan tabel SQL terpisah.

```mermaid
erDiagram
  DEPOT ||--o{ LOT : menyimpan
  LOT o|--o{ LOT : induk
  ORDER ||--o{ ALLOCATION : memiliki
  LOT ||--o{ ALLOCATION : dirujuk
  ORDER ||--o{ PAYMENT : dibayar
  ORDER ||--o{ CASE : ditinjau
```

```mermaid
flowchart TD
  W[Browser web] --> G[Gateway identitas Sites]
  G --> A[Worker assets dan API state]
  A --> D[D1 snapshot per user]
  N[React Native Android dan iOS] --> L[SQLite lokal]
```

Tidak ada koneksi sinkron native ke Worker pada rilis ini. Browser juga memakai penyimpanan lokal; preferensi filter berada di localStorage. SQLite native memakai app_state dan app_preferences secara terpisah.
