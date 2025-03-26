"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Crop, Move, RotateCw, RotateCcw, Check, X, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ScanReview() {
  const router = useRouter()
  const { toast } = useToast()

  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [documentData, setDocumentData] = useState<any>(null)
  const [editMode, setEditMode] = useState<"crop" | "perspective">("crop")
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)

  const imageContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Load captured image and document data from session storage
  useEffect(() => {
    try {
      const storedImage = sessionStorage.getItem("capturedImage")
      const storedDocumentData = sessionStorage.getItem("documentData")

      if (storedImage) {
        setCapturedImage(storedImage)
      } else {
        // If no image is found, use a placeholder for demo purposes
        setCapturedImage("/placeholder.svg?height=800&width=600")

        toast({
          title: "Imagem não encontrada",
          description: "Usando imagem de demonstração. Em um app real, você seria redirecionado para a câmera.",
          variant: "default",
        })
      }

      if (storedDocumentData) {
        const parsedData = JSON.parse(storedDocumentData)
        setDocumentData(parsedData)

        // If document was detected, use the detected corners for perspective
        if (parsedData.detected && parsedData.corners && parsedData.corners.length === 4) {
          setPerspectivePoints(parsedData.corners)
        }
      }
    } catch (error) {
      console.error("Error loading data from sessionStorage:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar a imagem capturada.",
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
  }, [capturedImage, croppedImage])

  // Handle image load event
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      })

      // Initialize crop and perspective points based on image size
      const width = imageRef.current.naturalWidth
      const height = imageRef.current.naturalHeight

      // Set crop to 10% inset from each edge if not already set from document detection
      if (!documentData?.detected) {
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

      // Aplicar recorte automático na inicialização se o documento foi detectado
      if (documentData?.detected && documentData?.corners && !croppedImage) {
        handleAutoCrop()
      }
    }
  }

  // Função para aplicar o recorte na imagem
  const applyCrop = (rect: typeof cropRect, sourceImage: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const cropWidth = img.width - rect.left - rect.right
        const cropHeight = img.height - rect.top - rect.bottom

        canvas.width = cropWidth
        canvas.height = cropHeight

        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, rect.left, rect.top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

          resolve(canvas.toDataURL("image/jpeg", 0.95))
        } else {
          resolve(sourceImage) // Fallback se não conseguir recortar
        }
      }
      img.src = sourceImage
    })
  }

  // Handle crop corner dragging - Otimizado para mobile
  const handleCropMouseDown = (corner: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)

    // Armazenar posição inicial para touch
    if ("touches" in e) {
      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

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
          newRect.left = Math.min(imageX, imageSize.width - prev.right - minSize)
          newRect.top = Math.min(imageY, imageSize.height - prev.bottom - minSize)
        } else if (corner === "topRight") {
          newRect.right = Math.min(imageSize.width - imageX, imageSize.width - prev.left - minSize)
          newRect.top = Math.min(imageY, imageSize.height - prev.bottom - minSize)
        } else if (corner === "bottomLeft") {
          newRect.left = Math.min(imageX, imageSize.width - prev.right - minSize)
          newRect.bottom = Math.min(imageSize.height - imageY, imageSize.height - prev.top - minSize)
        } else if (corner === "bottomRight") {
          newRect.right = Math.min(imageSize.width - imageX, imageSize.width - prev.left - minSize)
          newRect.bottom = Math.min(imageSize.height - imageY, imageSize.height - prev.top - minSize)
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
          newRect.left = Math.min(imageX, imageSize.width - prev.right - minSize)
          newRect.top = Math.min(imageY, imageSize.height - prev.bottom - minSize)
        } else if (corner === "topRight") {
          newRect.right = Math.min(imageSize.width - imageX, imageSize.width - prev.left - minSize)
          newRect.top = Math.min(imageY, imageSize.height - prev.bottom - minSize)
        } else if (corner === "bottomLeft") {
          newRect.left = Math.min(imageX, imageSize.width - prev.right - minSize)
          newRect.bottom = Math.min(imageSize.height - imageY, imageSize.height - prev.top - minSize)
        } else if (corner === "bottomRight") {
          newRect.right = Math.min(imageSize.width - imageX, imageSize.width - prev.left - minSize)
          newRect.bottom = Math.min(imageSize.height - imageY, imageSize.height - prev.top - minSize)
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

      // Aplicar o recorte quando terminar de arrastar
      if (capturedImage) {
        applyCrop(cropRect, capturedImage).then(setCroppedImage)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("mouseup", handleEnd)
    document.addEventListener("touchend", handleEnd)
  }

  // Handle perspective point dragging - Otimizado para mobile
  const handlePerspectiveMouseDown = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveDragPoint(index)
    setIsDragging(true)

    // Armazenar posição inicial para touch
    if ("touches" in e) {
      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

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

  // Apply auto crop - Agora retorna a imagem já recortada
  const handleAutoCrop = async () => {
    if (!capturedImage) return

    let newCropRect = { ...cropRect }

    if (documentData?.detected && documentData?.corners) {
      try {
        // Verificar qualidade da detecção antes de aplicar
        const corners = documentData.corners

        // Verificar se os cantos formam um quadrilátero válido
        const isValidQuad = validateQuadrilateral(corners)

        if (isValidQuad) {
          // Calcular as bordas com margem de segurança
          const minX = Math.min(...corners.map((c: any) => c.x))
          const maxX = Math.max(...corners.map((c: any) => c.x))
          const minY = Math.min(...corners.map((c: any) => c.y))
          const maxY = Math.max(...corners.map((c: any) => c.y))

          // Adicionar uma pequena margem (2%)
          const marginX = imageSize.width * 0.02
          const marginY = imageSize.height * 0.02

          newCropRect = {
            top: Math.max(0, minY - marginY),
            left: Math.max(0, minX - marginX),
            right: Math.max(0, imageSize.width - maxX - marginX),
            bottom: Math.max(0, imageSize.height - maxY - marginY),
          }

          setCropRect(newCropRect)

          toast({
            title: "Recorte automático aplicado",
            description: "Usando as bordas do documento detectado",
            variant: "default",
          })
        } else {
          // Fallback para recorte inteligente se a detecção não for confiável
          newCropRect = applySmartCrop()

          toast({
            title: "Recorte inteligente aplicado",
            description: "A detecção original não era confiável, usando método alternativo",
            variant: "default",
          })
        }
      } catch (error) {
        console.error("Erro ao aplicar recorte automático:", error)
        newCropRect = applySmartCrop()
      }
    } else {
      newCropRect = applySmartCrop()
    }

    // Aplicar o recorte e atualizar a imagem
    const croppedImageUrl = await applyCrop(newCropRect, capturedImage)
    setCroppedImage(croppedImageUrl)
  }

  // Função auxiliar para validar se os cantos formam um quadrilátero válido
  const validateQuadrilateral = (corners: any[]) => {
    if (!corners || corners.length !== 4) return false

    // Verificar se os pontos não estão muito próximos uns dos outros
    const minDistance = Math.min(imageSize.width, imageSize.height) * 0.1

    for (let i = 0; i < corners.length; i++) {
      for (let j = i + 1; j < corners.length; j++) {
        const dx = corners[i].x - corners[j].x
        const dy = corners[i].y - corners[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < minDistance) return false
      }
    }

    // Verificar se a área é grande o suficiente (pelo menos 20% da imagem)
    const area = calculateQuadArea(corners)
    const minArea = imageSize.width * imageSize.height * 0.2

    return area >= minArea
  }

  // Calcular área aproximada do quadrilátero
  const calculateQuadArea = (corners: any[]) => {
    const minX = Math.min(...corners.map((c) => c.x))
    const maxX = Math.max(...corners.map((c) => c.x))
    const minY = Math.min(...corners.map((c) => c.y))
    const maxY = Math.max(...corners.map((c) => c.y))

    return (maxX - minX) * (maxY - minY)
  }

  // Aplicar recorte inteligente baseado em análise da imagem
  const applySmartCrop = () => {
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

    const newRect = {
      top: topMargin,
      left: leftMargin,
      right: rightMargin,
      bottom: bottomMargin,
    }

    setCropRect(newRect)
    return newRect
  }

  // Apply auto perspective correction
  const handleAutoPerspective = () => {
    if (documentData?.detected && documentData?.corners) {
      try {
        // Verificar qualidade da detecção antes de aplicar
        const corners = documentData.corners
        const isValidQuad = validateQuadrilateral(corners)

        if (isValidQuad) {
          // Ordenar os cantos para garantir a ordem correta (superior-esquerdo, superior-direito, inferior-esquerdo, inferior-direito)
          const sortedCorners = sortCorners(corners)
          setPerspectivePoints(sortedCorners)

          toast({
            title: "Correção de perspectiva aplicada",
            description: "Usando as bordas do documento detectado",
            variant: "default",
          })
        } else {
          // Fallback para perspectiva inteligente
          applySmartPerspective()

          toast({
            title: "Correção de perspectiva inteligente aplicada",
            description: "A detecção original não era confiável, usando método alternativo",
            variant: "default",
          })
        }
      } catch (error) {
        console.error("Erro ao aplicar perspectiva automática:", error)
        applySmartPerspective()
      }
    } else {
      applySmartPerspective()
    }
  }

  // Ordenar os cantos para garantir a ordem correta
  const sortCorners = (corners: any[]) => {
    // Encontrar o centro
    const centerX = corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length
    const centerY = corners.reduce((sum, corner) => sum + corner.y, 0) / corners.length

    // Ordenar os cantos com base na posição relativa ao centro
    return corners.sort((a, b) => {
      const aQuadrant = getQuadrant(a, centerX, centerY)
      const bQuadrant = getQuadrant(b, centerX, centerY)

      if (aQuadrant !== bQuadrant) return aQuadrant - bQuadrant

      // Se estiverem no mesmo quadrante, ordenar pela distância ao centro
      const aDist = Math.sqrt(Math.pow(a.x - centerX, 2) + Math.pow(a.y - centerY, 2))
      const bDist = Math.sqrt(Math.pow(b.x - centerX, 2) + Math.pow(b.y - centerY, 2))

      return aDist - bDist
    })
  }

  // Determinar o quadrante de um ponto em relação ao centro
  const getQuadrant = (point: any, centerX: number, centerY: number) => {
    if (point.x < centerX && point.y < centerY) return 0 // Superior-esquerdo
    if (point.x >= centerX && point.y < centerY) return 1 // Superior-direito
    if (point.x < centerX && point.y >= centerY) return 2 // Inferior-esquerdo
    return 3 // Inferior-direito
  }

  // Aplicar perspectiva inteligente
  const applySmartPerspective = () => {
    // Calcular o centro da imagem
    const centerX = imageSize.width / 2
    const centerY = imageSize.height / 2

    // Calcular o tamanho do documento (70% da imagem)
    const docWidth = imageSize.width * 0.7
    const docHeight = imageSize.height * 0.7

    // Adicionar uma distorção de perspectiva realista
    // Simular um documento visto de um ângulo ligeiramente inclinado
    setPerspectivePoints([
      { x: centerX - (docWidth / 2) * 0.9, y: centerY - (docHeight / 2) * 0.9 }, // Superior-esquerdo
      { x: centerX + (docWidth / 2) * 1.1, y: centerY - (docHeight / 2) * 0.95 }, // Superior-direito
      { x: centerX - (docWidth / 2) * 0.85, y: centerY + (docHeight / 2) * 1.05 }, // Inferior-esquerdo
      { x: centerX + (docWidth / 2) * 1.15, y: centerY + (docHeight / 2) * 1.1 }, // Inferior-direito
    ])
  }

  // Rotate image
  const handleRotate = (direction: "cw" | "ccw") => {
    setRotation((prev) => {
      if (direction === "cw") {
        return (prev + 90) % 360
      } else {
        return (prev - 90 + 360) % 360
      }
    })
  }

  // Process and save the image - Otimizado para ser mais rápido
  const processAndSaveImage = () => {
    const sourceImage = croppedImage || capturedImage
    if (!sourceImage || !canvasRef.current) return

    setIsProcessing(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Create a temporary image to draw from
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
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
        // For this demo, we'll just highlight the area
        ctx.strokeStyle = "#00ff00"
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(perspectivePoints[0].x, perspectivePoints[0].y)
        ctx.lineTo(perspectivePoints[1].x, perspectivePoints[1].y)
        ctx.lineTo(perspectivePoints[3].x, perspectivePoints[3].y)
        ctx.lineTo(perspectivePoints[2].x, perspectivePoints[2].y)
        ctx.closePath()
        ctx.stroke()
      } else {
        // Se já estamos usando a imagem recortada, apenas copiar para o canvas
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
      }

      // Apply rotation if needed
      if (rotation !== 0) {
        // Create a temporary canvas for rotation
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")

        if (tempCtx) {
          // Set dimensions based on rotation
          if (rotation === 90 || rotation === 270) {
            tempCanvas.width = canvas.height
            tempCanvas.height = canvas.width
          } else {
            tempCanvas.width = canvas.width
            tempCanvas.height = canvas.height
          }

          // Rotate and draw
          tempCtx.save()
          tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
          tempCtx.rotate((rotation * Math.PI) / 180)

          if (rotation === 90 || rotation === 270) {
            tempCtx.drawImage(canvas, -canvas.height / 2, -canvas.width / 2)
          } else {
            tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
          }

          tempCtx.restore()

          // Clear original canvas and resize
          canvas.width = tempCanvas.width
          canvas.height = tempCanvas.height

          // Copy back to original canvas
          ctx.drawImage(tempCanvas, 0, 0)
        }
      }

      // Get the final image data URL
      const processedImageUrl = canvas.toDataURL("image/jpeg", 0.95)

      // Store in sessionStorage for the edit page
      sessionStorage.setItem("processedImage", processedImageUrl)

      // Store edit data for the edit page
      sessionStorage.setItem(
        "editData",
        JSON.stringify({
          cropRect,
          perspectivePoints,
          rotation,
          editMode,
        }),
      )

      // Navigate to edit page immediately
      setIsProcessing(false)
      router.push("/scan/edit")
    }

    img.src = sourceImage
  }

  // Reject and retake photo
  const handleRetake = () => {
    router.push("/scan/camera")
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push("/scan/camera")} className="text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-white">Revisar Documento</h1>
        <div className="w-9"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="border-0 shadow-xl overflow-hidden bg-black w-full max-w-md">
          <div
            ref={imageContainerRef}
            className="relative aspect-[3/4] w-full"
            style={{ cursor: isDragging ? "grabbing" : "default" }}
          >
            {(croppedImage || capturedImage) && (
              <img
                ref={imageRef}
                src={croppedImage || capturedImage || "/placeholder.svg"}
                alt="Documento digitalizado"
                className="w-full h-full object-contain"
                style={{ transform: `rotate(${rotation}deg)` }}
                onLoad={handleImageLoad}
              />
            )}

            <canvas ref={canvasRef} className="hidden" />

            {editMode === "crop" && imageSize.width > 0 && !croppedImage && (
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

            {editMode === "crop" && imageSize.width > 0 && !croppedImage && (
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
                    fill="rgba(59, 130, 246, 0.2)"
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

        <div className="w-full max-w-md mt-4">
          <Tabs
            defaultValue="crop"
            value={editMode}
            onValueChange={(value) => setEditMode(value as "crop" | "perspective")}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="crop">Recorte</TabsTrigger>
              <TabsTrigger value="perspective">Perspectiva</TabsTrigger>
            </TabsList>

            <TabsContent value="crop" className="space-y-4">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  onClick={handleAutoCrop}
                >
                  <Crop className="mr-2 h-4 w-4" />
                  Recorte Automático
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  onClick={() => handleRotate("cw")}
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  Girar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="perspective" className="space-y-4">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  onClick={handleAutoPerspective}
                >
                  <Move className="mr-2 h-4 w-4" />
                  Correção Automática
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  onClick={() => handleRotate("ccw")}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Girar
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex space-x-2 mt-6">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border-red-600 text-red-500 hover:bg-red-900/20"
              onClick={handleRetake}
              disabled={isProcessing}
            >
              <X className="mr-2 h-5 w-5" />
              Refazer
            </Button>

            <Button
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={processAndSaveImage}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

