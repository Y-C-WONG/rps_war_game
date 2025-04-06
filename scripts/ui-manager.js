// UI 管理器 - 處理界面更新和動畫

const uiManager = {
    // 更新界面
    updateUI: function() {
        log("更新界面");
        
        // 更新旗幟
        this.updateFlags(1, gameState.player1Facilities.flags);
        this.updateFlags(2, gameState.player2Facilities.flags);
        
        // 更新保護罩
        this.updateShields(1, gameState.player1Facilities.shield);
        this.updateShields(2, gameState.player2Facilities.shield);
        
        // 更新堡壘
        this.updateFortress(1, gameState.player1Facilities.fortressHealth);
        this.updateFortress(2, gameState.player2Facilities.fortressHealth);
        
        // 更新戰機和大炮 - 注意順序，確保不重疊
        this.updateUnits(1, 'aircraft', gameState.player1Facilities.aircraft);
        this.updateUnits(1, 'cannon', gameState.player1Facilities.cannon);
        this.updateUnits(2, 'aircraft', gameState.player2Facilities.aircraft);
        this.updateUnits(2, 'cannon', gameState.player2Facilities.cannon);
    },

    // 更新旗幟 - 確保最多顯示3個旗幟
    updateFlags: function(player, count) {
        const flagsContainer = document.getElementById(`flags-${player}`);
        
        // 清空旗幟容器
        flagsContainer.innerHTML = '';
        
        // 確保旗幟數量不超過3個
        const flagCount = Math.min(count, 3);
        
        // 添加新的旗幟
        for (let i = 0; i < flagCount; i++) {
            const flag = document.createElement('div');
            flag.className = 'flag';
            
            const flagPole = document.createElement('div');
            flagPole.className = 'flag-pole';
            
            const flagCanvas = document.createElement('div');
            flagCanvas.className = 'flag-canvas';
            
            flag.appendChild(flagCanvas);
            flag.appendChild(flagPole);
            flagsContainer.appendChild(flag);
        }
        
        // 立即隱藏旗幟容器如果沒有旗幟
        if (count <= 0) {
            flagsContainer.style.display = 'none';
        } else {
            flagsContainer.style.display = 'flex';
        }
    },

    // 更新保護罩 - 顯示為半圓線條
    updateShields: function(player, level) {
        const playerTerritory = document.getElementById(`player${player}-territory`);
        
        // 移除所有現有的保護罩
        const oldShields = playerTerritory.querySelectorAll('.shield');
        oldShields.forEach(shield => shield.remove());
        
        // 添加新的保護罩層 - 按照從內到外，從小到大的順序
        for (let i = 1; i <= level; i++) {
            const shield = document.createElement('div');
            shield.className = `shield layer-${i}`;
            playerTerritory.appendChild(shield);
        }
        
        // 如果沒有保護罩，確保不顯示任何殘留效果
        if (level <= 0) {
            // 確保已移除所有保護罩
            playerTerritory.querySelectorAll('.shield').forEach(shield => shield.remove());
        }
    },

    // 更新堡壘
    updateFortress: function(player, healthState) {
        const fortress = document.getElementById(`fortress-${player}`);
        const cells = fortress.querySelectorAll('.fortress-cell');
        
        cells.forEach(cell => {
            const character = cell.getAttribute('data-value');
            if (healthState[character]) {
                cell.classList.remove('destroyed');
            } else {
                cell.classList.add('destroyed');
            }
        });
    },

    // 更新單位（戰機或大炮） - 將單位放置在更高的位置，避開旗幟
    updateUnits: function(player, unitType, count) {
        const playerTerritory = document.getElementById(`player${player}-territory`);
        
        // 移除所有現有的此類單位
        const oldUnits = playerTerritory.querySelectorAll(`.unit.${unitType}`);
        oldUnits.forEach(unit => unit.remove());
        
        // 計算領地的寬度
        const territoryWidth = playerTerritory.offsetWidth;
        
        // 獲取另一種單位的數量，用於計算位置
        const otherType = unitType === 'aircraft' ? 'cannon' : 'aircraft';
        const otherCount = player === 1 ? 
                          gameState.player1Facilities[otherType] : 
                          gameState.player2Facilities[otherType];
        
        // 計算總單位數用於居中
        const totalUnits = count + otherCount;
        
        // 單位之間的間距
        const spacing = 60;
        
        // 單位寬度
        const unitWidth = 40;
        
        // 計算起始x位置，使單位群組居中
        let startX = (territoryWidth - (totalUnits * unitWidth + (totalUnits - 1) * spacing)) / 2;
        
        // 如果startX太小，調整為合理值
        startX = Math.max(10, startX);
        
        // 確定當前單位類型應該放在哪個位置
        // 戰機放左邊，大炮放右邊
        let startIndex = unitType === 'aircraft' ? 0 : otherCount;
        
        // 添加新的單位 - 放在更高的位置，避開旗幟
        for (let i = 0; i < count; i++) {
            const unit = document.createElement('div');
            unit.className = `unit ${unitType}`;
            unit.setAttribute('data-index', i);  // 添加索引標記，方便後續爆炸動畫定位
            
            // 設置單位位置 - 計算該單位在整體陣列中的索引位置
            const xPos = startX + (startIndex + i) * (unitWidth + spacing);
            
            // 將單位放在更高的位置，避開旗幟
            // 旗幟在底部135px處，我們將單位放在180-220px處
            const yPos = 180 + (i * 10); // 每個單位稍微錯開高度
            
            unit.style.left = `${xPos}px`;
            unit.style.top = `${yPos}px`;
            
            playerTerritory.appendChild(unit);
        }
    },

    // 顯示爆炸動畫 - 改進版，針對不同類型單位有更精準的位置計算
    showExplosion: function(targetPlayer, targetType, fortressPart = null) {
        const playerTerritory = document.getElementById(`player${targetPlayer}-territory`);
        
        if (targetType === 'aircraft' || targetType === 'cannon') {
            // 對於戰機和大炮，在每個單位上分別顯示爆炸效果
            const units = playerTerritory.querySelectorAll(`.unit.${targetType}`);
            
            // 如果沒有找到單位，嘗試找到最後一個被摧毀的位置
            if (units.length === 0) {
                this.showGenericExplosion(playerTerritory, targetType);
                return;
            }
            
            // 找到最後一個單位（將被摧毀的那個）
            const lastUnit = units[units.length - 1];
            
            // 獲取單位的位置
            const unitRect = lastUnit.getBoundingClientRect();
            const territoryRect = playerTerritory.getBoundingClientRect();
            
            // 創建爆炸元素
            const explosion = document.createElement('div');
            explosion.className = 'explosion';
            
            // 設置爆炸位置 - 相對於單位的中心點
            explosion.style.left = (unitRect.left + unitRect.width / 2 - territoryRect.left - 25) + 'px';
            explosion.style.top = (unitRect.top + unitRect.height / 2 - territoryRect.top - 25) + 'px';
            
            // 添加到玩家領地
            playerTerritory.appendChild(explosion);
            
            // 使用全局時間設定
            setTimeout(() => {
                explosion.remove();
            }, GAME_TIMING.EXPLOSION_DURATION);
        } else {
            // 其他類型的目標使用原來的邏輯
            let target;
            
            // 根據目標類型定位爆炸位置
            if (targetType === 'fortress' && fortressPart) {
                const fortress = document.getElementById(`fortress-${targetPlayer}`);
                target = Array.from(fortress.querySelectorAll('.fortress-cell')).find(
                    cell => cell.getAttribute('data-value') === fortressPart
                );
            } else if (targetType === 'shield') {
                target = playerTerritory.querySelector('.shield');
            } else if (targetType === 'flags') {
                target = document.getElementById(`flags-${targetPlayer}`).lastChild;
            }
            
            if (!target) {
                this.showGenericExplosion(playerTerritory, targetType);
                return;
            }
            
            // 計算目標位置
            const targetRect = target.getBoundingClientRect();
            const territoryRect = playerTerritory.getBoundingClientRect();
            
            // 創建爆炸元素
            const explosion = document.createElement('div');
            explosion.className = 'explosion';
            
            // 設置爆炸位置
            explosion.style.left = (targetRect.left + targetRect.width / 2 - territoryRect.left - 25) + 'px';
            explosion.style.top = (targetRect.top + targetRect.height / 2 - territoryRect.top - 25) + 'px';
            
            // 添加到玩家領地
            playerTerritory.appendChild(explosion);
            
            // 使用全局時間設定
            setTimeout(() => {
                explosion.remove();
            }, GAME_TIMING.EXPLOSION_DURATION);
        }
    },
    
    // 顯示通用爆炸效果，當找不到特定目標時使用
    showGenericExplosion: function(playerTerritory, targetType) {
        // 創建爆炸元素
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        
        // 根據目標類型決定爆炸的大致位置
        let xPos, yPos;
        
        switch(targetType) {
            case 'aircraft':
                // 飛機通常在左側上方
                xPos = playerTerritory.offsetWidth * 0.3;
                yPos = 180;
                break;
            case 'cannon':
                // 大炮通常在右側上方
                xPos = playerTerritory.offsetWidth * 0.7;
                yPos = 180;
                break;
            case 'flags':
                // 旗幟在底部中間
                xPos = playerTerritory.offsetWidth / 2;
                yPos = playerTerritory.offsetHeight - 135;
                break;
            case 'shield':
                // 保護罩覆蓋堡壘和旗幟
                xPos = playerTerritory.offsetWidth / 2;
                yPos = playerTerritory.offsetHeight - 80;
                break;
            default:
                // 默認在中間位置
                xPos = playerTerritory.offsetWidth / 2;
                yPos = playerTerritory.offsetHeight / 2;
        }
        
        // 設置爆炸位置
        explosion.style.left = (xPos - 25) + 'px';
        explosion.style.top = (yPos - 25) + 'px';
        
        // 添加到玩家領地
        playerTerritory.appendChild(explosion);
        
        // 使用全局時間設定
        setTimeout(() => {
            explosion.remove();
        }, GAME_TIMING.EXPLOSION_DURATION);
    },

    // 獲取目標名稱
    getTargetName: function(targetType) {
        switch(targetType) {
            case 'flags': return "旗幟";
            case 'shield': return "保護罩";
            case 'aircraft': return "戰機";
            case 'cannon': return "大炮";
            case 'fortress': return "堡壘";
            default: return "";
        }
    }
};