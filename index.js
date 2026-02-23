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

const LOGO_URL = "https://image2url.com/r2/default/images/1771860578126-909d839f-5887-44ea-a5ec-eac8c2533f57.png";

let painelChannelId = null;

const pixPorValor = {
  "10": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540510.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***63041790",
  "20": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540520.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304CA60",
  "30": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540530.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304712F",
  "40": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540540.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***630461A1",
  "50": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540550.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304DAEE"
};

const pendingBets = {};
const queue = {};

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});


// =====================
// COMANDO !ticket
// =====================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ticket") {

    painelChannelId = message.channel.id; // salva canal principal

    const embed = new EmbedBuilder()
      .setTitle("👑 ROYAL BET FF – SISTEMA OFICIAL")
      .setColor("Red")
      .setThumbnail(LOGO_URL)
      .setDescription(
        "🔥 Sistema Oficial de Apostas\n\n" +
        "• 1v1 • 2v2 • 3v3 • 4v4\n" +
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
});


// =====================
// INTERAÇÕES
// =====================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  // ABRIR TICKET
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

    const fechar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("fechar_ticket")
        .setLabel("❌ Fechar Ticket")
        .setStyle(ButtonStyle.Secondary)
    );

    channel.send({
      content: `<@${interaction.user.id}> Escolha seu dispositivo:`,
      components: [menu, fechar]
    });
  }

  // FECHAR TICKET
  if (interaction.customId === "fechar_ticket") {

    if (interaction.user.id !== OWNER_ID &&
        !interaction.channel.name.includes(interaction.user.username)) {
      return interaction.reply({ content: "❌ Você não pode fechar.", ephemeral: true });
    }

    await interaction.reply({ content: "Fechando ticket...", ephemeral: true });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 1500);
  }

  // DEVICE
  if (interaction.customId === "device") {
    pendingBets[interaction.channel.id] = {
      userId: interaction.user.id,
      device: interaction.values[0]
    };

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("modo")
        .setPlaceholder("Escolha o modo")
        .addOptions([
          { label: "1v1", value: "1v1" },
          { label: "2v2", value: "2v2" },
          { label: "3v3", value: "3v3" },
          { label: "4v4", value: "4v4" }
        ])
    );

    interaction.update({ content: "Escolha o modo:", components: [menu] });
  }

  // MODO
  if (interaction.customId === "modo") {
    pendingBets[interaction.channel.id].modo = interaction.values[0];

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("estilo")
        .setPlaceholder("Normal ou Tático?")
        .addOptions([
          { label: "Normal", value: "Normal" },
          { label: "Tático", value: "Tatico" }
        ])
    );

    interaction.update({ content: "Escolha o estilo:", components: [menu] });
  }

  // ESTILO
  if (interaction.customId === "estilo") {
    pendingBets[interaction.channel.id].estilo = interaction.values[0];

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("valor")
        .setPlaceholder("Escolha o valor")
        .addOptions([
          { label: "R$10", value: "10" },
          { label: "R$20", value: "20" },
          { label: "R$30", value: "30" },
          { label: "R$40", value: "40" },
          { label: "R$50", value: "50" }
        ])
    );

    interaction.update({ content: "Escolha o valor:", components: [menu] });
  }

  // VALOR
  if (interaction.customId === "valor") {
    const valor = interaction.values[0];
    pendingBets[interaction.channel.id].valor = valor;

    const pix = pixPorValor[valor];

    const confirmar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirmar_pagamento")
        .setLabel("✅ Confirmar Pagamento")
        .setStyle(ButtonStyle.Success)
    );

    interaction.update({
      content:
        `💰 Valor: R$${valor}\n\n` +
        `📲 PIX:\n\`\`\`\n${pix}\n\`\`\`\n\n` +
        `Aguardando confirmação do dono.`,
      components: [confirmar]
    });
  }

  // CONFIRMAR PAGAMENTO
  if (interaction.customId === "confirmar_pagamento") {

    if (interaction.user.id !== OWNER_ID)
      return interaction.reply({ content: "❌ Apenas o dono confirma.", ephemeral: true });

    const bet = pendingBets[interaction.channel.id];
    if (!bet) return;

    const key = `${bet.device}_${bet.modo}_${bet.estilo}_${bet.valor}`;
    if (!queue[key]) queue[key] = [];

    const painelChannel = interaction.guild.channels.cache.get(painelChannelId);

    const filaEmbed = new EmbedBuilder()
      .setTitle("🎯 JOGADOR NA FILA")
      .setColor("Red")
      .setThumbnail(LOGO_URL)
      .setDescription(
        `👤 <@${bet.userId}>\n` +
        `📱 ${bet.device}\n` +
        `🎮 ${bet.modo}\n` +
        `⚔️ ${bet.estilo}\n` +
        `💰 R$${bet.valor}\n\n` +
        `⏳ Aguardando adversário...`
      );

    const filaMsg = await painelChannel.send({ embeds: [filaEmbed] });

    queue[key].push({
      userId: bet.userId,
      messageId: filaMsg.id
    });

    if (queue[key].length >= 2) {

      const p1 = queue[key].shift();
      const p2 = queue[key].shift();

      const m1 = await painelChannel.messages.fetch(p1.messageId);
      const m2 = await painelChannel.messages.fetch(p2.messageId);

      await m1.delete().catch(() => {});
      await m2.delete().catch(() => {});

      const encerrada = new EmbedBuilder()
        .setTitle("🔥 APOSTA encontrada")
        .setColor("Green")
        .setThumbnail(LOGO_URL)
        .setDescription(
          `<@${p1.userId}> 🆚 <@${p2.userId}>\n\n` +
          `📩 Aguarde o administrador chamar no privado.`
        );

      await painelChannel.send({ embeds: [encerrada] });
    }

    delete pendingBets[interaction.channel.id];

    interaction.reply({
      content: "✅ Jogador colocado na fila.",
      ephemeral: true
    });
  }

});

client.login(TOKEN);
