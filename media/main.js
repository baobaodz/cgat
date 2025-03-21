(function () {
  const vscode = acquireVsCodeApi();
  const form = document.getElementById("configForm");
  // 添加详情配置显示切换函数
  function toggleDetailConfig() {
    const detailConfig = document.getElementById("detailConfig");
    const hasAddButton = document.querySelector('input[name="hasAddButton"]').checked;
    const hasTableEditButton = document.querySelector('input[name="hasTableEditButton"]').checked;

    detailConfig.style.display = (hasAddButton || hasTableEditButton) ? "block" : "none";
  }

  // 初始化时执行一次
  toggleDetailConfig();

  // 监听新增按钮和编辑按钮变化
  document.querySelector('input[name="hasAddButton"]').addEventListener("change", toggleDetailConfig);
  document.querySelector('input[name="hasTableEditButton"]').addEventListener("change", toggleDetailConfig);

  document.getElementById("saveConfig").addEventListener("click", () => {
    const selectorPrefix = document.getElementById("selectorPrefix").value;
    vscode.postMessage({
      command: "saveConfig",
      selectorPrefix: selectorPrefix,
    });
  });

  function toggleModuleNameInput() {
    const moduleNameGroup = document.getElementById("moduleNameGroup");
    const generateModule = document.querySelector('input[name="generateModule"]');
    moduleNameGroup.style.display = generateModule.checked ? "flex" : "none";
  }

  // 初始化时执行一次
  toggleModuleNameInput();

  // 监听复选框变化
  document.querySelector('input[name="generateModule"]').addEventListener("change", toggleModuleNameInput);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const config = Object.fromEntries(formData);

    vscode.postMessage({
      command: "saveConfig",
      ...config,
    });
  });

  document.getElementById("generateComponent").addEventListener("click", () => {
    const formData = new FormData(form);
    const config = Object.fromEntries(formData);
    console.log("🚀 -> document.getElementById -> config:", config);

    vscode.postMessage({
      command: "generateComponent",
      ...config,
    });
  });

  document.getElementById("selectPath")?.addEventListener("click", () => {
    vscode.postMessage({ command: "selectPath" });
  });
  function updateFilePreview() {
    const filePreview = document.getElementById("filePreview");
    const formData = new FormData(form);
    const config = Object.fromEntries(formData);

    const moduleName = config.moduleName || "abc-module";
    const componentName = config.componentName || "xyz-component";

    const structure = buildFileStructure(config, moduleName, componentName);
    filePreview.innerHTML = renderTree(structure);
  }

  function buildFileStructure(config, moduleName, componentName) {
    const structure = {};
    // 获取目标路径作为根节点
    const targetPath =
      document.querySelector('input[name="targetPath"]')?.value ||
      document.querySelector('span[id="targetPath"]')?.textContent;
    const rootPath = targetPath?.replace(/\\/g, "/").split("/").pop() || "root";

    // 先构建基础结构
    let baseStructure = {
      [componentName]: {
        [`${componentName}.component.html`]: "file",
        [`${componentName}.component.less`]: "file",
        [`${componentName}.component.ts`]: "file",
      },
    };
    // 如果勾选新增按钮,添加详情组件
    if (config.hasAddButton === "on" || config.hasTableEditButton === "on") {
      baseStructure = {
        [componentName]: {
          [`${componentName}.component.html`]: "file",
          [`${componentName}.component.less`]: "file",
          [`${componentName}.component.ts`]: "file",
          ["detail"]: {
            [`${componentName}-detail.component.html`]: "file",
            [`${componentName}-detail.component.less`]: "file",
            [`${componentName}-detail.component.ts`]: "file",
          },
        },
      };
    }
    structure[rootPath] = {};
    // 如果勾选生成模块
    if (config.generateModule === "on") {
      // 如果模块名与根目录相同,直接在根目录添加文件
      if (moduleName === rootPath) {
        structure[rootPath] = {
          ...baseStructure,
          [`${moduleName}.module.ts`]: "file",
          [`${moduleName}-routing.module.ts`]: "file",
          [`${moduleName}.service.ts`]: "file",
          [`${moduleName}.const.ts`]: "file",
        };
      } else {
        // 否则创建子模块目录
        structure[rootPath][moduleName] = {
          ...baseStructure,
          [`${moduleName}.module.ts`]: "file",
          [`${moduleName}-routing.module.ts`]: "file",
          [`${moduleName}.service.ts`]: "file",
          [`${moduleName}.const.ts`]: "file",
        };
      }
    }
    // 使用现有模块
    else if (window.existingModuleName) {
      console.log(
        "🚀 -> buildFileStructure -> window.existingModulePath:",
        window.existingModuleName
      );
      const existingModuleName = window.existingModuleName;
      // 如果现有模块与根目录相同
      if (existingModuleName === rootPath) {
        structure[rootPath] = {
          ...baseStructure,
          [`${existingModuleName}.module.ts`]: {
            _existing: true,
            type: "file",
          },
          [`${existingModuleName}-routing.module.ts`]: {
            _existing: true,
            type: "file",
          },
          [`${existingModuleName}.service.ts`]: {
            _existing: true,
            type: "file",
          },
        };
      } else {
        // 现有模块作为子目录
        structure[rootPath][existingModuleName] = {
          ...baseStructure,
          [`${existingModuleName}.module.ts`]: {
            _existing: true,
            type: "file",
          },
          [`${existingModuleName}-routing.module.ts`]: {
            _existing: true,
            type: "file",
          },
          [`${existingModuleName}.service.ts`]: {
            _existing: true,
            type: "file",
          },
        };
      }
    }

    return structure;
  }

  function renderTree(structure, level = 0) {
    let html = "";
    const indent = "    ".repeat(level);

    Object.entries(structure).forEach(([key, value], index, array) => {
      if (key === "_existing") {
        return; // 忽略 _existing 属性
      }

      const isLast = index === array.length - 1;
      const prefix = isLast ? "└── " : "├── ";

      if (typeof value === "object") {
        if (value.type === "file") {
          const fileClass = value._existing ? "file existing" : "file";
          html += `<div class="tree-item">${indent}${prefix}<span class="${fileClass}">${key}</span></div>`;
        } else {
          const folderClass =
            level === 0
              ? "folder root"
              : value._existing
                ? "folder existing"
                : "folder";
          html += `<div class="tree-item">${indent}${prefix}<span class="${folderClass}">${key}/</span></div>`;
          html += renderTree(value, level + 1);
        }
      } else {
        html += `<div class="tree-item">${indent}${prefix}<span class="file">${key}</span></div>`;
      }
    });

    return html;
  }
  // 监听表单变化
  form.addEventListener("input", updateFilePreview);
  document.addEventListener("DOMContentLoaded", updateFilePreview);
})();
