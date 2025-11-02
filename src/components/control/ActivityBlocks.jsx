// src/components/control/ActivityBlocks.jsx
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

/*
  Props:
  - rows: trades filtrés
  Note: on n'a pas l'heure exacte des trades, donc on simule une heure
        juste pour voir la répartition.
*/

export default function ActivityBlocks({ rows }) {
  // tableaux init
  const hour = new Array(24).fill(0).map((_, h) => ({
    h,
    win: 0,
    loss: 0,
  }));
  const dow = new Array(7).fill(0).map((_, d) => ({
    d,
    win: 0,
    loss: 0,
  }));
  const mon = new Array(12).fill(0).map((_, m) => ({
    m,
    win: 0,
    loss: 0,
  }));

  rows.forEach((t) => {
    // On n'a pas l'heure réelle → assignation pseudo-aléatoire stable-ish
    const rndH = (Math.random() * 24) | 0;

    const dt = new Date(t.date + "T12:00:00Z");
    const d = (dt.getUTCDay() + 6) % 7; // Lundi=0
    const m = dt.getUTCMonth(); // 0..11

    if (t.pnl > 0) {
      hour[rndH].win++;
      dow[d].win++;
      mon[m].win++;
    } else if (t.pnl < 0) {
      hour[rndH].loss++;
      dow[d].loss++;
      mon[m].loss++;
    }
  });

  const dowLabel = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const monLabel = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];

  const ChartBlock = ({ title, data, xKey }) => (
    <div className="card">
      <div className="kpi-title">{title}</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid stroke="#2b2b2b" />
          <XAxis
            dataKey={xKey}
            stroke="var(--axis-text)"
            tickLine={false}
            axisLine={{ stroke: "var(--axis-text)" }}
          />
          <YAxis
            allowDecimals={false}
            stroke="var(--axis-text)"
            tickLine={false}
            axisLine={{ stroke: "var(--axis-text)" }}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="win" name="Gagnants" fill="var(--green)" />
          <Bar dataKey="loss" name="Perdants" fill="var(--pink)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="card">
      <div className="block-head">
        <div className="block-title cap">Activité</div>
      </div>

      <div className="grid-3">
        <ChartBlock
          title="Activité par Heure"
          data={hour}
          xKey="h"
        />

        <ChartBlock
          title="Activité par Jour (Lun…Dim)"
          data={dow.map((x, i) => ({ ...x, d: dowLabel[i] }))}
          xKey="d"
        />

        <ChartBlock
          title="Activité par Mois (Jan…Déc)"
          data={mon.map((x, i) => ({ ...x, m: monLabel[i] }))}
          xKey="m"
        />
      </div>
    </div>
  );
}

