<template>
  <div class="ui-components-demo">
    <div class="demo-header">
      <h1>UI组件库演示</h1>
      <p>展示图像编辑器UI组件的基本功能和样式</p>
    </div>

    <!-- EditorContainer演示 -->
    <div class="demo-section">
      <h2>EditorContainer 编辑器容器</h2>
      <div class="demo-controls">
        <tool-button
          :active="containerTheme === 'dark'"
          @click="toggleTheme"
          icon="settings"
          label="切换主题"
          size="small"
        />
        <tool-button
          @click="toggleLoading"
          icon="settings"
          :label="containerLoading ? '停止加载' : '显示加载'"
          size="small"
        />
        <tool-button
          @click="resetContainer"
          icon="undo"
          label="重置容器"
          size="small"
        />
      </div>

      <div class="demo-container">
        <editor-container
          :theme="containerTheme"
          :loading="containerLoading"
          loading-text="正在加载编辑器..."
          :left-sidebar-width="280"
          :right-sidebar-width="320"
          @dimensions-change="handleDimensionsChange"
          @sidebar-toggle="handleSidebarToggle"
        >
          <!-- 顶部工具栏 -->
          <template #toolbar-top>
            <div class="demo-toolbar">
              <div class="toolbar-group">
                <tool-button
                  icon="save"
                  label="保存"
                  variant="primary"
                  size="small"
                />
                <tool-button icon="copy" label="复制" size="small" />
                <tool-button icon="cut" label="剪切" size="small" />
                <tool-button icon="paste" label="粘贴" size="small" />
              </div>
              <div class="toolbar-group">
                <tool-button icon="undo" label="撤销" size="small" />
                <tool-button icon="redo" label="重做" size="small" />
              </div>
              <div class="toolbar-group">
                <tool-button icon="zoom-in" label="放大" size="small" />
                <tool-button icon="zoom-out" label="缩小" size="small" />
              </div>
            </div>
          </template>

          <!-- 左侧边栏 -->
          <template #sidebar-left>
            <div class="demo-sidebar">
              <h3>工具面板</h3>
              <div class="tool-group">
                <h4>基础工具</h4>
                <div class="tool-grid">
                  <tool-button icon="brush" shape="circle" size="large" />
                  <tool-button icon="eraser" shape="circle" size="large" />
                  <tool-button icon="text" shape="circle" size="large" />
                  <tool-button icon="shape" shape="circle" size="large" />
                </div>
              </div>
              <div class="tool-group">
                <h4>变换工具</h4>
                <div class="tool-grid">
                  <tool-button icon="rotate" shape="circle" size="large" />
                  <tool-button icon="flip" shape="circle" size="large" />
                  <tool-button icon="crop" shape="circle" size="large" />
                  <tool-button icon="filter" shape="circle" size="large" />
                </div>
              </div>
            </div>
          </template>

          <!-- 画布区域 -->
          <template #canvas>
            <div class="demo-canvas">
              <div class="canvas-placeholder">
                <div class="placeholder-content">
                  <h3>画布区域</h3>
                  <p>这里是图像编辑的主要区域</p>
                  <p>
                    尺寸: {{ canvasDimensions.width }} ×
                    {{ canvasDimensions.height }}
                  </p>
                  <p>设备类型: {{ deviceType }}</p>
                </div>
              </div>
            </div>
          </template>

          <!-- 右侧边栏 -->
          <template #sidebar-right>
            <div class="demo-sidebar">
              <h3>属性面板</h3>
              <div class="property-group">
                <h4>图层</h4>
                <div class="layer-list">
                  <div class="layer-item active">
                    <span>背景图层</span>
                    <tool-button icon="settings" size="small" variant="ghost" />
                  </div>
                  <div class="layer-item">
                    <span>文本图层</span>
                    <tool-button icon="settings" size="small" variant="ghost" />
                  </div>
                </div>
              </div>
              <div class="property-group">
                <h4>历史记录</h4>
                <div class="history-list">
                  <div class="history-item">加载图像</div>
                  <div class="history-item active">调整亮度</div>
                  <div class="history-item">添加文本</div>
                </div>
              </div>
            </div>
          </template>

          <!-- 状态栏 -->
          <template #status-bar>
            <div class="demo-status-bar">
              <span>就绪</span>
              <span>缩放: 100%</span>
              <span>位置: (0, 0)</span>
              <span>{{ new Date().toLocaleTimeString() }}</span>
            </div>
          </template>
        </editor-container>
      </div>
    </div>

    <!-- ToolButton演示 -->
    <div class="demo-section">
      <h2>ToolButton 工具按钮</h2>

      <div class="button-demo-group">
        <h3>按钮变体</h3>
        <div class="button-row">
          <tool-button label="默认" variant="default" />
          <tool-button label="主要" variant="primary" />
          <tool-button label="次要" variant="secondary" />
          <tool-button label="成功" variant="success" />
          <tool-button label="警告" variant="warning" />
          <tool-button label="危险" variant="danger" />
          <tool-button label="信息" variant="info" />
          <tool-button label="幽灵" variant="ghost" />
          <tool-button label="链接" variant="link" />
        </div>
      </div>

      <div class="button-demo-group">
        <h3>按钮尺寸</h3>
        <div class="button-row">
          <tool-button label="小号" size="small" />
          <tool-button label="中号" size="medium" />
          <tool-button label="大号" size="large" />
        </div>
      </div>

      <div class="button-demo-group">
        <h3>按钮形状</h3>
        <div class="button-row">
          <tool-button label="默认" shape="default" />
          <tool-button label="圆角" shape="round" />
          <tool-button icon="settings" shape="circle" />
        </div>
      </div>

      <div class="button-demo-group">
        <h3>图标按钮</h3>
        <div class="button-row">
          <tool-button icon="edit" label="编辑" />
          <tool-button icon="delete" label="删除" variant="danger" />
          <tool-button icon="save" label="保存" variant="primary" />
          <tool-button icon="copy" />
          <tool-button icon="settings" shape="circle" />
        </div>
      </div>

      <div class="button-demo-group">
        <h3>按钮状态</h3>
        <div class="button-row">
          <tool-button label="正常" />
          <tool-button label="激活" :active="true" />
          <tool-button label="禁用" :disabled="true" />
          <tool-button
            label="加载中"
            :loading="buttonLoading"
            @click="toggleButtonLoading"
          />
          <tool-button
            label="切换"
            :toggle="true"
            v-model:active="toggleActive"
          />
        </div>
      </div>

      <div class="button-demo-group">
        <h3>特殊功能</h3>
        <div class="button-row">
          <tool-button label="下拉菜单" :dropdown="true" />
          <tool-button label="徽章" badge="3" />
          <tool-button icon="settings" badge="99+" badge-type="danger" />
          <tool-button
            label="主要徽章"
            variant="primary"
            badge="NEW"
            badge-type="success"
          />
        </div>
      </div>
    </div>

    <!-- 组合演示 -->
    <div class="demo-section">
      <h2>组合演示</h2>
      <div class="combo-demo">
        <div class="toolbar-demo">
          <h3>工具栏组合</h3>
          <div class="demo-toolbar">
            <div class="toolbar-group">
              <tool-button icon="save" variant="primary" size="small" />
              <tool-button icon="copy" size="small" />
              <tool-button icon="cut" size="small" />
              <tool-button icon="paste" size="small" />
            </div>
            <div class="toolbar-separator"></div>
            <div class="toolbar-group">
              <tool-button icon="undo" size="small" />
              <tool-button icon="redo" size="small" />
            </div>
            <div class="toolbar-separator"></div>
            <div class="toolbar-group">
              <tool-button icon="zoom-in" size="small" />
              <tool-button icon="zoom-out" size="small" />
              <tool-button label="100%" size="small" variant="ghost" />
            </div>
          </div>
        </div>

        <div class="tool-palette-demo">
          <h3>工具调色板</h3>
          <div class="tool-palette">
            <tool-button
              icon="brush"
              shape="circle"
              :active="activeTool === 'brush'"
              @click="setActiveTool('brush')"
            />
            <tool-button
              icon="eraser"
              shape="circle"
              :active="activeTool === 'eraser'"
              @click="setActiveTool('eraser')"
            />
            <tool-button
              icon="text"
              shape="circle"
              :active="activeTool === 'text'"
              @click="setActiveTool('text')"
            />
            <tool-button
              icon="shape"
              shape="circle"
              :active="activeTool === 'shape'"
              @click="setActiveTool('shape')"
            />
            <tool-button
              icon="eyedropper"
              shape="circle"
              :active="activeTool === 'eyedropper'"
              @click="setActiveTool('eyedropper')"
            />
            <tool-button
              icon="crop"
              shape="circle"
              :active="activeTool === 'crop'"
              @click="setActiveTool('crop')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EditorContainer from "@/components/ui/EditorContainer.vue";
import ToolButton from "@/components/ui/ToolButton.vue";

export default {
  name: "UIComponentsDemo",
  components: {
    EditorContainer,
    ToolButton,
  },

  data() {
    return {
      // 容器状态
      containerTheme: "light",
      containerLoading: false,
      canvasDimensions: {
        width: 0,
        height: 0,
      },
      deviceType: "desktop",

      // 按钮状态
      buttonLoading: false,
      toggleActive: false,
      activeTool: "brush",
    };
  },

  methods: {
    toggleTheme() {
      this.containerTheme = this.containerTheme === "light" ? "dark" : "light";
    },

    toggleLoading() {
      this.containerLoading = !this.containerLoading;

      if (this.containerLoading) {
        // 3秒后自动停止加载
        setTimeout(() => {
          this.containerLoading = false;
        }, 3000);
      }
    },

    resetContainer() {
      this.containerTheme = "light";
      this.containerLoading = false;
    },

    toggleButtonLoading() {
      this.buttonLoading = !this.buttonLoading;

      if (this.buttonLoading) {
        // 2秒后自动停止加载
        setTimeout(() => {
          this.buttonLoading = false;
        }, 2000);
      }
    },

    setActiveTool(tool) {
      this.activeTool = tool;
    },

    handleDimensionsChange(dimensions) {
      this.canvasDimensions = {
        width: Math.round(dimensions.canvasWidth),
        height: Math.round(dimensions.canvasHeight),
      };

      if (dimensions.isMobile) {
        this.deviceType = "mobile";
      } else if (dimensions.isTablet) {
        this.deviceType = "tablet";
      } else {
        this.deviceType = "desktop";
      }
    },

    handleSidebarToggle(data) {
      console.log("侧边栏切换:", data);
    },
  },
};
</script>

<style scoped>
.ui-components-demo {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-header h1 {
  color: #333;
  margin-bottom: 10px;
}

.demo-header p {
  color: #666;
  font-size: 16px;
}

.demo-section {
  margin-bottom: 40px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-section h2 {
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #007bff;
}

.demo-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.demo-container {
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

/* 工具栏样式 */
.demo-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
}

.toolbar-group {
  display: flex;
  gap: 4px;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: #ddd;
  margin: 0 8px;
}

/* 侧边栏样式 */
.demo-sidebar {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.demo-sidebar h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.tool-group {
  margin-bottom: 24px;
}

.tool-group h4 {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.property-group {
  margin-bottom: 20px;
}

.property-group h4 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.layer-list,
.history-list {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.layer-item,
.history-item {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.layer-item:last-child,
.history-item:last-child {
  border-bottom: none;
}

.layer-item.active,
.history-item.active {
  background: #e6f7ff;
  color: #1890ff;
}

/* 画布样式 */
.demo-canvas {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-placeholder {
  text-align: center;
  color: #666;
}

.placeholder-content h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.placeholder-content p {
  margin: 5px 0;
  font-size: 14px;
}

/* 状态栏样式 */
.demo-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

/* 按钮演示样式 */
.button-demo-group {
  margin-bottom: 30px;
}

.button-demo-group h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

/* 组合演示样式 */
.combo-demo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.toolbar-demo,
.tool-palette-demo {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafafa;
}

.toolbar-demo h3,
.tool-palette-demo h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.tool-palette {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .ui-components-demo {
    padding: 10px;
  }

  .demo-container {
    height: 400px;
  }

  .combo-demo {
    grid-template-columns: 1fr;
  }

  .button-row {
    justify-content: center;
  }

  .demo-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
