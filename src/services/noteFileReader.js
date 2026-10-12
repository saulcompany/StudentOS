import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const maxFileSize = 10 * 1024 * 1024;
const maxTextLength = 20000;

function limitText(text) {
  const trimmedText = text.trim();
  if (trimmedText.length <= maxTextLength) return trimmedText;
  return `${trimmedText.slice(0, maxTextLength)}\n\n[Note text truncated to fit the AI summary limit.]`;
}

async function readPdf(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() });
  try {
    const pdf = await loadingTask.promise;
    const pages = [];
    let extractedLength = 0;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      pages.push(pageText);
      extractedLength += pageText.length;
      if (extractedLength >= maxTextLength) break;
    }
    return pages.join('\n');
  } finally {
    await loadingTask.destroy();
  }
}

export async function extractNoteText(file) {
  if (file.size > maxFileSize) {
    throw new Error('Please upload a file smaller than 10 MB.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  let text;
  if (['txt', 'md', 'csv', 'json', 'log'].includes(extension)) {
    text = await file.text();
  } else if (extension === 'pdf') {
    text = await readPdf(file);
  } else if (extension === 'docx') {
    const { default: mammoth } = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    text = result.value;
  } else {
    throw new Error('Choose a text, PDF, or DOCX file to make it available for AI summaries.');
  }

  const extractedText = limitText(text);
  if (!extractedText) {
    throw new Error('No readable text was found in this file. Scanned PDFs and image-only files are not supported yet.');
  }
  return extractedText;
}
