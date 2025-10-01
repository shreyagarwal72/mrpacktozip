import { useState, useCallback } from "react"
import { Upload, FileArchive, Download, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import JSZip from "jszip"

interface ConversionState {
  status: 'idle' | 'converting' | 'success' | 'error'
  progress: number
  downloadUrl?: string
  fileName?: string
  error?: string
  currentStep?: string
}

type ConversionMode = 'mrpack-to-zip' | 'zip-to-mrpack'

interface ModrinthFile {
  path: string
  hashes: {
    sha1: string
    sha512: string
  }
  downloads: string[]
  fileSize: number
  env?: {
    client?: 'required' | 'optional' | 'unsupported'
    server?: 'required' | 'optional' | 'unsupported'
  }
}

interface ModrinthIndex {
  formatVersion: number
  game: string
  versionId: string
  name: string
  summary?: string
  files: ModrinthFile[]
  dependencies: Record<string, string>
}

export function FileUpload() {
  const [dragActive, setDragActive] = useState(false)
  const [conversion, setConversion] = useState<ConversionState>({ status: 'idle', progress: 0 })
  const [mode, setMode] = useState<ConversionMode>('mrpack-to-zip')
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

  const downloadFileWithRetry = async (url: string, maxRetries = 3): Promise<ArrayBuffer> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            'User-Agent': 'MRPackConverter/1.0'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return await response.arrayBuffer()
      } catch (error) {
        console.warn(`Download attempt ${attempt} failed for ${url}:`, error)
        if (attempt === maxRetries) {
          throw new Error(`Failed to download ${url} after ${maxRetries} attempts`)
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
    throw new Error('Download failed')
  }

  const convertZipToMrpack = async (file: File) => {
    try {
      setConversion({ status: 'converting', progress: 5, currentStep: 'Reading ZIP file...' })
      
      // Read the ZIP file
      const arrayBuffer = await file.arrayBuffer()
      const zipFile = await JSZip.loadAsync(arrayBuffer)
      
      setConversion(prev => ({ ...prev, progress: 15, currentStep: 'Analyzing modpack structure...' }))
      
      // Look for manifest.json or other modpack indicators
      const manifestFile = zipFile.file('manifest.json')
      let packName = file.name.replace('.zip', '')
      let minecraftVersion = '1.20.1'
      let loaderType = 'fabric'
      let loaderVersion = '0.14.21'
      
      if (manifestFile) {
        try {
          const manifestContent = await manifestFile.async('text')
          const manifest = JSON.parse(manifestContent)
          packName = manifest.name || packName
          minecraftVersion = manifest.minecraft?.version || minecraftVersion
          
          if (manifest.minecraft?.modLoaders?.length > 0) {
            const loader = manifest.minecraft.modLoaders[0]
            if (loader.id.includes('forge')) {
              loaderType = 'forge'
              loaderVersion = loader.id.split('-')[1] || '47.2.0'
            } else if (loader.id.includes('fabric')) {
              loaderType = 'fabric'
              loaderVersion = loader.id.split('-')[1] || '0.15.11'
            } else if (loader.id.includes('quilt')) {
              loaderType = 'quilt'
              loaderVersion = loader.id.split('-')[1] || '0.25.0'
            } else if (loader.id.includes('neoforge')) {
              loaderType = 'neoforge'
              loaderVersion = loader.id.split('-')[1] || '20.4.190'
            }
          }
        } catch (error) {
          console.warn('Failed to parse manifest.json, using defaults:', error)
        }
      }
      
      setConversion(prev => ({ ...prev, progress: 25, currentStep: 'Creating Modrinth index...' }))
      
      // Create the modrinth.index.json structure
      const modrinthIndex: ModrinthIndex = {
        formatVersion: 1,
        game: 'minecraft',
        versionId: '1.0.0',
        name: packName,
        summary: `Converted from ZIP: ${packName}`,
        files: [],
        dependencies: {
          minecraft: minecraftVersion,
          [loaderType === 'fabric' ? 'fabric-loader' : loaderType]: loaderVersion
        }
      }
      
      setConversion(prev => ({ ...prev, progress: 35, currentStep: 'Processing files...' }))
      
      // Create new MRPACK with proper structure
      const mrpackZip = new JSZip()
      const overridesFolder = mrpackZip.folder('overrides')
      let fileCount = 0
      const modFiles: string[] = []
      
      // Iterate through ALL files in the source ZIP
      const allFiles = Object.keys(zipFile.files)
      
      for (let i = 0; i < allFiles.length; i++) {
        const filePath = allFiles[i]
        const fileObj = zipFile.files[filePath]
        
        // Skip directories and manifest
        if (fileObj.dir || filePath === 'manifest.json') {
          continue
        }
        
        // Get file content
        const content = await fileObj.async('arraybuffer')
        
        // Determine where to place the file
        let targetPath = ''
        
        // Handle files in overrides folder
        if (filePath.startsWith('overrides/')) {
          targetPath = filePath.replace('overrides/', '')
        }
        // Handle mods folder at root
        else if (filePath.startsWith('mods/')) {
          targetPath = filePath
        }
        // Handle root-level mod files
        else if (filePath.endsWith('.jar') && !filePath.includes('/')) {
          targetPath = `mods/${filePath}`
        }
        // Handle config files at root
        else if ((filePath.endsWith('.toml') || filePath.endsWith('.json5') || filePath.endsWith('.txt')) && !filePath.includes('/')) {
          targetPath = filePath
        }
        // Handle other standard folders (config, scripts, resources, etc.)
        else if (filePath.startsWith('config/') || filePath.startsWith('scripts/') || 
                 filePath.startsWith('resources/') || filePath.startsWith('defaultconfigs/')) {
          targetPath = filePath
        }
        
        // Add file to overrides if we have a target path
        if (targetPath) {
          overridesFolder?.file(targetPath, content)
          fileCount++
          
          // Track mod files
          if (targetPath.includes('mods/') && (targetPath.endsWith('.jar') || targetPath.endsWith('.zip'))) {
            const fileName = targetPath.split('/').pop() || 'unknown.jar'
            modFiles.push(fileName)
          }
        }
        
        // Update progress
        const progress = 35 + (i / allFiles.length) * 40
        if (i % 5 === 0) {
          setConversion(prev => ({ ...prev, progress, currentStep: `Processing ${i}/${allFiles.length} files...` }))
        }
      }
      
      setConversion(prev => ({ ...prev, progress: 75, currentStep: 'Creating information file...' }))
      
      // Create a helpful README file
      if (modFiles.length > 0) {
        const readmeContent = `# ${packName} - MRPACK Conversion\n\nThis MRPACK was converted from a ZIP file.\n\n## Contents\n- **Mods**: ${modFiles.length} mod files included in overrides/mods\n- **Total files**: ${fileCount} files\n- **Minecraft Version**: ${minecraftVersion}\n- **Mod Loader**: ${loaderType} ${loaderVersion}\n\n## Mod List\n${modFiles.map(mod => `- ${mod}`).join('\n')}\n\n## Note\nAll mods are included locally in the overrides/mods folder. This MRPACK is ready to use with Modrinth App or any MRPACK-compatible launcher.`
        mrpackZip.file('README.md', readmeContent)
      }
      
      setConversion(prev => ({ ...prev, progress: 90, currentStep: 'Finalizing MRPACK...' }))
      
      // Add the modrinth.index.json file
      mrpackZip.file('modrinth.index.json', JSON.stringify(modrinthIndex, null, 2))
      
      setConversion(prev => ({ ...prev, progress: 95, currentStep: 'Generating MRPACK file...' }))
      
      // Generate the MRPACK file
      const mrpackBlob = await mrpackZip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      })
      
      const downloadUrl = URL.createObjectURL(mrpackBlob)
      const fileName = file.name.replace('.zip', '.mrpack')
      
      setConversion({ 
        status: 'success', 
        progress: 100, 
        downloadUrl, 
        fileName,
        currentStep: 'Complete!'
      })
      
      toast({
        title: "Conversion successful!",
        description: `${fileName} created with ${fileCount} files including ${modFiles.length} mods.`,
      })
      
    } catch (error) {
      console.error('Conversion error:', error)
      setConversion({ 
        status: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Failed to convert file. Please ensure it\'s a valid modpack ZIP file.'
      })
      
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Please ensure you've uploaded a valid modpack ZIP file.",
        variant: "destructive",
      })
    }
  }

  const convertMrpackToZip = async (file: File) => {
    try {
      setConversion({ status: 'converting', progress: 5, currentStep: 'Reading modpack...' })
      
      // Read the mrpack file
      const arrayBuffer = await file.arrayBuffer()
      const mrpackZip = await JSZip.loadAsync(arrayBuffer)
      
      setConversion(prev => ({ ...prev, progress: 10, currentStep: 'Parsing modpack index...' }))
      
      // Get the modrinth.index.json file
      const indexFile = mrpackZip.file('modrinth.index.json')
      if (!indexFile) {
        throw new Error('Invalid .mrpack file: missing modrinth.index.json')
      }
      
      const indexContent = await indexFile.async('text')
      const modrinthIndex: ModrinthIndex = JSON.parse(indexContent)
      
      setConversion(prev => ({ ...prev, progress: 15, currentStep: 'Creating new modpack...' }))
      
      // Create new ZIP for the converted modpack
      const newZip = new JSZip()
      
      // Add basic modpack info
      const modpackInfo = {
        minecraft: {
          version: modrinthIndex.dependencies.minecraft || '1.20.1',
          modLoaders: []
        },
        manifestType: 'minecraftModpack',
        manifestVersion: 1,
        name: modrinthIndex.name,
        version: modrinthIndex.versionId,
        author: 'Converted from MRPack',
        files: [],
        overrides: 'overrides'
      }

      // Add mod loader info
      if (modrinthIndex.dependencies.forge) {
        modpackInfo.minecraft.modLoaders.push({
          id: 'forge-' + modrinthIndex.dependencies.forge,
          primary: true
        })
      }
      if (modrinthIndex.dependencies['fabric-loader']) {
        modpackInfo.minecraft.modLoaders.push({
          id: 'fabric-' + modrinthIndex.dependencies['fabric-loader'],
          primary: true
        })
      }
      if (modrinthIndex.dependencies['quilt-loader']) {
        modpackInfo.minecraft.modLoaders.push({
          id: 'quilt-' + modrinthIndex.dependencies['quilt-loader'],
          primary: true
        })
      }
      if (modrinthIndex.dependencies.neoforge) {
        modpackInfo.minecraft.modLoaders.push({
          id: 'neoforge-' + modrinthIndex.dependencies.neoforge,
          primary: true
        })
      }

      newZip.file('manifest.json', JSON.stringify(modpackInfo, null, 2))
      
      setConversion(prev => ({ ...prev, progress: 20, currentStep: 'Copying override files...' }))
      
      // Copy override files
      const overridesFolder = newZip.folder('overrides')
      const clientOverridesFolder = newZip.folder('overrides')
      
      // Copy regular overrides
      const overridesDir = mrpackZip.folder('overrides')
      if (overridesDir) {
        for (const [relativePath, file] of Object.entries(overridesDir.files)) {
          if (!file.dir && relativePath.startsWith('overrides/')) {
            const content = await file.async('arraybuffer')
            const newPath = relativePath.replace('overrides/', '')
            overridesFolder?.file(newPath, content)
          }
        }
      }
      
      // Copy client overrides (these take priority)
      const clientOverridesDir = mrpackZip.folder('client-overrides')
      if (clientOverridesDir) {
        for (const [relativePath, file] of Object.entries(clientOverridesDir.files)) {
          if (!file.dir && relativePath.startsWith('client-overrides/')) {
            const content = await file.async('arraybuffer')
            const newPath = relativePath.replace('client-overrides/', '')
            overridesFolder?.file(newPath, content)
          }
        }
      }
      
      setConversion(prev => ({ ...prev, progress: 30, currentStep: 'Downloading mods...' }))
      
      // Download and add mod files
      const modsFolder = overridesFolder?.folder('mods') || newZip.folder('overrides/mods')
      const totalFiles = modrinthIndex.files.filter(f => 
        f.path.startsWith('mods/') && 
        (!f.env || f.env.client !== 'unsupported')
      ).length
      
      let downloadedFiles = 0
      
      for (const fileInfo of modrinthIndex.files) {
        // Only process mod files that should be on client
        if (!fileInfo.path.startsWith('mods/') || 
            (fileInfo.env && fileInfo.env.client === 'unsupported')) {
          continue
        }
        
        const fileName = fileInfo.path.split('/').pop() || 'unknown.jar'
        
        try {
          setConversion(prev => ({ 
            ...prev, 
            progress: 30 + (downloadedFiles / totalFiles) * 60,
            currentStep: `Downloading ${fileName}...`
          }))
          
          // Try to download from the first available URL
          let fileData: ArrayBuffer | null = null
          for (const url of fileInfo.downloads) {
            try {
              fileData = await downloadFileWithRetry(url)
              break
            } catch (error) {
              console.warn(`Failed to download from ${url}:`, error)
              continue
            }
          }
          
          if (!fileData) {
            throw new Error(`Failed to download ${fileName} from any URL`)
          }
          
          // Add to mods folder
          modsFolder?.file(fileName, fileData)
          downloadedFiles++
          
        } catch (error) {
          console.error(`Error downloading ${fileName}:`, error)
          // Continue with other files rather than failing entirely
        }
      }
      
      setConversion(prev => ({ ...prev, progress: 95, currentStep: 'Finalizing modpack...' }))
      
      // Generate the final ZIP
      const zipBlob = await newZip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      })
      
      const downloadUrl = URL.createObjectURL(zipBlob)
      const fileName = file.name.replace('.mrpack', '.zip')
      
      setConversion({ 
        status: 'success', 
        progress: 100, 
        downloadUrl, 
        fileName,
        currentStep: 'Complete!'
      })
      
      toast({
        title: "Conversion successful!",
        description: `${fileName} is ready for download with ${downloadedFiles} mods.`,
      })
      
    } catch (error) {
      console.error('Conversion error:', error)
      setConversion({ 
        status: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Failed to convert file. Please ensure it\'s a valid .mrpack file.'
      })
      
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Please ensure you've uploaded a valid .mrpack file.",
        variant: "destructive",
      })
    }
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    
    if (mode === 'mrpack-to-zip') {
      if (!file.name.endsWith('.mrpack')) {
        toast({
          title: "Invalid file type",
          description: "Please select a .mrpack file.",
          variant: "destructive",
        })
        return
      }
      convertMrpackToZip(file)
    } else {
      if (!file.name.endsWith('.zip')) {
        toast({
          title: "Invalid file type",
          description: "Please select a .zip file.",
          variant: "destructive",
        })
        return
      }
      convertZipToMrpack(file)
    }
  }, [toast, mode])

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
      <Tabs value={mode} onValueChange={(value) => {
        setMode(value as ConversionMode)
        resetConversion()
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mrpack-to-zip">MRPACK → ZIP</TabsTrigger>
          <TabsTrigger value="zip-to-mrpack">ZIP → MRPACK</TabsTrigger>
        </TabsList>
        
        <TabsContent value={mode} className="mt-6">
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
                accept={mode === 'mrpack-to-zip' ? '.mrpack' : '.zip'}
                onChange={handleChange}
                disabled={conversion.status === 'converting'}
              />
          
              {conversion.status === 'idle' && (
                <>
                  <div className="mb-6 flex justify-center">
                    <div className="rounded-full p-4 transition-all duration-300 hover:scale-110"
                         style={{ background: 'var(--gradient-primary)' }}>
                      {mode === 'mrpack-to-zip' ? 
                        <Upload className="h-12 w-12 text-primary-foreground" /> :
                        <RefreshCw className="h-12 w-12 text-primary-foreground" />
                      }
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">
                    {mode === 'mrpack-to-zip' ? 
                      'Upload your .mrpack file' : 
                      'Upload your .zip file'
                    }
                  </h3>
                  <p className="mb-6 text-muted-foreground">
                    {mode === 'mrpack-to-zip' ? 
                      'Drag and drop your Modrinth pack here, or click to browse' :
                      'Drag and drop your modpack ZIP here, or click to browse'
                    }
                  </p>
                  <Button asChild variant="outline" className="border-primary/20 hover:border-primary">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileArchive className="mr-2 h-4 w-4" />
                      {mode === 'mrpack-to-zip' ? 
                        'Select .mrpack File' : 
                        'Select .zip File'
                      }
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
                    {conversion.currentStep && (
                      <p className="text-xs text-muted-foreground">{conversion.currentStep}</p>
                    )}
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
                    {mode === 'mrpack-to-zip' ? 
                      'Your modpack has been successfully converted to ZIP format.' :
                      'Your modpack has been successfully converted to MRPACK format.'
                    }
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
                      <Download className="mr-2 h-4 w-4" />
                      {mode === 'mrpack-to-zip' ? 'Download ZIP' : 'Download MRPACK'}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}