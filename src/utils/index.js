/**
 * 统一工具函数出口
 */

// 导出所有模块化工具函数
export * from './time.js';
export * from './device.js';
export * from './dom.js';
export * from './storage.js';
export * from './ui-feedback.js';
export * from './AnimationTimer.js';
export * from './PerformanceMonitor.js';

// 保留以兼容旧版 Utils 对象的导入 (有些模块可能需要解构或直接作为 Utils 使用)
import * as timeUtils from './time.js';
import * as deviceUtils from './device.js';
import * as domUtils from './dom.js';
import * as storageUtils from './storage.js';
import * as uiFeedbackUtils from './ui-feedback.js';

export const Utils = {
    ...timeUtils,
    ...deviceUtils,
    ...domUtils,
    ...storageUtils,
    ...uiFeedbackUtils
};