import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(76, 201, 240, 0.55), transparent 45%), radial-gradient(circle at 80% 30%, rgba(168, 85, 247, 0.5), transparent 55%), linear-gradient(135deg, #05010d, #0f172a)",
          color: "white",
          fontFamily: "Geist, 'SF Pro Display', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontSize: 24,
              opacity: 0.7,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Free Agentic AI
          </span>
          <h1
            style={{
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1.05,
            }}
          >
            Agentic Motion Lab
          </h1>
          <p
            style={{
              fontSize: 32,
              maxWidth: "70%",
              color: "rgba(255,255,255,0.78)",
            }}
          >
            Generate cinematic procedural videos straight in the browser — no credits, no servers, just autonomous
            creativity.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span>Multi-step prompt reasoning</span>
            <span>Procedural motion layers</span>
            <span>Instant WebM export</span>
          </div>
          <div
            style={{
              padding: "16px 32px",
              borderRadius: 999,
              background:
                "linear-gradient(135deg, rgba(56, 189, 248, 0.6), rgba(168, 85, 247, 0.6))",
              color: "#020617",
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            agentic-75ec437b.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
