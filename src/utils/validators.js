/**
 * 验证器工具
 * 用于验证SDK配置和数据
 */

/**
 * 验证SDK初始化配置
 * @param {Object} config - 配置对象
 * @returns {Object} 验证结果 {valid: boolean, errors: Array}
 */
export function validateConfig(config) {
  const errors = [];
  
  // 检查配置是否为对象
  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      errors: ['配置必须是一个对象']
    };
  }
  
  // 验证必填字段
  if (!config.element) {
    errors.push('缺少必填参数: element');
  } else if (typeof config.element !== 'string' && !(config.element instanceof HTMLElement)) {
    errors.push('element 必须是一个字符串选择器或 HTMLElement 实例');
  }
  
  if (!config.mode) {
    errors.push('缺少必填参数: mode');
  } else if (config.mode !== 'design' && config.mode !== 'runtime') {
    errors.push('mode 必须是 "design" 或 "runtime"');
  }
  
  // 根据模式验证其他参数
  if (config.mode === 'runtime') {
    if (!config.data) {
      errors.push('运行模式下必须提供 data 参数');
    }
    
    if (typeof config.onSubmit !== 'function') {
      errors.push('运行模式下必须提供 onSubmit 回调函数');
    }
    
    // 宽度设置选项现在从设计数据中获取，不再需要在配置中验证
  }
  
  if (config.mode === 'design' && typeof config.onSave !== 'function') {
    errors.push('设计模式下必须提供 onSave 回调函数');
  }
  
  // 验证数据格式（如果提供）
  if (config.data && typeof config.data !== 'object') {
    errors.push('data 参数必须是一个对象');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证表单设计数据
 * @param {Object} designData - 表单设计数据
 * @returns {Object} 验证结果 {valid: boolean, errors: Array}
 */
export function validateDesignData(designData) {
  const errors = [];
  
  // 检查数据是否为对象
  if (!designData || typeof designData !== 'object') {
    return {
      valid: false,
      errors: ['表单设计数据必须是一个对象']
    };
  }
  
  // 验证必要的顶级属性
  if (!designData.formSettings) {
    errors.push('缺少必要的 formSettings 属性');
  }
  
  if (!designData.layout) {
    errors.push('缺少必要的 layout 属性');
  } else {
    // 验证布局结构
    if (!Array.isArray(designData.layout.rows)) {
      errors.push('layout.rows 必须是一个数组');
    }
    
    if (!Array.isArray(designData.layout.columns)) {
      errors.push('layout.columns 必须是一个数组');
    }
    
    if (!Array.isArray(designData.layout.cells)) {
      errors.push('layout.cells 必须是一个数组');
    }
  }
  
  if (!designData.fields || typeof designData.fields !== 'object') {
    errors.push('缺少必要的 fields 属性或格式不正确');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证表单提交数据
 * @param {Object} formData - 表单提交数据
 * @param {Object} designData - 表单设计数据（用于验证必填字段）
 * @returns {Object} 验证结果 {valid: boolean, errors: Object} errors为字段错误信息
 */
export function validateFormData(formData, designData) {
  const errors = {};
  
  // 检查数据是否为对象
  if (!formData || typeof formData !== 'object') {
    return {
      valid: false,
      errors: { _form: '表单数据必须是一个对象' }
    };
  }
  
  // 检查必填字段
  if (designData && designData.fields) {
    Object.entries(designData.fields).forEach(([fieldId, fieldConfig]) => {
      const fieldLabel = fieldConfig.label || fieldId;
      
      // 检查必填字段是否有值
      if (fieldConfig.properties && fieldConfig.properties.required) {
        if (formData[fieldLabel] === undefined || formData[fieldLabel] === null || formData[fieldLabel] === '') {
          errors[fieldLabel] = `${fieldLabel} 是必填项`;
        }
      }
      
      // 根据字段类型进行特定验证
      if (formData[fieldLabel] !== undefined && formData[fieldLabel] !== null) {
        switch (fieldConfig.type) {
          case 'number':
            if (isNaN(Number(formData[fieldLabel]))) {
              errors[fieldLabel] = `${fieldLabel} 必须是一个数字`;
            }
            break;
          case 'date':
          case 'datetime':
            if (!(formData[fieldLabel] instanceof Date) && isNaN(Date.parse(formData[fieldLabel]))) {
              errors[fieldLabel] = `${fieldLabel} 必须是一个有效的日期`;
            }
            break;
        }
      }
    });
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}