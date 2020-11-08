using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.SkinManager.Configuration
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
