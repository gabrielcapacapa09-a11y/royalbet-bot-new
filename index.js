const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // ID do bot
const GUILD_ID = process.env.GUILD_ID;   // ID do servidor

const LOGO_URL = "https://image2url.com/r2/default/images/1771860578126-909d839f-5887-44ea-a5ec-eac8c2533f57.png";


// ===================
// REGISTRAR SLASH COMMAND
// ===================
const commands = [
  new SlashCommandBuilder()
    .setName("royal")
    .setDescription("Gerar painel Royal Bet FF")
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registrando comando /royal...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Comando registrado com sucesso!");
  } catch (error) {
    console.error(error);
  }
})();


// ===================
// BOT ONLINE
// ===================
client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});


// ===================
// INTERAÇÕES
// ===================
client.on("interactionCreate", async (interaction) => {

  // SLASH COMMAND /royal
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "royal") {

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

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

});

client.login(TOKEN);
