// src/app/lib/pdf.ts
import PDFDocument from "pdfkit";

interface IBookingForPDF {
  bookingReference: string;
  tourDate: Date;
  numberOfPeople: number;
  totalPrice: number;
  specialRequests?: string | null;
  status: string;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  package: {
    title: string;
    meetingPoint?: string | null;
  };
  tourist: {
    user: {
      name: string;
      email: string;
    };
  };
  guide: {
    user: {
      name: string;
      email: string;
    };
  };
  payment?: {
    amount: number;
    bKashTrxId?: string | null;
    paidAt?: Date | null;
    refundedAt?: Date | null;
    refundReason?: string | null;
  } | null;
}

// =============================================
// Helper: Format Date
// =============================================
const formatDate = (date: Date | null | undefined): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =============================================
// Helper: Format Currency
// =============================================
const formatCurrency = (amount: number | undefined): string => {
  if (!amount) return "BDT 0.00";
  return `BDT ${amount.toFixed(2)}`;
};

// =============================================
// Helper: Draw Line
// =============================================
const drawLine = (doc: PDFKit.PDFDocument) => {
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .strokeColor("#cccccc")
    .stroke();
  doc.moveDown(0.5);
};

// =============================================
// Helper: Section Heading
// =============================================
const sectionHeading = (doc: PDFKit.PDFDocument, title: string) => {
  doc
    .fillColor("#007bff")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(title)
    .fillColor("#333333")
    .font("Helvetica")
    .moveDown(0.5);
};

// =============================================
// Helper: Key-Value Row
// =============================================
const keyValueRow = (
  doc: PDFKit.PDFDocument,
  key: string,
  value: string
) => {
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#555555")
    .text(`${key}:`, { continued: true, width: 150 })
    .font("Helvetica")
    .fillColor("#333333")
    .text(` ${value}`);
};

// =============================================
// Main: Generate Invoice PDF
// =============================================
export const generateInvoicePDF = async (
  booking: IBookingForPDF,
  type: "COMPLETED" | "CANCELLED"
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // ==========================================
      // HEADER
      // ==========================================
      doc
        .fillColor("#007bff")
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("Tour Guide Platform", { align: "center" })
        .moveDown(0.3);

      doc
        .fillColor("#333333")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(
          type === "COMPLETED"
            ? "Booking Confirmation"
            : "Booking Cancellation",
          { align: "center" }
        )
        .moveDown(0.3);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text(`Invoice: ${booking.bookingReference}`, { align: "center" })
        .moveDown(1);

      drawLine(doc);

      // ==========================================
      // BOOKING DETAILS
      // ==========================================
      sectionHeading(doc, "BOOKING DETAILS");

      keyValueRow(doc, "Booking Reference", booking.bookingReference);
      keyValueRow(doc, "Tour Date", formatDate(booking.tourDate));
      keyValueRow(doc, "Number of People", String(booking.numberOfPeople));
      keyValueRow(doc, "Status", booking.status);

      if (booking.specialRequests) {
        keyValueRow(doc, "Special Requests", booking.specialRequests);
      }

      if (type === "COMPLETED" && booking.completedAt) {
        keyValueRow(doc, "Completed At", formatDate(booking.completedAt));
      }

      if (type === "CANCELLED" && booking.cancelledAt) {
        keyValueRow(doc, "Cancelled At", formatDate(booking.cancelledAt));
      }

      if (type === "CANCELLED" && booking.cancellationReason) {
        keyValueRow(doc, "Cancellation Reason", booking.cancellationReason);
      }

      doc.moveDown(1);
      drawLine(doc);

      // ==========================================
      // PACKAGE INFO
      // ==========================================
      sectionHeading(doc, "PACKAGE INFO");

      keyValueRow(doc, "Title", booking.package.title);
      if (booking.package.meetingPoint) {
        keyValueRow(doc, "Meeting Point", booking.package.meetingPoint);
      }

      doc.moveDown(1);
      drawLine(doc);

      // ==========================================
      // PAYMENT INFO
      // ==========================================
      sectionHeading(
        doc,
        type === "COMPLETED" ? "PAYMENT INFO" : "PAYMENT & REFUND INFO"
      );

      keyValueRow(doc, "Total Amount", formatCurrency(booking.totalPrice));

      if (booking.payment) {
        if (booking.payment.bKashTrxId) {
          keyValueRow(doc, "Transaction ID", booking.payment.bKashTrxId);
        }
        if (booking.payment.paidAt) {
          keyValueRow(doc, "Payment Date", formatDate(booking.payment.paidAt));
        }

        if (type === "CANCELLED") {
          keyValueRow(
            doc,
            "Refund Amount",
            formatCurrency(booking.payment.amount)
          );
          keyValueRow(doc, "Refund Status", "REFUNDED");
          if (booking.payment.refundedAt) {
            keyValueRow(
              doc,
              "Refund Date",
              formatDate(booking.payment.refundedAt)
            );
          }
        }
      }

      doc.moveDown(1);
      drawLine(doc);

      // ==========================================
      // TOURIST INFO
      // ==========================================
      sectionHeading(doc, "TOURIST INFO");

      keyValueRow(doc, "Name", booking.tourist.user.name);
      keyValueRow(doc, "Email", booking.tourist.user.email);

      doc.moveDown(1);
      drawLine(doc);

      // ==========================================
      // GUIDE INFO
      // ==========================================
      sectionHeading(doc, "GUIDE INFO");

      keyValueRow(doc, "Name", booking.guide.user.name);
      keyValueRow(doc, "Email", booking.guide.user.email);

      doc.moveDown(1.5);
      drawLine(doc);

      // ==========================================
      // FOOTER MESSAGE
      // ==========================================
      doc.moveDown(0.5);

      if (type === "COMPLETED") {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#28a745")
          .text("Thank you for your booking!", { align: "center" })
          .moveDown(0.3);
      } else {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#dc3545")
          .text("Your refund will be processed within 5-7 business days.", {
            align: "center",
          })
          .moveDown(0.3);
      }

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#888888")
        .text("© Tour Guide Platform. All rights reserved.", {
          align: "center",
        });

      // ==========================================
      // FINALIZE PDF
      // ==========================================
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};