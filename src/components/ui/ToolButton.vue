<template>
  <button
    :type="buttonType"
    class="tool-button"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :title="tooltip || label"
    :aria-label="ariaLabel || label"
    @click="handleClick"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <!-- 图标 -->
    <span v-if="icon && iconPosition === 'left'" class="button-icon icon-left">
      <i :class="iconClass"></i>
    </span>
    
    <!-- 加载状态 -->
    <span v-if="loading" class="button-loading">
      <i class="loading-spinner"></i>
    </span>
    
    <!-- 文本标签 -->
    <span 
      v-if="label && (showLabel || !icon || loading)" 
      class="button-label"
      :class="{ 'with-icon': icon && !loading }"
    >
      {{ label }}
    </span>
    
    <!-- 右侧图标 -->
    <span v-if="icon && iconPosition === 'right' && !loading" class="button-icon icon-right">
      <i :class="iconClass"></i>
    </span>
    
    <!-- 下拉箭头 -->
    <span v-if="dropdown" class="button-dropdown">
      <i class="icon-chevron-down"></i>
    </span>
    
    <!-- 徽章 -->
    <span v-if="badge" class="button-badge" :class="badgeType">
      {{ badge }}
    </span>
  </button>
</template>

<script>
export default {
  name: 'ToolButton',
  props: {
    // 基本属性
    label: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    tooltip: {
      type: String,
      default: ''
    },
    
    // 状态
    active: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    
    // 样式
    variant: {
      type: String,
      default: 'default',
      validator: value => [
        'default', 'primary', 'secondary', 'success', 
        'warning', 'danger', 'info', 'ghost', 'link'
      ].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },
    shape: {
      type: String,
      default: 'default',
      validator: value => ['default', 'round', 'circle'].includes(value)
    },
    
    // 显示选项
    showLabel: {
      type: Boolean,
      default: true
    },
    iconPosition: {
      type: String,
      default: 'left',
      validator: value => ['left', 'right'].includes(value)
    },
    
    // 功能选项
    toggle: {
      type: Boolean,
      default: false
    },
    dropdown: {
      type: Boolean,
      default: false
    },
    
    // 徽章
    badge: {
      type: [String, Number],
      default: ''
    },
    badgeType: {
      type: String,
      default: 'default',
      validator: value => ['default', 'primary', 'success', 'warning', 'danger'].includes(value)
    },
    
    // HTML属性
    buttonType: {
      type: String,
      default: 'button',
      validator: value => ['button', 'submit', 'reset'].includes(value)
    },
    ariaLabel: {
      type: String,
      default: ''
    }
  },
  
  data() {
    return {
      isPressed: false,
      isHovered: false,
      isFocused: false
    };
  },
  
  computed: {
    buttonClasses() {
      return {
        // 变体样式
        [`variant-${this.variant}`]: true,
        
        // 尺寸样式
        [`size-${this.size}`]: true,
        
        // 形状样式
        [`shape-${this.shape}`]: true,
        
        // 状态样式
        'active': this.active,
        'disabled': this.disabled,
        'loading': this.loading,
        'pressed': this.isPressed,
        'hovered': this.isHovered,
        'focused': this.isFocused,
        
        // 功能样式
        'toggle-button': this.toggle,
        'dropdown-button': this.dropdown,
        'icon-only': this.icon && !this.showLabel && !this.label,
        'text-only': !this.icon && this.label,
        'has-badge': this.badge
      };
    },
    
    iconClass() {
      return `icon-${this.icon}`;
    }
  },
  
  methods: {
    handleClick(event) {
      if (this.disabled || this.loading) {
        event.preventDefault();
        return;
      }
      
      if (this.toggle) {
        this.$emit('update:active', !this.active);
      }
      
      this.$emit('click', event);
      
      if (this.dropdown) {
        this.$emit('dropdown-toggle', event);
      }
    },
    
    handleMouseDown(event) {
      this.isPressed = true;
      this.$emit('mousedown', event);
    },
    
    handleMouseUp(event) {
      this.isPressed = false;
      this.$emit('mouseup', event);
    },
    
    handleMouseEnter(event) {
      this.isHovered = true;
      this.$emit('mouseenter', event);
    },
    
    handleMouseLeave(event) {
      this.isHovered = false;
      this.$emit('mouseleave', event);
    },
    
    handleFocus(event) {
      this.isFocused = true;
      this.$emit('focus', event);
    },
    
    handleBlur(event) {
      this.isFocused = false;
      this.$emit('blur', event);
    }
  }
};
</script>

<style scoped>
.tool-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px solid transparent;
  border-radius: var(--button-border-radius, 4px);
  font-family: inherit;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  vertical-align: middle;
  white-space: nowrap;
  outline: none;
  box-sizing: border-box;
}

/* 尺寸样式 */
.tool-button.size-small {
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1.4;
  min-height: 24px;
}

.tool-button.size-medium {
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.5;
  min-height: 32px;
}

.tool-button.size-large {
  padding: 8px 16px;
  font-size: 16px;
  line-height: 1.6;
  min-height: 40px;
}

/* 形状样式 */
.tool-button.shape-round {
  border-radius: 16px;
}

.tool-button.shape-circle {
  border-radius: 50%;
  width: var(--button-circle-size, 32px);
  height: var(--button-circle-size, 32px);
  padding: 0;
}

.tool-button.shape-circle.size-small {
  --button-circle-size: 24px;
}

.tool-button.shape-circle.size-large {
  --button-circle-size: 40px;
}

/* 变体样式 */
.tool-button.variant-default {
  background-color: #fff;
  border-color: #d9d9d9;
  color: #333;
}

.tool-button.variant-default:hover:not(.disabled) {
  background-color: #f5f5f5;
  border-color: #40a9ff;
  color: #40a9ff;
}

.tool-button.variant-primary {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.tool-button.variant-primary:hover:not(.disabled) {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.tool-button.variant-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;
}

.tool-button.variant-secondary:hover:not(.disabled) {
  background-color: #5a6268;
  border-color: #545b62;
}

.tool-button.variant-success {
  background-color: #52c41a;
  border-color: #52c41a;
  color: #fff;
}

.tool-button.variant-success:hover:not(.disabled) {
  background-color: #73d13d;
  border-color: #73d13d;
}

.tool-button.variant-warning {
  background-color: #faad14;
  border-color: #faad14;
  color: #fff;
}

.tool-button.variant-warning:hover:not(.disabled) {
  background-color: #ffc53d;
  border-color: #ffc53d;
}

.tool-button.variant-danger {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
  color: #fff;
}

.tool-button.variant-danger:hover:not(.disabled) {
  background-color: #ff7875;
  border-color: #ff7875;
}

.tool-button.variant-info {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.tool-button.variant-info:hover:not(.disabled) {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.tool-button.variant-ghost {
  background-color: transparent;
  border-color: #d9d9d9;
  color: #333;
}

.tool-button.variant-ghost:hover:not(.disabled) {
  background-color: rgba(24, 144, 255, 0.1);
  border-color: #40a9ff;
  color: #40a9ff;
}

.tool-button.variant-link {
  background-color: transparent;
  border-color: transparent;
  color: #1890ff;
  padding-left: 0;
  padding-right: 0;
}

.tool-button.variant-link:hover:not(.disabled) {
  color: #40a9ff;
  text-decoration: underline;
}

/* 状态样式 */
.tool-button.active {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.tool-button.variant-ghost.active {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.tool-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tool-button.loading {
  cursor: default;
  pointer-events: none;
}

.tool-button.pressed {
  transform: translateY(1px);
}

.tool-button:focus {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 图标样式 */
.button-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button-icon.icon-left {
  margin-right: 4px;
}

.button-icon.icon-right {
  margin-left: 4px;
}

.tool-button.icon-only .button-icon {
  margin: 0;
}

/* 标签样式 */
.button-label {
  display: inline-block;
}

.button-label.with-icon {
  margin: 0 2px;
}

/* 加载状态 */
.button-loading {
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 下拉箭头 */
.button-dropdown {
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
}

/* 徽章 */
.button-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  background-color: #ff4d4f;
  color: #fff;
  font-weight: normal;
}

.button-badge.primary {
  background-color: #1890ff;
}

.button-badge.success {
  background-color: #52c41a;
}

.button-badge.warning {
  background-color: #faad14;
}

.button-badge.danger {
  background-color: #ff4d4f;
}

/* 图标字体 */
.icon-chevron-down::before {
  content: '▼';
  font-size: 10px;
}

/* 常用图标 */
.icon-edit::before { content: '✎'; }
.icon-delete::before { content: '🗑'; }
.icon-save::before { content: '💾'; }
.icon-copy::before { content: '📋'; }
.icon-cut::before { content: '✂'; }
.icon-paste::before { content: '📄'; }
.icon-undo::before { content: '↶'; }
.icon-redo::before { content: '↷'; }
.icon-zoom-in::before { content: '🔍+'; }
.icon-zoom-out::before { content: '🔍-'; }
.icon-rotate::before { content: '↻'; }
.icon-flip::before { content: '⇄'; }
.icon-crop::before { content: '⧉'; }
.icon-filter::before { content: '🎨'; }
.icon-text::before { content: 'T'; }
.icon-shape::before { content: '◯'; }
.icon-brush::before { content: '🖌'; }
.icon-eraser::before { content: '🧽'; }
.icon-eyedropper::before { content: '💧'; }
.icon-layers::before { content: '📚'; }
.icon-settings::before { content: '⚙'; }
.icon-help::before { content: '?'; }
.icon-close::before { content: '✕'; }
.icon-check::before { content: '✓'; }
.icon-plus::before { content: '+'; }
.icon-minus::before { content: '-'; }
.icon-arrow-left::before { content: '←'; }
.icon-arrow-right::before { content: '→'; }
.icon-arrow-up::before { content: '↑'; }
.icon-arrow-down::before { content: '↓'; }

/* 响应式样式 */
@media (max-width: 768px) {
  .tool-button {
    min-height: 36px;
  }
  
  .tool-button.size-small {
    min-height: 28px;
  }
  
  .tool-button.size-large {
    min-height: 44px;
  }
}
</style>
