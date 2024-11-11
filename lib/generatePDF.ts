import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InvoiceData } from '../types/invoice';

export async function generatePDF(invoiceData: InvoiceData): Promise<Blob> {
  // Wait for the invoice preview element to be rendered
  const element = document.querySelector('[data-invoice-preview="true"]');
  if (!element) {
    throw new Error('Invoice preview element not found');
  }

  // Wait for fonts to load to ensure proper rendering
  await document.fonts.ready;

  // Clone the element to modify it for PDF generation
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Apply specific styles for PDF generation
  clonedElement.style.width = '816px'; // Equivalent to A4 width at 96 DPI
  clonedElement.style.margin = '0';
  clonedElement.style.padding = '48px'; // Maintain the p-12 padding
  clonedElement.style.backgroundColor = 'white';
  
  // Temporarily append cloned element to body
  document.body.appendChild(clonedElement);

  try {
    // Enhanced canvas options
    const canvas = await html2canvas(clonedElement, {
      scale: 2, // Increased scale for better quality
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 816, // A4 width at 96 DPI
      height: clonedElement.offsetHeight,
      onclone: (clonedDoc) => {
        // Ensure all styles are properly applied in the cloned document
        const clonedElement = clonedDoc.querySelector('[data-invoice-preview="true"]');
        if (clonedElement) {
          (clonedElement as HTMLElement).style.transform = 'none';
          (clonedElement as HTMLElement).style.maxHeight = 'none';
          (clonedElement as HTMLElement).style.position = 'static';
        }
      },
    });

    // PDF configuration
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF with better initial settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Set PDF metadata
    pdf.setProperties({
      title: `Invoice ${invoiceData.invoiceNumber}`,
      subject: `Invoice for ${invoiceData.clientName}`,
      creator: invoiceData.companyName,
    });

    // Handle multi-page content
    let heightLeft = imgHeight;
    let position = 0;
    let pageCount = 0;

    // First page
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 1.0),
      'JPEG',
      0,
      position,
      imgWidth,
      imgHeight,
      '',
      'FAST'
    );
    heightLeft -= pageHeight;
    pageCount++;

    // Additional pages if needed
    while (heightLeft >= 0) {
      position = -pageHeight * pageCount;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        0,
        position,
        imgWidth,
        imgHeight,
        '',
        'FAST'
      );
      heightLeft -= pageHeight;
      pageCount++;
    }

    // Cleanup
    document.body.removeChild(clonedElement);

    return pdf.output('blob');
  } catch (error) {
    // Cleanup on error
    if (document.body.contains(clonedElement)) {
      document.body.removeChild(clonedElement);
    }
    console.error('Error generating PDF:', error);
    throw error;
  }
}