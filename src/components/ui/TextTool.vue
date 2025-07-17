<template>
  <div class="text-tool" :class="textClasses">
    <!-- 工具栏 -->
    <div class="text-toolbar" v-if="showToolbar">
      <div class="toolbar-section">
        <h3 class="toolbar-title">{{ title }}</h3>
      </div>

      <div class="toolbar-section">
        <!-- 字体选择 -->
        <div class="font-selector">
          <select
            v-model="selectedFont"
            @change="handleFontChange"
            :disabled="disabled || !activeText"
          >
            <option
              v-for="font in availableFonts"
              :key="font.value"
              :value="font.value"
            >
              {{ font.name }}
            </option>
          </select>
        </div>

        <!-- 字号选择 -->
        <div class="font-size-selector">
          <select
            v-model="fontSize"
            @change="handleFontSizeChange"
            :disabled="disabled || !activeText"
          >
            <option v-for="size in fontSizes" :key="size" :value="size">
              {{ size }}px
            </option>
          </select>
        </div>
      </div>

      <div class="toolbar-section">
        <!-- 文本样式 -->
        <div class="text-style-controls">
          <button
            class="style-button"
            :class="{ active: textStyle.bold }"
            @click="toggleStyle('bold')"
            :disabled="disabled || !activeText"
            title="粗体"
          >
            <i class="icon-bold"></i>
          </button>

          <button
            class="style-button"
            :class="{ active: textStyle.italic }"
            @click="toggleStyle('italic')"
            :disabled="disabled || !activeText"
            title="斜体"
          >
            <i class="icon-italic"></i>
          </button>

          <button
            class="style-button"
            :class="{ active: textStyle.underline }"
            @click="toggleStyle('underline')"
            :disabled="disabled || !activeText"
            title="下划线"
          >
            <i class="icon-underline"></i>
          </button>
        </div>

        <!-- 文本对齐 -->
        <div class="text-align-controls">
          <button
            class="align-button"
            :class="{ active: textAlign === 'left' }"
            @click="setTextAlign('left')"
            :disabled="disabled || !activeText"
            title="左对齐"
          >
            <i class="icon-align-left"></i>
          </button>

          <button
            class="align-button"
            :class="{ active: textAlign === 'center' }"
            @click="setTextAlign('center')"
            :disabled="disabled || !activeText"
            title="居中对齐"
          >
            <i class="icon-align-center"></i>
          </button>

          <button
            class="align-button"
            :class="{ active: textAlign === 'right' }"
            @click="setTextAlign('right')"
            :disabled="disabled || !activeText"
            title="右对齐"
          >
            <i class="icon-align-right"></i>
          </button>
        </div>
      </div>

      <div class="toolbar-section">
        <!-- 颜色选择 -->
        <div class="color-selector">
          <label>颜色:</label>
          <div
            class="color-preview"
            :style="{ backgroundColor: textColor }"
            @click="toggleColorPicker"
          ></div>
          <div v-if="showColorPicker" class="color-picker-container">
            <color-picker
              v-model="textColor"
              @change="handleColorChange"
              :disabled="disabled || !activeText"
            />
          </div>
        </div>
      </div>

      <div class="toolbar-section">
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button
            class="add-button"
            @click="handleAddText"
            :disabled="disabled"
          >
            <i class="icon-add"></i>
            <span>添加文本</span>
          </button>

          <button
            class="delete-button"
            @click="handleDeleteText"
            :disabled="disabled || !activeText"
          >
            <i class="icon-delete"></i>
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div
      class="text-editor-container"
      ref="editorContainer"
      @click="handleContainerClick"
    >
      <!-- 背景图像 -->
      <img
        v-if="backgroundImage"
        :src="backgroundImage"
        class="background-image"
        alt="背景图像"
      />

      <!-- 文本元素 -->
      <div
        v-for="(text, index) in textElements"
        :key="text.id"
        class="text-element"
        :class="{ active: activeTextId === text.id }"
        :style="getTextElementStyle(text)"
        @click.stop="handleTextClick(text)"
        @dblclick.stop="handleTextDoubleClick(text)"
        @mousedown.stop="handleTextMouseDown(text, $event)"
        @touchstart.stop="handleTextTouchStart(text, $event)"
      >
        <!-- 编辑模式 -->
        <textarea
          v-if="editingTextId === text.id"
          v-model="editingContent"
          class="text-editor"
          :style="getTextEditorStyle(text)"
          @blur="handleTextEditComplete"
          @keydown.enter="handleTextEditComplete"
          @keydown.esc="handleTextEditCancel"
          ref="textEditor"
        ></textarea>

        <!-- 显示模式 -->
        <div
          v-else
          class="text-content"
          v-html="formatTextContent(text.content)"
        ></div>

        <!-- 变换控制 -->
        <div
          v-if="activeTextId === text.id && !editingTextId"
          class="transform-controls"
        >
          <!-- 旋转手柄 -->
          <div
            class="rotate-handle"
            @mousedown.stop="handleRotateStart($event)"
            @touchstart.stop="handleRotateStart($event)"
          >
            <i class="icon-rotate"></i>
          </div>

          <!-- 调整大小手柄 -->
          <div
            class="resize-handle"
            @mousedown.stop="handleResizeStart($event)"
            @touchstart.stop="handleResizeStart($event)"
          >
            <i class="icon-resize"></i>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="textElements.length === 0" class="empty-state">
        <i class="icon-text"></i>
        <p>{{ emptyText }}</p>
        <button class="add-text-button" @click="handleAddText">添加文本</button>
      </div>
    </div>

    <!-- 文本效果面板 -->
    <div v-if="showEffects && activeText" class="text-effects-panel">
      <h4 class="effects-title">文本效果</h4>

      <!-- 阴影效果 -->
      <div class="effect-group">
        <div class="effect-header">
          <label>
            <input
              type="checkbox"
              v-model="textEffects.shadow.enabled"
              @change="handleEffectChange"
            />
            文字阴影
          </label>
        </div>

        <div v-if="textEffects.shadow.enabled" class="effect-controls">
          <div class="effect-control">
            <label>模糊:</label>
            <input
              type="range"
              v-model.number="textEffects.shadow.blur"
              min="0"
              max="20"
              step="1"
              @input="handleEffectChange"
            />
            <span>{{ textEffects.shadow.blur }}px</span>
          </div>

          <div class="effect-control">
            <label>颜色:</label>
            <input
              type="color"
              v-model="textEffects.shadow.color"
              @input="handleEffectChange"
            />
          </div>
        </div>
      </div>

      <!-- 描边效果 -->
      <div class="effect-group">
        <div class="effect-header">
          <label>
            <input
              type="checkbox"
              v-model="textEffects.stroke.enabled"
              @change="handleEffectChange"
            />
            文字描边
          </label>
        </div>

        <div v-if="textEffects.stroke.enabled" class="effect-controls">
          <div class="effect-control">
            <label>宽度:</label>
            <input
              type="range"
              v-model.number="textEffects.stroke.width"
              min="1"
              max="10"
              step="1"
              @input="handleEffectChange"
            />
            <span>{{ textEffects.stroke.width }}px</span>
          </div>

          <div class="effect-control">
            <label>颜色:</label>
            <input
              type="color"
              v-model="textEffects.stroke.color"
              @input="handleEffectChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ColorPicker from "./ColorPicker.vue";

export default {
  name: "TextTool",
  components: {
    ColorPicker,
  },

  props: {
    // 工具标题
    title: {
      type: String,
      default: "文本工具",
    },

    // 背景图像
    backgroundImage: {
      type: String,
      default: "",
    },

    // 初始文本元素
    initialTextElements: {
      type: Array,
      default: () => [],
    },

    // 显示选项
    showToolbar: {
      type: Boolean,
      default: true,
    },
    showEffects: {
      type: Boolean,
      default: true,
    },

    // 状态
    disabled: {
      type: Boolean,
      default: false,
    },

    // 文本选项
    emptyText: {
      type: String,
      default: "暂无文本元素",
    },

    // 样式
    variant: {
      type: String,
      default: "default",
      validator: (value) => ["default", "minimal", "compact"].includes(value),
    },

    // 适配器实例
    adapter: {
      type: Object,
      required: true,
      validator(value) {
        return value && typeof value.addText === "function";
      },
    },

    // 适配器类型
    adapterType: {
      type: String,
      default: "fabric",
      validator: (value) =>
        ["fabric", "konva", "tui", "cropper", "jimp"].includes(value),
    },
  },

  data() {
    return {
      // 文本元素
      textElements: [],

      // 活动文本
      activeTextId: "",

      // 编辑状态
      editingTextId: "",
      editingContent: "",

      // 字体设置
      selectedFont: "Arial",
      fontSize: 24,
      textColor: "#000000",
      textAlign: "left",
      textStyle: {
        bold: false,
        italic: false,
        underline: false,
      },

      // 文本效果
      textEffects: {
        shadow: {
          enabled: false,
          blur: 4,
          color: "#000000",
        },
        stroke: {
          enabled: false,
          width: 2,
          color: "#ffffff",
        },
      },

      // 可用字体
      availableFonts: [
        { name: "Arial", value: "Arial" },
        { name: "黑体", value: "SimHei" },
        { name: "宋体", value: "SimSun" },
        { name: "微软雅黑", value: "Microsoft YaHei" },
        { name: "Times New Roman", value: "Times New Roman" },
        { name: "Courier New", value: "Courier New" },
        { name: "Georgia", value: "Georgia" },
        { name: "Verdana", value: "Verdana" },
      ],

      // 字号选项
      fontSizes: [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72],

      // 交互状态
      isDragging: false,
      isRotating: false,
      isResizing: false,
      interactionStartX: 0,
      interactionStartY: 0,
      interactionStartRotation: 0,
      interactionStartScale: 1,
      interactionStartPosition: { x: 0, y: 0 },

      // 颜色选择器
      showColorPicker: false,
    };
  },

  computed: {
    textClasses() {
      return {
        [`variant-${this.variant}`]: true,
        disabled: this.disabled,
      };
    },

    // 当前活动文本
    activeText() {
      return (
        this.textElements.find((text) => text.id === this.activeTextId) || null
      );
    },
  },

  watch: {
    initialTextElements: {
      immediate: true,
      deep: true,
      handler(newElements) {
        this.textElements = [...newElements];
      },
    },

    textElements: {
      deep: true,
      handler(newElements) {
        this.$emit("text-elements-change", newElements);
      },
    },

    activeText: {
      immediate: true,
      handler(newText) {
        if (newText) {
          this.selectedFont = newText.fontFamily || "Arial";
          this.fontSize = newText.fontSize || 24;
          this.textColor = newText.color || "#000000";
          this.textAlign = newText.textAlign || "left";
          this.textStyle = {
            bold: newText.fontWeight === "bold",
            italic: newText.fontStyle === "italic",
            underline: newText.textDecoration === "underline",
          };
          this.textEffects = newText.effects || {
            shadow: { enabled: false, blur: 4, color: "#000000" },
            stroke: { enabled: false, width: 2, color: "#ffffff" },
          };
        }
      },
    },
  },

  mounted() {
    // 监听全局鼠标和触摸事件
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd);
    document.addEventListener("click", this.handleDocumentClick);
  },

  beforeDestroy() {
    // 移除事件监听器
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);
    document.removeEventListener("click", this.handleDocumentClick);
  },

  methods: {
    /**
     * 处理添加文本
     */
    async handleAddText() {
      if (this.disabled || !this.adapter) return;

      try {
        const newText = {
          id: `text-${Date.now()}`,
          content: "双击编辑文本",
          x: 100,
          y: 100,
          fontFamily: this.selectedFont,
          fontSize: this.fontSize,
          color: this.textColor,
          textAlign: this.textAlign,
          fontWeight: this.textStyle.bold ? "bold" : "normal",
          fontStyle: this.textStyle.italic ? "italic" : "normal",
          textDecoration: this.textStyle.underline ? "underline" : "none",
          rotation: 0,
          scale: 1,
          effects: {
            shadow: { ...this.textEffects.shadow },
            stroke: { ...this.textEffects.stroke },
          },
        };

        // 调用适配器添加文本
        const adapterId = await this._addTextToAdapter(newText);
        if (adapterId) {
          newText.adapterId = adapterId;
        }

        this.textElements.push(newText);
        this.activeTextId = newText.id;

        this.$emit("text-add", newText);
      } catch (error) {
        console.error("Failed to add text:", error);
        this.$emit("error", {
          type: "text-add-failed",
          message: "添加文本失败",
          error,
        });
      }
    },

    /**
     * 处理删除文本
     */
    async handleDeleteText() {
      if (this.disabled || !this.activeText || !this.adapter) return;

      try {
        const index = this.textElements.findIndex(
          (text) => text.id === this.activeTextId
        );
        if (index !== -1) {
          const deletedText = this.textElements[index];

          // 从适配器中删除文本
          if (deletedText.adapterId) {
            await this._removeTextFromAdapter(deletedText);
          }

          this.textElements.splice(index, 1);
          this.activeTextId = "";

          this.$emit("text-delete", deletedText);
        }
      } catch (error) {
        console.error("Failed to delete text:", error);
        this.$emit("error", {
          type: "text-delete-failed",
          message: "删除文本失败",
          error,
        });
      }
    },

    /**
     * 处理文本点击
     */
    handleTextClick(text) {
      if (this.disabled) return;

      this.activeTextId = text.id;
      this.$emit("text-select", text);
    },

    /**
     * 处理文本双击
     */
    handleTextDoubleClick(text) {
      if (this.disabled) return;

      this.editingTextId = text.id;
      this.editingContent = text.content;

      this.$nextTick(() => {
        if (this.$refs.textEditor && this.$refs.textEditor[0]) {
          this.$refs.textEditor[0].focus();
          this.$refs.textEditor[0].select();
        }
      });
    },

    /**
     * 处理文本编辑完成
     */
    async handleTextEditComplete() {
      if (this.editingTextId && this.editingContent.trim()) {
        const text = this.textElements.find((t) => t.id === this.editingTextId);
        if (text) {
          text.content = this.editingContent.trim();

          // 同步到适配器
          try {
            await this._updateTextInAdapter(text);
            this.$emit("text-content-change", text);
          } catch (error) {
            console.error("Failed to update text content:", error);
            this.$emit("error", {
              type: "text-update-failed",
              message: "更新文本内容失败",
              error,
            });
          }
        }
      }

      this.editingTextId = "";
      this.editingContent = "";
    },

    /**
     * 处理文本编辑取消
     */
    handleTextEditCancel() {
      this.editingTextId = "";
      this.editingContent = "";
    },

    /**
     * 处理容器点击
     */
    handleContainerClick() {
      if (this.disabled) return;

      // 点击空白区域取消选择
      this.activeTextId = "";
      this.showColorPicker = false;
    },

    /**
     * 处理文档点击
     */
    handleDocumentClick(event) {
      // 关闭颜色选择器
      if (
        this.showColorPicker &&
        !event.target.closest(".color-picker-container")
      ) {
        this.showColorPicker = false;
      }
    },

    /**
     * 处理字体变化
     */
    async handleFontChange() {
      if (!this.activeText) return;

      this.activeText.fontFamily = this.selectedFont;

      try {
        await this._updateTextInAdapter(this.activeText);
        this.$emit("text-style-change", this.activeText);
      } catch (error) {
        console.error("Failed to update font:", error);
        this.$emit("error", {
          type: "text-style-update-failed",
          message: "更新字体失败",
          error,
        });
      }
    },

    /**
     * 处理字号变化
     */
    async handleFontSizeChange() {
      if (!this.activeText) return;

      this.activeText.fontSize = this.fontSize;

      try {
        await this._updateTextInAdapter(this.activeText);
        this.$emit("text-style-change", this.activeText);
      } catch (error) {
        console.error("Failed to update font size:", error);
        this.$emit("error", {
          type: "text-style-update-failed",
          message: "更新字号失败",
          error,
        });
      }
    },

    /**
     * 切换文本样式
     */
    toggleStyle(style) {
      if (!this.activeText) return;

      this.textStyle[style] = !this.textStyle[style];

      switch (style) {
        case "bold":
          this.activeText.fontWeight = this.textStyle.bold ? "bold" : "normal";
          break;
        case "italic":
          this.activeText.fontStyle = this.textStyle.italic
            ? "italic"
            : "normal";
          break;
        case "underline":
          this.activeText.textDecoration = this.textStyle.underline
            ? "underline"
            : "none";
          break;
      }

      this.$emit("text-style-change", this.activeText);
    },

    /**
     * 设置文本对齐
     */
    setTextAlign(align) {
      if (!this.activeText) return;

      this.textAlign = align;
      this.activeText.textAlign = align;

      this.$emit("text-style-change", this.activeText);
    },

    /**
     * 切换颜色选择器
     */
    toggleColorPicker() {
      this.showColorPicker = !this.showColorPicker;
    },

    /**
     * 处理颜色变化
     */
    handleColorChange(color) {
      if (!this.activeText) return;

      this.textColor = color;
      this.activeText.color = color;

      this.$emit("text-style-change", this.activeText);
    },

    /**
     * 处理效果变化
     */
    handleEffectChange() {
      if (!this.activeText) return;

      this.activeText.effects = {
        shadow: { ...this.textEffects.shadow },
        stroke: { ...this.textEffects.stroke },
      };

      this.$emit("text-effects-change", this.activeText);
    },

    /**
     * 处理文本鼠标按下
     */
    handleTextMouseDown(text, event) {
      if (this.disabled) return;

      this.activeTextId = text.id;

      this.isDragging = true;
      this.interactionStartX = event.clientX;
      this.interactionStartY = event.clientY;
      this.interactionStartPosition = { x: text.x, y: text.y };

      event.preventDefault();
    },

    /**
     * 处理文本触摸开始
     */
    handleTextTouchStart(text, event) {
      if (this.disabled) return;

      this.activeTextId = text.id;

      const touch = event.touches[0];
      this.isDragging = true;
      this.interactionStartX = touch.clientX;
      this.interactionStartY = touch.clientY;
      this.interactionStartPosition = { x: text.x, y: text.y };

      event.preventDefault();
    },

    /**
     * 处理旋转开始
     */
    handleRotateStart(event) {
      if (this.disabled || !this.activeText) return;

      this.isRotating = true;

      const clientX =
        event.clientX || (event.touches && event.touches[0].clientX);
      const clientY =
        event.clientY || (event.touches && event.touches[0].clientY);

      this.interactionStartX = clientX;
      this.interactionStartY = clientY;
      this.interactionStartRotation = this.activeText.rotation || 0;

      event.preventDefault();
    },

    /**
     * 处理调整大小开始
     */
    handleResizeStart(event) {
      if (this.disabled || !this.activeText) return;

      this.isResizing = true;

      const clientX =
        event.clientX || (event.touches && event.touches[0].clientX);
      const clientY =
        event.clientY || (event.touches && event.touches[0].clientY);

      this.interactionStartX = clientX;
      this.interactionStartY = clientY;
      this.interactionStartScale = this.activeText.scale || 1;

      event.preventDefault();
    },

    /**
     * 处理鼠标移动
     */
    handleMouseMove(event) {
      if (this.disabled) return;

      if (this.isDragging && !this.isRotating && !this.isResizing) {
        this.handleDrag(event.clientX, event.clientY);
      } else if (this.isRotating) {
        this.handleRotate(event.clientX, event.clientY);
      } else if (this.isResizing) {
        this.handleResize(event.clientX, event.clientY);
      }
    },

    /**
     * 处理触摸移动
     */
    handleTouchMove(event) {
      if (this.disabled) return;

      const touch = event.touches[0];

      if (this.isDragging && !this.isRotating && !this.isResizing) {
        this.handleDrag(touch.clientX, touch.clientY);
      } else if (this.isRotating) {
        this.handleRotate(touch.clientX, touch.clientY);
      } else if (this.isResizing) {
        this.handleResize(touch.clientX, touch.clientY);
      }

      event.preventDefault();
    },

    /**
     * 处理拖拽
     */
    handleDrag(clientX, clientY) {
      if (!this.activeText) return;

      const deltaX = clientX - this.interactionStartX;
      const deltaY = clientY - this.interactionStartY;

      this.activeText.x = this.interactionStartPosition.x + deltaX;
      this.activeText.y = this.interactionStartPosition.y + deltaY;

      this.$emit("text-move", this.activeText);
    },

    /**
     * 处理旋转
     */
    handleRotate(clientX, clientY) {
      if (!this.activeText) return;

      // 计算文本元素中心点
      const rect = this.$refs.editorContainer.getBoundingClientRect();
      const centerX = rect.left + this.activeText.x;
      const centerY = rect.top + this.activeText.y;

      // 计算起始角度和当前角度
      const startAngle = Math.atan2(
        this.interactionStartY - centerY,
        this.interactionStartX - centerX
      );

      const currentAngle = Math.atan2(clientY - centerY, clientX - centerX);

      // 计算角度差（弧度）
      let angleDiff = currentAngle - startAngle;

      // 转换为度数
      angleDiff = angleDiff * (180 / Math.PI);

      // 更新旋转角度
      this.activeText.rotation = this.interactionStartRotation + angleDiff;

      this.$emit("text-rotate", this.activeText);
    },

    /**
     * 处理调整大小
     */
    handleResize(clientX, clientY) {
      if (!this.activeText) return;

      // 计算距离变化
      const startDistance = Math.sqrt(
        Math.pow(this.interactionStartX - this.activeText.x, 2) +
          Math.pow(this.interactionStartY - this.activeText.y, 2)
      );

      const currentDistance = Math.sqrt(
        Math.pow(clientX - this.activeText.x, 2) +
          Math.pow(clientY - this.activeText.y, 2)
      );

      // 计算缩放比例
      const scaleRatio = currentDistance / startDistance;

      // 更新缩放
      this.activeText.scale = this.interactionStartScale * scaleRatio;

      // 限制最小和最大缩放
      if (this.activeText.scale < 0.2) this.activeText.scale = 0.2;
      if (this.activeText.scale > 5) this.activeText.scale = 5;

      this.$emit("text-resize", this.activeText);
    },

    /**
     * 处理鼠标松开
     */
    handleMouseUp() {
      this.isDragging = false;
      this.isRotating = false;
      this.isResizing = false;
    },

    /**
     * 处理触摸结束
     */
    handleTouchEnd() {
      this.isDragging = false;
      this.isRotating = false;
      this.isResizing = false;
    },

    /**
     * 获取文本元素样式
     */
    getTextElementStyle(text) {
      const style = {
        left: `${text.x}px`,
        top: `${text.y}px`,
        fontFamily: text.fontFamily || "Arial",
        fontSize: `${text.fontSize || 24}px`,
        color: text.color || "#000000",
        textAlign: text.textAlign || "left",
        fontWeight: text.fontWeight || "normal",
        fontStyle: text.fontStyle || "normal",
        textDecoration: text.textDecoration || "none",
        transform: `rotate(${text.rotation || 0}deg) scale(${text.scale || 1})`,
      };

      // 添加文本阴影
      if (text.effects && text.effects.shadow && text.effects.shadow.enabled) {
        style.textShadow = `0 0 ${text.effects.shadow.blur}px ${text.effects.shadow.color}`;
      }

      // 添加文本描边
      if (text.effects && text.effects.stroke && text.effects.stroke.enabled) {
        style.WebkitTextStroke = `${text.effects.stroke.width}px ${text.effects.stroke.color}`;
        style.textStroke = `${text.effects.stroke.width}px ${text.effects.stroke.color}`;
      }

      return style;
    },

    /**
     * 获取文本编辑器样式
     */
    getTextEditorStyle(text) {
      return {
        fontFamily: text.fontFamily || "Arial",
        fontSize: `${text.fontSize || 24}px`,
        color: text.color || "#000000",
        textAlign: text.textAlign || "left",
        fontWeight: text.fontWeight || "normal",
        fontStyle: text.fontStyle || "normal",
        textDecoration: text.textDecoration || "none",
      };
    },

    /**
     * 格式化文本内容
     */
    formatTextContent(content) {
      if (!content) return "";

      // 将换行符转换为<br>标签
      return content.replace(/\n/g, "<br>");
    },

    // ========== 适配器集成方法 ==========

    /**
     * 添加文本到适配器
     * @param {Object} textData - 文本数据
     * @returns {Promise<string>} 适配器中的文本ID
     */
    async _addTextToAdapter(textData) {
      if (!this.adapter || typeof this.adapter.addText !== "function") {
        console.warn("Adapter does not support addText method");
        return null;
      }

      try {
        // 根据适配器类型调整参数
        const adapterOptions = this._convertToAdapterFormat(textData);

        // 调用适配器添加文本
        const result = await this.adapter.addText(
          textData.content,
          textData.x,
          textData.y,
          adapterOptions
        );

        return result;
      } catch (error) {
        console.error("Failed to add text to adapter:", error);
        throw error;
      }
    },

    /**
     * 从适配器中移除文本
     * @param {Object} textData - 文本数据
     * @returns {Promise<void>}
     */
    async _removeTextFromAdapter(textData) {
      if (!this.adapter || !textData.adapterId) {
        return;
      }

      try {
        // 根据适配器类型选择删除方法
        if (typeof this.adapter.removeText === "function") {
          await this.adapter.removeText(textData.adapterId);
        } else if (typeof this.adapter.removeObject === "function") {
          await this.adapter.removeObject(textData.adapterId);
        } else if (typeof this.adapter.deleteObject === "function") {
          await this.adapter.deleteObject(textData.adapterId);
        } else {
          console.warn("Adapter does not support text removal");
        }
      } catch (error) {
        console.error("Failed to remove text from adapter:", error);
        throw error;
      }
    },

    /**
     * 更新适配器中的文本
     * @param {Object} textData - 文本数据
     * @returns {Promise<void>}
     */
    async _updateTextInAdapter(textData) {
      if (!this.adapter || !textData.adapterId) {
        return;
      }

      try {
        const adapterOptions = this._convertToAdapterFormat(textData);

        // 根据适配器类型选择更新方法
        if (typeof this.adapter.updateText === "function") {
          await this.adapter.updateText(textData.adapterId, adapterOptions);
        } else if (typeof this.adapter.updateObject === "function") {
          await this.adapter.updateObject(textData.adapterId, adapterOptions);
        } else {
          // 如果没有更新方法，先删除再添加
          await this._removeTextFromAdapter(textData);
          const newId = await this._addTextToAdapter(textData);
          textData.adapterId = newId;
        }
      } catch (error) {
        console.error("Failed to update text in adapter:", error);
        throw error;
      }
    },

    /**
     * 转换为适配器格式
     * @param {Object} textData - 文本数据
     * @returns {Object} 适配器格式的选项
     */
    _convertToAdapterFormat(textData) {
      const baseOptions = {
        fontFamily: textData.fontFamily,
        fontSize: textData.fontSize,
        fill: textData.color,
        textAlign: textData.textAlign,
        fontWeight: textData.fontWeight,
        fontStyle: textData.fontStyle,
        textDecoration: textData.textDecoration,
      };

      // 根据适配器类型调整格式
      switch (this.adapterType) {
        case "fabric":
          return {
            ...baseOptions,
            left: textData.x,
            top: textData.y,
            angle: textData.rotation || 0,
            scaleX: textData.scale || 1,
            scaleY: textData.scale || 1,
            shadow: textData.effects?.shadow?.enabled
              ? {
                  color: textData.effects.shadow.color,
                  blur: textData.effects.shadow.blur,
                  offsetX: textData.effects.shadow.offsetX || 2,
                  offsetY: textData.effects.shadow.offsetY || 2,
                }
              : null,
            stroke: textData.effects?.stroke?.enabled
              ? textData.effects.stroke.color
              : null,
            strokeWidth: textData.effects?.stroke?.enabled
              ? textData.effects.stroke.width
              : 0,
          };

        case "konva":
          return {
            ...baseOptions,
            x: textData.x,
            y: textData.y,
            rotation: textData.rotation || 0,
            scaleX: textData.scale || 1,
            scaleY: textData.scale || 1,
            shadowColor: textData.effects?.shadow?.enabled
              ? textData.effects.shadow.color
              : null,
            shadowBlur: textData.effects?.shadow?.enabled
              ? textData.effects.shadow.blur
              : 0,
            shadowOffsetX: textData.effects?.shadow?.enabled
              ? textData.effects.shadow.offsetX || 2
              : 0,
            shadowOffsetY: textData.effects?.shadow?.enabled
              ? textData.effects.shadow.offsetY || 2
              : 0,
            stroke: textData.effects?.stroke?.enabled
              ? textData.effects.stroke.color
              : null,
            strokeWidth: textData.effects?.stroke?.enabled
              ? textData.effects.stroke.width
              : 0,
          };

        case "tui":
          return {
            styles: {
              ...baseOptions,
              textShadow: textData.effects?.shadow?.enabled
                ? `${textData.effects.shadow.offsetX || 2}px ${
                    textData.effects.shadow.offsetY || 2
                  }px ${textData.effects.shadow.blur}px ${
                    textData.effects.shadow.color
                  }`
                : "none",
            },
            position: { x: textData.x, y: textData.y },
          };

        default:
          return baseOptions;
      }
    },
  },
};
</script>

<style scoped>
.text-tool {
  width: 100%;
  height: 100%;
  background-color: var(--text-bg-color, #f5f5f5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 变体样式 */
.text-tool.variant-default {
  --text-bg-color: #f5f5f5;
  --text-border-color: #ddd;
  --text-toolbar-bg: #fff;
  --text-text-color: #333;
  --text-button-bg: #1890ff;
  --text-button-hover: #40a9ff;
  --text-active-color: #1890ff;
  --text-editor-bg: #fff;
}

.text-tool.variant-minimal {
  --text-bg-color: transparent;
  --text-border-color: #ddd;
  --text-toolbar-bg: rgba(255, 255, 255, 0.9);
  --text-text-color: #333;
  --text-button-bg: #1890ff;
  --text-button-hover: #40a9ff;
  --text-active-color: #1890ff;
  --text-editor-bg: rgba(255, 255, 255, 0.9);
}

.text-tool.variant-compact {
  --text-bg-color: #f0f0f0;
  --text-border-color: #ccc;
  --text-toolbar-bg: #f8f8f8;
  --text-text-color: #333;
  --text-button-bg: #1890ff;
  --text-button-hover: #40a9ff;
  --text-active-color: #1890ff;
  --text-editor-bg: #f8f8f8;
}

/* 工具栏 */
.text-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--text-toolbar-bg);
  border-bottom: 1px solid var(--text-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-text-color);
}

/* 字体选择器 */
.font-selector select,
.font-size-selector select {
  padding: 4px 8px;
  border: 1px solid var(--text-border-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--text-text-color);
  background-color: white;
}

.font-selector select {
  min-width: 120px;
}

.font-size-selector select {
  min-width: 80px;
}

/* 文本样式控制 */
.text-style-controls,
.text-align-controls {
  display: flex;
  border: 1px solid var(--text-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.style-button,
.align-button {
  padding: 6px 8px;
  background-color: white;
  border: none;
  border-right: 1px solid var(--text-border-color);
  color: var(--text-text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.style-button:last-child,
.align-button:last-child {
  border-right: none;
}

.style-button:hover,
.align-button:hover {
  background-color: #f0f0f0;
}

.style-button.active,
.align-button.active {
  background-color: var(--text-active-color);
  color: white;
}

.style-button:disabled,
.align-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 颜色选择器 */
.color-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.color-selector label {
  font-size: 14px;
  color: var(--text-text-color);
}

.color-preview {
  width: 24px;
  height: 24px;
  border: 1px solid var(--text-border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-preview:hover {
  transform: scale(1.1);
}

.color-picker-container {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  margin-top: 4px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.add-button,
.delete-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.add-button {
  background-color: var(--text-button-bg);
  color: white;
}

.add-button:hover:not(:disabled) {
  background-color: var(--text-button-hover);
}

.delete-button {
  background-color: #ff4d4f;
  color: white;
}

.delete-button:hover:not(:disabled) {
  background-color: #ff7875;
}

.add-button:disabled,
.delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 编辑器容器 */
.text-editor-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: var(--text-editor-bg);
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

/* 文本元素 */
.text-element {
  position: absolute;
  cursor: move;
  user-select: none;
  min-width: 20px;
  min-height: 20px;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.text-element.active {
  border-color: var(--text-active-color);
}

.text-content {
  white-space: pre-wrap;
  word-break: break-word;
  pointer-events: none;
}

/* 文本编辑器 */
.text-editor {
  width: 100%;
  min-height: 30px;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  overflow: hidden;
}

/* 变换控制 */
.transform-controls {
  position: absolute;
  top: -30px;
  right: -30px;
  display: flex;
  gap: 4px;
}

.rotate-handle,
.resize-handle {
  width: 24px;
  height: 24px;
  background-color: var(--text-active-color);
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.rotate-handle:hover,
.resize-handle:hover {
  transform: scale(1.1);
}

.rotate-handle {
  cursor: grab;
}

.resize-handle {
  cursor: nw-resize;
}

/* 空状态 */
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-text-color);
}

.empty-state i {
  font-size: 48px;
  opacity: 0.3;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.add-text-button {
  padding: 8px 16px;
  background-color: var(--text-button-bg);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.add-text-button:hover {
  background-color: var(--text-button-hover);
}

/* 文本效果面板 */
.text-effects-panel {
  background-color: var(--text-toolbar-bg);
  border-top: 1px solid var(--text-border-color);
  padding: 16px;
  flex-shrink: 0;
}

.effects-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-text-color);
}

.effect-group {
  margin-bottom: 16px;
}

.effect-group:last-child {
  margin-bottom: 0;
}

.effect-header {
  margin-bottom: 8px;
}

.effect-header label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-text-color);
  cursor: pointer;
}

.effect-controls {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.effect-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.effect-control label {
  min-width: 50px;
  font-size: 12px;
  color: var(--text-text-color);
}

.effect-control input[type="range"] {
  flex: 1;
  height: 4px;
  background: var(--text-border-color);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.effect-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background-color: var(--text-active-color);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.effect-control input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background-color: var(--text-active-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.effect-control input[type="color"] {
  width: 32px;
  height: 24px;
  border: 1px solid var(--text-border-color);
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

.effect-control span {
  min-width: 40px;
  font-size: 12px;
  color: var(--text-text-color);
  text-align: right;
}

/* 禁用状态 */
.text-tool.disabled {
  opacity: 0.7;
  pointer-events: none;
}

/* 图标样式 */
.icon-bold::before {
  content: "B";
  font-weight: bold;
}
.icon-italic::before {
  content: "I";
  font-style: italic;
}
.icon-underline::before {
  content: "U";
  text-decoration: underline;
}
.icon-align-left::before {
  content: "≡";
}
.icon-align-center::before {
  content: "≣";
}
.icon-align-right::before {
  content: "≡";
  transform: scaleX(-1);
}
.icon-add::before {
  content: "+";
  font-size: 16px;
  font-weight: bold;
}
.icon-delete::before {
  content: "✕";
  font-size: 14px;
}
.icon-text::before {
  content: "T";
  font-size: 24px;
  font-weight: bold;
}
.icon-rotate::before {
  content: "↻";
  font-size: 12px;
}
.icon-resize::before {
  content: "⤢";
  font-size: 12px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .text-toolbar {
    padding: 8px 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-section {
    justify-content: center;
    flex-wrap: wrap;
  }

  .font-selector select,
  .font-size-selector select {
    min-width: auto;
    width: 100px;
  }

  .action-buttons {
    justify-content: center;
  }

  .add-button,
  .delete-button {
    padding: 8px 16px;
    font-size: 16px;
  }

  .transform-controls {
    top: -35px;
    right: -35px;
  }

  .rotate-handle,
  .resize-handle {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .text-effects-panel {
    padding: 12px;
  }

  .effect-controls {
    padding-left: 16px;
  }
}

/* 触摸设备优化 */
@media (hover: none) {
  .text-element {
    border-width: 3px;
  }

  .transform-controls {
    top: -40px;
    right: -40px;
  }

  .rotate-handle,
  .resize-handle {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}
</style>
