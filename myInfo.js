const { AttachmentBuilder } = require('discord.js');
const { userInfo } = require('./database');
const { createCanvas } = require('canvas');

async function handleMyInfo(interaction) {
    const balance = userInfo.getBalance(interaction.user.id);

    // Canvas 생성 (350x150)
    const canvas = createCanvas(350, 150);
    const ctx = canvas.getContext('2d');

    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 350, 150);
    gradient.addColorStop(0, '#ff8500');
    gradient.addColorStop(1, '#ff6200');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 350, 150);

    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, 350, 150);

    // 제목
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${interaction.user.username}님의 정보`, 175, 30);

    // 구분선
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 45);
    ctx.lineTo(320, 45);
    ctx.stroke();

    // 사용자 ID
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('👤 사용자 ID', 30, 70);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#f0f0f0';
    ctx.fillText(interaction.user.id, 30, 90);

    // 보유 금액
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('💰 보유 자산', 30, 115);

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`${balance.toLocaleString()}원`, 30, 138);

    // 이미지를 버퍼로 변환
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'myinfo.png' });

    await interaction.reply({
        files: [attachment],
        ephemeral: true
    });
}

module.exports = { handleMyInfo };
