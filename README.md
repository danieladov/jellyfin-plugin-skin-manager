<h1 align="center">Jellyfin Skin Manager Plugin</h1>
<h3 align="center">Part of the <a href="https://jellyfin.org">Jellyfin Project</a></h3>

<p align="center">
Jellyfin Skin Manager is a plugin that helps you to download and install skins;

</p>

## Install Process


## Requirements
- Version 3.x of the plugin requires **Jellyfin 12.0 or newer** (it is built for .NET 10).
- For Jellyfin 10.10 / 10.11 use plugin version 2.0.2.

## From Repository
1. In Jellyfin, go to **Dashboard -> Plugins -> Manage Repositories -> New Repository** and paste this link:
```
https://raw.githubusercontent.com/danieladov/JellyfinPluginManifest/master/manifest.json
```
2. Go to **Dashboard -> Plugins -> Catalog** (called *Available* in some versions) and search for Skin Manager
3. Click on it and install
4. Restart Jellyfin

## From .zip file
1. Download the .zip file from the release page.
2. Extract it and place the .dll file in a folder called ```plugins/SkinManager``` under the program data directory or inside the portable install directory.
3. Restart Jellyfin.

## User Guide
1. Go to **Dashboard -> Plugins**, click on Skin Manager.
2. Select the skin you want and adjust its options.
3. Optionally put your own CSS in the **Custom CSS** box. It is kept when you change skins, and its `@import` lines are moved to the top automatically.
4. Click **Set skin**. The page reloads with the new skin.

- **Remove skin** goes back to the stock Jellyfin look (your Custom CSS is kept).
- **Show generated CSS** shows exactly what will be written to *Dashboard -> Branding -> Custom CSS*, if you would rather copy it by hand.
- The first time Skin Manager replaces CSS it did not write itself, a copy is saved and shown under **Previous Custom CSS backup**, so nothing is lost.

### Going back to the stock look without the plugin
Skins live in *Dashboard -> Branding -> Custom CSS*. Uninstalling the plugin does **not** remove them: clear that box (or click **Remove skin** before uninstalling) and save.

### Skins look broken after a Jellyfin update
Skins are made and hosted by their authors. Jellyfin 12 moved all built-in themes to CSS variables, so older skins may need an update from their author. JellySkin (archived) and JellyFlix are no longer maintained upstream; Ultrachromic (and its Monochromic / Kaleidochromic / Novachromic presets), ElegantFin and Zesty are actively maintained.

## Build Process
1. Clone or download this repository
2. Ensure you have the .NET 10 SDK installed
3. Build plugin with following command.
```sh
dotnet publish --configuration Release --output bin
```
4. Place the resulting .dll file in a folder called ```plugins/SkinManager``` under  the program data directory or inside the portable install directory



## Using with reverse proxy
When using the Nginx Reverse proxy config from the [Jellyfin docs](https://jellyfin.org/docs/general/networking/nginx.html) the theme might not work by default. (If you are using the subpath config, you can ignore all this.)

Because the config includes Content-Security-Policy which reduces risk of XSS, you need to add the URL from the skin repo and the fonts to the list of allowed external sources.

For example to use Kaleidochromic you need to do [this](https://github.com/CTalvio/Kaleidochromic/blob/main/README.md#using-with-reverse-proxy)


## JSON
  ## Skin Properties
  - name //The name of the skin
  - author //The author of the skin
  - defaultCss //The base css of the skin
  - categories //An array of { name, options } groups shown as sections
  - options  //An array of options that will modified the skin
    - ## Options Properties
    - type //the type of the input (checkBox, number, text, selector, colorPicker, slider, blurSlider, googleFonts)
    - name // the name of the option
    - description // the description of the option
    - css //The css code that will modified the skin $ symbols in this code will be replaced by the value selected by the user (in number, select and color picer)
    
    Some option have custom properties:
    
    - ## number properties
      - default //Default value
      - step //step of the input
    - ## selector properties
      - selections //Array of options
        - ## selections properties
          - name // name of the option
          - value // value of the option
    
   

