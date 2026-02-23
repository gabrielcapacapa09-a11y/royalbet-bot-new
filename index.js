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

client.on("messageCreate", async (message) => {
  if (message.content === "!ticket") {

    const embed = new EmbedBuilder()
      .setTitle("👑 ROYAL BET FF – SISTEMA OFICIAL")
      .setDescription(
        "🔥 Sistema Oficial de Apostas\n\n" +
        "• 1v1 • 2v2 • 3v3 • 4v4\n" +
        "• Normal ou Tático\n" +
        "• Mobile / PC / Emulador\n\n" +
        "Clique abaixo para abrir sua aposta."
      )
      .setColor("#ff0000")
      .setThumbnail(LOGO_URL)
      .setFooter({ text: "RoyalBet © Sistema Oficial" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("abrir_aposta")
        .setLabel("🔥 Abrir Aposta")
        .setStyle(ButtonStyle.Danger)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  if (interaction.customId === "abrir_aposta") {

    const channel = await interaction.guild.channels.create({
      name: `aposta-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: process.env.OWNER_ID,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    await interaction.reply({
      content: `Ticket criado: ${channel}`,
      ephemeral: true
    });

    const embed = new EmbedBuilder()
      .setTitle("Escolha seu dispositivo")
      .setColor("#ff0000")
      .setThumbnail(LOGO_URL);

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

    channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [menu] });
  }

  if (interaction.customId === "device") {
    pendingBets[interaction.user.id] = { device: interaction.values[0] };

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

    await interaction.update({ content: "Escolha o modo:", components: [menu] });
  }

  if (interaction.customId === "modo") {
    pendingBets[interaction.user.id].modo = interaction.values[0];

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("estilo")
        .setPlaceholder("Normal ou Tático?")
        .addOptions([
          { label: "Normal", value: "Normal" },
          { label: "Tático", value: "Tatico" }
        ])
    );

    await interaction.update({ content: "Escolha o estilo:", components: [menu] });
  }

  if (interaction.customId === "estilo") {
    pendingBets[interaction.user.id].estilo = interaction.values[0];

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

    await interaction.update({ content: "Escolha o valor:", components: [menu] });
  }

  if (interaction.customId === "confirmar") {

    if (interaction.user.id !== process.env.OWNER_ID)
      return interaction.reply({ content: "Apenas o dono pode confirmar.", ephemeral: true });

    const userId = Object.keys(pendingBets)[0];
    const bet = pendingBets[userId];
    if (!bet) return;

    const key = `${bet.device}_${bet.modo}_${bet.estilo}_${bet.valor}`;
    if (!queue[key]) queue[key] = [];

    queue[key].push(userId);

    await interaction.reply({
      content: `PIX:\n\`\`\`${pixPorValor[bet.valor]}\`\`\``,
      ephemeral: true
    });

    interaction.channel.send("Pagamento confirmado. Jogador entrou na fila.");

    delete pendingBets[userId];
  }

  if (interaction.customId === "cancelar") {
    delete pendingBets[interaction.user.id];
    interaction.channel.delete();
  }
});

client.login(process.env.TOKEN);
