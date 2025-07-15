module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',

  // 模块文件扩展名
  moduleFileExtensions: [
    'js',
    'json',
    'vue'
  ],

  // 模块名映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // 转换配置
  transform: {
    '^.+\\.vue$': '@vue/vue2-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    '^.+\\.jsx?$': 'babel-jest'
  },

  // 转换忽略模式
  transformIgnorePatterns: [
    '/node_modules/(?!(fabric|konva)/)'
  ],

  // 测试文件匹配模式
  testMatch: [
    '**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)',
    '**/tests/unit/**/*.test.(js|jsx|ts|tsx)'
  ],

  // 测试URL
  testURL: 'http://localhost/',

  // 收集覆盖率的文件
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js',
    '!src/router/index.js',
    '!**/node_modules/**'
  ],

  // 覆盖率报告目录
  coverageDirectory: 'coverage',

  // 覆盖率报告格式
  coverageReporters: [
    'html',
    'text',
    'text-summary',
    'lcov'
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 全局变量
  globals: {
    'vue-jest': {
      babelConfig: true
    }
  },



  // 测试超时
  testTimeout: 10000,

  // 详细输出
  verbose: true,

  // 清除模拟
  clearMocks: true,

  // 恢复模拟
  restoreMocks: true
};
