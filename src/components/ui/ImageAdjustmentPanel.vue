<template>
  <div class="image-adjustment-panel" :class="panelClasses">
    <div class="panel-header" v-if="showHeader">
      <h3 class="panel-title">{{ title }}</h3>
      <div class="panel-actions">
        <button 
          v-if="showResetAll" 
          class="reset-all-button"
          @click="resetAll"
          :disabled="disabled"
        >
          <i class="icon-reset"></i>
          <span>重置全部</span>
        </button>
      </div>
    </div>
    
    <div class="panel-content">
      <!-- 亮度调整 -->
      <div v-if="showBrightness" class="adjustment-item">
        <slider-control
          v-model="brightnessValue"
          :min="-100"
          :max="100"
          :step="1"
          :default-value="0"
          label="亮度"
          :disabled="disabled"
          @change="handleBrightnessChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 对比度调整 -->
      <div v-if="showContrast" class="adjustment-item">
        <slider-control
          v-model="contrastValue"
          :min="-100"
          :max="100"
          :step="1"
          :default-value="0"
          label="对比度"
          :disabled="disabled"
          @change="handleContrastChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 饱和度调整 -->
      <div v-if="showSaturation" class="adjustment-item">
        <slider-control
          v-model="saturationValue"
          :min="-100"
          :max="100"
          :step="1"
          :default-value="0"
          label="饱和度"
          :disabled="disabled"
          @change="handleSaturationChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 色调调整 -->
      <div v-if="showHue" class="adjustment-item">
        <slider-control
          v-model="hueValue"
          :min="0"
          :max="360"
          :step="1"
          :default-value="0"
          label="色调"
          :disabled="disabled"
          @change="handleHueChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 曝光度调整 -->
      <div v-if="showExposure" class="adjustment-item">
        <slider-control
          v-model="exposureValue"
          :min="-100"
          :max="100"
          :step="1"
          :default-value="0"
          label="曝光度"
          :disabled="disabled"
          @change="handleExposureChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 高光调整 -->
      <div v-if="showHighlights" class="adjustment-item">
        <slider-control
          v-model="highlightsValue"
          :min="-100"
          :max="100"
          :step="1"
          :default-value="0"
          label="高光"
          :disabled="disabled"
          @change="handleHighlightsChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 阴影调整 -->
      <div v-if="showShadows" class="adjustment-item">
        <slider-control
          v-model="shadowsValue"
          :min="-100"
          :max="100"
          :step="1"
          :default-value="0"
          label="阴影"
          :disabled="disabled"
          @change="handleShadowsChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 色温调整 -->
      <div v-if="showTemperature" class="adjustment-item">
        <slider-control
          v-model="temperatureValue"
          :min="-100"
          :max="100"
          :step="1"
          :default-value="0"
          label="色温"
          :disabled="disabled"
          @change="handleTemperatureChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 色调调整 -->
      <div v-if="showTint" class="adjustment-item">
        <slider-control
          v-model="tintValue"
          :min="-100"
          :max="100"
          :step="1"
          :default-value="0"
          label="色调"
          :disabled="disabled"
          @change="handleTintChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 锐化调整 -->
      <div v-if="showSharpness" class="adjustment-item">
        <slider-control
          v-model="sharpnessValue"
          :min="0"
          :max="100"
          :step="1"
          :default-value="0"
          label="锐化"
          :disabled="disabled"
          @change="handleSharpnessChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 噪点调整 -->
      <div v-if="showNoise" class="adjustment-item">
        <slider-control
          v-model="noiseValue"
          :min="-100"
          :max="100"
          :step="1"
          :default-value="0"
          label="噪点"
          :disabled="disabled"
          @change="handleNoiseChange"
          @change-complete="handleAdjustmentComplete"
        />
      </div>
      
      <!-- 自定义调整项 -->
      <slot name="custom-adjustments"></slot>
    </div>
    
    <!-- 预设 -->
    <div v-if="showPresets && presets.length > 0" class="panel-presets">
      <h4 class="presets-title">预设</h4>
      <div class="presets-grid">
        <button 
          v-for="(preset, index) in presets" 
          :key="index"
          class="preset-button"
          :class="{ 'active': activePreset === preset.id }"
          @click="applyPreset(preset)"
          :disabled="disabled"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import SliderControl from './SliderControl.vue';

export default {
  name: 'ImageAdjustmentPanel',
  components: {
    SliderControl
  },
  
  props: {
    // 面板标题
    title: {
      type: String,
      default: '图像调整'
    },
    
    // 显示选项
    showHeader: {
      type: Boolean,
      default: true
    },
    showResetAll: {
      type: Boolean,
      default: true
    },
    
    // 调整项显示控制
    showBrightness: {
      type: Boolean,
      default: true
    },
    showContrast: {
      type: Boolean,
      default: true
    },
    showSaturation: {
      type: Boolean,
      default: true
    },
    showHue: {
      type: Boolean,
      default: true
    },
    showExposure: {
      type: Boolean,
      default: false
    },
    showHighlights: {
      type: Boolean,
      default: false
    },
    showShadows: {
      type: Boolean,
      default: false
    },
    showTemperature: {
      type: Boolean,
      default: false
    },
    showTint: {
      type: Boolean,
      default: false
    },
    showSharpness: {
      type: Boolean,
      default: false
    },
    showNoise: {
      type: Boolean,
      default: false
    },
    
    // 预设
    showPresets: {
      type: Boolean,
      default: false
    },
    presets: {
      type: Array,
      default: () => []
    },
    
    // 状态
    disabled: {
      type: Boolean,
      default: false
    },
    
    // 样式
    variant: {
      type: String,
      default: 'default',
      validator: value => ['default', 'compact', 'minimal'].includes(value)
    }
  },
  
  data() {
    return {
      // 调整值
      brightnessValue: 0,
      contrastValue: 0,
      saturationValue: 0,
      hueValue: 0,
      exposureValue: 0,
      highlightsValue: 0,
      shadowsValue: 0,
      temperatureValue: 0,
      tintValue: 0,
      sharpnessValue: 0,
      noiseValue: 0,
      
      // 活动预设
      activePreset: null
    };
  },
  
  computed: {
    panelClasses() {
      return {
        [`variant-${this.variant}`]: true,
        'disabled': this.disabled
      };
    }
  },
  
  methods: {
    /**
     * 处理亮度变化
     */
    handleBrightnessChange(value) {
      this.brightnessValue = value;
      this.$emit('brightness-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理对比度变化
     */
    handleContrastChange(value) {
      this.contrastValue = value;
      this.$emit('contrast-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理饱和度变化
     */
    handleSaturationChange(value) {
      this.saturationValue = value;
      this.$emit('saturation-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理色调变化
     */
    handleHueChange(value) {
      this.hueValue = value;
      this.$emit('hue-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理曝光度变化
     */
    handleExposureChange(value) {
      this.exposureValue = value;
      this.$emit('exposure-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理高光变化
     */
    handleHighlightsChange(value) {
      this.highlightsValue = value;
      this.$emit('highlights-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理阴影变化
     */
    handleShadowsChange(value) {
      this.shadowsValue = value;
      this.$emit('shadows-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理色温变化
     */
    handleTemperatureChange(value) {
      this.temperatureValue = value;
      this.$emit('temperature-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理色调变化
     */
    handleTintChange(value) {
      this.tintValue = value;
      this.$emit('tint-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理锐化变化
     */
    handleSharpnessChange(value) {
      this.sharpnessValue = value;
      this.$emit('sharpness-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理噪点变化
     */
    handleNoiseChange(value) {
      this.noiseValue = value;
      this.$emit('noise-change', value);
      this.activePreset = null;
    },
    
    /**
     * 处理调整完成
     */
    handleAdjustmentComplete() {
      this.$emit('adjustment-complete', this.getAdjustmentValues());
    },
    
    /**
     * 重置所有调整
     */
    resetAll() {
      this.brightnessValue = 0;
      this.contrastValue = 0;
      this.saturationValue = 0;
      this.hueValue = 0;
      this.exposureValue = 0;
      this.highlightsValue = 0;
      this.shadowsValue = 0;
      this.temperatureValue = 0;
      this.tintValue = 0;
      this.sharpnessValue = 0;
      this.noiseValue = 0;
      
      this.activePreset = null;
      
      this.$emit('reset-all');
      this.$emit('adjustment-complete', this.getAdjustmentValues());
    },
    
    /**
     * 应用预设
     */
    applyPreset(preset) {
      // 更新活动预设
      this.activePreset = preset.id;
      
      // 应用预设值
      if (preset.values) {
        if (preset.values.brightness !== undefined) {
          this.brightnessValue = preset.values.brightness;
          this.$emit('brightness-change', this.brightnessValue);
        }
        
        if (preset.values.contrast !== undefined) {
          this.contrastValue = preset.values.contrast;
          this.$emit('contrast-change', this.contrastValue);
        }
        
        if (preset.values.saturation !== undefined) {
          this.saturationValue = preset.values.saturation;
          this.$emit('saturation-change', this.saturationValue);
        }
        
        if (preset.values.hue !== undefined) {
          this.hueValue = preset.values.hue;
          this.$emit('hue-change', this.hueValue);
        }
        
        if (preset.values.exposure !== undefined) {
          this.exposureValue = preset.values.exposure;
          this.$emit('exposure-change', this.exposureValue);
        }
        
        if (preset.values.highlights !== undefined) {
          this.highlightsValue = preset.values.highlights;
          this.$emit('highlights-change', this.highlightsValue);
        }
        
        if (preset.values.shadows !== undefined) {
          this.shadowsValue = preset.values.shadows;
          this.$emit('shadows-change', this.shadowsValue);
        }
        
        if (preset.values.temperature !== undefined) {
          this.temperatureValue = preset.values.temperature;
          this.$emit('temperature-change', this.temperatureValue);
        }
        
        if (preset.values.tint !== undefined) {
          this.tintValue = preset.values.tint;
          this.$emit('tint-change', this.tintValue);
        }
        
        if (preset.values.sharpness !== undefined) {
          this.sharpnessValue = preset.values.sharpness;
          this.$emit('sharpness-change', this.sharpnessValue);
        }
        
        if (preset.values.noise !== undefined) {
          this.noiseValue = preset.values.noise;
          this.$emit('noise-change', this.noiseValue);
        }
      }
      
      // 触发预设应用事件
      this.$emit('preset-applied', preset);
      this.$emit('adjustment-complete', this.getAdjustmentValues());
    },
    
    /**
     * 获取所有调整值
     */
    getAdjustmentValues() {
      return {
        brightness: this.brightnessValue,
        contrast: this.contrastValue,
        saturation: this.saturationValue,
        hue: this.hueValue,
        exposure: this.exposureValue,
        highlights: this.highlightsValue,
        shadows: this.shadowsValue,
        temperature: this.temperatureValue,
        tint: this.tintValue,
        sharpness: this.sharpnessValue,
        noise: this.noiseValue
      };
    },
    
    /**
     * 设置调整值
     */
    setAdjustmentValues(values) {
      if (!values) return;
      
      if (values.brightness !== undefined) {
        this.brightnessValue = values.brightness;
      }
      
      if (values.contrast !== undefined) {
        this.contrastValue = values.contrast;
      }
      
      if (values.saturation !== undefined) {
        this.saturationValue = values.saturation;
      }
      
      if (values.hue !== undefined) {
        this.hueValue = values.hue;
      }
      
      if (values.exposure !== undefined) {
        this.exposureValue = values.exposure;
      }
      
      if (values.highlights !== undefined) {
        this.highlightsValue = values.highlights;
      }
      
      if (values.shadows !== undefined) {
        this.shadowsValue = values.shadows;
      }
      
      if (values.temperature !== undefined) {
        this.temperatureValue = values.temperature;
      }
      
      if (values.tint !== undefined) {
        this.tintValue = values.tint;
      }
      
      if (values.sharpness !== undefined) {
        this.sharpnessValue = values.sharpness;
      }
      
      if (values.noise !== undefined) {
        this.noiseValue = values.noise;
      }
    }
  }
};
</script>

<style scoped>
.image-adjustment-panel {
  width: 100%;
  background-color: var(--panel-bg-color, #fff);
  border-radius: 4px;
  overflow: hidden;
}

/* 变体样式 */
.image-adjustment-panel.variant-default {
  --panel-bg-color: #fff;
  --panel-border-color: #e8e8e8;
  --panel-title-color: #333;
  --panel-text-color: #666;
  border: 1px solid var(--panel-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.image-adjustment-panel.variant-compact {
  --panel-bg-color: #f5f5f5;
  --panel-border-color: #e8e8e8;
  --panel-title-color: #333;
  --panel-text-color: #666;
  border: 1px solid var(--panel-border-color);
}

.image-adjustment-panel.variant-minimal {
  --panel-bg-color: transparent;
  --panel-border-color: transparent;
  --panel-title-color: #333;
  --panel-text-color: #666;
  box-shadow: none;
}

/* 面板头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--panel-border-color);
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--panel-title-color);
}

.reset-all-button {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reset-all-button:hover {
  color: #40a9ff;
}

.reset-all-button:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
}

.icon-reset::before {
  content: '↺';
  font-size: 14px;
}

/* 面板内容 */
.panel-content {
  padding: 16px;
}

.adjustment-item {
  margin-bottom: 16px;
}

.adjustment-item:last-child {
  margin-bottom: 0;
}

/* 预设 */
.panel-presets {
  padding: 0 16px 16px;
  border-top: 1px solid var(--panel-border-color);
}

.presets-title {
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--panel-title-color);
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.preset-button {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  color: var(--panel-text-color);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.preset-button.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.preset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 禁用状态 */
.image-adjustment-panel.disabled {
  opacity: 0.7;
  pointer-events: none;
}
</style>
