const { EmbedBuilder } = require('discord.js');
const { userInfo, seeds } = require('./database');

async function handleMyInfo(interaction) {
    const balance = userInfo.getBalance(interaction.user.id);
    const seedCount = seeds.count(interaction.user.id);

    const myInfoEmbed = new EmbedBuilder()
        .setColor('#ff8500')
        .setTitle(`${interaction.user.username}님의 정보`)
        .addFields(
            { name: '👤 **사용자 ID**', value: interaction.user.id, inline: false },
            { name: '💰 보유 자산', value: `\`${balance.toLocaleString()}원\``, inline: false },
            { name: '🌱 심은 씨앗', value: `\`${seedCount}개\``, inline: true }
        );

    await interaction.reply({
        embeds: [myInfoEmbed],
        ephemeral: true
    });
}

module.exports = { handleMyInfo };
