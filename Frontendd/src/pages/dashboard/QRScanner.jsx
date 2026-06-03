import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { API_BASE_URL } from '../../config';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  History, 
  User, 
  ArrowLeft, 
  Camera 
} from 'lucide-react';

export default function QRScanner() {
  const [feedback, setFeedback] = useState(null);
  const [flashEffect, setFlashEffect] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const navigate = useNavigate();
  const { eventId } = useParams();

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
            // Avoid processing new scans if active feedback is showing
            if (feedback) return;
            
            let parsed;
            try {
              parsed = JSON.parse(decodedText);
            } catch (err) {
              console.error('QR Parse Error:', err);
              triggerFeedback({
                type: 'error',
                message: 'Invalid Ticket QR Format',
                attendeeName: 'Unknown Ticket'
              });
              return;
            }

            console.log('Scanned QR:', parsed);
            const token = localStorage.getItem('token');

            try {
              // Ensure we scan the ticket for the correct active event
              const targetEventId = parsed.eventId || eventId;
              
              const response = await fetch(
                `${API_BASE_URL}/api/registrations/${targetEventId}/checkin`,
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
              console.log('Server response:', data);

              if (response.ok) {
                triggerFeedback({
                  type: 'success',
                  message: 'Checked in successfully',
                  attendeeName: data.attendeeName || 'Attendee'
                });
              } else if (response.status === 400 && data.message === 'Attendee already checked in') {
                triggerFeedback({
                  type: 'warning',
                  message: 'Ticket already used',
                  attendeeName: data.attendeeName || 'Attendee'
                });
              } else {
                triggerFeedback({
                  type: 'error',
                  message: data.message || 'Check-in failed',
                  attendeeName: data.attendeeName || 'Ticket Holder'
                });
              }
            } catch (err) {
              console.error('Fetch error:', err);
              triggerFeedback({
                type: 'error',
                message: 'Server connection error',
                attendeeName: 'Ticket Holder'
              });
            }

            // Pause scanner for verification duration
            scanner.pause(true);

            setTimeout(() => {
              setFeedback(null);
              setFlashEffect(null);
              scanner.resume();
            }, 2500);
          },
          () => {}
        );
      } catch (err) {
        console.error('Scanner init error:', err);
      }
    };

    const triggerFeedback = (result) => {
      setFeedback(result);
      setFlashEffect(result.type);
      
      // Update check-in logs
      setRecentScans((prev) => [
        {
          id: Date.now(),
          name: result.attendeeName,
          status: result.type,
          message: result.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 4),
      ]);
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch((e) => console.error('Scanner cleanup error:', e));
      }
    };
  }, [eventId, feedback]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Live Verification Active
          </div>
        </div>

        {/* Heading text */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
            Ticket Entry Scanner
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-base">
            Scan secure QR tickets on mobile or desktop cameras to automatically process checks and sync event attendance.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Scanner Panel */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                Live Camera Stream
              </h2>

              {/* Viewport Frame with Status border flash effect */}
              <div 
                className={`relative rounded-2xl overflow-hidden bg-black aspect-square max-w-md mx-auto transition-all duration-300 border-8 ${
                  flashEffect === 'success' 
                    ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                    : flashEffect === 'warning' 
                    ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' 
                    : flashEffect === 'error' 
                    ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                    : 'border-white/5'
                }`}
              >
                <div id="reader" className="w-full h-full" />
                
                {/* Visual Overlay Banner */}
                {feedback && (
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-black/80 backdrop-blur-md border-t border-white/10 flex items-center gap-3 animate-slide-up">
                    {feedback.type === 'success' && <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" />}
                    {feedback.type === 'warning' && <AlertTriangle className="w-8 h-8 text-yellow-400 shrink-0" />}
                    {feedback.type === 'error' && <XCircle className="w-8 h-8 text-red-400 shrink-0" />}
                    
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold truncate text-white">
                        {feedback.attendeeName}
                      </h4>
                      <p className={`text-xs ${
                        feedback.type === 'success' ? 'text-green-400' :
                        feedback.type === 'warning' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {feedback.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Validation Stats & Log Feed */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Instruction Panel */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <h3 className="text-base font-bold mb-3">Validation Protocol</h3>
              <ul className="text-xs text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">1.</span>
                  Hold the attendee's ticket QR code centered in front of the camera.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">2.</span>
                  Ensure adequate lighting; avoid screen reflections on scanned phones.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">3.</span>
                  Green frames confirm entry. Yellow indicates duplicate ticket warnings.
                </li>
              </ul>
            </div>

            {/* Check-In History Log */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col min-h-[320px]">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
                <History className="w-5 h-5 text-blue-400" />
                Recent Scans Log
              </h2>

              <div className="flex-1 space-y-3 overflow-y-auto max-h-[260px] pr-1">
                {recentScans.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <History className="w-10 h-10 text-white/10 mb-3" />
                    <p className="text-sm text-gray-500">No tickets scanned yet</p>
                  </div>
                ) : (
                  recentScans.map((scan) => (
                    <div 
                      key={scan.id} 
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                          scan.status === 'success' ? 'bg-green-500/10 text-green-400' :
                          scan.status === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-200 truncate">{scan.name}</h4>
                          <p className="text-xs text-gray-400 truncate">{scan.message}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-500 block font-mono">{scan.time}</span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                          scan.status === 'success' ? 'text-green-400' :
                          scan.status === 'warning' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {scan.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>
        {`
          #reader {
            border: none !important;
            background: #000 !important;
          }

          #reader video {
            border-radius: 1rem !important;
            object-fit: cover !important;
            width: 100% !important;
            height: 100% !important;
          }

          #reader__dashboard_section_swaplink,
          #reader__scan_region img,
          #reader__dashboard_section_swaplink button {
            display: none !important;
          }

          #reader__scan_region {
            min-height: auto !important;
          }

          #reader__dashboard {
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
          }
          
          #html5-qrcode-button-camera-start,
          #html5-qrcode-button-camera-stop {
            background-color: rgb(147, 51, 234) !important;
            color: white !important;
            border-radius: 0.75rem !important;
            padding: 0.5rem 1.25rem !important;
            font-weight: 600 !important;
            font-size: 0.875rem !important;
            border: none !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
          }
          #html5-qrcode-button-camera-start:hover,
          #html5-qrcode-button-camera-stop:hover {
            background-color: rgb(126, 34, 206) !important;
          }

          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .animate-slide-up {
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>
    </div>
  );
}