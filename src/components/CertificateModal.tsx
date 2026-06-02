import { Dialog, IconButton } from "@mui/material";
import { Download, X } from "lucide-react";
import { useRef, useState } from "react";
import Certificate, { type CertificateData } from "@/components/Certificate";

interface CertificateModalProps {
  open: boolean;
  onClose: () => void;
  data: CertificateData;
}

/**
 * Shows the completion certificate and exports it to a landscape A4 PDF via
 * html2canvas -> jsPDF (jsPDF already used in exportCTUJournal.ts).
 */
export default function CertificateModal({
  open,
  onClose,
  data,
}: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const img = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgRatio = canvas.width / canvas.height;
      let w = pageW;
      let h = w / imgRatio;
      if (h > pageH) {
        h = pageH;
        w = h * imgRatio;
      }
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
      pdf.addImage(img, "PNG", x, y, w, h);
      const safeName = (data.name || "intern").replace(/[^a-z0-9]+/gi, "_");
      pdf.save(`InternPal_Certificate_${safeName}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden" } } }}
    >
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8, color: "grey.500", zIndex: 2 }}
      >
        <X size={20} />
      </IconButton>

      <div className="p-6 bg-surface">
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-text">
            🎉 Congratulations, you did it!
          </h2>
          <p className="text-sm text-text-muted mt-1">
            You've completed your required internship hours.
          </p>
        </div>

        {/* Responsive scaled preview of the fixed-size certificate */}
        <div className="w-full overflow-x-auto flex justify-center">
          <div
            style={{
              width: 1000,
              transform: "scale(var(--cert-scale, 0.62))",
              transformOrigin: "top center",
              height: 707 * 0.62,
            }}
          >
            <Certificate ref={certRef} data={data} />
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Preparing PDF..." : "Download Certificate"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
