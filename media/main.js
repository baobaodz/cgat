(function() {
    const vscode = acquireVsCodeApi();
    const form = document.getElementById('configForm');
    // 添加详情配置显示切换函数
    function toggleDetailConfig() {
      const detailConfig = document.getElementById('detailConfig');
      detailConfig.style.display = document.querySelector('input[name="hasAddButton"]').checked ? 'block' : 'none';
    }

    // 初始化时执行一次
    toggleDetailConfig();

    // 监听新增按钮变化
    document.querySelector('input[name="hasAddButton"]').addEventListener('change', toggleDetailConfig);

    document.getElementById('saveConfig').addEventListener('click', () => {
      const selectorPrefix = document.getElementById('selectorPrefix').value;
      vscode.postMessage({
        command: 'saveConfig',
        selectorPrefix: selectorPrefix
      });
    });
    
    function toggleModuleNameInput() {
      const moduleNameGroup = document.getElementById('moduleNameGroup');
      const generateModule = document.querySelector('input[name="generateModule"]');
      moduleNameGroup.style.display = generateModule.checked ? 'flex' : 'none';
    }
    
    // 初始化时执行一次
    toggleModuleNameInput();
    
    // 监听复选框变化
    document.querySelector('input[name="generateModule"]').addEventListener('change', toggleModuleNameInput);
    

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const config = Object.fromEntries(formData);
        
        vscode.postMessage({
            command: 'saveConfig',
            ...config
        });
    });
    
    document.getElementById('generateComponent').addEventListener('click', () => {
        const formData = new FormData(form);
        const config = Object.fromEntries(formData);
        console.log('🚀 -> document.getElementById -> config:', config);
        
        vscode.postMessage({
            command: 'generateComponent',
            ...config
        });
    });

    document.getElementById('selectPath')?.addEventListener('click', () => {
      vscode.postMessage({ command: 'selectPath' });
    });
  })();
  