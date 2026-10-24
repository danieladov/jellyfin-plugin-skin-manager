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

        public static Plugin? Instance { get; private set; }

        public override string Description
            => "Install and customise community skins for the Jellyfin web client.";

        private readonly Guid _id = new Guid("e9ca8b8e-ca6d-40e7-85dc-58e536df8eb3");
        public override Guid Id => _id;

        public IEnumerable<PluginPageInfo> GetPages()
        {
            var prefix = GetType().Namespace + ".Configuration.";
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "SkinManager",
                    EmbeddedResourcePath = prefix + "configurationpage.html"
                },
                new PluginPageInfo
                {
                    Name = "skinmanager.js",
                    EmbeddedResourcePath = prefix + "skinmanager.js"
                },
                new PluginPageInfo
                {
                    Name = "skinmanager.fontpicker.js",
                    EmbeddedResourcePath = prefix + "fontpicker.js"
                },
                new PluginPageInfo
                {
                    Name = "skinmanager.skins.json",
                    EmbeddedResourcePath = prefix + "skins.json"
                }
            };
        }
    }
}
