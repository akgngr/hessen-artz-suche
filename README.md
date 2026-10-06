# Hessen Arzt Suche MCP Server

[🇹🇷 Türkçe](#-türkçe) | [🇬🇧 English](#-english)

---

## 🇩🇪 Deutsch

### 📋 Übersicht

Ein **MCP (Model Context Protocol) Server** für die **Hessen Arzt Suche API**, der auf **Cloudflare Workers** und **Vercel** bereitgestellt werden kann. Ermöglicht die Suche nach Ärzten, Fachgebieten und Spezialisierungen in Hessen über MCP-fähige Clients.

---

### ✅ Funktionen

| Tool | Beschreibung | Beispiel |
|------|--------------|----------|
| `suggest_aerzte` | Schnelle Vorschläge für Ärzte oder Fachgebiete | `{"query": "Kardiologe"}` |
| `suche_doktor` | Detaillierte Arzt-Suche (Name, Adresse, Telefon, etc.) | `{"query": "Hausarzt Frankfurt"}` |

---

### 🚀 Schnellstart

#### 1️⃣ Repository klonen
```bash
git clone https://github.com/<BENUTZERNAME>/hessen-artz-suche-mcp.git
cd hessen-artz-suche-mcp
```

#### 2️⃣ Abhängigkeiten installieren
```bash
npm install
```

---

### 🌍 Bereitstellung

#### **Cloudflare Workers (Kostenlos - 100K Anfragen/Tag)**

##### Automatisch mit GitHub Actions
1. Gehe zu **GitHub → Settings → Secrets → Actions**
2. Füge folgende Secrets hinzu:
   - `CLOUDFLARE_API_TOKEN`: [Hier erstellen](https://dash.cloudflare.com/profile/api-tokens) (Berechtigung: "Edit Cloudflare Workers")
   - `CLOUDFLARE_ACCOUNT_ID`: Deine Cloudflare Account-ID (in der URL sichtbar: `https://dash.cloudflare.com/<ACCOUNT_ID>/workers`)
3. Push zu `main` Branch → **Automatische Bereitstellung!**

**🔗 URL:** `https://hessen-artz-suche-mcp.<ACCOUNT_ID>.workers.dev`

##### Manuell
```bash
npm install -g wrangler
wrangler login
npm run deploy:cloudflare
```

---

#### **Vercel (Kostenlos - 100K Anfragen/Monat)**

##### Automatisch mit GitHub Actions
1. Gehe zu **GitHub → Settings → Secrets → Actions**
2. Füge folgende Secrets hinzu:
   - `VERCEL_TOKEN`: [Hier erstellen](https://vercel.com/account/tokens)
   - `VERCEL_PROJECT_ID`: Deine Vercel Projekt-ID
   - `VERCEL_ORG_ID`: Deine Vercel Organisations-ID
3. Push zu `main` Branch → **Automatische Bereitstellung!**

**🔗 URL:** `https://hessen-artz-suche-mcp.vercel.app`

##### Manuell
```bash
npm install -g vercel
vercel login
npm run deploy:vercel
```

---
### 🔌 MCP Client Verbindung

#### **Cursor AI / VS Code MCP Konfiguration**
```json
{
  "mcpServers": {
    "hessen-artz": {
      "url": "https://<DEPLOY_URL>/sse"
    }
  }
}
```

#### **Python Beispiel**
```python
from mcp import Client

client = Client({
    "url": "https://hessen-artz-suche-mcp.<ACCOUNT>.workers.dev/sse"
})

# Tools auflisten
tools = client.list_tools()

# Suche durchführen
result = client.call_tool("suggest_aerzte", {"query": "Kardiologe"})
print(result)
```

---
### 📁 Projektstruktur

```
hessen-artz-suche-mcp/
├── src/
│   └── index.js              # Haupt-MCP-Server-Code (Universal)
├── .github/
│   └── workflows/
│       ├── deploy-cloudflare.yml  # Automatische Cloudflare-Bereitstellung
│       └── deploy-vercel.yml      # Automatische Vercel-Bereitstellung
├── .gitignore                 # Git-Ignore-Regeln
├── .vercelignore              # Vercel-spezifische Ignore-Regeln
├── .cfignore                  # Cloudflare-spezifische Ignore-Regeln
├── package.json               # Abhängigkeiten und Skripte
├── vercel.json                # Vercel-Konfiguration
├── wrangler.toml              # Cloudflare Worker-Konfiguration
└── README.md                  # Dokumentation
```

---
### 💡 Wichtige Hinweise

- **Universal Code**: Derselbe `src/index.js` funktioniert auf beiden Plattformen
- **SSE Transport**: MCP-Protokoll verwendet Server-Sent Events
- **Kostenlos**: Beide Plattformen bieten ausreichend kostenlose Kontingente
- **Region**: Für deutsche Nutzer **Frankfurt (fra1)** empfohlen

---
### 📊 Kontingente

| Plattform | Kostenlos | Anfragen/Tag | Speicher | Timeout |
|-----------|-----------|--------------|----------|---------|
| Cloudflare | ✅ Ja | 100K | 128MB | 10s |
| Vercel | ✅ Ja | 100K/Monat | 300MB | 10s |

---

---
---

## 🇹🇷 Türkçe

### 📋 Genel Bakış

**Hessen Arzt Suche API** için **MCP (Model Context Protocol) Server**. **Cloudflare Workers** ve **Vercel** üzerinde barındırılabilir. MCP uyumlu istemciler aracılığıyla Hessen'deki doktorları, uzmanlık alanlarını ve branşları arayabilirsiniz.

---

### ✅ Özellikler

| Tool Adı | Açıklama | Örnek Kullanım |
|----------|----------|-----------------|
| `suggest_aerzte` | Hızlı doktor/uzmanlık önerisi arar | `{"query": "Kardiologe"}` |
| `suche_doktor` | Detaylı doktor arar (ad, adres, telefon, uzmanlık) | `{"query": "Hausarzt Frankfurt"}` |

---
### 🚀 Hızlı Başlangıç

#### 1️⃣ Repository'i Klonla
```bash
git clone https://github.com/<KULLANICI_ADI>/hessen-artz-suche-mcp.git
cd hessen-artz-suche-mcp
```

#### 2️⃣ Bağımlılıkları Kur
```bash
npm install
```

---
### 🌍 Deploy Seçenekleri

#### **Cloudflare Workers (Ücretsiz - 100K istek/gün)**

##### GitHub Actions ile Otomatik Deploy
1. GitHub → **Settings → Secrets → Actions**
2. Şu secret'leri ekle:
   - `CLOUDFLARE_API_TOKEN`: [Buradan al](https://dash.cloudflare.com/profile/api-tokens) (Edit Cloudflare Workers izni ile)
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare hesabın Account ID (URL'de görülür: `https://dash.cloudflare.com/<ACCOUNT_ID>/workers`)
3. `main` branch'ine push et → **Otomatik deploy!**

**🔗 URL:** `https://hessen-artz-suche-mcp.<ACCOUNT_ID>.workers.dev`

##### Manuel Deploy
```bash
npm install -g wrangler
wrangler login
npm run deploy:cloudflare
```

---
#### **Vercel (Ücretsiz - 100K istek/ay)**

##### GitHub Actions ile Otomatik Deploy
1. GitHub → **Settings → Secrets → Actions**
2. Şu secret'leri ekle:
   - `VERCEL_TOKEN`: [Buradan al](https://vercel.com/account/tokens)
   - `VERCEL_PROJECT_ID`: Vercel projesi ID
   - `VERCEL_ORG_ID`: Vercel organizasyon ID
3. `main` branch'ine push et → **Otomatik deploy!**

**🔗 URL:** `https://hessen-artz-suche-mcp.vercel.app`

##### Manuel Deploy
```bash
npm install -g vercel
vercel login
npm run deploy:vercel
```

---
### 🔌 MCP Client Bağlantısı

#### **Cursor AI / VS Code MCP Yapılandırması**
```json
{
  "mcpServers": {
    "hessen-artz": {
      "url": "https://<DEPLOY_URL>/sse"
    }
  }
}
```

#### **Python Örneği**
```python
from mcp import Client

client = Client({
    "url": "https://hessen-artz-suche-mcp.<ACCOUNT>.workers.dev/sse"
})

# Tool'ları listele
tools = client.list_tools()

# Arama yap
result = client.call_tool("suggest_aerzte", {"query": "Kardiologe"})
print(result)
```

---
### 📁 Proje Yapısı

```
hessen-artz-suche-mcp/
├── src/
│   └── index.js              # Ana MCP Server kodu (Universal)
├── .github/
│   └── workflows/
│       ├── deploy-cloudflare.yml  # Otomatik Cloudflare deploy
│       └── deploy-vercel.yml      # Otomatik Vercel deploy
├── .gitignore                 # Git ignore kuralları
├── .vercelignore              # Vercel ignore kuralları
├── .cfignore                  # Cloudflare ignore kuralları
├── package.json               # Bağımlılıklar ve scriptler
├── vercel.json                # Vercel yapılandırması
├── wrangler.toml              # Cloudflare Worker yapılandırması
└── README.md                  # Dokümantasyon
```

---
### 💡 Önemli Notlar

- **Universal Kod**: Aynı `src/index.js` her iki platformda da çalışır
- **SSE Transport**: MCP protokolü için Server-Sent Events kullanılır
- **Ücretsiz**: Her iki platformda da yeterli ücretsiz kota
- **Bölge**: Almanya için **Frankfurt (fra1)** önerilir

---
### 📊 Kotalar

| Platform | Ücretsiz | Günlük Limit | Bellek | Timeout |
|----------|----------|--------------|---------|---------|
| Cloudflare | ✅ Evet | 100K/gün | 128MB | 10sn |
| Vercel | ✅ Evet | 100K/ay | 300MB | 10sn |

---
---
---

## 🇬🇧 English

### 📋 Overview

An **MCP (Model Context Protocol) Server** for the **Hessen Arzt Suche API**, deployable on **Cloudflare Workers** and **Vercel**. Enables searching for doctors, specializations, and medical fields in Hessen through MCP-compatible clients.

---
### ✅ Features

| Tool | Description | Example |
|------|-------------|---------|
| `suggest_aerzte` | Quick suggestions for doctors or specializations | `{"query": "Kardiologe"}` |
| `suche_doktor` | Detailed doctor search (name, address, phone, etc.) | `{"query": "Hausarzt Frankfurt"}` |

---
### 🚀 Quick Start

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<USERNAME>/hessen-artz-suche-mcp.git
cd hessen-artz-suche-mcp
```

#### 2️⃣ Install Dependencies
```bash
npm install
```

---
### 🌍 Deployment Options

#### **Cloudflare Workers (Free - 100K requests/day)**

##### Automatic Deployment with GitHub Actions
1. Go to **GitHub → Settings → Secrets → Actions**
2. Add the following secrets:
   - `CLOUDFLARE_API_TOKEN`: [Get it here](https://dash.cloudflare.com/profile/api-tokens) (Edit Cloudflare Workers permission)
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (visible in URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/workers`)
3. Push to `main` branch → **Automatic deployment!**

**🔗 URL:** `https://hessen-artz-suche-mcp.<ACCOUNT_ID>.workers.dev`

##### Manual Deployment
```bash
npm install -g wrangler
wrangler login
npm run deploy:cloudflare
```

---
#### **Vercel (Free - 100K requests/month)**

##### Automatic Deployment with GitHub Actions
1. Go to **GitHub → Settings → Secrets → Actions**
2. Add the following secrets:
   - `VERCEL_TOKEN`: [Get it here](https://vercel.com/account/tokens)
   - `VERCEL_PROJECT_ID`: Your Vercel Project ID
   - `VERCEL_ORG_ID`: Your Vercel Organization ID
3. Push to `main` branch → **Automatic deployment!**

**🔗 URL:** `https://hessen-artz-suche-mcp.vercel.app`

##### Manual Deployment
```bash
npm install -g vercel
vercel login
npm run deploy:vercel
```

---
### 🔌 MCP Client Connection

#### **Cursor AI / VS Code MCP Configuration**
```json
{
  "mcpServers": {
    "hessen-artz": {
      "url": "https://<DEPLOY_URL>/sse"
    }
  }
}
```

#### **Python Example**
```python
from mcp import Client

client = Client({
    "url": "https://hessen-artz-suche-mcp.<ACCOUNT>.workers.dev/sse"
})

# List tools
tools = client.list_tools()

# Perform search
result = client.call_tool("suggest_aerzte", {"query": "Kardiologe"})
print(result)
```

---
### 📁 Project Structure

```
hessen-artz-suche-mcp/
├── src/
│   └── index.js              # Main MCP Server code (Universal)
├── .github/
│   └── workflows/
│       ├── deploy-cloudflare.yml  # Automatic Cloudflare deployment
│       └── deploy-vercel.yml      # Automatic Vercel deployment
├── .gitignore                 # Git ignore rules
├── .vercelignore              # Vercel ignore rules
├── .cfignore                  # Cloudflare ignore rules
├── package.json               # Dependencies and scripts
├── vercel.json                # Vercel configuration
├── wrangler.toml              # Cloudflare Worker configuration
└── README.md                  # Documentation
```

---
### 💡 Important Notes

- **Universal Code**: The same `src/index.js` works on both platforms
- **SSE Transport**: MCP protocol uses Server-Sent Events
- **Free Tier**: Both platforms offer sufficient free quotas
- **Region**: For German users, **Frankfurt (fra1)** is recommended

---
### 📊 Quotas Comparison

| Platform | Free | Requests/Day | Memory | Timeout |
|----------|------|--------------|--------|---------|
| Cloudflare | ✅ Yes | 100K/day | 128MB | 10s |
| Vercel | ✅ Yes | 100K/month | 300MB | 10s |

---
---
## 📞 Support

If you encounter any issues or have questions:
- **Cloudflare Workers**: Check logs with `wrangler tail`
- **Vercel**: Check logs with `vercel logs`
- **General**: Open an issue on GitHub

---
## 🎯 Usage Examples

### Doctor Suggestions
```bash
# Via MCP client
call_tool suggest_aerzte --query "Hausarzt"
```

### Detailed Search
```bash
call_tool suche_doktor --query "Kardiologe Berlin"
```

---
**Developed for the Hessen Arzt Suche API**
**Compatible with MCP protocol**
**Works seamlessly on both Cloudflare Workers and Vercel**
```