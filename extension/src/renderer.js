// renderer.js

let currentData = null;
let fileName = '';
let expandedFolders = new Set();
let selectedPath = null;

// Listener para quando um arquivo é aberto externamente
window.electronAPI.onOpenFile((data) => {
    try {
        currentData = JSON.parse(data.content);
        fileName = data.fileName;
        expandedFolders.clear();
        selectedPath = null;
        renderInterface();
    } catch (err) {
        alert('Erro ao ler arquivo JFolder: ' + err.message);
        console.error('Erro detalhado:', err);
    }
});

async function openFile() {
    const result = await window.electronAPI.selectFile();
    if (result) {
        try {
            currentData = JSON.parse(result.content);
            fileName = result.fileName;
            expandedFolders.clear();
            selectedPath = null;
            renderInterface();
        } catch (err) {
            alert('Erro ao ler arquivo JFolder: ' + err.message);
            console.error('Erro detalhado:', err);
        }
    }
}

function renderInterface() {
    if (!currentData) return;

    document.getElementById('extractBtn').disabled = false;

    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="sidebar">
            <div class="tree-container" id="treeContainer"></div>
        </div>
        <div class="viewer-panel">
            <div class="viewer-header" id="viewerHeader">
                Nenhum arquivo selecionado
            </div>
            <div class="viewer-content" id="viewerContent">
                <div class="empty-state">
                    <div class="empty-state-icon">📄</div>
                    <div>Selecione um arquivo para visualizar</div>
                </div>
            </div>
        </div>
    `;

    renderTree();
}

function buildTree() {
    const tree = { name: '/', path: '/', type: 'folder', children: {} };

    Object.keys(currentData).forEach(filePath => {
        const parts = filePath.split('/').filter(p => p);
        let current = tree;

        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                // É um arquivo
                if (!current.children[part]) {
                    current.children[part] = {
                        name: part,
                        path: filePath,
                        type: 'file'
                    };
                }
            } else {
                // É uma pasta
                if (!current.children[part]) {
                    current.children[part] = {
                        name: part,
                        path: '/' + parts.slice(0, index + 1).join('/'),
                        type: 'folder',
                        children: {}
                    };
                }
                current = current.children[part];
            }
        });
    });

    return tree;
}

function renderTree() {
    const tree = buildTree();
    const container = document.getElementById('treeContainer');

    // Verificar se está vazio
    if (Object.keys(tree.children).length === 0) {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 12px;">
                <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;">📂</div>
                <div>Nenhum arquivo no JFolder</div>
            </div>
        `;
        return;
    }

    let html = '';

    function renderNode(node, level = 0) {
        const isExpanded = expandedFolders.has(node.path);
        const isSelected = selectedPath === node.path;

        if (level > 0) {
            const indent = '<span class="indent"></span>'.repeat(level - 1);
            const icon = node.type === 'folder'
                ? (isExpanded ? '▼' : '▶')
                : '  ';

            html += `
                <div class="tree-item ${node.type} ${isSelected ? 'selected' : ''}" 
                     onclick="handleItemClick('${escapePath(node.path)}', '${node.type}')"
                     data-path="${escapePath(node.path)}">
                    ${indent}
                    <span class="tree-arrow">${icon}</span>
                    <span class="tree-icon">${getFileIcon(node.name, node.type)}</span>
                    <span class="tree-label">${escapeHtml(node.name)}</span>
                </div>
            `;
        }

        if (node.type === 'folder' && (level === 0 || isExpanded)) {
            const children = Object.values(node.children).sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'folder' ? -1 : 1;
            });

            children.forEach(child => renderNode(child, level + 1));
        }
    }

    renderNode(tree);
    container.innerHTML = html;
}

function handleItemClick(path, type) {
    if (type === 'folder') {
        if (expandedFolders.has(path)) {
            expandedFolders.delete(path);
        } else {
            expandedFolders.add(path);
        }
        renderTree();
    } else {
        selectedPath = path;
        renderTree();
        displayFile(path);
    }
}

function displayFile(filePath) {
    const content = currentData[filePath];
    const fileName = filePath.split('/').pop();

    const header = document.getElementById('viewerHeader');
    const viewer = document.getElementById('viewerContent');

    header.innerHTML = `${escapeHtml(fileName)}`;

    viewer.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
}

function getFileIcon(fileName, type) {
    if (type === 'folder') {
        return '📁';
    }

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
        'zip': '🗜️',
        'xml': '📰',
        'yml': '⚙️',
        'yaml': '⚙️'
    };
    return icons[ext] || '📄';
}

function escapePath(path) {
    return path.replace(/'/g, "\\'").replace(/"/g, '&quot;');
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