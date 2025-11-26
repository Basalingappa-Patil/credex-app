const pdf = require('pdf-img-convert');

class PDFService {
    /**
     * Converts the first page of a PDF file/buffer to an image buffer (PNG)
     * @param {string|Buffer} pdfSource - File path or Buffer of the PDF
     * @returns {Promise<Buffer>} - Image buffer of the first page
     */
    async convertFirstPageToImage(pdfSource) {
        try {
            // Convert only the first page (page_numbers: [1])
            // pdf-img-convert returns an array of image buffers (or base64 strings if specified)
            // By default it returns buffers.
            const outputImages = await pdf.convert(pdfSource, {
                page_numbers: [1],
                width: 1000 // Set a reasonable width to ensure QR is readable but not too huge
            });

            if (outputImages.length > 0) {
                return outputImages[0];
            }

            throw new Error('Failed to convert PDF to image: No output generated');
        } catch (error) {
            console.error('PDF conversion error:', error);
            throw new Error('Failed to process PDF file: ' + error.message);
        }
    }
}

module.exports = new PDFService();
