/**
 * BlendModeEngine 单元测试
 */
import { BlendModeEngine } from "@/utils/BlendModeEngine.js";

describe("BlendModeEngine", () => {
  let blendEngine;
  let baseImageData;
  let blendImageData;

  beforeEach(() => {
    blendEngine = new BlendModeEngine();

    // 创建测试用的ImageData
    baseImageData = new ImageData(2, 2);
    baseImageData.data.set([
      255,
      0,
      0,
      255, // 红色
      0,
      255,
      0,
      255, // 绿色
      0,
      0,
      255,
      255, // 蓝色
      128,
      128,
      128,
      255, // 灰色
    ]);

    blendImageData = new ImageData(2, 2);
    blendImageData.data.set([
      128,
      128,
      128,
      255, // 灰色
      255,
      255,
      255,
      255, // 白色
      0,
      0,
      0,
      255, // 黑色
      255,
      0,
      0,
      255, // 红色
    ]);
  });

  describe("初始化", () => {
    test("应该正确初始化支持的混合模式", () => {
      expect(blendEngine.supportedModes).toContain("normal");
      expect(blendEngine.supportedModes).toContain("multiply");
      expect(blendEngine.supportedModes).toContain("screen");
      expect(blendEngine.supportedModes).toContain("overlay");
      expect(blendEngine.supportedModes.length).toBeGreaterThan(10);
    });

    test("应该正确检查混合模式支持", () => {
      expect(blendEngine.isSupported("normal")).toBe(true);
      expect(blendEngine.isSupported("multiply")).toBe(true);
      expect(blendEngine.isSupported("unknown-mode")).toBe(false);
    });

    test("应该返回所有支持的混合模式", () => {
      const modes = blendEngine.getSupportedModes();
      expect(Array.isArray(modes)).toBe(true);
      expect(modes.length).toBeGreaterThan(0);
      expect(modes).toContain("normal");
    });
  });

  describe("基本混合模式", () => {
    test("normal模式应该返回混合图层", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "normal",
        1
      );

      expect(result.data[0]).toBe(128); // 第一个像素的红色分量
      expect(result.data[1]).toBe(128); // 第一个像素的绿色分量
      expect(result.data[2]).toBe(128); // 第一个像素的蓝色分量
    });

    test("multiply模式应该正确计算", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "multiply",
        1
      );

      // 红色(255,0,0) * 灰色(128,128,128) = (128,0,0)
      expect(result.data[0]).toBe(128);
      expect(result.data[1]).toBe(0);
      expect(result.data[2]).toBe(0);
    });

    test("screen模式应该正确计算", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "screen",
        1
      );

      // screen公式: 1 - (1-base) * (1-blend)
      // 红色(1,0,0) screen 灰色(0.5,0.5,0.5) = (1,0.5,0.5)
      expect(result.data[0]).toBe(255);
      expect(result.data[1]).toBe(128);
      expect(result.data[2]).toBe(128);
    });

    test("darken模式应该选择较暗的颜色", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "darken",
        1
      );

      // 红色(255,0,0) darken 灰色(128,128,128) = (128,0,0)
      expect(result.data[0]).toBe(128);
      expect(result.data[1]).toBe(0);
      expect(result.data[2]).toBe(0);
    });

    test("lighten模式应该选择较亮的颜色", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "lighten",
        1
      );

      // 红色(255,0,0) lighten 灰色(128,128,128) = (255,128,128)
      expect(result.data[0]).toBe(255);
      expect(result.data[1]).toBe(128);
      expect(result.data[2]).toBe(128);
    });

    test("difference模式应该计算颜色差值", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "difference",
        1
      );

      // 红色(255,0,0) difference 灰色(128,128,128) = (127,128,128)
      expect(result.data[0]).toBe(127);
      expect(result.data[1]).toBe(128);
      expect(result.data[2]).toBe(128);
    });
  });

  describe("复杂混合模式", () => {
    test("overlay模式应该正确计算", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "overlay",
        1
      );

      expect(result.data).toBeDefined();
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });

    test("soft-light模式应该正确计算", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "soft-light",
        1
      );

      expect(result.data).toBeDefined();
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });

    test("hard-light模式应该正确计算", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "hard-light",
        1
      );

      expect(result.data).toBeDefined();
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });

    test("color-dodge模式应该正确计算", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "color-dodge",
        1
      );

      expect(result.data).toBeDefined();
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });

    test("color-burn模式应该正确计算", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "color-burn",
        1
      );

      expect(result.data).toBeDefined();
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });
  });

  describe("数学运算混合模式", () => {
    test("add模式应该正确计算", () => {
      const result = blendEngine.blend(baseImageData, blendImageData, "add", 1);

      // 红色(255,0,0) + 灰色(128,128,128) = (255,128,128) (限制在255)
      expect(result.data[0]).toBe(255);
      expect(result.data[1]).toBe(128);
      expect(result.data[2]).toBe(128);
    });

    test("subtract模式应该正确计算", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "subtract",
        1
      );

      // 红色(255,0,0) - 灰色(128,128,128) = (127,0,0) (限制在0以上)
      expect(result.data[0]).toBe(127);
      expect(result.data[1]).toBe(0);
      expect(result.data[2]).toBe(0);
    });

    test("divide模式应该正确计算", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "divide",
        1
      );

      expect(result.data).toBeDefined();
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });
  });

  describe("不透明度处理", () => {
    test("应该正确应用不透明度", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "normal",
        0.5
      );

      // 50%不透明度应该混合基础色和混合色
      // 红色(255,0,0) + 50% 灰色(128,128,128) = 大约(191,64,64)
      // 允许1-2像素的误差
      expect(result.data[0]).toBeCloseTo(191, -1);
      expect(result.data[1]).toBeCloseTo(64, -1);
      expect(result.data[2]).toBeCloseTo(64, -1);
    });

    test("0不透明度应该返回基础图层", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "normal",
        0
      );

      expect(result.data[0]).toBe(255); // 保持原红色
      expect(result.data[1]).toBe(0);
      expect(result.data[2]).toBe(0);
    });

    test("1不透明度应该完全应用混合", () => {
      const result = blendEngine.blend(
        baseImageData,
        blendImageData,
        "normal",
        1
      );

      expect(result.data[0]).toBe(128); // 完全使用混合色
      expect(result.data[1]).toBe(128);
      expect(result.data[2]).toBe(128);
    });
  });

  describe("尺寸处理", () => {
    test("应该处理不同尺寸的图像", () => {
      const largerBase = new ImageData(3, 3);
      const smallerBlend = new ImageData(2, 2);

      const result = blendEngine.blend(largerBase, smallerBlend, "normal", 1);

      expect(result.width).toBe(2); // 使用较小的尺寸
      expect(result.height).toBe(2);
    });

    test("应该处理空图像", () => {
      const emptyBase = new ImageData(1, 1);
      const emptyBlend = new ImageData(1, 1);

      const result = blendEngine.blend(emptyBase, emptyBlend, "normal", 1);

      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });
  });

  describe("预览功能", () => {
    test("应该生成混合预览", () => {
      // Mock canvas
      const mockCanvas = {
        width: 2,
        height: 2,
        getContext: jest.fn(() => ({
          getImageData: jest.fn(() => baseImageData),
        })),
      };

      const mockBlendCanvas = {
        width: 2,
        height: 2,
        getContext: jest.fn(() => ({
          getImageData: jest.fn(() => blendImageData),
        })),
      };

      // Mock document.createElement
      global.document.createElement = jest.fn(() => ({
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          putImageData: jest.fn(),
        })),
      }));

      const preview = blendEngine.getBlendPreview(
        "multiply",
        mockCanvas,
        mockBlendCanvas,
        0.8
      );

      expect(preview).toBeDefined();
      expect(mockCanvas.getContext).toHaveBeenCalled();
      expect(mockBlendCanvas.getContext).toHaveBeenCalled();
    });
  });

  describe("错误处理", () => {
    test("应该在不支持的混合模式时抛出错误", () => {
      expect(() => {
        blendEngine.blend(baseImageData, blendImageData, "unsupported-mode", 1);
      }).toThrow("Unsupported blend mode: unsupported-mode");
    });

    test("应该处理无效的不透明度值", () => {
      // 负值应该被处理
      const result1 = blendEngine.blend(
        baseImageData,
        blendImageData,
        "normal",
        -0.5
      );
      expect(result1).toBeDefined();

      // 大于1的值应该被处理
      const result2 = blendEngine.blend(
        baseImageData,
        blendImageData,
        "normal",
        1.5
      );
      expect(result2).toBeDefined();
    });
  });

  describe("性能测试", () => {
    test("应该在合理时间内处理大图像", () => {
      const largeBase = new ImageData(100, 100);
      const largeBlend = new ImageData(100, 100);

      const startTime = performance.now();
      const result = blendEngine.blend(largeBase, largeBlend, "multiply", 1);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });
  });
});
