const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');
const { fields } = require('./database');
const { SEEDS, formatGrowTime } = require('./seedData');

async function handleFarm(interaction) {
    const userId = interaction.user.id;
    const userFields = fields.getUserFields(userId);

    // 밭 상태를 맵으로 변환 (field_id -> field data)
    const fieldMap = new Map();
    userFields.forEach(field => {
        fieldMap.set(field.field_id, field);
    });

    const farmEmbed = new EmbedBuilder()
        .setColor('#ff8500')
        .setTitle(`🌾 ${interaction.user.username}님의 농장`)
        .setDescription('***오늘도 농장 일에 참여해보세요! 🌾***\n\n🟢 : 사용 가능한 밭\n🔴 : 농사 중인 밭\n⚫ : 미보유 밭')

    const rows = [];
    let currentRow = new ActionRowBuilder();

    // 1번부터 5번 밭까지 버튼 생성
    for (let i = 1; i <= 5; i++) {
        const fieldData = fieldMap.get(i);
        const isOwned = fieldData && fieldData.is_owned === 1;
        const isFarming = fieldData && fieldData.seed_name; // seed_name이 있으면 농사 중

        const button = new ButtonBuilder()
            .setCustomId(`field_${i}`)
            .setLabel(`밭 ${i}`);

        if (isOwned) {
            if (isFarming) {
                // 농사 중인 밭 (빨간색)
                button.setStyle(ButtonStyle.Danger);
                button.setLabel(`밭 ${i} (재배중)`);
            } else {
                // 빈 밭 (초록색)
                button.setStyle(ButtonStyle.Success);
            }
        } else {
            // 미보유 밭 (회색)
            button.setStyle(ButtonStyle.Secondary);
            button.setLabel(`밭 ${i} (미보유)`);
            button.setDisabled(true); // 미보유 밭은 클릭 불가 (나중에 구매 기능 추가 시 변경 가능)
        }

        currentRow.addComponents(button);

        // 3개 꽉 찼거나 마지막 버튼이면 row 추가
        if (i % 3 === 0 || i === 5) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
    }

    await interaction.reply({
        embeds: [farmEmbed],
        components: rows,
        ephemeral: true
    });
}

async function handleFieldSelect(interaction, fieldId) {
    const userId = interaction.user.id;
    const { seeds } = require('./database');

    // 해당 밭에 심어진 씨앗 확인
    const db = require('./database').db;
    const stmt = db.prepare('SELECT * FROM seeds WHERE user_id = ? AND field_id = ?');
    const plantedSeed = stmt.get(userId, fieldId);

    // 재배 중인 경우
    if (plantedSeed) {
        const seedData = SEEDS[plantedSeed.seed_name];
        const plantTime = plantedSeed.plant_time;
        const growTimeMs = seedData.growTime * 60 * 1000;
        const harvestTime = plantTime + growTimeMs;
        const now = Date.now();
        const remainingMs = harvestTime - now;

        if (remainingMs > 0) {
            // 남은 시간 계산
            const totalSeconds = Math.ceil(remainingMs / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            let timeString = '';

            if (days > 0) {
                timeString = `${days}일`;
                if (hours > 0) timeString += ` ${hours}시간`;
                if (minutes > 0) timeString += ` ${minutes}분`;
            } else if (hours > 0) {
                timeString = `${hours}시간`;
                if (minutes > 0) timeString += ` ${minutes}분`;
                if (seconds > 0) timeString += ` ${seconds}초`;
            } else if (minutes > 0) {
                timeString = `${minutes}분`;
                if (seconds > 0) timeString += ` ${seconds}초`;
            } else {
                timeString = `${seconds}초`;
            }

            return interaction.update({
                content: `🌱 **밭 ${fieldId}**에는 현재 ${seedData.emoji} **${plantedSeed.seed_name}**이(가) 재배 중입니다.\n⏰ 남은 시간: **${timeString}**`,
                embeds: [],
                components: []
            });
        }
    }

    // 빈 밭인 경우 - 씨앗 선택 드롭다운 생성
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`plant_${fieldId}`)
        .setPlaceholder('심을 씨앗을 선택해주세요')
        .addOptions(
            Object.values(SEEDS).map(seed =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${seed.emoji} ${seed.name}`)
                    .setDescription(`성장: ${formatGrowTime(seed.growTime)} | 씨앗: ${seed.seedPrice}원 | 수확: ${seed.harvestPrice}원 | EXP: ${seed.exp}`)
                    .setValue(seed.name)
            )
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.update({
        content: `🌱 **밭 ${fieldId}**에 심을 씨앗을 선택해주세요:`,
        embeds: [],
        components: [row]
    });
}

module.exports = { handleFarm, handleFieldSelect };
