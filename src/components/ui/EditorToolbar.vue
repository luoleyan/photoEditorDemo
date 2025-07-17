<template>
  <div class="editor-toolbar" :class="toolbarClasses">
    <!-- 工具栏左侧区域 -->
    <div class="toolbar-section toolbar-left">
      <slot name="left">
        <!-- 工具组 -->
        <template v-for="(group, groupIndex) in visibleGroups">
          <div
            class="toolbar-group"
            :class="{ active: group.active }"
            v-if="!group.hidden"
            :key="'group-' + groupIndex"
          >
            <!-- 工具组标题 -->
            <div v-if="group.title && showGroupTitles" class="group-title">
              {{ group.title }}
            </div>

            <!-- 工具按钮 -->
            <div class="group-buttons">
              <template v-for="(tool, toolIndex) in group.tools">
                <tool-button
                  v-if="!tool.hidden"
                  :key="'tool-' + toolIndex"
                  :icon="tool.icon"
                  :label="showLabels ? tool.label : ''"
                  :tooltip="tool.tooltip || tool.label"
                  :variant="getToolVariant(tool)"
                  :size="size"
                  :shape="tool.shape || 'default'"
                  :active="isToolActive(tool)"
                  :disabled="isToolDisabled(tool)"
                  :loading="isToolLoading(tool)"
                  :badge="tool.badge"
                  :badge-type="tool.badgeType"
                  :dropdown="tool.dropdown"
                  @click="handleToolClick(tool, group)"
                />
                <div
                  v-if="tool.separator && toolIndex < group.tools.length - 1"
                  :key="'separator-' + toolIndex"
                  class="tool-separator"
                ></div>
              </template>
            </div>
          </div>

          <!-- 工具组分隔符 -->
          <div
            v-if="
              groupIndex < visibleGroups.length - 1 &&
              !group.hidden &&
              !visibleGroups[groupIndex + 1].hidden
            "
            :key="'group-separator-' + groupIndex"
            class="group-separator"
          ></div>
        </template>
      </slot>
    </div>

    <!-- 工具栏中间区域 -->
    <div class="toolbar-section toolbar-center">
      <slot name="center"></slot>
    </div>

    <!-- 工具栏右侧区域 -->
    <div class="toolbar-section toolbar-right">
      <slot name="right">
        <!-- 更多按钮（响应式折叠） -->
        <div v-if="hasOverflowMenu" class="toolbar-overflow">
          <tool-button
            icon="more"
            tooltip="更多工具"
            :dropdown="true"
            @click="toggleOverflowMenu"
          />

          <!-- 溢出菜单 -->
          <div v-if="showOverflowMenu" class="overflow-menu" ref="overflowMenu">
            <template v-for="(group, groupIndex) in overflowGroups">
              <div
                v-if="!group.hidden && group.tools.some((t) => !t.hidden)"
                class="overflow-group"
                :key="'overflow-group-' + groupIndex"
              >
                <div v-if="group.title" class="overflow-group-title">
                  {{ group.title }}
                </div>

                <div class="overflow-group-tools">
                  <template v-for="(tool, toolIndex) in group.tools">
                    <div
                      v-if="!tool.hidden"
                      :key="'overflow-tool-' + toolIndex"
                      class="overflow-tool"
                      :class="{
                        active: isToolActive(tool),
                        disabled: isToolDisabled(tool),
                      }"
                      @click="handleOverflowToolClick(tool, group)"
                    >
                      <i v-if="tool.icon" :class="`icon-${tool.icon}`"></i>
                      <span class="overflow-tool-label">{{ tool.label }}</span>
                      <span
                        v-if="tool.badge"
                        class="overflow-tool-badge"
                        :class="tool.badgeType"
                      >
                        {{ tool.badge }}
                      </span>
                    </div>
                  </template>
                </div>
              </div>

              <div
                v-if="
                  groupIndex < overflowGroups.length - 1 &&
                  !group.hidden &&
                  !overflowGroups[groupIndex + 1].hidden
                "
                :key="'overflow-separator-' + groupIndex"
                class="overflow-separator"
              ></div>
            </template>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script>
import ToolButton from "./ToolButton.vue";

export default {
  name: "EditorToolbar",
  components: {
    ToolButton,
  },

  props: {
    // 工具组配置
    toolGroups: {
      type: Array,
      default: () => [],
    },

    // 激活的工具ID
    activeToolId: {
      type: String,
      default: "",
    },

    // 禁用的工具ID列表
    disabledToolIds: {
      type: Array,
      default: () => [],
    },

    // 加载中的工具ID列表
    loadingToolIds: {
      type: Array,
      default: () => [],
    },

    // 显示选项
    showLabels: {
      type: Boolean,
      default: true,
    },
    showGroupTitles: {
      type: Boolean,
      default: false,
    },

    // 样式选项
    variant: {
      type: String,
      default: "default",
      validator: (value) =>
        ["default", "primary", "ghost", "minimal"].includes(value),
    },
    size: {
      type: String,
      default: "small",
      validator: (value) => ["small", "medium", "large"].includes(value),
    },

    // 响应式选项
    responsive: {
      type: Boolean,
      default: true,
    },

    // 方向
    direction: {
      type: String,
      default: "horizontal",
      validator: (value) => ["horizontal", "vertical"].includes(value),
    },
  },

  data() {
    return {
      // 响应式状态
      containerWidth: 0,
      showOverflowMenu: false,
      overflowBreakpoint: 600,

      // 工具状态
      localActiveToolId: this.activeToolId,

      // 窗口点击监听器
      windowClickListener: null,
    };
  },

  computed: {
    toolbarClasses() {
      return {
        [`variant-${this.variant}`]: true,
        [`size-${this.size}`]: true,
        [`direction-${this.direction}`]: true,
        responsive: this.responsive,
        compact: this.containerWidth < this.overflowBreakpoint,
        "with-labels": this.showLabels,
        "with-group-titles": this.showGroupTitles,
      };
    },

    // 可见的工具组
    visibleGroups() {
      if (!this.responsive || this.containerWidth >= this.overflowBreakpoint) {
        return this.normalizedToolGroups;
      }

      // 在紧凑模式下，只显示主要工具组
      return this.normalizedToolGroups.filter(
        (group) => group.priority === "high"
      );
    },

    // 溢出菜单中的工具组
    overflowGroups() {
      if (!this.responsive || this.containerWidth >= this.overflowBreakpoint) {
        return [];
      }

      // 在紧凑模式下，将非高优先级的工具组放入溢出菜单
      return this.normalizedToolGroups.filter(
        (group) => group.priority !== "high"
      );
    },

    // 是否有溢出菜单
    hasOverflowMenu() {
      return (
        this.responsive &&
        this.containerWidth < this.overflowBreakpoint &&
        this.overflowGroups.length > 0
      );
    },

    // 标准化的工具组配置
    normalizedToolGroups() {
      return this.toolGroups.map((group) => {
        // 确保每个工具组都有必要的属性
        const normalizedGroup = {
          id:
            group.id || `group-${Math.random().toString(36).substring(2, 11)}`,
          title: group.title || "",
          active: group.active || false,
          hidden: group.hidden || false,
          priority: group.priority || "normal",
          tools: [],
        };

        // 标准化工具配置
        if (Array.isArray(group.tools)) {
          normalizedGroup.tools = group.tools.map((tool) => {
            // 如果工具是字符串，将其转换为对象
            if (typeof tool === "string") {
              return {
                id: tool,
                label: tool,
                icon: tool.toLowerCase(),
              };
            }

            // 确保工具对象有必要的属性
            return {
              id:
                tool.id ||
                `tool-${Math.random().toString(36).substring(2, 11)}`,
              label: tool.label || "",
              icon: tool.icon || "",
              tooltip: tool.tooltip || tool.label || "",
              variant: tool.variant || "default",
              shape: tool.shape || "default",
              hidden: tool.hidden || false,
              separator: tool.separator || false,
              dropdown: tool.dropdown || false,
              badge: tool.badge || "",
              badgeType: tool.badgeType || "default",
              data: tool.data || {},
            };
          });
        }

        return normalizedGroup;
      });
    },
  },

  watch: {
    activeToolId(newValue) {
      this.localActiveToolId = newValue;
    },
  },

  mounted() {
    this.updateContainerWidth();

    // 监听窗口大小变化
    window.addEventListener("resize", this.handleWindowResize);

    // 监听窗口点击事件，用于关闭溢出菜单
    this.windowClickListener = this.handleWindowClick.bind(this);
    window.addEventListener("click", this.windowClickListener);
  },

  beforeDestroy() {
    // 移除事件监听器
    window.removeEventListener("resize", this.handleWindowResize);

    if (this.windowClickListener) {
      window.removeEventListener("click", this.windowClickListener);
    }
  },

  methods: {
    /**
     * 更新容器宽度
     */
    updateContainerWidth() {
      if (this.$el) {
        this.containerWidth = this.$el.getBoundingClientRect().width;
      }
    },

    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
      // 防抖处理
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.updateContainerWidth();
      }, 100);
    },

    /**
     * 处理窗口点击事件
     */
    handleWindowClick(event) {
      // 如果点击的不是溢出菜单或其子元素，则关闭溢出菜单
      if (
        this.showOverflowMenu &&
        this.$refs.overflowMenu &&
        !this.$refs.overflowMenu.contains(event.target)
      ) {
        this.showOverflowMenu = false;
      }
    },

    /**
     * 切换溢出菜单显示状态
     */
    toggleOverflowMenu(event) {
      // 阻止事件冒泡，防止立即触发窗口点击事件处理器
      event.stopPropagation();
      this.showOverflowMenu = !this.showOverflowMenu;
    },

    /**
     * 处理工具点击事件
     */
    handleToolClick(tool, group) {
      if (this.isToolDisabled(tool)) {
        return;
      }

      // 如果工具是可切换的，更新激活状态
      if (tool.toggle) {
        this.localActiveToolId =
          this.localActiveToolId === tool.id ? "" : tool.id;
        this.$emit("update:activeToolId", this.localActiveToolId);
      }

      // 触发工具点击事件
      this.$emit("tool-click", {
        toolId: tool.id,
        groupId: group.id,
        tool: { ...tool },
        group: { ...group },
      });
    },

    /**
     * 处理溢出菜单中的工具点击事件
     */
    handleOverflowToolClick(tool, group) {
      // 关闭溢出菜单
      this.showOverflowMenu = false;

      // 调用普通工具点击处理器
      this.handleToolClick(tool, group);
    },

    /**
     * 检查工具是否激活
     */
    isToolActive(tool) {
      return tool.id === this.localActiveToolId || tool.active;
    },

    /**
     * 检查工具是否禁用
     */
    isToolDisabled(tool) {
      return tool.disabled || this.disabledToolIds.includes(tool.id);
    },

    /**
     * 检查工具是否加载中
     */
    isToolLoading(tool) {
      return tool.loading || this.loadingToolIds.includes(tool.id);
    },

    /**
     * 获取工具变体样式
     */
    getToolVariant(tool) {
      // 如果工具激活，使用primary变体
      if (this.isToolActive(tool) && tool.activeVariant) {
        return tool.activeVariant;
      }

      // 使用工具自身的变体或默认变体
      return tool.variant || "default";
    },
  },
};
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: var(--toolbar-bg-color, #fff);
  border-bottom: 1px solid var(--toolbar-border-color, #ddd);
  box-sizing: border-box;
  min-height: 40px;
  position: relative;
}

/* 工具栏变体 */
.editor-toolbar.variant-default {
  --toolbar-bg-color: #fff;
  --toolbar-border-color: #ddd;
  --toolbar-separator-color: #eee;
  --toolbar-group-title-color: #666;
}

.editor-toolbar.variant-primary {
  --toolbar-bg-color: #f0f7ff;
  --toolbar-border-color: #d0e3ff;
  --toolbar-separator-color: #d0e3ff;
  --toolbar-group-title-color: #1890ff;
}

.editor-toolbar.variant-ghost {
  --toolbar-bg-color: transparent;
  --toolbar-border-color: transparent;
  --toolbar-separator-color: rgba(0, 0, 0, 0.1);
  --toolbar-group-title-color: #666;
}

.editor-toolbar.variant-minimal {
  --toolbar-bg-color: transparent;
  --toolbar-border-color: transparent;
  --toolbar-separator-color: rgba(0, 0, 0, 0.05);
  --toolbar-group-title-color: #999;
  padding: 2px 4px;
  min-height: 32px;
}

/* 工具栏方向 */
.editor-toolbar.direction-horizontal {
  flex-direction: row;
}

.editor-toolbar.direction-vertical {
  flex-direction: column;
  padding: 8px 4px;
  min-height: auto;
  min-width: 40px;
  border-bottom: none;
  border-right: 1px solid var(--toolbar-border-color, #ddd);
}

/* 工具栏区域 */
.toolbar-section {
  display: flex;
  align-items: center;
}

.toolbar-left {
  flex: 1;
  justify-content: flex-start;
}

.toolbar-center {
  flex: 0 0 auto;
  justify-content: center;
}

.toolbar-right {
  flex: 1;
  justify-content: flex-end;
}

.direction-vertical .toolbar-section {
  flex-direction: column;
  width: 100%;
}

.direction-vertical .toolbar-left,
.direction-vertical .toolbar-center,
.direction-vertical .toolbar-right {
  justify-content: center;
}

/* 工具组 */
.toolbar-group {
  display: flex;
  align-items: center;
  margin: 0 4px;
}

.direction-vertical .toolbar-group {
  flex-direction: column;
  margin: 4px 0;
  width: 100%;
}

.group-title {
  font-size: 12px;
  color: var(--toolbar-group-title-color, #666);
  margin-right: 8px;
  white-space: nowrap;
}

.direction-vertical .group-title {
  margin-right: 0;
  margin-bottom: 4px;
  text-align: center;
}

.group-buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.direction-vertical .group-buttons {
  flex-direction: column;
  width: 100%;
}

/* 分隔符 */
.group-separator {
  width: 1px;
  height: 24px;
  background-color: var(--toolbar-separator-color, #eee);
  margin: 0 8px;
}

.direction-vertical .group-separator {
  width: 24px;
  height: 1px;
  margin: 8px 0;
}

.tool-separator {
  width: 1px;
  height: 16px;
  background-color: var(--toolbar-separator-color, #eee);
  margin: 0 4px;
}

.direction-vertical .tool-separator {
  width: 16px;
  height: 1px;
  margin: 4px 0;
}

/* 溢出菜单 */
.toolbar-overflow {
  position: relative;
}

.overflow-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  min-width: 180px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  margin-top: 4px;
}

.direction-vertical .overflow-menu {
  top: 0;
  left: 100%;
  margin-top: 0;
  margin-left: 4px;
}

.overflow-group {
  padding: 4px 0;
}

.overflow-group-title {
  padding: 4px 12px;
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.overflow-group-tools {
  display: flex;
  flex-direction: column;
}

.overflow-tool {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.overflow-tool:hover {
  background-color: #f5f5f5;
}

.overflow-tool.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.overflow-tool.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.overflow-tool i {
  margin-right: 8px;
}

.overflow-tool-label {
  flex: 1;
}

.overflow-tool-badge {
  display: inline-block;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  background-color: #ff4d4f;
  color: #fff;
}

.overflow-separator {
  height: 1px;
  background-color: #eee;
  margin: 4px 0;
}

/* 响应式样式 */
.editor-toolbar.compact .toolbar-group {
  margin: 0 2px;
}

.editor-toolbar.compact .group-separator {
  margin: 0 4px;
}

/* 图标样式 */
.icon-more::before {
  content: "⋮";
  font-size: 16px;
}
</style>
