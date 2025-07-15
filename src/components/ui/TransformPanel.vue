<template>
  <div class="transform-panel" :class="panelClasses">
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
      <!-- 旋转控制 -->
      <div v-if="showRotation" class="transform-section">
        <h4 class="section-title">旋转</h4>
        
        <div class="rotation-controls">
          <!-- 旋转角度滑块 -->
          <div class="control-item">
            <slider-control
              v-model="rotationAngle"
              :min="0"
              :max="360"
              :step="1"
              :default-value="0"
              label="角度"
              unit="°"
              :disabled="disabled"
              @change="handleRotationChange"
              @change-complete="handleTransformComplete"
            />
          </div>
          
          <!-- 快速旋转按钮 -->
          <div class="quick-rotation">
            <tool-button 
              icon="rotate-left"
              tooltip="逆时针旋转90°"
              size="small"
              @click="quickRotate(-90)"
              :disabled="disabled"
            />
            <tool-button 
              icon="rotate-right"
              tooltip="顺时针旋转90°"
              size="small"
              @click="quickRotate(90)"
              :disabled="disabled"
            />
            <tool-button 
              icon="rotate-180"
              tooltip="旋转180°"
              size="small"
              @click="quickRotate(180)"
              :disabled="disabled"
            />
          </div>
        </div>
      </div>
      
      <!-- 缩放控制 -->
      <div v-if="showScale" class="transform-section">
        <h4 class="section-title">缩放</h4>
        
        <div class="scale-controls">
          <!-- 统一缩放 -->
          <div v-if="uniformScale" class="control-item">
            <slider-control
              v-model="scaleValue"
              :min="0.1"
              :max="5"
              :step="0.1"
              :default-value="1"
              :precision="1"
              label="缩放"
              unit="x"
              :disabled="disabled"
              @change="handleUniformScaleChange"
              @change-complete="handleTransformComplete"
            />
          </div>
          
          <!-- 分别缩放 -->
          <template v-else>
            <div class="control-item">
              <slider-control
                v-model="scaleX"
                :min="0.1"
                :max="5"
                :step="0.1"
                :default-value="1"
                :precision="1"
                label="水平缩放"
                unit="x"
                :disabled="disabled"
                @change="handleScaleXChange"
                @change-complete="handleTransformComplete"
              />
            </div>
            
            <div class="control-item">
              <slider-control
                v-model="scaleY"
                :min="0.1"
                :max="5"
                :step="0.1"
                :default-value="1"
                :precision="1"
                label="垂直缩放"
                unit="x"
                :disabled="disabled"
                @change="handleScaleYChange"
                @change-complete="handleTransformComplete"
              />
            </div>
          </template>
          
          <!-- 缩放选项 -->
          <div class="scale-options">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="uniformScale"
                :disabled="disabled"
                @change="handleUniformScaleToggle"
              />
              <span>保持比例</span>
            </label>
            
            <div class="quick-scale">
              <tool-button 
                label="50%"
                size="small"
                @click="quickScale(0.5)"
                :disabled="disabled"
              />
              <tool-button 
                label="100%"
                size="small"
                @click="quickScale(1)"
                :disabled="disabled"
              />
              <tool-button 
                label="200%"
                size="small"
                @click="quickScale(2)"
                :disabled="disabled"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 翻转控制 -->
      <div v-if="showFlip" class="transform-section">
        <h4 class="section-title">翻转</h4>
        
        <div class="flip-controls">
          <tool-button 
            icon="flip-horizontal"
            label="水平翻转"
            size="small"
            :active="flipHorizontal"
            @click="toggleFlipHorizontal"
            :disabled="disabled"
          />
          <tool-button 
            icon="flip-vertical"
            label="垂直翻转"
            size="small"
            :active="flipVertical"
            @click="toggleFlipVertical"
            :disabled="disabled"
          />
        </div>
      </div>
      
      <!-- 位置控制 -->
      <div v-if="showPosition" class="transform-section">
        <h4 class="section-title">位置</h4>
        
        <div class="position-controls">
          <div class="control-item">
            <slider-control
              v-model="positionX"
              :min="-1000"
              :max="1000"
              :step="1"
              :default-value="0"
              label="X坐标"
              unit="px"
              :disabled="disabled"
              @change="handlePositionXChange"
              @change-complete="handleTransformComplete"
            />
          </div>
          
          <div class="control-item">
            <slider-control
              v-model="positionY"
              :min="-1000"
              :max="1000"
              :step="1"
              :default-value="0"
              label="Y坐标"
              unit="px"
              :disabled="disabled"
              @change="handlePositionYChange"
              @change-complete="handleTransformComplete"
            />
          </div>
          
          <!-- 位置快捷按钮 -->
          <div class="position-grid">
            <tool-button 
              icon="align-top-left"
              tooltip="左上角"
              size="small"
              @click="setPosition('top-left')"
              :disabled="disabled"
            />
            <tool-button 
              icon="align-top"
              tooltip="顶部居中"
              size="small"
              @click="setPosition('top-center')"
              :disabled="disabled"
            />
            <tool-button 
              icon="align-top-right"
              tooltip="右上角"
              size="small"
              @click="setPosition('top-right')"
              :disabled="disabled"
            />
            <tool-button 
              icon="align-left"
              tooltip="左侧居中"
              size="small"
              @click="setPosition('middle-left')"
              :disabled="disabled"
            />
            <tool-button 
              icon="align-center"
              tooltip="居中"
              size="small"
              @click="setPosition('center')"
              :disabled="disabled"
            />
            <tool-button 
              icon="align-right"
              tooltip="右侧居中"
              size="small"
              @click="setPosition('middle-right')"
              :disabled="disabled"
            />
            <tool-button 
              icon="align-bottom-left"
              tooltip="左下角"
              size="small"
              @click="setPosition('bottom-left')"
              :disabled="disabled"
            />
            <tool-button 
              icon="align-bottom"
              tooltip="底部居中"
              size="small"
              @click="setPosition('bottom-center')"
              :disabled="disabled"
            />
            <tool-button 
              icon="align-bottom-right"
              tooltip="右下角"
              size="small"
              @click="setPosition('bottom-right')"
              :disabled="disabled"
            />
          </div>
        </div>
      </div>
      
      <!-- 自定义变换项 -->
      <slot name="custom-transforms"></slot>
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
import ToolButton from './ToolButton.vue';

export default {
  name: 'TransformPanel',
  components: {
    SliderControl,
    ToolButton
  },
  
  props: {
    // 面板标题
    title: {
      type: String,
      default: '变换'
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
    
    // 变换项显示控制
    showRotation: {
      type: Boolean,
      default: true
    },
    showScale: {
      type: Boolean,
      default: true
    },
    showFlip: {
      type: Boolean,
      default: true
    },
    showPosition: {
      type: Boolean,
      default: true
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
      // 旋转
      rotationAngle: 0,
      
      // 缩放
      scaleValue: 1,
      scaleX: 1,
      scaleY: 1,
      uniformScale: true,
      
      // 翻转
      flipHorizontal: false,
      flipVertical: false,
      
      // 位置
      positionX: 0,
      positionY: 0,
      
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
     * 处理旋转变化
     */
    handleRotationChange(value) {
      this.rotationAngle = value;
      this.$emit('rotation-change', value);
      this.activePreset = null;
    },
    
    /**
     * 快速旋转
     */
    quickRotate(angle) {
      this.rotationAngle = (this.rotationAngle + angle) % 360;
      if (this.rotationAngle < 0) {
        this.rotationAngle += 360;
      }
      this.$emit('rotation-change', this.rotationAngle);
      this.activePreset = null;
    },
    
    /**
     * 处理统一缩放变化
     */
    handleUniformScaleChange(value) {
      this.scaleValue = value;
      this.scaleX = value;
      this.scaleY = value;
      this.$emit('scale-change', { x: value, y: value, uniform: true });
      this.activePreset = null;
    },
    
    /**
     * 处理X轴缩放变化
     */
    handleScaleXChange(value) {
      this.scaleX = value;
      this.$emit('scale-change', { x: value, y: this.scaleY, uniform: false });
      this.activePreset = null;
    },
    
    /**
     * 处理Y轴缩放变化
     */
    handleScaleYChange(value) {
      this.scaleY = value;
      this.$emit('scale-change', { x: this.scaleX, y: value, uniform: false });
      this.activePreset = null;
    },
    
    /**
     * 处理统一缩放切换
     */
    handleUniformScaleToggle() {
      if (this.uniformScale) {
        // 切换到统一缩放，使用当前X轴缩放值
        this.scaleValue = this.scaleX;
        this.scaleY = this.scaleX;
        this.$emit('scale-change', { x: this.scaleX, y: this.scaleX, uniform: true });
      }
    },
    
    /**
     * 快速缩放
     */
    quickScale(scale) {
      if (this.uniformScale) {
        this.scaleValue = scale;
        this.scaleX = scale;
        this.scaleY = scale;
        this.$emit('scale-change', { x: scale, y: scale, uniform: true });
      } else {
        this.scaleX = scale;
        this.scaleY = scale;
        this.$emit('scale-change', { x: scale, y: scale, uniform: false });
      }
      this.activePreset = null;
    },
    
    /**
     * 切换水平翻转
     */
    toggleFlipHorizontal() {
      this.flipHorizontal = !this.flipHorizontal;
      this.$emit('flip-change', { horizontal: this.flipHorizontal, vertical: this.flipVertical });
      this.activePreset = null;
    },
    
    /**
     * 切换垂直翻转
     */
    toggleFlipVertical() {
      this.flipVertical = !this.flipVertical;
      this.$emit('flip-change', { horizontal: this.flipHorizontal, vertical: this.flipVertical });
      this.activePreset = null;
    },
    
    /**
     * 处理X坐标变化
     */
    handlePositionXChange(value) {
      this.positionX = value;
      this.$emit('position-change', { x: value, y: this.positionY });
      this.activePreset = null;
    },
    
    /**
     * 处理Y坐标变化
     */
    handlePositionYChange(value) {
      this.positionY = value;
      this.$emit('position-change', { x: this.positionX, y: value });
      this.activePreset = null;
    },
    
    /**
     * 设置位置
     */
    setPosition(position) {
      let x = 0, y = 0;
      
      // 这里的坐标计算需要根据实际的画布尺寸来调整
      // 暂时使用相对值
      switch (position) {
        case 'top-left':
          x = -100; y = -100;
          break;
        case 'top-center':
          x = 0; y = -100;
          break;
        case 'top-right':
          x = 100; y = -100;
          break;
        case 'middle-left':
          x = -100; y = 0;
          break;
        case 'center':
          x = 0; y = 0;
          break;
        case 'middle-right':
          x = 100; y = 0;
          break;
        case 'bottom-left':
          x = -100; y = 100;
          break;
        case 'bottom-center':
          x = 0; y = 100;
          break;
        case 'bottom-right':
          x = 100; y = 100;
          break;
      }
      
      this.positionX = x;
      this.positionY = y;
      this.$emit('position-change', { x, y });
      this.activePreset = null;
    },
    
    /**
     * 处理变换完成
     */
    handleTransformComplete() {
      this.$emit('transform-complete', this.getTransformValues());
    },
    
    /**
     * 重置所有变换
     */
    resetAll() {
      this.rotationAngle = 0;
      this.scaleValue = 1;
      this.scaleX = 1;
      this.scaleY = 1;
      this.uniformScale = true;
      this.flipHorizontal = false;
      this.flipVertical = false;
      this.positionX = 0;
      this.positionY = 0;
      
      this.activePreset = null;
      
      this.$emit('reset-all');
      this.$emit('transform-complete', this.getTransformValues());
    },
    
    /**
     * 应用预设
     */
    applyPreset(preset) {
      // 更新活动预设
      this.activePreset = preset.id;
      
      // 应用预设值
      if (preset.values) {
        if (preset.values.rotation !== undefined) {
          this.rotationAngle = preset.values.rotation;
          this.$emit('rotation-change', this.rotationAngle);
        }
        
        if (preset.values.scale !== undefined) {
          if (typeof preset.values.scale === 'number') {
            this.scaleValue = preset.values.scale;
            this.scaleX = preset.values.scale;
            this.scaleY = preset.values.scale;
            this.uniformScale = true;
            this.$emit('scale-change', { x: preset.values.scale, y: preset.values.scale, uniform: true });
          } else if (preset.values.scale.x !== undefined && preset.values.scale.y !== undefined) {
            this.scaleX = preset.values.scale.x;
            this.scaleY = preset.values.scale.y;
            this.uniformScale = preset.values.scale.uniform || false;
            this.$emit('scale-change', { x: this.scaleX, y: this.scaleY, uniform: this.uniformScale });
          }
        }
        
        if (preset.values.flip !== undefined) {
          this.flipHorizontal = preset.values.flip.horizontal || false;
          this.flipVertical = preset.values.flip.vertical || false;
          this.$emit('flip-change', { horizontal: this.flipHorizontal, vertical: this.flipVertical });
        }
        
        if (preset.values.position !== undefined) {
          this.positionX = preset.values.position.x || 0;
          this.positionY = preset.values.position.y || 0;
          this.$emit('position-change', { x: this.positionX, y: this.positionY });
        }
      }
      
      // 触发预设应用事件
      this.$emit('preset-applied', preset);
      this.$emit('transform-complete', this.getTransformValues());
    },
    
    /**
     * 获取所有变换值
     */
    getTransformValues() {
      return {
        rotation: this.rotationAngle,
        scale: {
          x: this.scaleX,
          y: this.scaleY,
          uniform: this.uniformScale
        },
        flip: {
          horizontal: this.flipHorizontal,
          vertical: this.flipVertical
        },
        position: {
          x: this.positionX,
          y: this.positionY
        }
      };
    },
    
    /**
     * 设置变换值
     */
    setTransformValues(values) {
      if (!values) return;
      
      if (values.rotation !== undefined) {
        this.rotationAngle = values.rotation;
      }
      
      if (values.scale !== undefined) {
        if (typeof values.scale === 'number') {
          this.scaleValue = values.scale;
          this.scaleX = values.scale;
          this.scaleY = values.scale;
          this.uniformScale = true;
        } else {
          this.scaleX = values.scale.x || 1;
          this.scaleY = values.scale.y || 1;
          this.uniformScale = values.scale.uniform || false;
          if (this.uniformScale) {
            this.scaleValue = this.scaleX;
          }
        }
      }
      
      if (values.flip !== undefined) {
        this.flipHorizontal = values.flip.horizontal || false;
        this.flipVertical = values.flip.vertical || false;
      }
      
      if (values.position !== undefined) {
        this.positionX = values.position.x || 0;
        this.positionY = values.position.y || 0;
      }
    }
  }
};
</script>

<style scoped>
.transform-panel {
  width: 100%;
  background-color: var(--panel-bg-color, #fff);
  border-radius: 4px;
  overflow: hidden;
}

/* 变体样式 */
.transform-panel.variant-default {
  --panel-bg-color: #fff;
  --panel-border-color: #e8e8e8;
  --panel-title-color: #333;
  --panel-text-color: #666;
  border: 1px solid var(--panel-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.transform-panel.variant-compact {
  --panel-bg-color: #f5f5f5;
  --panel-border-color: #e8e8e8;
  --panel-title-color: #333;
  --panel-text-color: #666;
  border: 1px solid var(--panel-border-color);
}

.transform-panel.variant-minimal {
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

.transform-section {
  margin-bottom: 24px;
}

.transform-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--panel-title-color);
}

.control-item {
  margin-bottom: 12px;
}

/* 旋转控制 */
.rotation-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-rotation {
  display: flex;
  gap: 8px;
}

/* 缩放控制 */
.scale-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scale-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--panel-text-color);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.quick-scale {
  display: flex;
  gap: 4px;
}

/* 翻转控制 */
.flip-controls {
  display: flex;
  gap: 8px;
}

/* 位置控制 */
.position-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  max-width: 120px;
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
.transform-panel.disabled {
  opacity: 0.7;
  pointer-events: none;
}

/* 图标样式 */
.icon-rotate-left::before { content: '↺'; }
.icon-rotate-right::before { content: '↻'; }
.icon-rotate-180::before { content: '↻'; }
.icon-flip-horizontal::before { content: '⇄'; }
.icon-flip-vertical::before { content: '⇅'; }
.icon-align-top-left::before { content: '⌜'; }
.icon-align-top::before { content: '⌝'; }
.icon-align-top-right::before { content: '⌞'; }
.icon-align-left::before { content: '⌟'; }
.icon-align-center::before { content: '⊞'; }
.icon-align-right::before { content: '⊟'; }
.icon-align-bottom-left::before { content: '⌊'; }
.icon-align-bottom::before { content: '⌋'; }
.icon-align-bottom-right::before { content: '⌈'; }
</style>
