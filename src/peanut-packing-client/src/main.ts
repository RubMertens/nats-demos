import './style.css'
import {connect, consumerOpts, createInbox, JSONCodec} from "nats.ws";


const nc = await connect({
    servers:["ws://localhost:8888"]
});


type PackingMessage = {
    id: number
    barcode: string
    time: Date
}

const createOrUpdateStatus = (m :PackingMessage, conveyor:string) => {
    let el = document.getElementById(`conveyor-${conveyor}`);
    if(!el){
        const articleContainer = document.getElementById("status-container") as HTMLDivElement
        el = document.createElement("article");
        el.classList.add("status");
        el.id = `conveyor-${conveyor}`;
        el.innerHTML = `<div>
<h2>${conveyor}</h2>
<div id="info"></div>
</div>`
        articleContainer.appendChild(el);
    }
    const infoContainer = el.querySelector("#info")!
    infoContainer.innerHTML = `<h4 id="barcode">${m.barcode}</h4>
      <p id="time">${m.time}</p>`
    return el;
}



const codec = JSONCodec();
// const sub = nc.subscribe("packing.conveyors.>");
// (async () => {
//     for await (const m of sub){
//         const message = codec.decode(m.data) as PackingMessage;
//         console.log(m.subject, m);
//         const [_,__,conveyor] = m.subject.split(".")
//         createOrUpdateStatus(message, conveyor);
//     }
// })();

const js = await nc.jetstream();
const consumerOptions = consumerOpts();
// consumerOptions.durable("packing client");
consumerOptions.manualAck()
consumerOptions.ackExplicit();
consumerOptions.deliverTo(createInbox());
consumerOptions.deliverLastPerSubject();

const sub = await js.subscribe("packing.conveyor.>", consumerOptions);

(async () => {
    for await (const m of sub){
        const message = codec.decode(m.data) as PackingMessage;
        console.log(m.subject, m);
        const [_,__,conveyor] = m.subject.split(".")
        createOrUpdateStatus(message, conveyor);
        m.ack();
    }
})();
