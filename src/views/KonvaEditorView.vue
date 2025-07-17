<template>
  <div class="konva-editor-view">
    <div class="editor-header">
      <h1>Konva.js 演示</h1>
      <p>高性能2D Canvas图形库，支持复杂动画和交互效果</p>
    </div>

    <div class="editor-container">
      <div class="canvas-wrapper">
        <div id="konva-container" ref="konvaContainer"></div>

        <!-- 预览窗口 -->
        <div class="preview-section">
          <h4>实时预览</h4>
          <div id="konva-preview" ref="konvaPreview"></div>
        </div>
      </div>

      <div class="controls-panel">
        <h3>图形控制</h3>

        <div class="control-group">
          <h4>图片调节</h4>
          <div class="control-item">
            <label>亮度: {{ brightness }}</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              v-model="brightness"
              @input="applyBrightness"
            />
          </div>

          <div class="control-item">
            <label>对比度: {{ contrast }}</label>
            <input
              type="range"
              min="-100"
              max="100"
              step="5"
              v-model="contrast"
              @input="applyContrast"
            />
          </div>
        </div>

        <div class="control-group">
          <h4>变换操作</h4>
          <div class="control-item">
            <label>旋转角度: {{ rotationAngle }}°</label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              v-model.number="rotationAngle"
              @input="rotateImage"
            />
          </div>

          <div class="control-item">
            <label>缩放: {{ scaleValue }}</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              v-model="scaleValue"
              @input="scaleImage"
            />
          </div>

          <div class="button-group">
            <button @click="rotateLeft" class="btn btn-secondary">
              向左90°
            </button>
            <button @click="rotateRight" class="btn btn-secondary">
              向右90°
            </button>
            <button @click="testRotation" class="btn btn-info">精度测试</button>
            <button @click="syncControlsFromImage" class="btn btn-success">
              同步数值
            </button>
            <button @click="testSpecificAngles" class="btn btn-warning">
              测试特定角度
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>裁剪操作</h4>
          <div class="button-group">
            <button @click="enableCrop" class="btn btn-primary">
              启用裁剪框
            </button>
            <button @click="applyCrop" class="btn btn-success">应用裁剪</button>
            <button @click="disableCrop" class="btn btn-secondary">
              禁用裁剪
            </button>
            <button @click="cancelCrop" class="btn btn-warning">
              取消裁剪
            </button>
          </div>
          <div class="crop-help-text">
            <small>
              <strong>禁用裁剪</strong>：移除裁剪框，保持当前图片状态<br />
              <strong>取消裁剪</strong>：恢复到原始图片状态，移除所有变换效果
            </small>
          </div>
        </div>

        <div class="control-group">
          <h4>动画效果</h4>
          <div class="button-group">
            <button @click="animateRotation" class="btn btn-secondary">
              旋转动画
            </button>
            <button @click="animateScale" class="btn btn-secondary">
              缩放动画
            </button>
            <button @click="animateBounce" class="btn btn-secondary">
              弹跳动画
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>文件操作</h4>
          <div class="button-group">
            <input
              type="file"
              ref="fileInput"
              @change="loadImage"
              accept="image/*"
              style="display: none"
            />
            <button @click="$refs.fileInput.click()" class="btn btn-primary">
              加载图片
            </button>
            <button @click="downloadImage" class="btn btn-success">
              下载图片
            </button>
            <button @click="resetStage" class="btn btn-secondary">
              重置舞台
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>图层操作</h4>
          <div class="button-group">
            <button @click="moveToTop" class="btn btn-secondary">
              移到顶层
            </button>
            <button @click="moveToBottom" class="btn btn-secondary">
              移到底层
            </button>
            <button @click="toggleVisibility" class="btn btn-secondary">
              切换可见性
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="features-info">
      <h3>Konva.js 特性</h3>
      <div class="features-grid">
        <div class="feature-item">
          <h4>🎭 高性能渲染</h4>
          <p>基于Canvas的高性能2D图形渲染引擎</p>
        </div>
        <div class="feature-item">
          <h4>🎬 丰富动画</h4>
          <p>内置强大的动画系统，支持缓动和时间轴</p>
        </div>
        <div class="feature-item">
          <h4>🖱️ 事件处理</h4>
          <p>完善的事件系统，支持鼠标和触摸交互</p>
        </div>
        <div class="feature-item">
          <h4>📐 精确控制</h4>
          <p>像素级精确控制，支持复杂的图形变换</p>
        </div>
        <div class="feature-item">
          <h4>🎨 滤镜效果</h4>
          <p>内置多种图像滤镜和后处理效果</p>
        </div>
        <div class="feature-item">
          <h4>📱 移动优化</h4>
          <p>优化的触摸事件处理，完美支持移动设备</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Konva from "konva";

export default {
  name: "KonvaEditorView",
  data() {
    return {
      stage: null,
      layer: null,
      previewStage: null,
      previewLayer: null,
      currentImage: null,
      previewImage: null,
      brightness: 0,
      contrast: 0,
      rotationAngle: 0,
      scaleValue: 1,
      cropRect: null,
      isCropping: false,
      originalImageData: null, // 原始图片数据备份
      originalImageState: null, // 原始图片状态备份
      isSyncing: false, // 防止控制面板同步时的无限循环
    };
  },
  mounted() {
    this.initStage();
    this.loadDefaultImage();
  },
  beforeDestroy() {
    if (this.stage) {
      this.stage.destroy();
    }
    if (this.previewStage) {
      this.previewStage.destroy();
    }

    // 清理备份数据
    this.originalImageData = null;
    this.originalImageState = null;
  },
  methods: {
    initStage() {
      // 初始化主舞台
      this.stage = new Konva.Stage({
        container: this.$refs.konvaContainer,
        width: 800,
        height: 500,
      });

      this.layer = new Konva.Layer();
      this.stage.add(this.layer);

      // 初始化预览舞台
      this.previewStage = new Konva.Stage({
        container: this.$refs.konvaPreview,
        width: 300,
        height: 200,
      });

      this.previewLayer = new Konva.Layer();
      this.previewStage.add(this.previewLayer);
    },

    loadDefaultImage() {
      const imageObj = new Image();
      imageObj.crossOrigin = "anonymous";
      imageObj.onload = () => {
        // 计算图片的适合尺寸
        const maxWidth = 400;
        const maxHeight = 300;
        const aspectRatio = imageObj.width / imageObj.height;

        let width, height;
        if (aspectRatio > maxWidth / maxHeight) {
          width = maxWidth;
          height = maxWidth / aspectRatio;
        } else {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }

        // 计算图片的中心位置
        const centerX = 100 + width / 2;
        const centerY = 50 + height / 2;

        // 创建主图片
        this.currentImage = new Konva.Image({
          x: centerX,
          y: centerY,
          image: imageObj,
          width: width,
          height: height,
          draggable: true,
          offsetX: width / 2, // 设置旋转中心点为图片中心
          offsetY: height / 2, // 设置旋转中心点为图片中心
        });

        console.log("图片中心点设置:", {
          centerX: centerX,
          centerY: centerY,
          width: width,
          height: height,
          offsetX: width / 2,
          offsetY: height / 2,
        });

        this.layer.add(this.currentImage);
        this.layer.draw();

        // 备份原始图片数据
        this.backupOriginalImage(imageObj, {
          x: centerX,
          y: centerY,
          width: width,
          height: height,
          offsetX: width / 2,
          offsetY: height / 2,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        });

        // 创建预览图片
        this.updatePreview();

        // 添加变换器
        this.addTransformer();
      };
      imageObj.src = require("@/assets/illust_104350264_20230531_093134.png");
    },

    addTransformer() {
      if (!this.currentImage) return;

      try {
        // 移除现有的变换器
        const existingTransformers = this.layer.find("Transformer");
        existingTransformers.forEach((transformer) => transformer.destroy());

        // 创建新的变换器
        const transformer = new Konva.Transformer({
          nodes: [this.currentImage],
          keepRatio: false,
          enabledAnchors: [
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ],
          boundBoxFunc: (oldBox, newBox) => {
            // 限制最小尺寸
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          },
        });

        // 添加变换事件监听器
        this.addTransformListeners(transformer);

        this.layer.add(transformer);
        this.layer.draw();

        console.log("变换器已添加，包含事件监听器");
      } catch (error) {
        console.error("添加变换器失败:", error);
      }
    },

    // 添加变换事件监听器
    addTransformListeners(transformer) {
      if (!this.currentImage || !transformer) return;

      try {
        // 监听变换过程中的实时更新
        transformer.on("transform", () => {
          this.syncControlsFromImage();
        });

        // 监听变换结束事件
        transformer.on("transformend", () => {
          this.syncControlsFromImage();
          this.updatePreview();
          console.log("手动变换完成，控制面板已同步");
        });

        // 监听图片的直接属性变化（如果有其他方式修改图片）
        this.currentImage.on("scaleXChange scaleYChange rotationChange", () => {
          this.syncControlsFromImage();
        });

        console.log("变换事件监听器已添加");
      } catch (error) {
        console.error("添加变换事件监听器失败:", error);
      }
    },

    // 从图片状态同步控制面板数值
    syncControlsFromImage() {
      if (!this.currentImage) return;

      try {
        // 防止无限循环的标志
        this.isSyncing = true;

        // 同步缩放值（取scaleX和scaleY的平均值，或者使用scaleX）
        const scaleX = this.currentImage.scaleX();
        const scaleY = this.currentImage.scaleY();
        const avgScale = (scaleX + scaleY) / 2;

        // 更新缩放滑块（保留2位小数）
        this.scaleValue = Math.round(avgScale * 100) / 100;

        // 同步旋转角度（使用精确的弧度转角度）
        const rotationRadians = this.currentImage.rotation();
        let rotationDegrees = this.radiansToDegrees(rotationRadians);

        // 规范化角度到0-360范围（保持精度）
        rotationDegrees = this.normalizeAngle(rotationDegrees);

        // 更新控制面板角度值（保持适当精度）
        this.rotationAngle = this.formatAngle(rotationDegrees, 1);

        // 验证转换精度
        const validation = this.validateConversion(
          rotationRadians,
          rotationDegrees
        );

        console.log("控制面板已同步:", {
          scaleX: scaleX.toFixed(2),
          scaleY: scaleY.toFixed(2),
          avgScale: avgScale.toFixed(2),
          rotationRadians: rotationRadians,
          rotationDegrees: rotationDegrees,
          normalizedRotation: this.rotationAngle,
          conversionValidation: validation,
        });

        // 重置同步标志
        setTimeout(() => {
          this.isSyncing = false;
        }, 50);
      } catch (error) {
        console.error("同步控制面板失败:", error);
        this.isSyncing = false;
      }
    },

    // 弧度转角度（高精度）
    radiansToDegrees(radians) {
      return (radians * 180) / Math.PI;
    },

    // 角度转弧度（高精度）
    degreesToRadians(degrees) {
      return (degrees * Math.PI) / 180;
    },

    // 规范化角度到0-360范围（保持精度）
    normalizeAngle(degrees) {
      let normalized = degrees % 360;
      if (normalized < 0) {
        normalized += 360;
      }
      return normalized;
    },

    // 精确比较两个角度是否相等（考虑浮点数误差）
    angleEquals(angle1, angle2, tolerance = 0.001) {
      const diff = Math.abs(angle1 - angle2);
      return diff < tolerance || Math.abs(diff - 360) < tolerance;
    },

    // 格式化角度显示（统一精度）
    formatAngle(degrees, precision = 1) {
      return Number(degrees.toFixed(precision));
    },

    // 验证弧度和角度的转换精度
    validateConversion(radians, degrees) {
      const convertedDegrees = this.radiansToDegrees(radians);
      const convertedRadians = this.degreesToRadians(degrees);

      return {
        radiansToDegreesAccurate: this.angleEquals(convertedDegrees, degrees),
        degreesToRadiansAccurate:
          Math.abs(convertedRadians - radians) < 0.000001,
        radiansToDegreesError: Math.abs(convertedDegrees - degrees),
        degreesToRadiansError: Math.abs(convertedRadians - radians),
      };
    },

    // 备份原始图片数据
    backupOriginalImage(imageObj, imageState) {
      try {
        this.originalImageData = imageObj;
        this.originalImageState = { ...imageState };
        console.log("原始图片已备份");
      } catch (error) {
        console.error("备份原始图片失败:", error);
      }
    },

    // 更新预览窗口
    updatePreview() {
      if (!this.currentImage || !this.previewLayer) return;

      try {
        // 清空预览层
        this.previewLayer.destroyChildren();

        // 克隆当前图片到预览
        const previewImage = this.currentImage.clone();

        // 获取当前图片的实际显示尺寸（考虑裁剪）
        const crop = this.currentImage.crop();
        let displayWidth, displayHeight;

        if (crop && crop.width && crop.height) {
          // 如果有裁剪，使用裁剪后的尺寸
          displayWidth = crop.width * this.currentImage.scaleX();
          displayHeight = crop.height * this.currentImage.scaleY();
        } else {
          // 没有裁剪，使用原始尺寸
          displayWidth = this.currentImage.width() * this.currentImage.scaleX();
          displayHeight =
            this.currentImage.height() * this.currentImage.scaleY();
        }

        // 计算预览缩放比例
        const previewWidth = 280;
        const previewHeight = 180;

        const scaleX = previewWidth / displayWidth;
        const scaleY = previewHeight / displayHeight;
        const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小

        // 设置预览图片属性
        previewImage.x(previewWidth / 2);
        previewImage.y(previewHeight / 2);
        previewImage.scaleX(this.currentImage.scaleX() * scale);
        previewImage.scaleY(this.currentImage.scaleY() * scale);
        previewImage.rotation(this.currentImage.rotation());

        // 设置偏移量（考虑裁剪）
        if (crop && crop.width && crop.height) {
          previewImage.offsetX(crop.width / 2);
          previewImage.offsetY(crop.height / 2);
        } else {
          previewImage.offsetX(this.currentImage.width() / 2);
          previewImage.offsetY(this.currentImage.height() / 2);
        }

        previewImage.draggable(false);

        // 应用相同的滤镜和裁剪
        previewImage.filters(this.currentImage.filters());
        if (crop) {
          previewImage.crop(crop);
        }
        previewImage.cache();

        this.previewLayer.add(previewImage);
        this.previewLayer.draw();

        console.log("预览已更新:", {
          displayWidth,
          displayHeight,
          scale,
          crop: crop || "无裁剪",
        });
      } catch (error) {
        console.error("更新预览失败:", error);
      }
    },

    applyBrightness() {
      this.applyFilters();
    },

    applyContrast() {
      this.applyFilters();
    },

    // 应用所有滤镜
    applyFilters() {
      if (!this.currentImage) return;

      try {
        const filters = [];

        // 添加亮度滤镜
        if (this.brightness !== 0) {
          filters.push(Konva.Filters.Brighten);
        }

        // 添加对比度滤镜
        if (this.contrast !== 0) {
          filters.push(Konva.Filters.Contrast);
        }

        // 应用滤镜
        this.currentImage.filters(filters);
        this.currentImage.brightness(parseFloat(this.brightness));
        this.currentImage.contrast(parseFloat(this.contrast));

        // 缓存以提高性能
        this.currentImage.cache();
        this.layer.draw();

        // 更新预览
        this.updatePreview();

        console.log("滤镜已应用:", {
          brightness: this.brightness,
          contrast: this.contrast,
        });
      } catch (error) {
        console.error("应用滤镜失败:", error);
      }
    },

    rotateImage() {
      if (!this.currentImage || this.isSyncing) return;

      try {
        // 规范化角度值到0-360范围（使用精确方法）
        let degrees = Number(this.rotationAngle);
        degrees = this.normalizeAngle(degrees);

        // 更新角度值（如果有变化）
        if (this.rotationAngle !== degrees) {
          this.rotationAngle = degrees;
        }

        // 将角度转换为弧度（使用精确方法）
        const radians = this.degreesToRadians(degrees);

        // 设置旋转（Konva中旋转已经是围绕中心点进行的，因为我们设置了offsetX和offsetY）
        this.currentImage.rotation(radians);

        this.layer.draw();

        // 更新预览
        this.updatePreview();

        // 验证设置后的精度
        const actualRadians = this.currentImage.rotation();
        const actualDegrees = this.radiansToDegrees(actualRadians);
        const validation = this.validateConversion(actualRadians, degrees);

        console.log("滑块旋转设置:", {
          inputAngle: this.rotationAngle,
          normalizedDegrees: degrees,
          calculatedRadians: radians,
          actualRadians: actualRadians,
          actualDegrees: actualDegrees,
          radiansMatch: Math.abs(radians - actualRadians) < 0.000001,
          degreesMatch: this.angleEquals(degrees, actualDegrees),
          conversionValidation: validation,
        });
      } catch (error) {
        console.error("旋转图片失败:", error);
      }
    },

    scaleImage() {
      if (!this.currentImage || this.isSyncing) return;

      try {
        const scale = parseFloat(this.scaleValue);

        this.currentImage.scale({
          x: scale,
          y: scale,
        });

        this.layer.draw();

        // 更新预览
        this.updatePreview();

        console.log("滑块缩放比例已设置:", scale);
      } catch (error) {
        console.error("缩放图片失败:", error);
      }
    },

    rotateLeft() {
      try {
        // 逆时针旋转90度（使用精确计算）
        let currentAngle = Number(this.rotationAngle);
        let newAngle = currentAngle - 90;

        // 规范化角度到0-360范围（使用精确方法）
        newAngle = this.normalizeAngle(newAngle);

        this.rotationAngle = this.formatAngle(newAngle, 1);
        this.rotateImage();

        console.log("向左旋转90°:", {
          原角度: currentAngle,
          新角度: newAngle,
          格式化后: this.rotationAngle,
          精确验证: this.angleEquals(newAngle, this.rotationAngle),
        });
      } catch (error) {
        console.error("向左旋转失败:", error);
      }
    },

    rotateRight() {
      try {
        // 顺时针旋转90度（使用精确计算）
        let currentAngle = Number(this.rotationAngle);
        let newAngle = currentAngle + 90;

        // 规范化角度到0-360范围（使用精确方法）
        newAngle = this.normalizeAngle(newAngle);

        this.rotationAngle = this.formatAngle(newAngle, 1);
        this.rotateImage();

        console.log("向右旋转90°:", {
          原角度: currentAngle,
          新角度: newAngle,
          格式化后: this.rotationAngle,
          精确验证: this.angleEquals(newAngle, this.rotationAngle),
        });
      } catch (error) {
        console.error("向右旋转失败:", error);
      }
    },

    enableCrop() {
      if (!this.isCropping) {
        this.cropRect = new Konva.Rect({
          x: 200,
          y: 150,
          width: 200,
          height: 150,
          fill: "transparent",
          stroke: "#ff0000",
          strokeWidth: 2,
          dash: [5, 5],
          draggable: true,
        });

        this.layer.add(this.cropRect);
        this.layer.draw();
        this.isCropping = true;
      }
    },

    applyCrop() {
      if (this.isCropping && this.cropRect && this.currentImage) {
        try {
          // 获取裁剪区域相对于图片的坐标
          const imageX = this.currentImage.x() - this.currentImage.offsetX();
          const imageY = this.currentImage.y() - this.currentImage.offsetY();

          const cropData = {
            x: Math.max(0, this.cropRect.x() - imageX),
            y: Math.max(0, this.cropRect.y() - imageY),
            width: this.cropRect.width(),
            height: this.cropRect.height(),
          };

          // 确保裁剪区域在图片范围内
          const maxWidth = this.currentImage.width() - cropData.x;
          const maxHeight = this.currentImage.height() - cropData.y;

          cropData.width = Math.min(cropData.width, maxWidth);
          cropData.height = Math.min(cropData.height, maxHeight);

          console.log("应用裁剪:", cropData);

          // 应用裁剪
          this.currentImage.crop(cropData);

          // 重新缓存图片
          this.currentImage.cache();

          this.disableCrop();
          this.layer.draw();

          // 更新预览窗口
          this.updatePreview();
        } catch (error) {
          console.error("应用裁剪失败:", error);
        }
      }
    },

    disableCrop() {
      if (this.isCropping && this.cropRect) {
        this.cropRect.destroy();
        this.cropRect = null;
        this.isCropping = false;
        this.layer.draw();
      }
    },

    // 取消裁剪并恢复原始状态
    cancelCrop() {
      // 先禁用裁剪模式
      this.disableCrop();

      // 恢复到原始图片状态
      this.restoreOriginalImage();
    },

    // 恢复原始图片状态
    restoreOriginalImage() {
      if (
        !this.originalImageData ||
        !this.originalImageState ||
        !this.currentImage
      ) {
        console.warn("没有原始图片备份可以恢复");
        return;
      }

      try {
        // 完全重新创建图片对象以确保清除所有状态
        this.currentImage.destroy();

        this.currentImage = new Konva.Image({
          x: this.originalImageState.x,
          y: this.originalImageState.y,
          image: this.originalImageData,
          width: this.originalImageState.width,
          height: this.originalImageState.height,
          offsetX: this.originalImageState.offsetX,
          offsetY: this.originalImageState.offsetY,
          rotation: this.originalImageState.rotation,
          scaleX: this.originalImageState.scaleX,
          scaleY: this.originalImageState.scaleY,
          draggable: true,
        });

        // 清除所有滤镜和裁剪
        this.currentImage.filters([]);
        this.currentImage.crop(null); // 清除裁剪
        this.currentImage.cache();

        // 重新添加到图层
        this.layer.add(this.currentImage);

        // 重新添加变换器
        this.addTransformer();

        // 重置控制参数
        this.brightness = 0;
        this.contrast = 0;
        this.rotationAngle = 0;
        this.scaleValue = 1;

        this.layer.draw();

        // 更新预览
        this.updatePreview();

        console.log("图片已完全恢复到原始状态:", {
          width: this.originalImageState.width,
          height: this.originalImageState.height,
          x: this.originalImageState.x,
          y: this.originalImageState.y,
        });
      } catch (error) {
        console.error("恢复原始图片失败:", error);
      }
    },

    animateRotation() {
      if (this.currentImage) {
        this.currentImage.to({
          rotation: this.currentImage.rotation() + Math.PI * 2,
          duration: 2,
          easing: Konva.Easings.EaseInOut,
        });
      }
    },

    animateScale() {
      if (this.currentImage) {
        const currentScale = this.currentImage.scaleX();
        this.currentImage.to({
          scaleX: currentScale * 1.5,
          scaleY: currentScale * 1.5,
          duration: 0.5,
          easing: Konva.Easings.EaseInOut,
          onFinish: () => {
            this.currentImage.to({
              scaleX: currentScale,
              scaleY: currentScale,
              duration: 0.5,
              easing: Konva.Easings.EaseInOut,
            });
          },
        });
      }
    },

    animateBounce() {
      if (this.currentImage) {
        const originalY = this.currentImage.y();
        this.currentImage.to({
          y: originalY - 50,
          duration: 0.3,
          easing: Konva.Easings.EaseOut,
          onFinish: () => {
            this.currentImage.to({
              y: originalY,
              duration: 0.3,
              easing: Konva.Easings.BounceEaseOut,
            });
          },
        });
      }
    },

    loadImage(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageObj = new Image();
          imageObj.crossOrigin = "anonymous";
          imageObj.onload = () => {
            if (this.currentImage) {
              this.currentImage.destroy();
            }

            // 计算图片的适合尺寸
            const maxWidth = 400;
            const maxHeight = 300;
            const aspectRatio = imageObj.width / imageObj.height;

            let width, height;
            if (aspectRatio > maxWidth / maxHeight) {
              width = maxWidth;
              height = maxWidth / aspectRatio;
            } else {
              height = maxHeight;
              width = maxHeight * aspectRatio;
            }

            // 计算图片的中心位置
            const centerX = 100 + width / 2;
            const centerY = 50 + height / 2;

            this.currentImage = new Konva.Image({
              x: centerX,
              y: centerY,
              image: imageObj,
              width: width,
              height: height,
              draggable: true,
              offsetX: width / 2, // 设置旋转中心点为图片中心
              offsetY: height / 2, // 设置旋转中心点为图片中心
            });

            this.layer.add(this.currentImage);

            // 备份原始图片数据
            this.backupOriginalImage(imageObj, {
              x: centerX,
              y: centerY,
              width: width,
              height: height,
              offsetX: width / 2,
              offsetY: height / 2,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
            });

            // 更新预览
            this.updatePreview();

            this.addTransformer();
            this.resetControls();
          };
          imageObj.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },

    downloadImage() {
      if (this.stage) {
        const dataURL = this.stage.toDataURL({
          pixelRatio: 2,
        });
        const link = document.createElement("a");
        link.download = "konva-edited-image.png";
        link.href = dataURL;
        link.click();
      }
    },

    resetStage() {
      this.layer.destroyChildren();
      this.loadDefaultImage();
      this.resetControls();
      this.disableCrop();
    },

    moveToTop() {
      if (this.currentImage) {
        this.currentImage.moveToTop();
        this.layer.draw();
      }
    },

    moveToBottom() {
      if (this.currentImage) {
        this.currentImage.moveToBottom();
        this.layer.draw();
      }
    },

    toggleVisibility() {
      if (this.currentImage) {
        this.currentImage.visible(!this.currentImage.visible());
        this.layer.draw();
      }
    },

    resetControls() {
      this.brightness = 0;
      this.contrast = 0;
      this.rotationAngle = 0;
      this.scaleValue = 1;

      // 更新预览
      this.updatePreview();
    },

    // 测试旋转功能（增强版，包含精度验证）
    testRotation() {
      console.log("=== 旋转功能精度测试 ===");

      if (!this.currentImage) {
        console.log("❌ 没有图片可以测试");
        return;
      }

      const controlAngle = this.rotationAngle;
      const actualRadians = this.currentImage.rotation();
      const actualDegrees = this.radiansToDegrees(actualRadians);
      const normalizedActualDegrees = this.normalizeAngle(actualDegrees);

      // 验证转换精度
      const validation = this.validateConversion(actualRadians, controlAngle);

      // 计算理论弧度值
      const theoreticalRadians = this.degreesToRadians(controlAngle);

      console.log("📊 角度数据:");
      console.log("  控制面板角度:", controlAngle + "°");
      console.log("  图片实际弧度:", actualRadians);
      console.log("  图片实际角度:", actualDegrees + "°");
      console.log("  规范化实际角度:", normalizedActualDegrees + "°");

      console.log("🔄 转换验证:");
      console.log("  理论弧度值:", theoreticalRadians);
      console.log("  弧度误差:", Math.abs(actualRadians - theoreticalRadians));
      console.log(
        "  角度误差:",
        Math.abs(controlAngle - normalizedActualDegrees)
      );

      console.log("✅ 精度检查:");
      console.log("  弧度转角度准确:", validation.radiansToDegreesAccurate);
      console.log("  角度转弧度准确:", validation.degreesToRadiansAccurate);
      console.log("  弧度转角度误差:", validation.radiansToDegreesError);
      console.log("  角度转弧度误差:", validation.degreesToRadiansError);

      console.log("📐 数学验证:");
      console.log("  270° 理论弧度:", this.degreesToRadians(270));
      console.log(
        "  4.712388980384690 对应角度:",
        this.radiansToDegrees(4.71238898038469) + "°"
      );
      console.log("  π 值:", Math.PI);
      console.log("  270° × π/180 =", (270 * Math.PI) / 180);

      console.log("🎯 图片属性:");
      console.log("  位置:", {
        x: this.currentImage.x(),
        y: this.currentImage.y(),
      });
      console.log("  偏移:", {
        offsetX: this.currentImage.offsetX(),
        offsetY: this.currentImage.offsetY(),
      });
      console.log("  尺寸:", {
        width: this.currentImage.width(),
        height: this.currentImage.height(),
      });

      // 总结
      const isAccurate =
        validation.radiansToDegreesAccurate &&
        validation.degreesToRadiansAccurate;
      console.log(
        "🏆 总结:",
        isAccurate ? "✅ 精度测试通过" : "❌ 存在精度问题"
      );
    },

    // 测试特定角度的精度
    testSpecificAngles() {
      console.log("=== 特定角度精度测试 ===");

      const testAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];

      testAngles.forEach((angle) => {
        const radians = this.degreesToRadians(angle);
        const backToDegrees = this.radiansToDegrees(radians);
        const normalized = this.normalizeAngle(backToDegrees);
        const validation = this.validateConversion(radians, angle);

        console.log(`📐 ${angle}°:`);
        console.log(`  弧度: ${radians}`);
        console.log(`  转回角度: ${backToDegrees}°`);
        console.log(`  规范化: ${normalized}°`);
        console.log(
          `  精度验证: ${validation.radiansToDegreesAccurate ? "✅" : "❌"}`
        );
        console.log(`  误差: ${validation.radiansToDegreesError}`);
      });

      // 测试问题中提到的具体数值
      console.log("🔍 问题案例验证:");
      const problemRadians = 4.71238898038469;
      const problemDegrees = this.radiansToDegrees(problemRadians);
      console.log(`  4.71238898038469 弧度 = ${problemDegrees}°`);
      console.log(`  是否等于270°: ${this.angleEquals(problemDegrees, 270)}`);
      console.log(`  误差: ${Math.abs(problemDegrees - 270)}`);

      // 设置测试角度
      console.log("🎯 设置270°进行实际测试...");
      this.rotationAngle = 270;
      this.rotateImage();

      setTimeout(() => {
        this.testRotation();
      }, 100);
    },
  },
};
</script>

<style scoped>
.konva-editor-view {
  max-width: 1400px;
  margin: 0 auto;
}

.editor-header {
  text-align: center;
  margin-bottom: 2rem;
}

.editor-header h1 {
  color: #2c3e50;
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.editor-header p {
  color: #5a6c7d;
  font-size: 1.1rem;
}

.editor-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  margin-bottom: 3rem;
}

.canvas-wrapper {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

#konva-container {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  background: #f8f9fa;
}

.preview-section {
  margin-top: 20px;
  text-align: center;
}

.preview-section h4 {
  margin-bottom: 10px;
  color: #333;
  font-size: 1rem;
}

#konva-preview {
  border: 2px solid #ddd;
  border-radius: 6px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.crop-help-text {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.crop-help-text small {
  color: #6c757d;
  line-height: 1.4;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
  border: 1px solid #ffc107;
}

.btn-warning:hover {
  background: #e0a800;
  border-color: #d39e00;
}

.btn-info {
  background: #17a2b8;
  color: white;
  border: 1px solid #17a2b8;
}

.btn-info:hover {
  background: #138496;
  border-color: #117a8b;
}

.btn-success {
  background: #28a745;
  color: white;
  border: 1px solid #28a745;
}

.btn-success:hover {
  background: #218838;
  border-color: #1e7e34;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
  border: 1px solid #ffc107;
}

.btn-warning:hover {
  background: #e0a800;
  border-color: #d39e00;
}

.controls-panel {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.controls-panel h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.control-group {
  margin-bottom: 2rem;
}

.control-group h4 {
  color: #34495e;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.control-item {
  margin-bottom: 1rem;
}

.control-item label {
  display: block;
  margin-bottom: 0.5rem;
  color: #5a6c7d;
  font-size: 0.9rem;
}

.control-item input[type="range"] {
  width: 100%;
  margin-bottom: 0.5rem;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
  color: white;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(86, 171, 47, 0.4);
}

.btn-secondary {
  background: #f8f9fa;
  color: #5a6c7d;
  border: 1px solid #e1e8ed;
}

.btn-secondary:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.features-info {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.features-info h3 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-item {
  text-align: center;
  padding: 1rem;
}

.feature-item h4 {
  color: #34495e;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.feature-item p {
  color: #5a6c7d;
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .editor-container {
    grid-template-columns: 1fr;
  }

  .controls-panel {
    order: -1;
  }

  .button-group {
    flex-direction: row;
    flex-wrap: wrap;
  }

  #konva-container {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .editor-header h1 {
    font-size: 1.8rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .controls-panel {
    padding: 1rem;
  }
}
</style>
