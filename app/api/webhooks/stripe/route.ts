// app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Stripe } from "stripe";
import { createClient } from "@/lib/supabase/server";
import { cookies } from 'next/headers'


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature")!;
  const cookieStore = await cookies();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoice_id = session.metadata?.invoice_id;

    if (invoice_id) {
      const supabase = createClient(cookieStore);

      // Update invoice status
      await supabase
        .from("invoices")
        .update({
          payment_status: "paid",
          amount_paid: session.amount_total! / 100, // Convert from cents
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoice_id);

      // Fetch invoice details for email
      const { data: invoice } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoice_id)
        .single();

        console.log(invoice)
      // Send email notification (implement your email service here)
      // await sendPaymentConfirmationEmail(invoice);
    }
  }

  return NextResponse.json({ received: true });
}
