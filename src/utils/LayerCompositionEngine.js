/**
 * 图层合成引擎
 * 实现图层合成、蒙版、遮罩等高级功能
 */

import { blendModeEngine } from "./BlendModeEngine.js";

/**
 * 图层合成引擎类
 */
export class LayerCompositionEngine {
  constructor() {
    this.layers = [];
    this.canvas = null;
    this.context = null;
  }

  /**
   * 设置画布
   * @param {HTMLCanvasElement} canvas - 画布元素
   */
  setCanvas(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
  }

  /**
   * 添加图层
   * @param {Object} layer - 图层对象
   * @returns {string} 图层ID
   */
  addLayer(layer) {
    const layerData = {
      id: layer.id || this._generateLayerId(),
      name: layer.name || `Layer ${this.layers.length + 1}`,
      type: layer.type || "image",
      visible: layer.visible !== false,
      locked: layer.locked || false,
      opacity: layer.opacity !== undefined ? layer.opacity : 1,
      blendMode: layer.blendMode || "normal",
      transform: layer.transform || {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      },
      mask: layer.mask || null,
      clippingMask: layer.clippingMask || false,
      data: layer.data || null, // ImageData, Canvas, or Image
      filters: layer.filters || [],
      adjustments: layer.adjustments || {},
    };

    this.layers.push(layerData);
    return layerData.id;
  }

  /**
   * 移除图层
   * @param {string} layerId - 图层ID
   * @returns {boolean} 是否成功移除
   */
  removeLayer(layerId) {
    const index = this.layers.findIndex((layer) => layer.id === layerId);
    if (index !== -1) {
      this.layers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取图层
   * @param {string} layerId - 图层ID
   * @returns {Object|null} 图层对象
   */
  getLayer(layerId) {
    return this.layers.find((layer) => layer.id === layerId) || null;
  }

  /**
   * 更新图层属性
   * @param {string} layerId - 图层ID
   * @param {Object} updates - 更新的属性
   * @returns {boolean} 是否成功更新
   */
  updateLayer(layerId, updates) {
    const layer = this.getLayer(layerId);
    if (layer) {
      Object.assign(layer, updates);
      return true;
    }
    return false;
  }

  /**
   * 移动图层顺序
   * @param {string} layerId - 图层ID
   * @param {number} newIndex - 新位置
   * @returns {boolean} 是否成功移动
   */
  moveLayer(layerId, newIndex) {
    const currentIndex = this.layers.findIndex((layer) => layer.id === layerId);
    if (currentIndex !== -1 && newIndex >= 0 && newIndex < this.layers.length) {
      const layer = this.layers.splice(currentIndex, 1)[0];
      this.layers.splice(newIndex, 0, layer);
      return true;
    }
    return false;
  }

  /**
   * 合成所有图层
   * @param {Object} options - 合成选项
   * @returns {HTMLCanvasElement} 合成后的画布
   */
  compose(options = {}) {
    if (!this.canvas) {
      throw new Error("Canvas not set");
    }

    const {
      width = this.canvas.width,
      height = this.canvas.height,
      backgroundColor = "transparent",
    } = options;

    // 创建合成画布
    const compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = width;
    compositeCanvas.height = height;
    const compositeCtx = compositeCanvas.getContext("2d");

    // 设置背景色
    if (backgroundColor !== "transparent") {
      compositeCtx.fillStyle = backgroundColor;
      compositeCtx.fillRect(0, 0, width, height);
    }

    // 从底层到顶层合成
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      if (!layer.visible || !layer.data) continue;

      this._compositeLayer(compositeCtx, layer, width, height);
    }

    return compositeCanvas;
  }

  /**
   * 合成单个图层
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {Object} layer - 图层对象
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   * @private
   */
  _compositeLayer(ctx, layer, width, height) {
    // 创建图层画布
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = width;
    layerCanvas.height = height;
    const layerCtx = layerCanvas.getContext("2d");

    // 应用变换
    layerCtx.save();
    layerCtx.globalAlpha = layer.opacity;
    layerCtx.translate(layer.transform.x, layer.transform.y);
    layerCtx.scale(layer.transform.scaleX, layer.transform.scaleY);
    layerCtx.rotate((layer.transform.rotation * Math.PI) / 180);

    // 绘制图层内容
    this._drawLayerContent(layerCtx, layer);

    layerCtx.restore();

    // 应用滤镜
    if (layer.filters.length > 0) {
      this._applyLayerFilters(layerCanvas, layer.filters);
    }

    // 应用调整
    if (Object.keys(layer.adjustments).length > 0) {
      this._applyLayerAdjustments(layerCanvas, layer.adjustments);
    }

    // 应用蒙版
    if (layer.mask) {
      this._applyMask(layerCanvas, layer.mask);
    }

    // 应用混合模式
    if (layer.blendMode !== "normal") {
      this._applyBlendMode(ctx, layerCanvas, layer.blendMode, layer.opacity);
    } else {
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layerCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }
  }

  /**
   * 绘制图层内容
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {Object} layer - 图层对象
   * @private
   */
  _drawLayerContent(ctx, layer) {
    const data = layer.data;

    if (data instanceof HTMLImageElement) {
      ctx.drawImage(data, 0, 0);
    } else if (data instanceof HTMLCanvasElement) {
      ctx.drawImage(data, 0, 0);
    } else if (data instanceof ImageData) {
      ctx.putImageData(data, 0, 0);
    } else if (typeof data === "object" && data.type) {
      // 处理矢量对象（文本、形状等）
      this._drawVectorObject(ctx, data);
    }
  }

  /**
   * 绘制矢量对象
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {Object} object - 矢量对象
   * @private
   */
  _drawVectorObject(ctx, object) {
    switch (object.type) {
      case "text":
        this._drawText(ctx, object);
        break;
      case "rectangle":
        this._drawRectangle(ctx, object);
        break;
      case "circle":
        this._drawCircle(ctx, object);
        break;
      case "path":
        this._drawPath(ctx, object);
        break;
    }
  }

  /**
   * 绘制文本
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {Object} textObject - 文本对象
   * @private
   */
  _drawText(ctx, textObject) {
    ctx.font = `${textObject.fontSize || 16}px ${
      textObject.fontFamily || "Arial"
    }`;
    ctx.fillStyle = textObject.fill || "#000000";
    ctx.textAlign = textObject.textAlign || "left";
    ctx.textBaseline = textObject.textBaseline || "top";

    if (textObject.stroke) {
      ctx.strokeStyle = textObject.stroke;
      ctx.lineWidth = textObject.strokeWidth || 1;
      ctx.strokeText(textObject.text, textObject.x || 0, textObject.y || 0);
    }

    ctx.fillText(textObject.text, textObject.x || 0, textObject.y || 0);
  }

  /**
   * 绘制矩形
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {Object} rectObject - 矩形对象
   * @private
   */
  _drawRectangle(ctx, rectObject) {
    const {
      x = 0,
      y = 0,
      width = 100,
      height = 100,
      fill,
      stroke,
      strokeWidth = 1,
    } = rectObject;

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, width, height);
    }

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.strokeRect(x, y, width, height);
    }
  }

  /**
   * 绘制圆形
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {Object} circleObject - 圆形对象
   * @private
   */
  _drawCircle(ctx, circleObject) {
    const {
      x = 0,
      y = 0,
      radius = 50,
      fill,
      stroke,
      strokeWidth = 1,
    } = circleObject;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }

  /**
   * 应用蒙版
   * @param {HTMLCanvasElement} canvas - 图层画布
   * @param {Object} mask - 蒙版对象
   * @private
   */
  _applyMask(canvas, mask) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 获取蒙版数据
    let maskData;
    if (mask instanceof HTMLCanvasElement) {
      maskData = mask
        .getContext("2d")
        .getImageData(0, 0, mask.width, mask.height).data;
    } else if (mask instanceof ImageData) {
      maskData = mask.data;
    } else {
      return; // 无效蒙版
    }

    // 应用蒙版
    for (let i = 0; i < data.length; i += 4) {
      const maskAlpha = maskData[i] / 255; // 使用红色通道作为蒙版
      data[i + 3] *= maskAlpha; // 修改alpha通道
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 应用混合模式
   * @param {CanvasRenderingContext2D} ctx - 目标上下文
   * @param {HTMLCanvasElement} layerCanvas - 图层画布
   * @param {string} blendMode - 混合模式
   * @param {number} opacity - 不透明度
   * @private
   */
  _applyBlendMode(ctx, layerCanvas, blendMode, opacity) {
    // 获取当前画布内容
    const currentImageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const layerImageData = layerCanvas
      .getContext("2d")
      .getImageData(0, 0, layerCanvas.width, layerCanvas.height);

    // 应用混合模式
    const blendedImageData = blendModeEngine.blend(
      currentImageData,
      layerImageData,
      blendMode,
      opacity
    );

    // 绘制混合结果
    ctx.putImageData(blendedImageData, 0, 0);
  }

  /**
   * 应用图层滤镜
   * @param {HTMLCanvasElement} canvas - 图层画布
   * @param {Array} filters - 滤镜数组
   * @private
   */
  _applyLayerFilters(canvas, filters) {
    // 这里可以集成AdvancedFilterEngine
    // 暂时使用简单的CSS滤镜
    const ctx = canvas.getContext("2d");
    let filterString = "";

    filters.forEach((filter) => {
      switch (filter.type) {
        case "blur":
          filterString += `blur(${filter.value || 0}px) `;
          break;
        case "brightness":
          filterString += `brightness(${(filter.value || 0) + 100}%) `;
          break;
        case "contrast":
          filterString += `contrast(${(filter.value || 0) + 100}%) `;
          break;
        case "grayscale":
          filterString += `grayscale(${filter.value || 100}%) `;
          break;
        case "sepia":
          filterString += `sepia(${filter.value || 100}%) `;
          break;
      }
    });

    if (filterString) {
      ctx.filter = filterString.trim();
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);
      ctx.filter = "none";
    }
  }

  /**
   * 应用图层调整
   * @param {HTMLCanvasElement} canvas - 图层画布
   * @param {Object} adjustments - 调整参数
   * @private
   */
  _applyLayerAdjustments(canvas, adjustments) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;

      // 应用亮度调整
      if (adjustments.brightness !== undefined) {
        const brightness = adjustments.brightness;
        r += brightness;
        g += brightness;
        b += brightness;
      }

      // 应用对比度调整
      if (adjustments.contrast !== undefined) {
        const contrast = adjustments.contrast + 1;
        r = (r - 0.5) * contrast + 0.5;
        g = (g - 0.5) * contrast + 0.5;
        b = (b - 0.5) * contrast + 0.5;
      }

      // 应用饱和度调整
      if (adjustments.saturation !== undefined) {
        const saturation = adjustments.saturation + 1;
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * saturation;
        g = gray + (g - gray) * saturation;
        b = gray + (b - gray) * saturation;
      }

      data[i] = Math.max(0, Math.min(255, r * 255));
      data[i + 1] = Math.max(0, Math.min(255, g * 255));
      data[i + 2] = Math.max(0, Math.min(255, b * 255));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 生成图层ID
   * @returns {string} 图层ID
   * @private
   */
  _generateLayerId() {
    return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取所有图层
   * @returns {Array} 图层数组
   */
  getAllLayers() {
    return [...this.layers];
  }

  /**
   * 清空所有图层
   */
  clearLayers() {
    this.layers = [];
  }

  /**
   * 拼合图层
   * @param {Array<string>} layerIds - 要拼合的图层ID数组（可选）
   * @returns {HTMLCanvasElement} 拼合后的画布
   */
  flattenLayers(layerIds = null) {
    const layersToFlatten = layerIds
      ? this.layers.filter((layer) => layerIds.includes(layer.id))
      : this.layers.filter((layer) => layer.visible);

    // 临时保存原图层
    const originalLayers = [...this.layers];

    // 设置要拼合的图层
    this.layers = layersToFlatten;

    // 合成
    const flattenedCanvas = this.compose();

    // 恢复原图层
    this.layers = originalLayers;

    return flattenedCanvas;
  }
}

// 创建全局实例
export const layerCompositionEngine = new LayerCompositionEngine();
export default LayerCompositionEngine;
