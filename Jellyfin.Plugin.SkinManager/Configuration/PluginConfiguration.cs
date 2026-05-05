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
        public string[] importedSkins { get; set; }
        public string[] skinSources { get; set; }
        public string officialManifestCache { get; set; }
        public string officialManifestCachedAt { get; set; }
        public string officialManifestStatus { get; set; }
        public string officialManifestMessage { get; set; }
        public string officialManifestLastCheckedAt { get; set; }
        public int officialManifestSkinCount { get; set; }
        public string officialManifestLoadMode { get; set; }

        public PluginConfiguration()
        {
            selectedSkin = "";
            skinHistory = Array.Empty<String>();
            userCssHistory = Array.Empty<String>();
            importedSkins = Array.Empty<String>();
            skinSources = Array.Empty<String>();
            officialManifestCache = "";
            officialManifestCachedAt = "";
            officialManifestStatus = "";
            officialManifestMessage = "";
            officialManifestLastCheckedAt = "";
            officialManifestSkinCount = 0;
            officialManifestLoadMode = "";
        }
    }
}
