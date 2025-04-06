// 遊戲管理器 - 處理遊戲流程、回合和操作

const gameManager = {
    // 追踪本回合中是否已執行建設操作
    actionTaken: false,
    
    // 猜拳後的處理
    handlePostRps: function(winner) {
        // 重置行動狀態
        this.actionTaken = false;
        
        statusText.textContent = "玩家" + winner + "贏了猜拳！";
        
        // 如果是被攻擊方贏了猜拳，切換到修復模式
        if (gameState.gameMode === 'repair') {
            this.showRepairOptions(winner);
            return;
        }
        
        // 顯示建設或攻擊選項
        this.showBuildOrAttackOptions(winner);
    },

    // 顯示建設或攻擊選項
    showBuildOrAttackOptions: function(player) {
        gameState.gameMode = 'build';
        gameState.currentPlayer = player;
        
        // 清空中心區域
        while (gameCenter.children.length > 1) {
            gameCenter.removeChild(gameCenter.lastChild);
        }
        
        // 創建選項容器
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'build-container';
        
        const playerFacilities = player === 1 ? gameState.player1Facilities : gameState.player2Facilities;
        const opponentFacilities = player === 1 ? gameState.player2Facilities : gameState.player1Facilities;
        
        // 根據當前設施狀態決定可用選項
        if (playerFacilities.flags < 3) {
            // 需要建設旗幟
            const flagButton = document.createElement('button');
            flagButton.className = this.actionTaken ? 'build-button disabled' : 'build-button';
            flagButton.textContent = '建設旗幟';
            
            if (!this.actionTaken) {
                flagButton.onclick = () => {
                    this.buildFacility(player, 'flags');
                    this.actionTaken = true; // 標記本回合已執行操作
                    
                    // 更新按鈕為禁用狀態
                    flagButton.className = 'build-button disabled';
                    flagButton.onclick = null;
                };
            }
            
            optionsDiv.appendChild(flagButton);
        } else if (playerFacilities.shield < 5) {
            // 需要建設保護罩
            const shieldButton = document.createElement('button');
            shieldButton.className = this.actionTaken ? 'build-button disabled' : 'build-button';
            shieldButton.textContent = '建設保護罩';
            
            if (!this.actionTaken) {
                shieldButton.onclick = () => {
                    this.buildFacility(player, 'shield');
                    this.actionTaken = true; // 標記本回合已執行操作
                    
                    // 更新按鈕為禁用狀態
                    shieldButton.className = 'build-button disabled';
                    shieldButton.onclick = null;
                };
            }
            
            optionsDiv.appendChild(shieldButton);
        } else {
            // 可以建設戰機或大炮
            if (playerFacilities.aircraft < 3) {
                const aircraftButton = document.createElement('button');
                aircraftButton.className = this.actionTaken ? 'build-button disabled' : 'build-button';
                aircraftButton.textContent = '建設戰機';
                
                if (!this.actionTaken) {
                    aircraftButton.onclick = () => {
                        this.buildFacility(player, 'aircraft');
                        this.actionTaken = true; // 標記本回合已執行操作
                        
                        // 禁用所有建設按鈕
                        this.disableBuildButtons();
                    };
                }
                
                optionsDiv.appendChild(aircraftButton);
            }
            
            if (playerFacilities.cannon < 3) {
                const cannonButton = document.createElement('button');
                cannonButton.className = this.actionTaken ? 'build-button disabled' : 'build-button';
                cannonButton.textContent = '建設大炮';
                
                if (!this.actionTaken) {
                    cannonButton.onclick = () => {
                        this.buildFacility(player, 'cannon');
                        this.actionTaken = true; // 標記本回合已執行操作
                        
                        // 禁用所有建設按鈕
                        this.disableBuildButtons();
                    };
                }
                
                optionsDiv.appendChild(cannonButton);
            }
            
            // 如果有戰機或大炮，可以攻擊
            if ((playerFacilities.aircraft > 0 || playerFacilities.cannon > 0) && 
                (opponentFacilities.aircraft > 0 || opponentFacilities.cannon > 0 || 
                 opponentFacilities.flags > 0 || opponentFacilities.shield > 0 || 
                 Object.values(opponentFacilities.fortressHealth).some(val => val))) {
                
                const attackButton = document.createElement('button');
                attackButton.className = this.actionTaken ? 'attack-button disabled' : 'attack-button';
                attackButton.textContent = '攻擊對手';
                
                if (!this.actionTaken) {
                    attackButton.onclick = () => {
                        this.showAttackOptions(player);
                    };
                }
                
                optionsDiv.appendChild(attackButton);
            }
        }
        
        gameCenter.appendChild(optionsDiv);
    },

    // 禁用所有建設按鈕
    disableBuildButtons: function() {
        const buttons = document.querySelectorAll('.build-button, .attack-button');
        buttons.forEach(button => {
            button.className = button.className + ' disabled';
            button.onclick = null;
        });
    },

    // 建設設施
    buildFacility: function(player, facilityType) {
        log("玩家" + player + "建設" + facilityType);
        
        const facilities = player === 1 ? gameState.player1Facilities : gameState.player2Facilities;
        
        // 檢查旗幟數量上限
        if (facilityType === 'flags' && facilities.flags >= 3) {
            statusText.textContent = "旗幟已達到上限（3個）！";
            setTimeout(() => {
                this.showBuildOrAttackOptions(player);
            }, GAME_TIMING.MESSAGE_DISPLAY);
            return;
        }
        
        // 增加設施數量
        facilities[facilityType]++;
        
        // 追蹤玩家總單位數
        if (facilityType === 'aircraft' || facilityType === 'cannon') {
            gameState.totalUnits[`player${player}`]++;
        }
        
        // 更新UI
        uiManager.updateUI();
        
        // 顯示結果
        let facilityName = "";
        switch(facilityType) {
            case 'flags': facilityName = "旗幟"; break;
            case 'shield': facilityName = "保護罩"; break;
            case 'aircraft': facilityName = "戰機"; break;
            case 'cannon': facilityName = "大炮"; break;
        }
        
        statusText.textContent = "玩家" + player + "建設了" + facilityName + "！";
        
        // 使用全局時間設定
        setTimeout(() => {
            startNewRound();
        }, GAME_TIMING.MESSAGE_DISPLAY);
    },

    // 顯示攻擊選項
    showAttackOptions: function(player) {
        gameState.gameMode = 'attack';
        
        // 清空中心區域
        while (gameCenter.children.length > 1) {
            gameCenter.removeChild(gameCenter.lastChild);
        }
        
        statusText.textContent = "玩家" + player + "選擇攻擊目標";
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'build-container';
        
        const opponentPlayer = player === 1 ? 2 : 1;
        const opponentFacilities = player === 1 ? gameState.player2Facilities : gameState.player1Facilities;
        
        // 優先攻擊順序: 戰機/大炮 > 旗幟 > 保護罩 > 堡壘
        let hasTargets = false;
        
        // 檢查是否有戰機可以攻擊
        if (opponentFacilities.aircraft > 0) {
            const attackAircraftButton = document.createElement('button');
            attackAircraftButton.className = 'attack-button';
            attackAircraftButton.textContent = '攻擊戰機';
            attackAircraftButton.onclick = () => {
                this.initiateAttack(player, opponentPlayer, 'aircraft');
                this.actionTaken = true; // 標記本回合已執行操作
            };
            optionsDiv.appendChild(attackAircraftButton);
            hasTargets = true;
        }
        
        // 檢查是否有大炮可以攻擊
        if (opponentFacilities.cannon > 0) {
            const attackCannonButton = document.createElement('button');
            attackCannonButton.className = 'attack-button';
            attackCannonButton.textContent = '攻擊大炮';
            attackCannonButton.onclick = () => {
                this.initiateAttack(player, opponentPlayer, 'cannon');
                this.actionTaken = true; // 標記本回合已執行操作
            };
            optionsDiv.appendChild(attackCannonButton);
            hasTargets = true;
        }
        
        // 如果沒有戰機和大炮，檢查是否有旗幟
        if (!hasTargets && opponentFacilities.flags > 0) {
            const attackFlagButton = document.createElement('button');
            attackFlagButton.className = 'attack-button';
            attackFlagButton.textContent = '攻擊旗幟';
            attackFlagButton.onclick = () => {
                this.initiateAttack(player, opponentPlayer, 'flags');
                this.actionTaken = true; // 標記本回合已執行操作
            };
            optionsDiv.appendChild(attackFlagButton);
            hasTargets = true;
        }
        
        // 如果沒有旗幟，檢查是否有保護罩
        if (!hasTargets && opponentFacilities.shield > 0) {
            const attackShieldButton = document.createElement('button');
            attackShieldButton.className = 'attack-button';
            attackShieldButton.textContent = '攻擊保護罩';
            attackShieldButton.onclick = () => {
                this.initiateAttack(player, opponentPlayer, 'shield');
                this.actionTaken = true; // 標記本回合已執行操作
            };
            optionsDiv.appendChild(attackShieldButton);
            hasTargets = true;
        }
        
        // 如果沒有保護罩，可以攻擊堡壘
        if (!hasTargets && Object.values(opponentFacilities.fortressHealth).some(val => val)) {
            const attackFortressButton = document.createElement('button');
            attackFortressButton.className = 'attack-button';
            attackFortressButton.textContent = '攻擊堡壘';
            attackFortressButton.onclick = () => {
                this.showFortressAttackOptions(player, opponentPlayer);
            };
            optionsDiv.appendChild(attackFortressButton);
        }
        
        // 添加取消按鈕
        const cancelButton = document.createElement('button');
        cancelButton.className = 'build-button';
        cancelButton.textContent = '返回';
        cancelButton.style.backgroundColor = '#888';
        cancelButton.onclick = () => {
            this.showBuildOrAttackOptions(player);
        };
        optionsDiv.appendChild(cancelButton);
        
        gameCenter.appendChild(optionsDiv);
    },

    // 顯示堡壘攻擊選項
    showFortressAttackOptions: function(player, targetPlayer) {
        // 清空中心區域
        while (gameCenter.children.length > 1) {
            gameCenter.removeChild(gameCenter.lastChild);
        }
        
        statusText.textContent = "選擇攻擊堡壘的部分";
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'build-container';
        
        const targetFacilities = targetPlayer === 1 ? gameState.player1Facilities : gameState.player2Facilities;
        
        // 創建四個按鈕對應堡壘的四個部分
        const fortressParts = ["天", "下", "太", "平"];
        
        fortressParts.forEach(part => {
            if (targetFacilities.fortressHealth[part]) {
                const attackPartButton = document.createElement('button');
                attackPartButton.className = 'attack-button';
                attackPartButton.textContent = `攻擊"${part}"`;
                attackPartButton.onclick = () => {
                    this.initiateAttack(player, targetPlayer, 'fortress', part);
                    this.actionTaken = true; // 標記本回合已執行操作
                };
                optionsDiv.appendChild(attackPartButton);
            }
        });
        
        // 添加取消按鈕
        const cancelButton = document.createElement('button');
        cancelButton.className = 'build-button';
        cancelButton.textContent = '返回';
        cancelButton.style.backgroundColor = '#888';
        cancelButton.onclick = () => {
            this.showAttackOptions(player);
        };
        optionsDiv.appendChild(cancelButton);
        
        gameCenter.appendChild(optionsDiv);
    },

    // 發起攻擊 - 修改為不需要對方猜拳
    initiateAttack: function(attackPlayer, targetPlayer, targetType, fortressPart = null) {
        log(`玩家${attackPlayer}攻擊玩家${targetPlayer}的${targetType}${fortressPart ? ' ' + fortressPart : ''}`);
        
        gameState.gameMode = 'attack';
        gameState.attackTarget = {
            player: targetPlayer,
            type: targetType,
            fortressPart: fortressPart
        };
        
        // 清空中心區域
        while (gameCenter.children.length > 1) {
            gameCenter.removeChild(gameCenter.lastChild);
        }
        
        // 顯示爆炸動畫
        uiManager.showExplosion(targetPlayer, targetType, fortressPart);
        
        let targetName = "";
        switch(targetType) {
            case 'flags': targetName = "旗幟"; break;
            case 'shield': targetName = "保護罩"; break;
            case 'aircraft': targetName = "戰機"; break;
            case 'cannon': targetName = "大炮"; break;
            case 'fortress': targetName = `堡壘的"${fortressPart}"字`; break;
        }
        
        statusText.textContent = `玩家${attackPlayer}正在攻擊玩家${targetPlayer}的${targetName}！`;
        
        // 直接造成損傷，不再需要猜拳決定
        setTimeout(() => {
            statusText.textContent = `玩家${attackPlayer}攻擊成功！`;
            
            // 處理損傷
            this.applyDamage(gameState.attackTarget);
            
            // 使用全局時間設定
            setTimeout(() => {
                // 給攻擊方新一輪行動機會
                startNewRound();
            }, GAME_TIMING.MESSAGE_DISPLAY);
        }, GAME_TIMING.MESSAGE_DISPLAY);
    },

    // 顯示修復選項 - 這個方法現在基本不會被調用了，但保留以備將來可能的擴展
    showRepairOptions: function(winner) {
        const attackTarget = gameState.attackTarget;
        const defender = attackTarget.player;
        
        // 重置行動標記，讓防守方可以有一個新的行動機會
        this.actionTaken = false;
        
        // 檢查獲勝者是否是防守方
        if (winner === defender) {
            // 防守方贏了猜拳，可以修復
            log(`玩家${defender}成功防禦，獲得修復機會`);
            
            statusText.textContent = `玩家${defender}成功防禦！`;
            
            // 清空中心區域
            while (gameCenter.children.length > 1) {
                gameCenter.removeChild(gameCenter.lastChild);
            }
            
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'build-container';
            
            // 修復按鈕
            const repairButton = document.createElement('button');
            repairButton.className = 'build-button';
            repairButton.textContent = '修復設施';
            repairButton.onclick = () => {
                // 不需要實際修復，因為沒有損傷
                statusText.textContent = `玩家${defender}成功保護了設施！`;
                
                // 使用全局時間設定
                setTimeout(() => {
                    this.showBuildOrAttackOptions(defender);
                }, GAME_TIMING.MESSAGE_DISPLAY);
            };
            optionsDiv.appendChild(repairButton);
            
            // 攻擊按鈕
            const counterAttackButton = document.createElement('button');
            counterAttackButton.className = 'attack-button';
            counterAttackButton.textContent = '反擊';
            counterAttackButton.onclick = () => {
                this.showAttackOptions(defender);
            };
            optionsDiv.appendChild(counterAttackButton);
            
            gameCenter.appendChild(optionsDiv);
        } else {
            // 攻擊方贏了猜拳，對防守方造成損傷
            log(`玩家${winner}攻擊成功，對玩家${defender}造成傷害`);
            
            // 處理損傷
            this.applyDamage(attackTarget);
            
            // 使用全局時間設定
            setTimeout(() => {
                this.showBuildOrAttackOptions(winner);
            }, GAME_TIMING.MESSAGE_DISPLAY);
        }
    },

    // 應用損傷
    applyDamage: function(target) {
        const playerFacilities = target.player === 1 ? gameState.player1Facilities : gameState.player2Facilities;
        
        // 根據目標類型應用損傷
        if (target.type === 'fortress') {
            playerFacilities.fortressHealth[target.fortressPart] = false;
            statusText.textContent = `玩家${target.player}的堡壘"${target.fortressPart}"字被摧毀！`;
        } else {
            // 減少目標設施數量
            playerFacilities[target.type]--;
            
            // 降低單位總數
            if (target.type === 'aircraft' || target.type === 'cannon') {
                gameState.totalUnits[`player${target.player}`]--;
            }
            
            statusText.textContent = `玩家${target.player}的${uiManager.getTargetName(target.type)}被摧毀！`;
        }
        
        // 更新UI
        uiManager.updateUI();
        
        // 檢查遊戲是否結束
        checkGameOver();
    }
};