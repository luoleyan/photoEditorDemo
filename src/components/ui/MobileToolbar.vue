<template>
  <div class="mobile-toolbar-container" v-if="isMobile">
    <!-- 主工具栏 -->
    <div class="mobile-toolbar" :class="{ landscape: isLandscape }">
      <div
        class="toolbar-item"
        @click="$emit('load-image')"
        :class="{ active: activeTab === 'load' }"
      >
        <div class="toolbar-icon">📁</div>
        <div class="toolbar-label">加载</div>
      </div>

      <div
        class="toolbar-item"
        @click="toggleAdjustments"
        :class="{ active: activeTab === 'adjust' }"
      >
        <div class="toolbar-icon">🎨</div>
        <div class="toolbar-label">调整</div>
      </div>

      <div
        class="toolbar-item"
        @click="toggleFilters"
        :class="{ active: activeTab === 'filter' }"
      >
        <div class="toolbar-icon">✨</div>
        <div class="toolbar-label">滤镜</div>
      </div>

      <div
        class="toolbar-item"
        @click="toggleTransform"
        :class="{ active: activeTab === 'transform' }"
      >
        <div class="toolbar-icon">🔄</div>
        <div class="toolbar-label">变换</div>
      </div>

      <div
        class="toolbar-item"
        @click="$emit('export-image')"
        :class="{ active: activeTab === 'export' }"
      >
        <div class="toolbar-icon">💾</div>
        <div class="toolbar-label">导出</div>
      </div>
    </div>

    <!-- 调整面板 -->
    <div class="mobile-panel" v-show="activeTab === 'adjust'">
      <div class="panel-header">
        <h3>图像调整</h3>
        <button class="close-btn" @click="closePanel">×</button>
      </div>
      <div class="panel-content">
        <div class="adjustment-item">
          <label>亮度</label>
          <input
            type="range"
            class="mobile-slider"
            :value="brightness"
            @input="updateBrightness"
            min="-100"
            max="100"
            step="1"
          />
          <span class="value-display">{{ brightness }}</span>
        </div>

        <div class="adjustment-item">
          <label>对比度</label>
          <input
            type="range"
            class="mobile-slider"
            :value="contrast"
            @input="updateContrast"
            min="-100"
            max="100"
            step="1"
          />
          <span class="value-display">{{ contrast }}</span>
        </div>

        <div class="adjustment-actions">
          <button class="mobile-button secondary" @click="resetAdjustments">
            重置
          </button>
          <button class="mobile-button primary" @click="applyAdjustments">
            应用
          </button>
        </div>
      </div>
    </div>

    <!-- 滤镜面板 -->
    <div class="mobile-panel" v-show="activeTab === 'filter'">
      <div class="panel-header">
        <h3>滤镜效果</h3>
        <button class="close-btn" @click="closePanel">×</button>
      </div>
      <div class="panel-content">
        <div class="filter-grid">
          <div
            class="filter-item"
            v-for="filter in availableFilters"
            :key="filter.type"
            @click="applyFilter(filter.type)"
            :class="{ active: appliedFilters.includes(filter.type) }"
          >
            <div class="filter-preview">{{ filter.icon }}</div>
            <div class="filter-name">{{ filter.name }}</div>
          </div>
        </div>

        <div class="filter-actions">
          <button class="mobile-button secondary" @click="clearFilters">
            清除全部
          </button>
        </div>
      </div>
    </div>

    <!-- 变换面板 -->
    <div class="mobile-panel" v-show="activeTab === 'transform'">
      <div class="panel-header">
        <h3>图像变换</h3>
        <button class="close-btn" @click="closePanel">×</button>
      </div>
      <div class="panel-content">
        <div class="transform-grid">
          <button class="transform-btn" @click="rotate(-90)">
            <div class="transform-icon">↺</div>
            <div class="transform-label">左转90°</div>
          </button>

          <button class="transform-btn" @click="rotate(90)">
            <div class="transform-icon">↻</div>
            <div class="transform-label">右转90°</div>
          </button>

          <button class="transform-btn" @click="flip(true, false)">
            <div class="transform-icon">⟷</div>
            <div class="transform-label">水平翻转</div>
          </button>

          <button class="transform-btn" @click="flip(false, true)">
            <div class="transform-icon">⟷</div>
            <div class="transform-label">垂直翻转</div>
          </button>
        </div>

        <div class="transform-actions">
          <button class="mobile-button secondary" @click="resetTransform">
            重置变换
          </button>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div
      class="mobile-overlay"
      v-show="activeTab && activeTab !== 'load' && activeTab !== 'export'"
      @click="closePanel"
    ></div>
  </div>
</template>

<script>
import { mobileAdapter } from "@/utils/MobileAdapter.js";

export default {
  name: "MobileToolbar",
  props: {
    hasImage: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isMobile: false,
      isLandscape: false,
      activeTab: null,
      brightness: 0,
      contrast: 0,
      appliedFilters: [],
      availableFilters: [
        { type: "grayscale", name: "黑白", icon: "⚫" },
        { type: "sepia", name: "复古", icon: "🟤" },
        { type: "invert", name: "反色", icon: "🔄" },
        { type: "blur", name: "模糊", icon: "💫" },
        { type: "sharpen", name: "锐化", icon: "🔪" },
        { type: "emboss", name: "浮雕", icon: "🗿" },
      ],

      // 触摸手势支持
      touchStartX: 0,
      touchStartY: 0,
      touchStartTime: 0,
      isGesturing: false,
      gestureStartDistance: 0,
      gestureStartRotation: 0,

      // 性能优化
      isProcessing: false,
      processingQueue: [],

      // 移动端特定设置
      mobileSettings: {
        enableHapticFeedback: true,
        enableGestures: true,
        autoHideToolbar: false,
        compactMode: false,
      },
    };
  },
  mounted() {
    this.updateDeviceInfo();
    this.setupEventListeners();
  },
  beforeDestroy() {
    this.removeEventListeners();
  },
  methods: {
    /**
     * 更新设备信息
     */
    updateDeviceInfo() {
      const deviceInfo = mobileAdapter.getDeviceInfo();
      this.isMobile = deviceInfo.isMobile;
      this.isLandscape = deviceInfo.orientation === "landscape";
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
      window.addEventListener(
        "mobile-orientation-change",
        this.handleOrientationChange
      );
      window.addEventListener("mobile-resize", this.handleResize);
    },

    /**
     * 移除事件监听器
     */
    removeEventListeners() {
      window.removeEventListener(
        "mobile-orientation-change",
        this.handleOrientationChange
      );
      window.removeEventListener("mobile-resize", this.handleResize);
    },

    /**
     * 处理方向变化
     */
    handleOrientationChange(event) {
      this.isLandscape = event.detail.orientation === "landscape";
      // 方向变化时关闭面板
      this.closePanel();
    },

    /**
     * 处理窗口大小变化
     */
    handleResize(event) {
      this.updateDeviceInfo();
    },

    /**
     * 切换调整面板
     */
    toggleAdjustments() {
      this.activeTab = this.activeTab === "adjust" ? null : "adjust";
    },

    /**
     * 切换滤镜面板
     */
    toggleFilters() {
      this.activeTab = this.activeTab === "filter" ? null : "filter";
    },

    /**
     * 切换变换面板
     */
    toggleTransform() {
      this.activeTab = this.activeTab === "transform" ? null : "transform";
    },

    /**
     * 关闭面板
     */
    closePanel() {
      this.activeTab = null;
    },

    /**
     * 更新亮度
     */
    updateBrightness(event) {
      this.brightness = parseInt(event.target.value);
    },

    /**
     * 更新对比度
     */
    updateContrast(event) {
      this.contrast = parseInt(event.target.value);
    },

    /**
     * 重置调整
     */
    resetAdjustments() {
      this.brightness = 0;
      this.contrast = 0;
      this.$emit("reset-adjustments");
    },

    /**
     * 应用调整
     */
    applyAdjustments() {
      this.$emit("apply-adjustments", {
        brightness: this.brightness / 100,
        contrast: this.contrast / 100,
      });
    },

    /**
     * 应用滤镜
     */
    applyFilter(filterType) {
      if (this.appliedFilters.includes(filterType)) {
        this.appliedFilters = this.appliedFilters.filter(
          (f) => f !== filterType
        );
        this.$emit("remove-filter", filterType);
      } else {
        this.appliedFilters.push(filterType);
        this.$emit("apply-filter", filterType);
      }
    },

    /**
     * 清除所有滤镜
     */
    clearFilters() {
      this.appliedFilters = [];
      this.$emit("clear-filters");
    },

    /**
     * 旋转图像
     */
    rotate(angle) {
      this.$emit("rotate", angle);
    },

    /**
     * 翻转图像
     */
    flip(horizontal, vertical) {
      this.$emit("flip", { horizontal, vertical });
    },

    /**
     * 重置变换
     */
    resetTransform() {
      this.$emit("reset-transform");
    },

    // ========== 触摸手势支持 ==========

    /**
     * 处理触摸开始
     * @param {TouchEvent} event - 触摸事件
     */
    handleTouchStart(event) {
      if (!this.mobileSettings.enableGestures) return;

      const touch = event.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = Date.now();

      if (event.touches.length === 2) {
        // 双指手势
        const touch2 = event.touches[1];
        this.gestureStartDistance = this._getDistance(touch, touch2);
        this.gestureStartRotation = this._getAngle(touch, touch2);
        this.isGesturing = true;
      }

      // 触觉反馈
      if (this.mobileSettings.enableHapticFeedback && navigator.vibrate) {
        navigator.vibrate(10);
      }
    },

    /**
     * 处理触摸移动
     * @param {TouchEvent} event - 触摸事件
     */
    handleTouchMove(event) {
      if (!this.mobileSettings.enableGestures) return;

      event.preventDefault();

      if (event.touches.length === 2 && this.isGesturing) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        // 缩放手势
        const currentDistance = this._getDistance(touch1, touch2);
        const scaleChange = currentDistance / this.gestureStartDistance;

        // 旋转手势
        const currentRotation = this._getAngle(touch1, touch2);
        const rotationChange = currentRotation - this.gestureStartRotation;

        this.$emit("gesture-transform", {
          scale: scaleChange,
          rotation: rotationChange,
        });
      }
    },

    /**
     * 处理触摸结束
     * @param {TouchEvent} event - 触摸事件
     */
    handleTouchEnd(event) {
      if (!this.mobileSettings.enableGestures) return;

      const touchDuration = Date.now() - this.touchStartTime;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 检测手势类型
      if (touchDuration < 300 && distance < 10) {
        // 点击
        this._handleTap(touch);
      } else if (touchDuration < 500 && distance > 50) {
        // 滑动
        this._handleSwipe(deltaX, deltaY);
      }

      this.isGesturing = false;
    },

    /**
     * 处理点击
     * @param {Touch} touch - 触摸点
     * @private
     */
    _handleTap(touch) {
      // 双击检测可以在这里实现
      this.$emit("tap", {
        x: touch.clientX,
        y: touch.clientY,
      });
    },

    /**
     * 处理滑动
     * @param {number} deltaX - X轴偏移
     * @param {number} deltaY - Y轴偏移
     * @private
     */
    _handleSwipe(deltaX, deltaY) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        // 水平滑动
        if (deltaX > 0) {
          this.$emit("swipe-right");
        } else {
          this.$emit("swipe-left");
        }
      } else {
        // 垂直滑动
        if (deltaY > 0) {
          this.$emit("swipe-down");
        } else {
          this.$emit("swipe-up");
        }
      }
    },

    /**
     * 计算两点距离
     * @param {Touch} touch1 - 触摸点1
     * @param {Touch} touch2 - 触摸点2
     * @returns {number} 距离
     * @private
     */
    _getDistance(touch1, touch2) {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * 计算两点角度
     * @param {Touch} touch1 - 触摸点1
     * @param {Touch} touch2 - 触摸点2
     * @returns {number} 角度（弧度）
     * @private
     */
    _getAngle(touch1, touch2) {
      return Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );
    },

    // ========== 性能优化方法 ==========

    /**
     * 防抖处理
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 延迟时间
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    },

    /**
     * 节流处理
     * @param {Function} func - 要节流的函数
     * @param {number} limit - 限制时间
     * @returns {Function} 节流后的函数
     */
    throttle(func, limit) {
      let inThrottle;
      return (...args) => {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },

    /**
     * 队列处理操作
     * @param {Function} operation - 操作函数
     * @param {Object} params - 参数
     */
    async queueOperation(operation, params) {
      if (this.isProcessing) {
        this.processingQueue.push({ operation, params });
        return;
      }

      this.isProcessing = true;

      try {
        await operation(params);
      } catch (error) {
        console.error("Operation failed:", error);
        this.$emit("error", error);
      } finally {
        this.isProcessing = false;

        // 处理队列中的下一个操作
        if (this.processingQueue.length > 0) {
          const next = this.processingQueue.shift();
          this.queueOperation(next.operation, next.params);
        }
      }
    },

    /**
     * 优化图像处理
     * @param {string} operation - 操作类型
     * @param {Object} params - 参数
     */
    async optimizedImageProcess(operation, params) {
      // 使用Web Worker进行图像处理
      if (window.Worker) {
        try {
          const worker = new Worker("/workers/image-processor.js");

          return new Promise((resolve, reject) => {
            worker.onmessage = (event) => {
              const { success, data, error } = event.data;
              if (success) {
                resolve(data);
              } else {
                reject(new Error(error));
              }
              worker.terminate();
            };

            worker.onerror = (error) => {
              reject(error);
              worker.terminate();
            };

            worker.postMessage({
              type: operation,
              ...params,
            });
          });
        } catch (error) {
          console.warn("Web Worker not available, falling back to main thread");
          return this._fallbackImageProcess(operation, params);
        }
      } else {
        return this._fallbackImageProcess(operation, params);
      }
    },

    /**
     * 回退图像处理
     * @param {string} operation - 操作类型
     * @param {Object} params - 参数
     * @private
     */
    _fallbackImageProcess(operation, params) {
      // 在主线程中处理，使用requestAnimationFrame分帧
      return new Promise((resolve) => {
        const process = () => {
          // 这里实现具体的图像处理逻辑
          this.$emit("image-process", { operation, params });
          resolve();
        };

        requestAnimationFrame(process);
      });
    },
  },
};
</script>

<style scoped>
@import "@/styles/mobile.css";

.mobile-toolbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.mobile-toolbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #e0e0e0;
  padding: 8px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  min-height: 60px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}

.mobile-toolbar.landscape {
  position: relative;
  bottom: auto;
  padding: 6px;
  min-height: 48px;
}

.toolbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  min-width: 60px;
  cursor: pointer;
}

.toolbar-item:active {
  background-color: rgba(0, 0, 0, 0.1);
  transform: scale(0.95);
}

.toolbar-item.active {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.toolbar-icon {
  font-size: 20px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-label {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.toolbar-item.active .toolbar-label {
  color: #007aff;
}

.mobile-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 60vh;
  overflow-y: auto;
  z-index: 1001;
  transform: translateY(0);
  transition: transform 0.3s ease;
  padding-bottom: env(safe-area-inset-bottom);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 16px 16px 0 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.panel-content {
  padding: 20px;
}

.adjustment-item {
  margin-bottom: 20px;
}

.adjustment-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.value-display {
  display: inline-block;
  margin-left: 12px;
  font-weight: 600;
  color: #007aff;
  min-width: 40px;
}

.adjustment-actions,
.filter-actions,
.transform-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-item:active {
  transform: scale(0.95);
}

.filter-item.active {
  border-color: #007aff;
  background-color: rgba(0, 122, 255, 0.1);
}

.filter-preview {
  font-size: 24px;
  margin-bottom: 8px;
}

.filter-name {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.filter-item.active .filter-name {
  color: #007aff;
}

.transform-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.transform-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.transform-btn:active {
  transform: scale(0.95);
  background-color: rgba(0, 122, 255, 0.1);
}

.transform-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.transform-label {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-panel {
    max-height: 80vh;
  }

  .panel-content {
    padding: 16px;
  }

  .filter-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .transform-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
