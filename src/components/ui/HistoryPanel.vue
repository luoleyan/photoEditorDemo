<template>
  <div class="history-panel" :class="panelClasses">
    <div class="panel-header" v-if="showHeader">
      <h3 class="panel-title">{{ title }}</h3>
      <div class="panel-actions">
        <div v-if="showSearch" class="search-container">
          <input 
            type="text" 
            class="search-input" 
            v-model="searchQuery" 
            placeholder="搜索历史记录..."
            @input="handleSearchInput"
          />
          <button 
            v-if="searchQuery" 
            class="clear-search-button"
            @click="clearSearch"
          >
            <i class="icon-close"></i>
          </button>
        </div>
        
        <button 
          v-if="showClearButton && historyItems.length > 0" 
          class="clear-button"
          @click="confirmClearHistory"
          :disabled="disabled"
        >
          <i class="icon-trash"></i>
          <span>清空历史</span>
        </button>
      </div>
    </div>
    
    <div class="panel-content">
      <!-- 历史记录列表 -->
      <div 
        v-if="filteredItems.length > 0" 
        class="history-list"
        ref="historyList"
      >
        <div
          v-for="(item, index) in filteredItems"
          :key="getItemKey(item, index)"
          class="history-item"
          :class="{ 
            'active': isItemActive(item), 
            'disabled': isItemDisabled(item),
            'highlighted': isItemHighlighted(item)
          }"
          @click="handleItemClick(item, index)"
        >
          <!-- 历史记录项内容 -->
          <div class="item-content">
            <!-- 缩略图 -->
            <div v-if="showThumbnails && item.thumbnail" class="item-thumbnail">
              <img :src="item.thumbnail" :alt="item.name" />
            </div>
            
            <!-- 图标 -->
            <div v-else-if="item.icon" class="item-icon">
              <i :class="`icon-${item.icon}`"></i>
            </div>
            
            <!-- 文本内容 -->
            <div class="item-text">
              <div class="item-name">{{ item.name }}</div>
              <div v-if="item.description" class="item-description">
                {{ item.description }}
              </div>
              <div v-if="showTimestamps && item.timestamp" class="item-timestamp">
                {{ formatTimestamp(item.timestamp) }}
              </div>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="item-actions">
            <button 
              v-if="showItemActions && !isItemDisabled(item)" 
              class="item-action-button"
              @click.stop="handleItemActionClick(item, index)"
              :title="getItemActionTitle(item)"
            >
              <i :class="getItemActionIcon(item)"></i>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div v-if="searchQuery" class="empty-search">
          <i class="icon-search"></i>
          <p>没有找到匹配"{{ searchQuery }}"的历史记录</p>
          <button class="clear-search-button" @click="clearSearch">
            清除搜索
          </button>
        </div>
        <div v-else class="empty-history">
          <i class="icon-history"></i>
          <p>{{ emptyText }}</p>
        </div>
      </div>
    </div>
    
    <!-- 撤销/重做控制 -->
    <div v-if="showUndoRedo" class="undo-redo-controls">
      <button 
        class="undo-button"
        @click="handleUndo"
        :disabled="!canUndo || disabled"
        :title="undoTooltip"
      >
        <i class="icon-undo"></i>
        <span>撤销</span>
      </button>
      
      <button 
        class="redo-button"
        @click="handleRedo"
        :disabled="!canRedo || disabled"
        :title="redoTooltip"
      >
        <i class="icon-redo"></i>
        <span>重做</span>
      </button>
    </div>
    
    <!-- 分支历史 -->
    <div v-if="showBranches && branches.length > 0" class="branches-section">
      <h4 class="branches-title">历史分支</h4>
      <div class="branches-list">
        <div
          v-for="(branch, index) in branches"
          :key="getBranchKey(branch, index)"
          class="branch-item"
          :class="{ 'active': branch.id === activeBranchId }"
          @click="handleBranchClick(branch)"
        >
          <div class="branch-name">{{ branch.name }}</div>
          <div class="branch-info">{{ branch.itemCount }}个操作</div>
        </div>
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
export default {
  name: 'HistoryPanel',
  props: {
    // 面板标题
    title: {
      type: String,
      default: '历史记录'
    },
    
    // 历史记录项
    historyItems: {
      type: Array,
      default: () => []
    },
    
    // 当前活动项索引
    activeIndex: {
      type: Number,
      default: -1
    },
    
    // 分支历史
    branches: {
      type: Array,
      default: () => []
    },
    activeBranchId: {
      type: String,
      default: ''
    },
    
    // 显示选项
    showHeader: {
      type: Boolean,
      default: true
    },
    showSearch: {
      type: Boolean,
      default: true
    },
    showClearButton: {
      type: Boolean,
      default: true
    },
    showThumbnails: {
      type: Boolean,
      default: true
    },
    showTimestamps: {
      type: Boolean,
      default: true
    },
    showItemActions: {
      type: Boolean,
      default: true
    },
    showUndoRedo: {
      type: Boolean,
      default: true
    },
    showBranches: {
      type: Boolean,
      default: false
    },
    
    // 状态
    disabled: {
      type: Boolean,
      default: false
    },
    
    // 文本选项
    emptyText: {
      type: String,
      default: '暂无历史记录'
    },
    undoTooltip: {
      type: String,
      default: '撤销上一步操作'
    },
    redoTooltip: {
      type: String,
      default: '重做下一步操作'
    },
    
    // 样式
    variant: {
      type: String,
      default: 'default',
      validator: value => ['default', 'compact', 'minimal'].includes(value)
    },
    
    // 高亮项
    highlightedItemId: {
      type: String,
      default: ''
    }
  },
  
  data() {
    return {
      // 搜索
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      
      // 确认对话框
      showConfirmDialog: false,
      confirmDialogTitle: '',
      confirmDialogMessage: '',
      confirmDialogCallback: null
    };
  },
  
  computed: {
    panelClasses() {
      return {
        [`variant-${this.variant}`]: true,
        'disabled': this.disabled
      };
    },
    
    // 过滤后的历史记录项
    filteredItems() {
      if (!this.searchQuery) {
        return this.historyItems;
      }
      
      return this.searchResults;
    },
    
    // 是否可以撤销
    canUndo() {
      return this.activeIndex > 0;
    },
    
    // 是否可以重做
    canRedo() {
      return this.activeIndex < this.historyItems.length - 1;
    }
  },
  
  watch: {
    activeIndex(newIndex) {
      this.$nextTick(() => {
        this.scrollToActiveItem();
      });
    },
    
    historyItems() {
      // 如果有搜索查询，重新执行搜索
      if (this.searchQuery) {
        this.performSearch();
      }
    }
  },
  
  mounted() {
    // 延迟执行滚动，确保页面已完全加载且不影响初始页面位置
    this.$nextTick(() => {
      setTimeout(() => {
        this.scrollToActiveItem();
      }, 100); // 100ms延迟，避免影响页面初始滚动位置
    });
  },
  
  methods: {
    /**
     * 处理历史记录项点击
     */
    handleItemClick(item, index) {
      if (this.disabled || this.isItemDisabled(item)) {
        return;
      }
      
      this.$emit('item-click', { item, index });
    },
    
    /**
     * 处理历史记录项操作按钮点击
     */
    handleItemActionClick(item, index) {
      if (this.disabled || this.isItemDisabled(item)) {
        return;
      }
      
      this.$emit('item-action', { item, index });
    },
    
    /**
     * 处理撤销
     */
    handleUndo() {
      if (this.disabled || !this.canUndo) {
        return;
      }
      
      this.$emit('undo');
    },
    
    /**
     * 处理重做
     */
    handleRedo() {
      if (this.disabled || !this.canRedo) {
        return;
      }
      
      this.$emit('redo');
    },
    
    /**
     * 处理分支点击
     */
    handleBranchClick(branch) {
      if (this.disabled) {
        return;
      }
      
      this.$emit('branch-click', branch);
    },
    
    /**
     * 处理搜索输入
     */
    handleSearchInput() {
      this.performSearch();
    },
    
    /**
     * 执行搜索
     */
    performSearch() {
      if (!this.searchQuery) {
        this.searchResults = [];
        this.isSearching = false;
        return;
      }
      
      this.isSearching = true;
      
      // 搜索历史记录
      const query = this.searchQuery.toLowerCase();
      this.searchResults = this.historyItems.filter(item => {
        const nameMatch = item.name && item.name.toLowerCase().includes(query);
        const descMatch = item.description && item.description.toLowerCase().includes(query);
        return nameMatch || descMatch;
      });
    },
    
    /**
     * 清除搜索
     */
    clearSearch() {
      this.searchQuery = '';
      this.searchResults = [];
      this.isSearching = false;
    },
    
    /**
     * 确认清空历史
     */
    confirmClearHistory() {
      this.showConfirmDialog = true;
      this.confirmDialogTitle = '清空历史记录';
      this.confirmDialogMessage = '确定要清空所有历史记录吗？此操作无法撤销。';
      this.confirmDialogCallback = this.clearHistory;
    },
    
    /**
     * 清空历史
     */
    clearHistory() {
      this.$emit('clear-history');
      this.showConfirmDialog = false;
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
    },
    
    /**
     * 滚动到活动项（仅在组件内部滚动，不影响页面滚动）
     */
    scrollToActiveItem() {
      if (this.activeIndex < 0 || !this.$refs.historyList) {
        return;
      }

      const historyItems = this.$refs.historyList.querySelectorAll('.history-item');
      if (historyItems.length > this.activeIndex) {
        const activeItem = historyItems[this.activeIndex];
        const container = this.$refs.historyList;

        if (activeItem && container) {
          // 计算相对于容器的位置
          const containerRect = container.getBoundingClientRect();
          const itemRect = activeItem.getBoundingClientRect();

          // 检查项目是否在可视区域内
          const isVisible = (
            itemRect.top >= containerRect.top &&
            itemRect.bottom <= containerRect.bottom
          );

          // 只有当项目不在可视区域时才滚动
          if (!isVisible) {
            const scrollTop = activeItem.offsetTop - container.offsetTop - (container.clientHeight / 2) + (activeItem.clientHeight / 2);

            // 使用平滑滚动，但限制在容器内
            container.scrollTo({
              top: Math.max(0, Math.min(scrollTop, container.scrollHeight - container.clientHeight)),
              behavior: 'smooth'
            });
          }
        }
      }
    },
    
    /**
     * 检查项是否激活
     */
    isItemActive(item) {
      const index = this.historyItems.findIndex(i => i.id === item.id);
      return index === this.activeIndex;
    },
    
    /**
     * 检查项是否禁用
     */
    isItemDisabled(item) {
      // 如果项在当前活动项之后，则禁用
      const index = this.historyItems.findIndex(i => i.id === item.id);
      return index > this.activeIndex;
    },
    
    /**
     * 检查项是否高亮
     */
    isItemHighlighted(item) {
      return item.id === this.highlightedItemId;
    },
    
    /**
     * 获取项操作图标
     */
    getItemActionIcon(item) {
      // 如果项是当前活动项，则显示重做图标
      const index = this.historyItems.findIndex(i => i.id === item.id);
      return index < this.activeIndex ? 'icon-goto' : 'icon-redo';
    },
    
    /**
     * 获取项操作提示
     */
    getItemActionTitle(item) {
      const index = this.historyItems.findIndex(i => i.id === item.id);
      return index < this.activeIndex ? '跳转到此步骤' : '重做到此步骤';
    },
    
    /**
     * 获取历史项的安全key值
     * @param {Object} item - 历史项
     * @param {number} index - 索引
     * @returns {string} 安全的key值
     */
    getItemKey(item, index) {
      // 首先验证item是否是有效的历史项对象
      if (!item || typeof item !== 'object') {
        console.warn('HistoryPanel: item is not a valid object, using index as key:', item);
        return `item-invalid-${index}`;
      }

      // 检查是否是事件对象（常见的错误情况）
      if (item.constructor && (
        item.constructor.name === 'PointerEvent' ||
        item.constructor.name === 'MouseEvent' ||
        item.constructor.name === 'Event' ||
        item.type !== undefined // 事件对象通常有type属性
      )) {
        console.error('HistoryPanel: 检测到事件对象被传递为历史项，这是一个错误:', item);
        return `item-event-error-${index}`;
      }

      // 确保返回原始值（字符串或数字）
      if (item.id !== null && item.id !== undefined) {
        // 如果id是对象或数组，转换为字符串
        if (typeof item.id === 'object') {
          console.warn('HistoryPanel: item.id is not a primitive value, converting to string:', item.id);
          try {
            return `item-${JSON.stringify(item.id)}-${index}`;
          } catch (error) {
            console.error('HistoryPanel: 无法序列化item.id，使用fallback:', error);
            return `item-serialize-error-${index}`;
          }
        }
        // 确保id是字符串
        return String(item.id);
      }

      // 如果没有有效的id，使用索引作为fallback
      console.warn('HistoryPanel: item.id is missing or invalid, using index as key:', item);
      return `item-fallback-${index}`;
    },

    /**
     * 获取分支的安全key值
     * @param {Object} branch - 分支对象
     * @param {number} index - 索引
     * @returns {string} 安全的key值
     */
    getBranchKey(branch, index) {
      // 确保返回原始值（字符串或数字）
      if (branch && branch.id !== null && branch.id !== undefined) {
        // 如果id是对象或数组，转换为字符串
        if (typeof branch.id === 'object') {
          console.warn('HistoryPanel: branch.id is not a primitive value, converting to string:', branch.id);
          return `branch-${JSON.stringify(branch.id)}-${index}`;
        }
        // 确保id是字符串
        return String(branch.id);
      }
      // 如果没有有效的id，使用索引作为fallback
      console.warn('HistoryPanel: branch.id is missing or invalid, using index as key:', branch);
      return `branch-fallback-${index}`;
    },

    /**
     * 格式化时间戳
     */
    formatTimestamp(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      // 今天内的时间显示为"xx分钟前"或"xx小时前"
      if (diffDay === 0) {
        if (diffHour === 0) {
          if (diffMin === 0) {
            return '刚刚';
          }
          return `${diffMin}分钟前`;
        }
        return `${diffHour}小时前`;
      }
      
      // 昨天的时间显示为"昨天 xx:xx"
      if (diffDay === 1) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // 一周内的时间显示为"周x xx:xx"
      if (diffDay < 7) {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        return `周${weekdays[date.getDay()]} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // 其他时间显示为"yyyy-MM-dd"
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.history-panel {
  width: 100%;
  background-color: var(--panel-bg-color, #fff);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 变体样式 */
.history-panel.variant-default {
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

.history-panel.variant-compact {
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

.history-panel.variant-minimal {
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

/* 搜索 */
.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 150px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--panel-border-color);
  border-radius: 4px;
  font-size: 12px;
  background-color: var(--panel-item-bg);
  color: var(--panel-text-color);
}

.search-input:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.clear-search-button {
  position: absolute;
  right: 4px;
  background: none;
  border: none;
  color: var(--panel-text-color);
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search-button:hover {
  background-color: var(--panel-item-hover-bg);
}

.clear-button {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
}

.clear-button:hover {
  background-color: rgba(255, 77, 79, 0.1);
}

.clear-button:disabled {
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

/* 历史记录列表 */
.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: var(--panel-item-bg);
  border-left: 3px solid transparent;
}

.history-item:hover:not(.disabled) {
  background-color: var(--panel-item-hover-bg);
}

.history-item.active {
  background-color: var(--panel-item-active-bg);
  border-left-color: var(--panel-item-active-color);
  color: var(--panel-item-active-color);
}

.history-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-item.highlighted {
  background-color: #fff7e6;
  border-left-color: #faad14;
}

/* 历史记录项内容 */
.item-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.item-thumbnail {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--panel-item-hover-bg);
}

.item-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-icon {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--panel-item-hover-bg);
  border-radius: 4px;
  flex-shrink: 0;
}

.item-text {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--panel-title-color);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-description {
  font-size: 12px;
  color: var(--panel-text-color);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-timestamp {
  font-size: 11px;
  color: var(--panel-text-color);
  opacity: 0.7;
}

/* 历史记录项操作 */
.item-actions {
  flex-shrink: 0;
  margin-left: 8px;
}

.item-action-button {
  background: none;
  border: none;
  color: var(--panel-text-color);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.history-item:hover .item-action-button {
  opacity: 1;
}

.item-action-button:hover {
  background-color: var(--panel-item-hover-bg);
  color: var(--panel-item-active-color);
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--panel-text-color);
}

.empty-search,
.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-search i,
.empty-history i {
  font-size: 48px;
  opacity: 0.3;
}

.empty-search p,
.empty-history p {
  margin: 0;
  font-size: 14px;
}

/* 撤销/重做控制 */
.undo-redo-controls {
  display: flex;
  border-top: 1px solid var(--panel-border-color);
  flex-shrink: 0;
}

.undo-button,
.redo-button {
  flex: 1;
  background: none;
  border: none;
  color: var(--panel-text-color);
  cursor: pointer;
  padding: 12px 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.undo-button:hover:not(:disabled),
.redo-button:hover:not(:disabled) {
  background-color: var(--panel-item-hover-bg);
  color: var(--panel-item-active-color);
}

.undo-button:disabled,
.redo-button:disabled {
  color: var(--panel-item-disabled-color);
  cursor: not-allowed;
}

.undo-button {
  border-right: 1px solid var(--panel-border-color);
}

/* 分支历史 */
.branches-section {
  border-top: 1px solid var(--panel-border-color);
  padding: 12px 16px;
  flex-shrink: 0;
}

.branches-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--panel-title-color);
}

.branches-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.branch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.branch-item:hover {
  background-color: var(--panel-item-hover-bg);
}

.branch-item.active {
  background-color: var(--panel-item-active-bg);
  color: var(--panel-item-active-color);
}

.branch-name {
  font-size: 13px;
  font-weight: 500;
}

.branch-info {
  font-size: 11px;
  opacity: 0.7;
}

/* 确认对话框 */
.confirm-dialog {
  position: absolute;
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
  background-color: var(--panel-bg-color);
  border-radius: 8px;
  padding: 20px;
  max-width: 300px;
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
  color: #fff;
}

.confirm-button:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

/* 禁用状态 */
.history-panel.disabled {
  opacity: 0.7;
  pointer-events: none;
}

/* 滚动条样式 */
.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: var(--panel-bg-color);
}

.history-list::-webkit-scrollbar-thumb {
  background: var(--panel-border-color);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 图标样式 */
.icon-close::before { content: '✕'; font-size: 12px; }
.icon-trash::before { content: '🗑'; font-size: 14px; }
.icon-undo::before { content: '↶'; font-size: 14px; }
.icon-redo::before { content: '↷'; font-size: 14px; }
.icon-goto::before { content: '→'; font-size: 14px; }
.icon-search::before { content: '🔍'; font-size: 24px; }
.icon-history::before { content: '📜'; font-size: 24px; }

/* 响应式样式 */
@media (max-width: 768px) {
  .panel-header {
    padding: 8px 12px;
  }

  .search-input {
    width: 120px;
  }

  .history-item {
    padding: 6px 12px;
  }

  .item-thumbnail,
  .item-icon {
    width: 28px;
    height: 28px;
    margin-right: 8px;
  }

  .item-name {
    font-size: 13px;
  }

  .item-description {
    font-size: 11px;
  }

  .undo-button,
  .redo-button {
    padding: 10px 12px;
    font-size: 13px;
  }
}
</style>
