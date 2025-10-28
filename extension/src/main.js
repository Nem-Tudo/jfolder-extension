const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

let mainWindow;

// Registrar protocolo para associação de arquivos
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('jfolder', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('jfolder');
}

function createWindow(filePath = null) {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, '../build/icon.png'),
        title: 'JFolder Viewer',
        backgroundColor: '#f5f5f5'
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Abrir arquivo se foi passado como argumento
    if (filePath && fs.existsSync(filePath)) {
        mainWindow.webContents.on('did-finish-load', () => {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath, '.jfolder');
            mainWindow.webContents.send('open-file', { content, fileName });
        });
    }

    // Menu customizado
    const template = [
        {
            label: 'Arquivo',
            submenu: [
                {
                    label: 'Abrir JFolder',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => openFileDialog()
                },
                {
                    label: 'Criar JFolder de Pasta',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => createFromFolder()
                },
                { type: 'separator' },
                {
                    label: 'Sair',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'Ajuda',
            submenu: [
                {
                    label: 'Sobre',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Sobre JFolder',
                            message: 'JFolder v1.0.0',
                            detail: 'Criado por Nem Tudo\n\nVisualizador e gerenciador de arquivos JFolder.'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function openFileDialog() {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'JFolder Files', extensions: ['jfolder'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath, '.jfolder');
            mainWindow.webContents.send('open-file', { content, fileName });
        }
    });
}

function createFromFolder() {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const folderPath = result.filePaths[0];
            const jfolderData = {};

            function readDirectory(dirPath, baseDir) {
                const items = fs.readdirSync(dirPath);

                items.forEach(item => {
                    const fullPath = path.join(dirPath, item);
                    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory()) {
                        readDirectory(fullPath, baseDir);
                    } else {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        jfolderData['/' + relativePath] = content;
                    }
                });
            }

            readDirectory(folderPath, folderPath);

            // Salvar arquivo
            dialog.showSaveDialog(mainWindow, {
                defaultPath: path.basename(folderPath) + '.jfolder',
                filters: [{ name: 'JFolder Files', extensions: ['jfolder'] }]
            }).then(saveResult => {
                if (!saveResult.canceled) {
                    fs.writeFileSync(saveResult.filePath, JSON.stringify(jfolderData, null, 2));
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'Sucesso',
                        message: 'JFolder criado com sucesso!',
                        detail: `Arquivo salvo em: \n${saveResult.filePath} `
                    });
                }
            });
        }
    });
}

// IPC Handlers
ipcMain.handle('extract-files', async (event, { data, fileName }) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: 'Escolha onde extrair os arquivos'
        });

        if (result.canceled) return { success: false };

        const extractPath = path.join(result.filePaths[0], fileName);

        // Criar pasta de destino
        if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true });
        }

        // Extrair arquivos
        Object.keys(data).forEach(filePath => {
            const fullPath = path.join(extractPath, filePath);
            const dirPath = path.dirname(fullPath);

            // Criar diretórios necessários
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // Escrever arquivo
            fs.writeFileSync(fullPath, data[filePath], 'utf8');
        });

        // Abrir pasta no explorador
        shell.openPath(extractPath);

        return { success: true, path: extractPath };
    } catch (error) {
        console.error('Erro ao extrair:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'JFolder Files', extensions: ['jfolder'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath, '.jfolder');
        return { content, fileName };
    }

    return null;
});

// Manipular abertura de arquivo (quando clica duas vezes)
app.on('open-file', (event, filePath) => {
    event.preventDefault();
    if (mainWindow) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath, '.jfolder');
        mainWindow.webContents.send('open-file', { content, fileName });
    } else {
        createWindow(filePath);
    }
});

app.whenReady().then(() => {
    // Verificar se foi passado um arquivo como argumento
    const filePath = process.argv.find(arg => arg.endsWith('.jfolder'));
    createWindow(filePath);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});