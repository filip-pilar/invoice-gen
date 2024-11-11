import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InvoiceData } from '../types/invoice';

export async function generatePDF(data: InvoiceData): Promise<Response> {
  // Create a temporary div to render the invoice
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '816px'; // Standard A4 width in pixels (96 DPI)
  document.body.appendChild(tempDiv);

  // Create a new instance of InvoicePreview with the data
  const invoicePreview = document.createElement('div');
  invoicePreview.innerHTML = `
    <div class="bg-white p-8 rounded-lg shadow min-h-[1056px] w-full">
      <!-- Header -->
      <div class="flex justify-between items-start mb-8">
        <div>
          ${data.logo ? `<img src="${data.logo}" alt="Company Logo" style="max-width: 200px; max-height: 100px; margin-bottom: 1rem;" />` : ''}
          <h1 style="font-size: 1.5rem; font-weight: bold; color: #111827;">INVOICE</h1>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: 500;">Invoice #: ${data.invoiceNumber}</p>
          <p>Date: ${data.date}</p>
          <p>Due Date: ${data.dueDate}</p>
        </div>
      </div>

      <!-- Company and Client Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 2rem;">
        <div style="max-width: 300px;">
          <h2 style="font-weight: bold; color: #374151; margin-bottom: 0.5rem;">From:</h2>
          <p style="font-weight: 500;">${data.companyName}</p>
          <p style="white-space: pre-wrap;">${data.companyAddress}</p>
        </div>
        <div style="max-width: 300px;">
          <h2 style="font-weight: bold; color: #374151; margin-bottom: 0.5rem;">To:</h2>
          <p style="font-weight: 500;">${data.clientName}</p>
          <p style="white-space: pre-wrap;">${data.clientAddress}</p>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 2rem;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #D1D5DB;">
              <th style="text-align: left; padding: 0.5rem 0;">Description</th>
              <th style="text-align: right; padding: 0.5rem 0;">Quantity</th>
              <th style="text-align: right; padding: 0.5rem 0;">Price</th>
              <th style="text-align: right; padding: 0.5rem 0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 0.5rem 0;">${item.description}</td>
                <td style="text-align: right; padding: 0.5rem 0;">${item.quantity}</td>
                <td style="text-align: right; padding: 0.5rem 0;">$${item.price.toFixed(2)}</td>
                <td style="text-align: right; padding: 0.5rem 0;">$${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: bold; padding: 1rem 0;">Total:</td>
              <td style="text-align: right; font-weight: bold; padding: 1rem 0;">$${data.items.reduce((total, item) => total + (item.quantity * item.price), 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Notes -->
      ${data.notes ? `
        <div style="margin-bottom: 2rem;">
          <h2 style="font-weight: bold; color: #374151; margin-bottom: 0.5rem;">Notes:</h2>
          <p style="white-space: pre-wrap;">${data.notes}</p>
        </div>
      ` : ''}

      <!-- Signature -->
      ${data.signature ? `
        <div style="margin-top: 2rem;">
          <h2 style="font-weight: bold; color: #374151; margin-bottom: 0.5rem;">Signature:</h2>
          <img src="${data.signature}" alt="Signature" style="max-width: 200px; max-height: 100px;" />
        </div>
      ` : ''}
    </div>
  `;
  tempDiv.appendChild(invoicePreview);

  try {
    // Convert the invoice preview to canvas
    const canvas = await html2canvas(invoicePreview, {
      scale: 2, // Increase quality
      useCORS: true, // Enable loading of images from other domains
      logging: false,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    // Add the canvas as an image to the PDF
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

    // Convert PDF to blob
    const pdfBlob = pdf.output('blob');

    // Clean up
    document.body.removeChild(tempDiv);

    // Return response
    return new Response(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${data.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    // Clean up on error
    document.body.removeChild(tempDiv);
    throw error;
  }
}