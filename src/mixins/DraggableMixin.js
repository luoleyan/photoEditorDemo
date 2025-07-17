/**
 * 可拖拽组件混入
 * 提供拖拽、边缘吸附、冲突避免等功能
 */
export default {
  data() {
    return {
      // 拖拽状态
      isDragging: false,
      isPotentialDrag: false, // 是否可能开始拖拽
      dragStartX: 0,
      dragStartY: 0,
      dragOffsetX: 0,
      dragOffsetY: 0,
      dragThreshold: 5, // 拖拽阈值，超过这个距离才认为是拖拽

      // 位置状态
      position: {
        x: 20, // 初始位置，会在mounted中重新计算
        y: 20,
        isSnapped: false,
        snapEdge: null, // 'top', 'bottom', 'left', 'right'
      },

      // 边缘吸附配置
      snapConfig: {
        threshold: 50, // 距离边缘多少像素时开始吸附
        hiddenSize: 30, // 吸附后显示的大小
        animationDuration: 300,
      },

      // 边缘指示器状态
      edgeIndicator: {
        visible: false,
        edge: null, // 'top', 'bottom', 'left', 'right'
        opacity: 0,
      },

      // 冲突检测
      conflictAvoidance: {
        enabled: true,
        minDistance: 20,
        otherComponents: [],
      },
    };
  },

  computed: {
    /**
     * 计算组件样式
     */
    draggableStyle() {
      const style = {
        position: "fixed",
        transform: `translate(${this.position.x}px, ${this.position.y}px)`,
        transition: this.isDragging
          ? "none"
          : `transform ${this.snapConfig.animationDuration}ms ease-out`,
        zIndex: this.isDragging ? 2000 : this.position.isSnapped ? 1200 : 1500,
        opacity: this.isDragging ? 0.8 : this.position.isSnapped ? 0.9 : 1,
        cursor: this.isDragging ? "grabbing" : "grab",
      };

      return style;
    },

    /**
     * 触发区域样式（用于吸附后的展开）
     */
    triggerAreaStyle() {
      if (!this.position.isSnapped) return { display: "none" };

      const size = this.snapConfig.hiddenSize;
      const componentWidth = this.getComponentWidth();
      const componentHeight = this.getComponentHeight();

      let style = {
        position: "fixed",
        zIndex: 1600,
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: `all ${this.snapConfig.animationDuration}ms ease-out`,
      };

      // 触发区域应该位于边缘，与吸附后的控件可见部分重叠
      switch (this.position.snapEdge) {
        case "top":
          style = {
            ...style,
            top: "0px",
            left: `${Math.max(0, this.position.x)}px`,
            width: `${componentWidth}px`,
            height: `${size}px`,
          };
          break;
        case "bottom":
          style = {
            ...style,
            bottom: "0px",
            left: `${Math.max(0, this.position.x)}px`,
            width: `${componentWidth}px`,
            height: `${size}px`,
          };
          break;
        case "left":
          style = {
            ...style,
            top: `${Math.max(0, this.position.y)}px`,
            left: "0px",
            width: `${size}px`,
            height: `${componentHeight}px`,
          };
          break;
        case "right":
          style = {
            ...style,
            top: `${Math.max(0, this.position.y)}px`,
            right: "0px",
            width: `${size}px`,
            height: `${componentHeight}px`,
          };
          break;
      }

      return style;
    },

    /**
     * 边缘指示器样式
     */
    edgeIndicatorStyle() {
      if (!this.edgeIndicator.visible || !this.edgeIndicator.edge) {
        return { display: "none" };
      }

      const edge = this.edgeIndicator.edge;
      const opacity = this.edgeIndicator.opacity;
      const hiddenSize = this.snapConfig.hiddenSize;
      const componentWidth = this.getComponentWidth();
      const componentHeight = this.getComponentHeight();

      let style = {
        position: "fixed",
        zIndex: 1900,
        backgroundColor: this.getEdgeIndicatorColor(edge),
        border: `2px dashed ${this.getEdgeIndicatorBorderColor(edge)}`,
        opacity: opacity,
        transition: "all 0.2s ease",
        pointerEvents: "none",
        borderRadius: "4px",
      };

      // 根据边缘位置设置指示器尺寸和位置，显示控件吸附后的实际位置
      switch (edge) {
        case "top":
          style = {
            ...style,
            top: "0px",
            left: `${this.position.x}px`,
            width: `${componentWidth}px`,
            height: `${hiddenSize}px`,
          };
          break;
        case "bottom":
          style = {
            ...style,
            bottom: "0px",
            left: `${this.position.x}px`,
            width: `${componentWidth}px`,
            height: `${hiddenSize}px`,
          };
          break;
        case "left":
          style = {
            ...style,
            top: `${this.position.y}px`,
            left: "0px",
            width: `${hiddenSize}px`,
            height: `${componentHeight}px`,
          };
          break;
        case "right":
          style = {
            ...style,
            top: `${this.position.y}px`,
            right: "0px",
            width: `${hiddenSize}px`,
            height: `${componentHeight}px`,
          };
          break;
      }

      return style;
    },

    /**
     * 吸附状态标识样式
     */
    snapStatusStyle() {
      if (!this.position.isSnapped) {
        return { display: "none" };
      }

      return {
        position: "absolute",
        top: "-8px",
        right: "-8px",
        background: this.getEdgeIndicatorColor(this.position.snapEdge),
        color: "white",
        fontSize: "10px",
        padding: "2px 6px",
        borderRadius: "10px",
        zIndex: 10,
        whiteSpace: "nowrap",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        animation: "snapStatusPulse 2s ease-in-out",
      };
    },
  },

  mounted() {
    this.initializeDraggable();
    this.setInitialPosition();
    this.loadPosition();
    this.registerComponent();
  },

  beforeDestroy() {
    this.unregisterComponent();
    this.removeDragListeners();
    this.removeTouchListeners();
    this.removeElementListeners();
  },

  methods: {
    /**
     * 设置初始位置
     */
    setInitialPosition() {
      // 如果已经有保存的位置，不重新设置
      const key = `draggable-position-${this.$options.name || "component"}`;
      const saved = localStorage.getItem(key);
      if (saved) return;

      // 计算合适的初始位置
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const componentWidth = 300; // 估算的组件宽度
      const componentHeight = 200; // 估算的组件高度

      // 根据组件类型设置不同的初始位置
      const componentName = this.$options.name || "";

      if (
        componentName.includes("performance") ||
        componentName.includes("Performance")
      ) {
        // 性能监控器放在右上角
        this.position.x = Math.max(20, viewportWidth - componentWidth - 20);
        this.position.y = 80;
      } else if (
        componentName.includes("health") ||
        componentName.includes("Health")
      ) {
        // 系统健康监控器放在右侧中间
        this.position.x = Math.max(20, viewportWidth - componentWidth - 20);
        this.position.y = Math.max(100, (viewportHeight - componentHeight) / 2);
      } else {
        // 默认位置：右侧中间偏上
        this.position.x = Math.max(20, viewportWidth - componentWidth - 20);
        this.position.y = Math.max(80, viewportHeight * 0.3);
      }

      // 确保位置在可视区域内
      this.position.x = Math.min(this.position.x, viewportWidth - 100);
      this.position.y = Math.min(this.position.y, viewportHeight - 100);
    },

    /**
     * 初始化拖拽功能
     */
    initializeDraggable() {
      this.$nextTick(() => {
        const element = this.$el;
        if (element) {
          element.addEventListener("mousedown", this.handleMouseDown);
          element.addEventListener("touchstart", this.handleTouchStart, {
            passive: false,
          });

          // 防止默认的拖拽行为
          element.addEventListener("dragstart", (e) => e.preventDefault());
        }
      });
    },

    /**
     * 鼠标按下事件
     */
    handleMouseDown(event) {
      // 只有在拖拽手柄区域才能拖拽
      if (!this.isDragHandle(event.target)) return;

      // 不阻止默认行为，让点击事件正常触发
      this.prepareDrag(event.clientX, event.clientY);

      document.addEventListener("mousemove", this.handleMouseMove);
      document.addEventListener("mouseup", this.handleMouseUp);
    },

    /**
     * 触摸开始事件
     */
    handleTouchStart(event) {
      if (!this.isDragHandle(event.target)) return;

      // 触摸设备上阻止默认行为以避免滚动
      event.preventDefault();
      const touch = event.touches[0];
      this.prepareDrag(touch.clientX, touch.clientY);

      document.addEventListener("touchmove", this.handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", this.handleTouchEnd);
    },

    /**
     * 准备拖拽（鼠标按下时调用）
     */
    prepareDrag(clientX, clientY) {
      this.isPotentialDrag = true;
      this.dragStartX = clientX;
      this.dragStartY = clientY;

      // 计算正确的拖拽偏移量
      // 考虑当前元素的transform位置
      this.dragOffsetX = clientX - this.position.x;
      this.dragOffsetY = clientY - this.position.y;
    },

    /**
     * 开始拖拽（移动超过阈值时调用）
     */
    startDrag() {
      if (this.isDragging) return;

      this.isDragging = true;
      this.isPotentialDrag = false;

      // 如果当前是吸附状态，先取消吸附
      if (this.position.isSnapped) {
        this.unsnap();
      }

      this.$emit("drag-start");
    },

    /**
     * 鼠标移动事件
     */
    handleMouseMove(event) {
      if (!this.isPotentialDrag && !this.isDragging) return;

      // 检查是否超过拖拽阈值
      if (this.isPotentialDrag && !this.isDragging) {
        const deltaX = Math.abs(event.clientX - this.dragStartX);
        const deltaY = Math.abs(event.clientY - this.dragStartY);

        if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
          this.startDrag();
        } else {
          return; // 还没有超过阈值，不更新位置
        }
      }

      this.updatePosition(event.clientX, event.clientY);
    },

    /**
     * 触摸移动事件
     */
    handleTouchMove(event) {
      if (!this.isPotentialDrag && !this.isDragging) return;

      event.preventDefault();
      const touch = event.touches[0];

      // 检查是否超过拖拽阈值
      if (this.isPotentialDrag && !this.isDragging) {
        const deltaX = Math.abs(touch.clientX - this.dragStartX);
        const deltaY = Math.abs(touch.clientY - this.dragStartY);

        if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
          this.startDrag();
        } else {
          return; // 还没有超过阈值，不更新位置
        }
      }

      this.updatePosition(touch.clientX, touch.clientY);
    },

    /**
     * 更新位置
     */
    updatePosition(clientX, clientY) {
      let newX = clientX - this.dragOffsetX;
      let newY = clientY - this.dragOffsetY;

      // 限制在可视区域内
      const bounds = this.getViewportBounds();
      newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
      newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));

      this.position.x = newX;
      this.position.y = newY;

      // 更新边缘指示器
      this.updateEdgeIndicator();
    },

    /**
     * 鼠标释放事件
     */
    handleMouseUp() {
      this.endDrag();
      this.removeDragListeners();
    },

    /**
     * 触摸结束事件
     */
    handleTouchEnd() {
      this.endDrag();
      this.removeTouchListeners();
    },

    /**
     * 结束拖拽
     */
    endDrag() {
      const wasDragging = this.isDragging;

      // 重置拖拽状态
      this.isDragging = false;
      this.isPotentialDrag = false;

      // 隐藏边缘指示器
      this.hideEdgeIndicator();

      // 只有在真正拖拽过的情况下才执行后续操作
      if (wasDragging) {
        // 检查是否需要边缘吸附
        this.checkEdgeSnap();

        // 检查冲突并调整位置
        this.avoidConflicts();

        // 保存位置
        this.savePosition();

        this.$emit("drag-end", { x: this.position.x, y: this.position.y });
      }
    },

    /**
     * 移除拖拽监听器
     */
    removeDragListeners() {
      document.removeEventListener("mousemove", this.handleMouseMove);
      document.removeEventListener("mouseup", this.handleMouseUp);
    },

    /**
     * 移除触摸监听器
     */
    removeTouchListeners() {
      document.removeEventListener("touchmove", this.handleTouchMove);
      document.removeEventListener("touchend", this.handleTouchEnd);
    },

    /**
     * 移除元素监听器
     */
    removeElementListeners() {
      const element = this.$el;
      if (element) {
        element.removeEventListener("mousedown", this.handleMouseDown);
        element.removeEventListener("touchstart", this.handleTouchStart);
        element.removeEventListener("dragstart", (e) => e.preventDefault());
      }
    },

    /**
     * 检查是否为拖拽手柄
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

      // 检查是否是可拖拽的头部区域，但排除交互元素
      const header = this.$el.querySelector(
        ".monitor-header, .health-indicator"
      );
      if (!header || !header.contains(target)) {
        return false;
      }

      // 排除按钮、切换箭头等交互元素
      const excludeSelectors = [
        ".toggle-btn",
        ".toggle-arrow",
        "button",
        "input",
        "select",
        "textarea",
        '[role="button"]',
        ".clickable",
      ];

      for (const selector of excludeSelectors) {
        const excludeElement = target.closest(selector);
        if (excludeElement && header.contains(excludeElement)) {
          return false;
        }
      }

      return true;
    },

    /**
     * 获取组件尺寸
     */
    getComponentWidth() {
      return this.$el ? this.$el.offsetWidth : 300;
    },

    getComponentHeight() {
      return this.$el ? this.$el.offsetHeight : 200;
    },

    /**
     * 获取视口边界
     */
    getViewportBounds() {
      const width = this.getComponentWidth();
      const height = this.getComponentHeight();

      return {
        minX: -width + this.snapConfig.hiddenSize,
        maxX: window.innerWidth - this.snapConfig.hiddenSize,
        minY: -height + this.snapConfig.hiddenSize,
        maxY: window.innerHeight - this.snapConfig.hiddenSize,
      };
    },

    /**
     * 检查边缘吸附
     */
    checkEdgeSnap() {
      const threshold = this.snapConfig.threshold;
      const x = this.position.x;
      const y = this.position.y;
      const width = this.getComponentWidth();
      const height = this.getComponentHeight();

      // 检查各个边缘
      if (y <= threshold) {
        this.snapToEdge("top");
      } else if (y >= window.innerHeight - height - threshold) {
        this.snapToEdge("bottom");
      } else if (x <= threshold) {
        this.snapToEdge("left");
      } else if (x >= window.innerWidth - width - threshold) {
        this.snapToEdge("right");
      }
    },

    /**
     * 吸附到边缘
     */
    snapToEdge(edge) {
      this.position.isSnapped = true;
      this.position.snapEdge = edge;

      // 调整位置到边缘外（隐藏大部分控件）
      const hiddenSize = this.snapConfig.hiddenSize;
      const componentWidth = this.getComponentWidth();
      const componentHeight = this.getComponentHeight();

      switch (edge) {
        case "top":
          this.position.y = -(componentHeight - hiddenSize);
          break;
        case "bottom":
          this.position.y = window.innerHeight - hiddenSize;
          break;
        case "left":
          this.position.x = -(componentWidth - hiddenSize);
          break;
        case "right":
          this.position.x = window.innerWidth - hiddenSize;
          break;
      }
      this.$emit("snapped", edge);
    },

    /**
     * 取消吸附
     */
    unsnap() {
      if (!this.position.isSnapped) return;

      const edge = this.position.snapEdge;
      const componentWidth = this.getComponentWidth();
      const componentHeight = this.getComponentHeight();
      const margin = 10; // 取消吸附后与边缘的距离

      // 将控件移动到边缘内的合理位置
      switch (edge) {
        case "top":
          this.position.y = margin;
          break;
        case "bottom":
          this.position.y = window.innerHeight - componentHeight - margin;
          break;
        case "left":
          this.position.x = margin;
          break;
        case "right":
          this.position.x = window.innerWidth - componentWidth - margin;
          break;
      }

      this.position.isSnapped = false;
      this.position.snapEdge = null;
      this.$emit("unsnapped");
    },

    /**
     * 处理触发区域点击
     */
    handleTriggerClick() {
      this.unsnap();
    },

    /**
     * 冲突避免
     */
    avoidConflicts() {
      if (!this.conflictAvoidance.enabled) return;

      const otherComponents = this.getOtherComponents();
      const myRect = this.getComponentRect();

      for (const other of otherComponents) {
        const otherRect = other.getComponentRect();
        if (this.isOverlapping(myRect, otherRect)) {
          this.resolveConflict(other);
          break;
        }
      }
    },

    /**
     * 获取其他组件
     */
    getOtherComponents() {
      // 从全局注册表获取其他可拖拽组件
      return window.draggableComponents?.filter((comp) => comp !== this) || [];
    },

    /**
     * 获取组件矩形
     */
    getComponentRect() {
      return {
        x: this.position.x,
        y: this.position.y,
        width: this.getComponentWidth(),
        height: this.getComponentHeight(),
      };
    },

    /**
     * 检查是否重叠
     */
    isOverlapping(rect1, rect2) {
      const margin = this.conflictAvoidance.minDistance;
      return !(
        rect1.x + rect1.width + margin < rect2.x ||
        rect2.x + rect2.width + margin < rect1.x ||
        rect1.y + rect1.height + margin < rect2.y ||
        rect2.y + rect2.height + margin < rect1.y
      );
    },

    /**
     * 解决冲突
     */
    resolveConflict(otherComponent) {
      // 简单策略：向右下方移动
      const offset = this.conflictAvoidance.minDistance + 10;
      this.position.x += offset;
      this.position.y += offset;

      // 确保仍在视口内
      const bounds = this.getViewportBounds();
      this.position.x = Math.min(this.position.x, bounds.maxX);
      this.position.y = Math.min(this.position.y, bounds.maxY);
    },

    /**
     * 注册组件到全局列表
     */
    registerComponent() {
      if (!window.draggableComponents) {
        window.draggableComponents = [];
      }
      window.draggableComponents.push(this);
    },

    /**
     * 从全局列表注销组件
     */
    unregisterComponent() {
      if (window.draggableComponents) {
        const index = window.draggableComponents.indexOf(this);
        if (index > -1) {
          window.draggableComponents.splice(index, 1);
        }
      }
    },

    /**
     * 保存位置到本地存储
     */
    savePosition() {
      const key = `draggable-position-${this.$options.name || "component"}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          x: this.position.x,
          y: this.position.y,
          isSnapped: this.position.isSnapped,
          snapEdge: this.position.snapEdge,
        })
      );
    },

    /**
     * 从本地存储加载位置
     */
    loadPosition() {
      const key = `draggable-position-${this.$options.name || "component"}`;
      const saved = localStorage.getItem(key);

      if (saved) {
        try {
          const position = JSON.parse(saved);
          this.position = { ...this.position, ...position };
        } catch (error) {
          console.warn("加载组件位置失败:", error);
        }
      }
    },

    /**
     * 获取边缘指示器颜色
     */
    getEdgeIndicatorColor(edge) {
      const colors = {
        top: "rgba(52, 152, 219, 0.2)", // 蓝色
        bottom: "rgba(46, 204, 113, 0.2)", // 绿色
        left: "rgba(155, 89, 182, 0.2)", // 紫色
        right: "rgba(231, 76, 60, 0.2)", // 红色
      };
      return colors[edge] || "rgba(52, 152, 219, 0.2)";
    },

    /**
     * 获取边缘指示器边框颜色
     */
    getEdgeIndicatorBorderColor(edge) {
      const colors = {
        top: "rgba(52, 152, 219, 0.6)", // 蓝色
        bottom: "rgba(46, 204, 113, 0.6)", // 绿色
        left: "rgba(155, 89, 182, 0.6)", // 紫色
        right: "rgba(231, 76, 60, 0.6)", // 红色
      };
      return colors[edge] || "rgba(52, 152, 219, 0.6)";
    },

    /**
     * 获取边缘名称文本
     */
    getEdgeDisplayName(edge) {
      const names = {
        top: "顶部",
        bottom: "底部",
        left: "左侧",
        right: "右侧",
      };
      return names[edge] || "";
    },

    /**
     * 更新边缘指示器
     */
    updateEdgeIndicator() {
      if (!this.isDragging) {
        this.hideEdgeIndicator();
        return;
      }

      const threshold = this.snapConfig.threshold;
      const x = this.position.x;
      const y = this.position.y;
      const width = this.getComponentWidth();
      const height = this.getComponentHeight();

      let nearestEdge = null;
      let distance = Infinity;

      // 检查各个边缘的距离
      const edges = [
        { edge: "top", distance: y },
        { edge: "bottom", distance: window.innerHeight - (y + height) },
        { edge: "left", distance: x },
        { edge: "right", distance: window.innerWidth - (x + width) },
      ];

      // 找到最近的边缘
      for (const edgeInfo of edges) {
        if (edgeInfo.distance < distance && edgeInfo.distance <= threshold) {
          distance = edgeInfo.distance;
          nearestEdge = edgeInfo.edge;
        }
      }

      if (nearestEdge) {
        this.showEdgeIndicator(nearestEdge, distance);
      } else {
        this.hideEdgeIndicator();
      }
    },

    /**
     * 显示边缘指示器
     */
    showEdgeIndicator(edge, distance) {
      this.edgeIndicator.visible = true;
      this.edgeIndicator.edge = edge;

      // 根据距离计算透明度（距离越近透明度越高）
      const opacity = Math.max(0.3, 1 - distance / this.snapConfig.threshold);
      this.edgeIndicator.opacity = opacity;

      this.$emit("edge-indicator-show", { edge, distance, opacity });
    },

    /**
     * 隐藏边缘指示器
     */
    hideEdgeIndicator() {
      if (this.edgeIndicator.visible) {
        this.edgeIndicator.visible = false;
        this.edgeIndicator.edge = null;
        this.edgeIndicator.opacity = 0;
        this.$emit("edge-indicator-hide");
      }
    },
  },
};
