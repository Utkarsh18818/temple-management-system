from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.models.receipt import Receipt


RECEIPT_STORAGE_DIR = (
    Path(__file__).resolve().parents[2]
    / "storage"
    / "receipts"
)


def generate_receipt_pdf(
    receipt: Receipt,
    temple_name: str,
    devotee_name: str | None = None,
    seva_name: str | None = None,
) -> str:
    """
    Generate a PDF receipt and return its relative storage path.
    """

    RECEIPT_STORAGE_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    filename = f"{receipt.receipt_number}.pdf"
    file_path = RECEIPT_STORAGE_DIR / filename

    pdf = canvas.Canvas(
        str(file_path),
        pagesize=A4,
    )

    width, height = A4

    # ---------------------------------------------------------
    # Header
    # ---------------------------------------------------------

    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawCentredString(
        width / 2,
        height - 35 * mm,
        temple_name,
    )

    pdf.setFont("Helvetica-Bold", 15)
    pdf.drawCentredString(
        width / 2,
        height - 45 * mm,
        "OFFICIAL RECEIPT",
    )

    pdf.line(
        25 * mm,
        height - 50 * mm,
        width - 25 * mm,
        height - 50 * mm,
    )

    # ---------------------------------------------------------
    # Receipt information
    # ---------------------------------------------------------

    y = height - 65 * mm

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(
        30 * mm,
        y,
        "Receipt Number:",
    )

    pdf.setFont("Helvetica", 10)
    pdf.drawString(
        75 * mm,
        y,
        receipt.receipt_number,
    )

    y -= 8 * mm

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(
        30 * mm,
        y,
        "Issued At:",
    )

    pdf.setFont("Helvetica", 10)
    pdf.drawString(
        75 * mm,
        y,
        receipt.issued_at.strftime(
            "%d %b %Y, %I:%M %p"
        ),
    )

    y -= 15 * mm

    # ---------------------------------------------------------
    # Devotee
    # ---------------------------------------------------------

    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(
        30 * mm,
        y,
        "Devotee Details",
    )

    y -= 8 * mm

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(
        30 * mm,
        y,
        "Name:",
    )

    pdf.setFont("Helvetica", 10)
    pdf.drawString(
        75 * mm,
        y,
        devotee_name or "Devotee",
    )

    y -= 15 * mm

    # ---------------------------------------------------------
    # Seva details
    # ---------------------------------------------------------

    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(
        30 * mm,
        y,
        "Transaction Details",
    )

    y -= 10 * mm

    if seva_name:
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(
            30 * mm,
            y,
            "Seva:",
        )

        pdf.setFont("Helvetica", 10)
        pdf.drawString(
            75 * mm,
            y,
            seva_name,
        )

        y -= 8 * mm

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(
        30 * mm,
        y,
        "Receipt Type:",
    )

    pdf.setFont("Helvetica", 10)
    pdf.drawString(
        75 * mm,
        y,
        receipt.receipt_type,
    )

    y -= 8 * mm

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(
        30 * mm,
        y,
        "Amount:",
    )

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(
        75 * mm,
        y,
        f"₹ {receipt.amount:,.2f}",
    )

    y -= 20 * mm

    # ---------------------------------------------------------
    # Notes
    # ---------------------------------------------------------

    if receipt.notes:
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(
            30 * mm,
            y,
            "Notes:",
        )

        y -= 7 * mm

        pdf.setFont("Helvetica", 9)

        # Keep notes safely inside the page width.
        notes = receipt.notes[:180]

        pdf.drawString(
            30 * mm,
            y,
            notes,
        )

        y -= 15 * mm

    # ---------------------------------------------------------
    # Footer
    # ---------------------------------------------------------

    pdf.line(
        25 * mm,
        35 * mm,
        width - 25 * mm,
        35 * mm,
    )

    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(
        width / 2,
        27 * mm,
        "Thank you for your devotion and support.",
    )

    pdf.setFont("Helvetica", 8)
    pdf.drawCentredString(
        width / 2,
        20 * mm,
        "This is a system-generated receipt.",
    )

    pdf.save()

    return str(
        file_path.relative_to(
            Path(__file__).resolve().parents[2]
        )
    )