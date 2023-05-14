// See https://aka.ms/new-console-template for more information

using System.Text;
using System.Transactions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NATS.Client;
using Packing.Models;

var services = new ServiceCollection();
services.AddLogging(o => o.ClearProviders().AddConsole());
using var sp = services.BuildServiceProvider();
var logger = sp.GetService<ILogger<Program>>();

var option = ConnectionFactory.GetDefaultOptions();
//notice how we are connecting to the a different nats-server
//this is to demonstrate the power of  leaf nodes!
option.Url = "nats://localhost:4333";
var factory = new ConnectionFactory();

var random = new Random();

using var connection = factory.CreateConnection(option);
while (true)
{
    logger.LogInformation("publishing barcode");
    connection.Publish("roasting.oven", Encoding.UTF8.GetBytes(BarcodeFunctions.CreateBarCode()));
    await Task.Delay(random.Next(500, 800));
}