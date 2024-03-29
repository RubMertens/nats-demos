﻿// See https://aka.ms/new-console-template for more information

using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NATS.Client;
using Peanut.Packing.Models;

var factory = new ConnectionFactory();
var options = ConnectionFactory.GetDefaultOptions();

options.Url = "nats://localhost:4222";

var credentialsPath = Path.GetFullPath(Environment.CurrentDirectory + "../../../../../nats-server/conveyor.creds");
options.SetUserCredentials(credentialsPath);

using var connection = factory.CreateEncodedConnection(options);

connection.OnSerialize = o => Encoding.UTF8.GetBytes(JsonSerializer.Serialize(o, new JsonSerializerOptions()
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
}));


var conveyors = new List<Conveyor>()
{
    new("North-1"),
    new("Middle-1"),
    new("South-1"),
};

string CreateBarcode()
{
    const string chars = "0123456789";
    Random random = new Random();
    
    StringBuilder barcode = new StringBuilder();
    for (int i = 0; i < 12; i++)
    {
        if (i % 4 == 0 && i != 0)
        {
            barcode.Append('-');
        }
        
        barcode.Append(chars[random.Next(chars.Length)]);
    }
    
    return barcode.ToString();
}

var services = new ServiceCollection();
services.AddLogging(o => o.ClearProviders().AddConsole());

var provider = services.BuildServiceProvider();
var logger = provider.GetRequiredService<ILogger<Program>>();

var count = 0;
const string baseSubject = "packing.conveyor";
var random = new Random();
while (true)
{
    foreach (var conveyor in conveyors)
    {
        var message = new PackingScannerMessage(count++, CreateBarcode(), DateTime.UtcNow); 
        connection.Publish($"{baseSubject}.{conveyor.Name}", message);
        logger.LogInformation("Published packing message {id} for conveyor {cId}", message.Id, conveyor.Name);
        await Task.Delay(random.Next(150));
    }
}

