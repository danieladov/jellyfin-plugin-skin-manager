@ECHO OFF
@echo This will not work if you have installed jellyfin to a custom location
set /p ask = Enter 'X' to continue or 'C' to cancel: 
if "%ask%" neq "x" (
    @echo starting install...
    dotnet publish --configuration Release --output bin
    move bin\Jellyfin.Plugin.SkinManager.dll C:\ProgramData\Jellyfin\Server\plugins\SkinManager
)