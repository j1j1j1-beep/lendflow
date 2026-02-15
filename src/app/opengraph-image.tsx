import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OpenShut - Legal Automation & Deal Tools for Private Equity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)",
          color: "#fafafa",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
        >
          OpenShut
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Legal Automation & Deal Tools for Private Equity
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#71717a",
            marginTop: 32,
            display: "flex",
            gap: 32,
          }}
        >
          <span>Deal Terms Generation</span>
          <span>59 Document Types</span>
          <span>5 Modules</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
