<template>
  <div 
    class="image-preview" 
    :class="previewClasses"
    ref="container"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
    @dblclick="handleDoubleClick"
  >
    <!-- 主预览区域 -->
    <div class="preview-area">
      <!-- 图像容器 -->
      <div 
        class="image-container"
        :style="containerStyle"
        ref="imageContainer"
      >
        <!-- 原始图像 -->
        <img 
          v-if="imageSrc && !loading" 
          :src="imageSrc" 
          class="preview-image"
          :class="{ 'dragging': isDragging }"
          :style="imageStyle"
          @load="handleImageLoad"
          @error="handleImageError"
          ref="image"
          alt="预览图像"
        />
        
        <!-- 对比图像（用于前后对比模式） -->
        <img 
          v-if="compareMode && compareSrc && !loading" 
          :src="compareSrc" 
          class="compare-image"
          :style="compareImageStyle"
          ref="compareImage"
          alt="对比图像"
        />
        
        <!-- 对比模式分隔线 -->
        <div 
          v-if="compareMode && !loading" 
          class="compare-divider"
          :style="{ left: `${comparePosition * 100}%` }"
          @mousedown="handleDividerMouseDown"
          @touchstart="handleDividerTouchStart"
        >
          <div class="divider-handle"></div>
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
      
      <!-- 缩放控制 -->
      <div v-if="showControls" class="zoom-controls">
        <button 
          class="zoom-button zoom-out"
          @click="zoomOut"
          :disabled="scale <= minScale"
          title="缩小"
        >
          <i class="icon-zoom-out"></i>
        </button>
        
        <div class="zoom-level">{{ Math.round(scale * 100) }}%</div>
        
        <button 
          class="zoom-button zoom-in"
          @click="zoomIn"
          :disabled="scale >= maxScale"
          title="放大"
        >
          <i class="icon-zoom-in"></i>
        </button>
        
        <button 
          class="zoom-button zoom-fit"
          @click="zoomToFit"
          title="适合窗口"
        >
          <i class="icon-zoom-fit"></i>
        </button>
        
        <button 
          class="zoom-button zoom-actual"
          @click="zoomToActual"
          title="实际大小"
        >
          <i class="icon-zoom-actual"></i>
        </button>
      </div>
      
      <!-- 全屏按钮 -->
      <button 
        v-if="showFullscreenButton" 
        class="fullscreen-button"
        @click="toggleFullscreen"
        :title="isFullscreen ? '退出全屏' : '全屏预览'"
      >
        <i :class="isFullscreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'"></i>
      </button>
      
      <!-- 对比模式按钮 -->
      <button 
        v-if="showCompareButton && compareSrc" 
        class="compare-button"
        @click="toggleCompareMode"
        :title="compareMode ? '退出对比模式' : '前后对比'"
        :class="{ 'active': compareMode }"
      >
        <i class="icon-compare"></i>
      </button>
    </div>
    
    <!-- 缩略图导航 -->
    <div v-if="showThumbnail && !loading" class="thumbnail-navigator">
      <div class="thumbnail-container">
        <img 
          :src="imageSrc" 
          class="thumbnail-image" 
          alt="缩略图"
        />
        <div 
          class="viewport-indicator"
          :style="viewportIndicatorStyle"
          @mousedown="handleIndicatorMouseDown"
          @touchstart="handleIndicatorTouchStart"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImagePreview',
  props: {
    // 图像源
    imageSrc: {
      type: String,
      default: ''
    },
    compareSrc: {
      type: String,
      default: ''
    },
    
    // 显示选项
    showControls: {
      type: Boolean,
      default: true
    },
    showThumbnail: {
      type: Boolean,
      default: true
    },
    showFullscreenButton: {
      type: Boolean,
      default: true
    },
    showCompareButton: {
      type: Boolean,
      default: true
    },
    
    // 缩放选项
    initialScale: {
      type: Number,
      default: 1
    },
    minScale: {
      type: Number,
      default: 0.1
    },
    maxScale: {
      type: Number,
      default: 5
    },
    scaleStep: {
      type: Number,
      default: 0.1
    },
    
    // 状态
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
      validator: value => ['default', 'minimal', 'dark'].includes(value)
    }
  },
  
  data() {
    return {
      // 图像状态
      imageWidth: 0,
      imageHeight: 0,
      imageLoaded: false,
      
      // 缩放和平移状态
      scale: this.initialScale,
      translateX: 0,
      translateY: 0,
      
      // 拖拽状态
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      lastTranslateX: 0,
      lastTranslateY: 0,
      
      // 全屏状态
      isFullscreen: false,
      
      // 对比模式状态
      compareMode: false,
      comparePosition: 0.5, // 0-1之间的值，表示分隔线位置
      isDraggingDivider: false,
      
      // 缩略图导航状态
      isDraggingIndicator: false,
      
      // 触摸状态
      lastTouchDistance: 0,
      
      // 容器尺寸
      containerWidth: 0,
      containerHeight: 0
    };
  },
  
  computed: {
    previewClasses() {
      return {
        [`variant-${this.variant}`]: true,
        'fullscreen': this.isFullscreen,
        'compare-mode': this.compareMode,
        'has-thumbnail': this.showThumbnail,
        'has-error': this.hasError,
        'is-loading': this.loading
      };
    },
    
    // 图像容器样式
    containerStyle() {
      return {
        transform: `translate(${this.translateX}px, ${this.translateY}px)`
      };
    },
    
    // 图像样式
    imageStyle() {
      return {
        width: `${this.imageWidth * this.scale}px`,
        height: `${this.imageHeight * this.scale}px`,
        clipPath: this.compareMode ? `inset(0 ${100 - this.comparePosition * 100}% 0 0)` : 'none'
      };
    },
    
    // 对比图像样式
    compareImageStyle() {
      return {
        width: `${this.imageWidth * this.scale}px`,
        height: `${this.imageHeight * this.scale}px`,
        clipPath: `inset(0 0 0 ${this.comparePosition * 100}%)`
      };
    },
    
    // 缩略图视口指示器样式
    viewportIndicatorStyle() {
      if (!this.imageLoaded || !this.containerWidth || !this.containerHeight) {
        return {};
      }
      
      // 计算缩略图中的视口位置和大小
      const thumbnailWidth = this.$el.querySelector('.thumbnail-container').offsetWidth;
      const thumbnailHeight = this.$el.querySelector('.thumbnail-container').offsetHeight;
      
      // 计算图像在容器中的实际尺寸
      const scaledWidth = this.imageWidth * this.scale;
      const scaledHeight = this.imageHeight * this.scale;
      
      // 计算视口在图像中的比例
      const viewportWidthRatio = Math.min(this.containerWidth / scaledWidth, 1);
      const viewportHeightRatio = Math.min(this.containerHeight / scaledHeight, 1);
      
      // 计算视口在缩略图中的位置
      const translateXRatio = -this.translateX / scaledWidth;
      const translateYRatio = -this.translateY / scaledHeight;
      
      // 计算视口在缩略图中的尺寸
      const indicatorWidth = thumbnailWidth * viewportWidthRatio;
      const indicatorHeight = thumbnailHeight * viewportHeightRatio;
      
      // 计算视口在缩略图中的位置
      const indicatorLeft = thumbnailWidth * translateXRatio;
      const indicatorTop = thumbnailHeight * translateYRatio;
      
      return {
        width: `${indicatorWidth}px`,
        height: `${indicatorHeight}px`,
        left: `${indicatorLeft}px`,
        top: `${indicatorTop}px`
      };
    }
  },
  
  watch: {
    imageSrc() {
      this.resetView();
    },
    
    initialScale(newValue) {
      this.scale = newValue;
    }
  },
  
  mounted() {
    this.updateContainerSize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleWindowResize);
    
    // 监听全屏变化
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);
    
    // 监听全局鼠标和触摸事件
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
  },
  
  beforeDestroy() {
    // 移除事件监听器
    window.removeEventListener('resize', this.handleWindowResize);

    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);

    // 退出全屏
    if (this.isFullscreen) {
      this.exitFullscreen();
    }
  },

  methods: {
    /**
     * 更新容器尺寸
     */
    updateContainerSize() {
      if (this.$refs.container) {
        const rect = this.$refs.container.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;
      }
    },

    /**
     * 重置视图
     */
    resetView() {
      this.scale = this.initialScale;
      this.translateX = 0;
      this.translateY = 0;
      this.imageLoaded = false;
      this.compareMode = false;
      this.comparePosition = 0.5;
    },

    /**
     * 处理图像加载完成
     */
    handleImageLoad() {
      if (this.$refs.image) {
        this.imageWidth = this.$refs.image.naturalWidth;
        this.imageHeight = this.$refs.image.naturalHeight;
        this.imageLoaded = true;

        // 如果初始缩放为1，则适合窗口
        if (this.initialScale === 1) {
          this.zoomToFit();
        }

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
      this.$emit('image-error');
    },

    /**
     * 放大
     */
    zoomIn() {
      const newScale = Math.min(this.scale + this.scaleStep, this.maxScale);
      this.setScale(newScale);
    },

    /**
     * 缩小
     */
    zoomOut() {
      const newScale = Math.max(this.scale - this.scaleStep, this.minScale);
      this.setScale(newScale);
    },

    /**
     * 适合窗口
     */
    zoomToFit() {
      if (!this.imageLoaded) return;

      const containerAspect = this.containerWidth / this.containerHeight;
      const imageAspect = this.imageWidth / this.imageHeight;

      let newScale;
      if (imageAspect > containerAspect) {
        // 图像更宽，以宽度为准
        newScale = this.containerWidth / this.imageWidth;
      } else {
        // 图像更高，以高度为准
        newScale = this.containerHeight / this.imageHeight;
      }

      newScale = Math.min(Math.max(newScale, this.minScale), this.maxScale);
      this.setScale(newScale);

      // 居中显示
      this.centerImage();
    },

    /**
     * 实际大小
     */
    zoomToActual() {
      this.setScale(1);
      this.centerImage();
    },

    /**
     * 设置缩放
     */
    setScale(newScale, centerX = null, centerY = null) {
      const oldScale = this.scale;
      this.scale = Math.min(Math.max(newScale, this.minScale), this.maxScale);

      // 如果指定了缩放中心点，调整平移以保持中心点不变
      if (centerX !== null && centerY !== null) {
        const scaleRatio = this.scale / oldScale;
        this.translateX = centerX - (centerX - this.translateX) * scaleRatio;
        this.translateY = centerY - (centerY - this.translateY) * scaleRatio;
      }

      // 限制平移范围
      this.constrainTranslation();

      this.$emit('scale-change', this.scale);
    },

    /**
     * 居中图像
     */
    centerImage() {
      if (!this.imageLoaded) return;

      const scaledWidth = this.imageWidth * this.scale;
      const scaledHeight = this.imageHeight * this.scale;

      this.translateX = (this.containerWidth - scaledWidth) / 2;
      this.translateY = (this.containerHeight - scaledHeight) / 2;

      this.constrainTranslation();
    },

    /**
     * 限制平移范围
     */
    constrainTranslation() {
      if (!this.imageLoaded) return;

      const scaledWidth = this.imageWidth * this.scale;
      const scaledHeight = this.imageHeight * this.scale;

      // 计算最大和最小平移值
      const maxTranslateX = Math.max(0, (this.containerWidth - scaledWidth) / 2);
      const minTranslateX = Math.min(0, this.containerWidth - scaledWidth - maxTranslateX);

      const maxTranslateY = Math.max(0, (this.containerHeight - scaledHeight) / 2);
      const minTranslateY = Math.min(0, this.containerHeight - scaledHeight - maxTranslateY);

      // 限制平移范围
      this.translateX = Math.min(Math.max(this.translateX, minTranslateX), maxTranslateX);
      this.translateY = Math.min(Math.max(this.translateY, minTranslateY), maxTranslateY);
    },

    /**
     * 处理鼠标滚轮事件
     */
    handleWheel(event) {
      event.preventDefault();

      const delta = event.deltaY > 0 ? -this.scaleStep : this.scaleStep;
      const newScale = Math.min(Math.max(this.scale + delta, this.minScale), this.maxScale);

      // 以鼠标位置为中心缩放
      const rect = this.$refs.container.getBoundingClientRect();
      const centerX = event.clientX - rect.left;
      const centerY = event.clientY - rect.top;

      this.setScale(newScale, centerX, centerY);
    },

    /**
     * 处理鼠标按下事件
     */
    handleMouseDown(event) {
      if (event.button !== 0) return; // 只处理左键

      this.isDragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.lastTranslateX = this.translateX;
      this.lastTranslateY = this.translateY;

      event.preventDefault();
    },

    /**
     * 处理鼠标移动事件
     */
    handleMouseMove(event) {
      if (this.isDragging) {
        const deltaX = event.clientX - this.dragStartX;
        const deltaY = event.clientY - this.dragStartY;

        this.translateX = this.lastTranslateX + deltaX;
        this.translateY = this.lastTranslateY + deltaY;

        this.constrainTranslation();

        event.preventDefault();
      } else if (this.isDraggingDivider) {
        this.handleDividerMove(event.clientX);
        event.preventDefault();
      } else if (this.isDraggingIndicator) {
        this.handleIndicatorMove(event.clientX, event.clientY);
        event.preventDefault();
      }
    },

    /**
     * 处理鼠标松开事件
     */
    handleMouseUp() {
      this.isDragging = false;
      this.isDraggingDivider = false;
      this.isDraggingIndicator = false;
    },

    /**
     * 处理触摸开始事件
     */
    handleTouchStart(event) {
      if (event.touches.length === 1) {
        // 单指拖拽
        const touch = event.touches[0];
        this.isDragging = true;
        this.dragStartX = touch.clientX;
        this.dragStartY = touch.clientY;
        this.lastTranslateX = this.translateX;
        this.lastTranslateY = this.translateY;
      } else if (event.touches.length === 2) {
        // 双指缩放
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        this.lastTouchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
      }

      event.preventDefault();
    },

    /**
     * 处理触摸移动事件
     */
    handleTouchMove(event) {
      if (event.touches.length === 1 && this.isDragging) {
        // 单指拖拽
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.dragStartX;
        const deltaY = touch.clientY - this.dragStartY;

        this.translateX = this.lastTranslateX + deltaX;
        this.translateY = this.lastTranslateY + deltaY;

        this.constrainTranslation();
      } else if (event.touches.length === 2) {
        // 双指缩放
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        if (this.lastTouchDistance > 0) {
          const scaleRatio = currentDistance / this.lastTouchDistance;
          const newScale = this.scale * scaleRatio;

          // 计算缩放中心点
          const centerX = (touch1.clientX + touch2.clientX) / 2;
          const centerY = (touch1.clientY + touch2.clientY) / 2;
          const rect = this.$refs.container.getBoundingClientRect();

          this.setScale(newScale, centerX - rect.left, centerY - rect.top);
        }

        this.lastTouchDistance = currentDistance;
      }

      event.preventDefault();
    },

    /**
     * 处理触摸结束事件
     */
    handleTouchEnd() {
      this.isDragging = false;
      this.lastTouchDistance = 0;
    },

    /**
     * 处理双击事件
     */
    handleDoubleClick(event) {
      // 双击切换适合窗口和实际大小
      if (Math.abs(this.scale - 1) < 0.1) {
        this.zoomToFit();
      } else {
        this.zoomToActual();
      }

      event.preventDefault();
    },

    /**
     * 切换全屏模式
     */
    toggleFullscreen() {
      if (this.isFullscreen) {
        this.exitFullscreen();
      } else {
        this.enterFullscreen();
      }
    },

    /**
     * 进入全屏
     */
    enterFullscreen() {
      const element = this.$refs.container;

      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    },

    /**
     * 退出全屏
     */
    exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    },

    /**
     * 处理全屏状态变化
     */
    handleFullscreenChange() {
      this.isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      // 全屏状态变化后更新容器尺寸
      this.$nextTick(() => {
        this.updateContainerSize();
        if (this.imageLoaded) {
          this.zoomToFit();
        }
      });

      this.$emit('fullscreen-change', this.isFullscreen);
    },

    /**
     * 切换对比模式
     */
    toggleCompareMode() {
      this.compareMode = !this.compareMode;
      this.$emit('compare-mode-change', this.compareMode);
    },

    /**
     * 处理分隔线鼠标按下事件
     */
    handleDividerMouseDown(event) {
      this.isDraggingDivider = true;
      event.stopPropagation();
      event.preventDefault();
    },

    /**
     * 处理分隔线触摸开始事件
     */
    handleDividerTouchStart(event) {
      this.isDraggingDivider = true;
      event.stopPropagation();
      event.preventDefault();
    },

    /**
     * 处理分隔线移动
     */
    handleDividerMove(clientX) {
      const rect = this.$refs.container.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      this.comparePosition = Math.min(Math.max(relativeX / rect.width, 0), 1);

      this.$emit('compare-position-change', this.comparePosition);
    },

    /**
     * 处理缩略图指示器鼠标按下事件
     */
    handleIndicatorMouseDown(event) {
      this.isDraggingIndicator = true;
      event.stopPropagation();
      event.preventDefault();
    },

    /**
     * 处理缩略图指示器触摸开始事件
     */
    handleIndicatorTouchStart(event) {
      this.isDraggingIndicator = true;
      event.stopPropagation();
      event.preventDefault();
    },

    /**
     * 处理缩略图指示器移动
     */
    handleIndicatorMove(clientX, clientY) {
      const thumbnailContainer = this.$el.querySelector('.thumbnail-container');
      if (!thumbnailContainer) return;

      const rect = thumbnailContainer.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      // 计算在图像中的位置比例
      const xRatio = relativeX / rect.width;
      const yRatio = relativeY / rect.height;

      // 计算新的平移值
      const scaledWidth = this.imageWidth * this.scale;
      const scaledHeight = this.imageHeight * this.scale;

      this.translateX = -scaledWidth * xRatio + this.containerWidth / 2;
      this.translateY = -scaledHeight * yRatio + this.containerHeight / 2;

      this.constrainTranslation();
    },

    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
      this.updateContainerSize();

      // 如果图像已加载，重新适合窗口
      if (this.imageLoaded && this.scale < 1) {
        this.zoomToFit();
      }
    }
  }
};
</script>

<style scoped>
.image-preview {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--preview-bg-color, #f5f5f5);
  overflow: hidden;
  user-select: none;
}

/* 变体样式 */
.image-preview.variant-default {
  --preview-bg-color: #f5f5f5;
  --preview-border-color: #ddd;
  --preview-control-bg: rgba(255, 255, 255, 0.9);
  --preview-control-color: #333;
  --preview-control-hover: #007bff;
}

.image-preview.variant-minimal {
  --preview-bg-color: transparent;
  --preview-border-color: transparent;
  --preview-control-bg: rgba(0, 0, 0, 0.7);
  --preview-control-color: #fff;
  --preview-control-hover: #40a9ff;
}

.image-preview.variant-dark {
  --preview-bg-color: #1e1e1e;
  --preview-border-color: #444;
  --preview-control-bg: rgba(0, 0, 0, 0.8);
  --preview-control-color: #fff;
  --preview-control-hover: #40a9ff;
}

/* 预览区域 */
.preview-area {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 图像容器 */
.image-container {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: grab;
  transition: transform 0.1s ease-out;
}

.image-container:active {
  cursor: grabbing;
}

/* 图像样式 */
.preview-image,
.compare-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: none;
  max-height: none;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.preview-image.dragging {
  transition: none;
}

.compare-image {
  z-index: 2;
}

/* 对比模式分隔线 */
.compare-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #007bff;
  cursor: ew-resize;
  z-index: 10;
  transform: translateX(-50%);
}

.divider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 40px;
  background-color: #007bff;
  border-radius: 10px;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.divider-handle::before {
  content: '⋮';
  color: white;
  font-size: 16px;
  font-weight: bold;
}

/* 加载指示器 */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--preview-control-color);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #007bff;
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

/* 缩放控制 */
.zoom-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background-color: var(--preview-control-bg);
  border-radius: 20px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.zoom-button {
  background: none;
  border: none;
  color: var(--preview-control-color);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin: 0 2px;
}

.zoom-button:hover:not(:disabled) {
  color: var(--preview-control-hover);
  background-color: rgba(0, 123, 255, 0.1);
}

.zoom-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-level {
  margin: 0 8px;
  font-size: 12px;
  color: var(--preview-control-color);
  min-width: 40px;
  text-align: center;
}

/* 全屏按钮 */
.fullscreen-button {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: var(--preview-control-bg);
  border: none;
  color: var(--preview-control-color);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 100;
  transition: all 0.2s;
}

.fullscreen-button:hover {
  color: var(--preview-control-hover);
  background-color: rgba(0, 123, 255, 0.1);
}

/* 对比模式按钮 */
.compare-button {
  position: absolute;
  top: 20px;
  right: 60px;
  background-color: var(--preview-control-bg);
  border: none;
  color: var(--preview-control-color);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 100;
  transition: all 0.2s;
}

.compare-button:hover,
.compare-button.active {
  color: var(--preview-control-hover);
  background-color: rgba(0, 123, 255, 0.1);
}

/* 缩略图导航 */
.thumbnail-navigator {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 120px;
  height: 80px;
  background-color: var(--preview-control-bg);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 100;
  overflow: hidden;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.viewport-indicator {
  position: absolute;
  border: 2px solid #007bff;
  background-color: rgba(0, 123, 255, 0.2);
  cursor: move;
  min-width: 4px;
  min-height: 4px;
}

/* 全屏模式样式 */
.image-preview.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background-color: #000;
}

.image-preview.fullscreen .zoom-controls {
  bottom: 40px;
}

.image-preview.fullscreen .thumbnail-navigator {
  bottom: 40px;
  right: 40px;
}

/* 对比模式样式 */
.image-preview.compare-mode .preview-image {
  z-index: 1;
}

/* 图标样式 */
.icon-zoom-in::before { content: '+'; font-size: 16px; font-weight: bold; }
.icon-zoom-out::before { content: '−'; font-size: 16px; font-weight: bold; }
.icon-zoom-fit::before { content: '⊞'; font-size: 14px; }
.icon-zoom-actual::before { content: '1:1'; font-size: 10px; }
.icon-fullscreen::before { content: '⛶'; font-size: 14px; }
.icon-fullscreen-exit::before { content: '⛷'; font-size: 14px; }
.icon-compare::before { content: '⚏'; font-size: 14px; }

/* 响应式样式 */
@media (max-width: 768px) {
  .zoom-controls {
    bottom: 10px;
    padding: 6px 8px;
  }

  .zoom-button {
    padding: 4px;
  }

  .zoom-level {
    font-size: 11px;
    min-width: 35px;
  }

  .fullscreen-button,
  .compare-button {
    top: 10px;
    padding: 6px;
  }

  .compare-button {
    right: 50px;
  }

  .thumbnail-navigator {
    width: 100px;
    height: 60px;
    bottom: 10px;
    right: 10px;
  }
}

/* 触摸设备优化 */
@media (hover: none) {
  .zoom-button:hover,
  .fullscreen-button:hover,
  .compare-button:hover {
    background-color: transparent;
  }

  .zoom-button:active,
  .fullscreen-button:active,
  .compare-button:active {
    background-color: rgba(0, 123, 255, 0.2);
  }
}
</style>
