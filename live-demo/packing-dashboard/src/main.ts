import "./styles.css";

const htmlTemplate = `
<div class="dashboard-container">
        <h4 data-barcode></h4>
        <p data-time></p>
      </div>`;

type ScanMessage = { barcode: string; time: string };

const updateDashboard = (conveyor: string, message: ScanMessage) => {
  let dashboardContainer = document.getElementById(conveyor);

  if (!dashboardContainer) {
    dashboardContainer = document.createElement("div");
    dashboardContainer.id = conveyor;
    document.getElementById("app")?.appendChild(dashboardContainer);
  }

  dashboardContainer.innerHTML = htmlTemplate;
  dashboardContainer.querySelector("[data-barcode]")!.textContent =
    message.barcode;
  dashboardContainer.querySelector("[data-time]")!.textContent = message.time;
};
