/**
 * 图层混合模式引擎
 * 实现各种图层混合算法
 */

/**
 * 混合模式引擎类
 */
export class BlendModeEngine {
  constructor() {
    this.supportedModes = [
      'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light',
      'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion',
      'hue', 'saturation', 'color', 'luminosity', 'add', 'subtract', 'divide'
    ];
  }

  /**
   * 应用混合模式
   * @param {ImageData} baseImageData - 基础图层数据
   * @param {ImageData} blendImageData - 混合图层数据
   * @param {string} blendMode - 混合模式
   * @param {number} opacity - 不透明度 (0-1)
   * @returns {ImageData} 混合后的图像数据
   */
  blend(baseImageData, blendImageData, blendMode, opacity = 1) {
    if (!this.supportedModes.includes(blendMode)) {
      throw new Error(`Unsupported blend mode: ${blendMode}`);
    }

    const width = Math.min(baseImageData.width, blendImageData.width);
    const height = Math.min(baseImageData.height, blendImageData.height);
    
    const result = new ImageData(width, height);
    const baseData = baseImageData.data;
    const blendData = blendImageData.data;
    const resultData = result.data;

    for (let i = 0; i < resultData.length; i += 4) {
      const baseR = baseData[i] / 255;
      const baseG = baseData[i + 1] / 255;
      const baseB = baseData[i + 2] / 255;
      const baseA = baseData[i + 3] / 255;

      const blendR = blendData[i] / 255;
      const blendG = blendData[i + 1] / 255;
      const blendB = blendData[i + 2] / 255;
      const blendA = blendData[i + 3] / 255;

      // 应用混合模式
      const blended = this._applyBlendMode(
        { r: baseR, g: baseG, b: baseB, a: baseA },
        { r: blendR, g: blendG, b: blendB, a: blendA },
        blendMode
      );

      // 应用不透明度
      const finalAlpha = blendA * opacity;
      const invAlpha = 1 - finalAlpha;

      resultData[i] = Math.round((blended.r * finalAlpha + baseR * invAlpha) * 255);
      resultData[i + 1] = Math.round((blended.g * finalAlpha + baseG * invAlpha) * 255);
      resultData[i + 2] = Math.round((blended.b * finalAlpha + baseB * invAlpha) * 255);
      resultData[i + 3] = Math.round(Math.max(baseA, finalAlpha) * 255);
    }

    return result;
  }

  /**
   * 应用具体的混合模式算法
   * @param {Object} base - 基础颜色 {r, g, b, a}
   * @param {Object} blend - 混合颜色 {r, g, b, a}
   * @param {string} mode - 混合模式
   * @returns {Object} 混合后的颜色
   * @private
   */
  _applyBlendMode(base, blend, mode) {
    switch (mode) {
      case 'normal':
        return blend;

      case 'multiply':
        return {
          r: base.r * blend.r,
          g: base.g * blend.g,
          b: base.b * blend.b,
          a: blend.a
        };

      case 'screen':
        return {
          r: 1 - (1 - base.r) * (1 - blend.r),
          g: 1 - (1 - base.g) * (1 - blend.g),
          b: 1 - (1 - base.b) * (1 - blend.b),
          a: blend.a
        };

      case 'overlay':
        return {
          r: this._overlayBlend(base.r, blend.r),
          g: this._overlayBlend(base.g, blend.g),
          b: this._overlayBlend(base.b, blend.b),
          a: blend.a
        };

      case 'soft-light':
        return {
          r: this._softLightBlend(base.r, blend.r),
          g: this._softLightBlend(base.g, blend.g),
          b: this._softLightBlend(base.b, blend.b),
          a: blend.a
        };

      case 'hard-light':
        return {
          r: this._hardLightBlend(base.r, blend.r),
          g: this._hardLightBlend(base.g, blend.g),
          b: this._hardLightBlend(base.b, blend.b),
          a: blend.a
        };

      case 'color-dodge':
        return {
          r: this._colorDodgeBlend(base.r, blend.r),
          g: this._colorDodgeBlend(base.g, blend.g),
          b: this._colorDodgeBlend(base.b, blend.b),
          a: blend.a
        };

      case 'color-burn':
        return {
          r: this._colorBurnBlend(base.r, blend.r),
          g: this._colorBurnBlend(base.g, blend.g),
          b: this._colorBurnBlend(base.b, blend.b),
          a: blend.a
        };

      case 'darken':
        return {
          r: Math.min(base.r, blend.r),
          g: Math.min(base.g, blend.g),
          b: Math.min(base.b, blend.b),
          a: blend.a
        };

      case 'lighten':
        return {
          r: Math.max(base.r, blend.r),
          g: Math.max(base.g, blend.g),
          b: Math.max(base.b, blend.b),
          a: blend.a
        };

      case 'difference':
        return {
          r: Math.abs(base.r - blend.r),
          g: Math.abs(base.g - blend.g),
          b: Math.abs(base.b - blend.b),
          a: blend.a
        };

      case 'exclusion':
        return {
          r: base.r + blend.r - 2 * base.r * blend.r,
          g: base.g + blend.g - 2 * base.g * blend.g,
          b: base.b + blend.b - 2 * base.b * blend.b,
          a: blend.a
        };

      case 'add':
        return {
          r: Math.min(1, base.r + blend.r),
          g: Math.min(1, base.g + blend.g),
          b: Math.min(1, base.b + blend.b),
          a: blend.a
        };

      case 'subtract':
        return {
          r: Math.max(0, base.r - blend.r),
          g: Math.max(0, base.g - blend.g),
          b: Math.max(0, base.b - blend.b),
          a: blend.a
        };

      case 'divide':
        return {
          r: blend.r === 0 ? 1 : Math.min(1, base.r / blend.r),
          g: blend.g === 0 ? 1 : Math.min(1, base.g / blend.g),
          b: blend.b === 0 ? 1 : Math.min(1, base.b / blend.b),
          a: blend.a
        };

      default:
        return blend;
    }
  }

  /**
   * 叠加混合算法
   * @param {number} base - 基础值
   * @param {number} blend - 混合值
   * @returns {number} 混合结果
   * @private
   */
  _overlayBlend(base, blend) {
    return base < 0.5 ? 2 * base * blend : 1 - 2 * (1 - base) * (1 - blend);
  }

  /**
   * 柔光混合算法
   * @param {number} base - 基础值
   * @param {number} blend - 混合值
   * @returns {number} 混合结果
   * @private
   */
  _softLightBlend(base, blend) {
    if (blend < 0.5) {
      return 2 * base * blend + base * base * (1 - 2 * blend);
    } else {
      return 2 * base * (1 - blend) + Math.sqrt(base) * (2 * blend - 1);
    }
  }

  /**
   * 强光混合算法
   * @param {number} base - 基础值
   * @param {number} blend - 混合值
   * @returns {number} 混合结果
   * @private
   */
  _hardLightBlend(base, blend) {
    return blend < 0.5 ? 2 * base * blend : 1 - 2 * (1 - base) * (1 - blend);
  }

  /**
   * 颜色减淡混合算法
   * @param {number} base - 基础值
   * @param {number} blend - 混合值
   * @returns {number} 混合结果
   * @private
   */
  _colorDodgeBlend(base, blend) {
    return blend === 1 ? 1 : Math.min(1, base / (1 - blend));
  }

  /**
   * 颜色加深混合算法
   * @param {number} base - 基础值
   * @param {number} blend - 混合值
   * @returns {number} 混合结果
   * @private
   */
  _colorBurnBlend(base, blend) {
    return blend === 0 ? 0 : Math.max(0, 1 - (1 - base) / blend);
  }

  /**
   * 获取混合模式预览
   * @param {string} blendMode - 混合模式
   * @param {HTMLCanvasElement} baseCanvas - 基础画布
   * @param {HTMLCanvasElement} blendCanvas - 混合画布
   * @param {number} opacity - 不透明度
   * @returns {HTMLCanvasElement} 预览画布
   */
  getBlendPreview(blendMode, baseCanvas, blendCanvas, opacity = 1) {
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = Math.min(baseCanvas.width, blendCanvas.width);
    previewCanvas.height = Math.min(baseCanvas.height, blendCanvas.height);
    
    const ctx = previewCanvas.getContext('2d');
    
    // 获取图像数据
    const baseImageData = baseCanvas.getContext('2d').getImageData(0, 0, previewCanvas.width, previewCanvas.height);
    const blendImageData = blendCanvas.getContext('2d').getImageData(0, 0, previewCanvas.width, previewCanvas.height);
    
    // 应用混合
    const blendedImageData = this.blend(baseImageData, blendImageData, blendMode, opacity);
    
    // 绘制结果
    ctx.putImageData(blendedImageData, 0, 0);
    
    return previewCanvas;
  }

  /**
   * 检查混合模式是否支持
   * @param {string} blendMode - 混合模式
   * @returns {boolean} 是否支持
   */
  isSupported(blendMode) {
    return this.supportedModes.includes(blendMode);
  }

  /**
   * 获取所有支持的混合模式
   * @returns {Array<string>} 支持的混合模式列表
   */
  getSupportedModes() {
    return [...this.supportedModes];
  }
}

// 创建全局实例
export const blendModeEngine = new BlendModeEngine();
export default BlendModeEngine;
