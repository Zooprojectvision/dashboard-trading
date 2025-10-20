/** =========================
 *   Données démo — Forex & Indices CFD (volatilité + élevée)
 *   ========================= */
const symbolsFXCFD = ['EURUSD','GBPUSD','USDJPY','USDCHF','XAUUSD','DAX40','US30','US500','USTEC','USOIL'];
const brokersCFD  = ['ICMarkets','Pepperstone','Eightcap','InteractiveBrokers','MetaTrader5'];

function randBetween(min, max){ return min + Math.random()*(max-min) }
function pick(a){ return a[Math.floor(Math.random()*a.length)] }

// Équité simulée via rendements composés (volatilité quotidienne +/-3%, spikes +/-6%)
const startEquity = 100000;
const days = 260; // ~1 année de trading
const demoEquity = (() => {
  let e = startEquity;
  const out = [];
  for (let i = days; i >= 1; i--) {
    // rendements quotidiens typés trading CFD/FX
    let r = randBetween(-0.03, 0.03);       // -3% à +3%
    if (Math.random() < 0.05) r = randBetween(-0.06, 0.06); // spikes 5% de proba
    e = Math.max(2000, e * (1 + r));        // protège de l’équité négative
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0,10), equity: Number(e.toFixed(2)), account_ccy: 'USD' });
  }
  return out;
})();

// Trades plus “violents” (PnL en USD) avec dispersion large
const demoTrades = Array.from({ length: 400 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random()*220));
  const side = Math.random()>0.5?'BUY':'SELL';
  const qty  = Math.round(randBetween(1, 5));
  const price= Number(randBetween(10, 250).toFixed(2));
  // PnL ondule fort : moyenne proche de 0, amplitude +/- 3k, parfois +/- 8k
  let pnl = (Math.random()-0.5) * randBetween(1500, 3000);
  if (Math.random() < 0.10) pnl = (Math.random()>0.5?1:-1) * randBetween(3000, 8000);
  pnl = Math.round(pnl*100)/100;

  return {
    trade_id: `T${10000+i}`,
    date: d.toISOString().slice(0,10),
    account: pick(['ACC-Alpha','ACC-Beta','ACC-Gamma']),
    broker: pick(brokersCFD),
    strategy: pick(['Breakout','MeanRevert','Swing','News','Scalp']),
    symbol: pick(symbolsFXCFD),
    instrument_ccy: 'USD',
    side, qty, price,
    fee: Number(randBetween(0.5, 3.0).toFixed(2)),
    pnl,
    notes: ''
  }
})

