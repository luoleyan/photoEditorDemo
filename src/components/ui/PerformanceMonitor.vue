<template>
  <div>
    <!-- 主组件 -->
    <div
      class="performance-monitor"
      :class="{
        expanded: isExpanded,
        dragging: isDragging,
        snapped: position.isSnapped,
      }"
      :style="draggableStyle"
      ref="draggableComponent"
    >
      <!-- 吸附状态标识 -->
      <div
        v-if="position.isSnapped"
        class="snap-status-badge"
        :style="snapStatusStyle"
      >
        已吸附到{{ getEdgeDisplayName(position.snapEdge) }}
      </div>

      <!-- 监控器头部 -->
      <div class="monitor-header" @click="toggleExpanded">
        <div
          class="drag-handle"
          :title="`拖拽手柄 - 当前位置: (${Math.round(
            position.x
          )}, ${Math.round(position.y)})`"
        >
          ⋮⋮
        </div>
        <div class="status-indicator" :class="statusClass"></div>
        <span class="title">性能监控</span>
        <div class="memory-usage">
          {{ formatBytes(memoryUsage.allocated) }} /
          {{ formatBytes(memoryUsage.maxMemory) }}
        </div>
        <button class="toggle-btn" :class="{ expanded: isExpanded }">
          <span>{{ isExpanded ? "▼" : "▶" }}</span>
        </button>
      </div>

      <!-- 详细信息面板 -->
      <div class="monitor-content" v-show="isExpanded">
        <!-- 内存使用情况 -->
        <div class="metric-section">
          <h4>内存使用</h4>
          <div class="memory-bar">
            <div
              class="memory-fill"
              :style="{ width: memoryUsage.usagePercentage + '%' }"
            ></div>
            <span class="memory-text"
              >{{ memoryUsage.usagePercentage.toFixed(1) }}%</span
            >
          </div>
          <div class="memory-details">
            <div class="detail-item">
              <span>已分配:</span>
              <span>{{ formatBytes(memoryUsage.allocated) }}</span>
            </div>
            <div class="detail-item">
              <span>峰值:</span>
              <span>{{ formatBytes(memoryUsage.peak) }}</span>
            </div>
            <div class="detail-item">
              <span>对象数:</span>
              <span>{{ memoryUsage.objectCount }}</span>
            </div>
          </div>
        </div>

        <!-- 浏览器内存 -->
        <div class="metric-section" v-if="memoryUsage.browser">
          <h4>浏览器内存</h4>
          <div class="browser-memory">
            <div class="detail-item">
              <span>已使用:</span>
              <span>{{ formatBytes(memoryUsage.browser.used) }}</span>
            </div>
            <div class="detail-item">
              <span>总计:</span>
              <span>{{ formatBytes(memoryUsage.browser.total) }}</span>
            </div>
            <div class="detail-item">
              <span>限制:</span>
              <span>{{ formatBytes(memoryUsage.browser.limit) }}</span>
            </div>
          </div>
        </div>

        <!-- 性能指标 -->
        <div class="metric-section" v-if="performanceMetrics">
          <h4>性能指标</h4>
          <div class="performance-details">
            <div class="detail-item">
              <span>处理图像:</span>
              <span>{{ performanceMetrics.processedImages }}</span>
            </div>
            <div class="detail-item">
              <span>平均处理时间:</span>
              <span
                >{{
                  performanceMetrics.averageProcessingTime.toFixed(2)
                }}ms</span
              >
            </div>
            <div class="detail-item">
              <span>压缩比:</span>
              <span
                >{{
                  (performanceMetrics.compressionRatio * 100).toFixed(1)
                }}%</span
              >
            </div>
            <div class="detail-item">
              <span>缓存命中率:</span>
              <span>{{ performanceMetrics.cacheHitRate }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button @click="forceCleanup" class="cleanup-btn">强制清理</button>
          <button @click="resetMetrics" class="reset-btn">重置指标</button>
          <button @click="exportReport" class="export-btn">导出报告</button>
        </div>
      </div>
    </div>

    <!-- 边缘吸附触发区域 -->
    <div
      v-if="position.isSnapped"
      class="snap-trigger-area"
      :style="triggerAreaStyle"
      @click="handleTriggerClick"
      @mouseenter="handleTriggerHover"
      :title="`点击展开 - 当前吸附在${getEdgeDisplayName(position.snapEdge)}`"
    >
      <div class="trigger-hint">
        <span class="trigger-icon">📌</span>
        <span class="trigger-text">{{
          getEdgeDisplayName(position.snapEdge)
        }}</span>
      </div>
    </div>

    <!-- 边缘指示器 -->
    <div
      v-if="edgeIndicator.visible"
      class="edge-indicator"
      :style="edgeIndicatorStyle"
    >
      <div class="indicator-content">
        <div class="indicator-icon">{{ getEdgeIcon(edgeIndicator.edge) }}</div>
        <div class="indicator-text">
          拖拽到{{ getEdgeDisplayName(edgeIndicator.edge) }}边缘吸附
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { memoryManager } from "@/utils/MemoryManager.js";
import DraggableMixin from "@/mixins/DraggableMixin.js";

export default {
  name: "PerformanceMonitor",
  mixins: [DraggableMixin],
  data() {
    return {
      isExpanded: false,
      memoryUsage: {
        allocated: 0,
        peak: 0,
        objectCount: 0,
        maxMemory: 200 * 1024 * 1024,
        usagePercentage: 0,
        isNearLimit: false,
        isOverLimit: false,
        browser: null,
      },
      performanceMetrics: null,
      updateInterval: null,
    };
  },
  computed: {
    statusClass() {
      if (this.memoryUsage.isOverLimit) return "critical";
      if (this.memoryUsage.isNearLimit) return "warning";
      return "normal";
    },
  },
  mounted() {
    this.startMonitoring();
    // 设置初始位置
    this.position.x = 20;
    this.position.y = 20;
  },
  beforeDestroy() {
    this.stopMonitoring();
  },
  methods: {
    /**
     * 开始监控
     */
    startMonitoring() {
      this.updateMetrics();
      this.updateInterval = setInterval(() => {
        this.updateMetrics();
      }, 2000); // 每2秒更新一次
    },

    /**
     * 停止监控
     */
    stopMonitoring() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    },

    /**
     * 更新指标
     */
    updateMetrics() {
      try {
        this.memoryUsage = memoryManager.getMemoryUsage();

        // 获取性能优化器指标（如果可用）
        if (this.$parent && this.$parent.performanceOptimizer) {
          this.performanceMetrics =
            this.$parent.performanceOptimizer.getPerformanceMetrics();
        }
      } catch (error) {
        console.error("更新性能指标失败:", error);
      }
    },

    /**
     * 切换展开状态
     */
    toggleExpanded() {
      this.isExpanded = !this.isExpanded;
    },

    /**
     * 强制清理内存
     */
    forceCleanup() {
      try {
        memoryManager.forceCleanup();
        this.updateMetrics();
        this.$emit("cleanup-performed");
      } catch (error) {
        console.error("强制清理失败:", error);
      }
    },

    /**
     * 重置指标
     */
    resetMetrics() {
      try {
        if (this.$parent && this.$parent.performanceOptimizer) {
          this.$parent.performanceOptimizer.resetMetrics();
        }
        this.updateMetrics();
        this.$emit("metrics-reset");
      } catch (error) {
        console.error("重置指标失败:", error);
      }
    },

    /**
     * 导出报告
     */
    exportReport() {
      try {
        const report = {
          timestamp: new Date().toISOString(),
          memoryUsage: this.memoryUsage,
          performanceMetrics: this.performanceMetrics,
          memoryDetails: memoryManager.getMemoryDetails(),
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `performance-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.$emit("report-exported", report);
      } catch (error) {
        console.error("导出报告失败:", error);
      }
    },

    /**
     * 格式化字节数
     */
    formatBytes(bytes) {
      if (bytes === 0) return "0 B";

      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    },

    /**
     * 处理触发区域悬停
     */
    handleTriggerHover() {
      // 可以添加悬停预览效果
      this.$emit("trigger-hover");
    },

    /**
     * 重写拖拽手柄检测
     */
    isDragHandle(target) {
      // 首先检查是否是专门的拖拽手柄
      const dragHandle = this.$el.querySelector(".drag-handle");
      if (
        dragHandle &&
        (dragHandle === target || dragHandle.contains(target))
      ) {
        return true;
      }

      // 检查是否是监控器头部区域，但排除切换按钮
      const monitorHeader = this.$el.querySelector(".monitor-header");
      if (!monitorHeader || !monitorHeader.contains(target)) {
        return false;
      }

      // 排除切换按钮和其他交互元素
      const excludeSelectors = [
        ".toggle-btn",
        "button",
        "input",
        "select",
        '[role="button"]',
        ".clickable",
      ];

      for (const selector of excludeSelectors) {
        const excludeElement = target.closest(selector);
        if (excludeElement && monitorHeader.contains(excludeElement)) {
          return false;
        }
      }

      return true;
    },

    /**
     * 获取边缘图标
     */
    getEdgeIcon(edge) {
      const icons = {
        top: "⬆️",
        bottom: "⬇️",
        left: "⬅️",
        right: "➡️",
      };
      return icons[edge] || "📌";
    },
  },
};
</script>

<style scoped>
.performance-monitor {
  /* 位置由draggableStyle控制 */
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  max-width: 400px;
  width: 320px;
  font-size: 12px;
  user-select: none;
}

.monitor-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  position: relative;
}

.drag-handle {
  color: #999;
  font-size: 12px;
  cursor: grab;
  padding: 2px;
  border-radius: 2px;
  transition: all 0.2s;
  line-height: 1;
  writing-mode: vertical-lr;
  text-orientation: mixed;
  margin-right: 8px;
}

.drag-handle:hover {
  color: #666;
  background: rgba(0, 0, 0, 0.05);
}

.drag-handle:active {
  cursor: grabbing;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-indicator.normal {
  background: #28a745;
}
.status-indicator.warning {
  background: #ffc107;
}
.status-indicator.critical {
  background: #dc3545;
}

.title {
  font-weight: bold;
  flex: 1;
}

.memory-usage {
  font-size: 11px;
  color: #666;
  margin-right: 8px;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  font-size: 10px;
}

.monitor-content {
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.metric-section {
  margin-bottom: 16px;
}

.metric-section h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}

.memory-bar {
  position: relative;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
}

.memory-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
  transition: width 0.3s ease;
}

.memory-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: bold;
  color: #333;
}

.memory-details,
.browser-memory,
.performance-details {
  display: grid;
  gap: 4px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 11px;
}

.detail-item span:first-child {
  color: #666;
}

.detail-item span:last-child {
  font-weight: bold;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.action-buttons button {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.cleanup-btn:hover {
  background: #e3f2fd;
  border-color: #2196f3;
}
.reset-btn:hover {
  background: #fff3e0;
  border-color: #ff9800;
}
.export-btn:hover {
  background: #e8f5e8;
  border-color: #4caf50;
}

/* 边缘吸附触发区域 */
.snap-trigger-area {
  background: rgba(0, 123, 255, 0.1);
  border: 2px dashed rgba(0, 123, 255, 0.3);
  transition: all 0.3s ease;
}

.snap-trigger-area:hover {
  background: rgba(0, 123, 255, 0.2);
  border-color: rgba(0, 123, 255, 0.5);
}

/* 拖拽状态样式 */
.performance-monitor.dragging {
  transform-origin: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

/* 吸附状态样式 */
.performance-monitor.snapped {
  opacity: 0.7;
  transition: all 0.3s ease;
}

.performance-monitor.snapped:hover {
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .performance-monitor {
    position: relative;
    top: auto;
    right: auto;
    margin: 10px;
    width: calc(100% - 20px);
  }

  .drag-handle {
    display: none; /* 移动端隐藏拖拽手柄 */
  }
}

/* 边缘指示器样式 */
.performance-monitor .edge-indicator {
  border-left: 4px solid #007bff;
}

.performance-monitor .edge-indicator .indicator-content {
  border-left: 3px solid #007bff;
}

/* 吸附状态标识样式 */
.performance-monitor .snap-status-badge {
  background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);
}

/* 触发区域样式 */
.performance-monitor .trigger-hint {
  border-left: 2px solid rgba(0, 123, 255, 0.6);
}
</style>
