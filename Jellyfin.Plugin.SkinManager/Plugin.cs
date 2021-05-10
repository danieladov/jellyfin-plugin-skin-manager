using System;
using System.Collections.Generic;
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

        public override string Description
            => "Skin Manager";

        private readonly Guid _id = new Guid("e9ca8b8e-ca6d-40e7-85dc-58e536df8eb3");
        public override Guid Id => _id;

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "SkinManager",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.configurationpage.html"
                },
                 new PluginPageInfo
                {
                    Name = "fontpicker.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.fontpicker.js"
                }, 
                new PluginPageInfo
                {
                    Name = "fontpicker.css",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.jquery.fontpicker.min.css"
                }
            };
        }
    }
}
