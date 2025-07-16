import { fabric } from 'fabric';
import Konva from 'konva';

/**
 * 适配器工厂类
 * 负责创建和管理不同类型的图像编辑适配器
 */
class AdapterFactory {
  constructor() {
    this.adapterCache = new Map();
    this.loadedLibraries = new Set();

    // 确保库在全局可用
    this._setupGlobalLibraries();
  }

  /**
   * 创建适配器实例
   * @param {string} type - 适配器类型
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 初始化选项
   * @returns {Promise<BaseImageEditorAdapter>}
   */
  async createAdapter(type, container, options = {}) {
    const adapterType = type.toLowerCase();

    // 检查是否需要加载库
    await this.ensureLibraryLoaded(adapterType);

    // 创建适配器实例
    const adapter = await this._instantiateAdapter(adapterType);

    // 初始化适配器
    await adapter.initialize(container, options);

    return adapter;
  }

  /**
   * 设置全局库引用
   * @private
   */
  _setupGlobalLibraries() {
    // 确保Fabric.js在全局可用
    if (fabric && !window.fabric) {
      window.fabric = fabric;
    }

    // 确保Konva在全局可用
    if (Konva && !window.Konva) {
      window.Konva = Konva;
    }
  }

  /**
   * 确保库已加载
   * @param {string} adapterType - 适配器类型
   * @returns {Promise<void>}
   */
  async ensureLibraryLoaded(adapterType) {
    if (this.loadedLibraries.has(adapterType)) {
      return;
    }

    switch (adapterType) {
      case 'fabric':
        if (!window.fabric) {
          // 如果npm包没有正确加载，回退到CDN
          await this._loadScript('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js');
        }
        break;

      case 'konva':
        if (!window.Konva) {
          // 如果npm包没有正确加载，回退到CDN
          await this._loadScript('https://unpkg.com/konva@9.2.0/konva.min.js');
        }
        break;

      case 'cropper':
        if (!window.Cropper) {
          await Promise.all([
            this._loadScript('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js'),
            this._loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css')
          ]);
        }
        break;

      case 'tui':
        // TUI Image Editor is imported as npm package in TuiAdapter
        // No need to load from CDN
        console.log('TUI Image Editor will be loaded via npm import in TuiAdapter');
        break;

      case 'jimp':
        if (!window.Jimp) {
          await this._loadScript('https://cdn.jsdelivr.net/npm/jimp@0.22.10/browser/lib/jimp.min.js');
        }
        break;

      default:
        throw new Error(`Unsupported adapter type: ${adapterType}`);
    }

    this.loadedLibraries.add(adapterType);
  }

  /**
   * 实例化适配器
   * @param {string} adapterType - 适配器类型
   * @returns {Promise<BaseImageEditorAdapter>}
   * @private
   */
  async _instantiateAdapter(adapterType) {
    switch (adapterType) {
      case 'fabric':
        const FabricAdapter = (await import('./FabricAdapter.js')).default;
        return new FabricAdapter();
        
      case 'konva':
        const KonvaAdapter = (await import('./KonvaAdapter.js')).default;
        return new KonvaAdapter();
        
      case 'cropper':
        const CropperAdapter = (await import('./CropperAdapter.js')).default;
        return new CropperAdapter();
        
      case 'tui':
        const TuiAdapter = (await import('./TuiAdapter.js')).default;
        return new TuiAdapter();
        
      case 'jimp':
        const JimpAdapter = (await import('./JimpAdapter.js')).default;
        return new JimpAdapter();
        
      default:
        throw new Error(`Unsupported adapter type: ${adapterType}`);
    }
  }

  /**
   * 加载脚本
   * @param {string} url - 脚本URL
   * @returns {Promise<void>}
   * @private
   */
  _loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (error) => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  /**
   * 加载样式表
   * @param {string} url - 样式表URL
   * @returns {Promise<void>}
   * @private
   */
  _loadStylesheet(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = (error) => reject(new Error(`Failed to load stylesheet: ${url}`));
      document.head.appendChild(link);
    });
  }

  /**
   * 等待TUI库完全加载
   * @returns {Promise<void>}
   * @private
   */
  async _waitForTuiLibrary() {
    const maxAttempts = 50; // 最多等待5秒
    const interval = 100; // 每100ms检查一次

    for (let i = 0; i < maxAttempts; i++) {
      if (window.tui &&
          window.tui.ImageEditor &&
          typeof window.tui.ImageEditor === 'function') {
        console.log('TUI Image Editor library loaded successfully');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('TUI Image Editor library failed to load within timeout period');
  }
}

// 创建单例实例
const adapterFactory = new AdapterFactory();

export default adapterFactory;
