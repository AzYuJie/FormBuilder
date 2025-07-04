/**
 * 设计模式核心实现
 */

import interact from 'interactjs';
import { getElement, createElement, clearElement, appendChildren, addEvent, setStyles, hasClass, toggleClass, closest } from '../utils/dom';
import { generateId, generateFieldName, deepClone, debounce } from '../utils/helpers';
import { validateDesignData } from '../utils/validators';
import { FIELD_TYPES, FIELD_CATEGORIES, DEFAULT_FIELD_PROPERTIES, getFieldTypesGroupedByCategory, validateFieldValue, FIELD_FORMATTERS } from '../components/field-types';

/**
 * 设计模式类
 */
export default class DesignMode {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   */
  constructor(config) {
    this.config = config;
    this.container = null;
    this.designContainer = null;
    this.dataPanel = null;
    this.designCanvas = null;
    this.propertiesPanel = null;
    
    // 表单设计数据
    this.formData = {
      formSettings: {
        width: '100%',
        labelPosition: 'top',
        widthMode: 'auto',      // 宽度模式：'auto'(自动宽度)、'min'(最小宽度)、'fixed'(固定宽度)
        fixedWidth: '800px',    // 固定宽度值
        minWidth: '320px'       // 最小宽度值
      },
      layout: {
        rows: [{ height: '100px' }],
        columns: [{ width: '100%' }],
        cells: [{ row: 0, col: 0, rowSpan: 1, colSpan: 1, fieldId: null }]
      },
      fields: {}
    };
    
    // 当前选中的字段ID
    this.selectedFieldId = null;
    
    // 事件清理函数集合
    this.cleanupFunctions = [];
    
    // 初始化
    this.init();
    
    // 页面加载时清理所有可能的残留元素
    this.cleanupOnLoad();
  }
  
  /**
   * 页面加载时清理残留元素
   */
  cleanupOnLoad() {
    // 清理所有可能残留的拖拽相关元素
    setTimeout(() => {
      DesignMode.dragStateManager.clearAll();
    }, 100);
  }
  
  /**
   * 添加页面可见性变化监听
   */
  addVisibilityChangeListener() {
    const cleanup = () => {
      DesignMode.dragStateManager.clearAll();
    };
    
    // 页面可见性变化时清理
    document.addEventListener('visibilitychange', cleanup);
    
    // 页面失去焦点时清理
    window.addEventListener('blur', cleanup);
    
    // 鼠标离开页面时清理
    document.addEventListener('mouseleave', cleanup);
    
    // 保存清理函数以便后续移除
    this.cleanupFunctions.push(
      () => document.removeEventListener('visibilitychange', cleanup),
      () => window.removeEventListener('blur', cleanup),
      () => document.removeEventListener('mouseleave', cleanup)
    );
  }
  
  /**
   * 初始化设计模式
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
    
    // 创建设计模式容器
    this.designContainer = createElement('div', {}, 'fb-design-container');
    clearElement(this.container).appendChild(this.designContainer);
    
    // 创建三个面板
    this.createDataPanel();
    this.createDesignCanvas();
    this.createPropertiesPanel();
    
    // 加载已有数据（如果有）
    if (this.config.data) {
      this.loadFormData(this.config.data);
    }
    
    // 初始化拖放功能
    this.initDragAndDrop();
    
    // 添加页面可见性变化监听，确保清理残留元素
    this.addVisibilityChangeListener();
  }
  
  /**
   * 创建左侧数据面板
   */
  createDataPanel() {
    // 创建数据面板容器
    this.dataPanel = createElement('div', {}, 'fb-data-domain');
    this.designContainer.appendChild(this.dataPanel);
    
    // 创建标签页
    const tabsContainer = createElement('div', {}, 'fb-tabs');
    const componentsTab = createElement('div', { 'data-tab': 'components' }, ['fb-tab', 'fb-active'], '组件库');
    const fieldsTab = createElement('div', { 'data-tab': 'fields' }, 'fb-tab', '字段列表');
    
    appendChildren(tabsContainer, [componentsTab, fieldsTab]);
    this.dataPanel.appendChild(tabsContainer);
    
    // 创建标签内容
    const componentsContent = createElement('div', { 'data-tab-content': 'components' }, ['fb-tab-content', 'fb-active']);
    const fieldsContent = createElement('div', { 'data-tab-content': 'fields' }, 'fb-tab-content');
    
    appendChildren(this.dataPanel, [componentsContent, fieldsContent]);
    
    // 填充组件库
    this.fillComponentLibrary(componentsContent);
    
    // 填充字段列表（初始为空）
    this.fillFieldList(fieldsContent);
    
    // 添加标签切换事件
    const switchTab = (tabElement) => {
      const tabName = tabElement.getAttribute('data-tab');
      
      // 更新标签状态
      tabsContainer.querySelectorAll('.fb-tab').forEach(tab => {
        tab.classList.remove('fb-active');
      });
      tabElement.classList.add('fb-active');
      
      // 更新内容状态
      this.dataPanel.querySelectorAll('.fb-tab-content').forEach(content => {
        content.classList.remove('fb-active');
      });
      this.dataPanel.querySelector(`[data-tab-content="${tabName}"]`).classList.add('fb-active');
    };
    
    // 绑定标签点击事件
    tabsContainer.querySelectorAll('.fb-tab').forEach(tab => {
      this.cleanupFunctions.push(
        addEvent(tab, 'click', () => switchTab(tab))
      );
    });
  }
  
  /**
   * 填充组件库
   * @param {HTMLElement} container - 组件库容器
   */
  fillComponentLibrary(container) {
    const groupedTypes = getFieldTypesGroupedByCategory();
    
    // 按分类创建组件组
    Object.entries(groupedTypes).forEach(([categoryKey, category]) => {
      if (Object.keys(category.fields).length === 0) return;
      
      // 创建分类标题
      const categoryHeader = createElement('div', {}, 'fb-component-category');
      const categoryIcon = createElement('span', {}, 'fb-category-icon', category.icon);
      const categoryLabel = createElement('span', {}, 'fb-category-label', category.label);
      const categoryToggle = createElement('span', {}, 'fb-category-toggle', '▼');
      
      appendChildren(categoryHeader, [categoryIcon, categoryLabel, categoryToggle]);
      
      // 创建组件列表
      const componentList = createElement('ul', {}, 'fb-component-list');
      
      // 添加该分类下的组件项
      Object.entries(category.fields).forEach(([type, config]) => {
        const componentItem = createElement('li', { 'data-type': type }, 'fb-component-item');
        const icon = createElement('span', {}, 'fb-component-icon', config.icon || '📝');
        const label = createElement('span', {}, 'fb-component-label', config.label || type);
        const description = createElement('span', {}, 'fb-component-description', config.description || '');
        
        appendChildren(componentItem, [icon, label, description]);
        componentList.appendChild(componentItem);
        
        // 设置为可拖动
        this.makeComponentDraggable(componentItem);
      });
      
      // 创建分类容器
      const categoryContainer = createElement('div', {}, 'fb-component-group');
      appendChildren(categoryContainer, [categoryHeader, componentList]);
      
      // 添加折叠/展开功能
      this.cleanupFunctions.push(
        addEvent(categoryHeader, 'click', () => {
          const isCollapsed = categoryContainer.classList.toggle('fb-collapsed');
          categoryToggle.textContent = isCollapsed ? '▶' : '▼';
        })
      );
      
      container.appendChild(categoryContainer);
    });
  }
  
  /**
   * 填充字段列表
   * @param {HTMLElement} container - 字段列表容器
   */
  fillFieldList(container) {
    clearElement(container);
    
    const fieldList = createElement('ul', {}, 'fb-field-list');
    
    // 添加字段项
    Object.entries(this.formData.fields).forEach(([fieldId, fieldConfig]) => {
      const fieldItem = createElement('li', { 'data-field-id': fieldId }, 'fb-field-item');
      
      // 创建字段标签容器
      const fieldLabel = createElement('span', {}, 'fb-field-label', fieldConfig.label || fieldId);
      
      // 创建删除按钮
      const deleteBtn = createElement('button', { 
        'type': 'button',
        'title': '删除字段'
      }, 'fb-field-delete-btn', '×');
      
      // 如果是当前选中的字段，添加激活类
      if (fieldId === this.selectedFieldId) {
        fieldItem.classList.add('fb-active');
      }
      
      // 添加字段标签点击事件（选中字段）
      this.cleanupFunctions.push(
        addEvent(fieldLabel, 'click', () => this.selectField(fieldId))
      );
      
      // 添加删除按钮点击事件
      this.cleanupFunctions.push(
        addEvent(deleteBtn, 'click', (e) => {
          e.stopPropagation(); // 阻止事件冒泡
          this.deleteFieldFromList(fieldId);
        })
      );
      
      fieldItem.appendChild(fieldLabel);
       fieldItem.appendChild(deleteBtn);
       fieldList.appendChild(fieldItem);
     });
    
    container.appendChild(fieldList);
  }
  
  /**
   * 创建中部设计画布
   */
  createDesignCanvas() {
    // 创建设计画布容器
    this.designCanvas = createElement('div', {}, 'fb-design-canvas');
    this.designContainer.appendChild(this.designCanvas);
    
    // 创建工具栏
    const toolbar = createElement('div', {}, 'fb-canvas-toolbar');
    const addRowButton = createElement('button', { type: 'button' }, 'fb-toolbar-button', '添加行');
    const addColumnButton = createElement('button', { type: 'button' }, 'fb-toolbar-button', '添加列');
    const deleteRowButton = createElement('button', { type: 'button' }, 'fb-toolbar-button', '删除行');
    const deleteColumnButton = createElement('button', { type: 'button' }, 'fb-toolbar-button', '删除列');
    const formSettingsButton = createElement('button', { type: 'button' }, 'fb-toolbar-button', '表单设置');
    
    appendChildren(toolbar, [addRowButton, addColumnButton, deleteRowButton, deleteColumnButton, formSettingsButton]);
    this.designCanvas.appendChild(toolbar);
    
    // 创建网格容器
    const gridContainer = createElement('div', {}, 'fb-grid-container');
    this.designCanvas.appendChild(gridContainer);
    
    // 绑定工具栏按钮事件
    this.cleanupFunctions.push(
      addEvent(addRowButton, 'click', () => this.addRow())
    );
    
    this.cleanupFunctions.push(
      addEvent(addColumnButton, 'click', () => this.addColumn())
    );
    
    this.cleanupFunctions.push(
      addEvent(deleteRowButton, 'click', () => this.deleteRow())
    );
    
    this.cleanupFunctions.push(
      addEvent(deleteColumnButton, 'click', () => this.deleteColumn())
    );
    
    this.cleanupFunctions.push(
      addEvent(formSettingsButton, 'click', () => this.showFormSettings())
    );
    
    // 添加键盘事件监听
    this.cleanupFunctions.push(
      addEvent(document, 'keydown', (e) => {
        // 按下Escape键清除所有选择
        if (e.key === 'Escape') {
          this.selectField(null);
        }
      })
    );
    
    // 添加点击空白区域取消选择的事件
    this.cleanupFunctions.push(
      addEvent(gridContainer, 'click', (e) => {
        // 如果点击的是网格容器（而不是单元格），则清除所有选择
        if (e.target === gridContainer) {
          this.selectField(null);
        }
      })
    );
    
    // 渲染网格
    this.renderGrid();
  }
  
  /**
   * 创建右侧属性面板
   */
  createPropertiesPanel() {
    // 创建属性面板容器
    this.propertiesPanel = createElement('div', {}, 'fb-field-properties');
    this.designContainer.appendChild(this.propertiesPanel);
    
    // 初始显示提示信息
    this.showPropertiesPanelMessage('请选择一个字段来编辑其属性');
  }
  
  /**
   * 在属性面板显示消息
   * @param {string} message - 消息内容
   */
  showPropertiesPanelMessage(message) {
    clearElement(this.propertiesPanel);
    
    const messageElement = createElement('div', {}, 'fb-properties-message', message);
    this.propertiesPanel.appendChild(messageElement);
  }
  
  /**
   * 显示表单设置面板
   */
  showFormSettings() {
    clearElement(this.propertiesPanel);
    
    // 创建标题
    const title = createElement('h3', {}, 'fb-property-title', '表单设置');
    this.propertiesPanel.appendChild(title);
    
    // 创建表单设置组
    const settingsGroup = createElement('div', {}, 'fb-property-group');
    const settingsTitle = createElement('div', {}, 'fb-property-subtitle', '基本设置');
    settingsGroup.appendChild(settingsTitle);
    
    // 表单宽度设置
    const widthItem = createElement('div', {}, 'fb-property-item');
    const widthLabel = createElement('label', { for: 'fb-form-width-mode' }, 'fb-property-label', '宽度模式');
    const widthSelect = createElement('select', { id: 'fb-form-width-mode' }, 'fb-property-input');
    
    // 添加选项
    const autoOption = createElement('option', { value: 'auto' }, null, '自动宽度');
    const minOption = createElement('option', { value: 'min' }, null, '最小宽度');
    const fixedOption = createElement('option', { value: 'fixed' }, null, '固定宽度');
    
    // 根据当前设置选中对应选项
    const currentWidthMode = this.formData.formSettings.widthMode || 'auto';
    autoOption.selected = currentWidthMode === 'auto';
    minOption.selected = currentWidthMode === 'min';
    fixedOption.selected = currentWidthMode === 'fixed';
    
    appendChildren(widthSelect, [autoOption, minOption, fixedOption]);
    appendChildren(widthItem, [widthLabel, widthSelect]);
    
    // 固定宽度输入框
    const fixedWidthItem = createElement('div', {}, 'fb-property-item');
    const fixedWidthLabel = createElement('label', { for: 'fb-form-fixed-width' }, 'fb-property-label', '固定宽度');
    const fixedWidthInput = createElement('input', { 
      id: 'fb-form-fixed-width', 
      type: 'text', 
      value: this.formData.formSettings.fixedWidth || '800px' 
    }, 'fb-property-input');
    appendChildren(fixedWidthItem, [fixedWidthLabel, fixedWidthInput]);
    
    // 最小宽度输入框
    const minWidthItem = createElement('div', {}, 'fb-property-item');
    const minWidthLabel = createElement('label', { for: 'fb-form-min-width' }, 'fb-property-label', '最小宽度');
    const minWidthInput = createElement('input', { 
      id: 'fb-form-min-width', 
      type: 'text', 
      value: this.formData.formSettings.minWidth || '320px' 
    }, 'fb-property-input');
    appendChildren(minWidthItem, [minWidthLabel, minWidthInput]);
    
    // 添加所有设置项到设置组
    appendChildren(settingsGroup, [widthItem, fixedWidthItem, minWidthItem]);
    
    // 添加应用按钮
    const applyButton = createElement('button', { type: 'button' }, 'fb-property-button', '应用设置');
    
    // 绑定应用按钮事件
    this.cleanupFunctions.push(
      addEvent(applyButton, 'click', () => {
        // 获取设置值
        const widthMode = widthSelect.value;
        const fixedWidth = fixedWidthInput.value;
        const minWidth = minWidthInput.value;
        
        // 更新表单设置
        this.formData.formSettings.widthMode = widthMode;
        this.formData.formSettings.fixedWidth = fixedWidth;
        this.formData.formSettings.minWidth = minWidth;
        
        // 提示更新成功
        alert('表单设置已更新');
      })
    );
    
    // 添加设置组和应用按钮到面板
    appendChildren(this.propertiesPanel, [title, settingsGroup, applyButton]);
  }
  
  /**
   * 渲染字段属性面板
   * @param {string} fieldId - 字段ID
   */
  renderFieldProperties(fieldId) {
    if (!fieldId || !this.formData.fields[fieldId]) {
      this.showPropertiesPanelMessage('未找到字段');
      return;
    }
    
    clearElement(this.propertiesPanel);
    
    const fieldConfig = this.formData.fields[fieldId];
    const fieldType = FIELD_TYPES[fieldConfig.type] || {};
    
    // 创建标题
    const title = createElement('h3', {}, 'fb-property-title', `${fieldType.label || fieldConfig.type} 属性`);
    this.propertiesPanel.appendChild(title);
    
    // 创建基本属性组
    const basicGroup = createElement('div', {}, 'fb-property-group');
    const basicTitle = createElement('div', {}, 'fb-property-subtitle', '基本属性');
    basicGroup.appendChild(basicTitle);
    
    // 字段标签
    const labelItem = createElement('div', {}, 'fb-property-item');
    const labelLabel = createElement('label', { for: `fb-field-label-${fieldId}` }, 'fb-property-label', '字段标签');
    const labelInput = createElement('input', { 
      type: 'text', 
      id: `fb-field-label-${fieldId}`,
      value: fieldConfig.label || ''
    }, 'fb-property-input');
    
    appendChildren(labelItem, [labelLabel, labelInput]);
    basicGroup.appendChild(labelItem);
    
    // 添加标签输入事件
    this.cleanupFunctions.push(
      addEvent(labelInput, 'input', () => {
        this.updateFieldProperty(fieldId, 'label', labelInput.value);
      })
    );
    
    // 添加基本属性组
    this.propertiesPanel.appendChild(basicGroup);
    
    // 创建样式属性组
    const styleGroup = createElement('div', {}, 'fb-property-group');
    const styleTitle = createElement('div', {}, 'fb-property-subtitle', '样式属性');
    styleGroup.appendChild(styleTitle);
    
    // 获取当前属性或默认值
    const properties = fieldConfig.properties || {};
    
    // 字号大小
    const fontSizeItem = createElement('div', {}, 'fb-property-item');
    const fontSizeLabel = createElement('label', { for: `fb-font-size-${fieldId}` }, 'fb-property-label', '字号大小');
    const fontSizeSelect = createElement('select', { id: `fb-font-size-${fieldId}` }, 'fb-property-select');
    
    // 添加字号选项
    const fontSizes = ['12px', '14px', '16px', '18px', '20px'];
    fontSizes.forEach(size => {
      const option = createElement('option', { value: size }, null, size);
      if (properties.fontSize === size) {
        option.selected = true;
      }
      fontSizeSelect.appendChild(option);
    });
    
    appendChildren(fontSizeItem, [fontSizeLabel, fontSizeSelect]);
    styleGroup.appendChild(fontSizeItem);
    
    // 添加字号选择事件
    this.cleanupFunctions.push(
      addEvent(fontSizeSelect, 'change', () => {
        this.updateFieldProperty(fieldId, 'properties.fontSize', fontSizeSelect.value);
      })
    );
    
    // 边框
    const borderItem = createElement('div', {}, 'fb-property-item');
    const borderLabel = createElement('label', { for: `fb-border-${fieldId}` }, 'fb-property-label', '边框');
    const borderSelect = createElement('select', { id: `fb-border-${fieldId}` }, 'fb-property-select');
    
    // 添加边框选项
    const borderOptions = [
      { value: 'none', label: '无边框' },
      // 实线边框 - 不同粗细
      { value: '1px solid #dcdfe6', label: '细实线 (浅灰)' },
      { value: '2px solid #dcdfe6', label: '中实线 (浅灰)' },
      { value: '3px solid #dcdfe6', label: '粗实线 (浅灰)' },
      { value: '1px solid #909399', label: '细实线 (深灰)' },
      { value: '2px solid #909399', label: '中实线 (深灰)' },
      // 彩色实线边框
      { value: '1px solid #409eff', label: '细实线 (蓝色)' },
      { value: '2px solid #409eff', label: '中实线 (蓝色)' },
      { value: '1px solid #67c23a', label: '细实线 (绿色)' },
      { value: '2px solid #67c23a', label: '中实线 (绿色)' },
      { value: '1px solid #e6a23c', label: '细实线 (橙色)' },
      { value: '2px solid #e6a23c', label: '中实线 (橙色)' },
      { value: '1px solid #f56c6c', label: '细实线 (红色)' },
      { value: '2px solid #f56c6c', label: '中实线 (红色)' },
      { value: '1px solid #9c27b0', label: '细实线 (紫色)' },
      { value: '1px solid #ff9800', label: '细实线 (琥珀)' },
      // 虚线边框
      { value: '1px dashed #dcdfe6', label: '虚线 (浅灰)' },
      { value: '2px dashed #dcdfe6', label: '粗虚线 (浅灰)' },
      { value: '1px dashed #409eff', label: '虚线 (蓝色)' },
      { value: '1px dashed #67c23a', label: '虚线 (绿色)' },
      { value: '1px dashed #f56c6c', label: '虚线 (红色)' },
      // 点线边框
      { value: '1px dotted #dcdfe6', label: '点线 (浅灰)' },
      { value: '2px dotted #dcdfe6', label: '粗点线 (浅灰)' },
      { value: '1px dotted #409eff', label: '点线 (蓝色)' },
      { value: '1px dotted #67c23a', label: '点线 (绿色)' },
      // 双线边框
      { value: '3px double #dcdfe6', label: '双线 (浅灰)' },
      { value: '4px double #409eff', label: '双线 (蓝色)' },
      // 立体边框
      { value: '2px ridge #dcdfe6', label: '立体凸起' },
      { value: '2px groove #dcdfe6', label: '立体凹陷' },
      { value: '2px inset #dcdfe6', label: '内嵌效果' },
      { value: '2px outset #dcdfe6', label: '外凸效果' }
    ];
    
    borderOptions.forEach(option => {
      const optionElement = createElement('option', { value: option.value }, null, option.label);
      if (properties.border === option.value) {
        optionElement.selected = true;
      }
      borderSelect.appendChild(optionElement);
    });
    
    appendChildren(borderItem, [borderLabel, borderSelect]);
    styleGroup.appendChild(borderItem);
    
    // 添加边框选择事件
    this.cleanupFunctions.push(
      addEvent(borderSelect, 'change', () => {
        this.updateFieldProperty(fieldId, 'properties.border', borderSelect.value);
      })
    );
    
    // 背景色
    const bgColorItem = createElement('div', {}, 'fb-property-item');
    const bgColorLabel = createElement('label', { for: `fb-bg-color-${fieldId}` }, 'fb-property-label', '背景色');
    const bgColorWrapper = createElement('div', {}, 'fb-color-picker');
    const bgColorPreview = createElement('div', {}, 'fb-color-preview');
    const bgColorInput = createElement('input', { 
      type: 'color', 
      id: `fb-bg-color-${fieldId}`,
      value: properties.backgroundColor || '#ffffff'
    }, 'fb-property-input');
    
    // 设置预览颜色
    setStyles(bgColorPreview, { backgroundColor: properties.backgroundColor || '#ffffff' });
    
    appendChildren(bgColorWrapper, [bgColorPreview, bgColorInput]);
    appendChildren(bgColorItem, [bgColorLabel, bgColorWrapper]);
    styleGroup.appendChild(bgColorItem);
    
    // 添加背景色选择事件
    this.cleanupFunctions.push(
      addEvent(bgColorInput, 'input', () => {
        setStyles(bgColorPreview, { backgroundColor: bgColorInput.value });
        this.updateFieldProperty(fieldId, 'properties.backgroundColor', bgColorInput.value);
      })
    );
    
    // 字体颜色
    const fontColorItem = createElement('div', {}, 'fb-property-item');
    const fontColorLabel = createElement('label', { for: `fb-font-color-${fieldId}` }, 'fb-property-label', '字体颜色');
    const fontColorWrapper = createElement('div', {}, 'fb-color-picker');
    const fontColorPreview = createElement('div', {}, 'fb-color-preview');
    const fontColorInput = createElement('input', { 
      type: 'color', 
      id: `fb-font-color-${fieldId}`,
      value: properties.color || '#606266'
    }, 'fb-property-input');
    
    // 设置预览颜色
    setStyles(fontColorPreview, { backgroundColor: properties.color || '#606266' });
    
    appendChildren(fontColorWrapper, [fontColorPreview, fontColorInput]);
    appendChildren(fontColorItem, [fontColorLabel, fontColorWrapper]);
    styleGroup.appendChild(fontColorItem);
    
    // 添加字体颜色选择事件
    this.cleanupFunctions.push(
      addEvent(fontColorInput, 'input', () => {
        setStyles(fontColorPreview, { backgroundColor: fontColorInput.value });
        this.updateFieldProperty(fieldId, 'properties.color', fontColorInput.value);
      })
    );
    
    // 圆角设置
    const borderRadiusItem = createElement('div', {}, 'fb-property-item');
    const borderRadiusLabel = createElement('label', { for: `fb-border-radius-${fieldId}` }, 'fb-property-label', '圆角');
    const borderRadiusSelect = createElement('select', { id: `fb-border-radius-${fieldId}` }, 'fb-property-select');
    
    const borderRadiusOptions = [
      { value: '0', label: '无圆角' },
      { value: '2px', label: '小圆角 (2px)' },
      { value: '4px', label: '中圆角 (4px)' },
      { value: '6px', label: '大圆角 (6px)' },
      { value: '8px', label: '超大圆角 (8px)' },
      { value: '12px', label: '圆润 (12px)' },
      { value: '16px', label: '很圆润 (16px)' },
      { value: '50%', label: '完全圆形' }
    ];
    
    borderRadiusOptions.forEach(option => {
      const optionElement = createElement('option', { value: option.value }, null, option.label);
      if (properties.borderRadius === option.value) {
        optionElement.selected = true;
      }
      borderRadiusSelect.appendChild(optionElement);
    });
    
    appendChildren(borderRadiusItem, [borderRadiusLabel, borderRadiusSelect]);
    styleGroup.appendChild(borderRadiusItem);
    
    this.cleanupFunctions.push(
      addEvent(borderRadiusSelect, 'change', () => {
        this.updateFieldProperty(fieldId, 'properties.borderRadius', borderRadiusSelect.value);
      })
    );
    
    // 内边距设置
    const paddingItem = createElement('div', {}, 'fb-property-item');
    const paddingLabel = createElement('label', { for: `fb-padding-${fieldId}` }, 'fb-property-label', '内边距');
    const paddingSelect = createElement('select', { id: `fb-padding-${fieldId}` }, 'fb-property-select');
    
    const paddingOptions = [
      { value: '0', label: '无内边距' },
      { value: '4px', label: '很小 (4px)' },
      { value: '8px', label: '小 (8px)' },
      { value: '12px', label: '中等 (12px)' },
      { value: '16px', label: '大 (16px)' },
      { value: '20px', label: '很大 (20px)' },
      { value: '24px', label: '超大 (24px)' }
    ];
    
    paddingOptions.forEach(option => {
      const optionElement = createElement('option', { value: option.value }, null, option.label);
      if (properties.padding === option.value) {
        optionElement.selected = true;
      }
      paddingSelect.appendChild(optionElement);
    });
    
    appendChildren(paddingItem, [paddingLabel, paddingSelect]);
    styleGroup.appendChild(paddingItem);
    
    this.cleanupFunctions.push(
      addEvent(paddingSelect, 'change', () => {
        this.updateFieldProperty(fieldId, 'properties.padding', paddingSelect.value);
      })
    );
    
    // 文本对齐
    const textAlignItem = createElement('div', {}, 'fb-property-item');
    const textAlignLabel = createElement('label', { for: `fb-text-align-${fieldId}` }, 'fb-property-label', '文本对齐');
    const textAlignSelect = createElement('select', { id: `fb-text-align-${fieldId}` }, 'fb-property-select');
    
    const textAlignOptions = [
      { value: 'left', label: '左对齐' },
      { value: 'center', label: '居中对齐' },
      { value: 'right', label: '右对齐' }
    ];
    
    textAlignOptions.forEach(option => {
      const optionElement = createElement('option', { value: option.value }, null, option.label);
      if (properties.textAlign === option.value) {
        optionElement.selected = true;
      }
      textAlignSelect.appendChild(optionElement);
    });
    
    appendChildren(textAlignItem, [textAlignLabel, textAlignSelect]);
    styleGroup.appendChild(textAlignItem);
    
    this.cleanupFunctions.push(
      addEvent(textAlignSelect, 'change', () => {
        this.updateFieldProperty(fieldId, 'properties.textAlign', textAlignSelect.value);
      })
    );
    
    // 字体粗细
    const fontWeightItem = createElement('div', {}, 'fb-property-item');
    const fontWeightLabel = createElement('label', { for: `fb-font-weight-${fieldId}` }, 'fb-property-label', '字体粗细');
    const fontWeightSelect = createElement('select', { id: `fb-font-weight-${fieldId}` }, 'fb-property-select');
    
    const fontWeightOptions = [
      { value: 'normal', label: '正常' },
      { value: 'bold', label: '粗体' },
      { value: 'lighter', label: '细体' },
      { value: '300', label: '轻量 (300)' },
      { value: '400', label: '正常 (400)' },
      { value: '500', label: '中等 (500)' },
      { value: '600', label: '半粗 (600)' },
      { value: '700', label: '粗体 (700)' },
      { value: '800', label: '超粗 (800)' }
    ];
    
    fontWeightOptions.forEach(option => {
      const optionElement = createElement('option', { value: option.value }, null, option.label);
      if (properties.fontWeight === option.value) {
        optionElement.selected = true;
      }
      fontWeightSelect.appendChild(optionElement);
    });
    
    appendChildren(fontWeightItem, [fontWeightLabel, fontWeightSelect]);
    styleGroup.appendChild(fontWeightItem);
    
    this.cleanupFunctions.push(
      addEvent(fontWeightSelect, 'change', () => {
        this.updateFieldProperty(fieldId, 'properties.fontWeight', fontWeightSelect.value);
      })
    );
    
    // 阴影效果
    const boxShadowItem = createElement('div', {}, 'fb-property-item');
    const boxShadowLabel = createElement('label', { for: `fb-box-shadow-${fieldId}` }, 'fb-property-label', '阴影效果');
    const boxShadowSelect = createElement('select', { id: `fb-box-shadow-${fieldId}` }, 'fb-property-select');
    
    const boxShadowOptions = [
      { value: 'none', label: '无阴影' },
      { value: '0 1px 3px rgba(0,0,0,0.1)', label: '轻微阴影' },
      { value: '0 2px 6px rgba(0,0,0,0.1)', label: '小阴影' },
      { value: '0 4px 12px rgba(0,0,0,0.15)', label: '中等阴影' },
      { value: '0 8px 24px rgba(0,0,0,0.2)', label: '大阴影' },
      { value: '0 0 0 1px rgba(64,158,255,0.3)', label: '蓝色光晕' },
      { value: '0 0 0 1px rgba(103,194,58,0.3)', label: '绿色光晕' },
      { value: '0 0 0 1px rgba(245,108,108,0.3)', label: '红色光晕' },
      { value: 'inset 0 1px 3px rgba(0,0,0,0.1)', label: '内阴影' }
    ];
    
    boxShadowOptions.forEach(option => {
      const optionElement = createElement('option', { value: option.value }, null, option.label);
      if (properties.boxShadow === option.value) {
        optionElement.selected = true;
      }
      boxShadowSelect.appendChild(optionElement);
    });
    
    appendChildren(boxShadowItem, [boxShadowLabel, boxShadowSelect]);
    styleGroup.appendChild(boxShadowItem);
    
    this.cleanupFunctions.push(
      addEvent(boxShadowSelect, 'change', () => {
        this.updateFieldProperty(fieldId, 'properties.boxShadow', boxShadowSelect.value);
      })
    );
    
    // 是否必填
    const requiredItem = createElement('div', {}, 'fb-property-item');
    const requiredWrapper = createElement('div', {}, 'fb-property-checkbox-wrapper');
    const requiredInput = createElement('input', { 
      type: 'checkbox', 
      id: `fb-required-${fieldId}`,
      checked: properties.required ? 'checked' : null
    }, 'fb-property-checkbox');
    const requiredLabel = createElement('label', { for: `fb-required-${fieldId}` }, 'fb-property-label', '是否必填');
    
    appendChildren(requiredWrapper, [requiredInput, requiredLabel]);
    requiredItem.appendChild(requiredWrapper);
    styleGroup.appendChild(requiredItem);
    
    // 添加必填复选框事件
    this.cleanupFunctions.push(
      addEvent(requiredInput, 'change', () => {
        this.updateFieldProperty(fieldId, 'properties.required', requiredInput.checked);
      })
    );
    
    // 添加样式属性组
    this.propertiesPanel.appendChild(styleGroup);
    
    // 创建字段特定属性组
    this.renderFieldSpecificProperties(fieldId, fieldType, fieldConfig);
  }
  
  /**
   * 渲染字段特定属性
   * @param {string} fieldId - 字段ID
   * @param {Object} fieldType - 字段类型配置
   * @param {Object} fieldConfig - 字段配置
   */
  renderFieldSpecificProperties(fieldId, fieldType, fieldConfig) {
    const properties = fieldConfig.properties || {};
    
    // 创建字段特定属性组
    const specificGroup = createElement('div', {}, 'fb-property-group');
    const specificTitle = createElement('div', {}, 'fb-property-subtitle', '字段属性');
    specificGroup.appendChild(specificTitle);
    
    // 占位符属性（适用于输入类字段）
    if (fieldType.placeholder !== undefined) {
      const placeholderItem = createElement('div', {}, 'fb-property-item');
      const placeholderLabel = createElement('label', { for: `fb-placeholder-${fieldId}` }, 'fb-property-label', '占位符');
      const placeholderInput = createElement('input', { 
        type: 'text', 
        id: `fb-placeholder-${fieldId}`,
        value: properties.placeholder || fieldType.placeholder || ''
      }, 'fb-property-input');
      
      appendChildren(placeholderItem, [placeholderLabel, placeholderInput]);
      specificGroup.appendChild(placeholderItem);
      
      this.cleanupFunctions.push(
        addEvent(placeholderInput, 'input', () => {
          this.updateFieldProperty(fieldId, 'properties.placeholder', placeholderInput.value);
        })
      );
    }
    
    // 最大长度属性（适用于文本类字段）
    if (['text', 'textarea', 'password', 'username', 'realname', 'phone', 'email', 'idcard', 'address', 'url'].includes(fieldConfig.type)) {
      const maxLengthItem = createElement('div', {}, 'fb-property-item');
      const maxLengthLabel = createElement('label', { for: `fb-maxlength-${fieldId}` }, 'fb-property-label', '最大长度');
      const maxLengthInput = createElement('input', { 
        type: 'number', 
        id: `fb-maxlength-${fieldId}`,
        value: properties.maxLength || '',
        min: '1',
        max: '1000'
      }, 'fb-property-input');
      
      appendChildren(maxLengthItem, [maxLengthLabel, maxLengthInput]);
      specificGroup.appendChild(maxLengthItem);
      
      this.cleanupFunctions.push(
        addEvent(maxLengthInput, 'input', () => {
          const value = maxLengthInput.value ? parseInt(maxLengthInput.value) : null;
          this.updateFieldProperty(fieldId, 'properties.maxLength', value);
        })
      );
    }
    
    // 最小值和最大值（适用于数字类字段）
    if (['number'].includes(fieldConfig.type)) {
      const minValueItem = createElement('div', {}, 'fb-property-item');
      const minValueLabel = createElement('label', { for: `fb-minvalue-${fieldId}` }, 'fb-property-label', '最小值');
      const minValueInput = createElement('input', { 
        type: 'number', 
        id: `fb-minvalue-${fieldId}`,
        value: properties.min || ''
      }, 'fb-property-input');
      
      appendChildren(minValueItem, [minValueLabel, minValueInput]);
      specificGroup.appendChild(minValueItem);
      
      this.cleanupFunctions.push(
        addEvent(minValueInput, 'input', () => {
          const value = minValueInput.value ? parseFloat(minValueInput.value) : null;
          this.updateFieldProperty(fieldId, 'properties.min', value);
        })
      );
      
      const maxValueItem = createElement('div', {}, 'fb-property-item');
      const maxValueLabel = createElement('label', { for: `fb-maxvalue-${fieldId}` }, 'fb-property-label', '最大值');
      const maxValueInput = createElement('input', { 
        type: 'number', 
        id: `fb-maxvalue-${fieldId}`,
        value: properties.max || ''
      }, 'fb-property-input');
      
      appendChildren(maxValueItem, [maxValueLabel, maxValueInput]);
      specificGroup.appendChild(maxValueItem);
      
      this.cleanupFunctions.push(
        addEvent(maxValueInput, 'input', () => {
          const value = maxValueInput.value ? parseFloat(maxValueInput.value) : null;
          this.updateFieldProperty(fieldId, 'properties.max', value);
        })
      );
    }
    
    // 选项设置（适用于选择类字段）
    if (['select', 'radio', 'checkbox'].includes(fieldConfig.type)) {
      const optionsItem = createElement('div', {}, 'fb-property-item');
      const optionsLabel = createElement('label', { for: `fb-options-${fieldId}` }, 'fb-property-label', '选项设置');
      const optionsTextarea = createElement('textarea', { 
        id: `fb-options-${fieldId}`,
        placeholder: '每行一个选项，格式：值|显示文本',
        rows: '4'
      }, 'fb-property-textarea');
      
      // 设置当前选项值
      const currentOptions = properties.options || fieldType.options || [];
      optionsTextarea.value = currentOptions.map(opt => 
        typeof opt === 'string' ? opt : `${opt.value}|${opt.label}`
      ).join('\n');
      
      appendChildren(optionsItem, [optionsLabel, optionsTextarea]);
      specificGroup.appendChild(optionsItem);
      
      this.cleanupFunctions.push(
        addEvent(optionsTextarea, 'input', () => {
          const lines = optionsTextarea.value.split('\n').filter(line => line.trim());
          const options = lines.map(line => {
            const parts = line.split('|');
            if (parts.length === 2) {
              return { value: parts[0].trim(), label: parts[1].trim() };
            }
            return { value: line.trim(), label: line.trim() };
          });
          this.updateFieldProperty(fieldId, 'properties.options', options);
        })
      );
    }
    
    // 文件类型限制（适用于文件上传字段）
    if (['file', 'image'].includes(fieldConfig.type)) {
      const acceptItem = createElement('div', {}, 'fb-property-item');
      const acceptLabel = createElement('label', { for: `fb-accept-${fieldId}` }, 'fb-property-label', '文件类型');
      const acceptInput = createElement('input', { 
        type: 'text', 
        id: `fb-accept-${fieldId}`,
        value: properties.accept || fieldType.accept || '',
        placeholder: '如：.jpg,.png,.pdf'
      }, 'fb-property-input');
      
      appendChildren(acceptItem, [acceptLabel, acceptInput]);
      specificGroup.appendChild(acceptItem);
      
      this.cleanupFunctions.push(
        addEvent(acceptInput, 'input', () => {
          this.updateFieldProperty(fieldId, 'properties.accept', acceptInput.value);
        })
      );
    }
    
    // 只有在有特定属性时才添加组
    if (specificGroup.children.length > 1) {
      this.propertiesPanel.appendChild(specificGroup);
    }
  }
  
  /**
   * 更新字段属性
   * @param {string} fieldId - 字段ID
   * @param {string} propertyPath - 属性路径（如 'label' 或 'properties.fontSize'）
   * @param {*} value - 属性值
   */
  updateFieldProperty(fieldId, propertyPath, value) {
    if (!fieldId || !this.formData.fields[fieldId]) {
      return;
    }
    
    const field = this.formData.fields[fieldId];
    
    // 根据属性路径更新值
    if (propertyPath.includes('.')) {
      const [parent, child] = propertyPath.split('.');
      if (!field[parent]) {
        field[parent] = {};
      }
      field[parent][child] = value;
    } else {
      field[propertyPath] = value;
    }
    
    // 更新UI
    this.updateFieldUI(fieldId);
    this.fillFieldList(this.dataPanel.querySelector('[data-tab-content="fields"]'));
  }
  
  /**
   * 更新字段UI
   * @param {string} fieldId - 字段ID
   */
  updateFieldUI(fieldId) {
    if (!fieldId || !this.formData.fields[fieldId]) {
      return;
    }
    
    // 查找包含该字段的单元格
    const cell = this.designCanvas.querySelector(`.fb-grid-cell[data-field-id="${fieldId}"]`);
    if (!cell) {
      return;
    }
    
    // 获取字段配置
    const fieldConfig = this.formData.fields[fieldId];
    const properties = fieldConfig.properties || {};
    
    // 更新字段标签
    const labelElement = cell.querySelector('.fb-field-label');
    if (labelElement) {
      labelElement.textContent = fieldConfig.label || '';
    }
    
    // 更新字段样式
    const fieldElement = cell.querySelector('.fb-field-control');
    if (fieldElement) {
      setStyles(fieldElement, {
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
      
      // 更新字段属性
      if (properties.placeholder) {
        fieldElement.setAttribute('placeholder', properties.placeholder);
      }
      if (properties.maxLength) {
        fieldElement.setAttribute('maxlength', properties.maxLength);
      }
      if (properties.min !== undefined) {
        fieldElement.setAttribute('min', properties.min);
      }
      if (properties.max !== undefined) {
        fieldElement.setAttribute('max', properties.max);
      }
      if (properties.required !== undefined) {
        if (properties.required) {
          fieldElement.setAttribute('required', 'required');
        } else {
          fieldElement.removeAttribute('required');
        }
      }
      
      // 对于select、radio、checkbox类型，需要重新渲染选项
      if (fieldConfig.type === 'select' || fieldConfig.type === 'radio' || fieldConfig.type === 'checkbox') {
        this.rerenderFieldOptions(fieldId, cell);
      }
    }
  }

  /**
   * 重新渲染字段选项（用于select、radio、checkbox类型）
   * @param {string} fieldId - 字段ID
   * @param {HTMLElement} cell - 单元格元素
   */
  rerenderFieldOptions(fieldId, cell) {
    const fieldConfig = this.formData.fields[fieldId];
    if (!fieldConfig || !fieldConfig.properties || !fieldConfig.properties.options) {
      return;
    }

    const fieldElement = cell.querySelector('.fb-field-control');
    if (!fieldElement) {
      return;
    }

    const options = fieldConfig.properties.options;
    const properties = fieldConfig.properties || {};

    if (fieldConfig.type === 'select') {
      // 清空现有选项
      fieldElement.innerHTML = '';
      
      // 添加默认选项
      if (properties.placeholder) {
        const defaultOption = createElement('option', { value: '' });
        defaultOption.textContent = properties.placeholder;
        fieldElement.appendChild(defaultOption);
      }
      
      // 添加选项
      options.forEach(option => {
        const optionElement = createElement('option', { value: option.value });
        optionElement.textContent = option.label;
        fieldElement.appendChild(optionElement);
      });
    } else if (fieldConfig.type === 'radio' || fieldConfig.type === 'checkbox') {
      // 清空现有选项
      fieldElement.innerHTML = '';
      
      // 重新创建选项
      options.forEach((option, index) => {
        const optionContainer = createElement('div', {}, ['fb-option-item']);
        
        const input = createElement('input', {
          type: fieldConfig.type,
          name: fieldId,
          value: option.value,
          id: `${fieldId}_${index}`
        });
        
        const label = createElement('label', {
          for: `${fieldId}_${index}`
        });
        label.textContent = option.label;
        
        optionContainer.appendChild(input);
        optionContainer.appendChild(label);
        fieldElement.appendChild(optionContainer);
      });
    }

    // 重新应用样式
    setStyles(fieldElement, {
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
  }

  /**
   * 渲染网格
   */
  renderGrid() {
    console.log('=== renderGrid 开始 ===');
    
    const gridContainer = this.designCanvas.querySelector('.fb-grid-container');
    if (!gridContainer) {
      console.error('未找到网格容器');
      return;
    }
    
    console.log('清空网格容器');
    clearElement(gridContainer);
    
    const { rows, columns, cells } = this.formData.layout;
    console.log('网格布局数据:', { 
      rows: rows.length, 
      columns: columns.length, 
      cells: cells.length 
    });
    console.log('单元格详情:', cells);
    
    // 设置网格模板
    const gridTemplateRows = rows.map(row => row.height || 'auto').join(' ');
    const gridTemplateColumns = columns.map(col => col.width || '1fr').join(' ');
    
    console.log('网格模板:', { gridTemplateRows, gridTemplateColumns });
    
    setStyles(gridContainer, {
      gridTemplateRows,
      gridTemplateColumns
    });
    
    // 创建单元格
    console.log('开始创建单元格...');
    cells.forEach((cell, index) => {
      const { row, col, rowSpan, colSpan, fieldId } = cell;
      
      console.log(`创建单元格 ${index}:`, { row, col, rowSpan, colSpan, fieldId });
      
      const cellElement = createElement('div', {
        'data-row': row,
        'data-col': col,
        'data-row-span': rowSpan || 1,
        'data-col-span': colSpan || 1,
        'data-field-id': fieldId || ''
      }, ['fb-grid-cell', !fieldId ? 'fb-empty' : '']);
      
      // 设置网格位置
      setStyles(cellElement, {
        gridRow: `${row + 1} / span ${rowSpan || 1}`,
        gridColumn: `${col + 1} / span ${colSpan || 1}`
      });
      
      // 如果单元格有字段，渲染字段
      if (fieldId && this.formData.fields[fieldId]) {
        console.log(`渲染字段 ${fieldId} 到单元格 (${row}, ${col})`);
        this.renderField(cellElement, fieldId);
      } else {
        console.log(`单元格 (${row}, ${col}) 为空`);
        cellElement.textContent = '拖放字段到这里';
      }
      
      // 添加单元格点击事件
      this.cleanupFunctions.push(
        addEvent(cellElement, 'click', (e) => {
          // 检查点击的是否是字段内部元素
          const isFieldElementClick = e.target.closest('.fb-field-wrapper');
          
          if (fieldId && isFieldElementClick) {
            // 如果点击的是字段内部元素，则选中字段
            this.selectField(fieldId);
          } else {
            // 如果点击的是空单元格，则清除所有选择
            this.selectField(null);
          }
          
          // 阻止事件冒泡
          e.stopPropagation();
        })
      );
      
      gridContainer.appendChild(cellElement);
    });
    
    console.log('网格渲染完成，总共创建了', cells.length, '个单元格');
    console.log('=== renderGrid 结束 ===');
  }
  
  /**
   * 渲染字段
   * @param {HTMLElement} cellElement - 单元格元素
   * @param {string} fieldId - 字段ID
   */
  renderField(cellElement, fieldId) {
    if (!cellElement || !fieldId || !this.formData.fields[fieldId]) {
      return;
    }
    
    clearElement(cellElement);
    
    const fieldConfig = this.formData.fields[fieldId];
    const fieldType = FIELD_TYPES[fieldConfig.type] || {};
    const properties = fieldConfig.properties || {};
    
    // 创建字段包装器
    const fieldWrapper = createElement('div', {}, 'fb-field-wrapper');
    
    // 创建字段标签
    const fieldLabel = createElement('div', {}, 'fb-field-label', fieldConfig.label || '');
    fieldWrapper.appendChild(fieldLabel);
    
    // 创建字段控件
    let fieldControl;
    const placeholder = properties.placeholder || fieldType.placeholder || '';
    
    switch (fieldConfig.type) {
      case 'text':
        fieldControl = createElement('input', { type: 'text', placeholder }, 'fb-field-control');
        break;
      case 'textarea':
        fieldControl = createElement('textarea', { placeholder, rows: '3' }, 'fb-field-control');
        break;
      case 'number':
        fieldControl = createElement('input', { 
          type: 'number', 
          placeholder,
          min: properties.min || '',
          max: properties.max || ''
        }, 'fb-field-control');
        break;
      case 'password':
        fieldControl = createElement('input', { type: 'password', placeholder }, 'fb-field-control');
        break;
      case 'username':
        fieldControl = createElement('input', { type: 'text', placeholder }, 'fb-field-control');
        break;
      case 'realname':
        fieldControl = createElement('input', { type: 'text', placeholder }, 'fb-field-control');
        break;
      case 'phone':
        fieldControl = createElement('input', { type: 'tel', placeholder }, 'fb-field-control');
        break;
      case 'email':
        fieldControl = createElement('input', { type: 'email', placeholder }, 'fb-field-control');
        break;
      case 'idcard':
        fieldControl = createElement('input', { type: 'text', placeholder, maxlength: '18' }, 'fb-field-control');
        break;
      case 'landline':
        fieldControl = createElement('input', { type: 'tel', placeholder }, 'fb-field-control');
        break;
      case 'address':
        fieldControl = createElement('textarea', { placeholder, rows: '2' }, 'fb-field-control');
        break;
      case 'url':
        fieldControl = createElement('input', { type: 'url', placeholder }, 'fb-field-control');
        break;
      case 'date':
        fieldControl = createElement('input', { type: 'date' }, 'fb-field-control');
        break;
      case 'datetime':
        fieldControl = createElement('input', { type: 'datetime-local' }, 'fb-field-control');
        break;
      case 'time':
        fieldControl = createElement('input', { type: 'time' }, 'fb-field-control');
        break;
      case 'select':
        fieldControl = createElement('div', {}, 'fb-field-control fb-select-design');
        // 设计模式下显示下拉框样式的占位符
        const selectPlaceholder = createElement('div', {}, 'fb-design-select-placeholder', '下拉选择框 - 点击右侧属性面板配置选项');
        const selectArrow = createElement('div', {}, 'fb-design-select-arrow', '▼');
        fieldControl.appendChild(selectPlaceholder);
        fieldControl.appendChild(selectArrow);
        break;
      case 'radio':
        fieldControl = createElement('div', {}, 'fb-field-control fb-radio-group fb-radio-design');
        // 设计模式下显示单选框样式的占位符
        const radioPlaceholder = createElement('div', {}, 'fb-design-radio-placeholder');
        const radioIcon = createElement('div', {}, 'fb-design-radio-icon', '◯');
        const radioText = createElement('div', {}, 'fb-design-radio-text', '单选框组 - 点击右侧属性面板配置选项');
        radioPlaceholder.appendChild(radioIcon);
        radioPlaceholder.appendChild(radioText);
        fieldControl.appendChild(radioPlaceholder);
        break;
      case 'checkbox':
        fieldControl = createElement('div', {}, 'fb-field-control fb-checkbox-group fb-checkbox-design');
        // 设计模式下显示复选框样式的占位符
        const checkboxPlaceholder = createElement('div', {}, 'fb-design-checkbox-placeholder');
        const checkboxIcon = createElement('div', {}, 'fb-design-checkbox-icon', '☐');
        const checkboxText = createElement('div', {}, 'fb-design-checkbox-text', '复选框组 - 点击右侧属性面板配置选项');
        checkboxPlaceholder.appendChild(checkboxIcon);
        checkboxPlaceholder.appendChild(checkboxText);
        fieldControl.appendChild(checkboxPlaceholder);
        break;

      default:
        fieldControl = createElement('input', { type: 'text', placeholder: '未知字段类型' }, 'fb-field-control');
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
    
    fieldWrapper.appendChild(fieldControl);
    cellElement.appendChild(fieldWrapper);
    
    // 如果是当前选中的字段，添加字段激活类
    if (fieldId === this.selectedFieldId) {
      cellElement.classList.add('fb-field-active');
    }
  }
  
  /**
   * 初始化拖放功能
   */
  initDragAndDrop() {
    // 清除所有之前的交互实例，防止重复绑定和内存泄漏
    try {
      // 使用更彻底的方式清除之前的交互实例
      interact('.fb-component-item').unset();
      interact('.fb-grid-cell').unset();
      
      // 确保没有残留的交互实例
      const componentItems = this.dataPanel.querySelectorAll('.fb-component-item');
      const gridCells = this.designCanvas.querySelectorAll('.fb-grid-cell');
      
      componentItems.forEach(item => interact(item).unset());
      gridCells.forEach(cell => interact(cell).unset());
    } catch (error) {
      console.warn('清除交互实例时出错:', error);
    }
    
    // 使组件可拖动
    this.dataPanel.querySelectorAll('.fb-component-item').forEach(item => {
      this.makeComponentDraggable(item);
    });
    
    // 使单元格可放置
    this.designCanvas.querySelectorAll('.fb-grid-cell').forEach(cell => {
      this.makeCellDroppable(cell);
    });
    
    // 记录日志，帮助调试
    console.log('拖放功能已初始化', {
      components: this.dataPanel.querySelectorAll('.fb-component-item').length,
      cells: this.designCanvas.querySelectorAll('.fb-grid-cell').length,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * 使组件可拖动
   * @param {HTMLElement} element - 组件元素
   */
  makeComponentDraggable(element) {
    interact(element)
      .draggable({
        inertia: false, // 禁用惯性，使拖动更精确
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: document.body, // 使用整个文档作为限制区域
            endOnly: true
          })
        ],
        autoScroll: true,
        onstart: (event) => {
          // 在开始新的拖拽前，清理所有之前的拖拽状态
          DesignMode.dragStateManager.clearAll();
          
          const target = event.target;
          target.classList.add('fb-dragging');
          
          // 获取原始元素的尺寸
          const rect = target.getBoundingClientRect();
          
          // 计算鼠标在原始元素内的相对位置（偏移量）
          const offsetX = event.client.x - rect.left;
          const offsetY = event.client.y - rect.top;
          
          // 保存偏移量，用于onmove中精确定位
          event.target._ghostOffset = { x: offsetX, y: offsetY };
          
          // 计算幽灵元素的初始位置
          const x = event.client.x - offsetX;
          const y = event.client.y - offsetY;
          
          // 创建拖动时的幽灵元素
          const ghost = target.cloneNode(true);
          ghost.classList.add('fb-drag-ghost');
          
          // 一次性设置所有样式，避免多次重排
          setStyles(ghost, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            margin: '0',
            zIndex: '1000',
            pointerEvents: 'none',
            opacity: '0.95',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
            transition: 'none',
            transform: `translate3d(${x}px, ${y}px, 0) scale(1.02)`,
            willChange: 'transform' // 优化GPU加速
          });
          
          // 添加到DOM
          document.body.appendChild(ghost);
          event.target._ghost = ghost;
          
          // 不再使用过渡动画从原始位置移动到鼠标位置
          
          // 添加十字光标指示器
          const cursor = document.createElement('div');
          cursor.classList.add('fb-drag-cursor');
          setStyles(cursor, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'rgba(64, 158, 255, 0.5)',
            border: '2px solid #409eff',
            pointerEvents: 'none',
            zIndex: '1001',
            transform: `translate3d(${event.client.x}px, ${event.client.y}px, 0) translate(-50%, -50%)`,
            willChange: 'transform'
          });
          document.body.appendChild(cursor);
          event.target._cursor = cursor;
        },
        onmove: (event) => {
          const target = event.target;
          const ghost = target._ghost;
          const cursor = target._cursor;
          const offset = target._ghostOffset || { x: ghost ? ghost.offsetWidth / 2 : 0, y: ghost ? ghost.offsetHeight / 2 : 0 };
          
          // 缓存当前鼠标位置，避免在requestAnimationFrame中访问event对象
          const clientX = event.client.x;
          const clientY = event.client.y;
          
          // 使用单个requestAnimationFrame批量更新所有元素，提高性能
          if (!target._animationPending) {
            target._animationPending = true;
            requestAnimationFrame(() => {
              target._animationPending = false;
              
              // 更新光标位置
              if (cursor) {
                cursor.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
              }
              
              if (ghost) {
                // 使用transform代替top/left，性能更好
                const x = clientX - offset.x;
                const y = clientY - offset.y;
                
                // 直接设置transform，避免setStyles函数的开销
                ghost.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.02)`;
              }
            });
          }
          
          // 简化位置跟踪逻辑
          target._lastPos = { x: clientX, y: clientY, time: Date.now() };
        },
        onend: (event) => {
          const target = event.target;
          
          // 获取目标元素，检查是否有拖放目标
          const dropTarget = document.querySelector('.fb-dragging-over');
          const hasDropTarget = !!dropTarget;
          
          // 添加结束动画效果
          if (target._ghost) {
            const ghost = target._ghost;
            
            if (hasDropTarget) {
              // 如果有放置目标，添加放置成功的动画
              const dropRect = dropTarget.getBoundingClientRect();
              const ghostRect = ghost.getBoundingClientRect();
              
              // 计算目标位置的中心点
              const targetX = dropRect.left + (dropRect.width / 2) - (ghostRect.width / 2);
              const targetY = dropRect.top + (dropRect.height / 2) - (ghostRect.height / 2);
              
              // 添加平滑过渡到目标位置
              setStyles(ghost, {
                transition: 'all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.5)',
                top: `${targetY}px`,
                left: `${targetX}px`,
                transform: 'scale(1)',
                opacity: '0.7',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              });
              
              // 延迟移除，等待动画完成
              setTimeout(() => {
                try {
                  if (ghost.parentNode) {
                    ghost.parentNode.removeChild(ghost);
                  }
                } catch (error) {
                  console.warn('移除幽灵元素时出错:', error);
                }
              }, 200);
            } else {
              // 如果没有放置目标，添加返回原位的动画
              const originalRect = target.getBoundingClientRect();
              setStyles(ghost, {
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                top: `${originalRect.top}px`,
                left: `${originalRect.left}px`,
                transform: 'scale(0.8)',
                opacity: '0',
                boxShadow: '0 0 0 rgba(0, 0, 0, 0)'
              });
              
              // 延迟移除，等待动画完成
              setTimeout(() => {
                try {
                  if (ghost.parentNode) {
                    ghost.parentNode.removeChild(ghost);
                  }
                } catch (error) {
                  console.warn('移除幽灵元素时出错:', error);
                }
              }, 250);
            }
            
            delete target._ghost;
          }
          
          // 移除光标指示器，添加淡出效果
          if (target._cursor) {
            const cursor = target._cursor;
            setStyles(cursor, {
              transition: 'all 0.2s ease',
              opacity: '0',
              transform: 'translate(-50%, -50%) scale(0.5)'
            });
            
            setTimeout(() => {
              try {
                if (cursor.parentNode) {
                  cursor.parentNode.removeChild(cursor);
                }
              } catch (error) {
                console.warn('移除光标指示器时出错:', error);
              }
            }, 200);
            
            delete target._cursor;
          }
          
          // 清除偏移量和位置记录
          if (target._ghostOffset) {
            delete target._ghostOffset;
          }
          
          if (target._lastPos) {
            delete target._lastPos;
          }
          
          // 延迟移除拖动状态，使过渡更平滑
          setTimeout(() => {
            target.classList.remove('fb-dragging');
            // 确保清理所有拖拽状态
            DesignMode.dragStateManager.clearAll();
          }, 50);
          
          // 确保清理所有可能残留的幽灵元素和光标
          setTimeout(() => {
            // 清理幽灵元素
            document.querySelectorAll('.fb-drag-ghost').forEach(ghost => {
              try {
                if (ghost.parentNode) {
                  ghost.parentNode.removeChild(ghost);
                }
              } catch (error) {
                console.warn('清理残留幽灵元素时出错:', error);
              }
            });
            
            // 清理光标指示器
            document.querySelectorAll('.fb-drag-cursor').forEach(cursor => {
              try {
                if (cursor.parentNode) {
                  cursor.parentNode.removeChild(cursor);
                }
              } catch (error) {
                console.warn('清理残留光标指示器时出错:', error);
              }
            });
          }, 300);
        }
      });
  }
  
  /**
   * 拖拽状态管理器（单例模式）
   */
  static dragStateManager = {
    currentHighlightedCell: null,
    currentRipple: null,
    
    // 清理所有拖拽状态
    clearAll() {
      this.clearHighlight();
      this.clearRipple();
      this.clearAllDragStates();
      this.clearAllCursors();
    },
    
    // 清理高亮状态
    clearHighlight() {
      if (this.currentHighlightedCell) {
        const cell = this.currentHighlightedCell;
        cell.classList.remove('fb-dragging-over');
        cell.style.transition = '';
        cell.style.transform = '';
        cell.style.animation = '';
        cell.style.boxShadow = '';
        cell.style.zIndex = '';
        cell.style.backgroundColor = '';
        this.currentHighlightedCell = null;
      }
    },
    
    // 清理波纹效果
    clearRipple() {
      if (this.currentRipple && this.currentRipple.parentNode) {
        this.currentRipple.parentNode.removeChild(this.currentRipple);
        this.currentRipple = null;
      }
    },
    
    // 清理所有拖拽相关状态
    clearAllDragStates() {
      // 清理所有可能残留的拖拽状态
      document.querySelectorAll('.fb-dragging-over').forEach(el => {
        el.classList.remove('fb-dragging-over');
        el.style.transition = '';
        el.style.transform = '';
        el.style.animation = '';
        el.style.boxShadow = '';
        el.style.zIndex = '';
        el.style.backgroundColor = '';
      });
      
      document.querySelectorAll('.fb-dragging').forEach(el => {
        el.classList.remove('fb-dragging');
      });
      
      // 清理所有波纹效果
      document.querySelectorAll('.fb-drop-ripple').forEach(ripple => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      });
    },
    
    // 清理所有拖拽光标
    clearAllCursors() {
      // 清理所有蓝色圆点光标
      document.querySelectorAll('[style*="border-radius: 50%"][style*="rgba(64, 158, 255"]').forEach(cursor => {
        try {
          if (cursor.parentNode) {
            cursor.parentNode.removeChild(cursor);
          }
        } catch (error) {
          console.warn('清理拖拽光标时出错:', error);
        }
      });
      
      // 清理所有可能的拖拽相关元素
      document.querySelectorAll('.fb-drag-cursor, .fb-drag-ghost').forEach(element => {
        try {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        } catch (error) {
          console.warn('清理拖拽元素时出错:', error);
        }
      });
    },
    
    // 设置高亮状态
    setHighlight(cell) {
      // 先清理之前的高亮
      this.clearHighlight();
      
      this.currentHighlightedCell = cell;
      
      requestAnimationFrame(() => {
        cell.style.transition = 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
        
        requestAnimationFrame(() => {
          cell.classList.add('fb-dragging-over');
          cell.style.backgroundColor = '#ecf5ff';
        });
      });
    },
    
    // 创建波纹效果
    createRipple(cell) {
      // 先清理之前的波纹
      this.clearRipple();
      
      const ripple = document.createElement('div');
      ripple.className = 'fb-drop-ripple';
      ripple.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 10px;
        height: 10px;
        background-color: rgba(64, 158, 255, 0.3);
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        animation: rippleEffect 0.6s ease-out;
        pointer-events: none;
        z-index: 5;
      `;
      
      // 确保动画样式存在
      if (!document.querySelector('#fb-ripple-keyframes')) {
        const style = document.createElement('style');
        style.id = 'fb-ripple-keyframes';
        style.textContent = `
          @keyframes rippleEffect {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(10); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
      
      cell.appendChild(ripple);
      this.currentRipple = ripple;
      
      // 自动清理波纹
      setTimeout(() => {
        if (this.currentRipple === ripple) {
          this.clearRipple();
        }
      }, 600);
    }
  };

  /**
   * 使单元格可放置
   * @param {HTMLElement} element - 单元格元素
   */
  makeCellDroppable(element) {
    interact(element)
      .dropzone({
        accept: '.fb-component-item',
        overlap: 0.2, // 进一步降低重叠要求，使拖放更容易触发
        checker: (dragEvent, // related dragmove or dragend
                  event,     // Touch, Pointer or Mouse event
                  dropped,   // bool default checker result
                  dropzone,  // dropzone Interactable
                  dropElement, // dropzone element
                  draggable, // draggable Interactable
                  draggableElement) => {
          // 增强的自定义检查器，提高拖放识别准确性
          if (dropped) return true;
          
          // 确保是组件项
          if (!draggableElement.classList.contains('fb-component-item')) return false;
          
          // 获取元素位置信息
          const dropRect = dropElement.getBoundingClientRect();
          const dragRect = draggableElement.getBoundingClientRect();
          
          // 检查鼠标是否在单元格内
          const mouseX = dragEvent.client.x;
          const mouseY = dragEvent.client.y;
          
          return mouseX >= dropRect.left && mouseX <= dropRect.right && 
                 mouseY >= dropRect.top && mouseY <= dropRect.bottom;
        },
        ondragenter: (event) => {
          // 使用拖拽状态管理器设置高亮
          const cell = event.target;
          DesignMode.dragStateManager.setHighlight(cell);
          DesignMode.dragStateManager.createRipple(cell);
        },
        ondragleave: (event) => {
          // 使用拖拽状态管理器清理高亮
          DesignMode.dragStateManager.clearHighlight();
        },
        ondrop: (event) => {
          const cell = event.target;
          const component = event.relatedTarget;
          const fieldType = component.getAttribute('data-type');
          
          console.log('=== 开始拖放处理 ===');
          console.log('目标单元格:', cell);
          console.log('拖拽组件:', component);
          console.log('字段类型:', fieldType);
          
          // 使用拖拽状态管理器立即清理所有拖拽状态
           DesignMode.dragStateManager.clearAll();
           
           console.log('拖拽状态已清理');
          
          // 获取单元格位置
          const row = parseInt(cell.getAttribute('data-row'), 10);
          const col = parseInt(cell.getAttribute('data-col'), 10);
          
          console.log('目标位置:', { row, col });
          
          // 检查单元格是否已有字段
          const existingFieldId = cell.getAttribute('data-field-id');
          console.log('现有字段ID:', existingFieldId);
          
          // 如果目标单元格已有字段，寻找下一个空位置
          let targetRow = row;
          let targetCol = col;
          
          if (existingFieldId) {
            console.log('目标单元格已有字段，寻找下一个空位置');
            
            // 寻找第一个空单元格
            const emptyCells = this.formData.layout.cells.filter(cell => !cell.fieldId);
            console.log('找到空单元格数量:', emptyCells.length);
            
            if (emptyCells.length > 0) {
              // 使用第一个空单元格
              const emptyCell = emptyCells[0];
              targetRow = emptyCell.row;
              targetCol = emptyCell.col;
              console.log('使用空单元格位置:', { row: targetRow, col: targetCol });
            } else {
              // 没有空单元格，添加新行
              console.log('没有空单元格，添加新行');
              this.addRow();
              targetRow = this.formData.layout.rows.length - 1;
              targetCol = 0;
              console.log('新行位置:', { row: targetRow, col: targetCol });
            }
          }
          
          // 检查是否是最后一行
          const isLastRow = targetRow === this.formData.layout.rows.length - 1;
          console.log('是否最后一行:', isLastRow);
          console.log('当前总行数:', this.formData.layout.rows.length);
          
          // 打印当前表单数据状态
          console.log('当前表单数据:', {
            rows: this.formData.layout.rows.length,
            columns: this.formData.layout.columns.length,
            cells: this.formData.layout.cells.length,
            fields: Object.keys(this.formData.fields).length
          });
          
          console.log('添加字段到位置:', { row: targetRow, col: targetCol });
          
          // 使用延迟添加字段，确保拖放状态完全清理
          setTimeout(() => {
            // 添加新字段
            console.log('准备添加字段:', { fieldType, row: targetRow, col: targetCol });
            this.addField(fieldType, targetRow, targetCol);
            console.log('字段已添加', { fieldType, row: targetRow, col: targetCol });
          }, 10);
          
          console.log('=== 拖放处理结束 ===');
        }
      });
  }
  
  /**
   * 检查所有单元格是否已填满字段
   * @returns {boolean} 是否所有单元格都已填满
   */
  checkAllCellsFilled() {
    // 检查是否所有单元格都已经有字段
    const emptyCells = this.formData.layout.cells.filter(cell => !cell.fieldId);
    return emptyCells.length === 0;
  }
  
  /**
   * 添加字段
   * @param {string} fieldType - 字段类型
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   * @returns {string} 字段ID
   */
  addField(fieldType, row, col) {
    console.log('=== addField 开始 ===');
    console.log('参数:', { fieldType, row, col });
    
    // 生成唯一ID
    const fieldId = generateId('field_');
    console.log('生成的字段ID:', fieldId);
    
    // 创建字段配置
    const fieldTypeConfig = FIELD_TYPES[fieldType] || {};
    const componentName = fieldTypeConfig.label || fieldType;
    const fieldLabel = generateFieldName(componentName, this.formData.fields);
    
    const fieldConfig = {
      type: fieldType,
      label: fieldLabel,
      properties: { ...DEFAULT_FIELD_PROPERTIES }
    };
    console.log('字段配置:', fieldConfig);
    
    // 添加到字段集合
    this.formData.fields[fieldId] = fieldConfig;
    console.log('字段已添加到fields集合，当前fields数量:', Object.keys(this.formData.fields).length);
    
    // 更新单元格字段ID
    const cellIndex = this.formData.layout.cells.findIndex(
      cell => cell.row === row && cell.col === col
    );
    console.log('查找单元格索引:', cellIndex);
    console.log('所有单元格:', this.formData.layout.cells);
    
    if (cellIndex !== -1) {
      console.log('更新前的单元格:', this.formData.layout.cells[cellIndex]);
      this.formData.layout.cells[cellIndex].fieldId = fieldId;
      console.log('更新后的单元格:', this.formData.layout.cells[cellIndex]);
    } else {
      console.error('未找到对应的单元格!', { row, col });
    }
    
    // 确保所有幽灵元素被清理
    const ghostElements = document.querySelectorAll('.fb-drag-ghost');
    console.log('清理幽灵元素数量:', ghostElements.length);
    ghostElements.forEach(ghost => {
      if (ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
      }
    });
    
    console.log('准备重新渲染网格...');
    // 重新渲染网格
    this.renderGrid();
    console.log('网格渲染完成');
    
    // 更新字段列表
    console.log('更新字段列表...');
    this.fillFieldList(this.dataPanel.querySelector('[data-tab-content="fields"]'));
    console.log('字段列表更新完成');
    
    // 选中新字段
    console.log('选中新字段:', fieldId);
    this.selectField(fieldId);
    
    // 延迟重新初始化拖放功能，确保DOM已完全更新
    setTimeout(() => {
      console.log('重新初始化拖放功能...');
      this.initDragAndDrop();
      console.log('拖放功能已延迟初始化');
    }, 100);
    
    console.log('=== addField 结束 ===');
    return fieldId;
  }
  
  /**
   * 移除字段
   * @param {string} fieldId - 字段ID
   */
  removeField(fieldId) {
    console.log('=== removeField 开始 ===');
    console.log('要移除的字段ID:', fieldId);
    
    if (!fieldId || !this.formData.fields[fieldId]) {
      console.log('字段不存在，跳过移除');
      return;
    }
    
    console.log('移除前的字段:', this.formData.fields[fieldId]);
    console.log('移除前fields数量:', Object.keys(this.formData.fields).length);
    
    // 从字段集合中移除
    delete this.formData.fields[fieldId];
    console.log('移除后fields数量:', Object.keys(this.formData.fields).length);
    
    // 更新单元格字段ID
    let updatedCells = 0;
    this.formData.layout.cells.forEach(cell => {
      if (cell.fieldId === fieldId) {
        console.log('清空单元格字段ID:', cell);
        cell.fieldId = null;
        updatedCells++;
      }
    });
    console.log('更新的单元格数量:', updatedCells);
    
    // 如果是当前选中的字段，取消选中
    if (this.selectedFieldId === fieldId) {
      console.log('取消选中当前字段');
      this.selectField(null);
    }
    
    console.log('=== removeField 结束 ===');
    
    // 确保所有幽灵元素被清理
    document.querySelectorAll('.fb-drag-ghost').forEach(ghost => {
      ghost.parentNode.removeChild(ghost);
    });
    
    // 重新渲染网格
    this.renderGrid();
    
    // 更新字段列表
    this.fillFieldList(this.dataPanel.querySelector('[data-tab-content="fields"]'));
    
    // 延迟重新初始化拖放功能，确保DOM已完全更新
    setTimeout(() => {
      this.initDragAndDrop();
      console.log('拖放功能已延迟初始化（移除字段后）');
    }, 100);
  }
  
  /**
   * 从字段列表中删除字段
   * @param {string} fieldId - 字段ID
   */
  deleteFieldFromList(fieldId) {
    if (!fieldId || !this.formData.fields[fieldId]) {
      console.log('字段不存在，无法删除');
      return;
    }
    
    // 确认删除
    const fieldConfig = this.formData.fields[fieldId];
    const fieldLabel = fieldConfig.label || fieldId;
    
    if (confirm(`确定要删除字段 "${fieldLabel}" 吗？`)) {
      console.log('从字段列表删除字段:', fieldId);
      this.removeField(fieldId);
    }
  }
  
  /**
   * 选择字段
   * @param {string|null} fieldId - 字段ID，null表示取消选择
   */
  selectField(fieldId) {
    // 更新选中状态
    this.selectedFieldId = fieldId;
    
    // 更新字段列表选中状态
    this.dataPanel.querySelectorAll('.fb-field-item').forEach(item => {
      const itemFieldId = item.getAttribute('data-field-id');
      item.classList.toggle('fb-active', itemFieldId === fieldId);
    });
    
    // 更新单元格选中状态
    this.designCanvas.querySelectorAll('.fb-grid-cell').forEach(cell => {
      const cellFieldId = cell.getAttribute('data-field-id');
      cell.classList.toggle('fb-field-active', cellFieldId === fieldId);
    });
    
    // 渲染属性面板
    if (fieldId) {
      this.renderFieldProperties(fieldId);
    } else {
      this.showPropertiesPanelMessage('请选择一个字段来编辑其属性');
    }
  }
  
  /**
   * 切换单元格选择状态
   * @param {HTMLElement} cellElement - 单元格元素
   * @param {boolean} isMultiSelect - 是否多选模式
   */
  toggleCellSelection(cellElement, isMultiSelect = false) {
    // 获取单元格位置
    const row = parseInt(cellElement.getAttribute('data-row'));
    const col = parseInt(cellElement.getAttribute('data-col'));
    
    // 查找是否已选中
    const cellIndex = this.selectedCells.findIndex(cell => cell.row === row && cell.col === col);
    
    if (cellIndex !== -1) {
      // 已选中，取消选择
      this.selectedCells.splice(cellIndex, 1);
      cellElement.classList.remove('fb-cell-active');
      
      // 移除多选提示
      const hint = cellElement.querySelector('.fb-multi-select-hint');
      if (hint) {
        hint.remove();
      }
    } else {
      // 未选中，添加选择
      
      // 如果不是多选模式，先清除之前的选择
      if (!isMultiSelect) {
        this.clearCellSelection();
      }
      
      // 添加到选中集合
      this.selectedCells.push({ row, col });
      cellElement.classList.add('fb-cell-active');
      
      // 如果是多选，添加序号提示
      if (this.selectedCells.length > 1) {
        const hint = createElement('div', {}, 'fb-multi-select-hint', this.selectedCells.length.toString());
        cellElement.appendChild(hint);
      }
    }
    
    // 设置选择模式为单元格选择
    this.selectionMode = 'cell';
    
    // 更新属性面板
    if (this.selectedCells.length > 0) {
      this.showPropertiesPanelMessage(`已选择 ${this.selectedCells.length} 个单元格`);
    } else {
      this.showPropertiesPanelMessage('请选择单元格或字段');
    }
  }
  
  /**
   * 清除所有单元格选择
   */
  clearCellSelection() {
    // 移除所有单元格的选中样式
    const cells = this.designCanvas.querySelectorAll('.fb-grid-cell');
    cells.forEach(cell => {
      cell.classList.remove('fb-cell-active');
      
      // 移除多选提示
      const hint = cell.querySelector('.fb-multi-select-hint');
      if (hint) {
        hint.remove();
      }
    });
    
    // 清空选中集合
    this.selectedCells = [];
  }
  
  /**
   * 删除行
   */
  deleteRow() {
    // 获取当前选中的字段所在行
    let rowToDelete = -1;
    
    if (this.selectedFieldId) {
      // 查找选中字段所在的单元格
      const cell = this.formData.layout.cells.find(cell => cell.fieldId === this.selectedFieldId);
      if (cell) {
        rowToDelete = cell.row;
      }
    }
    
    // 如果没有选中字段或找不到对应单元格，则删除最后一行
    if (rowToDelete === -1 && this.formData.layout.rows.length > 1) {
      rowToDelete = this.formData.layout.rows.length - 1;
    }
    
    // 检查是否可以删除行
    if (rowToDelete === -1 || this.formData.layout.rows.length <= 1) {
      alert('无法删除行，至少需要保留一行');
      return;
    }
    
    // 删除行配置
    this.formData.layout.rows.splice(rowToDelete, 1);
    
    // 删除该行的所有单元格，并处理字段
    const cellsToRemove = [];
    
    this.formData.layout.cells.forEach((cell, index) => {
      if (cell.row === rowToDelete) {
        // 记录要删除的单元格索引
        cellsToRemove.push(index);
        
        // 如果单元格有字段，删除字段
        if (cell.fieldId) {
          delete this.formData.fields[cell.fieldId];
        }
      } else if (cell.row > rowToDelete) {
        // 更新行号大于被删除行的单元格
        cell.row--;
      }
    });
    
    // 从后往前删除单元格，避免索引变化问题
    for (let i = cellsToRemove.length - 1; i >= 0; i--) {
      this.formData.layout.cells.splice(cellsToRemove[i], 1);
    }
    
    // 如果删除的是当前选中字段所在行，取消选中
    if (this.selectedFieldId && !this.formData.fields[this.selectedFieldId]) {
      this.selectField(null);
    }
    
    // 重新渲染网格
    this.renderGrid();
    
    // 更新字段列表
    this.fillFieldList(this.dataPanel.querySelector('[data-tab-content="fields"]'));
    
    // 重新初始化拖放功能
    this.initDragAndDrop();
  }
  
  /**
   * 删除列
   */
  deleteColumn() {
    // 获取当前选中的字段所在列
    let colToDelete = -1;
    
    if (this.selectedFieldId) {
      // 查找选中字段所在的单元格
      const cell = this.formData.layout.cells.find(cell => cell.fieldId === this.selectedFieldId);
      if (cell) {
        colToDelete = cell.col;
      }
    }
    
    // 如果没有选中字段或找不到对应单元格，则删除最后一列
    if (colToDelete === -1 && this.formData.layout.columns.length > 1) {
      colToDelete = this.formData.layout.columns.length - 1;
    }
    
    // 检查是否可以删除列
    if (colToDelete === -1 || this.formData.layout.columns.length <= 1) {
      alert('无法删除列，至少需要保留一列');
      return;
    }
    
    // 删除列配置
    this.formData.layout.columns.splice(colToDelete, 1);
    
    // 调整剩余列的宽度
    const columnCount = this.formData.layout.columns.length;
    const newColumnWidth = `${100 / columnCount}%`;
    
    this.formData.layout.columns.forEach(column => {
      column.width = newColumnWidth;
    });
    
    // 删除该列的所有单元格，并处理字段
    const cellsToRemove = [];
    
    this.formData.layout.cells.forEach((cell, index) => {
      if (cell.col === colToDelete) {
        // 记录要删除的单元格索引
        cellsToRemove.push(index);
        
        // 如果单元格有字段，删除字段
        if (cell.fieldId) {
          delete this.formData.fields[cell.fieldId];
        }
      } else if (cell.col > colToDelete) {
        // 更新列号大于被删除列的单元格
        cell.col--;
      }
    });
    
    // 从后往前删除单元格，避免索引变化问题
    for (let i = cellsToRemove.length - 1; i >= 0; i--) {
      this.formData.layout.cells.splice(cellsToRemove[i], 1);
    }
    
    // 如果删除的是当前选中字段所在列，取消选中
    if (this.selectedFieldId && !this.formData.fields[this.selectedFieldId]) {
      this.selectField(null);
    }
    
    // 重新渲染网格
    this.renderGrid();
    
    // 更新字段列表
    this.fillFieldList(this.dataPanel.querySelector('[data-tab-content="fields"]'));
    
    // 重新初始化拖放功能
    this.initDragAndDrop();
  }
  
  /**
   * 添加行
   */
  addRow() {
    // 添加新行配置
    this.formData.layout.rows.push({ height: '100px' });
    
    // 获取当前列数
    const columnCount = this.formData.layout.columns.length;
    const newRowIndex = this.formData.layout.rows.length - 1;
    
    // 为新行添加单元格
    for (let col = 0; col < columnCount; col++) {
      this.formData.layout.cells.push({
        row: newRowIndex,
        col,
        rowSpan: 1,
        colSpan: 1,
        fieldId: null
      });
    }
    
    // 重新渲染网格
    this.renderGrid();
    
    // 重新初始化拖放功能
    this.initDragAndDrop();
  }
  
  /**
   * 添加列
   */
  addColumn() {
    // 添加新列配置
    const columnCount = this.formData.layout.columns.length;
    const newColumnWidth = `${100 / (columnCount + 1)}%`;
    
    // 调整现有列宽度
    this.formData.layout.columns.forEach(column => {
      column.width = newColumnWidth;
    });
    
    // 添加新列
    this.formData.layout.columns.push({ width: newColumnWidth });
    
    // 获取当前行数
    const rowCount = this.formData.layout.rows.length;
    const newColIndex = this.formData.layout.columns.length - 1;
    
    // 为新列添加单元格
    for (let row = 0; row < rowCount; row++) {
      this.formData.layout.cells.push({
        row,
        col: newColIndex,
        rowSpan: 1,
        colSpan: 1,
        fieldId: null
      });
    }
    
    // 重新渲染网格
    this.renderGrid();
    
    // 重新初始化拖放功能
    this.initDragAndDrop();
  }
  
  // 合并单元格和拆分单元格功能已移除
  
  /**
   * 加载表单数据
   * @param {Object} data - 表单数据
   */
  loadFormData(data) {
    // 验证数据
    const validationResult = validateDesignData(data);
    if (!validationResult.valid) {
      console.error('加载表单数据失败:', validationResult.errors);
      return;
    }
    
    // 深拷贝数据
    this.formData = deepClone(data);
    
    // 重新渲染UI
    this.renderGrid();
    this.fillFieldList(this.dataPanel.querySelector('[data-tab-content="fields"]'));
    
    // 重新初始化拖放功能
    this.initDragAndDrop();
  }
  
  /**
   * 保存设计
   * @returns {Object} 表单设计数据
   */
  saveDesign() {
    // 深拷贝数据
    const designData = deepClone(this.formData);
    
    // 调用保存回调（仅在调试模式下显示JSON数据）
    if (typeof this.config.onSave === 'function') {
      // 如果调试模式未定义或为true，则调用onSave回调显示JSON
      if (this.config.debug !== false) {
        this.config.onSave(designData);
      } else {
        // 非调试模式下，仍然调用onSave但传递null作为第二个参数表示不显示JSON
        this.config.onSave(designData, false);
      }
    }
    
    return designData;
  }
  
  /**
   * 获取表单数据
   * @returns {Object} 表单设计数据
   */
  getData() {
    return deepClone(this.formData);
  }
  
  /**
   * 设置表单数据
   * @param {Object} data - 表单数据
   */
  setData(data) {
    this.loadFormData(data);
  }
  
  /**
   * 销毁实例
   */
  destroy() {
    // 清理事件监听器
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
    
    // 清理拖放交互
    interact('.fb-component-item').unset();
    interact('.fb-grid-cell').unset();
    
    // 清空容器
    if (this.container) {
      clearElement(this.container);
    }
    
    // 重置属性
    this.container = null;
    this.designContainer = null;
    this.dataPanel = null;
    this.designCanvas = null;
    this.propertiesPanel = null;
    this.formData = null;
    this.selectedFieldId = null;
    this.config = null;
  }
}