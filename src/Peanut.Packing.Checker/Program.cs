// See https://aka.ms/new-console-template for more information


using System.Net.Sockets;
using System.Reflection.Emit;
using System.Text;
using System.Text.Json;
using System.Text.Unicode;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NATS.Client;
using NATS.Client.JetStream;
using Peanut.Packing.Models;

var services = new ServiceCollection();
services.AddLogging(o => o.ClearProviders().AddConsole());

var provider = services.BuildServiceProvider();
var logger = provider.GetRequiredService<ILogger<Program>>();

var connectionFactory = new ConnectionFactory();
var connectionOptions = ConnectionFactory.GetDefaultOptions();
connectionOptions.Url = "nats://localhost:4222";
var credentialsPath = Path.GetFullPath(Environment.CurrentDirectory + "../../../../../nats-server/conveyor.creds");
connectionOptions.SetUserCredentials(credentialsPath);


using var connection = connectionFactory.CreateConnection(connectionOptions);
var js = connection.CreateJetStreamContext();

const string subject ="packing.conveyor.>";
const string consumerName = "checking-app";

var subOptions = new PushSubscribeOptions.PushSubscribeOptionsBuilder();
subOptions.WithDurable(consumerName);

var sub = js.PushSubscribeAsync(subject, (sender, args) =>
{
    
    var message = JsonSerializer.Deserialize<PackingScannerMessage>(args.Message.Data, new JsonSerializerOptions()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    
    var conveyor = args.Message.Subject.Split(".")[2];
    logger.LogInformation("Handled message {conveyor} for {barcode}", conveyor, message.Barcode);
    File.AppendAllLines($"./{conveyor}.txt",new[]{ $"({message.Id}){message.Barcode} at {message.Time}"});

}, true,subOptions.Build());
sub.Start();
var done = new AutoResetEvent(false);
done.WaitOne();




