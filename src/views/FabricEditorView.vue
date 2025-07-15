<template>
  <div class="fabric-editor-view">
    <div class="editor-header">
      <h1>Fabric.js 演示</h1>
      <p>高度可定制的Canvas图片编辑器，支持复杂的图形操作和交互</p>
    </div>

    <div class="editor-container">
      <div class="canvas-section">
        <div class="canvas-wrapper">
          <canvas id="fabric-canvas" ref="fabricCanvas"></canvas>
        </div>

        <div class="preview-section">
          <h4>实时预览</h4>
          <div class="preview-wrapper">
            <canvas id="preview-canvas" ref="previewCanvas" width="300" height="200"></canvas>
          </div>

          <!-- 加载状态提示 -->
          <div v-if="isLoading" class="status-message loading-message">
            <div class="loading-spinner"></div>
            <span>{{ loadingMessage }}</span>
          </div>

          <!-- 成功提示 -->
          <div v-if="showSuccess" class="status-message success-message">
            <span class="success-icon">✓</span>
            <span>{{ successMessage }}</span>
          </div>
        </div>
      </div>

      <div class="controls-panel">
        <h3>编辑控制</h3>
        
        <div class="control-group">
          <h4>图片调节</h4>
          <div class="control-item">
            <label>亮度: {{ brightness }}</label>
            <input 
              type="range" 
              min="-0.5" 
              max="0.5" 
              step="0.1" 
              v-model="brightness"
              @input="applyBrightness"
            />
          </div>
          
          <div class="control-item">
            <label>对比度: {{ contrast }}</label>
            <input 
              type="range" 
              min="-0.5" 
              max="0.5" 
              step="0.1" 
              v-model="contrast"
              @input="applyContrast"
            />
          </div>
        </div>

        <div class="control-group">
          <h4>旋转操作</h4>
          <div class="control-item">
            <label>旋转角度: {{ rotationAngle }}°</label>
            <input 
              type="range" 
              min="0" 
              max="360" 
              step="1" 
              v-model="rotationAngle"
              @input="rotateImage"
            />
          </div>
          <div class="button-group">
            <button @click="rotateLeft" class="btn btn-secondary">向左90°</button>
            <button @click="rotateRight" class="btn btn-secondary">向右90°</button>
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
        </div>

        <div class="control-group">
          <h4>裁剪操作</h4>
          <div class="button-group">
            <button @click="enableCrop" :disabled="isCropping" class="btn btn-primary">启用裁剪</button>
            <button @click="applyCrop" :disabled="!isCropping" class="btn btn-success">应用裁剪</button>
            <button @click="disableCrop" :disabled="!isCropping" class="btn btn-secondary">禁用裁剪</button>
            <button @click="cancelCrop" class="btn btn-warning">取消裁剪</button>
          </div>
          <div class="crop-help-text">
            <small>
              <strong>禁用裁剪</strong>：移除裁剪框，保持当前图片状态<br>
              <strong>取消裁剪</strong>：恢复到原始图片状态，移除所有裁剪效果
            </small>
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
            <button @click="$refs.fileInput.click()" class="btn btn-primary">加载图片</button>
            <button @click="downloadImage" class="btn btn-success">下载图片</button>
            <button @click="resetCanvas" class="btn btn-secondary">重置画布</button>
          </div>
        </div>

        <div class="control-group">
          <h4>画布操作</h4>
          <div class="button-group">
            <button @click="zoomIn" class="btn btn-secondary">放大</button>
            <button @click="zoomOut" class="btn btn-secondary">缩小</button>
            <button @click="resetZoom" class="btn btn-secondary">重置缩放</button>
          </div>
        </div>
      </div>
    </div>

    <div class="features-info">
      <h3>Fabric.js 特性</h3>
      <div class="features-grid">
        <div class="feature-item">
          <h4>🎨 Canvas 操作</h4>
          <p>基于HTML5 Canvas，提供强大的图形绘制和操作能力</p>
        </div>
        <div class="feature-item">
          <h4>🔧 高度定制</h4>
          <p>灵活的API设计，可以创建复杂的图形编辑应用</p>
        </div>
        <div class="feature-item">
          <h4>🖱️ 交互操作</h4>
          <p>支持拖拽、缩放、旋转等丰富的用户交互</p>
        </div>
        <div class="feature-item">
          <h4>🎭 滤镜系统</h4>
          <p>内置多种图像滤镜，支持自定义滤镜效果</p>
        </div>
        <div class="feature-item">
          <h4>📐 精确控制</h4>
          <p>像素级精确控制，适合专业图像编辑需求</p>
        </div>
        <div class="feature-item">
          <h4>⚡ 高性能</h4>
          <p>优化的渲染引擎，支持大型图像和复杂场景</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { fabric } from 'fabric'

export default {
  name: 'FabricEditorView',
  data() {
    return {
      canvas: null,
      previewCanvas: null,
      currentImage: null,
      brightness: 0,
      contrast: 0,
      rotationAngle: 0,
      scaleValue: 1,
      initialScale: 1, // 记录初始缩放比例
      cropRect: null,
      isCropping: false,
      previewUpdateTimer: null, // 预览更新防抖定时器
      scaleUpdateTimer: null, // 缩放更新防抖定时器
      rotationUpdateTimer: null, // 旋转更新防抖定时器
      isUpdatingScale: false, // 标志位，防止循环更新
      isUpdatingRotation: false, // 标志位，防止旋转循环更新
      isLoading: false, // 加载状态
      loadingMessage: '', // 加载消息
      successMessage: '', // 成功消息
      showSuccess: false, // 显示成功消息
      originalImageData: null, // 原始图片数据备份
      originalImageState: null // 原始图片状态备份
    }
  },
  mounted() {
    this.initCanvas()
    this.initPreviewCanvas()
    this.loadDefaultImage()
  },
  beforeDestroy() {
    // 清理裁剪事件监听器和定时器
    this.cleanupCropEventListeners()

    // 清理所有Canvas事件监听器
    this.cleanupAllCanvasEventListeners()

    // 清理备份数据
    this.originalImageData = null
    this.originalImageState = null

    if (this.canvas) {
      this.canvas.dispose()
    }
    if (this.previewCanvas) {
      this.previewCanvas.dispose()
    }
  },
  methods: {
    initCanvas() {
      try {
        // 获取容器尺寸
        const container = this.$refs.fabricCanvas.parentElement
        const containerWidth = container.clientWidth - 32 // 减去padding
        const canvasWidth = Math.min(containerWidth, 800)
        const canvasHeight = 500

        this.canvas = new fabric.Canvas(this.$refs.fabricCanvas, {
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: '#f8f9fa',
          preserveObjectStacking: true
        })

        // 启用对象控制和选择
        this.canvas.selection = true
        this.canvas.skipTargetFind = false

        // 添加Canvas事件监听
        this.canvas.on('selection:created', () => {
          console.log('对象已选中')
        })

        this.canvas.on('selection:cleared', () => {
          console.log('选择已清除')
        })

        // 添加缩放事件监听器
        this.setupScaleEventListeners()

        console.log('Canvas初始化成功，尺寸:', canvasWidth, 'x', canvasHeight)
      } catch (error) {
        console.error('Canvas初始化失败:', error)
      }
    },

    // 设置缩放和旋转事件监听器
    setupScaleEventListeners() {
      if (!this.canvas) return

      // 监听对象缩放事件
      this.canvas.on('object:scaling', (e) => {
        if (e.target === this.currentImage) {
          this.debouncedUpdateScaleValue(e.target)
        }
      })

      // 监听对象旋转事件
      this.canvas.on('object:rotating', (e) => {
        if (e.target === this.currentImage) {
          this.debouncedUpdateRotationValue(e.target)
        }
      })

      // 监听对象修改完成事件
      this.canvas.on('object:modified', (e) => {
        if (e.target === this.currentImage) {
          this.updateScaleValue(e.target)
          this.updateRotationValue(e.target)
          // 同时更新预览
          this.updatePreview()
        }
      })

      // 监听对象移动事件（可能包含缩放）
      this.canvas.on('object:moving', (e) => {
        if (e.target === this.currentImage) {
          // 移动时不需要更新缩放值，但可以更新预览
          this.debouncedUpdatePreview()
        }
      })

      console.log('缩放和旋转事件监听器已设置')
    },

    // 更新缩放值
    updateScaleValue(imageObject) {
      // 如果正在通过滑块更新缩放，避免循环更新
      if (this.isUpdatingScale) {
        return
      }

      if (!imageObject || !this.initialScale || this.initialScale === 0) {
        return
      }

      try {
        // 获取当前图片的缩放比例（使用X轴缩放作为主要参考）
        const currentScale = imageObject.scaleX

        // 计算相对于初始缩放的比例
        const relativeScale = currentScale / this.initialScale

        // 更新滑块值，保留两位小数
        const newScaleValue = Math.round(relativeScale * 100) / 100

        // 只有当值发生变化时才更新
        if (Math.abs(this.scaleValue - newScaleValue) > 0.01) {
          this.scaleValue = newScaleValue

          console.log('缩放值已更新:', {
            currentScale: currentScale,
            initialScale: this.initialScale,
            relativeScale: relativeScale,
            scaleValue: this.scaleValue
          })
        }

      } catch (error) {
        console.error('更新缩放值失败:', error)
      }
    },

    // 防抖更新缩放值
    debouncedUpdateScaleValue(imageObject) {
      if (this.scaleUpdateTimer) {
        clearTimeout(this.scaleUpdateTimer)
      }
      this.scaleUpdateTimer = setTimeout(() => {
        this.updateScaleValue(imageObject)
      }, 50) // 50ms防抖
    },

    // 更新旋转角度值
    updateRotationValue(imageObject) {
      // 如果正在通过滑块更新旋转，避免循环更新
      if (this.isUpdatingRotation) {
        return
      }

      if (!imageObject) {
        return
      }

      try {
        // 获取当前图片的旋转角度
        let currentAngle = imageObject.angle || 0

        // 将角度标准化到0-360度范围内
        currentAngle = this.normalizeAngle(currentAngle)

        // 更新滑块值，保留整数
        const newRotationAngle = Math.round(currentAngle)

        // 只有当值发生变化时才更新
        if (Math.abs(this.rotationAngle - newRotationAngle) > 0.5) {
          this.rotationAngle = newRotationAngle

          console.log('旋转角度已更新:', {
            originalAngle: imageObject.angle,
            normalizedAngle: currentAngle,
            rotationAngle: this.rotationAngle
          })
        }

      } catch (error) {
        console.error('更新旋转角度失败:', error)
      }
    },

    // 防抖更新旋转值
    debouncedUpdateRotationValue(imageObject) {
      if (this.rotationUpdateTimer) {
        clearTimeout(this.rotationUpdateTimer)
      }
      this.rotationUpdateTimer = setTimeout(() => {
        this.updateRotationValue(imageObject)
      }, 50) // 50ms防抖
    },

    // 标准化角度到0-360度范围内
    normalizeAngle(angle) {
      // 将角度转换为0-360度范围
      angle = angle % 360
      if (angle < 0) {
        angle += 360
      }
      return angle
    },

    initPreviewCanvas() {
      try {
        this.previewCanvas = new fabric.Canvas(this.$refs.previewCanvas, {
          width: 300,
          height: 200,
          backgroundColor: '#f8f9fa',
          selection: false,
          interactive: false
        })

        console.log('预览Canvas初始化成功')
      } catch (error) {
        console.error('预览Canvas初始化失败:', error)
      }
    },
    
    loadDefaultImage() {
      const imagePath = require('@/assets/illust_104350264_20230531_093134.png')

      fabric.Image.fromURL(imagePath, (img) => {
        if (!img) {
          console.error('图片加载失败')
          return
        }

        // 计算适合Canvas的缩放比例
        const canvasWidth = this.canvas.width
        const canvasHeight = this.canvas.height
        const imgWidth = img.width
        const imgHeight = img.height

        // 计算缩放比例，确保图片完全显示在Canvas内
        const scaleX = (canvasWidth * 0.8) / imgWidth
        const scaleY = (canvasHeight * 0.8) / imgHeight
        const scale = Math.min(scaleX, scaleY)

        // 计算居中位置
        const scaledWidth = imgWidth * scale
        const scaledHeight = imgHeight * scale
        const left = (canvasWidth - scaledWidth) / 2
        const top = (canvasHeight - scaledHeight) / 2

        img.set({
          left: left,
          top: top,
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          evented: true,
          // 设置旋转中心点为图片中心
          originX: 'center',
          originY: 'center'
        })

        // 重新计算位置，因为originX/Y改变了
        img.set({
          left: left + scaledWidth / 2,
          top: top + scaledHeight / 2
        })

        // 初始化滤镜数组
        img.filters = []

        // 记录初始缩放比例
        this.initialScale = scale
        this.scaleValue = 1 // 重置滑块值为1

        this.currentImage = img
        this.canvas.add(img)
        this.canvas.setActiveObject(img)
        this.canvas.renderAll()

        // 备份原始图片数据和状态
        this.backupOriginalImage(imagePath, {
          left: left + scaledWidth / 2,
          top: top + scaledHeight / 2,
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          selectable: true,
          evented: true
        })

        // 更新预览
        this.updatePreview()

        console.log('默认图片加载成功，尺寸:', imgWidth, 'x', imgHeight, '初始缩放比例:', scale)
      }, {
        crossOrigin: 'anonymous'
      })
    },

    updatePreview() {
      if (!this.previewCanvas || !this.currentImage) {
        return
      }

      try {
        // 清空预览Canvas
        this.previewCanvas.clear()
        this.previewCanvas.backgroundColor = '#f8f9fa'

        if (this.isCropping && this.cropRect) {
          // 裁剪模式：显示裁剪预览
          this.updateCropPreview()
        } else {
          // 普通模式：显示完整图片预览
          this.updateNormalPreview()
        }
      } catch (error) {
        console.error('更新预览失败:', error)
      }
    },

    updateNormalPreview() {
      // 克隆当前图片对象
      this.currentImage.clone((clonedImg) => {
        // 计算预览Canvas的适合尺寸
        const previewWidth = this.previewCanvas.width
        const previewHeight = this.previewCanvas.height
        const imgWidth = clonedImg.width * clonedImg.scaleX
        const imgHeight = clonedImg.height * clonedImg.scaleY

        // 计算预览缩放比例
        const previewScaleX = (previewWidth * 0.9) / imgWidth
        const previewScaleY = (previewHeight * 0.9) / imgHeight
        const previewScale = Math.min(previewScaleX, previewScaleY)

        // 设置预览图片属性
        clonedImg.set({
          left: previewWidth / 2,
          top: previewHeight / 2,
          scaleX: clonedImg.scaleX * previewScale,
          scaleY: clonedImg.scaleY * previewScale,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false
        })

        // 添加到预览Canvas
        this.previewCanvas.add(clonedImg)
        this.previewCanvas.renderAll()
      })
    },

    updateCropPreview() {
      try {
        // 获取裁剪区域和图片的边界
        const cropBounds = this.cropRect.getBoundingRect()
        const imgBounds = this.currentImage.getBoundingRect()

        // 计算裁剪区域与图片的交集
        const intersectLeft = Math.max(cropBounds.left, imgBounds.left)
        const intersectTop = Math.max(cropBounds.top, imgBounds.top)
        const intersectRight = Math.min(cropBounds.left + cropBounds.width, imgBounds.left + imgBounds.width)
        const intersectBottom = Math.min(cropBounds.top + cropBounds.height, imgBounds.top + imgBounds.height)

        const intersectWidth = Math.max(0, intersectRight - intersectLeft)
        const intersectHeight = Math.max(0, intersectBottom - intersectTop)

        if (intersectWidth <= 0 || intersectHeight <= 0) {
          console.warn('裁剪区域与图片无交集')
          return
        }

        // 克隆图片用于预览
        this.currentImage.clone((clonedImg) => {
          // 先显示完整图片
          const previewWidth = this.previewCanvas.width
          const previewHeight = this.previewCanvas.height

          // 计算图片在预览Canvas中的缩放和位置
          const imgWidth = clonedImg.width * clonedImg.scaleX
          const imgHeight = clonedImg.height * clonedImg.scaleY

          const previewScaleX = (previewWidth * 0.9) / imgWidth
          const previewScaleY = (previewHeight * 0.9) / imgHeight
          const previewScale = Math.min(previewScaleX, previewScaleY)

          // 设置图片在预览Canvas中的属性
          clonedImg.set({
            left: previewWidth / 2,
            top: previewHeight / 2,
            scaleX: clonedImg.scaleX * previewScale,
            scaleY: clonedImg.scaleY * previewScale,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
          })

          // 添加图片到预览Canvas
          this.previewCanvas.add(clonedImg)

          // 创建裁剪框预览（显示裁剪区域边界）
          const previewCropRect = new fabric.Rect({
            left: previewWidth / 2 + (intersectLeft - imgBounds.left - imgWidth / 2) * previewScale,
            top: previewHeight / 2 + (intersectTop - imgBounds.top - imgHeight / 2) * previewScale,
            width: intersectWidth * previewScale,
            height: intersectHeight * previewScale,
            fill: 'transparent',
            stroke: '#ff0000',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            originX: 'left',
            originY: 'top'
          })

          // 添加裁剪框预览
          this.previewCanvas.add(previewCropRect)

          // 创建遮罩效果（裁剪区域外的部分半透明）
          this.addCropMask(previewCropRect)

          this.previewCanvas.renderAll()

          console.log('裁剪预览已更新，交集区域:', {
            left: intersectLeft - imgBounds.left,
            top: intersectTop - imgBounds.top,
            width: intersectWidth,
            height: intersectHeight
          })
        })
      } catch (error) {
        console.error('更新裁剪预览失败:', error)
      }
    },

    addCropMask(previewCropRect) {
      try {
        const previewWidth = this.previewCanvas.width
        const previewHeight = this.previewCanvas.height

        // 创建半透明遮罩，覆盖整个预览区域
        const mask = new fabric.Rect({
          left: 0,
          top: 0,
          width: previewWidth,
          height: previewHeight,
          fill: 'rgba(0, 0, 0, 0.5)',
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top'
        })

        this.previewCanvas.add(mask)

        // 在裁剪区域创建透明"窗口"
        const window = new fabric.Rect({
          left: previewCropRect.left,
          top: previewCropRect.top,
          width: previewCropRect.width,
          height: previewCropRect.height,
          fill: 'rgba(255, 255, 255, 0)',
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top'
        })

        this.previewCanvas.add(window)
      } catch (error) {
        console.error('添加裁剪遮罩失败:', error)
      }
    },
    
    applyBrightness() {
      if (!this.currentImage) {
        console.warn('没有当前图片对象')
        return
      }

      try {
        // 移除现有的亮度滤镜
        this.currentImage.filters = this.currentImage.filters.filter(f => f.type !== 'Brightness')

        // 添加新的亮度滤镜
        const brightnessValue = parseFloat(this.brightness)
        if (brightnessValue !== 0) {
          this.currentImage.filters.push(new fabric.Image.filters.Brightness({
            brightness: brightnessValue
          }))
        }

        // 应用滤镜并重新渲染
        this.currentImage.applyFilters()
        this.canvas.requestRenderAll()

        // 更新预览
        this.updatePreview()

        console.log('亮度滤镜已应用:', brightnessValue)
      } catch (error) {
        console.error('应用亮度滤镜失败:', error)
      }
    },

    applyContrast() {
      if (!this.currentImage) {
        console.warn('没有当前图片对象')
        return
      }

      try {
        // 移除现有的对比度滤镜
        this.currentImage.filters = this.currentImage.filters.filter(f => f.type !== 'Contrast')

        // 添加新的对比度滤镜
        const contrastValue = parseFloat(this.contrast)
        if (contrastValue !== 0) {
          this.currentImage.filters.push(new fabric.Image.filters.Contrast({
            contrast: contrastValue
          }))
        }

        // 应用滤镜并重新渲染
        this.currentImage.applyFilters()
        this.canvas.requestRenderAll()

        // 更新预览
        this.updatePreview()

        console.log('对比度滤镜已应用:', contrastValue)
      } catch (error) {
        console.error('应用对比度滤镜失败:', error)
      }
    },
    
    rotateImage() {
      if (!this.currentImage) {
        console.warn('没有当前图片对象')
        return
      }

      try {
        // 设置标志位，防止事件监听器触发循环更新
        this.isUpdatingRotation = true

        const angle = parseFloat(this.rotationAngle)

        // 确保旋转中心点设置正确
        this.currentImage.set({
          angle: angle,
          originX: 'center',
          originY: 'center'
        })

        this.canvas.requestRenderAll()

        // 更新预览
        this.updatePreview()

        console.log('图片旋转角度已设置:', angle)

        // 延迟重置标志位，确保Canvas事件处理完成
        setTimeout(() => {
          this.isUpdatingRotation = false
        }, 100)

      } catch (error) {
        console.error('旋转图片失败:', error)
        this.isUpdatingRotation = false
      }
    },

    rotateLeft() {
      const newAngle = parseFloat(this.rotationAngle) - 90
      this.rotationAngle = this.normalizeAngle(newAngle)
      this.rotateImage()
    },

    rotateRight() {
      const newAngle = parseFloat(this.rotationAngle) + 90
      this.rotationAngle = this.normalizeAngle(newAngle)
      this.rotateImage()
    },

    scaleImage() {
      if (!this.currentImage) {
        console.warn('没有当前图片对象')
        return
      }

      try {
        // 设置标志位，防止事件监听器触发循环更新
        this.isUpdatingScale = true

        const scaleMultiplier = parseFloat(this.scaleValue)
        // 使用初始缩放比例作为基准，滑块值1对应初始适合Canvas的尺寸
        const finalScale = this.initialScale * scaleMultiplier

        this.currentImage.set({
          scaleX: finalScale,
          scaleY: finalScale,
          originX: 'center',
          originY: 'center'
        })

        this.canvas.requestRenderAll()

        // 更新预览
        this.updatePreview()

        console.log('图片缩放比例已设置:', finalScale, '(基准:', this.initialScale, '倍数:', scaleMultiplier, ')')

        // 延迟重置标志位，确保Canvas事件处理完成
        setTimeout(() => {
          this.isUpdatingScale = false
        }, 100)

      } catch (error) {
        console.error('缩放图片失败:', error)
        this.isUpdatingScale = false
      }
    },
    
    enableCrop() {
      if (this.isCropping) {
        console.warn('已在裁剪模式中')
        return
      }

      if (!this.currentImage) {
        console.warn('没有当前图片对象')
        return
      }

      try {
        // 计算裁剪框的初始位置（基于图片位置）
        const imgBounds = this.currentImage.getBoundingRect()
        const cropWidth = Math.min(200, imgBounds.width * 0.6)
        const cropHeight = Math.min(150, imgBounds.height * 0.6)
        const cropLeft = imgBounds.left + (imgBounds.width - cropWidth) / 2
        const cropTop = imgBounds.top + (imgBounds.height - cropHeight) / 2

        this.cropRect = new fabric.Rect({
          left: cropLeft,
          top: cropTop,
          width: cropWidth,
          height: cropHeight,
          fill: 'rgba(255, 0, 0, 0.1)',
          stroke: '#ff0000',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          transparentCorners: false,
          cornerColor: '#ff0000',
          cornerSize: 8
        })

        this.canvas.add(this.cropRect)
        this.canvas.setActiveObject(this.cropRect)
        this.isCropping = true
        this.canvas.requestRenderAll()

        // 添加裁剪框事件监听器，实现实时预览更新
        this.setupCropEventListeners()

        // 初始裁剪预览
        this.updatePreview()

        console.log('裁剪模式已启用')
      } catch (error) {
        console.error('启用裁剪模式失败:', error)
      }
    },

    setupCropEventListeners() {
      if (!this.cropRect) return

      // 裁剪框移动事件
      this.cropRect.on('moving', () => {
        // 使用防抖来避免过于频繁的更新
        this.debouncedUpdatePreview()
      })

      // 裁剪框缩放事件
      this.cropRect.on('scaling', () => {
        this.debouncedUpdatePreview()
      })

      // 裁剪框修改事件
      this.cropRect.on('modified', () => {
        this.updatePreview()
      })

      // Canvas对象移动事件（包括裁剪框）
      this.canvas.on('object:moving', (e) => {
        if (e.target === this.cropRect) {
          this.debouncedUpdatePreview()
        }
      })

      // Canvas对象缩放事件
      this.canvas.on('object:scaling', (e) => {
        if (e.target === this.cropRect) {
          this.debouncedUpdatePreview()
        }
      })

      // Canvas对象修改完成事件
      this.canvas.on('object:modified', (e) => {
        if (e.target === this.cropRect) {
          this.updatePreview()
        }
      })
    },

    // 防抖更新预览，避免过于频繁的更新
    debouncedUpdatePreview() {
      if (this.previewUpdateTimer) {
        clearTimeout(this.previewUpdateTimer)
      }
      this.previewUpdateTimer = setTimeout(() => {
        this.updatePreview()
      }, 100) // 100ms防抖
    },

    // 清理裁剪事件监听器
    cleanupCropEventListeners() {
      if (this.cropRect) {
        this.cropRect.off('moving')
        this.cropRect.off('scaling')
        this.cropRect.off('modified')
      }

      // 清理防抖定时器
      if (this.previewUpdateTimer) {
        clearTimeout(this.previewUpdateTimer)
        this.previewUpdateTimer = null
      }

      if (this.scaleUpdateTimer) {
        clearTimeout(this.scaleUpdateTimer)
        this.scaleUpdateTimer = null
      }

      if (this.rotationUpdateTimer) {
        clearTimeout(this.rotationUpdateTimer)
        this.rotationUpdateTimer = null
      }
    },

    // 清理所有Canvas事件监听器
    cleanupAllCanvasEventListeners() {
      if (!this.canvas) return

      // 清理所有Canvas事件监听器
      this.canvas.off('object:moving')
      this.canvas.off('object:scaling')
      this.canvas.off('object:rotating')
      this.canvas.off('object:modified')
      this.canvas.off('selection:created')
      this.canvas.off('selection:cleared')

      console.log('所有Canvas事件监听器已清理')
    },

    async applyCrop() {
      if (!this.isCropping || !this.cropRect || !this.currentImage) {
        console.warn('无法应用裁剪：缺少必要对象')
        return
      }

      try {
        const cropRect = this.cropRect.getBoundingRect()
        const imgBounds = this.currentImage.getBoundingRect()

        // 计算相对于图片的裁剪区域
        const relativeLeft = Math.max(0, cropRect.left - imgBounds.left)
        const relativeTop = Math.max(0, cropRect.top - imgBounds.top)
        const cropWidth = Math.min(cropRect.width, imgBounds.width - relativeLeft)
        const cropHeight = Math.min(cropRect.height, imgBounds.height - relativeTop)

        if (cropWidth <= 0 || cropHeight <= 0) {
          alert('裁剪区域无效，请调整裁剪框位置')
          return
        }

        // 确认裁剪操作
        const confirmCrop = confirm(`确定要裁剪图片吗？\n裁剪区域: ${Math.round(cropWidth)} x ${Math.round(cropHeight)}`)

        if (!confirmCrop) {
          return
        }

        // 显示加载状态
        this.showLoadingMessage('正在应用裁剪...')

        // 执行真正的图片裁剪
        await this.performActualCrop(relativeLeft, relativeTop, cropWidth, cropHeight)

        // 隐藏加载状态
        this.hideLoadingMessage()

        // 禁用裁剪模式
        this.disableCrop()

        // 更新预览
        this.updatePreview()

        // 显示成功消息
        this.showSuccessMessage('裁剪操作已完成！')

        console.log('裁剪操作成功完成')

      } catch (error) {
        console.error('应用裁剪失败:', error)
        this.hideLoadingMessage()
        alert('裁剪操作失败：' + error.message)
      }
    },

    async performActualCrop(left, top, width, height) {
      return new Promise((resolve, reject) => {
        try {
          // 获取当前图片的原始尺寸和变换信息
          const img = this.currentImage
          const imgElement = img.getElement()
          const scaleX = img.scaleX
          const scaleY = img.scaleY

          // 计算在原始图片坐标系中的裁剪区域
          const originalWidth = imgElement.naturalWidth || imgElement.width
          const originalHeight = imgElement.naturalHeight || imgElement.height

          // 计算裁剪区域在原始图片中的比例位置
          const cropLeftRatio = left / (originalWidth * scaleX)
          const cropTopRatio = top / (originalHeight * scaleY)
          const cropWidthRatio = width / (originalWidth * scaleX)
          const cropHeightRatio = height / (originalHeight * scaleY)

          // 创建临时Canvas进行裁剪
          const tempCanvas = document.createElement('canvas')
          const tempCtx = tempCanvas.getContext('2d')

          // 设置裁剪后的Canvas尺寸
          tempCanvas.width = width
          tempCanvas.height = height

          // 计算源图片的裁剪区域（在原始图片坐标系中）
          const sourceX = cropLeftRatio * originalWidth
          const sourceY = cropTopRatio * originalHeight
          const sourceWidth = cropWidthRatio * originalWidth
          const sourceHeight = cropHeightRatio * originalHeight

          // 在临时Canvas上绘制裁剪后的图片
          tempCtx.drawImage(
            imgElement,
            sourceX, sourceY, sourceWidth, sourceHeight,  // 源区域
            0, 0, width, height  // 目标区域
          )

          // 将裁剪后的图片转换为新的Fabric图片对象
          const croppedDataURL = tempCanvas.toDataURL('image/png')

          fabric.Image.fromURL(croppedDataURL, (croppedImg) => {
            try {
              // 移除原始图片
              this.canvas.remove(this.currentImage)

              // 计算新图片的位置（居中显示）
              const canvasWidth = this.canvas.width
              const canvasHeight = this.canvas.height

              // 计算适合Canvas的缩放比例
              const newScaleX = Math.min((canvasWidth * 0.8) / width, (canvasHeight * 0.8) / height)
              const newScaleY = newScaleX

              // 设置裁剪后图片的属性
              croppedImg.set({
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                scaleX: newScaleX,
                scaleY: newScaleY,
                originX: 'center',
                originY: 'center',
                selectable: true,
                evented: true
              })

              // 保持原有的滤镜效果
              if (this.currentImage.filters && this.currentImage.filters.length > 0) {
                croppedImg.filters = [...this.currentImage.filters]
                croppedImg.applyFilters()
              }

              // 更新当前图片引用
              this.currentImage = croppedImg

              // 记录新的初始缩放比例
              this.initialScale = newScaleX
              this.scaleValue = 1

              // 添加到Canvas
              this.canvas.add(croppedImg)
              this.canvas.setActiveObject(croppedImg)
              this.canvas.requestRenderAll()

              resolve()
            } catch (error) {
              reject(error)
            }
          }, {
            crossOrigin: 'anonymous'
          })

        } catch (error) {
          reject(error)
        }
      })
    },

    async disableCrop() {
      if (this.isCropping && this.cropRect) {
        try {
          // 清理事件监听器
          this.cleanupCropEventListeners()

          // 移除裁剪框
          this.canvas.remove(this.cropRect)
          this.cropRect = null
          this.isCropping = false
          this.canvas.requestRenderAll()

          // 更新预览（回到普通模式）
          this.updatePreview()

          console.log('裁剪模式已禁用')
        } catch (error) {
          console.error('禁用裁剪模式失败:', error)
        }
      }
    },

    // 取消裁剪 - 恢复到原始图片状态
    async cancelCrop() {
      try {
        // 先禁用裁剪模式（移除裁剪框）
        await this.disableCrop()

        // 恢复原始图片
        const restored = await this.restoreOriginalImage()

        if (restored) {
          this.showSuccessMessage('已恢复到原始图片状态！')
          console.log('裁剪已取消，图片已恢复到原始状态')
        } else {
          console.warn('无法恢复原始图片状态')
        }

      } catch (error) {
        console.error('取消裁剪失败:', error)
        alert('取消裁剪失败：' + error.message)
      }
    },
    
    loadImage(event) {
      const file = event.target.files[0]
      if (!file) {
        return
      }

      // 先禁用裁剪模式
      this.disableCrop()

      const reader = new FileReader()
      reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
          if (!img) {
            console.error('用户图片加载失败')
            return
          }

          // 移除当前图片
          if (this.currentImage) {
            this.canvas.remove(this.currentImage)
          }

          // 计算适合Canvas的缩放比例
          const canvasWidth = this.canvas.width
          const canvasHeight = this.canvas.height
          const imgWidth = img.width
          const imgHeight = img.height

          const scaleX = (canvasWidth * 0.7) / imgWidth
          const scaleY = (canvasHeight * 0.7) / imgHeight
          const scale = Math.min(scaleX, scaleY)

          // 计算居中位置
          const scaledWidth = imgWidth * scale
          const scaledHeight = imgHeight * scale
          const left = (canvasWidth - scaledWidth) / 2
          const top = (canvasHeight - scaledHeight) / 2

          img.set({
            left: left,
            top: top,
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            evented: true,
            // 设置旋转中心点为图片中心
            originX: 'center',
            originY: 'center'
          })

          // 重新计算位置，因为originX/Y改变了
          img.set({
            left: left + scaledWidth / 2,
            top: top + scaledHeight / 2
          })

          // 初始化滤镜数组
          img.filters = []

          // 记录初始缩放比例
          this.initialScale = scale
          this.scaleValue = 1 // 重置滑块值为1

          this.currentImage = img
          this.canvas.add(img)
          this.canvas.setActiveObject(img)
          this.resetControls()
          this.canvas.requestRenderAll()

          // 备份原始图片数据和状态
          this.backupOriginalImage(e.target.result, {
            left: left + scaledWidth / 2,
            top: top + scaledHeight / 2,
            scaleX: scale,
            scaleY: scale,
            originX: 'center',
            originY: 'center',
            selectable: true,
            evented: true
          })

          // 更新预览
          this.updatePreview()

          console.log('用户图片加载成功，尺寸:', imgWidth, 'x', imgHeight, '初始缩放比例:', scale)
        }, {
          crossOrigin: 'anonymous'
        })
      }
      reader.readAsDataURL(file)
    },
    
    downloadImage() {
      if (!this.currentImage) {
        alert('没有图片可以下载')
        return
      }

      try {
        // 显示加载状态
        this.showLoadingMessage('正在准备下载...')

        // 创建只包含图片的临时Canvas
        const tempCanvas = document.createElement('canvas')

        // 获取图片的实际显示尺寸
        const imgBounds = this.currentImage.getBoundingRect()
        const imgWidth = imgBounds.width
        const imgHeight = imgBounds.height

        // 设置临时Canvas尺寸为图片尺寸
        tempCanvas.width = imgWidth
        tempCanvas.height = imgHeight

        // 创建临时Fabric Canvas
        const tempFabricCanvas = new fabric.Canvas(tempCanvas, {
          width: imgWidth,
          height: imgHeight,
          backgroundColor: null // 透明背景
        })

        // 克隆当前图片
        this.currentImage.clone((clonedImg) => {
          try {
            // 调整克隆图片的位置和尺寸以适应临时Canvas
            clonedImg.set({
              left: imgWidth / 2,
              top: imgHeight / 2,
              originX: 'center',
              originY: 'center'
            })

            // 添加到临时Canvas
            tempFabricCanvas.add(clonedImg)
            tempFabricCanvas.renderAll()

            // 导出为数据URL
            const dataURL = tempFabricCanvas.toDataURL({
              format: 'png',
              quality: 1,
              multiplier: 1
            })

            // 创建下载链接
            const link = document.createElement('a')
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
            link.download = `fabric-edited-image-${timestamp}.png`
            link.href = dataURL

            // 触发下载
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // 清理临时Canvas
            tempFabricCanvas.dispose()

            // 隐藏加载状态
            this.hideLoadingMessage()

            // 显示成功消息
            this.showSuccessMessage('图片下载成功！')

            console.log('图片下载成功')

          } catch (error) {
            console.error('下载图片失败:', error)
            this.hideLoadingMessage()
            alert('下载图片失败：' + error.message)
          }
        })

      } catch (error) {
        console.error('准备下载失败:', error)
        this.hideLoadingMessage()
        alert('准备下载失败：' + error.message)
      }
    },

    // 用户反馈方法
    showLoadingMessage(message) {
      this.loadingMessage = message
      this.isLoading = true
      this.showSuccess = false
    },

    hideLoadingMessage() {
      this.isLoading = false
      this.loadingMessage = ''
    },

    showSuccessMessage(message) {
      this.successMessage = message
      this.showSuccess = true
      this.isLoading = false

      // 3秒后自动隐藏成功消息
      setTimeout(() => {
        this.showSuccess = false
        this.successMessage = ''
      }, 3000)
    },

    // 备份原始图片数据和状态
    backupOriginalImage(imageUrl, imageState) {
      try {
        this.originalImageData = imageUrl
        this.originalImageState = {
          ...imageState,
          initialScale: this.initialScale,
          scaleValue: 1
        }
        console.log('原始图片已备份')
      } catch (error) {
        console.error('备份原始图片失败:', error)
      }
    },

    // 恢复原始图片
    async restoreOriginalImage() {
      if (!this.originalImageData || !this.originalImageState) {
        console.warn('没有原始图片备份可以恢复')
        return false
      }

      try {
        // 显示加载状态
        this.showLoadingMessage('正在恢复原始图片...')

        return new Promise((resolve, reject) => {
          fabric.Image.fromURL(this.originalImageData, (img) => {
            try {
              if (!img) {
                reject(new Error('恢复图片加载失败'))
                return
              }

              // 移除当前图片
              if (this.currentImage) {
                this.canvas.remove(this.currentImage)
              }

              // 恢复原始状态
              img.set(this.originalImageState)

              // 初始化滤镜数组
              img.filters = []

              // 应用当前的滤镜设置
              this.applyCurrentFiltersToImage(img)

              // 恢复状态变量
              this.initialScale = this.originalImageState.initialScale
              this.scaleValue = this.originalImageState.scaleValue

              // 更新当前图片引用
              this.currentImage = img

              // 添加到Canvas
              this.canvas.add(img)
              this.canvas.setActiveObject(img)
              this.canvas.requestRenderAll()

              // 更新预览
              this.updatePreview()

              // 隐藏加载状态
              this.hideLoadingMessage()

              console.log('原始图片已恢复')
              resolve(true)

            } catch (error) {
              reject(error)
            }
          }, {
            crossOrigin: 'anonymous'
          })
        })

      } catch (error) {
        console.error('恢复原始图片失败:', error)
        this.hideLoadingMessage()
        return false
      }
    },

    // 应用当前滤镜设置到指定图片
    applyCurrentFiltersToImage(img) {
      try {
        // 清空现有滤镜
        img.filters = []

        // 应用亮度滤镜
        if (this.brightness !== 0) {
          img.filters.push(new fabric.Image.filters.Brightness({
            brightness: parseFloat(this.brightness)
          }))
        }

        // 应用对比度滤镜
        if (this.contrast !== 0) {
          img.filters.push(new fabric.Image.filters.Contrast({
            contrast: parseFloat(this.contrast)
          }))
        }

        // 应用旋转
        if (this.rotationAngle !== 0) {
          img.set('angle', parseFloat(this.rotationAngle))
        }

        // 应用缩放
        if (this.scaleValue !== 1) {
          const finalScale = this.initialScale * parseFloat(this.scaleValue)
          img.set({
            scaleX: finalScale,
            scaleY: finalScale
          })
        }

        // 应用所有滤镜
        img.applyFilters()

        console.log('当前滤镜已应用到图片')
      } catch (error) {
        console.error('应用滤镜到图片失败:', error)
      }
    },
    
    resetCanvas() {
      try {
        // 先禁用裁剪模式
        this.disableCrop()

        // 清空画布
        this.canvas.clear()
        this.canvas.backgroundColor = '#f8f9fa'

        // 重置控制参数
        this.resetControls()

        // 清理备份数据
        this.originalImageData = null
        this.originalImageState = null

        // 重新加载默认图片
        this.loadDefaultImage()

        // 清空预览Canvas
        if (this.previewCanvas) {
          this.previewCanvas.clear()
          this.previewCanvas.backgroundColor = '#f8f9fa'
          this.previewCanvas.renderAll()
        }

        console.log('画布已重置')
      } catch (error) {
        console.error('重置画布失败:', error)
      }
    },

    zoomIn() {
      try {
        const zoom = this.canvas.getZoom()
        const newZoom = Math.min(zoom * 1.1, 3) // 限制最大缩放
        this.canvas.setZoom(newZoom)
        this.canvas.requestRenderAll()
      } catch (error) {
        console.error('放大失败:', error)
      }
    },

    zoomOut() {
      try {
        const zoom = this.canvas.getZoom()
        const newZoom = Math.max(zoom * 0.9, 0.1) // 限制最小缩放
        this.canvas.setZoom(newZoom)
        this.canvas.requestRenderAll()
      } catch (error) {
        console.error('缩小失败:', error)
      }
    },

    resetZoom() {
      try {
        this.canvas.setZoom(1)
        this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0]
        this.canvas.requestRenderAll()
      } catch (error) {
        console.error('重置缩放失败:', error)
      }
    },

    resetControls() {
      this.brightness = 0
      this.contrast = 0
      this.rotationAngle = 0
      this.scaleValue = 1
    }
  }
}
</script>

<style scoped>
.fabric-editor-view {
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

.canvas-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.canvas-wrapper {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  overflow: hidden;
}

#fabric-canvas {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
}

.preview-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.preview-section h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  text-align: center;
}

.preview-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  padding: 1rem;
  min-height: 220px;
}

#preview-canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.status-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.loading-message {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.success-message {
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #bbdefb;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.success-icon {
  font-size: 1.1rem;
  font-weight: bold;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
  border: 1px solid #ffc107;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
  border-color: #d39e00;
}

.controls-panel {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
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
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
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

  #fabric-canvas {
    max-width: 100%;
  }

  .canvas-section {
    gap: 1rem;
  }

  .preview-wrapper {
    min-height: 180px;
  }

  #preview-canvas {
    width: 250px;
    height: 150px;
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

  .canvas-section {
    gap: 1rem;
  }

  .preview-section {
    padding: 1rem;
  }

  .preview-wrapper {
    min-height: 150px;
    padding: 0.5rem;
  }

  #preview-canvas {
    width: 200px;
    height: 120px;
  }
}
</style>
