<template>
  <div
    class="color-picker"
    :class="pickerClasses"
  >
    <!-- 颜色显示按钮 -->
    <div
      class="color-display"
      @click="togglePicker"
      :style="{ backgroundColor: currentColor }"
      :title="showTooltip ? `当前颜色: ${currentColor}` : ''"
    >
      <div v-if="!currentColor" class="no-color-indicator">
        <i class="icon-no-color"></i>
      </div>
    </div>

    <!-- 颜色选择器面板 -->
    <div
      v-if="showPicker"
      class="color-picker-panel"
      ref="pickerPanel"
    >
      <!-- 颜色选择区域 -->
      <div class="color-selection-area">
        <!-- 色相/饱和度选择器 -->
        <div
          class="color-saturation-lightness"
          ref="saturationLightness"
          @mousedown="handleSLMouseDown"
          @touchstart="handleSLTouchStart"
        >
          <div
            class="sl-background"
            :style="{ backgroundColor: `hsl(${hsl.h}, 100%, 50%)` }"
          ></div>
          <div class="sl-white-overlay"></div>
          <div class="sl-black-overlay"></div>
          <div
            class="sl-cursor"
            :style="{
              left: hsl.s + '%',
              top: (100 - hsl.l) + '%'
            }"
          ></div>
        </div>

        <!-- 色相滑块 -->
        <div
          class="color-hue-slider"
          ref="hueSlider"
          @mousedown="handleHueMouseDown"
          @touchstart="handleHueTouchStart"
        >
          <div class="hue-slider-track"></div>
          <div
            class="hue-slider-thumb"
            :style="{ left: (hsl.h / 360) * 100 + '%' }"
          ></div>
        </div>

        <!-- 透明度滑块 -->
        <div
          v-if="showAlpha"
          class="color-alpha-slider"
          ref="alphaSlider"
          @mousedown="handleAlphaMouseDown"
          @touchstart="handleAlphaTouchStart"
        >
          <div class="alpha-slider-track">
            <div
              class="alpha-slider-background"
              :style="{
                background: `linear-gradient(to right, transparent, ${rgbString})`
              }"
            ></div>
          </div>
          <div
            class="alpha-slider-thumb"
            :style="{ left: alpha * 100 + '%' }"
          ></div>
        </div>
      </div>

      <!-- 颜色值输入 -->
      <div class="color-inputs">
        <div class="input-group">
          <label>HEX</label>
          <input
            type="text"
            v-model="hexInput"
            @input="handleHexInput"
            @blur="validateHexInput"
            class="color-input hex-input"
          />
        </div>

        <div class="input-group">
          <label>R</label>
          <input
            type="number"
            v-model.number="rgbInput.r"
            @input="handleRGBInput"
            min="0"
            max="255"
            class="color-input rgb-input"
          />
        </div>

        <div class="input-group">
          <label>G</label>
          <input
            type="number"
            v-model.number="rgbInput.g"
            @input="handleRGBInput"
            min="0"
            max="255"
            class="color-input rgb-input"
          />
        </div>

        <div class="input-group">
          <label>B</label>
          <input
            type="number"
            v-model.number="rgbInput.b"
            @input="handleRGBInput"
            min="0"
            max="255"
            class="color-input rgb-input"
          />
        </div>

        <div v-if="showAlpha" class="input-group">
          <label>A</label>
          <input
            type="number"
            v-model.number="alphaInput"
            @input="handleAlphaInput"
            min="0"
            max="1"
            step="0.01"
            class="color-input alpha-input"
          />
        </div>
      </div>

      <!-- 预设颜色 -->
      <div v-if="showPresets" class="color-presets">
        <div class="presets-title">预设颜色</div>
        <div class="presets-grid">
          <div
            v-for="(preset, index) in presetColors"
            :key="index"
            class="preset-color"
            :class="{ 'active': preset === currentColor }"
            :style="{ backgroundColor: preset }"
            @click="selectPresetColor(preset)"
            :title="preset"
          ></div>
        </div>
      </div>

      <!-- 最近使用的颜色 -->
      <div v-if="showRecent && recentColors.length > 0" class="color-recent">
        <div class="recent-title">最近使用</div>
        <div class="recent-grid">
          <div
            v-for="(recent, index) in recentColors"
            :key="index"
            class="recent-color"
            :class="{ 'active': recent === currentColor }"
            :style="{ backgroundColor: recent }"
            @click="selectRecentColor(recent)"
            :title="recent"
          ></div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="color-actions">
        <button
          class="action-button cancel-button"
          @click="cancelSelection"
        >
          取消
        </button>
        <button
          class="action-button confirm-button"
          @click="confirmSelection"
        >
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ColorPicker',
  props: {
    // 当前颜色值
    value: {
      type: String,
      default: '#000000'
    },

    // 显示选项
    showAlpha: {
      type: Boolean,
      default: false
    },
    showPresets: {
      type: Boolean,
      default: true
    },
    showRecent: {
      type: Boolean,
      default: true
    },
    showTooltip: {
      type: Boolean,
      default: true
    },

    // 预设颜色
    presetColors: {
      type: Array,
      default: () => [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff',
        '#808080', '#c0c0c0', '#800000', '#008000', '#000080',
        '#808000', '#800080', '#008080', '#ffc0cb', '#ffd700'
      ]
    },

    // 最大最近颜色数量
    maxRecentColors: {
      type: Number,
      default: 10
    },

    // 状态
    disabled: {
      type: Boolean,
      default: false
    },

    // 样式
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    }
  },

  data() {
    return {
      showPicker: false,
      isDragging: false,
      dragType: '', // 'sl', 'hue', 'alpha'

      // 颜色状态
      hsl: { h: 0, s: 0, l: 0 },
      rgb: { r: 0, g: 0, b: 0 },
      alpha: 1,

      // 输入状态
      hexInput: '',
      rgbInput: { r: 0, g: 0, b: 0 },
      alphaInput: 1,

      // 最近使用的颜色
      recentColors: [],

      // 初始颜色（用于取消操作）
      initialColor: '',

      // 窗口点击监听器
      windowClickListener: null
    };
  },

  computed: {
    pickerClasses() {
      return {
        [`size-${this.size}`]: true,
        'disabled': this.disabled,
        'picker-open': this.showPicker,
        'with-alpha': this.showAlpha
      };
    },

    // 当前颜色
    currentColor() {
      if (this.showAlpha && this.alpha < 1) {
        return `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, ${this.alpha})`;
      }
      return this.rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b);
    },

    // RGB字符串（不含透明度）
    rgbString() {
      return `rgb(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b})`;
    }
  },

  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.parseColor(newValue);
        this.updateInputs();
      }
    }
  },

  mounted() {
    // 加载最近使用的颜色
    this.loadRecentColors();

    // 添加全局事件监听器
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);

    // 监听窗口点击事件，用于关闭颜色选择器
    this.windowClickListener = this.handleWindowClick.bind(this);
    window.addEventListener('click', this.windowClickListener);
  },

  beforeDestroy() {
    // 移除全局事件监听器
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);

    if (this.windowClickListener) {
      window.removeEventListener('click', this.windowClickListener);
    }
  },

  methods: {
    /**
     * 解析颜色值
     */
    parseColor(colorString) {
      if (!colorString) {
        this.rgb = { r: 0, g: 0, b: 0 };
        this.alpha = 1;
        this.hsl = this.rgbToHsl(0, 0, 0);
        return;
      }

      let rgb, alpha = 1;

      // 解析HEX格式
      if (colorString.startsWith('#')) {
        rgb = this.hexToRgb(colorString);
      }
      // 解析RGB/RGBA格式
      else if (colorString.startsWith('rgb')) {
        const match = colorString.match(/rgba?\(([^)]+)\)/);
        if (match) {
          const values = match[1].split(',').map(v => parseFloat(v.trim()));
          rgb = { r: values[0], g: values[1], b: values[2] };
          alpha = values[3] !== undefined ? values[3] : 1;
        }
      }
      // 解析HSL格式
      else if (colorString.startsWith('hsl')) {
        const match = colorString.match(/hsla?\(([^)]+)\)/);
        if (match) {
          const values = match[1].split(',').map(v => parseFloat(v.trim()));
          const hsl = { h: values[0], s: values[1], l: values[2] };
          rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
          alpha = values[3] !== undefined ? values[3] : 1;
        }
      }

      if (rgb) {
        this.rgb = rgb;
        this.alpha = alpha;
        this.hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      }
    },

    /**
     * 更新输入框的值
     */
    updateInputs() {
      this.hexInput = this.rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b);
      this.rgbInput = { ...this.rgb };
      this.alphaInput = this.alpha;
    },

    /**
     * 切换颜色选择器显示状态
     */
    togglePicker(event) {
      if (this.disabled) return;

      // 阻止事件冒泡，防止立即触发窗口点击事件处理器
      event.stopPropagation();

      if (!this.showPicker) {
        // 保存初始颜色，用于取消操作
        this.initialColor = this.value;
      }

      this.showPicker = !this.showPicker;
    },

    /**
     * 处理窗口点击事件
     */
    handleWindowClick(event) {
      // 如果点击的不是颜色选择器或其子元素，则关闭颜色选择器
      if (this.showPicker && this.$el && !this.$el.contains(event.target)) {
        this.showPicker = false;
      }
    },

    /**
     * 处理饱和度/亮度区域鼠标按下事件
     */
    handleSLMouseDown(event) {
      this.isDragging = true;
      this.dragType = 'sl';
      this.updateSLFromEvent(event);

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理饱和度/亮度区域触摸开始事件
     */
    handleSLTouchStart(event) {
      this.isDragging = true;
      this.dragType = 'sl';
      this.updateSLFromEvent(event.touches[0]);

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理色相滑块鼠标按下事件
     */
    handleHueMouseDown(event) {
      this.isDragging = true;
      this.dragType = 'hue';
      this.updateHueFromEvent(event);

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理色相滑块触摸开始事件
     */
    handleHueTouchStart(event) {
      this.isDragging = true;
      this.dragType = 'hue';
      this.updateHueFromEvent(event.touches[0]);

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理透明度滑块鼠标按下事件
     */
    handleAlphaMouseDown(event) {
      this.isDragging = true;
      this.dragType = 'alpha';
      this.updateAlphaFromEvent(event);

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理透明度滑块触摸开始事件
     */
    handleAlphaTouchStart(event) {
      this.isDragging = true;
      this.dragType = 'alpha';
      this.updateAlphaFromEvent(event.touches[0]);

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理鼠标移动事件
     */
    handleMouseMove(event) {
      if (!this.isDragging) return;

      switch (this.dragType) {
        case 'sl':
          this.updateSLFromEvent(event);
          break;
        case 'hue':
          this.updateHueFromEvent(event);
          break;
        case 'alpha':
          this.updateAlphaFromEvent(event);
          break;
      }

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理触摸移动事件
     */
    handleTouchMove(event) {
      if (!this.isDragging) return;

      switch (this.dragType) {
        case 'sl':
          this.updateSLFromEvent(event.touches[0]);
          break;
        case 'hue':
          this.updateHueFromEvent(event.touches[0]);
          break;
        case 'alpha':
          this.updateAlphaFromEvent(event.touches[0]);
          break;
      }

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理鼠标松开事件
     */
    handleMouseUp() {
      this.isDragging = false;
      this.dragType = '';
    },

    /**
     * 处理触摸结束事件
     */
    handleTouchEnd() {
      this.isDragging = false;
      this.dragType = '';
    },

    /**
     * 从事件更新饱和度/亮度
     */
    updateSLFromEvent(event) {
      const rect = this.$refs.saturationLightness.getBoundingClientRect();

      // 计算相对位置（0-1）
      let s = (event.clientX - rect.left) / rect.width;
      let l = 1 - (event.clientY - rect.top) / rect.height;

      // 限制在范围内
      s = Math.min(Math.max(s, 0), 1);
      l = Math.min(Math.max(l, 0), 1);

      // 更新HSL
      this.hsl.s = Math.round(s * 100);
      this.hsl.l = Math.round(l * 100);

      // 更新RGB
      this.rgb = this.hslToRgb(this.hsl.h, this.hsl.s, this.hsl.l);

      // 更新输入框
      this.updateInputs();

      // 触发更新事件
      this.emitColorChange();
    },

    /**
     * 从事件更新色相
     */
    updateHueFromEvent(event) {
      const rect = this.$refs.hueSlider.getBoundingClientRect();

      // 计算相对位置（0-1）
      let h = (event.clientX - rect.left) / rect.width;

      // 限制在范围内
      h = Math.min(Math.max(h, 0), 1);

      // 更新HSL
      this.hsl.h = Math.round(h * 360);

      // 更新RGB
      this.rgb = this.hslToRgb(this.hsl.h, this.hsl.s, this.hsl.l);

      // 更新输入框
      this.updateInputs();

      // 触发更新事件
      this.emitColorChange();
    },

    /**
     * 从事件更新透明度
     */
    updateAlphaFromEvent(event) {
      const rect = this.$refs.alphaSlider.getBoundingClientRect();

      // 计算相对位置（0-1）
      let a = (event.clientX - rect.left) / rect.width;

      // 限制在范围内
      a = Math.min(Math.max(a, 0), 1);

      // 更新透明度
      this.alpha = Math.round(a * 100) / 100;
      this.alphaInput = this.alpha;

      // 触发更新事件
      this.emitColorChange();
    },

    /**
     * 处理HEX输入
     */
    handleHexInput() {
      // 验证HEX格式
      if (/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(this.hexInput)) {
        const rgb = this.hexToRgb(this.hexInput);
        if (rgb) {
          this.rgb = rgb;
          this.hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
          this.rgbInput = { ...rgb };

          // 触发更新事件
          this.emitColorChange();
        }
      }
    },

    /**
     * 验证HEX输入
     */
    validateHexInput() {
      // 如果输入无效，重置为当前RGB值
      if (!/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(this.hexInput)) {
        this.hexInput = this.rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b);
      }
      // 确保HEX值以#开头
      else if (!this.hexInput.startsWith('#')) {
        this.hexInput = '#' + this.hexInput;
      }
    },

    /**
     * 处理RGB输入
     */
    handleRGBInput() {
      // 验证RGB值
      const r = Math.min(Math.max(this.rgbInput.r, 0), 255);
      const g = Math.min(Math.max(this.rgbInput.g, 0), 255);
      const b = Math.min(Math.max(this.rgbInput.b, 0), 255);

      this.rgb = { r, g, b };
      this.hsl = this.rgbToHsl(r, g, b);
      this.hexInput = this.rgbToHex(r, g, b);

      // 触发更新事件
      this.emitColorChange();
    },

    /**
     * 处理透明度输入
     */
    handleAlphaInput() {
      // 验证透明度值
      this.alpha = Math.min(Math.max(this.alphaInput, 0), 1);
      this.alphaInput = this.alpha;

      // 触发更新事件
      this.emitColorChange();
    },

    /**
     * 选择预设颜色
     */
    selectPresetColor(color) {
      this.parseColor(color);
      this.updateInputs();
      this.emitColorChange();
    },

    /**
     * 选择最近使用的颜色
     */
    selectRecentColor(color) {
      this.parseColor(color);
      this.updateInputs();
      this.emitColorChange();
    },

    /**
     * 确认颜色选择
     */
    confirmSelection() {
      // 添加到最近使用的颜色
      this.addToRecentColors(this.currentColor);

      // 关闭颜色选择器
      this.showPicker = false;
    },

    /**
     * 取消颜色选择
     */
    cancelSelection() {
      // 恢复初始颜色
      this.parseColor(this.initialColor);
      this.updateInputs();
      this.emitColorChange();

      // 关闭颜色选择器
      this.showPicker = false;
    },

    /**
     * 触发颜色变更事件
     */
    emitColorChange() {
      this.$emit('input', this.currentColor);
      this.$emit('change', this.currentColor);
    },

    /**
     * 添加到最近使用的颜色
     */
    addToRecentColors(color) {
      // 如果颜色已存在，先移除
      const index = this.recentColors.indexOf(color);
      if (index !== -1) {
        this.recentColors.splice(index, 1);
      }

      // 添加到最前面
      this.recentColors.unshift(color);

      // 限制数量
      if (this.recentColors.length > this.maxRecentColors) {
        this.recentColors = this.recentColors.slice(0, this.maxRecentColors);
      }

      // 保存到本地存储
      this.saveRecentColors();
    },

    /**
     * 保存最近使用的颜色到本地存储
     */
    saveRecentColors() {
      try {
        localStorage.setItem('recentColors', JSON.stringify(this.recentColors));
      } catch (e) {
        console.error('Failed to save recent colors:', e);
      }
    },

    /**
     * 从本地存储加载最近使用的颜色
     */
    loadRecentColors() {
      try {
        const stored = localStorage.getItem('recentColors');
        if (stored) {
          this.recentColors = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to load recent colors:', e);
      }
    },

    // ========== 颜色转换工具 ==========

    /**
     * HEX转RGB
     */
    hexToRgb(hex) {
      // 移除#前缀
      hex = hex.replace(/^#/, '');

      // 处理3位HEX
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }

      // 解析RGB值
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      return { r, g, b };
    },

    /**
     * RGB转HEX
     */
    rgbToHex(r, g, b) {
      r = Math.round(r);
      g = Math.round(g);
      b = Math.round(b);

      return '#' +
        ((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1)
          .toUpperCase();
    },

    /**
     * RGB转HSL
     */
    rgbToHsl(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0; // 灰色
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    },

    /**
     * HSL转RGB
     */
    hslToRgb(h, s, l) {
      h /= 360;
      s /= 100;
      l /= 100;

      let r, g, b;

      if (s === 0) {
        r = g = b = l; // 灰色
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }

      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    }
  }
};
</script>

<style scoped>
.color-picker {
  position: relative;
  display: inline-block;
}

/* 尺寸样式 */
.color-picker.size-small .color-display {
  width: 24px;
  height: 24px;
}

.color-picker.size-medium .color-display {
  width: 32px;
  height: 32px;
}

.color-picker.size-large .color-display {
  width: 40px;
  height: 40px;
}

/* 颜色显示按钮 */
.color-display {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
}

.color-display:hover {
  border-color: #40a9ff;
}

.no-color-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff4d4f;
}

.icon-no-color::before {
  content: '✕';
  font-size: 16px;
}

/* 颜色选择器面板 */
.color-picker-panel {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  width: 240px;
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 12px;
  margin-top: 4px;
}

/* 颜色选择区域 */
.color-selection-area {
  margin-bottom: 12px;
}

/* 饱和度/亮度选择器 */
.color-saturation-lightness {
  width: 100%;
  height: 150px;
  position: relative;
  margin-bottom: 12px;
  border-radius: 4px;
  overflow: hidden;
  cursor: crosshair;
}

.sl-background,
.sl-white-overlay,
.sl-black-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.sl-white-overlay {
  background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
}

.sl-black-overlay {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0), #000);
}

.sl-cursor {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* 色相滑块 */
.color-hue-slider {
  width: 100%;
  height: 16px;
  position: relative;
  margin-bottom: 12px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.hue-slider-track {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to right,
    #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000
  );
}

.hue-slider-thumb {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.3);
  transform: translateX(-50%);
  pointer-events: none;
}

/* 透明度滑块 */
.color-alpha-slider {
  width: 100%;
  height: 16px;
  position: relative;
  margin-bottom: 12px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==');
  background-repeat: repeat;
}

.alpha-slider-track {
  width: 100%;
  height: 100%;
  position: relative;
}

.alpha-slider-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.alpha-slider-thumb {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.3);
  transform: translateX(-50%);
  pointer-events: none;
}

/* 颜色值输入 */
.color-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.color-input {
  width: 60px;
  height: 24px;
  padding: 0 4px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 12px;
}

.hex-input {
  width: 80px;
}

.rgb-input,
.alpha-input {
  width: 40px;
}

.color-input:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 预设颜色 */
.color-presets {
  margin-bottom: 12px;
}

.presets-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}

.preset-color {
  width: 100%;
  padding-bottom: 100%;
  border-radius: 2px;
  border: 1px solid #d9d9d9;
  cursor: pointer;
  position: relative;
}

.preset-color:hover {
  transform: scale(1.1);
  z-index: 1;
}

.preset-color.active {
  box-shadow: 0 0 0 2px #1890ff;
}

/* 最近使用的颜色 */
.color-recent {
  margin-bottom: 12px;
}

.recent-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}

.recent-color {
  width: 100%;
  padding-bottom: 100%;
  border-radius: 2px;
  border: 1px solid #d9d9d9;
  cursor: pointer;
  position: relative;
}

.recent-color:hover {
  transform: scale(1.1);
  z-index: 1;
}

.recent-color.active {
  box-shadow: 0 0 0 2px #1890ff;
}

/* 操作按钮 */
.color-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.action-button {
  padding: 4px 12px;
  border-radius: 2px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  background-color: #fff;
  transition: all 0.2s;
}

.action-button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.confirm-button {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.confirm-button:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
  color: #fff;
}

/* 禁用状态 */
.color-picker.disabled .color-display {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-picker.disabled .color-display:hover {
  border-color: #d9d9d9;
}
</style>