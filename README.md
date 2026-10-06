# Hessen Arzt Suche MCP Server

[🇩🇪 Deutsch](#-deutsch) | [🇹🇷 Türkçe](#-türkçe) | [🇬🇧 English](#-english)

---

## 🇩🇪 Deutsch

### 📋 Übersicht

Ein universeller **MCP (Model Context Protocol) Server** für die **Hessen Arzt Suche API**, der nativ auf **Vercel (Edge Functions)**, **Cloudflare Workers** und **lokalem Node.js** läuft. Ermöglicht die KI-gestützte Suche nach Ärzten, Fachgebieten und Spezialisierungen in Hessen über MCP-fähige Clients wie Cursor, Claude, Antigravity und VS Code.

---

### ✅ Funktionen & Tools

| Tool | Beschreibung | Beispiel-Parameter |
|------|--------------|-------------------|
| `suggest_aerzte` | Schnelle Vorschläge für Ärzte, Fachgebiete und Spezialisierungen | `{"query": "Kardiologe"}` |
| `suche_doktor` | Detaillierte Arztsuche mit allen Praxisangaben | `{"query": "Kinderorthopädie Darmstadt"}` |

---

### 🚀 Schnellstart & Lokale Entwicklung

#### 1️⃣ Repository klonen & Abhängigkeiten installieren
```bash
git clone https://github.com/akgngr/hessen-artz-suche.git
cd hessen-artz-suche
npm install
```

#### 2️⃣ Tests ausführen (25 automatisierte Tests)
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

# Tools auflisten
tools = client.list_tools()

# Suche durchführen
result = client.call_tool("suggest_aerzte", {"query": "Kinderorthopädie"})
print(result)
```

---

### 📁 Projektstruktur

```
hessen-artz-suche/
├── api/
│   └── index.js              # Vercel Edge Function Entry Point (runtime: "edge")
├── src/
│   ├── index.js              # Universal Web Standards MCP Server (Fetch API)
│   └── server.js             # Lokaler Node.js HTTP Server Wrapper (npm start)
├── .github/
│   └── workflows/
│       ├── deploy-cloudflare.yml  # Cloudflare Worker Deployment Action
│       └── deploy-vercel.yml      # Vercel Deployment Action
├── .vercelignore              # Vercel Ignore-Regeln
├── .cfignore                  # Cloudflare Ignore-Regeln
├── package.json               # Skripte und Paketdefinitionen
├── test.js                    # Vollständige Test-Suite (25 Tests)
├── vercel.json                # Vercel Konfiguration (Edge rewrites & installCommand)
├── wrangler.toml              # Cloudflare Worker Konfiguration
└── README.md                  # Dokumentation
```

---

### 💡 Technische Highlights

- **Duale Transport-Unterstützung**: Unterstützt sowohl das klassische **SSE-Transport-Protokoll** (`GET /sse` mit `event: endpoint`) als auch das moderne **Streamable HTTP** (`POST /sse` / `POST /mcp` mit direkter JSON-RPC Antwort).
- **Vercel Edge Kompatibel**: 100% Web Standards (`Request`, `Response`, `ReadableStream`) ohne inkompatible Node-Module im Edge-Bundle.
- **Vollständiges CORS**: Sichere und reibungslose Kommunikation mit Web-Agents und Client-Tools.
- **Stabile Verbindungen**: Automatische Keep-Alive Kommentare (`: keep-alive\n\n`) verhindern Verbindungstrennungen durch Proxies.

---

## 🇹🇷 Türkçe

### 📋 Genel Bakış

**Hessen Arzt Suche API** için geliştirilmiş, **Vercel (Edge Functions)**, **Cloudflare Workers** ve **yerel Node.js** ortamlarında sorunsuz çalışan evrensel bir **MCP (Model Context Protocol) Sunucusu**. Cursor AI, Claude, Antigravity ve VS Code gibi yapay zeka araçları üzerinden Hessen eyaletindeki doktorları, klinikleri ve uzmanlık alanlarını sorgulamanızı sağlar.

---

### ✅ Yetenekler & Araçlar (Tools)

| Tool Adı | Açıklama | Örnek Parametre |
|----------|----------|-----------------|
| `suggest_aerzte` | Doktor, uzmanlık ve alt branşlar için hızlı arama / tamamlama | `{"query": "Kardiologe"}` |
| `suche_doktor` | İsim, adres, telefon ve branş içeren detaylı hekim araması | `{"query": "Kinderorthopädie Darmstadt"}` |

---

### 🚀 Hızlı Başlangıç & Yerel Geliştirme

#### 1️⃣ Projeyi İndirin & Kurun
```bash
git clone https://github.com/akgngr/hessen-artz-suche.git
cd hessen-artz-suche
npm install
```

#### 2️⃣ Testleri Çalıştırın (25 Otomatik Test)
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

# Araçları listele
tools = client.list_tools()

# Arama gerçekleştir
result = client.call_tool("suggest_aerzte", {"query": "Kinderorthopädie"})
print(result)
```

---

### 📁 Proje Mimarisi

```
hessen-artz-suche/
├── api/
│   └── index.js              # Vercel Edge Function giriş noktası (runtime: "edge")
├── src/
│   ├── index.js              # Evrensel Web Standardı MCP Sunucusu (Fetch API)
│   └── server.js             # Yerel Node.js HTTP sunucusu (npm start)
├── .github/
│   └── workflows/
│       ├── deploy-cloudflare.yml  # Cloudflare Worker otomatik deploy
│       └── deploy-vercel.yml      # Vercel otomatik deploy
├── .vercelignore              # Vercel dosya filtreleri
├── .cfignore                  # Cloudflare dosya filtreleri
├── package.json               # Paket ve script tanımları
├── test.js                    # Kapsamlı test paketi (25 test)
├── vercel.json                # Vercel yapılandırması (Edge rewrites & installCommand)
├── wrangler.toml              # Cloudflare Worker yapılandırması
└── README.md                  # Dokümantasyon
```

---

### 💡 Teknik Üstünlükler

- **Çift Taşıma Desteği (Dual Transport)**: Hem klasik **SSE Protokolü** (`GET /sse`) hem de modern **Streamable HTTP** (`POST /sse` / `POST /mcp`) desteklenir.
- **Vercel Edge Uyumluluğu**: Saf Web Standardı (`Request`, `Response`, `ReadableStream`) kullanılarak derleme ve çalışma zamanı hataları engellenmiştir.
- **Kesintisiz Akış**: Periyodik keep-alive sinyalleri ile bağlantı düşmeleri önlenir.
- **Tam CORS & Discovery Desteği**: İstemcilerin gönderdiği `OPTIONS` ve `/.well-known/*` istekleri temiz yanıtlanır.

---

## 🇬🇧 English

### 📋 Overview

A universal **MCP (Model Context Protocol) Server** for the **Hessen Arzt Suche API**, built to run natively on **Vercel (Edge Functions)**, **Cloudflare Workers**, and **local Node.js**. It enables AI clients such as Cursor, Claude, Antigravity, and VS Code to search for doctors, medical fields, and healthcare providers in Hessen, Germany.

---

### ✅ Features & Tools

| Tool | Description | Example Query |
|------|-------------|---------------|
| `suggest_aerzte` | Fast autocomplete suggestions for doctors and specialties | `{"query": "Kardiologe"}` |
| `suche_doktor` | Detailed doctor search with full practice and contact information | `{"query": "Kinderorthopädie Darmstadt"}` |

---

### 🚀 Quick Start & Local Testing

#### 1️⃣ Clone and Install
```bash
git clone https://github.com/akgngr/hessen-artz-suche.git
cd hessen-artz-suche
npm install
```

#### 2️⃣ Run Test Suite (25 Automated Tests)
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
  Add the following secrets in **GitHub → Settings → Secrets → Actions**:
  - `VERCEL_TOKEN`: [Create here](https://vercel.com/account/tokens)
  - `VERCEL_PROJECT_ID`: Your Vercel project ID
  - `VERCEL_ORG_ID`: Your Vercel organization ID
  - Pushing to `main` branch will automatically deploy.

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

# List tools
tools = client.list_tools()

# Execute search
result = client.call_tool("suggest_aerzte", {"query": "Kinderorthopädie"})
print(result)
```

---

### 📁 Project Structure

```
hessen-artz-suche/
├── api/
│   └── index.js              # Vercel Edge Function entry point (runtime: "edge")
├── src/
│   ├── index.js              # Universal Web Standards MCP Server (Fetch API)
│   └── server.js             # Local Node.js HTTP server wrapper (npm start)
├── .github/
│   └── workflows/
│       ├── deploy-cloudflare.yml  # Cloudflare deployment action
│       └── deploy-vercel.yml      # Vercel deployment action
├── .vercelignore              # Vercel file exclusion rules
├── .cfignore                  # Cloudflare file exclusion rules
├── package.json               # Package configuration and scripts
├── test.js                    # Automated test suite (25 test cases)
├── vercel.json                # Vercel configuration (Edge rewrites & installCommand)
├── wrangler.toml              # Cloudflare Worker configuration
└── README.md                  # Documentation
```

---

### 💡 Technical Architecture

- **Dual Protocol Support**: Implements both **SSE (2024-11-05)** (`GET /sse` + session stream) and modern **Streamable HTTP** (`POST /sse` / `POST /mcp` with direct JSON-RPC responses).
- **100% Edge Compliant**: Built strictly on Web Standard APIs (`Request`, `Response`, `ReadableStream`) to guarantee instant cold starts and global edge execution.
- **Robust Error & Discovery Handling**: Gracefully handles OAuth and discovery probes (`/.well-known/*`) with standard 404 responses instead of 500 errors.
- **Full CORS Enabled**: Accessible from any web agent, browser, or remote MCP client.