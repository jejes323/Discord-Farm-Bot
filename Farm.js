require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

// 데이터베이스 모듈 import
const { db, userInfo, seeds } = require('./database');
const { handleMyInfo } = require('./myInfo');
const { handleFarm, handleFieldSelect } = require('./play');
const { handleShop, handleBuyField, handleConfirmBuyField, handleCancelBuyField } = require('./shop');

// Discord 클라이언트 생성
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// 수확 처리 함수 (재사용 가능하도록 분리)
async function harvestCrop(userId, fieldId, seedName, seedData) {
    try {
        // 수확 처리
        const stmt = db.prepare('DELETE FROM seeds WHERE user_id = ? AND field_id = ?');
        stmt.run(userId, fieldId);

        // 수익 지급
        userInfo.addBalance(userId, seedData.harvestPrice);

        // DM 전송
        const user = await client.users.fetch(userId);

        const harvestEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎉 수확 완료!')
            .setDescription(`**밭 ${fieldId}**에서 ${seedData.emoji} **${seedName}**이(가) 수확되었습니다!`)
            .addFields(
                { name: '💰 수익금', value: `${seedData.harvestPrice}원`, inline: true },
                { name: '✨ 획득 경험치', value: `${seedData.exp} EXP`, inline: true }
            )
            .setTimestamp();

        await user.send({ embeds: [harvestEmbed] });
        console.log(`✅ 수확 완료: 사용자 ${userId}, 밭 ${fieldId}, ${seedName}`);
    } catch (error) {
        console.error('수확 처리 중 오류:', error);
    }
}

// 봇 시작 시 재배 중인 작물 확인 및 타이머 복구
async function restoreCropTimers() {
    const { SEEDS } = require('./seedData');
    const stmt = db.prepare('SELECT * FROM seeds');
    const allSeeds = stmt.all();

    console.log(`🔍 재배 중인 작물 ${allSeeds.length}개 확인 중...`);

    for (const plantedSeed of allSeeds) {
        const seedData = SEEDS[plantedSeed.seed_name];
        if (!seedData) continue;

        const plantTime = plantedSeed.plant_time;
        const growTimeMs = seedData.growTime * 60 * 1000;
        const harvestTime = plantTime + growTimeMs;
        const now = Date.now();
        const remainingMs = harvestTime - now;

        if (remainingMs <= 0) {
            // 이미 수확 시간이 지난 경우 즉시 수확
            console.log(`⏰ 수확 시간 경과: 사용자 ${plantedSeed.user_id}, 밭 ${plantedSeed.field_id}`);
            await harvestCrop(plantedSeed.user_id, plantedSeed.field_id, plantedSeed.seed_name, seedData);
        } else {
            // 아직 수확 시간이 안 된 경우 타이머 재설정
            console.log(`⏲️ 타이머 복구: 사용자 ${plantedSeed.user_id}, 밭 ${plantedSeed.field_id}, 남은 시간: ${Math.ceil(remainingMs / 1000)}초`);
            setTimeout(async () => {
                await harvestCrop(plantedSeed.user_id, plantedSeed.field_id, plantedSeed.seed_name, seedData);
            }, remainingMs);
        }
    }

    console.log('✅ 작물 타이머 복구 완료!');
}

// 봇이 준비되었을 때
client.once('ready', async () => {
    console.log(`✅ 봇이 준비되었습니다! ${client.user.tag}로 로그인했습니다.`);

    // 재배 중인 작물 타이머 복구
    await restoreCropTimers();
});

// 슬래시 명령어 처리
client.on('interactionCreate', async (interaction) => {
    // 슬래시 명령어가 아니면 무시
    if (!interaction.isChatInputCommand()) return;

    // /메뉴 명령어 처리
    if (interaction.commandName === '메뉴') {
        // 관리자 권한 확인
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ 이 명령어는 관리자만 사용할 수 있습니다.',
                ephemeral: true
            });
        }

        // 임베드 메시지 생성
        const menuEmbed = new EmbedBuilder()
            .setColor('#ff8500')
            .setTitle('🌾 Farm System')
            .setDescription('***Welcome, farmer!*** 🧑🏻‍🌾\n***오늘도 농장 일에 참여해보세요! 🌾***')

        // 버튼 생성
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('farm')
                    .setLabel('🌾 농사')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('shop')
                    .setLabel('🏪 상점')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('myinfo')
                    .setLabel('👤 내정보')
                    .setStyle(ButtonStyle.Secondary)
            );

        // 메시지 전송
        await interaction.reply({
            embeds: [menuEmbed],
            components: [row]
        });
    }

    // /돈지급 명령어 처리
    if (interaction.commandName === '돈지급') {
        // 관리자 권한 확인
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ 이 명령어는 관리자만 사용할 수 있습니다.',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('사용자');
        const amount = interaction.options.getInteger('금액');

        // 돈 지급
        userInfo.addBalance(targetUser.id, amount);

        const giveMoneyEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('💰 돈 지급 완료')
            .setDescription(`${targetUser}님에게 **${amount.toLocaleString()}원**을 지급했습니다.`)
            .setTimestamp();

        await interaction.reply({
            embeds: [giveMoneyEmbed]
        });
    }
});

// 드롭다운 선택 처리
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    // 씨앗 심기 처리 (plant_1 ~ plant_5)
    if (interaction.customId.startsWith('plant_')) {
        const fieldId = parseInt(interaction.customId.split('_')[1]);
        const selectedSeedName = interaction.values[0];
        const userId = interaction.user.id;

        // 씨앗 데이터 가져오기
        const { SEEDS } = require('./seedData');
        const seedData = SEEDS[selectedSeedName];

        if (!seedData) {
            return interaction.update({
                content: '❌ 잘못된 씨앗입니다.',
                components: []
            });
        }

        // 잔액 확인
        const balance = userInfo.getBalance(userId);
        if (balance < seedData.seedPrice) {
            return interaction.update({
                content: `❌ 잔액이 부족합니다! (필요: ${seedData.seedPrice}원, 보유: ${balance}원)`,
                components: []
            });
        }

        // 비용 차감
        userInfo.subtractBalance(userId, seedData.seedPrice);

        // 씨앗 심기
        seeds.plant(userId, fieldId, selectedSeedName, seedData.harvestPrice);

        // 성장 시간 계산 (분 -> 밀리초)
        const growTimeMs = seedData.growTime * 60 * 1000;

        await interaction.update({
            content: `✅ **밭 ${fieldId}**에 ${seedData.emoji} **${selectedSeedName}**을(를) 심었습니다!\n💰 비용: ${seedData.seedPrice}원 차감\n⏰ ${seedData.growTime < 60 ? seedData.growTime + '분' : (seedData.growTime / 60) + '시간'} 후 수확 가능합니다.`,
            embeds: [],
            components: []
        });

        // 타이머 설정 (자동 수확)
        setTimeout(async () => {
            await harvestCrop(userId, fieldId, selectedSeedName, seedData);
        }, growTimeMs);
    }
});

// 버튼 클릭 처리
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // 밭 선택 처리 (field_1 ~ field_5)
    if (interaction.customId.startsWith('field_')) {
        const fieldId = parseInt(interaction.customId.split('_')[1]);
        await handleFieldSelect(interaction, fieldId);
        return;
    }

    // 밭 구매 확인 처리
    if (interaction.customId.startsWith('confirm_buy_field_')) {
        const fieldId = parseInt(interaction.customId.split('_')[3]);
        await handleConfirmBuyField(interaction, fieldId);
        return;
    }

    // 각 버튼에 대한 응답
    switch (interaction.customId) {
        case 'farm':
            await handleFarm(interaction);
            break;
        case 'shop':
            await handleShop(interaction);
            break;
        case 'buy_field':
            await handleBuyField(interaction);
            break;
        case 'cancel_buy_field':
            await handleCancelBuyField(interaction);
            break;
        case 'myinfo':
            await handleMyInfo(interaction);
            break;
    }
});

// 에러 처리
client.on('error', (error) => {
    console.error('Discord 클라이언트 에러:', error);
});

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);
