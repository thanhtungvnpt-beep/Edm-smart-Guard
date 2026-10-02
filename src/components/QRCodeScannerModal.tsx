import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Maximize2,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  SwitchCamera,
  Upload,
  Video,
  Volume2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { Device } from '../types';
import { soundManager } from '../utils/audio';
import {
  generateMachineQRDataUrl,
  generateMachineQRContent,
  parseScannedMachineQR,
} from '../utils/qrCodeHelper';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onScanSuccess: (device: Device) => void;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  devices,
  onScanSuccess,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'stickers' | 'upload'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [scannedDevice, setScannedDevice] = useState<Device | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [selectedStickerDevice, setSelectedStickerDevice] = useState<Device | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-generate QR data URLs for all devices so they are ready for display/print
  useEffect(() => {
    let isMounted = true;
    const loadQrs = async () => {
      const map: Record<string, string> = {};
      for (const d of devices) {
        map[d.id] = await generateMachineQRDataUrl(d);
      }
      if (isMounted) {
        setQrImages(map);
      }
    };
    loadQrs();
    return () => {
      isMounted = false;
    };
  }, [devices]);

  // Start live webcam scanning loop
  useEffect(() => {
    if (!isOpen || activeMode !== 'camera') {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập máy ảnh (Webcam API)');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        requestScanFrame();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let msg = 'Không thể mở máy ảnh. Vui lòng cấp quyền camera trong cài đặt trình duyệt.';
      if (err.name === 'NotAllowedError') {
        msg = 'Quyền truy cập camera bị từ chối. Bạn có thể sử dụng tab "Thẻ Mã QR Dán Máy" để quét mô phỏng ngay.';
      } else if (err.name === 'NotFoundError') {
        msg = 'Không tìm thấy thiết bị camera trên máy tính của bạn.';
      }
      setCameraError(msg);
      // Auto-fallback to sticker tag gallery for seamless user experience
      setActiveMode('stickers');
    }
  };

  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const requestScanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameIdRef.current = requestAnimationFrame(requestScanFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      handleDetectedCode(code.data);
      return; // Stop scanning once detected
    }

    animationFrameIdRef.current = requestAnimationFrame(requestScanFrame);
  };

  const handleDetectedCode = (rawText: string) => {
    const match = parseScannedMachineQR(rawText, devices);
    if (match) {
      soundManager.playBeep();
      setScannedDevice(match);
      stopCamera();

      // Brief visual confirmation before opening details
      setTimeout(() => {
        onScanSuccess(match);
        onClose();
      }, 700);
    }
  };

  // Switch between front and back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessingFile(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);

        setIsProcessingFile(false);
        if (code && code.data) {
          handleDetectedCode(code.data);
        } else {
          alert('Không tìm thấy mã QR hợp lệ trong ảnh tải lên. Vui lòng thử lại với ảnh rõ nét hơn.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden my-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 font-mono text-sm font-bold text-amber-400">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Quét Mã QR Nhận Diện Máy (Machine QR Scanner)
                </h3>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                  Instant Asset ID
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hướng camera vào tem nhãn dán trên thân máy EDM để mở ngay hồ sơ chẩn đoán
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Đóng cửa sổ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SCANNER MODE TABS */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMode('camera')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeMode === 'camera'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>Camera Trực Tiếp</span>
            </button>

            <button
              onClick={() => setActiveMode('stickers')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeMode === 'stickers'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>Nhãn QR Dán Máy ({devices.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('upload');
                fileInputRef.current?.click();
              }}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeMode === 'upload'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Tải Ảnh Mã QR</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* SCAN SUCCESS CONFIRMATION BANNER */}
        {scannedDevice && (
          <div className="bg-emerald-600 px-5 py-3 text-white flex items-center justify-between animate-in slide-in-from-top-3">
            <div className="flex items-center gap-2.5 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>
                Nhận diện thành công: [{scannedDevice.code}] {scannedDevice.name}!
              </span>
            </div>
            <span className="text-xs font-mono bg-emerald-700/60 px-2 py-1 rounded">
              Đang mở hồ sơ...
            </span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 1. CAMERA SCANNER VIEW */}
          {activeMode === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-6 text-center space-y-3">
                  <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Không thể kết nối máy ảnh trực tiếp</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    {cameraError}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveMode('stickers')}
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition"
                    >
                      Mở Thư Viện Tem Nhãn Dán Máy
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
                    >
                      Tải Ảnh QR Từ Thư Viện Ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-video max-h-[360px] mx-auto rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-2xl">
                  {/* Camera Video Stream */}
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />

                  {/* Hidden Canvas for QR Code Frame Processing */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Viewfinder Reticle Target */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      {/* Corner Accents */}
                      <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg"></span>
                      <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg"></span>
                      <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg"></span>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg"></span>

                      {/* Animated Laser Scanning Line */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-bounce"></div>
                    </div>
                  </div>

                  {/* Live Overlay Controls */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Đang rà quét mã QR... Căn chỉnh tem nhãn vào khung</span>
                    </div>

                    <button
                      onClick={toggleFacingMode}
                      className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-200 transition"
                      title="Đổi camera trước / sau"
                    >
                      <SwitchCamera className="h-3.5 w-3.5" />
                      <span>Đổi Cam</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Mẹo kỹ thuật:</strong> Giữ camera cách tem nhãn máy khoảng 15-25cm ở nơi có ánh sáng tốt. Bạn cũng có thể bấm vào tab <strong>"Nhãn QR Dán Máy"</strong> bên cạnh để kiểm tra tem QR của từng máy.
                </span>
              </div>
            </div>
          )}

          {/* 2. PHYSICAL STICKER GALLERY (Quick Simulator & Print Sticker Viewer) */}
          {(activeMode === 'stickers' || activeMode === 'upload') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Tem Mã QR Nhận Diện Vật Lý Dán Trên Thân Máy EDM
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Bấm vào bất kỳ tem nhãn nào dưới đây để mô phỏng quét thực tế tại xưởng
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition"
                >
                  <Printer className="h-3.5 w-3.5 text-amber-400" />
                  <span>In Tem Nhãn</span>
                </button>
              </div>

              {/* Grid of Industrial Asset Tag QR Stickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {devices.map((device) => {
                  const qrUrl = qrImages[device.id];
                  return (
                    <div
                      key={device.id}
                      onClick={() => handleDetectedCode(generateMachineQRContent(device))}
                      className="group rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3.5 hover:border-amber-500/80 hover:shadow-xl hover:shadow-amber-500/10 transition cursor-pointer relative overflow-hidden"
                    >
                      {/* Top Asset Sticker Badge */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-6 px-2 flex items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/30 font-mono text-xs font-extrabold text-amber-400">
                            {device.code}
                          </span>
                          <span className="font-bold text-white text-xs truncate max-w-[140px]">
                            {device.name}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          ASSET TAG
                        </span>
                      </div>

                      {/* Content: QR Code & Specs */}
                      <div className="flex items-center gap-3">
                        {/* High-res QR code image with white border for contrast */}
                        <div className="shrink-0 p-1.5 bg-white rounded-xl shadow-md border border-slate-300">
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt={`Mã QR ${device.code}`}
                              className="h-20 w-20 object-contain"
                            />
                          ) : (
                            <div className="h-20 w-20 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                              Tạo QR...
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 text-xs space-y-1">
                          <p className="text-slate-300 font-medium truncate">
                            Model: <strong className="text-white">{device.model}</strong>
                          </p>
                          <p className="text-slate-400 truncate">
                            Hãng SX: <span className="text-slate-200">{device.brand}</span>
                          </p>
                          <p className="text-slate-400 truncate">
                            Vị trí: <span className="text-slate-200">{device.location}</span>
                          </p>

                          <div className="pt-1 flex items-center gap-1.5 text-amber-400 group-hover:text-amber-300 font-bold text-[11px]">
                            <Zap className="h-3 w-3" />
                            <span>Bấm để quét nhãn này →</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-5 py-3 text-xs">
          <span className="text-slate-400">
            Hỗ trợ chuẩn QR Code công nghiệp ISO/IEC 18004
          </span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-semibold text-white transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
