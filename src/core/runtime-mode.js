/**
 * 运行模式核心实现
 */

import { getElement, createElement, clearElement, appendChildren, addEvent, setStyles } from '../utils/dom';
import { deepClone, formatDate } from '../utils/helpers';
import { validateFormData, validateDesignData } from '../utils/validators';
import { FIELD_TYPES } from '../components/field-types';

/**
 * 运行模式类
 */
export default class RuntimeMode {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   */
  constructor(config) {
    this.config = config;
    this.container = null;
    this.runtimeContainer = null;
    this.formGrid = null;
    this.submitButton = null;
    
    // 表单设计数据
    this.designData = null;
    
    // 表单填写数据
    this.formData = {};
    
    // 字段错误信息
    this.fieldErrors = {};
    
    // 表单宽度设置（将从设计数据中获取）
    this.widthMode = 'auto';
    this.fixedWidth = '800px';
    this.minWidth = '320px';
    
    // 事件清理函数集合
    this.cleanupFunctions = [];
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化运行模式
   */
  init() {
    // 获取容器元素
    this.container = getElement(this.config.element);
    if (!this.container) {
      console.error('无法找到容器元素');
      return;
    }
    
    // 添加基础类名
    this.container.classList.add('fb-container');
    
    // 验证设计数据
    if (!this.config.data) {
      this.showError('缺少表单设计数据');
      return;
    }
    
    const validationResult = validateDesignData(this.config.data);
    if (!validationResult.valid) {
      this.showError(`表单设计数据无效: ${validationResult.errors.join(', ')}`);
      return;
    }
    
    // 保存设计数据
    this.designData = deepClone(this.config.data);
    
    // 从设计数据中获取表单宽度设置
    if (this.designData.formSettings) {
      this.widthMode = this.designData.formSettings.widthMode || 'auto';
      this.fixedWidth = this.designData.formSettings.fixedWidth || '800px';
      this.minWidth = this.designData.formSettings.minWidth || '320px';
    }
    
    // 创建运行模式容器
    this.runtimeContainer = createElement('div', {}, 'fb-runtime-container');
    clearElement(this.container).appendChild(this.runtimeContainer);
    
    // 渲染表单
    this.renderForm();
  }
  
  /**
   * 显示错误信息
   * @param {string} message - 错误信息
   */
  showError(message) {
    if (!this.container) {
      return;
    }
    
    clearElement(this.container);
    
    const errorElement = createElement('div', {}, 'fb-error-message', message);
    this.container.appendChild(errorElement);
  }
  
  /**
   * 渲染表单
   */
  renderForm() {
    if (!this.runtimeContainer || !this.designData) {
      return;
    }
    
    clearElement(this.runtimeContainer);
    
    // 创建表单网格
    this.formGrid = createElement('div', {}, 'fb-runtime-grid');
    this.runtimeContainer.appendChild(this.formGrid);
    
    // 设置网格布局
    const { rows, columns, cells } = this.designData.layout;
    
    // 设置网格模板
    const gridTemplateRows = rows.map(row => row.height || 'auto').join(' ');
    const gridTemplateColumns = columns.map(col => col.width || '1fr').join(' ');
    
    // 计算表单宽度
    let formWidth;
    const columnCount = columns.length;
    
    switch (this.widthMode) {
      case 'min':
        // 最小宽度模式
        formWidth = this.minWidth;
        break;
      case 'auto':
        // 自动宽度模式 - 当有多列时，每列最小宽度的总和
        if (columnCount > 1) {
          // 每列最小宽度 + 间隙
          const minColumnWidth = parseInt(this.minWidth) / columnCount;
          formWidth = `calc(${minColumnWidth * columnCount}px + ${(columnCount - 1) * 10}px)`;
        } else {
          formWidth = '100%';
        }
        break;
      case 'fixed':
        // 固定宽度模式
        formWidth = this.fixedWidth;
        break;
      default:
        formWidth = '100%';
    }
    
    setStyles(this.formGrid, {
      gridTemplateRows,
      gridTemplateColumns,
      width: formWidth,
      margin: '0 auto' // 居中显示
    });
    
    // 渲染单元格
    cells.forEach(cell => {
      const { row, col, rowSpan, colSpan, fieldId } = cell;
      
      const cellElement = createElement('div', {
        'data-row': row,
        'data-col': col,
        'data-field-id': fieldId || ''
      }, 'fb-runtime-cell');
      
      // 设置网格位置
      setStyles(cellElement, {
        gridRow: `${row + 1} / span ${rowSpan || 1}`,
        gridColumn: `${col + 1} / span ${colSpan || 1}`
      });
      
      // 如果单元格有字段，渲染字段
      if (fieldId && this.designData.fields[fieldId]) {
        this.renderField(cellElement, fieldId);
      }
      
      this.formGrid.appendChild(cellElement);
    });
    
    // 创建提交按钮
    this.submitButton = createElement('button', { type: 'button' }, 'fb-submit-button', '提交');
    this.runtimeContainer.appendChild(this.submitButton);
    
    // 添加提交按钮点击事件
    this.cleanupFunctions.push(
      addEvent(this.submitButton, 'click', () => this.submitForm())
    );
  }
  
  /**
   * 渲染字段
   * @param {HTMLElement} cellElement - 单元格元素
   * @param {string} fieldId - 字段ID
   */
  renderField(cellElement, fieldId) {
    if (!cellElement || !fieldId || !this.designData.fields[fieldId]) {
      return;
    }
    
    const fieldConfig = this.designData.fields[fieldId];
    const properties = fieldConfig.properties || {};
    
    // 创建字段容器
    const fieldContainer = createElement('div', { 'data-field-id': fieldId }, 'fb-form-field');
    
    // 创建字段标签
    const labelClasses = ['fb-form-label'];
    if (properties.required) {
      labelClasses.push('fb-required');
    }
    
    const fieldLabel = createElement('label', { for: `fb-field-${fieldId}` }, labelClasses, fieldConfig.label || '');
    fieldContainer.appendChild(fieldLabel);
    
    // 创建字段控件
    let fieldControl;
    const controlClasses = ['fb-form-control'];
    
    // 如果字段有错误，添加错误类
    if (this.fieldErrors[fieldConfig.label]) {
      controlClasses.push('fb-error');
    }
    
    // 根据字段类型创建控件
    const placeholder = properties.placeholder || '';
    
    switch (fieldConfig.type) {
      case 'text':
        fieldControl = createElement('input', { 
          type: 'text', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'textarea':
        fieldControl = createElement('textarea', { 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          rows: '3'
        }, controlClasses);
        fieldControl.textContent = this.formData[fieldConfig.label] || '';
        break;
      case 'number':
        fieldControl = createElement('input', { 
          type: 'number', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          min: properties.min || '',
          max: properties.max || '',
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'password':
        fieldControl = createElement('input', { 
          type: 'password', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'username':
        fieldControl = createElement('input', { 
          type: 'text', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'realname':
        fieldControl = createElement('input', { 
          type: 'text', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'phone':
        fieldControl = createElement('input', { 
          type: 'tel', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'email':
        fieldControl = createElement('input', { 
          type: 'email', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'idcard':
        fieldControl = createElement('input', { 
          type: 'text', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          maxlength: '18',
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'landline':
        fieldControl = createElement('input', { 
          type: 'tel', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'address':
        fieldControl = createElement('textarea', { 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          rows: '2'
        }, controlClasses);
        fieldControl.textContent = this.formData[fieldConfig.label] || '';
        break;
      case 'url':
        fieldControl = createElement('input', { 
          type: 'url', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: placeholder,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'date':
        fieldControl = createElement('input', { 
          type: 'date', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'datetime':
        fieldControl = createElement('input', { 
          type: 'datetime-local', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'time':
        fieldControl = createElement('input', { 
          type: 'time', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
        break;
      case 'select':
        fieldControl = createElement('select', {
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label
        }, controlClasses);
        const selectOptions = properties.options || [];
        selectOptions.forEach(option => {
          const optionElement = createElement('option', { 
            value: typeof option === 'string' ? option : option.value 
          }, null, typeof option === 'string' ? option : option.label);
          if (this.formData[fieldConfig.label] === optionElement.value) {
            optionElement.selected = true;
          }
          fieldControl.appendChild(optionElement);
        });
        break;
      case 'radio':
        fieldControl = createElement('div', {
          id: `fb-field-${fieldId}`
        }, [...controlClasses, 'fb-radio-group']);
        const radioOptions = properties.options || [];
        radioOptions.forEach((option, index) => {
          const radioWrapper = createElement('div', {}, 'fb-radio-item');
          const radioInput = createElement('input', { 
            type: 'radio', 
            name: fieldConfig.label,
            value: typeof option === 'string' ? option : option.value,
            id: `${fieldId}_radio_${index}`
          }, 'fb-radio-input');
          if (this.formData[fieldConfig.label] === radioInput.value) {
            radioInput.checked = true;
          }
          const radioLabel = createElement('label', { 
            for: `${fieldId}_radio_${index}` 
          }, 'fb-radio-label', typeof option === 'string' ? option : option.label);
          appendChildren(radioWrapper, [radioInput, radioLabel]);
          fieldControl.appendChild(radioWrapper);
        });
        break;
      case 'checkbox':
        fieldControl = createElement('div', {
          id: `fb-field-${fieldId}`
        }, [...controlClasses, 'fb-checkbox-group']);
        const checkboxOptions = properties.options || [];
        const currentValues = this.formData[fieldConfig.label] || [];
        checkboxOptions.forEach((option, index) => {
          const checkboxWrapper = createElement('div', {}, 'fb-checkbox-item');
          const checkboxInput = createElement('input', { 
            type: 'checkbox', 
            name: `${fieldConfig.label}[]`,
            value: typeof option === 'string' ? option : option.value,
            id: `${fieldId}_checkbox_${index}`
          }, 'fb-checkbox-input');
          if (Array.isArray(currentValues) && currentValues.includes(checkboxInput.value)) {
            checkboxInput.checked = true;
          }
          const checkboxLabel = createElement('label', { 
            for: `${fieldId}_checkbox_${index}` 
          }, 'fb-checkbox-label', typeof option === 'string' ? option : option.label);
          appendChildren(checkboxWrapper, [checkboxInput, checkboxLabel]);
          fieldControl.appendChild(checkboxWrapper);
        });
        break;
      default:
        fieldControl = createElement('input', { 
          type: 'text', 
          id: `fb-field-${fieldId}`,
          name: fieldConfig.label,
          placeholder: '未知字段类型',
          value: this.formData[fieldConfig.label] || ''
        }, controlClasses);
    }
    
    // 设置通用属性
    if (properties.maxLength && ['text', 'textarea', 'password', 'username', 'realname', 'phone', 'email', 'address', 'url'].includes(fieldConfig.type)) {
      fieldControl.setAttribute('maxlength', properties.maxLength);
    }
    
    if (properties.required) {
      fieldControl.setAttribute('required', 'required');
    }
    
    // 应用样式属性
    setStyles(fieldControl, {
      fontSize: properties.fontSize || '',
      border: properties.border || '',
      backgroundColor: properties.backgroundColor || '',
      color: properties.color || '',
      borderRadius: properties.borderRadius || '',
      padding: properties.padding || '',
      textAlign: properties.textAlign || '',
      fontWeight: properties.fontWeight || '',
      boxShadow: properties.boxShadow || ''
    });
    
    // 添加字段值变化事件
    const handleFieldChange = (e) => {
      const fieldName = fieldConfig.label;
      let fieldValue;
      
      // 根据字段类型处理值
      switch (fieldConfig.type) {
        case 'number':
          fieldValue = e.target.value !== '' ? Number(e.target.value) : '';
          break;
        case 'checkbox':
          // 处理复选框组
          const checkedBoxes = fieldContainer.querySelectorAll('input[type="checkbox"]:checked');
          fieldValue = Array.from(checkedBoxes).map(cb => cb.value);
          break;
        case 'radio':
          // 处理单选框组
          const checkedRadio = fieldContainer.querySelector('input[type="radio"]:checked');
          fieldValue = checkedRadio ? checkedRadio.value : '';
          break;
        default:
          fieldValue = e.target.value;
      }
      
      // 更新表单数据
      this.formData[fieldName] = fieldValue;
      
      // 清除错误
      if (this.fieldErrors[fieldName]) {
        delete this.fieldErrors[fieldName];
        fieldControl.classList.remove('fb-error');
        
        // 移除错误消息
        const errorElement = fieldContainer.querySelector('.fb-error-message');
        if (errorElement) {
          fieldContainer.removeChild(errorElement);
        }
      }
    };
    
    // 根据字段类型添加适当的事件监听器
    if (fieldConfig.type === 'radio' || fieldConfig.type === 'checkbox') {
      // 为单选框和复选框组添加change事件
      const inputs = fieldControl.querySelectorAll('input');
      inputs.forEach(input => {
        this.cleanupFunctions.push(
          addEvent(input, 'change', handleFieldChange)
        );
      });
    } else {
      // 为其他字段类型添加input或change事件
      const eventType = fieldConfig.type === 'select' ? 'change' : 'input';
      this.cleanupFunctions.push(
        addEvent(fieldControl, eventType, handleFieldChange)
      );
    }
    
    fieldContainer.appendChild(fieldControl);
    
    // 如果有错误，显示错误消息
    if (this.fieldErrors[fieldConfig.label]) {
      const errorMessage = createElement('div', {}, 'fb-error-message', this.fieldErrors[fieldConfig.label]);
      fieldContainer.appendChild(errorMessage);
    }
    
    cellElement.appendChild(fieldContainer);
  }
  
  /**
   * 提交表单
   * @returns {Object|null} 表单数据或null
   */
  submitForm() {
    // 格式化日期时间字段
    const formattedData = this.formatFormData();
    
    // 验证表单数据
    const validationResult = validateFormData(formattedData, this.designData);
    
    if (!validationResult.valid) {
      // 保存错误信息
      this.fieldErrors = validationResult.errors;
      
      // 重新渲染表单以显示错误
      this.renderForm();
      
      return null;
    }
    
    // 调用提交回调（仅在调试模式下显示JSON数据）
    if (typeof this.config.onSubmit === 'function') {
      // 如果调试模式未定义或为true，则调用onSubmit回调显示JSON
      if (this.config.debug !== false) {
        this.config.onSubmit(formattedData);
      } else {
        // 非调试模式下，仍然调用onSubmit但传递第二个参数表示不显示JSON
        this.config.onSubmit(formattedData, false);
      }
    }
    
    return formattedData;
  }
  
  /**
   * 格式化表单数据，特别是日期时间字段
   * @returns {Object} 格式化后的表单数据
   */
  formatFormData() {
    const formattedData = deepClone(this.formData);
    
    // 遍历所有字段，格式化日期时间字段
    if (this.designData && this.designData.fields) {
      Object.entries(this.designData.fields).forEach(([fieldId, fieldConfig]) => {
        const fieldLabel = fieldConfig.label || fieldId;
        const fieldValue = formattedData[fieldLabel];
        
        // 如果字段有值且是日期时间类型，则格式化
        if (fieldValue && fieldConfig.type === 'datetime') {
          try {
            // 将值转换为日期对象，然后格式化为指定格式
            const dateObj = new Date(fieldValue);
            if (!isNaN(dateObj.getTime())) {
              formattedData[fieldLabel] = formatDate(dateObj, 'YYYY-MM-DD HH:mm:ss');
            }
          } catch (e) {
            console.error('日期格式化错误:', e);
          }
        }
      });
    }
    
    return formattedData;
  }
  
  /**
   * 获取表单数据
   * @returns {Object} 表单数据
   */
  getData() {
    return deepClone(this.formData);
  }
  
  /**
   * 设置表单数据
   * @param {Object} data - 表单数据
   */
  setData(data) {
    if (!data || typeof data !== 'object') {
      return;
    }
    
    this.formData = deepClone(data);
    this.fieldErrors = {};
    
    // 重新渲染表单
    this.renderForm();
  }
  
  /**
   * 重置表单
   */
  resetForm() {
    this.formData = {};
    this.fieldErrors = {};
    
    // 重新渲染表单
    this.renderForm();
  }
  
  /**
   * 销毁实例
   */
  destroy() {
    // 清理事件监听器
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
    
    // 清空容器
    if (this.container) {
      clearElement(this.container);
    }
    
    // 重置属性
    this.container = null;
    this.runtimeContainer = null;
    this.formGrid = null;
    this.submitButton = null;
    this.designData = null;
    this.formData = {};
    this.fieldErrors = {};
    this.config = null;
  }
}