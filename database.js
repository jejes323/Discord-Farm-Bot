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

    // 밭 소유권 테이블
    db.exec(`
        CREATE TABLE IF NOT EXISTS fields (
            user_id TEXT NOT NULL,
            field_id INTEGER NOT NULL,
            is_owned INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, field_id),
            FOREIGN KEY (user_id) REFERENCES user_info(user_id)
        )
    `);

    // 씨앗 데이터 테이블 (field_id 추가)
    db.exec(`
        CREATE TABLE IF NOT EXISTS seeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            field_id INTEGER,
            seed_name TEXT NOT NULL,
            plant_time INTEGER NOT NULL,
            sell_price INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user_info(user_id)
        )
    `);

    // 인벤토리 테이블
    db.exec(`
        CREATE TABLE IF NOT EXISTS inventory (
            user_id TEXT NOT NULL,
            item_name TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, item_name),
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
            const insertField = db.prepare('INSERT INTO fields (user_id, field_id, is_owned) VALUES (?, ?, ?)');

            const transaction = db.transaction(() => {
                insert.run(userId);
                // 기본적으로 1번 밭 지급
                insertField.run(userId, 1, 1);
                // 2~5번 밭은 미보유 상태로 초기화
                for (let i = 2; i <= 5; i++) {
                    insertField.run(userId, i, 0);
                }
            });
            transaction();

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

// 인벤토리 관련 함수들
const inventory = {
    // 아이템 추가
    addItem: (userId, itemName, quantity) => {
        userInfo.getOrCreate(userId);
        const stmt = db.prepare(`
            INSERT INTO inventory (user_id, item_name, quantity) 
            VALUES (?, ?, ?) 
            ON CONFLICT(user_id, item_name) 
            DO UPDATE SET quantity = quantity + ?
        `);
        stmt.run(userId, itemName, quantity, quantity);
    },

    // 아이템 제거 (사용)
    removeItem: (userId, itemName, quantity) => {
        const stmt = db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE user_id = ? AND item_name = ?');
        stmt.run(quantity, userId, itemName);

        // 수량이 0 이하면 삭제
        const clean = db.prepare('DELETE FROM inventory WHERE user_id = ? AND item_name = ? AND quantity <= 0');
        clean.run(userId, itemName);
    },

    // 아이템 수량 조회
    getItemCount: (userId, itemName) => {
        const stmt = db.prepare('SELECT quantity FROM inventory WHERE user_id = ? AND item_name = ?');
        const result = stmt.get(userId, itemName);
        return result ? result.quantity : 0;
    },

    // 모든 아이템 조회
    getUserInventory: (userId) => {
        const stmt = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND quantity > 0');
        return stmt.all(userId);
    }
};

// 밭 관련 함수들
const fields = {
    // 사용자의 모든 밭 상태 조회
    getUserFields: (userId) => {
        userInfo.getOrCreate(userId); // 사용자가 없으면 생성
        const stmt = db.prepare(`
            SELECT f.field_id, f.is_owned, s.seed_name 
            FROM fields f 
            LEFT JOIN seeds s ON f.user_id = s.user_id AND f.field_id = s.field_id 
            WHERE f.user_id = ? 
            ORDER BY f.field_id ASC
        `);
        return stmt.all(userId);
    },

    // 밭 구매 (소유권 획득)
    buyField: (userId, fieldId) => {
        const stmt = db.prepare('UPDATE fields SET is_owned = 1 WHERE user_id = ? AND field_id = ?');
        stmt.run(userId, fieldId);
    }
};

// 씨앗 데이터 관련 함수들
const seeds = {
    // 씨앗 심기
    plant: (userId, fieldId, seedName, sellPrice) => {
        userInfo.getOrCreate(userId);
        const plantTime = Date.now();
        const stmt = db.prepare('INSERT INTO seeds (user_id, field_id, seed_name, plant_time, sell_price) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(userId, fieldId, seedName, plantTime, sellPrice);
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
    fields,
    seeds,
    inventory
};
