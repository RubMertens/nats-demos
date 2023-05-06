import './style.css'
import {connect, consumerOpts, createInbox, credsAuthenticator, JSONCodec} from "nats.ws";





type PackingMessage = {
    id: number
    barcode: string
    time: Date
}

const createOrUpdateStatus = (m: PackingMessage, conveyor: string) => {
    let el = document.getElementById(`conveyor-${conveyor}`);
    if (!el) {
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


const nc = await connect({
    servers: ["ws://localhost:8888"],
    authenticator: credsAuthenticator(new TextEncoder().encode(`
    -----BEGIN NATS USER JWT-----
eyJ0eXAiOiJKV1QiLCJhbGciOiJlZDI1NTE5LW5rZXkifQ.eyJqdGkiOiJURFhYNFg1UENMTVNQWDRHSFpNRjY0MktWSEc0Nk5TTFBYTlBPTzQyRU9NR1RKSk9XVEVBIiwiaWF0IjoxNjgzMzk0Mzk5LCJpc3MiOiJBQlpYS1lBUVhFWERDQVhUT1FHN0cyVFdBTTdVVUhVSUtORkVBUEJaUUFGNzdUNjRSVTJHM0hNWSIsIm5hbWUiOiJkYXNoYm9hcmQiLCJzdWIiOiJVRFhBV0VWUkNHRjZONEFCM0hSUUM0RzdDWlBSSVdaU0VXM0Q1Rkg1UTVCQUZHWURYQzc2UVlWSyIsIm5hdHMiOnsicHViIjp7fSwic3ViIjp7fSwic3VicyI6LTEsImRhdGEiOi0xLCJwYXlsb2FkIjotMSwidHlwZSI6InVzZXIiLCJ2ZXJzaW9uIjoyfX0.ftPHEHN6yf8eimWtuPu0iqEF6CTr1s1Mk5J0kwXfjih9FyogAykf0HQ9sdD8RigAVK-rp7k3EB2F9sqXy0R3Cw
------END NATS USER JWT------

************************* IMPORTANT *************************
NKEY Seed printed below can be used to sign and prove identity.
NKEYs are sensitive and should be treated as secrets.

-----BEGIN USER NKEY SEED-----
SUAIAGK7FOM7DXWWTEGYCICTO7F6LS7HYI2DCABWD5L7LBAQRDPZ5TIZRI
------END USER NKEY SEED------

*************************************************************
    `))
});



const codec = JSONCodec();

const js = await nc.jetstream();
const consumerOptions = consumerOpts();
// consumerOptions.durable("packing client");
// consumerOptions.manualAck()
consumerOptions.ackNone();
consumerOptions.replayInstantly();
consumerOptions.deliverTo(createInbox());
consumerOptions.deliverLastPerSubject();

const sub = await js.subscribe("packing.conveyor.>", consumerOptions);

(async () => {
    for await (const m of sub) {
        const message = codec.decode(m.data) as PackingMessage;
        console.log(m.subject, m);
        const [_, __, conveyor] = m.subject.split(".")
        createOrUpdateStatus(message, conveyor);
        m.ack();
    }
})();
