import {
  connect,
  consumerOpts,
  createInbox,
  credsAuthenticator,
  JSONCodec,
  jwtAuthenticator,
  StringCodec,
} from 'nats.ws'
import './style.css'
//import the copied file as a raw string in the sources.
//this saves us from the trouble of recopying it every time
import creds from '../dashboard.creds?raw'
const htmlTemplate = `
<div class="dashboard-container">
        <h4 data-barcode></h4>
        <p data-time></p>
      </div>`

type ScanMessage = { barcode: string; time: string }

const updateDashboard = (conveyor: string, message: ScanMessage) => {
  let dashboardContainer = document.getElementById(conveyor)

  if (!dashboardContainer) {
    dashboardContainer = document.createElement('div')
    dashboardContainer.id = conveyor
    document.getElementById('app')?.appendChild(dashboardContainer)
  }

  dashboardContainer.innerHTML = htmlTemplate
  dashboardContainer.querySelector('[data-barcode]')!.textContent = message.barcode
  dashboardContainer.querySelector('[data-time]')!.textContent = message.time
}

//connecting to nats looks much the same as in the c# example
//but we have to use the ws version of the library
//since we are using websockets
//don't forget to update the server config to allow websocket connections
//the protocol used is still nats but over websockets
const connection = await connect({
  servers: ['ws://localhost:8888'],
  authenticator: credsAuthenticator(new TextEncoder().encode(creds)),
})

console.log('Connected to NATS', connection.info)

//add a simple button to the UI to testing an illigal publish from the dashboard client.
//you'll notice the error does not actually get reported to the client.
//but looking at the nats-server logs, you'll see an auth violation.
document.getElementById('btn')!.onclick = () => {
  console.log('sending hello')
  connection.publish('packing.hello', codec.encode(JSON.stringify({ hello: 'world' })))
}

//subscribe either using a callback or an async iterator
//in order to decode anything comming from the websocket we have to use
//their json coded

const codec = JSONCodec()

//callback
// connection.subscribe("conveyor.>", {
//   callback: (err, msg) => {
//     const message = codec.decode(msg.data) as ScanMessage;
//     console.log("Received message", message);
//     updateDashboard(msg.subject, message);
//   },
// });

//async iterator
//we subscribe using a wildcard. Another cool feature of nats.
//you can "punch holes" in the subject by using '*'
//for example 'conveyor.*.scan' will except 'conveyor.1.scan' and 'conveyor.2.scan'
// but not 'conveyor.scan' or 'conveyor.1.scan.extra'
//you can also except any message that comes after a certain subject using '>'
//for example 'conveyor.>' will except 'conveyor.1.scan' and 'conveyor.1.scan.extra'


// for await (const msg of connection.subscribe("packing.conveyor.>")) {
//   const message = codec.decode(msg.data) as ScanMessage;
//   console.log("Received message", message);
//   //since we embedded part of data in the subject, we need to get it out too
//   const lastPartOfSbuject = msg.subject.split(".").pop() ?? "";
//   updateDashboard(lastPartOfSbuject, message);
// }

//you can access the consumer api using the jetstream client
const jetstreamClient = connection.jetstream()

//making an options object is the most readable way to configure a consumer
const consumerOptions = consumerOpts()
//we don't care about acking the messages since we are just displaying them
//this way the jetstream doesn't waiste time waiting for us to ack
consumerOptions.ackNone()
//we only want to receive messages that are sent to the packing.conveyor subject
consumerOptions.filterSubject('packing.conveyor.>')
//we need to tell the jetstream where to send the messages
//the createInbox function will create a random subject for us
consumerOptions.deliverTo(createInbox())
//we want to receive the last message sent to any of the subjects we are subscribed to
//in practice this means we receive
//the last message sent to
//  'packing.conveyor.NORTH'
//  'packing.conveyor.MID'
//  'packing.conveyor.SOUTH'
consumerOptions.deliverLastPerSubject()
;(async () => {
  const sub = await jetstreamClient.subscribe('packing.conveyor.>', consumerOptions)

  for await (const msg of sub) {
    const message = codec.decode(msg.data) as ScanMessage
    console.log('Received message', message)
    const lastPartOfSbuject = msg.subject.split('.').pop() ?? ''
    updateDashboard(lastPartOfSbuject, message)
  }
})()

const stringCodec = StringCodec()
const roastingSub = connection.subscribe('roasting.oven')

;(async () => {
  for await (const msg of roastingSub) {
    const message = stringCodec.decode(msg.data) as string
    console.log('roasted ', message)
    document.getElementById('roast')!.innerHTML = message
  }
})()
