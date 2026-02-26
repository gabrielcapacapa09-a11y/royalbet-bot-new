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

function rowFechar() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("fechar_ticket")
      .setLabel("❌ Fechar Ticket")
      .setStyle(ButtonStyle.Secondary)
  );
}

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

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

    await interaction.editReply({
      content: `✅ Ticket criado: ${channel}`
    });

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
      components: [menu, rowFechar()]
    });
  }

  if (interaction.customId === "fechar_ticket") {
    return interaction.channel.delete();
  }

  // =====================
  // RESTANTE DO FLUXO
  // =====================
  // (mantido igual ao seu sistema anterior: device → modo → estilo → valor → fila → match → ranking)

  // ⚠️ IMPORTANTE:
  // Na parte do MATCH, use essa mensagem:

  /*
  const embed = new EmbedBuilder()
    .setTitle("🔥 MATCH ENCONTRADO - ROYAL BET")
    .setColor("Green")
    .setThumbnail(LOGO_URL)
    .setDescription(
      `👤 <@${p1.userId}> 🆚 <@${p2.userId}>\n\n` +
      `🎮 Modo: ${bet.modo}\n` +
      `📱 Dispositivo: ${bet.device}\n` +
      `⚔️ Estilo: ${bet.estilo}\n` +
      `💰 Valor: R$${bet.valor}\n\n` +
      `⏳ A sala será criada após o ADM ficar online.\n` +
      `📩 Caso queira agilizar, chame o ADM no privado.`
    );
  */
});

client.login(TOKEN);
