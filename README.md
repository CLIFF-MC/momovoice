# MTN MoMo Accessible Voice Financial Assistant

A production-grade, accessible mobile voice assistant designed for blind, low-vision, and non-literate users across Ghana. Built to interface with the MTN Mobile Money (MoMo) ecosystem via simulated telecom API gateways, this system empowers users to perform essential financial transactions independently using their natural spoken Ghanaian language and on-device biometric security.

---

## 🌟 Key Features

### 1. Authentic Ghanaian Language Voice Processing
The assistant converses naturally in local Ghanaian languages and dialects:
- **Asante Twi** (Ashanti / Eastern Region)
- **Fante / Mfantse** (Central / Western Region)
- **Eʋegbe / Volta Ewe** (Volta Region)
- **Gã** (Greater Accra Region)
- **Dagbanli / Dagbani** (Northern Region)
- **Ghanaian English** (National)

### 2. Zero-PIN Security Architecture
- **Never Spoken Aloud**: Under no circumstance is a user's secret MoMo PIN spoken into a microphone or read back aloud.
- **Biometric Authorization**: All financial debits (Transfers, Airtime, Utility Bills, Cash Out) conclude with an authentic **Android BiometricPrompt** simulation (fingerprint / face unlock / device credential).

### 3. Multi-Service MoMo Capabilities
The voice assistant executes all primary MTN Mobile Money operations:
1. **Send Money (P2P Transfer)**:
   - Recognizes spoken 10-digit Ghanaian phone numbers (e.g. `0244123456`, `054...`, `055...`).
   - Real-time KYC Registered MoMo Name lookup and spoken read-back before authorizing.
   - Automated Tier-based MoMo transfer fee calculation.
2. **Buy Airtime & Data**:
   - Voice commands like *"Buy 10 cedis airtime"*, *"Tɔ airtime cedis du"*, *"Ƒle kadodo cedi ewo"*.
   - Automatically defaults to the user's primary line (`024 489 0123`) or sends to a named contact.
   - 0.00 GHS network fee.
3. **Pay Utility Bills & Merchants**:
   - Voice commands like *"Pay ECG 50 cedis"*, *"Pay Ghana Water"*, *"Tua ECG bill"*, *"Xe ECG fe"*.
   - Instant validation and receipt generation.
4. **Cash Out at Agent Point**:
   - Voice commands like *"Cash out 50 cedis"*, *"Gye sika cedis aduonum"*, *"Ɖe ga le agent gbɔ"*.
   - Resolves authorized MoMo Agent codes with automated fee calculation.
5. **Check Balance**:
   - Voice commands like *"Check my balance"*, *"Hwɛ me sika"*, *"Kpɔ nye ga me"*, *"Kwɛmɔ mishika"*.

### 4. Accessibility & TalkBack Integration
- **TalkBack & Screen Reader Inspector**: A dedicated slide-over drawer (accessible via the floating **Access** button) logs live spoken utterances, priority levels (`assertive` vs `polite`), with audio replay and clipboard copy.
- **Screen Curtain Mode (Blind Test)**: Simulates the TalkBack screen curtain feature, blanking the display so sighted developers and testers can verify that the user experience is 100% complete using only audio cues.
- **High Contrast AAA Mode**: Yellow (`#FFCC00`) on pure black (`#000000`) for high-visibility low-vision accessibility.
- **Text Scaling**: Scalable typography (100%, 125%, 150%).

### 5. Persistent One-Time Settings
- Spoken language preference is saved to `localStorage` (`momo_preferred_language`).
- Clean, uncluttered UI: Settings and preferences are kept in the dedicated **MoMo Settings Modal** (accessed via the Gear icon in the top header) rather than cluttering the main mobile screen.

---

## 🚀 Quick Start Guide (Running Locally)

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Step 1: Clone or Extract the Project
Extract the downloaded zip or clone the repository to your local computer:
```bash
cd momo-accessible-voice
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment (Optional)
The application works immediately out-of-the-box using the browser's built-in Web Speech API and AudioContext.

If you have a Google Gemini API Key and want ultra-realistic server-side neural speech synthesis:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and add your key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```
*(Note: If no API key is provided, the system automatically falls back to client-side speech synthesis with local Ghanaian phonetic smoothing.)*

### Step 4: Start the Development Server
```bash
npm run dev
```

### Step 5: Open in Your Browser
Visit:
```
http://localhost:3000
```
- **Allow Microphone**: When prompted by your browser, grant microphone access so voice commands can be heard.
- **Audio Output**: Ensure your device speaker is turned on to hear spoken confirmations and guidance.

---

## 📱 Voice Command Cheat Sheet

| Action | English | Asante Twi | Eʋegbe (Ewe) | Gã | Dagbani |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Check Balance** | *"Check my balance"* | *"Hwɛ me sika"* | *"Kpɔ nye ga me"* | *"Kwɛmɔ mishika"* | *"Nyama n laɣifu"* |
| **Send Money** | *"Send 20 cedis to Ama"* | *"Mene cedis aduonu kɔma Ama"* | *"Ɖo cedi blaeve na Ama"* | *"Kɛ cedi nyɔŋmai enyɔ maje Ama"* | *"Timi Ama cedi pishi"* |
| **Send to Number**| *"Send 50 cedis to 0244123456"* | *"Mene cedis aduonum kɔma 0244123456"* | *"Ɖo cedi blaatɔ̃ na 0244123456"* | *"Kɛ cedi nyɔŋmai enumɔ maje 0244123456"* | *"Timi 0244123456 cedi pihinu"* |
| **Buy Airtime** | *"Buy 10 cedis airtime"* | *"Tɔ airtime cedis du"* | *"Ƒle kadodo cedi ewo"* | *"Hé airtime cedi nyɔŋma"* | *"Daɣim airtime cedi pia"* |
| **Pay Bill** | *"Pay ECG 50 cedis"* | *"Tua ECG bill cedis aduonum"* | *"Xe ECG fe cedi blaatɔ̃"* | *"Wo ECG nyɛmɔ cedi nyɔŋmai enumɔ"* | *"Yo ECG samli cedi pihinu"* |
| **Cash Out** | *"Cash out 50 cedis"* | *"Gye sika cedis aduonum"* | *"Ɖe ga le agent gbɔ cedi blaatɔ̃"* | *"Tsi shika cedi nyɔŋmai enumɔ"* | *"Yi laɣifu cedi pihinu"* |
| **Confirm Action**| *"Confirm"* / *"Yes"* | *"Aane"* | *"Eẽ"* | *"Hɛɛ"* | *"Iyi"* |
| **Cancel Action** | *"Cancel"* / *"Stop"* | *"Gyae"* | *"Tɔe"* | *"Kpa"* | *"Chɛli"* |
| **Repeat Audio** | *"Repeat that"* | *"Ka bio"* | *"Gblɔe ake"* | *"Kɛɛ ekoŋŋ"* | *"Labi yeli"* |

---

## 🏗️ Architecture & Project Structure

```
├── server.ts                   # Express server mounting Vite in dev, hosting /api/tts endpoint
├── index.html                  # HTML entry with accessibility meta tags & Google Fonts
├── metadata.json               # Applet capabilities & permissions
├── package.json                # Project dependencies and npm scripts
├── vite.config.ts              # Vite configuration with Tailwind CSS plugin
├── src/
│   ├── main.tsx                # React root mount
│   ├── App.tsx                 # Main application layout, accessibility providers
│   ├── types/
│   │   └── momo.ts             # TypeScript definitions for MoMo accounts, drafts, transactions, and events
│   ├── data/
│   │   ├── ghanaianLanguages.ts# Localizations, dialect phrases, spoken numbers in 6 languages
│   │   └── mockData.ts         # Initial MoMo balances, KYC contacts, fee calculation rules
│   ├── services/
│   │   ├── momoService.ts      # MoMo sandbox API engine (Transfer, Airtime, Bill Pay, Cash Out, Idempotency)
│   │   ├── voiceService.ts     # Web Speech API, Gemini TTS integration, micro-audio tones
│   │   └── intentParser.ts     # Natural language parser with Ghanaian phonetics and digit recognition
│   └── components/
│       ├── PhoneSimulator.tsx  # Authentic MTN MoMo mobile application interface
│       └── TalkBackInspector.tsx# Floating Access button & WCAG AAA TalkBack stream drawer
```

---

## 🔒 Security & Compliance
- **Zero-PIN Storage**: MoMo PINs are never requested, stored, or processed in code.
- **Biometric Enclosure**: Debits are gated by client-side biometric or credential confirmation.
- **Idempotency Keys**: Every financial request carries a unique `X-Idempotency-Key` to prevent duplicate billing in case of network retries.
- **WCAG 2.1 AAA Compliant**: Tested for high contrast ratios, non-visual speech flows, and aria-live announcements.

---

## 🛠️ Build for Production
To create a static production build:
```bash
npm run build
```
To run the production server:
```bash
npm start
```
The application will serve the optimized bundle from the `dist/` directory on port `3000`.
