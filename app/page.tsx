import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScanLine, Check, Upload, FolderOpen, FileText } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              DocScan Pro
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Digitalize documentos com qualidade profissional em segundos. Organize, edite e salve seus documentos com
            facilidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl border border-gray-200 dark:border-gray-700">
            <CardContent className="p-8">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Digitalização Profissional</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 mt-0.5">
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Selecione ou crie pastas para organizar seus documentos
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 mt-0.5">
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">Escolha a resolução ideal para suas necessidades</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 mt-0.5">
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Edite com ferramentas profissionais: ajuste de cores, recorte e correção de perspectiva
                    </p>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Link href="/scan/start">
                    <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                      Iniciar Digitalização
                      <ScanLine className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/scan/upload">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      Fazer Upload
                      <Upload className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md">
            <img
              src="/placeholder.svg?height=600&width=800&text=Documento+Digitalizado"
              alt="Exemplo de documento digitalizado"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
              <div className="p-4 text-white">
                <p className="font-medium">Resultados profissionais</p>
                <p className="text-sm opacity-80">Alta qualidade e fácil de usar</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Recursos Principais</h2>
            <Link href="/scan/library">
              <Button
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <FolderOpen className="mr-2 h-5 w-5" />
                Ver Digitalizações
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <div className="aspect-[3/4] relative">
                <img
                  src="/placeholder.svg?height=400&width=300&text=Documento+RG"
                  alt="Exemplo de RG digitalizado"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 dark:text-gray-100">Documentos de Identidade</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Digitalize RG, CNH e outros documentos com alta qualidade
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <div className="aspect-[3/4] relative">
                <img
                  src="/placeholder.svg?height=400&width=300&text=Contrato"
                  alt="Exemplo de contrato digitalizado"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 dark:text-gray-100">Contratos e Documentos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Mantenha seus documentos importantes organizados e seguros
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <div className="aspect-[3/4] relative">
                <img
                  src="/placeholder.svg?height=400&width=300&text=Recibo"
                  alt="Exemplo de recibo digitalizado"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 dark:text-gray-100">Recibos e Notas</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Organize suas despesas e comprovantes com facilidade
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Como Usar o DocScan Pro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Digitalizar ou Fazer Upload</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Use a câmera do seu dispositivo para digitalizar documentos ou faça upload de imagens existentes.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
              </div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Editar e Aprimorar</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ajuste cores, recorte, corrija a perspectiva e aplique outros aprimoramentos ao seu documento.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
              </div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Organizar e Compartilhar</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Salve seus documentos em pastas organizadas e compartilhe-os facilmente quando necessário.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/scan/start">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <FileText className="mr-2 h-5 w-5" />
              Começar a Digitalizar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

