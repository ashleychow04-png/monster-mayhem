(function () {

    // waits for html to fully load first
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChallengeMode);
    } else {
        initChallengeMode();
    }

    function initChallengeMode() {

        // ----- DOM ELEMENTS -----
        // gets html elements from page
        const canvas = document.getElementById('hexCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const statusMsgSpan = document.getElementById('gameStatus');
        const statusDetailSpan = document.getElementById('statusDetail');

        const exploredCountEl = document.getElementById('exploredCount');
        const timeLeftDisplay = document.getElementById('timeLeftDisplay');

        const treasureStatusEl = document.getElementById('treasureStatus');
        const hotColdSpan = document.getElementById('hotColdHint');

        // ----- GAME SETTINGS -----
        const GRID_WIDTH = 10;
        const GRID_HEIGHT = 10;

        const HEX_SIZE = 34;
        const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

        const MOVE_RANGE = 2;

        const INITIAL_TIME_SEC = 45;

        // board positioning
        let originX = 120;
        let originY = 80;

        // ----- GAME STATE -----
        let hexagons = new Map();

        let hoveredHex = null;
        let selectedHex = null;

        let monsterPos = { q: 5, r: 5 };

        let currentMoveRange = new Set();
        let exploredHexes = new Set();

        let gameActive = true;
        let gameWin = false;

        let treasurePos = null;

        // timer variables
        let timeLeft = INITIAL_TIME_SEC;
        let timerInterval = null;

        // canvas size
        canvas.width = 850;
        canvas.height = 650;

        // ----------------------------------
        // UPDATE UI
        // refreshes score/timer/hints
        // ----------------------------------
        function updateUI() {

            if (exploredCountEl) {
                exploredCountEl.textContent = exploredHexes.size;
            }

            if (timeLeftDisplay) {

                timeLeftDisplay.textContent = timeLeft;

                // red warning effect
                if (timeLeft <= 8) {
                    timeLeftDisplay.classList.add('timer-warning');
                } else {
                    timeLeftDisplay.classList.remove('timer-warning');
                }
            }

            if (treasureStatusEl) {

                if (gameWin) {
                    treasureStatusEl.innerHTML = '✨ FOUND ✨';
                }

                else if (!gameActive) {
                    treasureStatusEl.innerHTML = '💀 TIME LOST';
                }

                else {
                    treasureStatusEl.innerHTML = '❓ HIDDEN';
                }
            }

            updateHotCold();
        }

        // ----------------------------------
        // STATUS MESSAGE
        // changes text under board
        // ----------------------------------
        function updateStatus(message, type = 'info') {

            if (statusMsgSpan) {
                statusMsgSpan.textContent = message.toUpperCase();
            }

            if (statusDetailSpan) {

                if (type === 'victory') {
                    statusDetailSpan.textContent =
                        '🏆 AMAZING! YOU FOUND IT BEFORE TIMER! 🏆';
                }

                else if (type === 'defeat') {
                    statusDetailSpan.textContent =
                        '⏰ TIME EXPIRED – TREASURE LOST ⏰';
                }

                else {
                    statusDetailSpan.textContent =
                        '⚡ Move quickly! Timer is running.';
                }
            }
        }

        // ----------------------------------
        // HOT/COLD SYSTEM
        // tells player distance to treasure
        // ----------------------------------
        function updateHotCold() {

            if (!hotColdSpan) return;

            if (gameWin) {

                hotColdSpan.innerHTML = '✨ VICTORY! ✨';
                hotColdSpan.style.color = '#0ff';

                return;
            }

            if (!gameActive || !treasurePos) {

                hotColdSpan.innerHTML =
                    '⏰ GAME OVER – TIME RAN OUT';

                return;
            }

            const dist = hexDistance(
                monsterPos.q,
                monsterPos.r,
                treasurePos.q,
                treasurePos.r
            );

            let hint = '';
            let color = '#0ff';

            if (dist === 0) {
                hint = '💎 TREASURE RIGHT HERE!';
            }

            else if (dist <= 2) {
                hint = '🔥 NUCLEAR HOT! 1-2 steps!';
                color = '#fa0';
            }

            else if (dist <= 4) {
                hint = '🟡 WARM ... getting close';
                color = '#fd7';
            }

            else if (dist <= 6) {
                hint = '😐 COOL .. not near';
                color = '#8cf';
            }

            else {
                hint = '❄️ FREEZING COLD! far away!';
                color = '#69f';
            }

            hotColdSpan.innerHTML =
                hint + ` (${dist} steps)`;

            hotColdSpan.style.color = color;
        }

        // ----------------------------------
        // HEXAGON MATH
        // calculates distance
        // ----------------------------------
        function axialToCube(q, r) {
            return {
                x: q,
                z: r,
                y: -q - r
            };
        }

        function cubeDistance(a, b) {

            return Math.max(
                Math.abs(a.x - b.x),
                Math.abs(a.y - b.y),
                Math.abs(a.z - b.z)
            );
        }

        function hexDistance(q1, r1, q2, r2) {

            return cubeDistance(
                axialToCube(q1, r1),
                axialToCube(q2, r2)
            );
        }

        // ----------------------------------
        // HEX POSITION
        // converts grid to pixels
        // ----------------------------------
        function axialToPixel(q, r) {

            const x =
                (q * HEX_SIZE * 1.5) + originX;

            const y =
                (r * HEX_HEIGHT) +
                (q % 2 === 0 ? 0 : HEX_HEIGHT / 2) +
                originY;

            return { x, y };
        }

        // ----------------------------------
        // HEX CORNERS
        // creates 6 sided hexagon shape
        // ----------------------------------
        function computeHexCorners(cx, cy) {

            const corners = [];

            for (let i = 0; i < 6; i++) {

                const angle =
                    Math.PI / 2 + (i * Math.PI / 3);

                const x =
                    cx + HEX_SIZE * Math.cos(angle);

                const y =
                    cy + HEX_SIZE * Math.sin(angle);

                corners.push({ x, y });
            }

            return corners;
        }

        // ----------------------------------
        // BUILD GRID
        // creates all board hexes
        // ----------------------------------
        function buildHexGrid() {

            hexagons.clear();

            for (let q = 0; q < GRID_WIDTH; q++) {

                for (let r = 0; r < GRID_HEIGHT; r++) {

                    const { x, y } =
                        axialToPixel(q, r);

                    const corners =
                        computeHexCorners(x, y);

                    hexagons.set(`${q},${r}`, {
                        q,
                        r,
                        centerX: x,
                        centerY: y,
                        corners
                    });
                }
            }
        }

        // ----------------------------------
        // CENTER GRID
        // moves board to middle
        // ----------------------------------
        function centerGrid() {

            let minX = Infinity;
            let maxX = -Infinity;

            let minY = Infinity;
            let maxY = -Infinity;

            for (let q = 0; q < GRID_WIDTH; q++) {

                for (let r = 0; r < GRID_HEIGHT; r++) {

                    const { x, y } =
                        axialToPixel(q, r);

                    minX = Math.min(minX, x - HEX_SIZE);
                    maxX = Math.max(maxX, x + HEX_SIZE);

                    minY = Math.min(minY, y - HEX_SIZE);
                    maxY = Math.max(maxY, y + HEX_SIZE);
                }
            }

            const gridWidth = maxX - minX;
            const gridHeight = maxY - minY;

            const offsetX =
                (canvas.width - gridWidth) / 2 - minX;

            const offsetY =
                (canvas.height - gridHeight) / 2 - minY;

            originX += offsetX;
            originY += offsetY;

            buildHexGrid();
        }

        // ----------------------------------
        // MOVEMENT RANGE
        // green movement tiles
        // ----------------------------------
        function computeMoveRangeFromMonster() {

            const rangeSet = new Set();

            const monsterCube =
                axialToCube(monsterPos.q, monsterPos.r);

            for (let q = 0; q < GRID_WIDTH; q++) {

                for (let r = 0; r < GRID_HEIGHT; r++) {

                    const cube = axialToCube(q, r);

                    if (
                        cubeDistance(monsterCube, cube)
                        <= MOVE_RANGE
                    ) {
                        rangeSet.add(`${q},${r}`);
                    }
                }
            }

            return rangeSet;
        }

        function updateMovementRange() {

            currentMoveRange =
                computeMoveRangeFromMonster();

            drawBoard();
        }

        // ----------------------------------
        // CHECK WIN/LOSE
        // ----------------------------------
        function checkWinLose() {

            // WIN
            if (
                monsterPos.q === treasurePos.q &&
                monsterPos.r === treasurePos.r &&
                !gameWin &&
                gameActive
            ) {

                gameWin = true;
                gameActive = false;

                clearInterval(timerInterval);

                updateStatus(
                    'VICTORY! BEAT THE TIMER!',
                    'victory'
                );

                updateUI();
                drawBoard();

                return true;
            }

            // LOSE
            if (
                timeLeft <= 0 &&
                !gameWin &&
                gameActive
            ) {

                gameActive = false;
                gameWin = false;

                clearInterval(timerInterval);

                updateStatus(
                    'TIME EXPIRED – GAME OVER',
                    'defeat'
                );

                updateUI();
                drawBoard();

                return false;
            }

            return false;
        }

        // ----------------------------------
        // TIMER
        // countdown every second
        // ----------------------------------
        function startTimer() {

            clearInterval(timerInterval);

            timerInterval = setInterval(() => {

                if (!gameActive || gameWin) return;

                if (timeLeft <= 1) {

                    timeLeft = 0;

                    updateUI();
                    checkWinLose();

                    clearInterval(timerInterval);

                    drawBoard();
                }

                else {

                    timeLeft--;

                    updateUI();
                    checkWinLose();

                    drawBoard();
                }

            }, 1000);
        }

        // ----------------------------------
        // MOVE MONSTER
        // ----------------------------------
        function tryMoveMonsterTo(q, r) {

            if (!gameActive) return false;

            const key = `${q},${r}`;

            if (!currentMoveRange.has(key)) {

                updateStatus('Out of range!', 'error');

                return false;
            }

            monsterPos = { q, r };

            if (!exploredHexes.has(key)) {
                exploredHexes.add(key);
            }

            updateMovementRange();
            updateUI();

            const finished = checkWinLose();

            if (!finished) {

                updateStatus(
                    `⚡ MOVED to (${q},${r})`,
                    'success'
                );
            }

            drawBoard();

            return true;
        }

        // ----------------------------------
        // RESET GAME
        // ----------------------------------
        function resetGame() {

            clearInterval(timerInterval);

            monsterPos = { q: 5, r: 5 };

            selectedHex = null;
            hoveredHex = null;

            exploredHexes.clear();

            timeLeft = INITIAL_TIME_SEC;

            gameActive = true;
            gameWin = false;

            // random treasure
            let validTreasure = false;

            while (!validTreasure) {

                const randQ =
                    Math.floor(Math.random() * GRID_WIDTH);

                const randR =
                    Math.floor(Math.random() * GRID_HEIGHT);

                if (
                    !(randQ === monsterPos.q &&
                    randR === monsterPos.r)
                ) {

                    treasurePos = {
                        q: randQ,
                        r: randR
                    };

                    validTreasure = true;
                }
            }

            exploredHexes.add(
                `${monsterPos.q},${monsterPos.r}`
            );

            updateMovementRange();

            updateUI();

            startTimer();

            updateStatus(
                'TIMER RESET! 45 seconds!',
                'success'
            );

            drawBoard();
        }

        // DRAW BOARD
        // draws all hexagons
        function drawBoard() {

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.fillStyle = "#031016";

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            for (let hex of hexagons.values()) {
                drawHexagon(hex);
            }
        }

        // ----------------------------------
        // HEX COLORS
        // ----------------------------------
        function getHexColor(hex) {

            const hasMonster =
                (
                    monsterPos.q === hex.q &&
                    monsterPos.r === hex.r
                );

            const isHovered =
                (
                    hoveredHex &&
                    hoveredHex.q === hex.q &&
                    hoveredHex.r === hex.r
                );

            const isInRange =
                currentMoveRange.has(`${hex.q},${hex.r}`);

            if (hasMonster) return "#d93f21";

            if (isHovered) return "#c9e265";

            if (isInRange) return "#2fbf71";

            return (
                (hex.q + hex.r) % 2 === 0
            )
                ? "#2b7a5e"
                : "#1e5f4b";
        }
        // DRAW SINGLE HEX
        function drawHexagon(hex) {

            const {
                corners,
                centerX,
                centerY,
                q,
                r
            } = hex;

            ctx.beginPath();

            ctx.moveTo(
                corners[0].x,
                corners[0].y
            );

            for (let i = 1; i < corners.length; i++) {

                ctx.lineTo(
                    corners[i].x,
                    corners[i].y
                );
            }

            ctx.closePath();

            ctx.fillStyle = getHexColor(hex);

            ctx.fill();

            ctx.strokeStyle = "#5fffd6";
            ctx.lineWidth = 1.8;

            ctx.stroke();

            // draw monster
            if (
                monsterPos.q === q &&
                monsterPos.r === r
            ) {

                ctx.font =
                    `bold ${HEX_SIZE * 0.6}px "Segoe UI Emoji"`;

                ctx.fillStyle = "#fff5d0";

                ctx.fillText(
                    "👾",
                    centerX - 11,
                    centerY + 9
                );
            }

            // show treasure after win
            if (
                gameWin &&
                treasurePos &&
                treasurePos.q === q &&
                treasurePos.r === r
            ) {

                ctx.font =
                    `${HEX_SIZE * 0.55}px "Segoe UI Emoji"`;

                ctx.fillStyle = "#FFD966";

                ctx.fillText(
                    "💎",
                    centerX - 10,
                    centerY + 8
                );
            }
        }

        // CHECK MOUSE OVER HEX
        function isPointInPolygon(px, py, vertices) {

            let inside = false;

            for (
                let i = 0,
                j = vertices.length - 1;

                i < vertices.length;

                j = i++
            ) {

                const xi = vertices[i].x;
                const yi = vertices[i].y;

                const xj = vertices[j].x;
                const yj = vertices[j].y;

                const intersect =
                    ((yi > py) !== (yj > py))
                    &&
                    (
                        px <
                        (
                            (xj - xi) *
                            (py - yi)
                        ) /
                        (yj - yi)
                        + xi
                    );

                if (intersect) {
                    inside = !inside;
                }
            }

            return inside;
        }

        // ----------------------------------
        // GET CLICKED HEX
        // ----------------------------------
        function getHexAtPixel(mx, my) {

            for (let [key, hex] of hexagons.entries()) {

                if (
                    isPointInPolygon(
                        mx,
                        my,
                        hex.corners
                    )
                ) {

                    return {
                        q: hex.q,
                        r: hex.r
                    };
                }
            }

            return null;
        }

        // ----------------------------------
        // MOUSE MOVE
        // hover effect
        // ----------------------------------
        function handleMouseMove(e) {

            const rect =
                canvas.getBoundingClientRect();

            const scaleX =
                canvas.width / rect.width;

            const scaleY =
                canvas.height / rect.height;

            let mx =
                (e.clientX - rect.left) * scaleX;

            let my =
                (e.clientY - rect.top) * scaleY;

            const hex =
                getHexAtPixel(mx, my);

            if (hex) {

                hoveredHex = hex;

                drawBoard();
            }
        }

        // ----------------------------------
        // CLICK EVENT
        // move player
        // ----------------------------------
        function handleClick(e) {

            if (!gameActive) return;

            const rect =
                canvas.getBoundingClientRect();

            const scaleX =
                canvas.width / rect.width;

            const scaleY =
                canvas.height / rect.height;

            let mx =
                (e.clientX - rect.left) * scaleX;

            let my =
                (e.clientY - rect.top) * scaleY;

            const hex =
                getHexAtPixel(mx, my);

            if (!hex) return;

            if (
                currentMoveRange.has(
                    `${hex.q},${hex.r}`
                )
            ) {

                tryMoveMonsterTo(
                    hex.q,
                    hex.r
                );

                selectedHex = {
                    q: monsterPos.q,
                    r: monsterPos.r
                };

                drawBoard();
            }
        }

        // ----------------------------------
        // DESELECT BUTTON
        // ----------------------------------
        function deselectHex() {

            selectedHex = null;

            drawBoard();
        }

        // ----------------------------------
        // MODAL
        // ----------------------------------
        function showInfo() {

            document.getElementById(
                'infoModal'
            ).style.display = 'flex';
        }

        function closeModal() {

            document.getElementById(
                'infoModal'
            ).style.display = 'none';
        }

        // ----------------------------------
        // START GAME
        // ----------------------------------
        function initGame() {

            buildHexGrid();

            centerGrid();

            // random treasure location
            do {

                treasurePos = {
                    q: Math.floor(Math.random() * GRID_WIDTH),
                    r: Math.floor(Math.random() * GRID_HEIGHT)
                };

            }

            while (
                treasurePos.q === monsterPos.q &&
                treasurePos.r === monsterPos.r
            );

            exploredHexes.add(
                `${monsterPos.q},${monsterPos.r}`
            );

            currentMoveRange =
                computeMoveRangeFromMonster();

            updateUI();

            drawBoard();

            startTimer();

            // event listeners
            canvas.addEventListener(
                'mousemove',
                handleMouseMove
            );

            canvas.addEventListener(
                'click',
                handleClick
            );

            document
                .getElementById('deselectBtn')
                ?.addEventListener(
                    'click',
                    deselectHex
                );

            document
                .getElementById('resetBtn')
                ?.addEventListener(
                    'click',
                    resetGame
                );

            document
                .getElementById('infoBtn')
                ?.addEventListener(
                    'click',
                    showInfo
                );

            document
                .querySelector('.modal-close-btn')
                ?.addEventListener(
                    'click',
                    closeModal
                );

            window.addEventListener('click', (e) => {

                if (
                    e.target ===
                    document.getElementById('infoModal')
                ) {

                    closeModal();
                }
            });

            updateStatus(
                'TIMED CHALLENGE! FIND THE 💎',
                'success'
            );
        }

        // starts game
        initGame();
    }

})();
