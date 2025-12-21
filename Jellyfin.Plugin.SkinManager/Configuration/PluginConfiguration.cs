using MediaBrowser.Model.Plugins;
using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.SkinManager.Configuration
{
    public class PluginConfiguration : BasePluginConfiguration
    {
        public string selectedSkin { get; set; }
        public string[] skinHistory { get; set; }
        public string[] userCssHistory { get; set; }

        public PluginConfiguration()
        {
            selectedSkin = "";
            skinHistory = Array.Empty<String>();
            userCssHistory = Array.Empty<String>();
        }
    }
}
