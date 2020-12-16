using MediaBrowser.Model.Plugins;
using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.SkinManager.Configuration
{
    public class PluginConfiguration : BasePluginConfiguration
    {
        public string selectedSkin { get; set; }
        public string[] options { get; set; }

        public PluginConfiguration()
        {
            selectedSkin = "";
            options = Array.Empty<String>();
        }
    }
}
