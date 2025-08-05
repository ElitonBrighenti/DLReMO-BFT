let dataMo = [];
let dataSemMo = [];
let rawMo = [];
let rawSemMo = [];

const grafico = document.getElementById("grafico").getContext("2d");
const tabelaParceiros = document.createElement("table");
tabelaParceiros.className = "table table-bordered table-sm mt-4 display w-100";
tabelaParceiros.id = "tabela-parceiros";
const container = document.querySelector(".container");

const headers = {
  apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHRzb2RjeHBiZHRwd2hobGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTU3NDYsImV4cCI6MjA2ODY5MTc0Nn0.nsHxOtT6TfU0CPrys5BhowDDr3h9zUsk3Ra9G263BOk",
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHRzb2RjeHBiZHRwd2hobGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTU3NDYsImV4cCI6MjA2ODY5MTc0Nn0.nsHxOtT6TfU0CPrys5BhowDDr3h9zUsk3Ra9G263BOk"
};

const HOJE = new Date().toISOString().slice(0, 10);
document.getElementById("data-inicial").value = HOJE;
document.getElementById("data-final").value = HOJE;

Promise.all([
  fetch("https://duxtsodcxpbdtpwhhllw.supabase.co/rest/v1/sms_logs", { headers }).then(res => res.json()),
  fetch("https://duxtsodcxpbdtpwhhllw.supabase.co/rest/v1/vw_sms_com_resposta", { headers }).then(res => res.json())
])
.then(([dlrs, mos]) => {
  const moMap = {};
  mos.forEach(m => {
    moMap[m.id_origem] = {
      resposta: m.resposta,
      data_mo: m.data_mo
    };
  });

  const smsPorId = {};
  dlrs.forEach(row => {
    if (!smsPorId[row.sms_id]) smsPorId[row.sms_id] = [];
    smsPorId[row.sms_id].push(row);
  });

  for (const [smsId, registros] of Object.entries(smsPorId)) {
    const mo = moMap[smsId];
    if (mo) {
      registros.forEach(r => {
        const dStatus = new Date(r.data_status);
        const dMo = new Date(mo.data_mo);
        const resposta = mo.resposta;
        rawMo.push({ ...r, dStatus, dMo, resposta });
      });
    } else {
      registros.forEach(r => {
        const dStatus = new Date(r.data_status);
        rawSemMo.push({ ...r, dStatus });
      });
    }
  }

  // tabela parceiros
  const parceiros = {};
  rawSemMo.forEach(r => {
    const parceiro = r.parceiro_id || "(vazio)";
    parceiros[parceiro] = (parceiros[parceiro] || 0) + 1;
  });

  const parceiroTitle = document.createElement("h3");
  parceiroTitle.className = "mt-5 text-primary";
  parceiroTitle.textContent = "📡 Quantidade de Envios sem MO por Parceiro";

  tabelaParceiros.innerHTML = `
    <thead><tr><th>Parceiro ID</th><th>Quantidade</th></tr></thead>
    <tbody>
      ${Object.entries(parceiros).map(([p, q]) => `<tr><td>${p}</td><td>${q}</td></tr>`).join("")}
    </tbody>`;
  container.appendChild(parceiroTitle);
  container.appendChild(tabelaParceiros);

  $('#tabela-mo').DataTable({
    data: [],
    columns: [
      { title: "Destino" },
      { title: "Status" },
      { title: "Data Envio" },
      { title: "Data MO" },
      { title: "Resposta" }
    ]
  });

  $('#tabela-sem-mo').DataTable({
    data: [],
    columns: [
      { title: "SMS ID" },
      { title: "Destino" },
      { title: "Status" }
    ]
  });

  $('#tabela-parceiros').DataTable();

  filtrarPorData();
});

function filtrarPorData() {
  const ini = document.getElementById("data-inicial").value;
  const fim = document.getElementById("data-final").value;

  const dataIni = new Date(`${ini}T00:00:00`);
  const dataFim = new Date(`${fim}T23:59:59`);

  const agrupadosMo = {};
  rawMo.forEach(r => {
    if (r.dMo >= dataIni && r.dMo <= dataFim) {
      if (!agrupadosMo[r.sms_id]) agrupadosMo[r.sms_id] = r;
    }
  });

  const agrupadosSemMo = {};
  rawSemMo.forEach(r => {
    if (r.dStatus >= dataIni && r.dStatus <= dataFim) {
      if (!agrupadosSemMo[r.sms_id]) agrupadosSemMo[r.sms_id] = r;
    }
  });

  const comMoFiltrado = Object.values(agrupadosMo);
  const semMoFiltrado = Object.values(agrupadosSemMo);

  document.getElementById("total-mo").textContent = comMoFiltrado.length;
  document.getElementById("destinos-unicos").textContent = new Set(comMoFiltrado.map(r => r.destino)).size;

  const tempos = comMoFiltrado.map(r => (r.dMo - r.dStatus) / 60000);
  const mediaMin = tempos.length ? Math.ceil(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;
  document.getElementById("tempo-medio").textContent = `${mediaMin} min`;

  $('#tabela-mo').DataTable().clear().rows.add(comMoFiltrado.map(r => [
    r.destino,
    r.status,
    r.dStatus.toLocaleString(),
    r.dMo.toLocaleString(),
    r.resposta || ""
  ])).draw();

  $('#tabela-sem-mo').DataTable().clear().rows.add(semMoFiltrado.map(r => [
    r.sms_id,
    r.destino,
    r.status
  ])).draw();

    // Atualiza tabela de parceiros com base no semMoFiltrado
  const parceirosFiltrados = {};
  semMoFiltrado.forEach(r => {
    const parceiro = r.parceiro_id || "(vazio)";
    parceirosFiltrados[parceiro] = (parceirosFiltrados[parceiro] || 0) + 1;
  });

  // Remove DataTable anterior e substitui por nova
  $('#tabela-parceiros').DataTable().destroy();
  tabelaParceiros.innerHTML = `
    <thead><tr><th>Parceiro ID</th><th>Quantidade</th></tr></thead>
    <tbody>
      ${Object.entries(parceirosFiltrados).map(([p, q]) => `<tr><td>${p}</td><td>${q}</td></tr>`).join("")}
    </tbody>
  `;
  $('#tabela-parceiros').DataTable();


  // Atualiza gráfico
  window.graficoInstancia?.destroy();
  window.graficoInstancia = new Chart(grafico, {
    type: "bar",
    data: {
      labels: ["Com MO", "Sem MO"],
      datasets: [{
        label: "Total por Categoria",
        data: [comMoFiltrado.length, semMoFiltrado.length],
        backgroundColor: ["#0d6efd", "#dc3545"],
        borderRadius: 6,
        barThickness: 200
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          color: "#fff",
          anchor: "end",
          align: "start",
          font: { size: 18, weight: "bold" },
          formatter: value => value
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 14 } } },
        x: { ticks: { font: { size: 16 } } }
      }
    },
    plugins: [ChartDataLabels]
  });
}
