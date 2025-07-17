/**
 * 示例测试文件 - 验证测试环境配置
 */

describe("测试环境验证", () => {
  test("Jest 基础功能正常", () => {
    expect(1 + 1).toBe(2);
  });

  test("异步测试支持", async () => {
    const result = await Promise.resolve("success");
    expect(result).toBe("success");
  });

  test("Mock 功能正常", () => {
    const mockFn = jest.fn();
    mockFn("test");
    expect(mockFn).toHaveBeenCalledWith("test");
  });

  test("DOM 环境可用", () => {
    const element = document.createElement("div");
    element.textContent = "Hello World";
    expect(element.textContent).toBe("Hello World");
  });

  test("Canvas API Mock 可用", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    expect(ctx).toBeDefined();
    expect(typeof ctx.fillRect).toBe("function");
  });

  test("全局对象 Mock 可用", () => {
    expect(global.Image).toBeDefined();
    expect(global.FileReader).toBeDefined();
    expect(global.localStorage).toBeDefined();
  });
});
