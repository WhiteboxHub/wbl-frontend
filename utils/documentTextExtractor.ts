/**
 * Client-Side Document Text Extractor
 * Extracts plain text from .txt, .docx, and .pdf files completely in the browser.
 */

export async function extractPlainText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        resolve(text.trim());
      } else {
        reject(new Error("Failed to read text file."));
      }
    };
    reader.onerror = () => reject(new Error("Error reading text file."));
    reader.readAsText(file);
  });
}

export async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || "").trim();
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings: string[] = [];

    for (const item of content.items) {
      if ("str" in item && typeof item.str === "string") {
        strings.push(item.str);
      }
    }

    const pageStr = strings.join(" ").replace(/\s+/g, " ").trim();
    if (pageStr) {
      pageTexts.push(pageStr);
    }
  }

  return pageTexts.join("\n\n").trim();
}

export async function extractDocumentText(file: File): Promise<string> {
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");

  if (ext === ".txt") {
    return extractPlainText(file);
  }

  if (ext === ".docx") {
    return extractDocxText(file);
  }

  if (ext === ".pdf") {
    return extractPdfText(file);
  }

  if (ext === ".doc") {
    throw new Error(
      "Legacy .doc format is not supported for automatic text extraction. Please save as .docx or .pdf, or paste the text directly."
    );
  }

  throw new Error(`Unsupported file type: ${ext}. Please upload a PDF, DOCX, or TXT file.`);
}
