/**
 * 状态转换工具类
 * 负责在不同适配器之间转换状态数据格式
 */

import { errorHandler } from "@/utils/ErrorHandler.js";

/**
 * 状态转换器
 */
export class StateConverter {
  constructor() {
    this.conversionRules = new Map();
    this._initializeConversionRules();
  }

  /**
   * 转换状态数据
   * @param {Object} sourceState - 源状态
   * @param {string} targetAdapterType - 目标适配器类型
   * @returns {Object} 转换后的状态
   */
  convertState(sourceState, targetAdapterType) {
    return errorHandler.safeExecute(
      () => {
        const sourceType = sourceState.libraryType || "unknown";
        const conversionKey = `${sourceType}_to_${targetAdapterType}`;

        const conversionRule = this.conversionRules.get(conversionKey);
        if (!conversionRule) {
          throw new Error(`No conversion rule found for ${conversionKey}`);
        }

        return conversionRule(sourceState);
      },
      "convertState",
      { sourceType: sourceState.libraryType, targetAdapterType }
    );
  }

  /**
   * 批量转换状态
   * @param {Array} states - 状态数组
   * @param {string} targetAdapterType - 目标适配器类型
   * @returns {Array} 转换后的状态数组
   */
  batchConvertStates(states, targetAdapterType) {
    return states
      .map((state) => {
        try {
          return this.convertState(state, targetAdapterType);
        } catch (error) {
          console.error(`Failed to convert state ${state.id}:`, error);
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * 检查转换支持
   * @param {string} sourceType - 源适配器类型
   * @param {string} targetType - 目标适配器类型
   * @returns {boolean} 是否支持转换
   */
  isConversionSupported(sourceType, targetType) {
    const conversionKey = `${sourceType}_to_${targetType}`;
    return this.conversionRules.has(conversionKey);
  }

  /**
   * 获取支持的转换路径
   * @param {string} sourceType - 源适配器类型
   * @returns {Array<string>} 支持的目标类型数组
   */
  getSupportedTargets(sourceType) {
    const targets = [];
    for (const [key] of this.conversionRules) {
      if (key.startsWith(`${sourceType}_to_`)) {
        targets.push(key.split("_to_")[1]);
      }
    }
    return targets;
  }

  /**
   * 初始化转换规则
   * @private
   */
  _initializeConversionRules() {
    // Fabric to other adapters
    this.conversionRules.set("fabric_to_konva", this._fabricToKonva.bind(this));
    this.conversionRules.set("fabric_to_tui", this._fabricToTui.bind(this));
    this.conversionRules.set("fabric_to_jimp", this._fabricToJimp.bind(this));
    this.conversionRules.set(
      "fabric_to_cropper",
      this._fabricToCropper.bind(this)
    );

    // Konva to other adapters
    this.conversionRules.set("konva_to_fabric", this._konvaToFabric.bind(this));
    this.conversionRules.set("konva_to_tui", this._konvaToTui.bind(this));
    this.conversionRules.set("konva_to_jimp", this._konvaToJimp.bind(this));
    this.conversionRules.set(
      "konva_to_cropper",
      this._konvaToCropper.bind(this)
    );

    // TUI to other adapters
    this.conversionRules.set("tui_to_fabric", this._tuiToFabric.bind(this));
    this.conversionRules.set("tui_to_konva", this._tuiToKonva.bind(this));
    this.conversionRules.set("tui_to_jimp", this._tuiToJimp.bind(this));
    this.conversionRules.set("tui_to_cropper", this._tuiToCropper.bind(this));

    // Jimp to other adapters
    this.conversionRules.set("jimp_to_fabric", this._jimpToFabric.bind(this));
    this.conversionRules.set("jimp_to_konva", this._jimpToKonva.bind(this));
    this.conversionRules.set("jimp_to_tui", this._jimpToTui.bind(this));
    this.conversionRules.set("jimp_to_cropper", this._jimpToCropper.bind(this));

    // Cropper to other adapters
    this.conversionRules.set(
      "cropper_to_fabric",
      this._cropperToFabric.bind(this)
    );
    this.conversionRules.set(
      "cropper_to_konva",
      this._cropperToKonva.bind(this)
    );
    this.conversionRules.set("cropper_to_tui", this._cropperToTui.bind(this));
    this.conversionRules.set("cropper_to_jimp", this._cropperToJimp.bind(this));
  }

  // ========== Fabric转换方法 ==========

  /**
   * Fabric到Konva转换
   * @param {Object} fabricState - Fabric状态
   * @returns {Object} Konva状态
   * @private
   */
  _fabricToKonva(fabricState) {
    const konvaState = { ...fabricState };
    konvaState.libraryType = "konva";

    // 转换对象格式
    if (konvaState.objects) {
      konvaState.objects = konvaState.objects.map((obj) => {
        const converted = { ...obj };

        // 位置属性转换
        if (obj.left !== undefined) converted.x = obj.left;
        if (obj.top !== undefined) converted.y = obj.top;
        if (obj.angle !== undefined) converted.rotation = obj.angle;

        // 删除Fabric特定属性
        delete converted.left;
        delete converted.top;
        delete converted.angle;

        return converted;
      });
    }

    return konvaState;
  }

  /**
   * Fabric到TUI转换
   * @param {Object} fabricState - Fabric状态
   * @returns {Object} TUI状态
   * @private
   */
  _fabricToTui(fabricState) {
    const tuiState = { ...fabricState };
    tuiState.libraryType = "tui";

    // TUI有特定的数据结构要求
    if (tuiState.objects) {
      tuiState.objects = tuiState.objects.map((obj) => {
        const converted = { ...obj };

        // TUI使用position对象
        converted.position = {
          x: obj.left || obj.x || 0,
          y: obj.top || obj.y || 0,
        };

        // TUI使用styles对象
        if (obj.type === "text") {
          converted.styles = {
            fill: obj.fill || "#000000",
            fontSize: obj.fontSize || 16,
            fontFamily: obj.fontFamily || "Arial",
          };
        }

        return converted;
      });
    }

    return tuiState;
  }

  /**
   * Fabric到Jimp转换
   * @param {Object} fabricState - Fabric状态
   * @returns {Object} Jimp状态
   * @private
   */
  _fabricToJimp(fabricState) {
    const jimpState = { ...fabricState };
    jimpState.libraryType = "jimp";

    // Jimp主要处理图像级别的操作，对象支持有限
    if (jimpState.objects) {
      jimpState.objects = jimpState.objects.filter(
        (obj) => obj.type === "image" || obj.type === "text"
      );
    }

    return jimpState;
  }

  /**
   * Fabric到Cropper转换
   * @param {Object} fabricState - Fabric状态
   * @returns {Object} Cropper状态
   * @private
   */
  _fabricToCropper(fabricState) {
    const cropperState = { ...fabricState };
    cropperState.libraryType = "cropper";

    // Cropper主要关注裁剪，保留裁剪相关数据
    if (cropperState.transform && cropperState.transform.cropData) {
      cropperState.cropperData = {
        x: cropperState.transform.cropData.x || 0,
        y: cropperState.transform.cropData.y || 0,
        width: cropperState.transform.cropData.width || 0,
        height: cropperState.transform.cropData.height || 0,
        rotate: cropperState.transform.rotation || 0,
        scaleX: cropperState.transform.scale?.x || 1,
        scaleY: cropperState.transform.scale?.y || 1,
      };
    }

    // 移除不支持的对象
    cropperState.objects = [];

    return cropperState;
  }

  // ========== Konva转换方法 ==========

  /**
   * Konva到Fabric转换
   * @param {Object} konvaState - Konva状态
   * @returns {Object} Fabric状态
   * @private
   */
  _konvaToFabric(konvaState) {
    const fabricState = { ...konvaState };
    fabricState.libraryType = "fabric";

    // 转换对象格式
    if (fabricState.objects) {
      fabricState.objects = fabricState.objects.map((obj) => {
        const converted = { ...obj };

        // 位置属性转换
        if (obj.x !== undefined) converted.left = obj.x;
        if (obj.y !== undefined) converted.top = obj.y;
        if (obj.rotation !== undefined) converted.angle = obj.rotation;

        // 删除Konva特定属性
        delete converted.x;
        delete converted.y;
        delete converted.rotation;

        return converted;
      });
    }

    return fabricState;
  }

  /**
   * Konva到TUI转换
   * @param {Object} konvaState - Konva状态
   * @returns {Object} TUI状态
   * @private
   */
  _konvaToTui(konvaState) {
    // 先转换为通用格式，再转换为TUI
    const fabricState = this._konvaToFabric(konvaState);
    return this._fabricToTui(fabricState);
  }

  /**
   * Konva到Jimp转换
   * @param {Object} konvaState - Konva状态
   * @returns {Object} Jimp状态
   * @private
   */
  _konvaToJimp(konvaState) {
    const fabricState = this._konvaToFabric(konvaState);
    return this._fabricToJimp(fabricState);
  }

  /**
   * Konva到Cropper转换
   * @param {Object} konvaState - Konva状态
   * @returns {Object} Cropper状态
   * @private
   */
  _konvaToCropper(konvaState) {
    const fabricState = this._konvaToFabric(konvaState);
    return this._fabricToCropper(fabricState);
  }

  // ========== 其他转换方法的占位符 ==========
  // 为了保持文件长度在300行以内，其他转换方法将在后续添加

  _tuiToFabric(tuiState) {
    return this._genericConversion(tuiState, "fabric");
  }
  _tuiToKonva(tuiState) {
    return this._genericConversion(tuiState, "konva");
  }
  _tuiToJimp(tuiState) {
    return this._genericConversion(tuiState, "jimp");
  }
  _tuiToCropper(tuiState) {
    return this._genericConversion(tuiState, "cropper");
  }

  _jimpToFabric(jimpState) {
    return this._genericConversion(jimpState, "fabric");
  }
  _jimpToKonva(jimpState) {
    return this._genericConversion(jimpState, "konva");
  }
  _jimpToTui(jimpState) {
    return this._genericConversion(jimpState, "tui");
  }
  _jimpToCropper(jimpState) {
    return this._genericConversion(jimpState, "cropper");
  }

  _cropperToFabric(cropperState) {
    return this._genericConversion(cropperState, "fabric");
  }
  _cropperToKonva(cropperState) {
    return this._genericConversion(cropperState, "konva");
  }
  _cropperToTui(cropperState) {
    return this._genericConversion(cropperState, "tui");
  }
  _cropperToJimp(cropperState) {
    return this._genericConversion(cropperState, "jimp");
  }

  /**
   * 通用转换方法
   * @param {Object} sourceState - 源状态
   * @param {string} targetType - 目标类型
   * @returns {Object} 转换后的状态
   * @private
   */
  _genericConversion(sourceState, targetType) {
    const converted = { ...sourceState };
    converted.libraryType = targetType;
    return converted;
  }
}

export default StateConverter;
