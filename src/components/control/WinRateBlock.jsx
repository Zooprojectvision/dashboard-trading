// src/components/control/WinRateBlock.jsx
import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

/*
  Props:
  - rows: liste des trades filtrés [{ pnl: number, ... }]

  Rendu:
  - un donut vert/rose avec winrate en %
*/

export default function WinRateBlock({ rows }) {
  // calcule le nombre de trades gagnants / perdants
  const counts = React.useMemo(() => {
    let w = 0;
    let l = 0;
    rows.forEach((t) => {
      if (t.pnl > 0) w++;
      else if (t.pnl < 0) l++;
    });
    const total = w + l;
    const wr = total ? (w / total) * 100 : 0;
    return { w, l, total, wr };
  }, [rows]);

  // data pour le donut
  const donutData = [
    { name: "Gagnants", value: counts.w },
    { name: "Perdants", value: counts.l },
  ];

  return (
    <div className="card">
      {/* Titre bloc */}
      <div className="block-head">
        <div className="block-title cap">Taux de Réussite</div>
      </div>

      {/* Donut */}
      <div className="wr-donut" style={{ height: 220, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              nameKey="name"
              innerRadius={64}
              outerRadius={84}
              paddingAngle={1.5}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="var(--green)" />
              <Cell fill="var(--pink)" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Texte au centre du donut */}
        <div
          className="wr-center"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            translate: "-50% -50%",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          <div
            className="wr-pct"
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--white)",
            }}
          >
            {counts.wr.toFixed(1)}%
          </div>
          <div
            className="wr-sub"
            style={{
              fontSize: 12,
              color: "var(--text)",
              opacity: 0.8,
              marginTop: 4,
            }}
          >
            sur {counts.total} trades
          </div>
        </div>
      </div>
    </div>
  );
}

