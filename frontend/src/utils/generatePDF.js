import jsPDF from 'jspdf';
import { logoBase64 } from '../assets/logoBase64.js';

function numToWords(num) {
  if (isNaN(num) || !isFinite(num)) return '';
  if (num === 0) return 'Zero';
  if (num > 999999999999999) return 'Amount too large';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertHundreds = (n) => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n = n % 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      }
    }
    return str.trim();
  };

  let numStr = Math.floor(num).toString();
  let out = '';

  if (numStr.length > 7) {
    let crores = parseInt(numStr.substring(0, numStr.length - 7));
    if (crores > 0) {
      out += (crores > 99 ? numToWords(crores) : convertHundreds(crores)) + ' Crore ';
    }
    numStr = numStr.substring(numStr.length - 7);
  }

  if (numStr.length > 5) {
    let lakhs = parseInt(numStr.substring(0, numStr.length - 5));
    if (lakhs > 0) {
      out += convertHundreds(lakhs) + ' Lakh ';
    }
    numStr = numStr.substring(numStr.length - 5);
  }

  if (numStr.length > 3) {
    let thousands = parseInt(numStr.substring(0, numStr.length - 3));
    if (thousands > 0) {
      out += convertHundreds(thousands) + ' Thousand ';
    }
    numStr = numStr.substring(numStr.length - 3);
  }

  let hundreds = parseInt(numStr);
  if (hundreds > 0) {
    out += convertHundreds(hundreds);
  }

  return out.trim();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
}

export async function generateInvoicePDF(invoice, mode = 'save', documentType = 'TAX INVOICE') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const subtotal = Number(invoice.subtotal || 0);
  const gst = Number(invoice.gst || 0);
  const total = Math.round(Number(invoice.total || 0));
  const gstPercent = Number(invoice.gstPercent || 0);
  const halfGst = (gstPercent / 2).toFixed(1);
  const logoToUse = invoice.fromLogo || null;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  const PAGE_HEIGHT = 297;
  const BOTTOM_MARGIN = 15;
  const cols = [10, 18, 90, 115, 128, 140, 165, 175, 200];

  let currentY = 10;

  const drawHeader = () => {
    // --- Header Box ---
    doc.rect(10, currentY, 190, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 60, 150);
    doc.text(documentType, 105, currentY + 6, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('ORIGINAL FOR RECIPIENT', 198, currentY + 6, { align: 'right' });
    currentY += 8;

    // --- Company Details ---
    const textStartX = 12;
    const maxTextWidth = 105 - textStartX - 2;

    const addrVal = invoice.fromAddress || '4, Balaji illam , Senthamizh nagar, Chennai\nChennai, TAMIL NADU, 600107';
    const fromAddrLines = doc.splitTextToSize(addrVal, maxTextWidth);
    
    const compName = invoice.fromName || 'Beam Signage & Branding Creations';
    const compNameLines = doc.splitTextToSize(compName, maxTextWidth);
    
    let totalLines = compNameLines.length + 1 + fromAddrLines.length + 1; // Name, GSTIN, Addr, Email
    if (invoice.fromPhone) totalLines++;

    const textHeight = (totalLines * 4.5);
    const calculatedHeight = 7 + textHeight;
    const COMP_BOX_HEIGHT = Math.max(25, calculatedHeight);
    
    doc.rect(10, currentY, 190, COMP_BOX_HEIGHT);
    doc.line(105, currentY, 105, currentY + COMP_BOX_HEIGHT);

    let cyCompany = currentY + 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    compNameLines.forEach(line => {
      doc.text(line, textStartX, cyCompany);
      cyCompany += 4.5;
    });
    
    doc.setFontSize(9);
    const gstinVal = invoice.fromGstin || '33AYJPV9633K1ZP';
    doc.text('GSTIN: ' + gstinVal, textStartX, cyCompany);
    cyCompany += 4.5;
    
    doc.setFont('helvetica', 'normal');
    fromAddrLines.forEach(line => {
      doc.text(line, textStartX, cyCompany);
      cyCompany += 4.5;
    });
    const emailVal = invoice.fromEmail || 'info@beamsignage.com';
    doc.text('Email: ' + emailVal, textStartX, cyCompany);
    cyCompany += 4.5;
    
    if (invoice.fromPhone) {
      doc.text('Phone: ' + invoice.fromPhone, textStartX, cyCompany);
    }

    // --- Invoice Details ---
    doc.line(105, currentY + 13, 200, currentY + 13);
    doc.line(152.5, currentY, 152.5, currentY + COMP_BOX_HEIGHT);

    const isQuote = documentType === 'QUOTATION';
    doc.text(isQuote ? 'Quote #:' : 'Invoice #:', 107, currentY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoiceNo || '-', 107, currentY + 9);

    doc.setFont('helvetica', 'normal');
    doc.text('Date:', 154.5, currentY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDate(invoice.date) || '-', 154.5, currentY + 9);

    doc.setFont('helvetica', 'normal');
    doc.text('Place of Supply:', 107, currentY + 17);
    doc.setFont('helvetica', 'bold');
    doc.text((invoice.placeOfSupply || '').substring(0, 30), 107, currentY + 22);

    if (invoice.dueDate) {
      doc.setFont('helvetica', 'normal');
      doc.text(isQuote ? 'Valid Until:' : 'Due Date:', 154.5, currentY + 17);
      doc.setFont('helvetica', 'bold');
      doc.text(formatDate(invoice.dueDate), 154.5, currentY + 22);
    }
    currentY += COMP_BOX_HEIGHT;

    // --- Customer Details ---
    const CUST_LINE_SPACING = 4.5;

    let cy = currentY + 5;
    let addrLines = [];
    if (invoice.billingAddress) {
      addrLines = doc.splitTextToSize(invoice.billingAddress, 90);
    }

    doc.setFont('helvetica', 'bold');
    let clientNameLines = doc.splitTextToSize((invoice.clientName || '').toUpperCase(), 90);
    doc.setFont('helvetica', 'normal');

    let reqHeight = 5 + (clientNameLines.length * CUST_LINE_SPACING) + 4;
    if (invoice.gstin) reqHeight += CUST_LINE_SPACING;
    if (invoice.pan) reqHeight += CUST_LINE_SPACING;
    if (invoice.billingAddress) {
      reqHeight += CUST_LINE_SPACING + (addrLines.length * CUST_LINE_SPACING);
    }
    if (invoice.phone) reqHeight += CUST_LINE_SPACING;
    if (invoice.email) reqHeight += CUST_LINE_SPACING;

    let customerBoxHeight = Math.max(20, reqHeight);

    doc.rect(10, currentY, 190, customerBoxHeight);
    doc.line(105, currentY, 105, currentY + customerBoxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Customer Details:', 12, cy);
    cy += CUST_LINE_SPACING;
    clientNameLines.forEach(line => {
      doc.text(line, 12, cy);
      cy += CUST_LINE_SPACING;
    });

    doc.setFont('helvetica', 'bold');
    if (invoice.gstin) {
      doc.text('GSTIN: ' + invoice.gstin.substring(0, 15), 12, cy);
      cy += CUST_LINE_SPACING;
    }
    if (invoice.pan) {
      doc.text('PAN: ' + invoice.pan.substring(0, 10), 12, cy);
      cy += CUST_LINE_SPACING;
    }

    if (invoice.billingAddress) {
      doc.text('Billing Address:', 12, cy);
      doc.setFont('helvetica', 'normal');
      cy += (CUST_LINE_SPACING - 0.5);
      addrLines.forEach(line => {
        doc.text(line, 12, cy);
        cy += CUST_LINE_SPACING;
      });
    }
    doc.setFont('helvetica', 'normal');
    if (invoice.phone) {
      doc.text('Phone: ' + invoice.phone.substring(0, 15), 12, cy);
      cy += CUST_LINE_SPACING;
    }
    if (invoice.email) {
      doc.text('Email: ' + invoice.email.substring(0, 40), 12, cy);
      cy += CUST_LINE_SPACING;
    }

    currentY += customerBoxHeight;
  };

  const drawTableHeader = () => {
    doc.rect(10, currentY, 190, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('#', 14, currentY + 5, { align: 'center' });
    doc.text('Item', 20, currentY + 5);
    doc.text('HSN/SAC', 102.5, currentY + 5, { align: 'center' });
    doc.text('Tax', 121.5, currentY + 5, { align: 'center' });
    doc.text('Qty', 134, currentY + 5, { align: 'center' });
    doc.text('Rate / Item', 152.5, currentY + 5, { align: 'center', fontStyle: 'bold' });
    
    doc.text('Amount', 198, currentY + 5, { align: 'right' });
    currentY += 8;
  };

  const drawTableLines = (startY, endY) => {
    doc.rect(10, startY, 190, endY - startY);
    for (let i = 1; i < cols.length - 1; i++) {
      doc.line(cols[i], startY, cols[i], endY);
    }
  };

  drawHeader();

  let tableStartY = currentY;
  drawTableHeader();

  let itemsProcessed = 0;
  const items = invoice.items || [];

  doc.setFont('helvetica', 'normal');

  while (itemsProcessed < items.length) {
    const item = items[itemsProcessed];

    const ITEM_TOP_PADDING = 4.5;
    const LINE_SPACING = 4;
    const GAP_AFTER_TITLE = 1;
    const ITEM_SPACING_EXTRA = 1.5;

    let titleLines = [];
    if (item.title) {
      doc.setFont('helvetica', 'bold');
      titleLines = doc.splitTextToSize((item.title || '').substring(0, 45).trim(), 65);
      doc.setFont('helvetica', 'normal');
    }
    let descLines = doc.splitTextToSize((item.description || '').trim() || '-', 68);
    let totalTextLines = titleLines.length + descLines.length;

    let lastLineY = ITEM_TOP_PADDING + ((totalTextLines - 1) * LINE_SPACING);
    if (titleLines.length > 0) {
      lastLineY += GAP_AFTER_TITLE;
    }

    let itemHeight = lastLineY + LINE_SPACING + ITEM_SPACING_EXTRA - ITEM_TOP_PADDING;

    const maxPageItemArea = PAGE_HEIGHT - BOTTOM_MARGIN - 80;
    if (itemHeight > maxPageItemArea) {
      itemHeight = maxPageItemArea;
    }

    if (currentY + itemHeight > PAGE_HEIGHT - BOTTOM_MARGIN) {
      drawTableLines(tableStartY, PAGE_HEIGHT - BOTTOM_MARGIN);
      doc.addPage();
      currentY = 10;
      drawHeader();
      tableStartY = currentY;
      drawTableHeader();
      doc.setFont('helvetica', 'normal');
    }

    doc.text((itemsProcessed + 1).toString(), 14, currentY + ITEM_TOP_PADDING, { align: 'center' });

    let textY = currentY + ITEM_TOP_PADDING;
    if (titleLines.length > 0) {
      doc.setFont('helvetica', 'bold');
      titleLines.forEach(line => {
        doc.text(line, 20, textY);
        textY += LINE_SPACING;
      });
      doc.setFont('helvetica', 'normal');
      textY += GAP_AFTER_TITLE;
    }

    descLines.forEach(line => {
      doc.text(line, 20, textY);
      textY += LINE_SPACING;
    });

    doc.text((item.hsn || '').toString().substring(0, 8), 102.5, currentY + ITEM_TOP_PADDING, { align: 'center' });
    const taxVal = item.tax ? (item.tax.toString().includes('%') ? item.tax : item.tax + '%') : '';
    doc.text(taxVal.toString().substring(0, 6), 121.5, currentY + ITEM_TOP_PADDING, { align: 'center' });
    doc.text(String(item.qty || '1').substring(0, 8), 134, currentY + ITEM_TOP_PADDING, { align: 'center' });

    let rateStr = Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (rateStr.length > 12) rateStr = rateStr.substring(0, 12);
    doc.text(rateStr, 163, currentY + ITEM_TOP_PADDING, { align: 'right' });

    

    const amt = Number(item.qty || 1) * Number(item.rate || 0);
    let amtStr = amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (amtStr.length > 13) amtStr = amtStr.substring(0, 13);
    doc.text(amtStr, 198, currentY + ITEM_TOP_PADDING, { align: 'right' });

    currentY += itemHeight;
    itemsProcessed++;
  }

  const spaceNeededForFooter = 95;

  if (currentY + spaceNeededForFooter > PAGE_HEIGHT - BOTTOM_MARGIN) {
    drawTableLines(tableStartY, PAGE_HEIGHT - BOTTOM_MARGIN);
    doc.addPage();
    currentY = 10;
    drawHeader();
    tableStartY = currentY;
    drawTableHeader();
  }

  if (currentY < PAGE_HEIGHT - BOTTOM_MARGIN - spaceNeededForFooter) {
    currentY = PAGE_HEIGHT - BOTTOM_MARGIN - spaceNeededForFooter;
  }

  let tableEndY = currentY + 24;
  let footerStartY = tableEndY;

  let ty = currentY;
  doc.setFont('helvetica', 'bold');
  doc.text('Taxable Amount', 88, ty + 6, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  let subtotalStr = subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (subtotalStr.length > 13) subtotalStr = subtotalStr.substring(0, 13);
  doc.text(subtotalStr, 198, ty + 6, { align: 'right' });

  if (gstPercent > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text(`CGST ${halfGst}%`, 88, ty + 12, { align: 'right' });
    doc.text(`SGST ${halfGst}%`, 88, ty + 18, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    let halfGstAmtStr = (gst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (halfGstAmtStr.length > 13) halfGstAmtStr = halfGstAmtStr.substring(0, 13);
    doc.text(halfGstAmtStr, 198, ty + 12, { align: 'right' });
    doc.text(halfGstAmtStr, 198, ty + 18, { align: 'right' });
  }

  drawTableLines(tableStartY, tableEndY);

  doc.line(10, footerStartY, 200, footerStartY);
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 88, footerStartY + 6, { align: 'right' });

  const totalQty = (invoice.items || []).reduce((acc, it) => acc + Number(it.qty || 1), 0);
  let totalQtyStr = totalQty.toString();
  if (totalQtyStr.length > 8) totalQtyStr = totalQtyStr.substring(0, 8);
  doc.text(totalQtyStr, 134, footerStartY + 6, { align: 'center' });

  let totalStr = total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (totalStr.length > 13) totalStr = totalStr.substring(0, 13);
  doc.text(`INR ${totalStr}`, 198, footerStartY + 6, { align: 'right' });
  
  let currentFooterY = footerStartY + 9;
  doc.line(10, currentFooterY, 200, currentFooterY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let amountWords = `Amount Chargeable (in words): INR ${numToWords(Math.floor(total))} Rupees Only. E & O.E`;
  let splitAmountWords = doc.splitTextToSize(amountWords, 185);
  
  let textY = currentFooterY + 5;
  splitAmountWords.forEach(line => {
    doc.text(line, 12, textY);
    textY += 4.5;
  });
  
  currentFooterY += (splitAmountWords.length * 4.5) + 3.5;
  doc.line(10, currentFooterY, 200, currentFooterY);

  doc.setFont('helvetica', 'bold');
  doc.text('Amount Payable:', 140, currentFooterY + 6);
  doc.text(`INR ${totalStr}`, 198, currentFooterY + 6, { align: 'right' });
  
  currentFooterY += 9;
  doc.line(10, currentFooterY, 200, currentFooterY);

  doc.rect(10, currentFooterY, 190, 30);
  doc.line(130, currentFooterY, 130, currentFooterY + 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', 12, currentFooterY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (invoice.termsConditions) {
    let termsLines = doc.splitTextToSize(invoice.termsConditions, 115);
    if (termsLines.length > 6) termsLines = termsLines.slice(0, 6);
    let ty = currentFooterY + 10;
    termsLines.forEach(line => {
      doc.text(line, 12, ty);
      ty += 4;
    });
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const signatureText = `For ${invoice.fromName || 'Beam Signage & Branding Creations'}`;
  const sigLines = doc.splitTextToSize(signatureText, 65);
  let tySig = currentFooterY + 5;
  sigLines.forEach(line => {
    doc.text(line, 198, tySig, { align: 'right' });
    tySig += 4;
  });

  if (invoice.fromSignature) {
    try {
      let sigWidth = 40;
      let sigHeight = 15;
      try {
        const sigProps = doc.getImageProperties(invoice.fromSignature);
        const sigAspect = sigProps.width / sigProps.height;
        const availableHeight = (currentFooterY + 23) - tySig;
        sigHeight = availableHeight > 0 ? availableHeight : 10;
        sigWidth = sigHeight * sigAspect;
        if (sigWidth > 55) {
          sigWidth = 55;
          sigHeight = sigWidth / sigAspect;
        }
      } catch (err) {
        // Fallback dimensions if jsPDF can't parse the header
      }
      
      const availableHeight = (currentFooterY + 23) - tySig;
      const imageY = tySig + (availableHeight - sigHeight) / 2;

      let formatMatch = invoice.fromSignature.match(/^data:image\/([a-zA-Z0-9]+)/i);
      let format = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
      if (format === 'JPG' || format === 'PJPEG') format = 'JPEG';

      doc.addImage(invoice.fromSignature, format, 198 - sigWidth, imageY, sigWidth, sigHeight);
    } catch(e) {}
  }
  
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signatory', 198, currentFooterY + 27, { align: 'right' });

  doc.line(10, footerStartY, 10, currentFooterY + 30);
  doc.line(200, footerStartY, 200, currentFooterY + 30);

  const pageCount = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    if (logoToUse) {
      try {
        let waterW = 160;
        let waterH = 160;
        try {
          let waterProps = doc.getImageProperties(logoToUse);
          const maxWaterDim = 160; // 160mm max width or height
          waterW = maxWaterDim;
          waterH = (waterProps.height * maxWaterDim) / waterProps.width;
          if (waterH > maxWaterDim) {
            waterH = maxWaterDim;
            waterW = (waterProps.width * maxWaterDim) / waterProps.height;
          }
        } catch (err) {}
        
        const waterX = (210 - waterW) / 2;
        const waterY = (PAGE_HEIGHT - waterH) / 2;

        let formatMatch = logoToUse.match(/^data:image\/([a-zA-Z0-9]+)/i);
        let watermarkFormat = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
        if (watermarkFormat === 'JPG' || watermarkFormat === 'PJPEG') watermarkFormat = 'JPEG';

        doc.setGState(new doc.GState({opacity: 0.15}));
        doc.addImage(logoToUse, watermarkFormat, waterX, waterY, waterW, waterH);
        doc.setGState(new doc.GState({opacity: 1}));
      } catch(e) {}
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 105, PAGE_HEIGHT - 6, { align: 'center' });
  }

  if (mode === 'blob') {
    return doc.output('bloburl');
  } else {
    let filename = `${invoice.invoiceNo || 'invoice'}_for_${invoice.clientName || 'customer'}`;
    filename = filename.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
    doc.save(filename);
  }
}
