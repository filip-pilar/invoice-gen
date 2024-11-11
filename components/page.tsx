// app/stripe/[id]/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
});

export default async function StripeCheckoutPage({
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

  try {
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: invoice.currency || "usd",
            product_data: {
              name: `Invoice #${invoice.invoice_number}`,
            },
            unit_amount: Math.round(amountDue * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}?canceled=true`,
      metadata: {
        invoice_id: invoice.id,
      },
    });

    redirect(session.url!);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    redirect(`/404`);
  }
}