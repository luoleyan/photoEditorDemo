/**
 * TUI Image Editor Monkey Patch
 * 直接修补TUI Image Editor内部方法以防止null引用错误
 */

class TuiEditorMonkeyPatch {
  constructor() {
    this.isPatched = false;
    this.originalMethods = new Map(); // 使用Map来更好地管理原始方法
    this.patchAttempts = 0;
    this.maxPatchAttempts = 5;
    this.patchedMethods = new Set(); // 跟踪已经打补丁的方法
    this.debugMode = true; // 启用详细调试日志
    this.lastPatchCheck = 0; // 上次检查补丁的时间
    this.patchCheckInterval = 2000; // 检查间隔（毫秒）
    this.recursionGuard = new Set(); // 递归保护
    this.maxCallDepth = 10; // 最大调用深度
  }

  /**
   * 调试日志方法
   */
  debugLog(message, data = null) {
    if (this.debugMode) {
      console.log(`[MonkeyPatch] ${message}`, data || "");
    }
  }

  /**
   * 安全地存储原始方法
   */
  storeOriginalMethod(key, method, context) {
    if (method && typeof method === "function") {
      this.originalMethods.set(key, method.bind(context));
      this.debugLog(`存储原始方法: ${key}`);
      return true;
    } else {
      this.debugLog(`无法存储原始方法 ${key}: 方法不存在或不是函数`, method);
      return false;
    }
  }

  /**
   * 安全地获取原始方法
   */
  getOriginalMethod(key) {
    const method = this.originalMethods.get(key);
    if (method) {
      this.debugLog(`获取原始方法: ${key}`);
      return method;
    } else {
      this.debugLog(`原始方法不存在: ${key}`);
      return null;
    }
  }

  /**
   * 递归保护：检查是否正在执行某个方法
   */
  isMethodExecuting(methodKey) {
    return this.recursionGuard.has(methodKey);
  }

  /**
   * 递归保护：标记方法开始执行
   */
  markMethodStart(methodKey) {
    if (this.recursionGuard.has(methodKey)) {
      this.debugLog(`检测到递归调用: ${methodKey}`);
      return false;
    }
    this.recursionGuard.add(methodKey);
    return true;
  }

  /**
   * 递归保护：标记方法执行结束
   */
  markMethodEnd(methodKey) {
    this.recursionGuard.delete(methodKey);
  }

  /**
   * 安全地调用原始方法，带递归保护
   */
  safeCallOriginalMethod(methodKey, context, args = []) {
    if (this.isMethodExecuting(methodKey)) {
      this.debugLog(`阻止递归调用: ${methodKey}`);
      return null;
    }

    const originalMethod = this.getOriginalMethod(methodKey);
    if (!originalMethod) {
      this.debugLog(`原始方法不可用: ${methodKey}`);
      return null;
    }

    if (!this.markMethodStart(methodKey)) {
      return null;
    }

    try {
      this.debugLog(`安全调用原始方法: ${methodKey}`);
      const result = originalMethod.apply(context, args);
      this.debugLog(`原始方法调用成功: ${methodKey}`);
      return result;
    } catch (error) {
      this.debugLog(`原始方法调用失败: ${methodKey}`, error);
      throw error;
    } finally {
      this.markMethodEnd(methodKey);
    }
  }

  /**
   * 应用所有补丁
   * @param {Object} imageEditor - TUI Image Editor实例
   */
  applyPatches(imageEditor) {
    if (!imageEditor) {
      this.debugLog("ImageEditor实例不存在，跳过补丁应用");
      return;
    }

    if (this.isPatched) {
      this.debugLog("补丁已经应用，跳过重复应用");
      return;
    }

    this.debugLog("开始应用TUI Image Editor补丁...");

    try {
      let patchCount = 0;

      // 补丁1: 修复ImageEditor.crop方法（优先级最高）
      if (this.patchCropApplication(imageEditor)) patchCount++;

      // 补丁2: 修复Fabric.js事件处理器
      if (this.patchFabricEventHandlers(imageEditor)) patchCount++;

      // 补丁3: 修复对象添加过程中的null引用错误
      if (this.patchObjectAddition(imageEditor)) patchCount++;

      // 补丁4: 修复Graphics相关的null引用错误
      if (this.patchGraphicsOperations(imageEditor)) patchCount++;

      // 补丁5: 修复Canvas事件绑定
      if (this.patchCanvasEventBinding(imageEditor)) patchCount++;

      // 补丁6: 增强Cropper初始化
      if (this.patchCropperInitialization(imageEditor)) patchCount++;

      // 补丁7: 修复Cropper._onFabricMouseMove方法（延迟应用）
      if (this.patchCropperMouseMove(imageEditor)) patchCount++;

      this.isPatched = true;
      this.debugLog(
        `TUI Image Editor补丁应用成功，共应用 ${patchCount} 个补丁`
      );
      this.debugLog(
        "已存储的原始方法:",
        Array.from(this.originalMethods.keys())
      );
    } catch (error) {
      console.error("应用TUI Image Editor补丁失败:", error);
      this.patchAttempts++;

      // 如果补丁失败次数过多，停止尝试
      if (this.patchAttempts >= this.maxPatchAttempts) {
        console.error("补丁应用失败次数过多，停止尝试");
      }
    }
  }

  /**
   * 补丁7: 修复Cropper._onFabricMouseMove方法（延迟应用）
   */
  patchCropperMouseMove(imageEditor) {
    try {
      this.debugLog("开始应用Cropper鼠标移动补丁...");

      // 尝试访问Cropper实例
      const cropper = imageEditor._cropper;
      if (!cropper) {
        this.debugLog("Cropper实例不存在，将在后续检查中重试");
        // 不返回false，因为这是正常情况（Cropper在裁剪模式启动时才创建）
        return true;
      }

      // 检查是否已经打过补丁
      if (this.patchedMethods.has("cropper._onFabricMouseMove")) {
        this.debugLog("Cropper._onFabricMouseMove已经打过补丁，跳过");
        return true;
      }

      // 检查方法是否存在
      if (
        !cropper._onFabricMouseMove ||
        typeof cropper._onFabricMouseMove !== "function"
      ) {
        this.debugLog("Cropper._onFabricMouseMove方法不存在，跳过补丁");
        return false;
      }

      // 存储原始方法
      if (
        !this.storeOriginalMethod(
          "cropper._onFabricMouseMove",
          cropper._onFabricMouseMove,
          cropper
        )
      ) {
        this.debugLog("无法存储Cropper._onFabricMouseMove原始方法");
        return false;
      }

      // 创建安全的鼠标移动处理器
      const monkeyPatch = this;
      cropper._onFabricMouseMove = function (fEvent) {
        try {
          // 安全检查：确保所有必要的对象都存在
          if (!fEvent || !fEvent.e) {
            return;
          }

          // 检查cropper内部状态
          if (!this._canvas || !this._cropzone) {
            monkeyPatch.debugLog("Cropper内部对象缺失，跳过鼠标移动处理");
            return;
          }

          // 检查cropzone的关键属性
          if (!this._cropzone.set || typeof this._cropzone.set !== "function") {
            monkeyPatch.debugLog("Cropzone.set方法不存在，跳过鼠标移动处理");
            return;
          }

          // 检查canvas状态
          if (
            !this._canvas.getPointer ||
            typeof this._canvas.getPointer !== "function"
          ) {
            monkeyPatch.debugLog(
              "Canvas.getPointer方法不存在，跳过鼠标移动处理"
            );
            return;
          }

          // 安全地获取鼠标位置
          let pointer;
          try {
            pointer = this._canvas.getPointer(fEvent.e);
          } catch (pointerError) {
            monkeyPatch.debugLog("获取鼠标位置失败:", pointerError);
            return;
          }

          if (
            !pointer ||
            typeof pointer.x !== "number" ||
            typeof pointer.y !== "number"
          ) {
            monkeyPatch.debugLog("鼠标位置数据无效");
            return;
          }

          // 尝试调用原始方法
          const originalMethod = monkeyPatch.getOriginalMethod(
            "cropper._onFabricMouseMove"
          );
          if (originalMethod) {
            try {
              originalMethod(fEvent);
              return;
            } catch (originalError) {
              monkeyPatch.debugLog(
                "原始鼠标移动方法失败，使用安全实现:",
                originalError
              );
            }
          }

          // 如果原始方法失败，使用安全的备用实现
          try {
            if (this._cropzone && this._cropzone.set) {
              // 计算新位置（简化版本，避免复杂计算导致的错误）
              const newLeft = Math.max(
                0,
                pointer.x - (this._cropzone.width || 100) / 2
              );
              const newTop = Math.max(
                0,
                pointer.y - (this._cropzone.height || 100) / 2
              );

              this._cropzone.set({
                left: newLeft,
                top: newTop,
              });

              // 安全地重新渲染
              if (this._canvas && this._canvas.requestRenderAll) {
                this._canvas.requestRenderAll();
              }
            }
          } catch (updateError) {
            monkeyPatch.debugLog("更新cropzone失败:", updateError);
          }
        } catch (error) {
          monkeyPatch.debugLog("安全鼠标移动处理器出错:", error);
          // 不抛出错误，避免中断用户操作
        }
      }.bind(cropper);

      this.patchedMethods.add("cropper._onFabricMouseMove");
      this.debugLog("Cropper鼠标移动方法补丁已应用");
      return true;
    } catch (error) {
      this.debugLog("应用Cropper鼠标移动补丁失败:", error);
      return false;
    }
  }

  /**
   * 补丁2: 修复Fabric.js事件处理器
   */
  patchFabricEventHandlers(imageEditor) {
    try {
      const fabricCanvas = imageEditor._graphics?.getCanvas?.();
      if (!fabricCanvas) {
        console.warn("Fabric Canvas不存在，跳过事件处理器补丁");
        return;
      }

      // 保存原始的事件处理方法
      if (fabricCanvas.__onMouseMove && !this.originalMethods.fabricMouseMove) {
        this.originalMethods.fabricMouseMove =
          fabricCanvas.__onMouseMove.bind(fabricCanvas);
      }

      // 创建安全的Fabric事件处理器
      fabricCanvas.__onMouseMove = function (e) {
        try {
          // 安全检查
          if (!e || !this._objects) {
            return;
          }

          // 检查canvas状态
          if (!this.getPointer || !this.findTarget) {
            console.warn("Canvas方法缺失，跳过鼠标移动处理");
            return;
          }

          // 调用原始方法（如果存在）
          if (this.originalMethods && this.originalMethods.fabricMouseMove) {
            try {
              this.originalMethods.fabricMouseMove(e);
            } catch (originalError) {
              console.warn("原始Fabric鼠标移动方法出错:", originalError);
            }
          }
        } catch (error) {
          console.error("安全Fabric鼠标移动处理器出错:", error);
        }
      }.bind(fabricCanvas);

      console.log("Fabric事件处理器补丁已应用");
    } catch (error) {
      console.error("应用Fabric事件处理器补丁失败:", error);
    }
  }

  /**
   * 补丁3: 增强Cropper初始化
   */
  patchCropperInitialization(imageEditor) {
    try {
      // 确保Cropper在初始化时有正确的状态
      const cropper = imageEditor._cropper;
      if (cropper) {
        // 强制初始化关键属性
        if (!cropper._canvas) {
          cropper._canvas = imageEditor._graphics?.getCanvas?.();
        }

        // 确保cropzone存在
        if (!cropper._cropzone && cropper._canvas && window.fabric) {
          try {
            cropper._cropzone = new window.fabric.Rect({
              left: 50,
              top: 50,
              width: 100,
              height: 100,
              fill: "transparent",
              stroke: "#ff0000",
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              selectable: true,
              evented: true,
            });

            if (cropper._canvas.add) {
              cropper._canvas.add(cropper._cropzone);
            }
          } catch (createError) {
            console.warn("创建默认cropzone失败:", createError);
          }
        }

        console.log("Cropper初始化补丁已应用");
      }
    } catch (error) {
      console.error("应用Cropper初始化补丁失败:", error);
    }
  }

  /**
   * 补丁4: 修复Canvas事件绑定
   */
  patchCanvasEventBinding(imageEditor) {
    try {
      const fabricCanvas = imageEditor._graphics?.getCanvas?.();
      if (!fabricCanvas) {
        return;
      }

      // 确保canvas有正确的事件绑定状态
      if (!fabricCanvas._hasMouseEventListeners) {
        fabricCanvas._hasMouseEventListeners = true;
      }

      // 重新绑定关键事件（如果缺失）
      if (!fabricCanvas._onMouseMove) {
        fabricCanvas._onMouseMove = function (e) {
          try {
            if (e && e.preventDefault) {
              e.preventDefault();
            }
          } catch (error) {
            // 忽略错误
          }
        };
      }

      console.log("Canvas事件绑定补丁已应用");
    } catch (error) {
      console.error("应用Canvas事件绑定补丁失败:", error);
    }
  }

  /**
   * 补丁1: 修复裁剪应用过程中的null引用错误
   */
  patchCropApplication(imageEditor) {
    try {
      this.debugLog("开始应用裁剪应用补丁...");

      // 检查ImageEditor.crop方法是否存在
      if (!imageEditor.crop || typeof imageEditor.crop !== "function") {
        this.debugLog("ImageEditor.crop方法不存在，跳过补丁");
        return false;
      }

      // 检查是否已经打过补丁
      if (this.patchedMethods.has("imageEditor.crop")) {
        this.debugLog("ImageEditor.crop已经打过补丁，跳过");
        return true;
      }

      // 存储原始方法
      if (
        !this.storeOriginalMethod(
          "imageEditor.crop",
          imageEditor.crop,
          imageEditor
        )
      ) {
        this.debugLog("无法存储ImageEditor.crop原始方法");
        return false;
      }

      // 创建安全的裁剪方法
      const monkeyPatch = this;
      const originalImageEditor = imageEditor; // 保存原始引用，避免Vue响应式问题

      imageEditor.crop = function (cropRect) {
        try {
          monkeyPatch.debugLog("安全裁剪方法被调用:", cropRect);

          // 安全检查裁剪参数
          if (!cropRect || typeof cropRect !== "object") {
            const error = new Error("无效的裁剪参数");
            monkeyPatch.debugLog("裁剪参数验证失败:", cropRect);
            return Promise.reject(error);
          }

          // 检查必要的属性
          const requiredProps = ["left", "top", "width", "height"];
          for (const prop of requiredProps) {
            if (typeof cropRect[prop] !== "number") {
              const error = new Error(`裁剪参数缺少必要属性: ${prop}`);
              monkeyPatch.debugLog("裁剪参数属性验证失败:", {
                prop,
                value: cropRect[prop],
              });
              return Promise.reject(error);
            }
          }

          // 安全地调用原始方法（带递归保护）
          try {
            const result = monkeyPatch.safeCallOriginalMethod(
              "imageEditor.crop",
              originalImageEditor,
              [cropRect]
            );
            if (result === null) {
              const error = new Error("原始裁剪方法调用被阻止（递归保护）");
              monkeyPatch.debugLog("递归保护阻止了方法调用");
              return Promise.reject(error);
            }
            return result;
          } catch (originalError) {
            monkeyPatch.debugLog("原始裁剪方法失败:", originalError);
            return Promise.reject(originalError);
          }
        } catch (error) {
          monkeyPatch.debugLog("安全裁剪方法出错:", error);
          return Promise.reject(error);
        }
      };

      this.patchedMethods.add("imageEditor.crop");
      this.debugLog("裁剪应用补丁已应用");
      return true;
    } catch (error) {
      this.debugLog("应用裁剪应用补丁失败:", error);
      return false;
    }
  }

  /**
   * 补丁3: 修复对象添加过程中的null引用错误
   */
  patchObjectAddition(imageEditor) {
    try {
      this.debugLog("开始应用对象添加补丁...");

      const fabricCanvas = imageEditor._graphics?.getCanvas?.();
      if (!fabricCanvas) {
        this.debugLog("Fabric Canvas不存在，跳过对象添加补丁");
        return false;
      }

      let patchCount = 0;

      // 修复Canvas.add方法
      if (
        fabricCanvas.add &&
        typeof fabricCanvas.add === "function" &&
        !this.patchedMethods.has("canvas.add")
      ) {
        if (
          this.storeOriginalMethod("canvas.add", fabricCanvas.add, fabricCanvas)
        ) {
          const monkeyPatch = this;
          const originalCanvas = fabricCanvas; // 保存原始Canvas引用

          fabricCanvas.add = function (...objects) {
            try {
              monkeyPatch.debugLog(
                "安全Canvas.add方法被调用，对象数量:",
                objects.length
              );

              // 过滤掉null或undefined对象
              const validObjects = objects.filter((obj) => {
                if (!obj) {
                  monkeyPatch.debugLog("跳过null/undefined对象");
                  return false;
                }

                // 检查对象是否有必要的属性
                if (!obj.set || typeof obj.set !== "function") {
                  monkeyPatch.debugLog("对象缺少set方法，跳过");
                  return false;
                }

                return true;
              });

              if (validObjects.length === 0) {
                monkeyPatch.debugLog("没有有效对象可添加");
                return originalCanvas;
              }

              // 安全地调用原始方法（带递归保护）
              try {
                const result = monkeyPatch.safeCallOriginalMethod(
                  "canvas.add",
                  originalCanvas,
                  validObjects
                );
                if (result === null) {
                  monkeyPatch.debugLog("Canvas.add方法调用被阻止（递归保护）");
                  return originalCanvas;
                }
                return result;
              } catch (originalError) {
                monkeyPatch.debugLog("原始Canvas.add方法失败:", originalError);
                return originalCanvas;
              }
            } catch (error) {
              monkeyPatch.debugLog("安全Canvas.add方法出错:", error);
              return originalCanvas;
            }
          };

          this.patchedMethods.add("canvas.add");
          patchCount++;
        }
      }

      // 修复_onObjectAdded方法
      if (
        fabricCanvas._onObjectAdded &&
        typeof fabricCanvas._onObjectAdded === "function" &&
        !this.patchedMethods.has("canvas._onObjectAdded")
      ) {
        if (
          this.storeOriginalMethod(
            "canvas._onObjectAdded",
            fabricCanvas._onObjectAdded,
            fabricCanvas
          )
        ) {
          const monkeyPatch = this;
          const originalCanvas = fabricCanvas; // 保存原始Canvas引用

          fabricCanvas._onObjectAdded = function (obj) {
            try {
              monkeyPatch.debugLog("安全_onObjectAdded方法被调用");

              // 安全检查对象
              if (!obj) {
                monkeyPatch.debugLog("_onObjectAdded: 对象为null，跳过处理");
                return;
              }

              // 检查对象的关键属性
              if (!obj._set && obj.set) {
                // 如果_set不存在但set存在，创建_set引用
                obj._set = obj.set;
                monkeyPatch.debugLog("_onObjectAdded: 修复对象_set属性");
              }

              if (!obj._set || typeof obj._set !== "function") {
                monkeyPatch.debugLog(
                  "_onObjectAdded: 对象缺少_set方法，跳过处理"
                );
                return;
              }

              // 安全地调用原始方法（带递归保护）
              try {
                const result = monkeyPatch.safeCallOriginalMethod(
                  "canvas._onObjectAdded",
                  originalCanvas,
                  [obj]
                );
                if (result === null) {
                  monkeyPatch.debugLog(
                    "_onObjectAdded方法调用被阻止（递归保护）"
                  );
                  return;
                }
                return result;
              } catch (originalError) {
                monkeyPatch.debugLog(
                  "原始_onObjectAdded方法失败:",
                  originalError
                );
              }
            } catch (error) {
              monkeyPatch.debugLog("安全_onObjectAdded方法出错:", error);
            }
          };

          this.patchedMethods.add("canvas._onObjectAdded");
          patchCount++;
        }
      }

      this.debugLog(`对象添加补丁已应用，共应用 ${patchCount} 个补丁`);
      return patchCount > 0;
    } catch (error) {
      this.debugLog("应用对象添加补丁失败:", error);
      return false;
    }
  }

  /**
   * 补丁7: 修复Graphics相关的null引用错误
   */
  patchGraphicsOperations(imageEditor) {
    try {
      const graphics = imageEditor._graphics;
      if (!graphics) {
        console.warn("Graphics对象不存在，跳过Graphics补丁");
        return;
      }

      // 修复getCroppedImageData方法
      if (
        graphics.getCroppedImageData &&
        !this.originalMethods.getCroppedImageData
      ) {
        this.originalMethods.getCroppedImageData =
          graphics.getCroppedImageData.bind(graphics);

        graphics.getCroppedImageData = function (cropRect) {
          try {
            console.log("安全getCroppedImageData方法被调用:", cropRect);

            // 安全检查裁剪参数
            if (!cropRect || typeof cropRect !== "object") {
              console.warn("getCroppedImageData: 无效的裁剪参数");
              return null;
            }

            // 检查Canvas状态
            const canvas = this.getCanvas();
            if (!canvas) {
              console.warn("getCroppedImageData: Canvas不存在");
              return null;
            }

            // 检查Canvas对象
            const objects = canvas.getObjects();
            if (!objects || !Array.isArray(objects)) {
              console.warn("getCroppedImageData: Canvas对象列表无效");
              return null;
            }

            // 确保所有对象都有有效的属性
            const validObjects = objects.filter((obj) => {
              if (!obj) return false;

              // 确保对象有必要的方法
              if (!obj.set || typeof obj.set !== "function") {
                console.warn("getCroppedImageData: 对象缺少set方法");
                return false;
              }

              // 确保_set属性存在
              if (!obj._set && obj.set) {
                obj._set = obj.set;
              }

              return true;
            });

            // 如果有无效对象，先清理
            if (validObjects.length !== objects.length) {
              console.warn("getCroppedImageData: 发现无效对象，进行清理");
              try {
                // 移除无效对象
                objects.forEach((obj) => {
                  if (!validObjects.includes(obj)) {
                    canvas.remove(obj);
                  }
                });
              } catch (cleanupError) {
                console.warn("清理无效对象失败:", cleanupError);
              }
            }

            // 安全地调用原始方法
            try {
              return this.originalMethods.getCroppedImageData(cropRect);
            } catch (originalError) {
              console.error("原始getCroppedImageData方法失败:", originalError);
              return null;
            }
          } catch (error) {
            console.error("安全getCroppedImageData方法出错:", error);
            return null;
          }
        }.bind(graphics);
      }

      // 修复Cropper.getCroppedImageData方法
      const cropper = imageEditor._cropper;
      if (
        cropper &&
        cropper.getCroppedImageData &&
        !this.originalMethods.cropperGetCroppedImageData
      ) {
        this.originalMethods.cropperGetCroppedImageData =
          cropper.getCroppedImageData.bind(cropper);

        cropper.getCroppedImageData = function (cropRect) {
          try {
            console.log("安全Cropper.getCroppedImageData方法被调用:", cropRect);

            // 检查Cropper状态
            if (!this._canvas || !this._cropzone) {
              console.warn("Cropper.getCroppedImageData: Cropper状态无效");
              return null;
            }

            // 检查裁剪区域
            if (
              !this._cropzone.set ||
              typeof this._cropzone.set !== "function"
            ) {
              console.warn("Cropper.getCroppedImageData: 裁剪区域无效");
              return null;
            }

            // 确保_set属性存在
            if (!this._cropzone._set && this._cropzone.set) {
              this._cropzone._set = this._cropzone.set;
            }

            // 安全地调用原始方法
            try {
              return this.originalMethods.cropperGetCroppedImageData(cropRect);
            } catch (originalError) {
              console.error(
                "原始Cropper.getCroppedImageData方法失败:",
                originalError
              );
              return null;
            }
          } catch (error) {
            console.error("安全Cropper.getCroppedImageData方法出错:", error);
            return null;
          }
        }.bind(cropper);
      }

      console.log("Graphics操作补丁已应用");
    } catch (error) {
      console.error("应用Graphics操作补丁失败:", error);
    }
  }

  /**
   * 移除所有补丁
   */
  removePatches(imageEditor) {
    if (!this.isPatched || !imageEditor) {
      this.debugLog("无需移除补丁：未打补丁或ImageEditor不存在");
      return;
    }

    try {
      this.debugLog("开始移除TUI Image Editor补丁...");
      let removedCount = 0;

      // 恢复ImageEditor相关方法
      const cropMethod = this.getOriginalMethod("imageEditor.crop");
      if (cropMethod) {
        imageEditor.crop = cropMethod;
        removedCount++;
        this.debugLog("恢复ImageEditor.crop方法");
      }

      // 恢复Fabric Canvas相关方法
      const fabricCanvas = imageEditor._graphics?.getCanvas?.();
      if (fabricCanvas) {
        const addMethod = this.getOriginalMethod("canvas.add");
        if (addMethod) {
          fabricCanvas.add = addMethod;
          removedCount++;
          this.debugLog("恢复Canvas.add方法");
        }

        const onObjectAddedMethod = this.getOriginalMethod(
          "canvas._onObjectAdded"
        );
        if (onObjectAddedMethod) {
          fabricCanvas._onObjectAdded = onObjectAddedMethod;
          removedCount++;
          this.debugLog("恢复Canvas._onObjectAdded方法");
        }

        const mouseMoveMethod = this.getOriginalMethod("canvas.__onMouseMove");
        if (mouseMoveMethod) {
          fabricCanvas.__onMouseMove = mouseMoveMethod;
          removedCount++;
          this.debugLog("恢复Canvas.__onMouseMove方法");
        }
      }

      // 恢复Graphics相关方法
      const graphics = imageEditor._graphics;
      if (graphics) {
        const getCroppedDataMethod = this.getOriginalMethod(
          "graphics.getCroppedImageData"
        );
        if (getCroppedDataMethod) {
          graphics.getCroppedImageData = getCroppedDataMethod;
          removedCount++;
          this.debugLog("恢复Graphics.getCroppedImageData方法");
        }

        const cropperGetDataMethod = this.getOriginalMethod(
          "cropper.getCroppedImageData"
        );
        if (cropperGetDataMethod && imageEditor._cropper) {
          imageEditor._cropper.getCroppedImageData = cropperGetDataMethod;
          removedCount++;
          this.debugLog("恢复Cropper.getCroppedImageData方法");
        }
      }

      // 恢复Cropper相关方法
      const cropper = imageEditor._cropper;
      if (cropper) {
        const mouseMoveMethod = this.getOriginalMethod(
          "cropper._onFabricMouseMove"
        );
        if (mouseMoveMethod) {
          cropper._onFabricMouseMove = mouseMoveMethod;
          removedCount++;
          this.debugLog("恢复Cropper._onFabricMouseMove方法");
        }
      }

      // 清理状态
      this.isPatched = false;
      this.originalMethods.clear();
      this.patchedMethods.clear();

      this.debugLog(
        `TUI Image Editor补丁已移除，共移除 ${removedCount} 个补丁`
      );
    } catch (error) {
      this.debugLog("移除TUI Image Editor补丁失败:", error);
    }
  }

  /**
   * 检查是否需要重新应用补丁
   */
  checkAndReapplyPatches(imageEditor) {
    if (!imageEditor) {
      this.debugLog("ImageEditor实例不存在，跳过补丁检查");
      return;
    }

    // 限制检查频率
    const now = Date.now();
    if (now - this.lastPatchCheck < this.patchCheckInterval) {
      return;
    }
    this.lastPatchCheck = now;

    try {
      this.debugLog("开始检查补丁状态...");
      let needsReapply = false;
      const missingPatches = [];

      // 检查ImageEditor.crop方法
      if (imageEditor.crop) {
        const cropMethodString = imageEditor.crop.toString();
        if (!cropMethodString.includes("安全裁剪方法被调用")) {
          needsReapply = true;
          missingPatches.push("imageEditor.crop");
        }
      }

      // 检查Canvas.add方法
      const fabricCanvas = imageEditor._graphics?.getCanvas?.();
      if (fabricCanvas && fabricCanvas.add) {
        const addMethodString = fabricCanvas.add.toString();
        if (!addMethodString.includes("安全Canvas.add方法被调用")) {
          needsReapply = true;
          missingPatches.push("canvas.add");
        }
      }

      // 检查Graphics.getCroppedImageData方法
      const graphics = imageEditor._graphics;
      if (graphics && graphics.getCroppedImageData) {
        const getDataMethodString = graphics.getCroppedImageData.toString();
        if (
          !getDataMethodString.includes("安全getCroppedImageData方法被调用")
        ) {
          needsReapply = true;
          missingPatches.push("graphics.getCroppedImageData");
        }
      }

      // 检查Cropper相关方法（如果存在）
      const cropper = imageEditor._cropper;
      if (cropper && cropper._onFabricMouseMove) {
        const methodString = cropper._onFabricMouseMove.toString();
        if (!methodString.includes("monkeyPatch.debugLog")) {
          needsReapply = true;
          missingPatches.push("cropper._onFabricMouseMove");
        }
      } else if (
        cropper &&
        !this.patchedMethods.has("cropper._onFabricMouseMove")
      ) {
        // Cropper存在但还没有打补丁
        this.debugLog("发现新的Cropper实例，应用鼠标移动补丁");
        this.patchCropperMouseMove(imageEditor);
      }

      if (needsReapply) {
        this.debugLog("检测到补丁被重置，缺失的补丁:", missingPatches);
        this.isPatched = false;
        this.patchedMethods.clear(); // 清除已打补丁的记录
        this.applyPatches(imageEditor);
      } else {
        this.debugLog("所有补丁状态正常");
      }
    } catch (error) {
      this.debugLog("检查补丁状态失败:", error);
    }
  }

  /**
   * 获取补丁状态
   */
  getPatchStatus() {
    return {
      isPatched: this.isPatched,
      patchAttempts: this.patchAttempts,
      hasOriginalMethods: Object.keys(this.originalMethods).length > 0,
    };
  }
}

// 创建单例实例
const tuiEditorMonkeyPatch = new TuiEditorMonkeyPatch();

export default tuiEditorMonkeyPatch;
