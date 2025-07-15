<template>
  <div class="crop-tool" :class="cropClasses">
    <!-- 工具栏 -->
    <div class="crop-toolbar" v-if="showToolbar">
      <div class="toolbar-section">
        <h3 class="toolbar-title">{{ title }}</h3>
      </div>
      
      <div class="toolbar-section">
        <!-- 裁剪比例选择 -->
        <div class="aspect-ratio-selector">
          <label>比例:</label>
          <select 
            v-model="selectedAspectRatio"
            @change="handleAspectRatioChange"
            :disabled="disabled"
          >
            <option value="free">自由</option>
            <option 
              v-for="ratio in aspectRatios" 
              :key="ratio.value"
              :value="ratio.value"
            >
              {{ ratio.name }}
            </option>
          </select>
        </div>
        
        <!-- 网格线控制 -->
        <div class="grid-controls">
          <label>
            <input 
              type="checkbox" 
              v-model="showGrid"
              :disabled="disabled"
            />
            网格线
          </label>
          
          <label>
            <input 
              type="checkbox" 
              v-model="showGuides"
              :disabled="disabled"
            />
            参考线
          </label>
        </div>
      </div>
      
      <div class="toolbar-section">
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button 
            class="reset-button"
            @click="handleReset"
            :disabled="disabled"
          >
            <i class="icon-reset"></i>
            <span>重置</span>
          </button>
          
          <button 
            class="apply-button"
            @click="handleApply"
            :disabled="disabled || !hasCropArea"
          >
            <i class="icon-crop"></i>
            <span>应用</span>
          </button>
          
          <button 
            class="cancel-button"
            @click="handleCancel"
            :disabled="disabled"
          >
            <i class="icon-close"></i>
            <span>取消</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 裁剪区域 -->
    <div 
      class="crop-container"
      ref="cropContainer"
      @mousedown="handleContainerMouseDown"
      @touchstart="handleContainerTouchStart"
    >
      <!-- 图像 -->
      <img 
        v-if="imageSrc"
        :src="imageSrc"
        class="crop-image"
        ref="cropImage"
        @load="handleImageLoad"
        @error="handleImageError"
        alt="裁剪图像"
      />
      
      <!-- 裁剪框 -->
      <div 
        v-if="cropArea && imageLoaded"
        class="crop-box"
        :style="cropBoxStyle"
        @mousedown="handleCropBoxMouseDown"
        @touchstart="handleCropBoxTouchStart"
      >
        <!-- 裁剪框边框 -->
        <div class="crop-border"></div>
        
        <!-- 网格线 -->
        <div v-if="showGrid" class="crop-grid">
          <div class="grid-line grid-line-v" style="left: 33.33%"></div>
          <div class="grid-line grid-line-v" style="left: 66.67%"></div>
          <div class="grid-line grid-line-h" style="top: 33.33%"></div>
          <div class="grid-line grid-line-h" style="top: 66.67%"></div>
        </div>
        
        <!-- 参考线 -->
        <div v-if="showGuides" class="crop-guides">
          <div class="guide-line guide-line-v" style="left: 50%"></div>
          <div class="guide-line guide-line-h" style="top: 50%"></div>
        </div>
        
        <!-- 调整手柄 -->
        <div class="resize-handles">
          <!-- 角落手柄 -->
          <div 
            class="resize-handle corner-handle nw-handle"
            @mousedown="handleResizeStart('nw', $event)"
            @touchstart="handleResizeStart('nw', $event)"
          ></div>
          <div 
            class="resize-handle corner-handle ne-handle"
            @mousedown="handleResizeStart('ne', $event)"
            @touchstart="handleResizeStart('ne', $event)"
          ></div>
          <div 
            class="resize-handle corner-handle sw-handle"
            @mousedown="handleResizeStart('sw', $event)"
            @touchstart="handleResizeStart('sw', $event)"
          ></div>
          <div 
            class="resize-handle corner-handle se-handle"
            @mousedown="handleResizeStart('se', $event)"
            @touchstart="handleResizeStart('se', $event)"
          ></div>
          
          <!-- 边缘手柄 -->
          <div 
            class="resize-handle edge-handle n-handle"
            @mousedown="handleResizeStart('n', $event)"
            @touchstart="handleResizeStart('n', $event)"
          ></div>
          <div 
            class="resize-handle edge-handle s-handle"
            @mousedown="handleResizeStart('s', $event)"
            @touchstart="handleResizeStart('s', $event)"
          ></div>
          <div 
            class="resize-handle edge-handle w-handle"
            @mousedown="handleResizeStart('w', $event)"
            @touchstart="handleResizeStart('w', $event)"
          ></div>
          <div 
            class="resize-handle edge-handle e-handle"
            @mousedown="handleResizeStart('e', $event)"
            @touchstart="handleResizeStart('e', $event)"
          ></div>
        </div>
        
        <!-- 裁剪信息显示 -->
        <div v-if="showInfo" class="crop-info">
          {{ Math.round(cropArea.width) }} × {{ Math.round(cropArea.height) }}
        </div>
      </div>
      
      <!-- 遮罩层 -->
      <div v-if="cropArea && imageLoaded" class="crop-overlay">
        <!-- 上遮罩 -->
        <div 
          class="overlay-section overlay-top"
          :style="{ height: cropArea.y + 'px' }"
        ></div>
        
        <!-- 下遮罩 -->
        <div 
          class="overlay-section overlay-bottom"
          :style="{ 
            top: (cropArea.y + cropArea.height) + 'px',
            height: (containerHeight - cropArea.y - cropArea.height) + 'px'
          }"
        ></div>
        
        <!-- 左遮罩 -->
        <div 
          class="overlay-section overlay-left"
          :style="{ 
            top: cropArea.y + 'px',
            height: cropArea.height + 'px',
            width: cropArea.x + 'px'
          }"
        ></div>
        
        <!-- 右遮罩 -->
        <div 
          class="overlay-section overlay-right"
          :style="{ 
            top: cropArea.y + 'px',
            left: (cropArea.x + cropArea.width) + 'px',
            height: cropArea.height + 'px',
            width: (containerWidth - cropArea.x - cropArea.width) + 'px'
          }"
        ></div>
      </div>
      
      <!-- 加载指示器 -->
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
        <div class="loading-text">{{ loadingText }}</div>
      </div>
      
      <!-- 错误指示器 -->
      <div v-if="hasError" class="error-indicator">
        <div class="error-icon">!</div>
        <div class="error-text">{{ errorText }}</div>
      </div>
    </div>
    
    <!-- 裁剪预设面板 -->
    <div v-if="showPresets && presets.length > 0" class="crop-presets">
      <h4 class="presets-title">预设尺寸</h4>
      <div class="presets-grid">
        <button 
          v-for="preset in presets" 
          :key="preset.id"
          class="preset-button"
          :class="{ 'active': activePreset === preset.id }"
          @click="applyPreset(preset)"
          :disabled="disabled"
        >
          <div class="preset-name">{{ preset.name }}</div>
          <div class="preset-size">{{ preset.width }} × {{ preset.height }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CropTool',
  props: {
    // 工具标题
    title: {
      type: String,
      default: '裁剪工具'
    },
    
    // 图像源
    imageSrc: {
      type: String,
      default: ''
    },
    
    // 初始裁剪区域
    initialCropArea: {
      type: Object,
      default: null
    },
    
    // 显示选项
    showToolbar: {
      type: Boolean,
      default: true
    },
    showGrid: {
      type: Boolean,
      default: true
    },
    showGuides: {
      type: Boolean,
      default: false
    },
    showInfo: {
      type: Boolean,
      default: true
    },
    showPresets: {
      type: Boolean,
      default: true
    },
    
    // 预设
    presets: {
      type: Array,
      default: () => [
        { id: 'square', name: '正方形', width: 300, height: 300, aspectRatio: 1 },
        { id: '4-3', name: '4:3', width: 400, height: 300, aspectRatio: 4/3 },
        { id: '16-9', name: '16:9', width: 400, height: 225, aspectRatio: 16/9 },
        { id: '3-2', name: '3:2', width: 300, height: 200, aspectRatio: 3/2 }
      ]
    },
    
    // 状态
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    loadingText: {
      type: String,
      default: '加载中...'
    },
    hasError: {
      type: Boolean,
      default: false
    },
    errorText: {
      type: String,
      default: '图像加载失败'
    },
    
    // 样式
    variant: {
      type: String,
      default: 'default',
      validator: value => ['default', 'minimal', 'compact'].includes(value)
    }
  },
  
  data() {
    return {
      // 图像状态
      imageLoaded: false,
      imageWidth: 0,
      imageHeight: 0,
      
      // 容器尺寸
      containerWidth: 0,
      containerHeight: 0,
      
      // 裁剪区域
      cropArea: null,
      
      // 交互状态
      isDragging: false,
      isResizing: false,
      resizeDirection: '',
      dragStartX: 0,
      dragStartY: 0,
      dragStartCropArea: null,
      
      // 比例设置
      selectedAspectRatio: 'free',
      aspectRatios: [
        { name: '1:1', value: '1:1' },
        { name: '4:3', value: '4:3' },
        { name: '3:2', value: '3:2' },
        { name: '16:9', value: '16:9' },
        { name: '2:1', value: '2:1' }
      ],
      
      // 活动预设
      activePreset: null
    };
  },
  
  computed: {
    cropClasses() {
      return {
        [`variant-${this.variant}`]: true,
        'disabled': this.disabled,
        'loading': this.loading,
        'has-error': this.hasError
      };
    },
    
    // 裁剪框样式
    cropBoxStyle() {
      if (!this.cropArea) return {};
      
      return {
        left: this.cropArea.x + 'px',
        top: this.cropArea.y + 'px',
        width: this.cropArea.width + 'px',
        height: this.cropArea.height + 'px'
      };
    },
    
    // 是否有裁剪区域
    hasCropArea() {
      return this.cropArea && this.cropArea.width > 0 && this.cropArea.height > 0;
    },
    
    // 当前宽高比
    currentAspectRatio() {
      if (this.selectedAspectRatio === 'free') return null;
      
      const [w, h] = this.selectedAspectRatio.split(':').map(Number);
      return w / h;
    }
  },
  
  watch: {
    imageSrc() {
      this.resetCrop();
    },
    
    initialCropArea: {
      immediate: true,
      handler(newArea) {
        if (newArea && this.imageLoaded) {
          this.cropArea = { ...newArea };
        }
      }
    }
  },
  
  mounted() {
    this.updateContainerSize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleWindowResize);
    
    // 监听全局鼠标和触摸事件
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
  },
  
  beforeDestroy() {
    // 移除事件监听器
    window.removeEventListener('resize', this.handleWindowResize);

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
  },

  methods: {
    /**
     * 更新容器尺寸
     */
    updateContainerSize() {
      if (this.$refs.cropContainer) {
        const rect = this.$refs.cropContainer.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;
      }
    },

    /**
     * 处理图像加载完成
     */
    handleImageLoad() {
      if (this.$refs.cropImage) {
        this.imageWidth = this.$refs.cropImage.naturalWidth;
        this.imageHeight = this.$refs.cropImage.naturalHeight;
        this.imageLoaded = true;

        // 初始化裁剪区域
        this.initializeCropArea();

        this.$emit('image-loaded', {
          width: this.imageWidth,
          height: this.imageHeight
        });
      }
    },

    /**
     * 处理图像加载错误
     */
    handleImageError() {
      this.imageLoaded = false;
      this.$emit('image-error');
    },

    /**
     * 初始化裁剪区域
     */
    initializeCropArea() {
      if (this.initialCropArea) {
        this.cropArea = { ...this.initialCropArea };
      } else {
        // 默认裁剪区域为图像中心的80%
        const displayRect = this.$refs.cropImage.getBoundingClientRect();
        const containerRect = this.$refs.cropContainer.getBoundingClientRect();

        const imageDisplayWidth = displayRect.width;
        const imageDisplayHeight = displayRect.height;

        const cropWidth = imageDisplayWidth * 0.8;
        const cropHeight = imageDisplayHeight * 0.8;

        this.cropArea = {
          x: (containerRect.width - cropWidth) / 2,
          y: (containerRect.height - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight
        };
      }

      this.emitCropChange();
    },

    /**
     * 重置裁剪
     */
    resetCrop() {
      this.cropArea = null;
      this.imageLoaded = false;
      this.selectedAspectRatio = 'free';
      this.activePreset = null;
    },

    /**
     * 处理宽高比变化
     */
    handleAspectRatioChange() {
      if (!this.cropArea || !this.currentAspectRatio) return;

      // 根据当前宽度调整高度
      const newHeight = this.cropArea.width / this.currentAspectRatio;

      // 确保不超出容器边界
      if (this.cropArea.y + newHeight > this.containerHeight) {
        const maxHeight = this.containerHeight - this.cropArea.y;
        this.cropArea.height = maxHeight;
        this.cropArea.width = maxHeight * this.currentAspectRatio;
      } else {
        this.cropArea.height = newHeight;
      }

      this.constrainCropArea();
      this.emitCropChange();
    },

    /**
     * 处理容器鼠标按下
     */
    handleContainerMouseDown(event) {
      if (this.disabled || !this.imageLoaded) return;

      const rect = this.$refs.cropContainer.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 开始创建新的裁剪区域
      this.cropArea = {
        x: x,
        y: y,
        width: 0,
        height: 0
      };

      this.isDragging = true;
      this.dragStartX = x;
      this.dragStartY = y;

      event.preventDefault();
    },

    /**
     * 处理容器触摸开始
     */
    handleContainerTouchStart(event) {
      if (this.disabled || !this.imageLoaded) return;

      const touch = event.touches[0];
      const rect = this.$refs.cropContainer.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      this.cropArea = {
        x: x,
        y: y,
        width: 0,
        height: 0
      };

      this.isDragging = true;
      this.dragStartX = x;
      this.dragStartY = y;

      event.preventDefault();
    },

    /**
     * 处理裁剪框鼠标按下
     */
    handleCropBoxMouseDown(event) {
      if (this.disabled) return;

      this.isDragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.dragStartCropArea = { ...this.cropArea };

      event.stopPropagation();
      event.preventDefault();
    },

    /**
     * 处理裁剪框触摸开始
     */
    handleCropBoxTouchStart(event) {
      if (this.disabled) return;

      const touch = event.touches[0];
      this.isDragging = true;
      this.dragStartX = touch.clientX;
      this.dragStartY = touch.clientY;
      this.dragStartCropArea = { ...this.cropArea };

      event.stopPropagation();
      event.preventDefault();
    },

    /**
     * 处理调整大小开始
     */
    handleResizeStart(direction, event) {
      if (this.disabled) return;

      this.isResizing = true;
      this.resizeDirection = direction;

      const clientX = event.clientX || (event.touches && event.touches[0].clientX);
      const clientY = event.clientY || (event.touches && event.touches[0].clientY);

      this.dragStartX = clientX;
      this.dragStartY = clientY;
      this.dragStartCropArea = { ...this.cropArea };

      event.stopPropagation();
      event.preventDefault();
    },

    /**
     * 处理鼠标移动
     */
    handleMouseMove(event) {
      if (this.disabled) return;

      if (this.isDragging && !this.isResizing) {
        this.handleDrag(event.clientX, event.clientY);
      } else if (this.isResizing) {
        this.handleResize(event.clientX, event.clientY);
      }
    },

    /**
     * 处理触摸移动
     */
    handleTouchMove(event) {
      if (this.disabled) return;

      const touch = event.touches[0];

      if (this.isDragging && !this.isResizing) {
        this.handleDrag(touch.clientX, touch.clientY);
      } else if (this.isResizing) {
        this.handleResize(touch.clientX, touch.clientY);
      }

      event.preventDefault();
    },

    /**
     * 处理拖拽
     */
    handleDrag(clientX, clientY) {
      if (!this.cropArea) return;

      if (this.dragStartCropArea) {
        // 移动裁剪框
        const deltaX = clientX - this.dragStartX;
        const deltaY = clientY - this.dragStartY;

        this.cropArea.x = this.dragStartCropArea.x + deltaX;
        this.cropArea.y = this.dragStartCropArea.y + deltaY;
      } else {
        // 创建新裁剪框
        const rect = this.$refs.cropContainer.getBoundingClientRect();
        const currentX = clientX - rect.left;
        const currentY = clientY - rect.top;

        const width = Math.abs(currentX - this.dragStartX);
        const height = Math.abs(currentY - this.dragStartY);

        this.cropArea.x = Math.min(this.dragStartX, currentX);
        this.cropArea.y = Math.min(this.dragStartY, currentY);
        this.cropArea.width = width;
        this.cropArea.height = height;

        // 应用宽高比约束
        if (this.currentAspectRatio) {
          const aspectHeight = width / this.currentAspectRatio;
          if (aspectHeight <= height) {
            this.cropArea.height = aspectHeight;
          } else {
            this.cropArea.width = height * this.currentAspectRatio;
          }
        }
      }

      this.constrainCropArea();
      this.emitCropChange();
    },

    /**
     * 处理调整大小
     */
    handleResize(clientX, clientY) {
      if (!this.cropArea || !this.dragStartCropArea) return;

      const deltaX = clientX - this.dragStartX;
      const deltaY = clientY - this.dragStartY;

      let newArea = { ...this.dragStartCropArea };

      // 根据调整方向更新裁剪区域
      switch (this.resizeDirection) {
        case 'nw':
          newArea.x += deltaX;
          newArea.y += deltaY;
          newArea.width -= deltaX;
          newArea.height -= deltaY;
          break;
        case 'ne':
          newArea.y += deltaY;
          newArea.width += deltaX;
          newArea.height -= deltaY;
          break;
        case 'sw':
          newArea.x += deltaX;
          newArea.width -= deltaX;
          newArea.height += deltaY;
          break;
        case 'se':
          newArea.width += deltaX;
          newArea.height += deltaY;
          break;
        case 'n':
          newArea.y += deltaY;
          newArea.height -= deltaY;
          break;
        case 's':
          newArea.height += deltaY;
          break;
        case 'w':
          newArea.x += deltaX;
          newArea.width -= deltaX;
          break;
        case 'e':
          newArea.width += deltaX;
          break;
      }

      // 应用宽高比约束
      if (this.currentAspectRatio) {
        this.applyAspectRatioConstraint(newArea, this.resizeDirection);
      }

      // 确保最小尺寸
      if (newArea.width < 20) newArea.width = 20;
      if (newArea.height < 20) newArea.height = 20;

      this.cropArea = newArea;
      this.constrainCropArea();
      this.emitCropChange();
    },

    /**
     * 应用宽高比约束
     */
    applyAspectRatioConstraint(area, direction) {
      const aspectRatio = this.currentAspectRatio;

      if (direction.includes('w') || direction.includes('e')) {
        // 水平调整，根据宽度调整高度
        area.height = area.width / aspectRatio;
      } else if (direction.includes('n') || direction.includes('s')) {
        // 垂直调整，根据高度调整宽度
        area.width = area.height * aspectRatio;
      } else {
        // 角落调整，保持比例
        const currentRatio = area.width / area.height;
        if (currentRatio > aspectRatio) {
          area.width = area.height * aspectRatio;
        } else {
          area.height = area.width / aspectRatio;
        }
      }
    },

    /**
     * 约束裁剪区域在容器内
     */
    constrainCropArea() {
      if (!this.cropArea) return;

      // 确保不超出容器边界
      if (this.cropArea.x < 0) {
        this.cropArea.width += this.cropArea.x;
        this.cropArea.x = 0;
      }

      if (this.cropArea.y < 0) {
        this.cropArea.height += this.cropArea.y;
        this.cropArea.y = 0;
      }

      if (this.cropArea.x + this.cropArea.width > this.containerWidth) {
        this.cropArea.width = this.containerWidth - this.cropArea.x;
      }

      if (this.cropArea.y + this.cropArea.height > this.containerHeight) {
        this.cropArea.height = this.containerHeight - this.cropArea.y;
      }

      // 确保最小尺寸
      if (this.cropArea.width < 20) this.cropArea.width = 20;
      if (this.cropArea.height < 20) this.cropArea.height = 20;
    },

    /**
     * 处理鼠标松开
     */
    handleMouseUp() {
      this.isDragging = false;
      this.isResizing = false;
      this.resizeDirection = '';
      this.dragStartCropArea = null;
    },

    /**
     * 处理触摸结束
     */
    handleTouchEnd() {
      this.isDragging = false;
      this.isResizing = false;
      this.resizeDirection = '';
      this.dragStartCropArea = null;
    },

    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
      this.updateContainerSize();
    },

    /**
     * 处理重置
     */
    handleReset() {
      if (this.disabled) return;

      this.initializeCropArea();
      this.selectedAspectRatio = 'free';
      this.activePreset = null;

      this.$emit('reset');
    },

    /**
     * 处理应用
     */
    handleApply() {
      if (this.disabled || !this.hasCropArea) return;

      // 计算相对于原始图像的裁剪区域
      const imageRect = this.$refs.cropImage.getBoundingClientRect();
      const containerRect = this.$refs.cropContainer.getBoundingClientRect();

      const scaleX = this.imageWidth / imageRect.width;
      const scaleY = this.imageHeight / imageRect.height;

      const imageOffsetX = imageRect.left - containerRect.left;
      const imageOffsetY = imageRect.top - containerRect.top;

      const cropData = {
        x: (this.cropArea.x - imageOffsetX) * scaleX,
        y: (this.cropArea.y - imageOffsetY) * scaleY,
        width: this.cropArea.width * scaleX,
        height: this.cropArea.height * scaleY,
        originalWidth: this.imageWidth,
        originalHeight: this.imageHeight
      };

      this.$emit('apply', cropData);
    },

    /**
     * 处理取消
     */
    handleCancel() {
      if (this.disabled) return;

      this.$emit('cancel');
    },

    /**
     * 应用预设
     */
    applyPreset(preset) {
      if (this.disabled) return;

      this.activePreset = preset.id;

      // 设置宽高比
      if (preset.aspectRatio) {
        this.selectedAspectRatio = `${preset.width}:${preset.height}`;
      }

      // 计算预设尺寸在当前显示中的大小
      const imageRect = this.$refs.cropImage.getBoundingClientRect();
      const containerRect = this.$refs.cropContainer.getBoundingClientRect();

      const scaleX = imageRect.width / this.imageWidth;
      const scaleY = imageRect.height / this.imageHeight;

      const displayWidth = preset.width * scaleX;
      const displayHeight = preset.height * scaleY;

      // 居中放置
      const imageOffsetX = imageRect.left - containerRect.left;
      const imageOffsetY = imageRect.top - containerRect.top;

      this.cropArea = {
        x: imageOffsetX + (imageRect.width - displayWidth) / 2,
        y: imageOffsetY + (imageRect.height - displayHeight) / 2,
        width: displayWidth,
        height: displayHeight
      };

      this.constrainCropArea();
      this.emitCropChange();

      this.$emit('preset-applied', preset);
    },

    /**
     * 发出裁剪变化事件
     */
    emitCropChange() {
      if (!this.cropArea) return;

      this.$emit('crop-change', {
        x: this.cropArea.x,
        y: this.cropArea.y,
        width: this.cropArea.width,
        height: this.cropArea.height
      });
    }
  }
};
</script>

<style scoped>
.crop-tool {
  width: 100%;
  height: 100%;
  background-color: var(--crop-bg-color, #f5f5f5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 变体样式 */
.crop-tool.variant-default {
  --crop-bg-color: #f5f5f5;
  --crop-border-color: #ddd;
  --crop-toolbar-bg: #fff;
  --crop-text-color: #333;
  --crop-button-bg: #1890ff;
  --crop-button-hover: #40a9ff;
  --crop-overlay-color: rgba(0, 0, 0, 0.5);
  --crop-box-border: #1890ff;
  --crop-handle-bg: #1890ff;
  --crop-grid-color: rgba(255, 255, 255, 0.5);
}

.crop-tool.variant-minimal {
  --crop-bg-color: transparent;
  --crop-border-color: #ddd;
  --crop-toolbar-bg: rgba(255, 255, 255, 0.9);
  --crop-text-color: #333;
  --crop-button-bg: #1890ff;
  --crop-button-hover: #40a9ff;
  --crop-overlay-color: rgba(0, 0, 0, 0.3);
  --crop-box-border: #1890ff;
  --crop-handle-bg: #1890ff;
  --crop-grid-color: rgba(255, 255, 255, 0.7);
}

.crop-tool.variant-compact {
  --crop-bg-color: #f0f0f0;
  --crop-border-color: #ccc;
  --crop-toolbar-bg: #f8f8f8;
  --crop-text-color: #333;
  --crop-button-bg: #1890ff;
  --crop-button-hover: #40a9ff;
  --crop-overlay-color: rgba(0, 0, 0, 0.4);
  --crop-box-border: #1890ff;
  --crop-handle-bg: #1890ff;
  --crop-grid-color: rgba(255, 255, 255, 0.6);
}

/* 工具栏 */
.crop-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--crop-toolbar-bg);
  border-bottom: 1px solid var(--crop-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--crop-text-color);
}

/* 比例选择器 */
.aspect-ratio-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.aspect-ratio-selector label {
  font-size: 14px;
  color: var(--crop-text-color);
}

.aspect-ratio-selector select {
  padding: 4px 8px;
  border: 1px solid var(--crop-border-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--crop-text-color);
  background-color: white;
}

/* 网格控制 */
.grid-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grid-controls label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--crop-text-color);
  cursor: pointer;
}

.grid-controls input[type="checkbox"] {
  margin: 0;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.reset-button,
.apply-button,
.cancel-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.reset-button {
  background-color: #f5f5f5;
  color: var(--crop-text-color);
  border: 1px solid var(--crop-border-color);
}

.reset-button:hover {
  background-color: #e8e8e8;
}

.apply-button {
  background-color: var(--crop-button-bg);
  color: white;
}

.apply-button:hover:not(:disabled) {
  background-color: var(--crop-button-hover);
}

.cancel-button {
  background-color: #ff4d4f;
  color: white;
}

.cancel-button:hover {
  background-color: #ff7875;
}

.reset-button:disabled,
.apply-button:disabled,
.cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 裁剪容器 */
.crop-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: crosshair;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crop-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}

/* 裁剪框 */
.crop-box {
  position: absolute;
  border: 2px solid var(--crop-box-border);
  cursor: move;
  user-select: none;
}

.crop-border {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid var(--crop-box-border);
  pointer-events: none;
}

/* 网格线 */
.crop-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background-color: var(--crop-grid-color);
}

.grid-line-v {
  width: 1px;
  height: 100%;
}

.grid-line-h {
  width: 100%;
  height: 1px;
}

/* 参考线 */
.crop-guides {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.guide-line {
  position: absolute;
  background-color: var(--crop-grid-color);
}

.guide-line-v {
  width: 1px;
  height: 100%;
}

.guide-line-h {
  width: 100%;
  height: 1px;
}

/* 调整手柄 */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.resize-handle {
  position: absolute;
  background-color: var(--crop-handle-bg);
  border: 2px solid white;
  border-radius: 50%;
  width: 12px;
  height: 12px;
  transform: translate(-50%, -50%);
}

/* 角落手柄 */
.nw-handle {
  top: 0;
  left: 0;
  cursor: nw-resize;
}

.ne-handle {
  top: 0;
  right: 0;
  cursor: ne-resize;
}

.sw-handle {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
}

.se-handle {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}

/* 边缘手柄 */
.n-handle {
  top: 0;
  left: 50%;
  cursor: n-resize;
}

.s-handle {
  bottom: 0;
  left: 50%;
  cursor: s-resize;
}

.w-handle {
  top: 50%;
  left: 0;
  cursor: w-resize;
}

.e-handle {
  top: 50%;
  right: 0;
  cursor: e-resize;
}

/* 裁剪信息 */
.crop-info {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}

/* 遮罩层 */
.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.overlay-section {
  position: absolute;
  background-color: var(--crop-overlay-color);
}

.overlay-top {
  top: 0;
  left: 0;
  right: 0;
}

.overlay-bottom {
  left: 0;
  right: 0;
  bottom: 0;
}

.overlay-left {
  left: 0;
}

.overlay-right {
  right: 0;
}

/* 加载指示器 */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--crop-text-color);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid var(--crop-button-bg);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

.loading-text {
  font-size: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误指示器 */
.error-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #ff4d4f;
}

.error-icon {
  width: 60px;
  height: 60px;
  border: 3px solid #ff4d4f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin: 0 auto 12px;
}

.error-text {
  font-size: 14px;
}

/* 预设面板 */
.crop-presets {
  background-color: var(--crop-toolbar-bg);
  border-top: 1px solid var(--crop-border-color);
  padding: 16px;
  flex-shrink: 0;
}

.presets-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--crop-text-color);
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.preset-button {
  padding: 8px;
  background-color: white;
  border: 1px solid var(--crop-border-color);
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.preset-button:hover {
  border-color: var(--crop-button-bg);
}

.preset-button.active {
  border-color: var(--crop-button-bg);
  background-color: rgba(24, 144, 255, 0.1);
}

.preset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--crop-text-color);
  margin-bottom: 2px;
}

.preset-size {
  font-size: 11px;
  color: #999;
}

/* 禁用状态 */
.crop-tool.disabled {
  opacity: 0.7;
  pointer-events: none;
}

/* 加载状态 */
.crop-tool.loading .crop-container {
  cursor: wait;
}

/* 错误状态 */
.crop-tool.has-error .crop-container {
  cursor: not-allowed;
}

/* 图标样式 */
.icon-reset::before { content: '↺'; font-size: 14px; }
.icon-crop::before { content: '✂'; font-size: 14px; }
.icon-close::before { content: '✕'; font-size: 14px; }

/* 响应式样式 */
@media (max-width: 768px) {
  .crop-toolbar {
    padding: 8px 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-section {
    justify-content: center;
    flex-wrap: wrap;
  }

  .action-buttons {
    justify-content: center;
  }

  .reset-button,
  .apply-button,
  .cancel-button {
    padding: 8px 16px;
    font-size: 16px;
  }

  .resize-handle {
    width: 16px;
    height: 16px;
  }

  .crop-info {
    font-size: 14px;
    padding: 6px 10px;
  }

  .presets-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .preset-button {
    padding: 6px;
  }
}

/* 触摸设备优化 */
@media (hover: none) {
  .resize-handle {
    width: 20px;
    height: 20px;
  }

  .crop-box {
    border-width: 3px;
  }

  .crop-border {
    border-width: 3px;
  }
}
</style>
