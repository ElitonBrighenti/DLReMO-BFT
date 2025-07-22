
const grafico = document.getElementById("grafico").getContext("2d");
const tabelaMo = document.getElementById("tabela-mo");
const tabelaSemMo = document.getElementById("tabela-sem-mo");

const headers = {
  apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHRzb2RjeHBiZHRwd2hobGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTU3NDYsImV4cCI6MjA2ODY5MTc0Nn0.nsHxOtT6TfU0CPrys5BhowDDr3h9zUsk3Ra9G263BOk",
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHRzb2RjeHBiZHRwd2hobGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTU3NDYsImV4cCI6MjA2ODY5MTc0Nn0.nsHxOtT6TfU0CPrys5BhowDDr3h9zUsk3Ra9G263BOk"
};

Promise.all([
  fetch("https://duxtsodcxpbdtpwhhllw.supabase.co/rest/v1/sms_logs", { headers }).then(res => res.json()),
  fetch("https://duxtsodcxpbdtpwhhllw.supabase.co/rest/v1/vw_sms_com_resposta", { headers }).then(res => res.json())
])
.then(([dlrs, mos]) => {
  const idsComMo = new Set(mos.map(m => m.id_origem));
  const smsPorId = {};

  dlrs.forEach(row => {
    if (!smsPorId[row.sms_id]) smsPorId[row.sms_id] = [];
    smsPorId[row.sms_id].push(row);
  });

  const comMo = [];
  const semMo = [];
  const tempoRespostas = [];

  Object.entries(smsPorId).forEach(([smsId, registros]) => {
    if (idsComMo.has(smsId)) {
      comMo.push(...registros);
    } else {
      semMo.push(...registros);
    }
  });

  comMo.forEach(item => {
    if (item.resposta && item.resposta.trim() !== "" && item.data_status && item.data_mo) {
      const t1 = new Date(item.data_status).getTime();
      const t2 = new Date(item.data_mo).getTime();
      if (t2 > t1) tempoRespostas.push((t2 - t1) / 60000);
    }

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${item.destino}</td>
      <td>${item.status}</td>
      <td>${new Date(item.data_status).toLocaleString()}</td>
      <td>${new Date(item.data_mo).toLocaleString()}</td>
      <td>${item.resposta || ""}</td>
    `;
    tabelaMo.appendChild(linha);
  });

  semMo.forEach(item => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${item.sms_id}</td>
      <td>${item.destino}</td>
      <td>${item.status}</td>
    `;
    tabelaSemMo.appendChild(linha);
  });

  const totalMo = new Set(comMo.map(e => e.sms_id)).size;
  const destinosUnicos = new Set(comMo.map(e => e.destino)).size;
  const media = tempoRespostas.length ? (tempoRespostas.reduce((a,b)=>a+b,0)/tempoRespostas.length).toFixed(2) : 0;

  document.getElementById("total-mo").textContent = totalMo;
  document.getElementById("tempo-medio").textContent = `${media} min`;
  document.getElementById("destinos-unicos").textContent = destinosUnicos;

  new Chart(grafico, {
    type: "bar",
    data: {
      labels: ["Com MO", "Sem MO"],
      datasets: [{
        label: "Total por Categoria",
        data: [totalMo, new Set(semMo.map(e => e.sms_id)).size],
        backgroundColor: ["#0d6efd", "#dc3545"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
});
