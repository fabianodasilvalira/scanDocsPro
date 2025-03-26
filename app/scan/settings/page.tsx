"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FolderPlus, ArrowLeft, ArrowRight } from "lucide-react"

export default function ScanSettings() {
  const router = useRouter()
  const [folderName, setFolderName] = useState("")
  const [dpi, setDpi] = useState(300)
  const [folderType, setFolderType] = useState("existing")

  const handleContinue = () => {
    // In a real app, we would save these settings to state or context
    router.push("/scan/camera")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">Configurações de Digitalização</h1>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full space-y-6">
        <div className="space-y-2">
          <Label>Tipo de Pasta</Label>
          <Select value={folderType} onValueChange={setFolderType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de pasta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="existing">Pasta Existente</SelectItem>
              <SelectItem value="new">Nova Pasta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {folderType === "new" ? (
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nome da Nova Pasta</Label>
            <Input
              id="folder-name"
              placeholder="Digite o nome da pasta"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Selecionar Pasta</Label>
            <div className="flex">
              <Input readOnly placeholder="Selecione uma pasta" value={folderName} className="rounded-r-none" />
              <Button variant="secondary" className="rounded-l-none">
                <FolderPlus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="dpi">Resolução (DPI): {dpi}</Label>
          </div>
          <Slider id="dpi" min={300} max={600} step={100} value={[dpi]} onValueChange={(value) => setDpi(value[0])} />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>300</span>
            <span>400</span>
            <span>500</span>
            <span>600</span>
          </div>
        </div>

        <Button size="lg" className="w-full mt-8" onClick={handleContinue}>
          Continuar
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

