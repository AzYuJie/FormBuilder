/**
 * DOM 工具类
 * 用于处理DOM操作和元素创建
 */

/**
 * 获取DOM元素
 * @param {string|HTMLElement} selector - 选择器或DOM元素
 * @returns {HTMLElement|null} DOM元素或null
 */
export function getElement(selector) {
  if (!selector) {
    return null;
  }
  
  if (typeof selector === 'string') {
    return document.querySelector(selector);
  }
  
  if (selector instanceof HTMLElement) {
    return selector;
  }
  
  return null;
}

/**
 * 创建DOM元素
 * @param {string} tag - 标签名
 * @param {Object} [attributes] - 属性对象
 * @param {string|Array} [classNames] - 类名或类名数组
 * @param {string|HTMLElement} [content] - 内容或子元素
 * @returns {HTMLElement} 创建的DOM元素
 */
export function createElement(tag, attributes = {}, classNames = [], content = '') {
  const element = document.createElement(tag);
  
  // 设置属性
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(key, value);
    }
  });
  
  // 添加类名
  if (typeof classNames === 'string' && classNames && classNames.trim() !== '') {
    // 如果字符串包含空格，拆分成数组处理
    const classArray = classNames.trim().split(/\s+/);
    classArray.forEach(className => {
      if (className) {
        element.classList.add(className);
      }
    });
  } else if (Array.isArray(classNames)) {
    classNames.forEach(className => {
      if (className && typeof className === 'string' && className.trim() !== '') {
        // 处理数组中可能包含空格的类名
        const classArray = className.trim().split(/\s+/);
        classArray.forEach(cls => {
          if (cls) {
            element.classList.add(cls);
          }
        });
      }
    });
  }
  
  // 设置内容
  if (typeof content === 'string') {
    element.textContent = content;
  } else if (content instanceof HTMLElement) {
    element.appendChild(content);
  }
  
  return element;
}

/**
 * 创建并添加多个子元素
 * @param {HTMLElement} parent - 父元素
 * @param {Array} children - 子元素配置数组
 * @returns {HTMLElement} 父元素
 */
export function appendChildren(parent, children) {
  if (!Array.isArray(children)) {
    return parent;
  }
  
  children.forEach(child => {
    if (child instanceof HTMLElement) {
      parent.appendChild(child);
    } else if (typeof child === 'object') {
      const { tag, attributes, classNames, content, children: grandchildren } = child;
      const element = createElement(tag, attributes, classNames, content);
      
      if (Array.isArray(grandchildren)) {
        appendChildren(element, grandchildren);
      }
      
      parent.appendChild(element);
    }
  });
  
  return parent;
}

/**
 * 移除所有子元素
 * @param {HTMLElement} element - 要清空的元素
 * @returns {HTMLElement} 清空后的元素
 */
export function clearElement(element) {
  if (element instanceof HTMLElement) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
  
  return element;
}

/**
 * 添加事件监听器
 * @param {HTMLElement} element - 目标元素
 * @param {string} eventType - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {Object} [options] - 事件选项
 * @returns {Function} 移除事件监听器的函数
 */
export function addEvent(element, eventType, handler, options) {
  if (!(element instanceof HTMLElement)) {
    return () => {};
  }
  
  element.addEventListener(eventType, handler, options);
  
  return () => {
    element.removeEventListener(eventType, handler, options);
  };
}

/**
 * 设置元素样式
 * @param {HTMLElement} element - 目标元素
 * @param {Object} styles - 样式对象
 * @returns {HTMLElement} 目标元素
 */
export function setStyles(element, styles) {
  if (!(element instanceof HTMLElement) || !styles || typeof styles !== 'object') {
    return element;
  }
  
  Object.entries(styles).forEach(([property, value]) => {
    if (value !== undefined && value !== null) {
      element.style[property] = value;
    }
  });
  
  return element;
}

/**
 * 获取元素位置和尺寸
 * @param {HTMLElement} element - 目标元素
 * @returns {Object} 位置和尺寸信息
 */
export function getElementRect(element) {
  if (!(element instanceof HTMLElement)) {
    return { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 };
  }
  
  return element.getBoundingClientRect();
}

/**
 * 检查元素是否包含指定类名
 * @param {HTMLElement} element - 目标元素
 * @param {string} className - 类名
 * @returns {boolean} 是否包含类名
 */
export function hasClass(element, className) {
  if (!(element instanceof HTMLElement) || !className) {
    return false;
  }
  
  return element.classList.contains(className);
}

/**
 * 切换元素类名
 * @param {HTMLElement} element - 目标元素
 * @param {string} className - 类名
 * @param {boolean} [force] - 强制添加或移除
 * @returns {boolean} 操作后是否包含类名
 */
export function toggleClass(element, className, force) {
  if (!(element instanceof HTMLElement) || !className) {
    return false;
  }
  
  return element.classList.toggle(className, force);
}

/**
 * 查找最近的匹配选择器的祖先元素
 * @param {HTMLElement} element - 起始元素
 * @param {string} selector - 选择器
 * @returns {HTMLElement|null} 匹配的祖先元素或null
 */
export function closest(element, selector) {
  if (!(element instanceof HTMLElement) || !selector) {
    return null;
  }
  
  // 使用原生closest方法（如果支持）
  if (element.closest) {
    return element.closest(selector);
  }
  
  // 手动实现closest
  let current = element;
  
  while (current && current !== document.body && current !== document) {
    if (current.matches(selector)) {
      return current;
    }
    
    current = current.parentElement;
  }
  
  return null;
}