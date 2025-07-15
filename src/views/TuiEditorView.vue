<template>
  <div class="tui-editor-view">
    <div class="editor-header">
      <h1>TUI Image Editor 演示</h1>
      <p>功能全面的图片编辑器，支持裁剪、旋转、滤镜、文本等多种功能</p>
    </div>

    <div class="editor-container">
      <div class="editor-wrapper">
        <div id="tui-image-editor" ref="tuiImageEditor"></div>
      </div>
      
      <div class="controls-panel">
        <h3>快速操作</h3>
        
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
              min="-1" 
              max="1" 
              step="0.1" 
              v-model="contrast"
              @input="applyContrast"
            />
          </div>
        </div>

        <div class="control-group">
          <h4>旋转操作</h4>
          <div class="button-group">
            <button @click="rotateLeft" class="btn btn-secondary">向左旋转90°</button>
            <button @click="rotateRight" class="btn btn-secondary">向右旋转90°</button>
          </div>
        </div>

        <div class="control-group">
          <h4>裁剪操作</h4>
          <div class="status-indicator" v-if="isCropping">
            <span class="status-text">🔄 裁剪模式已激活</span>
          </div>
          <div class="button-group">
            <button @click="startCrop" class="btn btn-primary" :disabled="isCropping">开始裁剪</button>
            <button @click="applyCrop" class="btn btn-success" :disabled="!isCropping">应用裁剪</button>
            <button @click="cancelCrop" class="btn btn-secondary" :disabled="!isCropping">取消裁剪</button>
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
            <button @click="resetImage" class="btn btn-secondary">重置</button>
          </div>
        </div>
      </div>
    </div>

    <div class="features-info">
      <h3>TUI Image Editor 特性</h3>
      <div class="features-grid">
        <div class="feature-item">
          <h4>✂️ 图片裁剪</h4>
          <p>支持自由裁剪和按比例裁剪，提供多种预设比例</p>
        </div>
        <div class="feature-item">
          <h4>🔄 图片旋转</h4>
          <p>支持任意角度旋转，包括90度快速旋转</p>
        </div>
        <div class="feature-item">
          <h4>🎨 滤镜效果</h4>
          <p>内置多种滤镜效果，支持亮度、对比度、饱和度调节</p>
        </div>
        <div class="feature-item">
          <h4>📝 文本添加</h4>
          <p>支持添加文本，可调整字体、大小、颜色等属性</p>
        </div>
        <div class="feature-item">
          <h4>🖼️ 形状绘制</h4>
          <p>支持绘制矩形、圆形、箭头等基本形状</p>
        </div>
        <div class="feature-item">
          <h4>📱 移动端支持</h4>
          <p>完美支持触摸操作，适配移动设备</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImageEditor from 'tui-image-editor'
import 'tui-image-editor/dist/tui-image-editor.css'

export default {
  name: 'TuiEditorView',
  data() {
    return {
      imageEditor: null,
      brightness: 0,
      contrast: 0,
      isCropping: false,
      isImageLoaded: false,
      isMouseDown: false,
      isEditorReady: false
    }
  },
  mounted() {
    this.initEditor()
  },
  beforeDestroy() {
    if (this.imageEditor) {
      this.imageEditor.destroy()
    }
  },
  methods: {
    initEditor() {
      try {
        // 确保容器存在
        if (!this.$refs.tuiImageEditor) {
          console.error('TUI Image Editor 容器未找到')
          return
        }

        // 先初始化编辑器，不加载图片
        this.imageEditor = new ImageEditor(this.$refs.tuiImageEditor, {
          includeUI: {
            theme: {
              'common.bi.image': '',
              'common.bisize.width': '0px',
              'common.bisize.height': '0px'
            },
            menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'filter'],
            initMenu: 'filter',
            uiSize: {
              width: '100%',
              height: '500px'
            },
            menuBarPosition: 'bottom'
          },
          cssMaxWidth: 800,
          cssMaxHeight: 500,
          selectionStyle: {
            cornerSize: 20,
            rotatingPointOffset: 70
          },
          // Canvas性能优化配置
          usageStatistics: false
        })

        // 添加编辑器事件监听
        this.setupEditorEventListeners()

        // 尝试优化Canvas性能
        this.optimizeCanvasPerformance()

        // 延迟加载默认图片
        setTimeout(() => {
          this.loadDefaultImage()
        }, 500) // 增加延迟时间确保编辑器完全初始化

      } catch (error) {
        console.error('初始化TUI Image Editor失败:', error)
      }
    },

    setupEditorEventListeners() {
      if (!this.imageEditor) return

      try {
        // 监听编辑器事件，防止在不安全状态下操作
        this.imageEditor.on('mousedown', () => {
          // 鼠标按下时暂停滤镜操作
          this.isMouseDown = true
        })

        this.imageEditor.on('mouseup', () => {
          // 鼠标释放后恢复操作
          this.isMouseDown = false
        })

        // 监听裁剪模式变化
        this.imageEditor.on('undoStackChanged', () => {
          // 检查当前模式状态
          this.checkEditorState()
        })

      } catch (error) {
        console.warn('设置编辑器事件监听失败:', error)
      }
    },

    checkEditorState() {
      if (!this.imageEditor) return

      try {
        // 检查当前绘制模式
        const drawingMode = this.imageEditor.getDrawingMode()
        this.isCropping = drawingMode === 'CROPPER'
      } catch (error) {
        console.warn('检查编辑器状态失败:', error)
      }
    },

    optimizeCanvasPerformance() {
      // 尝试优化Canvas性能，设置willReadFrequently属性
      this.$nextTick(() => {
        try {
          const canvasElements = this.$refs.tuiImageEditor.querySelectorAll('canvas')
          canvasElements.forEach(canvas => {
            const context = canvas.getContext('2d')
            if (context && !context.willReadFrequently) {
              // 创建新的context with willReadFrequently
              try {
                const newContext = canvas.getContext('2d', { willReadFrequently: true })
                if (newContext) {
                  console.log('Canvas性能优化已应用')
                }
              } catch (error) {
                console.warn('无法应用Canvas性能优化:', error)
              }
            }
          })
        } catch (error) {
          console.warn('Canvas性能优化失败:', error)
        }
      })
    },

    loadDefaultImage() {
      if (!this.imageEditor) {
        console.error('图片编辑器未初始化')
        return
      }

      try {
        const imagePath = require('@/assets/illust_104350264_20230531_093134.png')

        // 预加载图片以确保它存在
        const img = new Image()
        img.onload = () => {
          // 图片加载成功后再加载到编辑器
          this.imageEditor.loadImageFromURL(imagePath, 'SampleImage')
            .then(() => {
              console.log('默认图片加载成功')
              this.isImageLoaded = true
              this.isEditorReady = true
              this.resetEditingState()

              // 等待编辑器完全稳定
              setTimeout(() => {
                this.checkEditorState()
              }, 200)
            })
            .catch((error) => {
              console.error('编辑器加载图片失败:', error)
              this.isImageLoaded = false
              this.isEditorReady = false
            })
        }
        img.onerror = (error) => {
          console.error('图片预加载失败:', error)
          this.isImageLoaded = false
        }
        img.src = imagePath
      } catch (error) {
        console.error('加载默认图片时出错:', error)
        this.isImageLoaded = false
      }
    },

    resetEditingState() {
      this.isCropping = false
      this.brightness = 0
      this.contrast = 0
    },
    
    applyBrightness() {
      // 简化的安全检查
      if (!this.canApplyFilterSync()) {
        return
      }

      this.safeApplyFilterSync('brightness', {
        brightness: parseFloat(this.brightness)
      })
    },

    applyContrast() {
      // 简化的安全检查
      if (!this.canApplyFilterSync()) {
        return
      }

      this.safeApplyFilterSync('contrast', {
        contrast: parseFloat(this.contrast)
      })
    },

    canApplyFilterSync() {
      // 检查编辑器状态
      if (!this.imageEditor || !this.isImageLoaded || !this.isEditorReady) {
        console.warn('图片编辑器未准备好或图片未加载')
        return false
      }

      // 检查鼠标状态
      if (this.isMouseDown) {
        console.warn('鼠标操作进行中，跳过滤镜应用')
        return false
      }

      // 如果在裁剪模式，先退出
      if (this.isCropping) {
        console.log('退出裁剪模式以应用滤镜')
        this.safeCancelCropSync()
        return false // 下次再试
      }

      return true
    },

    safeApplyFilterSync(filterType, options) {
      try {
        // 暂时禁用鼠标事件
        this.disableMouseEvents()

        // 应用滤镜
        setTimeout(() => {
          try {
            if (this.imageEditor && this.isImageLoaded) {
              this.imageEditor.applyFilter(filterType, options)
              console.log(`${filterType}滤镜应用成功`)
            }
          } catch (error) {
            console.error(`应用${filterType}滤镜失败:`, error)
            this.handleFilterError(error)
          } finally {
            // 重新启用鼠标事件
            setTimeout(() => {
              this.enableMouseEvents()
            }, 100)
          }
        }, 50)

      } catch (error) {
        console.error(`应用${filterType}滤镜失败:`, error)
        this.handleFilterError(error)
        this.enableMouseEvents()
      }
    },

    disableMouseEvents() {
      try {
        const canvas = this.$refs.tuiImageEditor?.querySelector('canvas')
        if (canvas) {
          canvas.style.pointerEvents = 'none'
        }
      } catch (error) {
        console.warn('禁用鼠标事件失败:', error)
      }
    },

    enableMouseEvents() {
      try {
        const canvas = this.$refs.tuiImageEditor?.querySelector('canvas')
        if (canvas) {
          canvas.style.pointerEvents = 'auto'
        }
      } catch (error) {
        console.warn('启用鼠标事件失败:', error)
      }
    },

    safeCancelCropSync() {
      if (!this.imageEditor) return

      try {
        this.imageEditor.stopDrawingMode()
        this.isCropping = false
        console.log('裁剪模式已同步取消')
      } catch (error) {
        console.error('同步取消裁剪模式失败:', error)
        this.isCropping = false
      }
    },

    handleFilterError(error) {
      console.error('滤镜错误处理:', error)

      // 尝试重置编辑器状态
      try {
        if (this.imageEditor) {
          this.imageEditor.stopDrawingMode()
        }
        this.resetEditingState()
      } catch (resetError) {
        console.error('重置编辑器状态失败:', resetError)
      }
    },
    
    rotateLeft() {
      if (this.imageEditor) {
        this.imageEditor.rotate(-90)
      }
    },
    
    rotateRight() {
      if (this.imageEditor) {
        this.imageEditor.rotate(90)
      }
    },
    
    async startCrop() {
      if (!this.imageEditor || !this.isImageLoaded || !this.isEditorReady) {
        console.warn('图片编辑器未准备好或图片未加载')
        return
      }

      if (this.isCropping) {
        console.warn('已在裁剪模式中')
        return
      }

      try {
        // 禁用鼠标事件防止冲突
        this.disableMouseEvents()

        // 确保退出其他模式
        await this.safeStopDrawingMode()

        // 等待状态稳定
        await new Promise(resolve => setTimeout(resolve, 100))

        // 启动裁剪模式
        this.imageEditor.startDrawingMode('CROPPER')
        this.isCropping = true
        console.log('裁剪模式已启动')

        // 重新启用鼠标事件
        setTimeout(() => {
          this.enableMouseEvents()
        }, 200)

      } catch (error) {
        console.error('启动裁剪模式失败:', error)
        this.isCropping = false
        this.enableMouseEvents()
      }
    },

    async applyCrop() {
      if (!this.imageEditor || !this.isImageLoaded || !this.isCropping) {
        console.warn('无法应用裁剪：编辑器未准备好或未在裁剪模式')
        return
      }

      try {
        // 禁用鼠标事件
        this.disableMouseEvents()

        const cropRect = this.imageEditor.getCropzoneRect()
        if (cropRect && cropRect.width > 0 && cropRect.height > 0) {
          // 应用裁剪
          await new Promise((resolve, reject) => {
            try {
              this.imageEditor.crop(cropRect)
              setTimeout(resolve, 100) // 给裁剪操作一些时间
            } catch (error) {
              reject(error)
            }
          })

          this.isCropping = false
          console.log('裁剪已应用')
        } else {
          console.warn('无效的裁剪区域')
        }
      } catch (error) {
        console.error('应用裁剪失败:', error)
        await this.safeCancelCrop()
      } finally {
        this.enableMouseEvents()
      }
    },

    async cancelCrop() {
      await this.safeCancelCrop()
    },

    async safeCancelCrop() {
      if (!this.imageEditor) return

      try {
        // 禁用鼠标事件
        this.disableMouseEvents()

        // 安全地停止绘制模式
        await this.safeStopDrawingMode()

        this.isCropping = false
        console.log('裁剪模式已取消')

      } catch (error) {
        console.error('取消裁剪模式失败:', error)
        this.isCropping = false
      } finally {
        // 重新启用鼠标事件
        setTimeout(() => {
          this.enableMouseEvents()
        }, 100)
      }
    },

    async safeStopDrawingMode() {
      if (!this.imageEditor) return

      try {
        // 多次尝试停止绘制模式
        for (let i = 0; i < 3; i++) {
          try {
            this.imageEditor.stopDrawingMode()
            await new Promise(resolve => setTimeout(resolve, 50))
            break
          } catch (error) {
            if (i === 2) throw error
            console.warn(`停止绘制模式尝试 ${i + 1} 失败，重试...`)
          }
        }
      } catch (error) {
        console.error('停止绘制模式失败:', error)
      }
    },
    
    async loadImage(event) {
      const file = event.target.files[0]
      if (file && this.imageEditor) {
        // 先取消任何正在进行的操作
        await this.safeCancelCrop()

        const reader = new FileReader()
        reader.onload = (e) => {
          this.imageEditor.loadImageFromURL(e.target.result, 'UserImage')
            .then(() => {
              this.isImageLoaded = true
              this.isEditorReady = true
              this.resetEditingState()
              console.log('用户图片加载成功')
            })
            .catch((error) => {
              console.error('用户图片加载失败:', error)
              this.isImageLoaded = false
              this.isEditorReady = false
            })
        }
        reader.readAsDataURL(file)
      }
    },
    
    downloadImage() {
      if (this.imageEditor) {
        const dataURL = this.imageEditor.toDataURL()
        const link = document.createElement('a')
        link.download = 'edited-image.png'
        link.href = dataURL
        link.click()
      }
    },
    
    async resetImage() {
      if (this.imageEditor) {
        // 先取消任何正在进行的操作
        await this.safeCancelCrop()
        this.loadDefaultImage()
      }
    },

    resetControls() {
      this.brightness = 0
      this.contrast = 0
    }
  }
}
</script>

<style scoped>
.tui-editor-view {
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

.editor-wrapper {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  overflow: hidden;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.status-indicator {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.status-text {
  color: #1976d2;
  font-size: 0.9rem;
  font-weight: 500;
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
