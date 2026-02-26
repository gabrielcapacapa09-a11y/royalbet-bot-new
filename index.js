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

const OWNER_ID = process.env.OWNER_ID;
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("❌ TOKEN não definido.");
  process.exit(1);
}

const LOGO_URL = "https://image2url.com/r2/default/images/1771860578126-909d839f-5887-44ea-a5ec-eac8c2533f57.png";

const pixPorValor = {
  "10": "SUA_CHAVE_PIX_10",
  "20": "SUA_CHAVE_PIX_20",
  "30": "SUA_CHAVE_PIX_30",
  "40": "SUA_CHAVE_PIX_40",
  "50": "SUA_CHAVE_PIX_50"
};

const pendingBets = {};
const queue = {};
const ranking = {};
const matchData = {};

function rowFechar() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("fechar_ticket")
      .setLabel("❌ Fechar Ticket")
      .setStyle(ButtonStyle.Secondary)
  );
}

client.once("clientReady", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ticket") {
    const embed = new EmbedBuilder()
      .setTitle("👑 ROYAL BET FF – SISTEMA OFICIAL")
      .setColor("Red")
      .setThumbnail(LOGO_URL)
      .setDescription(
        "🔥 Sistema Oficial de Apostas\n\n" +
        "• 1v1\n" +
        "• Normal ou Tático\n" +
        "• Mobile / PC / Emulador\n\n" +
        "Clique abaixo para abrir sua aposta."
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("abrir_aposta")
        .setLabel("🔥 Abrir Aposta")
        .setStyle(ButtonStyle.Danger)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }

  if (message.content === "!ranking") {
    if (Object.keys(ranking).length === 0)
      return message.reply("Nenhum jogador no ranking ainda.");

    const sorted = Object.entries(ranking)
      .sort((a, b) => b[1].wins - a[1].wins);

    let desc = "";
    sorted.forEach(([id, stats], index) => {
      desc += `**${index + 1}°** <@${id}> - 🏆 ${stats.wins}W / ❌ ${stats.losses}L\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 RANKING ROYAL BET")
      .setColor("Blue")
      .setDescription(desc);

    message.channel.send({ embeds: [embed] });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  // =============================
  // ABRIR TICKET
  // =============================
  if (interaction.customId === "abrir_aposta") {
    await interaction.deferReply({ ephemeral: true });

    const channel = await interaction.guild.channels.create({
      name: `aposta-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: OWNER_ID, allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    pendingBets[interaction.user.id] = {};

    await interaction.editReply({ content: `✅ Ticket criado: ${channel}` });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("device")
        .setPlaceholder("Selecione o dispositivo")
        .addOptions([
          { label: "Mobile", value: "Mobile" },
          { label: "PC", value: "PC" },
          { label: "Emulador", value: "Emulador" }
        ])
    );

    channel.send({
      content: `<@${interaction.user.id}> Escolha o dispositivo:`,
      components: [menu, rowFechar()]
    });
  }

  if (interaction.customId === "device") {
    pendingBets[interaction.user.id].device = interaction.values[0];

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("modo")
        .setPlaceholder("Selecione o modo")
        .addOptions([{ label: "1v1", value: "1v1" }])
    );

    interaction.update({ components: [menu, rowFechar()] });
  }

  if (interaction.customId === "modo") {
    pendingBets[interaction.user.id].modo = interaction.values[0];

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("estilo")
        .setPlaceholder("Selecione o estilo")
        .addOptions([
          { label: "Normal", value: "Normal" },
          { label: "Tático", value: "Tático" }
        ])
    );

    interaction.update({ components: [menu, rowFechar()] });
  }

  if (interaction.customId === "estilo") {
    pendingBets[interaction.user.id].estilo = interaction.values[0];

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

    interaction.update({ components: [menu, rowFechar()] });
  }

  // =============================
  // VALOR → MOSTRA PIX + BOTÃO CONFIRMAR
  // =============================
  if (interaction.customId === "valor") {
    const userId = interaction.user.id;
    const valor = interaction.values[0];

    pendingBets[userId].valor = valor;
    const bet = pendingBets[userId];

    const embed = new EmbedBuilder()
      .setTitle("💰 Pagamento via PIX")
      .setColor("Gold")
      .setDescription(
        `🎮 Modo: ${bet.modo}\n` +
        `📱 Dispositivo: ${bet.device}\n` +
        `⚔️ Estilo: ${bet.estilo}\n` +
        `💰 Valor: R$${valor}\n\n` +
        `\`\`\`\n${pixPorValor[valor]}\n\`\`\`\n\n` +
        `⚠️ Aguardando confirmação do ADM.`
      );

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirmar_pagamento")
        .setLabel("✅ Confirmar Pagamento")
        .setStyle(ButtonStyle.Success)
    );

    interaction.update({
      embeds: [embed],
      components: [confirmRow, rowFechar()]
    });
  }

  // =============================
  // CONFIRMAR PAGAMENTO (SÓ ADM)
  // =============================
  if (interaction.customId === "confirmar_pagamento") {

    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: "❌ Apenas o ADM pode confirmar.",
        ephemeral: true
      });
    }

    const userId = Object.keys(pendingBets)[0];
    const bet = pendingBets[userId];

    const key = `${bet.device}-${bet.modo}-${bet.estilo}-${bet.valor}`;
    if (!queue[key]) queue[key] = [];

    queue[key].push(userId);

    await interaction.reply("✅ Pagamento confirmado. Jogador entrou na fila.");

    if (queue[key].length >= 2) {
      const p1 = queue[key].shift();
      const p2 = queue[key].shift();

      const matchEmbed = new EmbedBuilder()
        .setTitle("🔥 MATCH ENCONTRADO - ROYAL BET")
        .setColor("Green")
        .setDescription(
          `👤 <@${p1}> 🆚 <@${p2}>\n\n` +
          `💰 Valor: R$${bet.valor}\n\n` +
          `⏳ A sala será criada após o ADM ficar online.\n` +
          `📩 Caso queira agilizar, chame o ADM no privado.`
        );

      interaction.channel.send({ embeds: [matchEmbed] });

      matchData[interaction.channel.id] = { p1, p2 };
    }
  }

  if (interaction.customId === "fechar_ticket") {
    interaction.channel.delete();
  }
});

client.login(TOKEN);
