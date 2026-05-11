export type MemoryAsset = {
  src: string;
  alt: string;
  label: string;
  tone: "couple" | "eva" | "samuel" | "stephanie";
};

export const memories: MemoryAsset[] = [
  { src: "/memories/couple-sunny.jpeg", alt: "Samuel e Stephanie sorrindo juntos", label: "Nosso sol", tone: "couple" },
  { src: "/memories/couple-mirror.jpeg", alt: "Samuel e Stephanie em uma foto no espelho", label: "Nós dois", tone: "couple" },
  { src: "/memories/stephanie-eva-puppy-01.jpeg", alt: "Stephanie com Eva Flor filhote", label: "Primeiros carinhos", tone: "stephanie" },
  { src: "/memories/samuel-eva-bed.jpeg", alt: "Samuel descansando com Eva Flor", label: "Companhia fiel", tone: "samuel" },
  { src: "/memories/eva-smile-kitchen.jpeg", alt: "Eva Flor sorrindo", label: "Fiscal Eva Flor", tone: "eva" },
  { src: "/memories/eva-close.jpeg", alt: "Eva Flor olhando de perto", label: "Olho no orçamento", tone: "eva" },
  { src: "/memories/stephanie-keys.jpeg", alt: "Stephanie sorrindo com chaves", label: "Chaves e planos", tone: "stephanie" },
  { src: "/memories/samuel-childhood.jpeg", alt: "Samuel criança com mochila", label: "Desde pequeno", tone: "samuel" },
  { src: "/memories/eva-nap.jpeg", alt: "Eva Flor tirando uma soneca", label: "Soneca fiscal", tone: "eva" },
  { src: "/memories/eva-table.jpeg", alt: "Eva Flor na mesa", label: "Reunião de resultados", tone: "eva" },
  { src: "/memories/stephanie-eva-puppy-02.jpeg", alt: "Stephanie com Eva Flor filhote 2", label: "Família crescendo", tone: "stephanie" },
  { src: "/memories/samuel-purple.jpeg", alt: "Samuel com roupa roxa", label: "Samuel estiloso", tone: "samuel" },
];

export const evaPhotos = [
  "/memories/eva-smile-kitchen.jpeg",
  "/memories/eva-close.jpeg",
  "/memories/eva-nap.jpeg",
  "/memories/eva-table.jpeg",
  "/memories/samuel-eva-bed.jpeg",
  "/memories/stephanie-eva-puppy-01.jpeg",
  "/memories/stephanie-eva-puppy-02.jpeg",
];

export const evaQuotes = [
  "Eu aprovei esse lançamento, mas quero comprovante em carinho.",
  "Orçamento organizado rende mais passeios e menos sustos.",
  "Se sobrar no mês, minha sugestão técnica é petisco.",
  "Despesa fixa sem revisar fica com cara de boleto escondido.",
  "Meta boa é aquela que cabe no bolso e no coração.",
  "Eu vi esse gasto rápido. Agora registra direitinho.",
  "Patrimônio também é paz na casa.",
  "Feira do mês merece relatório, banana e serenidade.",
  "Respira. Um lançamento por vez também constrói futuro.",
  "Eva Flor recomenda: atualizar antes de decidir.",
  "Eu aceito pagamento em afago. Qualquer quantia.",
  "Vocês são o casal mais organizado do bairro. Eu garanto com o latido.",
  "Cada real guardado é um passo mais perto da liberdade. Eu fico feliz só de pensar.",
  "Finança bem cuidada, casa mais serena. Eu aprovo latindo.",
  "Samuel, Stephanie - vocês dois juntos são imbatíveis.",
  "Eu não entendo de juros, mas entendo de cuidar. E vocês cuidam bem.",
  "Lançamento feito é conquista celebrada com o rabinho abanando.",
  "Controle financeiro e amor são as duas coisas que mantêm essa casa em pé.",
  "Não se esqueçam: reserva de emergência é igual ao meu osso escondido. Sempre tem quando precisa.",
  "Vocês trabalham tanto que até eu fico animada só de ver. Orgulho de cachorra.",
];

export const evaQuotesByTab: Record<string, string[]> = {
  overview: [
    "Fiz uma vistoria geral. Tudo parece em ordem - pelo menos é o que o olfato diz.",
    "Visão geral bonita de ver. Continuem assim que eu fico aqui de guarda.",
    "Saldo positivo tem gosto de biscoito. Literalmente.",
    "Olha esse painel todo arrumado. Quem diria que finanças podiam ser tão fofas.",
    "Eu vigiei cada real desse mês. Pode confiar no relatório da Eva.",
    "Gráfico bonito, saldo organizado. Esse casal sabe o que faz.",
    "Primeira coisa que faço todo dia: cheiro o orçamento. Hoje tá cheirando bem.",
    "Fluxo mensal em dia. Eu latia de felicidade quando vi isso aqui.",
  ],
  entry: [
    "Lançamento feito. Agora eu posso relaxar um pouquinho. Mereci meu petisco.",
    "Cada lançamento é um passo. Vocês não param de andar - eu corro junto.",
    "Registrado com capricho. Eu vi. A Eva não perde um.",
    "Mais um lançamento certinho. O CSV agradece, eu também.",
    "Lançamento rápido é lançamento feito. Sem desculpa de esquecer enquanto eu estiver aqui.",
    "Anotar tudo é a parte chata, eu sei. Mas vocês fazem mesmo assim. Isso é caráter.",
    "Eu estaria latindo de empolgação, mas fingi que sou profissional. Lançamento aceito.",
    "Registrado. Esse casal organizado me enche de orgulho de cachorra.",
  ],
  import: [
    "Importar fatura é como farejar um quintal inteiro. Vamos por partes e com calma.",
    "Eu trouxe os lançamentos para a prévia. Agora vocês conferem antes de guardar.",
    "Parcelas detectadas, valores na mesa. A Eva recomenda revisar com carinho.",
    "CSV organizado deixa meu coraçãozinho financeiro em paz.",
    "PDF lido. Se algo parecer estranho, ajustem antes de salvar. Eu fico de olho.",
    "Fatura importada com cuidado vale por vários lançamentos manuais.",
  ],
  analysis: [
    "Fui olhar os gráficos. Muito número, mas eu confio em vocês para interpretar.",
    "Análise financeira é como farejar pista: tem que ser cuidadoso e ir fundo.",
    "Os dados não mentem. E eu também não minto. Categoria dominante no olho.",
    "Projeção do mês: eu calculei tudo enquanto tirava a soneca. Parece certo.",
    "Tendência de saldo subindo. Esse gráfico está do meu lado.",
    "Insights prontos. Eu recomendo ler com calma - e tomar água depois.",
    "Análise feita. A Eva Flor assina embaixo como consultora não remunerada.",
    "Vocês têm os dados, têm o gráfico e têm a mim. Já dão conta de qualquer decisão.",
  ],
  goals: [
    "Nova meta. Meu rabinho não para de abanar de tanta animação.",
    "Quem tem meta não se perde. Eu sigo vocês por onde for.",
    "Meta registrada. A Eva Flor já está torcendo - e ela late bonito quando vai bem.",
    "Cada aporte na meta é um biscoito no pote. Guarda mais um.",
    "Progresso na meta é a coisa mais animadora depois de passear na chuva.",
    "Sonho grande, passo pequeno, Eva Flor junto. Essa é a fórmula.",
    "Meta cumprida vai merecer comemoração. Eu já estou planejando dançar.",
    "Eu mordi a meta e ela pareceu sólida. Pode seguir com confiança.",
  ],
  assets: [
    "Patrimônio crescendo é como eu cresci: com carinho e tempo.",
    "Bem cadastrado é bem cuidado. A Eva aprova.",
    "Cada item nessa lista é uma conquista de vocês dois. Eu me emociono.",
    "Inventário do casal atualizado. Eu fiscalizei e está tudo contado.",
    "Bens reais, valores reais. Essa clareza faz toda diferença.",
    "Ver o patrimônio organizado me dá vontade de dormir tranquila no sofá de vocês.",
    "Carro, eletrônico, reserva - vocês constroem uma vida real aqui. Bonito de ver.",
    "Eu não tenho patrimônio, mas tenho vocês. Isso vale mais que qualquer ativo.",
  ],
  groceries: [
    "Feira registrada. E o osso estava na lista dessa vez? Pergunta que precisa de resposta.",
    "Mercado controlado é casa feliz. Eu sei disso mais do que qualquer um.",
    "Cada alimento registrado é uma decisão consciente. E também é comida - o melhor assunto.",
    "Hortifruti, carnes, laticínios... eu sei reconhecer uma boa feira quando vejo.",
    "Relatório do mercado pronto. Agora eu preciso inspecionar os produtos presencialmente.",
    "Comida boa, registro feito, Eva satisfeita. Tudo certo aqui.",
    "Vocês compraram tudo isso? Eu preciso acompanhar mais as idas ao mercado.",
    "Feira do mês em dia. O estômago e o orçamento agradecem. Eu também.",
  ],
  security: [
    "Segurança em dia, acesso privado. Eu ladro para quem não for autorizado.",
    "Só Samuel e Stephanie entram aqui. Eu sou a porteira e não estou de brincadeira.",
    "Código compartilhado, casa segura. A Eva está de guarda 24 horas.",
    "Privacidade é como o meu canto no sofá: não compartilho com qualquer um.",
    "Acesso exclusivo do casal. Eu vejo quem chega - e não gosto de visita surpresa.",
    "Senha trocada regularmente, app seguro. Eva aprova essa postura.",
    "A casa financeira de vocês está protegida. Pode dormir tranquilo que eu estou aqui.",
    "Dois acessos, uma casa, muito amor. E eu de guarda. Combinação perfeita.",
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
