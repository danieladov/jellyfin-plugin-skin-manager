using System;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Net;
using MediaBrowser.Model.Services;
using Microsoft.Extensions.Logging;
using MediaBrowser.Model.Branding;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Api;

namespace Jellyfin.Plugin.SkinManager.Api
{
    [Route("/Css/Set", "POST", Summary = "Downloads theme songs")]
    [Authenticated]
    public class DownloadRequest : IReturnVoid
    {
        public string css {get;set;}
    }

    public class cssService : IService
    {
        private readonly CssManager _themeSongsManager;
        private readonly ILogger<BrandingService> _logger;

        public cssService(
            ILogger<BrandingService> logger, IServerConfigurationManager serverConfigurationManager, IHttpResultFactory httpResultFactory)
        {
            _themeSongsManager = new CssManager(logger, serverConfigurationManager, httpResultFactory);
            _logger = logger;
        }
        
        public void Post(DownloadRequest request)
        {
            _logger.LogInformation(request.css + "Will be setted");
            _themeSongsManager.setCss();
            _logger.LogInformation("Completed");
        }

        

    }
}