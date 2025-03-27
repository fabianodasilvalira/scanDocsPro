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
import {
  ArrowLeft,
  Save,
  Crop,
  Plus,
  RotateCw,
  RotateCcw,
  ZoomIn,
  FileText,
  Undo,
  Redo,
  RefreshCw,
  Check,
  Search,
  Maximize,
  Minimize,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function ScanEdit() {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()

  // Estados principais
  const [colorMode, setColorMode] = useState("color")
  const [brightness, setBrightness] = useState(50)
  const [contrast, setContrast] = useState(50)
  const [resolution, setResolution] = useState(100) // Novo estado para resolução
  const [autoEnhance, setAutoEnhance] = useState(false)
  const [editMode, setEditMode] = useState("adjust")
  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Estados de imagem
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [transformedImage, setTransformedImage] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Estados de histórico e edição
  const [editHistory, setEditHistory] = useState<
    {
      image: string
      brightness: number
      contrast: number
      colorMode: string
      resolution: number
    }[]
  >([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [editData, setEditData] = useState<any>(null)

  // Estados de recorte
  const [cropRect, setCropRect] = useState({ top: 60, left: 60, right: 60, bottom: 60 })
  const [originalCropRect, setOriginalCropRect] = useState({ top: 60, left: 60, right: 60, bottom: 60 })
  const [activeDragPoint, setActiveDragPoint] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [rotation, setRotation] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [isMovingCrop, setIsMovingCrop] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })

  // Adicionar estados para OCR e compressão
  const [isProcessing, setIsProcessing] = useState(false)
  const [compressionQuality, setCompressionQuality] = useState(80)
  const [ocrEnabled, setOcrEnabled] = useState(false)
  const [compressionEnabled, setCompressionEnabled] = useState(true)
  const [extractedText, setExtractedText] = useState<string | null>(null)

  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const originalCanvasRef = useRef<HTMLCanvasElement>(null)

  // Load processed image and edit data from session storage
  useEffect(() => {
    try {
      setIsLoading(true)
      const storedImage = sessionStorage.getItem("capturedImage")
      const storedOriginalImage = sessionStorage.getItem("originalImage") || storedImage
      const storedEditData = sessionStorage.getItem("editData")

      if (storedImage) {
        setProcessedImage(storedImage)
        setOriginalImage(storedOriginalImage)

        // Inicializar o histórico de edições com a imagem original
        const initialHistoryEntry = {
          image: storedOriginalImage,
          brightness: 50,
          contrast: 50,
          colorMode: "color",
          resolution: 100,
        }

        setEditHistory([initialHistoryEntry])
        setHistoryIndex(0)
        setTransformedImage(storedOriginalImage)
      } else {
        // If no image is found, use a placeholder for demo purposes
        const placeholderImage = "/placeholder.svg?height=800&width=600"
        setProcessedImage(placeholderImage)
        setOriginalImage(placeholderImage)
        setTransformedImage(placeholderImage)

        // Inicializar o histórico com a imagem placeholder
        setEditHistory([
          {
            image: placeholderImage,
            brightness: 50,
            contrast: 50,
            colorMode: "color",
            resolution: 100,
          },
        ])
        setHistoryIndex(0)

        toast({
          title: "Imagem não encontrada",
          description: "Usando imagem de demonstração. Em um app real, você seria redirecionado para a câmera.",
          variant: "default",
        })
      }

      if (storedEditData) {
        try {
          const parsedData = JSON.parse(storedEditData)
          setEditData(parsedData)

          // Apply stored edit data
          if (parsedData.cropRect) {
            setCropRect(parsedData.cropRect)
            setOriginalCropRect(parsedData.cropRect)
          }

          if (parsedData.rotation) {
            setRotation(parsedData.rotation)
          }
        } catch (parseError) {
          console.error("Error parsing edit data:", parseError)
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error loading data from sessionStorage:", error)
      setIsLoading(false)
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

  // Aplicar transformações quando os valores mudarem
  useEffect(() => {
    if (originalImage) {
      applyImageTransformations()
    }
  }, [brightness, contrast, colorMode, resolution])

  // Função para criar uma cópia do canvas original para uso nas transformações
  const createOriginalImageCanvas = () => {
    if (!originalImage || !originalCanvasRef.current) return null

    try {
      const canvas = originalCanvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return null

      return new Promise<HTMLCanvasElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          try {
            canvas.width = img.width
            canvas.height = img.height
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            resolve(canvas)
          } catch (drawError) {
            console.error("Error drawing image to canvas:", drawError)
            reject(drawError)
          }
        }

        img.onerror = (err) => {
          console.error("Error loading image:", err)
          reject(new Error("Failed to load image"))
        }

        img.src = originalImage
      })
    } catch (error) {
      console.error("Error in createOriginalImageCanvas:", error)
      return null
    }
  }

  // Corrigir a função de preview e aplicar recorte
  const generatePreview = async () => {
    if (!originalImage || !previewCanvasRef.current) return

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    try {
      // Criar uma imagem a partir da imagem original
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        // Configurar o tamanho do canvas
        if (editMode === "crop") {
          // Calcular as dimensões exatas do recorte
          const cropWidth = Math.max(0, img.width - cropRect.left - cropRect.right)
          const cropHeight = Math.max(0, img.height - cropRect.top - cropRect.bottom)

          // Verificar se as dimensões são válidas
          if (cropWidth <= 0 || cropHeight <= 0) {
            toast({
              title: "Erro ao gerar prévia",
              description: "A área de recorte é inválida. Ajuste os cantos e tente novamente.",
              variant: "destructive",
            })
            return
          }

          canvas.width = cropWidth
          canvas.height = cropHeight

          // Desenhar apenas a área recortada na posição correta
          ctx.drawImage(img, cropRect.left, cropRect.top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
        }

        // Aplicar as transformações de cor, brilho e contraste
        applyColorTransformations(ctx, canvas.width, canvas.height)

        // Aplicar resolução
        if (resolution !== 100) {
          const resizedCanvas = document.createElement("canvas")
          const resizedCtx = resizedCanvas.getContext("2d")
          if (resizedCtx) {
            const newWidth = canvas.width * (resolution / 100)
            const newHeight = canvas.height * (resolution / 100)

            resizedCanvas.width = newWidth
            resizedCanvas.height = newHeight

            resizedCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, newWidth, newHeight)

            // Redimensionar o canvas de prévia para mostrar a nova resolução
            canvas.width = newWidth
            canvas.height = newHeight
            ctx.drawImage(resizedCanvas, 0, 0)
          }
        }

        // Mostrar a prévia
        setPreviewImage(canvas.toDataURL("image/jpeg", 0.8))
        setShowPreview(true)
      }

      img.src = originalImage
    } catch (error) {
      console.error("Error generating preview:", error)
      toast({
        title: "Erro ao gerar prévia",
        description: "Não foi possível gerar a prévia da imagem.",
        variant: "destructive",
      })
    }
  }

  // Aplicar transformações de cor a um contexto de canvas
  const applyColorTransformations = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Aplicar modo de cor
    if (colorMode === "bw") {
      // Converter para preto e branco
      const imageData = ctx.getImageData(0, 0, width, height)
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
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = data[i + 1] = data[i + 2] = avg
      }
      ctx.putImageData(imageData, 0, 0)
    }

    // Aplicar brilho e contraste
    if (brightness !== 50 || contrast !== 50) {
      const imageData = ctx.getImageData(0, 0, width, height)
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
  }

  // Aplicar transformações na imagem em tempo real - Corrigido para funcionar corretamente
  const applyImageTransformations = async () => {
    if (!originalImage || !canvasRef.current) return

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      // Obter o canvas com a imagem original
      const originalCanvas = await createOriginalImageCanvas()
      if (!originalCanvas) return

      // Configurar o tamanho do canvas para corresponder à imagem original
      canvas.width = originalCanvas.width
      canvas.height = originalCanvas.height

      // Desenhar a imagem original
      ctx.drawImage(originalCanvas, 0, 0)

      // Aplicar transformações de cor
      applyColorTransformations(ctx, canvas.width, canvas.height)

      // Aplicar resolução
      if (resolution !== 100) {
        const resizedCanvas = document.createElement("canvas")
        const resizedCtx = resizedCanvas.getContext("2d")
        if (resizedCtx) {
          const newWidth = canvas.width * (resolution / 100)
          const newHeight = canvas.height * (resolution / 100)

          resizedCanvas.width = newWidth
          resizedCanvas.height = newHeight

          resizedCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, newWidth, newHeight)

          // Atualizar o canvas principal
          canvas.width = newWidth
          canvas.height = newHeight
          ctx.drawImage(resizedCanvas, 0, 0)
        }
      }

      // Atualizar a imagem processada
      const transformedImageUrl = canvas.toDataURL("image/jpeg", 0.95)
      setTransformedImage(transformedImageUrl)

      // Não adicionar ao histórico automaticamente para evitar muitas entradas
      // Isso será feito apenas quando o usuário confirmar as alterações
    } catch (error) {
      console.error("Error applying transformations:", error)
    }
  }

  // Handle image load event
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      })

      // Initialize crop points based on image size if not already set
      if (!editData) {
        const width = imageRef.current.naturalWidth
        const height = imageRef.current.naturalHeight

        // Set crop to 10% inset from each edge
        const inset = Math.min(width, height) * 0.1
        const newCropRect = {
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
        }
        setCropRect(newCropRect)
        setOriginalCropRect(newCropRect)
      }

      // Aplicar transformações iniciais
      setTimeout(applyImageTransformations, 100)
    }
  }

  // Atualizar os manipuladores de eventos para brilho e contraste - Corrigidos
  const handleBrightnessChange = (value: number) => {
    setBrightness(value)
  }

  const handleContrastChange = (value: number) => {
    setContrast(value)
  }

  const handleResolutionChange = (value: number) => {
    setResolution(value)
  }

  const handleColorModeChange = (mode: string) => {
    setColorMode(mode)
  }

  // Corrigir as funções de desfazer, refazer, restaurar original e salvar estados
  const saveToHistory = () => {
    if (!transformedImage) return

    const newHistoryEntry = {
      image: transformedImage,
      brightness,
      contrast,
      colorMode,
      resolution,
    }

    // Remover entradas futuras se estamos no meio do histórico
    const newHistory = [...editHistory.slice(0, historyIndex + 1), newHistoryEntry]

    setEditHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    toast({
      title: "Estado salvo",
      description: "O estado atual da imagem foi salvo no histórico",
      variant: "default",
    })
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      const prevState = editHistory[prevIndex]

      setHistoryIndex(prevIndex)
      setTransformedImage(prevState.image)
      setBrightness(prevState.brightness)
      setContrast(prevState.contrast)
      setColorMode(prevState.colorMode)
      setResolution(prevState.resolution)

      toast({
        title: "Ação desfeita",
        description: "Voltando para o estado anterior",
        variant: "default",
      })
    }
  }

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      const nextIndex = historyIndex + 1
      const nextState = editHistory[nextIndex]

      setHistoryIndex(nextIndex)
      setTransformedImage(nextState.image)
      setBrightness(nextState.brightness)
      setContrast(nextState.contrast)
      setColorMode(nextState.colorMode)
      setResolution(nextState.resolution)

      toast({
        title: "Ação refeita",
        description: "Avançando para o próximo estado",
        variant: "default",
      })
    }
  }

  const handleRestoreOriginal = () => {
    if (originalImage && editHistory.length > 0) {
      // Resetar os controles
      setBrightness(50)
      setContrast(50)
      setColorMode("color")
      setResolution(100)

      // Adicionar ao histórico
      const newHistoryEntry = {
        image: originalImage,
        brightness: 50,
        contrast: 50,
        colorMode: "color",
        resolution: 100,
      }

      const newHistory = [...editHistory.slice(0, historyIndex + 1), newHistoryEntry]
      setEditHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)

      // Atualizar a imagem transformada
      setTransformedImage(originalImage)

      toast({
        title: "Imagem restaurada",
        description: "A imagem foi restaurada para o estado original",
        variant: "default",
      })
    }
  }

  // Corrigir a função de restaurar recorte
  const handleRestoreCrop = () => {
    if (originalCropRect) {
      setCropRect({ ...originalCropRect })

      toast({
        title: "Recorte restaurado",
        description: "O recorte foi restaurado para o estado original",
        variant: "default",
      })
    }
  }

  // Corrigir a função de aplicar alterações
  const handleApplyChanges = async () => {
    if (!originalImage) return

    setIsApplying(true)

    try {
      // Criar uma imagem a partir da imagem original
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          setIsApplying(false)
          return
        }

        if (editMode === "crop") {
          // Calcular as dimensões exatas do recorte
          const cropWidth = Math.max(0, img.width - cropRect.left - cropRect.right)
          const cropHeight = Math.max(0, img.height - cropRect.top - cropRect.bottom)

          // Verificar se as dimensões são válidas
          if (cropWidth <= 0 || cropHeight <= 0) {
            toast({
              title: "Erro ao aplicar recorte",
              description: "A área de recorte é inválida. Ajuste os cantos e tente novamente.",
              variant: "destructive",
            })
            setIsApplying(false)
            return
          }

          canvas.width = cropWidth
          canvas.height = cropHeight

          // Desenhar apenas a área recortada na posição correta
          ctx.drawImage(img, cropRect.left, cropRect.top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

          // Atualizar a imagem original para o recorte
          const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.95)
          setOriginalImage(croppedImageUrl)
          setTransformedImage(croppedImageUrl)

          // Resetar os controles
          setBrightness(50)
          setContrast(50)
          setColorMode("color")
          setResolution(100)

          // Adicionar ao histórico
          const newHistoryEntry = {
            image: croppedImageUrl,
            brightness: 50,
            contrast: 50,
            colorMode: "color",
            resolution: 100,
          }

          const newHistory = [...editHistory.slice(0, historyIndex + 1), newHistoryEntry]
          setEditHistory(newHistory)
          setHistoryIndex(newHistory.length - 1)
        }

        // Fechar a prévia
        setShowPreview(false)

        toast({
          title: "Alterações aplicadas",
          description: "As alterações foram aplicadas com sucesso",
          variant: "default",
        })

        setIsApplying(false)
      }

      img.src = originalImage
    } catch (error) {
      console.error("Error applying changes:", error)
      toast({
        title: "Erro ao aplicar alterações",
        description: "Ocorreu um erro ao processar a imagem",
        variant: "destructive",
      })
      setIsApplying(false)
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

      // Ensure minimum crop size (5% of image)
      const minSize = Math.min(imageSize.width, imageSize.height) * 0.05

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

      // Ensure minimum crop size (5% of image)
      const minSize = Math.min(imageSize.width, imageSize.height) * 0.05

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
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("mouseup", handleEnd)
    document.addEventListener("touchend", handleEnd)
  }

  // Função para mover o retângulo de recorte inteiro
  const handleCropAreaMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!imageContainerRef.current) return

    setIsMovingCrop(true)

    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setLastMousePos({ x, y })

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      if (!imageContainerRef.current || !isMovingCrop) return

      const rect = imageContainerRef.current.getBoundingClientRect()
      const x = moveEvent.clientX - rect.left
      const y = moveEvent.clientY - rect.top

      // Calcular o deslocamento
      const deltaX = x - lastMousePos.x
      const deltaY = y - lastMousePos.y

      // Converter para coordenadas da imagem
      const scaleX = imageSize.width / rect.width
      const scaleY = imageSize.height / rect.height
      const imageDeltaX = deltaX * scaleX
      const imageDeltaY = deltaY * scaleY

      // Atualizar a posição do retângulo de recorte
      setCropRect((prev) => {
        // Verificar limites
        const newLeft = Math.max(0, prev.left - imageDeltaX)
        const newRight = Math.max(0, prev.right + imageDeltaX)
        const newTop = Math.max(0, prev.top - imageDeltaY)
        const newBottom = Math.max(0, prev.bottom + imageDeltaY)

        // Verificar se o recorte ainda está dentro da imagem
        if (newLeft + newRight >= imageSize.width || newTop + newBottom >= imageSize.height) {
          return prev
        }

        return {
          left: newLeft,
          right: newRight,
          top: newTop,
          bottom: newBottom,
        }
      })

      setLastMousePos({ x, y })
    }

    const handleTouchMove = (touchEvent: TouchEvent) => {
      touchEvent.preventDefault()
      const touch = touchEvent.touches[0]
      if (!touch || !imageContainerRef.current || !isMovingCrop) return

      const rect = imageContainerRef.current.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      // Calcular o deslocamento
      const deltaX = x - lastMousePos.x
      const deltaY = y - lastMousePos.y

      // Converter para coordenadas da imagem
      const scaleX = imageSize.width / rect.width
      const scaleY = imageSize.height / rect.height
      const imageDeltaX = deltaX * scaleX
      const imageDeltaY = deltaY * scaleY

      // Atualizar a posição do retângulo de recorte
      setCropRect((prev) => {
        // Verificar limites
        const newLeft = Math.max(0, prev.left - imageDeltaX)
        const newRight = Math.max(0, prev.right + imageDeltaX)
        const newTop = Math.max(0, prev.top - imageDeltaY)
        const newBottom = Math.max(0, prev.bottom + imageDeltaY)

        // Verificar se o recorte ainda está dentro da imagem
        if (newLeft + newRight >= imageSize.width || newTop + newBottom >= imageSize.height) {
          return prev
        }

        return {
          left: newLeft,
          right: newRight,
          top: newTop,
          bottom: newBottom,
        }
      })

      setLastMousePos({ x, y })
    }

    const handleEnd = () => {
      setIsMovingCrop(false)
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

  // Implementar detecção automática de recorte aprimorada
  const handleAutoCrop = async () => {
    if (!originalImage) return

    try {
      // Simular uma detecção mais avançada
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        // Obter as dimensões da imagem
        const width = img.width
        const height = img.height

        // Criar um canvas temporário para análise
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true })

        if (!tempCtx) return

        tempCanvas.width = width
        tempCanvas.height = height
        tempCtx.drawImage(img, 0, 0)

        // Obter os dados da imagem
        const imageData = tempCtx.getImageData(0, 0, width, height)
        const data = imageData.data

        // Detectar bordas (simplificado)
        // Em um app real, usaríamos algoritmos mais avançados como Canny Edge Detection

        // Calcular histograma de luminosidade por região
        const regionSize = 20
        const regions = {
          top: { sum: 0, count: 0 },
          bottom: { sum: 0, count: 0 },
          left: { sum: 0, count: 0 },
          right: { sum: 0, count: 0 },
          center: { sum: 0, count: 0 },
        }

        // Analisar regiões
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b

            // Determinar região
            if (y < regionSize) {
              regions.top.sum += luminance
              regions.top.count++
            } else if (y > height - regionSize) {
              regions.bottom.sum += luminance
              regions.bottom.count++
            }

            if (x < regionSize) {
              regions.left.sum += luminance
              regions.left.count++
            } else if (x > width - regionSize) {
              regions.right.sum += luminance
              regions.right.count++
            }

            if (x > width * 0.3 && x < width * 0.7 && y > height * 0.3 && y < height * 0.7) {
              regions.center.sum += luminance
              regions.center.count++
            }
          }
        }

        // Calcular médias
        const avgLuminance = {
          top: regions.top.sum / regions.top.count,
          bottom: regions.bottom.sum / regions.bottom.count,
          left: regions.left.sum / regions.left.count,
          right: regions.right.sum / regions.right.count,
          center: regions.center.sum / regions.center.count,
        }

        // Determinar limites com base nas diferenças de luminosidade
        const threshold = 15 // Ajustar conforme necessário

        // Calcular margens
        let topMargin = height * 0.1
        let bottomMargin = height * 0.1
        let leftMargin = width * 0.1
        let rightMargin = width * 0.1

        // Ajustar margens com base nas diferenças de luminosidade
        if (Math.abs(avgLuminance.top - avgLuminance.center) > threshold) {
          topMargin = height * 0.15
        }

        if (Math.abs(avgLuminance.bottom - avgLuminance.center) > threshold) {
          bottomMargin = height * 0.15
        }

        if (Math.abs(avgLuminance.left - avgLuminance.center) > threshold) {
          leftMargin = width * 0.15
        }

        if (Math.abs(avgLuminance.right - avgLuminance.center) > threshold) {
          rightMargin = width * 0.15
        }

        // Definir o retângulo de recorte
        setCropRect({
          top: topMargin,
          bottom: bottomMargin,
          left: leftMargin,
          right: rightMargin,
        })

        // Gerar prévia
        setTimeout(generatePreview, 100)

        toast({
          title: "Recorte automático aplicado",
          description: "Documento detectado e recorte aplicado",
          variant: "default",
        })
      }

      img.src = originalImage
    } catch (error) {
      console.error("Error in auto crop:", error)

      // Fallback para recorte simples
      const centerX = imageSize.width / 2
      const centerY = imageSize.height / 2
      const docWidth = imageSize.width * 0.8
      const docHeight = imageSize.height * 0.8

      setCropRect({
        top: centerY - docHeight / 2,
        left: centerX - docWidth / 2,
        right: imageSize.width - (centerX + docWidth / 2),
        bottom: imageSize.height - (centerY + docHeight / 2),
      })

      setTimeout(generatePreview, 100)

      toast({
        title: "Recorte automático aplicado",
        description: "Usando método alternativo de detecção",
        variant: "default",
      })
    }
  }

  // Process and save the image - Otimizado para ser mais rápido
  const processAndSaveImage = async () => {
    if (!originalImage) return

    setIsSaving(true)

    try {
      // Obter a imagem atual (transformada ou original)
      const sourceImage = transformedImage || originalImage

      // Aplicar recorte se necessário
      let processedImage = sourceImage

      if (editMode === "crop") {
        const img = new Image()
        img.crossOrigin = "anonymous"

        processedImage = await new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            if (!ctx) {
              reject(new Error("Não foi possível criar o contexto do canvas"))
              return
            }

            // Calcular as dimensões do recorte
            const cropWidth = Math.max(0, img.width - cropRect.left - cropRect.right)
            const cropHeight = Math.max(0, img.height - cropRect.top - cropRect.bottom)

            if (cropWidth <= 0 || cropHeight <= 0) {
              reject(new Error("Dimensões de recorte inválidas"))
              return
            }

            canvas.width = cropWidth
            canvas.height = cropHeight

            ctx.drawImage(img, cropRect.left, cropRect.top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

            resolve(canvas.toDataURL("image/jpeg", 0.95))
          }

          img.onerror = () => {
            reject(new Error("Erro ao carregar a imagem para recorte"))
          }

          img.src = sourceImage
        })
      }

      // Aplicar compressão se habilitada
      if (compressionEnabled) {
        const compressedImage = await compressImage(compressionQuality)
        if (compressedImage) {
          processedImage = compressedImage
        }
      }

      // Realizar OCR se habilitado
      if (ocrEnabled && !extractedText) {
        await performOCR()
      }

      // Armazenar a imagem final
      sessionStorage.setItem("finalImage", processedImage)

      // Armazenar o texto extraído, se houver
      if (extractedText) {
        sessionStorage.setItem("extractedText", extractedText)
      }

      // Navegar para a página de sucesso
      setTimeout(() => {
        setIsSaving(false)
        router.push("/scan/success")
      }, 200)
    } catch (error) {
      console.error("Error processing image:", error)
      setIsSaving(false)

      toast({
        title: "Erro ao processar imagem",
        description: "Ocorreu um erro ao processar a imagem. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Implementar OCR e compressão de arquivo
  const performOCR = async () => {
    if (!transformedImage) return

    try {
      setIsProcessing(true)

      // Simulação de OCR (em um app real, usaríamos uma API de OCR como Tesseract.js ou Google Cloud Vision)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulação de texto extraído
      const extractedText =
        "DOCUMENTO DIGITALIZADO\n\nTexto extraído do documento através de OCR.\nEste é um exemplo de como o texto seria extraído de um documento real."

      // Armazenar o texto extraído
      sessionStorage.setItem("extractedText", extractedText)

      setIsProcessing(false)

      toast({
        title: "OCR concluído",
        description: "O texto foi extraído com sucesso do documento",
        variant: "default",
      })

      return extractedText
    } catch (error) {
      console.error("Error performing OCR:", error)
      setIsProcessing(false)

      toast({
        title: "Erro no OCR",
        description: "Não foi possível extrair o texto do documento",
        variant: "destructive",
      })

      return null
    }
  }

  const compressImage = async (quality: number) => {
    if (!transformedImage) return null

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"

      return new Promise<string>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          if (!ctx) {
            reject(new Error("Não foi possível criar o contexto do canvas"))
            return
          }

          canvas.width = img.width
          canvas.height = img.height

          ctx.drawImage(img, 0, 0)

          // Comprimir a imagem com a qualidade especificada
          const compressedImageUrl = canvas.toDataURL("image/jpeg", quality / 100)

          // Calcular a taxa de compressão
          const originalSize = transformedImage.length
          const compressedSize = compressedImageUrl.length
          const compressionRatio = (1 - compressedSize / originalSize) * 100

          toast({
            title: "Imagem comprimida",
            description: `Compressão: ${compressionRatio.toFixed(1)}% (qualidade: ${quality}%)`,
            variant: "default",
          })

          resolve(compressedImageUrl)
        }

        img.onerror = () => {
          reject(new Error("Erro ao carregar a imagem para compressão"))
        }

        img.src = transformedImage
      })
    } catch (error) {
      console.error("Error compressing image:", error)

      toast({
        title: "Erro na compressão",
        description: "Não foi possível comprimir a imagem",
        variant: "destructive",
      })

      return null
    }
  }

  const handleAddAnother = () => {
    router.push("/scan/camera")
  }

  const handleRotate = (direction: "cw" | "ccw") => {
    setRotation((prevRotation) => {
      const newRotation = direction === "cw" ? prevRotation + 90 : prevRotation - 90
      return newRotation >= 360 ? newRotation - 360 : newRotation < 0 ? 360 + newRotation : newRotation
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Carregando editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-5xl">
        <div className="flex items-center mb-4 sm:mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-4">
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
                <canvas ref={previewCanvasRef} className="hidden" />
                <canvas ref={originalCanvasRef} className="hidden" />

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
                      className="absolute border-2 border-blue-500 cursor-move"
                      style={{
                        top: `${(cropRect.top * 100) / imageSize.height}%`,
                        left: `${(cropRect.left * 100) / imageSize.width}%`,
                        right: `${(cropRect.right * 100) / imageSize.width}%`,
                        bottom: `${(cropRect.bottom * 100) / imageSize.height}%`,
                      }}
                      onMouseDown={handleCropAreaMouseDown}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        handleCropAreaMouseDown(e as any)
                      }}
                    >
                      <div
                        className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 rounded-full cursor-nwse-resize z-10"
                        onMouseDown={(e) => handleCropMouseDown("topLeft", e)}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          handleCropMouseDown("topLeft", e as any)
                        }}
                      />
                      <div
                        className="absolute -top-3 -right-3 w-6 h-6 bg-blue-500 rounded-full cursor-nesw-resize z-10"
                        onMouseDown={(e) => handleCropMouseDown("topRight", e)}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          handleCropMouseDown("topRight", e as any)
                        }}
                      />
                      <div
                        className="absolute -bottom-3 -left-3 w-6 h-6 bg-blue-500 rounded-full cursor-nesw-resize z-10"
                        onMouseDown={(e) => handleCropMouseDown("bottomLeft", e)}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          handleCropMouseDown("bottomLeft", e as any)
                        }}
                      />
                      <div
                        className="absolute -bottom-3 -right-3 w-6 h-6 bg-blue-500 rounded-full cursor-nwse-resize z-10"
                        onMouseDown={(e) => handleCropMouseDown("bottomRight", e)}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          handleCropMouseDown("bottomRight", e as any)
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Prévia da imagem */}
                {showPreview && previewImage && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg max-w-[90%] max-h-[90%] overflow-auto">
                      <div className="text-center mb-2 font-medium">Prévia das alterações</div>
                      <img
                        src={previewImage || "/placeholder.svg"}
                        alt="Prévia"
                        className="max-w-full max-h-[60vh] object-contain mb-4"
                      />
                      <div className="flex justify-between gap-2">
                        <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleApplyChanges}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={isApplying}
                        >
                          {isApplying ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Aplicando...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Aplicar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
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
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                onClick={handleRestoreOriginal}
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Restaurar Original</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={saveToHistory}>
                <Check className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Salvar Estado</span>
              </Button>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 sm:p-6">
                <Tabs defaultValue="adjust" value={editMode} onValueChange={setEditMode} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4 sm:mb-6">
                    <TabsTrigger value="adjust">Ajustes</TabsTrigger>
                    <TabsTrigger value="crop">Recorte</TabsTrigger>
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

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Resolução: {resolution}%</Label>
                          </div>
                          <Slider
                            min={25}
                            max={200}
                            step={5}
                            value={[resolution]}
                            onValueChange={(value) => handleResolutionChange(value[0])}
                          />
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Menor</span>
                            <span>Original</span>
                            <span>Maior</span>
                          </div>
                          <div className="flex justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-10 h-8 p-0"
                              onClick={() => handleResolutionChange(Math.max(25, resolution - 25))}
                            >
                              <Minimize className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-10 h-8 p-0"
                              onClick={() => handleResolutionChange(100)}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-10 h-8 p-0"
                              onClick={() => handleResolutionChange(Math.min(200, resolution + 25))}
                            >
                              <Maximize className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="crop" className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                      Arraste os cantos ou a área inteira para recortar o documento.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={handleAutoCrop}>
                        <Crop className="mr-1 h-4 w-4" />
                        Recorte Automático
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleRestoreCrop}>
                        <RefreshCw className="mr-1 h-4 w-4" />
                        Restaurar Recorte
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

                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 mt-2"
                      onClick={generatePreview}
                    >
                      <ZoomIn className="mr-2 h-4 w-4" />
                      Ver Prévia
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handleApplyChanges}
                      disabled={isApplying}
                    >
                      {isApplying ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Aplicando...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Aplicar Recorte
                        </>
                      )}
                    </Button>
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
                    <Switch
                      id="ocr"
                      checked={ocrEnabled}
                      onCheckedChange={(checked) => {
                        setOcrEnabled(checked)
                        if (checked && !extractedText) {
                          performOCR().then((text) => {
                            if (text) setExtractedText(text)
                          })
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="compress" className="cursor-pointer">
                      Compressão de Arquivo
                    </Label>
                    <Switch id="compress" checked={compressionEnabled} onCheckedChange={setCompressionEnabled} />
                  </div>

                  {compressionEnabled && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between">
                        <Label>Qualidade da Compressão: {compressionQuality}%</Label>
                      </div>
                      <Slider
                        min={10}
                        max={100}
                        step={5}
                        value={[compressionQuality]}
                        onValueChange={(value) => setCompressionQuality(value[0])}
                      />
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Menor tamanho</span>
                        <span>Equilibrado</span>
                        <span>Melhor qualidade</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={performOCR}>
                    <FileText className="mr-1 h-4 w-4" />
                    Extrair Texto (OCR)
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

      {ocrEnabled && extractedText && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full mt-2">
              <FileText className="mr-1 h-4 w-4" />
              Ver Texto Extraído
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Texto Extraído (OCR)</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap bg-slate-100 dark:bg-slate-800 p-4 rounded-md text-sm">
                {extractedText}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

