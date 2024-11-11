// app/stripe/[id]/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function MockCheckoutPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Fetch invoice data
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!invoice) {
    return redirect("/invoices");
  }

  // Calculate amount due
  const amountDue = invoice.amount_total - (invoice.amount_paid || 0);

  async function handlePayment() {
    'use server';
    
    const supabase = createClient(cookies());
    
    // Update invoice as paid
    await supabase
      .from("invoices")
      .update({
        payment_status: "paid",
        amount_paid: amountDue,
        paid_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    // Redirect back to invoice page
    redirect(`/invoice/${params.id}?success=true`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-600">Invoice #{invoice.invoice_number}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between border-b pb-4">
            <span className="font-medium">Amount Due:</span>
            <span className="font-bold">${amountDue.toFixed(2)}</span>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="font-medium mb-2">Test Card Details</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Card Number: 4242 4242 4242 4242</p>
              <p>Expiry: Any future date</p>
              <p>CVC: Any 3 digits</p>
            </div>
          </div>
        </div>

        <form action={handlePayment}>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Pay ${amountDue.toFixed(2)}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <a
            href={`/invoice/${params.id}`}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel and return to invoice
          </a>
        </div>
      </div>
    </div>
  );
}