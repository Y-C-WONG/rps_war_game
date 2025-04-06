// 猜拳系統管理器 - 處理石頭剪刀布邏輯

const rpsManager = {
    // 為猜拳按鈕添加事件監聽
    setupRpsButtons: function() {
        log("重新設置猜拳按鈕");
        
        // 設置遊戲模式為猜拳
        gameState.gameMode = 'rps';
        
        // 移除所有可能存在的設施按鈕，確保猜拳階段沒有設施按鈕
        this.clearAllNonRpsButtons();
        
        // 移除舊的猜拳容器並創建新的
        const oldRpsContainer = document.getElementById('rps-container');
        if (oldRpsContainer) {
            gameCenter.removeChild(oldRpsContainer);
        }
        
        // 創建新的猜拳容器
        const rpsContainer = document.createElement('div');
        rpsContainer.id = 'rps-container';
        rpsContainer.className = 'rps-container';
        
        // 創建三個按鈕
        const choices = [
            { value: 'rock', emoji: '✊' },
            { value: 'paper', emoji: '✋' },
            { value: 'scissors', emoji: '✌️' }
        ];
        
        choices.forEach((choice) => {
            // 創建按鈕容器（為了更好的觸摸區域）
            const buttonWrapper = document.createElement('div');
            buttonWrapper.style.margin = '0 10px';
            buttonWrapper.style.position = 'relative';
            
            const button = document.createElement('button');
            button.className = 'rps-button';
            button.textContent = choice.emoji;
            button.setAttribute('data-choice', choice.value);
            
            // 使用內聯函數直接處理點擊
            button.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                log("按鈕 " + choice.value + " 被點擊");
                this.makeChoice(choice.value);
                return false;
            };
            
            // 添加觸摸事件 - 防止移動設備延遲
            button.addEventListener('touchstart', function(e) {
                log("觸摸開始 " + choice.value);
                e.preventDefault();
                this.style.transform = 'scale(0.95)';
            }, { passive: false });
            
            button.addEventListener('touchend', (e) => {
                log("觸摸結束 " + choice.value);
                e.preventDefault();
                button.style.transform = '';
                this.makeChoice(choice.value);
            }, { passive: false });
            
            buttonWrapper.appendChild(button);
            rpsContainer.appendChild(buttonWrapper);
        });
        
        // 添加到遊戲中心
        gameCenter.appendChild(rpsContainer);
        
        log("猜拳按鈕設置完成");
    },
    
    // 清除所有非猜拳相關的按鈕
    clearAllNonRpsButtons: function() {
        // 清空中心區域，但保留狀態文字
        while (gameCenter.children.length > 1) {
            gameCenter.removeChild(gameCenter.lastChild);
        }
        
        // 移除所有建設容器
        const buildContainers = document.querySelectorAll('.build-container');
        buildContainers.forEach(container => container.remove());
    },

    // 隱藏猜拳按鈕（在結果顯示時）
    hideRpsButtons: function() {
        const rpsContainer = document.getElementById('rps-container');
        if (rpsContainer) {
            rpsContainer.style.display = 'none';
        }
    },

    // 分離出選擇邏輯 - 修改為隱藏玩家1的選擇
    makeChoice: function(choice) {
        log("做出選擇: " + choice + ", 當前等待玩家: " + gameState.waitingForPlayer);
        
        if (gameState.waitingForPlayer === 1) {
            gameState.player1Choice = choice;
            gameState.waitingForPlayer = 2;
            // 修改為不顯示玩家1的具體選擇
            statusText.textContent = "玩家1已做出選擇，請玩家2選擇出拳";
            log("玩家1選擇了 " + choice + "，等待玩家2");
        } else if (gameState.waitingForPlayer === 2) {
            gameState.player2Choice = choice;
            log("玩家2選擇了 " + choice + "，準備判斷勝負");
            statusText.textContent = "玩家2已做出選擇，判斷勝負...";
            
            // 立即隱藏猜拳按鈕
            this.hideRpsButtons();
            
            // 使用全局時間設定
            setTimeout(() => {
                this.determineRpsWinner();
            }, GAME_TIMING.ANIMATION_DURATION);
        }
    },

    // 獲取選擇的表情符號
    getChoiceEmoji: function(choice) {
        switch(choice) {
            case 'rock': return '✊';
            case 'paper': return '✋';
            case 'scissors': return '✌️';
            default: return '';
        }
    },

    // 判斷猜拳勝負 - 在結果揭曉時才顯示雙方選擇
    determineRpsWinner: function() {
        log("判斷猜拳勝負");
        const p1 = gameState.player1Choice;
        const p2 = gameState.player2Choice;
        
        log("玩家1選擇: " + p1 + ", 玩家2選擇: " + p2);
        
        // 現在在這裡才顯示兩位玩家的選擇
        statusText.textContent = "玩家1選擇了 " + this.getChoiceEmoji(p1) + 
                                 "，玩家2選擇了 " + this.getChoiceEmoji(p2) + 
                                 "，判斷勝負...";
        
        // 使用全局時間設定
        setTimeout(() => {
            this.showRpsResult(p1, p2);
        }, GAME_TIMING.RESULT_DISPLAY);
    },
    
    // 顯示猜拳結果
    showRpsResult: function(p1, p2) {
        let result;
        
        if (p1 === p2) {
            result = 'tie';
            statusText.textContent = "平局！請重新猜拳，玩家1先出";
            log("猜拳結果: 平局");
            gameState.waitingForPlayer = 1;
            gameState.player1Choice = null;
            gameState.player2Choice = null;
            
            // 使用全局時間設定
            setTimeout(() => {
                this.setupRpsButtons();
            }, GAME_TIMING.MESSAGE_DISPLAY);
        } else if (
            (p1 === 'rock' && p2 === 'scissors') ||
            (p1 === 'paper' && p2 === 'rock') ||
            (p1 === 'scissors' && p2 === 'paper')
        ) {
            result = 'player1';
            gameState.lastWinner = 1;
            log("猜拳結果: 玩家1勝利");
            
            statusText.textContent = "玩家1獲勝！(" + this.getChoiceEmoji(p1) + " vs " + this.getChoiceEmoji(p2) + ")";
            
            // 清除所有猜拳按鈕
            this.clearAllNonRpsButtons();
            
            // 使用全局時間設定
            setTimeout(() => {
                gameManager.handlePostRps(1);
            }, GAME_TIMING.MESSAGE_DISPLAY);
        } else {
            result = 'player2';
            gameState.lastWinner = 2;
            log("猜拳結果: 玩家2勝利");
            
            statusText.textContent = "玩家2獲勝！(" + this.getChoiceEmoji(p2) + " vs " + this.getChoiceEmoji(p1) + ")";
            
            // 清除所有猜拳按鈕
            this.clearAllNonRpsButtons();
            
            // 使用全局時間設定
            setTimeout(() => {
                gameManager.handlePostRps(2);
            }, GAME_TIMING.MESSAGE_DISPLAY);
        }
    }
};