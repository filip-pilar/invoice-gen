// components/DownloadButton.tsx
"use client";

import { generatePDF } from "@/lib/generatePDF";
import { InvoiceData } from "@/types/invoice";
import { Download } from "lucide-react";
import { useState } from "react";

interface PDFDownloadButtonProps {
  invoiceData: InvoiceData;
}

export default function PDFDownloadButton({
  invoiceData,
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const blob = await generatePDF(invoiceData);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceData.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
    >
      <Download className="w-4 h-4 mr-2" />
      {isGenerating ? "Generating..." : "Download PDF"}
    </button>
  );
}
