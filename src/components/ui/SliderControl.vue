<template>
  <div class="slider-control" :class="sliderClasses">
    <!-- 标签和值显示 -->
    <div class="slider-header">
      <div class="slider-label" v-if="label">
        {{ label }}
        <span v-if="showTooltip" class="slider-tooltip" :title="tooltip">
          <i class="icon-info"></i>
        </span>
      </div>

      <div class="slider-value-display">
        <!-- 数值输入框 -->
        <input
          v-if="showInput"
          type="number"
          class="value-input"
          :value="displayValue"
          :min="min"
          :max="max"
          :step="step"
          @input="handleInputChange"
          @blur="handleInputBlur"
          :disabled="disabled"
        />

        <!-- 数值显示 -->
        <span v-else class="value-text"> {{ displayValue }}{{ unit }} </span>

        <!-- 重置按钮 -->
        <button
          v-if="showResetButton && !disabled && value !== defaultValue"
          class="reset-button"
          @click="resetValue"
          title="重置为默认值"
        >
          <i class="icon-reset"></i>
        </button>
      </div>
    </div>

    <!-- 滑块控制区域 -->
    <div class="slider-track-container">
      <!-- 滑块轨道 -->
      <div
        class="slider-track"
        ref="track"
        @mousedown="handleTrackMouseDown"
        @touchstart="handleTrackTouchStart"
      >
        <!-- 已填充部分 -->
        <div
          class="slider-track-fill"
          :style="{ width: fillPercentage + '%' }"
        ></div>

        <!-- 滑块手柄 -->
        <div
          class="slider-handle"
          :style="{ left: fillPercentage + '%' }"
          @mousedown="handleHandleMouseDown"
          @touchstart="handleHandleTouchStart"
          :tabindex="disabled ? -1 : 0"
          @keydown="handleHandleKeyDown"
          ref="handle"
        ></div>

        <!-- 刻度标记 -->
        <div v-if="showTicks" class="slider-ticks">
          <div
            v-for="tick in ticks"
            :key="tick.value"
            class="slider-tick"
            :class="{ active: value >= tick.value }"
            :style="{ left: tick.percentage + '%' }"
            @click="setValueFromTick(tick.value)"
          >
            <div class="tick-mark"></div>
            <div v-if="showTickLabels" class="tick-label">{{ tick.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预设值 -->
    <div v-if="showPresets && presets.length > 0" class="slider-presets">
      <button
        v-for="preset in presets"
        :key="preset.value"
        class="preset-button"
        :class="{ active: value === preset.value }"
        @click="setValue(preset.value)"
        :disabled="disabled"
      >
        {{ preset.label }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "SliderControl",
  props: {
    // 基本属性
    value: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      type: Number,
      default: 1,
    },
    defaultValue: {
      type: Number,
      default: 0,
    },

    // 显示选项
    label: {
      type: String,
      default: "",
    },
    tooltip: {
      type: String,
      default: "",
    },
    unit: {
      type: String,
      default: "",
    },
    showInput: {
      type: Boolean,
      default: true,
    },
    showResetButton: {
      type: Boolean,
      default: true,
    },
    showTooltip: {
      type: Boolean,
      default: false,
    },

    // 刻度选项
    showTicks: {
      type: Boolean,
      default: false,
    },
    showTickLabels: {
      type: Boolean,
      default: true,
    },
    tickCount: {
      type: Number,
      default: 5,
    },
    tickValues: {
      type: Array,
      default: () => [],
    },

    // 预设值
    presets: {
      type: Array,
      default: () => [],
    },
    showPresets: {
      type: Boolean,
      default: false,
    },

    // 格式化选项
    valueFormatter: {
      type: Function,
      default: null,
    },
    precision: {
      type: Number,
      default: 0,
    },

    // 状态
    disabled: {
      type: Boolean,
      default: false,
    },

    // 样式
    variant: {
      type: String,
      default: "default",
      validator: (value) =>
        ["default", "primary", "success", "warning", "danger"].includes(value),
    },
    size: {
      type: String,
      default: "medium",
      validator: (value) => ["small", "medium", "large"].includes(value),
    },
  },

  data() {
    return {
      isDragging: false,
      inputValue: null,
      isInputFocused: false,
    };
  },

  computed: {
    sliderClasses() {
      return {
        [`variant-${this.variant}`]: true,
        [`size-${this.size}`]: true,
        disabled: this.disabled,
        dragging: this.isDragging,
        "with-ticks": this.showTicks,
        "with-presets": this.showPresets && this.presets.length > 0,
      };
    },

    // 填充百分比
    fillPercentage() {
      const range = this.max - this.min;
      if (range === 0) return 0;

      const percentage = ((this.value - this.min) / range) * 100;
      return Math.min(Math.max(percentage, 0), 100);
    },

    // 显示值
    displayValue() {
      if (this.isInputFocused && this.inputValue !== null) {
        return this.inputValue;
      }

      if (this.valueFormatter) {
        return this.valueFormatter(this.value);
      }

      if (this.precision === 0) {
        return Math.round(this.value);
      }

      return this.value.toFixed(this.precision);
    },

    // 刻度标记
    ticks() {
      // 如果提供了自定义刻度值，使用它们
      if (this.tickValues && this.tickValues.length > 0) {
        return this.tickValues.map((tick) => {
          const value = typeof tick === "object" ? tick.value : tick;
          const label =
            typeof tick === "object" ? tick.label : value.toString();

          const range = this.max - this.min;
          const percentage = ((value - this.min) / range) * 100;

          return {
            value,
            label,
            percentage: Math.min(Math.max(percentage, 0), 100),
          };
        });
      }

      // 否则生成均匀分布的刻度
      const ticks = [];
      const count = Math.max(2, this.tickCount);
      const range = this.max - this.min;

      for (let i = 0; i < count; i++) {
        const value = this.min + (range * i) / (count - 1);
        const roundedValue = Number(value.toFixed(this.precision));
        const percentage = (i / (count - 1)) * 100;

        ticks.push({
          value: roundedValue,
          label: this.valueFormatter
            ? this.valueFormatter(roundedValue)
            : roundedValue.toString(),
          percentage,
        });
      }

      return ticks;
    },
  },

  mounted() {
    // 添加全局事件监听器
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd);
  },

  beforeDestroy() {
    // 移除全局事件监听器
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);
  },

  methods: {
    /**
     * 从事件位置计算值
     */
    getValueFromPosition(clientX) {
      if (!this.$refs.track) return this.value;

      const trackRect = this.$refs.track.getBoundingClientRect();
      const trackWidth = trackRect.width;
      const trackLeft = trackRect.left;

      // 计算相对位置（0-1）
      let relativePosition = (clientX - trackLeft) / trackWidth;
      relativePosition = Math.min(Math.max(relativePosition, 0), 1);

      // 计算值
      const range = this.max - this.min;
      let newValue = this.min + range * relativePosition;

      // 应用步长
      if (this.step > 0) {
        newValue = Math.round(newValue / this.step) * this.step;
      }

      // 确保在范围内
      newValue = Math.min(Math.max(newValue, this.min), this.max);

      // 应用精度
      if (this.precision >= 0) {
        newValue = Number(newValue.toFixed(this.precision));
      }

      return newValue;
    },

    /**
     * 设置值
     */
    setValue(newValue) {
      if (this.disabled) return;

      // 确保在范围内
      newValue = Math.min(Math.max(newValue, this.min), this.max);

      // 应用步长
      if (this.step > 0) {
        newValue = Math.round(newValue / this.step) * this.step;
      }

      // 应用精度
      if (this.precision >= 0) {
        newValue = Number(newValue.toFixed(this.precision));
      }

      // 如果值没有变化，不触发事件
      if (newValue === this.value) return;

      // 触发事件
      this.$emit("input", newValue);
      this.$emit("change", newValue);
    },

    /**
     * 从刻度设置值
     */
    setValueFromTick(tickValue) {
      if (this.disabled) return;
      this.setValue(tickValue);
    },

    /**
     * 重置为默认值
     */
    resetValue() {
      if (this.disabled) return;
      this.setValue(this.defaultValue);
      this.$emit("reset");
    },

    /**
     * 处理轨道鼠标按下事件
     */
    handleTrackMouseDown(event) {
      if (this.disabled) return;

      // 设置值
      const newValue = this.getValueFromPosition(event.clientX);
      this.setValue(newValue);

      // 开始拖动
      this.isDragging = true;

      // 阻止默认行为和冒泡
      event.preventDefault();
      event.stopPropagation();
    },

    /**
     * 处理手柄鼠标按下事件
     */
    handleHandleMouseDown(event) {
      if (this.disabled) return;

      // 开始拖动
      this.isDragging = true;

      // 阻止默认行为和冒泡
      event.preventDefault();
      event.stopPropagation();
    },

    /**
     * 处理鼠标移动事件
     */
    handleMouseMove(event) {
      if (!this.isDragging) return;

      // 设置值
      const newValue = this.getValueFromPosition(event.clientX);
      this.setValue(newValue);

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理鼠标松开事件
     */
    handleMouseUp() {
      if (!this.isDragging) return;

      // 结束拖动
      this.isDragging = false;

      // 触发完成事件
      this.$emit("change-complete", this.value);
    },

    /**
     * 处理轨道触摸开始事件
     */
    handleTrackTouchStart(event) {
      if (this.disabled) return;

      // 设置值
      const touch = event.touches[0];
      const newValue = this.getValueFromPosition(touch.clientX);
      this.setValue(newValue);

      // 开始拖动
      this.isDragging = true;

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理手柄触摸开始事件
     */
    handleHandleTouchStart(event) {
      if (this.disabled) return;

      // 开始拖动
      this.isDragging = true;

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理触摸移动事件
     */
    handleTouchMove(event) {
      if (!this.isDragging) return;

      // 设置值
      const touch = event.touches[0];
      const newValue = this.getValueFromPosition(touch.clientX);
      this.setValue(newValue);

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理触摸结束事件
     */
    handleTouchEnd() {
      if (!this.isDragging) return;

      // 结束拖动
      this.isDragging = false;

      // 触发完成事件
      this.$emit("change-complete", this.value);
    },

    /**
     * 处理手柄键盘事件
     */
    handleHandleKeyDown(event) {
      if (this.disabled) return;

      let newValue = this.value;

      switch (event.key) {
        case "ArrowLeft":
        case "ArrowDown":
          newValue = Math.max(this.value - this.step, this.min);
          break;
        case "ArrowRight":
        case "ArrowUp":
          newValue = Math.min(this.value + this.step, this.max);
          break;
        case "Home":
          newValue = this.min;
          break;
        case "End":
          newValue = this.max;
          break;
        case "PageDown":
          newValue = Math.max(this.value - this.step * 10, this.min);
          break;
        case "PageUp":
          newValue = Math.min(this.value + this.step * 10, this.max);
          break;
        default:
          return;
      }

      // 设置值
      this.setValue(newValue);

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理输入框变化事件
     */
    handleInputChange(event) {
      this.isInputFocused = true;
      this.inputValue = event.target.value;

      // 尝试转换为数字
      const newValue = parseFloat(event.target.value);

      // 如果是有效数字，设置值
      if (!isNaN(newValue)) {
        this.setValue(newValue);
      }
    },

    /**
     * 处理输入框失焦事件
     */
    handleInputBlur() {
      this.isInputFocused = false;
      this.inputValue = null;

      // 触发完成事件
      this.$emit("change-complete", this.value);
    },
  },
};
</script>

<style scoped>
.slider-control {
  width: 100%;
  padding: 8px 0;
  box-sizing: border-box;
  user-select: none;
}

/* 变体样式 */
.slider-control.variant-default {
  --slider-track-color: #e9e9e9;
  --slider-fill-color: #1890ff;
  --slider-handle-color: #fff;
  --slider-handle-border: #1890ff;
  --slider-tick-color: #d9d9d9;
  --slider-tick-active-color: #1890ff;
}

.slider-control.variant-primary {
  --slider-track-color: #e9e9e9;
  --slider-fill-color: #1890ff;
  --slider-handle-color: #fff;
  --slider-handle-border: #1890ff;
  --slider-tick-color: #d9d9d9;
  --slider-tick-active-color: #1890ff;
}

.slider-control.variant-success {
  --slider-track-color: #e9e9e9;
  --slider-fill-color: #52c41a;
  --slider-handle-color: #fff;
  --slider-handle-border: #52c41a;
  --slider-tick-color: #d9d9d9;
  --slider-tick-active-color: #52c41a;
}

.slider-control.variant-warning {
  --slider-track-color: #e9e9e9;
  --slider-fill-color: #faad14;
  --slider-handle-color: #fff;
  --slider-handle-border: #faad14;
  --slider-tick-color: #d9d9d9;
  --slider-tick-active-color: #faad14;
}

.slider-control.variant-danger {
  --slider-track-color: #e9e9e9;
  --slider-fill-color: #ff4d4f;
  --slider-handle-color: #fff;
  --slider-handle-border: #ff4d4f;
  --slider-tick-color: #d9d9d9;
  --slider-tick-active-color: #ff4d4f;
}

/* 尺寸样式 */
.slider-control.size-small {
  --slider-track-height: 4px;
  --slider-handle-size: 12px;
  --slider-tick-size: 6px;
  font-size: 12px;
}

.slider-control.size-medium {
  --slider-track-height: 6px;
  --slider-handle-size: 16px;
  --slider-tick-size: 8px;
  font-size: 14px;
}

.slider-control.size-large {
  --slider-track-height: 8px;
  --slider-handle-size: 20px;
  --slider-tick-size: 10px;
  font-size: 16px;
}

/* 标签和值显示 */
.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.slider-label {
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
}

.slider-tooltip {
  margin-left: 4px;
  color: #999;
  cursor: help;
}

.slider-value-display {
  display: flex;
  align-items: center;
}

.value-text {
  color: #333;
  min-width: 30px;
  text-align: right;
}

.value-input {
  width: 50px;
  height: 24px;
  padding: 0 4px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  text-align: right;
  font-size: inherit;
}

.value-input:focus {
  border-color: var(--slider-fill-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.reset-button {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px;
  margin-left: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-button:hover {
  color: var(--slider-fill-color);
}

/* 滑块轨道 */
.slider-track-container {
  position: relative;
  padding: 8px 0;
}

.slider-track {
  height: var(--slider-track-height);
  background-color: var(--slider-track-color);
  border-radius: var(--slider-track-height);
  position: relative;
  cursor: pointer;
}

.slider-track-fill {
  height: 100%;
  background-color: var(--slider-fill-color);
  border-radius: var(--slider-track-height);
  position: absolute;
  top: 0;
  left: 0;
}

.slider-handle {
  width: var(--slider-handle-size);
  height: var(--slider-handle-size);
  background-color: var(--slider-handle-color);
  border: 2px solid var(--slider-handle-border);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.2s;
}

.slider-handle:hover,
.slider-handle:focus {
  box-shadow: 0 0 0 5px rgba(24, 144, 255, 0.2);
  outline: none;
}

.dragging .slider-handle {
  cursor: grabbing;
  box-shadow: 0 0 0 5px rgba(24, 144, 255, 0.2);
}

/* 刻度标记 */
.slider-ticks {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
}

.slider-tick {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tick-mark {
  width: var(--slider-tick-size);
  height: var(--slider-tick-size);
  border-radius: 50%;
  background-color: var(--slider-tick-color);
  margin-bottom: 4px;
}

.slider-tick.active .tick-mark {
  background-color: var(--slider-tick-active-color);
}

.tick-label {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.slider-tick.active .tick-label {
  color: var(--slider-tick-active-color);
}

/* 预设值 */
.slider-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.preset-button {
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-button:hover {
  border-color: var(--slider-fill-color);
  color: var(--slider-fill-color);
}

.preset-button.active {
  background-color: var(--slider-fill-color);
  border-color: var(--slider-fill-color);
  color: #fff;
}

/* 禁用状态 */
.slider-control.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.slider-control.disabled .slider-track,
.slider-control.disabled .slider-handle,
.slider-control.disabled .slider-tick {
  cursor: not-allowed;
}

.slider-control.disabled .slider-handle:hover,
.slider-control.disabled .slider-handle:focus {
  box-shadow: none;
}

/* 图标样式 */
.icon-info::before {
  content: "ⓘ";
  font-size: 12px;
}

.icon-reset::before {
  content: "↺";
  font-size: 14px;
}
</style>
