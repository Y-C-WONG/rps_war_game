// 主遊戲文件 - 入口點和全域狀態

// 調試功能
const DEBUG = true;
function log(message) {
    if (DEBUG) {
        console.log("[DEBUG] " + message);
    }
}

// 遊戲全局延遲時間設置（毫秒）
const GAME_TIMING = {
    MESSAGE_DISPLAY: 500,       // 一般消息顯示時間
    RESULT_DISPLAY: 500,        // 結果顯示時間
    ANIMATION_DURATION: 800,     // 動畫持續時間
    EXPLOSION_DURATION: 500      // 爆炸動畫持續時間
};

// 遊戲狀態
const gameState = {
    currentPlayer: 1,
    waitingForPlayer: 1,
    player1Choice: null,
    player2Choice: null,
    player1Facilities: {
        flags: 0,
        shield: 0,
        aircraft: 0,
        cannon: 0,
        fortressHealth: {
            "天": true,
            "下": true,
            "太": true,
            "平": true
        }
    },
    player2Facilities: {
        flags: 0,
        shield: 0,
        aircraft: 0,
        cannon: 0,
        fortressHealth: {
            "天": true,
            "下": true,
            "太": true,
            "平": true
        }
    },
    winner: null,
    gameMode: 'rps', // 'rps', 'build', 'attack', 'repair'
    lastWinner: null,
    attackTarget: null,
    totalUnits: {
        player1: 0,
        player2: 0
    }
};

// DOM 元素
let gameContainer, player1Territory, player2Territory, gameCenter, statusText;
let rpsContainer, fortress1, fortress2, flags1, flags2;

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    // 獲取 DOM 元素
    gameContainer = document.getElementById('game-container');
    player1Territory = document.getElementById('player1-territory');
    player2Territory = document.getElementById('player2-territory');
    gameCenter = document.getElementById('game-center');
    statusText = document.getElementById('status-text');
    rpsContainer = document.getElementById('rps-container');
    fortress1 = document.getElementById('fortress-1');
    fortress2 = document.getElementById('fortress-2');
    flags1 = document.getElementById('flags-1');
    flags2 = document.getElementById('flags-2');
    
    log("遊戲初始化開始");
    uiManager.updateUI();
    rpsManager.setupRpsButtons();
    log("遊戲初始化完成");
});

// 啟動新回合
function startNewRound() {
    log("開始新回合");
    statusText.textContent = "新回合開始！請玩家1選擇出拳";
    
    // 重置猜拳
    gameState.waitingForPlayer = 1;
    gameState.player1Choice = null;
    gameState.player2Choice = null;
    gameState.gameMode = 'rps';
    
    rpsManager.setupRpsButtons();
}

// 檢查遊戲是否結束
function checkGameOver() {
    const p1Facilities = gameState.player1Facilities;
    const p2Facilities = gameState.player2Facilities;
    
    // 檢查堡壘是否全部摧毀
    const p1FortressDestroyed = !Object.values(p1Facilities.fortressHealth).some(val => val);
    const p2FortressDestroyed = !Object.values(p2Facilities.fortressHealth).some(val => val);
    
    // 檢查所有設施是否摧毀
    const p1AllDestroyed = p1FortressDestroyed && 
                         p1Facilities.flags === 0 && 
                         p1Facilities.shield === 0 && 
                         p1Facilities.aircraft === 0 && 
                         p1Facilities.cannon === 0;
                         
    const p2AllDestroyed = p2FortressDestroyed && 
                         p2Facilities.flags === 0 && 
                         p2Facilities.shield === 0 && 
                         p2Facilities.aircraft === 0 && 
                         p2Facilities.cannon === 0;
    
    // 決定贏家
    if (p1AllDestroyed) {
        gameState.winner = 2;
        showGameOver(2);
    } else if (p2AllDestroyed) {
        gameState.winner = 1;
        showGameOver(1);
    }
}

// 顯示遊戲結束
function showGameOver(winner) {
    log("遊戲結束，玩家" + winner + "獲勝");
    
    // 創建遊戲結束覆蓋層
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    
    const winnerText = document.createElement('div');
    winnerText.textContent = `玩家${winner}獲勝!`;
    
    const restartButton = document.createElement('button');
    restartButton.className = 'restart-button';
    restartButton.textContent = '重新開始';
    restartButton.onclick = function() {
        location.reload();
    };
    
    gameOverDiv.appendChild(winnerText);
    gameOverDiv.appendChild(restartButton);
    
    gameContainer.appendChild(gameOverDiv);
}