
const tabela = document.getElementById("tabela-entregas");

fetch("https://duxtsodcxpbdtpwhhllw.supabase.co/rest/v1/sms_logs", {
  headers: {
    apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHRzb2RjeHBiZHRwd2hobGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTU3NDYsImV4cCI6MjA2ODY5MTc0Nn0.nsHxOtT6TfU0CPrys5BhowDDr3h9zUsk3Ra9G263BOk",
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHRzb2RjeHBiZHRwd2hobGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTU3NDYsImV4cCI6MjA2ODY5MTc0Nn0.nsHxOtT6TfU0CPrys5BhowDDr3h9zUsk3Ra9G263BOk"
  }
})
.then(res => res.json())
.then(data => {
  const mapa = {};

  data.forEach(row => {
    const id = row.sms_id;
    const status = row.status;

    if (!mapa[id]) {
      mapa[id] = { SENT: 0, DELIVERED: 0 };
    }

    if (status === "SENT") mapa[id].SENT++;
    if (status === "DELIVERED") mapa[id].DELIVERED++;
  });

  let totalSentGrafico = 0;
  let totalDeliveredGrafico = 0;

  Object.entries(mapa).forEach(([smsId, counts]) => {
    const total = counts.SENT + counts.DELIVERED;
    const porcentagem = total > 0 ? (counts.DELIVERED / total * 100).toFixed(1) : "0.0";

    const tr = document.createElement("tr");

    // Aplica regra para visualização
    if (counts.SENT === 0 && counts.DELIVERED > 0) {
      tr.innerHTML = `
        <td>${smsId}</td>
        <td class="text-muted">0</td>
        <td>${counts.DELIVERED}</td>
        <td class="text-danger fw-bold">⚠️ Apenas DELIVERED</td>
      `;
    } else {
      tr.innerHTML = `
        <td>${smsId}</td>
        <td>${counts.SENT}</td>
        <td>${counts.DELIVERED}</td>
        <td>${porcentagem}%</td>
      `;
    }

    tabela.appendChild(tr);

    // Regras para o gráfico:
    // DELIVERED só entra se também houver SENT
    if (counts.SENT > 0 && counts.DELIVERED > 0) {
      totalDeliveredGrafico++;
    }

    // SENT só entra se não houver nenhum DELIVERED
    if (counts.SENT > 0 && counts.DELIVERED === 0) {
      totalSentGrafico++;
    }
  });

  const ctx = document.getElementById("grafico-pizza").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Somente Enviados", "Entregues com Envio"],
      datasets: [{
        data: [totalSentGrafico, totalDeliveredGrafico],
        backgroundColor: ["#ffc107", "#198754"]
      }]
    },
    options: {
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
});
