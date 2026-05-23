const CertificateTemplate = ({
  attendeeName,
  eventTitle,
  eventDate,
  organizerName,
  certificateId,
}) => {
  return (
    <div
      id="certificate-template"
      className="w-[1000px] h-[700px] bg-white border-[14px] border-yellow-700 rounded-xl p-10 flex flex-col justify-between text-center shadow-2xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-5xl font-bold text-yellow-800 tracking-wide">
          eventOne
        </h1>

        <h2 className="text-3xl font-semibold mt-6 text-gray-800">
          Certificate of Participation
        </h2>

        <p className="mt-4 text-gray-600 text-lg">
          This certificate is proudly presented to
        </p>
      </div>

      {/* Participant Name */}
      <div>
        <h1 className="text-6xl font-bold text-blue-900 font-serif">
          {attendeeName}
        </h1>

        <p className="mt-6 text-xl text-gray-700 px-10 leading-relaxed">
          for actively participating in
          <span className="font-bold"> {eventTitle} </span>
          organized by
          <span className="font-bold"> {organizerName} </span>
          on
          <span className="font-bold"> {eventDate}</span>.
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-10">
        <div className="text-left">
          <div className="border-t-2 border-gray-500 w-52 mb-2"></div>
          <p className="font-semibold text-gray-700">Organizer Signature</p>
        </div>

        <div className="text-right">
          <p className="text-gray-500 text-base font-medium">
            Certificate ID: {certificateId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;