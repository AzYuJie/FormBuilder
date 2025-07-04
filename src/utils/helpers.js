/**
 * 辅助工具类
 * 用于处理数据和通用功能
 */

/**
 * 生成唯一ID
 * @param {string} [prefix=''] - ID前缀
 * @returns {string} 唯一ID
 */
export function generateId(prefix = '') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
}

/**
 * 生成带序号的字段名
 * @param {string} componentName - 组件名称
 * @param {Object} existingFields - 现有字段集合
 * @returns {string} 带序号的字段名
 */
export function generateFieldName(componentName, existingFields) {
  // 获取所有现有字段的标签
  const existingLabels = Object.values(existingFields).map(field => field.label || '');
  
  // 查找当前组件名的最大序号
  let maxNumber = 0;
  const pattern = new RegExp(`^${componentName}(\\d+)$`);
  
  existingLabels.forEach(label => {
    const match = label.match(pattern);
    if (match) {
      const number = parseInt(match[1], 10);
      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  });
  
  // 返回下一个序号的字段名
  return `${componentName}${maxNumber + 1}`;
}

/**
 * 深拷贝对象
 * @param {*} obj - 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const copy = {};
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key]);
    });
    return copy;
  }
  
  return obj;
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或日期字符串
 * @param {string} [format='YYYY-MM-DD'] - 格式化模板
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) {
    return '';
  }
  
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 解析日期字符串
 * @param {string} dateString - 日期字符串
 * @returns {Date|null} 日期对象或null
 */
export function parseDate(dateString) {
  if (!dateString) {
    return null;
  }
  
  const date = new Date(dateString);
  
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 合并对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
export function mergeObjects(target, source) {
  if (!source) {
    return target;
  }
  
  const result = { ...target };
  
  Object.keys(source).forEach(key => {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = mergeObjects(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  });
  
  return result;
}

/**
 * 获取对象路径的值
 * @param {Object} obj - 对象
 * @param {string} path - 路径（如 'a.b.c'）
 * @param {*} [defaultValue] - 默认值
 * @returns {*} 路径对应的值或默认值
 */
export function getValueByPath(obj, path, defaultValue) {
  if (!obj || !path) {
    return defaultValue;
  }
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * 设置对象路径的值
 * @param {Object} obj - 对象
 * @param {string} path - 路径（如 'a.b.c'）
 * @param {*} value - 要设置的值
 * @returns {Object} 修改后的对象
 */
export function setValueByPath(obj, path, value) {
  if (!obj || !path) {
    return obj;
  }
  
  const result = { ...obj };
  const keys = path.split('.');
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  
  return result;
}