"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, FolderOpen, Plus, Home, Download, Share2, Edit } from "lucide-react"

export default function ScanSuccess() {
  const router = useRouter()
  const [finalImage, setFinalImage] = useState<string | null>(null)

  useEffect(() => {
    // Get the final image from session storage
    const storedImage = sessionStorage.getItem("finalImage") || sessionStorage.getItem("processedImage")
    if (storedImage) {
      setFinalImage(storedImage)
    } else {
      // If no image is found, use a placeholder
      setFinalImage("/placeholder.svg?height=800&width=600")
    }
  }, [])

  const handleDownload = () => {
    if (!finalImage) return

    // Create a temporary link element
    const link = document.createElement("a")
    link.href = finalImage
    link.download = `documento_${new Date().toISOString().slice(0, 10)}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (!finalImage || !navigator.share) return

    try {
      // Convert data URL to blob
      const response = await fetch(finalImage)
      const blob = await response.blob()
      const file = new File([blob], "documento.jpg", { type: "image/jpeg" })

      await navigator.share({
        title: "Documento Digitalizado",
        text: "Documento digitalizado com DocScan Pro",
        files: [file],
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const handleEdit = () => {
    router.push("/scan/edit")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center py-8">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="border-0 shadow-xl overflow-hidden bg-white dark:bg-gray-800">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Documento Salvo com Sucesso!
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Seu documento foi digitalizado e processado com sucesso.
            </p>

            {finalImage && (
              <div className="w-full mb-6 rounded-lg overflow-hidden shadow-md">
                <img src={finalImage || "/placeholder.svg"} alt="Documento processado" className="w-full h-auto" />
              </div>
            )}

            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 w-full mb-6">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800 dark:text-gray-100">Documentos Pessoais</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">/Documentos/Pessoais</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full mb-4">
              <Button variant="outline" size="lg" className="w-full" onClick={handleDownload}>
                <Download className="mr-2 h-5 w-5" />
                Baixar
              </Button>

              <Button variant="outline" size="lg" className="w-full" onClick={handleShare} disabled={!navigator.share}>
                <Share2 className="mr-2 h-5 w-5" />
                Compartilhar
              </Button>

              <Button variant="outline" size="lg" className="w-full" onClick={handleEdit}>
                <Edit className="mr-2 h-5 w-5" />
                Editar
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <Button variant="outline" size="lg" className="w-full" onClick={() => router.push("/scan/camera")}>
                <Plus className="mr-2 h-5 w-5" />
                Novo Documento
              </Button>

              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push("/")}
              >
                <Home className="mr-2 h-5 w-5" />
                Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

