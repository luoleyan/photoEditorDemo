<template>
  <div class="export-panel" :class="exportClasses">
    <!-- 面板头部 -->
    <div class="panel-header" v-if="showHeader">
      <h3 class="panel-title">{{ title }}</h3>
      <div class="panel-actions">
        <button
          class="export-button"
          @click="handleExport"
          :disabled="disabled || isExporting"
        >
          <i class="icon-export"></i>
          <span>{{ isExporting ? "导出中..." : "导出" }}</span>
        </button>
      </div>
    </div>

    <!-- 导出设置 -->
    <div class="export-settings">
      <!-- 格式选择 -->
      <div class="setting-section">
        <h4 class="section-title">导出格式</h4>
        <div class="format-selector">
          <div
            v-for="format in availableFormats"
            :key="format.type"
            class="format-option"
            :class="{ active: selectedFormat === format.type }"
            @click="selectFormat(format.type)"
          >
            <div class="format-icon">
              <i :class="`icon-format-${format.type}`"></i>
            </div>
            <div class="format-info">
              <div class="format-name">{{ format.name }}</div>
              <div class="format-description">{{ format.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 尺寸设置 -->
      <div class="setting-section">
        <h4 class="section-title">尺寸设置</h4>

        <div class="size-controls">
          <!-- 预设尺寸 -->
          <div class="preset-sizes">
            <label>预设尺寸:</label>
            <select
              v-model="selectedSizePreset"
              @change="handleSizePresetChange"
              :disabled="disabled"
            >
              <option value="custom">自定义</option>
              <option
                v-for="preset in sizePresets"
                :key="preset.name"
                :value="preset.name"
              >
                {{ preset.name }} ({{ preset.width }}×{{ preset.height }})
              </option>
            </select>
          </div>

          <!-- 自定义尺寸 -->
          <div class="custom-size" v-if="selectedSizePreset === 'custom'">
            <div class="size-input-group">
              <label>宽度:</label>
              <input
                type="number"
                v-model.number="customWidth"
                min="1"
                max="10000"
                :disabled="disabled"
              />
              <span>px</span>
            </div>

            <div class="size-input-group">
              <label>高度:</label>
              <input
                type="number"
                v-model.number="customHeight"
                min="1"
                max="10000"
                :disabled="disabled"
              />
              <span>px</span>
            </div>

            <button
              class="aspect-ratio-button"
              :class="{ active: maintainAspectRatio }"
              @click="toggleAspectRatio"
              :disabled="disabled"
              title="保持宽高比"
            >
              <i class="icon-aspect-ratio"></i>
            </button>
          </div>

          <!-- DPI设置 -->
          <div class="dpi-control">
            <label>分辨率 (DPI):</label>
            <select v-model.number="dpi" :disabled="disabled">
              <option value="72">72 DPI (屏幕)</option>
              <option value="150">150 DPI (高质量)</option>
              <option value="300">300 DPI (印刷)</option>
              <option value="600">600 DPI (超高质量)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 质量设置 -->
      <div class="setting-section" v-if="showQualitySettings">
        <h4 class="section-title">质量设置</h4>

        <div class="quality-controls">
          <!-- JPEG质量 -->
          <div class="quality-control" v-if="selectedFormat === 'jpeg'">
            <label>JPEG质量:</label>
            <input
              type="range"
              v-model.number="jpegQuality"
              min="1"
              max="100"
              step="1"
              :disabled="disabled"
            />
            <span class="quality-value">{{ jpegQuality }}%</span>
          </div>

          <!-- PNG压缩 -->
          <div class="quality-control" v-if="selectedFormat === 'png'">
            <label>PNG压缩:</label>
            <select v-model.number="pngCompression" :disabled="disabled">
              <option value="0">无压缩</option>
              <option value="1">最快</option>
              <option value="6">平衡</option>
              <option value="9">最小文件</option>
            </select>
          </div>

          <!-- WebP质量 -->
          <div class="quality-control" v-if="selectedFormat === 'webp'">
            <label>WebP质量:</label>
            <input
              type="range"
              v-model.number="webpQuality"
              min="1"
              max="100"
              step="1"
              :disabled="disabled"
            />
            <span class="quality-value">{{ webpQuality }}%</span>
          </div>
        </div>
      </div>

      <!-- 颜色设置 -->
      <div class="setting-section" v-if="showColorSettings">
        <h4 class="section-title">颜色设置</h4>

        <div class="color-controls">
          <!-- 色彩空间 -->
          <div class="color-control">
            <label>色彩空间:</label>
            <select v-model="colorSpace" :disabled="disabled">
              <option value="srgb">sRGB</option>
              <option value="adobe-rgb">Adobe RGB</option>
              <option value="p3">Display P3</option>
              <option value="rec2020">Rec. 2020</option>
            </select>
          </div>

          <!-- 背景颜色 -->
          <div class="color-control">
            <label>背景颜色:</label>
            <div class="background-options">
              <button
                class="bg-option"
                :class="{ active: backgroundColor === 'transparent' }"
                @click="setBackgroundColor('transparent')"
                :disabled="disabled || !supportsTransparency"
              >
                透明
              </button>
              <button
                class="bg-option"
                :class="{ active: backgroundColor === 'white' }"
                @click="setBackgroundColor('white')"
                :disabled="disabled"
              >
                白色
              </button>
              <button
                class="bg-option"
                :class="{ active: backgroundColor === 'black' }"
                @click="setBackgroundColor('black')"
                :disabled="disabled"
              >
                黑色
              </button>
              <div
                class="bg-option custom-color"
                :class="{ active: backgroundColor === 'custom' }"
                @click="setBackgroundColor('custom')"
              >
                <div
                  class="color-preview"
                  :style="{ backgroundColor: customBackgroundColor }"
                ></div>
                <span>自定义</span>
              </div>
            </div>

            <div
              v-if="backgroundColor === 'custom'"
              class="custom-color-picker"
            >
              <color-picker
                v-model="customBackgroundColor"
                @change="handleCustomBackgroundChange"
                :disabled="disabled"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 批量导出设置 -->
      <div class="setting-section" v-if="showBatchSettings">
        <h4 class="section-title">批量导出</h4>

        <div class="batch-controls">
          <div class="batch-option">
            <label>
              <input
                type="checkbox"
                v-model="enableBatchExport"
                :disabled="disabled"
              />
              启用批量导出
            </label>
          </div>

          <div v-if="enableBatchExport" class="batch-settings">
            <div class="batch-formats">
              <label>导出格式:</label>
              <div class="format-checkboxes">
                <label
                  v-for="format in availableFormats"
                  :key="format.type"
                  class="format-checkbox"
                >
                  <input
                    type="checkbox"
                    :value="format.type"
                    v-model="batchFormats"
                    :disabled="disabled"
                  />
                  {{ format.name }}
                </label>
              </div>
            </div>

            <div class="batch-sizes">
              <label>导出尺寸:</label>
              <div class="size-checkboxes">
                <label
                  v-for="preset in sizePresets"
                  :key="preset.name"
                  class="size-checkbox"
                >
                  <input
                    type="checkbox"
                    :value="preset.name"
                    v-model="batchSizes"
                    :disabled="disabled"
                  />
                  {{ preset.name }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出预览 -->
    <div v-if="showPreview" class="export-preview">
      <h4 class="preview-title">导出预览</h4>

      <div class="preview-container">
        <canvas
          ref="previewCanvas"
          class="preview-canvas"
          :width="previewWidth"
          :height="previewHeight"
        ></canvas>

        <div class="preview-info">
          <p><strong>格式:</strong> {{ getCurrentFormatName() }}</p>
          <p><strong>尺寸:</strong> {{ finalWidth }} × {{ finalHeight }}px</p>
          <p><strong>文件大小:</strong> {{ estimatedFileSize }}</p>
          <p v-if="selectedFormat !== 'svg'"><strong>DPI:</strong> {{ dpi }}</p>
        </div>
      </div>
    </div>

    <!-- 导出进度 -->
    <div v-if="isExporting" class="export-progress">
      <div class="progress-header">
        <h4>导出进度</h4>
        <span class="progress-percentage"
          >{{ Math.round(exportProgress) }}%</span
        >
      </div>

      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: exportProgress + '%' }"
        ></div>
      </div>

      <div class="progress-info">
        <p>{{ exportStatusText }}</p>
        <p v-if="enableBatchExport">
          {{ currentExportIndex + 1 }} / {{ totalExports }}
        </p>
      </div>

      <button
        class="cancel-button"
        @click="cancelExport"
        :disabled="!canCancelExport"
      >
        取消导出
      </button>
    </div>

    <!-- 导出结果 -->
    <div v-if="exportResults.length > 0" class="export-results">
      <h4 class="results-title">导出完成</h4>

      <div class="results-list">
        <div
          v-for="(result, index) in exportResults"
          :key="index"
          class="result-item"
          :class="{ error: result.error }"
        >
          <div class="result-info">
            <div class="result-name">{{ result.filename }}</div>
            <div class="result-details">
              {{ result.format }} • {{ result.size }} • {{ result.fileSize }}
            </div>
            <div v-if="result.error" class="result-error">
              错误: {{ result.error }}
            </div>
          </div>

          <div class="result-actions" v-if="!result.error">
            <button class="download-button" @click="downloadFile(result)">
              <i class="icon-download"></i>
              下载
            </button>
          </div>
        </div>
      </div>

      <div class="results-actions">
        <button
          class="download-all-button"
          @click="downloadAllFiles"
          :disabled="!hasSuccessfulExports"
        >
          <i class="icon-download-all"></i>
          下载全部
        </button>

        <button class="clear-results-button" @click="clearResults">
          <i class="icon-clear"></i>
          清空结果
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ColorPicker from "./ColorPicker.vue";

export default {
  name: "ExportPanel",
  components: {
    ColorPicker,
  },

  props: {
    // 面板标题
    title: {
      type: String,
      default: "导出设置",
    },

    // 源画布或图像数据
    sourceCanvas: {
      type: HTMLCanvasElement,
      default: null,
    },
    sourceImageData: {
      type: String,
      default: "",
    },

    // 显示选项
    showHeader: {
      type: Boolean,
      default: true,
    },
    showPreview: {
      type: Boolean,
      default: true,
    },
    showQualitySettings: {
      type: Boolean,
      default: true,
    },
    showColorSettings: {
      type: Boolean,
      default: true,
    },
    showBatchSettings: {
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
      validator: (value) => ["default", "minimal", "compact"].includes(value),
    },
  },

  data() {
    return {
      // 导出格式
      selectedFormat: "png",
      availableFormats: [
        {
          type: "png",
          name: "PNG",
          description: "无损压缩，支持透明",
          supportsTransparency: true,
          supportsQuality: false,
        },
        {
          type: "jpeg",
          name: "JPEG",
          description: "有损压缩，文件较小",
          supportsTransparency: false,
          supportsQuality: true,
        },
        {
          type: "webp",
          name: "WebP",
          description: "现代格式，高压缩比",
          supportsTransparency: true,
          supportsQuality: true,
        },
        {
          type: "svg",
          name: "SVG",
          description: "矢量格式，可缩放",
          supportsTransparency: true,
          supportsQuality: false,
        },
        {
          type: "pdf",
          name: "PDF",
          description: "文档格式，可打印",
          supportsTransparency: true,
          supportsQuality: false,
        },
      ],

      // 尺寸设置
      selectedSizePreset: "original",
      customWidth: 800,
      customHeight: 600,
      maintainAspectRatio: true,
      originalAspectRatio: 1,
      dpi: 72,

      // 尺寸预设
      sizePresets: [
        { name: "original", width: 0, height: 0, description: "原始尺寸" },
        { name: "thumbnail", width: 150, height: 150, description: "缩略图" },
        { name: "small", width: 400, height: 300, description: "小尺寸" },
        { name: "medium", width: 800, height: 600, description: "中等尺寸" },
        { name: "large", width: 1200, height: 900, description: "大尺寸" },
        { name: "hd", width: 1920, height: 1080, description: "HD (1080p)" },
        { name: "4k", width: 3840, height: 2160, description: "4K" },
        {
          name: "square-small",
          width: 400,
          height: 400,
          description: "小正方形",
        },
        {
          name: "square-medium",
          width: 800,
          height: 800,
          description: "中正方形",
        },
        {
          name: "square-large",
          width: 1200,
          height: 1200,
          description: "大正方形",
        },
      ],

      // 质量设置
      jpegQuality: 90,
      pngCompression: 6,
      webpQuality: 80,

      // 颜色设置
      colorSpace: "srgb",
      backgroundColor: "transparent",
      customBackgroundColor: "#ffffff",

      // 批量导出设置
      enableBatchExport: false,
      batchFormats: ["png"],
      batchSizes: ["medium"],

      // 导出状态
      isExporting: false,
      exportProgress: 0,
      exportStatusText: "",
      currentExportIndex: 0,
      totalExports: 0,
      canCancelExport: true,
      exportCancelled: false,

      // 导出结果
      exportResults: [],

      // 预览
      previewWidth: 200,
      previewHeight: 150,
    };
  },

  computed: {
    exportClasses() {
      return {
        [`variant-${this.variant}`]: true,
        disabled: this.disabled,
        exporting: this.isExporting,
      };
    },

    // 当前格式信息
    currentFormat() {
      return (
        this.availableFormats.find((f) => f.type === this.selectedFormat) ||
        this.availableFormats[0]
      );
    },

    // 是否支持透明度
    supportsTransparency() {
      return this.currentFormat.supportsTransparency;
    },

    // 最终导出尺寸
    finalWidth() {
      if (this.selectedSizePreset === "custom") {
        return this.customWidth;
      } else if (this.selectedSizePreset === "original") {
        return this.getOriginalWidth();
      } else {
        const preset = this.sizePresets.find(
          (p) => p.name === this.selectedSizePreset
        );
        return preset ? preset.width : this.getOriginalWidth();
      }
    },

    finalHeight() {
      if (this.selectedSizePreset === "custom") {
        return this.customHeight;
      } else if (this.selectedSizePreset === "original") {
        return this.getOriginalHeight();
      } else {
        const preset = this.sizePresets.find(
          (p) => p.name === this.selectedSizePreset
        );
        return preset ? preset.height : this.getOriginalHeight();
      }
    },

    // 估算文件大小
    estimatedFileSize() {
      const pixels = this.finalWidth * this.finalHeight;
      let bytesPerPixel = 4; // RGBA

      switch (this.selectedFormat) {
        case "jpeg":
          bytesPerPixel = 3 * (this.jpegQuality / 100);
          break;
        case "png":
          bytesPerPixel = 4 * (1 - this.pngCompression / 10);
          break;
        case "webp":
          bytesPerPixel = 3 * (this.webpQuality / 100);
          break;
        case "svg":
          return "< 1 MB";
        case "pdf":
          return "< 5 MB";
      }

      const bytes = pixels * bytesPerPixel;
      return this.formatFileSize(bytes);
    },

    // 是否有成功的导出
    hasSuccessfulExports() {
      return this.exportResults.some((result) => !result.error);
    },
  },

  watch: {
    // 监听自定义尺寸变化，保持宽高比
    customWidth(newWidth) {
      if (this.maintainAspectRatio && this.originalAspectRatio) {
        this.customHeight = Math.round(newWidth / this.originalAspectRatio);
      }
    },

    customHeight(newHeight) {
      if (this.maintainAspectRatio && this.originalAspectRatio) {
        this.customWidth = Math.round(newHeight * this.originalAspectRatio);
      }
    },

    // 监听源数据变化，更新预览
    sourceCanvas() {
      this.updatePreview();
      this.updateOriginalSize();
    },

    sourceImageData() {
      this.updatePreview();
      this.updateOriginalSize();
    },

    // 监听设置变化，更新预览
    selectedFormat() {
      this.updatePreview();
    },

    finalWidth() {
      this.updatePreview();
    },

    finalHeight() {
      this.updatePreview();
    },

    backgroundColor() {
      this.updatePreview();
    },

    customBackgroundColor() {
      if (this.backgroundColor === "custom") {
        this.updatePreview();
      }
    },
  },

  mounted() {
    this.updateOriginalSize();
    this.updatePreview();
  },

  methods: {
    /**
     * 选择导出格式
     */
    selectFormat(format) {
      if (this.disabled) return;

      this.selectedFormat = format;

      // 如果格式不支持透明度，设置背景为白色
      if (
        !this.supportsTransparency &&
        this.backgroundColor === "transparent"
      ) {
        this.backgroundColor = "white";
      }
    },

    /**
     * 处理尺寸预设变化
     */
    handleSizePresetChange() {
      if (this.selectedSizePreset !== "custom") {
        const preset = this.sizePresets.find(
          (p) => p.name === this.selectedSizePreset
        );
        if (preset && preset.width > 0 && preset.height > 0) {
          this.customWidth = preset.width;
          this.customHeight = preset.height;
        } else if (this.selectedSizePreset === "original") {
          this.customWidth = this.getOriginalWidth();
          this.customHeight = this.getOriginalHeight();
        }
      }
    },

    /**
     * 切换宽高比锁定
     */
    toggleAspectRatio() {
      if (this.disabled) return;

      this.maintainAspectRatio = !this.maintainAspectRatio;

      if (this.maintainAspectRatio) {
        this.originalAspectRatio = this.customWidth / this.customHeight;
      }
    },

    /**
     * 设置背景颜色
     */
    setBackgroundColor(color) {
      if (this.disabled) return;

      this.backgroundColor = color;
    },

    /**
     * 处理自定义背景颜色变化
     */
    handleCustomBackgroundChange(color) {
      this.customBackgroundColor = color;
    },

    /**
     * 获取原始宽度
     */
    getOriginalWidth() {
      if (this.sourceCanvas) {
        return this.sourceCanvas.width;
      } else if (this.sourceImageData) {
        // 从图像数据中获取尺寸（需要实际实现）
        return 800; // 默认值
      }
      return 800;
    },

    /**
     * 获取原始高度
     */
    getOriginalHeight() {
      if (this.sourceCanvas) {
        return this.sourceCanvas.height;
      } else if (this.sourceImageData) {
        // 从图像数据中获取尺寸（需要实际实现）
        return 600; // 默认值
      }
      return 600;
    },

    /**
     * 更新原始尺寸
     */
    updateOriginalSize() {
      const width = this.getOriginalWidth();
      const height = this.getOriginalHeight();

      this.originalAspectRatio = width / height;

      // 更新原始尺寸预设
      const originalPreset = this.sizePresets.find(
        (p) => p.name === "original"
      );
      if (originalPreset) {
        originalPreset.width = width;
        originalPreset.height = height;
        originalPreset.description = `原始尺寸 (${width}×${height})`;
      }

      // 如果当前选择的是原始尺寸，更新自定义尺寸
      if (this.selectedSizePreset === "original") {
        this.customWidth = width;
        this.customHeight = height;
      }
    },

    /**
     * 更新预览
     */
    updatePreview() {
      if (!this.showPreview || !this.$refs.previewCanvas) return;

      const canvas = this.$refs.previewCanvas;
      const ctx = canvas.getContext("2d");

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 设置背景
      this.drawBackground(ctx, canvas.width, canvas.height);

      // 绘制内容
      if (this.sourceCanvas) {
        this.drawCanvasContent(ctx, canvas.width, canvas.height);
      } else if (this.sourceImageData) {
        this.drawImageContent(ctx, canvas.width, canvas.height);
      }
    },

    /**
     * 绘制背景
     */
    drawBackground(ctx, width, height) {
      switch (this.backgroundColor) {
        case "transparent":
          // 绘制透明背景棋盘格
          this.drawCheckerboard(ctx, width, height);
          break;
        case "white":
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          break;
        case "black":
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, width, height);
          break;
        case "custom":
          ctx.fillStyle = this.customBackgroundColor;
          ctx.fillRect(0, 0, width, height);
          break;
      }
    },

    /**
     * 绘制透明背景棋盘格
     */
    drawCheckerboard(ctx, width, height) {
      const tileSize = 10;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#eeeeee";
      for (let y = 0; y < height; y += tileSize) {
        for (let x = 0; x < width; x += tileSize) {
          if ((x / tileSize + y / tileSize) % 2 === 0) {
            ctx.fillRect(x, y, tileSize, tileSize);
          }
        }
      }
    },

    /**
     * 绘制画布内容
     */
    drawCanvasContent(ctx, width, height) {
      if (!this.sourceCanvas) return;

      // 计算缩放比例
      const sourceWidth = this.sourceCanvas.width;
      const sourceHeight = this.sourceCanvas.height;

      const scale = Math.min(width / sourceWidth, height / sourceHeight);

      const scaledWidth = sourceWidth * scale;
      const scaledHeight = sourceHeight * scale;

      const x = (width - scaledWidth) / 2;
      const y = (height - scaledHeight) / 2;

      // 绘制内容
      ctx.drawImage(
        this.sourceCanvas,
        0,
        0,
        sourceWidth,
        sourceHeight,
        x,
        y,
        scaledWidth,
        scaledHeight
      );
    },

    /**
     * 绘制图像内容
     */
    drawImageContent(ctx, width, height) {
      if (!this.sourceImageData) return;

      // 创建临时图像
      const img = new Image();
      img.onload = () => {
        // 计算缩放比例
        const sourceWidth = img.width;
        const sourceHeight = img.height;

        const scale = Math.min(width / sourceWidth, height / sourceHeight);

        const scaledWidth = sourceWidth * scale;
        const scaledHeight = sourceHeight * scale;

        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;

        // 绘制内容
        ctx.drawImage(
          img,
          0,
          0,
          sourceWidth,
          sourceHeight,
          x,
          y,
          scaledWidth,
          scaledHeight
        );
      };
      img.src = this.sourceImageData;
    },

    /**
     * 处理导出
     */
    handleExport() {
      if (this.disabled || this.isExporting) return;

      this.isExporting = true;
      this.exportProgress = 0;
      this.exportStatusText = "准备导出...";
      this.exportCancelled = false;

      // 确定导出任务
      let exportTasks = [];

      if (this.enableBatchExport) {
        // 批量导出
        for (const format of this.batchFormats) {
          for (const size of this.batchSizes) {
            exportTasks.push({
              format,
              size,
              filename: this.generateFilename(format, size),
            });
          }
        }
      } else {
        // 单个导出
        exportTasks.push({
          format: this.selectedFormat,
          size: this.selectedSizePreset,
          filename: this.generateFilename(
            this.selectedFormat,
            this.selectedSizePreset
          ),
        });
      }

      this.totalExports = exportTasks.length;
      this.currentExportIndex = 0;

      // 开始导出
      this.processExportTasks(exportTasks);
    },

    /**
     * 处理导出任务
     */
    processExportTasks(tasks) {
      if (tasks.length === 0 || this.exportCancelled) {
        this.finishExport();
        return;
      }

      const task = tasks.shift();
      this.currentExportIndex = this.totalExports - tasks.length - 1;
      this.exportProgress = (this.currentExportIndex / this.totalExports) * 100;
      this.exportStatusText = `导出 ${task.filename}...`;

      // 执行导出
      setTimeout(() => {
        this.exportFile(task)
          .then((result) => {
            this.exportResults.push(result);
            this.processExportTasks(tasks);
          })
          .catch((error) => {
            this.exportResults.push({
              ...task,
              error: error.message || "导出失败",
            });
            this.processExportTasks(tasks);
          });
      }, 500); // 模拟导出延迟
    },

    /**
     * 导出文件
     */
    async exportFile(task) {
      // 这里是实际导出逻辑
      // 在实际应用中，这里应该调用适当的导出函数

      // 模拟导出过程
      return new Promise((resolve) => {
        setTimeout(() => {
          // 获取尺寸
          let width, height;
          if (task.size === "custom") {
            width = this.customWidth;
            height = this.customHeight;
          } else if (task.size === "original") {
            width = this.getOriginalWidth();
            height = this.getOriginalHeight();
          } else {
            const preset = this.sizePresets.find((p) => p.name === task.size);
            width = preset ? preset.width : this.getOriginalWidth();
            height = preset ? preset.height : this.getOriginalHeight();
          }

          // 模拟文件大小
          const fileSize = this.formatFileSize(width * height * 4);

          resolve({
            ...task,
            size: `${width}×${height}`,
            fileSize,
            dataUrl:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          });
        }, 1000);
      });
    },

    /**
     * 完成导出
     */
    finishExport() {
      this.isExporting = false;
      this.exportProgress = 100;
      this.exportStatusText = "导出完成";

      this.$emit("export-complete", this.exportResults);
    },

    /**
     * 取消导出
     */
    cancelExport() {
      if (!this.canCancelExport) return;

      this.exportCancelled = true;
      this.exportStatusText = "取消导出...";

      this.$emit("export-cancel");
    },

    /**
     * 下载文件
     */
    downloadFile(result) {
      if (!result.dataUrl) return;

      // 创建下载链接
      const link = document.createElement("a");
      link.href = result.dataUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.$emit("file-download", result);
    },

    /**
     * 下载所有文件
     */
    downloadAllFiles() {
      const successfulExports = this.exportResults.filter(
        (result) => !result.error
      );

      for (const result of successfulExports) {
        this.downloadFile(result);
      }

      this.$emit("all-files-download", successfulExports);
    },

    /**
     * 清空结果
     */
    clearResults() {
      this.exportResults = [];

      this.$emit("results-clear");
    },

    /**
     * 生成文件名
     */
    generateFilename(format, size) {
      const date = new Date();
      const timestamp = date
        .toISOString()
        .replace(/[-:.]/g, "")
        .substring(0, 15);

      let sizeSuffix = "";
      if (size !== "original") {
        const preset = this.sizePresets.find((p) => p.name === size);
        if (preset) {
          sizeSuffix = `_${preset.width}x${preset.height}`;
        }
      }

      return `export_${timestamp}${sizeSuffix}.${format}`;
    },

    /**
     * 获取当前格式名称
     */
    getCurrentFormatName() {
      const format = this.availableFormats.find(
        (f) => f.type === this.selectedFormat
      );
      return format ? format.name : "未知格式";
    },

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
      if (bytes < 1024) {
        return bytes + " B";
      } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
      } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
      } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
      }
    },
  },
};
</script>

<style scoped>
.export-panel {
  width: 100%;
  background-color: var(--export-bg-color, #f5f5f5);
  border-radius: 8px;
  overflow: hidden;
}

/* 变体样式 */
.export-panel.variant-default {
  --export-bg-color: #f5f5f5;
  --export-border-color: #ddd;
  --export-panel-bg: #fff;
  --export-text-color: #333;
  --export-button-bg: #1890ff;
  --export-button-hover: #40a9ff;
  --export-active-color: #1890ff;
  --export-success-color: #52c41a;
  --export-error-color: #ff4d4f;
  --export-warning-color: #faad14;
}

.export-panel.variant-minimal {
  --export-bg-color: transparent;
  --export-border-color: #ddd;
  --export-panel-bg: rgba(255, 255, 255, 0.9);
  --export-text-color: #333;
  --export-button-bg: #1890ff;
  --export-button-hover: #40a9ff;
  --export-active-color: #1890ff;
  --export-success-color: #52c41a;
  --export-error-color: #ff4d4f;
  --export-warning-color: #faad14;
}

.export-panel.variant-compact {
  --export-bg-color: #f0f0f0;
  --export-border-color: #ccc;
  --export-panel-bg: #f8f8f8;
  --export-text-color: #333;
  --export-button-bg: #1890ff;
  --export-button-hover: #40a9ff;
  --export-active-color: #1890ff;
  --export-success-color: #52c41a;
  --export-error-color: #ff4d4f;
  --export-warning-color: #faad14;
}

/* 面板头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--export-panel-bg);
  border-bottom: 1px solid var(--export-border-color);
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--export-text-color);
}

.panel-actions {
  display: flex;
  gap: 12px;
}

.export-button {
  padding: 8px 16px;
  background-color: var(--export-button-bg);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.export-button:hover:not(:disabled) {
  background-color: var(--export-button-hover);
}

.export-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 导出设置 */
.export-settings {
  padding: 20px;
  background-color: var(--export-panel-bg);
}

.setting-section {
  margin-bottom: 24px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--export-text-color);
}

/* 格式选择器 */
.format-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.format-option {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: white;
  border: 2px solid var(--export-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.format-option:hover {
  border-color: var(--export-active-color);
}

.format-option.active {
  border-color: var(--export-active-color);
  background-color: rgba(24, 144, 255, 0.05);
}

.format-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-right: 12px;
}

.format-info {
  flex: 1;
}

.format-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--export-text-color);
  margin-bottom: 4px;
}

.format-description {
  font-size: 12px;
  color: #666;
}

/* 尺寸控制 */
.size-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preset-sizes {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preset-sizes label {
  font-size: 14px;
  color: var(--export-text-color);
  white-space: nowrap;
}

.preset-sizes select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--export-border-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--export-text-color);
  background-color: white;
}

.custom-size {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.size-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.size-input-group label {
  font-size: 14px;
  color: var(--export-text-color);
}

.size-input-group input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid var(--export-border-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--export-text-color);
}

.size-input-group span {
  font-size: 14px;
  color: #666;
}

.aspect-ratio-button {
  width: 32px;
  height: 32px;
  background-color: white;
  border: 1px solid var(--export-border-color);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.aspect-ratio-button:hover:not(:disabled) {
  border-color: var(--export-active-color);
}

.aspect-ratio-button.active {
  background-color: var(--export-active-color);
  color: white;
  border-color: var(--export-active-color);
}

.aspect-ratio-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dpi-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dpi-control label {
  font-size: 14px;
  color: var(--export-text-color);
  white-space: nowrap;
}

.dpi-control select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--export-border-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--export-text-color);
  background-color: white;
}

/* 质量控制 */
.quality-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quality-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quality-control label {
  min-width: 80px;
  font-size: 14px;
  color: var(--export-text-color);
}

.quality-control input[type="range"] {
  flex: 1;
  height: 4px;
  background: var(--export-border-color);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.quality-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background-color: var(--export-active-color);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.quality-control input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background-color: var(--export-active-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.quality-value {
  min-width: 40px;
  font-size: 14px;
  color: var(--export-text-color);
  text-align: right;
}

.quality-control select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--export-border-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--export-text-color);
  background-color: white;
}

/* 颜色控制 */
.color-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.color-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-control label {
  font-size: 14px;
  color: var(--export-text-color);
}

.color-control select {
  padding: 6px 10px;
  border: 1px solid var(--export-border-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--export-text-color);
  background-color: white;
}

.background-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.bg-option {
  padding: 6px 12px;
  background-color: white;
  border: 1px solid var(--export-border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--export-text-color);
  transition: all 0.2s;
}

.bg-option:hover:not(:disabled) {
  border-color: var(--export-active-color);
}

.bg-option.active {
  border-color: var(--export-active-color);
  background-color: rgba(24, 144, 255, 0.1);
}

.bg-option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-color {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-preview {
  width: 16px;
  height: 16px;
  border: 1px solid var(--export-border-color);
  border-radius: 2px;
}

.custom-color-picker {
  margin-top: 8px;
}

/* 批量导出控制 */
.batch-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.batch-option label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--export-text-color);
  cursor: pointer;
}

.batch-settings {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.batch-formats,
.batch-sizes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.batch-formats label,
.batch-sizes label {
  font-size: 14px;
  color: var(--export-text-color);
  margin-bottom: 8px;
}

.format-checkboxes,
.size-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.format-checkbox,
.size-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--export-text-color);
  cursor: pointer;
}

/* 导出预览 */
.export-preview {
  padding: 20px;
  background-color: var(--export-panel-bg);
  border-top: 1px solid var(--export-border-color);
}

.preview-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--export-text-color);
}

.preview-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.preview-canvas {
  background-color: white;
  border: 1px solid var(--export-border-color);
  border-radius: 4px;
  max-width: 200px;
  max-height: 150px;
}

.preview-info {
  flex: 1;
}

.preview-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--export-text-color);
}

/* 导出进度 */
.export-progress {
  padding: 20px;
  background-color: var(--export-panel-bg);
  border-top: 1px solid var(--export-border-color);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--export-text-color);
}

.progress-percentage {
  font-size: 14px;
  font-weight: 500;
  color: var(--export-active-color);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background-color: var(--export-active-color);
  transition: width 0.3s ease;
}

.progress-info {
  margin-bottom: 16px;
}

.progress-info p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--export-text-color);
}

.cancel-button {
  padding: 6px 12px;
  background-color: var(--export-error-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.cancel-button:hover:not(:disabled) {
  background-color: #ff7875;
}

.cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 导出结果 */
.export-results {
  padding: 20px;
  background-color: var(--export-panel-bg);
  border-top: 1px solid var(--export-border-color);
}

.results-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--export-text-color);
}

.results-list {
  margin-bottom: 16px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: white;
  border: 1px solid var(--export-border-color);
  border-radius: 4px;
  margin-bottom: 8px;
}

.result-item.error {
  border-color: var(--export-error-color);
  background-color: rgba(255, 77, 79, 0.05);
}

.result-info {
  flex: 1;
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--export-text-color);
  margin-bottom: 4px;
}

.result-details {
  font-size: 12px;
  color: #666;
}

.result-error {
  font-size: 12px;
  color: var(--export-error-color);
  margin-top: 4px;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.download-button {
  padding: 4px 8px;
  background-color: var(--export-success-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.download-button:hover {
  background-color: #73d13d;
}

.results-actions {
  display: flex;
  gap: 12px;
}

.download-all-button,
.clear-results-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.download-all-button {
  background-color: var(--export-success-color);
  color: white;
}

.download-all-button:hover:not(:disabled) {
  background-color: #73d13d;
}

.download-all-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-results-button {
  background-color: #f5f5f5;
  color: var(--export-text-color);
  border: 1px solid var(--export-border-color);
}

.clear-results-button:hover {
  background-color: #e8e8e8;
}

/* 禁用状态 */
.export-panel.disabled {
  opacity: 0.7;
  pointer-events: none;
}

/* 导出中状态 */
.export-panel.exporting .export-settings {
  opacity: 0.5;
  pointer-events: none;
}

/* 图标样式 */
.icon-export::before {
  content: "📤";
  font-size: 16px;
}
.icon-format-png::before {
  content: "🖼️";
  font-size: 20px;
}
.icon-format-jpeg::before {
  content: "📷";
  font-size: 20px;
}
.icon-format-webp::before {
  content: "🌐";
  font-size: 20px;
}
.icon-format-svg::before {
  content: "📐";
  font-size: 20px;
}
.icon-format-pdf::before {
  content: "📄";
  font-size: 20px;
}
.icon-aspect-ratio::before {
  content: "🔗";
  font-size: 14px;
}
.icon-download::before {
  content: "⬇️";
  font-size: 12px;
}
.icon-download-all::before {
  content: "📦";
  font-size: 14px;
}
.icon-clear::before {
  content: "🗑️";
  font-size: 14px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .format-selector {
    grid-template-columns: 1fr;
  }

  .custom-size {
    flex-direction: column;
    align-items: stretch;
  }

  .size-input-group {
    justify-content: space-between;
  }

  .background-options {
    flex-direction: column;
  }

  .preview-container {
    flex-direction: column;
  }

  .preview-canvas {
    max-width: 100%;
  }

  .result-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .results-actions {
    flex-direction: column;
  }
}
</style>
