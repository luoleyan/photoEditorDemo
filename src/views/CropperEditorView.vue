<template>
  <div class="cropper-editor-view">
    <div class="editor-header">
      <h1>Cropper.js 演示</h1>
      <p>专业的图片裁剪库，轻量级且功能强大，专注于裁剪功能</p>
    </div>

    <div class="editor-container">
      <div class="image-wrapper">
        <img
          ref="cropperImage"
          :src="imageSrc"
          alt="待裁剪图片"
          style="max-width: 100%"
        />
      </div>

      <div class="controls-panel">
        <h3>裁剪控制</h3>

        <div class="control-group">
          <h4>裁剪比例</h4>
          <div class="button-group">
            <button @click="setAspectRatio(16 / 9)" class="btn btn-secondary">
              16:9
            </button>
            <button @click="setAspectRatio(4 / 3)" class="btn btn-secondary">
              4:3
            </button>
            <button @click="setAspectRatio(1)" class="btn btn-secondary">
              1:1
            </button>
            <button @click="setAspectRatio(0)" class="btn btn-secondary">
              自由
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>旋转操作</h4>
          <div class="control-item">
            <label>旋转角度: {{ rotationAngle }}°</label>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              v-model="rotationAngle"
              @input="rotateImage"
            />
          </div>
          <div class="button-group">
            <button @click="rotateLeft" class="btn btn-secondary">
              向左90°
            </button>
            <button @click="rotateRight" class="btn btn-secondary">
              向右90°
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>缩放操作</h4>
          <div class="button-group">
            <button @click="zoomIn" class="btn btn-secondary">放大</button>
            <button @click="zoomOut" class="btn btn-secondary">缩小</button>
            <button @click="resetZoom" class="btn btn-secondary">
              重置缩放
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>裁剪操作</h4>
          <div class="button-group">
            <button @click="getCropData" class="btn btn-primary">
              获取裁剪数据
            </button>
            <button @click="cropImage" class="btn btn-success">裁剪图片</button>
            <button @click="resetCropper" class="btn btn-secondary">
              重置
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
            <button @click="downloadCroppedImage" class="btn btn-success">
              下载裁剪图片
            </button>
          </div>
        </div>

        <div class="control-group" v-if="cropData">
          <h4>裁剪信息</h4>
          <div class="crop-info">
            <p><strong>X:</strong> {{ Math.round(cropData.x) }}px</p>
            <p><strong>Y:</strong> {{ Math.round(cropData.y) }}px</p>
            <p><strong>宽度:</strong> {{ Math.round(cropData.width) }}px</p>
            <p><strong>高度:</strong> {{ Math.round(cropData.height) }}px</p>
            <p><strong>旋转:</strong> {{ Math.round(cropData.rotate) }}°</p>
          </div>
        </div>
      </div>
    </div>

    <div class="preview-section" v-if="croppedImageUrl">
      <h3>裁剪预览</h3>
      <div class="preview-wrapper">
        <img :src="croppedImageUrl" alt="裁剪预览" class="preview-image" />
      </div>
    </div>

    <div class="features-info">
      <h3>Cropper.js 特性</h3>
      <div class="features-grid">
        <div class="feature-item">
          <h4>✂️ 专业裁剪</h4>
          <p>专注于图片裁剪功能，提供精确的裁剪控制</p>
        </div>
        <div class="feature-item">
          <h4>📐 比例控制</h4>
          <p>支持固定比例裁剪和自由裁剪模式</p>
        </div>
        <div class="feature-item">
          <h4>🔄 旋转缩放</h4>
          <p>支持图片旋转和缩放操作</p>
        </div>
        <div class="feature-item">
          <h4>📱 触摸支持</h4>
          <p>完美支持移动设备的触摸操作</p>
        </div>
        <div class="feature-item">
          <h4>⚡ 轻量级</h4>
          <p>文件体积小，性能优秀，加载速度快</p>
        </div>
        <div class="feature-item">
          <h4>🎯 易于集成</h4>
          <p>API简洁明了，容易集成到现有项目中</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

export default {
  name: "CropperEditorView",
  data() {
    return {
      cropper: null,
      imageSrc: require("@/assets/illust_104350264_20230531_093134.png"),
      rotationAngle: 0,
      cropData: null,
      croppedImageUrl: null,
    };
  },
  mounted() {
    this.initCropper();
  },
  beforeDestroy() {
    if (this.cropper) {
      this.cropper.destroy();
    }
  },
  methods: {
    initCropper() {
      this.$nextTick(() => {
        this.cropper = new Cropper(this.$refs.cropperImage, {
          aspectRatio: 0, // 自由比例
          viewMode: 1,
          dragMode: "crop",
          autoCropArea: 0.8,
          restore: false,
          guides: true,
          center: true,
          highlight: false,
          cropBoxMovable: true,
          cropBoxResizable: true,
          toggleDragModeOnDblclick: false,

          crop: (event) => {
            this.cropData = event.detail;
          },
        });
      });
    },

    setAspectRatio(ratio) {
      if (this.cropper) {
        this.cropper.setAspectRatio(ratio);
      }
    },

    rotateImage() {
      if (this.cropper) {
        const currentRotation = this.cropper.getData().rotate || 0;
        const newRotation = parseFloat(this.rotationAngle);
        const rotationDiff = newRotation - currentRotation;
        this.cropper.rotate(rotationDiff);
      }
    },

    rotateLeft() {
      if (this.cropper) {
        this.cropper.rotate(-90);
        this.rotationAngle = (this.rotationAngle - 90) % 360;
      }
    },

    rotateRight() {
      if (this.cropper) {
        this.cropper.rotate(90);
        this.rotationAngle = (this.rotationAngle + 90) % 360;
      }
    },

    zoomIn() {
      if (this.cropper) {
        this.cropper.zoom(0.1);
      }
    },

    zoomOut() {
      if (this.cropper) {
        this.cropper.zoom(-0.1);
      }
    },

    resetZoom() {
      if (this.cropper) {
        this.cropper.reset();
        this.rotationAngle = 0;
      }
    },

    getCropData() {
      if (this.cropper) {
        this.cropData = this.cropper.getData();
        console.log("裁剪数据:", this.cropData);
      }
    },

    cropImage() {
      if (this.cropper) {
        const croppedCanvas = this.cropper.getCroppedCanvas({
          width: 400,
          height: 300,
          imageSmoothingEnabled: true,
          imageSmoothingQuality: "high",
        });

        if (croppedCanvas) {
          this.croppedImageUrl = croppedCanvas.toDataURL("image/png");
        }
      }
    },

    resetCropper() {
      if (this.cropper) {
        this.cropper.reset();
        this.rotationAngle = 0;
        this.cropData = null;
        this.croppedImageUrl = null;
      }
    },

    loadImage(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imageSrc = e.target.result;

          // 重新初始化cropper
          if (this.cropper) {
            this.cropper.destroy();
          }

          this.$nextTick(() => {
            this.initCropper();
            this.rotationAngle = 0;
            this.cropData = null;
            this.croppedImageUrl = null;
          });
        };
        reader.readAsDataURL(file);
      }
    },

    downloadCroppedImage() {
      if (this.croppedImageUrl) {
        const link = document.createElement("a");
        link.download = "cropped-image.png";
        link.href = this.croppedImageUrl;
        link.click();
      } else {
        alert("请先裁剪图片！");
      }
    },
  },
};
</script>

<style scoped>
.cropper-editor-view {
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

.image-wrapper {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
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

.crop-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.crop-info p {
  margin-bottom: 0.5rem;
  color: #5a6c7d;
}

.preview-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
  text-align: center;
}

.preview-section h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.preview-wrapper {
  display: inline-block;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  padding: 1rem;
  background: #f8f9fa;
}

.preview-image {
  max-width: 400px;
  max-height: 300px;
  border-radius: 4px;
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

  .preview-image {
    max-width: 100%;
  }
}
</style>
