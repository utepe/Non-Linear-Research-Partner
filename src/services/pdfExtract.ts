import * as pdfjsLib from 'pdfjs-dist'

// Point the worker at the bundled asset — Vite resolves this at build time
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

/**
 * Extract all text from a PDF given its ArrayBuffer.
 * Returns a plain string with pages separated by a divider.
 * Throws if the PDF is password-protected or unreadable.
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (pageText) pages.push(`[Page ${i}]\n${pageText}`)
  }

  return pages.join('\n\n')
}
