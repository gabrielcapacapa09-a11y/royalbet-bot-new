const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let pendingBets = {};
let queue = {};

let pixPorValor = {
    "10": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540510.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***63041790",
    "20": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540520.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304CA60",
    "30": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540530.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304712F",
    "40": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540540.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***630461A1",
    "50": "00020101021126580014br.gov.bcb.pix013693f7503d-c176-4c19-a15d-206ded117ec4520400005303986540550.005802BR5918GABRIEL C DA SILVA6008IRANDUBA62070503***6304DAEE"
};

client.once("ready", () => {
    console.log(`Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === "!ticket") {

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("valor_10")
                .setLabel("R$10")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("valor_20")
                .setLabel("R$20")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("valor_30")
                .setLabel("R$30")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("valor_40")
                .setLabel("R$40")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("valor_50")
                .setLabel("R$50")
                .setStyle(ButtonStyle.Success)
        );

        await message.channel.send({
            content: "🎮 **PAINEL DE APOSTA**\n\nEscolha o valor da aposta:",
            components: [row]
        });
    }
});

client.on("interactionCreate", async (interaction) => {

    if (!interaction.isButton()) return;

    try {

        // Escolheu valor
        if (interaction.customId.startsWith("valor_")) {

            const valor = interaction.customId.split("_")[1];
            const pixCode = pixPorValor[valor];

            pendingBets[interaction.user.id] = {
                userId: interaction.user.id,
                value: valor,
                device: "Celular"
            };

            const confirmButton = new ButtonBuilder()
                .setCustomId(`confirmar_${interaction.user.id}`)
                .setLabel("Confirmar Pagamento")
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(confirmButton);

            await interaction.reply({
                content: `💰 Valor: R$${valor}

📲 Pague via PIX:
\`\`\`
${pixCode}
\`\`\`

Depois clique em confirmar.`,
                components: [row],
                ephemeral: true
            });
        }

        // Confirmar pagamento (SOMENTE DONO)
        if (interaction.customId.startsWith("confirmar_")) {

            if (interaction.user.id !== process.env.OWNER_ID) {
                return interaction.reply({
                    content: "Você não pode confirmar pagamentos.",
                    ephemeral: true
                });
            }

            const userId = interaction.customId.split("_")[1];
            const betData = pendingBets[userId];

            if (!betData) {
                return interaction.reply({
                    content: "Aposta não encontrada.",
                    ephemeral: true
                });
            }

            const key = `${betData.value}_${betData.device}`;
            if (!queue[key]) queue[key] = [];

            queue[key].push({
                userId: userId,
                channelId: interaction.channel.id
            });

            delete pendingBets[userId];

            await interaction.reply({
                content: "✅ Pagamento confirmado.",
                ephemeral: true
            });

            await interaction.channel.send({
                content: `🎮 <@${userId}> entrou na fila
💰 Valor: ${betData.value}
⏳ Aguardando adversário...`
            });

            if (queue[key].length >= 2) {

                const player1 = queue[key].shift();
                const player2 = queue[key].shift();

                const duelMsg = `🔥 **Duelo Encontrado!**
<@${player1.userId}> 🆚 <@${player2.userId}>`;

                await interaction.channel.send({ content: duelMsg });
            }
        }

    } catch (error) {
        console.error(error);
    }
});

client.login(process.env.TOKEN);
client.login(process.env.TOKEN);
