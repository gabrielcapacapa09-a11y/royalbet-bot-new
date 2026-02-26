const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const OWNER_ID = process.env.OWNER_ID;

if (!TOKEN) {
  console.log("❌ TOKEN não definido no Railway.");
  process.exit(1);
}

const LOGO_URL = "https://image2url.com/r2/default/images/1771860578126-909d839f-5887-44ea-a5ec-eac8c2533f57.png";

const pixPorValor = {
  "10": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540510.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304179010",
  "20": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540520.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304CA6020",
  "30": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540530.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304712F",
  "40": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540540.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***630461A1",
  "50": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540550.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304DAEE"
};

let painelMessage = null;

const filasPainel = {
  "10": [],
  "20": [],
  "30": [],
  "40": [],
  "50": []
};

const pendingBets = {};

function gerarPainelEmbed() {

  function bloco(valor) {
    const fila = filasPainel[valor];
    const p1 = fila[0] ? `<@${fila[0]}>` : "Vazio";
    const p2 = fila[1] ? `<@${fila[1]}>` : "Vazio";

    return {
      titulo: `💵 R$${valor}`,
      l1: `1️⃣ ${p1}`,
      l2: `2️⃣ ${p2}`
    };
  }

  const b10 = bloco("10");
  const b20 = bloco("20");
  const b30 = bloco("30");
  const b40 = bloco("40");
  const b50 = bloco("50");

  const grid =
    "```" +
    "\n" +
    `${b10.titulo.padEnd(15)}${b20.titulo.padEnd(15)}${b30.titulo}\n` +
    `${b10.l1.padEnd(15)}${b20.l1.padEnd(15)}${b30.l1}\n` +
    `${b10.l2.padEnd(15)}${b20.l2.padEnd(15)}${b30.l2}\n\n` +
    `${b40.titulo.padEnd(15)}${b50.titulo}\n` +
    `${b40.l1.padEnd(15)}${b50.l1}\n` +
    `${b40.l2.padEnd(15)}${b50.l2}` +
    "\n```";

  return new EmbedBuilder()
    .setTitle("👑 ROYAL BET FF – SISTEMA OFICIAL")
    .setColor("Red")
    .setThumbnail(LOGO_URL)
    .setDescription(
      "🔥 Sistema Oficial de Apostas\n\n" +
      "• 1v1\n" +
      "• Normal ou Tático\n" +
      "• Mobile / PC / Emulador\n\n" +
      "━━━━━━━━━━━━━━━━━━━\n\n" +
      "💰 FILAS ATIVAS\n\n" +
      grid
    );
}

client.once("clientReady", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ticket") {

    const embed = gerarPainelEmbed();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("abrir_aposta")
        .setLabel("🔥 Abrir Aposta")
        .setStyle(ButtonStyle.Danger)
    );

    painelMessage = await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  if (interaction.customId === "abrir_aposta") {

    await interaction.deferReply({ ephemeral: true });

    const canal = await interaction.guild.channels.create({
      name: `aposta-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: OWNER_ID, allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    pendingBets[interaction.user.id] = {};

    await interaction.editReply({ content: `✅ Ticket criado: ${canal}` });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("valor")
        .setPlaceholder("Selecione o valor")
        .addOptions([
          { label: "R$10", value: "10" },
          { label: "R$20", value: "20" },
          { label: "R$30", value: "30" },
          { label: "R$40", value: "40" },
          { label: "R$50", value: "50" }
        ])
    );

    canal.send({
      content: `<@${interaction.user.id}> Escolha o valor:`,
      components: [menu]
    });
  }

  if (interaction.customId === "valor") {

    const userId = interaction.user.id;
    const valor = interaction.values[0];

    pendingBets[userId].valor = valor;

    const embed = new EmbedBuilder()
      .setTitle("💰 Pagamento via PIX")
      .setColor("Gold")
      .setDescription(
        `💰 Valor: R$${valor}\n\n` +
        `\`\`\`\n${pixPorValor[valor]}\n\`\`\`\n\n` +
        `⚠️ Aguardando confirmação do ADM.`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirmar_pagamento")
        .setLabel("✅ Confirmar Pagamento")
        .setStyle(ButtonStyle.Success)
    );

    interaction.update({ embeds: [embed], components: [row] });
  }

  if (interaction.customId === "confirmar_pagamento") {

    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: "❌ Apenas o ADM pode confirmar.",
        ephemeral: true
      });
    }

    const userId = Object.keys(pendingBets)[0];
    const valor = pendingBets[userId].valor;

    filasPainel[valor].push(userId);

    await interaction.reply("✅ Pagamento confirmado.");

    await painelMessage.edit({ embeds: [gerarPainelEmbed()] });

    if (filasPainel[valor].length >= 2) {

      const p1 = filasPainel[valor].shift();
      const p2 = filasPainel[valor].shift();

      await interaction.channel.send(
        `🔥 MATCH ENCONTRADO!\n\n` +
        `👤 <@${p1}> 🆚 <@${p2}>\n` +
        `💰 Valor: R$${valor}\n\n` +
        `⏳ A sala será criada após o ADM ficar online ou chamar no privado.`
      );

      await painelMessage.edit({ embeds: [gerarPainelEmbed()] });
    }
  }
});

client.login(TOKEN);
