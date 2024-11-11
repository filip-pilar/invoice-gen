import { cookies } from "next/headers";
import Link from "next/link";
import InvoicePreview from "@/components/invoice-preview";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Download, CreditCard } from "lucide-react";
import DownloadButton from "@/components/invoice-download";
import PDFDownloadButton from "@/components/invoice-download";

export default async function InvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  console.log(invoice)

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <a  href={"/"} className="text-2xl font-bold">
            Home
          </a>
          
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-medium">Amount Due</div>
            <div className="text-2xl font-bold">
              ${(invoice.amount_total - (invoice.amount_paid || 0)).toFixed(2)}
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-sm font-medium
            ${
              invoice.payment_status === "paid"
                ? "bg-green-100 text-green-800"
                : invoice.payment_status === "partially_paid"
                ? "bg-yellow-100 text-yellow-800"
                : invoice.payment_status === "overdue"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {invoice.payment_status.replace("_", " ").toUpperCase()}
          </div>

          {invoice && <PDFDownloadButton invoiceData={invoice} />}

          {invoice.payment_status !== "paid" && (
            <Link
              href={`/stripe/${params.id}`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </Link>
          )}
        </div>
      </div>

      <div className="h-[calc(100vh-120px)] overflow-auto">
        <div className="w-[595px] mx-auto">
          <div
            className="transform scale-75 origin-top"
            style={{ height: "841px" }}
          >
            <InvoicePreview data={invoice.data} />
          </div>
        </div>
      </div>
    </div>
  );
}
