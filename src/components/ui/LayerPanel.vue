<template>
  <div class="layer-panel" :class="panelClasses">
    <div class="panel-header" v-if="showHeader">
      <h3 class="panel-title">{{ title }}</h3>
      <div class="panel-actions">
        <button 
          class="add-layer-button"
          @click="handleAddLayer"
          :disabled="disabled"
          title="添加图层"
        >
          <i class="icon-plus"></i>
        </button>
        
        <button 
          v-if="showDeleteButton && selectedLayers.length > 0" 
          class="delete-layer-button"
          @click="handleDeleteLayers"
          :disabled="disabled"
          title="删除选中图层"
        >
          <i class="icon-trash"></i>
        </button>
      </div>
    </div>
    
    <div class="panel-content">
      <!-- 图层列表 -->
      <div class="layers-list" ref="layersList">
        <draggable
          v-model="layersData"
          :disabled="disabled"
          ghost-class="layer-ghost"
          chosen-class="layer-chosen"
          drag-class="layer-drag"
          @start="handleDragStart"
          @end="handleDragEnd"
          @change="handleLayersReorder"
        >
          <div
            v-for="layer in layersData"
            :key="layer.id"
            class="layer-item"
            :class="{ 
              'active': isLayerSelected(layer),
              'disabled': layer.locked || disabled,
              'hidden': !layer.visible
            }"
            @click="handleLayerClick(layer, $event)"
            @contextmenu="handleLayerContextMenu(layer, $event)"
          >
            <!-- 图层缩略图 -->
            <div class="layer-thumbnail">
              <img 
                v-if="layer.thumbnail" 
                :src="layer.thumbnail" 
                :alt="layer.name"
                class="thumbnail-image"
              />
              <div v-else class="thumbnail-placeholder">
                <i :class="`icon-${layer.type || 'layer'}`"></i>
              </div>
              
              <!-- 图层类型标识 -->
              <div v-if="layer.type && layer.type !== 'image'" class="layer-type-badge">
                <i :class="`icon-${layer.type}`"></i>
              </div>
            </div>
            
            <!-- 图层信息 -->
            <div class="layer-info">
              <div class="layer-name-container">
                <input 
                  v-if="editingLayerId === layer.id"
                  type="text"
                  class="layer-name-input"
                  v-model="editingLayerName"
                  @blur="handleNameEditComplete"
                  @keyup.enter="handleNameEditComplete"
                  @keyup.esc="handleNameEditCancel"
                  ref="nameInput"
                />
                <div 
                  v-else
                  class="layer-name"
                  @dblclick="handleNameEdit(layer)"
                >
                  {{ layer.name }}
                </div>
              </div>
              
              <div class="layer-details">
                <span class="layer-blend-mode">{{ getBlendModeName(layer.blendMode) }}</span>
                <span class="layer-opacity">{{ Math.round(layer.opacity * 100) }}%</span>
              </div>
            </div>
            
            <!-- 图层控制 -->
            <div class="layer-controls">
              <!-- 可见性控制 -->
              <button 
                class="visibility-button"
                :class="{ 'visible': layer.visible }"
                @click.stop="handleVisibilityToggle(layer)"
                :disabled="disabled"
                :title="layer.visible ? '隐藏图层' : '显示图层'"
              >
                <i :class="layer.visible ? 'icon-eye' : 'icon-eye-off'"></i>
              </button>
              
              <!-- 锁定控制 -->
              <button 
                class="lock-button"
                :class="{ 'locked': layer.locked }"
                @click.stop="handleLockToggle(layer)"
                :disabled="disabled"
                :title="layer.locked ? '解锁图层' : '锁定图层'"
              >
                <i :class="layer.locked ? 'icon-lock' : 'icon-unlock'"></i>
              </button>
            </div>
          </div>
        </draggable>
      </div>
      
      <!-- 空状态 -->
      <div v-if="layersData.length === 0" class="empty-state">
        <i class="icon-layers"></i>
        <p>{{ emptyText }}</p>
        <button class="add-first-layer-button" @click="handleAddLayer">
          添加第一个图层
        </button>
      </div>
    </div>
    
    <!-- 图层属性面板 -->
    <div v-if="showProperties && selectedLayer" class="layer-properties">
      <h4 class="properties-title">图层属性</h4>
      
      <!-- 不透明度控制 -->
      <div class="property-group">
        <label>不透明度</label>
        <div class="opacity-control">
          <input 
            type="range" 
            class="opacity-slider"
            :value="selectedLayer.opacity * 100"
            min="0" 
            max="100" 
            step="1"
            @input="handleOpacityChange"
            :disabled="disabled || selectedLayer.locked"
          />
          <span class="opacity-value">{{ Math.round(selectedLayer.opacity * 100) }}%</span>
        </div>
      </div>
      
      <!-- 混合模式控制 -->
      <div class="property-group">
        <label>混合模式</label>
        <select 
          class="blend-mode-select"
          :value="selectedLayer.blendMode"
          @change="handleBlendModeChange"
          :disabled="disabled || selectedLayer.locked"
        >
          <option 
            v-for="mode in blendModes" 
            :key="mode.value"
            :value="mode.value"
          >
            {{ mode.name }}
          </option>
        </select>
      </div>
      
      <!-- 图层操作 -->
      <div class="property-group">
        <label>操作</label>
        <div class="layer-actions">
          <button 
            class="action-button"
            @click="handleDuplicateLayer"
            :disabled="disabled || selectedLayer.locked"
          >
            <i class="icon-copy"></i>
            <span>复制</span>
          </button>
          
          <button 
            class="action-button"
            @click="handleMergeDown"
            :disabled="disabled || selectedLayer.locked || !canMergeDown"
          >
            <i class="icon-merge"></i>
            <span>向下合并</span>
          </button>
          
          <button 
            class="action-button"
            @click="handleFlattenLayer"
            :disabled="disabled || selectedLayer.locked"
          >
            <i class="icon-flatten"></i>
            <span>拼合</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 右键菜单 -->
    <div 
      v-if="showContextMenu" 
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      ref="contextMenu"
    >
      <div class="menu-item" @click="handleDuplicateLayer">
        <i class="icon-copy"></i>
        <span>复制图层</span>
      </div>
      <div class="menu-item" @click="handleDeleteLayers">
        <i class="icon-trash"></i>
        <span>删除图层</span>
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" @click="handleMergeDown" :class="{ 'disabled': !canMergeDown }">
        <i class="icon-merge"></i>
        <span>向下合并</span>
      </div>
      <div class="menu-item" @click="handleFlattenLayer">
        <i class="icon-flatten"></i>
        <span>拼合图层</span>
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" @click="handleLayerToTop">
        <i class="icon-to-top"></i>
        <span>移到顶层</span>
      </div>
      <div class="menu-item" @click="handleLayerToBottom">
        <i class="icon-to-bottom"></i>
        <span>移到底层</span>
      </div>
    </div>
    
    <!-- 确认对话框 -->
    <div v-if="showConfirmDialog" class="confirm-dialog">
      <div class="dialog-content">
        <h4>{{ confirmDialogTitle }}</h4>
        <p>{{ confirmDialogMessage }}</p>
        <div class="dialog-buttons">
          <button class="cancel-button" @click="cancelConfirmDialog">
            取消
          </button>
          <button class="confirm-button" @click="confirmDialogAction">
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable';

export default {
  name: 'LayerPanel',
  components: {
    draggable
  },
  
  props: {
    // 面板标题
    title: {
      type: String,
      default: '图层'
    },
    
    // 图层数据
    layers: {
      type: Array,
      default: () => []
    },
    
    // 选中的图层ID
    selectedLayerIds: {
      type: Array,
      default: () => []
    },
    
    // 显示选项
    showHeader: {
      type: Boolean,
      default: true
    },
    showDeleteButton: {
      type: Boolean,
      default: true
    },
    showProperties: {
      type: Boolean,
      default: true
    },
    
    // 状态
    disabled: {
      type: Boolean,
      default: false
    },
    
    // 文本选项
    emptyText: {
      type: String,
      default: '暂无图层'
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
      // 图层数据副本（用于拖拽排序）
      layersData: [],
      
      // 编辑状态
      editingLayerId: '',
      editingLayerName: '',
      
      // 右键菜单
      showContextMenu: false,
      contextMenuX: 0,
      contextMenuY: 0,
      contextMenuLayer: null,
      
      // 确认对话框
      showConfirmDialog: false,
      confirmDialogTitle: '',
      confirmDialogMessage: '',
      confirmDialogCallback: null,
      
      // 混合模式选项
      blendModes: [
        { value: 'normal', name: '正常' },
        { value: 'multiply', name: '正片叠底' },
        { value: 'screen', name: '滤色' },
        { value: 'overlay', name: '叠加' },
        { value: 'soft-light', name: '柔光' },
        { value: 'hard-light', name: '强光' },
        { value: 'color-dodge', name: '颜色减淡' },
        { value: 'color-burn', name: '颜色加深' },
        { value: 'darken', name: '变暗' },
        { value: 'lighten', name: '变亮' },
        { value: 'difference', name: '差值' },
        { value: 'exclusion', name: '排除' }
      ]
    };
  },
  
  computed: {
    panelClasses() {
      return {
        [`variant-${this.variant}`]: true,
        'disabled': this.disabled
      };
    },
    
    // 选中的图层
    selectedLayers() {
      return this.layersData.filter(layer => this.selectedLayerIds.includes(layer.id));
    },
    
    // 当前选中的单个图层
    selectedLayer() {
      return this.selectedLayers.length === 1 ? this.selectedLayers[0] : null;
    },
    
    // 是否可以向下合并
    canMergeDown() {
      if (!this.selectedLayer) return false;
      
      const index = this.layersData.findIndex(layer => layer.id === this.selectedLayer.id);
      return index < this.layersData.length - 1;
    }
  },
  
  watch: {
    layers: {
      immediate: true,
      deep: true,
      handler(newLayers) {
        this.layersData = [...newLayers];
      }
    },
    
    layersData: {
      deep: true,
      handler(newLayers) {
        this.$emit('layers-change', newLayers);
      }
    }
  },
  
  mounted() {
    // 监听全局点击事件，用于关闭右键菜单
    document.addEventListener('click', this.handleDocumentClick);
  },
  
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocumentClick);
  },

  methods: {
    /**
     * 处理图层点击
     */
    handleLayerClick(layer, event) {
      if (this.disabled || layer.locked) return;

      let selectedIds = [...this.selectedLayerIds];

      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd + 点击：多选
        const index = selectedIds.indexOf(layer.id);
        if (index !== -1) {
          selectedIds.splice(index, 1);
        } else {
          selectedIds.push(layer.id);
        }
      } else if (event.shiftKey && selectedIds.length > 0) {
        // Shift + 点击：范围选择
        const lastSelectedIndex = this.layersData.findIndex(l => l.id === selectedIds[selectedIds.length - 1]);
        const currentIndex = this.layersData.findIndex(l => l.id === layer.id);

        const startIndex = Math.min(lastSelectedIndex, currentIndex);
        const endIndex = Math.max(lastSelectedIndex, currentIndex);

        selectedIds = this.layersData.slice(startIndex, endIndex + 1).map(l => l.id);
      } else {
        // 普通点击：单选
        selectedIds = [layer.id];
      }

      this.$emit('layer-select', selectedIds);
    },

    /**
     * 处理图层右键菜单
     */
    handleLayerContextMenu(layer, event) {
      if (this.disabled) return;

      event.preventDefault();

      // 如果右键的图层没有被选中，则选中它
      if (!this.selectedLayerIds.includes(layer.id)) {
        this.$emit('layer-select', [layer.id]);
      }

      this.contextMenuLayer = layer;
      this.contextMenuX = event.clientX;
      this.contextMenuY = event.clientY;
      this.showContextMenu = true;
    },

    /**
     * 处理文档点击（关闭右键菜单）
     */
    handleDocumentClick(event) {
      if (this.showContextMenu && this.$refs.contextMenu && !this.$refs.contextMenu.contains(event.target)) {
        this.showContextMenu = false;
      }
    },

    /**
     * 检查图层是否被选中
     */
    isLayerSelected(layer) {
      return this.selectedLayerIds.includes(layer.id);
    },

    /**
     * 处理可见性切换
     */
    handleVisibilityToggle(layer) {
      if (this.disabled) return;

      this.$emit('layer-visibility-change', {
        layerId: layer.id,
        visible: !layer.visible
      });
    },

    /**
     * 处理锁定切换
     */
    handleLockToggle(layer) {
      if (this.disabled) return;

      this.$emit('layer-lock-change', {
        layerId: layer.id,
        locked: !layer.locked
      });
    },

    /**
     * 处理不透明度变化
     */
    handleOpacityChange(event) {
      if (this.disabled || !this.selectedLayer || this.selectedLayer.locked) return;

      const opacity = parseFloat(event.target.value) / 100;
      this.$emit('layer-opacity-change', {
        layerId: this.selectedLayer.id,
        opacity
      });
    },

    /**
     * 处理混合模式变化
     */
    handleBlendModeChange(event) {
      if (this.disabled || !this.selectedLayer || this.selectedLayer.locked) return;

      this.$emit('layer-blend-mode-change', {
        layerId: this.selectedLayer.id,
        blendMode: event.target.value
      });
    },

    /**
     * 处理图层名称编辑
     */
    handleNameEdit(layer) {
      if (this.disabled || layer.locked) return;

      this.editingLayerId = layer.id;
      this.editingLayerName = layer.name;

      this.$nextTick(() => {
        if (this.$refs.nameInput && this.$refs.nameInput[0]) {
          this.$refs.nameInput[0].focus();
          this.$refs.nameInput[0].select();
        }
      });
    },

    /**
     * 处理名称编辑完成
     */
    handleNameEditComplete() {
      if (this.editingLayerId && this.editingLayerName.trim()) {
        this.$emit('layer-name-change', {
          layerId: this.editingLayerId,
          name: this.editingLayerName.trim()
        });
      }

      this.editingLayerId = '';
      this.editingLayerName = '';
    },

    /**
     * 处理名称编辑取消
     */
    handleNameEditCancel() {
      this.editingLayerId = '';
      this.editingLayerName = '';
    },

    /**
     * 处理添加图层
     */
    handleAddLayer() {
      if (this.disabled) return;

      this.$emit('layer-add');
    },

    /**
     * 处理删除图层
     */
    handleDeleteLayers() {
      if (this.disabled || this.selectedLayers.length === 0) return;

      const layerNames = this.selectedLayers.map(layer => layer.name).join('、');

      this.showConfirmDialog = true;
      this.confirmDialogTitle = '删除图层';
      this.confirmDialogMessage = `确定要删除图层"${layerNames}"吗？此操作无法撤销。`;
      this.confirmDialogCallback = () => {
        this.$emit('layer-delete', this.selectedLayerIds);
        this.showContextMenu = false;
      };
    },

    /**
     * 处理复制图层
     */
    handleDuplicateLayer() {
      if (this.disabled || !this.selectedLayer || this.selectedLayer.locked) return;

      this.$emit('layer-duplicate', this.selectedLayer.id);
      this.showContextMenu = false;
    },

    /**
     * 处理向下合并
     */
    handleMergeDown() {
      if (this.disabled || !this.selectedLayer || this.selectedLayer.locked || !this.canMergeDown) return;

      this.$emit('layer-merge-down', this.selectedLayer.id);
      this.showContextMenu = false;
    },

    /**
     * 处理拼合图层
     */
    handleFlattenLayer() {
      if (this.disabled || !this.selectedLayer || this.selectedLayer.locked) return;

      this.showConfirmDialog = true;
      this.confirmDialogTitle = '拼合图层';
      this.confirmDialogMessage = '确定要拼合所有可见图层吗？此操作无法撤销。';
      this.confirmDialogCallback = () => {
        this.$emit('layer-flatten');
        this.showContextMenu = false;
      };
    },

    /**
     * 处理图层移到顶层
     */
    handleLayerToTop() {
      if (this.disabled || !this.selectedLayer || this.selectedLayer.locked) return;

      this.$emit('layer-move-to-top', this.selectedLayer.id);
      this.showContextMenu = false;
    },

    /**
     * 处理图层移到底层
     */
    handleLayerToBottom() {
      if (this.disabled || !this.selectedLayer || this.selectedLayer.locked) return;

      this.$emit('layer-move-to-bottom', this.selectedLayer.id);
      this.showContextMenu = false;
    },

    /**
     * 处理拖拽开始
     */
    handleDragStart() {
      // 拖拽开始时的处理
    },

    /**
     * 处理拖拽结束
     */
    handleDragEnd() {
      // 拖拽结束时的处理
    },

    /**
     * 处理图层重新排序
     */
    handleLayersReorder() {
      this.$emit('layers-reorder', this.layersData);
    },

    /**
     * 获取混合模式名称
     */
    getBlendModeName(blendMode) {
      const mode = this.blendModes.find(m => m.value === blendMode);
      return mode ? mode.name : '正常';
    },

    /**
     * 取消确认对话框
     */
    cancelConfirmDialog() {
      this.showConfirmDialog = false;
      this.confirmDialogCallback = null;
    },

    /**
     * 执行确认对话框操作
     */
    confirmDialogAction() {
      if (this.confirmDialogCallback) {
        this.confirmDialogCallback();
      }
      this.showConfirmDialog = false;
    }
  }
};
</script>

<style scoped>
.layer-panel {
  width: 100%;
  background-color: var(--panel-bg-color, #fff);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 变体样式 */
.layer-panel.variant-default {
  --panel-bg-color: #fff;
  --panel-border-color: #e8e8e8;
  --panel-title-color: #333;
  --panel-text-color: #666;
  --panel-item-bg: #fff;
  --panel-item-hover-bg: #f5f5f5;
  --panel-item-active-bg: #e6f7ff;
  --panel-item-active-color: #1890ff;
  --panel-item-disabled-color: #d9d9d9;
  border: 1px solid var(--panel-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.layer-panel.variant-compact {
  --panel-bg-color: #f5f5f5;
  --panel-border-color: #e8e8e8;
  --panel-title-color: #333;
  --panel-text-color: #666;
  --panel-item-bg: transparent;
  --panel-item-hover-bg: rgba(0, 0, 0, 0.05);
  --panel-item-active-bg: #e6f7ff;
  --panel-item-active-color: #1890ff;
  --panel-item-disabled-color: #d9d9d9;
  border: 1px solid var(--panel-border-color);
}

.layer-panel.variant-minimal {
  --panel-bg-color: transparent;
  --panel-border-color: transparent;
  --panel-title-color: #333;
  --panel-text-color: #666;
  --panel-item-bg: transparent;
  --panel-item-hover-bg: rgba(0, 0, 0, 0.05);
  --panel-item-active-bg: rgba(24, 144, 255, 0.1);
  --panel-item-active-color: #1890ff;
  --panel-item-disabled-color: #d9d9d9;
  box-shadow: none;
}

/* 面板头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--panel-border-color);
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--panel-title-color);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-layer-button,
.delete-layer-button {
  background: none;
  border: none;
  color: var(--panel-text-color);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.add-layer-button:hover {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
}

.delete-layer-button:hover {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
}

.add-layer-button:disabled,
.delete-layer-button:disabled {
  color: var(--panel-item-disabled-color);
  cursor: not-allowed;
}

/* 面板内容 */
.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 图层列表 */
.layers-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: var(--panel-item-bg);
  border-left: 3px solid transparent;
  user-select: none;
}

.layer-item:hover:not(.disabled) {
  background-color: var(--panel-item-hover-bg);
}

.layer-item.active {
  background-color: var(--panel-item-active-bg);
  border-left-color: var(--panel-item-active-color);
}

.layer-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.layer-item.hidden {
  opacity: 0.4;
}

/* 拖拽样式 */
.layer-ghost {
  opacity: 0.5;
}

.layer-chosen {
  background-color: var(--panel-item-active-bg);
}

.layer-drag {
  transform: rotate(5deg);
}

/* 图层缩略图 */
.layer-thumbnail {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background-color: #f0f0f0;
  border: 1px solid var(--panel-border-color);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--panel-text-color);
  font-size: 18px;
}

.layer-type-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
}

/* 图层信息 */
.layer-info {
  flex: 1;
  min-width: 0;
}

.layer-name-container {
  margin-bottom: 2px;
}

.layer-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--panel-title-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
}

.layer-name-input {
  width: 100%;
  padding: 2px 4px;
  border: 1px solid #40a9ff;
  border-radius: 2px;
  font-size: 14px;
  font-weight: 500;
  background-color: white;
  color: var(--panel-title-color);
}

.layer-name-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.layer-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--panel-text-color);
}

.layer-blend-mode {
  opacity: 0.8;
}

.layer-opacity {
  opacity: 0.8;
}

/* 图层控制 */
.layer-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.visibility-button,
.lock-button {
  background: none;
  border: none;
  color: var(--panel-text-color);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.2s;
}

.visibility-button:hover,
.lock-button:hover {
  opacity: 1;
  background-color: var(--panel-item-hover-bg);
}

.visibility-button.visible,
.lock-button.locked {
  opacity: 1;
  color: var(--panel-item-active-color);
}

.visibility-button:disabled,
.lock-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--panel-text-color);
}

.empty-state i {
  font-size: 48px;
  opacity: 0.3;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.add-first-layer-button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.add-first-layer-button:hover {
  background-color: #40a9ff;
}

/* 图层属性面板 */
.layer-properties {
  border-top: 1px solid var(--panel-border-color);
  padding: 16px;
  flex-shrink: 0;
}

.properties-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--panel-title-color);
}

.property-group {
  margin-bottom: 16px;
}

.property-group:last-child {
  margin-bottom: 0;
}

.property-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--panel-text-color);
  font-weight: 500;
}

/* 不透明度控制 */
.opacity-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.opacity-slider {
  flex: 1;
  height: 4px;
  background: linear-gradient(to right, transparent, var(--panel-title-color));
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background-color: #1890ff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.opacity-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background-color: #1890ff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.opacity-value {
  font-size: 12px;
  color: var(--panel-text-color);
  min-width: 35px;
  text-align: right;
}

/* 混合模式选择 */
.blend-mode-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--panel-border-color);
  border-radius: 4px;
  font-size: 12px;
  color: var(--panel-text-color);
  background-color: var(--panel-item-bg);
}

.blend-mode-select:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 图层操作 */
.layer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-button {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  background-color: var(--panel-item-bg);
  border: 1px solid var(--panel-border-color);
  border-radius: 4px;
  font-size: 12px;
  color: var(--panel-text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;
}

.action-button:hover:not(:disabled) {
  border-color: #40a9ff;
  color: #40a9ff;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background-color: white;
  border: 1px solid var(--panel-border-color);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  z-index: 1000;
  min-width: 150px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--panel-text-color);
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover:not(.disabled) {
  background-color: var(--panel-item-hover-bg);
  color: var(--panel-title-color);
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-separator {
  height: 1px;
  background-color: var(--panel-border-color);
  margin: 4px 0;
}

/* 确认对话框 */
.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 400px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.dialog-content h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--panel-title-color);
}

.dialog-content p {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--panel-text-color);
  line-height: 1.5;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-button,
.confirm-button {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background: none;
  border: 1px solid var(--panel-border-color);
  color: var(--panel-text-color);
}

.cancel-button:hover {
  background-color: var(--panel-item-hover-bg);
}

.confirm-button {
  background-color: #ff4d4f;
  border: 1px solid #ff4d4f;
  color: white;
}

.confirm-button:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

/* 禁用状态 */
.layer-panel.disabled {
  opacity: 0.7;
  pointer-events: none;
}

/* 滚动条样式 */
.layers-list::-webkit-scrollbar {
  width: 6px;
}

.layers-list::-webkit-scrollbar-track {
  background: var(--panel-bg-color);
}

.layers-list::-webkit-scrollbar-thumb {
  background: var(--panel-border-color);
  border-radius: 3px;
}

.layers-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 图标样式 */
.icon-plus::before { content: '+'; font-size: 16px; font-weight: bold; }
.icon-trash::before { content: '🗑'; font-size: 14px; }
.icon-eye::before { content: '👁'; font-size: 14px; }
.icon-eye-off::before { content: '🙈'; font-size: 14px; }
.icon-lock::before { content: '🔒'; font-size: 12px; }
.icon-unlock::before { content: '🔓'; font-size: 12px; }
.icon-layers::before { content: '📄'; font-size: 24px; }
.icon-layer::before { content: '📄'; font-size: 16px; }
.icon-image::before { content: '🖼'; font-size: 16px; }
.icon-text::before { content: 'T'; font-size: 16px; font-weight: bold; }
.icon-shape::before { content: '⬜'; font-size: 16px; }
.icon-copy::before { content: '📋'; font-size: 12px; }
.icon-merge::before { content: '⬇'; font-size: 12px; }
.icon-flatten::before { content: '📐'; font-size: 12px; }
.icon-to-top::before { content: '⬆'; font-size: 12px; }
.icon-to-bottom::before { content: '⬇'; font-size: 12px; }

/* 响应式样式 */
@media (max-width: 768px) {
  .panel-header {
    padding: 8px 12px;
  }

  .layer-item {
    padding: 6px 10px;
  }

  .layer-thumbnail {
    width: 32px;
    height: 32px;
    margin-right: 8px;
  }

  .layer-name {
    font-size: 13px;
  }

  .layer-details {
    font-size: 11px;
  }

  .layer-properties {
    padding: 12px;
  }

  .properties-title {
    font-size: 13px;
  }

  .action-button {
    padding: 4px 6px;
    font-size: 11px;
  }
}
</style>
