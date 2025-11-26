const Database = require('better-sqlite3');
const path = require('path');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'farm.db');
const db = new Database(dbPath);

// 테이블 생성
function initDatabase() {
    // 사용자 정보 테이블
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_info (
            user_id TEXT PRIMARY KEY,
            balance INTEGER DEFAULT 0
        )
    `);

    // 씨앗 데이터 테이블
    db.exec(`
        CREATE TABLE IF NOT EXISTS seeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            seed_name TEXT NOT NULL,
            plant_time INTEGER NOT NULL,
            sell_price INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user_info(user_id)
        )
    `);

    console.log('✅ 데이터베이스 테이블이 초기화되었습니다.');
}

// 사용자 정보 관련 함수들
const userInfo = {
    // 사용자 생성 또는 가져오기
    getOrCreate: (userId) => {
        const stmt = db.prepare('SELECT * FROM user_info WHERE user_id = ?');
        let user = stmt.get(userId);

        if (!user) {
            const insert = db.prepare('INSERT INTO user_info (user_id, balance) VALUES (?, 0)');
            insert.run(userId);
            user = { user_id: userId, balance: 0 };
        }

        return user;
    },

    // 잔액 조회
    getBalance: (userId) => {
        const stmt = db.prepare('SELECT balance FROM user_info WHERE user_id = ?');
        const result = stmt.get(userId);
        return result ? result.balance : 0;
    },

    // 잔액 추가
    addBalance: (userId, amount) => {
        userInfo.getOrCreate(userId);
        const stmt = db.prepare('UPDATE user_info SET balance = balance + ? WHERE user_id = ?');
        stmt.run(amount, userId);
    },

    // 잔액 차감
    subtractBalance: (userId, amount) => {
        userInfo.getOrCreate(userId);
        const stmt = db.prepare('UPDATE user_info SET balance = balance - ? WHERE user_id = ?');
        stmt.run(amount, userId);
    },

    // 모든 사용자 정보 조회
    getAll: () => {
        const stmt = db.prepare('SELECT * FROM user_info');
        return stmt.all();
    }
};

// 씨앗 데이터 관련 함수들
const seeds = {
    // 씨앗 심기
    plant: (userId, seedName, sellPrice) => {
        userInfo.getOrCreate(userId);
        const plantTime = Date.now();
        const stmt = db.prepare('INSERT INTO seeds (user_id, seed_name, plant_time, sell_price) VALUES (?, ?, ?, ?)');
        const result = stmt.run(userId, seedName, plantTime, sellPrice);
        return result.lastInsertRowid;
    },

    // 사용자의 모든 씨앗 조회
    getUserSeeds: (userId) => {
        const stmt = db.prepare('SELECT * FROM seeds WHERE user_id = ? ORDER BY plant_time DESC');
        return stmt.all(userId);
    },

    // 특정 씨앗 조회
    getSeed: (seedId) => {
        const stmt = db.prepare('SELECT * FROM seeds WHERE id = ?');
        return stmt.get(seedId);
    },

    // 씨앗 삭제 (수확 후)
    remove: (seedId) => {
        const stmt = db.prepare('DELETE FROM seeds WHERE id = ?');
        stmt.run(seedId);
    },

    // 사용자의 모든 씨앗 삭제
    removeAllUserSeeds: (userId) => {
        const stmt = db.prepare('DELETE FROM seeds WHERE user_id = ?');
        stmt.run(userId);
    },

    // 씨앗 개수 조회
    count: (userId) => {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM seeds WHERE user_id = ?');
        const result = stmt.get(userId);
        return result.count;
    }
};

// 데이터베이스 초기화 실행
initDatabase();

module.exports = {
    db,
    userInfo,
    seeds
};
