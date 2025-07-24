
// ATENÇÃO: Este script pressupõe que jQuery e DataTables.js estejam carregados no HTML

let dataMo = [];
let dataSemMo = [];

const grafico = document.getElementById("grafico").getContext("2d");
const tabelaMo = document.getElementById("tabela-mo");
const tabelaSemMo = document.getElementById("tabela-sem-mo");
const tabelaParceiros = document.createElement("table");
tabelaParceiros.className = "table table-bordered table-sm mt-4 display w-100";
tabelaParceiros.id = "tabela-parceiros";

const container = document.querySelector(".container");
const headers = {
  apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHRzb2RjeHBiZHRwd2hobGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTU3NDYsImV4cCI6MjA2ODY5MTc0Nn0.nsHxOtT6TfU0CPrys5BhowDDr3h9zUsk3Ra9G263BOk",
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHRzb2RjeHBiZHRwd2hobGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTU3NDYsImV4cCI6MjA2ODY5MTc0Nn0.nsHxOtT6TfU0CPrys5BhowDDr3h9zUsk3Ra9G263BOk"
}

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
    if (idsComMo.has(smsId)) comMo.push(...registros);
    else semMo.push(...registros);
  });

  comMo.forEach(item => {
    if (item.resposta && item.resposta.trim() !== "" && item.data_status && item.data_mo) {
      const t1 = new Date(item.data_status).getTime();
      const t2 = new Date(item.data_mo).getTime();
      if (t2 > t1) tempoRespostas.push((t2 - t1) / 60000);
    }
    dataMo.push([
      item.destino,
      item.status,
      new Date(item.data_status).toLocaleString(),
      new Date(item.data_mo).toLocaleString(),
      item.resposta || ""
    ]);
  });

  semMo.forEach(item => {
    dataSemMo.push([
      item.sms_id,
      item.destino,
      item.status
    ]);
  });

  const parceiros = {};
  semMo.forEach(row => {
    const parceiro = row.parceiro_id || "(vazio)";
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

  document.getElementById("total-mo").textContent = new Set(comMo.map(e => e.sms_id)).size;
  document.getElementById("tempo-medio").textContent = `${tempoRespostas.length ? (tempoRespostas.reduce((a,b)=>a+b,0)/tempoRespostas.length).toFixed(2) : 0} min`;
  document.getElementById("destinos-unicos").textContent = new Set(comMo.map(e => e.destino)).size;

new Chart(grafico, {
  type: "bar",
  data: {
    labels: ["Com MO", "Sem MO"],
    datasets: [{
      label: "Total por Categoria",
      data: [
        new Set(comMo.map(e => e.sms_id)).size,
        new Set(semMo.map(e => e.sms_id)).size
      ],
      backgroundColor: ["#0d6efd", "#dc3545"],
      borderRadius: 6, // deixa a borda das colunas arredondada
      barThickness: 200 // largura das colunas
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 14
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 16
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        bodyFont: {
          size: 16
        },
        titleFont: {
          size: 18
        },
        padding: 12
      },
      datalabels: {
        color: "#fff",
        anchor: "end",
        align: "start",
        font: {
          size: 18,
          weight: "bold"
        },
        formatter: value => value
      }
    }
  },
  plugins: [ChartDataLabels]
});




  $.extend(true, $.fn.dataTable.defaults, {
    pageLength: 20,
    lengthMenu: [10, 20, 50, 100],
    language: {
      lengthMenu: "📋 Exibir _MENU_ registros por página",
      info: "Mostrando de _START_ até _END_ de _TOTAL_ registros",
      infoEmpty: "Nenhum registro disponível",
      zeroRecords: "Nenhum resultado encontrado",
      paginate: {
        previous: "←",
        next: "→"
      },
      search: "🔍 Buscar:"
    },
    dom: '<"row mb-3"<"col-md-6"l>>' +
         '<"row"<"col-sm-12"tr>>' +
         '<"row mt-2"<"col-md-5"i><"col-md-7"p>>'
  });

  $('#tabela-mo').DataTable({
    data: dataMo,
    columns: [
      { title: "Destino" },
      { title: "Status" },
      { title: "Data Envio" },
      { title: "Data MO" },
      { title: "Resposta" }
    ]
  });

  $('#tabela-sem-mo').DataTable({
    data: dataSemMo,
    columns: [
      { title: "SMS ID" },
      { title: "Destino" },
      { title: "Status" }
    ]
  });

  $('#tabela-parceiros').DataTable();
});
