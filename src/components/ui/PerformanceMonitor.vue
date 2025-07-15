<template>
  <div class="performance-monitor" :class="{ 'expanded': isExpanded }">
    <!-- 监控器头部 -->
    <div class="monitor-header" @click="toggleExpanded">
      <div class="status-indicator" :class="statusClass"></div>
      <span class="title">性能监控</span>
      <div class="memory-usage">
        {{ formatBytes(memoryUsage.allocated) }} / {{ formatBytes(memoryUsage.maxMemory) }}
      </div>
      <button class="toggle-btn" :class="{ 'expanded': isExpanded }">
        <span>{{ isExpanded ? '▼' : '▶' }}</span>
      </button>
    </div>

    <!-- 详细信息面板 -->
    <div class="monitor-content" v-show="isExpanded">
      <!-- 内存使用情况 -->
      <div class="metric-section">
        <h4>内存使用</h4>
        <div class="memory-bar">
          <div class="memory-fill" :style="{ width: memoryUsage.usagePercentage + '%' }"></div>
          <span class="memory-text">{{ memoryUsage.usagePercentage.toFixed(1) }}%</span>
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
            <span>{{ performanceMetrics.averageProcessingTime.toFixed(2) }}ms</span>
          </div>
          <div class="detail-item">
            <span>压缩比:</span>
            <span>{{ (performanceMetrics.compressionRatio * 100).toFixed(1) }}%</span>
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
</template>

<script>
import { memoryManager } from '@/utils/MemoryManager.js';

export default {
  name: 'PerformanceMonitor',
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
        browser: null
      },
      performanceMetrics: null,
      updateInterval: null
    };
  },
  computed: {
    statusClass() {
      if (this.memoryUsage.isOverLimit) return 'critical';
      if (this.memoryUsage.isNearLimit) return 'warning';
      return 'normal';
    }
  },
  mounted() {
    this.startMonitoring();
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
          this.performanceMetrics = this.$parent.performanceOptimizer.getPerformanceMetrics();
        }
      } catch (error) {
        console.error('更新性能指标失败:', error);
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
        this.$emit('cleanup-performed');
      } catch (error) {
        console.error('强制清理失败:', error);
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
        this.$emit('metrics-reset');
      } catch (error) {
        console.error('重置指标失败:', error);
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
          memoryDetails: memoryManager.getMemoryDetails()
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], {
          type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.$emit('report-exported', report);
      } catch (error) {
        console.error('导出报告失败:', error);
      }
    },

    /**
     * 格式化字节数
     */
    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
  }
};
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 280px;
  max-width: 400px;
  font-size: 12px;
}

.monitor-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-indicator.normal { background: #28a745; }
.status-indicator.warning { background: #ffc107; }
.status-indicator.critical { background: #dc3545; }

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

.cleanup-btn:hover { background: #e3f2fd; border-color: #2196f3; }
.reset-btn:hover { background: #fff3e0; border-color: #ff9800; }
.export-btn:hover { background: #e8f5e8; border-color: #4caf50; }

/* 响应式设计 */
@media (max-width: 768px) {
  .performance-monitor {
    position: relative;
    top: auto;
    right: auto;
    margin: 10px;
    width: calc(100% - 20px);
  }
}
</style>
