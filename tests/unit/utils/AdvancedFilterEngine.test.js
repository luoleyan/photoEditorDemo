/**
 * AdvancedFilterEngine 简化测试 - 稳定版本
 */
import { AdvancedFilterEngine } from "@/utils/AdvancedFilterEngine.js";

describe("AdvancedFilterEngine - 稳定测试", () => {
  let filterEngine;
  let testImageData;

  beforeEach(() => {
    filterEngine = new AdvancedFilterEngine();

    // 创建测试用的ImageData (3x3像素)
    testImageData = new ImageData(3, 3);

    // 填充测试数据
    for (let i = 0; i < testImageData.data.length; i += 4) {
      testImageData.data[i] = 100; // R
      testImageData.data[i + 1] = 150; // G
      testImageData.data[i + 2] = 200; // B
      testImageData.data[i + 3] = 255; // A
    }
  });

  describe("初始化", () => {
    test("应该正确初始化", () => {
      expect(filterEngine).toBeDefined();
      expect(filterEngine.getAvailableFilters).toBeDefined();
      expect(filterEngine.applyFilter).toBeDefined();
    });

    test("应该返回可用滤镜列表", () => {
      const filters = filterEngine.getAvailableFilters();
      expect(Array.isArray(filters)).toBe(true);
      expect(filters.length).toBeGreaterThan(0);
    });
  });

  describe("基本滤镜功能", () => {
    test("应该正确应用边缘检测", () => {
      const result = filterEngine.applyFilter(testImageData, "edge-detection");
      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(testImageData.width);
      expect(result.height).toBe(testImageData.height);
    });

    test("应该正确应用浮雕效果", () => {
      const result = filterEngine.applyFilter(testImageData, "emboss");
      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(testImageData.width);
      expect(result.height).toBe(testImageData.height);
    });

    test("应该正确应用马赛克效果", () => {
      const result = filterEngine.applyFilter(testImageData, "mosaic", {
        blockSize: 2,
      });
      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(testImageData.width);
      expect(result.height).toBe(testImageData.height);
    });

    test("应该正确应用HDR色调映射", () => {
      const result = filterEngine.applyFilter(
        testImageData,
        "hdr-tone-mapping",
        {
          exposure: 1,
          gamma: 1,
          highlights: 0,
          shadows: 0,
        }
      );
      expect(result).toBeInstanceOf(ImageData);
    });

    test("应该正确应用油画效果", () => {
      const result = filterEngine.applyFilter(testImageData, "oil-painting", {
        radius: 1,
        intensity: 2,
      });
      expect(result).toBeInstanceOf(ImageData);
    });
  });

  describe("参数处理", () => {
    test("应该处理默认参数", () => {
      const result = filterEngine.applyFilter(testImageData, "edge-detection");
      expect(result).toBeInstanceOf(ImageData);
    });

    test("应该处理自定义参数", () => {
      const result = filterEngine.applyFilter(testImageData, "mosaic", {
        blockSize: 1,
      });
      expect(result).toBeInstanceOf(ImageData);
    });
  });

  describe("错误处理", () => {
    test("应该处理无效滤镜名称", () => {
      expect(() => {
        filterEngine.applyFilter(testImageData, "invalid-filter");
      }).toThrow();
    });

    test("应该处理空图像数据", () => {
      expect(() => {
        filterEngine.applyFilter(null, "edge-detection");
      }).toThrow();
    });
  });

  describe("性能测试", () => {
    test("应该在合理时间内处理滤镜", () => {
      const startTime = performance.now();
      const result = filterEngine.applyFilter(testImageData, "edge-detection");
      const endTime = performance.now();

      expect(result).toBeInstanceOf(ImageData);
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });

    test("应该处理复杂滤镜", () => {
      const startTime = performance.now();
      const result = filterEngine.applyFilter(testImageData, "oil-painting", {
        radius: 1,
        intensity: 2,
      });
      const endTime = performance.now();

      expect(result).toBeInstanceOf(ImageData);
      expect(endTime - startTime).toBeLessThan(200); // 应该在200ms内完成
    });
  });
});
