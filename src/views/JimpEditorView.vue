<template>
  <div class="jimp-editor-view">
    <div class="editor-header">
      <h1>Jimp 演示</h1>
      <p>纯JavaScript图片处理库，支持Node.js和浏览器环境，无需Canvas依赖</p>
    </div>

    <div class="editor-container">
      <div class="image-display">
        <div class="original-image">
          <h4>原始图片</h4>
          <img :src="originalImageSrc" alt="原始图片" class="display-image" />
        </div>
        
        <div class="processed-image" v-if="processedImageSrc">
          <h4>处理后图片</h4>
          <img :src="processedImageSrc" alt="处理后图片" class="display-image" />
        </div>
      </div>
      
      <div class="controls-panel">
        <h3>图片处理</h3>
        
        <div class="control-group">
          <h4>基本调节</h4>
          <div class="control-item">
            <label>亮度: {{ brightness }}</label>
            <input 
              type="range" 
              min="-1" 
              max="1" 
              step="0.1" 
              v-model="brightness"
              @input="processImage"
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
              @input="processImage"
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
              step="15" 
              v-model="rotationAngle"
              @input="processImage"
            />
          </div>
          <div class="button-group">
            <button @click="rotateLeft" class="btn btn-secondary">向左90°</button>
            <button @click="rotateRight" class="btn btn-secondary">向右90°</button>
          </div>
        </div>

        <div class="control-group">
          <h4>裁剪操作</h4>
          <div class="crop-controls">
            <div class="crop-input">
              <label>X: <input type="number" v-model="cropX" min="0" /></label>
              <label>Y: <input type="number" v-model="cropY" min="0" /></label>
            </div>
            <div class="crop-input">
              <label>宽度: <input type="number" v-model="cropWidth" min="1" /></label>
              <label>高度: <input type="number" v-model="cropHeight" min="1" /></label>
            </div>
          </div>
          <button @click="applyCrop" class="btn btn-primary">应用裁剪</button>
        </div>

        <div class="control-group">
          <h4>滤镜效果</h4>
          <div class="button-group">
            <button @click="applyGrayscale" class="btn btn-secondary">灰度</button>
            <button @click="applySepia" class="btn btn-secondary">复古</button>
            <button @click="applyInvert" class="btn btn-secondary">反色</button>
            <button @click="applyBlur" class="btn btn-secondary">模糊</button>
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
            <button @click="downloadImage" class="btn btn-success" :disabled="!processedImageSrc">下载图片</button>
            <button @click="resetImage" class="btn btn-secondary">重置</button>
          </div>
        </div>

        <div class="control-group">
          <h4>处理状态</h4>
          <div class="status-info">
            <p v-if="isProcessing" class="processing">正在处理图片...</p>
            <p v-else-if="processedImageSrc" class="success">图片处理完成</p>
            <p v-else class="idle">等待处理</p>
          </div>
        </div>
      </div>
    </div>

    <div class="features-info">
      <h3>Jimp 特性</h3>
      <div class="features-grid">
        <div class="feature-item">
          <h4>🔧 纯JavaScript</h4>
          <p>无需Canvas依赖，可在Node.js和浏览器中运行</p>
        </div>
        <div class="feature-item">
          <h4>🎨 丰富滤镜</h4>
          <p>内置多种图像处理滤镜和效果</p>
        </div>
        <div class="feature-item">
          <h4>📐 精确控制</h4>
          <p>像素级图像处理，支持精确的数值控制</p>
        </div>
        <div class="feature-item">
          <h4>🔄 格式转换</h4>
          <p>支持多种图像格式的读取和输出</p>
        </div>
        <div class="feature-item">
          <h4>⚡ 高效处理</h4>
          <p>优化的算法，快速处理大型图像</p>
        </div>
        <div class="feature-item">
          <h4>🌐 跨平台</h4>
          <p>同时支持浏览器和Node.js环境</p>
        </div>
      </div>
    </div>

    <div class="usage-note">
      <h3>使用说明</h3>
      <div class="note-content">
        <p><strong>注意：</strong> Jimp主要设计用于服务端图片处理。在浏览器环境中，某些功能可能受到限制。</p>
        <p>本演示展示了Jimp的基本功能，包括亮度/对比度调节、旋转、裁剪和滤镜效果。</p>
        <p>在实际项目中，建议在Node.js环境中使用Jimp进行批量图片处理。</p>
      </div>
    </div>
  </div>
</template>

<script>
import Jimp from 'jimp'

export default {
  name: 'JimpEditorView',
  data() {
    return {
      originalImageSrc: require('@/assets/illust_104350264_20230531_093134.png'),
      processedImageSrc: null,
      brightness: 0,
      contrast: 0,
      rotationAngle: 0,
      cropX: 0,
      cropY: 0,
      cropWidth: 200,
      cropHeight: 200,
      isProcessing: false,
      currentJimpImage: null
    }
  },
  mounted() {
    this.loadDefaultImage()
  },
  methods: {
    async loadDefaultImage() {
      try {
        this.isProcessing = true

        // 使用Jimp加载默认图片
        const image = await Jimp.read(this.originalImageSrc)
        this.currentJimpImage = image
        this.processedImageSrc = await image.getBase64Async(Jimp.MIME_PNG)

        console.log('默认图片加载成功:', {
          width: image.bitmap.width,
          height: image.bitmap.height
        })

        this.isProcessing = false
      } catch (error) {
        console.error('加载默认图片失败:', error)
        this.processedImageSrc = this.originalImageSrc
        this.isProcessing = false
      }
    },
    
    async processImage() {
      if (!this.originalImageSrc) return

      try {
        this.isProcessing = true

        // 使用Jimp进行真正的图片处理
        const image = await Jimp.read(this.originalImageSrc)

        // 应用亮度调节
        if (this.brightness !== 0) {
          image.brightness(this.brightness)
        }

        // 应用对比度调节
        if (this.contrast !== 0) {
          image.contrast(this.contrast)
        }

        // 应用旋转
        if (this.rotationAngle > 0) {
          image.rotate(this.rotationAngle)
        }

        // 获取处理后的图片数据
        this.processedImageSrc = await image.getBase64Async(Jimp.MIME_PNG)
        this.currentJimpImage = image
        this.isProcessing = false

        console.log('图片处理完成:', {
          brightness: this.brightness,
          contrast: this.contrast,
          rotation: this.rotationAngle
        })

      } catch (error) {
        console.error('图片处理失败:', error)
        this.isProcessing = false
        alert('图片处理失败: ' + error.message)
      }
    },
    
    rotateLeft() {
      this.rotationAngle = (this.rotationAngle - 90) % 360
      this.processImage()
    },
    
    rotateRight() {
      this.rotationAngle = (this.rotationAngle + 90) % 360
      this.processImage()
    },
    
    async applyCrop() {
      if (!this.originalImageSrc) return

      try {
        this.isProcessing = true

        // 使用Jimp进行真正的裁剪处理
        const image = await Jimp.read(this.originalImageSrc)

        // 验证裁剪参数
        const maxWidth = image.bitmap.width
        const maxHeight = image.bitmap.height

        const cropX = Math.max(0, Math.min(this.cropX, maxWidth - 1))
        const cropY = Math.max(0, Math.min(this.cropY, maxHeight - 1))
        const cropWidth = Math.max(1, Math.min(this.cropWidth, maxWidth - cropX))
        const cropHeight = Math.max(1, Math.min(this.cropHeight, maxHeight - cropY))

        // 应用裁剪
        image.crop(cropX, cropY, cropWidth, cropHeight)

        // 获取裁剪后的图片数据
        this.processedImageSrc = await image.getBase64Async(Jimp.MIME_PNG)
        this.currentJimpImage = image
        this.isProcessing = false

        console.log('裁剪完成:', {
          x: cropX,
          y: cropY,
          width: cropWidth,
          height: cropHeight
        })

      } catch (error) {
        console.error('裁剪失败:', error)
        this.isProcessing = false
        alert('裁剪失败: ' + error.message)
      }
    },
    
    async applyGrayscale() {
      await this.applyFilter('grayscale')
    },
    
    async applySepia() {
      await this.applyFilter('sepia')
    },
    
    async applyInvert() {
      await this.applyFilter('invert')
    },
    
    async applyBlur() {
      await this.applyFilter('blur')
    },
    
    async applyFilter(filterType) {
      if (!this.originalImageSrc) return

      try {
        this.isProcessing = true

        // 使用Jimp进行真正的滤镜处理
        const image = await Jimp.read(this.originalImageSrc)

        // 应用指定的滤镜效果
        switch(filterType) {
          case 'grayscale':
            image.greyscale()
            break
          case 'sepia':
            image.sepia()
            break
          case 'invert':
            image.invert()
            break
          case 'blur':
            image.blur(2)
            break
          default:
            console.warn('未知的滤镜类型:', filterType)
            break
        }

        // 获取处理后的图片数据
        this.processedImageSrc = await image.getBase64Async(Jimp.MIME_PNG)
        this.currentJimpImage = image
        this.isProcessing = false

        console.log('滤镜应用完成:', filterType)

      } catch (error) {
        console.error('滤镜应用失败:', error)
        this.isProcessing = false
        alert('滤镜应用失败: ' + error.message)
      }
    },
    
    async loadImage(event) {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            this.isProcessing = true
            this.originalImageSrc = e.target.result

            // 使用Jimp加载新图片
            const image = await Jimp.read(e.target.result)
            this.currentJimpImage = image
            this.processedImageSrc = await image.getBase64Async(Jimp.MIME_PNG)

            this.resetControls()
            this.isProcessing = false

            console.log('用户图片加载成功:', {
              width: image.bitmap.width,
              height: image.bitmap.height
            })

          } catch (error) {
            console.error('加载用户图片失败:', error)
            this.processedImageSrc = null
            this.isProcessing = false
            alert('图片加载失败: ' + error.message)
          }
        }
        reader.readAsDataURL(file)
      }
    },
    
    downloadImage() {
      if (this.processedImageSrc) {
        const link = document.createElement('a')
        link.download = 'jimp-processed-image.png'
        link.href = this.processedImageSrc
        link.click()
      }
    },
    
    async resetImage() {
      try {
        this.isProcessing = true
        this.originalImageSrc = require('@/assets/illust_104350264_20230531_093134.png')

        // 重新加载默认图片
        const image = await Jimp.read(this.originalImageSrc)
        this.currentJimpImage = image
        this.processedImageSrc = await image.getBase64Async(Jimp.MIME_PNG)

        this.resetControls()
        this.isProcessing = false

        console.log('图片已重置为默认图片')

      } catch (error) {
        console.error('重置图片失败:', error)
        this.processedImageSrc = null
        this.isProcessing = false
      }
    },
    
    resetControls() {
      this.brightness = 0
      this.contrast = 0
      this.rotationAngle = 0
      this.cropX = 0
      this.cropY = 0
      this.cropWidth = 200
      this.cropHeight = 200
    }
  }
}
</script>

<style scoped>
.jimp-editor-view {
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

.image-display {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.original-image, .processed-image {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  text-align: center;
}

.original-image h4, .processed-image h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.display-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  border: 1px solid #e1e8ed;
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

.crop-controls {
  margin-bottom: 1rem;
}

.crop-input {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.crop-input label {
  flex: 1;
  font-size: 0.8rem;
}

.crop-input input {
  width: 100%;
  padding: 0.3rem;
  border: 1px solid #e1e8ed;
  border-radius: 4px;
  margin-top: 0.2rem;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
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

.status-info {
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}

.processing {
  background: #fff3cd;
  color: #856404;
}

.success {
  background: #d4edda;
  color: #155724;
}

.idle {
  background: #f8f9fa;
  color: #5a6c7d;
}

.features-info {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  margin-bottom: 3rem;
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

.usage-note {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 12px;
  padding: 2rem;
}

.usage-note h3 {
  color: #856404;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.note-content p {
  color: #856404;
  margin-bottom: 0.8rem;
  line-height: 1.6;
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
  
  .image-display {
    flex-direction: row;
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
  
  .image-display {
    flex-direction: column;
  }
  
  .crop-input {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
