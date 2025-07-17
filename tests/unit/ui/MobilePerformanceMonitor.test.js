/**
 * MobilePerformanceMonitor 单元测试
 */
import { shallowMount } from "@vue/test-utils";
import MobilePerformanceMonitor from "@/components/ui/MobilePerformanceMonitor.vue";

// Mock navigator APIs
Object.defineProperty(navigator, "hardwareConcurrency", {
  writable: true,
  value: 4,
});

Object.defineProperty(navigator, "deviceMemory", {
  writable: true,
  value: 4,
});

Object.defineProperty(navigator, "connection", {
  writable: true,
  value: {
    effectiveType: "4g",
    addEventListener: jest.fn(),
  },
});

Object.defineProperty(navigator, "getBattery", {
  writable: true,
  value: jest.fn(() =>
    Promise.resolve({
      level: 0.8,
      addEventListener: jest.fn(),
    })
  ),
});

Object.defineProperty(navigator, "vibrate", {
  writable: true,
  value: jest.fn(),
});

// Mock performance API
Object.defineProperty(performance, "memory", {
  writable: true,
  value: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024,
  },
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));

describe("MobilePerformanceMonitor", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(MobilePerformanceMonitor);
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
    }
  });

  describe("初始化", () => {
    test("应该正确渲染组件", () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find(".mobile-performance-monitor").exists()).toBe(false); // 默认隐藏
    });

    test("应该正确初始化设备信息", () => {
      expect(wrapper.vm.deviceInfo.hardwareConcurrency).toBe(4);
      expect(wrapper.vm.deviceInfo.deviceMemory).toBe(4);
      expect(wrapper.vm.networkType).toBe("4g");
    });

    test("应该正确检测电池状态", async () => {
      // 手动触发电池检测逻辑
      if (navigator.getBattery) {
        await navigator.getBattery();
      }
      await wrapper.vm.$nextTick();

      // 验证电池状态被设置
      expect(wrapper.vm.batteryLevel).toBeDefined();
      expect(typeof wrapper.vm.batteryLevel).toBe("number");
    });

    test("应该开始性能监控", () => {
      expect(wrapper.vm.isMonitoring).toBe(true);
      expect(wrapper.vm.monitoringInterval).toBeTruthy();
    });
  });

  describe("性能指标更新", () => {
    test("应该更新内存使用", () => {
      wrapper.vm.updateMemoryUsage();

      expect(wrapper.vm.memoryUsage).toBe(50 * 1024 * 1024);
    });

    test("应该记录性能历史", () => {
      wrapper.vm.currentFPS = 45;
      wrapper.vm.memoryUsage = 60 * 1024 * 1024;
      wrapper.vm.batteryLevel = 75;

      wrapper.vm.recordPerformanceHistory();

      expect(wrapper.vm.performanceHistory.fps.length).toBe(1);
      expect(wrapper.vm.performanceHistory.memory.length).toBe(1);
      expect(wrapper.vm.performanceHistory.battery.length).toBe(1);

      expect(wrapper.vm.performanceHistory.fps[0].value).toBe(45);
    });

    test("应该限制历史记录数量", () => {
      // 清空现有记录
      wrapper.vm.performanceHistory.fps = [];

      // 添加60个记录
      for (let i = 0; i < 60; i++) {
        wrapper.vm.performanceHistory.fps.push({
          value: i,
          timestamp: Date.now(),
        });
      }

      // 再添加一个记录，应该触发限制逻辑
      wrapper.vm.recordPerformanceHistory();

      // 应该保持在61个记录（60个旧的 + 1个新的，然后删除1个最旧的）
      expect(wrapper.vm.performanceHistory.fps.length).toBe(60);
    });
  });

  describe("性能阈值检查", () => {
    test("应该检测低FPS", () => {
      wrapper.vm.currentFPS = 25; // 低于30fps阈值
      wrapper.vm.checkPerformanceThresholds();

      const lowFpsSuggestion = wrapper.vm.optimizationSuggestions.find(
        (s) => s.id === "low-fps"
      );
      expect(lowFpsSuggestion).toBeTruthy();
      expect(lowFpsSuggestion.text).toContain("帧率较低");
    });

    test("应该检测高内存使用", () => {
      wrapper.vm.memoryUsage = 3.5 * 1024 * 1024 * 1024; // 3.5GB，超过80%阈值
      wrapper.vm.checkPerformanceThresholds();

      const highMemorySuggestion = wrapper.vm.optimizationSuggestions.find(
        (s) => s.id === "high-memory"
      );
      expect(highMemorySuggestion).toBeTruthy();
      expect(highMemorySuggestion.text).toContain("内存使用过高");
    });

    test("应该检测低电量", () => {
      wrapper.vm.batteryLevel = 15; // 低于20%阈值
      wrapper.vm.checkPerformanceThresholds();

      const lowBatterySuggestion = wrapper.vm.optimizationSuggestions.find(
        (s) => s.id === "low-battery"
      );
      expect(lowBatterySuggestion).toBeTruthy();
      expect(lowBatterySuggestion.text).toContain("电量较低");
    });

    test("应该检测慢网络", () => {
      wrapper.vm.networkType = "2g";
      wrapper.vm.checkPerformanceThresholds();

      const slowNetworkSuggestion = wrapper.vm.optimizationSuggestions.find(
        (s) => s.id === "slow-network"
      );
      expect(slowNetworkSuggestion).toBeTruthy();
      expect(slowNetworkSuggestion.text).toContain("网络较慢");
    });

    test("应该在多个问题时显示性能警告", () => {
      wrapper.vm.currentFPS = 25;
      wrapper.vm.memoryUsage = 3.5 * 1024 * 1024 * 1024;
      wrapper.vm.batteryLevel = 15;

      wrapper.vm.checkPerformanceThresholds();

      expect(wrapper.vm.optimizationSuggestions.length).toBe(3);
      expect(wrapper.vm.showPerformanceWarning).toBe(true);
      expect(wrapper.vm.performanceWarning.message).toContain("多个性能问题");
    });
  });

  describe("优化建议应用", () => {
    test("应该应用降低质量建议", () => {
      const suggestion = { id: "low-fps", action: "reduceQuality" };

      wrapper.vm.applySuggestion(suggestion);

      expect(wrapper.emitted("reduce-quality")).toBeTruthy();
      expect(wrapper.vm.optimizationSuggestions).not.toContain(suggestion);
    });

    test("应该应用清理缓存建议", () => {
      const suggestion = { id: "high-memory", action: "clearCache" };

      wrapper.vm.applySuggestion(suggestion);

      expect(wrapper.emitted("cache-cleared")).toBeTruthy();
    });

    test("应该应用省电模式建议", () => {
      const suggestion = { id: "low-battery", action: "enablePowerSaving" };

      wrapper.vm.applySuggestion(suggestion);

      expect(wrapper.emitted("enable-power-saving")).toBeTruthy();
    });

    test("应该应用离线模式建议", () => {
      const suggestion = { id: "slow-network", action: "enableOfflineMode" };

      wrapper.vm.applySuggestion(suggestion);

      expect(wrapper.emitted("enable-offline-mode")).toBeTruthy();
    });
  });

  describe("快速操作", () => {
    test("应该清理缓存", () => {
      wrapper.vm.clearCache();

      expect(wrapper.emitted("cache-cleared")).toBeTruthy();
    });

    test("应该优化内存", () => {
      wrapper.vm.optimizeMemory();

      expect(wrapper.emitted("memory-optimized")).toBeTruthy();
    });

    test("应该启用省电模式", () => {
      wrapper.vm.enablePowerSaving();

      expect(wrapper.emitted("enable-power-saving")).toBeTruthy();
    });
  });

  describe("设备能力检测", () => {
    test("应该检测低端设备", () => {
      wrapper.vm.deviceInfo.hardwareConcurrency = 2;
      wrapper.vm.deviceInfo.deviceMemory = 2;

      wrapper.vm.detectDeviceCapabilities();

      expect(wrapper.emitted("low-end-device-detected")).toBeTruthy();
    });

    test("应该不检测高端设备为低端", () => {
      wrapper.vm.deviceInfo.hardwareConcurrency = 8;
      wrapper.vm.deviceInfo.deviceMemory = 8;

      wrapper.vm.detectDeviceCapabilities();

      expect(wrapper.emitted("low-end-device-detected")).toBeFalsy();
    });
  });

  describe("性能图表", () => {
    test("应该更新性能图表", () => {
      // Mock canvas context
      const mockCtx = {
        clearRect: jest.fn(),
        strokeStyle: "",
        lineWidth: 0,
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
      };

      const mockCanvas = {
        getContext: jest.fn(() => mockCtx),
        width: 300,
        height: 100,
      };

      wrapper.vm.$refs.performanceChart = mockCanvas;

      // 添加一些历史数据
      wrapper.vm.performanceHistory.fps = [
        { value: 60, timestamp: Date.now() - 2000 },
        { value: 45, timestamp: Date.now() - 1000 },
        { value: 30, timestamp: Date.now() },
      ];

      wrapper.vm.updatePerformanceChart();

      expect(mockCtx.clearRect).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    test("应该处理没有canvas引用的情况", () => {
      wrapper.vm.$refs.performanceChart = null;

      // 不应该抛出错误
      expect(() => wrapper.vm.updatePerformanceChart()).not.toThrow();
    });
  });

  describe("样式类方法", () => {
    test("应该返回正确的FPS样式类", () => {
      wrapper.vm.currentFPS = 60;
      expect(wrapper.vm.getFPSClass()).toBe("metric-good");

      wrapper.vm.currentFPS = 25;
      expect(wrapper.vm.getFPSClass()).toBe("metric-warning");
    });

    test("应该返回正确的内存样式类", () => {
      wrapper.vm.memoryUsage = 1 * 1024 * 1024 * 1024; // 1GB
      expect(wrapper.vm.getMemoryClass()).toBe("metric-good");

      wrapper.vm.memoryUsage = 3.5 * 1024 * 1024 * 1024; // 3.5GB
      expect(wrapper.vm.getMemoryClass()).toBe("metric-warning");
    });

    test("应该返回正确的电池样式类", () => {
      wrapper.vm.batteryLevel = 50;
      expect(wrapper.vm.getBatteryClass()).toBe("metric-good");

      wrapper.vm.batteryLevel = 15;
      expect(wrapper.vm.getBatteryClass()).toBe("metric-warning");
    });

    test("应该返回正确的网络样式类", () => {
      wrapper.vm.networkType = "4g";
      expect(wrapper.vm.getNetworkClass()).toBe("metric-good");

      wrapper.vm.networkType = "2g";
      expect(wrapper.vm.getNetworkClass()).toBe("metric-warning");
    });
  });

  describe("内存格式化", () => {
    test("应该正确格式化MB", () => {
      const result = wrapper.vm.formatMemory(500 * 1024 * 1024);
      expect(result).toBe("500.0MB");
    });

    test("应该正确格式化GB", () => {
      const result = wrapper.vm.formatMemory(2.5 * 1024 * 1024 * 1024);
      expect(result).toBe("2.5GB");
    });

    test("应该正确格式化小于1MB的值", () => {
      const result = wrapper.vm.formatMemory(0.5 * 1024 * 1024);
      expect(result).toBe("0.5MB");
    });
  });

  describe("监控器显示控制", () => {
    test("应该显示监控器", () => {
      wrapper.vm.showMonitorPanel();
      expect(wrapper.vm.$data.showMonitor).toBe(true);
    });

    test("应该隐藏监控器", () => {
      wrapper.vm.showMonitor = true;
      wrapper.vm.hideMonitor();
      expect(wrapper.vm.showMonitor).toBe(false);
    });

    test("应该处理性能警告", () => {
      wrapper.vm.showPerformanceWarning = true;
      wrapper.vm.handlePerformanceWarning();

      expect(wrapper.vm.showPerformanceWarning).toBe(false);
      expect(wrapper.vm.showMonitor).toBe(true);
    });
  });

  describe("生命周期", () => {
    test("应该在销毁时停止监控", () => {
      const stopMonitoringSpy = jest.spyOn(wrapper.vm, "stopMonitoring");

      wrapper.destroy();

      expect(stopMonitoringSpy).toHaveBeenCalled();
    });

    test("应该正确停止监控", () => {
      wrapper.vm.stopMonitoring();

      expect(wrapper.vm.isMonitoring).toBe(false);
      expect(wrapper.vm.monitoringInterval).toBeNull();
    });
  });
});
