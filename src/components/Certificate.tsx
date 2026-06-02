import { forwardRef } from "react";

export interface CertificateData {
  name: string;
  school: string | null;
  course: string | null;
  hours: number;
  date: string; // ISO or display string
}

function formatDate(value: string): string {
  const datePrefix = value.match(/^(\d{4})-(\d{2})-(\d{2})/)?.slice(1);
  if (datePrefix) {
    const [year, month, day] = datePrefix.map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * InternPal-themed certificate of completion. School-agnostic — renders whatever
 * school the user entered. Designed at a fixed landscape size for crisp
 * html2canvas capture (see CertificateModal). Uses inline hex (not CSS vars) so
 * the colors survive the canvas snapshot.
 */
const Certificate = forwardRef<HTMLDivElement, { data: CertificateData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 1000,
          height: 707,
          background: "#ffffff",
          position: "relative",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
          color: "#172033",
          boxSizing: "border-box",
          padding: 28,
        }}
      >
        {/* Decorative double border */}
        <div
          style={{
            position: "absolute",
            inset: 16,
            border: "3px solid #0b73d9",
            borderRadius: 16,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 26,
            border: "1px solid #dbeafe",
            borderRadius: 12,
          }}
        />

        {/* Corner accents */}
        {[
          { top: 26, left: 26 },
          { top: 26, right: 26 },
          { bottom: 26, left: 26 },
          { bottom: 26, right: 26 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 46,
              height: 46,
              background: "#0b73d9",
              opacity: 0.08,
              borderRadius: 10,
              ...pos,
            }}
          />
        ))}

        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#0b73d9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.02em",
              }}
            >
              IP
            </div>
            <span
              style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}
            >
              InternPal
            </span>
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#0b73d9",
              marginBottom: 8,
            }}
          >
            Certificate of Completion
          </div>

          <div
            style={{ fontSize: 15, color: "#687083", marginBottom: 22 }}
          >
            This certifies that
          </div>

          <div
            style={{
              fontSize: 46,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 6,
              borderBottom: "2px solid #e4e7ec",
              paddingBottom: 12,
              minWidth: 420,
            }}
          >
            {data.name}
          </div>

          <div
            style={{
              fontSize: 16,
              color: "#172033",
              marginTop: 22,
              lineHeight: 1.7,
              maxWidth: 640,
            }}
          >
            has successfully completed{" "}
            <strong>{Math.round(data.hours)} internship hours</strong>
            {data.course ? (
              <>
                {" "}
                for <strong>{data.course}</strong>
              </>
            ) : null}
            {data.school ? (
              <>
                {" "}
                at <strong>{data.school}</strong>
              </>
            ) : null}
            .
          </div>

          {/* Footer: date + seal */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: 640,
              marginTop: 56,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  borderTop: "1.5px solid #172033",
                  paddingTop: 6,
                  minWidth: 200,
                }}
              >
                {formatDate(data.date)}
              </div>
              <div style={{ fontSize: 12, color: "#687083", marginTop: 4 }}>
                Date Completed
              </div>
            </div>

            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                border: "3px solid #0b73d9",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#0b73d9",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
                INTERN
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
                PAL
              </div>
              <div style={{ fontSize: 9, marginTop: 2 }}>★ ★ ★</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  borderTop: "1.5px solid #172033",
                  paddingTop: 6,
                  minWidth: 200,
                  fontFamily: "cursive",
                }}
              >
                InternPal
              </div>
              <div style={{ fontSize: 12, color: "#687083", marginTop: 4 }}>
                Issued by InternPal
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

Certificate.displayName = "Certificate";
export default Certificate;
