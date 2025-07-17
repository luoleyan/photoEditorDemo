<template>
  <div class="filter-panel" :class="panelClasses">
    <div class="panel-header" v-if="showHeader">
      <h3 class="panel-title">{{ title }}</h3>
      <div class="panel-actions">
        <button
          v-if="showResetAll && hasActiveFilter"
          class="reset-all-button"
          @click="resetAllFilters"
          :disabled="disabled"
        >
          <i class="icon-reset"></i>
          <span>重置全部</span>
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 滤镜预览网格 -->
      <div v-if="showPreviewGrid" class="filter-preview-grid">
        <div
          v-for="filter in availableFilters"
          :key="filter.id"
          class="filter-preview-item"
          :class="{ active: filter.id === activeFilterId }"
          @click="handleFilterPreviewClick(filter)"
        >
          <div class="preview-image-container">
            <!-- 预览图像 -->
            <img
              v-if="previewImageSrc"
              :src="previewImageSrc"
              class="preview-image"
              :style="getFilterStyle(filter)"
              alt="滤镜预览"
            />
            <!-- 占位图 -->
            <div
              v-else
              class="preview-placeholder"
              :style="getFilterStyle(filter)"
            ></div>
          </div>
          <div class="preview-name">{{ filter.name }}</div>
        </div>
      </div>

      <!-- 当前滤镜参数调整 -->
      <div v-if="activeFilter" class="filter-parameters">
        <div class="filter-header">
          <h4 class="filter-name">{{ activeFilter.name }}</h4>
          <button
            v-if="showResetButton"
            class="reset-button"
            @click="resetActiveFilter"
            :disabled="disabled"
          >
            <i class="icon-reset"></i>
            <span>重置</span>
          </button>
        </div>

        <!-- 滤镜参数滑块 -->
        <div class="filter-sliders">
          <div
            v-for="param in activeFilter.parameters"
            :key="param.id"
            class="filter-param-item"
          >
            <slider-control
              :value="getParamValue(param)"
              :min="param.min"
              :max="param.max"
              :step="param.step"
              :default-value="param.defaultValue"
              :label="param.name"
              :tooltip="param.description"
              :show-tooltip="true"
              :disabled="disabled"
              @input="(value) => handleParamChange(param, value)"
              @change-complete="handleParamChangeComplete"
            />
          </div>
        </div>
      </div>

      <!-- 自定义滤镜组合 -->
      <div
        v-if="showCustomFilters && customFilters.length > 0"
        class="custom-filters-section"
      >
        <h4 class="section-title">自定义滤镜</h4>
        <div class="custom-filters-list">
          <div
            v-for="filter in customFilters"
            :key="filter.id"
            class="custom-filter-item"
            :class="{ active: filter.id === activeFilterId }"
            @click="handleCustomFilterClick(filter)"
          >
            <div class="custom-filter-name">{{ filter.name }}</div>
            <div class="custom-filter-actions">
              <button
                class="edit-button"
                @click.stop="handleEditCustomFilter(filter)"
                :disabled="disabled"
                title="编辑"
              >
                <i class="icon-edit"></i>
              </button>
              <button
                class="delete-button"
                @click.stop="handleDeleteCustomFilter(filter)"
                :disabled="disabled"
                title="删除"
              >
                <i class="icon-delete"></i>
              </button>
            </div>
          </div>
        </div>

        <button
          v-if="showSaveButton"
          class="save-custom-button"
          @click="handleSaveCustomFilter"
          :disabled="disabled || !activeFilter"
        >
          <i class="icon-save"></i>
          <span>保存当前滤镜</span>
        </button>
      </div>

      <!-- 滤镜分类 -->
      <div
        v-if="showCategories && filterCategories.length > 0"
        class="filter-categories"
      >
        <h4 class="section-title">滤镜分类</h4>
        <div class="categories-list">
          <button
            v-for="category in filterCategories"
            :key="category.id"
            class="category-button"
            :class="{ active: category.id === activeCategoryId }"
            @click="handleCategoryClick(category)"
            :disabled="disabled"
          >
            {{ category.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- 保存自定义滤镜对话框 -->
    <div v-if="showSaveDialog" class="save-dialog">
      <div class="dialog-content">
        <h4>保存自定义滤镜</h4>
        <div class="dialog-form">
          <div class="form-group">
            <label for="filterName">滤镜名称</label>
            <input
              type="text"
              id="filterName"
              v-model="customFilterName"
              placeholder="输入滤镜名称"
            />
          </div>
          <div class="form-group">
            <label for="filterDescription">描述 (可选)</label>
            <textarea
              id="filterDescription"
              v-model="customFilterDescription"
              placeholder="输入滤镜描述"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="cancel-button" @click="cancelSaveDialog">取消</button>
          <button
            class="save-button"
            @click="saveCustomFilter"
            :disabled="!customFilterName"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 确认删除对话框 -->
    <div v-if="showDeleteDialog" class="delete-dialog">
      <div class="dialog-content">
        <h4>删除自定义滤镜</h4>
        <p>
          确定要删除"{{
            filterToDelete ? filterToDelete.name : ""
          }}"滤镜吗？此操作无法撤销。
        </p>
        <div class="dialog-buttons">
          <button class="cancel-button" @click="cancelDeleteDialog">
            取消
          </button>
          <button class="delete-button" @click="confirmDeleteFilter">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SliderControl from "./SliderControl.vue";

export default {
  name: "FilterPanel",
  components: {
    SliderControl,
  },

  props: {
    // 面板标题
    title: {
      type: String,
      default: "滤镜",
    },

    // 滤镜数据
    availableFilters: {
      type: Array,
      default: () => [],
    },
    activeFilterId: {
      type: String,
      default: "",
    },
    customFilters: {
      type: Array,
      default: () => [],
    },
    filterCategories: {
      type: Array,
      default: () => [],
    },
    activeCategoryId: {
      type: String,
      default: "",
    },

    // 预览图像
    previewImageSrc: {
      type: String,
      default: "",
    },

    // 参数值
    parameterValues: {
      type: Object,
      default: () => ({}),
    },

    // 显示选项
    showHeader: {
      type: Boolean,
      default: true,
    },
    showResetButton: {
      type: Boolean,
      default: true,
    },
    showResetAll: {
      type: Boolean,
      default: true,
    },
    showPreviewGrid: {
      type: Boolean,
      default: true,
    },
    showCustomFilters: {
      type: Boolean,
      default: true,
    },
    showSaveButton: {
      type: Boolean,
      default: true,
    },
    showCategories: {
      type: Boolean,
      default: true,
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
      validator: (value) => ["default", "compact", "minimal"].includes(value),
    },
  },

  data() {
    return {
      // 保存对话框
      showSaveDialog: false,
      customFilterName: "",
      customFilterDescription: "",

      // 删除对话框
      showDeleteDialog: false,
      filterToDelete: null,
    };
  },

  computed: {
    panelClasses() {
      return {
        [`variant-${this.variant}`]: true,
        disabled: this.disabled,
      };
    },

    // 当前活动滤镜
    activeFilter() {
      if (!this.activeFilterId) return null;

      // 先在可用滤镜中查找
      let filter = this.availableFilters.find(
        (f) => f.id === this.activeFilterId
      );

      // 如果没找到，在自定义滤镜中查找
      if (!filter && this.customFilters) {
        filter = this.customFilters.find((f) => f.id === this.activeFilterId);
      }

      return filter;
    },

    // 是否有活动滤镜
    hasActiveFilter() {
      return !!this.activeFilter;
    },
  },

  methods: {
    /**
     * 处理滤镜预览点击
     */
    handleFilterPreviewClick(filter) {
      if (this.disabled) return;

      this.$emit("filter-select", filter);
    },

    /**
     * 处理自定义滤镜点击
     */
    handleCustomFilterClick(filter) {
      if (this.disabled) return;

      this.$emit("filter-select", filter);
    },

    /**
     * 处理参数变化
     */
    handleParamChange(param, value) {
      if (this.disabled) return;

      this.$emit("parameter-change", {
        filterId: this.activeFilterId,
        parameterId: param.id,
        value,
      });
    },

    /**
     * 处理参数变化完成
     */
    handleParamChangeComplete() {
      this.$emit("parameter-change-complete", {
        filterId: this.activeFilterId,
      });
    },

    /**
     * 处理分类点击
     */
    handleCategoryClick(category) {
      if (this.disabled) return;

      this.$emit("category-select", category);
    },

    /**
     * 重置当前滤镜
     */
    resetActiveFilter() {
      if (this.disabled || !this.activeFilter) return;

      this.$emit("filter-reset", this.activeFilter);
    },

    /**
     * 重置所有滤镜
     */
    resetAllFilters() {
      if (this.disabled) return;

      this.$emit("all-filters-reset");
    },

    /**
     * 处理保存自定义滤镜
     */
    handleSaveCustomFilter() {
      if (this.disabled || !this.activeFilter) return;

      this.showSaveDialog = true;
      this.customFilterName = `${this.activeFilter.name} 副本`;
      this.customFilterDescription = "";
    },

    /**
     * 取消保存对话框
     */
    cancelSaveDialog() {
      this.showSaveDialog = false;
      this.customFilterName = "";
      this.customFilterDescription = "";
    },

    /**
     * 保存自定义滤镜
     */
    saveCustomFilter() {
      if (!this.customFilterName) return;

      const customFilter = {
        name: this.customFilterName,
        description: this.customFilterDescription,
        baseFilterId: this.activeFilterId,
        parameterValues: { ...this.parameterValues },
      };

      this.$emit("custom-filter-save", customFilter);
      this.showSaveDialog = false;
      this.customFilterName = "";
      this.customFilterDescription = "";
    },

    /**
     * 处理编辑自定义滤镜
     */
    handleEditCustomFilter(filter) {
      if (this.disabled) return;

      this.showSaveDialog = true;
      this.customFilterName = filter.name;
      this.customFilterDescription = filter.description || "";

      // 标记为编辑模式
      this.filterToDelete = filter;
    },

    /**
     * 处理删除自定义滤镜
     */
    handleDeleteCustomFilter(filter) {
      if (this.disabled) return;

      this.showDeleteDialog = true;
      this.filterToDelete = filter;
    },

    /**
     * 取消删除对话框
     */
    cancelDeleteDialog() {
      this.showDeleteDialog = false;
      this.filterToDelete = null;
    },

    /**
     * 确认删除滤镜
     */
    confirmDeleteFilter() {
      if (!this.filterToDelete) return;

      this.$emit("custom-filter-delete", this.filterToDelete);
      this.showDeleteDialog = false;
      this.filterToDelete = null;
    },

    /**
     * 获取参数值
     */
    getParamValue(param) {
      if (!this.parameterValues || !this.activeFilterId) {
        return param.defaultValue;
      }

      const filterParams = this.parameterValues[this.activeFilterId];
      if (!filterParams) {
        return param.defaultValue;
      }

      return filterParams[param.id] !== undefined
        ? filterParams[param.id]
        : param.defaultValue;
    },

    /**
     * 获取滤镜样式
     */
    getFilterStyle(filter) {
      if (!filter) return {};

      // 基础滤镜
      if (filter.cssFilter) {
        return { filter: filter.cssFilter };
      }

      // 自定义滤镜
      if (filter.baseFilterId && this.availableFilters) {
        const baseFilter = this.availableFilters.find(
          (f) => f.id === filter.baseFilterId
        );
        if (baseFilter && baseFilter.cssFilter) {
          return { filter: baseFilter.cssFilter };
        }
      }

      return {};
    },
  },
};
</script>

<style scoped>
.filter-panel {
  width: 100%;
  background-color: var(--panel-bg-color, #fff);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 变体样式 */
.filter-panel.variant-default {
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

.filter-panel.variant-compact {
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

.filter-panel.variant-minimal {
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

.reset-all-button {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reset-all-button:hover {
  color: #40a9ff;
}

.reset-all-button:disabled {
  color: var(--panel-item-disabled-color);
  cursor: not-allowed;
}

.icon-reset::before {
  content: "↺";
  font-size: 14px;
}

/* 面板内容 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 滤镜预览网格 */
.filter-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.filter-preview-item {
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid transparent;
}

.filter-preview-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-preview-item.active {
  border-color: var(--panel-item-active-color);
}

.preview-image-container {
  width: 100%;
  padding-bottom: 100%; /* 1:1 宽高比 */
  position: relative;
  background-color: #f0f0f0;
  overflow: hidden;
}

.preview-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.preview-name {
  text-align: center;
  font-size: 12px;
  padding: 6px 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--panel-text-color);
}

/* 滤镜参数 */
.filter-parameters {
  margin-bottom: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-name {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--panel-title-color);
}

.reset-button {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reset-button:hover {
  color: #40a9ff;
}

.reset-button:disabled {
  color: var(--panel-item-disabled-color);
  cursor: not-allowed;
}

.filter-sliders {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-param-item {
  width: 100%;
}

/* 自定义滤镜 */
.custom-filters-section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--panel-title-color);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--panel-border-color);
}

.custom-filters-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.custom-filter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: var(--panel-item-bg);
}

.custom-filter-item:hover {
  background-color: var(--panel-item-hover-bg);
}

.custom-filter-item.active {
  background-color: var(--panel-item-active-bg);
  color: var(--panel-item-active-color);
}

.custom-filter-name {
  font-size: 14px;
  font-weight: 500;
}

.custom-filter-actions {
  display: flex;
  gap: 4px;
}

.edit-button,
.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: all 0.2s;
}

.edit-button:hover {
  color: #1890ff;
  opacity: 1;
  background-color: rgba(24, 144, 255, 0.1);
}

.delete-button:hover {
  color: #ff4d4f;
  opacity: 1;
  background-color: rgba(255, 77, 79, 0.1);
}

.edit-button:disabled,
.delete-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.save-custom-button {
  width: 100%;
  padding: 8px 12px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.save-custom-button:hover {
  background-color: #40a9ff;
}

.save-custom-button:disabled {
  background-color: var(--panel-item-disabled-color);
  cursor: not-allowed;
}

.icon-save::before {
  content: "💾";
  font-size: 14px;
}

.icon-edit::before {
  content: "✎";
  font-size: 14px;
}

.icon-delete::before {
  content: "✕";
  font-size: 14px;
}

/* 滤镜分类 */
.filter-categories {
  margin-bottom: 20px;
}

.categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-button {
  padding: 6px 12px;
  background-color: var(--panel-item-bg);
  border: 1px solid var(--panel-border-color);
  border-radius: 16px;
  font-size: 12px;
  color: var(--panel-text-color);
  cursor: pointer;
  transition: all 0.2s;
}

.category-button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.category-button.active {
  background-color: #1890ff;
  border-color: #1890ff;
  color: white;
}

.category-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 对话框 */
.save-dialog,
.delete-dialog {
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
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog-content h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: var(--panel-title-color);
}

.dialog-content p {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: var(--panel-text-color);
  line-height: 1.5;
}

.dialog-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--panel-title-color);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--panel-border-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--panel-text-color);
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button,
.save-button,
.delete-button {
  padding: 8px 16px;
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

.save-button {
  background-color: #1890ff;
  border: 1px solid #1890ff;
  color: white;
}

.save-button:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.save-button:disabled {
  background-color: var(--panel-item-disabled-color);
  border-color: var(--panel-item-disabled-color);
  cursor: not-allowed;
}

.delete-button {
  background-color: #ff4d4f;
  border: 1px solid #ff4d4f;
  color: white;
}

.delete-button:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

/* 禁用状态 */
.filter-panel.disabled {
  opacity: 0.7;
  pointer-events: none;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: var(--panel-bg-color);
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--panel-border-color);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .panel-header {
    padding: 8px 12px;
  }

  .panel-content {
    padding: 12px;
  }

  .filter-preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 8px;
  }

  .preview-name {
    font-size: 11px;
    padding: 4px 2px;
  }

  .filter-name {
    font-size: 15px;
  }

  .custom-filter-item {
    padding: 6px 10px;
  }

  .custom-filter-name {
    font-size: 13px;
  }

  .save-custom-button {
    padding: 6px 10px;
    font-size: 13px;
  }

  .category-button {
    padding: 4px 10px;
    font-size: 11px;
  }
}
</style>
