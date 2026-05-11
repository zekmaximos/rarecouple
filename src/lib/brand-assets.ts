export type MemoryAsset = {
  src: string;
  alt: string;
  label: string;
  tone: "couple" | "eva" | "samuel" | "stephanie";
};

export const memories: MemoryAsset[] = [
  {
    src: "/memories/couple-sunny.jpeg",
    alt: "Samuel e Stephanie sorrindo juntos",
    label: "Nosso sol",
    tone: "couple",
  },
  {
    src: "/memories/couple-mirror.jpeg",
    alt: "Samuel e Stephanie em uma foto no espelho",
    label: "Nos dois",
    tone: "couple",
  },
  {
    src: "/memories/stephanie-eva-puppy-01.jpeg",
    alt: "Stephanie com Eva Flor filhote",
    label: "Primeiros carinhos",
    tone: "stephanie",
  },
  {
    src: "/memories/samuel-eva-bed.jpeg",
    alt: "Samuel descansando com Eva Flor",
    label: "Companhia fiel",
    tone: "samuel",
  },
  {
    src: "/memories/eva-smile-kitchen.jpeg",
    alt: "Eva Flor sorrindo",
    label: "Fiscal Eva Flor",
    tone: "eva",
  },
  {
    src: "/memories/eva-close.jpeg",
    alt: "Eva Flor olhando de perto",
    label: "Olho no orcamento",
    tone: "eva",
  },
  {
    src: "/memories/stephanie-keys.jpeg",
    alt: "Stephanie sorrindo com chaves",
    label: "Chaves e planos",
    tone: "stephanie",
  },
  {
    src: "/memories/samuel-childhood.jpeg",
    alt: "Samuel crianca com mochila",
    label: "Desde pequeno",
    tone: "samuel",
  },
  {
    src: "/memories/eva-nap.jpeg",
    alt: "Eva Flor tirando uma soneca",
    label: "Soneca fiscal",
    tone: "eva",
  },
  {
    src: "/memories/eva-table.jpeg",
    alt: "Eva Flor na mesa",
    label: "Reuniao de resultados",
    tone: "eva",
  },
  {
    src: "/memories/stephanie-eva-puppy-02.jpeg",
    alt: "Stephanie com Eva Flor filhote 2",
    label: "Familia crescendo",
    tone: "stephanie",
  },
  {
    src: "/memories/samuel-purple.jpeg",
    alt: "Samuel com roupa roxa",
    label: "Samuel estiloso",
    tone: "samuel",
  },
];

// Fotos da Eva para rotacionar na bolha
export const evaPhotos = [
  "/memories/eva-smile-kitchen.jpeg",
  "/memories/eva-close.jpeg",
  "/memories/eva-nap.jpeg",
  "/memories/eva-table.jpeg",
  "/memories/samuel-eva-bed.jpeg",
  "/memories/stephanie-eva-puppy-01.jpeg",
  "/memories/stephanie-eva-puppy-02.jpeg",
];

// Frases gerais da Eva (fallback)
export const evaQuotes = [
  "Eu aprovei esse lancamento, mas quero comprovante em carinho.",
  "Orcamento organizado rende mais passeios e menos sustos.",
  "Se sobrar no mes, minha sugestao tecnica e petisco.",
  "Despesa fixa sem revisar fica com cara de boleto escondido.",
  "Meta boa e aquela que cabe no bolso e no coracao.",
  "Eu vi esse gasto rapido. Agora registra direitinho.",
  "Patrimonio tambem e paz na casa.",
  "Feira do mes merece relatorio, banana e serenidade.",
  "Respira. Um lancamento por vez tambem constroi futuro.",
  "Eva Flor recomenda: atualizar antes de decidir.",
  "Eu aceito pagamento em afago. Qualquer quantia.",
  "Voces sao o casal mais organizado do bairro. Eu garanto com o latido.",
  "Cada real guardado e um passo mais perto da liberdade. Eu fico feliz so de pensar.",
  "Financa bem cuidada, casa mais serena. Eu aprovo latindo.",
  "Samuel, Stephanie — voces dois juntos sao imbativeis.",
  "Eu nao entendo de juros, mas entendo de cuidar. E voces cuidam bem.",
  "Lancamento feito e conquista celebrada com o rabinho abanando!",
  "Controle financeiro e amor sao as duas coisas que mantem essa casa em pe.",
  "Nao se esquecam: reserva de emergencia e igual ao meu osso escondido. Sempre tem quando precisa.",
  "Voces trabalham tanto que ate eu fico animada de so ver. Orgulho de cachorra!",
];

// Frases contextuais por aba
export const evaQuotesByTab: Record<string, string[]> = {
  overview: [
    "Fiz uma vistoria geral. Tudo parece em ordem — pelo menos e o que o olfato diz.",
    "Visao geral bonita de ver. Continuem assim que eu fico aqui de guarda.",
    "Saldo positivo tem gosto de biscoito. Literalmente.",
    "Olha esse painel todo arrumado! Quem diria que financas podiam ser tao fofas.",
    "Eu vigiei cada real desse mes. Pode confiar no relatorio da Eva.",
    "Grafico bonito, saldo organizado. Esse casal sabe o que faz.",
    "Primeira coisa que faco todo dia: cheiro o orcamento. Hoje ta cheirando bem.",
    "Fluxo mensal em dia. Eu latia de felicidade quando vi isso aqui.",
  ],
  entry: [
    "Lancamento feito! Agora eu posso relaxar um pouquinho. Mereci meu petisco.",
    "Cada lancamento e um passo. Voces nao param de andar — eu corro junto!",
    "Registrado com capricho. Eu vi. A Eva nao perde um.",
    "Mais um lancamento certinho. O CSV agradece, eu tambem.",
    "Lancamento rapido e lancamento feito. Sem desculpa de esquecer enquanto eu estiver aqui.",
    "Anotar tudo e a parte chata, eu sei. Mas voces fazem mesmo assim. Isso e carater.",
    "Eu estaria latindo de empolgacao, mas fingi que sou profissional. Lancamento aceito.",
    "Registrado! Esse casal organizado me enche de orgulho de cachorra.",
  ],
  analysis: [
    "Fui olhar os graficos. Muito numero, mas eu confio em voces pra interpretar.",
    "Analise financeira e como farejar pista: tem que ser cuidadoso e ir fundo.",
    "Os dados nao mentem. E eu tambem nao minto. Categoria dominante no olho.",
    "Projecao do mes: eu calculei tudo enquanto tirava a soneca. Parece certo.",
    "Tendencia de saldo subindo! Esse grafico esta do meu lado.",
    "Insights prontos. Eu recomendo ler com calma — e tomar agua depois.",
    "Analise feita. A Eva Flor assina embaixo como consultora nao remunerada.",
    "Voces tem os dados, tem o grafico e tem a mim. Ja dao conta de qualquer decisao.",
  ],
  goals: [
    "Nova meta! Meu rabinho nao para de abanar de tanta animacao.",
    "Quem tem meta nao se perde. Eu sigo voces por onde for.",
    "Meta registrada. A Eva Flor ja esta torcendo — e ela late bonito quando vai bem.",
    "Cada aporte na meta e um biscoito no pote. Guarda mais um!",
    "Progresso na meta e a coisa mais animadora depois de passear na chuva.",
    "Sonho grande, passo pequeno, Eva Flor junto. Essa e a formula.",
    "Meta cumprida vai merecer comemoracao. Eu ja estou planejando dancar.",
    "Eu mordi a meta e ela pareceu solida. Pode seguir com confianca.",
  ],
  assets: [
    "Patrimonio crescendo e como eu cresci: com carinho e tempo.",
    "Bem cadastrado e bem cuidado. A Eva aprova.",
    "Cada item nessa lista e uma conquista de voces dois. Eu me emociono.",
    "Inventario do casal atualizado. Eu fiscalizei e esta tudo contado.",
    "Bens reais, valores reais. Essa clareza faz toda diferenca.",
    "Ver o patrimonio organizado me da vontade de dormir tranquila no sofa de voces.",
    "Carro, eletronico, reserva — voces constroem uma vida real aqui. Bonito de ver.",
    "Eu nao tenho patrimonio, mas tenho voces. Isso vale mais que qualquer ativo.",
  ],
  groceries: [
    "Feira registrada! E o osso estava na lista dessa vez? Pergunta que precisa de resposta.",
    "Mercado controlado e casa feliz. Eu sei disso mais do que qualquer um.",
    "Cada alimento registrado e uma decisao consciente. E tambem e comida — o melhor assunto.",
    "Hortifruti, carnes, laticinios... eu sei reconhecer uma boa feira quando vejo.",
    "Relatorio do mercado pronto. Agora eu preciso inspecionar os produtos presencialmente.",
    "Comida boa, registro feito, eva satisfeita. Tudo certo aqui.",
    "Voces compraram tudo isso? Eu preciso acompanhar mais as idas ao mercado.",
    "Feira do mes em dia. O estomago e o orcamento agradecem. Eu tambem.",
  ],
  security: [
    "Seguranca em dia, acesso privado. Eu ladro pra quem nao for autorizado.",
    "So Samuel e Stephanie entram aqui. Eu sou a porteira e nao estou de brincadeira.",
    "Codigo compartilhado, casa segura. A Eva esta de guarda 24 horas.",
    "Privacidade e como o meu canto no sofa: nao compartilho com qualquer um.",
    "Acesso exclusivo do casal. Eu vejo quem chega — e nao gosto de visita surpresa.",
    "Senha trocada regularmente, app seguro. Eva aprova essa postura.",
    "A casa financeira de voces esta protegida. Pode dormir tranquilo que eu estou aqui.",
    "Dois acessos, uma casa, muito amor. E eu de guarda. Combinacao perfeita.",
  ],
};

export function getEvaQuote(tab?: string): string {
  if (tab && evaQuotesByTab[tab]?.length) {
    const pool = evaQuotesByTab[tab];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return evaQuotes[Math.floor(Math.random() * evaQuotes.length)];
}

export function getRandomEvaPhoto(): string {
  return evaPhotos[Math.floor(Math.random() * evaPhotos.length)];
}

export const evaAvatar = "/memories/eva-smile-kitchen.jpeg";
