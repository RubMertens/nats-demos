// See https://aka.ms/new-console-template for more information

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NATS.Client.Service;

var services = new ServiceCollection();
services.AddLogging(o => o.ClearProviders().AddConsole());
using var sp = services.BuildServiceProvider();
var logger = sp.GetService<ILogger<Program>>();
