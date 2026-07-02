Set oShell = CreateObject("WScript.Shell")
oShell.Run "cmd /c cd /d """ & Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) & """ && node download-hd.js > download-log.txt 2>&1", 1, True
MsgBox "Listo! Revisa download-log.txt para ver el resultado.", 64, "Download HD Images"
