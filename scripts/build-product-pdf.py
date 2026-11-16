from __future__ import annotations

import html
import re
import textwrap
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    LongTable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    XPreformatted,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/product/manual-producto-qida-growth-intelligence.md"
OUTPUT = ROOT / "output/pdf/qida-growth-intelligence-producto.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN_X = 22 * mm
MARGIN_TOP = 22 * mm
MARGIN_BOTTOM = 20 * mm
CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X

INK = colors.HexColor("#142B27")
MUTED = colors.HexColor("#65736F")
GREEN = colors.HexColor("#16846B")
GREEN_DARK = colors.HexColor("#0B604E")
MINT = colors.HexColor("#E8F6F1")
MINT_LIGHT = colors.HexColor("#F4FAF7")
LINE = colors.HexColor("#D8E3DF")
WHITE = colors.white
SOFT_GRAY = colors.HexColor("#F4F6F5")


pdfmetrics.registerFont(TTFont("QidaSans", "/System/Library/Fonts/Supplemental/Arial.ttf"))
pdfmetrics.registerFont(TTFont("QidaSans-Bold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
pdfmetrics.registerFont(TTFont("QidaSans-Italic", "/System/Library/Fonts/Supplemental/Arial Italic.ttf"))
pdfmetrics.registerFontFamily(
    "QidaSans",
    normal="QidaSans",
    bold="QidaSans-Bold",
    italic="QidaSans-Italic",
)


class ProductManualDoc(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=MARGIN_X,
            rightMargin=MARGIN_X,
            topMargin=MARGIN_TOP,
            bottomMargin=MARGIN_BOTTOM,
            title="Qida Growth Intelligence - Documento de producto",
            author="Propuesta de producto",
            subject="Producto, medición, datos y plan de 90 días",
        )
        cover_frame = Frame(
            MARGIN_X,
            0,
            CONTENT_WIDTH,
            PAGE_HEIGHT,
            id="cover",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
            showBoundary=0,
        )
        body_frame = Frame(
            MARGIN_X,
            MARGIN_BOTTOM,
            CONTENT_WIDTH,
            PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM,
            id="body",
            showBoundary=0,
        )
        self.addPageTemplates(
            [
                PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover_background),
                PageTemplate(id="body", frames=[body_frame], onPage=draw_body_chrome),
            ]
        )

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            level = getattr(flowable, "toc_level", None)
            if level is not None:
                text = flowable.getPlainText()
                key = f"section-{self.seq.nextf('section')}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=False)
                self.notify("TOCEntry", (level, text, self.page - 1, key))


def draw_cover_background(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(INK)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    left = 22 * mm
    right = PAGE_WIDTH - 22 * mm

    # Primary hierarchy: one shared left edge for every text element.
    canvas.setFillColor(WHITE)
    canvas.setFont("QidaSans-Bold", 44)
    canvas.drawString(left, 245 * mm, "Qida Growth")
    canvas.drawString(left, 227 * mm, "Intelligence")

    canvas.setFont("QidaSans", 17)
    canvas.setFillColor(colors.HexColor("#B9D1CA"))
    canvas.drawString(left, 207 * mm, "Documento de producto")

    canvas.setStrokeColor(colors.HexColor("#45635C"))
    canvas.setLineWidth(0.8)
    canvas.line(left, 196 * mm, right, 196 * mm)

    canvas.setFillColor(WHITE)
    canvas.setFont("QidaSans", 12.5)
    canvas.drawString(left, 184 * mm, "Una capa de inteligencia para conectar landings,")
    canvas.drawString(left, 177 * mm, "datos y decisiones.")

    canvas.setFillColor(colors.HexColor("#8FA9A2"))
    canvas.setFont("QidaSans", 8.5)
    canvas.drawString(left, 20 * mm, "Prueba técnica")
    canvas.drawRightString(right, 20 * mm, "Noviembre 2026")
    canvas.restoreState()


def draw_body_chrome(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN_X, PAGE_HEIGHT - 13 * mm, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 13 * mm)
    canvas.setFont("QidaSans", 8.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, PAGE_HEIGHT - 9.5 * mm, "Qida Growth Intelligence")
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 9.5 * mm, "Documento de producto")
    canvas.line(MARGIN_X, 13 * mm, PAGE_WIDTH - MARGIN_X, 13 * mm)
    canvas.drawString(MARGIN_X, 8.5 * mm, "Datos sintéticos - Propuesta de prueba técnica")
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, 8.5 * mm, str(canvas.getPageNumber() - 1))
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        "H1",
        fontName="QidaSans-Bold",
        fontSize=20,
        leading=25,
        textColor=INK,
        spaceBefore=7 * mm,
        spaceAfter=3.2 * mm,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        "H2",
        fontName="QidaSans-Bold",
        fontSize=14,
        leading=18,
        textColor=GREEN_DARK,
        spaceBefore=5 * mm,
        spaceAfter=2.4 * mm,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        "H3",
        fontName="QidaSans-Bold",
        fontSize=11.2,
        leading=15,
        textColor=INK,
        spaceBefore=4 * mm,
        spaceAfter=1.8 * mm,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        "BodyQida",
        fontName="QidaSans",
        fontSize=9.4,
        leading=14.2,
        textColor=INK,
        spaceAfter=2.5 * mm,
    )
)
styles.add(
    ParagraphStyle(
        "SmallQida",
        fontName="QidaSans",
        fontSize=8,
        leading=11.2,
        textColor=MUTED,
    )
)
styles.add(
    ParagraphStyle(
        "QuoteQida",
        fontName="QidaSans",
        fontSize=10.5,
        leading=15.5,
        textColor=GREEN_DARK,
        leftIndent=5 * mm,
        rightIndent=5 * mm,
        borderPadding=(4 * mm, 4 * mm, 4 * mm, 4 * mm),
        borderColor=GREEN,
        borderWidth=0,
        borderLeftWidth=3,
        backColor=MINT_LIGHT,
        spaceBefore=2 * mm,
        spaceAfter=4 * mm,
    )
)
styles.add(
    ParagraphStyle(
        "CodeQida",
        fontName="Courier",
        fontSize=7.1,
        leading=10,
        textColor=INK,
        backColor=SOFT_GRAY,
        borderColor=LINE,
        borderWidth=0.5,
        borderPadding=4 * mm,
        spaceBefore=4 * mm,
        spaceAfter=5 * mm,
    )
)
styles.add(
    ParagraphStyle(
        "TOCHeading",
        fontName="QidaSans-Bold",
        fontSize=22,
        leading=26,
        textColor=INK,
        spaceAfter=6 * mm,
    )
)


def inline(text: str) -> str:
    value = html.escape(text.strip())
    value = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"<u>\1</u>", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"`([^`]+)`", r"<font name='Courier' size='8'>\1</font>", value)
    value = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", value)
    return value


def paragraph(text: str, style="BodyQida") -> Paragraph:
    return Paragraph(inline(text), styles[style])


def heading(text: str, level: int) -> Paragraph:
    style_name = {2: "H1", 3: "H2", 4: "H3"}.get(level, "H3")
    item = Paragraph(inline(text), styles[style_name])
    item.toc_level = min(max(level - 2, 0), 2)
    return item


def parse_table(rows: list[str]):
    cells = [[cell.strip() for cell in row.strip().strip("|").split("|")] for row in rows]
    if len(cells) > 1 and all(re.fullmatch(r":?-{3,}:?", cell.replace(" ", "")) for cell in cells[1]):
        del cells[1]
    if not cells:
        return Spacer(1, 1)
    column_count = max(len(row) for row in cells)
    normalized = [row + [""] * (column_count - len(row)) for row in cells]
    weights = []
    for index in range(column_count):
        longest = max(len(row[index]) for row in normalized)
        weights.append(max(7, min(longest, 34)))
    total_weight = sum(weights)
    widths = [CONTENT_WIDTH * weight / total_weight for weight in weights]
    data = []
    for row_index, row in enumerate(normalized):
        data.append(
            [
                Paragraph(
                    inline(cell),
                    ParagraphStyle(
                        f"Table-{row_index}-{column_index}",
                        parent=styles["SmallQida"],
                        fontName="QidaSans-Bold" if row_index == 0 else "QidaSans",
                        textColor=WHITE if row_index == 0 else INK,
                        leading=10.5,
                    ),
                )
                for column_index, cell in enumerate(row)
            ]
        )
    table = LongTable(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN_DARK),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, MINT_LIGHT]),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def parse_markdown(markdown_text: str):
    lines = markdown_text.splitlines()
    story = []
    index = 0
    paragraph_lines: list[str] = []
    list_items: list[tuple[str, bool]] = []

    def flush_paragraph():
        if paragraph_lines:
            story.append(paragraph(" ".join(line.strip() for line in paragraph_lines)))
            paragraph_lines.clear()

    def flush_list():
        if not list_items:
            return
        ordered = list_items[0][1]
        elements = [ListItem(paragraph(text), leftIndent=3 * mm) for text, _ in list_items]
        story.append(
            ListFlowable(
                elements,
                bulletType="1" if ordered else "bullet",
                leftIndent=6 * mm,
                bulletFontName="QidaSans-Bold",
                bulletFontSize=8,
                bulletColor=GREEN,
                spaceAfter=2.5 * mm,
            )
        )
        list_items.clear()

    while index < len(lines):
        line = lines[index]
        stripped = line.strip()

        if stripped.startswith("```"):
            flush_paragraph()
            flush_list()
            code_lines = []
            index += 1
            while index < len(lines) and not lines[index].strip().startswith("```"):
                code_lines.append(lines[index].replace("\t", "    "))
                index += 1
            wrapped_code = []
            for code_line in code_lines:
                wrapped_code.extend(
                    textwrap.wrap(
                        code_line,
                        width=96,
                        subsequent_indent="  ",
                        replace_whitespace=False,
                        drop_whitespace=False,
                    )
                    or [""]
                )
            story.append(XPreformatted(html.escape("\n".join(wrapped_code)), styles["CodeQida"]))
        elif stripped.startswith("|") and "|" in stripped[1:]:
            flush_paragraph()
            flush_list()
            table_lines = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            story.append(parse_table(table_lines))
            story.append(Spacer(1, 3 * mm))
            continue
        elif match := re.match(r"^(#{2,4})\s+(.+)$", stripped):
            flush_paragraph()
            flush_list()
            story.append(heading(match.group(2), len(match.group(1))))
        elif stripped.startswith("> "):
            flush_paragraph()
            flush_list()
            story.append(Paragraph(inline(stripped[2:]), styles["QuoteQida"]))
        elif match := re.match(r"^[-*]\s+(.+)$", stripped):
            flush_paragraph()
            list_items.append((match.group(1), False))
        elif match := re.match(r"^\d+\.\s+(.+)$", stripped):
            flush_paragraph()
            list_items.append((match.group(1), True))
        elif stripped in {"---", "***"}:
            flush_paragraph()
            flush_list()
            story.append(HRFlowable(width="100%", thickness=0.6, color=LINE, spaceBefore=2 * mm, spaceAfter=3 * mm))
        elif not stripped:
            flush_paragraph()
            flush_list()
        elif stripped.startswith("# "):
            pass
        else:
            flush_list()
            paragraph_lines.append(stripped)
        index += 1

    flush_paragraph()
    flush_list()
    return story


def cover_story():
    return [
        NextPageTemplate("body"),
        PageBreak(),
    ]


def toc_story():
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            "TOC0",
            fontName="QidaSans-Bold",
            fontSize=10,
            leading=14,
            leftIndent=0,
            firstLineIndent=0,
            textColor=INK,
            spaceBefore=2.5 * mm,
        ),
        ParagraphStyle(
            "TOC1",
            fontName="QidaSans",
            fontSize=8.7,
            leading=12,
            leftIndent=6 * mm,
            firstLineIndent=0,
            textColor=MUTED,
            spaceBefore=1.2 * mm,
        ),
    ]
    return [
        Paragraph("Contenido", styles["TOCHeading"]),
        Paragraph(
            "El manual avanza desde el problema de producto hasta las métricas, la arquitectura y el plan de ejecución.",
            styles["BodyQida"],
        ),
        Spacer(1, 3 * mm),
        toc,
        PageBreak(),
    ]


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    source = SOURCE.read_text(encoding="utf-8")
    source = re.sub(r"^Estado:.*\nFecha:.*\nAudiencia:.*\nDatos de la demostración:.*\n", "", source, count=1, flags=re.MULTILINE)
    doc = ProductManualDoc(str(OUTPUT))
    story = cover_story() + toc_story() + parse_markdown(source)
    doc.multiBuild(story)
    print(OUTPUT)


if __name__ == "__main__":
    build()
