// app/checkout/[id]/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function CheckoutPage({
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

  async function createCheckout() {
    'use server';
    
    // Create a checkout session with Lemon Squeezy
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            product_id: process.env.LEMON_SQUEEZY_PRODUCT_ID,
            custom_price: Math.round(amountDue * 100), // Convert to cents
            checkout_data: {
              custom: {
                invoice_id: params.id
              }
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${params.id}?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${params.id}`
          }
        }
      })
    });

    const checkout = await response.json();
    
    // Redirect to Lemon Squeezy checkout URL
    redirect(checkout.data.attributes.url);
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
        </div>

        <form action={createCheckout}>
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