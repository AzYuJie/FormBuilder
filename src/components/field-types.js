/**
 * 字段类型定义
 */

/**
 * 字段类型分类
 */
export const FIELD_CATEGORIES = {
  BASIC: {
    label: '基础组件',
    icon: '🔧',
    order: 1
  },
  IDENTITY: {
    label: '身份信息',
    icon: '👤',
    order: 2
  },
  CONTACT: {
    label: '联系方式',
    icon: '📞',
    order: 3
  },
  SELECTION: {
    label: '选择组件',
    icon: '☑️',
    order: 4
  },
  ADVANCED: {
    label: '高级组件',
    icon: '⚙️',
    order: 5
  }
};

/**
 * 字段类型配置
 * @type {Object}
 */
export const FIELD_TYPES = {
  // 基础组件
  text: {
    label: '文本',
    icon: '📝',
    description: '单行文本输入',
    category: 'BASIC',
    defaultValue: '',
    validation: {
      pattern: null,
      minLength: null,
      maxLength: null
    },
    placeholder: '请输入文本'
  },
  textarea: {
    label: '文本域',
    icon: '📄',
    description: '多行文本输入',
    category: 'BASIC',
    defaultValue: '',
    validation: {
      minLength: null,
      maxLength: null
    },
    placeholder: '请输入多行文本',
    rows: 4
  },
  number: {
    label: '数字',
    icon: '🔢',
    description: '数字输入',
    category: 'BASIC',
    defaultValue: null,
    validation: {
      min: null,
      max: null,
      step: 1
    },
    placeholder: '请输入数字'
  },
  password: {
    label: '密码',
    icon: '🔒',
    description: '密码输入框',
    category: 'BASIC',
    defaultValue: '',
    validation: {
      minLength: 6,
      maxLength: 20,
      pattern: null
    },
    placeholder: '请输入密码'
  },
  
  // 身份信息组件
  idcard: {
    label: '身份证号',
    icon: '🆔',
    description: '身份证号码输入',
    category: 'IDENTITY',
    defaultValue: '',
    validation: {
      pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$',
      minLength: 18,
      maxLength: 18
    },
    placeholder: '请输入18位身份证号码',
    formatter: 'idcard'
  },
  username: {
    label: '用户名',
    icon: '👤',
    description: '用户名输入',
    category: 'IDENTITY',
    defaultValue: '',
    validation: {
      pattern: '^[a-zA-Z0-9_]{3,20}$',
      minLength: 3,
      maxLength: 20
    },
    placeholder: '请输入用户名（3-20位字母数字下划线）'
  },
  realname: {
    label: '真实姓名',
    icon: '📛',
    description: '真实姓名输入',
    category: 'IDENTITY',
    defaultValue: '',
    validation: {
      pattern: '^[\u4e00-\u9fa5·]{2,10}$',
      minLength: 2,
      maxLength: 10
    },
    placeholder: '请输入真实姓名'
  },
  
  // 联系方式组件
  mobile: {
    label: '手机号码',
    icon: '📱',
    description: '手机号码输入',
    category: 'CONTACT',
    defaultValue: '',
    validation: {
      pattern: '^1[3-9]\\d{9}$',
      minLength: 11,
      maxLength: 11
    },
    placeholder: '请输入11位手机号码',
    formatter: 'mobile'
  },
  email: {
    label: '邮箱地址',
    icon: '📧',
    description: '邮箱地址输入',
    category: 'CONTACT',
    defaultValue: '',
    validation: {
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    },
    placeholder: '请输入邮箱地址'
  },
  phone: {
    label: '固定电话',
    icon: '☎️',
    description: '固定电话输入',
    category: 'CONTACT',
    defaultValue: '',
    validation: {
      pattern: '^(\\d{3,4}-)?\\d{7,8}$'
    },
    placeholder: '请输入固定电话（如：010-12345678）'
  },
  address: {
    label: '地址',
    icon: '🏠',
    description: '地址输入',
    category: 'CONTACT',
    defaultValue: '',
    validation: {
      minLength: 5,
      maxLength: 200
    },
    placeholder: '请输入详细地址'
  },
  
  // 选择组件
  select: {
    label: '下拉选择',
    icon: '📋',
    description: '下拉选择框',
    category: 'SELECTION',
    defaultValue: '',
    options: [],
    placeholder: '请选择'
  },
  radio: {
    label: '单选框',
    icon: '🔘',
    description: '单选按钮组',
    category: 'SELECTION',
    defaultValue: '',
    options: []
  },
  checkbox: {
    label: '复选框',
    icon: '☑️',
    description: '复选框组',
    category: 'SELECTION',
    defaultValue: [],
    options: []
  },
  
  // 时间日期组件
  date: {
    label: '日期',
    icon: '📅',
    description: '日期选择',
    category: 'ADVANCED',
    defaultValue: null,
    placeholder: '请选择日期',
    format: 'YYYY-MM-DD'
  },
  datetime: {
    label: '日期时间',
    icon: '⏰',
    description: '日期和时间选择',
    category: 'ADVANCED',
    defaultValue: null,
    placeholder: '请选择日期时间',
    format: 'YYYY-MM-DD HH:mm:ss'
  },
  time: {
    label: '时间',
    icon: '🕐',
    description: '时间选择',
    category: 'ADVANCED',
    defaultValue: null,
    placeholder: '请选择时间',
    format: 'HH:mm:ss'
  },
  
  // 高级组件
  url: {
    label: '网址链接',
    icon: '🔗',
    description: 'URL链接输入',
    category: 'ADVANCED',
    defaultValue: '',
    validation: {
      pattern: '^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
    },
    placeholder: '请输入网址（如：https://example.com）'
  }
};

/**
 * 默认字段属性
 * @type {Object}
 */
export const DEFAULT_FIELD_PROPERTIES = {
  fontSize: '14px',
  border: '1px solid #dcdfe6',
  backgroundColor: '#ffffff',
  color: '#606266',
  required: false
};

/**
 * 创建字段配置
 * @param {string} type - 字段类型
 * @param {string} label - 字段标签
 * @param {Object} [properties] - 字段属性
 * @returns {Object} 字段配置
 */
export function createFieldConfig(type, label, properties = {}) {
  if (!FIELD_TYPES[type]) {
    throw new Error(`未知字段类型: ${type}`);
  }
  
  return {
    type,
    label: label || FIELD_TYPES[type].label,
    properties: { ...DEFAULT_FIELD_PROPERTIES, ...properties }
  };
}

/**
 * 获取字段默认值
 * @param {string} type - 字段类型
 * @returns {*} 默认值
 */
export function getFieldDefaultValue(type) {
  if (!FIELD_TYPES[type]) {
    return null;
  }
  
  return FIELD_TYPES[type].defaultValue;
}

/**
 * 字段值格式化器
 */
export const FIELD_FORMATTERS = {
  // 身份证号格式化
  idcard: (value) => {
    if (!value) return value;
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length <= 6) return cleaned;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 6)} ${cleaned.slice(6)}`;
    if (cleaned.length <= 14) return `${cleaned.slice(0, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10)}`;
    return `${cleaned.slice(0, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10, 14)} ${cleaned.slice(14)}`;
  },
  
  // 手机号格式化
  mobile: (value) => {
    if (!value) return value;
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
};

/**
 * 验证字段值
 * @param {*} value - 字段值
 * @param {string} type - 字段类型
 * @param {Object} [fieldConfig] - 字段配置
 * @returns {Object} 验证结果 { valid: boolean, message: string }
 */
export function validateFieldValue(value, type, fieldConfig = null) {
  const config = fieldConfig || FIELD_TYPES[type];
  
  // 空值检查（必填验证在其他地方处理）
  if (value === undefined || value === null || value === '') {
    return { valid: true, message: '' };
  }
  
  const validation = config?.validation || {};
  
  // 长度验证
  if (validation.minLength && value.length < validation.minLength) {
    return { valid: false, message: `最少需要${validation.minLength}个字符` };
  }
  if (validation.maxLength && value.length > validation.maxLength) {
    return { valid: false, message: `最多允许${validation.maxLength}个字符` };
  }
  
  // 正则表达式验证
  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return { valid: false, message: getValidationMessage(type) };
    }
  }
  
  // 数字范围验证
  if (type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { valid: false, message: '请输入有效的数字' };
    }
    if (validation.min !== null && numValue < validation.min) {
      return { valid: false, message: `数值不能小于${validation.min}` };
    }
    if (validation.max !== null && numValue > validation.max) {
      return { valid: false, message: `数值不能大于${validation.max}` };
    }
  }
  
  // 日期验证
  if (['date', 'datetime', 'time'].includes(type)) {
    if (isNaN(Date.parse(value))) {
      return { valid: false, message: '请输入有效的日期时间' };
    }
  }
  
  return { valid: true, message: '' };
}

/**
 * 获取验证错误消息
 * @param {string} type - 字段类型
 * @returns {string} 错误消息
 */
function getValidationMessage(type) {
  const messages = {
    idcard: '请输入正确的18位身份证号码',
    mobile: '请输入正确的11位手机号码',
    email: '请输入正确的邮箱地址',
    phone: '请输入正确的固定电话号码',
    username: '用户名只能包含字母、数字和下划线，长度3-20位',
    realname: '请输入正确的中文姓名',
    url: '请输入正确的网址链接',
    password: '密码长度应为6-20位'
  };
  return messages[type] || '输入格式不正确';
}

/**
 * 格式化字段值（用于显示）
 * @param {*} value - 字段值
 * @param {string} type - 字段类型
 * @returns {string} 格式化后的值
 */
export function formatFieldValue(value, type) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  
  const config = FIELD_TYPES[type];
  
  // 使用自定义格式化器
  if (config?.formatter && FIELD_FORMATTERS[config.formatter]) {
    return FIELD_FORMATTERS[config.formatter](value);
  }
  
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'datetime':
      return new Date(value).toLocaleString();
    case 'time':
      return new Date(`1970-01-01T${value}`).toLocaleTimeString();
    case 'checkbox':
      return Array.isArray(value) ? value.join(', ') : String(value);
    default:
      return String(value);
  }
}

/**
 * 按分类获取字段类型
 * @param {string} [category] - 分类名称，不传则返回所有
 * @returns {Object} 字段类型对象
 */
export function getFieldTypesByCategory(category = null) {
  if (!category) {
    return FIELD_TYPES;
  }
  
  const result = {};
  Object.entries(FIELD_TYPES).forEach(([key, config]) => {
    if (config.category === category) {
      result[key] = config;
    }
  });
  
  return result;
}

/**
 * 获取所有分类及其字段类型
 * @returns {Object} 按分类组织的字段类型
 */
export function getFieldTypesGroupedByCategory() {
  const grouped = {};
  
  // 初始化分类
  Object.entries(FIELD_CATEGORIES).forEach(([key, category]) => {
    grouped[key] = {
      ...category,
      fields: {}
    };
  });
  
  // 按分类分组字段
  Object.entries(FIELD_TYPES).forEach(([key, config]) => {
    const category = config.category || 'BASIC';
    if (grouped[category]) {
      grouped[category].fields[key] = config;
    }
  });
  
  // 按order排序
  return Object.fromEntries(
    Object.entries(grouped).sort(([,a], [,b]) => a.order - b.order)
  );
}

/**
 * 注册新的字段类型
 * @param {string} type - 字段类型名称
 * @param {Object} config - 字段配置
 */
export function registerFieldType(type, config) {
  if (FIELD_TYPES[type]) {
    console.warn(`字段类型 '${type}' 已存在，将被覆盖`);
  }
  
  FIELD_TYPES[type] = {
    category: 'BASIC',
    defaultValue: '',
    validation: {},
    ...config
  };
}

/**
 * 注册新的字段分类
 * @param {string} key - 分类键名
 * @param {Object} category - 分类配置
 */
export function registerFieldCategory(key, category) {
  if (FIELD_CATEGORIES[key]) {
    console.warn(`字段分类 '${key}' 已存在，将被覆盖`);
  }
  
  FIELD_CATEGORIES[key] = {
    order: Object.keys(FIELD_CATEGORIES).length + 1,
    ...category
  };
}

/**
 * 检查字段类型是否存在
 * @param {string} type - 字段类型
 * @returns {boolean} 是否存在
 */
export function hasFieldType(type) {
  return !!FIELD_TYPES[type];
}

/**
 * 获取字段的默认属性
 * @param {string} type - 字段类型
 * @returns {Object} 默认属性
 */
export function getFieldDefaultProperties(type) {
  const config = FIELD_TYPES[type];
  if (!config) {
    return { ...DEFAULT_FIELD_PROPERTIES };
  }
  
  return {
    ...DEFAULT_FIELD_PROPERTIES,
    placeholder: config.placeholder || '',
    ...config.validation
  };
}

/**
 * 创建字段实例
 * @param {string} type - 字段类型
 * @param {Object} [options] - 选项
 * @returns {Object} 字段实例
 */
export function createFieldInstance(type, options = {}) {
  const config = FIELD_TYPES[type];
  if (!config) {
    throw new Error(`未知字段类型: ${type}`);
  }
  
  return {
    type,
    label: options.label || config.label,
    defaultValue: options.defaultValue !== undefined ? options.defaultValue : config.defaultValue,
    properties: {
      ...getFieldDefaultProperties(type),
      ...options.properties
    },
    validation: {
      ...config.validation,
      ...options.validation
    },
    placeholder: options.placeholder || config.placeholder,
    ...options
  };
}