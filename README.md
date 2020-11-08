<h1 align="center">Jellyfin Theme Songs Plugin</h1>
<h3 align="center">Part of the <a href="https://jellyfin.media">Jellyfin Project</a></h3>

<p align="center">
Jellyfin Skin Manager is a plugin that helps you to download and install skins;

</p>

## Install Process


## From Repository
1. In jellyfin, go to dashboard -> plugins -> Repositories -> add and paste this link https://raw.githubusercontent.com/danieladov/JellyfinPluginManifest/master/manifest.json
2. Go to Catalog and search for Skin Manager
3. Click on it and install
4. Restart Jellyfin


## From .zip file
1. Download the .zip file from release page.
2. Extract it and place the .dll file in a folder called ```plugins/SkinManager``` under  the program data directory or inside the portable install directory.
3. Restart Jellyfin.

## User Guide
1. Go to Plugins, click on Skin Manager.
2. Select the skin you want to install.
3. Click set skin.



## Build Process
1. Clone or download this repository
2. Ensure you have .NET Core SDK setup and installed
3. Build plugin with following command.
```sh
dotnet publish --configuration Release --output bin
```
4. Place the resulting .dll file in a folder called ```plugins/SkinManager``` under  the program data directory or inside the portable install directory



## Using with reverse proxy
When using the Nginx Reverse proxy config from the [Jellyfin docs](https://jellyfin.org/docs/general/networking/nginx.html) the theme might not work by default. (If you are using the subpath config, you can ignore all this.)

Because the config includes Content-Security-Policy which reduces risk of XSS, you need to add the URL from the skin repo and the fonts to the list of allowed external sources.

For example to use Kaleidochromic you need to do [this](https://github.com/CTalvio/Kaleidochromic/blob/main/README.md#using-with-reverse-proxy)

