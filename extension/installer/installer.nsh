!macro customInstall
  ; Registrar extensão .jfolder
  WriteRegStr HKCR ".jfolder" "" "JFolder.Archive"
  WriteRegStr HKCR "JFolder.Archive" "" "JFolder Archive"
  WriteRegStr HKCR "JFolder.Archive\DefaultIcon" "" "$INSTDIR\JFolder.exe,0"
  WriteRegStr HKCR "JFolder.Archive\shell\open\command" "" '"$INSTDIR\JFolder.exe" "%1"'
  
  ; Menu de contexto para pastas
  WriteRegStr HKCR "Directory\shell\ConvertToJFolder" "" "Converter para JFolder"
  WriteRegStr HKCR "Directory\shell\ConvertToJFolder" "Icon" "$INSTDIR\JFolder.exe,0"
  WriteRegStr HKCR "Directory\shell\ConvertToJFolder\command" "" '"$INSTDIR\JFolder.exe" "--create" "%1"'
!macroend

!macro customUnInstall
  ; Remover registros
  DeleteRegKey HKCR ".jfolder"
  DeleteRegKey HKCR "JFolder.Archive"
  DeleteRegKey HKCR "Directory\shell\ConvertToJFolder"
!macroend