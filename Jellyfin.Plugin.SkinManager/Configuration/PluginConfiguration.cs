using System;
using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.SkinManager.Configuration
{
    public class PluginConfiguration : BasePluginConfiguration
    {
        public PluginConfiguration()
        {
            selectedSkin = string.Empty;
            options = Array.Empty<string>();
            customCss = string.Empty;
            previousCss = string.Empty;
        }

        /// <summary>Gets or sets the defaultCss of the selected skin (identifies the skin).</summary>
        public string selectedSkin { get; set; }

        /// <summary>Gets or sets the saved option values, stored as [css, value, css, value, ...].</summary>
        public string[] options { get; set; }

        /// <summary>Gets or sets extra CSS the user wants appended after the skin.</summary>
        public string customCss { get; set; }

        /// <summary>Gets or sets a backup of the branding CSS that existed before Skin Manager first replaced it.</summary>
        public string previousCss { get; set; }
    }
}
