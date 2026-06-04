export async function fileToCompressedDataUrl(file, options = {}) {
  const { blob } = await fileToCompressedImage(file, options);
  return blobToDataUrl(blob);
}

export async function fileToCompressedImage(file, options = {}) {
  const maxSize = options.maxSize || 1280;
  const quality = options.quality || 0.72;
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(sourceUrl);
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    return {
      blob,
      fileName: toJpegName(file.name),
      previewUrl: URL.createObjectURL(blob),
    };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("無法處理圖片，請換一張照片再試一次。"));
    }, type, quality);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function toJpegName(fileName = "journal-photo.jpg") {
  return String(fileName).replace(/\.[^.]+$/, "") + ".jpg";
}
