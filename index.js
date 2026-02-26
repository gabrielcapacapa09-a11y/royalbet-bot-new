const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const TOKEN = "SEU_TOKEN_AQUI";
const OWNER_ID = "SEU_ID_AQUI";

const tickets = new Map();
const queue = {};

const PIX_COPIA_COLA = {
  "10": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540510.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304179010",
  "20": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540520.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304CA6020",
  "30": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540530.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304712F",
  "40": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540540.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***630461A1",
  "50": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540550.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304DAEE"
};

function rowFecharTicket() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("fechar_ticket")
      .setLabel("❌ Fechar Ticket")
      .setStyle(ButtonStyle.Secondary)
  );
}

client.once("ready", () => {
  console.log("Bot online 👑");
});

client.on("interactionCreate", async (interaction) => {

  // ABRIR TICKET
  if (interaction.isChatInputCommand() && interaction.commandName === "x1") {

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: OWNER_ID, allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    tickets.set(channel.id, {
      userId: interaction.user.id
    });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("device")
        .setPlaceholder("Escolha o dispositivo")
        .addOptions(
          { label: "Mobile", value: "Mobile" },
          { label: "Emulador", value: "Emulador" }
        )
    );

    await channel.send({
      content: "📱 Escolha seu dispositivo:",
      components: [menu, rowFecharTicket()]
    });

    interaction.reply({ content: "Ticket criado ✅", ephemeral: true });
  }

  // SELECT MENUS
  if (interaction.isStringSelectMenu()) {

    const data = tickets.get(interaction.channel.id);
    if (!data) return;

    if (interaction.customId === "device") {
      data.device = interaction.values[0];

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("modo")
          .setPlaceholder("Escolha o modo")
          .addOptions(
            { label: "X1", value: "X1" }
          )
      );

      return interaction.update({
        content: "🎮 Escolha o modo:",
        components: [menu, rowFecharTicket()]
      });
    }

    if (interaction.customId === "modo") {
      data.modo = interaction.values[0];

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("estilo")
          .setPlaceholder("Escolha o estilo")
          .addOptions(
            { label: "Normal", value: "Normal" },
            { label: "Tático", value: "Tatico" }
          )
      );

      return interaction.update({
        content: "⚔️ Escolha o estilo:",
        components: [menu, rowFecharTicket()]
      });
    }

    if (interaction.customId === "estilo") {
      data.estilo = interaction.values[0];

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("valor")
          .setPlaceholder("Escolha o valor")
          .addOptions(
            { label: "R$10", value: "10" },
            { label: "R$20", value: "20" },
            { label: "R$30", value: "30" },
            { label: "R$40", value: "40" },
            { label: "R$50", value: "50" }
          )
      );

      return interaction.update({
        content: "💰 Escolha o valor:",
        components: [menu, rowFecharTicket()]
      });
    }

    if (interaction.customId === "valor") {

      data.valor = interaction.values[0];

      const confirmar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("confirmar_pagamento")
          .setLabel("✅ Já fiz o pagamento")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.update({
        content:
`💰 VALOR: R$ ${data.valor}

📲 PIX Copia e Cola:
\`\`\`
${PIX_COPIA_COLA[data.valor]}
\`\`\`

⚠️ Envie o comprovante neste ticket.

⏳ A sala será criada após o ADM ficar online
ou você pode chamar no privado.`,
        components: [confirmar, rowFecharTicket()]
      });
    }
  }

  // BOTÕES
  if (interaction.isButton()) {

    const data = tickets.get(interaction.channel.id);
    if (!data) return;

    if (interaction.customId === "fechar_ticket") {
      return interaction.channel.delete();
    }

    if (interaction.customId === "confirmar_pagamento") {

      if (interaction.user.id !== OWNER_ID)
        return interaction.reply({ content: "Aguardando confirmação do ADM.", ephemeral: true });

      const key = `${data.device}-${data.modo}-${data.estilo}-${data.valor}`;
      if (!queue[key]) queue[key] = [];

      queue[key].push({
        userId: data.userId,
        config: data
      });

      await interaction.reply("✅ Pagamento confirmado. Entrou na fila!");

      if (queue[key].length >= 2) {

        const p1 = queue[key].shift();
        const p2 = queue[key].shift();

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

        const embed = new EmbedBuilder()
          .setTitle("🔥 MATCH ENCONTRADO")
          .setColor("Green")
          .setDescription(
`👤 <@${p1.userId}> 🆚 <@${p2.userId}>

🎮 ${p1.config.modo}
📱 ${p1.config.device}
⚔️ ${p1.config.estilo}
💰 R$ ${p1.config.valor}

⏳ A sala será criada quando o ADM estiver online.
📩 Ou chame no privado para agilizar.`
          );

        await matchChannel.send({
          content: `<@${p1.userId}> <@${p2.userId}>`,
          embeds: [embed]
        });
      }
    }
  }

});

client.login(TOKEN);
