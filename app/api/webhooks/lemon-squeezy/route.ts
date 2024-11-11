// app/api/webhooks/lemon-squeezy/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('x-signature')!;
  const cookieStore = cookies();
  
  // Verify webhook signature
  const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!);
  const digest = hmac.update(body).digest('hex');
  
  if (signature !== digest) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  // Handle order.created event
  if (event.meta.event_name === 'order_created') {
    const { custom } = event.meta.custom_data;
    const invoice_id = custom.invoice_id;
    const total = event.data.attributes.total;

    if (invoice_id) {
      const supabase = createClient(cookieStore);

      // Update invoice status
      await supabase
        .from("invoices")
        .update({
          payment_status: "paid",
          amount_paid: total / 100, // Convert from cents
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoice_id);

      // Fetch invoice details for email
      const { data: invoice } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoice_id)
        .single();

      console.log(invoice);
      // Send email notification (implement your email service here)
      // await sendPaymentConfirmationEmail(invoice);
    }
  }

  return NextResponse.json({ received: true });
}

