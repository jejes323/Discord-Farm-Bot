require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

const commands = [
    {
        name: '메뉴',
        description: '농장 봇의 메인 메뉴를 표시합니다 (관리자 전용)',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    },
    {
        name: '돈지급',
        description: '사용자에게 돈을 지급합니다 (관리자 전용)',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: '사용자',
                description: '돈을 받을 사용자',
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: '금액',
                description: '지급할 금액',
                type: ApplicationCommandOptionType.Integer,
                required: true,
                min_value: 1,
            },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('슬래시 명령어를 등록하는 중...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('✅ 슬래시 명령어가 성공적으로 등록되었습니다!');
    } catch (error) {
        console.error('❌ 슬래시 명령어 등록 중 오류 발생:', error);
    }
})();
