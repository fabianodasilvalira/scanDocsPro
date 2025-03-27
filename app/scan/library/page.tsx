"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  FolderPlus,
  Search,
  Grid,
  List,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Download,
  Share2,
  FolderOpen,
  File,
  FileText,
  Filter,
  SortAsc,
  SortDesc,
  Info,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Tipos para os dados
interface Document {
  id: string
  name: string
  type: "id" | "contract" | "receipt" | "other"
  thumbnail: string
  dateCreated: string
  size: number
  folderId: string
}

interface Folder {
  id: string
  name: string
  dateCreated: string
  documentCount: number
  parentId: string | null
}

export default function ScanLibrary() {
  const router = useRouter()
  const { toast } = useToast()

  // Estados
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterType, setFilterType] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([])
  const [newFolderName, setNewFolderName] = useState("")
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [targetFolder, setTargetFolder] = useState<string | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [detailsItem, setDetailsItem] = useState<Document | Folder | null>(null)

  // Dados simulados
  const [folders, setFolders] = useState<Folder[]>([
    { id: "root", name: "Meus Documentos", dateCreated: "2023-01-01", documentCount: 0, parentId: null },
    { id: "personal", name: "Documentos Pessoais", dateCreated: "2023-01-02", documentCount: 3, parentId: "root" },
    { id: "work", name: "Documentos de Trabalho", dateCreated: "2023-01-03", documentCount: 2, parentId: "root" },
    { id: "receipts", name: "Recibos e Notas", dateCreated: "2023-01-04", documentCount: 4, parentId: "root" },
    { id: "contracts", name: "Contratos", dateCreated: "2023-02-05", documentCount: 2, parentId: "work" },
  ])

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "doc1",
      name: "RG.jpg",
      type: "id",
      thumbnail: "/placeholder.svg?height=300&width=200&text=RG",
      dateCreated: "2023-02-10",
      size: 1200000,
      folderId: "personal",
    },
    {
      id: "doc2",
      name: "CNH.jpg",
      type: "id",
      thumbnail: "/placeholder.svg?height=300&width=200&text=CNH",
      dateCreated: "2023-02-15",
      size: 1500000,
      folderId: "personal",
    },
    {
      id: "doc3",
      name: "Título de Eleitor.jpg",
      type: "id",
      thumbnail: "/placeholder.svg?height=300&width=200&text=Título",
      dateCreated: "2023-03-01",
      size: 900000,
      folderId: "personal",
    },
    {
      id: "doc4",
      name: "Contrato de Trabalho.pdf",
      type: "contract",
      thumbnail: "/placeholder.svg?height=300&width=200&text=Contrato",
      dateCreated: "2023-03-10",
      size: 2500000,
      folderId: "work",
    },
    {
      id: "doc5",
      name: "NDA.pdf",
      type: "contract",
      thumbnail: "/placeholder.svg?height=300&width=200&text=NDA",
      dateCreated: "2023-03-15",
      size: 1800000,
      folderId: "contracts",
    },
    {
      id: "doc6",
      name: "Contrato de Aluguel.pdf",
      type: "contract",
      thumbnail: "/placeholder.svg?height=300&width=200&text=Aluguel",
      dateCreated: "2023-04-01",
      size: 3200000,
      folderId: "contracts",
    },
    {
      id: "doc7",
      name: "Recibo Supermercado.jpg",
      type: "receipt",
      thumbnail: "/placeholder.svg?height=300&width=200&text=Recibo",
      dateCreated: "2023-04-10",
      size: 800000,
      folderId: "receipts",
    },
    {
      id: "doc8",
      name: "Nota Fiscal Eletrônica.pdf",
      type: "receipt",
      thumbnail: "/placeholder.svg?height=300&width=200&text=NFe",
      dateCreated: "2023-04-15",
      size: 700000,
      folderId: "receipts",
    },
    {
      id: "doc9",
      name: "Recibo Farmácia.jpg",
      type: "receipt",
      thumbnail: "/placeholder.svg?height=300&width=200&text=Farmácia",
      dateCreated: "2023-05-01",
      size: 600000,
      folderId: "receipts",
    },
    {
      id: "doc10",
      name: "Recibo Posto de Gasolina.jpg",
      type: "receipt",
      thumbnail: "/placeholder.svg?height=300&width=200&text=Posto",
      dateCreated: "2023-05-10",
      size: 550000,
      folderId: "receipts",
    },
  ])

  // Efeito para atualizar breadcrumbs quando a pasta atual muda
  useEffect(() => {
    if (currentFolder === null) {
      setBreadcrumbs([])
      return
    }

    const buildBreadcrumbs = (folderId: string): { id: string; name: string }[] => {
      const folder = folders.find((f) => f.id === folderId)
      if (!folder) return []

      if (folder.parentId === null) {
        return [{ id: folder.id, name: folder.name }]
      }

      return [...buildBreadcrumbs(folder.parentId), { id: folder.id, name: folder.name }]
    }

    setBreadcrumbs(buildBreadcrumbs(currentFolder))
  }, [currentFolder, folders])

  // Filtrar pastas e documentos com base na pasta atual e na pesquisa
  const filteredFolders = folders
    .filter((folder) => folder.parentId === currentFolder)
    .filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
          : new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      }
      return 0
    })

  const filteredDocuments = documents
    .filter((doc) => doc.folderId === currentFolder)
    .filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((doc) => (filterType ? doc.type === filterType : true))
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
          : new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      } else if (sortBy === "size") {
        return sortOrder === "asc" ? a.size - b.size : b.size - a.size
      }
      return 0
    })

  // Funções auxiliares
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  // Manipuladores de eventos
  const handleFolderClick = (folderId: string) => {
    setCurrentFolder(folderId)
    setSelectedItems([])
  }

  const handleBreadcrumbClick = (folderId: string) => {
    setCurrentFolder(folderId)
    setSelectedItems([])
  }

  const handleBackClick = () => {
    if (breadcrumbs.length <= 1) {
      setCurrentFolder(null)
    } else {
      const parentFolder = breadcrumbs[breadcrumbs.length - 2]
      setCurrentFolder(parentFolder.id)
    }
    setSelectedItems([])
  }

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleSelectAll = () => {
    const allItems = [...filteredFolders.map((folder) => folder.id), ...filteredDocuments.map((doc) => doc.id)]

    if (selectedItems.length === allItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(allItems)
    }
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome válido para a pasta.",
        variant: "destructive",
      })
      return
    }

    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      dateCreated: new Date().toISOString().split("T")[0],
      documentCount: 0,
      parentId: currentFolder,
    }

    setFolders([...folders, newFolder])
    setNewFolderName("")
    setShowNewFolderDialog(false)

    toast({
      title: "Pasta criada",
      description: `A pasta "${newFolderName}" foi criada com sucesso.`,
      variant: "default",
    })
  }

  const handleRenameItem = (id: string) => {
    if (!newName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome válido.",
        variant: "destructive",
      })
      return
    }

    // Verificar se é uma pasta ou documento
    const folder = folders.find((f) => f.id === id)
    if (folder) {
      setFolders(folders.map((f) => (f.id === id ? { ...f, name: newName } : f)))
    } else {
      setDocuments(documents.map((d) => (d.id === id ? { ...d, name: newName } : d)))
    }

    setIsRenaming(null)
    setNewName("")

    toast({
      title: "Item renomeado",
      description: `O item foi renomeado para "${newName}".`,
      variant: "default",
    })
  }

  const handleDeleteItems = () => {
    // Remover pastas selecionadas
    const updatedFolders = folders.filter((folder) => !selectedItems.includes(folder.id))

    // Remover documentos selecionados
    const updatedDocuments = documents.filter((doc) => !selectedItems.includes(doc.id))

    setFolders(updatedFolders)
    setDocuments(updatedDocuments)
    setSelectedItems([])

    toast({
      title: "Itens excluídos",
      description: `${selectedItems.length} item(s) foram excluídos com sucesso.`,
      variant: "default",
    })
  }

  const handleMoveItems = () => {
    if (!targetFolder) {
      toast({
        title: "Pasta de destino não selecionada",
        description: "Por favor, selecione uma pasta de destino.",
        variant: "destructive",
      })
      return
    }

    // Mover pastas selecionadas
    const updatedFolders = folders.map((folder) => {
      if (selectedItems.includes(folder.id)) {
        return { ...folder, parentId: targetFolder }
      }
      return folder
    })

    // Mover documentos selecionados
    const updatedDocuments = documents.map((doc) => {
      if (selectedItems.includes(doc.id)) {
        return { ...doc, folderId: targetFolder }
      }
      return doc
    })

    setFolders(updatedFolders)
    setDocuments(updatedDocuments)
    setSelectedItems([])
    setShowMoveDialog(false)
    setTargetFolder(null)

    toast({
      title: "Itens movidos",
      description: `${selectedItems.length} item(s) foram movidos com sucesso.`,
      variant: "default",
    })
  }

  const handleCopyDocument = (docId: string) => {
    const docToCopy = documents.find((d) => d.id === docId)
    if (!docToCopy) return

    const newDoc: Document = {
      ...docToCopy,
      id: `doc-${Date.now()}`,
      name: `Cópia de ${docToCopy.name}`,
      dateCreated: new Date().toISOString().split("T")[0],
    }

    setDocuments([...documents, newDoc])

    toast({
      title: "Documento copiado",
      description: `Uma cópia do documento foi criada com sucesso.`,
      variant: "default",
    })
  }

  const handleDownloadDocument = (docId: string) => {
    toast({
      title: "Download iniciado",
      description: "O documento está sendo baixado para o seu dispositivo.",
      variant: "default",
    })
  }

  const handleShareDocument = (docId: string) => {
    toast({
      title: "Compartilhamento",
      description: "Opções de compartilhamento abertas.",
      variant: "default",
    })
  }

  const handleShowDetails = (item: Document | Folder) => {
    setDetailsItem(item)
    setShowDetailsDialog(true)
  }

  // Renderização de componentes
  const renderBreadcrumbs = () => (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 overflow-x-auto pb-2">
      <button
        onClick={() => setCurrentFolder(null)}
        className="hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap"
      >
        Meus Documentos
      </button>

      {breadcrumbs.length > 0 && <span>/</span>}

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center">
          {index > 0 && <span className="mx-1">/</span>}
          <button
            onClick={() => handleBreadcrumbClick(crumb.id)}
            className={`hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap ${
              index === breadcrumbs.length - 1 ? "font-medium text-blue-600 dark:text-blue-400" : ""
            }`}
          >
            {crumb.name}
          </button>
        </div>
      ))}
    </div>
  )

  const renderFolderGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {filteredFolders.map((folder) => (
        <Card
          key={folder.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedItems.includes(folder.id) ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
          }`}
        >
          <CardContent className="p-3 relative">
            <div className="absolute top-2 right-2 z-10">
              <Checkbox
                checked={selectedItems.includes(folder.id)}
                onCheckedChange={() => handleItemSelect(folder.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex flex-col items-center text-center" onClick={() => handleFolderClick(folder.id)}>
              <div className="h-24 w-24 flex items-center justify-center mb-2">
                <FolderOpen className="h-20 w-20 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="font-medium text-sm truncate w-full">{folder.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {folder.documentCount} {folder.documentCount === 1 ? "documento" : "documentos"}
              </p>
            </div>
          </CardContent>
          <CardFooter className="p-2 pt-0 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setIsRenaming(folder.id)
                    setNewName(folder.name)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShowDetails(folder)}>
                  <Info className="mr-2 h-4 w-4" />
                  Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400"
                  onClick={() => {
                    setSelectedItems([folder.id])
                    handleDeleteItems()
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}

      {filteredDocuments.map((doc) => (
        <Card
          key={doc.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedItems.includes(doc.id) ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
          }`}
        >
          <CardContent className="p-3 relative">
            <div className="absolute top-2 right-2 z-10">
              <Checkbox
                checked={selectedItems.includes(doc.id)}
                onCheckedChange={() => handleItemSelect(doc.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex flex-col items-center text-center" onClick={() => handleShowDetails(doc)}>
              <div className="h-24 w-24 flex items-center justify-center mb-2 overflow-hidden">
                <img
                  src={doc.thumbnail || "/placeholder.svg"}
                  alt={doc.name}
                  className="max-h-full max-w-full object-cover"
                />
              </div>
              <p className="font-medium text-sm truncate w-full">{doc.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(doc.size)}</p>
            </div>
          </CardContent>
          <CardFooter className="p-2 pt-0 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setIsRenaming(doc.id)
                    setNewName(doc.name)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopyDocument(doc.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadDocument(doc.id)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShowDetails(doc)}>
                  <Info className="mr-2 h-4 w-4" />
                  Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400"
                  onClick={() => {
                    setSelectedItems([doc.id])
                    handleDeleteItems()
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  const renderFolderList = () => (
    <div className="space-y-2">
      {filteredFolders.map((folder) => (
        <div
          key={folder.id}
          className={`flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
            selectedItems.includes(folder.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
          }`}
        >
          <Checkbox
            checked={selectedItems.includes(folder.id)}
            onCheckedChange={() => handleItemSelect(folder.id)}
            className="mr-2"
          />

          <div className="flex items-center flex-1 cursor-pointer" onClick={() => handleFolderClick(folder.id)}>
            <FolderOpen className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-3" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{folder.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {folder.documentCount} {folder.documentCount === 1 ? "documento" : "documentos"} • Criado em{" "}
                {formatDate(folder.dateCreated)}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setIsRenaming(folder.id)
                  setNewName(folder.name)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShowDetails(folder)}>
                <Info className="mr-2 h-4 w-4" />
                Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => {
                  setSelectedItems([folder.id])
                  handleDeleteItems()
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      {filteredDocuments.map((doc) => (
        <div
          key={doc.id}
          className={`flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
            selectedItems.includes(doc.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
          }`}
        >
          <Checkbox
            checked={selectedItems.includes(doc.id)}
            onCheckedChange={() => handleItemSelect(doc.id)}
            className="mr-2"
          />

          <div className="flex items-center flex-1 cursor-pointer" onClick={() => handleShowDetails(doc)}>
            <div className="h-10 w-10 flex items-center justify-center mr-3 overflow-hidden rounded">
              <img
                src={doc.thumbnail || "/placeholder.svg"}
                alt={doc.name}
                className="max-h-full max-w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{doc.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(doc.size)} • Criado em {formatDate(doc.dateCreated)}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setIsRenaming(doc.id)
                  setNewName(doc.name)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyDocument(doc.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadDocument(doc.id)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShowDetails(doc)}>
                <Info className="mr-2 h-4 w-4" />
                Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => {
                  setSelectedItems([doc.id])
                  handleDeleteItems()
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Minhas Digitalizações</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie seus documentos digitalizados</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/scan/camera")}>
              <FileText className="mr-2 h-4 w-4" />
              Nova Digitalização
            </Button>

            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Nova Pasta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Pasta</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="folder-name">Nome da Pasta</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Digite o nome da pasta"
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateFolder}>Criar Pasta</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar documentos e pastas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={(value: "name" | "date" | "size") => setSortBy(value)}>
                <SelectTrigger className="w-[130px]">
                  <div className="flex items-center">
                    <SortAsc className="mr-2 h-4 w-4" />
                    <span>Ordenar por</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="size">Tamanho</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>

              <Select
                value={filterType || "all"}
                onValueChange={(value) => setFilterType(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[130px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Filtrar</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="id">Documentos de ID</SelectItem>
                  <SelectItem value="contract">Contratos</SelectItem>
                  <SelectItem value="receipt">Recibos</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode((prev) => (prev === "grid" ? "list" : "grid"))}
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {currentFolder !== null && (
            <div className="mb-4">
              <Button variant="ghost" size="sm" onClick={handleBackClick} className="mr-2">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar
              </Button>
              {renderBreadcrumbs()}
            </div>
          )}

          {(filteredFolders.length > 0 || filteredDocuments.length > 0) && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedItems.length > 0 &&
                    selectedItems.length === filteredFolders.length + filteredDocuments.length
                  }
                  onCheckedChange={handleSelectAll}
                  className="mr-2"
                />
                <Label htmlFor="select-all" className="cursor-pointer">
                  Selecionar todos
                </Label>
              </div>

              {selectedItems.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Mover
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Mover Itens</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Label>Selecione a pasta de destino</Label>
                        <Select value={targetFolder || ""} onValueChange={setTargetFolder}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Selecione uma pasta" />
                          </SelectTrigger>
                          <SelectContent>
                            {folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                {folder.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleMoveItems}>Mover</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleDeleteItems}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          )}

          {filteredFolders.length === 0 && filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <File className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Nenhum item encontrado</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery ? `Não encontramos resultados para "${searchQuery}"` : "Esta pasta está vazia"}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => router.push("/scan/camera")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Nova Digitalização
                </Button>
                <Button variant="outline" onClick={() => setShowNewFolderDialog(true)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Nova Pasta
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="folders">Pastas ({filteredFolders.length})</TabsTrigger>
                  <TabsTrigger value="documents">Documentos ({filteredDocuments.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all">{viewMode === "grid" ? renderFolderGrid() : renderFolderList()}</TabsContent>

                <TabsContent value="folders">
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {filteredFolders.map((folder) => (
                        <Card
                          key={folder.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedItems.includes(folder.id)
                              ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                        >
                          <CardContent className="p-3 relative">
                            <div className="absolute top-2 right-2 z-10">
                              <Checkbox
                                checked={selectedItems.includes(folder.id)}
                                onCheckedChange={() => handleItemSelect(folder.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            <div
                              className="flex flex-col items-center text-center"
                              onClick={() => handleFolderClick(folder.id)}
                            >
                              <div className="h-24 w-24 flex items-center justify-center mb-2">
                                <FolderOpen className="h-20 w-20 text-blue-500 dark:text-blue-400" />
                              </div>
                              <p className="font-medium text-sm truncate w-full">{folder.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {folder.documentCount} {folder.documentCount === 1 ? "documento" : "documentos"}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter className="p-2 pt-0 flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setIsRenaming(folder.id)
                                    setNewName(folder.name)
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Renomear
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShowDetails(folder)}>
                                  <Info className="mr-2 h-4 w-4" />
                                  Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => {
                                    setSelectedItems([folder.id])
                                    handleDeleteItems()
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredFolders.map((folder) => (
                        <div
                          key={folder.id}
                          className={`flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
                            selectedItems.includes(folder.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                        >
                          <Checkbox
                            checked={selectedItems.includes(folder.id)}
                            onCheckedChange={() => handleItemSelect(folder.id)}
                            className="mr-2"
                          />

                          <div
                            className="flex items-center flex-1 cursor-pointer"
                            onClick={() => handleFolderClick(folder.id)}
                          >
                            <FolderOpen className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-3" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{folder.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {folder.documentCount} {folder.documentCount === 1 ? "documento" : "documentos"} •
                                Criado em {formatDate(folder.dateCreated)}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setIsRenaming(folder.id)
                                  setNewName(folder.name)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Renomear
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShowDetails(folder)}>
                                <Info className="mr-2 h-4 w-4" />
                                Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400"
                                onClick={() => {
                                  setSelectedItems([folder.id])
                                  handleDeleteItems()
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents">
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {filteredDocuments.map((doc) => (
                        <Card
                          key={doc.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedItems.includes(doc.id) ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                        >
                          <CardContent className="p-3 relative">
                            <div className="absolute top-2 right-2 z-10">
                              <Checkbox
                                checked={selectedItems.includes(doc.id)}
                                onCheckedChange={() => handleItemSelect(doc.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            <div
                              className="flex flex-col items-center text-center"
                              onClick={() => handleShowDetails(doc)}
                            >
                              <div className="h-24 w-24 flex items-center justify-center mb-2 overflow-hidden">
                                <img
                                  src={doc.thumbnail || "/placeholder.svg"}
                                  alt={doc.name}
                                  className="max-h-full max-w-full object-cover"
                                />
                              </div>
                              <p className="font-medium text-sm truncate w-full">{doc.name}</p>
                              <p
                                className="text-xs text
-gray-500 dark:text-gray-400"
                              >
                                {formatFileSize(doc.size)}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter className="p-2 pt-0 flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setIsRenaming(doc.id)
                                    setNewName(doc.name)
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Renomear
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyDocument(doc.id)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadDocument(doc.id)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Compartilhar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShowDetails(doc)}>
                                  <Info className="mr-2 h-4 w-4" />
                                  Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => {
                                    setSelectedItems([doc.id])
                                    handleDeleteItems()
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className={`flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
                            selectedItems.includes(doc.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                        >
                          <Checkbox
                            checked={selectedItems.includes(doc.id)}
                            onCheckedChange={() => handleItemSelect(doc.id)}
                            className="mr-2"
                          />

                          <div
                            className="flex items-center flex-1 cursor-pointer"
                            onClick={() => handleShowDetails(doc)}
                          >
                            <div className="h-10 w-10 flex items-center justify-center mr-3 overflow-hidden rounded">
                              <img
                                src={doc.thumbnail || "/placeholder.svg"}
                                alt={doc.name}
                                className="max-h-full max-w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(doc.size)} • Criado em {formatDate(doc.dateCreated)}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setIsRenaming(doc.id)
                                  setNewName(doc.name)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Renomear
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyDocument(doc.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadDocument(doc.id)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Compartilhar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShowDetails(doc)}>
                                <Info className="mr-2 h-4 w-4" />
                                Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400"
                                onClick={() => {
                                  setSelectedItems([doc.id])
                                  handleDeleteItems()
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo de renomeação */}
      <Dialog open={isRenaming !== null} onOpenChange={(open) => !open && setIsRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-name">Novo Nome</Label>
            <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenaming(null)}>
              Cancelar
            </Button>
            <Button onClick={() => isRenaming && handleRenameItem(isRenaming)}>Renomear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Item</DialogTitle>
          </DialogHeader>

          {detailsItem && (
            <div className="py-4">
              {"thumbnail" in detailsItem ? (
                // É um documento
                <div className="flex flex-col items-center">
                  <div className="h-40 w-40 flex items-center justify-center mb-4 overflow-hidden">
                    <img
                      src={detailsItem.thumbnail || "/placeholder.svg"}
                      alt={detailsItem.name}
                      className="max-h-full max-w-full object-cover"
                    />
                  </div>

                  <h3 className="text-lg font-medium text-center mb-4">{detailsItem.name}</h3>

                  <div className="w-full space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                      <span className="font-medium">
                        {detailsItem.type === "id"
                          ? "Documento de Identidade"
                          : detailsItem.type === "contract"
                            ? "Contrato"
                            : detailsItem.type === "receipt"
                              ? "Recibo"
                              : "Outro"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Tamanho:</span>
                      <span className="font-medium">{formatFileSize(detailsItem.size)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Data de criação:</span>
                      <span className="font-medium">{formatDate(detailsItem.dateCreated)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Pasta:</span>
                      <span className="font-medium">
                        {folders.find((f) => f.id === detailsItem.folderId)?.name || "Desconhecida"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-2 mt-6 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(detailsItem.id)}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareDocument(detailsItem.id)}
                      className="flex-1"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              ) : (
                // É uma pasta
                <div className="flex flex-col items-center">
                  <div className="h-40 w-40 flex items-center justify-center mb-4">
                    <FolderOpen className="h-32 w-32 text-blue-500 dark:text-blue-400" />
                  </div>

                  <h3 className="text-lg font-medium text-center mb-4">{detailsItem.name}</h3>

                  <div className="w-full space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Documentos:</span>
                      <span className="font-medium">{detailsItem.documentCount}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Data de criação:</span>
                      <span className="font-medium">{formatDate(detailsItem.dateCreated)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Pasta pai:</span>
                      <span className="font-medium">
                        {detailsItem.parentId
                          ? folders.find((f) => f.id === detailsItem.parentId)?.name || "Desconhecida"
                          : "Raiz"}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="mt-6 w-full"
                    onClick={() => {
                      setShowDetailsDialog(false)
                      handleFolderClick(detailsItem.id)
                    }}
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Abrir Pasta
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

