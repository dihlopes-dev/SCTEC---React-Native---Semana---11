const botaoCelsius = document.querySelector("#botao-celsius");
const botaoFahrenheit = document.querySelector("#botao-fahrenheit");
const cidadeSelect = document.querySelector("#cidade");
const imagemCidade = document.querySelector(".agora-painel figure img");
const selo = document.querySelector("#selo");
const titulo = document.querySelector("#titulo");
const temperatura = document.querySelector("#temperatura");
const sensacao = document.querySelector("#sensacao");
const umidade = document.querySelector("#umidade");
const vento = document.querySelector("#vento");
const listaPrevisao = document.querySelector("#lista-previsao");

const cidades = [
  { 
    value: "florianopolis", 
    nome: "Florianópolis", 
    selo: "Floripa", 
    lat: -27.5969, 
    lon: -48.5495,
    imagem: "floripa.jpg",
    alt: "Ponte Hercílio Luz em Florianópolis, com o céu ao fundo"
  },
  { 
    value: "sao-paulo", 
    nome: "São Paulo", 
    selo: "SP", 
    lat: -23.5505, 
    lon: -46.6333,
    imagem: "sao-paulo.jpg",
    alt: "Horizonte com edifícios na cidade de São Paulo"
  },
  { 
    value: "rio-de-janeiro", 
    nome: "Rio de Janeiro", 
    selo: "Rio", 
    lat: -22.9068, 
    lon: -43.1729,
    imagem: "rio-de-janeiro.jpg",
    alt: "Vista panorâmica da cidade do Rio de Janeiro"
  }
];

function paraFahrenheit(celsius) {
  return Math.round((celsius * 9 / 5) + 32);
}

// Formata "2026-09-14" para o nome do dia em português ("Hoje", "Terça", "Quarta", etc.)
function formatarDiaDaSemana(dataString, index) {
  if (index === 0) return "Hoje";

  const data = new Date(`${dataString}T00:00:00`);
  const nomeDia = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(data);

  // Pega o primeiro nome (ex: "terça-feira" -> "Terça") e coloca inicial maiúscula
  const diaFormatado = nomeDia.split("-")[0];
  return diaFormatado.charAt(0).toUpperCase() + diaFormatado.slice(1);
}

async function buscarClimaAPI(latitude, longitude) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    
    const resposta = await fetch(url);
    const dados = await resposta.json();

    return {
      temperatura: Math.round(dados.current.temperature_2m),
      sensacao: Math.round(dados.current.apparent_temperature),
      umidade: `${dados.current.relative_humidity_2m}%`,
      vento: `${Math.round(dados.current.wind_speed_10m)} km/h`,
      previsao: dados.daily.time.slice(0, 7).map((dataStr, index) => ({
        diaNome: formatarDiaDaSemana(dataStr, index),
        max: Math.round(dados.daily.temperature_2m_max[index]),
        min: Math.round(dados.daily.temperature_2m_min[index])
      }))
    };
  } catch (erro) {
    console.error("Erro ao buscar dados do clima:", erro);
    return null;
  }
}

async function atualizarTela(chaveCidade, unidade) {
  const cidadeInfo = cidades.find((item) => item.value === chaveCidade);
  if (!cidadeInfo) return;

  if (imagemCidade) {
    imagemCidade.src = cidadeInfo.imagem;
    imagemCidade.alt = cidadeInfo.alt;
  }

  const dadosClima = await buscarClimaAPI(cidadeInfo.lat, cidadeInfo.lon);
  if (!dadosClima) return;

  const ehFahrenheit = unidade === "fahrenheit";

  // Atualiza botões
  botaoFahrenheit.classList.toggle("ativa", ehFahrenheit);
  botaoCelsius.classList.toggle("ativa", !ehFahrenheit);

  // Atualiza dados no topo
  selo.textContent = cidadeInfo.selo;
  titulo.textContent = `Tempo em ${cidadeInfo.nome} hoje`;
  umidade.textContent = dadosClima.umidade;
  vento.textContent = dadosClima.vento;

  if (ehFahrenheit) {
    temperatura.textContent = `${paraFahrenheit(dadosClima.temperatura)} °F`;
    sensacao.textContent = `${paraFahrenheit(dadosClima.sensacao)} °F`;
  } else {
    temperatura.textContent = `${dadosClima.temperatura} °C`;
    sensacao.textContent = `${dadosClima.sensacao} °C`;
  }

  // Gera dinamicamente os cards de previsão
  listaPrevisao.innerHTML = dadosClima.previsao.map((dia) => {
    const max = ehFahrenheit ? paraFahrenheit(dia.max) : dia.max;
    const min = ehFahrenheit ? paraFahrenheit(dia.min) : dia.min;

    return `
      <div class="card-dia">
        <span class="nome-dia">${dia.diaNome}</span>
        <span class="faixa-temp">${max}° / ${min}°</span>
      </div>
    `;
  }).join("");
}

// Event Listeners
botaoCelsius.addEventListener("click", () => {
  localStorage.setItem("unidadeTemperatura", "celsius");
  atualizarTela(cidadeSelect.value, "celsius");
});

botaoFahrenheit.addEventListener("click", () => {
  localStorage.setItem("unidadeTemperatura", "fahrenheit");
  atualizarTela(cidadeSelect.value, "fahrenheit");
});

cidadeSelect.addEventListener("change", () => {
  localStorage.setItem("cidade", cidadeSelect.value);
  const unidadeSalva = localStorage.getItem("unidadeTemperatura") || "celsius";
  atualizarTela(cidadeSelect.value, unidadeSalva);
});

// Inicialização
const cidadeSalva = localStorage.getItem("cidade") || "florianopolis";
const unidadeSalva = localStorage.getItem("unidadeTemperatura") || "celsius";

cidadeSelect.value = cidadeSalva;
atualizarTela(cidadeSalva, unidadeSalva);