"""
Document Parser for TRACE.
Extracts structured text passages and bounding boxes from PDF, TXT, and Markdown files.
"""

import io
import re
import uuid
from typing import List, Optional
from backend.app.schemas import Passage

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None


def parse_pdf_bytes(pdf_bytes: bytes, doc_id: str) -> List[Passage]:
    """
    Parses a PDF byte buffer using PyMuPDF (fitz) and extracts text blocks
    with precise bounding boxes [x0, y0, x1, y1] and page numbers.
    """
    passages: List[Passage] = []
    if not fitz:
        # Fallback if pymupdf is unavailable: treat as decoded string
        text = pdf_bytes.decode("utf-8", errors="ignore")
        return parse_text_content(text, doc_id)

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1
            blocks = page.get_text("blocks")
            
            for b in blocks:
                # b format: (x0, y0, x1, y1, text, block_no, block_type)
                if len(b) >= 5:
                    x0, y0, x1, y1, text = b[0], b[1], b[2], b[3], b[4]
                    clean_text = text.strip()
                    if len(clean_text) > 15:  # skip trivial headers/footers
                        passages.append(
                            Passage(
                                doc_id=doc_id,
                                page=page_num,
                                bbox=[round(float(x0), 1), round(float(y0), 1), round(float(x1), 1), round(float(y1), 1)],
                                text=clean_text,
                                score=0.0,
                            )
                        )
        doc.close()
    except Exception as e:
        # Fallback to text parsing if corrupt PDF
        text = pdf_bytes.decode("utf-8", errors="ignore")
        return parse_text_content(text, doc_id)

    return passages


def parse_text_content(text: str, doc_id: str) -> List[Passage]:
    """
    Parses raw text or markdown by splitting on sections, clauses, or paragraphs,
    generating deterministic page numbers and realistic bounding boxes.
    """
    passages: List[Passage] = []
    # Split on double newlines or numbered clause headers (e.g. '2.1 Term:', 'Section 4:')
    raw_splits = re.split(r"(?:\n\s*\n|\n(?=(?:Section|\d+\.\d+)\b))", text)
    paragraphs = [p.strip() for p in raw_splits if p.strip()]
    
    current_page = 1
    current_y = 72.0  # standard margin in points
    page_height = 792.0  # letter page height
    
    for p in paragraphs:
        if len(p) < 10:
            continue
            
        # Estimate height based on character length
        est_height = max(40.0, min(250.0, len(p) * 0.4))
        if current_y + est_height > page_height - 72.0:
            current_page += 1
            current_y = 72.0
            
        bbox = [72.0, round(current_y, 1), 520.0, round(current_y + est_height, 1)]
        passages.append(
            Passage(
                doc_id=doc_id,
                page=current_page,
                bbox=bbox,
                text=p,
                score=0.0,
            )
        )
        current_y += est_height + 20.0
        
    return passages


def parse_uploaded_file(filename: str, content_bytes: bytes, doc_id: Optional[str] = None) -> List[Passage]:
    """
    Route parser based on file extension.
    """
    effective_doc_id = doc_id or filename.rsplit(".", 1)[0]
    effective_doc_id = re.sub(r"[^a-zA-Z0-9_\-]", "_", effective_doc_id)

    if filename.lower().endswith(".pdf"):
        return parse_pdf_bytes(content_bytes, effective_doc_id)
    else:
        text = content_bytes.decode("utf-8", errors="ignore")
        return parse_text_content(text, effective_doc_id)
