@echo off
title Desinstalar completamente o JFolder
echo ==================================================
echo        DESINSTALADOR COMPLETO DO JFOLDER
echo ==================================================
echo.

:: Fechar o app se estiver aberto
echo [1/4] Fechando o JFolder...
taskkill /IM "JFolder.exe" /F >nul 2>&1

:: Remover chaves de registro da extensão .jfolder
echo [2/4] Removendo chaves de registro...
reg delete "HKCR\.jfolder" /f >nul 2>&1
reg delete "HKCR\JFolder.Archive" /f >nul 2>&1
reg delete "HKCR\Directory\shell\ConvertToJFolder" /f >nul 2>&1

:: Também tentar remover do contexto do usuário local (caso tenha sido instalado como admin)
reg delete "HKCU\Software\Classes\.jfolder" /f >nul 2>&1
reg delete "HKCU\Software\Classes\JFolder.Archive" /f >nul 2>&1
reg delete "HKCU\Software\Classes\Directory\shell\ConvertToJFolder" /f >nul 2>&1

:: Remover possíveis restos da instalação
echo [3/4] Limpando pasta de instalação...
if exist "%ProgramFiles%\JFolder" rd /s /q "%ProgramFiles%\JFolder"
if exist "%ProgramFiles(x86)%\JFolder" rd /s /q "%ProgramFiles(x86)%\JFolder"
if exist "%LocalAppData%\Programs\JFolder" rd /s /q "%LocalAppData%\Programs\JFolder"

:: Atualizar o Explorer
echo [4/4] Atualizando o Explorer...
powershell -Command "Stop-Process -Name explorer -Force" >nul 2>&1
start explorer.exe

echo.
echo ==================================================
echo     JFolder removido completamente do sistema.
echo ==================================================
pause