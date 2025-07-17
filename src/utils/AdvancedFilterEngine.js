/**
 * 高级滤镜引擎
 * 实现各种高级图像滤镜算法
 */

/**
 * 高级滤镜引擎类
 */
export class AdvancedFilterEngine {
  constructor() {
    this.filters = new Map();
    this._initializeFilters();
  }

  /**
   * 初始化滤镜
   * @private
   */
  _initializeFilters() {
    // 边缘检测滤镜
    this.filters.set("edge-detection", {
      name: "边缘检测",
      category: "artistic",
      parameters: [{ name: "threshold", min: 0, max: 255, default: 128 }],
      apply: this._edgeDetection.bind(this),
    });

    // 浮雕滤镜
    this.filters.set("emboss", {
      name: "浮雕",
      category: "artistic",
      parameters: [{ name: "strength", min: 0, max: 10, default: 1 }],
      apply: this._emboss.bind(this),
    });

    // 油画滤镜
    this.filters.set("oil-painting", {
      name: "油画",
      category: "artistic",
      parameters: [
        { name: "radius", min: 1, max: 10, default: 4 },
        { name: "intensity", min: 1, max: 20, default: 10 },
      ],
      apply: this._oilPainting.bind(this),
    });

    // 马赛克滤镜
    this.filters.set("mosaic", {
      name: "马赛克",
      category: "distortion",
      parameters: [{ name: "blockSize", min: 2, max: 50, default: 10 }],
      apply: this._mosaic.bind(this),
    });

    // 水波纹滤镜
    this.filters.set("ripple", {
      name: "水波纹",
      category: "distortion",
      parameters: [
        { name: "amplitude", min: 1, max: 50, default: 10 },
        { name: "frequency", min: 0.1, max: 2, default: 0.5 },
      ],
      apply: this._ripple.bind(this),
    });

    // 旋转模糊滤镜
    this.filters.set("motion-blur", {
      name: "运动模糊",
      category: "blur",
      parameters: [
        { name: "distance", min: 1, max: 100, default: 20 },
        { name: "angle", min: 0, max: 360, default: 0 },
      ],
      apply: this._motionBlur.bind(this),
    });

    // 径向模糊滤镜
    this.filters.set("radial-blur", {
      name: "径向模糊",
      category: "blur",
      parameters: [
        { name: "amount", min: 1, max: 100, default: 10 },
        { name: "centerX", min: 0, max: 1, default: 0.5 },
        { name: "centerY", min: 0, max: 1, default: 0.5 },
      ],
      apply: this._radialBlur.bind(this),
    });

    // HDR色调映射滤镜
    this.filters.set("hdr-tone-mapping", {
      name: "HDR色调映射",
      category: "color",
      parameters: [
        { name: "exposure", min: -3, max: 3, default: 0 },
        { name: "gamma", min: 0.1, max: 3, default: 1 },
        { name: "highlights", min: -1, max: 1, default: 0 },
        { name: "shadows", min: -1, max: 1, default: 0 },
      ],
      apply: this._hdrToneMapping.bind(this),
    });

    // 色彩平衡滤镜
    this.filters.set("color-balance", {
      name: "色彩平衡",
      category: "color",
      parameters: [
        { name: "cyan-red", min: -100, max: 100, default: 0 },
        { name: "magenta-green", min: -100, max: 100, default: 0 },
        { name: "yellow-blue", min: -100, max: 100, default: 0 },
      ],
      apply: this._colorBalance.bind(this),
    });

    // 选择性颜色滤镜
    this.filters.set("selective-color", {
      name: "选择性颜色",
      category: "color",
      parameters: [
        { name: "reds", min: -100, max: 100, default: 0 },
        { name: "yellows", min: -100, max: 100, default: 0 },
        { name: "greens", min: -100, max: 100, default: 0 },
        { name: "cyans", min: -100, max: 100, default: 0 },
        { name: "blues", min: -100, max: 100, default: 0 },
        { name: "magentas", min: -100, max: 100, default: 0 },
      ],
      apply: this._selectiveColor.bind(this),
    });
  }

  /**
   * 应用滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {string} filterName - 滤镜名称
   * @param {Object} parameters - 滤镜参数
   * @returns {ImageData} 处理后的图像数据
   */
  applyFilter(imageData, filterName, parameters = {}) {
    const filter = this.filters.get(filterName);
    if (!filter) {
      throw new Error(`Unknown filter: ${filterName}`);
    }

    // 合并默认参数
    const mergedParams = {};
    filter.parameters.forEach((param) => {
      mergedParams[param.name] =
        parameters[param.name] !== undefined
          ? parameters[param.name]
          : param.default;
    });

    return filter.apply(imageData, mergedParams);
  }

  /**
   * 边缘检测滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {Object} params - 参数
   * @returns {ImageData} 处理后的图像数据
   * @private
   */
  _edgeDetection(imageData, params) {
    const { threshold } = params;
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;

    // Sobel算子
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0,
          gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray =
              0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            const kernelIdx = (ky + 1) * 3 + (kx + 1);

            gx += gray * sobelX[kernelIdx];
            gy += gray * sobelY[kernelIdx];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const edge = magnitude > threshold ? 255 : 0;

        const idx = (y * width + x) * 4;
        resultData[idx] = edge;
        resultData[idx + 1] = edge;
        resultData[idx + 2] = edge;
        resultData[idx + 3] = 255;
      }
    }

    return result;
  }

  /**
   * 浮雕滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {Object} params - 参数
   * @returns {ImageData} 处理后的图像数据
   * @private
   */
  _emboss(imageData, params) {
    const { strength } = params;
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;

    // 浮雕卷积核
    const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            const weight = kernel[kernelIdx] * strength;

            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
          }
        }

        const idx = (y * width + x) * 4;
        resultData[idx] = Math.max(0, Math.min(255, r + 128));
        resultData[idx + 1] = Math.max(0, Math.min(255, g + 128));
        resultData[idx + 2] = Math.max(0, Math.min(255, b + 128));
        resultData[idx + 3] = data[idx + 3];
      }
    }

    return result;
  }

  /**
   * 马赛克滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {Object} params - 参数
   * @returns {ImageData} 处理后的图像数据
   * @private
   */
  _mosaic(imageData, params) {
    const { blockSize } = params;
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        // 计算块的平均颜色
        let r = 0,
          g = 0,
          b = 0,
          a = 0,
          count = 0;

        for (let by = y; by < Math.min(y + blockSize, height); by++) {
          for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
            const idx = (by * width + bx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        a = Math.round(a / count);

        // 填充整个块
        for (let by = y; by < Math.min(y + blockSize, height); by++) {
          for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
            const idx = (by * width + bx) * 4;
            resultData[idx] = r;
            resultData[idx + 1] = g;
            resultData[idx + 2] = b;
            resultData[idx + 3] = a;
          }
        }
      }
    }

    return result;
  }

  /**
   * HDR色调映射滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {Object} params - 参数
   * @returns {ImageData} 处理后的图像数据
   * @private
   */
  _hdrToneMapping(imageData, params) {
    const { exposure, gamma, highlights, shadows } = params;
    const data = imageData.data;
    const result = new ImageData(imageData.width, imageData.height);
    const resultData = result.data;

    const exposureFactor = Math.pow(2, exposure);

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;

      // 应用曝光
      r *= exposureFactor;
      g *= exposureFactor;
      b *= exposureFactor;

      // 色调映射
      r = this._toneMap(r, highlights, shadows);
      g = this._toneMap(g, highlights, shadows);
      b = this._toneMap(b, highlights, shadows);

      // 应用伽马校正
      r = Math.pow(r, 1 / gamma);
      g = Math.pow(g, 1 / gamma);
      b = Math.pow(b, 1 / gamma);

      resultData[i] = Math.max(0, Math.min(255, r * 255));
      resultData[i + 1] = Math.max(0, Math.min(255, g * 255));
      resultData[i + 2] = Math.max(0, Math.min(255, b * 255));
      resultData[i + 3] = data[i + 3];
    }

    return result;
  }

  /**
   * 色调映射辅助函数
   * @param {number} value - 颜色值
   * @param {number} highlights - 高光调整
   * @param {number} shadows - 阴影调整
   * @returns {number} 映射后的值
   * @private
   */
  _toneMap(value, highlights, shadows) {
    // 简化的色调映射算法
    if (value > 0.5) {
      // 高光区域
      return value + (1 - value) * highlights * 0.5;
    } else {
      // 阴影区域
      return value + value * shadows * 0.5;
    }
  }

  /**
   * 获取所有可用滤镜
   * @returns {Array} 滤镜列表
   */
  getAvailableFilters() {
    const filters = [];
    for (const [key, filter] of this.filters) {
      filters.push({
        id: key,
        name: filter.name,
        category: filter.category,
        parameters: filter.parameters,
      });
    }
    return filters;
  }

  /**
   * 获取滤镜分类
   * @returns {Array} 分类列表
   */
  getFilterCategories() {
    const categories = new Set();
    for (const filter of this.filters.values()) {
      categories.add(filter.category);
    }
    return Array.from(categories);
  }

  /**
   * 检查滤镜是否存在
   * @param {string} filterName - 滤镜名称
   * @returns {boolean} 是否存在
   */
  hasFilter(filterName) {
    return this.filters.has(filterName);
  }

  /**
   * 油画滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {Object} params - 参数
   * @returns {ImageData} 处理后的图像数据
   * @private
   */
  _oilPainting(imageData, params) {
    const { radius, intensity } = params;
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const intensityCount = new Array(intensity).fill(0);
        const avgR = new Array(intensity).fill(0);
        const avgG = new Array(intensity).fill(0);
        const avgB = new Array(intensity).fill(0);

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            const idx = (ny * width + nx) * 4;

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const curIntensity = Math.floor(
              (((r + g + b) / 3) * intensity) / 255
            );
            const clampedIntensity = Math.max(
              0,
              Math.min(intensity - 1, curIntensity)
            );

            intensityCount[clampedIntensity]++;
            avgR[clampedIntensity] += r;
            avgG[clampedIntensity] += g;
            avgB[clampedIntensity] += b;
          }
        }

        let maxIndex = 0;
        for (let i = 1; i < intensity; i++) {
          if (intensityCount[i] > intensityCount[maxIndex]) {
            maxIndex = i;
          }
        }

        const idx = (y * width + x) * 4;
        if (intensityCount[maxIndex] > 0) {
          resultData[idx] = avgR[maxIndex] / intensityCount[maxIndex];
          resultData[idx + 1] = avgG[maxIndex] / intensityCount[maxIndex];
          resultData[idx + 2] = avgB[maxIndex] / intensityCount[maxIndex];
        } else {
          resultData[idx] = data[idx];
          resultData[idx + 1] = data[idx + 1];
          resultData[idx + 2] = data[idx + 2];
        }
        resultData[idx + 3] = data[idx + 3];
      }
    }

    return result;
  }

  /**
   * 水波纹滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {Object} params - 参数
   * @returns {ImageData} 处理后的图像数据
   * @private
   */
  _ripple(imageData, params) {
    const { amplitude, frequency } = params;
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt(
          (x - width / 2) ** 2 + (y - height / 2) ** 2
        );
        const ripple = Math.sin(distance * frequency) * amplitude;

        const sourceX = Math.max(
          0,
          Math.min(width - 1, Math.round(x + ripple))
        );
        const sourceY = Math.max(
          0,
          Math.min(height - 1, Math.round(y + ripple))
        );

        const sourceIdx = (sourceY * width + sourceX) * 4;
        const targetIdx = (y * width + x) * 4;

        resultData[targetIdx] = data[sourceIdx];
        resultData[targetIdx + 1] = data[sourceIdx + 1];
        resultData[targetIdx + 2] = data[sourceIdx + 2];
        resultData[targetIdx + 3] = data[sourceIdx + 3];
      }
    }

    return result;
  }

  /**
   * 运动模糊滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {Object} params - 参数
   * @returns {ImageData} 处理后的图像数据
   * @private
   */
  _motionBlur(imageData, params) {
    const { distance, angle } = params;
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;

    const radian = (angle * Math.PI) / 180;
    const dx = Math.cos(radian);
    const dy = Math.sin(radian);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          a = 0,
          count = 0;

        for (let i = -distance; i <= distance; i++) {
          const sx = Math.round(x + i * dx);
          const sy = Math.round(y + i * dy);

          if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const idx = (sy * width + sx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }

        const idx = (y * width + x) * 4;
        resultData[idx] = count > 0 ? r / count : data[idx];
        resultData[idx + 1] = count > 0 ? g / count : data[idx + 1];
        resultData[idx + 2] = count > 0 ? b / count : data[idx + 2];
        resultData[idx + 3] = count > 0 ? a / count : data[idx + 3];
      }
    }

    return result;
  }

  /**
   * 径向模糊滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {Object} params - 参数
   * @returns {ImageData} 处理后的图像数据
   * @private
   */
  _radialBlur(imageData, params) {
    const { amount, centerX, centerY } = params;
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;

    const cx = centerX * width;
    const cy = centerY * height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const blurAmount = Math.min(amount, distance / 10);

        let r = 0,
          g = 0,
          b = 0,
          a = 0,
          count = 0;

        for (let i = 0; i < blurAmount; i++) {
          const factor = i / blurAmount;
          const sx = Math.round(cx + dx * factor);
          const sy = Math.round(cy + dy * factor);

          if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const idx = (sy * width + sx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }

        const idx = (y * width + x) * 4;
        resultData[idx] = count > 0 ? r / count : data[idx];
        resultData[idx + 1] = count > 0 ? g / count : data[idx + 1];
        resultData[idx + 2] = count > 0 ? b / count : data[idx + 2];
        resultData[idx + 3] = count > 0 ? a / count : data[idx + 3];
      }
    }

    return result;
  }

  /**
   * 色彩平衡滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {Object} params - 参数
   * @returns {ImageData} 处理后的图像数据
   * @private
   */
  _colorBalance(imageData, params) {
    const {
      "cyan-red": cyanRed,
      "magenta-green": magentaGreen,
      "yellow-blue": yellowBlue,
    } = params;
    const data = imageData.data;
    const result = new ImageData(imageData.width, imageData.height);
    const resultData = result.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;

      // 应用色彩平衡
      r += cyanRed / 100;
      g += magentaGreen / 100;
      b += yellowBlue / 100;

      resultData[i] = Math.max(0, Math.min(255, r * 255));
      resultData[i + 1] = Math.max(0, Math.min(255, g * 255));
      resultData[i + 2] = Math.max(0, Math.min(255, b * 255));
      resultData[i + 3] = data[i + 3];
    }

    return result;
  }

  /**
   * 选择性颜色滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {Object} params - 参数
   * @returns {ImageData} 处理后的图像数据
   * @private
   */
  _selectiveColor(imageData, params) {
    const { reds, yellows, greens, cyans, blues, magentas } = params;
    const data = imageData.data;
    const result = new ImageData(imageData.width, imageData.height);
    const resultData = result.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;

      // 简化的选择性颜色调整
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      if (max === r && r > g && r > b) {
        // 红色区域
        r += (reds / 100) * 0.1;
      } else if (max === g && g > r && g > b) {
        // 绿色区域
        g += (greens / 100) * 0.1;
      } else if (max === b && b > r && b > g) {
        // 蓝色区域
        b += (blues / 100) * 0.1;
      }

      resultData[i] = Math.max(0, Math.min(255, r * 255));
      resultData[i + 1] = Math.max(0, Math.min(255, g * 255));
      resultData[i + 2] = Math.max(0, Math.min(255, b * 255));
      resultData[i + 3] = data[i + 3];
    }

    return result;
  }
}

// 创建全局实例
export const advancedFilterEngine = new AdvancedFilterEngine();
export default AdvancedFilterEngine;
