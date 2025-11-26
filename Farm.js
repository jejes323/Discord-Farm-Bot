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
const { userInfo, seeds } = require('./database');
const { handleMyInfo } = require('./myInfo');

// Discord 클라이언트 생성
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// 봇이 준비되었을 때
client.once('ready', () => {
    console.log(`✅ 봇이 준비되었습니다! ${client.user.tag}로 로그인했습니다.`);
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
                    .setCustomId('weather')
                    .setLabel('🌤️ 날씨')
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
});

// 버튼 클릭 처리
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // 각 버튼에 대한 응답
    switch (interaction.customId) {
        case 'farm':
            await interaction.reply({
                content: '🌾 농사 기능이 선택되었습니다!',
                ephemeral: true
            });
            break;
        case 'shop':
            await interaction.reply({
                content: '🏪 상점 기능이 선택되었습니다!',
                ephemeral: true
            });
            break;
        case 'weather':
            await interaction.reply({
                content: '🌤️ 날씨 기능이 선택되었습니다!',
                ephemeral: true
            });
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
