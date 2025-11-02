import React from "react";

export default function DarwinWidget() {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <a
        href="https://www.darwinex.com/invest/VYU?utm_source=WidgetDarwin&utm_medium=Referral&utm_campaign=WidgetChart&utm_content=fxzooinvest"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", lineHeight: 0 }}
      >
        <img
          src="https://prodx-widgets.s3-eu-west-1.amazonaws.com/VYU.5.3-widgets-darwin-chart-darwin-all-bg-darkest-l-fr.png"
          alt="VYU"
          style={{
            width: "100%",
            height: "auto",
            maxWidth: 400,
            borderRadius: 12,
            border: "1px solid var(--border)",
            display: "block",
          }}
        />
      </a>
    </div>
  );
}
