<template>
  <div class="editor-container" :class="containerClasses" ref="container">
    <!-- 顶部工具栏区域 -->
    <div v-if="$slots['toolbar-top']" class="editor-toolbar-top">
      <slot name="toolbar-top"></slot>
    </div>

    <!-- 主要内容区域 -->
    <div class="editor-main">
      <!-- 左侧边栏 -->
      <div
        v-if="$slots['sidebar-left']"
        class="editor-sidebar editor-sidebar-left"
        :class="{ collapsed: leftSidebarCollapsed }"
        :style="{ width: leftSidebarCollapsed ? '0' : leftSidebarWidth + 'px' }"
      >
        <div class="sidebar-content">
          <slot name="sidebar-left"></slot>
        </div>
        <div
          class="sidebar-toggle sidebar-toggle-left"
          @click="toggleLeftSidebar"
          :title="leftSidebarCollapsed ? '展开左侧栏' : '收起左侧栏'"
        >
          <i
            :class="
              leftSidebarCollapsed ? 'icon-chevron-right' : 'icon-chevron-left'
            "
          ></i>
        </div>
      </div>

      <!-- 中央编辑区域 -->
      <div class="editor-content" ref="editorContent">
        <!-- 顶部工具栏（内容区域内） -->
        <div v-if="$slots['content-toolbar']" class="editor-content-toolbar">
          <slot name="content-toolbar"></slot>
        </div>

        <!-- 画布容器 -->
        <div class="editor-canvas-container" ref="canvasContainer">
          <div class="canvas-wrapper">
            <slot name="canvas"></slot>
          </div>

          <!-- 画布覆盖层 -->
          <div v-if="$slots['canvas-overlay']" class="canvas-overlay">
            <slot name="canvas-overlay"></slot>
          </div>
        </div>

        <!-- 底部工具栏（内容区域内） -->
        <div
          v-if="$slots['content-toolbar-bottom']"
          class="editor-content-toolbar-bottom"
        >
          <slot name="content-toolbar-bottom"></slot>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div
        v-if="$slots['sidebar-right']"
        class="editor-sidebar editor-sidebar-right"
        :class="{ collapsed: rightSidebarCollapsed }"
        :style="{
          width: rightSidebarCollapsed ? '0' : rightSidebarWidth + 'px',
        }"
      >
        <div
          class="sidebar-toggle sidebar-toggle-right"
          @click="toggleRightSidebar"
          :title="rightSidebarCollapsed ? '展开右侧栏' : '收起右侧栏'"
        >
          <i
            :class="
              rightSidebarCollapsed ? 'icon-chevron-left' : 'icon-chevron-right'
            "
          ></i>
        </div>
        <div class="sidebar-content">
          <slot name="sidebar-right"></slot>
        </div>
      </div>
    </div>

    <!-- 底部状态栏区域 -->
    <div v-if="$slots['status-bar']" class="editor-status-bar">
      <slot name="status-bar"></slot>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="editor-loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">{{ loadingText }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EditorContainer",
  props: {
    // 响应式断点
    mobileBreakpoint: {
      type: Number,
      default: 768,
    },
    tabletBreakpoint: {
      type: Number,
      default: 1024,
    },

    // 侧边栏宽度
    leftSidebarWidth: {
      type: Number,
      default: 280,
    },
    rightSidebarWidth: {
      type: Number,
      default: 320,
    },

    // 侧边栏初始状态
    leftSidebarInitialCollapsed: {
      type: Boolean,
      default: false,
    },
    rightSidebarInitialCollapsed: {
      type: Boolean,
      default: false,
    },

    // 加载状态
    loading: {
      type: Boolean,
      default: false,
    },
    loadingText: {
      type: String,
      default: "加载中...",
    },

    // 主题
    theme: {
      type: String,
      default: "light",
      validator: (value) => ["light", "dark"].includes(value),
    },
  },

  data() {
    return {
      // 容器尺寸
      containerWidth: 0,
      containerHeight: 0,

      // 设备类型
      isMobile: false,
      isTablet: false,
      isDesktop: true,

      // 侧边栏状态
      leftSidebarCollapsed: this.leftSidebarInitialCollapsed,
      rightSidebarCollapsed: this.rightSidebarInitialCollapsed,

      // 画布容器尺寸
      canvasContainerWidth: 0,
      canvasContainerHeight: 0,

      // 调整大小观察器
      resizeObserver: null,

      // 防抖相关
      resizeTimeout: null,
      isUpdatingDimensions: false,
    };
  },

  computed: {
    containerClasses() {
      return {
        "mobile-view": this.isMobile,
        "tablet-view": this.isTablet,
        "desktop-view": this.isDesktop,
        [`theme-${this.theme}`]: true,
        loading: this.loading,
      };
    },

    availableWidth() {
      let width = this.containerWidth;
      if (!this.leftSidebarCollapsed) {
        width -= this.leftSidebarWidth;
      }
      if (!this.rightSidebarCollapsed) {
        width -= this.rightSidebarWidth;
      }
      return Math.max(0, width);
    },

    availableHeight() {
      return this.containerHeight;
    },
  },

  mounted() {
    this.initializeContainer();
    this.setupResizeObserver();
    this.updateDimensions();

    // 监听窗口大小变化
    window.addEventListener("resize", this.handleWindowResize);
  },

  beforeDestroy() {
    this.cleanup();
  },

  methods: {
    /**
     * 初始化容器
     */
    initializeContainer() {
      // 在移动设备上默认收起侧边栏
      if (this.isMobile) {
        this.leftSidebarCollapsed = true;
        this.rightSidebarCollapsed = true;
      }
    },

    /**
     * 设置尺寸观察器
     */
    setupResizeObserver() {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver((entries) => {
          // 防抖处理，避免频繁调用
          if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
          }

          this.resizeTimeout = setTimeout(() => {
            for (const entry of entries) {
              if (entry.target === this.$refs.container) {
                this.updateDimensions();
              } else if (entry.target === this.$refs.canvasContainer) {
                this.updateCanvasDimensions();
              }
            }
          }, 50); // 50ms防抖延迟
        });

        this.resizeObserver.observe(this.$refs.container);
        // 延迟观察画布容器，避免初始化时的冲突
        this.$nextTick(() => {
          if (this.$refs.canvasContainer) {
            this.resizeObserver.observe(this.$refs.canvasContainer);
          }
        });
      }
    },

    /**
     * 更新容器尺寸
     */
    updateDimensions() {
      if (!this.$refs.container || this.isUpdatingDimensions) return;

      this.isUpdatingDimensions = true;

      try {
        const rect = this.$refs.container.getBoundingClientRect();
        const newWidth = rect.width;
        const newHeight = rect.height;

        // 只在尺寸真正变化时更新
        if (
          newWidth !== this.containerWidth ||
          newHeight !== this.containerHeight
        ) {
          this.containerWidth = newWidth;
          this.containerHeight = newHeight;

          // 更新设备类型
          this.updateDeviceType();

          // 触发尺寸变化事件
          this.$emit("dimensions-change", {
            containerWidth: this.containerWidth,
            containerHeight: this.containerHeight,
            availableWidth: this.availableWidth,
            availableHeight: this.availableHeight,
            canvasWidth: this.canvasContainerWidth,
            canvasHeight: this.canvasContainerHeight,
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isDesktop: this.isDesktop,
          });
        }
      } catch (error) {
        console.error("更新容器尺寸失败:", error);
      } finally {
        this.isUpdatingDimensions = false;
      }
    },

    /**
     * 更新画布容器尺寸
     */
    updateCanvasDimensions() {
      if (!this.$refs.canvasContainer || this.isUpdatingDimensions) return;

      try {
        const rect = this.$refs.canvasContainer.getBoundingClientRect();
        const newWidth = rect.width;
        const newHeight = rect.height;

        // 只在尺寸真正变化时更新
        if (
          newWidth !== this.canvasContainerWidth ||
          newHeight !== this.canvasContainerHeight
        ) {
          this.canvasContainerWidth = newWidth;
          this.canvasContainerHeight = newHeight;
        }
      } catch (error) {
        console.error("更新画布容器尺寸失败:", error);
      }
    },

    /**
     * 更新设备类型
     */
    updateDeviceType() {
      this.isMobile = this.containerWidth < this.mobileBreakpoint;
      this.isTablet =
        this.containerWidth >= this.mobileBreakpoint &&
        this.containerWidth < this.tabletBreakpoint;
      this.isDesktop = this.containerWidth >= this.tabletBreakpoint;

      // 在移动设备上自动收起侧边栏
      if (this.isMobile) {
        this.leftSidebarCollapsed = true;
        this.rightSidebarCollapsed = true;
      }
    },

    /**
     * 切换左侧边栏
     */
    toggleLeftSidebar() {
      this.leftSidebarCollapsed = !this.leftSidebarCollapsed;
      this.$emit("sidebar-toggle", {
        side: "left",
        collapsed: this.leftSidebarCollapsed,
      });

      // 延迟更新尺寸，等待动画完成
      setTimeout(() => {
        this.updateDimensions();
      }, 300);
    },

    /**
     * 切换右侧边栏
     */
    toggleRightSidebar() {
      this.rightSidebarCollapsed = !this.rightSidebarCollapsed;
      this.$emit("sidebar-toggle", {
        side: "right",
        collapsed: this.rightSidebarCollapsed,
      });

      // 延迟更新尺寸，等待动画完成
      setTimeout(() => {
        this.updateDimensions();
      }, 300);
    },

    /**
     * 获取画布容器引用
     */
    getCanvasContainer() {
      return this.$refs.canvasContainer;
    },

    /**
     * 获取编辑内容区域引用
     */
    getEditorContent() {
      return this.$refs.editorContent;
    },

    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
      // 防抖处理
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.updateDimensions();
      }, 100);
    },

    /**
     * 清理资源
     */
    cleanup() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      window.removeEventListener("resize", this.handleWindowResize);

      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
    },
  },
};
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 400px;
  background-color: var(--editor-bg-color, #f5f5f5);
  color: var(--editor-text-color, #333);
  font-family: var(
    --editor-font-family,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif
  );
  position: relative;
  overflow: hidden;
}

/* 主题样式 */
.editor-container.theme-light {
  --editor-bg-color: #f5f5f5;
  --editor-text-color: #333;
  --editor-border-color: #ddd;
  --editor-sidebar-bg: #fff;
  --editor-toolbar-bg: #fff;
  --editor-canvas-bg: #fff;
  --editor-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.editor-container.theme-dark {
  --editor-bg-color: #1e1e1e;
  --editor-text-color: #fff;
  --editor-border-color: #444;
  --editor-sidebar-bg: #2d2d2d;
  --editor-toolbar-bg: #2d2d2d;
  --editor-canvas-bg: #2d2d2d;
  --editor-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 工具栏样式 */
.editor-toolbar-top {
  flex-shrink: 0;
  background-color: var(--editor-toolbar-bg);
  border-bottom: 1px solid var(--editor-border-color);
  box-shadow: var(--editor-shadow);
  z-index: 100;
}

/* 主要内容区域 */
.editor-main {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 侧边栏样式 */
.editor-sidebar {
  flex-shrink: 0;
  background-color: var(--editor-sidebar-bg);
  border: 1px solid var(--editor-border-color);
  position: relative;
  transition: width 0.3s ease;
  overflow: hidden;
}

.editor-sidebar-left {
  border-right: none;
}

.editor-sidebar-right {
  border-left: none;
}

.editor-sidebar.collapsed {
  width: 0 !important;
  border-width: 0;
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 侧边栏切换按钮 */
.sidebar-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  background-color: var(--editor-sidebar-bg);
  border: 1px solid var(--editor-border-color);
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;
}

.sidebar-toggle:hover {
  background-color: var(--editor-border-color);
}

.sidebar-toggle-left {
  right: -20px;
}

.sidebar-toggle-right {
  left: -20px;
  border-radius: 4px 0 0 4px;
}

/* 编辑内容区域 */
.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: var(--editor-bg-color);
}

.editor-content-toolbar,
.editor-content-toolbar-bottom {
  flex-shrink: 0;
  background-color: var(--editor-toolbar-bg);
  border-bottom: 1px solid var(--editor-border-color);
  padding: 8px;
}

.editor-content-toolbar-bottom {
  border-bottom: none;
  border-top: 1px solid var(--editor-border-color);
}

/* 画布容器 */
.editor-canvas-container {
  flex: 1;
  position: relative;
  background-color: var(--editor-canvas-bg);
  overflow: hidden;
  min-height: 200px;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

/* 状态栏 */
.editor-status-bar {
  flex-shrink: 0;
  background-color: var(--editor-toolbar-bg);
  border-top: 1px solid var(--editor-border-color);
  padding: 4px 12px;
  font-size: 12px;
  color: var(--editor-text-color);
}

/* 加载遮罩 */
.editor-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.theme-dark .editor-loading-overlay {
  background-color: rgba(0, 0, 0, 0.8);
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--editor-border-color);
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

.loading-text {
  color: var(--editor-text-color);
  font-size: 14px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式样式 */
.editor-container.mobile-view .editor-main {
  flex-direction: column;
}

.editor-container.mobile-view .editor-sidebar {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 200;
  box-shadow: var(--editor-shadow);
}

.editor-container.mobile-view .editor-sidebar-left {
  left: 0;
}

.editor-container.mobile-view .editor-sidebar-right {
  right: 0;
}

.editor-container.tablet-view .sidebar-toggle {
  display: block;
}

/* 图标样式 */
.icon-chevron-left::before {
  content: "‹";
  font-size: 16px;
  font-weight: bold;
}

.icon-chevron-right::before {
  content: "›";
  font-size: 16px;
  font-weight: bold;
}

/* 滚动条样式 */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: var(--editor-bg-color);
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: var(--editor-border-color);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
