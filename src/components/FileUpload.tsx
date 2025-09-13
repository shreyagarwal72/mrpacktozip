import { useState, useCallback } from "react"
import { Upload, FileArchive, Download, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import JSZip from "jszip"

interface ConversionState {
  status: 'idle' | 'converting' | 'success' | 'error'
  progress: number
  downloadUrl?: string
  fileName?: string
  error?: string
}

export function FileUpload() {
  const [dragActive, setDragActive] = useState(false)
  const [conversion, setConversion] = useState<ConversionState>({ status: 'idle', progress: 0 })
  const { toast } = useToast()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const convertMrpackToZip = async (file: File) => {
    try {
      setConversion({ status: 'converting', progress: 20 })
      
      // Read the mrpack file (which is essentially a zip)
      const arrayBuffer = await file.arrayBuffer()
      setConversion(prev => ({ ...prev, progress: 40 }))
      
      // Load the mrpack as a zip
      const mrpackZip = await JSZip.loadAsync(arrayBuffer)
      setConversion(prev => ({ ...prev, progress: 60 }))
      
      // Create a new zip with the same contents
      const newZip = new JSZip()
      
      // Copy all files from mrpack to new zip
      for (const [relativePath, file] of Object.entries(mrpackZip.files)) {
        if (!file.dir) {
          const content = await file.async("arraybuffer")
          newZip.file(relativePath, content)
        }
      }
      
      setConversion(prev => ({ ...prev, progress: 80 }))
      
      // Generate the zip file
      const zipBlob = await newZip.generateAsync({ type: "blob" })
      setConversion(prev => ({ ...prev, progress: 90 }))
      
      // Create download URL
      const downloadUrl = URL.createObjectURL(zipBlob)
      const fileName = file.name.replace('.mrpack', '.zip')
      
      setConversion({ 
        status: 'success', 
        progress: 100, 
        downloadUrl, 
        fileName 
      })
      
      toast({
        title: "Conversion successful!",
        description: `${fileName} is ready for download.`,
      })
      
    } catch (error) {
      console.error('Conversion error:', error)
      setConversion({ 
        status: 'error', 
        progress: 0, 
        error: 'Failed to convert file. Please ensure it\'s a valid .mrpack file.' 
      })
      
      toast({
        title: "Conversion failed",
        description: "Please ensure you've uploaded a valid .mrpack file.",
        variant: "destructive",
      })
    }
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    
    if (!file.name.endsWith('.mrpack')) {
      toast({
        title: "Invalid file type",
        description: "Please select a .mrpack file.",
        variant: "destructive",
      })
      return
    }
    
    convertMrpackToZip(file)
  }, [toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    handleFiles(e.target.files)
  }, [handleFiles])

  const handleDownload = () => {
    if (conversion.downloadUrl && conversion.fileName) {
      const link = document.createElement('a')
      link.href = conversion.downloadUrl
      link.download = conversion.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const resetConversion = () => {
    if (conversion.downloadUrl) {
      URL.revokeObjectURL(conversion.downloadUrl)
    }
    setConversion({ status: 'idle', progress: 0 })
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="relative overflow-hidden border-2 border-dashed transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm" 
            style={{ 
              borderColor: dragActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              background: dragActive ? 'var(--gradient-accent)' : undefined
            }}>
        <div
          className={`p-12 text-center transition-all duration-300 ${
            dragActive ? 'scale-105' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="sr-only"
            accept=".mrpack"
            onChange={handleChange}
            disabled={conversion.status === 'converting'}
          />
          
          {conversion.status === 'idle' && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="rounded-full p-4 transition-all duration-300 hover:scale-110"
                     style={{ background: 'var(--gradient-primary)' }}>
                  <Upload className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Upload your .mrpack file</h3>
              <p className="mb-6 text-muted-foreground">
                Drag and drop your Modrinth pack here, or click to browse
              </p>
              <Button asChild variant="outline" className="border-primary/20 hover:border-primary">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileArchive className="mr-2 h-4 w-4" />
                  Select .mrpack File
                </label>
              </Button>
            </>
          )}
          
          {conversion.status === 'converting' && (
            <div className="space-y-4">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full p-4 animate-pulse"
                     style={{ background: 'var(--gradient-primary)' }}>
                  <FileArchive className="h-12 w-12 text-primary-foreground animate-bounce" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Converting your modpack...</h3>
              <div className="space-y-2">
                <Progress value={conversion.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">{conversion.progress}% complete</p>
              </div>
            </div>
          )}
          
          {conversion.status === 'success' && (
            <div className="space-y-4">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full p-4"
                     style={{ background: 'var(--gradient-primary)' }}>
                  <CheckCircle className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-green-500">Conversion Complete!</h3>
              <p className="text-muted-foreground mb-4">
                Your modpack has been successfully converted to ZIP format.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
                  <Download className="mr-2 h-4 w-4" />
                  Download ZIP
                </Button>
                <Button onClick={resetConversion} variant="outline">
                  Convert Another
                </Button>
              </div>
            </div>
          )}
          
          {conversion.status === 'error' && (
            <div className="space-y-4">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full p-4 bg-destructive">
                  <AlertCircle className="h-12 w-12 text-destructive-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-destructive">Conversion Failed</h3>
              <p className="text-muted-foreground mb-4">
                {conversion.error || 'An error occurred during conversion.'}
              </p>
              <Button onClick={resetConversion} variant="outline">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}