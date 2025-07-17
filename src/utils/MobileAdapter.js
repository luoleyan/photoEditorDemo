/**
 * 移动端适配工具类
 * 处理移动设备的特殊需求和优化
 */
class MobileAdapter {
  constructor() {
    this.isMobile = this._detectMobile();
    this.isTouch = this._detectTouch();
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.orientation = this._getOrientation();
    this.touchHandlers = new Map();
    this.gestureHandlers = new Map();

    // 移动端性能配置
    this.mobileConfig = {
      maxCanvasSize: this.isMobile ? 2048 : 4096,
      compressionQuality: this.isMobile ? 0.7 : 0.8,
      maxMemoryUsage: this.isMobile ? 50 * 1024 * 1024 : 100 * 1024 * 1024, // 50MB vs 100MB
      enableHardwareAcceleration: true,
      reducedAnimations: this.isMobile,
    };

    this._setupEventListeners();
  }

  /**
   * 检测是否为移动设备
   * @returns {boolean}
   * @private
   */
  _detectMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      "android",
      "iphone",
      "ipad",
      "ipod",
      "blackberry",
      "windows phone",
      "mobile",
      "tablet",
    ];

    return (
      mobileKeywords.some((keyword) => userAgent.includes(keyword)) ||
      window.innerWidth <= 768 ||
      "ontouchstart" in window
    );
  }

  /**
   * 检测触摸支持
   * @returns {boolean}
   * @private
   */
  _detectTouch() {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  /**
   * 获取设备方向
   * @returns {string}
   * @private
   */
  _getOrientation() {
    if (screen.orientation) {
      return screen.orientation.angle === 0 || screen.orientation.angle === 180
        ? "portrait"
        : "landscape";
    }
    return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
  }

  /**
   * 设置事件监听器
   * @private
   */
  _setupEventListeners() {
    // 方向变化监听
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        this.orientation = this._getOrientation();
        this._handleOrientationChange();
      }, 100);
    });

    // 窗口大小变化监听
    window.addEventListener(
      "resize",
      this._debounce(() => {
        this._handleResize();
      }, 250)
    );

    // 阻止默认的触摸行为（如双击缩放）
    if (this.isTouch) {
      document.addEventListener("touchstart", this._preventDefaultTouch, {
        passive: false,
      });
      document.addEventListener("touchmove", this._preventDefaultTouch, {
        passive: false,
      });
    }
  }

  /**
   * 为元素添加触摸手势支持
   * @param {HTMLElement} element - 目标元素
   * @param {Object} options - 配置选项
   */
  addTouchSupport(element, options = {}) {
    if (!this.isTouch || !element) return;

    const config = {
      enablePinch: true,
      enablePan: true,
      enableTap: true,
      enableDoubleTap: true,
      minScale: 0.1,
      maxScale: 5,
      ...options,
    };

    const touchHandler = new TouchHandler(element, config);
    this.touchHandlers.set(element, touchHandler);

    return touchHandler;
  }

  /**
   * 移除触摸支持
   * @param {HTMLElement} element - 目标元素
   */
  removeTouchSupport(element) {
    const handler = this.touchHandlers.get(element);
    if (handler) {
      handler.destroy();
      this.touchHandlers.delete(element);
    }
  }

  /**
   * 优化Canvas性能
   * @param {HTMLCanvasElement} canvas - Canvas元素
   * @param {Object} options - 优化选项
   */
  optimizeCanvas(canvas, options = {}) {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设备像素比优化
    const ratio = Math.min(this.devicePixelRatio, 2); // 限制最大比例
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    ctx.scale(ratio, ratio);

    // 移动端性能优化
    if (this.isMobile) {
      ctx.imageSmoothingEnabled = options.smoothing !== false;
      ctx.imageSmoothingQuality = "medium"; // 平衡质量和性能

      // 启用硬件加速
      canvas.style.transform = "translateZ(0)";
      canvas.style.willChange = "transform";
    }

    return { ratio, width: canvas.width, height: canvas.height };
  }

  /**
   * 获取移动端配置
   * @returns {Object}
   */
  getMobileConfig() {
    return { ...this.mobileConfig };
  }

  /**
   * 获取设备信息
   * @returns {Object}
   */
  getDeviceInfo() {
    return {
      isMobile: this.isMobile,
      isTouch: this.isTouch,
      devicePixelRatio: this.devicePixelRatio,
      orientation: this.orientation,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
      },
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      userAgent: navigator.userAgent,
    };
  }

  /**
   * 处理方向变化
   * @private
   */
  _handleOrientationChange() {
    // 触发自定义事件
    window.dispatchEvent(
      new CustomEvent("mobile-orientation-change", {
        detail: { orientation: this.orientation },
      })
    );
  }

  /**
   * 处理窗口大小变化
   * @private
   */
  _handleResize() {
    // 重新检测移动设备状态
    this.isMobile = this._detectMobile();

    // 触发自定义事件
    window.dispatchEvent(
      new CustomEvent("mobile-resize", {
        detail: this.getDeviceInfo(),
      })
    );
  }

  /**
   * 防止默认触摸行为
   * @param {TouchEvent} event
   * @private
   */
  _preventDefaultTouch(event) {
    // 只在特定元素上阻止默认行为
    const target = event.target;
    if (
      target.closest(".canvas-container") ||
      target.closest(".image-editor")
    ) {
      if (event.touches.length > 1) {
        event.preventDefault(); // 阻止多点触摸的默认行为
      }
    }
  }

  /**
   * 防抖函数
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   * @private
   */
  _debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 销毁适配器
   */
  destroy() {
    // 清理所有触摸处理器
    this.touchHandlers.forEach((handler) => handler.destroy());
    this.touchHandlers.clear();

    // 移除事件监听器
    window.removeEventListener(
      "orientationchange",
      this._handleOrientationChange
    );
    window.removeEventListener("resize", this._handleResize);

    if (this.isTouch) {
      document.removeEventListener("touchstart", this._preventDefaultTouch);
      document.removeEventListener("touchmove", this._preventDefaultTouch);
    }
  }
}

/**
 * 触摸手势处理器
 */
class TouchHandler {
  constructor(element, config) {
    this.element = element;
    this.config = config;
    this.isActive = false;
    this.touches = [];
    this.lastTap = 0;
    this.transform = {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    };

    this._bindEvents();
  }

  /**
   * 绑定触摸事件
   * @private
   */
  _bindEvents() {
    this.element.addEventListener(
      "touchstart",
      this._handleTouchStart.bind(this),
      { passive: false }
    );
    this.element.addEventListener(
      "touchmove",
      this._handleTouchMove.bind(this),
      { passive: false }
    );
    this.element.addEventListener("touchend", this._handleTouchEnd.bind(this), {
      passive: false,
    });
    this.element.addEventListener(
      "touchcancel",
      this._handleTouchEnd.bind(this),
      { passive: false }
    );
  }

  /**
   * 处理触摸开始
   * @param {TouchEvent} event
   * @private
   */
  _handleTouchStart(event) {
    this.isActive = true;
    this.touches = Array.from(event.touches);

    // 检测双击
    if (this.config.enableDoubleTap && event.touches.length === 1) {
      const now = Date.now();
      if (now - this.lastTap < 300) {
        this._handleDoubleTap(event);
      }
      this.lastTap = now;
    }

    this._emitEvent("touchstart", {
      touches: this.touches,
      transform: this.transform,
    });
  }

  /**
   * 处理触摸移动
   * @param {TouchEvent} event
   * @private
   */
  _handleTouchMove(event) {
    if (!this.isActive) return;

    event.preventDefault();
    const touches = Array.from(event.touches);

    if (touches.length === 1 && this.config.enablePan) {
      this._handlePan(touches[0]);
    } else if (touches.length === 2 && this.config.enablePinch) {
      this._handlePinch(touches);
    }

    this.touches = touches;
    this._emitEvent("touchmove", {
      touches: this.touches,
      transform: this.transform,
    });
  }

  /**
   * 处理触摸结束
   * @param {TouchEvent} event
   * @private
   */
  _handleTouchEnd(event) {
    this.isActive = false;
    this.touches = Array.from(event.touches);

    if (this.touches.length === 0 && this.config.enableTap) {
      this._handleTap(event);
    }

    this._emitEvent("touchend", {
      touches: this.touches,
      transform: this.transform,
    });
  }

  /**
   * 处理平移手势
   * @param {Touch} touch
   * @private
   */
  _handlePan(touch) {
    if (this.touches.length > 0) {
      const deltaX = touch.clientX - this.touches[0].clientX;
      const deltaY = touch.clientY - this.touches[0].clientY;

      this.transform.x += deltaX;
      this.transform.y += deltaY;
    }
  }

  /**
   * 处理缩放手势
   * @param {Touch[]} touches
   * @private
   */
  _handlePinch(touches) {
    if (this.touches.length === 2) {
      const currentDistance = this._getDistance(touches[0], touches[1]);
      const lastDistance = this._getDistance(this.touches[0], this.touches[1]);

      if (lastDistance > 0) {
        const scaleChange = currentDistance / lastDistance;
        const newScale = this.transform.scale * scaleChange;

        // 限制缩放范围
        this.transform.scale = Math.max(
          this.config.minScale,
          Math.min(this.config.maxScale, newScale)
        );
      }
    }
  }

  /**
   * 处理点击
   * @param {TouchEvent} event
   * @private
   */
  _handleTap(event) {
    this._emitEvent("tap", {
      point: {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      },
    });
  }

  /**
   * 处理双击
   * @param {TouchEvent} event
   * @private
   */
  _handleDoubleTap(event) {
    this._emitEvent("doubletap", {
      point: {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      },
    });
  }

  /**
   * 计算两点距离
   * @param {Touch} touch1
   * @param {Touch} touch2
   * @returns {number}
   * @private
   */
  _getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 触发自定义事件
   * @param {string} type
   * @param {Object} detail
   * @private
   */
  _emitEvent(type, detail) {
    this.element.dispatchEvent(new CustomEvent(`touch-${type}`, { detail }));
  }

  /**
   * 销毁处理器
   */
  destroy() {
    this.element.removeEventListener("touchstart", this._handleTouchStart);
    this.element.removeEventListener("touchmove", this._handleTouchMove);
    this.element.removeEventListener("touchend", this._handleTouchEnd);
    this.element.removeEventListener("touchcancel", this._handleTouchEnd);
  }
}

// 创建全局实例
const mobileAdapter = new MobileAdapter();

export default MobileAdapter;
export { mobileAdapter };
