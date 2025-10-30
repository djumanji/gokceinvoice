import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { ExpenseAnalytics } from "@/types/expense-analytics";
import type { DateRange } from "@/components/expenses/DateRangePicker";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface ExportReportsProps {
  analytics: ExpenseAnalytics;
  dateRange: DateRange;
}

export function ExportReports({ analytics, dateRange }: ExportReportsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      // Create CSV content
      let csvContent = "Expense Analytics Report\n";
      csvContent += `Date Range: ${dateRange.startDate ? format(dateRange.startDate, "yyyy-MM-dd") : "N/A"} - ${dateRange.endDate ? format(dateRange.endDate, "yyyy-MM-dd") : "N/A"}\n\n`;
      
      csvContent += "Category Breakdown\n";
      csvContent += "Category,Total,Count,Percentage\n";
      analytics.categoryBreakdown.forEach(item => {
        csvContent += `${item.category},${item.total},${item.count},${item.percentage.toFixed(2)}%\n`;
      });

      csvContent += "\nTax Savings Summary\n";
      csvContent += `Total Tax Deductible,${analytics.taxSavings.totalTaxDeductible}\n`;
      csvContent += `Estimated Tax Savings,${analytics.taxSavings.estimatedTaxSavings}\n`;
      csvContent += `Tax Rate,${analytics.taxSavings.taxRate}%\n`;

      csvContent += "\nTop Vendors\n";
      csvContent += "Vendor,Total,Count,Average\n";
      analytics.topVendors.forEach(vendor => {
        csvContent += `${vendor.vendor},${vendor.total},${vendor.count},${vendor.average}\n`;
      });

      csvContent += "\nPayment Method Breakdown\n";
      csvContent += "Payment Method,Total,Count,Percentage\n";
      analytics.paymentMethodBreakdown.forEach(item => {
        csvContent += `${item.paymentMethod},${item.total},${item.count},${item.percentage.toFixed(2)}%\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expense-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(18);
      doc.text("Expense Analytics Report", 14, yPos);
      yPos += 10;

      // Date Range
      doc.setFontSize(12);
      const dateRangeText = `Date Range: ${dateRange.startDate ? format(dateRange.startDate, "yyyy-MM-dd") : "N/A"} - ${dateRange.endDate ? format(dateRange.endDate, "yyyy-MM-dd") : "N/A"}`;
      doc.text(dateRangeText, 14, yPos);
      yPos += 15;

      // Summary
      doc.setFontSize(14);
      doc.text("Summary", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Total Expenses: €${analytics.totalExpenses.toFixed(2)}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Count: ${analytics.totalCount}`, 14, yPos);
      yPos += 6;
      doc.text(`Tax Deductible: €${analytics.taxSavings.totalTaxDeductible.toFixed(2)}`, 14, yPos);
      yPos += 6;
      doc.text(`Estimated Tax Savings: €${analytics.taxSavings.estimatedTaxSavings.toFixed(2)}`, 14, yPos);
      yPos += 10;

      // Category Breakdown
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.text("Category Breakdown", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      analytics.categoryBreakdown.slice(0, 10).forEach(item => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${item.category}: €${item.total.toFixed(2)} (${item.percentage.toFixed(1)}%)`, 14, yPos);
        yPos += 6;
      });

      // Save PDF
      doc.save(`expense-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={exportToCSV}
        disabled={isExporting}
      >
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
      <Button
        variant="outline"
        onClick={exportToPDF}
        disabled={isExporting}
      >
        <Download className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
}

