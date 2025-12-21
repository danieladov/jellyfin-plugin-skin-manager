using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Plugin.SkinManager.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.SkinManager
{
    public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages 
    {
        public Plugin(IApplicationPaths appPaths, IXmlSerializer xmlSerializer)
            : base(appPaths, xmlSerializer)
        {
            Instance = this;
        }

        public override string Name => "SkinManager";

        public static Plugin Instance { get; private set; }

        public override string Description => "Skin Manager";

        private readonly Guid _id = new Guid("e9ca8b8e-ca6d-40e7-85dc-58e536df8eb3");
        public override Guid Id => _id;

        public PluginConfiguration PluginConfiguration => Configuration;

        public IEnumerable<PluginPageInfo> GetPages()
        {
            var pageNames = new[]
            {
                "SkinManager",
                "fontpicker.js",
                "fontpicker.css",
                "skin.js",
                "controls.Control.js",
                "controls.ColorControl.js",
                "controls.SliderControl.js",
                "controls.CheckBoxControl.js",
                "controls.NumberControl.js",
                "controls.SelectControl.js",
                "controls.FontPickerControl.js",
                "controls.TextAreaControl.js",
                "controls.Category.js",
                "colorpicker.js",
                "MainController.js",
                "style.css",
                "common.js",
                "history",
                "ConfigController.js",
                "HistoryController.js",
            };

            var prefix = GetType().Namespace + ".Configuration.";

            return pageNames.Select(name => new PluginPageInfo
            {
                Name = name,
                EmbeddedResourcePath = name switch
                {
                    "SkinManager"   => prefix + "configurationpage.html",
                    "history"       => prefix + "history.html",
                    "fontpicker.css" => prefix + "jquery.fontpicker.min.css",
                    _                => prefix + name
                },
                EnableInMainMenu = name.Equals("SkinManager", StringComparison.OrdinalIgnoreCase)
            });
        }
    }
}
