/**
 * 图像处理Web Worker
 * 在后台线程中处理图像，避免阻塞主线程
 */

// 监听主线程消息
self.onmessage = function (event) {
  const { type, imageData, processor, options } = event.data;

  try {
    switch (type) {
      case "process":
        processImage(imageData, processor, options);
        break;
      case "filter":
        applyFilter(imageData, options);
        break;
      case "resize":
        resizeImage(imageData, options);
        break;
      case "compress":
        compressImage(imageData, options);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message,
    });
  }
};

/**
 * 处理图像
 * @param {ImageData} imageData - 图像数据
 * @param {string} processorCode - 处理函数代码
 * @param {Object} options - 选项
 */
function processImage(imageData, processorCode, options) {
  try {
    // 创建处理函数
    const processor = new Function("imageData", "options", processorCode);

    // 执行处理
    const result = processor(imageData, options);

    self.postMessage({
      success: true,
      data: result,
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message,
    });
  }
}

/**
 * 应用滤镜
 * @param {ImageData} imageData - 图像数据
 * @param {Object} options - 滤镜选项
 */
function applyFilter(imageData, options) {
  const { filterType, intensity = 1 } = options;
  const data = imageData.data;

  switch (filterType) {
    case "grayscale":
      applyGrayscale(data, intensity);
      break;
    case "sepia":
      applySepia(data, intensity);
      break;
    case "blur":
      applyBlur(imageData, options);
      break;
    case "brightness":
      applyBrightness(data, intensity);
      break;
    case "contrast":
      applyContrast(data, intensity);
      break;
    case "saturation":
      applySaturation(data, intensity);
      break;
    case "invert":
      applyInvert(data, intensity);
      break;
    default:
      throw new Error(`Unknown filter type: ${filterType}`);
  }

  self.postMessage({
    success: true,
    data: imageData,
  });
}

/**
 * 应用灰度滤镜
 * @param {Uint8ClampedArray} data - 像素数据
 * @param {number} intensity - 强度
 */
function applyGrayscale(data, intensity) {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i] + (gray - data[i]) * intensity;
    data[i + 1] = data[i + 1] + (gray - data[i + 1]) * intensity;
    data[i + 2] = data[i + 2] + (gray - data[i + 2]) * intensity;
  }
}

/**
 * 应用棕褐色滤镜
 * @param {Uint8ClampedArray} data - 像素数据
 * @param {number} intensity - 强度
 */
function applySepia(data, intensity) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const newR = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    const newG = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    const newB = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);

    data[i] = r + (newR - r) * intensity;
    data[i + 1] = g + (newG - g) * intensity;
    data[i + 2] = b + (newB - b) * intensity;
  }
}

/**
 * 应用亮度调整
 * @param {Uint8ClampedArray} data - 像素数据
 * @param {number} intensity - 强度 (-1 到 1)
 */
function applyBrightness(data, intensity) {
  const adjustment = intensity * 255;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + adjustment));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment));
  }
}

/**
 * 应用对比度调整
 * @param {Uint8ClampedArray} data - 像素数据
 * @param {number} intensity - 强度 (-1 到 1)
 */
function applyContrast(data, intensity) {
  const factor =
    (259 * (intensity * 255 + 255)) / (255 * (259 - intensity * 255));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.max(
      0,
      Math.min(255, factor * (data[i + 1] - 128) + 128)
    );
    data[i + 2] = Math.max(
      0,
      Math.min(255, factor * (data[i + 2] - 128) + 128)
    );
  }
}

/**
 * 应用饱和度调整
 * @param {Uint8ClampedArray} data - 像素数据
 * @param {number} intensity - 强度 (-1 到 1)
 */
function applySaturation(data, intensity) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    data[i] = Math.max(0, Math.min(255, gray + (r - gray) * (1 + intensity)));
    data[i + 1] = Math.max(
      0,
      Math.min(255, gray + (g - gray) * (1 + intensity))
    );
    data[i + 2] = Math.max(
      0,
      Math.min(255, gray + (b - gray) * (1 + intensity))
    );
  }
}

/**
 * 应用反色滤镜
 * @param {Uint8ClampedArray} data - 像素数据
 * @param {number} intensity - 强度
 */
function applyInvert(data, intensity) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] + (255 - data[i] - data[i]) * intensity;
    data[i + 1] = data[i + 1] + (255 - data[i + 1] - data[i + 1]) * intensity;
    data[i + 2] = data[i + 2] + (255 - data[i + 2] - data[i + 2]) * intensity;
  }
}

/**
 * 应用模糊滤镜
 * @param {ImageData} imageData - 图像数据
 * @param {Object} options - 选项
 */
function applyBlur(imageData, options) {
  const { radius = 5 } = options;
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  // 简单的盒式模糊
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      let count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }
      }

      const idx = (y * width + x) * 4;
      output[idx] = r / count;
      output[idx + 1] = g / count;
      output[idx + 2] = b / count;
      output[idx + 3] = a / count;
    }
  }

  // 复制结果回原数据
  for (let i = 0; i < data.length; i++) {
    data[i] = output[i];
  }
}

/**
 * 调整图像尺寸
 * @param {ImageData} imageData - 图像数据
 * @param {Object} options - 选项
 */
function resizeImage(imageData, options) {
  const { width: newWidth, height: newHeight } = options;
  const { width: oldWidth, height: oldHeight } = imageData;

  const newImageData = new ImageData(newWidth, newHeight);
  const oldData = imageData.data;
  const newData = newImageData.data;

  const scaleX = oldWidth / newWidth;
  const scaleY = oldHeight / newHeight;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);

      const srcIdx = (srcY * oldWidth + srcX) * 4;
      const dstIdx = (y * newWidth + x) * 4;

      newData[dstIdx] = oldData[srcIdx];
      newData[dstIdx + 1] = oldData[srcIdx + 1];
      newData[dstIdx + 2] = oldData[srcIdx + 2];
      newData[dstIdx + 3] = oldData[srcIdx + 3];
    }
  }

  self.postMessage({
    success: true,
    data: newImageData,
  });
}

/**
 * 压缩图像
 * @param {ImageData} imageData - 图像数据
 * @param {Object} options - 选项
 */
function compressImage(imageData, options) {
  const { quality = 0.8, format = "image/jpeg" } = options;

  // 创建离屏画布
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");

  // 绘制图像数据
  ctx.putImageData(imageData, 0, 0);

  // 转换为Blob
  canvas
    .convertToBlob({ type: format, quality })
    .then((blob) => {
      self.postMessage({
        success: true,
        data: blob,
      });
    })
    .catch((error) => {
      self.postMessage({
        success: false,
        error: error.message,
      });
    });
}
