<template>
  <div class="system-health-monitor" v-if="showMonitor">
    <!-- 健康状态指示器 -->
    <div class="health-indicator" :class="overallHealthClass" @click="toggleDetails">
      <div class="indicator-icon">
        <span v-if="systemHealth.overallHealth === 'normal'">✅</span>
        <span v-else-if="systemHealth.overallHealth === 'warning'">⚠️</span>
        <span v-else>🚨</span>
      </div>
      <div class="indicator-text">
        <div class="health-status">{{ getHealthStatusText() }}</div>
        <div class="health-summary">{{ getHealthSummary() }}</div>
      </div>
      <div class="toggle-arrow" :class="{ 'expanded': showDetails }">▼</div>
    </div>

    <!-- 详细信息面板 -->
    <div class="health-details" v-show="showDetails">
      <!-- 系统检查结果 -->
      <div class="health-section">
        <h4>系统状态</h4>
        <div class="status-grid">
          <div class="status-item" v-for="(check, type) in systemHealth.checks" :key="type">
            <div class="status-label">{{ getCheckLabel(type) }}</div>
            <div class="status-value" :class="`status-${check.status}`">
              {{ getStatusText(check.status) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 内存使用情况 -->
      <div class="health-section" v-if="systemHealth.checks && systemHealth.checks.memory">
        <h4>内存使用</h4>
        <div class="memory-info">
          <div class="memory-bar">
            <div 
              class="memory-fill" 
              :style="{ width: systemHealth.checks.memory.usage + '%' }"
              :class="getMemoryBarClass(systemHealth.checks.memory.usage)"
            ></div>
            <span class="memory-text">{{ systemHealth.checks.memory.usage.toFixed(1) }}%</span>
          </div>
          <div class="memory-details">
            <div class="memory-item">
              <span>已分配:</span>
              <span>{{ formatBytes(systemHealth.checks.memory.allocated) }}</span>
            </div>
            <div class="memory-item">
              <span>峰值:</span>
              <span>{{ formatBytes(systemHealth.checks.memory.peak) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误恢复统计 -->
      <div class="health-section" v-if="recoveryStats">
        <h4>错误恢复</h4>
        <div class="recovery-stats">
          <div class="recovery-item" v-for="(stat, type) in recoveryStats" :key="type">
            <div class="recovery-type">{{ type }}</div>
            <div class="recovery-info">
              <span class="success-rate" :class="getSuccessRateClass(stat.successRate)">
                成功率: {{ (stat.successRate * 100).toFixed(1) }}%
              </span>
              <span class="attempt-count">
                尝试: {{ stat.successCount + stat.failureCount }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统建议 -->
      <div class="health-section" v-if="systemHealth.recommendations && systemHealth.recommendations.length > 0">
        <h4>系统建议</h4>
        <div class="recommendations">
          <div 
            class="recommendation-item" 
            v-for="(rec, index) in systemHealth.recommendations" 
            :key="index"
            :class="`priority-${rec.priority}`"
          >
            <div class="recommendation-icon">
              <span v-if="rec.priority === 'high'">🔴</span>
              <span v-else>🟡</span>
            </div>
            <div class="recommendation-text">
              {{ getRecommendationText(rec) }}
            </div>
            <button 
              class="recommendation-action" 
              @click="executeRecommendation(rec)"
              :disabled="executingRecommendation"
            >
              执行
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="health-actions">
        <button class="action-button" @click="performSystemCheck" :disabled="checking">
          {{ checking ? '检查中...' : '系统自检' }}
        </button>
        <button class="action-button" @click="resetRecoveryHistory">
          重置恢复历史
        </button>
        <button class="action-button secondary" @click="exportHealthReport">
          导出报告
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { errorRecoveryManager } from '@/utils/ErrorRecoveryManager.js';

export default {
  name: 'SystemHealthMonitor',
  props: {
    autoCheck: {
      type: Boolean,
      default: true
    },
    checkInterval: {
      type: Number,
      default: 60000 // 1分钟
    }
  },
  data() {
    return {
      showMonitor: true,
      showDetails: false,
      systemHealth: {
        overallHealth: 'normal',
        checks: {},
        recommendations: []
      },
      recoveryStats: null,
      checking: false,
      executingRecommendation: false,
      checkTimer: null
    };
  },
  computed: {
    overallHealthClass() {
      return `health-${this.systemHealth.overallHealth}`;
    }
  },
  mounted() {
    this.initializeMonitor();
  },
  beforeDestroy() {
    this.cleanup();
  },
  methods: {
    /**
     * 初始化监控器
     */
    async initializeMonitor() {
      await this.performSystemCheck();
      
      if (this.autoCheck) {
        this.startAutoCheck();
      }
    },

    /**
     * 开始自动检查
     */
    startAutoCheck() {
      this.checkTimer = setInterval(() => {
        this.performSystemCheck();
      }, this.checkInterval);
    },

    /**
     * 停止自动检查
     */
    stopAutoCheck() {
      if (this.checkTimer) {
        clearInterval(this.checkTimer);
        this.checkTimer = null;
      }
    },

    /**
     * 执行系统检查
     */
    async performSystemCheck() {
      if (this.checking) return;
      
      this.checking = true;
      
      try {
        const healthReport = await errorRecoveryManager.performSystemCheck();
        this.systemHealth = healthReport;
        
        // 获取恢复统计
        const fullHealth = errorRecoveryManager.getSystemHealth();
        this.recoveryStats = fullHealth.recoveryStrategies;
        
        this.$emit('health-updated', this.systemHealth);
      } catch (error) {
        console.error('系统检查失败:', error);
        this.$emit('check-error', error);
      } finally {
        this.checking = false;
      }
    },

    /**
     * 切换详情显示
     */
    toggleDetails() {
      this.showDetails = !this.showDetails;
    },

    /**
     * 执行建议操作
     */
    async executeRecommendation(recommendation) {
      if (this.executingRecommendation) return;
      
      this.executingRecommendation = true;
      
      try {
        await this.handleRecommendationAction(recommendation);
        this.$emit('recommendation-executed', recommendation);
        
        // 重新检查系统状态
        setTimeout(() => {
          this.performSystemCheck();
        }, 1000);
        
      } catch (error) {
        console.error('执行建议失败:', error);
        this.$emit('recommendation-error', { recommendation, error });
      } finally {
        this.executingRecommendation = false;
      }
    },

    /**
     * 处理建议操作
     */
    async handleRecommendationAction(recommendation) {
      switch (recommendation.action) {
        case 'cleanup':
          this.$emit('action-request', { type: 'cleanup' });
          break;
        case 'restart':
          this.$emit('action-request', { type: 'restart' });
          break;
        case 'switchAdapter':
          this.$emit('action-request', { type: 'switchAdapter' });
          break;
        default:
          console.log('未知的建议操作:', recommendation.action);
      }
    },

    /**
     * 重置恢复历史
     */
    resetRecoveryHistory() {
      errorRecoveryManager.resetRecoveryHistory();
      this.performSystemCheck();
      this.$emit('recovery-history-reset');
    },

    /**
     * 导出健康报告
     */
    exportHealthReport() {
      const report = {
        timestamp: new Date().toISOString(),
        systemHealth: this.systemHealth,
        recoveryStats: this.recoveryStats,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-health-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.$emit('report-exported', report);
    },

    /**
     * 获取健康状态文本
     */
    getHealthStatusText() {
      const texts = {
        normal: '系统正常',
        warning: '系统警告',
        critical: '系统异常'
      };
      return texts[this.systemHealth.overallHealth] || '未知状态';
    },

    /**
     * 获取健康摘要
     */
    getHealthSummary() {
      if (!this.systemHealth.checks) return '';
      
      const issues = Object.values(this.systemHealth.checks)
        .filter(check => check.status !== 'normal').length;
      
      if (issues === 0) {
        return '所有系统正常运行';
      } else {
        return `发现 ${issues} 个问题`;
      }
    },

    /**
     * 获取检查标签
     */
    getCheckLabel(type) {
      const labels = {
        memory: '内存',
        adapters: '适配器',
        performance: '性能',
        errors: '错误'
      };
      return labels[type] || type;
    },

    /**
     * 获取状态文本
     */
    getStatusText(status) {
      const texts = {
        normal: '正常',
        warning: '警告',
        critical: '异常'
      };
      return texts[status] || status;
    },

    /**
     * 获取内存条样式类
     */
    getMemoryBarClass(usage) {
      if (usage > 90) return 'critical';
      if (usage > 70) return 'warning';
      return 'normal';
    },

    /**
     * 获取成功率样式类
     */
    getSuccessRateClass(rate) {
      if (rate >= 0.8) return 'good';
      if (rate >= 0.5) return 'medium';
      return 'poor';
    },

    /**
     * 获取建议文本
     */
    getRecommendationText(recommendation) {
      const texts = {
        cleanup: '建议执行内存清理以释放资源',
        restart: '建议重启应用程序以恢复稳定性',
        switchAdapter: '建议切换到备用适配器'
      };
      return texts[recommendation.action] || `建议执行: ${recommendation.action}`;
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
    },

    /**
     * 清理资源
     */
    cleanup() {
      this.stopAutoCheck();
    }
  }
};
</script>

<style scoped>
.system-health-monitor {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1500;
  max-width: 350px;
  width: 100%;
  font-size: 13px;
}

.health-indicator {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid #28a745;
}

.health-indicator.health-warning {
  border-left-color: #ffc107;
}

.health-indicator.health-critical {
  border-left-color: #dc3545;
  background: rgba(255, 245, 245, 0.95);
}

.health-indicator:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.indicator-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.indicator-text {
  flex: 1;
  min-width: 0;
}

.health-status {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.health-summary {
  font-size: 11px;
  color: #666;
}

.toggle-arrow {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;
}

.toggle-arrow.expanded {
  transform: rotate(180deg);
}

.health-details {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 8px;
  overflow: hidden;
}

.health-section {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.health-section:last-child {
  border-bottom: none;
}

.health-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.status-label {
  font-size: 12px;
  color: #666;
}

.status-value {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 3px;
}

.status-value.status-normal {
  background: #d4edda;
  color: #155724;
}

.status-value.status-warning {
  background: #fff3cd;
  color: #856404;
}

.status-value.status-critical {
  background: #f8d7da;
  color: #721c24;
}

.memory-bar {
  position: relative;
  height: 16px;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}

.memory-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.memory-fill.normal {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.memory-fill.warning {
  background: linear-gradient(90deg, #ffc107, #fd7e14);
}

.memory-fill.critical {
  background: linear-gradient(90deg, #dc3545, #e74c3c);
}

.memory-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: bold;
  color: #333;
}

.memory-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.memory-item {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.recovery-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recovery-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.recovery-type {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.recovery-info {
  display: flex;
  gap: 8px;
  font-size: 11px;
}

.success-rate.good { color: #28a745; }
.success-rate.medium { color: #ffc107; }
.success-rate.poor { color: #dc3545; }

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #17a2b8;
}

.recommendation-item.priority-high {
  border-left-color: #dc3545;
  background: #fff5f5;
}

.recommendation-text {
  flex: 1;
  font-size: 12px;
  color: #333;
}

.recommendation-action {
  padding: 4px 8px;
  border: 1px solid #007bff;
  border-radius: 3px;
  background: #007bff;
  color: #fff;
  font-size: 11px;
  cursor: pointer;
}

.recommendation-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.health-actions {
  padding: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-button {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #007bff;
  border-radius: 4px;
  background: #007bff;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover:not(:disabled) {
  background: #0056b3;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.secondary {
  background: #6c757d;
  border-color: #6c757d;
}

.action-button.secondary:hover:not(:disabled) {
  background: #545b62;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .system-health-monitor {
    top: 60px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .memory-details {
    grid-template-columns: 1fr;
  }

  .health-actions {
    flex-direction: column;
  }

  .action-button {
    flex: none;
  }
}
</style>
