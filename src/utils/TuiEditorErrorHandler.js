/**
 * TUI Image Editor 错误处理工具类
 * 专门处理TUI Image Editor相关的错误和状态恢复
 */

class TuiEditorErrorHandler {
  constructor() {
    this.errorCount = 0
    this.lastErrorTime = 0
    this.maxErrorsPerMinute = 10
    this.recoveryAttempts = 0
    this.maxRecoveryAttempts = 3
  }

  /**
   * 检查是否是TUI Image Editor相关的错误
   * @param {Error|string} error - 错误对象或错误消息
   * @returns {boolean}
   */
  isTuiEditorError(error) {
    const message = typeof error === 'string' ? error : error?.message || ''
    const stack = error?.stack || ''
    
    return (
      message.includes('Cannot read properties of null') ||
      message.includes('Cannot read properties of undefined') ||
      message.includes('tui-image-editor') ||
      message.includes('Cropper._onFabricMouseMove') ||
      message.includes('fabric') ||
      stack.includes('tui-image-editor')
    )
  }

  /**
   * 检查是否是null引用错误
   * @param {Error|string} error - 错误对象或错误消息
   * @returns {boolean}
   */
  isNullReferenceError(error) {
    const message = typeof error === 'string' ? error : error?.message || ''
    return (
      message.includes('Cannot read properties of null') ||
      message.includes('Cannot read properties of undefined') ||
      message.includes('null is not an object') ||
      message.includes('undefined is not an object')
    )
  }

  /**
   * 检查错误频率是否过高
   * @returns {boolean}
   */
  isErrorRateTooHigh() {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // 重置计数器如果超过一分钟
    if (now - this.lastErrorTime > 60000) {
      this.errorCount = 0
    }

    this.errorCount++
    this.lastErrorTime = now

    return this.errorCount > this.maxErrorsPerMinute
  }

  /**
   * 处理TUI Image Editor错误
   * @param {Error|string} error - 错误对象或错误消息
   * @param {Object} editorInstance - 编辑器实例
   * @param {Object} context - 上下文对象，包含状态和方法
   * @returns {boolean} 是否成功处理错误
   */
  handleError(error, editorInstance, context) {
    console.error('TUI Editor Error Handler - 处理错误:', error)

    // 检查错误频率
    if (this.isErrorRateTooHigh()) {
      console.error('错误频率过高，停止自动恢复')
      return false
    }

    // 检查是否是TUI Editor相关错误
    if (!this.isTuiEditorError(error)) {
      console.log('非TUI Editor错误，跳过处理')
      return false
    }

    // 检查恢复尝试次数
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      console.error('已达到最大恢复尝试次数，停止恢复')
      return false
    }

    this.recoveryAttempts++

    try {
      // 执行错误恢复
      this.recoverFromError(error, editorInstance, context)
      
      // 重置恢复计数器（成功恢复后）
      setTimeout(() => {
        this.recoveryAttempts = Math.max(0, this.recoveryAttempts - 1)
      }, 5000)

      return true
    } catch (recoveryError) {
      console.error('错误恢复失败:', recoveryError)
      return false
    }
  }

  /**
   * 从错误中恢复
   * @param {Error|string} error - 错误对象或错误消息
   * @param {Object} editorInstance - 编辑器实例
   * @param {Object} context - 上下文对象
   */
  recoverFromError(error, editorInstance, context) {
    console.log('开始错误恢复流程...')

    // 1. 重置状态标志
    if (context.resetState) {
      context.resetState()
    }

    // 2. 停止所有绘制模式
    if (editorInstance) {
      try {
        editorInstance.stopDrawingMode()
      } catch (stopError) {
        console.warn('停止绘制模式失败:', stopError)
      }
    }

    // 3. 重新启用鼠标事件
    if (context.enableMouseEvents) {
      setTimeout(() => {
        context.enableMouseEvents()
      }, 100)
    }

    // 4. 如果是null引用错误，尝试重新初始化关键组件
    if (this.isNullReferenceError(error)) {
      this.handleNullReferenceError(editorInstance, context)
    }

    // 5. 验证编辑器状态
    if (context.validateEditorState) {
      setTimeout(() => {
        context.validateEditorState()
      }, 200)
    }

    console.log('错误恢复流程完成')
  }

  /**
   * 处理null引用错误
   * @param {Object} editorInstance - 编辑器实例
   * @param {Object} context - 上下文对象
   */
  handleNullReferenceError(editorInstance, context) {
    console.log('处理null引用错误...')

    try {
      // 尝试重新获取canvas对象
      if (editorInstance && editorInstance._graphics) {
        const canvas = editorInstance._graphics.getCanvas()
        if (!canvas) {
          console.warn('Canvas对象为null，尝试重新初始化')
          // 这里可以添加重新初始化canvas的逻辑
        }
      }

      // 清理可能的悬挂引用
      if (context.clearHangingReferences) {
        context.clearHangingReferences()
      }

    } catch (handleError) {
      console.error('处理null引用错误失败:', handleError)
    }
  }

  /**
   * 创建安全的操作包装器
   * @param {Function} operation - 要执行的操作
   * @param {Object} editorInstance - 编辑器实例
   * @param {Object} context - 上下文对象
   * @returns {Function} 包装后的安全操作
   */
  createSafeOperation(operation, editorInstance, context) {
    return (...args) => {
      try {
        // 预检查编辑器状态
        if (!this.validateEditorState(editorInstance)) {
          console.warn('编辑器状态异常，跳过操作')
          return
        }

        return operation.apply(context, args)
      } catch (error) {
        console.error('安全操作执行失败:', error)
        this.handleError(error, editorInstance, context)
      }
    }
  }

  /**
   * 验证编辑器状态
   * @param {Object} editorInstance - 编辑器实例
   * @returns {boolean}
   */
  validateEditorState(editorInstance) {
    if (!editorInstance) {
      return false
    }

    try {
      // 检查编辑器基本状态
      const canvasSize = editorInstance.getCanvasSize()
      const fabricCanvas = editorInstance._graphics?.getCanvas?.()

      // 验证关键对象和状态
      return !!(canvasSize && fabricCanvas && canvasSize.width > 0 && canvasSize.height > 0)
    } catch (error) {
      console.warn('验证编辑器状态失败:', error)
      return false
    }
  }

  /**
   * 重置错误计数器
   */
  resetErrorCount() {
    this.errorCount = 0
    this.recoveryAttempts = 0
    this.lastErrorTime = 0
  }

  /**
   * 获取错误统计信息
   * @returns {Object}
   */
  getErrorStats() {
    return {
      errorCount: this.errorCount,
      recoveryAttempts: this.recoveryAttempts,
      lastErrorTime: this.lastErrorTime,
      isRateLimited: this.isErrorRateTooHigh()
    }
  }
}

// 创建单例实例
const tuiEditorErrorHandler = new TuiEditorErrorHandler()

export default tuiEditorErrorHandler
