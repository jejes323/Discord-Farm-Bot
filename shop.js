const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fields, userInfo } = require('./database');

// 밭 가격 정의
const FIELD_PRICES = {
    1: 0,        // 기본 지급
    2: 5000,
    3: 15000,
    4: 40000,
    5: 100000
};

async function handleShop(interaction) {
    const shopEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏪 상점')
        .setDescription('***환영합니다! 무엇을 구매하시겠습니까?***')
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('buy_field')
                .setLabel('🌾 밭 구매')
                .setStyle(ButtonStyle.Success)
        );

    await interaction.reply({
        embeds: [shopEmbed],
        components: [row],
        ephemeral: true
    });
}

async function handleBuyField(interaction) {
    const userId = interaction.user.id;
    const userFields = fields.getUserFields(userId);

    // 다음 구매 가능한 밭 찾기
    let nextFieldId = null;
    for (let i = 2; i <= 5; i++) {
        const field = userFields.find(f => f.field_id === i);
        if (field && field.is_owned === 0) {
            nextFieldId = i;
            break;
        }
    }

    // 모든 밭을 이미 보유한 경우
    if (!nextFieldId) {
        return interaction.update({
            content: '✅ 이미 모든 밭을 보유하고 있습니다!',
            embeds: [],
            components: []
        });
    }

    const price = FIELD_PRICES[nextFieldId];
    const balance = userInfo.getBalance(userId);

    const buyEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🌾 밭 구매')
        .setDescription(`**밭 ${nextFieldId}**을(를) 구매하시겠습니까?`)
        .addFields(
            { name: '💰 가격', value: `${price.toLocaleString()}원`, inline: true },
            { name: '💵 보유 금액', value: `${balance.toLocaleString()}원`, inline: true }
        )
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_buy_field_${nextFieldId}`)
                .setLabel('네')
                .setStyle(ButtonStyle.Success)
                .setDisabled(balance < price), // 잔액 부족 시 비활성화
            new ButtonBuilder()
                .setCustomId('cancel_buy_field')
                .setLabel('아니요')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.update({
        content: '',
        embeds: [buyEmbed],
        components: [row]
    });
}

async function handleConfirmBuyField(interaction, fieldId) {
    const userId = interaction.user.id;
    const price = FIELD_PRICES[fieldId];
    const balance = userInfo.getBalance(userId);

    // 잔액 확인
    if (balance < price) {
        return interaction.update({
            content: `❌ 잔액이 부족합니다! (필요: ${price.toLocaleString()}원, 보유: ${balance.toLocaleString()}원)`,
            embeds: [],
            components: []
        });
    }

    // 비용 차감
    userInfo.subtractBalance(userId, price);

    // 밭 구매
    fields.buyField(userId, fieldId);

    const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ 구매 완료!')
        .setDescription(`**밭 ${fieldId}**을(를) 성공적으로 구매했습니다!`)
        .addFields(
            { name: '💰 지불 금액', value: `${price.toLocaleString()}원`, inline: true },
            { name: '💵 남은 금액', value: `${(balance - price).toLocaleString()}원`, inline: true }
        )
        .setTimestamp();

    await interaction.update({
        content: '',
        embeds: [successEmbed],
        components: []
    });
}

async function handleCancelBuyField(interaction) {
    await interaction.update({
        content: '❌ 구매를 취소했습니다.',
        embeds: [],
        components: []
    });
}

module.exports = {
    handleShop,
    handleBuyField,
    handleConfirmBuyField,
    handleCancelBuyField,
    FIELD_PRICES
};
