/**
 * PDF Export Utility for Google Business Profile Overview
 *
 * Generates a PDF version of the overview page with charts and metrics
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  locationName?: string;
  date?: Date;
}

// Load the PNG logo
async function getLogoBase64(): Promise<string> {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      };
      img.onerror = () => {
        console.error('Failed to load logo');
        resolve('');
      };
      // Use the new PNG logo
      img.src = '/images/prompt-reviews-logo.png';
    });
  } catch (error) {
    console.error('Error loading logo:', error);
    return '';
  }
}

/**
 * Exports the Google Business Profile overview to PDF
 * @param elementId - The ID of the element to export
 * @param options - Export options
 */
export async function exportOverviewToPDF(
  elementId: string,
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = 'google-business-optimization-report.pdf',
    locationName = 'Business Overview',
    date = new Date()
  } = options;

  try {
    // Load the logo
    const logoBase64 = await getLogoBase64();

    // Get the element to export
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Show a loading state
    const loadingOverlay = document.createElement('div');
    loadingOverlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      ">
        <div style="
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        ">
          <div style="text-align: center;">
            <div style="
              border: 3px solid #f3f3f3;
              border-top: 3px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 10px;
            "></div>
            <p style="margin: 0; font-family: system-ui, -apple-system, sans-serif;">Generating PDF...</p>
          </div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingOverlay);

    // Clone the element to modify it for PDF export
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Remove any elements that shouldn't be in the PDF
    const elementsToRemove = clonedElement.querySelectorAll('.no-print, button, .pdf-hide');
    elementsToRemove.forEach(el => el.remove());

    // Temporarily append the cloned element to capture it
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.width = element.offsetWidth + 'px';
    document.body.appendChild(clonedElement);

    // Wait for any images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert the element to canvas with better settings
    const canvas = await html2canvas(clonedElement, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      backgroundColor: '#ffffff',
      removeContainer: true
    });

    // Remove the cloned element
    document.body.removeChild(clonedElement);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // PDF dimensions
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    const headerHeight = 50; // Increased to accommodate logo
    const footerHeight = 20;
    const contentAreaHeight = pageHeight - headerHeight - footerHeight;

    // Add header function
    const addHeader = (pageNum: number = 1) => {
      // Add logo (top right)
      if (logoBase64) {
        const logoWidth = 50; // Width for logo
        const logoHeight = 12; // Height to maintain readability
        pdf.addImage(logoBase64, 'PNG', pageWidth - margin - logoWidth, 10, logoWidth, logoHeight);
      }

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(33, 37, 41);
      pdf.text('Google Business Optimization Report', margin, 20);

      // Add business name and date
      pdf.setFontSize(12);
      pdf.setTextColor(66, 66, 66);
      pdf.text(locationName, margin, 28);

      pdf.setFontSize(10);
      pdf.setTextColor(108, 117, 125);
      pdf.text(date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), margin, 34);

      // Add PromptReviews URL below the logo
      pdf.setFontSize(10);
      pdf.setTextColor(59, 130, 246); // Blue color
      const brandText = 'promptreviews.app';
      const textWidth = pdf.getTextWidth(brandText);
      pdf.textWithLink(brandText, pageWidth - margin - 50 + (50 - textWidth) / 2, 24, {
        url: 'https://promptreviews.app'
      });

      // Add a line separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, 40, pageWidth - margin, 40);
    };

    // Add footer function
    const addFooter = (pageNum: number, totalPages: number) => {
      pdf.setFontSize(9);
      pdf.setTextColor(128, 128, 128);

      // Page number (centered)
      pdf.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // PromptReviews link (right)
      pdf.setTextColor(59, 130, 246);
      const footerText = 'promptreviews.app';
      const footerWidth = pdf.getTextWidth(footerText);
      pdf.textWithLink(footerText, pageWidth - margin - footerWidth, pageHeight - 10, {
        url: 'https://promptreviews.app'
      });
    };

    // Calculate how to split the content
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Define content sections - Overview is now hidden, so Customer Engagement can start on page 1
    const firstPageContentHeight = contentAreaHeight * 0.85; // Use most of first page since Overview is hidden
    const remainingHeight = imgHeight - firstPageContentHeight;
    const regularPageHeight = contentAreaHeight;

    // Add first page with header
    addHeader(1);

    // Add the first page content (Overview Stats only)
    if (imgHeight <= firstPageContentHeight) {
      // Everything fits on first page with room to spare
      pdf.addImage(imgData, 'PNG', margin, headerHeight + 5, imgWidth, imgHeight);
    } else {
      // Split content - Overview Stats on page 1, rest starting on page 2

      // Page 1: Overview Stats section only
      const page1Canvas = document.createElement('canvas');
      page1Canvas.width = canvas.width;
      page1Canvas.height = firstPageContentHeight * canvas.width / imgWidth;

      const ctx1 = page1Canvas.getContext('2d');
      if (ctx1) {
        ctx1.drawImage(
          canvas,
          0, 0, canvas.width, page1Canvas.height,
          0, 0, canvas.width, page1Canvas.height
        );

        const page1ImgData = page1Canvas.toDataURL('image/png');
        pdf.addImage(
          page1ImgData,
          'PNG',
          margin,
          headerHeight + 5,
          imgWidth,
          firstPageContentHeight
        );
      }

      // Calculate remaining pages needed
      let remainingSourceY = firstPageContentHeight * canvas.width / imgWidth;
      let remainingSourceHeight = canvas.height - remainingSourceY;
      let currentPage = 2;

      // Add remaining content starting from page 2
      while (remainingSourceHeight > 0) {
        pdf.addPage();
        addHeader(currentPage);

        const pageSourceHeight = Math.min(
          regularPageHeight * canvas.width / imgWidth,
          remainingSourceHeight
        );

        // Create canvas for this page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageSourceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, remainingSourceY, canvas.width, pageSourceHeight,
            0, 0, canvas.width, pageSourceHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageImgHeight = pageSourceHeight * imgWidth / canvas.width;

          pdf.addImage(
            pageImgData,
            'PNG',
            margin,
            headerHeight + 5,
            imgWidth,
            Math.min(pageImgHeight, regularPageHeight)
          );
        }

        remainingSourceY += pageSourceHeight;
        remainingSourceHeight -= pageSourceHeight;
        currentPage++;
      }
    }

    // Add footers to all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(i, totalPages);
    }

    // Add a final page with branding
    pdf.addPage();

    // Center content on last page
    const lastPageCenterY = pageHeight / 2;

    // Add logo centered above the text
    if (logoBase64) {
      const logoWidth = 80; // Larger logo on thank you page
      const logoHeight = 20; // Height to maintain readability
      pdf.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, lastPageCenterY - 50, logoWidth, logoHeight);
    }

    pdf.setFontSize(24);
    pdf.setTextColor(33, 37, 41);
    pdf.text('Thank You', pageWidth / 2, lastPageCenterY - 20, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setTextColor(66, 66, 66);
    pdf.text('For using PromptReviews', pageWidth / 2, lastPageCenterY - 8, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setTextColor(59, 130, 246);
    const websiteText = 'Visit us at promptreviews.app';
    pdf.textWithLink(
      websiteText,
      pageWidth / 2,
      lastPageCenterY + 8,
      {
        url: 'https://promptreviews.app',
        align: 'center'
      }
    );

    // Add footer to last page
    addFooter(totalPages + 1, totalPages + 1);

    // Remove loading overlay
    document.body.removeChild(loadingOverlay);

    // Save the PDF
    pdf.save(filename);

  } catch (error) {
    console.error('Error generating PDF:', error);

    // Remove loading overlay if it exists
    const overlay = document.querySelector('[style*="position: fixed"]');
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    throw error;
  }
}

/**
 * Alternative method using browser print functionality
 * This can provide better fidelity but less control
 */
export function exportOverviewUsingPrint(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  // Create a new window with the content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  // Clone styles
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        // External stylesheets might throw security errors
        return '';
      }
    })
    .join('\n');

  // Write the content to the new window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Business Profile Overview</title>
        <style>
          ${styles}
          @media print {
            body { margin: 0; }
            .no-print, button { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}