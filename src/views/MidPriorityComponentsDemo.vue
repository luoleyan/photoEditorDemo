<template>
  <div class="mid-priority-components-demo">
    <div class="demo-header">
      <h1>中优先级功能组件演示</h1>
      <p>展示LayerPanel、CropTool和TextTool组件的专业功能和交互</p>
    </div>

    <!-- 图层管理面板演示 -->
    <div class="demo-section">
      <h2>LayerPanel 图层管理面板</h2>
      <div class="demo-description">
        <p>支持图层排序、可见性控制、混合模式选择和图层操作</p>
      </div>
      
      <div class="layer-demo-container">
        <div class="layer-wrapper">
          <layer-panel
            :layers="layers"
            :selected-layer-ids="selectedLayerIds"
            :variant="layerVariant"
            @layer-select="handleLayerSelect"
            @layer-visibility-change="handleLayerVisibilityChange"
            @layer-lock-change="handleLayerLockChange"
            @layer-opacity-change="handleLayerOpacityChange"
            @layer-blend-mode-change="handleLayerBlendModeChange"
            @layer-name-change="handleLayerNameChange"
            @layer-add="handleLayerAdd"
            @layer-delete="handleLayerDelete"
            @layer-duplicate="handleLayerDuplicate"
            @layers-reorder="handleLayersReorder"
          />
        </div>
        
        <div class="layer-controls">
          <h3>控制选项</h3>
          <div class="control-group">
            <button @click="addRandomLayer">添加随机图层</button>
            <button @click="toggleAllVisibility">切换全部可见性</button>
            <button @click="resetLayers">重置图层</button>
          </div>
          
          <div class="control-group">
            <label>变体样式:</label>
            <select v-model="layerVariant">
              <option value="default">默认</option>
              <option value="compact">紧凑</option>
              <option value="minimal">简约</option>
            </select>
          </div>
          
          <div class="layer-preview">
            <h4>当前状态</h4>
            <p>图层数量: {{ layers.length }}</p>
            <p>选中图层: {{ selectedLayerIds.length }}</p>
            <p>可见图层: {{ visibleLayersCount }}</p>
            <p>锁定图层: {{ lockedLayersCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 裁剪工具演示 -->
    <div class="demo-section">
      <h2>CropTool 裁剪工具</h2>
      <div class="demo-description">
        <p>支持自由裁剪、比例裁剪、网格线和参考线</p>
      </div>
      
      <div class="crop-demo-container">
        <div class="crop-wrapper">
          <crop-tool
            :image-src="cropImageSrc"
            :show-grid="showCropGrid"
            :show-guides="showCropGuides"
            :variant="cropVariant"
            @crop-change="handleCropChange"
            @apply="handleCropApply"
            @cancel="handleCropCancel"
            @reset="handleCropReset"
            @show-guides-change="handleShowGuidesChange"
          />
        </div>
        
        <div class="crop-controls">
          <h3>控制选项</h3>
          <div class="control-group">
            <label>选择图像:</label>
            <div class="image-selector">
              <div 
                v-for="(image, index) in cropImages" 
                :key="index"
                class="image-option"
                :class="{ 'active': cropImageSrc === image.src }"
                @click="selectCropImage(image.src)"
              >
                <img :src="image.src" :alt="image.name" />
              </div>
            </div>
          </div>
          
          <div class="control-group">
            <label>
              <input type="checkbox" v-model="showCropGrid" />
              显示网格线
            </label>
          </div>
          
          <div class="control-group">
            <label>
              <input type="checkbox" v-model="showCropGuides" />
              显示参考线
            </label>
          </div>
          
          <div class="control-group">
            <label>变体样式:</label>
            <select v-model="cropVariant">
              <option value="default">默认</option>
              <option value="minimal">简约</option>
              <option value="compact">紧凑</option>
            </select>
          </div>
          
          <div class="crop-info">
            <h4>裁剪信息</h4>
            <div v-if="currentCropArea">
              <p>X: {{ Math.round(currentCropArea.x) }}</p>
              <p>Y: {{ Math.round(currentCropArea.y) }}</p>
              <p>宽度: {{ Math.round(currentCropArea.width) }}</p>
              <p>高度: {{ Math.round(currentCropArea.height) }}</p>
            </div>
            <p v-else>暂无裁剪区域</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 文本工具演示 -->
    <div class="demo-section">
      <h2>TextTool 文本编辑工具</h2>
      <div class="demo-description">
        <p>支持文本添加、字体选择、样式设置和文本效果</p>
      </div>
      
      <div class="text-demo-container">
        <div class="text-wrapper">
          <text-tool
            v-if="adapterInitialized && textAdapter"
            :adapter="textAdapter"
            :adapter-type="adapterType"
            :background-image="textBackgroundImage"
            :initial-text-elements="textElements"
            :variant="textVariant"
            @text-add="handleTextAdd"
            @text-delete="handleTextDelete"
            @text-select="handleTextSelect"
            @text-content-change="handleTextContentChange"
            @text-style-change="handleTextStyleChange"
            @text-move="handleTextMove"
            @text-rotate="handleTextRotate"
            @text-resize="handleTextResize"
          />
          <div v-else class="adapter-loading">
            <p>正在初始化文本适配器...</p>
          </div>
        </div>
        
        <div class="text-controls">
          <h3>控制选项</h3>
          <div class="control-group">
            <label>背景图像:</label>
            <div class="image-selector">
              <div 
                v-for="(image, index) in textBackgroundImages" 
                :key="index"
                class="image-option"
                :class="{ 'active': textBackgroundImage === image.src }"
                @click="selectTextBackground(image.src)"
              >
                <img :src="image.src" :alt="image.name" />
              </div>
            </div>
          </div>
          
          <div class="control-group">
            <button @click="addSampleText">添加示例文本</button>
            <button @click="clearAllText">清空所有文本</button>
          </div>
          
          <div class="control-group">
            <label>变体样式:</label>
            <select v-model="textVariant">
              <option value="default">默认</option>
              <option value="minimal">简约</option>
              <option value="compact">紧凑</option>
            </select>
          </div>
          
          <div class="text-info">
            <h4>文本信息</h4>
            <p>文本数量: {{ textElements.length }}</p>
            <p>选中文本: {{ selectedTextId ? '是' : '否' }}</p>
            <div v-if="selectedText">
              <p>字体: {{ selectedText.fontFamily }}</p>
              <p>大小: {{ selectedText.fontSize }}px</p>
              <p>颜色: {{ selectedText.color }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 集成演示 -->
    <div class="demo-section">
      <h2>组件集成演示</h2>
      <div class="demo-description">
        <p>展示三个中优先级组件的集成效果，模拟专业图像编辑工作流</p>
      </div>
      
      <div class="integrated-demo-container">
        <div class="integrated-editor">
          <editor-container
            :theme="editorTheme"
            :loading="editorLoading"
            loading-text="正在处理..."
          >
            <!-- 顶部工具栏 -->
            <template #toolbar-top>
              <div class="integrated-toolbar">
                <div class="toolbar-section">
                  <h3>专业编辑器</h3>
                </div>
                <div class="toolbar-section">
                  <button 
                    class="mode-button"
                    :class="{ 'active': currentMode === 'layer' }"
                    @click="setMode('layer')"
                  >
                    图层模式
                  </button>
                  <button 
                    class="mode-button"
                    :class="{ 'active': currentMode === 'crop' }"
                    @click="setMode('crop')"
                  >
                    裁剪模式
                  </button>
                  <button 
                    class="mode-button"
                    :class="{ 'active': currentMode === 'text' }"
                    @click="setMode('text')"
                  >
                    文本模式
                  </button>
                </div>
              </div>
            </template>

            <!-- 左侧面板 -->
            <template #sidebar-left>
              <layer-panel
                v-if="currentMode === 'layer'"
                :layers="integratedLayers"
                :selected-layer-ids="integratedSelectedLayerIds"
                @layer-select="handleIntegratedLayerSelect"
                @layer-visibility-change="handleIntegratedLayerVisibilityChange"
                @layer-add="handleIntegratedLayerAdd"
                @layer-delete="handleIntegratedLayerDelete"
              />
              
              <div v-else class="mode-info">
                <h4>{{ getModeTitle() }}</h4>
                <p>{{ getModeDescription() }}</p>
              </div>
            </template>

            <!-- 画布区域 -->
            <template #canvas>
              <crop-tool
                v-if="currentMode === 'crop'"
                :image-src="integratedImageSrc"
                :show-toolbar="false"
                @crop-change="handleIntegratedCropChange"
                @apply="handleIntegratedCropApply"
              />
              
              <text-tool
                v-else-if="currentMode === 'text' && adapterInitialized && textAdapter"
                :adapter="textAdapter"
                :adapter-type="adapterType"
                :background-image="integratedImageSrc"
                :show-toolbar="false"
                :initial-text-elements="integratedTextElements"
                @text-add="handleIntegratedTextAdd"
                @text-delete="handleIntegratedTextDelete"
              />

              <div v-else-if="currentMode === 'text'" class="adapter-loading">
                <p>正在初始化文本适配器...</p>
              </div>
              
              <div v-else class="canvas-placeholder">
                <img :src="integratedImageSrc" alt="编辑图像" />
              </div>
            </template>

            <!-- 右侧面板 -->
            <template #sidebar-right>
              <div class="properties-panel">
                <h4>属性面板</h4>
                <div v-if="currentMode === 'layer'" class="layer-properties">
                  <p>图层属性设置</p>
                  <div v-if="integratedSelectedLayerIds.length > 0">
                    <p>选中图层: {{ integratedSelectedLayerIds.length }}</p>
                  </div>
                </div>
                <div v-else-if="currentMode === 'crop'" class="crop-properties">
                  <p>裁剪属性设置</p>
                  <div v-if="integratedCropArea">
                    <p>裁剪区域: {{ Math.round(integratedCropArea.width) }} × {{ Math.round(integratedCropArea.height) }}</p>
                  </div>
                </div>
                <div v-else-if="currentMode === 'text'" class="text-properties">
                  <p>文本属性设置</p>
                  <p>文本数量: {{ integratedTextElements.length }}</p>
                </div>
              </div>
            </template>

            <!-- 状态栏 -->
            <template #status-bar>
              <div class="editor-status">
                <span>当前模式: {{ getModeTitle() }}</span>
                <span>图层: {{ integratedLayers.length }}</span>
                <span>文本: {{ integratedTextElements.length }}</span>
              </div>
            </template>
          </editor-container>
        </div>
        
        <div class="integrated-controls">
          <h3>集成控制</h3>
          <div class="control-group">
            <label>编辑器主题:</label>
            <select v-model="editorTheme">
              <option value="light">亮色</option>
              <option value="dark">暗色</option>
            </select>
          </div>
          
          <div class="control-group">
            <button @click="simulateIntegratedLoading">模拟加载</button>
            <button @click="resetIntegratedDemo">重置演示</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LayerPanel from '@/components/ui/LayerPanel.vue';
import CropTool from '@/components/ui/CropTool.vue';
import TextTool from '@/components/ui/TextTool.vue';
import EditorContainer from '@/components/ui/EditorContainer.vue';
import FabricAdapter from '@/components/adapters/FabricAdapter.js';

export default {
  name: 'MidPriorityComponentsDemo',
  components: {
    LayerPanel,
    CropTool,
    TextTool,
    EditorContainer
  },

  data() {
    return {
      // 图层管理相关
      layers: [
        {
          id: 'background',
          name: '背景图层',
          type: 'image',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          thumbnail: 'https://picsum.photos/100/100?random=1'
        },
        {
          id: 'layer1',
          name: '图层 1',
          type: 'image',
          visible: true,
          locked: false,
          opacity: 0.8,
          blendMode: 'multiply',
          thumbnail: 'https://picsum.photos/100/100?random=2'
        },
        {
          id: 'layer2',
          name: '文本图层',
          type: 'text',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          thumbnail: null
        },
        {
          id: 'layer3',
          name: '形状图层',
          type: 'shape',
          visible: false,
          locked: true,
          opacity: 0.6,
          blendMode: 'overlay',
          thumbnail: null
        }
      ],
      selectedLayerIds: ['layer1'],
      layerVariant: 'default',

      // 裁剪工具相关
      cropImageSrc: 'https://picsum.photos/800/600?random=10',
      showCropGrid: true,
      showCropGuides: false,
      cropVariant: 'default',
      currentCropArea: null,
      cropImages: [
        { name: '风景1', src: 'https://picsum.photos/800/600?random=10' },
        { name: '风景2', src: 'https://picsum.photos/800/600?random=11' },
        { name: '人物', src: 'https://picsum.photos/600/800?random=12' },
        { name: '建筑', src: 'https://picsum.photos/800/600?random=13' }
      ],

      // 文本工具相关
      textBackgroundImage: 'https://picsum.photos/800/600?random=20',
      textElements: [
        {
          id: 'text1',
          content: '欢迎使用文本工具',
          x: 100,
          y: 100,
          fontFamily: 'Arial',
          fontSize: 32,
          color: '#ffffff',
          textAlign: 'center',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textDecoration: 'none',
          rotation: 0,
          scale: 1,
          effects: {
            shadow: { enabled: true, blur: 4, color: '#000000' },
            stroke: { enabled: false, width: 2, color: '#ffffff' }
          }
        }
      ],
      textVariant: 'default',
      selectedTextId: '',
      textBackgroundImages: [
        { name: '背景1', src: 'https://picsum.photos/800/600?random=20' },
        { name: '背景2', src: 'https://picsum.photos/800/600?random=21' },
        { name: '背景3', src: 'https://picsum.photos/800/600?random=22' },
        { name: '背景4', src: 'https://picsum.photos/800/600?random=23' }
      ],

      // 适配器相关
      textAdapter: null,
      adapterType: 'fabric',
      adapterInitialized: false,

      // 集成演示相关
      editorTheme: 'light',
      editorLoading: false,
      currentMode: 'layer',
      integratedImageSrc: 'https://picsum.photos/800/600?random=30',
      integratedLayers: [
        {
          id: 'bg',
          name: '背景',
          type: 'image',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          thumbnail: 'https://picsum.photos/100/100?random=30'
        },
        {
          id: 'overlay',
          name: '叠加层',
          type: 'image',
          visible: true,
          locked: false,
          opacity: 0.7,
          blendMode: 'overlay',
          thumbnail: 'https://picsum.photos/100/100?random=31'
        }
      ],
      integratedSelectedLayerIds: ['bg'],
      integratedCropArea: null,
      integratedTextElements: []
    };
  },

  async mounted() {
    // 初始化适配器
    await this.initializeAdapter();
  },

  beforeDestroy() {
    // 清理适配器
    if (this.textAdapter) {
      this.textAdapter.destroy();
    }
  },

  computed: {
    // 可见图层数量
    visibleLayersCount() {
      return this.layers.filter(layer => layer.visible).length;
    },

    // 锁定图层数量
    lockedLayersCount() {
      return this.layers.filter(layer => layer.locked).length;
    },

    // 选中的文本
    selectedText() {
      return this.textElements.find(text => text.id === this.selectedTextId) || null;
    }
  },

  methods: {
    // ========== 适配器相关方法 ==========

    /**
     * 初始化适配器
     */
    async initializeAdapter() {
      try {
        // 创建一个临时的canvas元素用于适配器
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);

        // 初始化Fabric适配器
        this.textAdapter = new FabricAdapter();
        await this.textAdapter.initialize(canvas, {
          width: 800,
          height: 600,
          backgroundColor: 'transparent'
        });

        this.adapterInitialized = true;
        console.log('TextTool adapter initialized successfully');
      } catch (error) {
        console.error('Failed to initialize adapter:', error);
        // 创建一个mock适配器作为fallback
        this.textAdapter = this.createMockAdapter();
        this.adapterInitialized = true;
      }
    },

    /**
     * 创建Mock适配器（用于fallback）
     */
    createMockAdapter() {
      return {
        // 文本操作方法
        addText: async (content, x, y, options = {}) => {
          console.log('Mock adapter: addText called', { content, x, y, options });
          return `mock-text-${Date.now()}`;
        },
        removeText: async (id) => {
          console.log('Mock adapter: removeText called', { id });
          return Promise.resolve();
        },
        updateText: async (id, options = {}) => {
          console.log('Mock adapter: updateText called', { id, options });
          return Promise.resolve();
        },
        removeObject: async (id) => {
          console.log('Mock adapter: removeObject called', { id });
          return Promise.resolve();
        },
        updateObject: async (id, options = {}) => {
          console.log('Mock adapter: updateObject called', { id, options });
          return Promise.resolve();
        },

        // 基础适配器方法
        initialize: async (container, options = {}) => {
          console.log('Mock adapter: initialize called', { container, options });
          return Promise.resolve();
        },
        destroy: () => {
          console.log('Mock adapter: destroy called');
        },

        // 图像操作方法
        loadImage: async (imageData) => {
          console.log('Mock adapter: loadImage called', { imageData });
          return Promise.resolve();
        },

        // 性能指标
        getPerformanceMetrics: () => {
          return {
            renderTime: 0,
            operationCount: 0,
            memoryUsage: 0
          };
        }
      };
    },

    // ========== 图层管理相关方法 ==========

    /**
     * 处理图层选择
     */
    handleLayerSelect(layerIds) {
      this.selectedLayerIds = layerIds;
    },

    /**
     * 处理图层可见性变化
     */
    handleLayerVisibilityChange(event) {
      const layer = this.layers.find(l => l.id === event.layerId);
      if (layer) {
        layer.visible = event.visible;
      }
    },

    /**
     * 处理图层锁定变化
     */
    handleLayerLockChange(event) {
      const layer = this.layers.find(l => l.id === event.layerId);
      if (layer) {
        layer.locked = event.locked;
      }
    },

    /**
     * 处理图层不透明度变化
     */
    handleLayerOpacityChange(event) {
      const layer = this.layers.find(l => l.id === event.layerId);
      if (layer) {
        layer.opacity = event.opacity;
      }
    },

    /**
     * 处理图层混合模式变化
     */
    handleLayerBlendModeChange(event) {
      const layer = this.layers.find(l => l.id === event.layerId);
      if (layer) {
        layer.blendMode = event.blendMode;
      }
    },

    /**
     * 处理图层名称变化
     */
    handleLayerNameChange(event) {
      const layer = this.layers.find(l => l.id === event.layerId);
      if (layer) {
        layer.name = event.name;
      }
    },

    /**
     * 处理添加图层
     */
    handleLayerAdd() {
      const newLayer = {
        id: `layer-${Date.now()}`,
        name: `新图层 ${this.layers.length + 1}`,
        type: 'image',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        thumbnail: `https://picsum.photos/100/100?random=${Date.now()}`
      };

      this.layers.unshift(newLayer);
      this.selectedLayerIds = [newLayer.id];
    },

    /**
     * 处理删除图层
     */
    handleLayerDelete(layerIds) {
      layerIds.forEach(layerId => {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index !== -1) {
          this.layers.splice(index, 1);
        }
      });

      this.selectedLayerIds = [];
    },

    /**
     * 处理复制图层
     */
    handleLayerDuplicate(layerId) {
      const layer = this.layers.find(l => l.id === layerId);
      if (layer) {
        const duplicatedLayer = {
          ...layer,
          id: `${layer.id}-copy-${Date.now()}`,
          name: `${layer.name} 副本`
        };

        const index = this.layers.findIndex(l => l.id === layerId);
        this.layers.splice(index, 0, duplicatedLayer);
        this.selectedLayerIds = [duplicatedLayer.id];
      }
    },

    /**
     * 处理图层重新排序
     */
    handleLayersReorder(newLayers) {
      this.layers = newLayers;
    },

    /**
     * 添加随机图层
     */
    addRandomLayer() {
      const types = ['image', 'text', 'shape'];
      const randomType = types[Math.floor(Math.random() * types.length)];

      const newLayer = {
        id: `random-${Date.now()}`,
        name: `随机${randomType}图层`,
        type: randomType,
        visible: true,
        locked: false,
        opacity: Math.random() * 0.5 + 0.5,
        blendMode: 'normal',
        thumbnail: randomType === 'image' ? `https://picsum.photos/100/100?random=${Date.now()}` : null
      };

      this.layers.unshift(newLayer);
    },

    /**
     * 切换全部可见性
     */
    toggleAllVisibility() {
      const allVisible = this.layers.every(layer => layer.visible);
      this.layers.forEach(layer => {
        layer.visible = !allVisible;
      });
    },

    /**
     * 重置图层
     */
    resetLayers() {
      this.layers = [
        {
          id: 'background',
          name: '背景图层',
          type: 'image',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          thumbnail: 'https://picsum.photos/100/100?random=1'
        }
      ];
      this.selectedLayerIds = ['background'];
    },

    // ========== 裁剪工具相关方法 ==========

    /**
     * 选择裁剪图像
     */
    selectCropImage(src) {
      this.cropImageSrc = src;
      this.currentCropArea = null;
    },

    /**
     * 处理裁剪变化
     */
    handleCropChange(cropArea) {
      this.currentCropArea = cropArea;
    },

    /**
     * 处理显示参考线变化
     */
    handleShowGuidesChange(showGuides) {
      this.showCropGuides = showGuides;
    },

    /**
     * 处理裁剪应用
     */
    handleCropApply(cropData) {
      console.log('裁剪应用:', cropData);
      alert(`裁剪应用成功！\n区域: ${Math.round(cropData.width)} × ${Math.round(cropData.height)}`);
    },

    /**
     * 处理裁剪取消
     */
    handleCropCancel() {
      console.log('裁剪取消');
      this.currentCropArea = null;
    },

    /**
     * 处理裁剪重置
     */
    handleCropReset() {
      console.log('裁剪重置');
      this.currentCropArea = null;
    },

    // ========== 文本工具相关方法 ==========

    /**
     * 选择文本背景
     */
    selectTextBackground(src) {
      this.textBackgroundImage = src;
    },

    /**
     * 处理文本添加
     */
    handleTextAdd(text) {
      console.log('文本添加:', text);
    },

    /**
     * 处理文本删除
     */
    handleTextDelete(text) {
      console.log('文本删除:', text);
    },

    /**
     * 处理文本选择
     */
    handleTextSelect(text) {
      this.selectedTextId = text.id;
      console.log('文本选择:', text);
    },

    /**
     * 处理文本内容变化
     */
    handleTextContentChange(text) {
      console.log('文本内容变化:', text);
    },

    /**
     * 处理文本样式变化
     */
    handleTextStyleChange(text) {
      console.log('文本样式变化:', text);
    },

    /**
     * 处理文本移动
     */
    handleTextMove(text) {
      console.log('文本移动:', text);
    },

    /**
     * 处理文本旋转
     */
    handleTextRotate(text) {
      console.log('文本旋转:', text);
    },

    /**
     * 处理文本调整大小
     */
    handleTextResize(text) {
      console.log('文本调整大小:', text);
    },

    /**
     * 添加示例文本
     */
    addSampleText() {
      const sampleTexts = [
        '标题文本',
        '副标题',
        '正文内容',
        '水印文字'
      ];

      const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

      const newText = {
        id: `sample-${Date.now()}`,
        content: randomText,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        fontFamily: 'Arial',
        fontSize: Math.random() * 20 + 20,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        textAlign: 'left',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        rotation: 0,
        scale: 1,
        effects: {
          shadow: { enabled: false, blur: 4, color: '#000000' },
          stroke: { enabled: false, width: 2, color: '#ffffff' }
        }
      };

      this.textElements.push(newText);
    },

    /**
     * 清空所有文本
     */
    clearAllText() {
      this.textElements = [];
      this.selectedTextId = '';
    },

    // ========== 集成演示相关方法 ==========

    /**
     * 设置模式
     */
    setMode(mode) {
      this.currentMode = mode;
    },

    /**
     * 获取模式标题
     */
    getModeTitle() {
      const titles = {
        'layer': '图层管理',
        'crop': '裁剪工具',
        'text': '文本编辑'
      };
      return titles[this.currentMode] || '未知模式';
    },

    /**
     * 获取模式描述
     */
    getModeDescription() {
      const descriptions = {
        'layer': '管理图层的可见性、顺序和属性',
        'crop': '裁剪和调整图像尺寸',
        'text': '添加和编辑文本元素'
      };
      return descriptions[this.currentMode] || '无描述';
    },

    /**
     * 处理集成图层选择
     */
    handleIntegratedLayerSelect(layerIds) {
      this.integratedSelectedLayerIds = layerIds;
    },

    /**
     * 处理集成图层可见性变化
     */
    handleIntegratedLayerVisibilityChange(event) {
      const layer = this.integratedLayers.find(l => l.id === event.layerId);
      if (layer) {
        layer.visible = event.visible;
      }
    },

    /**
     * 处理集成图层添加
     */
    handleIntegratedLayerAdd() {
      const newLayer = {
        id: `integrated-${Date.now()}`,
        name: `图层 ${this.integratedLayers.length + 1}`,
        type: 'image',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        thumbnail: `https://picsum.photos/100/100?random=${Date.now()}`
      };

      this.integratedLayers.unshift(newLayer);
      this.integratedSelectedLayerIds = [newLayer.id];
    },

    /**
     * 处理集成图层删除
     */
    handleIntegratedLayerDelete(layerIds) {
      layerIds.forEach(layerId => {
        const index = this.integratedLayers.findIndex(l => l.id === layerId);
        if (index !== -1) {
          this.integratedLayers.splice(index, 1);
        }
      });

      this.integratedSelectedLayerIds = [];
    },

    /**
     * 处理集成裁剪变化
     */
    handleIntegratedCropChange(cropArea) {
      this.integratedCropArea = cropArea;
    },

    /**
     * 处理集成裁剪应用
     */
    handleIntegratedCropApply(cropData) {
      console.log('集成裁剪应用:', cropData);
      alert('裁剪应用成功！');
    },

    /**
     * 处理集成文本添加
     */
    handleIntegratedTextAdd(text) {
      console.log('集成文本添加:', text);
    },

    /**
     * 处理集成文本删除
     */
    handleIntegratedTextDelete(text) {
      console.log('集成文本删除:', text);
    },

    /**
     * 模拟集成加载
     */
    simulateIntegratedLoading() {
      this.editorLoading = true;

      setTimeout(() => {
        this.editorLoading = false;
      }, 2000);
    },

    /**
     * 重置集成演示
     */
    resetIntegratedDemo() {
      this.currentMode = 'layer';
      this.integratedLayers = [
        {
          id: 'bg',
          name: '背景',
          type: 'image',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          thumbnail: 'https://picsum.photos/100/100?random=30'
        }
      ];
      this.integratedSelectedLayerIds = ['bg'];
      this.integratedCropArea = null;
      this.integratedTextElements = [];
      this.editorLoading = false;
    }
  }
};
</script>

<style scoped>
.mid-priority-components-demo {
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

.demo-description {
  margin-bottom: 20px;
  color: #666;
}

/* 图层演示 */
.layer-demo-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.layer-wrapper {
  flex: 1;
  min-width: 300px;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.layer-controls {
  width: 250px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.layer-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.layer-preview {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.layer-preview h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.layer-preview p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

/* 裁剪演示 */
.crop-demo-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.crop-wrapper {
  flex: 1;
  min-width: 400px;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.crop-controls {
  width: 250px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.crop-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.crop-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.crop-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.crop-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

/* 文本演示 */
.text-demo-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.text-wrapper {
  flex: 1;
  min-width: 400px;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.text-controls {
  width: 250px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.text-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.text-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.text-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.text-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

/* 集成演示 */
.integrated-demo-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.integrated-editor {
  width: 100%;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.integrated-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #ddd;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-section h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.mode-button {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}

.mode-button:hover {
  background-color: #e8e8e8;
}

.mode-button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.mode-info {
  padding: 20px;
  text-align: center;
  color: #666;
}

.mode-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.canvas-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.canvas-placeholder img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.properties-panel {
  padding: 20px;
  background-color: #f9f9f9;
  height: 100%;
}

.properties-panel h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.layer-properties,
.crop-properties,
.text-properties {
  color: #666;
}

.layer-properties p,
.crop-properties p,
.text-properties p {
  margin: 8px 0;
  font-size: 14px;
}

.integrated-controls {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.integrated-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.editor-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

/* 通用控件样式 */
.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #555;
}

.image-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-option {
  width: 50px;
  height: 50px;
  border: 2px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.image-option:hover {
  transform: scale(1.05);
}

.image-option.active {
  border-color: #007bff;
}

.image-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

button {
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  margin-right: 8px;
}

button:hover {
  background-color: #0069d9;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  background-color: white;
}

input[type="checkbox"] {
  margin-right: 5px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .layer-demo-container,
  .crop-demo-container,
  .text-demo-container {
    flex-direction: column;
  }

  .layer-wrapper,
  .crop-wrapper,
  .text-wrapper {
    height: 350px;
  }

  .layer-controls,
  .crop-controls,
  .text-controls {
    width: 100%;
  }

  .integrated-editor {
    height: 500px;
  }

  .integrated-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .toolbar-section {
    justify-content: center;
  }
}

/* 适配器加载状态 */
.adapter-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  background-color: #f5f5f5;
  border: 2px dashed #ddd;
  border-radius: 8px;
  color: #666;
  font-size: 16px;
}
</style>
