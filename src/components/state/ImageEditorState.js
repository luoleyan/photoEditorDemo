/**
 * 图像编辑器状态接口定义
 * 定义了统一的状态数据结构，独立于具体的图像编辑库实现
 */

/**
 * 创建默认的图像编辑状态
 * @param {string} libraryType - 创建此状态的库类型
 * @param {Object} imageData - 图像基本信息
 * @returns {Object} 默认状态对象
 */
export function createDefaultImageEditorState(libraryType, imageData = null) {
  return {
    // 基本信息
    id: generateUniqueId(),
    timestamp: Date.now(),
    libraryType: libraryType,
    version: '1.0.0',
    
    // 图像基本信息
    imageData: imageData ? {
      originalSrc: imageData.src || '',
      currentSrc: imageData.src || '',
      width: imageData.width || 0,
      height: imageData.height || 0,
      originalWidth: imageData.width || 0,
      originalHeight: imageData.height || 0,
      fileType: getFileTypeFromSrc(imageData.src || ''),
      hasAlpha: imageData.hasAlpha || false,
      fileSize: imageData.fileSize || 0
    } : null,
    
    // 变换状态
    transform: {
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      flipX: false,
      flipY: false,
      cropData: null // { x, y, width, height, aspectRatio }
    },
    
    // 滤镜和调整
    filters: [],
    
    // 调整参数
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      gamma: 1,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      vibrance: 0,
      temperature: 0,
      tint: 0
    },
    
    // 对象状态（文本、形状等）
    objects: [],
    
    // 图层信息
    layers: [],
    
    // 画布设置
    canvas: {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      zoom: 1,
      viewportTransform: [1, 0, 0, 1, 0, 0]
    },
    
    // 选择状态
    selection: {
      activeObjectId: null,
      selectedObjectIds: [],
      selectionBounds: null
    },
    
    // 库特定数据（用于存储特定库的额外状态）
    librarySpecificData: {},
    
    // 元数据
    metadata: {
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      operationCount: 0,
      lastOperation: null
    }
  };
}

/**
 * 验证状态对象的完整性
 * @param {Object} state - 状态对象
 * @returns {boolean} 是否有效
 */
export function validateImageEditorState(state) {
  if (!state || typeof state !== 'object') {
    return false;
  }
  
  // 检查必需字段
  const requiredFields = ['id', 'timestamp', 'libraryType', 'transform', 'filters', 'adjustments'];
  for (const field of requiredFields) {
    if (!(field in state)) {
      console.warn(`Missing required field: ${field}`);
      return false;
    }
  }
  
  // 检查transform结构
  if (!state.transform || 
      !state.transform.position || 
      !state.transform.scale ||
      typeof state.transform.rotation !== 'number') {
    console.warn('Invalid transform structure');
    return false;
  }
  
  // 检查filters是否为数组
  if (!Array.isArray(state.filters)) {
    console.warn('Filters must be an array');
    return false;
  }
  
  // 检查adjustments结构
  if (!state.adjustments || typeof state.adjustments !== 'object') {
    console.warn('Invalid adjustments structure');
    return false;
  }
  
  return true;
}

/**
 * 深度克隆状态对象
 * @param {Object} state - 原始状态
 * @returns {Object} 克隆的状态
 */
export function cloneImageEditorState(state) {
  return JSON.parse(JSON.stringify(state));
}

/**
 * 合并状态更新
 * @param {Object} currentState - 当前状态
 * @param {Object} updates - 更新内容
 * @returns {Object} 合并后的新状态
 */
export function mergeStateUpdates(currentState, updates) {
  const newState = cloneImageEditorState(currentState);
  
  // 更新时间戳
  newState.timestamp = Date.now();
  newState.metadata.modifiedAt = Date.now();
  newState.metadata.operationCount++;
  
  // 深度合并更新
  deepMerge(newState, updates);
  
  return newState;
}

/**
 * 创建滤镜对象
 * @param {string} type - 滤镜类型
 * @param {Object} options - 滤镜选项
 * @param {boolean} enabled - 是否启用
 * @returns {Object} 滤镜对象
 */
export function createFilter(type, options = {}, enabled = true) {
  return {
    id: generateUniqueId(),
    type: type,
    options: { ...options },
    enabled: enabled,
    createdAt: Date.now()
  };
}

/**
 * 创建对象状态
 * @param {string} type - 对象类型
 * @param {Object} properties - 对象属性
 * @returns {Object} 对象状态
 */
export function createObjectState(type, properties = {}) {
  return {
    id: generateUniqueId(),
    type: type,
    properties: { ...properties },
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    rotation: 0,
    zIndex: 0,
    visible: true,
    locked: false,
    opacity: 1,
    createdAt: Date.now(),
    modifiedAt: Date.now()
  };
}

/**
 * 创建图层状态
 * @param {string} name - 图层名称
 * @param {string[]} objectIds - 图层包含的对象ID
 * @returns {Object} 图层状态
 */
export function createLayerState(name, objectIds = []) {
  return {
    id: generateUniqueId(),
    name: name,
    visible: true,
    opacity: 1,
    locked: false,
    objectIds: [...objectIds],
    blendMode: 'normal',
    createdAt: Date.now(),
    modifiedAt: Date.now()
  };
}

/**
 * 序列化状态为JSON字符串
 * @param {Object} state - 状态对象
 * @returns {string} JSON字符串
 */
export function serializeState(state) {
  try {
    return JSON.stringify(state, null, 2);
  } catch (error) {
    console.error('Failed to serialize state:', error);
    throw new Error('State serialization failed');
  }
}

/**
 * 从JSON字符串反序列化状态
 * @param {string} serializedState - 序列化的状态字符串
 * @returns {Object} 状态对象
 */
export function deserializeState(serializedState) {
  try {
    const state = JSON.parse(serializedState);
    
    if (!validateImageEditorState(state)) {
      throw new Error('Invalid state structure');
    }
    
    return state;
  } catch (error) {
    console.error('Failed to deserialize state:', error);
    throw new Error('State deserialization failed');
  }
}

/**
 * 比较两个状态是否相等
 * @param {Object} state1 - 状态1
 * @param {Object} state2 - 状态2
 * @param {string[]} ignoreFields - 忽略的字段
 * @returns {boolean} 是否相等
 */
export function compareStates(state1, state2, ignoreFields = ['timestamp', 'metadata']) {
  const cleanState1 = { ...state1 };
  const cleanState2 = { ...state2 };
  
  // 移除忽略的字段
  ignoreFields.forEach(field => {
    delete cleanState1[field];
    delete cleanState2[field];
  });
  
  return JSON.stringify(cleanState1) === JSON.stringify(cleanState2);
}

/**
 * 获取状态差异
 * @param {Object} oldState - 旧状态
 * @param {Object} newState - 新状态
 * @returns {Object} 差异对象
 */
export function getStateDiff(oldState, newState) {
  const diff = {};
  
  function findDifferences(obj1, obj2, path = '') {
    for (const key in obj2) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj1)) {
        diff[currentPath] = { type: 'added', value: obj2[key] };
      } else if (obj1[key] !== obj2[key]) {
        if (typeof obj2[key] === 'object' && obj2[key] !== null && 
            typeof obj1[key] === 'object' && obj1[key] !== null) {
          findDifferences(obj1[key], obj2[key], currentPath);
        } else {
          diff[currentPath] = { 
            type: 'changed', 
            oldValue: obj1[key], 
            newValue: obj2[key] 
          };
        }
      }
    }
    
    for (const key in obj1) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!(key in obj2)) {
        diff[currentPath] = { type: 'removed', value: obj1[key] };
      }
    }
  }
  
  findDifferences(oldState, newState);
  return diff;
}

// ========== 辅助函数 ==========

/**
 * 生成唯一ID
 * @returns {string}
 */
function generateUniqueId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 从源URL获取文件类型
 * @param {string} src - 图像源URL
 * @returns {string}
 */
function getFileTypeFromSrc(src) {
  if (!src) return 'unknown';
  
  if (src.startsWith('data:')) {
    const match = src.match(/data:image\/([a-zA-Z0-9]+);/);
    return match ? match[1] : 'unknown';
  }
  
  const match = src.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  return match ? match[1].toLowerCase() : 'unknown';
}

/**
 * 深度合并对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 */
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

// 导出常量
export const SUPPORTED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
export const SUPPORTED_FILTER_TYPES = ['brightness', 'contrast', 'saturation', 'hue', 'grayscale', 'sepia', 'invert', 'blur', 'noise'];
export const SUPPORTED_OBJECT_TYPES = ['text', 'rect', 'circle', 'ellipse', 'triangle', 'line', 'path', 'image'];
export const SUPPORTED_BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion'];
