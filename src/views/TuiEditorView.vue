<template>
  <div class="tui-editor-view">
    <div class="editor-header">
      <h1>TUI Image Editor 演示</h1>
      <p>功能全面的图片编辑器，支持裁剪、旋转、滤镜、文本等多种功能</p>
    </div>

    <div class="editor-container">
      <div class="editor-wrapper">
        <div id="tui-image-editor" ref="tuiImageEditor"></div>
      </div>

      <div class="controls-panel">
        <h3>快速操作</h3>

        <div class="control-group">
          <h4>图片调节</h4>
          <div class="control-item">
            <label>亮度: {{ brightness }}</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              v-model="brightness"
              @input="applyBrightness"
            />
          </div>

          <div class="control-item">
            <label>对比度: {{ contrast }}</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              v-model="contrast"
              @input="applyContrast"
            />
          </div>
        </div>

        <div class="control-group">
          <h4>旋转操作</h4>
          <div class="button-group">
            <button @click="rotateLeft" class="btn btn-secondary">
              向左旋转90°
            </button>
            <button @click="rotateRight" class="btn btn-secondary">
              向右旋转90°
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>裁剪操作</h4>
          <div class="status-indicator" v-if="isCropping">
            <span class="status-text">🔄 裁剪模式已激活</span>
          </div>
          <div class="button-group">
            <button
              @click="startCrop"
              class="btn btn-primary"
              :disabled="isCropping"
            >
              开始裁剪
            </button>
            <button
              @click="applyCrop"
              class="btn btn-success"
              :disabled="!isCropping"
            >
              应用裁剪
            </button>
            <button
              @click="cancelCrop"
              class="btn btn-secondary"
              :disabled="!isCropping"
            >
              取消裁剪
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>文件操作</h4>
          <div class="button-group">
            <input
              type="file"
              ref="fileInput"
              @change="loadImage"
              accept="image/*"
              style="display: none"
            />
            <button @click="$refs.fileInput.click()" class="btn btn-primary">
              加载图片
            </button>
            <button @click="downloadImage" class="btn btn-success">
              下载图片
            </button>
            <button @click="resetImage" class="btn btn-secondary">重置</button>
          </div>
        </div>
      </div>
    </div>

    <div class="features-info">
      <h3>TUI Image Editor 特性</h3>
      <div class="features-grid">
        <div class="feature-item">
          <h4>✂️ 图片裁剪</h4>
          <p>支持自由裁剪和按比例裁剪，提供多种预设比例</p>
        </div>
        <div class="feature-item">
          <h4>🔄 图片旋转</h4>
          <p>支持任意角度旋转，包括90度快速旋转</p>
        </div>
        <div class="feature-item">
          <h4>🎨 滤镜效果</h4>
          <p>内置多种滤镜效果，支持亮度、对比度、饱和度调节</p>
        </div>
        <div class="feature-item">
          <h4>📝 文本添加</h4>
          <p>支持添加文本，可调整字体、大小、颜色等属性</p>
        </div>
        <div class="feature-item">
          <h4>🖼️ 形状绘制</h4>
          <p>支持绘制矩形、圆形、箭头等基本形状</p>
        </div>
        <div class="feature-item">
          <h4>📱 移动端支持</h4>
          <p>完美支持触摸操作，适配移动设备</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImageEditor from "tui-image-editor";
import "tui-image-editor/dist/tui-image-editor.css";
import tuiEditorErrorHandler from "@/utils/TuiEditorErrorHandler.js";
import tuiEditorMonkeyPatch from "@/utils/TuiEditorMonkeyPatch.js";

export default {
  name: "TuiEditorView",
  data() {
    return {
      imageEditor: null,
      brightness: 0,
      contrast: 0,
      isCropping: false,
      isImageLoaded: false,
      isMouseDown: false,
      isEditorReady: false,
    };
  },
  mounted() {
    this.initEditor();
    this.setupGlobalErrorHandler();
  },
  beforeDestroy() {
    this.removeGlobalErrorHandler();
    this.removePatchMonitoring();

    if (this.imageEditor) {
      // 移除monkey patches
      tuiEditorMonkeyPatch.removePatches(this.imageEditor);
      this.imageEditor.destroy();
    }
  },
  methods: {
    initEditor() {
      try {
        // 确保容器存在
        if (!this.$refs.tuiImageEditor) {
          console.error("TUI Image Editor 容器未找到");
          return;
        }

        // 先初始化编辑器，不加载图片
        this.imageEditor = new ImageEditor(this.$refs.tuiImageEditor, {
          includeUI: {
            theme: {
              "common.bi.image": "",
              "common.bisize.width": "0px",
              "common.bisize.height": "0px",
            },
            menu: [
              "crop",
              "flip",
              "rotate",
              "draw",
              "shape",
              "icon",
              "text",
              "filter",
            ],
            initMenu: "filter",
            uiSize: {
              width: "100%",
              height: "500px",
            },
            menuBarPosition: "bottom",
          },
          cssMaxWidth: 800,
          cssMaxHeight: 500,
          selectionStyle: {
            cornerSize: 20,
            rotatingPointOffset: 70,
          },
          // Canvas性能优化配置
          usageStatistics: false,
        });

        // 添加编辑器事件监听
        this.setupEditorEventListeners();

        // 尝试优化Canvas性能
        this.optimizeCanvasPerformance();

        // 应用Monkey Patch以防止null引用错误
        this.applyMonkeyPatches();

        console.log("TUI Image Editor 初始化完成");
        this.isEditorReady = true;

        // 延迟加载默认图片
        setTimeout(() => {
          this.loadDefaultImage();
        }, 500); // 增加延迟时间确保编辑器完全初始化
      } catch (error) {
        console.error("初始化TUI Image Editor失败:", error);
      }
    },

    setupEditorEventListeners() {
      if (!this.imageEditor) return;

      try {
        // 监听编辑器事件，防止在不安全状态下操作
        this.imageEditor.on("mousedown", () => {
          // 鼠标按下时暂停滤镜操作
          this.isMouseDown = true;
        });

        this.imageEditor.on("mouseup", () => {
          // 鼠标释放后恢复操作
          this.isMouseDown = false;
        });

        // 监听裁剪模式变化
        this.imageEditor.on("undoStackChanged", () => {
          // 检查当前模式状态
          this.checkEditorState();
        });

        // 添加错误监听器来捕获内部错误
        this.imageEditor.on("error", (error) => {
          console.error("TUI Image Editor 内部错误:", error);
          this.handleEditorError(error);
        });

        // 监听鼠标移动事件，在出现问题时提供额外保护
        this.imageEditor.on("mousemove", () => {
          // 检查编辑器内部状态是否健康
          this.validateEditorState();
        });
      } catch (error) {
        console.warn("设置编辑器事件监听失败:", error);
      }
    },

    checkEditorState() {
      if (!this.imageEditor) return;

      try {
        // 检查当前绘制模式
        const drawingMode = this.imageEditor.getDrawingMode();
        this.isCropping = drawingMode === "CROPPER";
      } catch (error) {
        console.warn("检查编辑器状态失败:", error);
      }
    },

    validateEditorState() {
      if (!this.imageEditor) return true;

      try {
        // 检查编辑器基本状态
        const canvasSize = this.imageEditor.getCanvasSize();

        // 检查编辑器内部关键对象是否存在
        const fabricCanvas = this.imageEditor._graphics?.getCanvas?.();

        // 如果关键对象缺失或状态异常，尝试恢复
        if (
          !canvasSize ||
          !fabricCanvas ||
          (canvasSize.width === 0 && canvasSize.height === 0)
        ) {
          console.warn("检测到编辑器内部状态异常，尝试恢复...");
          this.recoverEditorState();
          return false;
        }

        return true;
      } catch (error) {
        console.warn("验证编辑器状态时出错:", error);
        this.recoverEditorState();
        return false;
      }
    },

    validateCropperState() {
      if (!this.imageEditor) return false;

      try {
        // 检查基本状态
        if (!this.validateEditorState()) {
          return false;
        }

        // 检查Fabric.js canvas的关键对象
        const fabricCanvas = this.imageEditor._graphics?.getCanvas?.();
        if (!fabricCanvas) {
          console.warn("Fabric canvas不存在");
          return false;
        }

        // 检查Fabric canvas的关键属性和方法
        if (
          !fabricCanvas.getObjects ||
          !fabricCanvas.getActiveObject ||
          !fabricCanvas.on ||
          !fabricCanvas.off
        ) {
          console.warn("Fabric canvas缺少关键方法");
          return false;
        }

        // 检查cropper相关的内部对象
        const cropper = this.imageEditor._cropper;
        if (cropper) {
          // 如果cropper存在，检查其关键属性
          if (!cropper._canvas || !cropper._cropzone) {
            console.warn("Cropper内部对象状态异常");
            return false;
          }
        }

        // 检查鼠标事件处理器是否正常
        try {
          const hasMouseHandlers =
            fabricCanvas._hasMouseEventListeners !== false;
          if (!hasMouseHandlers) {
            console.warn("Fabric canvas鼠标事件处理器异常");
            return false;
          }
        } catch (e) {
          // 如果无法检查鼠标处理器，继续执行
        }

        return true;
      } catch (error) {
        console.warn("验证裁剪器状态失败:", error);
        return false;
      }
    },

    handleEditorError(error) {
      console.error("处理编辑器错误:", error);

      // 使用专门的错误处理器
      const handled = tuiEditorErrorHandler.handleError(
        error,
        this.imageEditor,
        {
          resetState: this.resetEditingState,
          enableMouseEvents: this.enableMouseEvents,
          validateEditorState: this.validateEditorState,
          clearHangingReferences: this.clearHangingReferences,
        }
      );

      if (!handled) {
        // 如果错误处理器无法处理，使用备用方案
        console.log("使用备用错误处理方案");
        this.recoverEditorState();
      }
    },

    recoverEditorState() {
      try {
        // 重置所有状态标志
        this.isCropping = false;
        this.isMouseDown = false;

        // 尝试停止所有绘制模式
        if (this.imageEditor) {
          try {
            this.imageEditor.stopDrawingMode();
          } catch (error) {
            console.warn("停止绘制模式失败:", error);
          }

          // 重新启用鼠标事件
          this.enableMouseEvents();
        }

        // 清理悬挂引用
        this.clearHangingReferences();

        console.log("编辑器状态恢复完成");
      } catch (error) {
        console.error("恢复编辑器状态失败:", error);
      }
    },

    clearHangingReferences() {
      try {
        // 清理可能的悬挂引用和事件监听器
        if (this.imageEditor && this.imageEditor._graphics) {
          const canvas = this.imageEditor._graphics.getCanvas();
          if (canvas) {
            // 清理fabric.js的事件监听器
            canvas.off("mouse:move");
            canvas.off("mouse:down");
            canvas.off("mouse:up");
          }
        }

        // 强制垃圾回收（如果可用）
        if (window.gc) {
          window.gc();
        }

        console.log("悬挂引用清理完成");
      } catch (error) {
        console.warn("清理悬挂引用失败:", error);
      }
    },

    async repairCropperState() {
      console.log("开始修复裁剪器状态...");

      try {
        // 1. 强制停止所有绘制模式
        await this.safeStopDrawingMode();

        // 2. 清理悬挂引用
        this.clearHangingReferences();

        // 3. 重新初始化Fabric canvas的关键属性
        if (this.imageEditor && this.imageEditor._graphics) {
          const canvas = this.imageEditor._graphics.getCanvas();
          if (canvas) {
            // 确保canvas有正确的事件处理器
            if (!canvas._hasMouseEventListeners) {
              canvas._hasMouseEventListeners = true;
            }

            // 重新设置canvas的基本属性
            canvas.selection = true;
            canvas.interactive = true;

            // 确保canvas渲染正常
            canvas.requestRenderAll();
          }
        }

        // 4. 等待状态稳定
        await new Promise((resolve) => setTimeout(resolve, 200));

        console.log("裁剪器状态修复完成");
      } catch (error) {
        console.error("修复裁剪器状态失败:", error);
      }
    },

    async preinitializeCropper() {
      console.log("预初始化裁剪器...");

      try {
        if (this.imageEditor && this.imageEditor._graphics) {
          const canvas = this.imageEditor._graphics.getCanvas();
          if (canvas) {
            // 预设置canvas状态以防止null引用
            canvas.defaultCursor = "default";
            canvas.hoverCursor = "move";
            canvas.moveCursor = "move";

            // 确保canvas对象池正常
            if (!canvas._objects) {
              canvas._objects = [];
            }

            // 预创建一个临时对象来初始化内部状态
            if (window.fabric && window.fabric.Rect) {
              const tempRect = new window.fabric.Rect({
                left: -1000,
                top: -1000,
                width: 1,
                height: 1,
                visible: false,
                selectable: false,
                evented: false,
              });

              canvas.add(tempRect);
              canvas.remove(tempRect);
            }

            // 强制渲染一次
            canvas.requestRenderAll();
          }
        }

        console.log("裁剪器预初始化完成");
      } catch (error) {
        console.warn("预初始化裁剪器失败:", error);
      }
    },

    optimizeCanvasPerformance() {
      // 尝试优化Canvas性能，设置willReadFrequently属性
      this.$nextTick(() => {
        try {
          const canvasElements =
            this.$refs.tuiImageEditor.querySelectorAll("canvas");
          canvasElements.forEach((canvas) => {
            const context = canvas.getContext("2d");
            if (context && !context.willReadFrequently) {
              // 创建新的context with willReadFrequently
              try {
                const newContext = canvas.getContext("2d", {
                  willReadFrequently: true,
                });
                if (newContext) {
                  console.log("Canvas性能优化已应用");
                }
              } catch (error) {
                console.warn("无法应用Canvas性能优化:", error);
              }
            }
          });
        } catch (error) {
          console.warn("Canvas性能优化失败:", error);
        }
      });
    },

    applyMonkeyPatches() {
      try {
        console.log("开始应用TUI Image Editor Monkey Patches...");

        // 应用补丁
        tuiEditorMonkeyPatch.applyPatches(this.imageEditor);

        // 设置定期检查补丁状态
        this.setupPatchMonitoring();

        console.log("Monkey Patches应用完成");
      } catch (error) {
        console.error("应用Monkey Patches失败:", error);
      }
    },

    setupPatchMonitoring() {
      // 每5秒检查一次补丁状态
      this.patchMonitorInterval = setInterval(() => {
        try {
          if (this.imageEditor && this.isEditorReady) {
            tuiEditorMonkeyPatch.checkAndReapplyPatches(this.imageEditor);
          }
        } catch (error) {
          console.warn("补丁监控检查失败:", error);
        }
      }, 5000);
    },

    removePatchMonitoring() {
      if (this.patchMonitorInterval) {
        clearInterval(this.patchMonitorInterval);
        this.patchMonitorInterval = null;
      }
    },

    loadDefaultImage() {
      if (!this.imageEditor) {
        console.error("图片编辑器未初始化");
        return;
      }

      try {
        const imagePath = require("@/assets/illust_104350264_20230531_093134.png");

        // 预加载图片以确保它存在
        const img = new Image();
        img.onload = () => {
          // 图片加载成功后再加载到编辑器
          this.imageEditor
            .loadImageFromURL(imagePath, "SampleImage")
            .then(() => {
              console.log("默认图片加载成功");
              this.isImageLoaded = true;
              this.isEditorReady = true;
              this.resetEditingState();

              // 等待编辑器完全稳定
              setTimeout(() => {
                this.checkEditorState();
              }, 200);
            })
            .catch((error) => {
              console.error("编辑器加载图片失败:", error);
              this.isImageLoaded = false;
              this.isEditorReady = false;
            });
        };
        img.onerror = (error) => {
          console.error("图片预加载失败:", error);
          this.isImageLoaded = false;
        };
        img.src = imagePath;
      } catch (error) {
        console.error("加载默认图片时出错:", error);
        this.isImageLoaded = false;
      }
    },

    resetEditingState() {
      this.isCropping = false;
      this.brightness = 0;
      this.contrast = 0;
    },

    applyBrightness() {
      // 使用安全包装器
      const safeApply = tuiEditorErrorHandler.createSafeOperation(
        this.safeApplyFilterSync,
        this.imageEditor,
        this
      );

      if (this.canApplyFilterSync()) {
        safeApply("brightness", {
          brightness: parseFloat(this.brightness),
        });
      }
    },

    applyContrast() {
      // 使用安全包装器
      const safeApply = tuiEditorErrorHandler.createSafeOperation(
        this.safeApplyFilterSync,
        this.imageEditor,
        this
      );

      if (this.canApplyFilterSync()) {
        safeApply("contrast", {
          contrast: parseFloat(this.contrast),
        });
      }
    },

    canApplyFilterSync() {
      // 检查编辑器状态
      if (!this.imageEditor || !this.isImageLoaded || !this.isEditorReady) {
        console.warn("图片编辑器未准备好或图片未加载");
        return false;
      }

      // 检查鼠标状态
      if (this.isMouseDown) {
        console.warn("鼠标操作进行中，跳过滤镜应用");
        return false;
      }

      // 验证编辑器内部状态
      if (!this.validateEditorState()) {
        console.warn("编辑器内部状态异常，跳过滤镜应用");
        return false;
      }

      // 如果在裁剪模式，先退出
      if (this.isCropping) {
        console.log("退出裁剪模式以应用滤镜");
        this.safeCancelCropSync();
        return false; // 下次再试
      }

      return true;
    },

    safeApplyFilterSync(filterType, options) {
      try {
        // 暂时禁用鼠标事件
        this.disableMouseEvents();

        // 应用滤镜
        setTimeout(() => {
          try {
            if (
              this.imageEditor &&
              this.isImageLoaded &&
              this.validateEditorState()
            ) {
              // 在应用滤镜前再次验证状态
              const currentMode = this.imageEditor.getDrawingMode();
              if (currentMode && currentMode !== "NORMAL") {
                console.warn(`当前模式为${currentMode}，先切换到正常模式`);
                this.imageEditor.stopDrawingMode();
                this.isCropping = false;
              }

              this.imageEditor.applyFilter(filterType, options);
              console.log(`${filterType}滤镜应用成功`);
            } else {
              console.warn("编辑器状态不适合应用滤镜");
            }
          } catch (error) {
            console.error(`应用${filterType}滤镜失败:`, error);
            this.handleFilterError(error);

            // 如果是null引用错误，尝试恢复
            if (error.message && error.message.includes("null")) {
              this.recoverEditorState();
            }
          } finally {
            // 重新启用鼠标事件
            setTimeout(() => {
              this.enableMouseEvents();
            }, 100);
          }
        }, 50);
      } catch (error) {
        console.error(`应用${filterType}滤镜失败:`, error);
        this.handleFilterError(error);
        this.enableMouseEvents();
      }
    },

    disableMouseEvents() {
      try {
        // 方法1: 禁用DOM层面的鼠标事件
        const canvas = this.$refs.tuiImageEditor?.querySelector("canvas");
        if (canvas) {
          canvas.style.pointerEvents = "none";
        }

        // 方法2: 禁用Fabric.js层面的鼠标事件
        if (this.imageEditor && this.imageEditor._graphics) {
          const fabricCanvas = this.imageEditor._graphics.getCanvas();
          if (fabricCanvas) {
            // 保存当前状态
            this._savedCanvasState = {
              selection: fabricCanvas.selection,
              interactive: fabricCanvas.interactive,
              evented: fabricCanvas.evented,
            };

            fabricCanvas.selection = false;
            fabricCanvas.interactive = false;
            fabricCanvas.evented = false;

            // 临时禁用鼠标事件处理器以防止null引用
            this._tempDisableMouseHandlers(fabricCanvas);
          }
        }
      } catch (error) {
        console.warn("禁用鼠标事件失败:", error);
      }
    },

    enableMouseEvents() {
      try {
        // 方法1: 启用DOM层面的鼠标事件
        const canvas = this.$refs.tuiImageEditor?.querySelector("canvas");
        if (canvas) {
          canvas.style.pointerEvents = "auto";
        }

        // 方法2: 启用Fabric.js层面的鼠标事件
        if (this.imageEditor && this.imageEditor._graphics) {
          const fabricCanvas = this.imageEditor._graphics.getCanvas();
          if (fabricCanvas) {
            // 恢复保存的状态
            if (this._savedCanvasState) {
              fabricCanvas.selection = this._savedCanvasState.selection;
              fabricCanvas.interactive = this._savedCanvasState.interactive;
              fabricCanvas.evented = this._savedCanvasState.evented;
            } else {
              fabricCanvas.selection = true;
              fabricCanvas.interactive = true;
              fabricCanvas.evented = true;
            }

            // 重新启用鼠标事件处理器
            this._tempEnableMouseHandlers(fabricCanvas);
          }
        }
      } catch (error) {
        console.warn("启用鼠标事件失败:", error);
      }
    },

    _tempDisableMouseHandlers(canvas) {
      try {
        // 临时保存并用安全函数替换鼠标事件处理器
        this._savedMouseHandlers = {
          onMouseMove: canvas.__onMouseMove,
          onMouseDown: canvas.__onMouseDown,
          onMouseUp: canvas.__onMouseUp,
        };

        // 用安全的空函数替换，防止null引用错误
        canvas.__onMouseMove = function (e) {
          // 安全的空实现，防止null引用
          try {
            if (e && e.e) {
              e.e.preventDefault && e.e.preventDefault();
            }
          } catch (err) {
            // 忽略错误
          }
        };
        canvas.__onMouseDown = function (e) {
          try {
            if (e && e.e) {
              e.e.preventDefault && e.e.preventDefault();
            }
          } catch (err) {
            // 忽略错误
          }
        };
        canvas.__onMouseUp = function (e) {
          try {
            if (e && e.e) {
              e.e.preventDefault && e.e.preventDefault();
            }
          } catch (err) {
            // 忽略错误
          }
        };
      } catch (error) {
        console.warn("临时禁用鼠标处理器失败:", error);
      }
    },

    _tempEnableMouseHandlers(canvas) {
      try {
        // 恢复原始的鼠标事件处理器
        if (this._savedMouseHandlers) {
          if (this._savedMouseHandlers.onMouseMove) {
            canvas.__onMouseMove = this._savedMouseHandlers.onMouseMove;
          }
          if (this._savedMouseHandlers.onMouseDown) {
            canvas.__onMouseDown = this._savedMouseHandlers.onMouseDown;
          }
          if (this._savedMouseHandlers.onMouseUp) {
            canvas.__onMouseUp = this._savedMouseHandlers.onMouseUp;
          }
        }
      } catch (error) {
        console.warn("恢复鼠标处理器失败:", error);
      }
    },

    safeCancelCropSync() {
      if (!this.imageEditor) return;

      try {
        this.imageEditor.stopDrawingMode();
        this.isCropping = false;
        console.log("裁剪模式已同步取消");
      } catch (error) {
        console.error("同步取消裁剪模式失败:", error);
        this.isCropping = false;
      }
    },

    handleFilterError(error) {
      console.error("滤镜错误处理:", error);

      // 尝试重置编辑器状态
      try {
        if (this.imageEditor) {
          this.imageEditor.stopDrawingMode();
        }
        this.resetEditingState();
      } catch (resetError) {
        console.error("重置编辑器状态失败:", resetError);
      }
    },

    rotateLeft() {
      if (this.imageEditor) {
        this.imageEditor.rotate(-90);
      }
    },

    rotateRight() {
      if (this.imageEditor) {
        this.imageEditor.rotate(90);
      }
    },

    async startCrop() {
      if (!this.imageEditor || !this.isImageLoaded || !this.isEditorReady) {
        console.warn("图片编辑器未准备好或图片未加载");
        return;
      }

      if (this.isCropping) {
        console.warn("已在裁剪模式中");
        return;
      }

      // 强化的裁剪器状态验证
      if (!this.validateCropperState()) {
        console.warn("裁剪器状态验证失败，尝试修复后重试");
        await this.repairCropperState();

        // 修复后再次验证
        if (!this.validateCropperState()) {
          console.error("无法修复裁剪器状态，取消启动裁剪模式");
          return;
        }
      }

      try {
        // 禁用鼠标事件防止冲突
        this.disableMouseEvents();

        // 确保退出其他模式
        await this.safeStopDrawingMode();

        // 等待状态稳定
        await new Promise((resolve) => setTimeout(resolve, 150));

        // 预初始化裁剪器内部状态
        await this.preinitializeCropper();

        // 重新应用monkey patches确保在裁剪模式下生效
        tuiEditorMonkeyPatch.checkAndReapplyPatches(this.imageEditor);

        // 最终验证状态
        if (!this.validateCropperState()) {
          throw new Error("裁剪器状态在准备过程中变为异常");
        }

        // 启动裁剪模式
        this.imageEditor.startDrawingMode("CROPPER");
        this.isCropping = true;
        console.log("裁剪模式已启动");

        // 启动后再次确保补丁生效
        setTimeout(() => {
          tuiEditorMonkeyPatch.checkAndReapplyPatches(this.imageEditor);
        }, 100);

        // 延迟启用鼠标事件，确保裁剪器完全初始化
        setTimeout(() => {
          this.enableMouseEvents();
        }, 300);
      } catch (error) {
        console.error("启动裁剪模式失败:", error);
        this.isCropping = false;
        this.enableMouseEvents();
        this.recoverEditorState();
      }
    },

    async applyCrop() {
      if (!this.imageEditor || !this.isImageLoaded || !this.isCropping) {
        console.warn("无法应用裁剪：编辑器未准备好或未在裁剪模式");
        return;
      }

      try {
        console.log("开始应用裁剪...");

        // 禁用鼠标事件
        this.disableMouseEvents();

        // 确保monkey patches在裁剪应用前生效
        tuiEditorMonkeyPatch.checkAndReapplyPatches(this.imageEditor);

        // 验证编辑器状态
        if (!this.validateCropperState()) {
          throw new Error("裁剪器状态验证失败");
        }

        // 安全地获取裁剪区域
        let cropRect;
        try {
          cropRect = this.imageEditor.getCropzoneRect();
        } catch (getRectError) {
          console.error("获取裁剪区域失败:", getRectError);
          throw new Error("无法获取裁剪区域");
        }

        // 验证裁剪区域
        if (!cropRect || typeof cropRect !== "object") {
          throw new Error("裁剪区域无效");
        }

        if (
          typeof cropRect.width !== "number" ||
          typeof cropRect.height !== "number" ||
          typeof cropRect.left !== "number" ||
          typeof cropRect.top !== "number"
        ) {
          throw new Error("裁剪区域参数无效");
        }

        if (cropRect.width <= 0 || cropRect.height <= 0) {
          throw new Error("裁剪区域尺寸无效");
        }

        console.log("裁剪区域验证通过:", cropRect);

        // 预检查Graphics对象
        if (
          !this.imageEditor._graphics ||
          !this.imageEditor._graphics.getCroppedImageData
        ) {
          throw new Error("Graphics对象不可用");
        }

        // 预检查Canvas对象
        const fabricCanvas = this.imageEditor._graphics.getCanvas();
        if (!fabricCanvas) {
          throw new Error("Fabric Canvas不可用");
        }

        // 检查Canvas中的对象
        const objects = fabricCanvas.getObjects();
        if (objects && Array.isArray(objects)) {
          // 确保所有对象都有有效的_set属性
          objects.forEach((obj) => {
            if (obj && obj.set && !obj._set) {
              obj._set = obj.set;
              console.log("修复对象_set属性");
            }
          });
        }

        // 应用裁剪
        await new Promise((resolve, reject) => {
          try {
            console.log("调用imageEditor.crop方法...");

            // 使用setTimeout确保所有状态都已稳定
            setTimeout(() => {
              try {
                this.imageEditor.crop(cropRect);
                console.log("裁剪操作完成");
                setTimeout(resolve, 200); // 给裁剪操作更多时间
              } catch (cropError) {
                console.error("裁剪操作失败:", cropError);
                reject(cropError);
              }
            }, 50);
          } catch (error) {
            reject(error);
          }
        });

        this.isCropping = false;
        console.log("裁剪已成功应用");
      } catch (error) {
        console.error("应用裁剪失败:", error);

        // 尝试恢复状态
        try {
          await this.safeCancelCrop();
        } catch (cancelError) {
          console.error("取消裁剪也失败:", cancelError);
        }

        // 显示用户友好的错误信息
        alert("裁剪操作失败，请重试。错误信息：" + error.message);
      } finally {
        this.enableMouseEvents();
      }
    },

    async cancelCrop() {
      await this.safeCancelCrop();
    },

    async safeCancelCrop() {
      if (!this.imageEditor) return;

      try {
        // 禁用鼠标事件
        this.disableMouseEvents();

        // 安全地停止绘制模式
        await this.safeStopDrawingMode();

        this.isCropping = false;
        console.log("裁剪模式已取消");
      } catch (error) {
        console.error("取消裁剪模式失败:", error);
        this.isCropping = false;
      } finally {
        // 重新启用鼠标事件
        setTimeout(() => {
          this.enableMouseEvents();
        }, 100);
      }
    },

    async safeStopDrawingMode() {
      if (!this.imageEditor) return;

      try {
        // 多次尝试停止绘制模式
        for (let i = 0; i < 3; i++) {
          try {
            this.imageEditor.stopDrawingMode();
            await new Promise((resolve) => setTimeout(resolve, 50));
            break;
          } catch (error) {
            if (i === 2) throw error;
            console.warn(`停止绘制模式尝试 ${i + 1} 失败，重试...`);
          }
        }
      } catch (error) {
        console.error("停止绘制模式失败:", error);
      }
    },

    async loadImage(event) {
      const file = event.target.files[0];
      if (file && this.imageEditor) {
        // 先取消任何正在进行的操作
        await this.safeCancelCrop();

        const reader = new FileReader();
        reader.onload = (e) => {
          this.imageEditor
            .loadImageFromURL(e.target.result, "UserImage")
            .then(() => {
              this.isImageLoaded = true;
              this.isEditorReady = true;
              this.resetEditingState();
              console.log("用户图片加载成功");
            })
            .catch((error) => {
              console.error("用户图片加载失败:", error);
              this.isImageLoaded = false;
              this.isEditorReady = false;
            });
        };
        reader.readAsDataURL(file);
      }
    },

    downloadImage() {
      if (this.imageEditor) {
        const dataURL = this.imageEditor.toDataURL();
        const link = document.createElement("a");
        link.download = "edited-image.png";
        link.href = dataURL;
        link.click();
      }
    },

    async resetImage() {
      if (this.imageEditor) {
        // 先取消任何正在进行的操作
        await this.safeCancelCrop();
        this.loadDefaultImage();
      }
    },

    resetControls() {
      this.brightness = 0;
      this.contrast = 0;
    },

    setupGlobalErrorHandler() {
      // 设置全局错误处理器来捕获TUI Image Editor的错误
      this.originalErrorHandler = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        // 使用专门的错误处理器检查和处理错误
        if (tuiEditorErrorHandler.isTuiEditorError(message || error)) {
          console.error("捕获到TUI Image Editor错误:", {
            message,
            source,
            lineno,
            colno,
            error,
          });

          // 使用错误处理器处理错误
          const handled = tuiEditorErrorHandler.handleError(
            message || error,
            this.imageEditor,
            {
              resetState: this.resetEditingState,
              enableMouseEvents: this.enableMouseEvents,
              validateEditorState: this.validateEditorState,
              clearHangingReferences: this.clearHangingReferences,
            }
          );

          // 如果成功处理，阻止错误继续传播
          if (handled) {
            return true;
          }
        }

        // 对于其他错误，调用原始处理器
        if (this.originalErrorHandler) {
          return this.originalErrorHandler(
            message,
            source,
            lineno,
            colno,
            error
          );
        }

        return false;
      };
    },

    removeGlobalErrorHandler() {
      // 恢复原始错误处理器
      if (this.originalErrorHandler) {
        window.onerror = this.originalErrorHandler;
      } else {
        window.onerror = null;
      }
    },
  },
};
</script>

<style scoped>
.tui-editor-view {
  max-width: 1400px;
  margin: 0 auto;
}

.editor-header {
  text-align: center;
  margin-bottom: 2rem;
}

.editor-header h1 {
  color: #2c3e50;
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.editor-header p {
  color: #5a6c7d;
  font-size: 1.1rem;
}

.editor-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  margin-bottom: 3rem;
}

.editor-wrapper {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.controls-panel {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.controls-panel h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.control-group {
  margin-bottom: 2rem;
}

.control-group h4 {
  color: #34495e;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.control-item {
  margin-bottom: 1rem;
}

.control-item label {
  display: block;
  margin-bottom: 0.5rem;
  color: #5a6c7d;
  font-size: 0.9rem;
}

.control-item input[type="range"] {
  width: 100%;
  margin-bottom: 0.5rem;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
  color: white;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(86, 171, 47, 0.4);
}

.btn-secondary {
  background: #f8f9fa;
  color: #5a6c7d;
  border: 1px solid #e1e8ed;
}

.btn-secondary:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.status-indicator {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.status-text {
  color: #1976d2;
  font-size: 0.9rem;
  font-weight: 500;
}

.features-info {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.features-info h3 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-item {
  text-align: center;
  padding: 1rem;
}

.feature-item h4 {
  color: #34495e;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.feature-item p {
  color: #5a6c7d;
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .editor-container {
    grid-template-columns: 1fr;
  }

  .controls-panel {
    order: -1;
  }

  .button-group {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .editor-header h1 {
    font-size: 1.8rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .controls-panel {
    padding: 1rem;
  }
}
</style>
