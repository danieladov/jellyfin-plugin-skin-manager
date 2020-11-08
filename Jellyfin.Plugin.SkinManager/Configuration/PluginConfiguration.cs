using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.Css.Configuration
{
    public class PluginConfiguration : BasePluginConfiguration
    {
        public string selectedCss { get; set; }

        public PluginConfiguration()
        {
            selectedCss = "";
        }
    }
}
