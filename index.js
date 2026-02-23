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

const LOGO_URL = "https://image2url.com/r2/default/images/1771860578126-909d839f-5887-44ea-a5ec-eac8c2533f57.png";

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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  // CONFIRMAR PAGAMENTO
  if (interaction.customId === "confirmar_pagamento") {

    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ Apenas o dono pode confirmar.",
        ephemeral: true
      });
    }

    const bet = pendingBets[interaction.channel.id];
    if (!bet) return;

    const key = `${bet.device}_${bet.modo}_${bet.estilo}_${bet.valor}`;
    if (!queue[key]) queue[key] = [];

    // EMBED DE FILA
    const filaEmbed = new EmbedBuilder()
      .setTitle("🎯 JOGADOR NA FILA")
      .setColor("Red")
      .setThumbnail(LOGO_URL)
      .setDescription(
        `👤 Jogador: <@${bet.userId}>\n` +
        `📱 Dispositivo: ${bet.device}\n` +
        `🎮 Modo: ${bet.modo}\n` +
        `⚔️ Estilo: ${bet.estilo}\n` +
        `💰 Valor: R$${bet.valor}\n\n` +
        `⏳ Aguardando adversário...`
      );

    const filaMsg = await interaction.channel.send({ embeds: [filaEmbed] });

    queue[key].push({
      userId: bet.userId,
      messageId: filaMsg.id
    });

    // SE ENCONTRAR ADVERSÁRIO
    if (queue[key].length >= 2) {

      const player1 = queue[key].shift();
      const player2 = queue[key].shift();

      // Apagar mensagens de fila
      const msg1 = await interaction.channel.messages.fetch(player1.messageId);
      const msg2 = await interaction.channel.messages.fetch(player2.messageId);

      await msg1.delete().catch(() => {});
      await msg2.delete().catch(() => {});

      // Embed encerrada
      const encerradaEmbed = new EmbedBuilder()
        .setTitle("🔥 APOSTA ENCERRADA")
        .setColor("Green")
        .setThumbnail(LOGO_URL)
        .setDescription(
          `🎮 Partida Encontrada!\n\n` +
          `👤 <@${player1.userId}> 🆚 <@${player2.userId}>\n\n` +
          `📩 Aguarde o administrador chamar no privado.`
        );

      await interaction.channel.send({ embeds: [encerradaEmbed] });
    }

    delete pendingBets[interaction.channel.id];

    await interaction.reply({
      content: "✅ Pagamento confirmado e jogador colocado na fila.",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
