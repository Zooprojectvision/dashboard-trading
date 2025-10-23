# Project: zooprojectvision-gloss

Below is a complete, copy‑paste project (Next.js + TypeScript) implementing your gloss theme, KPIs, weekday PnL table, calendar with trade counts and soft color rules, alerts (including hour-zones only after 6 months), and mirroring tone for Real Capital.

---

## package.json
```json
{
  "name": "zooprojectvision-gloss",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint"
  },
  "dependencies": {
    "chart.js": "4.4.4",
    "next": "14.2.5",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@types/node": "20.14.9",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.4.5"
  }
}
```

---

## next.config.js
```js
/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };
module.exports = nextConfig;
```

---

## tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@components/*": ["components/*"],
      "@lib/*": ["lib/*"],
      "@i18n/*": ["i18n/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## pages/_app.tsx
```tsx
import type { AppProps } from "next/app";
import "../styles/gloss-theme.css";
import { LangProvider } from "../i18n/LangContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LangProvider>
      <Component {...pageProps} />
    </LangProvider>
  );
}
```

---

## styles/gloss-theme.css
```css
/* ===== Palette Gloss ===== */
:root{
  --gloss-rose:#ff4da6;          /* rose gloss (négatifs + DD texte) */
  --gloss-rose-soft:#ffd6eb;     /* fond rose pâle */
  --gloss-green:#16c784;         /* vert gloss (positifs) */
  --gloss-green-soft:#d9f5e9;    /* fond vert clair */
  --gloss-orange-soft:#ffe8cc;   /* fond orange clair (DD medium) */
  --gloss-red-soft:#ffe0e0;      /* fond rouge très clair */
  --text-light:#9aa3ab;          /* gris clair pour textes & dates */
  --bg:#0e0f12;                  /* fond */
  --card:#12141a;                /* carte */
  --border-soft:#24262b;
  --white:#ffffff;
}

/* ===== Reset + Layout ===== */
html, body, #__next { height: 100%; }
body {
  margin:0;
  background: var(--bg);
  color: var(--text-light);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 64px;
}

/* ===== Cartes / Cellules ===== */
.cell {
  background: var(--card);
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 10px 12px;
}

.value { font-weight: 600; font-size: 18px; }
.label { font-size: 12px; opacity: 0.9; }

/* ===== Couleurs texte ===== */
.pos { color: var(--gloss-green); }
.neg { color: var(--gloss-rose); }
.dd-rose { color: var(--gloss-rose); } /* DD sans signe */
.value-muted { color: var(--text-light); }

/* ===== Fonds état ===== */
.bg-red-soft    { background: var(--gloss-red-soft) !important; }
.bg-rose-soft   { background: var(--gloss-rose-soft) !important; }
.bg-green-soft  { background: var(--gloss-green-soft) !important; }
.bg-orange-soft { background: var(--gloss-orange-soft) !important; }

/* ===== Grids ===== */
.grid {
  display: grid;
  gap: 12px;
}
.grid-2 { grid-template-columns: repeat(2, minmax(0,1fr)); }
.grid-3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
.grid-4 { grid-template-columns: repeat(4, minmax(0,1fr)); }
.grid-6 { grid-template-columns: repeat(6, minmax(0,1fr)); }

/* ===== Header ===== */
.header {
  display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px;
}
.title { font-size: 22px; font-weight: 700; color: var(--white); }

/* ===== Buttons / Inputs ===== */
.btn {
  background: #1b1e25; border:1px solid var(--border-soft);
  color: var(--white); padding: 8px 10px; border-radius: 8px; cursor:pointer;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.input, .select {
  background: #0f1116; color: var(--white); border:1px solid var(--border-soft);
  border-radius: 8px; padding: 8px 10px; width:100%;
}
.row { display:flex; gap:10px; }

/* ===== Alerts ===== */
.alert {
  border-radius: 10px; padding: 10px 12px; border:1px solid var(--border-soft);
  background:#151820;
}
.alert-title { color: var(--white); font-weight:700; margin-bottom:6px; }
.alert-danger { background: #2a1214; }
.alert-warn   { background: #2a2012; }
.alert-good   { background: #0f2219; }
```

---

## i18n/LangContext.tsx
```tsx
import React from "react";
import { dict } from "./dict";

export type Lang = "fr"|"es"|"en";
type Ctx = { lang: Lang; setLang: (l:Lang)=>void; t: (key:string)=>string; };

const LangCtx = React.createContext<Ctx>({ lang:"fr", setLang:()=>{}, t:(k)=>k });

export function LangProvider({children}:{children:React.ReactNode}){
  const [lang, setLang] = React.useState<Lang>("fr");
  const t = React.useCallback((key:string) => {
    const entry = dict[key as keyof typeof dict];
    if (!entry) return key;
    return (entry as any)[lang] ?? (entry as any)["fr"] ?? key;
  }, [lang]);
  return <LangCtx.Provider value={{lang, setLang, t}}>{children}</LangCtx.Provider>;
}

export function useLang(){ return React.useContext(LangCtx); }
```

---

## i18n/dict.ts
```ts
export const dict = {
  dashboard_title:{ fr:"Zooprojectvision — Dashboard Gloss", es:"Zooprojectvision — Panel Gloss", en:"Zooprojectvision — Gloss Dashboard" },
  kpis:{ fr:"Indicateurs clés", es:"Indicadores clave", en:"Key KPIs" },
  profitability:{ fr:"Rentabilité", es:"Rentabilidad", en:"Profitability" },
  durations:{ fr:"Durées moyennes", es:"Duraciones medias", en:"Average Durations" },
  chart:{ fr:"Évolution du capital", es:"Evolución del capital", en:"Equity Curve" },
  pnl:{ fr:"PnL", es:"PnL", en:"PnL" },
  global_capital:{ fr:"Capital Global", es:"Capital Global", en:"Global Capital" },
  real_capital:{ fr:"Capital Réel", es:"Capital Real", en:"Real Capital" },
  initial_capital:{ fr:"Capital Initial", es:"Capital Inicial", en:"Initial Capital" },
  cashflow:{ fr:"Cash Flow", es:"Flujo de Caja", en:"Cash Flow" },
  return:{ fr:"Rentabilité", es:"Rentabilidad", en:"Return" },
  dd:{ fr:"Drawdown", es:"Drawdown", en:"Drawdown" },
  sharpe:{ fr:"Sharpe (ou ratio)", es:"Sharpe (o ratio)", en:"Sharpe (or ratio)" },
  winrate:{ fr:"Win Rate", es:"Win Rate", en:"Win Rate" },
  rr:{ fr:"R/R", es:"R/R", en:"R/R" },
  avg_gain:{ fr:"Gain moyen", es:"Ganancia media", en:"Avg Gain" },
  avg_loss:{ fr:"Perte moyenne", es:"Pérdida media", en:"Avg Loss" },
  expectancy:{ fr:"Expectancy", es:"Expectancy", en:"Expectancy" },
  dur_gain:{ fr:"Durée moyenne (gains)", es:"Duración media (ganancias)", en:"Avg Duration (wins)" },
  dur_loss:{ fr:"Durée moyenne (pertes)", es:"Duración media (pérdidas)", en:"Avg Duration (losses)" },
  alerts:{ fr:"Alertes", es:"Alertas", en:"Alerts" },

  weekday_table:{ fr:"Gains/Perte par jour", es:"Ganancias/Pérdidas por día", en:"PnL by Weekday" },
  monday:{ fr:"Lundi", es:"Lunes", en:"Monday" },
  tuesday:{ fr:"Mardi", es:"Martes", en:"Tuesday" },
  wednesday:{ fr:"Mercredi", es:"Miércoles", en:"Wednesday" },
  thursday:{ fr:"Jeudi", es:"Jueves", en:"Thursday" },
  friday:{ fr:"Vendredi", es:"Viernes", en:"Friday" },
  saturday:{ fr:"Samedi", es:"Sábado", en:"Saturday" },
  sunday:{ fr:"Dimanche", es:"Domingo", en:"Sunday" },

  calendar:{ fr:"Calendrier des trades", es:"Calendario de trades", en:"Trades Calendar" },
  trades:{ fr:"trades", es:"trades", en:"trades" },
  month_summary:{ fr:"Résumé Mensuel & Annuel", es:"Resumen Mensual y Anual", en:"Monthly & Annual Summary" },
  mtd:{ fr:"MTD", es:"MTD", en:"MTD" },
  ytd:{ fr:"YTD", es:"YTD", en:"YTD" }
} as const;
```

---

## lib/metrics-format.ts
```ts
export type CellTone = "NONE"|"GREEN_SOFT"|"RED_SOFT"|"ORANGE_SOFT"|"ROSE_SOFT";

export function fmtPct(v:number, digits=2){
  if (!Number.isFinite(v)) return "—";
  return `${v.toFixed(digits)}%`;
}
export function fmtMoney(v:number, ccy="USD", digits=2){
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("en-US",{style:"currency",currency:ccy,maximumFractionDigits:digits}).format(v);
}
export function fmtDurationMinutes(totalMin:number){
  if (!Number.isFinite(totalMin)) return "—";
  const sign = totalMin<0 ? -1 : 1;
  let m = Math.abs(Math.floor(totalMin));
  const days = Math.floor(m/1440); m%=1440;
  const hours= Math.floor(m/60);   m%=60;
  const mins = m;
  const parts = [] as string[];
  if (days>0) parts.push(`${days}j`);
  if (hours>0 || days>0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  const res = parts.join(" ");
  return sign<0 ? `-${res}` : res;
}

export function textColorClass(value:number, opts?:{isDD?:boolean}){
  if (opts?.isDD) return "dd-rose";
  if (value<0) return "neg";
  if (value>0) return "pos";
  return "";
}

export function cellTone(opts:{
  pnl?:number;
  rent?:number;
  globalCapital?:number;
  initialCapital?:number;
  cashFlow?:number;
  ddPct?:number;              // 0..100
  sharpeLike?:number;
  expectancy?:number;
  winRate?:number;            // 0..1
  rr?:number;                 // >0
}):{tone:CellTone, wrRrProfitable:boolean}{
  let tone:CellTone="NONE";

  if (opts.pnl!==undefined && opts.pnl<0) tone="RED_SOFT";

  if (
    opts.globalCapital!==undefined &&
    opts.initialCapital!==undefined &&
    opts.cashFlow!==undefined
  ){
    const threshold = opts.initialCapital - opts.cashFlow;
    if (opts.globalCapital < threshold) tone="RED_SOFT";
  }

  if (opts.rent!==undefined){
    if (opts.rent<0) tone="RED_SOFT";
    if (opts.rent>0) tone="GREEN_SOFT";
  }

  if (opts.ddPct!==undefined){
    if (opts.ddPct<=10) tone="GREEN_SOFT";
    else if (opts.ddPct<=20) tone="ORANGE_SOFT";
    else tone="RED_SOFT";
  }

  if (opts.sharpeLike!==undefined){
    tone = opts.sharpeLike<0 ? "RED_SOFT" : "GREEN_SOFT";
  }

  if (opts.expectancy!==undefined){
    tone = opts.expectancy<0 ? "RED_SOFT" : "GREEN_SOFT";
  }

  let wrRrProfitable = true;
  if (opts.winRate!==undefined && opts.rr!==undefined){
    const p = opts.winRate;
    const rr = Math.max(0, opts.rr);
    wrRrProfitable = (p*rr - (1-p)) > 0;
    tone = wrRrProfitable ? "GREEN_SOFT" : "RED_SOFT";
  }

  return { tone, wrRrProfitable };
}

export function toneToClass(tone:CellTone){
  switch(tone){
    case "GREEN_SOFT": return "bg-green-soft";
    case "RED_SOFT":   return "bg-red-soft";
    case "ORANGE_SOFT":return "bg-orange-soft";
    case "ROSE_SOFT":  return "bg-rose-soft";
    default: return "";
  }
}

/** Calcule la classe de fond rouge/vert pour un simple signe de PnL */
export function signToneClass(v:number){
  if (!Number.isFinite(v) || v===0) return "";
  return v>0 ? "bg-green-soft" : "bg-red-soft";
}
```

---

## lib/trades.ts
```ts
export type Trade = {
  id: string;
  time: Date;       // date/heure de clôture
  pnl: number;      // PnL en devise de reporting
};

function rand(seed:number){ // PRNG simple
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Génère un historique > 6 mois pour la démo (210 jours). */
export function generateSampleTrades(startDaysAgo=210, nPerDayAvg=2): Trade[] {
  const trades: Trade[] = [];
  const start = new Date();
  start.setDate(start.getDate() - startDaysAgo);
  let seed = 42;

  for (let d=0; d<=startDaysAgo; d++){
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const n = Math.max(0, Math.round(nPerDayAvg + (rand(seed+=1)-0.5)*3));
    for (let i=0;i<n;i++){
      const t = new Date(day);
      t.setHours(8 + Math.floor(rand(seed+=1)*10), Math.floor(rand(seed+=1)*60), 0, 0);
      const pnl = (rand(seed+=1)-0.48) * 120; // légèrement biaisé positif
      trades.push({ id:`T${d}-${i}`, time: t, pnl: Math.round(pnl*100)/100 });
    }
  }
  return trades;
}

export function dayKey(dt:Date){ return dt.toISOString().slice(0,10); }
export function monthKey(dt:Date){ return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`; }
export function yearKey(dt:Date){ return `${dt.getFullYear()}`; }

export function byDay(trades:Trade[]){
  const map = new Map<string,{pnl:number; count:number; date:Date}>();
  for (const tr of trades){
    const k = dayKey(tr.time);
    const prev = map.get(k) ?? {pnl:0, count:0, date:new Date(tr.time)};
    prev.pnl += tr.pnl; prev.count += 1;
    map.set(k, prev);
  }
  return map;
}

export function byMonth(trades:Trade[]){
  const map = new Map<string,{pnl:number; count:number}>();
  for (const tr of trades){
    const k = monthKey(tr.time);
    const prev = map.get(k) ?? {pnl:0, count:0};
    prev.pnl += tr.pnl; prev.count += 1;
    map.set(k, prev);
  }
  return map;
}

export function byYear(trades:Trade[]){
  const map = new Map<string,{pnl:number; count:number}>();
  for (const tr of trades){
    const k = yearKey(tr.time);
    const prev = map.get(k) ?? {pnl:0, count:0};
    prev.pnl += tr.pnl; prev.count += 1;
    map.set(k, prev);
  }
  return map;
}

export function byWeekday(trades:Trade[]){
  // 0=Dim ... 6=Sam
  const arr = Array.from({length:7}, ()=>({pnl:0, count:0}));
  for (const tr of trades){
    const wd = tr.time.getDay();
    arr[wd].pnl += tr.pnl;
    arr[wd].count += 1;
  }
  return arr; // index 0..6
}

export function historySpanDays(trades:Trade[]){
  if (trades.length===0) return 0;
  const min = trades.reduce((a,b)=> a.time < b.time ? a : b).time;
  const max = trades.reduce((a,b)=> a.time > b.time ? a : b).time;
  const ms = max.getTime() - min.getTime();
  return Math.max(0, Math.round(ms / (1000*60*60*24)));
}

export function byHour(trades:Trade[]){
  const hours = Array.from({length:24}, ()=>({pnl:0, count:0}));
  for (const tr of trades){
    const h = tr.time.getHours();
    hours[h].pnl += tr.pnl;
    hours[h].count += 1;
  }
  return hours;
}
```

---

## components/LangSwitcher.tsx
```tsx
import React from "react";
import { useLang, Lang } from "@i18n/LangContext";
import { dict } from "@i18n/dict";

export default function LangSwitcher(){
  const { lang, setLang } = useLang();
  return (
    <div className="row">
      <label className="label" style={{alignSelf:"center"}}>{dict.language?.[lang] ?? "Langue"}</label>
      <select
        className="select"
        value={lang}
        onChange={(e)=>setLang(e.target.value as Lang)}
      >
        <option value="fr">Français</option>
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}
```

---

## components/MetricCell.tsx
```tsx
import React from "react";
import { textColorClass, cellTone, toneToClass, CellTone } from "@lib/metrics-format";

type Props = {
  label: string;
  value: number;
  unit?: "money"|"pct"|"raw";
  ccy?: string;
  options?: {
    isDD?: boolean;
    pnl?: number;
    rent?: number;
    globalCapital?: number;
    initialCapital?: number;
    cashFlow?: number;
    ddPct?: number;
    sharpeLike?: number;
    expectancy?: number;
    winRate?: number;
    rr?: number;
  };
  format?: (v:number)=>string;
  linkIdsIfUnprofitable?: string[];
  id?: string;
  forceTone?: CellTone;  // NEW: force la tonalité
};

export default function MetricCell({
  label, value, unit="raw", ccy="USD", options={}, format, linkIdsIfUnprofitable=[], id, forceTone
}:Props){
  const v = Number.isFinite(value) ? value : 0;
  const txt = format
    ? format(v)
    : unit==="pct" ? `${v.toFixed(2)}%`
    : unit==="money" ? new Intl.NumberFormat("en-US",{style:"currency",currency:ccy}).format(v)
    : `${v}`;

  const txtClass = textColorClass(v, {isDD: options.isDD});
  const {tone, wrRrProfitable} = cellTone({
    pnl: options.pnl, rent: options.rent, globalCapital: options.globalCapital,
    initialCapital: options.initialCapital, cashFlow: options.cashFlow,
    ddPct: options.ddPct, sharpeLike: options.sharpeLike, expectancy: options.expectancy,
    winRate: options.winRate, rr: options.rr
  });
  const bgClass = toneToClass(forceTone ?? tone);

  React.useEffect(()=>{
    if (forceTone!==undefined) return;
    if (!wrRrProfitable && linkIdsIfUnprofitable.length){
      linkIdsIfUnprofitable.forEach(elId=>{
        const el = document.getElementById(elId);
        if (el) el.classList.add("bg-red-soft");
      });
    }
  },[wrRrProfitable, linkIdsIfUnprofitable, forceTone]);

  return (
    <div id={id} className={`cell ${bgClass}`} style={{display:"flex",flexDirection:"column",gap:4}}>
      <div className="label">{label}</div>
      <div className={`value ${txtClass}`}>{txt}</div>
    </div>
  );
}
```

---

## components/DurationCell.tsx
```tsx
import React from "react";
import { fmtDurationMinutes } from "@lib/metrics-format";

export default function DurationCell({label, minutes}:{label:string; minutes:number}){
  return (
    <div className="cell">
      <div className="label">{label}</div>
      <div className="value value-muted">{fmtDurationMinutes(minutes)}</div>
    </div>
  );
}
```

---

## components/ProfitabilityBlock.tsx
```tsx
import React from "react";
import MetricCell from "./MetricCell";
import { useLang } from "@i18n/LangContext";
import { dict } from "@i18n/dict";

export default function ProfitabilityBlock({
  winRate, rr, expectancy, avgGain, avgLoss, ccy="USD"
}:{
  winRate:number; rr:number; expectancy:number; avgGain:number; avgLoss:number; ccy?:string;
}){
  const { lang } = useLang();
  return (
    <div className="grid grid-4">
      <MetricCell label={dict.winrate[lang]} value={winRate*100} unit="pct" options={{winRate, rr}} linkIdsIfUnprofitable={["avgGain","avgLoss"]}/>
      <MetricCell label={dict.rr[lang]} value={rr} unit="raw" options={{winRate, rr}} />
      <MetricCell id="avgGain" label={dict.avg_gain[lang]} value={avgGain} unit="money" ccy={ccy} />
      <MetricCell id="avgLoss" label={dict.avg_loss[lang]} value={avgLoss} unit="money" ccy={ccy} />
      <MetricCell label={dict.expectancy[lang]} value={expectancy} unit="money" ccy={ccy} options={{expectancy}} />
    </div>
  );
}
```

---

## components/TopKpis.tsx
```tsx
import React from "react";
import MetricCell from "./MetricCell";
import { useLang } from "@i18n/LangContext";
import { dict } from "@i18n/dict";
import { cellTone } from "@lib/metrics-format";

export default function TopKpis({
  pnl, capitalGlobal, capitalInitial, cashFlow, rentPct, ddPct, sharpe, capitalReal, ccy="USD"
}:{
  pnl:number; capitalGlobal:number; capitalInitial:number; cashFlow:number;
  rentPct:number; ddPct:number; sharpe:number; capitalReal:number; ccy?:string;
}){
  const { lang } = useLang();

  // calcule le ton de Capital Global pour le répliquer sur Capital Réel
  const cgTone = cellTone({
    globalCapital:capitalGlobal, initialCapital:capitalInitial, cashFlow
  }).tone;

  return (
    <div className="grid grid-6">
      <MetricCell label={dict.pnl[lang]} value={pnl} unit="money" ccy={ccy} options={{pnl}} />
      <MetricCell label={dict.global_capital[lang]} value={capitalGlobal} unit="money" ccy={ccy}
        options={{globalCapital:capitalGlobal, initialCapital:capitalInitial, cashFlow}} />
      <MetricCell label={dict.real_capital[lang]} value={capitalReal} unit="money" ccy={ccy}
        forceTone={cgTone} />
      <MetricCell label={dict.initial_capital[lang]} value={capitalInitial} unit="money" ccy={ccy} />
      <MetricCell label={dict.cashflow[lang]} value={cashFlow} unit="money" ccy={ccy} />
      <MetricCell label={dict.return[lang]} value={rentPct} unit="pct" options={{rent:rentPct}} />
      <MetricCell label={dict.dd[lang]} value={Math.abs(ddPct)} unit="pct" options={{ddPct:Math.abs(ddPct), isDD:true}} />
      <MetricCell label={dict.sharpe[lang]} value={sharpe} unit="raw" options={{sharpeLike:sharpe}} />
    </div>
  );
}
```

---

## components/EquityChart.tsx
```tsx
import React, {useRef, useEffect} from "react";
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, BarElement, BarController, Filler, Tooltip, Legend
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, BarElement, BarController, Filler, Tooltip, Legend);

type Point = { label:string; equity:number; dd:number; high:number };

export default function EquityChart({data}:{data:Point[]}){
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart|null>(null);

  useEffect(()=>{
    if (!ref.current) return;
    chartRef.current?.destroy();

    const labels = data.map(d=>d.label);
    const equity = data.map(d=>d.equity);
    const dd     = data.map(d=>d.dd);
    const high   = data.map(d=>d.high);

    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          { // Courbe blanche fine
            type: "line",
            label: "Equity",
            data: equity,
            borderColor: "#ffffff",
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.2
          },
          { // DD par trade
            type: "bar",
            label: "DD par trade",
            data: dd,
            backgroundColor: "rgba(255,77,166,0.25)",
            borderWidth: 0
          },
          { // Plus haut par trade
            type: "line",
            label: "Plus haut par trade",
            data: high,
            borderColor: "rgba(201,209,217,0.7)",
            borderWidth: 1,
            pointRadius: 0,
            borderDash: [2,3],
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins:{ legend:{ labels:{ color:"#9aa3ab" } }, tooltip:{ intersect:false, mode:"index" } },
        scales:{
          x:{ ticks:{ color:"#9aa3ab" }, grid:{ color:"rgba(255,255,255,0.06)" } },
          y:{ ticks:{ color:"#9aa3ab" }, grid:{ color:"rgba(255,255,255,0.06)" } }
        }
      }
    });

    return ()=>{ chartRef.current?.destroy(); };
  },[data]);

  return (
    <div className="cell" style={{height:320}}>
      <div className="label">Évolution du capital</div>
      <canvas ref={ref}/>
    </div>
  );
}
```

---

## components/WeekdayPnLTable.tsx
```tsx
import React from "react";
import { Trade, byWeekday } from "@lib/trades";
import { signToneClass } from "@lib/metrics-format";
import { useLang } from "@i18n/LangContext";
import { dict } from "@i18n/dict";

const labelsKey: (keyof typeof dict)[] = [
  "sunday","monday","tuesday","wednesday","thursday","friday","saturday"
];

export default function WeekdayPnLTable({trades, ccy="USD"}:{trades:Trade[]; ccy?:string;}){
  const { lang } = useLang();
  const agg = byWeekday(trades); // index 0..6

  // réordonner Lundi→Dimanche
  const order = [1,2,3,4,5,6,0];

  return (
    <div className="cell">
      <div className="label" style={{fontWeight:700, marginBottom:8}}>{dict.weekday_table[lang]}</div>
      <div className="grid grid-3">
        {order.map((wd)=> {
          const {pnl, count} = agg[wd];
          const toneClass = signToneClass(pnl);
          return (
            <div key={wd} className={`cell ${toneClass}`}>
              <div className="label">{(dict as any)[labelsKey[wd]][lang]}</div>
              <div className="value">{new Intl.NumberFormat("en-US",{style:"currency", currency: ccy}).format(pnl)}</div>
              <div className="label">{count} {dict.trades[lang]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## components/TradesCalendar.tsx
```tsx
import React from "react";
import { Trade, byDay, dayKey } from "@lib/trades";
import { signToneClass } from "@lib/metrics-format";
import { useLang } from "@i18n/LangContext";
import { dict } from "@i18n/dict";

function startOfMonth(d:Date){ return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d:Date){ return new Date(d.getFullYear(), d.getMonth()+1, 0); }

export default function TradesCalendar({trades, ccy="USD"}:{trades:Trade[]; ccy?:string;}){
  const { lang } = useLang();
  const today = new Date();
  const first = startOfMonth(today);
  const last = endOfMonth(today);
  const firstWeekday = (first.getDay()+6)%7; // 0=Lundi
  const daysInMonth = last.getDate();

  const dayAgg = byDay(trades);
  const cells: ({date:Date; pnl:number; count:number} | null)[] = [];
  for (let i=0;i<firstWeekday;i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++){
    const dt = new Date(today.getFullYear(), today.getMonth(), d);
    const k = dayKey(dt);
    const rec = dayAgg.get(k);
    cells.push({ date: dt, pnl: rec?.pnl ?? 0, count: rec?.count ?? 0 });
  }

  const monthName = today.toLocaleDateString(undefined,{ month:"long", year:"numeric" });

  return (
    <div className="cell">
      <div className="label" style={{fontWeight:700, marginBottom:8}}>{dict.calendar[lang]} — {monthName}</div>
      <div className="grid" style={{gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap:8}}>
        {["Lu","Ma","Me","Je","Ve","Sa","Di"].map((d)=><div key={d} className="label" style={{textAlign:"center"}}>{d}</div>)}
        {cells.map((c, idx)=>{
          if (!c) return <div key={idx} className="cell" style={{opacity:0.4}} />;
          const tone = c.pnl===0 ? "" : signToneClass(c.pnl);
          return (
            <div key={idx} className={`cell ${tone}`} style={{textAlign:"center"}}>
              <div className="label">{c.date.getDate()}</div>
              <div className="value">{c.count}</div>
              <div className="label">{new Intl.NumberFormat("en-US",{style:"currency",currency:ccy, maximumFractionDigits:0}).format(c.pnl)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## components/MonthlyAnnual.tsx
```tsx
import React from "react";
import { Trade, byMonth, byYear, monthKey, yearKey } from "@lib/trades";
import { useLang } from "@i18n/LangContext";
import { dict } from "@i18n/dict";
import { signToneClass } from "@lib/metrics-format";

export default function MonthlyAnnual({trades, ccy="USD"}:{trades:Trade[]; ccy?:string;}){
  const { lang } = useLang();
  const now = new Date();
  const mk = monthKey(now);
  const yk = yearKey(now);

  const m = byMonth(trades).get(mk)?.pnl ?? 0;
  const y = byYear(trades).get(yk)?.pnl ?? 0;

  return (
    <div className="cell">
      <div className="label" style={{fontWeight:700, marginBottom:8}}>{dict.month_summary[lang]}</div>
      <div className="grid grid-2">
        <div className={`cell ${signToneClass(m)}`}>
          <div className="label">{dict.mtd[lang]}</div>
          <div className="value">{new Intl.NumberFormat("en-US",{style:"currency", currency: ccy}).format(m)}</div>
        </div>
        <div className={`cell ${signToneClass(y)}`}>
          <div className="label">{dict.ytd[lang]}</div>
          <div className="value">{new Intl.NumberFormat("en-US",{style:"currency", currency: ccy}).format(y)}</div>
        </div>
      </div>
    </div>
  );
}
```

---

## components/Alerts.tsx
```tsx
import React from "react";
import { Trade, byHour, historySpanDays } from "@lib/trades";

type Alert = { level:"good"|"warn"|"danger"; title:string; msg:string; };

export default function Alerts({items, trades}:{items:Alert[]; trades:Trade[]}){
  const span = historySpanDays(trades);
  const enriched: Alert[] = [...items];

  // “Zones horaires à éviter” UNIQUEMENT si ≥ 6 mois
  if (span >= 180){
    const hours = byHour(trades);
    const bad: number[] = [];
    for (let h=0; h<24; h++){
      const {pnl, count} = hours[h];
      if (count>=10 && pnl < 0) bad.push(h); // seuil min 10 trades
    }
    if (bad.length){
      enriched.push({
        level:"warn",
        title:"Zones horaires à éviter",
        msg:`Heures locales avec expectancy négative: ${bad.map(h=>`${h}h`).join(", ")}.`
      });
    }
  }

  if (!enriched.length) return null;
  return (
    <div className="grid">
      {enriched.map((a, i)=>(
        <div key={i} className={`alert ${a.level==="danger"?"alert-danger":a.level==="warn"?"alert-warn":"alert-good"}`}>
          <div className="alert-title">{a.title}</div>
          <div>{a.msg}</div>
        </div>
      ))}
    </div>
  );
}
```

---

## components/KPIForm.tsx
```tsx
import React from "react";
import { useLang } from "@i18n/LangContext";
import { dict } from "@i18n/dict";

export type KPIState = {
  ccy: string;
  pnl: number;
  capitalGlobal: number;
  capitalReal: number;     // NEW
  capitalInitial: number;
  cashFlow: number;
  rentPct: number;
  ddPct: number;
  sharpe: number;
  winRate: number;
  rr: number;
  expectancy: number;
  avgGain: number;
  avgLoss: number;
  durWinMin: number;
  durLossMin: number;
};

export default function KPIForm({state, setState}:{state:KPIState; setState:(s:KPIState)=>void}){
  const { lang } = useLang();

  function num(name:keyof KPIState, step="0.01"){
    return (
      <input
        className="input"
        type="number"
        step={step}
        value={Number(state[name])}
        onChange={(e)=>setState({...state, [name]: Number(e.target.value)})}
      />
    );
  }

  return (
    <div className="cell">
      <div className="row" style={{justifyContent:"space-between", marginBottom:10}}>
        <div className="label" style={{fontWeight:700}}>{dict.form_title?.[lang] ?? "Formulaire KPI"}</div>
        <div style={{width:140}}>
          <select className="select" value={state.ccy} onChange={(e)=>setState({...state, ccy:e.target.value})}>
            <option>USD</option><option>EUR</option><option>CHF</option><option>GBP</option>
          </select>
        </div>
      </div>

      <div className="grid grid-3">
        <div><div className="label">{dict.pnl[lang]}</div>{num("pnl")}</div>
        <div><div className="label">{dict.global_capital[lang]}</div>{num("capitalGlobal")}</div>
        <div><div className="label">{dict.real_capital[lang]}</div>{num("capitalReal")}</div>
        <div><div className="label">{dict.initial_capital[lang]}</div>{num("capitalInitial")}</div>
        <div><div className="label">{dict.cashflow[lang]}</div>{num("cashFlow")}</div>
        <div><div className="label">{dict.return[lang]} (%)</div>{num("rentPct")}</div>
        <div><div className="label">{dict.dd[lang]} (%)</div>{num("ddPct")}</div>
        <div><div className="label">{dict.sharpe[lang]}</div>{num("sharpe")}</div>
        <div><div className="label">{dict.winrate[lang]} (0..1)</div>{num("winRate","0.001")}</div>
        <div><div className="label">{dict.rr[lang]}</div>{num("rr","0.01")}</div>
        <div><div className="label">{dict.expectancy[lang]}</div>{num("expectancy")}</div>
        <div><div className="label">{dict.avg_gain[lang]}</div>{num("avgGain")}</div>
        <div><div className="label">{dict.avg_loss[lang]}</div>{num("avgLoss")}</div>
        <div><div className="label">{dict.dur_gain[lang]} (min)</div>{num("durWinMin","1")}</div>
        <div><div className="label">{dict.dur_loss[lang]} (min)</div>{num("durLossMin","1")}</div>
      </div>
    </div>
  );
}
```

---

## pages/index.tsx
```tsx
import React from "react";
import TopKpis from "@components/TopKpis";
import ProfitabilityBlock from "@components/ProfitabilityBlock";
import DurationCell from "@components/DurationCell";
import EquityChart from "@components/EquityChart";
import Alerts from "@components/Alerts";
import KPIForm, { KPIState } from "@components/KPIForm";
import LangSwitcher from "@components/LangSwitcher";
import WeekdayPnLTable from "@components/WeekdayPnLTable";
import TradesCalendar from "@components/TradesCalendar";
import MonthlyAnnual from "@components/MonthlyAnnual";
import { useLang } from "@i18n/LangContext";
import { dict } from "@i18n/dict";
import { Trade, generateSampleTrades } from "@lib/trades";

export default function Home(){
  const { lang } = useLang();

  // ===== KPI =====
  const [kpi, setKpi] = React.useState<KPIState>({
    ccy:"USD",
    pnl:-220.50,
    capitalGlobal: 9800,
    capitalReal: 9750,
    capitalInitial: 10000,
    cashFlow: 0,
    rentPct: -2.2,
    ddPct: 12.3,
    sharpe: -0.12,
    winRate: 0.47,
    rr: 1.4,
    expectancy: -12.5,
    avgGain: 95,
    avgLoss: -80,
    durWinMin: 185,
    durLossMin: 92
  });

  // ===== TRADES (exemple) : >6 mois pour montrer les alertes horaires
  const [trades] = React.useState<Trade[]>(()=>generateSampleTrades(210, 2));

  // ===== ALERTES de base (les horaires “à éviter” seront ajoutées dans <Alerts/> si span>=6mois)
  const alerts = React.useMemo(()=>{
    const items: {level:"good"|"warn"|"danger"; title:string; msg:string;}[] = [];
    if (kpi.pnl < 0) items.push({ level:"danger", title:"PnL négatif", msg:"PnL < 0 ⇒ vérifie sizing et qualité des entrées." });
    const threshold = kpi.capitalInitial - kpi.cashFlow;
    if (kpi.capitalGlobal < threshold) items.push({ level:"danger", title:"Alerte Capital", msg:"Capital global sous le seuil (initial − cash flow)." });
    if (kpi.rentPct < 0) items.push({ level:"danger", title:"Rentabilité négative", msg:"MTD/YTD négatif : réduire risque ou pause tactique." });
    if (Math.abs(kpi.ddPct) > 20) items.push({ level:"danger", title:"Drawdown élevé", msg:"DD > 20% : active mode défensif." });
    else if (Math.abs(kpi.ddPct) > 10) items.push({ level:"warn", title:"Drawdown moyen", msg:"DD entre 10–20% : réduis le levier." });
    else items.push({ level:"good", title:"Drawdown OK", msg:"DD ≤ 10% : zone de confort." });
    if (kpi.sharpe < 0) items.push({ level:"danger", title:"Ratio risque négatif", msg:"Sharpe/Sortino < 0 : rendement ajusté insuffisant." });
    const profitable = (kpi.winRate*kpi.rr - (1-kpi.winRate)) > 0;
    if (!profitable) items.push({ level:"danger", title:"WinRate×RR non rentable", msg:"Optimise RR ou filtre les entrées pour augmenter WinRate." });
    if (kpi.expectancy < 0) items.push({ level:"danger", title:"Expectancy négatif", msg:"Valeur attendue < 0 : revois TP/SL & distribution des trades." });
    return items;
  },[kpi]);

  // ===== COURBE: démo simple
  const chartData = React.useMemo(()=> {
    const arr = Array.from({length: 40}, (_,i)=>i);
    let equity = kpi.capitalInitial;
    let peak = equity;
    return arr.map(i=>{
      const step = Math.sin(i*1.37)*40 + Math.cos(i*0.51)*25;
      equity += step;
      peak = Math.max(peak, equity);
      const dd = equity - peak;
      return { label: `T${i+1}`, equity, dd, high: peak };
    });
  },[kpi.capitalInitial]);

  return (
    <div className="container">
      {/* HEADER */}
      <div className="header">
        <div className="title">{dict.dashboard_title[lang]}</div>
        <LangSwitcher />
      </div>

      {/* PARTIE 1: ALERTES (horaires ajoutées automatiquement si historique >= 6 mois) */}
      <h3 className="label" style={{margin:"6px 0"}}>{dict.alerts[lang]}</h3>
      <Alerts items={alerts} trades={trades} />

      {/* PARTIE 2: FORMULAIRE KPI */}
      <div style={{marginTop:12, marginBottom:12}}>
        <KPIForm state={kpi} setState={setKpi}/>
      </div>

      {/* PARTIE 3: KPIs (inclut Capital Réel miroir) */}
      <h3 className="label" style={{margin:"6px 0"}}>{dict.kpis[lang]}</h3>
      <TopKpis
        pnl={kpi.pnl}
        capitalGlobal={kpi.capitalGlobal}
        capitalReal={kpi.capitalReal}
        capitalInitial={kpi.capitalInitial}
        cashFlow={kpi.cashFlow}
        rentPct={kpi.rentPct}
        ddPct={Math.abs(kpi.ddPct)}
        sharpe={kpi.sharpe}
        ccy={kpi.ccy}
      />

      {/* PARTIE 4: RENTABILITÉ */}
      <h3 className="label" style={{margin:"12px 0"}}>{dict.profitability[lang]}</h3>
      <ProfitabilityBlock
        winRate={kpi.winRate}
        rr={kpi.rr}
        expectancy={kpi.expectancy}
        avgGain={kpi.avgGain}
        avgLoss={kpi.avgLoss}
        ccy={kpi.ccy}
      />

      {/* PARTIE 5: DURÉES */}
      <h3 className="label" style={{margin:"12px 0"}}>{dict.durations[lang]}</h3>
      <div className="grid grid-2" style={{marginBottom:12}}>
        <DurationCell label={dict.dur_gain[lang]} minutes={kpi.durWinMin}/>
        <DurationCell label={dict.dur_loss[lang]} minutes={kpi.durLossMin}/>
      </div>

      {/* COURBE */}
      <h3 className="label" style={{margin:"12px 0"}}>{dict.chart[lang]}</h3>
      <EquityChart data={chartData} />

      {/* NOUVEAUX BLOCS */}
      <div style={{height:12}} />
      <WeekdayPnLTable trades={trades} ccy={kpi.ccy} />

      <div style={{height:12}} />
      <MonthlyAnnual trades={trades} ccy={kpi.ccy} />

      <div style={{height:12}} />
      <TradesCalendar trades={trades} ccy={kpi.ccy} />
    </div>
  );
}
```

---

**How to run**
1) `npm i`
2) `npm run dev`
3) Open http://localhost:3000

Replace the sample trades generator with your real trades array `{ id, time: Date, pnl }` when ready.
