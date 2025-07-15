<template>
  <div class="mobile-toolbar-container" v-if="isMobile">
    <!-- 主工具栏 -->
    <div class="mobile-toolbar" :class="{ 'landscape': isLandscape }">
      <div class="toolbar-item" @click="$emit('load-image')" :class="{ active: activeTab === 'load' }">
        <div class="toolbar-icon">📁</div>
        <div class="toolbar-label">加载</div>
      </div>
      
      <div class="toolbar-item" @click="toggleAdjustments" :class="{ active: activeTab === 'adjust' }">
        <div class="toolbar-icon">🎨</div>
        <div class="toolbar-label">调整</div>
      </div>
      
      <div class="toolbar-item" @click="toggleFilters" :class="{ active: activeTab === 'filter' }">
        <div class="toolbar-icon">✨</div>
        <div class="toolbar-label">滤镜</div>
      </div>
      
      <div class="toolbar-item" @click="toggleTransform" :class="{ active: activeTab === 'transform' }">
        <div class="toolbar-icon">🔄</div>
        <div class="toolbar-label">变换</div>
      </div>
      
      <div class="toolbar-item" @click="$emit('export-image')" :class="{ active: activeTab === 'export' }">
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
          >
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
          >
          <span class="value-display">{{ contrast }}</span>
        </div>
        
        <div class="adjustment-actions">
          <button class="mobile-button secondary" @click="resetAdjustments">重置</button>
          <button class="mobile-button primary" @click="applyAdjustments">应用</button>
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
          <button class="mobile-button secondary" @click="clearFilters">清除全部</button>
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
          <button class="mobile-button secondary" @click="resetTransform">重置变换</button>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div class="mobile-overlay" v-show="activeTab && activeTab !== 'load' && activeTab !== 'export'" @click="closePanel"></div>
  </div>
</template>

<script>
import { mobileAdapter } from '@/utils/MobileAdapter.js';

export default {
  name: 'MobileToolbar',
  props: {
    hasImage: {
      type: Boolean,
      default: false
    }
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
        { type: 'grayscale', name: '黑白', icon: '⚫' },
        { type: 'sepia', name: '复古', icon: '🟤' },
        { type: 'invert', name: '反色', icon: '🔄' },
        { type: 'blur', name: '模糊', icon: '💫' },
        { type: 'sharpen', name: '锐化', icon: '🔪' },
        { type: 'emboss', name: '浮雕', icon: '🗿' }
      ]
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
      this.isLandscape = deviceInfo.orientation === 'landscape';
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
      window.addEventListener('mobile-orientation-change', this.handleOrientationChange);
      window.addEventListener('mobile-resize', this.handleResize);
    },

    /**
     * 移除事件监听器
     */
    removeEventListeners() {
      window.removeEventListener('mobile-orientation-change', this.handleOrientationChange);
      window.removeEventListener('mobile-resize', this.handleResize);
    },

    /**
     * 处理方向变化
     */
    handleOrientationChange(event) {
      this.isLandscape = event.detail.orientation === 'landscape';
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
      this.activeTab = this.activeTab === 'adjust' ? null : 'adjust';
    },

    /**
     * 切换滤镜面板
     */
    toggleFilters() {
      this.activeTab = this.activeTab === 'filter' ? null : 'filter';
    },

    /**
     * 切换变换面板
     */
    toggleTransform() {
      this.activeTab = this.activeTab === 'transform' ? null : 'transform';
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
      this.$emit('reset-adjustments');
    },

    /**
     * 应用调整
     */
    applyAdjustments() {
      this.$emit('apply-adjustments', {
        brightness: this.brightness / 100,
        contrast: this.contrast / 100
      });
    },

    /**
     * 应用滤镜
     */
    applyFilter(filterType) {
      if (this.appliedFilters.includes(filterType)) {
        this.appliedFilters = this.appliedFilters.filter(f => f !== filterType);
        this.$emit('remove-filter', filterType);
      } else {
        this.appliedFilters.push(filterType);
        this.$emit('apply-filter', filterType);
      }
    },

    /**
     * 清除所有滤镜
     */
    clearFilters() {
      this.appliedFilters = [];
      this.$emit('clear-filters');
    },

    /**
     * 旋转图像
     */
    rotate(angle) {
      this.$emit('rotate', angle);
    },

    /**
     * 翻转图像
     */
    flip(horizontal, vertical) {
      this.$emit('flip', { horizontal, vertical });
    },

    /**
     * 重置变换
     */
    resetTransform() {
      this.$emit('reset-transform');
    }
  }
};
</script>

<style scoped>
@import '@/styles/mobile.css';

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
  color: #007AFF;
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
  color: #007AFF;
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
  color: #007AFF;
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
  border-color: #007AFF;
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
  color: #007AFF;
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
