import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generateInvoicePDF(invoiceNumber: string): Promise<void> {
  const previewElement = document.querySelector('.invoice-preview-container');
  if (!previewElement) {
    throw new Error("Invoice preview not found");
  }

  const canvas = await html2canvas(previewElement as HTMLElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const imgWidth = 210;
  const pageHeight = 295;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`invoice-${invoiceNumber}.pdf`);
}

