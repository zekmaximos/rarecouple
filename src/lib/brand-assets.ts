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
];

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
];

export const evaAvatar = "/memories/eva-smile-kitchen.jpeg";
