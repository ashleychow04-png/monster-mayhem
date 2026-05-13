// MONSTER MAYHEM - FIRE SURVIVAL MODE() EVERY MOVE = -1 HEART! Treasure is HIDDEN!)
(function() {
    let canvas, ctx;
    let GRID_W = 10, GRID_H = 10;
    let HEX_SIZE = 30;
    let HEX_H = Math.sqrt(3) * HEX_SIZE;
    let MOVE_RANGE = 2;
    let START_HEARTS = 10;

    let originX = 110, originY = 60;
    let hexes = new Map();
    let hoverHex = null;
    let selectedHex = null;
    let monster = { q: 5, r: 5 };
    let moveRange = new Set();
    let explored = new Set();
    let hearts = START_HEARTS;
    let gameActive = true;
    let gameWin = false;
    let treasure = null;

    let statusMsg = document.getElementById('statusMsg');
    let statusDetail = document.getElementById('statusDetail');
    let heartsCount = document.getElementById('heartsCount');
    let exploredCount = document.getElementById('exploredCount');
    let treasureStatus = document.getElementById('treasureStatus');
    let hotColdMini = document.getElementById('hotColdMini');
    let heartsVisual = document.getElementById('heartsVisual');

    function updateUI() {
        heartsCount.innerText = hearts;
        exploredCount.innerText = explored.size;
        treasureStatus.innerText = gameWin ? '✨ FOUND!' : (!gameActive ? '💀 LOST' : '❓ HIDDEN');
        updateHeartsVisual();
        updateHotCold();
    }

    function updateHeartsVisual() {
        let html = '';
        for (let i = 0; i < hearts; i++) html += '❤️ ';
        for (let i = hearts; i < START_HEARTS; i++) html += '🖤 ';
        heartsVisual.innerHTML = html;
        if (hearts <= 3) heartsVisual.classList.add('low-hearts');
        else heartsVisual.classList.remove('low-hearts');
    }

    function updateHotCold() {
        if (gameWin) {
            hotColdMini.innerHTML = '✨ VICTORY! ✨';
            return;
        }
        if (!gameActive) {
            hotColdMini.innerHTML = '💀 GAME OVER 💀';
            return;
        }
        let dist = hexDist(monster.q, monster.r, treasure.q, treasure.r);
        if (dist === 0) hotColdMini.innerHTML = '💎 ON TREASURE! 💎';
        else if (dist <= 2) hotColdMini.innerHTML = '🔥 ON FIRE! ' + dist + ' steps';
        else if (dist <= 4) hotColdMini.innerHTML = '🟡 WARM... ' + dist + ' steps';
        else if (dist <= 6) hotColdMini.innerHTML = '😐 COOL... ' + dist + ' steps';
        else hotColdMini.innerHTML = '❄️ COLD! ' + dist + ' steps';
    }

    function hexDist(q1, r1, q2, r2) {
        let a = axialToCube(q1, r1);
        let b = axialToCube(q2, r2);
        return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
    }

    function axialToCube(q, r) {
        return { x: q, z: r, y: -q - r };
    }

    function axialToPixel(q, r) {
        let x = q * HEX_SIZE * 1.5 + originX;
        let y = r * HEX_H + (q % 2 === 0 ? 0 : HEX_H / 2) + originY;
        return { x, y };
    }

    function hexCorners(cx, cy) {
        let corners = [];
        for (let i = 0; i < 6; i++) {
            let angle = Math.PI / 2 + i * Math.PI / 3;
            corners.push({ x: cx + HEX_SIZE * Math.cos(angle), y: cy + HEX_SIZE * Math.sin(angle) });
        }
        return corners;
    }

    function buildGrid() {
        hexes.clear();
        for (let q = 0; q < GRID_W; q++) {
            for (let r = 0; r < GRID_H; r++) {
                let { x, y } = axialToPixel(q, r);
                hexes.set(`${q},${r}`, { q, r, cx: x, cy: y, corners: hexCorners(x, y) });
            }
        }
    }

    function centerCanvas() {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let q = 0; q < GRID_W; q++) {
            for (let r = 0; r < GRID_H; r++) {
                let { x, y } = axialToPixel(q, r);
                minX = Math.min(minX, x - HEX_SIZE);
                maxX = Math.max(maxX, x + HEX_SIZE);
                minY = Math.min(minY, y - HEX_SIZE);
                maxY = Math.max(maxY, y + HEX_SIZE);
            }
        }
        let offX = (canvas.width - (maxX - minX)) / 2 - minX;
        let offY = (canvas.height - (maxY - minY)) / 2 - minY;
        originX += offX;
        originY += offY;
        buildGrid();
    }

    function updateMoveRange() {
        moveRange.clear();
        let monsterCube = axialToCube(monster.q, monster.r);
        for (let q = 0; q < GRID_W; q++) {
            for (let r = 0; r < GRID_H; r++) {
                let cube = axialToCube(q, r);
                if (Math.max(Math.abs(monsterCube.x - cube.x), Math.abs(monsterCube.y - cube.y), Math.abs(monsterCube.z - cube.z)) <= MOVE_RANGE) {
                    moveRange.add(`${q},${r}`);
                }
            }
        }
        draw();
    }

    function loseHeart() {
        hearts--;
        updateUI();
        
        if (hearts <= 0) {
            gameActive = false;
            statusMsg.innerText = '💀 GAME OVER! YOU DIED! 💀';
            statusDetail.innerText = 'You ran out of hearts! Press RESET to try again!';
            draw();
            return true;
        }
        return false;
    }

    function tryMove(q, r) {
        if (!gameActive || gameWin) return false;
        let key = `${q},${r}`;
        
        if (!moveRange.has(key)) {
            statusMsg.innerText = '❌ TOO FAR! Cannot move there!';
            statusDetail.innerText = 'Only BRIGHT ORANGE hexes are valid moves!';
            return false;
        }
        
        if (monster.q === q && monster.r === r) {
            statusMsg.innerText = '❌ Cannot stay in same hex!';
            return false;
        }
        
        monster = { q, r };
        
        let heartLost = loseHeart();
        if (heartLost) {
            draw();
            return false;
        }
        
        if (!explored.has(key)) {
            explored.add(key);
            statusMsg.innerText = `🔥 MOVED to (${q},${r}) - HEART LOST! 🔥`;
            statusDetail.innerText = `${hearts} hearts remaining. Find the treasure!`;
        } else {
            statusMsg.innerText = `🔥 MOVED to (${q},${r}) - HEART LOST! 🔥`;
            statusDetail.innerText = `${hearts} hearts remaining. Find the treasure!`;
        }
        
        updateMoveRange();
        updateUI();
        
        if (monster.q === treasure.q && monster.r === treasure.r) {
            gameWin = true;
            gameActive = false;
            statusMsg.innerText = '🎉 VICTORY! YOU FOUND THE HIDDEN TREASURE! 🎉';
            statusDetail.innerText = `You found it with ${hearts} hearts remaining! Amazing!`;
            draw();
            return true;
        }
        
        draw();
        return true;
    }

    function resetGame() {
        monster = { q: 5, r: 5 };
        selectedHex = null;
        hoverHex = null;
        explored.clear();
        hearts = START_HEARTS;
        gameActive = true;
        gameWin = false;
        
        do {
            treasure = { q: Math.floor(Math.random() * GRID_W), r: Math.floor(Math.random() * GRID_H) };
        } while (treasure.q === monster.q && treasure.r === monster.r);
        
        explored.add(`${monster.q},${monster.r}`);
        updateMoveRange();
        updateUI();
        statusMsg.innerText = '🔄 GAME RESET! Find the HIDDEN treasure!';
        statusDetail.innerText = '⚠️ EVERY MOVE COSTS 1 HEART! You have 10 moves! ⚠️';
        draw();
    }

    function getHexColor(h) {
        if (!gameActive && !gameWin) return '#4a1515';
        let key = `${h.q},${h.r}`;
        let isMonster = (monster.q === h.q && monster.r === h.r);
        let isSelected = (selectedHex && selectedHex.q === h.q && selectedHex.r === h.r);
        let isHover = (hoverHex && hoverHex.q === h.q && hoverHex.r === h.r);
        let inRange = moveRange.has(key);
        
        if (isMonster) return '#ff2200';
        if (isSelected) return '#ff8844';
        if (isHover && gameActive) return '#ffaa66';
        if (inRange && gameActive) return '#ff6600';
        return '#8b1a1a';
    }

    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1a0202';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let [key, h] of hexes) {
            ctx.beginPath();
            ctx.moveTo(h.corners[0].x, h.corners[0].y);
            for (let i = 1; i < h.corners.length; i++) ctx.lineTo(h.corners[i].x, h.corners[i].y);
            ctx.closePath();
            ctx.fillStyle = getHexColor(h);
            ctx.fill();
            ctx.strokeStyle = '#ff8844';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // TREASURE IS HIDDEN - NEVER DRAW IT!
            
            if (monster.q === h.q && monster.r === h.r && gameActive) {
                ctx.font = '24px "Segoe UI Emoji"';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText('👾', h.cx - 10, h.cy + 8);
            }
            
            if (selectedHex && selectedHex.q === h.q && selectedHex.r === h.r && !(monster.q === h.q && monster.r === h.r)) {
                ctx.fillStyle = '#FFD700';
                ctx.font = '14px monospace';
                ctx.fillText('★', h.cx - 4, h.cy + 5);
            }
        }
        
        if (gameWin) {
            ctx.font = 'bold 28px monospace';
            ctx.fillStyle = '#FFD700';
            ctx.shadowBlur = 15;
            ctx.fillText('✨ VICTORY! ✨', canvas.width/2 - 75, canvas.height/2);
            ctx.shadowBlur = 0;
        } else if (!gameActive && !gameWin) {
            ctx.font = 'bold 24px monospace';
            ctx.fillStyle = '#ff4444';
            ctx.fillText('💀 GAME OVER 💀', canvas.width/2 - 75, canvas.height/2);
        }
    }
    
    function pointInPoly(px, py, verts) {
        let inside = false;
        for (let i = 0, j = verts.length-1; i < verts.length; j = i++) {
            let xi = verts[i].x, yi = verts[i].y;
            let xj = verts[j].x, yj = verts[j].y;
            let intersect = ((yi > py) != (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
    
    function getHexAt(e) {
        let rect = canvas.getBoundingClientRect();
        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;
        let mx = (e.clientX - rect.left) * scaleX;
        let my = (e.clientY - rect.top) * scaleY;
        for (let [key, h] of hexes) {
            if (pointInPoly(mx, my, h.corners)) return { q: h.q, r: h.r };
        }
        return null;
    }
    
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    buildGrid();
    centerCanvas();
    
    do {
        treasure = { q: Math.floor(Math.random() * GRID_W), r: Math.floor(Math.random() * GRID_H) };
    } while (treasure.q === monster.q && treasure.r === monster.r);
    
    explored.add(`${monster.q},${monster.r}`);
    updateMoveRange();
    updateUI();
    
    canvas.addEventListener('mousemove', (e) => {
        if (!gameActive && !gameWin) return;
        let hex = getHexAt(e);
        if (hex) {
            if (!hoverHex || hoverHex.q !== hex.q || hoverHex.r !== hex.r) {
                hoverHex = hex;
                draw();
            }
        } else if (hoverHex) {
            hoverHex = null;
            draw();
        }
    });
    
    canvas.addEventListener('click', (e) => {
        if (!gameActive) return;
        let hex = getHexAt(e);
        if (!hex) return;
        if (moveRange.has(`${hex.q},${hex.r}`)) {
            tryMove(hex.q, hex.r);
            selectedHex = { q: monster.q, r: monster.r };
        } else {
            selectedHex = hex;
            statusMsg.innerText = `📍 SELECTED (${hex.q},${hex.r})`;
            statusDetail.innerText = 'Click a BRIGHT ORANGE hex to move!';
        }
        draw();
    });
    
    document.getElementById('deselectBtn').onclick = () => {
        selectedHex = null;
        statusMsg.innerText = '⭐ HEX DESELECTED';
        draw();
    };
    
    document.getElementById('resetBtn').onclick = () => resetGame();
    
    document.getElementById('navRules').onclick = (e) => {
        e.preventDefault();
        document.getElementById('rulesModal').style.display = 'flex';
    };
    
    document.getElementById('closeModalBtn').onclick = () => {
        document.getElementById('rulesModal').style.display = 'none';
    };
    
    window.onclick = (e) => {
        if (e.target === document.getElementById('rulesModal')) {
            document.getElementById('rulesModal').style.display = 'none';
        }
    };
})();