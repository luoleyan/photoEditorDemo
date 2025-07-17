/**
 * JimpAdapter 单元测试
 */
import JimpAdapter from "@/components/adapters/JimpAdapter.js";

// Mock Jimp
const mockJimpInstance = {
  getWidth: jest.fn().mockReturnValue(800),
  getHeight: jest.fn().mockReturnValue(600),
  brightness: jest.fn().mockReturnThis(),
  contrast: jest.fn().mockReturnThis(),
  greyscale: jest.fn().mockReturnThis(),
  sepia: jest.fn().mockReturnThis(),
  blur: jest.fn().mockReturnThis(),
  invert: jest.fn().mockReturnThis(),
  posterize: jest.fn().mockReturnThis(),
  pixelate: jest.fn().mockReturnThis(),
  dither565: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  rotate: jest.fn().mockReturnThis(),
  flip: jest.fn().mockReturnThis(),
  crop: jest.fn().mockReturnThis(),
  getBufferAsync: jest.fn().mockResolvedValue(Buffer.from("mock-buffer")),
  bitmap: {
    data: new Uint8Array(800 * 600 * 4).fill(255),
    width: 800,
    height: 600,
  },
};

// Mock window.Jimp
global.window = global.window || {};
global.window.Jimp = {
  read: jest.fn().mockResolvedValue(mockJimpInstance),
  create: jest.fn().mockResolvedValue(mockJimpInstance),
  MIME_PNG: "image/png",
  MIME_JPEG: "image/jpeg",
};

// Mock Canvas API
const mockCanvas = {
  getContext: jest.fn().mockReturnValue({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    drawImage: jest.fn(),
    putImageData: jest.fn(),
    fillStyle: "#ffffff",
  }),
  width: 800,
  height: 600,
  style: {},
};

global.document.createElement = jest.fn().mockImplementation((tagName) => {
  if (tagName === "canvas") {
    return mockCanvas;
  }
  return {
    style: {},
    appendChild: jest.fn(),
    remove: jest.fn(),
    parentNode: {
      removeChild: jest.fn(),
    },
  };
});

// Mock ImageData
global.ImageData = class {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
};

describe("JimpAdapter", () => {
  let adapter;
  let container;

  beforeEach(() => {
    adapter = new JimpAdapter();
    container = document.createElement("div");
    container.id = "test-container";

    // 重置所有mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (adapter.isInitialized) {
      adapter.destroy();
    }
  });

  describe("初始化", () => {
    test("应该正确初始化适配器", async () => {
      await adapter.initialize(container);

      expect(adapter.isInitialized).toBe(true);
      expect(adapter.adapterType).toBe("jimp");
      expect(adapter.canvas).toBeDefined();
      expect(adapter.ctx).toBeDefined();
    });

    test("应该在Jimp库未加载时抛出错误", async () => {
      delete global.window.Jimp;

      await expect(adapter.initialize(container)).rejects.toThrow(
        "Jimp library is not loaded"
      );
    });
  });

  describe("图像加载", () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test("应该正确加载图像", async () => {
      const imageData = { src: "test-image.jpg", type: "url" };

      await adapter.loadImage(imageData.src);

      expect(window.Jimp.read).toHaveBeenCalledWith("test-image.jpg");
      expect(adapter.jimpInstance).toBe(mockJimpInstance);
      expect(adapter.originalImageData).toEqual({
        src: "test-image.jpg",
        type: "url",
        timestamp: expect.any(Number),
        width: 800,
        height: 600,
      });
    });

    test("应该在图像加载失败时抛出错误", async () => {
      window.Jimp.read.mockRejectedValueOnce(new Error("Load failed"));

      await expect(adapter.loadImage("invalid-image.jpg")).rejects.toThrow();
    });
  });

  describe("图像调整功能", () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage("test-image.jpg");
    });

    test("应该正确设置亮度", async () => {
      await adapter.setBrightness(0.5);

      expect(mockJimpInstance.brightness).toHaveBeenCalledWith(0.5);
      expect(adapter.appliedOperations).toContainEqual({
        type: "brightness",
        params: { value: 0.5 },
        timestamp: expect.any(Number),
      });
    });

    test("应该正确设置对比度", async () => {
      await adapter.setContrast(0.3);

      expect(mockJimpInstance.contrast).toHaveBeenCalledWith(0.3);
      expect(adapter.appliedOperations).toContainEqual({
        type: "contrast",
        params: { value: 0.3 },
        timestamp: expect.any(Number),
      });
    });

    test("应该限制亮度值在有效范围内", async () => {
      await adapter.setBrightness(2.0); // 超出范围

      expect(mockJimpInstance.brightness).toHaveBeenCalledWith(1); // 应该被限制为1
    });

    test("应该限制对比度值在有效范围内", async () => {
      await adapter.setContrast(-2.0); // 超出范围

      expect(mockJimpInstance.contrast).toHaveBeenCalledWith(-1); // 应该被限制为-1
    });
  });

  describe("滤镜功能", () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage("test-image.jpg");
    });

    test("应该正确应用灰度滤镜", async () => {
      await adapter.applyFilter("grayscale");

      expect(mockJimpInstance.greyscale).toHaveBeenCalled();
    });

    test("应该正确应用模糊滤镜", async () => {
      await adapter.applyFilter("blur", { radius: 10 });

      expect(mockJimpInstance.blur).toHaveBeenCalledWith(10);
    });

    test("应该正确应用棕褐色滤镜", async () => {
      await adapter.applyFilter("sepia");

      expect(mockJimpInstance.sepia).toHaveBeenCalled();
    });

    test("应该正确应用反色滤镜", async () => {
      await adapter.applyFilter("invert");

      expect(mockJimpInstance.invert).toHaveBeenCalled();
    });

    test("应该处理不支持的滤镜类型", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await adapter.applyFilter("unsupported-filter");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unsupported filter type")
      );

      consoleSpy.mockRestore();
    });

    test("应该正确移除滤镜", async () => {
      // 先应用滤镜
      await adapter.applyFilter("grayscale");
      expect(adapter.appliedOperations).toHaveLength(1);

      // 移除滤镜
      await adapter.removeFilter("grayscale");

      // 操作历史中应该不再包含灰度滤镜
      const grayscaleOps = adapter.appliedOperations.filter(
        (op) => op.type === "filter" && op.params.type === "grayscale"
      );
      expect(grayscaleOps).toHaveLength(0);
    });
  });

  describe("状态管理", () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage("test-image.jpg");
    });

    test("应该正确保存状态", () => {
      const stateId = adapter.saveState();

      expect(stateId).toBeDefined();
      expect(adapter.stateHistory.has(stateId)).toBe(true);
    });

    test("应该正确恢复状态", async () => {
      const stateId = adapter.saveState();

      await adapter.restoreState(stateId);

      expect(window.Jimp.create).toHaveBeenCalled();
    });

    test("应该在状态不存在时抛出错误", async () => {
      await expect(adapter.restoreState("non-existent")).rejects.toThrow(
        "State not found: non-existent"
      );
    });
  });

  describe("导出功能", () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage("test-image.jpg");
    });

    test("应该正确导出为DataURL", async () => {
      const dataURL = await adapter.toDataURL("image/png", 0.9);

      expect(dataURL).toContain("data:image/png;base64,");
    });

    test("应该正确导出为Blob", async () => {
      const blob = await adapter.toBlob("image/jpeg", 0.8);

      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe("销毁", () => {
    test("应该正确销毁适配器", async () => {
      await adapter.initialize(container);

      adapter.destroy();

      expect(adapter.isInitialized).toBe(false);
      expect(adapter.jimpInstance).toBeNull();
      expect(adapter.canvas).toBeNull();
    });
  });
});
