require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

let pendingBets = {};
let fila = {};

client.once('ready', () => {
    console.log(`Bot online como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    try {

        if (interaction.customId === "criar_aposta") {

            pendingBets[interaction.user.id] = {
                userId: interaction.user.id,
                device: "Mobile",
                value: "10"
            };

            const confirmButton = new ButtonBuilder()
                .setCustomId(`confirmar_${interaction.user.id}`)
                .setLabel("Confirmar Pagamento")
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(confirmButton);

            await interaction.reply({
                content: "⏳ Aguardando confirmação do pagamento...",
                components: [row]
            });
        }

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
            if (!fila[key]) fila[key] = [];

            fila[key].push({
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
📱 Dispositivo: ${betData.device}
⏳ Aguardando adversário...`
            });

            if (fila[key].length >= 2) {

                const player1 = fila[key].shift();
                const player2 = fila[key].shift();

                const channel1 = await client.channels.fetch(player1.channelId);
                const channel2 = await client.channels.fetch(player2.channelId);

                const dueloMsg = `🔥 **Duelo Encontrado!**
<@${player1.userId}> 🆚 <@${player2.userId}>`;

                await channel1.send({ content: dueloMsg });

                if (player1.channelId !== player2.channelId) {
                    await channel2.send({ content: dueloMsg });
                }
            }
        }

    } catch (error) {
        console.error(error);
        if (!interaction.replied) {
            await interaction.reply({
                content: "Ocorreu um erro.",
                ephemeral: true
            });
        }
    }
});

client.login(process.env.TOKEN);
