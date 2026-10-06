# Hessen Arzt Suche MCP Server

[🇩🇪 Deutsch](#-deutsch) | [🇹🇷 Türkçe](#-türkçe) | [🇬🇧 English](#-english)

---

## 🇩🇪 Deutsch

### 📋 Übersicht

Ein universeller **MCP (Model Context Protocol) Server** für die **Hessen Arzt Suche API**, der nativ auf **Vercel (Edge Functions)**, **Cloudflare Workers** und **lokalem Node.js** läuft. Ermöglicht die KI-gestützte Suche nach Ärzten, Praxen, Fachgebieten und Umkreisradien (km) in Hessen über MCP-fähige Clients wie Cursor, Claude, Antigravity und VS Code.

---

### ✅ Funktionen & Tools

| Tool | Beschreibung | Parameter |
|------|--------------|-----------|
| `suggest_plz_ort` | Postleitzahlen & Ortsnamen in Hessen suchen (liefert exakte GPS-Koordinaten `lat`/`lon`) | `{"query": "Groß-Gerau"}` oder `{"query": "64283"}` |
| `suggest_aerzte` | Schnelle Vorschläge für Ärzte, Fachgebiete (FGB), Schwerpunkte (SP) und Zusatzbezeichnungen | `{"query": "Kinderorthopädie"}` |
| `suche_doktor` | Umfassende Arztsuche mit Standortauflösung, Umkreisradius (km), Fachgebiet und Stichwortsuche | `{"location": "64521 Groß-Gerau", "radius": 5, "query": "Orthopädie"}` |

#### 🔍 `suche_doktor` Parameter-Details:
- `location` *(string, optional)*: Stadtname oder PLZ (z. B. `"Darmstadt"`, `"64521 Groß-Gerau"`, `"Frankfurt"`). Koordinaten werden automatisch ermittelt.
- `radius` *(number, optional)*: Suchradius in Kilometern (z. B. `0`, `5`, `10`, `15`, `20`, `25`, `50`). Standard: `5`.
- `query` *(string, optional)*: Arztname oder Fachgebietsstichwort (z. B. `"Kinderorthopädie"`, `"Hausarzt"`, `"Müller"`).
- `professionDoctor` *(array/string, optional)*: Fachgruppencodes (z. B. `["10"]` für Allgemeinmedizin).
- `limit` *(number, optional)*: Maximale Anzahl an Ergebnissen (Standard: `25`).

---

### 🚀 Schnellstart & Lokale Entwicklung

#### 1️⃣ Repository klonen & Abhängigkeiten installieren
```bash
git clone https://github.com/akgngr/hessen-artz-suche.git
cd hessen-artz-suche
npm install
```

#### 2️⃣ Tests ausführen (33 automatisierte Tests)
```bash
npm test
```

#### 3️⃣ Lokalen Server starten
```bash
npm start
# Server läuft unter: http://localhost:3000
# SSE-Endpunkt:      http://localhost:3000/sse
```

---

### 🌍 Bereitstellung (Deployment)

#### **1. Vercel (Edge Functions - Empfohlen)**

- **Automatisch mit GitHub Actions**:
  Füge unter **GitHub → Settings → Secrets → Actions** folgende Secrets hinzu:
  - `VERCEL_TOKEN`: [Hier erstellen](https://vercel.com/account/tokens)
  - `VERCEL_PROJECT_ID`: Deine Vercel Projekt-ID
  - `VERCEL_ORG_ID`: Deine Vercel Organisations-ID
  - Ein Push in den `main`-Branch löst das Deployment automatisch aus.

- **Manuell**:
  ```bash
  npm install -g vercel
  vercel login
  vercel --prod
  ```
  **🔗 Endpunkt-URL:** `https://<DEIN-PROJEKT>.vercel.app/sse`

#### **2. Cloudflare Workers**

- **Automatisch mit GitHub Actions**:
  Secrets: `CLOUDFLARE_API_TOKEN` und `CLOUDFLARE_ACCOUNT_ID`.

- **Manuell**:
  ```bash
  npm run deploy:cloudflare
  ```
  **🔗 Endpunkt-URL:** `https://hessen-artz-suche-mcp.<ACCOUNT_ID>.workers.dev/sse`

---

### 🔌 MCP Client Verbindung

#### **Cursor AI / VS Code MCP Konfiguration (`mcpServers`)**
```json
{
  "mcpServers": {
    "hessen-artz": {
      "url": "https://<DEPLOY_URL>/sse"
    }
  }
}
```

#### **Python MCP Client**
```python
from mcp import Client

client = Client({
    "url": "https://<DEPLOY_URL>/sse"
})

# Umkreissuche: 5km um Groß-Gerau
result = client.call_tool("suche_doktor", {
    "location": "64521 Groß-Gerau",
    "radius": 5,
    "query": "Orthopädie"
})
print(result)
```

---

### 📁 Projektstruktur

```
hessen-artz-suche/
├── api/
│   └── index.js              # Vercel Edge Function Entry Point (runtime: "edge")
├── src/
│   ├── index.js              # Universal Web Standards MCP Server (Fetch API & FormData)
│   └── server.js             # Lokaler Node.js HTTP Server Wrapper (npm start)
├── .github/
│   └── workflows/
│       ├── deploy-cloudflare.yml  # Cloudflare Worker Deployment Action
│       └── deploy-vercel.yml      # Vercel Deployment Action
├── .vercelignore              # Vercel Ignore-Regeln
├── .cfignore                  # Cloudflare Ignore-Regeln
├── package.json               # Skripte und Paketdefinitionen
├── test.js                    # Vollständige Test-Suite (33 Tests)
├── vercel.json                # Vercel Konfiguration (Edge rewrites & installCommand)
├── wrangler.toml              # Cloudflare Worker Konfiguration
└── README.md                  # Dokumentation
```

---

## 🇹🇷 Türkçe

### 📋 Genel Bakış

**Hessen Arzt Suche API** için geliştirilmiş, **Vercel (Edge Functions)**, **Cloudflare Workers** ve **yerel Node.js** ortamlarında çalışan evrensel bir **MCP (Model Context Protocol) Sunucusu**. Hessen eyaletindeki doktorları, klinikleri, uzmanlıkları ve **konum bazlı mesafe yarıçapı (km)** filtrelerini yapay zeka araçları üzerinden kolayca sorgulamanızı sağlar.

---

### ✅ Yetenekler & Araçlar (Tools)

| Tool Adı | Açıklama | Parametreler |
|----------|----------|--------------|
| `suggest_plz_ort` | Posta kodu (PLZ) ve ilçe/şehir araması yaparak tam GPS koordinatlarını (`lat`/`lon`) döner | `{"query": "Groß-Gerau"}` veya `{"query": "64283"}` |
| `suggest_aerzte` | Doktor isimleri, uzmanlık branşları (Fachgebiet) ve ek ihtisaslar (Zusatzbezeichnung) için öneriler | `{"query": "Kinderorthopädie"}` |
| `suche_doktor` | Konum, yarıçap (km), branş ve anahtar kelime destekli detaylı hekim araması | `{"location": "Darmstadt", "radius": 5, "query": "Kinderorthopädie"}` |

#### 🔍 `suche_doktor` Parametreleri:
- `location` *(string, opsiyonel)*: Şehir adı veya posta kodu (örn: `"Darmstadt"`, `"64521 Groß-Gerau"`, `"Frankfurt"`). Koordinatlar otomatik tespit edilir.
- `radius` *(number, opsiyonel)*: Arama yarıçapı km (örn: `0`, `5`, `10`, `15`, `20`, `25`, `50`). Varsayılan: `5`.
- `query` *(string, opsiyonel)*: Doktor adı veya branş filtresi (örn: `"Kinderorthopädie"`, `"Hausarzt"`, `"Müller"`).
- `professionDoctor` *(array/string, opsiyonel)*: Meslek/branş kodu (örn: `["10"]` - Genel Tıp).
- `limit` *(number, opsiyonel)*: Döndürülecek maksimum sonuç sayısı (varsayılan: `25`).

---

### 🚀 Hızlı Başlangıç & Yerel Geliştirme

#### 1️⃣ Projeyi İndirin & Kurun
```bash
git clone https://github.com/akgngr/hessen-artz-suche.git
cd hessen-artz-suche
npm install
```

#### 2️⃣ Testleri Çalıştırın (33 Otomatik Test)
```bash
npm test
```

#### 3️⃣ Yerel Sunucuyu Başlatın
```bash
npm start
# Sunucu adresi: http://localhost:3000
# SSE adresi:    http://localhost:3000/sse
```

---

### 🌍 Canlıya Alma (Deploy)

#### **1. Vercel (Edge Functions - Önerilen)**

- **GitHub Actions ile Otomatik**:
  GitHub deponuzda **Settings → Secrets → Actions** kısmına şu değişkenleri ekleyin:
  - `VERCEL_TOKEN`: [Buradan oluşturun](https://vercel.com/account/tokens)
  - `VERCEL_PROJECT_ID`: Vercel Proje ID
  - `VERCEL_ORG_ID`: Vercel Organizasyon ID
  - `main` dalına push ettiğinizde otomatik deploy edilir.

- **Manuel**:
  ```bash
  npm install -g vercel
  vercel login
  vercel --prod
  ```
  **🔗 URL:** `https://<PROJE-ADINIZ>.vercel.app/sse`

#### **2. Cloudflare Workers**

- **GitHub Actions ile Otomatik**:
  Secrets: `CLOUDFLARE_API_TOKEN` ve `CLOUDFLARE_ACCOUNT_ID`.

- **Manuel**:
  ```bash
  npm run deploy:cloudflare
  ```
  **🔗 URL:** `https://hessen-artz-suche-mcp.<ACCOUNT_ID>.workers.dev/sse`

---

### 🔌 MCP İstemci Yapılandırması

#### **Cursor AI / VS Code MCP (`mcpServers`)**
```json
{
  "mcpServers": {
    "hessen-artz": {
      "url": "https://<DEPLOY_URL>/sse"
    }
  }
}
```

#### **Python MCP İstemcisi**
```python
from mcp import Client

client = Client({
    "url": "https://<DEPLOY_URL>/sse"
})

# Darmstadt ve 5km çevresinde Çocuk Ortopedisi ara
result = client.call_tool("suche_doktor", {
    "location": "Darmstadt",
    "radius": 5,
    "query": "Kinderorthopädie"
})
print(result)
```

---

### 📁 Proje Mimarisi

```
hessen-artz-suche/
├── api/
│   └── index.js              # Vercel Edge Function giriş noktası (runtime: "edge")
├── src/
│   ├── index.js              # Evrensel Web Standardı MCP Sunucusu (Fetch API & FormData)
│   └── server.js             # Yerel Node.js HTTP sunucusu (npm start)
├── .github/
│   └── workflows/
│       ├── deploy-cloudflare.yml  # Cloudflare Worker otomatik deploy
│       └── deploy-vercel.yml      # Vercel otomatik deploy
├── .vercelignore              # Vercel dosya filtreleri
├── .cfignore                  # Cloudflare dosya filtreleri
├── package.json               # Paket ve script tanımları
├── test.js                    # Kapsamlı test paketi (33 test)
├── vercel.json                # Vercel yapılandırması (Edge rewrites & installCommand)
├── wrangler.toml              # Cloudflare Worker yapılandırması
└── README.md                  # Dokümantasyon
```

---

## 🇬🇧 English

### 📋 Overview

A universal **MCP (Model Context Protocol) Server** for the **Hessen Arzt Suche API**, built to run natively on **Vercel (Edge Functions)**, **Cloudflare Workers**, and **local Node.js**. It enables AI clients such as Cursor, Claude, Antigravity, and VS Code to search for doctors, medical practices, specializations, and **location radius searches (km)** in Hessen, Germany.

---

### ✅ Features & Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `suggest_plz_ort` | Search postal codes (PLZ) and cities in Hessen (returns exact GPS `lat`/`lon` coordinates) | `{"query": "Groß-Gerau"}` or `{"query": "64283"}` |
| `suggest_aerzte` | Fast autocomplete suggestions for doctors, medical specialties, and designations | `{"query": "Kinderorthopädie"}` |
| `suche_doktor` | Full doctor search with automatic location resolution, distance radius (km), and specialty filters | `{"location": "Darmstadt", "radius": 5, "query": "Kinderorthopädie"}` |

#### 🔍 `suche_doktor` Parameters:
- `location` *(string, optional)*: City name or postal code (e.g. `"Darmstadt"`, `"64521 Groß-Gerau"`, `"Frankfurt"`). Coordinates are resolved automatically.
- `radius` *(number, optional)*: Search radius in kilometers (e.g. `0`, `5`, `10`, `15`, `20`, `25`, `50`). Default: `5`.
- `query` *(string, optional)*: Doctor name or specialty keyword (e.g. `"Kinderorthopädie"`, `"Hausarzt"`, `"Müller"`).
- `professionDoctor` *(array/string, optional)*: Profession/specialty codes (e.g. `["10"]` for General Medicine).
- `limit` *(number, optional)*: Maximum number of doctor results to return (default: `25`).

---

### 🚀 Quick Start & Local Testing

#### 1️⃣ Clone and Install
```bash
git clone https://github.com/akgngr/hessen-artz-suche.git
cd hessen-artz-suche
npm install
```

#### 2️⃣ Run Test Suite (33 Automated Tests)
```bash
npm test
```

#### 3️⃣ Start Local Server
```bash
npm start
# Server running at: http://localhost:3000
# SSE endpoint:      http://localhost:3000/sse
```

---

### 🌍 Deployment

#### **1. Vercel (Edge Functions - Recommended)**

- **Automatic via GitHub Actions**:
  Add `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID` to **GitHub → Settings → Secrets → Actions**.
  Pushing to `main` branch triggers automatic deployment.

- **Manual**:
  ```bash
  npm install -g vercel
  vercel login
  vercel --prod
  ```
  **🔗 Endpoint URL:** `https://<YOUR-PROJECT>.vercel.app/sse`

#### **2. Cloudflare Workers**

- **Automatic via GitHub Actions**:
  Secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

- **Manual**:
  ```bash
  npm run deploy:cloudflare
  ```
  **🔗 Endpoint URL:** `https://hessen-artz-suche-mcp.<ACCOUNT_ID>.workers.dev/sse`

---

### 🔌 MCP Client Connection

#### **Cursor AI / VS Code Configuration (`mcpServers`)**
```json
{
  "mcpServers": {
    "hessen-artz": {
      "url": "https://<DEPLOY_URL>/sse"
    }
  }
}
```

#### **Python MCP Client**
```python
from mcp import Client

client = Client({
    "url": "https://<DEPLOY_URL>/sse"
})

# Search within 5km of Groß-Gerau
result = client.call_tool("suche_doktor", {
    "location": "64521 Groß-Gerau",
    "radius": 5,
    "query": "Orthopädie"
})
print(result)
```