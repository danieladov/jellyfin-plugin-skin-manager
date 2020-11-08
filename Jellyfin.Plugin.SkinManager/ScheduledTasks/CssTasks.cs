using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Tasks;
using Microsoft.Extensions.Logging;
using MediaBrowser.Model.Branding;
using MediaBrowser.Api;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Controller.Net;

namespace Jellyfin.Plugin.Css.ScheduledTasks
{
    public class SetCssTask : IScheduledTask
    {
        
        private readonly CssManager _themeSongsManager;
        private readonly ILogger<BrandingService> _logger;
        private readonly IServerConfigurationManager _serverConfigurationManager;
        private readonly IHttpResultFactory _httpResultFactory;
        private readonly BrandingOptions _branding;

        public SetCssTask(ILogger<BrandingService> logger, IServerConfigurationManager serverConfigurationManager, IHttpResultFactory httpResultFactory)
        {
            _serverConfigurationManager = serverConfigurationManager;
            _httpResultFactory = httpResultFactory;
            _themeSongsManager = new CssManager(logger,serverConfigurationManager,httpResultFactory);
        }
        public Task Execute(CancellationToken cancellationToken, IProgress<double> progress)
        {
            _logger.LogInformation("Starting plugin, Setting css");
            _themeSongsManager.setCss();
            _logger.LogInformation("Done");
            return Task.CompletedTask;
        }

        public IEnumerable<TaskTriggerInfo> GetDefaultTriggers()
        {
            // Run this task every 24 hours
            yield return new TaskTriggerInfo
            {
                Type = TaskTriggerInfo.TriggerInterval, 
                IntervalTicks = TimeSpan.FromHours(24).Ticks
            };
        }

        public string Name => "SetCss";
        public string Key => "css";
        public string Description => "Scans all libraries to download Theme Songs";
        public string Category => "css";
    }


    public class RemoveCss : IScheduledTask
    {
        private readonly CssManager _themeSongsManager;
        private readonly ILogger<BrandingService> _logger;
        private readonly IServerConfigurationManager _serverConfigurationManager;
        private readonly IHttpResultFactory _httpResultFactory;
        private readonly BrandingOptions _branding;

        public RemoveCss(ILogger<BrandingService> logger, BrandingOptions branding, IServerConfigurationManager serverConfigurationManager, IHttpResultFactory httpResultFactory)
        {
           // _logger = logger;
            //_themeSongsManager = new CssManager(logger, branding);
        }
        public Task Execute(CancellationToken cancellationToken, IProgress<double> progress)
        {
            _logger.LogInformation("Starting plugin, Downloading Theme Songs...");
            _themeSongsManager.removeCss();
            _logger.LogInformation("All theme songs downloaded");
            return Task.CompletedTask;
        }

        public IEnumerable<TaskTriggerInfo> GetDefaultTriggers()
        {
            // Run this task every 24 hours
            yield return new TaskTriggerInfo
            {
                Type = TaskTriggerInfo.TriggerInterval,
                IntervalTicks = TimeSpan.FromHours(24).Ticks
            };
        }

        public string Name => "Css2";
        public string Key => "removeCss";
        public string Description => "Scans all libraries to download Movies Theme Songs";
        public string Category => "Css";
    }



}
