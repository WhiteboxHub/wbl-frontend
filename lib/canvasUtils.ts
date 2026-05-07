/**
 * Converts an SVG string to a PNG Blob using a browser canvas.
 */
export async function svgToPngBlob(svgMarkup: string, width: number = 600, height: number = 200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas context not available"));

    const img = new Image();
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Clear canvas with white background (optional, but good for PDFs)
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      
      // Draw SVG
      ctx.drawImage(img, 0, 0, width, height);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      // Convert to Blob
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create PNG blob"));
      }, "image/png");
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}
