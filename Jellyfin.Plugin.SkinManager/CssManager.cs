using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Controller.Plugins;
using Microsoft.Extensions.Logging;
using MediaBrowser.Model.Branding;
using MediaBrowser.Api;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Controller.Net;

namespace Jellyfin.Plugin.SkinManager
{
	public class CssManager : IServerEntryPoint
	{

		private readonly Timer _timer;
		private readonly BrandingOptions _branding;
		private readonly ILogger<BrandingService> _logger;
		private readonly IServerConfigurationManager _serverConfigurationManager;
		private readonly IHttpResultFactory _httpResultFactory;
		private readonly BrandingOptions brandingOptions;

		public CssManager(ILogger<BrandingService> logger, IServerConfigurationManager serverConfigurationManager, IHttpResultFactory httpResultFactory)
		{
			_logger = logger;
			_timer = new Timer(_ => OnTimerElapsed(), null, Timeout.Infinite, Timeout.Infinite);
			_serverConfigurationManager = serverConfigurationManager;
			_httpResultFactory = httpResultFactory;
			BrandingService brandingService = new BrandingService(_logger, _serverConfigurationManager, _httpResultFactory);

			brandingOptions = (BrandingOptions) brandingService.Get(new GetBrandingOptions());
		}

		public void setCss()
		{
			string css = Plugin.Instance.Configuration.selectedCss;
			brandingOptions.CustomCss = css;
		}
		
		public void removeCss()
		{
			brandingOptions.CustomCss = "";
		}







		private void OnTimerElapsed()
		{
			// Stop the timer until next update
			_timer.Change(Timeout.Infinite, Timeout.Infinite);
		}

		public Task RunAsync()
		{
			return Task.CompletedTask;
		}

		public void Dispose()
		{
		}
	}
}
