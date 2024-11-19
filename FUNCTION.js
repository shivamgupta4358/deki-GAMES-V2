// Navigation and UI Logic
function showGame(gameId) {
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('game-view').style.display = 'block';
    
    // Hide all game containers
    document.querySelectorAll('.game-container').forEach(container => {
        container.style.display = 'none';
    });
    
    // Show selected game
    document.getElementById(gameId).style.display = 'block';
    
    // Initialize specific game
    switch(gameId) {
        case 'pingpong':
            initPingPong();
            break;
        case 'snake':
            initSnake();
            break;
        case 'memory':
            startMemory();
            break;
        case 'game2048':
            init2048();
            break;
        case 'breakout':
            initBreakout();
            break;
        case 'runner':
            initRunner();
            break;
    }
}

function backToHome() {
    document.getElementById('home-view').style.display = 'block';
    document.getElementById('game-view').style.display = 'none';
}

// Category Filter Logic
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.category-item').forEach(i => 
            i.classList.remove('active'));
        item.classList.add('active');

        const category = item.textContent.toLowerCase();
        document.querySelectorAll('.game-card').forEach(card => {
            if (category === 'all games' || 
                card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// Search Logic
document.querySelector('.search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.game-card').forEach(card => {
        const title = card.querySelector('.game-title').textContent.toLowerCase();
        const description = card.querySelector('.game-description')
            .textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Leaderboard System
const leaderboardSystem = {
    data: {},
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.showLeaderboard('all', 'all');
    },

    loadData() {
        const saved = localStorage.getItem('dekiGamesLeaderboard');
        this.data = saved ? JSON.parse(saved) : {
            tictactoe: [],
            pingpong: [],
            snake: [],
            memory: [],
            '2048': [],
            breakout: [],
            runner: []
        };
    },

    saveData() {
        localStorage.setItem('dekiGamesLeaderboard', JSON.stringify(this.data));
    },

    addScore(game, score, playerName) {
        if (!playerName) return;
        
        const entry = {
            name: playerName,
            score: score,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        if (!this.data[game]) {
            this.data[game] = [];
        }

        this.data[game].push(entry);
        this.data[game].sort((a, b) => b.score - a.score);
        this.data[game] = this.data[game].slice(0, 100); // Keep top 100 scores
        this.saveData();
        this.showLeaderboard(game, 'all');
    },

    getScores(game, period) {
        let scores = [];
        if (game === 'all') {
            Object.keys(this.data).forEach(g => {
                scores = scores.concat(this.data[g].map(score => ({...score, game: g})));
            });
        } else {
            scores = this.data[game] || [];
        }

        const now = Date.now();
        switch (period) {
            case 'today':
                scores = scores.filter(score => 
                    (now - score.timestamp) < 86400000);
                break;
            case 'week':
                scores = scores.filter(score => 
                    (now - score.timestamp) < 604800000);
                break;
            case 'month':
                scores = scores.filter(score => 
                    (now - score.timestamp) < 2592000000);
                break;
        }

        return scores.sort((a, b) => b.score - a.score).slice(0, 10);
    },

    showLeaderboard(game, period) {
        const scores = this.getScores(game, period);
        const list = document.querySelector('.leaderboard-list');
        list.innerHTML = '';

        if (scores.length === 0) {
            list.innerHTML = '<div class="no-scores">No scores available</div>';
            return;
        }

        scores.forEach((score, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="rank">#${index + 1}</div>
                <div class="player-name">${score.name}</div>
                <div class="score">${score.score}</div>
                <div class="date">${new Date(score.date).toLocaleDateString()}</div>
            `;
            list.appendChild(item);
        });
    },

    setupEventListeners() {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(b => 
                    b.classList.remove('active'));
                button.classList.add('active');
                const game = button.dataset.game;
                const period = document.querySelector('.filter-button.active')
                    .dataset.period;
                this.showLeaderboard(game, period);
            });
        });

        document.querySelectorAll('.filter-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-button').forEach(b => 
                    b.classList.remove('active'));
                button.classList.add('active');
                const game = document.querySelector('.tab-button.active')
                    .dataset.game;
                const period = button.dataset.period;
                this.showLeaderboard(game, period);
            });
        });
    }
};
// Tic Tac Toe Logic
let currentPlayer = 'X';
let board = Array(9).fill('');
let gameActive = true;
let scores = { X: 0, O: 0, player: 0, computer: 0 };
let isComputerMode = false;

function switchGameMode(mode) {
    isComputerMode = mode === 'pvc';
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    document.querySelectorAll('.pvp-score').forEach(score => {
        score.style.display = isComputerMode ? 'none' : 'block';
    });
    document.querySelectorAll('.pvc-score').forEach(score => {
        score.style.display = isComputerMode ? 'block' : 'none';
    });
    resetTicTacToe();
}

document.querySelectorAll('.mode-button').forEach(button => {
    button.addEventListener('click', () => switchGameMode(button.dataset.mode));
});

function makeMove(index) {
    if (board[index] === '' && gameActive) {
        board[index] = currentPlayer;
        document.getElementsByClassName('cell')[index].textContent = currentPlayer;
        
        if (checkWinner()) {
            handleWin();
        } else if (board.every(cell => cell !== '')) {
            handleDraw();
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            if (isComputerMode && currentPlayer === 'O') {
                setTimeout(makeComputerMove, 500);
            }
        }
    }
}

function makeComputerMove() {
    if (!gameActive) return;
    
    // Try to win
    const winMove = findBestMove('O');
    if (winMove !== -1) {
        makeMove(winMove);
        return;
    }
    
    // Block player from winning
    const blockMove = findBestMove('X');
    if (blockMove !== -1) {
        makeMove(blockMove);
        return;
    }
    
    // Take center if available
    if (board[4] === '') {
        makeMove(4);
        return;
    }
    
    // Take random available corner
    const corners = [0, 2, 6, 8].filter(i => board[i] === '');
    if (corners.length > 0) {
        makeMove(corners[Math.floor(Math.random() * corners.length)]);
        return;
    }
    
    // Take random available side
    const sides = [1, 3, 5, 7].filter(i => board[i] === '');
    if (sides.length > 0) {
        makeMove(sides[Math.floor(Math.random() * sides.length)]);
    }
}

function findBestMove(player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    
    for (let pattern of winPatterns) {
        const line = pattern.map(i => board[i]);
        const playerCount = line.filter(cell => cell === player).length;
        const emptyCount = line.filter(cell => cell === '').length;
        
        if (playerCount === 2 && emptyCount === 1) {
            return pattern[line.indexOf('')];
        }
    }
    
    return -1;
}

function checkWinner() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return winPatterns.some(pattern => 
        pattern.every(index => board[index] === currentPlayer));
}

function handleWin() {
    if (isComputerMode) {
        if (currentPlayer === 'X') {
            scores.player++;
            document.getElementById('scorePlayer').textContent = scores.player;
        } else {
            scores.computer++;
            document.getElementById('scoreComputer').textContent = scores.computer;
        }
    } else {
        scores[currentPlayer]++;
        document.getElementById(`score${currentPlayer}`).textContent = scores[currentPlayer];
    }
    gameActive = false;
    setTimeout(() => {
        alert(`${isComputerMode && currentPlayer === 'O' ? 'Computer' : `Player ${currentPlayer}`} wins!`);
        leaderboardSystem.addScore('tictactoe', scores[currentPlayer], 
            prompt('Enter your name for the leaderboard:'));
    }, 100);
}

function handleDraw() {
    gameActive = false;
    setTimeout(() => {
        alert("It's a draw!");
    }, 100);
}

function resetTicTacToe() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;
    document.querySelectorAll('.cell').forEach(cell => cell.textContent = '');
}

// Ping Pong Logic
let pingpongCanvas, ctx;
let ballX, ballY, ballSpeedX, ballSpeedY;
let paddle1Y, paddle2Y;
let paddle1Speed = 0;
let score = 0;
let highScore = 0;
const PADDLE_SPEED = 5;

function initPingPong() {
    pingpongCanvas = document.getElementById('pingpongCanvas');
    ctx = pingpongCanvas.getContext('2d');
    
    document.addEventListener('keydown', handlePingPongKeyDown);
    document.addEventListener('keyup', handlePingPongKeyUp);
    
    resetPingPong();
}

function resetPingPong() {
    ballX = pingpongCanvas.width / 2;
    ballY = pingpongCanvas.height / 2;
    ballSpeedX = 5;
    ballSpeedY = 2;
    paddle1Y = paddle2Y = (pingpongCanvas.height - 100) / 2;
    score = 0;
    updatePingPongScore();
}

function handlePingPongKeyDown(e) {
    switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            paddle1Speed = -PADDLE_SPEED;
            break;
        case 's':
        case 'arrowdown':
            paddle1Speed = PADDLE_SPEED;
            break;
    }
}

function handlePingPongKeyUp(e) {
    switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
        case 's':
        case 'arrowdown':
            paddle1Speed = 0;
            break;
    }
}

function startPingPong() {
    resetPingPong();
    requestAnimationFrame(updatePingPong);
}

function updatePingPong() {
    // Update paddle position
    paddle1Y += paddle1Speed;
    paddle1Y = Math.max(0, Math.min(pingpongCanvas.height - 100, paddle1Y));
    
    // Move ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    
    // AI paddle movement
    paddle2Y += (ballY - (paddle2Y + 50)) * 0.1;
    
    // Ball collision with top and bottom
    if (ballY < 0 || ballY > pingpongCanvas.height) {
        ballSpeedY = -ballSpeedY;
    }
    
    // Ball collision with paddles
    if (ballX < 20 && ballY > paddle1Y && ballY < paddle1Y + 100) {
        ballSpeedX = -ballSpeedX;
        score++;
        updatePingPongScore();
    }
    if (ballX > pingpongCanvas.width - 20 && ballY > paddle2Y && 
        ballY < paddle2Y + 100) {
        ballSpeedX = -ballSpeedX;
    }
    
    // Ball out of bounds
    if (ballX < 0 || ballX > pingpongCanvas.width) {
        if (score > highScore) {
            highScore = score;
            document.getElementById('pingpongHighScore').textContent = highScore;
            leaderboardSystem.addScore('pingpong', score, 
                prompt('New high score! Enter your name:'));
        }
        resetPingPong();
    }
    
    // Draw everything
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, pingpongCanvas.width, pingpongCanvas.height);
    
    ctx.fillStyle = 'white';
    // Draw paddles
    ctx.fillRect(10, paddle1Y, 10, 100);
    ctx.fillRect(pingpongCanvas.width - 20, paddle2Y, 10, 100);
    // Draw ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    requestAnimationFrame(updatePingPong);
}

function updatePingPongScore() {
    document.getElementById('pingpongScore').textContent = score;
}
// Snake Game Logic
let snake = [];
let food = {};
let direction = 'right';
let snakeCanvas, snakeCtx;
let snakeScore = 0;
let snakeHighScore = 0;

function initSnake() {
    snakeCanvas = document.getElementById('snakeCanvas');
    snakeCtx = snakeCanvas.getContext('2d');
    resetSnake();
}

function resetSnake() {
    snake = [
        {x: 200, y: 200},
        {x: 190, y: 200},
        {x: 180, y: 200}
    ];
    direction = 'right';
    snakeScore = 0;
    createFood();
    updateSnakeScore();
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * (snakeCanvas.width/10)) * 10,
        y: Math.floor(Math.random() * (snakeCanvas.height/10)) * 10
    };
}

function startSnake() {
    resetSnake();
    if (window.snakeInterval) clearInterval(window.snakeInterval);
    window.snakeInterval = setInterval(updateSnake, 100);
    
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp': if(direction !== 'down') direction = 'up'; break;
            case 'ArrowDown': if(direction !== 'up') direction = 'down'; break;
            case 'ArrowLeft': if(direction !== 'right') direction = 'left'; break;
            case 'ArrowRight': if(direction !== 'left') direction = 'right'; break;
        }
    });
}

function updateSnake() {
    const head = {x: snake[0].x, y: snake[0].y};
    
    switch(direction) {
        case 'up': head.y -= 10; break;
        case 'down': head.y += 10; break;
        case 'left': head.x -= 10; break;
        case 'right': head.x += 10; break;
    }
    
    if (head.x === food.x && head.y === food.y) {
        createFood();
        snakeScore += 10;
        updateSnakeScore();
    } else {
        snake.pop();
    }
    
    if (checkSnakeCollision(head)) {
        if (snakeScore > snakeHighScore) {
            snakeHighScore = snakeScore;
            document.getElementById('snakeHighScore').textContent = snakeHighScore;
            leaderboardSystem.addScore('snake', snakeScore, 
                prompt('New high score! Enter your name:'));
        }
        clearInterval(window.snakeInterval);
        setTimeout(() => {
            alert('Game Over! Score: ' + snakeScore);
        }, 100);
        return;
    }
    
    snake.unshift(head);
    drawSnake();
}

function checkSnakeCollision(head) {
    return head.x < 0 || head.x >= snakeCanvas.width || 
           head.y < 0 || head.y >= snakeCanvas.height ||
           snake.some(segment => segment.x === head.x && segment.y === head.y);
}

function drawSnake() {
    snakeCtx.fillStyle = 'black';
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    
    // Draw snake with gradient effect
    snake.forEach((segment, index) => {
        const gradient = snakeCtx.createLinearGradient(
            segment.x, segment.y, 
            segment.x + 10, segment.y + 10
        );
        gradient.addColorStop(0, '#4ecca3');
        gradient.addColorStop(1, '#45b393');
        snakeCtx.fillStyle = gradient;
        snakeCtx.shadowBlur = 15;
        snakeCtx.shadowColor = '#4ecca3';
        snakeCtx.fillRect(segment.x, segment.y, 10, 10);
    });
    
    // Draw food with glow effect
    snakeCtx.fillStyle = '#ff3366';
    snakeCtx.shadowBlur = 15;
    snakeCtx.shadowColor = '#ff3366';
    snakeCtx.beginPath();
    snakeCtx.arc(food.x + 5, food.y + 5, 5, 0, Math.PI * 2);
    snakeCtx.fill();
}

function updateSnakeScore() {
    document.getElementById('snakeScore').textContent = snakeScore;
}

// Memory Game Logic
const MEMORY_SYMBOLS = ['🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎪', '🎯'];
let memoryCards = [];
let flippedCards = [];
let moves = 0;
let matchedPairs = 0;
let bestScore = Infinity;

function startMemory() {
    moves = 0;
    matchedPairs = 0;
    document.getElementById('memoryMoves').textContent = moves;
    initMemoryBoard();
}

function initMemoryBoard() {
    const grid = document.querySelector('.memory-grid');
    grid.innerHTML = '';
    memoryCards = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS]
        .sort(() => Math.random() - 0.5);
    
    memoryCards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.symbol = symbol;
        card.addEventListener('click', flipCard);
        
        // Add 3D effect
        card.style.transform = 'perspective(1000px) rotateY(0deg)';
        card.style.transformStyle = 'preserve-3d';
        
        grid.appendChild(card);
    });
}

function flipCard() {
    if (flippedCards.length === 2) return;
    if (flippedCards.includes(this)) return;
    
    this.textContent = this.dataset.symbol;
    this.classList.add('flipped');
    this.style.transform = 'perspective(1000px) rotateY(180deg)';
    flippedCards.push(this);
    
    if (flippedCards.length === 2) {
        moves++;
        document.getElementById('memoryMoves').textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.symbol === card2.dataset.symbol) {
        matchedPairs++;
        flippedCards = [];
        
        // Add matched animation
        card1.style.animation = 'matched 0.5s ease';
        card2.style.animation = 'matched 0.5s ease';
        
        if (matchedPairs === MEMORY_SYMBOLS.length) {
            if (moves < bestScore) {
                bestScore = moves;
                document.getElementById('memoryBest').textContent = bestScore;
                leaderboardSystem.addScore('memory', moves, 
                    prompt('New best score! Enter your name:'));
            }
            setTimeout(() => {
                alert('Congratulations! You won in ' + moves + ' moves!');
            }, 500);
        }
    } else {
        setTimeout(() => {
            card1.textContent = '';
            card2.textContent = '';
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.style.transform = 'perspective(1000px) rotateY(0deg)';
            card2.style.transform = 'perspective(1000px) rotateY(0deg)';
            flippedCards = [];
        }, 1000);
    }
}
// 2048 Game Logic
let grid2048 = [];
let score2048 = 0;
let bestScore2048 = 0;

function init2048() {
    grid2048 = Array(16).fill(0);
    score2048 = 0;
    updateScore2048();
    addNewTile();
    addNewTile();
    render2048();
}

function render2048() {
    const container = document.querySelector('.game2048-grid');
    container.innerHTML = '';
    
    grid2048.forEach((value, index) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (value !== 0) {
            tile.textContent = value;
            tile.dataset.value = value;
            
            // Add color based on value
            const power = Math.log2(value);
            const hue = 200 - (power * 15);
            tile.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
            tile.style.color = power > 8 ? '#fff' : '#1a1a2e';
            
            // Add pop animation for new tiles
            if (value === 2 || value === 4) {
                tile.style.animation = 'pop 0.3s ease-out';
            }
        }
        container.appendChild(tile);
    });
}

function addNewTile() {
    const emptyCells = grid2048.reduce((acc, curr, idx) => 
        curr === 0 ? [...acc, idx] : acc, []);
    
    if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid2048[randomCell] = Math.random() < 0.9 ? 2 : 4;
    }
}

function move2048(direction) {
    let moved = false;
    const oldGrid = [...grid2048];
    
    // Get line based on direction
    const getLine = (i) => {
        switch(direction) {
            case 'up': return [grid2048[i], grid2048[i+4], grid2048[i+8], grid2048[i+12]];
            case 'down': return [grid2048[i+12], grid2048[i+8], grid2048[i+4], grid2048[i]];
            case 'left': return grid2048.slice(i*4, i*4+4);
            case 'right': return grid2048.slice(i*4, i*4+4).reverse();
        }
    };
    
    // Set line after manipulation
    const setLine = (i, line) => {
        switch(direction) {
            case 'up':
                grid2048[i] = line[0];
                grid2048[i+4] = line[1];
                grid2048[i+8] = line[2];
                grid2048[i+12] = line[3];
                break;
            case 'down':
                grid2048[i+12] = line[0];
                grid2048[i+8] = line[1];
                grid2048[i+4] = line[2];
                grid2048[i] = line[3];
                break;
            case 'left':
                for(let j = 0; j < 4; j++) {
                    grid2048[i*4+j] = line[j];
                }
                break;
            case 'right':
                for(let j = 0; j < 4; j++) {
                    grid2048[i*4+j] = line.reverse()[j];
                }
                break;
        }
    };
    
    // Process each line
    for(let i = 0; i < 4; i++) {
        let line = getLine(i);
        const oldLine = [...line];
        
        // Merge tiles
        line = line.filter(x => x !== 0);
        for(let j = 0; j < line.length-1; j++) {
            if(line[j] === line[j+1]) {
                line[j] *= 2;
                score2048 += line[j];
                line.splice(j+1, 1);
                moved = true;
            }
        }
        
        // Fill with zeros
        while(line.length < 4) {
            line.push(0);
        }
        
        if(JSON.stringify(oldLine) !== JSON.stringify(line)) {
            moved = true;
        }
        
        setLine(i, line);
    }
    
    if(moved) {
        addNewTile();
        updateScore2048();
        render2048();
        
        if(checkGameOver2048()) {
            setTimeout(() => {
                if(score2048 > bestScore2048) {
                    bestScore2048 = score2048;
                    document.getElementById('best2048').textContent = bestScore2048;
                    leaderboardSystem.addScore('2048', score2048, 
                        prompt('New high score! Enter your name:'));
                }
                alert('Game Over! Score: ' + score2048);
            }, 300);
        }
    }
}

function updateScore2048() {
    document.getElementById('score2048').textContent = score2048;
}

function checkGameOver2048() {
    // Check for empty cells
    if(grid2048.includes(0)) return false;
    
    // Check for possible merges
    for(let i = 0; i < 4; i++) {
        for(let j = 0; j < 4; j++) {
            const current = grid2048[i*4+j];
            if((j < 3 && current === grid2048[i*4+j+1]) || 
               (i < 3 && current === grid2048[(i+1)*4+j])) {
                return false;
            }
        }
    }
    return true;
}

function reset2048() {
    init2048();
}

// Add keyboard controls for 2048
document.addEventListener('keydown', (e) => {
    if(document.getElementById('game2048').style.display !== 'none') {
        switch(e.key) {
            case 'ArrowUp': move2048('up'); break;
            case 'ArrowDown': move2048('down'); break;
            case 'ArrowLeft': move2048('left'); break;
            case 'ArrowRight': move2048('right'); break;
        }
    }
});

// Add touch controls for 2048
let touchStartX, touchStartY;

document.querySelector('.game2048-grid').addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.querySelector('.game2048-grid').addEventListener('touchend', (e) => {
    if(!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    if(Math.abs(diffX) > Math.abs(diffY)) {
        if(diffX > 0) move2048('left');
        else move2048('right');
    } else {
        if(diffY > 0) move2048('up');
        else move2048('down');
    }
    
    touchStartX = null;
    touchStartY = null;
});

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    leaderboardSystem.init();
    document.getElementById('home-view').style.display = 'block';
    document.getElementById('game-view').style.display = 'none';
});
// Breakout Game Logic
class BreakoutGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameLoop = null;
        this.initialize();
    }

    initialize() {
        // Game state
        this.level = 1;
        this.score = 0;
        this.lives = 3;
        this.isPlaying = false;
        
        // Ball properties
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 30,
            dx: 5,
            dy: -5,
            radius: 8,
            speed: 7,
            color: '#0ff'
        };
        
        // Paddle properties
        this.paddle = {
            width: 75,
            height: 10,
            x: this.canvas.width / 2 - 37.5,
            speed: 7,
            color: '#0ff'
        };
        
        // Brick properties
        this.brickRowCount = 5;
        this.brickColumnCount = 8;
        this.brickWidth = 50;
        this.brickHeight = 20;
        this.brickPadding = 10;
        this.brickOffsetTop = 60;
        this.brickOffsetLeft = 25;
        
        this.bricks = [];
        this.initializeBricks();
        
        // Power-ups
        this.powerUps = [];
        this.activePowerUps = new Set();
        
        // Controls
        this.rightPressed = false;
        this.leftPressed = false;
        
        // Event listeners
        this.setupEventListeners();
        
        // Update display
        this.updateDisplay();
    }

    initializeBricks() {
        const patterns = {
            1: () => true, // All bricks
            2: (c, r) => (c + r) % 2 === 0, // Checkerboard
            3: (c, r) => r % 2 === 0, // Horizontal lines
            4: (c, r) => c % 2 === 0, // Vertical lines
            5: (c, r) => c === r || c === this.brickRowCount - 1 - r // X pattern
        };

        this.bricks = [];
        for(let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for(let r = 0; r < this.brickRowCount; r++) {
                if(patterns[this.level % 5 || 5](c, r)) {
                    this.bricks[c][r] = {
                        x: c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft,
                        y: r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop,
                        status: 1,
                        hits: this.level > 3 ? 2 : 1,
                        color: this.getBrickColor(r)
                    };
                }
            }
        }
    }

    getBrickColor(row) {
        const colors = ['#ff0088', '#ff00ff', '#00ffff', '#00ff88', '#88ff00'];
        return colors[row % colors.length];
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Right' || e.key === 'ArrowRight') this.rightPressed = true;
            if(e.key === 'Left' || e.key === 'ArrowLeft') this.leftPressed = true;
        });

        document.addEventListener('keyup', (e) => {
            if(e.key === 'Right' || e.key === 'ArrowRight') this.rightPressed = false;
            if(e.key === 'Left' || e.key === 'ArrowLeft') this.leftPressed = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const relativeX = e.clientX - this.canvas.offsetLeft;
            if(relativeX > 0 && relativeX < this.canvas.width) {
                this.paddle.x = relativeX - this.paddle.width / 2;
            }
        });
    }

    drawBall() {
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.ball.color;
        this.ctx.fill();
        this.ctx.closePath();
        
        // Neon effect
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.ball.color;
    }

    drawPaddle() {
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.paddle.color;
        this.ctx.fillStyle = this.paddle.color;
        this.ctx.fillRect(this.paddle.x, 
            this.canvas.height - this.paddle.height, 
            this.paddle.width, this.paddle.height);
    }

    drawBricks() {
        for(let c = 0; c < this.brickColumnCount; c++) {
            for(let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                if(brick && brick.status > 0) {
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = brick.color;
                    this.ctx.fillStyle = brick.color;
                    this.ctx.fillRect(brick.x, brick.y, 
                        this.brickWidth, this.brickHeight);
                    
                    if(brick.hits > 1) {
                        this.ctx.strokeStyle = '#fff';
                        this.ctx.strokeRect(brick.x, brick.y, 
                            this.brickWidth, this.brickHeight);
                    }
                }
            }
        }
    }

    drawPowerUps() {
        this.powerUps.forEach((powerUp, index) => {
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x, powerUp.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = powerUp.color;
            this.ctx.shadowColor = powerUp.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fill();
            this.ctx.closePath();
            
            powerUp.y += 2;
            
            if(powerUp.y > this.canvas.height - this.paddle.height && 
               powerUp.x > this.paddle.x && 
               powerUp.x < this.paddle.x + this.paddle.width) {
                this.activatePowerUp(powerUp.type);
                this.powerUps.splice(index, 1);
            }
            
            if(powerUp.y > this.canvas.height) {
                this.powerUps.splice(index, 1);
            }
        });
    }

    activatePowerUp(type) {
        switch(type) {
            case 'wider':
                this.paddle.width *= 1.5;
                setTimeout(() => this.paddle.width /= 1.5, 10000);
                break;
            case 'slower':
                this.ball.speed *= 0.7;
                setTimeout(() => this.ball.speed /= 0.7, 10000);
                break;
            case 'extra':
                this.lives++;
                this.updateDisplay();
                break;
        }
    }

    collisionDetection() {
        for(let c = 0; c < this.brickColumnCount; c++) {
            for(let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                if(brick && brick.status > 0) {
                    if(this.ball.x > brick.x && 
                       this.ball.x < brick.x + this.brickWidth && 
                       this.ball.y > brick.y && 
                       this.ball.y < brick.y + this.brickHeight) {
                        this.ball.dy = -this.ball.dy;
                        brick.hits--;
                        if(brick.hits <= 0) {
                            brick.status = 0;
                            this.score += 10 * this.level;
                            this.updateDisplay();
                            
                            if(Math.random() < 0.1) {
                                const powerUpTypes = [
                                    {type: 'wider', color: '#ff0'},
                                    {type: 'slower', color: '#0f0'},
                                    {type: 'extra', color: '#f0f'}
                                ];
                                const powerUp = powerUpTypes[
                                    Math.floor(Math.random() * powerUpTypes.length)
                                ];
                                this.powerUps.push({
                                    x: brick.x + this.brickWidth/2,
                                    y: brick.y + this.brickHeight,
                                    type: powerUp.type,
                                    color: powerUp.color
                                });
                            }
                        }
                        
                        if(this.isLevelComplete()) {
                            this.nextLevel();
                        }
                    }
                }
            }
        }
    }

    isLevelComplete() {
        return this.bricks.every(column => 
            column.every(brick => !brick || brick.status === 0));
    }

    nextLevel() {
        this.level++;
        this.updateDisplay();
        
        const indicator = document.querySelector('.breakout-level-indicator');
        indicator.textContent = `Level ${this.level}`;
        indicator.classList.add('show');
        setTimeout(() => indicator.classList.remove('show'), 2000);
        
        this.initializeBricks();
        this.ball.speed += 0.5;
        
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 30;
        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
    }

    updateDisplay() {
        document.getElementById('breakoutScore').textContent = this.score;
        document.getElementById('breakoutLevel').textContent = this.level;
        document.getElementById('breakoutLives').textContent = this.lives;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBricks();
        this.drawBall();
        this.drawPaddle();
        this.drawPowerUps();
        
        // Ball collision with walls
        if(this.ball.x + this.ball.dx > this.canvas.width - this.ball.radius || 
           this.ball.x + this.ball.dx < this.ball.radius) {
            this.ball.dx = -this.ball.dx;
        }
        if(this.ball.y + this.ball.dy < this.ball.radius) {
            this.ball.dy = -this.ball.dy;
        } else if(this.ball.y + this.ball.dy > this.canvas.height - this.ball.radius) {
            if(this.ball.x > this.paddle.x && 
               this.ball.x < this.paddle.x + this.paddle.width) {
                this.ball.dy = -this.ball.dy;
                const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
                this.ball.dx = this.ball.speed * (hitPos - 0.5) * 2;
            } else {
                this.lives--;
                this.updateDisplay();
                
                if(this.lives <= 0) {
                    this.gameOver();
                    return;
                } else {
                    this.ball.x = this.canvas.width / 2;
                    this.ball.y = this.canvas.height - 30;
                    this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
                }
            }
        }
        
        // Paddle movement
        if(this.rightPressed && this.paddle.x < this.canvas.width - this.paddle.width) {
            this.paddle.x += this.paddle.speed;
        } else if(this.leftPressed && this.paddle.x > 0) {
            this.paddle.x -= this.paddle.speed;
        }
        
        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        this.collisionDetection();
        
        if(this.isPlaying) {
            requestAnimationFrame(() => this.draw());
        }
    }

    start() {
        this.isPlaying = true;
        this.draw();
    }

    gameOver() {
        this.isPlaying = false;
        if(this.score > 0) {
            leaderboardSystem.addScore('breakout', this.score, 
                prompt('Game Over! Enter your name for the leaderboard:'));
        }
    }
}

// Initialize and start Breakout game
let breakoutGame;

function initBreakout() {
    const canvas = document.getElementById('breakoutCanvas');
    breakoutGame = new BreakoutGame(canvas);
}

function startBreakout() {
    if(breakoutGame) {
        breakoutGame.initialize();
        breakoutGame.start();
    }
}
// Runner Game Logic
class RunnerGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isPlaying = false;
        this.initialize();
    }

    initialize() {
        // Game state
        this.score = 0;
        this.coins = 0;
        this.speed = 5;
        this.gravity = 0.5;
        this.jumpForce = -12;
        
        // Player
        this.player = {
            x: 100,
            y: this.canvas.height - 100,
            width: 40,
            height: 60,
            velocityY: 0,
            isJumping: false,
            isSliding: false,
            isShielded: false,
            color: '#4ecca3'
        };
        
        // Game elements
        this.obstacles = [];
        this.coins = [];
        this.powerUps = [];
        
        // Background layers for parallax
        this.backgrounds = [
            { x: 0, speed: 1, color: '#1a1a2e' },
            { x: 0, speed: 2, color: '#16213e' }
        ];
        
        // Controls
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying) return;
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'ArrowUp':
                    if (!this.player.isJumping) {
                        this.player.velocityY = this.jumpForce;
                        this.player.isJumping = true;
                    }
                    break;
                case 'ArrowDown':
                    if (!this.player.isSliding) {
                        this.player.isSliding = true;
                        this.player.height = 30;
                        setTimeout(() => {
                            this.player.isSliding = false;
                            this.player.height = 60;
                        }, 1000);
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
            }
        });
    }

    updateDisplay() {
        document.getElementById('runnerScore').textContent = this.score;
        document.getElementById('runnerCoins').textContent = this.coins;
    }

    generateObstacle() {
        if (Math.random() < 0.02) {
            const type = Math.random() < 0.7 ? 'ground' : 'air';
            const obstacle = {
                x: this.canvas.width,
                y: type === 'ground' ? this.canvas.height - 40 : this.canvas.height - 120,
                width: 40,
                height: 40,
                type: type,
                color: '#ff3366'
            };
            this.obstacles.push(obstacle);
        }
    }

    generateCoin() {
        if (Math.random() < 0.03) {
            const coin = {
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - 150) + 50,
                width: 20,
                height: 20,
                color: '#ffd700'
            };
            this.coins.push(coin);
        }
    }

    generatePowerUp() {
        if (Math.random() < 0.005) {
            const types = ['magnet', 'shield', 'multiplier'];
            const powerUp = {
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - 150) + 50,
                width: 30,
                height: 30,
                type: types[Math.floor(Math.random() * types.length)],
                color: '#4ecca3'
            };
            this.powerUps.push(powerUp);
        }
    }

    updatePlayer() {
        // Horizontal movement
        if (this.keys.left && this.player.x > 50) {
            this.player.x -= 5;
        }
        if (this.keys.right && this.player.x < this.canvas.width - 50) {
            this.player.x += 5;
        }

        // Vertical movement
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;

        // Ground collision
        if (this.player.y > this.canvas.height - this.player.height) {
            this.player.y = this.canvas.height - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
    }

    checkCollisions() {
        // Obstacle collisions
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (this.checkCollision(this.player, obstacle) && !this.player.isShielded) {
                this.gameOver();
                return;
            }
        }

        // Coin collisions
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (this.checkCollision(this.player, coin)) {
                this.coins.splice(i, 1);
                this.score += 10;
                this.updateDisplay();
            }
        }

        // Power-up collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.checkCollision(this.player, powerUp)) {
                this.activatePowerUp(powerUp.type);
                this.powerUps.splice(i, 1);
            }
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    activatePowerUp(type) {
        switch(type) {
            case 'magnet':
                setTimeout(() => {
                    this.coins.forEach(coin => {
                        const dx = this.player.x - coin.x;
                        const dy = this.player.y - coin.y;
                        coin.x += dx * 0.1;
                        coin.y += dy * 0.1;
                    });
                }, 5000);
                break;
            case 'shield':
                this.player.isShielded = true;
                this.player.color = '#00ffff';
                setTimeout(() => {
                    this.player.isShielded = false;
                    this.player.color = '#4ecca3';
                }, 5000);
                break;
            case 'multiplier':
                const oldScore = this.score;
                this.score *= 2;
                setTimeout(() => {
                    this.score = oldScore;
                }, 5000);
                break;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw backgrounds with parallax effect
        this.backgrounds.forEach(bg => {
            this.ctx.fillStyle = bg.color;
            this.ctx.fillRect(bg.x, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillRect(bg.x + this.canvas.width, 0, this.canvas.width, this.canvas.height);
            bg.x -= bg.speed;
            if (bg.x <= -this.canvas.width) bg.x = 0;
        });

        // Draw player with glow effect
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.player.color;
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = obstacle.color;
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            obstacle.x -= this.speed;
        });

        // Draw coins with glow effect
        this.coins.forEach(coin => {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = coin.color;
            this.ctx.fillStyle = coin.color;
            this.ctx.beginPath();
            this.ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            coin.x -= this.speed;
        });

        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = powerUp.color;
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            powerUp.x -= this.speed;
        });

        // Remove off-screen elements
        this.obstacles = this.obstacles.filter(obs => obs.x + obs.width > 0);
        this.coins = this.coins.filter(coin => coin.x + coin.width > 0);
        this.powerUps = this.powerUps.filter(powerUp => powerUp.x + powerUp.width > 0);

        // Generate new elements
        this.generateObstacle();
        this.generateCoin();
        this.generatePowerUp();

        // Update player
        this.updatePlayer();
        this.checkCollisions();

        // Increase difficulty
        if (this.score % 100 === 0 && this.score > 0) {
            this.speed += 0.1;
        }

        // Update score
        this.score++;
        this.updateDisplay();

        if (this.isPlaying) {
            requestAnimationFrame(() => this.draw());
        }
    }

    start() {
        this.isPlaying = true;
        this.draw();
    }

    gameOver() {
        this.isPlaying = false;
        if (this.score > 0) {
            leaderboardSystem.addScore('runner', this.score, 
                prompt('Game Over! Enter your name for the leaderboard:'));
        }
    }
}

// Initialize and start Runner game
let runnerGame;

function initRunner() {
    const canvas = document.getElementById('runnerCanvas');
    runnerGame = new RunnerGame(canvas);
}

function startRunner() {
    if (runnerGame) {
        runnerGame.initialize();
        runnerGame.start();
    }
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    leaderboardSystem.init();
    document.getElementById('home-view').style.display = 'block';
    document.getElementById('game-view').style.display = 'none';
});
