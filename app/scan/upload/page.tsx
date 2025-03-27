"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Upload, File, X, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ScanUpload() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Manipular o arrastar e soltar
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Manipular a seleção de arquivo
  const handleFileSelect = (file: File) => {
    // Verificar se é uma imagem
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Verificar tamanho do arquivo (limite de 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 10MB",
        variant: "destructive",
      })
      return
    }

    setUploadedFile(file)

    // Criar URL de visualização
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    toast({
      title: "Arquivo carregado com sucesso",
      description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
      variant: "default",
    })

    // Processar o arquivo automaticamente após seleção
    processFile(file, objectUrl)
  }

  // Abrir o seletor de arquivo
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Remover o arquivo
  const handleRemoveFile = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Modifique a função processFile para lidar melhor com erros
  const processFile = (file: File, url: string) => {
    setIsUploading(true)

    // Processar a imagem
    const img = new Image()
    img.crossOrigin = "anonymous" // Adicionar crossOrigin para evitar problemas CORS

    img.onload = () => {
      try {
        // Redimensionar a imagem se for muito grande
        const MAX_DIMENSION = 1500
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          throw new Error("Não foi possível criar o contexto de canvas")
        }

        let width = img.width
        let height = img.height

        // Redimensionar se necessário
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = width * ratio
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height)

        // Usar qualidade reduzida para economizar espaço
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.7)

        try {
          // Armazenar no sessionStorage
          sessionStorage.setItem("capturedImage", imageDataUrl)
          sessionStorage.setItem("originalImage", imageDataUrl) // Armazenar a imagem original também

          // Criar dados do documento
          const documentData = {
            corners: null,
            detected: false,
            type: "auto",
            originalWidth: width,
            originalHeight: height,
          }

          sessionStorage.setItem("documentData", JSON.stringify(documentData))

          // Navegar diretamente para a tela de edição
          setIsUploading(false)
          router.push("/scan/edit")
        } catch (storageError) {
          console.error("Storage error:", storageError)

          // Tentar com uma qualidade ainda menor
          const lowQualityImageUrl = canvas.toDataURL("image/jpeg", 0.4)
          try {
            sessionStorage.setItem("capturedImage", lowQualityImageUrl)
            sessionStorage.setItem("originalImage", lowQualityImageUrl)
            sessionStorage.setItem(
              "documentData",
              JSON.stringify({
                corners: null,
                detected: false,
                type: "auto",
                originalWidth: width,
                originalHeight: height,
              }),
            )

            setIsUploading(false)
            router.push("/scan/edit")
          } catch (finalError) {
            setIsUploading(false)
            toast({
              title: "Erro ao processar imagem",
              description: "A imagem é muito grande para ser processada. Tente uma imagem menor.",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Error processing image:", error)
        setIsUploading(false)
        toast({
          title: "Erro ao processar imagem",
          description: "Ocorreu um erro ao processar a imagem. Tente novamente.",
          variant: "destructive",
        })
      }
    }

    img.onerror = () => {
      setIsUploading(false)
      toast({
        title: "Erro ao carregar imagem",
        description: "Não foi possível carregar a imagem para processamento.",
        variant: "destructive",
      })
    }

    img.src = url
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Upload de Documento</h1>
            <p className="text-slate-500 dark:text-slate-400">Selecione ou arraste um arquivo de imagem</p>
          </div>
        </div>

        <Card className="border-0 shadow-xl overflow-hidden mb-6">
          <CardContent className="p-0">
            {!uploadedFile ? (
              <div
                className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-colors ${
                  isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-700"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{ minHeight: "300px" }}
              >
                <Upload className="h-16 w-16 text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Arraste e solte seu arquivo aqui
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
                  ou clique no botão abaixo para selecionar um arquivo do seu dispositivo
                </p>
                <Button onClick={handleButtonClick} className="bg-blue-600 hover:bg-blue-700">
                  Selecionar Arquivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                  Formatos suportados: JPG, PNG, HEIC, PDF (primeira página)
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Documento carregado"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                <div className="absolute top-2 right-2">
                  <Button variant="destructive" size="icon" className="rounded-full" onClick={handleRemoveFile}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {uploadedFile && (
          <div className="space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)}MB • {uploadedFile.type}
                </p>
              </div>
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled={isUploading}>
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Continuar para Edição
                </>
              )}
            </Button>
          </div>
        )}

        <div className="mt-8 bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-sm">
          <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">Dicas para melhores resultados:</h3>
          <ul className="space-y-1 list-disc pl-5 text-slate-600 dark:text-slate-300">
            <li>Use imagens com boa resolução para melhor qualidade</li>
            <li>Certifique-se de que o documento está bem iluminado e sem sombras</li>
            <li>Evite reflexos e brilhos na imagem</li>
            <li>Mantenha o documento alinhado com as bordas da imagem</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

