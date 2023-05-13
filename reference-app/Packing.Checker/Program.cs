//setup console logging

using System.Dynamic;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NATS.Client;
using NATS.Client.JetStream;
using Packing.Models;


//same logger preamble as in Packing.Conveyor
var services = new ServiceCollection();
services.AddLogging(o => o.ClearProviders().AddConsole());
using var sp = services.BuildServiceProvider();
var logger = sp.GetService<ILogger<Program>>();

//create the connection using the same way
var options = ConnectionFactory.GetDefaultOptions();
options.Url = "nats://localhost:4222";
using var connection = new ConnectionFactory().CreateConnection(options);

//one of the limitations of the encoded connection is the lack of support for jetstream
//this way we get the jetstream context api
var jetStreamContext = connection.CreateJetStreamContext();

//we configure this consumer to be "durable"
//this gives it a queue group name and a durable name
//durable consumers are remembered by the nats-server where they keep
//track of the last message they received (acked)
//this way you can build consumers that handle every message.
var consumerOptions = new PushSubscribeOptions.PushSubscribeOptionsBuilder()
    .WithDurable("packing-checker").Build();

//subscribing itself is a bit awkward with a callback in c#
var sub = jetStreamContext.PushSubscribeAsync(
    "packing.conveyor.>", async (sender, args) =>
    {
        //deserialize the message ofcourse
        var message = JsonSerializer.Deserialize<ScanMessage>(
            args.Message.Data, new JsonSerializerOptions()
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }
        );
        var conveyor = args.Message.Subject.Split('.').Last();
        logger.LogInformation(
            "Received message from {conveyor} with barcode [{count}] {barcode}",
            conveyor,
            message.Count,
            message.Barcode
        );
        //add lines to a log file. 
        await File.AppendAllLinesAsync($"./{conveyor}.txt", new[] { $"[{message.Count}] {message.Barcode} ({message.Time})" });
    }, true, consumerOptions
);

//start the subscription
sub.Start();

//wait forever
await Task.Delay(-1);