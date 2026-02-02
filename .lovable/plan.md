
# Fix ZIP to MRPACK Conversion - Proper Modrinth Format

## Problem Summary

The current ZIP to MRPACK conversion is fundamentally broken because it:
1. Copies all mod JAR files into `overrides/mods/` folder
2. Creates an empty `files: []` array in `modrinth.index.json`
3. Results in the same content as the original ZIP, just renamed

A **true MRPACK file** should:
- Contain `modrinth.index.json` with download URLs for each mod (from Modrinth CDN)
- Only store non-mod files (configs, scripts, resources) in `overrides/`
- NOT include mod JARs directly - they are downloaded by the launcher using the URLs

## Solution Approach

### Step 1: Hash Each Mod File
For each `.jar` file in the input ZIP's `mods/` folder:
- Read the file as ArrayBuffer
- Compute SHA512 hash using Web Crypto API (`crypto.subtle.digest`)
- Store mapping: hash → filename → file content

### Step 2: Query Modrinth API
Call `POST https://api.modrinth.com/v2/version_files` with:
```json
{
  "hashes": ["sha512hash1", "sha512hash2", ...],
  "algorithm": "sha512"
}
```

Modrinth returns a map of hash → version info including:
- `files[].url` - CDN download URL
- `files[].hashes.sha512` - File hash
- `files[].filename` - Original filename
- `files[].size` - File size in bytes

### Step 3: Build modrinth.index.json
Create the proper structure with the `files` array populated:
```json
{
  "formatVersion": 1,
  "game": "minecraft",
  "versionId": "1.0.0",
  "name": "Pack Name",
  "files": [
    {
      "path": "mods/sodium-fabric-1.20.1.jar",
      "hashes": {
        "sha512": "abc123...",
        "sha1": "def456..."
      },
      "downloads": ["https://cdn.modrinth.com/..."],
      "fileSize": 123456
    }
  ],
  "dependencies": {
    "minecraft": "1.20.1",
    "fabric-loader": "0.14.21"
  }
}
```

### Step 4: Handle Unmatched Mods
Per user preference: **Fail conversion** if any mod is not found on Modrinth.

Show an error listing which mods could not be matched, so the user knows what's incompatible.

### Step 5: Create MRPACK Output
- Add `modrinth.index.json` to the root
- Add non-mod files (configs, scripts, resources) to `overrides/`
- Do NOT include mod JARs in the output (they're referenced by URL)

---

## Technical Implementation

### New Helper: Compute SHA512 Hash
```text
async function computeSha512(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-512', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

### New Helper: Query Modrinth Version Files API
```text
async function lookupModsOnModrinth(hashes: string[]): Promise<Map<hash, ModrinthVersion>> {
  const response = await fetch('https://api.modrinth.com/v2/version_files', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MRPackConverter/1.0'
    },
    body: JSON.stringify({
      hashes: hashes,
      algorithm: 'sha512'
    })
  })
  return response.json()
}
```

### Updated convertZipToMrpack Flow

```text
1. Read ZIP file
2. Parse manifest.json for Minecraft version and loader info
3. Collect all mod files from mods/ folder
4. For each mod JAR:
   a. Read file content
   b. Compute SHA512 hash
   c. Store in map: hash → { filename, content }
5. Call Modrinth API with all hashes
6. Check response:
   - If any hash is missing from response → FAIL with list of unmatchable mods
   - If all matched → continue
7. Build modrinth.index.json with files[] array from API response
8. Create MRPACK:
   - Add modrinth.index.json at root
   - Add configs, scripts, resources to overrides/
   - Do NOT add mod JARs (they're URL-referenced)
9. Return MRPACK blob for download
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/FileUpload.tsx` | Complete rewrite of `convertZipToMrpack` function with hash computation, Modrinth API lookup, proper MRPACK structure |

---

## Error Handling

When mods cannot be found on Modrinth, show a clear error:

```text
"Conversion failed: The following mods are not available on Modrinth:
 - mod1.jar
 - mod2.jar

These mods may be CurseForge-exclusive or custom mods. 
Only mods published on Modrinth can be included in MRPACK format."
```

---

## Expected Outcome

After this fix:
- ZIP with CurseForge mods that exist on Modrinth → proper small MRPACK with download URLs
- ZIP with CurseForge-exclusive mods → clear error explaining which mods are incompatible
- The resulting MRPACK will work correctly in Modrinth App and compatible launchers
