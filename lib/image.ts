/**
 * Reads an image file and returns a downscaled JPEG data URL.
 * Payment proofs are stored in the browser, so we cap the size to
 * keep localStorage usage reasonable during a busy event.
 */
export function fileToCompressedDataUrl(file: File, maxSize = 1000, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.onload = () => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onerror = () => reject(new Error("Failed to load image"))
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas not supported"))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
