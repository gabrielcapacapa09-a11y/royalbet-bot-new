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
  "10": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540510.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304179010",
  "20": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540520.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304CA6020",
  "30": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540530.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304712F",
  "40": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540540.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***630461A1",
  "50": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540550.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304DAEE"
};

const pendingBets = {};
const queue = {};
const ranking = {};
const matchData = {};

function gerarSala() {
  const numero = Math.floor(1000 + Math.random() * 9000);
  const senha = Math.floor(1000 + Math.random() * 9000);
  return {
    nome: `ROYAL-${numero}`,
    senha: `${senha}`
  };
}

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});


// =====================
// COMANDOS
// =====================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // CRIAR PAINEL
  if (message.content === "!ticket") {

    painelChannelId = message.channel.id;

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

  // RANKING
  if (message.content === "!ranking") {

    if (Object.keys(ranking).length === 0)
      return message.reply("Nenhum jogador no ranking ainda.");

    const sorted = Object.entries(ranking)
      .sort((a, b) => b[1].wins - a[1].wins)
      .slice(0, 10);

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


// =====================
// INTERAÇÕES
// =====================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  // ABRIR APOSTA
  if (interaction.customId === "abrir_aposta") {

    const existing = interaction.guild.channels.cache.find(
      c => c.name === `aposta-${interaction.user.username}`
    );

    if (existing)
      return interaction.reply({
        content: "❌ Você já possui um ticket aberto.",
        ephemeral: true
      });

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

    channel.send({
      content: `<@${interaction.user.id}> Escolha seu dispositivo:`,
      components: [menu]
    });
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
    if (!pendingBets[interaction.channel.id]) return;

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
        `💰 Valor: R$${valor}\n\n📲 PIX:\n\`\`\`\n${pix}\n\`\`\`\n`,
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

    const filaMsg = await painelChannel.send({
      content: `🎯 <@${bet.userId}> entrou na fila (${bet.modo} - R$${bet.valor})`
    });

    queue[key].push({
      userId: bet.userId,
      messageId: filaMsg.id
    });

    if (queue[key].length >= 2) {

      const p1 = queue[key].shift();
      const p2 = queue[key].shift();

      await painelChannel.messages.fetch(p1.messageId).then(m => m.delete()).catch(() => {});
      await painelChannel.messages.fetch(p2.messageId).then(m => m.delete()).catch(() => {});

      const sala = gerarSala();

      const matchChannel = await interaction.guild.channels.create({
        name: `x1-${p1.userId}-vs-${p2.userId}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: p1.userId, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: p2.userId, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: OWNER_ID, allow: [PermissionsBitField.Flags.ViewChannel] }
        ]
      });

      matchData[matchChannel.id] = {
        p1: p1.userId,
        p2: p2.userId,
        valor: bet.valor
      };

      const embed = new EmbedBuilder()
        .setTitle("🔥 SALA CRIADA - ROYAL BET")
        .setColor("Green")
        .setThumbnail(LOGO_URL)
        .setDescription(
          `<@${p1.userId}> 🆚 <@${p2.userId}>\n\n` +
          `🏷️ Sala: **${sala.nome}**\n` +
          `🔐 Senha: **${sala.senha}**\n\n` +
          `📸 Envie o print da vitória aqui.`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("vitoria_p1")
          .setLabel("Vitória Jogador 1")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("vitoria_p2")
          .setLabel("Vitória Jogador 2")
          .setStyle(ButtonStyle.Danger)
      );

      await matchChannel.send({
        content: `<@${p1.userId}> <@${p2.userId}>`,
        embeds: [embed],
        components: [row]
      });
    }

    delete pendingBets[interaction.channel.id];

    interaction.reply({
      content: "✅ Jogador colocado na fila.",
      ephemeral: true
    });
  }

  // RESULTADO
  if (interaction.customId === "vitoria_p1" || interaction.customId === "vitoria_p2") {

    if (interaction.user.id !== OWNER_ID)
      return interaction.reply({ content: "❌ Apenas admin confirma.", ephemeral: true });

    const match = matchData[interaction.channel.id];
    if (!match) return;

    const vencedor = interaction.customId === "vitoria_p1" ? match.p1 : match.p2;
    const perdedor = interaction.customId === "vitoria_p1" ? match.p2 : match.p1;

    if (!ranking[vencedor]) ranking[vencedor] = { wins: 0, losses: 0 };
    if (!ranking[perdedor]) ranking[perdedor] = { wins: 0, losses: 0 };

    ranking[vencedor].wins++;
    ranking[perdedor].losses++;

    const embed = new EmbedBuilder()
      .setTitle("🏆 RESULTADO CONFIRMADO")
      .setColor("Gold")
      .setDescription(
        `🥇 Vencedor: <@${vencedor}>\n` +
        `🥈 Perdedor: <@${perdedor}>\n\n` +
        `💰 Valor: R$${match.valor}`
      );

    await interaction.update({ embeds: [embed], components: [] });

    delete matchData[interaction.channel.id];
  }

});

client.login(TOKEN);
