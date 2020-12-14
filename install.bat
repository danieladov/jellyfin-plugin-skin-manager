This will not work if you have installed jellyfin to a custom location
dotnet publish --configuration Release --output bin
move D:\Jellyfin\jellyfin-plugin-skin-manager-cssEditor\bin\Jellyfin.Plugin.SkinManager.dll C:\ProgramData\Jellyfin\Server\plugins\SkinManager