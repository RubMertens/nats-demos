import './style.css'
import {connect, JSONCodec} from "nats.ws";


const nc = await connect({
    servers:["ws://localhost:8888"]
});


type PackingMessage = {
    id: number
    barcode: string
    time: Date
}

const createStatus = (m :PackingMessage) => {
    const container = document.createElement("article");
container.classList.add("status")
    container.innerHTML = `<h2 id="barcode">${m.Barcode}</h2>
      <p id="time">${m.time}</p>`
    return container;
}

const codec = JSONCodec();
const sub = nc.subscribe("packing.peanuts");

const articleContainer = document.getElementById("status-container") as HTMLDivElement
(async () => {
    for await (const m of sub){
        const message = codec.decode(m.data) as PackingMessage;
        console.log(message)
        articleContainer.appendChild(createStatus(message));
    }
})();


