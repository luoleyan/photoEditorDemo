<template>
  <div class="advanced-components-demo">
    <div class="demo-header">
      <h1>高级功能组件演示</h1>
      <p>展示ImagePreview、HistoryPanel和FilterPanel组件的功能和交互</p>
    </div>

    <!-- 图像预览组件演示 -->
    <div class="demo-section">
      <h2>ImagePreview 图像预览组件</h2>
      <div class="demo-description">
        <p>支持缩放、平移、适合窗口、全屏预览和前后对比等功能</p>
      </div>
      
      <div class="preview-demo-container">
        <div class="preview-wrapper">
          <image-preview
            :image-src="currentImage"
            :compare-src="compareImage"
            :show-controls="true"
            :show-thumbnail="showThumbnail"
            :show-fullscreen-button="true"
            :show-compare-button="true"
            :variant="previewVariant"
            @image-loaded="handleImageLoaded"
            @scale-change="handleScaleChange"
            @fullscreen-change="handleFullscreenChange"
            @compare-mode-change="handleCompareModeChange"
          />
        </div>
        
        <div class="preview-controls">
          <h3>控制选项</h3>
          <div class="control-group">
            <label>选择图像:</label>
            <div class="image-selector">
              <div 
                v-for="(image, index) in demoImages" 
                :key="index"
                class="image-option"
                :class="{ 'active': currentImage === image.src }"
                @click="selectImage(image.src)"
              >
                <img :src="image.src" :alt="image.name" />
              </div>
            </div>
          </div>
          
          <div class="control-group">
            <label>对比图像:</label>
            <div class="image-selector">
              <div 
                v-for="(image, index) in demoImages" 
                :key="index"
                class="image-option"
                :class="{ 'active': compareImage === image.src }"
                @click="selectCompareImage(image.src)"
              >
                <img :src="image.src" :alt="image.name" />
              </div>
            </div>
          </div>
          
          <div class="control-group">
            <label>显示缩略图:</label>
            <input type="checkbox" v-model="showThumbnail" />
          </div>
          
          <div class="control-group">
            <label>变体样式:</label>
            <select v-model="previewVariant">
              <option value="default">默认</option>
              <option value="minimal">简约</option>
              <option value="dark">暗色</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录面板演示 -->
    <div class="demo-section">
      <h2>HistoryPanel 历史记录面板</h2>
      <div class="demo-description">
        <p>显示操作历史和撤销/重做功能，支持历史搜索和分支历史管理</p>
      </div>
      
      <div class="history-demo-container">
        <div class="history-wrapper">
          <history-panel
            :history-items="historyItems"
            :active-index="activeHistoryIndex"
            :branches="historyBranches"
            :active-branch-id="activeBranchId"
            :show-branches="showBranches"
            :variant="historyVariant"
            @item-click="handleHistoryItemClick"
            @undo="handleUndo"
            @redo="handleRedo"
            @branch-click="handleBranchClick"
            @clear-history="handleClearHistory"
          />
        </div>
        
        <div class="history-controls">
          <h3>控制选项</h3>
          <div class="control-group">
            <button @click="addHistoryItem()">添加历史项</button>
            <button @click="toggleBranches">{{ showBranches ? '隐藏分支' : '显示分支' }}</button>
          </div>
          
          <div class="control-group">
            <label>变体样式:</label>
            <select v-model="historyVariant">
              <option value="default">默认</option>
              <option value="compact">紧凑</option>
              <option value="minimal">简约</option>
            </select>
          </div>
          
          <div class="history-preview">
            <h4>当前状态</h4>
            <p>活动索引: {{ activeHistoryIndex }}</p>
            <p>活动项: {{ activeHistoryIndex >= 0 ? historyItems[activeHistoryIndex].name : '无' }}</p>
            <p>历史项数量: {{ historyItems.length }}</p>
            <p>活动分支: {{ activeBranchName }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 滤镜面板演示 -->
    <div class="demo-section">
      <h2>FilterPanel 滤镜面板</h2>
      <div class="demo-description">
        <p>提供各种图像滤镜效果，支持参数调整和自定义滤镜组合</p>
      </div>
      
      <div class="filter-demo-container">
        <div class="filter-wrapper">
          <filter-panel
            :available-filters="availableFilters"
            :active-filter-id="activeFilterId"
            :custom-filters="customFilters"
            :filter-categories="filterCategories"
            :active-category-id="activeCategoryId"
            :preview-image-src="filterPreviewImage"
            :parameter-values="filterParameterValues"
            :variant="filterVariant"
            @filter-select="handleFilterSelect"
            @parameter-change="handleFilterParamChange"
            @category-select="handleCategorySelect"
            @filter-reset="handleFilterReset"
            @all-filters-reset="handleAllFiltersReset"
            @custom-filter-save="handleCustomFilterSave"
            @custom-filter-delete="handleCustomFilterDelete"
          />
        </div>
        
        <div class="filter-preview-area">
          <h3>滤镜效果预览</h3>
          <div class="filter-result-container">
            <img 
              :src="filterPreviewImage" 
              class="filter-result-image"
              :style="currentFilterStyle"
              alt="滤镜效果预览"
            />
          </div>
          
          <div class="filter-info">
            <h4>当前滤镜: {{ currentFilterName }}</h4>
            <p v-if="activeFilter && activeFilter.description">{{ activeFilter.description }}</p>
            <div v-if="activeFilter && activeFilter.parameters" class="filter-params-info">
              <p>参数值:</p>
              <ul>
                <li v-for="param in activeFilter.parameters" :key="param.id">
                  {{ param.name }}: {{ getCurrentParamValue(param) }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 集成演示 -->
    <div class="demo-section">
      <h2>组件集成演示</h2>
      <div class="demo-description">
        <p>展示三个组件的集成效果，模拟完整的图像编辑流程</p>
      </div>
      
      <div class="integrated-demo-container">
        <div class="integrated-editor">
          <editor-container
            :theme="editorTheme"
            :loading="editorLoading"
            loading-text="正在处理图像..."
          >
            <!-- 顶部工具栏 -->
            <template #toolbar-top>
              <editor-toolbar
                :tool-groups="editorToolGroups"
                :active-tool-id="activeToolId"
                @tool-click="handleToolClick"
              />
            </template>

            <!-- 左侧面板 - 历史记录 -->
            <template #sidebar-left>
              <history-panel
                :history-items="historyItems"
                :active-index="activeHistoryIndex"
                :variant="historyVariant"
                @item-click="handleHistoryItemClick"
                @undo="handleUndo"
                @redo="handleRedo"
              />
            </template>

            <!-- 画布区域 - 图像预览 -->
            <template #canvas>
              <image-preview
                :image-src="currentImage"
                :compare-src="compareImage"
                :show-controls="true"
                :show-thumbnail="true"
                :variant="previewVariant"
                @scale-change="handleScaleChange"
              />
            </template>

            <!-- 右侧面板 - 滤镜 -->
            <template #sidebar-right>
              <filter-panel
                :available-filters="availableFilters"
                :active-filter-id="activeFilterId"
                :custom-filters="customFilters"
                :preview-image-src="filterPreviewImage"
                :parameter-values="filterParameterValues"
                :variant="filterVariant"
                @filter-select="handleFilterSelect"
                @parameter-change="handleFilterParamChange"
              />
            </template>

            <!-- 状态栏 -->
            <template #status-bar>
              <div class="editor-status">
                <span>当前工具: {{ activeToolName }}</span>
                <span>缩放: {{ Math.round(currentScale * 100) }}%</span>
                <span>滤镜: {{ currentFilterName }}</span>
                <span>历史: {{ activeHistoryIndex + 1 }}/{{ historyItems.length }}</span>
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
            <button @click="simulateLoading">模拟加载</button>
            <button @click="applyRandomFilter">应用随机滤镜</button>
            <button @click="resetIntegrated">重置演示</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImagePreview from '@/components/ui/ImagePreview.vue';
import HistoryPanel from '@/components/ui/HistoryPanel.vue';
import FilterPanel from '@/components/ui/FilterPanel.vue';
import EditorContainer from '@/components/ui/EditorContainer.vue';
import EditorToolbar from '@/components/ui/EditorToolbar.vue';

export default {
  name: 'AdvancedComponentsDemo',
  components: {
    ImagePreview,
    HistoryPanel,
    FilterPanel,
    EditorContainer,
    EditorToolbar
  },

  data() {
    return {
      // 图像预览相关
      currentImage: 'https://picsum.photos/800/600?random=1',
      compareImage: 'https://picsum.photos/800/600?random=2',
      showThumbnail: true,
      previewVariant: 'default',
      currentScale: 1,

      // 演示图像
      demoImages: [
        { name: '风景1', src: 'https://picsum.photos/800/600?random=1' },
        { name: '风景2', src: 'https://picsum.photos/800/600?random=2' },
        { name: '风景3', src: 'https://picsum.photos/800/600?random=3' },
        { name: '风景4', src: 'https://picsum.photos/800/600?random=4' }
      ],

      // 历史记录相关
      historyItems: [
        {
          id: 'init',
          name: '初始状态',
          description: '打开图像',
          icon: 'image',
          timestamp: Date.now() - 300000
        },
        {
          id: 'crop',
          name: '裁剪',
          description: '裁剪图像为 800x600',
          icon: 'crop',
          timestamp: Date.now() - 240000
        },
        {
          id: 'brightness',
          name: '调整亮度',
          description: '亮度 +20',
          icon: 'brightness',
          timestamp: Date.now() - 180000
        },
        {
          id: 'filter',
          name: '应用滤镜',
          description: '应用复古滤镜',
          icon: 'filter',
          timestamp: Date.now() - 120000
        },
        {
          id: 'rotate',
          name: '旋转',
          description: '顺时针旋转 90°',
          icon: 'rotate',
          timestamp: Date.now() - 60000
        }
      ],
      activeHistoryIndex: 4,
      historyVariant: 'default',
      showBranches: false,
      historyBranches: [
        {
          id: 'main',
          name: '主分支',
          itemCount: 5
        },
        {
          id: 'experiment',
          name: '实验分支',
          itemCount: 3
        }
      ],
      activeBranchId: 'main',

      // 滤镜相关
      activeFilterId: '',
      filterVariant: 'default',
      filterPreviewImage: 'https://picsum.photos/400/300?random=5',
      filterParameterValues: {},
      customFilters: [
        {
          id: 'custom1',
          name: '我的复古风格',
          description: '自定义复古滤镜',
          baseFilterId: 'vintage',
          parameterValues: {
            vintage: { sepia: 80, contrast: 110, brightness: 95 }
          }
        }
      ],
      activeCategoryId: 'all',

      // 可用滤镜
      availableFilters: [
        {
          id: 'none',
          name: '无滤镜',
          cssFilter: 'none',
          parameters: []
        },
        {
          id: 'grayscale',
          name: '灰度',
          cssFilter: 'grayscale(100%)',
          parameters: [
            {
              id: 'intensity',
              name: '强度',
              min: 0,
              max: 100,
              step: 1,
              defaultValue: 100,
              description: '灰度效果强度'
            }
          ]
        },
        {
          id: 'sepia',
          name: '复古',
          cssFilter: 'sepia(100%)',
          parameters: [
            {
              id: 'intensity',
              name: '强度',
              min: 0,
              max: 100,
              step: 1,
              defaultValue: 100,
              description: '复古效果强度'
            }
          ]
        },
        {
          id: 'blur',
          name: '模糊',
          cssFilter: 'blur(5px)',
          parameters: [
            {
              id: 'radius',
              name: '模糊半径',
              min: 0,
              max: 20,
              step: 0.5,
              defaultValue: 5,
              description: '模糊效果半径'
            }
          ]
        },
        {
          id: 'brightness',
          name: '亮度',
          cssFilter: 'brightness(120%)',
          parameters: [
            {
              id: 'value',
              name: '亮度值',
              min: 0,
              max: 200,
              step: 1,
              defaultValue: 120,
              description: '图像亮度调整'
            }
          ]
        },
        {
          id: 'contrast',
          name: '对比度',
          cssFilter: 'contrast(120%)',
          parameters: [
            {
              id: 'value',
              name: '对比度值',
              min: 0,
              max: 200,
              step: 1,
              defaultValue: 120,
              description: '图像对比度调整'
            }
          ]
        },
        {
          id: 'saturate',
          name: '饱和度',
          cssFilter: 'saturate(150%)',
          parameters: [
            {
              id: 'value',
              name: '饱和度值',
              min: 0,
              max: 300,
              step: 1,
              defaultValue: 150,
              description: '图像饱和度调整'
            }
          ]
        }
      ],

      // 滤镜分类
      filterCategories: [
        { id: 'all', name: '全部' },
        { id: 'basic', name: '基础' },
        { id: 'artistic', name: '艺术' },
        { id: 'vintage', name: '复古' }
      ],

      // 集成演示相关
      editorTheme: 'light',
      editorLoading: false,
      activeToolId: 'select',

      // 编辑器工具组
      editorToolGroups: [
        {
          id: 'file',
          title: '文件',
          tools: [
            { id: 'open', label: '打开', icon: 'folder' },
            { id: 'save', label: '保存', icon: 'save' }
          ]
        },
        {
          id: 'edit',
          title: '编辑',
          tools: [
            { id: 'select', label: '选择', icon: 'cursor' },
            { id: 'crop', label: '裁剪', icon: 'crop' },
            { id: 'rotate', label: '旋转', icon: 'rotate' }
          ]
        }
      ]
    };
  },

  computed: {
    // 当前活动滤镜
    activeFilter() {
      return this.availableFilters.find(f => f.id === this.activeFilterId) || null;
    },

    // 当前滤镜名称
    currentFilterName() {
      return this.activeFilter ? this.activeFilter.name : '无';
    },

    // 当前滤镜样式
    currentFilterStyle() {
      if (!this.activeFilter) return {};

      let filterValue = this.activeFilter.cssFilter;

      // 应用参数值
      if (this.activeFilter.parameters && this.filterParameterValues[this.activeFilterId]) {
        const params = this.filterParameterValues[this.activeFilterId];

        // 根据滤镜类型应用参数
        switch (this.activeFilterId) {
          case 'grayscale':
            filterValue = `grayscale(${params.intensity || 100}%)`;
            break;
          case 'sepia':
            filterValue = `sepia(${params.intensity || 100}%)`;
            break;
          case 'blur':
            filterValue = `blur(${params.radius || 5}px)`;
            break;
          case 'brightness':
            filterValue = `brightness(${params.value || 120}%)`;
            break;
          case 'contrast':
            filterValue = `contrast(${params.value || 120}%)`;
            break;
          case 'saturate':
            filterValue = `saturate(${params.value || 150}%)`;
            break;
        }
      }

      return { filter: filterValue };
    },

    // 活动分支名称
    activeBranchName() {
      const branch = this.historyBranches.find(b => b.id === this.activeBranchId);
      return branch ? branch.name : '未知分支';
    },

    // 当前工具名称
    activeToolName() {
      const toolNames = {
        'select': '选择工具',
        'crop': '裁剪工具',
        'rotate': '旋转工具',
        'open': '打开文件',
        'save': '保存文件'
      };
      return toolNames[this.activeToolId] || this.activeToolId;
    }
  },

  mounted() {
    // 确保页面加载时保持在顶部
    this.$nextTick(() => {
      // 保存当前滚动位置
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // 如果页面不在顶部，平滑滚动到顶部
      if (currentScrollTop > 0) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  },

  methods: {
    // ========== 图像预览相关方法 ==========

    /**
     * 选择图像
     */
    selectImage(src) {
      this.currentImage = src;
      this.addHistoryItem('change-image', '更换图像', '更换为新图像');
    },

    /**
     * 选择对比图像
     */
    selectCompareImage(src) {
      this.compareImage = src;
    },

    /**
     * 处理图像加载完成
     */
    handleImageLoaded(data) {
      console.log('图像加载完成:', data);
    },

    /**
     * 处理缩放变化
     */
    handleScaleChange(scale) {
      this.currentScale = scale;
    },

    /**
     * 处理全屏变化
     */
    handleFullscreenChange(isFullscreen) {
      console.log('全屏状态变化:', isFullscreen);
    },

    /**
     * 处理对比模式变化
     */
    handleCompareModeChange(compareMode) {
      console.log('对比模式变化:', compareMode);
    },

    // ========== 历史记录相关方法 ==========

    /**
     * 处理历史记录项点击
     */
    handleHistoryItemClick(event) {
      this.activeHistoryIndex = event.index;
      console.log('历史记录项点击:', event);
    },

    /**
     * 处理撤销
     */
    handleUndo() {
      if (this.activeHistoryIndex > 0) {
        this.activeHistoryIndex--;
        console.log('撤销到:', this.historyItems[this.activeHistoryIndex].name);
      }
    },

    /**
     * 处理重做
     */
    handleRedo() {
      if (this.activeHistoryIndex < this.historyItems.length - 1) {
        this.activeHistoryIndex++;
        console.log('重做到:', this.historyItems[this.activeHistoryIndex].name);
      }
    },

    /**
     * 处理分支点击
     */
    handleBranchClick(branch) {
      this.activeBranchId = branch.id;
      console.log('切换到分支:', branch.name);
    },

    /**
     * 处理清空历史
     */
    handleClearHistory() {
      this.historyItems = [this.historyItems[0]]; // 保留初始状态
      this.activeHistoryIndex = 0;
      console.log('历史记录已清空');
    },

    /**
     * 添加历史记录项
     */
    addHistoryItem(id = null, name = null, description = null) {
      // 验证参数类型，防止传入事件对象
      if (typeof id === 'object' && id !== null && !(id instanceof String)) {
        console.warn('addHistoryItem: 检测到非字符串id参数，可能是事件对象:', id);
        id = null; // 重置为null，使用默认生成逻辑
      }

      // 生成唯一ID，即使基础id相同也要确保唯一性
      let uniqueId;
      if (id) {
        // 检查是否已存在相同的id，如果存在则添加时间戳后缀
        const existingIds = this.historyItems.map(item => item.id);
        if (existingIds.includes(id)) {
          uniqueId = `${id}-${Date.now()}`;
        } else {
          uniqueId = id;
        }
      } else {
        uniqueId = `item-${Date.now()}`;
      }

      const newItem = {
        id: uniqueId,
        name: name || `操作 ${this.historyItems.length}`,
        description: description || '新的编辑操作',
        icon: 'edit',
        timestamp: Date.now()
      };

      // 如果当前不在最新状态，删除后续历史
      if (this.activeHistoryIndex < this.historyItems.length - 1) {
        this.historyItems = this.historyItems.slice(0, this.activeHistoryIndex + 1);
      }

      this.historyItems.push(newItem);
      this.activeHistoryIndex = this.historyItems.length - 1;
    },

    /**
     * 切换分支显示
     */
    toggleBranches() {
      this.showBranches = !this.showBranches;
    },

    // ========== 滤镜相关方法 ==========

    /**
     * 处理滤镜选择
     */
    handleFilterSelect(filter) {
      this.activeFilterId = filter.id;

      // 初始化参数值
      if (!this.filterParameterValues[filter.id]) {
        this.$set(this.filterParameterValues, filter.id, {});

        // 设置默认参数值
        if (filter.parameters) {
          filter.parameters.forEach(param => {
            this.$set(this.filterParameterValues[filter.id], param.id, param.defaultValue);
          });
        }
      }

      this.addHistoryItem(`filter-${filter.id}`, `应用滤镜`, `应用${filter.name}滤镜`);
      console.log('选择滤镜:', filter.name);
    },

    /**
     * 处理滤镜参数变化
     */
    handleFilterParamChange(event) {
      if (!this.filterParameterValues[event.filterId]) {
        this.$set(this.filterParameterValues, event.filterId, {});
      }

      this.$set(this.filterParameterValues[event.filterId], event.parameterId, event.value);
      console.log('滤镜参数变化:', event);
    },

    /**
     * 处理分类选择
     */
    handleCategorySelect(category) {
      this.activeCategoryId = category.id;
      console.log('选择分类:', category.name);
    },

    /**
     * 处理滤镜重置
     */
    handleFilterReset(filter) {
      if (filter.parameters) {
        const resetValues = {};
        filter.parameters.forEach(param => {
          resetValues[param.id] = param.defaultValue;
        });
        this.$set(this.filterParameterValues, filter.id, resetValues);
      }
      console.log('重置滤镜:', filter.name);
    },

    /**
     * 处理所有滤镜重置
     */
    handleAllFiltersReset() {
      this.activeFilterId = '';
      this.filterParameterValues = {};
      console.log('重置所有滤镜');
    },

    /**
     * 处理自定义滤镜保存
     */
    handleCustomFilterSave(customFilter) {
      const newFilter = {
        ...customFilter,
        id: `custom-${Date.now()}`
      };
      this.customFilters.push(newFilter);
      console.log('保存自定义滤镜:', newFilter);
    },

    /**
     * 处理自定义滤镜删除
     */
    handleCustomFilterDelete(filter) {
      const index = this.customFilters.findIndex(f => f.id === filter.id);
      if (index !== -1) {
        this.customFilters.splice(index, 1);
        console.log('删除自定义滤镜:', filter.name);
      }
    },

    /**
     * 获取当前参数值
     */
    getCurrentParamValue(param) {
      if (!this.activeFilterId || !this.filterParameterValues[this.activeFilterId]) {
        return param.defaultValue;
      }

      const value = this.filterParameterValues[this.activeFilterId][param.id];
      return value !== undefined ? value : param.defaultValue;
    },

    // ========== 集成演示相关方法 ==========

    /**
     * 处理工具点击
     */
    handleToolClick(event) {
      this.activeToolId = event.toolId;

      // 添加历史记录
      this.addHistoryItem(`tool-${event.toolId}`, `使用工具`, `使用${this.activeToolName}`);
      console.log('工具点击:', event);
    },

    /**
     * 模拟加载
     */
    simulateLoading() {
      this.editorLoading = true;

      setTimeout(() => {
        this.editorLoading = false;
      }, 2000);
    },

    /**
     * 应用随机滤镜
     */
    applyRandomFilter() {
      const randomIndex = Math.floor(Math.random() * this.availableFilters.length);
      const randomFilter = this.availableFilters[randomIndex];
      this.handleFilterSelect(randomFilter);
    },

    /**
     * 重置演示
     */
    resetIntegrated() {
      this.activeToolId = 'select';
      this.activeFilterId = '';
      this.filterParameterValues = {};
      this.currentScale = 1;
      this.editorLoading = false;

      // 重置历史记录
      this.historyItems = [this.historyItems[0]];
      this.activeHistoryIndex = 0;

      console.log('演示已重置');
    }
  }
};
</script>

<style scoped>
.advanced-components-demo {
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

/* 图像预览演示 */
.preview-demo-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.preview-wrapper {
  flex: 1;
  min-width: 300px;
  height: 400px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.preview-controls {
  width: 250px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.preview-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

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

/* 历史记录演示 */
.history-demo-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.history-wrapper {
  flex: 1;
  min-width: 300px;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.history-controls {
  width: 250px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.history-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.history-preview {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.history-preview h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.history-preview p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

/* 滤镜演示 */
.filter-demo-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.filter-wrapper {
  flex: 1;
  min-width: 300px;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.filter-preview-area {
  width: 300px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.filter-preview-area h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.filter-result-container {
  width: 100%;
  height: 200px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.filter-result-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.filter-info {
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.filter-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.filter-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

.filter-params-info {
  margin-top: 10px;
}

.filter-params-info ul {
  margin: 5px 0;
  padding-left: 20px;
}

.filter-params-info li {
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
  .preview-demo-container,
  .history-demo-container,
  .filter-demo-container {
    flex-direction: column;
  }

  .preview-wrapper,
  .history-wrapper,
  .filter-wrapper {
    height: 350px;
  }

  .preview-controls,
  .history-controls,
  .filter-preview-area {
    width: 100%;
  }

  .integrated-editor {
    height: 500px;
  }
}
</style>
