import QRCode from 'qrcode';

export async function generateQRCodeDataUrl(text) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M' });
}


