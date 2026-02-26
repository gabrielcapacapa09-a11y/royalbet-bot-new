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
  console.error("❌ TOKEN não definido no Environment.");
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

const pendingBets = {};
const queue = {};
const ranking = {};

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
    const userId = interaction.user.id;
    pendingBets[userId].device = interaction.values[0];

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("modo")
        .setPlaceholder("Selecione o modo")
        .addOptions([{ label: "1v1", value: "1v1" }])
    );

    interaction.update({
      content: `<@${userId}> Escolha o modo:`,
      components: [menu, rowFechar()]
    });
  }

  if (interaction.customId === "modo") {
    const userId = interaction.user.id;
    pendingBets[userId].modo = interaction.values[0];

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("estilo")
        .setPlaceholder("Selecione o estilo")
        .addOptions([
          { label: "Normal", value: "Normal" },
          { label: "Tático", value: "Tático" }
        ])
    );

    interaction.update({
      content: `<@${userId}> Escolha o estilo:`,
      components: [menu, rowFechar()]
    });
  }

  if (interaction.customId === "estilo") {
    const userId = interaction.user.id;
    pendingBets[userId].estilo = interaction.values[0];

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

    interaction.update({
      content: `<@${userId}> Escolha o valor:`,
      components: [menu, rowFechar()]
    });
  }

  if (interaction.customId === "valor") {
    const valor = interaction.values[0];
    const userId = interaction.user.id;
    pendingBets[userId].valor = valor;
    const bet = pendingBets[userId];

    const pix = pixPorValor[valor];

    const embed = new EmbedBuilder()
      .setTitle("💰 Pagamento via PIX")
      .setColor("Gold")
      .setDescription(
        `🎮 Modo: ${bet.modo}\n` +
        `📱 Dispositivo: ${bet.device}\n` +
        `⚔️ Estilo: ${bet.estilo}\n` +
        `💰 Valor: R$${valor}\n\n` +
        `\`\`\`\n${pix}\n\`\`\`\n\n` +
        `Aguardando adversário...`
      );

    interaction.update({ embeds: [embed], components: [rowFechar()] });

    const key = `${bet.device}-${bet.modo}-${bet.estilo}-${valor}`;

    if (!queue[key]) queue[key] = [];
    queue[key].push(userId);

    if (queue[key].length >= 2) {
      const p1 = queue[key].shift();
      const p2 = queue[key].shift();

      const matchEmbed = new EmbedBuilder()
        .setTitle("🔥 MATCH ENCONTRADO - ROYAL BET")
        .setColor("Green")
        .setThumbnail(LOGO_URL)
        .setDescription(
          `👤 <@${p1}> 🆚 <@${p2}>\n\n` +
          `🎮 Modo: ${bet.modo}\n` +
          `📱 Dispositivo: ${bet.device}\n` +
          `⚔️ Estilo: ${bet.estilo}\n` +
          `💰 Valor: R$${valor}\n\n` +
          `⏳ A sala será criada após o ADM ficar online.\n` +
          `📩 Caso queira agilizar, chame o ADM no privado.`
        );

      interaction.channel.send({ embeds: [matchEmbed] });
    }
  }

  if (interaction.customId === "fechar_ticket") {
    interaction.channel.delete();
  }
});

client.login(TOKEN);
