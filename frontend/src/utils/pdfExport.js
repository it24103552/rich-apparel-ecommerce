import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPrice, formatDate } from "./formatters";

export const exportTablePDF = (title, columns, rows, filename) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.text(title, 14, 16);

    // Table
    autoTable(doc, {
      startY: 24,
      head: [columns.map((c) => c.label)],
      body: rows.map((row) =>
        columns.map((col) => {
          const value = row[col.key];
          if (col.format === "price") return formatPrice(value);
          if (col.format === "date") return formatDate(value);
          return value ?? "-";
        })
      ),
      margin: { top: 24, right: 14, bottom: 14, left: 14 },
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      alternateRowStyles: { fillColor: [242, 242, 242] },
    });

    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("Failed to export PDF");
  }
};

export const exportOrderInvoicePDF = (order) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.text("INVOICE", 14, 20);

    // Order info
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id}`, 14, 30);
    doc.text(`Date: ${formatDate(order.createdAt)}`, 14, 36);
    doc.text(`Status: ${order.status}`, 14, 42);

    // Customer info
    doc.text(`Customer: ${order.user?.name || "N/A"}`, 14, 52);
    doc.text(`Email: ${order.user?.email || "N/A"}`, 14, 58);

    // Items table
    autoTable(doc, {
      startY: 68,
      head: [["Product", "Quantity", "Price", "Total"]],
      body: (order.items || []).map((item) => [
        item.product?.name || "N/A",
        item.quantity,
        formatPrice(item.price),
        formatPrice(item.price * item.quantity),
      ]),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      alternateRowStyles: { fillColor: [242, 242, 242] },
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text(`Total: ${formatPrice(order.total)}`, pageWidth - 50, finalY);

    doc.save(`invoice-${order.id}.pdf`);
  } catch (error) {
    console.error("Invoice export failed:", error);
    alert("Failed to export invoice");
  }
};
