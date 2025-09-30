# XTrustScore 🔐

**XTrustScore** is a free, open-source tool to **scan XRP tokens, wallets, and projects** for risk.  
It gives a simple **Trust Score (Green / Orange / Red)** with transparent evidence — helping the XRP community avoid scams, rug pulls, and risky issuers.

🌐 Live: [xtrustscore.vercel.app](https://xtrustscore.vercel.app)

---

## ✨ Features

- **Trust Score** (0–100%) with color levels 🟢🟠🔴
- **Signals (evidence)**  
  - Domain & xrp-ledger.toml presence  
  - Master key disabled check  
  - Global Freeze / No Freeze flags  
  - Transfer rate (hidden tax) detection  
  - Trustlines count (basic adoption measure)  
- **Alerts** for high-risk findings (freeze, tax, low adoption)  
- **Dark mode toggle** 🌙  
- Modern, mobile-friendly UI built with TailwindCSS & Next.js  
- Free hosting on Vercel 🚀

---

## 🛠️ Tech Stack

- [Next.js 15 (App Router)](https://nextjs.org/)  
- [TypeScript](https://www.typescriptlang.org/)  
- [Tailwind CSS v4](https://tailwindcss.com/)  
- [XRPL.js](https://github.com/XRPLF/xrpl.js)  
- Hosted on [Vercel](https://vercel.com)  

---

## ⚡ Getting Started (local dev)

1. Clone the repo:
   ```bash
   git clone https://github.com/XTrustScore/xtrustscore.git
   cd xtrustscore

2. Install dependencies:

npm install

3. Create a .env.local file:

ini
XRPL_WSS=wss://xrplcluster.com

4. Run the dev server:

npm run dev
Open http://localhost:3000.

🚀 Deployment
Deployed on Vercel: every push to main auto-builds.

To deploy manually:

vercel --prod


⚠️ Disclaimer
XTrustScore provides heuristic indicators only.
It is not financial advice, and cannot guarantee safety.
Always do your own research.
Not affiliated with Ripple or the XRPL Foundation.

📬 Contributing
Pull requests welcome!
Ideas for new signals:

Holder concentration % (top 10 wallets)

Freeze/clawback detection per token

GitHub repo activity

Scam token blacklist integration
