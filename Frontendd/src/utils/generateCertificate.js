import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generateCertificate = async ({
  attendeeName,
  eventTitle,
  eventDate,
  organizerName,
  registrationId,
}) => {
  const certificateElement = document.createElement("div");

  certificateElement.style.position = "fixed";
  certificateElement.style.left = "-9999px";
  certificateElement.style.top = "0";

  document.body.appendChild(certificateElement);

  const certificateId = `CERT-${registrationId
    .slice(-8)
    .toUpperCase()}`;

  const ReactDOM = await import("react-dom/client");
  const React = await import("react");
  const CertificateTemplate = (
    await import("../components/certificates/CertificateTemplate")
  ).default;

  const root = ReactDOM.createRoot(certificateElement);

  root.render(
    React.createElement(CertificateTemplate, {
      attendeeName,
      eventTitle,
      eventDate,
      organizerName,
      certificateId,
    })
  );

  await new Promise((resolve) => setTimeout(resolve, 500));

  const canvas = await html2canvas(
    certificateElement.querySelector("#certificate-template"),
    {
      scale: 2,
      useCORS: true,
    }
  );

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("landscape", "px", [1000, 700]);

  pdf.addImage(imgData, "PNG", 0, 0, 1000, 700);

  pdf.save(
    `certificate-${eventTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`
  );

  root.unmount();
  document.body.removeChild(certificateElement);
};