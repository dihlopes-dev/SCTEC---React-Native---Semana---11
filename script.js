const botaoCelsius = document.querySelector("#botao-celsius");
const botaoFahrenheit = document.querySelector("#botao-fahrenheit");
const cidadeSelect = document.querySelector("#cidade");
const imagemCidade = document.querySelector(".agora-painel figure img");
const botaoLocalizacao = document.querySelector("#botao-localizacao");
const status = document.querySelector("#status");
const selo = document.querySelector("#selo");
const titulo = document.querySelector("#titulo");
const temperatura = document.querySelector("#temperatura");
const condicao = document.querySelector("#condicao");
const sensacao = document.querySelector("#sensacao");
const umidade = document.querySelector("#umidade");
const vento = document.querySelector("#vento");

const idsPrevisao = [
  "temp-hoje",
  "temp-segunda",
  "temp-terca",
  "temp-quarta",
  "temp-quinta",
  "temp-sexta",
  "temp-sabado",
];

const cidades = [
  {
    value: "florianopolis",
    nome: "Florianópolis",
    selo: "Floripa",
    latitude: -27.5954,
    longitude: -48.548,
    imagem: "floripa.jpg",
    alt: "Ponte Hercílio Luz em Florianópolis, com o céu ao fundo"
  },
  {
    value: "sao-paulo",
    nome: "São Paulo",
    selo: "SP",
    latitude: -23.5505,
    longitude: -46.6333,
    imagem: "sao-paulo.jpg",
    alt: "Horizonte com edifícios na cidade de São Paulo"
  },
  {
    value: "rio-de-janeiro",
    nome: "Rio de Janeiro",
    selo: "Rio",
    latitude: -22.9068,
    longitude: -43.1729,
    imagem: "rio-de-janeiro.jpg",
    alt: "Vista panorâmica da cidade do Rio de Janeiro"
  },
  {
    value: "blumenau",
    nome: "Blumenau",
    selo: "Blumenau",
    latitude: -26.9194,
    longitude: -49.0661,
    imagem: "blumenau.jpeg",
    alt: "Vista da cidade de Blumenau, em Santa Catarina"
  },
];

let climaAtual;

dayjs.locale("pt-br");

function paraFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

function traduzirCondicao(codigo) {
  const condicoes = {
    0: "Céu limpo",
    1: "Predominantemente limpo",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Neblina",
    48: "Neblina",
    51: "Chuvisco",
    53: "Chuvisco",
    55: "Chuvisco",
    61: "Chuva fraca",
    63: "Chuva",
    65: "Chuva forte",
    80: "Pancadas de chuva",
    81: "Pancadas de chuva",
    82: "Pancadas de chuva forte",
    95: "Trovoada",
    96: "Trovoada",
    99: "Trovoada",
  };

  return condicoes[codigo] || "Condição desconhecida";
}

function formatarData(iso) {
  return dayjs(`${iso}T12:00:00`).format("D [de] MMMM");
}

function nomeDoDia(iso, indice) {
  if (indice === 0) {
    return "Hoje";
  }

  const nome = dayjs(`${iso}T12:00:00`).format("dddd");
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

async function buscarTempo(cidade) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${cidade.latitude}&longitude=${cidade.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo&forecast_days=7`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const dados = await response.json();
    return dados;
  } catch (erro) {
    console.error("Falhou:", erro);
  }
}

function atualizarTela(cidade, clima, unidade) {
  const temperaturaAgora = Math.round(clima.current.temperature_2m);
  const sensacaoTermica = Math.round(clima.current.apparent_temperature);

  imagemCidade.src = cidade.imagem;
  imagemCidade.alt = cidade.alt;


  selo.textContent = cidade.selo;
  titulo.textContent = `Tempo em ${cidade.nome} hoje`;
  condicao.textContent = traduzirCondicao(clima.current.weather_code);
  umidade.textContent = `${clima.current.relative_humidity_2m}%`;
  vento.textContent = `${Math.round(clima.current.wind_speed_10m)} km/h`;

  if (unidade === "fahrenheit") {
    temperatura.textContent = `${paraFahrenheit(temperaturaAgora)} °F`;
    sensacao.textContent = `${paraFahrenheit(sensacaoTermica)} °F`;
    botaoCelsius.classList.remove("ativa");
    botaoFahrenheit.classList.add("ativa");
  } else {
    temperatura.textContent = `${temperaturaAgora} °C`;
    sensacao.textContent = `${sensacaoTermica} °C`;
    botaoFahrenheit.classList.remove("ativa");
    botaoCelsius.classList.add("ativa");
  }

  idsPrevisao.forEach((id, indice) => {
    const elemento = document.querySelector(`#${id}`);
    const artigo = elemento.closest("article");
    const dataIso = clima.daily.time[indice];
    const max = Math.round(clima.daily.temperature_2m_max[indice]);
    const min = Math.round(clima.daily.temperature_2m_min[indice]);

    if (unidade === "fahrenheit") {
      elemento.textContent = `${paraFahrenheit(max)}° / ${paraFahrenheit(min)}°`;
    } else {
      elemento.textContent = `${max}° / ${min}°`;
    }

    elemento.nextElementSibling.textContent = traduzirCondicao(
      clima.daily.weather_code[indice],
    );
    artigo.querySelector("h3").textContent = nomeDoDia(dataIso, indice);

    const time = artigo.querySelector("time");
    time.dateTime = dataIso;
    time.textContent = formatarData(dataIso);
  });
}

function mostrarStatus(texto) {
  status.textContent = texto;
}

function distanciaAte(cidade, latitude, longitude) {
  // Quanto maior o número, mais longe. Não precisa de fórmula de GPS:
  // só comparamos a diferença de latitude + longitude.
  return Math.abs(cidade.latitude - latitude) + Math.abs(cidade.longitude - longitude);
}

function cidadeMaisProxima(latitude, longitude) {
  // Começa na primeira cidade da lista e troca se achar outra mais perto.
  let maisProxima = cidades[0];

  for (let i = 1; i < cidades.length; i++) {
    const cidade = cidades[i];

    if (distanciaAte(cidade, latitude, longitude) < distanciaAte(maisProxima, latitude, longitude)) {
      maisProxima = cidade;
    }
  }

  return maisProxima;
}

async function carregarCidade(chaveCidade) {
  const cidade = cidades.find((item) => item.value === chaveCidade);
  const unidade = localStorage.getItem("unidadeTemperatura") || "celsius";

  mostrarStatus("Carregando...");
  climaAtual = await buscarTempo(cidade);
  mostrarStatus("");

  if (climaAtual) {
    atualizarTela(cidade, climaAtual, unidade);
  } else {
    mostrarStatus("Não foi possível carregar o clima.");
  }
}

function usarMinhaLocalizacao() {
  if (!navigator.geolocation) {
    mostrarStatus("Seu navegador não tem geolocalização.");
    return;
  }

  mostrarStatus("Buscando sua localização...");

  navigator.geolocation.getCurrentPosition(
    (posicao) => {
      const cidade = cidadeMaisProxima(
        posicao.coords.latitude,
        posicao.coords.longitude,
      );

      cidadeSelect.value = cidade.value;
      localStorage.setItem("cidade", cidade.value);
      carregarCidade(cidade.value);
    },
    () => {
      mostrarStatus("Não foi possível obter a localização.");
    },
  );
}

botaoCelsius.addEventListener("click", () => {
  localStorage.setItem("unidadeTemperatura", "celsius");

  if (climaAtual) {
    const cidade = cidades.find((item) => item.value === cidadeSelect.value);
    atualizarTela(cidade, climaAtual, "celsius");
  }
});

botaoFahrenheit.addEventListener("click", () => {
  localStorage.setItem("unidadeTemperatura", "fahrenheit");

  if (climaAtual) {
    const cidade = cidades.find((item) => item.value === cidadeSelect.value);
    atualizarTela(cidade, climaAtual, "fahrenheit");
  }
});

cidadeSelect.addEventListener("change", () => {
  localStorage.setItem("cidade", cidadeSelect.value);
  carregarCidade(cidadeSelect.value);
});

botaoLocalizacao.addEventListener("click", usarMinhaLocalizacao);

const cidadeSalva = localStorage.getItem("cidade") || "florianopolis";

cidadeSelect.value = cidadeSalva;
carregarCidade(cidadeSalva);