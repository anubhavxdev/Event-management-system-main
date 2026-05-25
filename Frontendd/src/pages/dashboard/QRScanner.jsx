import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { API_BASE_URL } from '../../config';

export default function QRScanner() {
  const [feedback, setFeedback] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let scanner;

    const startScanner = async () => {
      try {
        scanner = new Html5QrcodeScanner(
          'reader',
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
            rememberLastUsedCamera: true,
            supportedScanTypes: [0],
          },
          false
        );

        scanner.render(
          async (decodedText) => {
            if (feedback) return;
            try {
              const parsed = JSON.parse(decodedText);

              console.log('Scanned QR:', parsed);

              const token = localStorage.getItem('token');

              const response = await fetch(
                `${API_BASE_URL}/api/registrations/${parsed.eventId}/checkin`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    userId: parsed.userId,
                  }),
                }
              );

              const data = await response.json();

              console.log(data);

              if (response.ok) {
                setFeedback({
                  type: 'success',
                  message:
                    data.attendeeName
                      ? `${data.attendeeName} checked in successfully`
                      : 'Check-in successful',
                });
              
              } else if (
                data.message === 'Attendee already checked in'
              ) {
              
                setFeedback({
                  type: 'warning',
                  message: data.message,
                });
              
              } else {
              
                setFeedback({
                  type: 'error',
                  message: data.message || 'Check-in failed',
                });
              
              }

              // pause repeated scans briefly
              scanner.pause(true);

              setTimeout(() => {
                setFeedback(null);
                scanner.resume();
              }, 2000);

            } catch (err) {
              console.error(err);

              setFeedback({
                type: 'error',
                message: 'Invalid QR Code',
              });
            }
          },
          () => {}
        );
      } catch (err) {
        console.error('Scanner error:', err);
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);

      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background pt-24 px-4">

      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-10">

          <div className="inline-flex items-center px-4 py-2 rounded-full border border-green-500/20 bg-green-500/10 text-green-500 text-sm font-medium mb-5">
            Live Event Check-In
          </div>

          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Smart QR Scanner
          </h1>

          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Quickly verify attendees by scanning event tickets in real-time.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">

          <div className="grid lg:grid-cols-2">

            {/* LEFT */}
            <div className="p-8 lg:p-10 flex flex-col justify-center">

              <h2 className="text-3xl font-bold mb-5">
                Event Entry Verification
              </h2>

              <p className="text-muted-foreground leading-relaxed mb-8">
                Use your camera to scan attendee QR tickets.
                Successful scans instantly validate registration
                and streamline entry management.
              </p>

              <div className="space-y-5">

                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-full bg-purple-500/10 flex items-center justify-center text-xl">
                    ⚡
                  </div>

                  <div>
                    <h4 className="font-semibold">
                      Fast Check-In
                    </h4>

                    <p className="text-sm text-muted-foreground">
                      Admit attendees within seconds.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-full bg-pink-500/10 flex items-center justify-center text-xl">
                    🔒
                  </div>

                  <div>
                    <h4 className="font-semibold">
                      Secure Validation
                    </h4>

                    <p className="text-sm text-muted-foreground">
                      Prevent unauthorized access.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-full bg-blue-500/10 flex items-center justify-center text-xl">
                    📱
                  </div>

                  <div>
                    <h4 className="font-semibold">
                      Mobile Ready
                    </h4>

                    <p className="text-sm text-muted-foreground">
                      Works on phones, tablets, and desktops.
                    </p>
                  </div>
                </div>

              </div>

              {/* Feedback */}
              {feedback && (
                <div
                className={`mt-10 p-4 rounded-2xl border text-sm font-medium ${
                  feedback.type === 'success'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : feedback.type === 'warning'
                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}
                >
                  {feedback.message}
                </div>
              )}

            </div>

            {/* RIGHT */}
            <div className="p-6 lg:p-8 flex items-center justify-center bg-black">

              <div className="w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden border border-white/10">

                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>

                  <span className="text-xs text-gray-400">
                    Event.One Scanner
                  </span>
                </div>

                <div className="p-4">

                  <div
                    id="reader"
                    className="rounded-2xl overflow-hidden"
                  />

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>
        {`
          #reader {
            border: none !important;
            background: black !important;
          }

          #reader video {
            border-radius: 1rem !important;
          }

          #reader__dashboard_section_swaplink {
            display: none !important;
          }

          #reader__scan_region img {
            display: none !important;
          }

          #reader__scan_region {
            min-height: auto !important;
          }

          #reader__dashboard {
            padding: 0 !important;
            border: none !important;
          }
        `}
      </style>

    </div>
  );
}