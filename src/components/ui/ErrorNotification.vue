<template>
  <div class="error-notification-container">
    <!-- 错误通知列表 -->
    <transition-group name="notification" tag="div" class="notification-list">
      <div
        v-for="notification in visibleNotifications"
        :key="notification.id"
        class="error-notification"
        :class="[
          `level-${notification.level}`,
          `type-${notification.type}`,
          { 'can-recover': notification.canRecover }
        ]"
      >
        <!-- 通知图标 -->
        <div class="notification-icon">
          <span v-if="notification.level === 'critical'">🚨</span>
          <span v-else-if="notification.level === 'high'">⚠️</span>
          <span v-else-if="notification.level === 'medium'">⚡</span>
          <span v-else>ℹ️</span>
        </div>

        <!-- 通知内容 -->
        <div class="notification-content">
          <div class="notification-title">
            {{ getNotificationTitle(notification) }}
          </div>
          <div class="notification-message">
            {{ notification.message }}
          </div>
          
          <!-- 恢复状态 -->
          <div v-if="notification.canRecover" class="recovery-status">
            <span class="recovery-icon">✅</span>
            <span class="recovery-text">问题已自动解决</span>
          </div>

          <!-- 操作按钮 -->
          <div v-if="notification.actions && notification.actions.length > 0" class="notification-actions">
            <button
              v-for="action in notification.actions"
              :key="action.action"
              class="action-button"
              :class="action.action"
              @click="handleAction(notification, action)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>

        <!-- 关闭按钮 -->
        <button class="close-button" @click="dismissNotification(notification.id)">
          ×
        </button>

        <!-- 进度条（自动消失） -->
        <div
          v-if="notification.autoClose"
          class="auto-close-progress"
          :style="{ animationDuration: `${notification.duration}ms` }"
        ></div>
      </div>
    </transition-group>

    <!-- 错误详情模态框 -->
    <div v-if="showDetails" class="error-details-modal" @click="closeDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>错误详情</h3>
          <button class="close-button" @click="closeDetails">×</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-item">
              <span class="label">错误类型:</span>
              <span class="value">{{ selectedError.type }}</span>
            </div>
            <div class="detail-item">
              <span class="label">错误级别:</span>
              <span class="value level-badge" :class="`level-${selectedError.level}`">
                {{ selectedError.level }}
              </span>
            </div>
            <div class="detail-item">
              <span class="label">发生时间:</span>
              <span class="value">{{ formatTimestamp(selectedError.timestamp) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>错误消息</h4>
            <div class="error-message">{{ selectedError.message }}</div>
          </div>

          <div v-if="selectedError.context" class="detail-section">
            <h4>上下文信息</h4>
            <pre class="context-info">{{ JSON.stringify(selectedError.context, null, 2) }}</pre>
          </div>

          <div v-if="selectedError.stack" class="detail-section">
            <h4>堆栈跟踪</h4>
            <pre class="stack-trace">{{ selectedError.stack }}</pre>
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-button secondary" @click="copyErrorInfo">复制错误信息</button>
          <button class="action-button primary" @click="reportError">报告错误</button>
        </div>
      </div>
    </div>

    <!-- 全局错误统计 -->
    <div v-if="showStats" class="error-stats">
      <div class="stats-header">
        <h4>错误统计</h4>
        <button class="toggle-button" @click="showStats = false">收起</button>
      </div>
      <div class="stats-content">
        <div class="stat-item">
          <span class="stat-label">总错误数:</span>
          <span class="stat-value">{{ errorStats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最近1小时:</span>
          <span class="stat-value">{{ errorStats.recent }}</span>
        </div>
        <div class="stats-breakdown">
          <h5>按类型分布:</h5>
          <div v-for="(count, type) in errorStats.byType" :key="type" class="breakdown-item">
            <span class="breakdown-label">{{ type }}:</span>
            <span class="breakdown-value">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { errorHandler } from '@/utils/ErrorHandler.js';

export default {
  name: 'ErrorNotification',
  data() {
    return {
      notifications: [],
      maxNotifications: 5,
      defaultDuration: 5000,
      showDetails: false,
      selectedError: null,
      showStats: false,
      errorStats: {
        total: 0,
        recent: 0,
        byType: {},
        byLevel: {}
      }
    };
  },
  computed: {
    visibleNotifications() {
      return this.notifications.slice(0, this.maxNotifications);
    }
  },
  mounted() {
    this.setupErrorHandler();
    this.updateErrorStats();
    
    // 定期更新统计信息
    this.statsInterval = setInterval(() => {
      this.updateErrorStats();
    }, 30000); // 每30秒更新一次
  },
  beforeDestroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    errorHandler.offUserNotification(this.handleErrorNotification);
  },
  methods: {
    /**
     * 设置错误处理器
     */
    setupErrorHandler() {
      errorHandler.onUserNotification(this.handleErrorNotification.bind(this));
    },

    /**
     * 处理错误通知
     * @param {Object} notification - 通知对象
     */
    handleErrorNotification(notification) {
      const notificationItem = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification,
        autoClose: notification.level !== 'critical',
        duration: this.getDuration(notification.level)
      };

      this.notifications.unshift(notificationItem);

      // 自动关闭
      if (notificationItem.autoClose) {
        setTimeout(() => {
          this.dismissNotification(notificationItem.id);
        }, notificationItem.duration);
      }

      // 限制通知数量
      if (this.notifications.length > this.maxNotifications * 2) {
        this.notifications = this.notifications.slice(0, this.maxNotifications * 2);
      }

      // 更新统计
      this.updateErrorStats();
    },

    /**
     * 获取通知标题
     * @param {Object} notification - 通知对象
     * @returns {string} 标题
     */
    getNotificationTitle(notification) {
      const titles = {
        network: '网络错误',
        validation: '数据验证错误',
        adapter: '组件错误',
        memory: '内存错误',
        file: '文件错误',
        permission: '权限错误',
        unknown: '未知错误'
      };
      return titles[notification.type] || '系统错误';
    },

    /**
     * 获取通知持续时间
     * @param {string} level - 错误级别
     * @returns {number} 持续时间（毫秒）
     */
    getDuration(level) {
      const durations = {
        low: 3000,
        medium: 5000,
        high: 8000,
        critical: 0 // 不自动关闭
      };
      return durations[level] || this.defaultDuration;
    },

    /**
     * 处理操作按钮点击
     * @param {Object} notification - 通知对象
     * @param {Object} action - 操作对象
     */
    handleAction(notification, action) {
      this.$emit('error-action', {
        notification,
        action: action.action,
        actionData: action
      });

      // 某些操作后自动关闭通知
      if (['retry', 'refresh', 'switchAdapter'].includes(action.action)) {
        this.dismissNotification(notification.id);
      }
    },

    /**
     * 关闭通知
     * @param {string} notificationId - 通知ID
     */
    dismissNotification(notificationId) {
      const index = this.notifications.findIndex(n => n.id === notificationId);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    },

    /**
     * 显示错误详情
     * @param {Object} notification - 通知对象
     */
    showErrorDetails(notification) {
      this.selectedError = notification;
      this.showDetails = true;
    },

    /**
     * 关闭错误详情
     */
    closeDetails() {
      this.showDetails = false;
      this.selectedError = null;
    },

    /**
     * 复制错误信息
     */
    copyErrorInfo() {
      if (!this.selectedError) return;

      const errorInfo = {
        type: this.selectedError.type,
        level: this.selectedError.level,
        message: this.selectedError.message,
        timestamp: this.selectedError.timestamp,
        context: this.selectedError.context,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      const text = JSON.stringify(errorInfo, null, 2);
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.$emit('info-message', '错误信息已复制到剪贴板');
        });
      } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.$emit('info-message', '错误信息已复制到剪贴板');
      }
    },

    /**
     * 报告错误
     */
    reportError() {
      if (!this.selectedError) return;

      this.$emit('report-error', this.selectedError);
      this.closeDetails();
    },

    /**
     * 格式化时间戳
     * @param {number} timestamp - 时间戳
     * @returns {string} 格式化的时间
     */
    formatTimestamp(timestamp) {
      return new Date(timestamp).toLocaleString();
    },

    /**
     * 更新错误统计
     */
    updateErrorStats() {
      this.errorStats = errorHandler.getErrorStats();
    },

    /**
     * 切换统计显示
     */
    toggleStats() {
      this.showStats = !this.showStats;
      if (this.showStats) {
        this.updateErrorStats();
      }
    },

    /**
     * 清除所有通知
     */
    clearAllNotifications() {
      this.notifications = [];
    }
  }
};
</script>

<style scoped>
.error-notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  max-width: 400px;
  width: 100%;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-notification {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #ccc;
  padding: 16px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.error-notification.level-low {
  border-left-color: #17a2b8;
}

.error-notification.level-medium {
  border-left-color: #ffc107;
}

.error-notification.level-high {
  border-left-color: #fd7e14;
}

.error-notification.level-critical {
  border-left-color: #dc3545;
  background: #fff5f5;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 8px;
}

.recovery-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #28a745;
}

.notification-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-button {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: #f8f9fa;
}

.action-button.primary {
  background: #007bff;
  color: #fff;
  border-color: #007bff;
}

.action-button.secondary {
  background: #6c757d;
  color: #fff;
  border-color: #6c757d;
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #666;
}

.auto-close-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(90deg, #007bff, #28a745);
  animation: progress-countdown linear;
  animation-fill-mode: forwards;
}

@keyframes progress-countdown {
  from { width: 100%; }
  to { width: 0%; }
}

/* 通知动画 */
.notification-enter-active {
  transition: all 0.3s ease;
}

.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 错误详情模态框 */
.error-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  max-width: 600px;
  max-height: 80vh;
  width: 90%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4,
.detail-section h5 {
  margin: 0 0 8px 0;
  color: #333;
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
}

.detail-item .label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.detail-item .value {
  color: #333;
}

.level-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}

.level-badge.level-low { background: #d1ecf1; color: #0c5460; }
.level-badge.level-medium { background: #fff3cd; color: #856404; }
.level-badge.level-high { background: #f8d7da; color: #721c24; }
.level-badge.level-critical { background: #f5c6cb; color: #721c24; }

.error-message,
.context-info,
.stack-trace {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

/* 错误统计 */
.error-stats {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 12px;
  overflow: hidden;
}

.stats-header {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-content {
  padding: 16px;
}

.stat-item,
.breakdown-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.stat-label,
.breakdown-label {
  color: #666;
}

.stat-value,
.breakdown-value {
  font-weight: 500;
  color: #333;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .error-notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .error-notification {
    padding: 12px;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .modal-body {
    padding: 16px;
  }
}
</style>
