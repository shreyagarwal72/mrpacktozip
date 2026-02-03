import { useState, useCallback } from "react"
import { Upload, FileArchive, Download, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { ExpressiveButton } from "@/components/ui/expressive-button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
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
  hashes: { sha1: string; sha512: string }
  downloads: string[]
  fileSize: number
  env?: { client?: 'required' | 'optional' | 'unsupported'; server?: 'required' | 'optional' | 'unsupported' }
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

export function ExpressiveFileUpload() {
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
        const response = await fetch(url, { mode: 'cors', headers: { 'User-Agent': 'MRPackConverter/1.0' } })
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        return await response.arrayBuffer()
      } catch (error) {
        if (attempt === maxRetries) throw new Error(`Failed to download ${url} after ${maxRetries} attempts`)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
    throw new Error('Download failed')
  }

  const computeSha512 = async (data: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-512', data)
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const computeSha1 = async (data: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const lookupModsOnModrinth = async (hashes: string[]) => {
    const response = await fetch('https://api.modrinth.com/v2/version_files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'MRPackConverter/1.0' },
      body: JSON.stringify({ hashes, algorithm: 'sha512' })
    })
    if (!response.ok) throw new Error(`Modrinth API error: ${response.status}`)
    return response.json()
  }

  const convertZipToMrpack = useCallback(async (file: File) => {
    // Same logic as original FileUpload - abbreviated for expressive version
    try {
      setConversion({ status: 'converting', progress: 5, currentStep: 'Reading ZIP file...' })
      const arrayBuffer = await file.arrayBuffer()
      const zipFile = await JSZip.loadAsync(arrayBuffer)
      
      setConversion(prev => ({ ...prev, progress: 10, currentStep: 'Analyzing modpack structure...' }))
      
      const manifestFile = zipFile.file('manifest.json')
      let packName = file.name.replace('.zip', '')
      let minecraftVersion = '1.20.1'
      let loaderType = 'fabric'
      let loaderVersion = '0.14.21'
      
      if (manifestFile) {
        try {
          const manifest = JSON.parse(await manifestFile.async('text'))
          packName = manifest.name || packName
          minecraftVersion = manifest.minecraft?.version || minecraftVersion
          if (manifest.minecraft?.modLoaders?.length > 0) {
            const loader = manifest.minecraft.modLoaders[0]
            if (loader.id.includes('forge')) { loaderType = 'forge'; loaderVersion = loader.id.split('-')[1] || '47.2.0' }
            else if (loader.id.includes('fabric')) { loaderType = 'fabric'; loaderVersion = loader.id.split('-')[1] || '0.15.11' }
            else if (loader.id.includes('quilt')) { loaderType = 'quilt'; loaderVersion = loader.id.split('-')[1] || '0.25.0' }
            else if (loader.id.includes('neoforge')) { loaderType = 'neoforge'; loaderVersion = loader.id.split('-')[1] || '20.4.190' }
          }
        } catch {}
      }
      
      setConversion(prev => ({ ...prev, progress: 15, currentStep: 'Collecting mod files...' }))
      
      const modFiles: Array<{ filename: string; content: ArrayBuffer; sha512: string; sha1: string; originalPath: string }> = []
      const nonModFiles: Array<{ path: string; content: ArrayBuffer }> = []
      
      const filePaths: string[] = []
      zipFile.forEach((relativePath) => filePaths.push(relativePath))
      
      for (const filePath of filePaths) {
        const fileObj = zipFile.files[filePath]
        if (fileObj.dir || filePath === 'manifest.json') continue
        const content = await fileObj.async('arraybuffer')
        if (content.byteLength === 0) continue
        
        const isModFile = (filePath.startsWith('mods/') || filePath.startsWith('overrides/mods/')) && (filePath.endsWith('.jar') || filePath.endsWith('.zip'))
        
        if (isModFile) {
          const sha512 = await computeSha512(content)
          const sha1 = await computeSha1(content)
          modFiles.push({ filename: filePath.split('/').pop() || 'unknown.jar', content, sha512, sha1, originalPath: filePath })
        } else {
          nonModFiles.push({ path: filePath.startsWith('overrides/') ? filePath.replace('overrides/', '') : filePath, content })
        }
      }
      
      if (modFiles.length === 0) throw new Error('No mod files found in the ZIP.')
      
      setConversion(prev => ({ ...prev, progress: 45, currentStep: 'Looking up mods on Modrinth...' }))
      
      const modrinthResponse = await lookupModsOnModrinth(modFiles.map(m => m.sha512))
      
      const matchedMods: ModrinthFile[] = []
      const unmatchedMods: string[] = []
      
      for (const mod of modFiles) {
        const version = modrinthResponse[mod.sha512]
        if (version?.files?.length > 0) {
          const matchedFile = version.files.find((f: { hashes: { sha512: string } }) => f.hashes.sha512 === mod.sha512)
          if (matchedFile) {
            matchedMods.push({
              path: `mods/${matchedFile.filename}`,
              hashes: { sha1: matchedFile.hashes.sha1, sha512: matchedFile.hashes.sha512 },
              downloads: [matchedFile.url],
              fileSize: matchedFile.size
            })
          } else unmatchedMods.push(mod.filename)
        } else unmatchedMods.push(mod.filename)
      }
      
      if (unmatchedMods.length > 0) {
        throw new Error(`The following mods are not available on Modrinth:\n${unmatchedMods.map(m => `• ${m}`).join('\n')}`)
      }
      
      setConversion(prev => ({ ...prev, progress: 70, currentStep: 'Building Modrinth index...' }))
      
      const modrinthIndex: ModrinthIndex = {
        formatVersion: 1, game: 'minecraft', versionId: '1.0.0', name: packName,
        summary: `Converted from ZIP: ${packName}`, files: matchedMods,
        dependencies: { minecraft: minecraftVersion, [loaderType === 'fabric' ? 'fabric-loader' : loaderType]: loaderVersion }
      }
      
      const mrpackZip = new JSZip()
      mrpackZip.file('modrinth.index.json', JSON.stringify(modrinthIndex, null, 2))
      const overridesFolder = mrpackZip.folder('overrides')
      for (const file of nonModFiles) overridesFolder?.file(file.path, file.content)
      
      setConversion(prev => ({ ...prev, progress: 90, currentStep: 'Generating MRPACK file...' }))
      
      const mrpackBlob = await mrpackZip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } })
      const downloadUrl = URL.createObjectURL(mrpackBlob)
      
      setConversion({ status: 'success', progress: 100, downloadUrl, fileName: file.name.replace('.zip', '.mrpack'), currentStep: 'Complete!' })
      toast({ title: "Conversion successful!", description: `Ready for Modrinth App!` })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to convert file.'
      setConversion({ status: 'error', progress: 0, error: errorMessage })
      toast({ title: "Conversion failed", description: errorMessage.split('\n')[0], variant: "destructive" })
    }
  }, [toast])

  const convertMrpackToZip = useCallback(async (file: File) => {
    try {
      setConversion({ status: 'converting', progress: 5, currentStep: 'Reading modpack...' })
      
      const arrayBuffer = await file.arrayBuffer()
      const mrpackZip = await JSZip.loadAsync(arrayBuffer)
      
      const indexFile = mrpackZip.file('modrinth.index.json')
      if (!indexFile) throw new Error('Invalid .mrpack file: missing modrinth.index.json')
      
      const modrinthIndex: ModrinthIndex = JSON.parse(await indexFile.async('text'))
      
      setConversion(prev => ({ ...prev, progress: 15, currentStep: 'Creating new modpack...' }))
      
      const newZip = new JSZip()
      const modpackInfo = {
        minecraft: { version: modrinthIndex.dependencies.minecraft || '1.20.1', modLoaders: [] as { id: string; primary: boolean }[] },
        manifestType: 'minecraftModpack', manifestVersion: 1, name: modrinthIndex.name,
        version: modrinthIndex.versionId, author: 'Converted from MRPack', files: [], overrides: 'overrides'
      }
      
      if (modrinthIndex.dependencies.forge) modpackInfo.minecraft.modLoaders.push({ id: 'forge-' + modrinthIndex.dependencies.forge, primary: true })
      if (modrinthIndex.dependencies['fabric-loader']) modpackInfo.minecraft.modLoaders.push({ id: 'fabric-' + modrinthIndex.dependencies['fabric-loader'], primary: true })
      
      newZip.file('manifest.json', JSON.stringify(modpackInfo, null, 2))
      
      const overridesFolder = newZip.folder('overrides')
      const overridesDir = mrpackZip.folder('overrides')
      if (overridesDir) {
        for (const [relativePath, file] of Object.entries(overridesDir.files)) {
          if (!file.dir && relativePath.startsWith('overrides/')) {
            overridesFolder?.file(relativePath.replace('overrides/', ''), await file.async('arraybuffer'))
          }
        }
      }
      
      setConversion(prev => ({ ...prev, progress: 30, currentStep: 'Downloading mods...' }))
      
      const modsFolder = overridesFolder?.folder('mods')
      const clientMods = modrinthIndex.files.filter(f => f.path.startsWith('mods/') && (!f.env || f.env.client !== 'unsupported'))
      let downloadedFiles = 0
      
      for (const fileInfo of clientMods) {
        const fileName = fileInfo.path.split('/').pop() || 'unknown.jar'
        setConversion(prev => ({ ...prev, progress: 30 + (downloadedFiles / clientMods.length) * 60, currentStep: `Downloading: ${fileName}` }))
        
        let fileContent: ArrayBuffer | null = null
        for (const url of fileInfo.downloads) {
          try { fileContent = await downloadFileWithRetry(url); break } catch {}
        }
        
        if (fileContent) {
          modsFolder?.file(fileName, fileContent)
          downloadedFiles++
        }
      }
      
      setConversion(prev => ({ ...prev, progress: 95, currentStep: 'Generating ZIP file...' }))
      
      const zipBlob = await newZip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } })
      
      setConversion({ status: 'success', progress: 100, downloadUrl: URL.createObjectURL(zipBlob), fileName: file.name.replace('.mrpack', '.zip'), currentStep: 'Complete!' })
      toast({ title: "Conversion successful!", description: `${downloadedFiles} mods downloaded successfully!` })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to convert file.'
      setConversion({ status: 'error', progress: 0, error: errorMessage })
      toast({ title: "Conversion failed", description: errorMessage, variant: "destructive" })
    }
  }, [toast])

  const processFile = useCallback(async (file: File) => {
    const isMrpack = file.name.endsWith('.mrpack')
    const isZip = file.name.endsWith('.zip')
    
    if (!isMrpack && !isZip) {
      toast({ title: "Invalid file type", description: "Please upload a .mrpack or .zip file", variant: "destructive" })
      return
    }
    
    if (mode === 'mrpack-to-zip' && isMrpack) {
      await convertMrpackToZip(file)
    } else if (mode === 'zip-to-mrpack' && isZip) {
      await convertZipToMrpack(file)
    } else {
      const expectedFormat = mode === 'mrpack-to-zip' ? '.mrpack' : '.zip'
      toast({ title: "Wrong file type", description: `Please upload a ${expectedFormat} file for this conversion mode`, variant: "destructive" })
    }
  }, [mode, convertMrpackToZip, convertZipToMrpack, toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0])
  }, [processFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0])
  }, [processFile])

  const resetConversion = () => {
    if (conversion.downloadUrl) URL.revokeObjectURL(conversion.downloadUrl)
    setConversion({ status: 'idle', progress: 0 })
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Mode Selector - Pill Style */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1.5 rounded-full bg-expressive-surface/80 backdrop-blur-xl border border-expressive-border/30">
          <button
            onClick={() => { setMode('mrpack-to-zip'); resetConversion() }}
            className={cn(
              "px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300",
              mode === 'mrpack-to-zip'
                ? "bg-gradient-to-r from-expressive-primary to-expressive-glow text-white shadow-expressive"
                : "text-expressive-muted hover:text-expressive-foreground"
            )}
            style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            MRPACK → ZIP
          </button>
          <button
            onClick={() => { setMode('zip-to-mrpack'); resetConversion() }}
            className={cn(
              "px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300",
              mode === 'zip-to-mrpack'
                ? "bg-gradient-to-r from-expressive-primary to-expressive-glow text-white shadow-expressive"
                : "text-expressive-muted hover:text-expressive-foreground"
            )}
            style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            ZIP → MRPACK
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={cn(
          "relative rounded-expressive-lg p-12 border-2 border-dashed transition-all duration-300 cursor-pointer",
          "bg-expressive-surface/30 backdrop-blur-2xl",
          dragActive 
            ? "border-expressive-primary scale-[1.02] shadow-expressive-lg bg-expressive-primary/5" 
            : "border-expressive-border/50 hover:border-expressive-primary/50 hover:bg-expressive-surface/50"
        )}
        style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('expressive-file-input')?.click()}
      >
        <input
          id="expressive-file-input"
          type="file"
          accept={mode === 'mrpack-to-zip' ? '.mrpack' : '.zip'}
          onChange={handleFileInput}
          className="hidden"
        />

        {conversion.status === 'idle' && (
          <div className="text-center">
            <div 
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-expressive-primary to-expressive-glow flex items-center justify-center mb-6 shadow-expressive"
              style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-expressive-foreground mb-3">
              Drop your {mode === 'mrpack-to-zip' ? '.mrpack' : '.zip'} file here
            </h3>
            <p className="text-expressive-muted text-lg mb-6">
              or click to browse
            </p>
            <ExpressiveButton variant="secondary" size="lg">
              <FileArchive className="mr-2" />
              Select File
            </ExpressiveButton>
          </div>
        )}

        {conversion.status === 'converting' && (
          <div className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-expressive-primary to-expressive-glow flex items-center justify-center mb-6 shadow-expressive animate-pulse">
              <RefreshCw className="h-10 w-10 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-expressive-foreground mb-3">
              Converting...
            </h3>
            <p className="text-expressive-muted text-lg mb-6">
              {conversion.currentStep}
            </p>
            <div className="max-w-md mx-auto">
              <Progress value={conversion.progress} className="h-3 rounded-full" />
              <p className="text-sm text-expressive-muted mt-2">{Math.round(conversion.progress)}%</p>
            </div>
          </div>
        )}

        {conversion.status === 'success' && (
          <div className="text-center">
          <div 
            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center mb-6 shadow-lg"
            style={{ animation: 'spring-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <CheckCircle className="h-10 w-10 text-success-foreground" />
          </div>
            <h3 className="text-2xl font-bold text-expressive-foreground mb-3">
              Conversion Complete!
            </h3>
            <p className="text-expressive-muted text-lg mb-6">
              {conversion.fileName}
            </p>
            <div className="flex justify-center gap-4">
              <ExpressiveButton asChild>
                <a href={conversion.downloadUrl} download={conversion.fileName}>
                  <Download className="mr-2" />
                  Download
                </a>
              </ExpressiveButton>
              <ExpressiveButton variant="secondary" onClick={resetConversion}>
                Convert Another
              </ExpressiveButton>
            </div>
          </div>
        )}

        {conversion.status === 'error' && (
          <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center mb-6 shadow-lg">
            <AlertCircle className="h-10 w-10 text-destructive-foreground" />
          </div>
            <h3 className="text-2xl font-bold text-expressive-foreground mb-3">
              Conversion Failed
            </h3>
            <p className="text-expressive-muted text-lg mb-6 max-w-md mx-auto whitespace-pre-line">
              {conversion.error}
            </p>
            <ExpressiveButton variant="secondary" onClick={resetConversion}>
              Try Again
            </ExpressiveButton>
          </div>
        )}
      </div>
    </div>
  )
}
