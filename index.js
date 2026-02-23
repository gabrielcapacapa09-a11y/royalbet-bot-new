const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
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
const CHANNEL_FILA_ID = process.env.CHANNEL_FILA_ID;

const LOGO_URL = "https://image2url.com/r2/default/images/1771860578126-909d839f-5887-44ea-a5ec-eac8c2533f57.png";

const pixPorValor = {
  "10": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540510.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***63041790",
  "20": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540520.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304CA60",
  "30": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540530.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304712F",
  "40": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540540.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***630461A1",
  "50": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540550.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304DAEE"
};

let fila = [];

client.once("ready", () => {
  console.log(`🔥 ${client.user.tag} online`);
});

client.on("messageCreate", async (message) => {
  if (message.content === "!ticket") {
    const embed = new EmbedBuilder()
      .setTitle("🎯 ROYAL BET FF")
      .setDescription("Clique abaixo para iniciar sua aposta")
      .setThumbnail(LOGO_URL)
      .setColor("Gold");

    const btn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("iniciar")
        .setLabel("🎮 Iniciar Aposta")
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({ embeds: [embed], components: [btn] });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton() && interaction.customId === "iniciar") {
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

    return interaction.reply({
      content: "💰 Escolha o valor:",
      components: [menu],
      ephemeral: true
    });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "valor") {
    const valor = interaction.values[0];
    const pix = pixPorValor[valor];

    const embed = new EmbedBuilder()
      .setTitle("💳 PAGAMENTO VIA PIX")
      .setColor("Blue")
      .setDescription(
        `💰 Valor: R$${valor}\n\n` +
        `📌 Copie o código PIX abaixo:\n\n` +
        `\`\`\`\n${pix}\n\`\`\`\n\n` +
        `Após pagar, aguarde confirmação do administrador.`
      );

    const confirmar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirmar_${valor}`)
        .setLabel("✅ Confirmar Pagamento")
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({
      embeds: [embed],
      components: [confirmar],
      ephemeral: true
    });
  }

  if (interaction.isButton() && interaction.customId.startsWith("confirmar_")) {
    if (interaction.user.id !== OWNER_ID)
      return interaction.reply({ content: "❌ Apenas o dono confirma.", ephemeral: true });

    const valor = interaction.customId.split("_")[1];

    const canalFila = await client.channels.fetch(CHANNEL_FILA_ID);

    const embedFila = new EmbedBuilder()
      .setTitle("🎯 JOGADOR NA FILA")
      .setThumbnail(LOGO_URL)
      .setColor("Yellow")
      .setDescription(
        `👤 <@${interaction.user.id}>\n` +
        `💰 R$${valor}\n\n` +
        `⏳ Aguardando adversário...`
      );

    const msgFila = await canalFila.send({ embeds: [embedFila] });

    fila.push({
      userId: interaction.user.id,
      valor,
      mensagemId: msgFila.id
    });

    await interaction.reply({ content: "✅ Pagamento confirmado!", ephemeral: true });

    const iguais = fila.filter(p => p.valor === valor);

    if (iguais.length >= 2) {
      const p1 = iguais[0];
      const p2 = iguais[1];

      const encerrada = new EmbedBuilder()
        .setTitle("👥 USUÁRIOS ENCONTRADOS")
        .setColor("Green")
        .setThumbnail(LOGO_URL)
        .setDescription(
          `<@${p1.userId}> 🆚 <@${p2.userId}>\n\n` +
          `📩 Aguarde o administrador chamar no privado.`
        );

      await canalFila.send({ embeds: [encerrada] });

      const msg1 = await canalFila.messages.fetch(p1.mensagemId);
      const msg2 = await canalFila.messages.fetch(p2.mensagemId);

      await msg1.delete();
      await msg2.delete();

      fila = fila.filter(p => p !== p1 && p !== p2);
    }
  }
});

client.login(process.env.TOKEN);
