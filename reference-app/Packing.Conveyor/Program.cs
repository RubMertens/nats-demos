using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NATS.Client;
using Packing.Models;

//setup console logging
var services = new ServiceCollection();
services.AddLogging(o => o.ClearProviders().AddConsole());
using var sp = services.BuildServiceProvider();
var logger = sp.GetService<ILogger<Program>>();

//create the options using the ConnectionFactory
//a downside about nats is how golang it feels
//since the clients are straight ports from the go client
var option = ConnectionFactory.GetDefaultOptions();

//notice the "nats://" 
//nats is it's own protocol designed to be lightweight and highly scalable.
//Important to know is that it is a binary protocol with utf8 encoding
option.Url = "nats://localhost:4222";

//after configuring the nsc (nats secure context) and generating our creds files
//we can use them to authenticate with the server
//this starts the flow of connecting using a signed nonce
option.SetUserCredentials("./conveyor.creds");

//creating the connection is a easy as calling CreateConnection on the factory
var factory = new ConnectionFactory();



//there's several options for creating a connection.
//the secure is for auth (more about that later)
//the encodedconnection is a convenience wrapper around the connection
//but since it comes with some limitations, let's use the normal connection
//and handle encoding/decoding ourselves
using var connection = factory.CreateConnection(option);



//just some fluff for creating interesting looking messages
var random = new Random();


//create three demo conveyors
var conveyors = new[]
{
    "NORTH",
    "MID",
    "SOUTH"
};


//infinite loop to emulate sending messages
var count = 0;
while (true)
{
    foreach (var conveyor in conveyors)
    {
        var msg = new ScanMessage(BarcodeFunctions.CreateBarCode(), DateTime.UtcNow, count);
        
        //like I said earlier we need to encode the message ourselves
        //using json is the easiest, but you can use any encoding you want
        var encoded = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(
                msg, new JsonSerializerOptions()
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                }
            )
        );
        logger.LogInformation("Sending message [{count}]{msg} for {conveyor}",msg.Count, msg.Barcode, conveyor);
        //publishing the message is sync
        //but don't worry, the client is smart enough to batch messages
        //it comes with it's own sort of ring buffer implementation
        connection.Publish($"packing.conveyor.${conveyor}", encoded);

        //wait a random amount of time
        //this is to not spam the server and keep things readable!
        await Task.Delay(random.Next(200, 800));        
    }
    count++;
}