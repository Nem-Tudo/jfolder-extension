let currentData = null;
let currentPath = '/';
let fileName = '';

// Listener para quando um arquivo é aberto externamente
window.electronAPI.onOpenFile((data) => {
    try {
        currentData = JSON.parse(data.content);
        fileName = data.fileName;
        renderFileTree();
    } catch (err) {
        alert('Erro ao ler arquivo JFolder: ' + err.message);
    }
});

async function openFile() {
    const result = await window.electronAPI.selectFile();
    if (result) {
        try {
            currentData = JSON.parse(result.content);
            fileName = result.fileName;
            renderFileTree();
        } catch (err) {
            alert('Erro ao ler arquivo JFolder: ' + err.message);
        }
    }
}

function renderFileTree() {
    if (!currentData) return;

    document.getElementById('extractBtn').disabled = false;
    document.getElementById('breadcrumb').style.display = 'block';

    const items = getItemsInPath(currentPath);
    const content = document.getElementById('content');

    if (items.folders.length === 0 && items.files.length === 0) {
        content.innerHTML = '<div class="empty-state"><div class="icon">📂</div><p>Pasta vazia</p></div>';
        return;
    }

    let html = '<ul class="file-list">';

    // Folders first
    items.folders.forEach(folder => {
        html += `
            <li class="file-item" onclick="navigateToFolder('${folder}')">
                <div class="file-icon">📁</div>
                <div class="file-name">${folder}</div>
            </li>
        `;
    });

    // Then files
    items.files.forEach(file => {
        const fullPath = currentPath === '/' ? `/${file}` : `${currentPath}/${file}`;
        html += `
            <li class="file-item" onclick="previewFile('${fullPath.replace(/'/g, "\\'")}')">
                <div class="file-icon">${getFileIcon(file)}</div>
                <div class="file-name">${file}</div>
            </li>
        `;
    });

    html += '</ul>';
    content.innerHTML = html;

    updateBreadcrumb();
}

function getItemsInPath(path) {
    const folders = new Set();
    const files = [];

    const normalizedPath = path === '/' ? '' : path;

    Object.keys(currentData).forEach(filePath => {
        if (filePath.startsWith(normalizedPath + '/') || (normalizedPath === '' && filePath.startsWith('/'))) {
            let relativePath = filePath.substring(normalizedPath.length);
            if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);

            const parts = relativePath.split('/');

            if (parts.length > 1) {
                folders.add(parts[0]);
            } else if (parts[0]) {
                files.push(parts[0]);
            }
        }
    });

    return {
        folders: Array.from(folders).sort(),
        files: files.sort()
    };
}

function navigateToFolder(folder) {
    currentPath = currentPath === '/' ? `/${folder}` : `${currentPath}/${folder}`;
    renderFileTree();
}

function navigateTo(path) {
    currentPath = path;
    renderFileTree();
}

function updateBreadcrumb() {
    const pathElement = document.getElementById('currentPath');
    if (currentPath === '/') {
        pathElement.innerHTML = '';
        return;
    }

    const parts = currentPath.split('/').filter(p => p);
    let html = '';
    let accPath = '';

    parts.forEach((part, i) => {
        accPath += '/' + part;
        const isLast = i === parts.length - 1;
        if (isLast) {
            html += ` / <span style="color:#333">${part}</span>`;
        } else {
            html += ` / <span onclick="navigateTo('${accPath}')">${part}</span>`;
        }
    });

    pathElement.innerHTML = html;
}

function previewFile(filePath) {
    const content = currentData[filePath];
    const fileName = filePath.split('/').pop();

    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = `
        <div style="margin-bottom: 20px;">
            <button class="btn btn-secondary" onclick="renderFileTree()">← Voltar</button>
        </div>
        <h3 style="margin-bottom: 15px;">${getFileIcon(fileName)} ${fileName}</h3>
        <div class="file-preview">
            <pre>${escapeHtml(content)}</pre>
        </div>
    `;
}

function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
        'js': '📄',
        'json': '📋',
        'html': '🌐',
        'css': '🎨',
        'txt': '📝',
        'md': '📖',
        'png': '🖼️',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'gif': '🖼️',
        'pdf': '📕',
        'zip': '🗜️'
    };
    return icons[ext] || '📄';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function extractFiles() {
    if (!currentData) {
        alert('Nenhum arquivo JFolder carregado!');
        return;
    }

    const result = await window.electronAPI.extractFiles(currentData, fileName);

    if (result.success) {
        alert(`Arquivos extraídos com sucesso!\n\nPasta criada em:\n${result.path}`);
    } else {
        alert('Erro ao extrair arquivos: ' + (result.error || 'Operação cancelada'));
    }
}