// src/components/control/CalendarMonthly.jsx
import React from "react";

/*
  Props:
  - rows: trades filtrés
  - convert: fn convert(val, fromCcy, toCcy)
  - ccy: devise
  - startEquity: equity de départ (dans la devise actuelle)
*/

export default function CalendarMonthly({
  rows,
  convert,
  ccy,
  startEquity,
}) {
  // agrégation daily
  const dailyMap = React.useMemo(() => {
    const m = new Map();
    rows.forEach((t) => {
      const v = convert(t.pnl, t.ccy || "USD", ccy);
      const o = m.get(t.date) || { pnl: 0, n: 0 };
      o.pnl += v;
      o.n++;
      m.set(t.date, o);
    });
    return m;
  }, [rows, ccy, convert]);

  // mois ciblé = mois du dernier trade filtré, sinon mois courant
  const lastDateStr = rows.length
    ? rows[rows.length - 1].date
    : new Date().toISOString().slice(0, 10);

  const base = new Date(lastDateStr + "T12:00:00Z");
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth(); // 0-11

  // bornes réelles du mois
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const lastOfMonth = new Date(Date.UTC(year, month + 1, 0));

  // caler début de grille sur lundi
  const start = new Date(firstOfMonth);
  const startDow = (start.getUTCDay() + 6) % 7; // lundi=0
  start.setUTCDate(start.getUTCDate() - startDow);

  // caler fin de grille sur dimanche
  const end = new Date(lastOfMonth);
  const endDow = (end.getUTCDay() + 6) % 7;
  end.setUTCDate(end.getUTCDate() + (6 - endDow));

  // construire les jours
  const days = [];
  let eq = startEquity;
  let peak = eq;
  for (
    let d = new Date(start);
    d <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const date = d.toISOString().slice(0, 10);
    const inMonth = d.getUTCMonth() === month;
    const dayData = dailyMap.get(date) || { pnl: 0, n: 0 };

    // calcule équité / DD local seulement pour les jours dans le mois
    const prev = eq;
    if (inMonth) {
      eq += dayData.pnl;
      peak = Math.max(peak, eq);
    }
    const ddAbs = inMonth ? Math.max(0, peak - eq) : null;
    const retPct = inMonth && prev > 0 ? (dayData.pnl / prev) * 100 : null;

    days.push({
      date,
      inMonth,
      pnl: inMonth ? dayData.pnl : null,
      n: inMonth ? dayData.n : 0,
      retPct,
      ddAbs,
    });
  }

  const verdict = (v) => {
    if (v == null) return "halo-neutral";
    if (v >= 0) return "halo-good";
    if (v > -300) return "halo-warn";
    return "halo-bad";
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="card">
      <div className="block-head">
        <div className="block-title cap">Calendrier Mensuel</div>
      </div>

      <div className="month-grid">
        {/* header jours semaine */}
        <div className="month-head">
          {weekDays.map((d) => (
            <div key={d} className="cap">
              {d}
            </div>
          ))}
        </div>

        {/* jours */}
        {days.map((d) => (
          <div key={d.date} className={`day-cell ${verdict(d.pnl)}`}>
            <div className="day-top">
              <span className={d.inMonth ? "" : "day-muted"}>
                {d.date.slice(8, 10)}/{d.date.slice(5, 7)}
              </span>
              <span className="day-muted">{d.n ? `${d.n} t.` : ""}</span>
            </div>

            {d.inMonth ? (
              <>
                <div className="day-metric">
                  <span className="cap">PnL</span>
                  <span
                    className="val"
                    style={{
                      color:
                        (d.pnl ?? 0) < 0
                          ? "var(--pink)"
                          : "var(--text)",
                    }}
                  >
                    {(d.pnl ?? 0).toFixed(2)}
                  </span>
                </div>

                <div className="day-metric">
                  <span className="cap">Rentabilité</span>
                  <span
                    className="val"
                    style={{
                      color:
                        (d.retPct ?? 0) < 0
                          ? "var(--pink)"
                          : "var(--text)",
                    }}
                  >
                    {Number(d.retPct ?? 0).toFixed(2)}%
                  </span>
                </div>

                <div className="day-metric">
                  <span className="cap">DD Abs</span>
                  <span className="val">
                    {Number(d.ddAbs ?? 0).toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <div
                className="day-muted"
                style={{ fontSize: 12, opacity: 0.5 }}
              >
                —
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

