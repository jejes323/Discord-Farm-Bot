// 씨앗 데이터 정의
const SEEDS = {
    '콩': {
        emoji: '🫛',
        name: '콩',
        growTime: 1, // 분
        seedPrice: 0,
        harvestPrice: 5,
        exp: 1
    },
    '밀': {
        emoji: '🌾',
        name: '밀',
        growTime: 5,
        seedPrice: 5,
        harvestPrice: 20,
        exp: 2
    },
    '딸기': {
        emoji: '🍓',
        name: '딸기',
        growTime: 60, // 1시간
        seedPrice: 45,
        harvestPrice: 180,
        exp: 35
    },
    '당근': {
        emoji: '🥕',
        name: '당근',
        growTime: 120, // 2시간
        seedPrice: 70,
        harvestPrice: 280,
        exp: 55
    },
    '감자': {
        emoji: '🥔',
        name: '감자',
        growTime: 240, // 4시간
        seedPrice: 100,
        harvestPrice: 400,
        exp: 75
    },
    '옥수수': {
        emoji: '🌽',
        name: '옥수수',
        growTime: 360, // 6시간
        seedPrice: 115,
        harvestPrice: 460,
        exp: 85
    },
    '복숭아': {
        emoji: '🍑',
        name: '복숭아',
        growTime: 480, // 8시간
        seedPrice: 125,
        harvestPrice: 500,
        exp: 95
    },
    '체리': {
        emoji: '🍒',
        name: '체리',
        growTime: 600, // 10시간
        seedPrice: 135,
        harvestPrice: 540,
        exp: 100
    },
    '바나나': {
        emoji: '🍌',
        name: '바나나',
        growTime: 720, // 12시간
        seedPrice: 140,
        harvestPrice: 560,
        exp: 105
    },
    '수박': {
        emoji: '🍉',
        name: '수박',
        growTime: 1440, // 24시간
        seedPrice: 150,
        harvestPrice: 600,
        exp: 115
    }
};

// 성장 시간을 읽기 쉬운 형식으로 변환
function formatGrowTime(minutes) {
    if (minutes < 60) {
        return `${minutes}분`;
    } else if (minutes < 1440) {
        const hours = minutes / 60;
        return `${hours}시간`;
    } else {
        const days = minutes / 1440;
        return `${days}일`;
    }
}

module.exports = { SEEDS, formatGrowTime };
