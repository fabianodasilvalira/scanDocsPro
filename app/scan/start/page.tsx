"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderPlus, FolderOpen, ArrowLeft, ArrowRight, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ScanStart() {
  const router = useRouter()
  const [folderTab, setFolderTab] = useState("existing")
  const [folderName, setFolderName] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("")
  const [resolution, setResolution] = useState(300)
  const [documentType, setDocumentType] = useState("document")

  // Mock folders for demonstration
  const mockFolders = [
    { id: "1", name: "Documentos Pessoais", path: "/Documentos/Pessoais" },
    { id: "2", name: "Faturas", path: "/Documentos/Faturas" },
    { id: "3", name: "Contratos", path: "/Documentos/Contratos" },
  ]

  const handleContinue = () => {
    // In a real app, we would save these settings
    router.push("/scan/camera")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Configurações de Digitalização</h1>
            <p className="text-slate-500 dark:text-slate-400">Configure as opções antes de digitalizar</p>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Destino do Documento</CardTitle>
              <CardDescription>Escolha onde seu documento será salvo</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={folderTab} onValueChange={setFolderTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="existing">Pasta Existente</TabsTrigger>
                  <TabsTrigger value="new">Nova Pasta</TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="space-y-4">
                  <div className="grid gap-4">
                    {mockFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className={cn(
                          "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                          selectedFolder === folder.id
                            ? "bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
                            : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700",
                        )}
                        onClick={() => setSelectedFolder(folder.id)}
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                          <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{folder.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{folder.path}</p>
                        </div>
                        <div className="h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center">
                          {selectedFolder === folder.id && (
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                          )}
                        </div>
                      </div>
                    ))}

                    <Button variant="outline" className="mt-2">
                      <HardDrive className="mr-2 h-4 w-4" />
                      Procurar Outras Pastas
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="new" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="folder-name">Nome da Nova Pasta</Label>
                    <Input
                      id="folder-name"
                      placeholder="Ex: Documentos Importantes"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="folder-location">Local da Pasta</Label>
                    <div className="flex">
                      <Input id="folder-location" readOnly value="/Documentos/" className="rounded-r-none" />
                      <Button variant="secondary" className="rounded-l-none">
                        <FolderPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Configurações de Digitalização</CardTitle>
              <CardDescription>Ajuste as configurações para obter a melhor qualidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Tipo de Documento</Label>
                <RadioGroup
                  value={documentType}
                  onValueChange={setDocumentType}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  <div
                    className={cn(
                      "flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors",
                      documentType === "document"
                        ? "bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
                        : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700",
                    )}
                  >
                    <RadioGroupItem value="document" id="document" className="sr-only" />
                    <Label htmlFor="document" className="flex items-center cursor-pointer w-full">
                      <div className="flex-1">Documento</div>
                    </Label>
                  </div>

                  <div
                    className={cn(
                      "flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors",
                      documentType === "photo"
                        ? "bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
                        : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700",
                    )}
                  >
                    <RadioGroupItem value="photo" id="photo" className="sr-only" />
                    <Label htmlFor="photo" className="flex items-center cursor-pointer w-full">
                      <div className="flex-1">Foto</div>
                    </Label>
                  </div>

                  <div
                    className={cn(
                      "flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors",
                      documentType === "receipt"
                        ? "bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
                        : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700",
                    )}
                  >
                    <RadioGroupItem value="receipt" id="receipt" className="sr-only" />
                    <Label htmlFor="receipt" className="flex items-center cursor-pointer w-full">
                      <div className="flex-1">Recibo</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label htmlFor="resolution">Resolução: {resolution} DPI</Label>
                </div>
                <Slider
                  id="resolution"
                  min={100}
                  max={600}
                  step={100}
                  value={[resolution]}
                  onValueChange={(value) => setResolution(value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <span>100</span>
                  <span>200</span>
                  <span>300</span>
                  <span>400</span>
                  <span>500</span>
                  <span>600</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1">
                  <span>Rápido</span>
                  <span className="flex-1 text-center">Equilibrado</span>
                  <span>Alta Qualidade</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p>Recomendações:</p>
                <p>• Documentos em texto: 300 DPI</p>
                <p>• Fotos e imagens detalhadas: 600 DPI</p>
                <p>• Recibos e notas: 200 DPI</p>
              </div>
            </CardFooter>
          </Card>

          <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleContinue}>
            Continuar para Digitalização
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

