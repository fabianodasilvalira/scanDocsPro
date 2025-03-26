"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Camera, FlipHorizontal, Lightbulb, ZoomIn, ZoomOut, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"

export default function ScanCamera() {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt">("prompt")
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [flashActive, setFlashActive] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [documentCorners, setDocumentCorners] = useState<{ x: number; y: number }[] | null>(null)
  const [documentDetected, setDocumentDetected] = useState(false)
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true)
  const [documentType, setDocumentType] = useState<"auto" | "a4" | "id" | "receipt">("auto")
  const [detectionConfidence, setDetectionConfidence] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize camera
  useEffect(() => {
    let mounted = true

    const initCamera = async () => {
      try {
        // Check if camera permissions are available
        const permissionStatus = await navigator.permissions.query({ name: "camera" as PermissionName })
        setCameraPermission(permissionStatus.state as "granted" | "denied" | "prompt")

        if (permissionStatus.state === "denied") {
          toast({
            title: "Acesso à câmera negado",
            description: "Por favor, permita o acesso à câmera nas configurações do seu navegador.",
            variant: "destructive",
          })
          return
        }

        // Request camera access with highest possible resolution
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 3840 }, // 4K
            height: { ideal: 2160 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

        if (mounted) {
          setStream(mediaStream)

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
            await videoRef.current.play()

            // Start document detection after camera is initialized
            if (autoDetectEnabled) {
              startDocumentDetection()
            }
          }

          setCameraPermission("granted")
        }
      } catch (error) {
        console.error("Error accessing camera:", error)

        if (mounted) {
          setCameraPermission("denied")
          toast({
            title: "Erro ao acessar a câmera",
            description: "Verifique se seu dispositivo tem uma câmera e se você concedeu permissão para usá-la.",
            variant: "destructive",
          })
        }
      }
    }

    initCamera()

    // Cleanup function
    return () => {
      mounted = false
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [facingMode, toast, autoDetectEnabled])

  // Document detection simulation
  const startDocumentDetection = () => {
    if (!videoRef.current || !detectionCanvasRef.current) return

    const video = videoRef.current
    const canvas = detectionCanvasRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    let animationFrameId: number
    let lastDetectionTime = 0
    const detectionInterval = 200 // ms - faster detection
    let stabilityCounter = 0
    let lastCorners: { x: number; y: number }[] | null = null

    const detectDocument = (timestamp: number) => {
      if (!video || !ctx) return

      // Only run detection every detectionInterval ms
      if (timestamp - lastDetectionTime > detectionInterval) {
        lastDetectionTime = timestamp

        // Set canvas size to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // In a real app, we would use computer vision to detect document edges
        // For this demo, we'll simulate detection with improved stability

        const width = canvas.width
        const height = canvas.height

        // Get document dimensions based on selected type
        let docAspectRatio = 1.414 // Default A4 aspect ratio
        let docWidthPercent = 0.7

        if (documentType === "id") {
          docAspectRatio = 1.586 // ID card aspect ratio
          docWidthPercent = 0.6
        } else if (documentType === "receipt") {
          docAspectRatio = 0.4 // Receipt aspect ratio (tall and narrow)
          docWidthPercent = 0.5
        }

        // Calculate document dimensions
        const docWidth = width * docWidthPercent
        const docHeight = docWidth / docAspectRatio

        // Center position
        const centerX = width / 2
        const centerY = height / 2

        // Create a rectangle with some random variation to simulate perspective
        // But make it more stable by using smaller jitter values
        const jitterAmount = Math.min(width, height) * 0.02 * (1 - detectionConfidence / 100)

        // Generate corners with controlled randomness for stability
        const newCorners = [
          {
            x: centerX - docWidth / 2 + Math.random() * jitterAmount,
            y: centerY - docHeight / 2 + Math.random() * jitterAmount,
          },
          {
            x: centerX + docWidth / 2 - Math.random() * jitterAmount,
            y: centerY - docHeight / 2 + Math.random() * jitterAmount,
          },
          {
            x: centerX - docWidth / 2 + Math.random() * jitterAmount,
            y: centerY + docHeight / 2 - Math.random() * jitterAmount,
          },
          {
            x: centerX + docWidth / 2 - Math.random() * jitterAmount,
            y: centerY + docHeight / 2 - Math.random() * jitterAmount,
          },
        ]

        // Check if corners are stable (similar to previous detection)
        let cornersAreStable = false
        if (lastCorners) {
          const maxDiff = Math.min(width, height) * 0.01
          cornersAreStable = newCorners.every((corner, i) => {
            if (!lastCorners) return false
            const dx = Math.abs(corner.x - lastCorners[i].x)
            const dy = Math.abs(corner.y - lastCorners[i].y)
            return dx < maxDiff && dy < maxDiff
          })
        }

        // Increase stability counter if corners are stable
        if (cornersAreStable) {
          stabilityCounter++
          // Increase confidence as stability increases
          setDetectionConfidence(Math.min(100, stabilityCounter * 5))
        } else {
          stabilityCounter = Math.max(0, stabilityCounter - 1)
          setDetectionConfidence(Math.max(0, detectionConfidence - 5))
        }

        // Set document as detected if stability is high enough
        if (stabilityCounter > 10) {
          setDocumentDetected(true)
          setDocumentCorners(newCorners)
        } else {
          setDocumentDetected(false)
        }

        lastCorners = newCorners
      }

      // Continue detection loop
      animationFrameId = requestAnimationFrame(detectDocument)
    }

    // Start detection loop
    animationFrameId = requestAnimationFrame(detectDocument)

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }

  // Handle camera flip
  const toggleCamera = async () => {
    // Stop current stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    // Toggle facing mode
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  // Handle flash toggle (only works on supported devices)
  const toggleFlash = async () => {
    if (!stream) return

    try {
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()

      // Check if torch is supported
      if (capabilities.torch) {
        const newFlashState = !flashActive
        await track.applyConstraints({
          advanced: [{ torch: newFlashState }],
        })
        setFlashActive(newFlashState)
      } else {
        toast({
          title: "Flash não suportado",
          description: "Seu dispositivo não suporta controle de flash via navegador.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error toggling flash:", error)
    }
  }

  // Handle zoom
  const handleZoom = (direction: "in" | "out") => {
    if (!stream) return

    try {
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()

      // Check if zoom is supported
      if (capabilities.zoom) {
        const min = capabilities.zoom.min || 1
        const max = capabilities.zoom.max || 10
        const step = (max - min) / 10

        let newZoom = zoomLevel
        if (direction === "in") {
          newZoom = Math.min(max, zoomLevel + step)
        } else {
          newZoom = Math.max(min, zoomLevel - step)
        }

        track.applyConstraints({
          advanced: [{ zoom: newZoom }],
        })

        setZoomLevel(newZoom)
      }
    } catch (error) {
      console.error("Error adjusting zoom:", error)
    }
  }

  // Change document type preset
  const changeDocumentType = (type: "auto" | "a4" | "id" | "receipt") => {
    setDocumentType(type)
    setDocumentDetected(false)
    setDetectionConfidence(0)
    setDocumentCorners(null)

    toast({
      title: `Modo: ${type === "auto" ? "Automático" : type === "a4" ? "Documento A4" : type === "id" ? "Documento de Identidade" : "Recibo"}`,
      description: "Posicione o documento na área de captura",
      variant: "default",
    })
  }

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      toast({
        title: "Erro ao capturar imagem",
        description: "A câmera não está pronta. Tente novamente.",
        variant: "destructive",
      })
      return
    }

    setIsCapturing(true)

    // Parar o stream da câmera imediatamente para economizar recursos
    const tracks = stream.getTracks()

    // Capture the photo
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (context) {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Store document corners if detected
      const documentData = {
        corners: documentCorners,
        detected: documentDetected,
        type: documentType,
        originalWidth: canvas.width,
        originalHeight: canvas.height,
      }

      // Convert to image data URL
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95)

      // Store in sessionStorage for the edit page
      sessionStorage.setItem("capturedImage", imageDataUrl)
      sessionStorage.setItem("documentData", JSON.stringify(documentData))

      // If we have a photo element, show the captured image
      if (photoRef.current) {
        photoRef.current.src = imageDataUrl
        photoRef.current.style.display = "block"
      }

      // Simulate capture progress
      let progress = 0
      const interval = setInterval(() => {
        progress += 20 // Faster progress
        setCaptureProgress(progress)

        if (progress >= 100) {
          clearInterval(interval)

          // Stop camera stream before navigating
          tracks.forEach((track) => track.stop())

          // Navigate to review page after a short delay
          setTimeout(() => {
            router.push("/scan/review")
          }, 300)
        }
      }, 100)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center p-4 bg-black/80 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (stream) {
              stream.getTracks().forEach((track) => track.stop())
            }
            router.push("/scan/start")
          }}
          className="mr-4 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-white">Digitalizar Documento</h1>
          <p className="text-sm text-gray-300">Posicione o documento na área de captura</p>
        </div>
      </div>

      <div className="relative flex-1 w-full bg-black overflow-hidden">
        {cameraPermission === "prompt" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
            <div className="text-center p-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
              <p>Iniciando câmera...</p>
              <p className="text-sm mt-2 text-gray-400">Permita o acesso à câmera quando solicitado</p>
            </div>
          </div>
        )}

        {cameraPermission === "denied" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
            <div className="text-center p-4">
              <p className="text-red-400 font-bold mb-2">Acesso à câmera negado</p>
              <p className="text-sm mb-4">Para usar o scanner, você precisa permitir o acesso à câmera.</p>
              <Button onClick={() => router.push("/scan/start")} variant="outline" className="border-gray-600">
                Voltar
              </Button>
            </div>
          </div>
        )}

        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />

        <canvas ref={canvasRef} className="hidden" />

        <canvas ref={detectionCanvasRef} className="hidden" />

        <img ref={photoRef} className="hidden absolute inset-0 w-full h-full object-cover" alt="Captured document" />

        {/* Document detection overlay */}
        {cameraPermission === "granted" && !isCapturing && (
          <div className="absolute inset-0 pointer-events-none">
            {documentDetected && documentCorners ? (
              <svg className="absolute inset-0 w-full h-full">
                <polygon
                  points={documentCorners.map((corner) => `${corner.x},${corner.y}`).join(" ")}
                  fill="rgba(0, 255, 0, 0.1)"
                  stroke="#00ff00"
                  strokeWidth="3"
                />
              </svg>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-md transition-all duration-300",
                    documentType === "a4"
                      ? "w-[70%] h-[85%]"
                      : documentType === "id"
                        ? "w-[60%] h-[40%]"
                        : documentType === "receipt"
                          ? "w-[40%] h-[80%]"
                          : "w-[85%] h-[85%]",
                    detectionConfidence > 50 ? "border-yellow-400" : "border-white/50",
                  )}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Capture progress overlay */}
        {isCapturing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-blue-500 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">{captureProgress}%</div>
                <div className="text-xs text-blue-300">Digitalizando</div>
              </div>
            </div>
          </div>
        )}

        {/* Camera controls */}
        {cameraPermission === "granted" && !isCapturing && (
          <>
            {/* Document detection status */}
            <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {documentDetected ? (
                <span className="flex items-center text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                  Documento detectado
                </span>
              ) : detectionConfidence > 50 ? (
                <span className="flex items-center text-yellow-400">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                  Quase lá...
                </span>
              ) : (
                <span className="flex items-center text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                  Procurando documento...
                </span>
              )}
            </div>

            {/* Document type selector */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                size="sm"
                variant={documentType === "auto" ? "default" : "outline"}
                className={documentType === "auto" ? "bg-blue-600" : "bg-black/60 text-white border-gray-600"}
                onClick={() => changeDocumentType("auto")}
              >
                Auto
              </Button>
              <Button
                size="sm"
                variant={documentType === "a4" ? "default" : "outline"}
                className={documentType === "a4" ? "bg-blue-600" : "bg-black/60 text-white border-gray-600"}
                onClick={() => changeDocumentType("a4")}
              >
                A4
              </Button>
              <Button
                size="sm"
                variant={documentType === "id" ? "default" : "outline"}
                className={documentType === "id" ? "bg-blue-600" : "bg-black/60 text-white border-gray-600"}
                onClick={() => changeDocumentType("id")}
              >
                ID
              </Button>
            </div>

            {/* Right side controls */}
            <div className="absolute bottom-24 right-4 flex flex-col space-y-2">
              <button
                className="h-12 w-12 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                onClick={toggleCamera}
              >
                <FlipHorizontal className="h-6 w-6" />
              </button>

              <button
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center text-white transition-colors",
                  flashActive ? "bg-yellow-500/80" : "bg-black/60 hover:bg-black/80",
                )}
                onClick={toggleFlash}
              >
                <Lightbulb className="h-6 w-6" />
              </button>

              <button
                className="h-12 w-12 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                onClick={() => handleZoom("in")}
              >
                <ZoomIn className="h-6 w-6" />
              </button>

              <button
                className="h-12 w-12 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                onClick={() => handleZoom("out")}
              >
                <ZoomOut className="h-6 w-6" />
              </button>
            </div>

            {/* Confidence indicator */}
            {detectionConfidence > 0 && (
              <div className="absolute bottom-24 left-4 right-24 flex flex-col">
                <div className="flex justify-between text-xs text-white mb-1">
                  <span>Estabilidade</span>
                  <span>{detectionConfidence}%</span>
                </div>
                <Progress
                  value={detectionConfidence}
                  className="h-1 bg-gray-700"
                  indicatorClassName={cn(
                    detectionConfidence < 30
                      ? "bg-red-500"
                      : detectionConfidence < 70
                        ? "bg-yellow-500"
                        : "bg-green-500",
                  )}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom controls */}
      <div className="p-4 bg-black flex justify-center">
        <Button
          size="lg"
          className={cn(
            "rounded-full h-16 w-16 p-0 flex items-center justify-center",
            documentDetected ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600",
          )}
          disabled={isCapturing || cameraPermission !== "granted"}
          onClick={capturePhoto}
        >
          {documentDetected ? <Check className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
        </Button>
      </div>

      {/* Tips */}
      <div className="p-4 bg-black text-white">
        <div className="bg-gray-800/80 rounded-lg p-3 text-sm max-w-md mx-auto">
          <h3 className="font-medium text-white mb-2">Dicas:</h3>
          <ul className="space-y-1 list-disc pl-5 text-gray-300">
            <li>Posicione o documento dentro da área demarcada</li>
            <li>Certifique-se de que há boa iluminação</li>
            <li>Mantenha a câmera estável durante a captura</li>
            <li>Selecione o tipo de documento para melhor detecção</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

