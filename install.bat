This will not work if you have installed jellyfin to a custom location
dotnet publish --configuration Release --output bin
move bin\Jellyfin.Plugin.SkinManager.dll C:\ProgramData\Jellyfin\Server\plugins\SkinManager
