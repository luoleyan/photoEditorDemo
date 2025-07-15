<template>
  <div class="advanced-ui-demo">
    <div class="demo-header">
      <h1>高级UI组件集成演示</h1>
      <p>展示EditorToolbar、SliderControl、ColorPicker、ImageAdjustmentPanel和TransformPanel的集成效果</p>
    </div>

    <!-- 完整编辑器演示 -->
    <div class="demo-section">
      <h2>完整图像编辑器界面</h2>

      <editor-container
        :theme="editorTheme"
        :loading="editorLoading"
        loading-text="正在处理图像..."
        @dimensions-change="handleDimensionsChange"
      >
        <!-- 顶部工具栏 -->
        <template #toolbar-top>
          <editor-toolbar
            :tool-groups="mainToolGroups"
            :active-tool-id="activeToolId"
            :disabled-tool-ids="disabledToolIds"
            :loading-tool-ids="loadingToolIds"
            @tool-click="handleToolClick"
          />
        </template>

        <!-- 左侧工具面板 -->
        <template #sidebar-left>
          <div class="tool-sidebar">
            <div class="sidebar-section">
              <h3>工具箱</h3>
              <editor-toolbar
                :tool-groups="toolPaletteGroups"
                :active-tool-id="activeToolId"
                direction="vertical"
                variant="minimal"
                :show-labels="false"
                @tool-click="handleToolClick"
              />
            </div>

            <div class="sidebar-section">
              <h3>颜色</h3>
              <div class="color-section">
                <div class="color-row">
                  <label>前景色:</label>
                  <color-picker
                    v-model="foregroundColor"
                    :show-alpha="true"
                    size="medium"
                    @change="handleForegroundColorChange"
                  />
                </div>
                <div class="color-row">
                  <label>背景色:</label>
                  <color-picker
                    v-model="backgroundColor"
                    size="medium"
                    @change="handleBackgroundColorChange"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 画布区域 -->
        <template #canvas>
          <div class="demo-canvas">
            <div class="canvas-content">
              <div class="image-placeholder">
                <h3>图像编辑区域</h3>
                <p>当前工具: {{ getToolName(activeToolId) }}</p>
                <p>前景色: <span class="color-sample" :style="{ backgroundColor: foregroundColor }"></span> {{ foregroundColor }}</p>
                <p>背景色: <span class="color-sample" :style="{ backgroundColor: backgroundColor }"></span> {{ backgroundColor }}</p>
                <div class="adjustment-preview">
                  <h4>当前调整:</h4>
                  <ul>
                    <li>亮度: {{ adjustmentValues.brightness }}%</li>
                    <li>对比度: {{ adjustmentValues.contrast }}%</li>
                    <li>饱和度: {{ adjustmentValues.saturation }}%</li>
                    <li>旋转: {{ transformValues.rotation }}°</li>
                    <li>缩放: {{ transformValues.scale.x }}x</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 右侧属性面板 -->
        <template #sidebar-right>
          <div class="properties-sidebar">
            <!-- 图像调整面板 -->
            <div class="sidebar-section">
              <image-adjustment-panel
                :show-presets="true"
                :presets="adjustmentPresets"
                @brightness-change="handleBrightnessChange"
                @contrast-change="handleContrastChange"
                @saturation-change="handleSaturationChange"
                @hue-change="handleHueChange"
                @reset-all="handleAdjustmentReset"
                @preset-applied="handleAdjustmentPresetApplied"
              />
            </div>

            <!-- 变换面板 -->
            <div class="sidebar-section">
              <transform-panel
                :show-presets="true"
                :presets="transformPresets"
                @rotation-change="handleRotationChange"
                @scale-change="handleScaleChange"
                @flip-change="handleFlipChange"
                @position-change="handlePositionChange"
                @reset-all="handleTransformReset"
                @preset-applied="handleTransformPresetApplied"
              />
            </div>
          </div>
        </template>

        <!-- 状态栏 -->
        <template #status-bar>
          <div class="editor-status">
            <span>就绪</span>
            <span>{{ canvasDimensions.width }} × {{ canvasDimensions.height }}</span>
            <span>缩放: {{ Math.round(transformValues.scale.x * 100) }}%</span>
            <span>{{ new Date().toLocaleTimeString() }}</span>
          </div>
        </template>
      </editor-container>
    </div>

    <!-- 单独组件演示 -->
    <div class="demo-section">
      <h2>EditorToolbar 编辑器工具栏</h2>

      <div class="toolbar-demo">
        <h3>水平工具栏</h3>
        <editor-toolbar
          :tool-groups="demoToolGroups"
          :active-tool-id="demoActiveToolId"
          @tool-click="handleDemoToolClick"
        />
      </div>

      <div class="toolbar-demo">
        <h3>垂直工具栏</h3>
        <div class="vertical-toolbar-container">
          <editor-toolbar
            :tool-groups="demoToolGroups"
            :active-tool-id="demoActiveToolId"
            direction="vertical"
            variant="minimal"
            @tool-click="handleDemoToolClick"
          />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h2>SliderControl 滑块控制</h2>

      <div class="slider-demo-grid">
        <div class="slider-demo-item">
          <h3>基础滑块</h3>
          <slider-control
            v-model="demoSliderValue1"
            :min="0"
            :max="100"
            label="数值"
            @change="handleSliderChange"
          />
        </div>

        <div class="slider-demo-item">
          <h3>带刻度的滑块</h3>
          <slider-control
            v-model="demoSliderValue2"
            :min="-50"
            :max="50"
            label="调整"
            :show-ticks="true"
            :tick-count="5"
            @change="handleSliderChange"
          />
        </div>

        <div class="slider-demo-item">
          <h3>带预设的滑块</h3>
          <slider-control
            v-model="demoSliderValue3"
            :min="0"
            :max="200"
            label="缩放"
            unit="%"
            :show-presets="true"
            :presets="[
              { label: '50%', value: 50 },
              { label: '100%', value: 100 },
              { label: '150%', value: 150 },
              { label: '200%', value: 200 }
            ]"
            @change="handleSliderChange"
          />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h2>ColorPicker 颜色选择器</h2>

      <div class="color-picker-demo">
        <div class="color-picker-item">
          <h3>基础颜色选择器</h3>
          <color-picker
            v-model="demoColor1"
            @change="handleColorChange"
          />
          <p>选中颜色: {{ demoColor1 }}</p>
        </div>

        <div class="color-picker-item">
          <h3>带透明度的颜色选择器</h3>
          <color-picker
            v-model="demoColor2"
            :show-alpha="true"
            size="large"
            @change="handleColorChange"
          />
          <p>选中颜色: {{ demoColor2 }}</p>
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="demo-controls">
      <h2>演示控制</h2>
      <div class="control-grid">
        <div class="control-item">
          <label>编辑器主题:</label>
          <select v-model="editorTheme">
            <option value="light">亮色</option>
            <option value="dark">暗色</option>
          </select>
        </div>

        <div class="control-item">
          <label>模拟加载:</label>
          <button @click="simulateLoading">开始加载</button>
        </div>

        <div class="control-item">
          <label>重置所有:</label>
          <button @click="resetAll">重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EditorContainer from '@/components/ui/EditorContainer.vue';
import EditorToolbar from '@/components/ui/EditorToolbar.vue';
import SliderControl from '@/components/ui/SliderControl.vue';
import ColorPicker from '@/components/ui/ColorPicker.vue';
import ImageAdjustmentPanel from '@/components/ui/ImageAdjustmentPanel.vue';
import TransformPanel from '@/components/ui/TransformPanel.vue';

export default {
  name: 'AdvancedUIDemo',
  components: {
    EditorContainer,
    EditorToolbar,
    SliderControl,
    ColorPicker,
    ImageAdjustmentPanel,
    TransformPanel
  },

  data() {
    return {
      // 编辑器状态
      editorTheme: 'light',
      editorLoading: false,
      canvasDimensions: {
        width: 0,
        height: 0
      },

      // 工具状态
      activeToolId: 'brush',
      disabledToolIds: [],
      loadingToolIds: [],

      // 颜色状态
      foregroundColor: '#000000',
      backgroundColor: '#ffffff',

      // 调整值
      adjustmentValues: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        hue: 0
      },

      // 变换值
      transformValues: {
        rotation: 0,
        scale: { x: 1, y: 1, uniform: true },
        flip: { horizontal: false, vertical: false },
        position: { x: 0, y: 0 }
      },

      // 演示用数据
      demoActiveToolId: 'select',
      demoSliderValue1: 50,
      demoSliderValue2: 0,
      demoSliderValue3: 100,
      demoColor1: '#ff0000',
      demoColor2: 'rgba(0, 255, 0, 0.5)',

      // 工具组配置
      mainToolGroups: [
        {
          id: 'file',
          title: '文件',
          priority: 'high',
          tools: [
            { id: 'new', label: '新建', icon: 'plus' },
            { id: 'open', label: '打开', icon: 'folder' },
            { id: 'save', label: '保存', icon: 'save', variant: 'primary' },
            { id: 'export', label: '导出', icon: 'download' }
          ]
        },
        {
          id: 'edit',
          title: '编辑',
          priority: 'high',
          tools: [
            { id: 'undo', label: '撤销', icon: 'undo' },
            { id: 'redo', label: '重做', icon: 'redo' },
            { id: 'copy', label: '复制', icon: 'copy' },
            { id: 'paste', label: '粘贴', icon: 'paste' }
          ]
        },
        {
          id: 'view',
          title: '视图',
          priority: 'normal',
          tools: [
            { id: 'zoom-in', label: '放大', icon: 'zoom-in' },
            { id: 'zoom-out', label: '缩小', icon: 'zoom-out' },
            { id: 'fit', label: '适合', icon: 'fit' },
            { id: 'fullscreen', label: '全屏', icon: 'fullscreen' }
          ]
        }
      ],

      toolPaletteGroups: [
        {
          id: 'selection',
          title: '选择',
          tools: [
            { id: 'select', label: '选择', icon: 'cursor' },
            { id: 'lasso', label: '套索', icon: 'lasso' },
            { id: 'magic-wand', label: '魔术棒', icon: 'magic-wand' }
          ]
        },
        {
          id: 'drawing',
          title: '绘画',
          tools: [
            { id: 'brush', label: '画笔', icon: 'brush' },
            { id: 'pencil', label: '铅笔', icon: 'pencil' },
            { id: 'eraser', label: '橡皮擦', icon: 'eraser' }
          ]
        },
        {
          id: 'shapes',
          title: '形状',
          tools: [
            { id: 'rectangle', label: '矩形', icon: 'rectangle' },
            { id: 'circle', label: '圆形', icon: 'circle' },
            { id: 'line', label: '直线', icon: 'line' }
          ]
        }
      ],

      demoToolGroups: [
        {
          id: 'basic',
          title: '基础工具',
          tools: [
            { id: 'select', label: '选择', icon: 'cursor' },
            { id: 'brush', label: '画笔', icon: 'brush' },
            { id: 'eraser', label: '橡皮擦', icon: 'eraser' },
            { id: 'text', label: '文本', icon: 'text' }
          ]
        }
      ],

      // 预设配置
      adjustmentPresets: [
        {
          id: 'bright',
          name: '明亮',
          values: {
            brightness: 20,
            contrast: 10,
            saturation: 5
          }
        },
        {
          id: 'vivid',
          name: '鲜艳',
          values: {
            brightness: 5,
            contrast: 15,
            saturation: 25
          }
        },
        {
          id: 'vintage',
          name: '复古',
          values: {
            brightness: -10,
            contrast: -5,
            saturation: -15,
            hue: 15
          }
        }
      ],

      transformPresets: [
        {
          id: 'rotate-90',
          name: '旋转90°',
          values: {
            rotation: 90
          }
        },
        {
          id: 'flip-h',
          name: '水平翻转',
          values: {
            flip: { horizontal: true, vertical: false }
          }
        },
        {
          id: 'scale-2x',
          name: '放大2倍',
          values: {
            scale: { x: 2, y: 2, uniform: true }
          }
        }
      ]
    };
  },

  methods: {
    /**
     * 处理尺寸变化
     */
    handleDimensionsChange(dimensions) {
      this.canvasDimensions = {
        width: Math.round(dimensions.canvasWidth),
        height: Math.round(dimensions.canvasHeight)
      };
    },

    /**
     * 处理工具点击
     */
    handleToolClick(event) {
      this.activeToolId = event.toolId;
      console.log('工具点击:', event);
    },

    /**
     * 处理演示工具点击
     */
    handleDemoToolClick(event) {
      this.demoActiveToolId = event.toolId;
      console.log('演示工具点击:', event);
    },

    /**
     * 获取工具名称
     */
    getToolName(toolId) {
      const toolNames = {
        'select': '选择工具',
        'brush': '画笔工具',
        'eraser': '橡皮擦工具',
        'text': '文本工具',
        'cursor': '选择工具',
        'lasso': '套索工具',
        'magic-wand': '魔术棒工具',
        'pencil': '铅笔工具',
        'rectangle': '矩形工具',
        'circle': '圆形工具',
        'line': '直线工具'
      };
      return toolNames[toolId] || toolId;
    },

    /**
     * 处理前景色变化
     */
    handleForegroundColorChange(color) {
      this.foregroundColor = color;
      console.log('前景色变化:', color);
    },

    /**
     * 处理背景色变化
     */
    handleBackgroundColorChange(color) {
      this.backgroundColor = color;
      console.log('背景色变化:', color);
    },

    /**
     * 处理亮度变化
     */
    handleBrightnessChange(value) {
      this.adjustmentValues.brightness = value;
      console.log('亮度变化:', value);
    },

    /**
     * 处理对比度变化
     */
    handleContrastChange(value) {
      this.adjustmentValues.contrast = value;
      console.log('对比度变化:', value);
    },

    /**
     * 处理饱和度变化
     */
    handleSaturationChange(value) {
      this.adjustmentValues.saturation = value;
      console.log('饱和度变化:', value);
    },

    /**
     * 处理色调变化
     */
    handleHueChange(value) {
      this.adjustmentValues.hue = value;
      console.log('色调变化:', value);
    },

    /**
     * 处理调整重置
     */
    handleAdjustmentReset() {
      this.adjustmentValues = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        hue: 0
      };
      console.log('调整重置');
    },

    /**
     * 处理调整预设应用
     */
    handleAdjustmentPresetApplied(preset) {
      console.log('调整预设应用:', preset);
    },

    /**
     * 处理旋转变化
     */
    handleRotationChange(value) {
      this.transformValues.rotation = value;
      console.log('旋转变化:', value);
    },

    /**
     * 处理缩放变化
     */
    handleScaleChange(value) {
      this.transformValues.scale = value;
      console.log('缩放变化:', value);
    },

    /**
     * 处理翻转变化
     */
    handleFlipChange(value) {
      this.transformValues.flip = value;
      console.log('翻转变化:', value);
    },

    /**
     * 处理位置变化
     */
    handlePositionChange(value) {
      this.transformValues.position = value;
      console.log('位置变化:', value);
    },

    /**
     * 处理变换重置
     */
    handleTransformReset() {
      this.transformValues = {
        rotation: 0,
        scale: { x: 1, y: 1, uniform: true },
        flip: { horizontal: false, vertical: false },
        position: { x: 0, y: 0 }
      };
      console.log('变换重置');
    },

    /**
     * 处理变换预设应用
     */
    handleTransformPresetApplied(preset) {
      console.log('变换预设应用:', preset);
    },

    /**
     * 处理滑块变化
     */
    handleSliderChange(value) {
      console.log('滑块变化:', value);
    },

    /**
     * 处理颜色变化
     */
    handleColorChange(color) {
      console.log('颜色变化:', color);
    },

    /**
     * 模拟加载
     */
    simulateLoading() {
      this.editorLoading = true;
      this.loadingToolIds = ['save', 'export'];

      setTimeout(() => {
        this.editorLoading = false;
        this.loadingToolIds = [];
      }, 3000);
    },

    /**
     * 重置所有
     */
    resetAll() {
      this.activeToolId = 'brush';
      this.foregroundColor = '#000000';
      this.backgroundColor = '#ffffff';
      this.adjustmentValues = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        hue: 0
      };
      this.transformValues = {
        rotation: 0,
        scale: { x: 1, y: 1, uniform: true },
        flip: { horizontal: false, vertical: false },
        position: { x: 0, y: 0 }
      };
      this.demoSliderValue1 = 50;
      this.demoSliderValue2 = 0;
      this.demoSliderValue3 = 100;
      this.demoColor1 = '#ff0000';
      this.demoColor2 = 'rgba(0, 255, 0, 0.5)';
    }
  }
};
</script>

<style scoped>
.advanced-ui-demo {
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

/* 编辑器容器 */
.editor-container {
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

/* 工具侧边栏 */
.tool-sidebar {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-section h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.color-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-row label {
  min-width: 60px;
  font-size: 14px;
  color: #666;
}

/* 属性侧边栏 */
.properties-sidebar {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

/* 画布区域 */
.demo-canvas {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-content {
  width: 80%;
  height: 80%;
  background: white;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder {
  text-align: center;
  color: #666;
  padding: 20px;
}

.image-placeholder h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.color-sample {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 1px solid #ddd;
  vertical-align: middle;
  margin-right: 4px;
}

.adjustment-preview {
  margin-top: 20px;
  text-align: left;
  display: inline-block;
}

.adjustment-preview h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.adjustment-preview ul {
  margin: 0;
  padding: 0 0 0 20px;
}

.adjustment-preview li {
  margin-bottom: 5px;
}

/* 状态栏 */
.editor-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

/* 工具栏演示 */
.toolbar-demo {
  margin-bottom: 30px;
}

.toolbar-demo h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.vertical-toolbar-container {
  width: 60px;
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 滑块演示 */
.slider-demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.slider-demo-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.slider-demo-item h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

/* 颜色选择器演示 */
.color-picker-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.color-picker-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
  min-width: 200px;
}

.color-picker-item h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.color-picker-item p {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

/* 控制面板 */
.demo-controls {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.control-item select,
.control-item button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.control-item button {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.control-item button:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .advanced-ui-demo {
    padding: 10px;
  }

  .editor-container {
    height: 500px;
  }

  .slider-demo-grid,
  .control-grid {
    grid-template-columns: 1fr;
  }

  .color-picker-demo {
    flex-direction: column;
  }
}
</style>