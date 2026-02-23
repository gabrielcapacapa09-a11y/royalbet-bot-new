const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const OWNER_ID = process.env.OWNER_ID;

let pendingBets = {};
let queue = {};

let pixPorValor = {
    "10": "COLE_PIX_10_AQUI",
    "20": "COLE_PIX_20_AQUI",
    "30": "COLE_PIX_30_AQUI",
    "40": "COLE_PIX_40_AQUI",
    "50": "COLE_PIX_50_AQUI"
};

client.once("ready", () => {
    console.log(`Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === "!ticket") {

        const embed = new EmbedBuilder()
            .setTitle("👑 ROYAL BET FF – SISTEMA OFICIAL")
            .setDescription(`
🎮 Sistema automatizado de apostas
⚡ Duelo automático após confirmação
🔒 Pagamentos verificados manualmente
🏆 Organização justa e rápida

Clique abaixo para iniciar sua aposta.
`)
            .setColor("Purple");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("abrir_aposta")
                .setLabel("🎮 Abrir Aposta")
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on("interactionCreate", async (interaction) => {

    if (!interaction.isButton()) return;

    try {

        // ABRIR APOSTA
        if (interaction.customId === "abrir_aposta") {

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("device_Mobile").setLabel("📱 Mobile").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("device_PC").setLabel("🖥️ PC").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("device_Emulador").setLabel("💻 Emulador").setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                content: "📱 Escolha o dispositivo:",
                components: [row],
                ephemeral: true
            });
        }

        // ESCOLHA DISPOSITIVO
        if (interaction.customId.startsWith("device_")) {

            const device = interaction.customId.split("_")[1];

            pendingBets[interaction.user.id] = { device };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("modo_1v1").setLabel("1v1").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("modo_2v2").setLabel("2v2").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("modo_3v3").setLabel("3v3").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("modo_4v4").setLabel("4v4").setStyle(ButtonStyle.Success)
            );

            return interaction.update({
                content: "⚔️ Escolha o modo da aposta:",
                components: [row]
            });
        }

        // ESCOLHA MODO
        if (interaction.customId.startsWith("modo_")) {

            const modo = interaction.customId.split("_")[1];
            pendingBets[interaction.user.id].modo = modo;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("valor_10").setLabel("R$10").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("valor_20").setLabel("R$20").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("valor_30").setLabel("R$30").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("valor_40").setLabel("R$40").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("valor_50").setLabel("R$50").setStyle(ButtonStyle.Success)
            );

            return interaction.update({
                content: "💰 Escolha o valor:",
                components: [row]
            });
        }

        // ESCOLHA VALOR
        if (interaction.customId.startsWith("valor_")) {

            const valor = interaction.customId.split("_")[1];
            const bet = pendingBets[interaction.user.id];
            bet.valor = valor;

            const pix = pixPorValor[valor];

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirmar_${interaction.user.id}`)
                    .setLabel("✅ Confirmar")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`recusar_${interaction.user.id}`)
                    .setLabel("❌ Recusar")
                    .setStyle(ButtonStyle.Danger)
            );

            return interaction.update({
                content: `💰 Valor: R$${valor}
📱 Dispositivo: ${bet.device}
⚔️ Modo: ${bet.modo}

📲 Pague via PIX:
\`\`\`
${pix}
\`\`\`

Aguardando confirmação do administrador.`,
                components: [row]
            });
        }

        // RECUSAR
        if (interaction.customId.startsWith("recusar_")) {

            if (interaction.user.id !== OWNER_ID)
                return interaction.reply({ content: "Apenas o administrador pode fazer isso.", ephemeral: true });

            const userId = interaction.customId.split("_")[1];
            delete pendingBets[userId];

            return interaction.update({
                content: "❌ Pagamento recusado. Processo cancelado.",
                components: []
            });
        }

        // CONFIRMAR
        if (interaction.customId.startsWith("confirmar_")) {

            if (interaction.user.id !== OWNER_ID)
                return interaction.reply({ content: "Apenas o administrador pode confirmar.", ephemeral: true });

            const userId = interaction.customId.split("_")[1];
            const bet = pendingBets[userId];
            if (!bet) return;

            const key = `${bet.device}_${bet.modo}_${bet.valor}`;
            if (!queue[key]) queue[key] = [];

            queue[key].push(userId);
            delete pendingBets[userId];

            await interaction.update({
                content: "✅ Pagamento confirmado! Jogador entrou na fila.",
                components: []
            });

            await interaction.channel.send({
                content: `🎮 <@${userId}> entrou na fila
📱 ${bet.device}
⚔️ ${bet.modo}
💰 R$${bet.valor}
⏳ Aguardando adversário...`
            });

            const needed = parseInt(bet.modo.replace("v", ""));
            if (queue[key].length >= needed * 2) {

                const players = queue[key].splice(0, needed * 2);

                await interaction.channel.send({
                    content: `🔥 **DUelo Encontrado!**
${players.map(id => `<@${id}>`).join(" 🆚 ")}`
                });
            }
        }

    } catch (err) {
        console.error(err);
    }
});

client.login(process.env.TOKEN);
