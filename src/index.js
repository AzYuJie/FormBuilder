/**
 * FormBuilder SDK
 * 一个功能强大的表单构建器SDK，支持设计模式和运行模式
 */

// 导入样式
import './styles/main.css';

// 导入核心模块
import DesignMode from './core/design-mode';
import RuntimeMode from './core/runtime-mode';
import { validateConfig } from './utils/validators';

/**
 * FormBuilder SDK 主类
 */
class FormBuilder {
  constructor() {
    this.instance = null;
    this.mode = null;
    this.config = null;
  }

  /**
 * 初始化 FormBuilder SDK
 * @param {Object} config - 配置对象
 * @param {string|HTMLElement} config.element - 容器元素或选择器
 * @param {string} config.mode - 模式：'design' 或 'runtime'
 * @param {Object} [config.data] - 表单数据（设计模式可选，运行模式必须）
 * @param {Function} [config.onSave] - 设计模式下保存回调
 * @param {Function} [config.onSubmit] - 运行模式下提交回调
 * @param {string} [config.widthMode] - 运行模式下表单宽度模式：'min'(最小宽度)、'auto'(自动宽度)或'fixed'(固定宽度)，默认为'auto'
 * @param {string} [config.fixedWidth] - 运行模式下固定宽度值，例如'800px'，仅在widthMode为'fixed'时有效
 * @param {string} [config.minWidth] - 运行模式下最小宽度值，例如'320px'，默认为'320px'
 * @param {boolean} [config.debug] - 调试模式，默认为 true。设为 false 时，设计态不显示最终的数据结构JSON，运行态不显示点击保存后的JSON
 * @returns {FormBuilder} FormBuilder 实例
 */
  init(config) {
    // 验证配置
    const validationResult = validateConfig(config);
    if (!validationResult.valid) {
      console.error('FormBuilder 初始化失败:', validationResult.errors);
      return this;
    }

    // 设置默认调试模式
    if (config.debug === undefined) {
      config.debug = true; // 默认开启调试模式
    }

    // 保存配置
    this.config = config;
    this.mode = config.mode;

    // 清理之前的实例
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }

    // 根据模式创建实例
    if (this.mode === 'design') {
      this.instance = new DesignMode(config);
    } else if (this.mode === 'runtime') {
      this.instance = new RuntimeMode(config);
    }

    return this;
  }

  /**
   * 保存设计配置
   * @returns {Object|null} 表单设计JSON或null
   */
  saveDesign() {
    if (!this.instance) {
      console.warn('FormBuilder 实例未初始化');
      return null;
    }
    
    // 检查实例是否有saveDesign方法
    if (typeof this.instance.saveDesign !== 'function') {
      console.warn('当前模式不支持saveDesign方法');
      return null;
    }
    
    return this.instance.saveDesign();
  }

  /**
   * 提交表单（仅运行模式）
   * @returns {Object|null} 表单数据或null
   */
  submitForm() {
    if (this.mode !== 'runtime' || !this.instance) {
      console.warn('submitForm 方法仅在运行模式下可用');
      return null;
    }
    
    return this.instance.submitForm();
  }

  /**
   * 获取当前表单数据
   * @returns {Object|null} 表单数据或null
   */
  getData() {
    if (!this.instance) {
      return null;
    }
    
    return this.instance.getData();
  }

  /**
   * 设置表单数据
   * @param {Object} data - 表单数据
   * @returns {FormBuilder} FormBuilder 实例
   */
  setData(data) {
    if (!this.instance) {
      console.warn('FormBuilder 实例未初始化');
      return this;
    }
    
    this.instance.setData(data);
    return this;
  }

  /**
   * 销毁实例
   */
  destroy() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
    
    this.config = null;
    this.mode = null;
  }
}

// 创建单例实例
const formBuilderInstance = new FormBuilder();

// 导出单例实例作为默认导出
export default formBuilderInstance;