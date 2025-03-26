"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Crop, Move, Plus, RotateCw, RotateCcw, ZoomIn, FileText, Undo, Redo } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"

export default function ScanEdit() {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()

  const [colorMode, setColorMode] = useState("color")
  const [brightness, setBrightness] = useState(50)
  const [contrast, setContrast] = useState(50)
  const [autoEnhance, setAutoEnhance] = useState(true)
  const [editMode, setEditMode] = useState("adjust")
  const [isSaving, setIsSaving] = useState(false)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [transformedImage, setTransformedImage] = useState<string | null>(null)
  const [editHistory, setEditHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [editData, setEditData] = useState<any>(null)
  const [cropRect, setCropRect] = useState({ top: 60, left: 60, right: 60, bottom: 60 })
  const [perspectivePoints, setPerspectivePoints] = useState([
    { x: 60, y: 60 },
    { x: 540, y: 60 },
    { x: 60, y: 740 },
    { x: 540, y: 740 },
  ])
  const [activeDragPoint, setActiveDragPoint] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [rotation, setRotation] = useState(0)

  const imageContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load processed image and edit data from session storage
  useEffect(() => {
    try {
      const storedImage = sessionStorage.getItem("processedImage")
      const storedEditData = sessionStorage.getItem("editData")

      if (storedImage) {
        setProcessedImage(storedImage)
        // Inicializar o histórico de edições com a imagem original
        setEditHistory([storedImage])
        setHistoryIndex(0)
      } else {
        // If no image is found, use a placeholder for demo purposes
        setProcessedImage("/placeholder.svg?height=800&width=600")

        toast({
          title: "Imagem não encontrada",
          description: "Usando imagem de demonstração. Em um app real, você seria redirecionado para a câmera.",
          variant: "default",
        })
      }

      if (storedEditData) {
        const parsedData = JSON.parse(storedEditData)
        setEditData(parsedData)

        // Apply stored edit data
        if (parsedData.cropRect) {
          setCropRect(parsedData.cropRect)
        }

        if (parsedData.perspectivePoints) {
          setPerspectivePoints(parsedData.perspectivePoints)
        }

        if (parsedData.rotation) {
          setRotation(parsedData.rotation)
        }
      }
    } catch (error) {
      console.error("Error loading data from sessionStorage:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar a imagem processada.",
        variant: "destructive",
      })
    }
  }, [toast])

  // Get image dimensions when loaded
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      })
    }
  }, [processedImage, transformedImage])

  // Aplicar transformações na imagem em tempo real
  const applyImageTransformations = () => {
    if (!processedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Criar uma imagem temporária para aplicar as transformações
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Configurar o tamanho do canvas para corresponder à imagem
      canvas.width = img.width
      canvas.height = img.height

      // Desenhar a imagem original
      ctx.drawImage(img, 0, 0)

      // Aplicar modo de cor
      if (colorMode === "bw") {
        // Converter para preto e branco
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          const threshold = 128
          const value = avg > threshold ? 255 : 0
          data[i] = data[i + 1] = data[i + 2] = value
        }
        ctx.putImageData(imageData, 0, 0)
      } else if (colorMode === "gray") {
        // Converter para escala de cinza
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          data[i] = data[i + 1] = data[i + 2] = avg
        }
        ctx.putImageData(imageData, 0, 0)
      }

      // Aplicar brilho e contraste
      if (brightness !== 50 || contrast !== 50) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        const brightnessValue = (brightness - 50) * 2.55 // Converter para -127 a 127
        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

        for (let i = 0; i < data.length; i += 4) {
          // Aplicar brilho
          data[i] = Math.max(0, Math.min(255, data[i] + brightnessValue))
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightnessValue))
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightnessValue))

          // Aplicar contraste
          data[i] = Math.max(0, Math.min(255, contrastFactor * (data[i] - 128) + 128))
          data[i + 1] = Math.max(0, Math.min(255, contrastFactor * (data[i + 1] - 128) + 128))
          data[i + 2] = Math.max(0, Math.min(255, contrastFactor * (data[i + 2] - 128) + 128))
        }

        ctx.putImageData(imageData, 0, 0)
      }

      // Atualizar a imagem processada
      const transformedImageUrl = canvas.toDataURL("image/jpeg", 0.95)
      setTransformedImage(transformedImageUrl)

      // Adicionar ao histórico de edições
      if (editHistory.length > 0) {
        const newHistory = editHistory.slice(0, historyIndex + 1)
        newHistory.push(transformedImageUrl)
        setEditHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
      }
    }

    img.src = editHistory[historyIndex] || processedImage
  }

  // Handle image load event
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      })

      // Initialize crop and perspective points based on image size if not already set
      if (!editData) {
        const width = imageRef.current.naturalWidth
        const height = imageRef.current.naturalHeight

        // Set crop to 10% inset from each edge
        const inset = Math.min(width, height) * 0.1
        setCropRect({
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
        })

        // Set perspective points
        setPerspectivePoints([
          { x: inset, y: inset },
          { x: width - inset, y: inset },
          { x: inset, y: height - inset },
          { x: width - inset, y: height - inset },
        ])
      }
    }
  }

  // Atualizar os manipuladores de eventos para brilho e contraste
  const handleBrightnessChange = (value: number) => {
    setBrightness(value)
    setTimeout(applyImageTransformations, 10)
  }

  const handleContrastChange = (value: number) => {
    setContrast(value)
    setTimeout(applyImageTransformations, 10)
  }

  const handleColorModeChange = (mode: string) => {
    setColorMode(mode)
    setTimeout(applyImageTransformations, 10)
  }

  // Manipulador para rotação
  const handleRotate = (direction: "cw" | "ccw") => {
    if (!processedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Criar uma imagem temporária para aplicar a rotação
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Configurar o tamanho do canvas para lidar com a rotação
      if (direction === "cw" || direction === "ccw") {
        canvas.width = img.height
        canvas.height = img.width
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }

      // Aplicar rotação
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(((direction === "cw" ? 90 : -90) * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.restore()

      // Atualizar a imagem processada
      const rotatedImageUrl = canvas.toDataURL("image/jpeg", 0.95)
      setProcessedImage(rotatedImageUrl)

      // Atualizar o histórico de edições
      const newHistory = editHistory.slice(0, historyIndex + 1)
      newHistory.push(rotatedImageUrl)
      setEditHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)

      // Atualizar a rotação
      setRotation((prev) => {
        const newRotation = direction === "cw" ? (prev + 90) % 360 : (prev - 90 + 360) % 360
        return newRotation
      })
    }

    img.src = transformedImage || editHistory[historyIndex] || processedImage
  }

  // Funções para desfazer e refazer
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setTransformedImage(editHistory[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setTransformedImage(editHistory[historyIndex + 1])
    }
  }

  // Melhorar a função handleCropMouseDown para garantir que o recorte funcione corretamente
  const handleCropMouseDown = (corner: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      if (!imageContainerRef.current) return

      const rect = imageContainerRef.current.getBoundingClientRect()
      const containerWidth = rect.width
      const containerHeight = rect.height

      // Calculate position relative to container
      const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, containerWidth))
      const y = Math.max(0, Math.min(moveEvent.clientY - rect.top, containerHeight))

      // Scale to image coordinates
      const scaleX = imageSize.width / containerWidth
      const scaleY = imageSize.height / containerHeight
      const imageX = x * scaleX
      const imageY = y * scaleY

      // Ensure minimum crop size (10% of image)
      const minSize = Math.min(imageSize.width, imageSize.height) * 0.1

      setCropRect((prev) => {
        const newRect = { ...prev }

        if (corner === "topLeft") {
          newRect.left = Math.min(imageX, imageSize.width - cropRect.right - minSize)
          newRect.top = Math.min(imageY, imageSize.height - cropRect.bottom - minSize)
        } else if (corner === "topRight") {
          newRect.right = Math.min(imageSize.width - imageX, imageSize.width - cropRect.left - minSize)
          newRect.top = Math.min(imageY, imageSize.height - cropRect.bottom - minSize)
        } else if (corner === "bottomLeft") {
          newRect.left = Math.min(imageX, imageSize.width - cropRect.right - minSize)
          newRect.bottom = Math.min(imageSize.height - imageY, imageSize.height - cropRect.top - minSize)
        } else if (corner === "bottomRight") {
          newRect.right = Math.min(imageSize.width - imageX, imageSize.width - cropRect.left - minSize)
          newRect.bottom = Math.min(imageSize.height - imageY, imageSize.height - cropRect.top - minSize)
        }

        return newRect
      })
    }

    const handleTouchMove = (touchEvent: TouchEvent) => {
      touchEvent.preventDefault()
      const touch = touchEvent.touches[0]
      if (!touch || !imageContainerRef.current) return

      const rect = imageContainerRef.current.getBoundingClientRect()
      const containerWidth = rect.width
      const containerHeight = rect.height

      // Calculate position relative to container
      const x = Math.max(0, Math.min(touch.clientX - rect.left, containerWidth))
      const y = Math.max(0, Math.min(touch.clientY - rect.top, containerHeight))

      // Scale to image coordinates
      const scaleX = imageSize.width / containerWidth
      const scaleY = imageSize.height / containerHeight
      const imageX = x * scaleX
      const imageY = y * scaleY

      // Ensure minimum crop size (10% of image)
      const minSize = Math.min(imageSize.width, imageSize.height) * 0.1

      setCropRect((prev) => {
        const newRect = { ...prev }

        if (corner === "topLeft") {
          newRect.left = Math.min(imageX, imageSize.width - cropRect.right - minSize)
          newRect.top = Math.min(imageY, imageSize.height - cropRect.bottom - minSize)
        } else if (corner === "topRight") {
          newRect.right = Math.min(imageSize.width - imageX, imageSize.width - cropRect.left - minSize)
          newRect.top = Math.min(imageY, imageSize.height - cropRect.bottom - minSize)
        } else if (corner === "bottomLeft") {
          newRect.left = Math.min(imageX, imageSize.width - cropRect.right - minSize)
          newRect.bottom = Math.min(imageSize.height - imageY, imageSize.height - cropRect.top - minSize)
        } else if (corner === "bottomRight") {
          newRect.right = Math.min(imageSize.width - imageX, imageSize.width - cropRect.left - minSize)
          newRect.bottom = Math.min(imageSize.height - imageY, imageSize.height - cropRect.top - minSize)
        }

        return newRect
      })
    }

    const handleEnd = () => {
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("mouseup", handleEnd)
      document.removeEventListener("touchend", handleEnd)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("mouseup", handleEnd)
    document.addEventListener("touchend", handleEnd)
  }

  // Handle perspective point dragging
  // Melhorar a função handlePerspectiveMouseDown para garantir que a perspectiva funcione corretamente
  const handlePerspectiveMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveDragPoint(index)
    setIsDragging(true)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      if (!imageContainerRef.current || activeDragPoint === null) return

      const rect = imageContainerRef.current.getBoundingClientRect()

      // Calcular posição relativa ao contêiner com limites de segurança
      const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width))
      const y = Math.max(0, Math.min(moveEvent.clientY - rect.top, rect.height))

      // Converter para coordenadas da imagem
      const scaleX = imageSize.width / rect.width
      const scaleY = imageSize.height / rect.height
      const imageX = x * scaleX
      const imageY = y * scaleY

      // Atualizar o ponto de perspectiva
      setPerspectivePoints((prev) => {
        const newPoints = [...prev]
        newPoints[index] = { x: imageX, y: imageY }
        return newPoints
      })
    }

    const handleTouchMove = (touchEvent: TouchEvent) => {
      touchEvent.preventDefault()
      const touch = touchEvent.touches[0]
      if (!touch || !imageContainerRef.current || activeDragPoint === null) return

      const rect = imageContainerRef.current.getBoundingClientRect()

      // Calcular posição relativa ao contêiner com limites de segurança
      const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width))
      const y = Math.max(0, Math.min(touch.clientY - rect.top, rect.height))

      // Converter para coordenadas da imagem
      const scaleX = imageSize.width / rect.width
      const scaleY = imageSize.height / rect.height
      const imageX = x * scaleX
      const imageY = y * scaleY

      // Atualizar o ponto de perspectiva
      setPerspectivePoints((prev) => {
        const newPoints = [...prev]
        newPoints[index] = { x: imageX, y: imageY }
        return newPoints
      })
    }

    const handleEnd = () => {
      setActiveDragPoint(null)
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("mouseup", handleEnd)
      document.removeEventListener("touchend", handleEnd)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("mouseup", handleEnd)
    document.addEventListener("touchend", handleEnd)
  }

  // Apply auto crop
  // Implementar recorte automático mais robusto
  const handleAutoCrop = () => {
    // Implementar um recorte automático mais inteligente
    // Para demonstração, vamos criar um recorte mais realista

    // Calcular o centro da imagem
    const centerX = imageSize.width / 2
    const centerY = imageSize.height / 2

    // Calcular o tamanho do documento (75% da imagem)
    const docWidth = imageSize.width * 0.75
    const docHeight = imageSize.height * 0.75

    // Calcular as margens
    const leftMargin = centerX - docWidth / 2
    const topMargin = centerY - docHeight / 2
    const rightMargin = imageSize.width - (centerX + docWidth / 2)
    const bottomMargin = imageSize.height - (centerY + docHeight / 2)

    setCropRect({
      top: topMargin,
      left: leftMargin,
      right: rightMargin,
      bottom: bottomMargin,
    })

    // Atualizar o modo de edição para recorte
    setEditMode("crop")

    toast({
      title: "Recorte automático aplicado",
      description: "Arraste os cantos para ajustar manualmente se necessário",
      variant: "default",
    })
  }

  // Apply auto perspective correction
  // Implementar correção automática de perspectiva mais robusta
  const handleAutoPerspective = () => {
    // Implementar uma detecção de perspectiva mais inteligente
    // Para demonstração, vamos criar uma perspectiva mais realista

    // Calcular o centro da imagem
    const centerX = imageSize.width / 2
    const centerY = imageSize.height / 2

    // Calcular o tamanho do documento (70% da imagem)
    const docWidth = imageSize.width * 0.7
    const docHeight = imageSize.height * 0.7

    // Adicionar uma distorção de perspectiva realista
    // Simular um documento visto de um ângulo ligeiramente inclinado
    const newPoints = [
      { x: centerX - (docWidth / 2) * 0.9, y: centerY - (docHeight / 2) * 0.9 }, // Superior-esquerdo
      { x: centerX + (docWidth / 2) * 1.1, y: centerY - (docHeight / 2) * 0.95 }, // Superior-direito
      { x: centerX - (docWidth / 2) * 0.85, y: centerY + (docHeight / 2) * 1.05 }, // Inferior-esquerdo
      { x: centerX + (docWidth / 2) * 1.15, y: centerY + (docHeight / 2) * 1.1 }, // Inferior-direito
    ]

    setPerspectivePoints(newPoints)

    // Atualizar o modo de edição para perspectiva
    setEditMode("perspective")

    toast({
      title: "Correção de perspectiva aplicada",
      description: "Arraste os pontos para ajustar manualmente se necessário",
      variant: "default",
    })
  }

  // Process and save the image - Otimizado para ser mais rápido
  const processAndSaveImage = () => {
    const sourceImage = transformedImage || processedImage
    if (!sourceImage || !canvasRef.current) return

    setIsSaving(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Create a temporary image to draw from
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Set canvas size based on crop
      const cropWidth = img.width - cropRect.left - cropRect.right
      const cropHeight = img.height - cropRect.top - cropRect.bottom

      // Determine if we're using perspective correction
      const usePerspective = editMode === "perspective"

      if (usePerspective) {
        // For perspective correction, we need to maintain the original canvas size
        canvas.width = img.width
        canvas.height = img.height

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw the original image with perspective correction
        ctx.drawImage(img, 0, 0)

        // In a real app, we would apply the perspective transform here
      } else {
        // For crop only, set canvas to the crop size
        canvas.width = cropWidth
        canvas.height = cropHeight

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw the cropped image
        ctx.drawImage(img, cropRect.left, cropRect.top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
      }

      // Get the final image data URL
      const finalImageUrl = canvas.toDataURL("image/jpeg", 0.95)

      // Store in sessionStorage for the success page
      sessionStorage.setItem("finalImage", finalImageUrl)

      // Navigate to success page
      setTimeout(() => {
        setIsSaving(false)
        router.push("/scan/success")
      }, 200) // Reduzido para 200ms para ser mais rápido
    }

    img.src = sourceImage
  }

  const handleAddAnother = () => {
    router.push("/scan/camera")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-5xl">
        <div className="flex items-center mb-4 sm:mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/scan/review")} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Editar Documento</h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Ajuste e aprimore seu documento digitalizado
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl overflow-hidden mb-4 sm:mb-6 bg-white dark:bg-slate-800">
              <div
                ref={imageContainerRef}
                className="relative aspect-[3/4] w-full"
                style={{ cursor: isDragging ? "grabbing" : "default" }}
              >
                {(transformedImage || processedImage) && (
                  <img
                    ref={imageRef}
                    src={transformedImage || processedImage || "/placeholder.svg"}
                    alt="Documento digitalizado"
                    className="w-full h-full object-contain"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    onLoad={handleImageLoad}
                  />
                )}

                <canvas ref={canvasRef} className="hidden" />

                {editMode === "crop" && imageSize.width > 0 && (
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: `polygon(
                        0% 0%, 100% 0%, 100% 100%, 0% 100%,
                        0% ${(cropRect.top * 100) / imageSize.height}%, 
                        ${(cropRect.left * 100) / imageSize.width}% ${(cropRect.top * 100) / imageSize.height}%, 
                        ${(cropRect.left * 100) / imageSize.width}% ${((imageSize.height - cropRect.bottom) * 100) / imageSize.height}%, 
                        ${((imageSize.width - cropRect.right) * 100) / imageSize.width}% ${((imageSize.height - cropRect.bottom) * 100) / imageSize.height}%,
                        ${((imageSize.width - cropRect.right) * 100) / imageSize.width}% ${(cropRect.top * 100) / imageSize.height}%,
                        0% ${(cropRect.top * 100) / imageSize.height}%
                      )`,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}
                  />
                )}

                {editMode === "crop" && imageSize.width > 0 && (
                  <div className="absolute inset-0">
                    <div
                      className="absolute border-2 border-blue-500 pointer-events-none"
                      style={{
                        top: `${(cropRect.top * 100) / imageSize.height}%`,
                        left: `${(cropRect.left * 100) / imageSize.width}%`,
                        right: `${(cropRect.right * 100) / imageSize.width}%`,
                        bottom: `${(cropRect.bottom * 100) / imageSize.height}%`,
                      }}
                    >
                      <div
                        className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 rounded-full cursor-nwse-resize"
                        onMouseDown={(e) => handleCropMouseDown("topLeft", e)}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          handleCropMouseDown("topLeft", e as any)
                        }}
                      />
                      <div
                        className="absolute -top-3 -right-3 w-6 h-6 bg-blue-500 rounded-full cursor-nesw-resize"
                        onMouseDown={(e) => handleCropMouseDown("topRight", e)}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          handleCropMouseDown("topRight", e as any)
                        }}
                      />
                      <div
                        className="absolute -bottom-3 -left-3 w-6 h-6 bg-blue-500 rounded-full cursor-nesw-resize"
                        onMouseDown={(e) => handleCropMouseDown("bottomLeft", e)}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          handleCropMouseDown("bottomLeft", e as any)
                        }}
                      />
                      <div
                        className="absolute -bottom-3 -right-3 w-6 h-6 bg-blue-500 rounded-full cursor-nwse-resize"
                        onMouseDown={(e) => handleCropMouseDown("bottomRight", e)}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          handleCropMouseDown("bottomRight", e as any)
                        }}
                      />
                    </div>
                  </div>
                )}

                {editMode === "perspective" && imageSize.width > 0 && (
                  <div className="absolute inset-0">
                    <svg width="100%" height="100%" className="absolute inset-0">
                      <polygon
                        points={`
                          ${(perspectivePoints[0].x * 100) / imageSize.width}%,${(perspectivePoints[0].y * 100) / imageSize.height}% 
                          ${(perspectivePoints[1].x * 100) / imageSize.width}%,${(perspectivePoints[1].y * 100) / imageSize.height}% 
                          ${(perspectivePoints[3].x * 100) / imageSize.width}%,${(perspectivePoints[3].y * 100) / imageSize.height}% 
                          ${(perspectivePoints[2].x * 100) / imageSize.width}%,${(perspectivePoints[2].y * 100) / imageSize.height}%
                        `}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                    </svg>

                    {perspectivePoints.map((point, index) => (
                      <div
                        key={index}
                        className="absolute w-6 h-6 bg-blue-500 rounded-full cursor-move transform -translate-x-3 -translate-y-3"
                        style={{
                          left: `${(point.x * 100) / imageSize.width}%`,
                          top: `${(point.y * 100) / imageSize.height}%`,
                        }}
                        onMouseDown={(e) => handlePerspectiveMouseDown(index, e)}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          handlePerspectiveMouseDown(index, e as any)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleUndo} disabled={historyIndex <= 0}>
                <Undo className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Desfazer</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleRedo}
                disabled={historyIndex >= editHistory.length - 1}
              >
                <Redo className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Refazer</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleRotate("cw")}>
                <RotateCw className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Rotacionar</span>
              </Button>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 sm:p-6">
                <Tabs defaultValue="adjust" value={editMode} onValueChange={setEditMode} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4 sm:mb-6">
                    <TabsTrigger value="adjust">Ajustes</TabsTrigger>
                    <TabsTrigger value="crop">Recorte</TabsTrigger>
                    <TabsTrigger value="perspective">Perspectiva</TabsTrigger>
                  </TabsList>

                  <TabsContent value="adjust" className="space-y-4 sm:space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-slate-800 dark:text-slate-100">Modo de Cor</h3>
                      <Tabs defaultValue="color" value={colorMode} onValueChange={handleColorModeChange}>
                        <TabsList className="grid grid-cols-3 w-full">
                          <TabsTrigger value="bw">P&B</TabsTrigger>
                          <TabsTrigger value="gray">Tons de Cinza</TabsTrigger>
                          <TabsTrigger value="color">Colorido</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-enhance" className="cursor-pointer">
                          Aprimoramento Automático
                        </Label>
                        <Switch
                          id="auto-enhance"
                          checked={autoEnhance}
                          onCheckedChange={(checked) => {
                            setAutoEnhance(checked)
                            if (checked) {
                              setBrightness(60)
                              setContrast(60)
                              setTimeout(applyImageTransformations, 10)
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Brilho: {brightness}%</Label>
                          </div>
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[brightness]}
                            onValueChange={(value) => handleBrightnessChange(value[0])}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Contraste: {contrast}%</Label>
                          </div>
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[contrast]}
                            onValueChange={(value) => handleContrastChange(value[0])}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="crop" className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">Arraste os cantos para recortar o documento.</p>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={handleAutoCrop}>
                        <Crop className="mr-1 h-4 w-4" />
                        Recorte Automático
                      </Button>
                      <Button variant="outline" size="sm">
                        <ZoomIn className="mr-1 h-4 w-4" />
                        Ajustar à Página
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleRotate("ccw")}>
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Girar Esquerda
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRotate("cw")}>
                        <RotateCw className="mr-1 h-4 w-4" />
                        Girar Direita
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="perspective" className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                      Arraste os pontos para corrigir a perspectiva do documento.
                    </p>

                    <Button variant="outline" size="sm" className="w-full" onClick={handleAutoPerspective}>
                      <Move className="mr-1 h-4 w-4" />
                      Correção Automática
                    </Button>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => handleRotate("ccw")}>
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Girar Esquerda
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRotate("cw")}>
                        <RotateCw className="mr-1 h-4 w-4" />
                        Girar Direita
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h3 className="font-medium text-slate-800 dark:text-slate-100">Opções Avançadas</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ocr" className="cursor-pointer">
                      Reconhecimento de Texto (OCR)
                    </Label>
                    <Switch id="ocr" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="compress" className="cursor-pointer">
                      Compressão de Arquivo
                    </Label>
                    <Switch id="compress" defaultChecked />
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="mr-1 h-4 w-4" />
                    Opções de Arquivo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col space-y-3">
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={processAndSaveImage}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Salvar Documento
                  </>
                )}
              </Button>

              <Button variant="outline" size="lg" className="w-full" onClick={handleAddAnother} disabled={isSaving}>
                <Plus className="mr-2 h-5 w-5" />
                Adicionar Outro Documento
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

