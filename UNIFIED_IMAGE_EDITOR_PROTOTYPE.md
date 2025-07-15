# 统一图像编辑器原型实现方案

## 1. 项目结构设计

基于现有项目，我们将创建一个统一的图像编辑器，整合所有库的优势：

```
src/
├── components/
│   ├── unified-editor/
│   │   ├── UnifiedImageEditor.vue          # 主编辑器组件
│   │   ├── EditorContainer.vue             # 容器布局
│   │   ├── EditorToolbar.vue               # 工具栏
│   │   ├── ControlPanel.vue                # 控制面板
│   │   └── PreviewWindow.vue               # 预览窗口
│   ├── adapters/
│   │   ├── BaseAdapter.js                  # 基础适配器
│   │   ├── FabricAdapter.js                # Fabric.js适配器
│   │   ├── KonvaAdapter.js                 # Konva.js适配器
│   │   ├── CropperAdapter.js               # Cropper.js适配器
│   │   ├── JimpAdapter.js                  # Jimp适配器
│   │   └── TuiAdapter.js                   # TUI Image Editor适配器
│   ├── state/
│   │   ├── StateManager.js                 # 状态管理器
│   │   ├── HistoryManager.js               # 历史记录管理
│   │   └── StateConverter.js               # 状态转换器
│   └── ui/
│       ├── ToolButton.vue                  # 工具按钮
│       ├── SliderControl.vue               # 滑块控制
│       ├── ImagePreview.vue                # 图像预览
│       └── HistoryPanel.vue                # 历史面板
├── views/
│   └── UnifiedEditorView.vue               # 统一编辑器页面
├── utils/
│   ├── LibrarySelector.js                  # 智能库选择器
│   ├── PerformanceMonitor.js               # 性能监控
│   └── ThemeManager.js                     # 主题管理
└── styles/
    ├── unified-editor.scss                 # 统一编辑器样式
    ├── themes/
    │   ├── default.scss                    # 默认主题
    │   └── dark.scss                       # 暗色主题
    └── components/
        ├── toolbar.scss                    # 工具栏样式
        ├── controls.scss                   # 控制组件样式
        └── preview.scss                    # 预览组件样式
```

## 2. 核心实现方案

### 2.1 统一编辑器主组件

```vue
<template>
  <div class="unified-image-editor">
    <editor-container @dimensions-change="handleDimensionsChange">
      <!-- 顶部工具栏 -->
      <template #toolbar-top>
        <editor-toolbar 
          :tool-groups="topToolGroups"
          @tool-action="handleToolAction"
        />
      </template>
      
      <!-- 主画布区域 -->
      <template #canvas>
        <div class="canvas-wrapper" ref="canvasWrapper">
          <!-- 动态加载的适配器画布 -->
          <component 
            :is="currentAdapterComponent" 
            ref="currentAdapter"
            :options="adapterOptions"
            @state-change="handleStateChange"
            @operation-complete="handleOperationComplete"
          />
        </div>
      </template>
      
      <!-- 右侧控制面板 -->
      <template #sidebar-right>
        <div class="control-sidebar">
          <!-- 基础调整面板 -->
          <control-panel title="基础调整" :initial-collapsed="false">
            <slider-control
              id="brightness"
              label="亮度"
              v-model="adjustments.brightness"
              :min="-1"
              :max="1"
              :step="0.01"
              :default-value="0"
              :value-format="formatPercentage"
              @update:modelValue="applyBrightness"
            />
            <slider-control
              id="contrast"
              label="对比度"
              v-model="adjustments.contrast"
              :min="-1"
              :max="1"
              :step="0.01"
              :default-value="0"
              :value-format="formatPercentage"
              @update:modelValue="applyContrast"
            />
          </control-panel>
          
          <!-- 变换面板 -->
          <control-panel title="变换" :initial-collapsed="false">
            <slider-control
              id="rotation"
              label="旋转"
              v-model="transform.rotation"
              :min="0"
              :max="360"
              :step="1"
              :default-value="0"
              :value-format="formatDegrees"
              @update:modelValue="applyRotation"
            />
            <div class="quick-rotate-buttons">
              <tool-button icon="rotate-left" label="左转90°" @click="rotateLeft" />
              <tool-button icon="rotate-right" label="右转90°" @click="rotateRight" />
            </div>
          </control-panel>
          
          <!-- 裁剪面板 -->
          <control-panel title="裁剪" :initial-collapsed="true">
            <div class="crop-controls">
              <tool-toggle-button
                v-model="isCropping"
                icon="crop"
                label="启用裁剪"
                @update:modelValue="toggleCrop"
              />
              <div v-if="isCropping" class="crop-options">
                <!-- 裁剪比例选择 -->
                <div class="aspect-ratio-buttons">
                  <button 
                    v-for="ratio in aspectRatios" 
                    :key="ratio.value"
                    class="aspect-ratio-btn"
                    :class="{ active: currentAspectRatio === ratio.value }"
                    @click="setAspectRatio(ratio.value)"
                  >
                    {{ ratio.label }}
                  </button>
                </div>
                <div class="crop-actions">
                  <tool-button label="应用裁剪" @click="applyCrop" />
                  <tool-button label="取消裁剪" @click="cancelCrop" />
                </div>
              </div>
            </div>
          </control-panel>
          
          <!-- 预览窗口 -->
          <image-preview
            title="实时预览"
            :preview-src="previewSrc"
            :width="300"
            :height="200"
          />
          
          <!-- 历史记录面板 -->
          <history-panel
            :history-entries="historyEntries"
            :current-index="currentHistoryIndex"
            @undo="undo"
            @redo="redo"
            @go-to-state="goToHistoryState"
          />
        </div>
      </template>
      
      <!-- 底部状态栏 -->
      <template #footer>
        <div class="status-bar">
          <div class="status-info">
            <span>当前库: {{ currentLibrary }}</span>
            <span>图像尺寸: {{ imageInfo.width }} × {{ imageInfo.height }}</span>
            <span>性能: {{ performanceInfo.fps }} FPS</span>
          </div>
          <div class="status-actions">
            <tool-button icon="download" label="导出图像" @click="exportImage" />
            <tool-button icon="reset" label="重置" @click="resetImage" />
          </div>
        </div>
      </template>
    </editor-container>
  </div>
</template>

<script>
import EditorContainer from '@/components/unified-editor/EditorContainer.vue';
import EditorToolbar from '@/components/unified-editor/EditorToolbar.vue';
import ControlPanel from '@/components/ui/ControlPanel.vue';
import SliderControl from '@/components/ui/SliderControl.vue';
import ToolButton from '@/components/ui/ToolButton.vue';
import ToolToggleButton from '@/components/ui/ToolToggleButton.vue';
import ImagePreview from '@/components/ui/ImagePreview.vue';
import HistoryPanel from '@/components/ui/HistoryPanel.vue';

import StateManager from '@/components/state/StateManager.js';
import LibrarySelector from '@/utils/LibrarySelector.js';
import PerformanceMonitor from '@/utils/PerformanceMonitor.js';

export default {
  name: 'UnifiedImageEditor',
  components: {
    EditorContainer,
    EditorToolbar,
    ControlPanel,
    SliderControl,
    ToolButton,
    ToolToggleButton,
    ImagePreview,
    HistoryPanel
  },
  data() {
    return {
      // 状态管理
      stateManager: null,
      librarySelector: null,
      performanceMonitor: null,
      
      // 当前适配器
      currentLibrary: 'fabric',
      currentAdapterComponent: null,
      adapterOptions: {},
      
      // 图像信息
      imageInfo: {
        width: 0,
        height: 0,
        originalWidth: 0,
        originalHeight: 0
      },
      
      // 调整参数
      adjustments: {
        brightness: 0,
        contrast: 0
      },
      
      // 变换参数
      transform: {
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      },
      
      // 裁剪状态
      isCropping: false,
      currentAspectRatio: null,
      aspectRatios: [
        { label: '自由', value: null },
        { label: '1:1', value: 1 },
        { label: '4:3', value: 4/3 },
        { label: '16:9', value: 16/9 },
        { label: '3:4', value: 3/4 },
        { label: '9:16', value: 9/16 }
      ],
      
      // 预览
      previewSrc: null,
      
      // 历史记录
      historyEntries: [],
      currentHistoryIndex: -1,
      
      // 性能信息
      performanceInfo: {
        fps: 60,
        memoryUsage: 0,
        renderTime: 0
      },
      
      // 工具栏配置
      topToolGroups: [
        {
          name: 'file',
          title: '文件',
          tools: ['load', 'save', 'export']
        },
        {
          name: 'edit',
          title: '编辑',
          tools: ['undo', 'redo', 'reset']
        },
        {
          name: 'view',
          title: '视图',
          tools: ['zoom-in', 'zoom-out', 'fit-screen']
        },
        {
          name: 'library',
          title: '引擎',
          tools: ['fabric', 'konva', 'cropper', 'jimp', 'tui']
        }
      ]
    }
  },
  
  async mounted() {
    await this.initializeEditor();
  },
  
  methods: {
    async initializeEditor() {
      try {
        // 初始化状态管理器
        this.stateManager = new StateManager();
        this.stateManager.onStateChange(this.handleGlobalStateChange);
        
        // 初始化库选择器
        this.librarySelector = new LibrarySelector();
        
        // 初始化性能监控
        this.performanceMonitor = new PerformanceMonitor();
        this.performanceMonitor.onUpdate(this.handlePerformanceUpdate);
        
        // 加载默认适配器
        await this.switchLibrary('fabric');
        
        // 加载默认图像
        await this.loadDefaultImage();
        
      } catch (error) {
        console.error('编辑器初始化失败:', error);
      }
    },
    
    async switchLibrary(libraryType) {
      try {
        // 保存当前状态
        if (this.currentAdapterComponent) {
          const currentState = await this.$refs.currentAdapter.getState();
          this.stateManager.updateState(currentState, 'switch-library', `切换到${libraryType}`);
        }
        
        // 动态加载适配器组件
        const adapterComponent = await this.loadAdapterComponent(libraryType);
        this.currentAdapterComponent = adapterComponent;
        this.currentLibrary = libraryType;
        
        // 等待组件渲染
        await this.$nextTick();
        
        // 如果有状态需要恢复，则恢复状态
        const currentState = this.stateManager.getCurrentState();
        if (currentState && this.$refs.currentAdapter) {
          await this.$refs.currentAdapter.restoreState(currentState);
        }
        
      } catch (error) {
        console.error('切换库失败:', error);
      }
    },
    
    async loadAdapterComponent(libraryType) {
      // 动态导入适配器组件
      switch (libraryType) {
        case 'fabric':
          return (await import('@/components/adapters/FabricAdapter.vue')).default;
        case 'konva':
          return (await import('@/components/adapters/KonvaAdapter.vue')).default;
        case 'cropper':
          return (await import('@/components/adapters/CropperAdapter.vue')).default;
        case 'jimp':
          return (await import('@/components/adapters/JimpAdapter.vue')).default;
        case 'tui':
          return (await import('@/components/adapters/TuiAdapter.vue')).default;
        default:
          throw new Error(`不支持的库类型: ${libraryType}`);
      }
    },
    
    async loadDefaultImage() {
      const defaultImageSrc = require('@/assets/illust_104350264_20230531_093134.png');
      await this.loadImage(defaultImageSrc);
    },
    
    async loadImage(imageSrc) {
      if (this.$refs.currentAdapter) {
        await this.$refs.currentAdapter.loadImage(imageSrc);
        this.updatePreview();
      }
    },
    
    // 调整方法
    async applyBrightness(value) {
      if (this.$refs.currentAdapter) {
        await this.$refs.currentAdapter.setBrightness(value);
        this.updatePreview();
        this.recordAction('brightness', `调整亮度: ${this.formatPercentage(value)}`);
      }
    },
    
    async applyContrast(value) {
      if (this.$refs.currentAdapter) {
        await this.$refs.currentAdapter.setContrast(value);
        this.updatePreview();
        this.recordAction('contrast', `调整对比度: ${this.formatPercentage(value)}`);
      }
    },
    
    async applyRotation(angle) {
      if (this.$refs.currentAdapter) {
        await this.$refs.currentAdapter.rotate(angle);
        this.updatePreview();
        this.recordAction('rotate', `旋转: ${this.formatDegrees(angle)}`);
      }
    },
    
    async rotateLeft() {
      this.transform.rotation = (this.transform.rotation - 90 + 360) % 360;
      await this.applyRotation(this.transform.rotation);
    },
    
    async rotateRight() {
      this.transform.rotation = (this.transform.rotation + 90) % 360;
      await this.applyRotation(this.transform.rotation);
    },
    
    // 裁剪方法
    async toggleCrop(enabled) {
      if (this.$refs.currentAdapter) {
        if (enabled) {
          await this.$refs.currentAdapter.startCropping();
        } else {
          await this.$refs.currentAdapter.cancelCrop();
        }
      }
    },
    
    async setAspectRatio(ratio) {
      this.currentAspectRatio = ratio;
      if (this.$refs.currentAdapter && this.isCropping) {
        await this.$refs.currentAdapter.setCropAspectRatio(ratio);
      }
    },
    
    async applyCrop() {
      if (this.$refs.currentAdapter) {
        await this.$refs.currentAdapter.applyCrop();
        this.isCropping = false;
        this.updatePreview();
        this.recordAction('crop', '应用裁剪');
      }
    },
    
    async cancelCrop() {
      if (this.$refs.currentAdapter) {
        await this.$refs.currentAdapter.cancelCrop();
        this.isCropping = false;
      }
    },
    
    // 历史记录方法
    async undo() {
      const previousState = this.stateManager.undo();
      if (previousState && this.$refs.currentAdapter) {
        await this.$refs.currentAdapter.restoreState(previousState);
        this.updatePreview();
      }
    },
    
    async redo() {
      const nextState = this.stateManager.redo();
      if (nextState && this.$refs.currentAdapter) {
        await this.$refs.currentAdapter.restoreState(nextState);
        this.updatePreview();
      }
    },
    
    async goToHistoryState(index) {
      // 实现跳转到特定历史状态
    },
    
    // 导出和重置
    async exportImage() {
      if (this.$refs.currentAdapter) {
        const dataURL = await this.$refs.currentAdapter.toDataURL();
        this.downloadImage(dataURL);
      }
    },
    
    async resetImage() {
      if (this.$refs.currentAdapter) {
        await this.$refs.currentAdapter.reset();
        this.resetControls();
        this.updatePreview();
        this.recordAction('reset', '重置图像');
      }
    },
    
    // 辅助方法
    updatePreview() {
      if (this.$refs.currentAdapter) {
        this.$refs.currentAdapter.toDataURL().then(dataURL => {
          this.previewSrc = dataURL;
        });
      }
    },
    
    recordAction(actionType, description) {
      this.stateManager.updateState({}, actionType, description);
    },
    
    resetControls() {
      this.adjustments.brightness = 0;
      this.adjustments.contrast = 0;
      this.transform.rotation = 0;
      this.isCropping = false;
    },
    
    downloadImage(dataURL) {
      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = dataURL;
      link.click();
    },
    
    formatPercentage(value) {
      return `${Math.round(value * 100)}%`;
    },
    
    formatDegrees(value) {
      return `${value}°`;
    },
    
    // 事件处理
    handleDimensionsChange(dimensions) {
      // 处理容器尺寸变化
    },
    
    handleToolAction(action) {
      // 处理工具栏操作
      switch (action) {
        case 'load':
          this.loadImageFile();
          break;
        case 'save':
          this.saveProject();
          break;
        case 'export':
          this.exportImage();
          break;
        case 'undo':
          this.undo();
          break;
        case 'redo':
          this.redo();
          break;
        case 'reset':
          this.resetImage();
          break;
        default:
          if (['fabric', 'konva', 'cropper', 'jimp', 'tui'].includes(action)) {
            this.switchLibrary(action);
          }
      }
    },
    
    handleStateChange(state) {
      // 处理适配器状态变化
    },
    
    handleOperationComplete(operation) {
      // 处理操作完成
    },
    
    handleGlobalStateChange(state) {
      // 处理全局状态变化
      this.historyEntries = this.stateManager.getHistory().getAllEntries();
      this.currentHistoryIndex = this.stateManager.getHistory().getCurrentIndex();
    },
    
    handlePerformanceUpdate(info) {
      this.performanceInfo = info;
    }
  }
}
</script>
```

## 3. 实现优势

### 3.1 功能整合优势

1. **最佳库选择** - 根据操作类型自动选择最适合的库
2. **状态一致性** - 统一的状态管理确保库切换时状态保持一致
3. **功能互补** - 结合各库优势，提供完整的编辑功能
4. **性能优化** - 按需加载库，减少初始加载时间

### 3.2 用户体验优势

1. **统一界面** - 一致的UI设计语言和交互模式
2. **响应式设计** - 适配不同设备和屏幕尺寸
3. **实时预览** - 所有操作都有实时预览反馈
4. **历史记录** - 完整的撤销/重做功能

### 3.3 开发优势

1. **模块化架构** - 易于维护和扩展
2. **适配器模式** - 新增库支持简单
3. **状态管理** - 清晰的状态流转和管理
4. **性能监控** - 实时性能监控和优化

## 4. 下一步实现计划

1. **创建基础适配器** - 实现各库的适配器组件
2. **完善状态管理** - 实现状态转换和历史记录
3. **开发UI组件** - 创建统一的UI组件库
4. **集成测试** - 测试各库之间的切换和状态保持
5. **性能优化** - 优化加载速度和运行性能
6. **用户测试** - 收集用户反馈并改进体验

这个统一的图像编辑器将成为一个强大而灵活的解决方案，充分发挥各个图像编辑库的优势，为用户提供最佳的编辑体验。
