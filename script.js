const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game State
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
};

let frames = 0;

// Load Sprites
const spriteURL = "https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/";
const images = {};
const imageUrls = [
    "background-day.png",
    "base.png",
    "yellowbird-upflap.png",
    "yellowbird-midflap.png",
    "yellowbird-downflap.png",
    "pipe-green.png",
    "gameover.png",
    "message.png",
    "0.png", "1.png", "2.png", "3.png", "4.png", 
    "5.png", "6.png", "7.png", "8.png", "9.png"
];

let imagesLoaded = 0;
imageUrls.forEach(imgName => {
    images[imgName] = new Image();
    images[imgName].src = spriteURL + imgName;
    images[imgName].onload = () => {
        imagesLoaded++;
        if(imagesLoaded === imageUrls.length) {
            loop(); // Start game loop when all images are loaded
        }
    };
});

// Control the game
document.addEventListener("mousedown", flap);
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        flap();
    }
});
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    flap();
}, {passive: false});

function flap() {
    switch(state.current) {
        case state.getReady:
            state.current = state.game;
            break;
        case state.game:
            bird.flap();
            break;
        case state.over:
            let rect = canvas.getBoundingClientRect();
            // Just reset immediately on click for simplicity
            pipes.reset();
            bird.speed = 0;
            bird.rotation = 0;
            score.value = 0;
            state.current = state.getReady;
            break;
    }
}

// Background
const bg = {
    draw: function() {
        if(!images["background-day.png"].complete) return;
        ctx.drawImage(images["background-day.png"], 0, 0);
        // Seamless background if needed, but the canvas is 288 wide and bg is 288 wide.
    }
};

// Base (Ground)
const fg = {
    h: 112,
    w: 336,
    x: 0,
    y: canvas.height - 112,
    dx: 2,
    
    draw: function() {
        if(!images["base.png"].complete) return;
        ctx.drawImage(images["base.png"], this.x, this.y);
        ctx.drawImage(images["base.png"], this.x + this.w, this.y);
    },
    
    update: function() {
        if(state.current === state.game) {
            this.x = (this.x - this.dx) % (this.w / 2);
        }
    }
};

// Bird
const bird = {
    animation: [
        "yellowbird-downflap.png", 
        "yellowbird-midflap.png", 
        "yellowbird-upflap.png", 
        "yellowbird-midflap.png"
    ],
    x: 50,
    y: 150,
    w: 34,
    h: 24,
    radius: 12,
    frame: 0,
    velocity: 0,
    gravity: 0.25,
    jump: 4.6,
    rotation: 0,
    
    draw: function() {
        let birdImage = images[this.animation[this.frame]];
        if(!birdImage || !birdImage.complete) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        // Draw image centered at (this.x, this.y)
        ctx.drawImage(birdImage, -this.w/2, -this.h/2);
        ctx.restore();
    },
    
    flap: function() {
        this.velocity = -this.jump;
    },
    
    update: function() {
        // If the game state is get ready state, the bird must flap slowly
        this.period = state.current === state.getReady ? 10 : 5;
        // Increment the frame by 1, each period
        this.frame += frames % this.period === 0 ? 1 : 0;
        // Frame goes from 0 to 4, then again to 0
        this.frame = this.frame % this.animation.length;
        
        if(state.current === state.getReady) {
            this.y = 150 + Math.cos(frames/10) * 5; // hover effect
            this.rotation = 0;
        } else {
            this.velocity += this.gravity;
            this.y += this.velocity;
            
            if(this.y + this.h/2 >= canvas.height - fg.h) {
                this.y = canvas.height - fg.h - this.h/2;
                if(state.current === state.game) {
                    state.current = state.over;
                }
            }
            
            // If the speed is greater than the jump means the bird is falling down
            if(this.velocity >= this.jump) {
                this.rotation = 90 * Math.PI / 180;
                this.frame = 1;
            } else {
                this.rotation = -25 * Math.PI / 180;
            }
        }
    }
};

// Pipes
const pipes = {
    position: [],
    w: 52,
    h: 320,
    gap: 100,
    dx: 2,
    
    draw: function() {
        let pipeImg = images["pipe-green.png"];
        if(!pipeImg || !pipeImg.complete) return;
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            let topYPos = p.y;
            let bottomYPos = p.y + this.h + this.gap;
            
            // Top pipe
            ctx.save();
            ctx.translate(p.x + this.w / 2, topYPos + this.h / 2);
            ctx.rotate(180 * Math.PI / 180);
            ctx.drawImage(pipeImg, -this.w / 2, -this.h / 2);
            ctx.restore();
            
            // Bottom pipe
            ctx.drawImage(pipeImg, p.x, bottomYPos);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        if(frames % 100 === 0) {
            this.position.push({
                x: canvas.width,
                y: this.h * (Math.random() - 1) + 50 // y position logic
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            // Collision detection
            // Top Pipe
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > p.y && bird.y - bird.radius < p.y + this.h) {
                state.current = state.over;
            }
            // Bottom Pipe
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > bottomPipeYPos && bird.y - bird.radius < bottomPipeYPos + this.h) {
                state.current = state.over;
            }
            
            // Move the pipe
            p.x -= this.dx;
            
            // If the pipes go beyond canvas, delete them from array
            if(p.x + this.w <= 0) {
                this.position.shift();
                score.value += 1;
                score.best = Math.max(score.value, score.best);
                localStorage.setItem("bestScore", score.best);
            }
        }
    },
    
    reset: function() {
        this.position = [];
    }
};

// Score
const score = {
    best: parseInt(localStorage.getItem("bestScore")) || 0,
    value: 0,
    
    draw: function() {
        if(state.current === state.game) {
            this.drawNumber(this.value, canvas.width/2, 50);
        } else if(state.current === state.over) {
            // Score values
            this.drawNumber(this.value, 225, 228);
            this.drawNumber(this.best, 225, 270);
        }
    },
    
    drawNumber: function(num, x, y) {
        let str = num.toString();
        let totalWidth = 0;
        let charWidths = [];
        
        for(let i = 0; i < str.length; i++) {
            let img = images[str[i] + ".png"];
            if(img && img.complete) {
                totalWidth += img.width;
                charWidths.push(img.width);
            } else {
                return; // Can't draw yet
            }
        }
        
        let currentX = x - totalWidth / 2;
        for(let i = 0; i < str.length; i++) {
            let img = images[str[i] + ".png"];
            ctx.drawImage(img, currentX, y);
            currentX += charWidths[i] + 2; // +2 for spacing
        }
    }
};

// Start / Game Over screens
const getReady = {
    draw: function() {
        if(state.current === state.getReady) {
            let img = images["message.png"];
            if(img && img.complete) {
                ctx.drawImage(img, canvas.width/2 - img.width/2, 80);
            }
        }
    }
};

const gameOver = {
    draw: function() {
        if(state.current === state.over) {
            let img = images["gameover.png"];
            if(img && img.complete) {
                ctx.drawImage(img, canvas.width/2 - img.width/2, 90);
                
                // Draw scoreboard background here if needed (not included in simple assets, so we just show score text)
                // Actually, the original game has a 'scoreboard.png' which isn't in our array. 
                // Let's just rely on the score.draw() to print numbers on the gameover screen
            }
        }
    }
};

// Draw
function draw() {
    ctx.fillStyle = "#70c5ce"; // Fallback color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();
    getReady.draw();
    gameOver.draw();
    score.draw();
}

// Update
function update() {
    bird.update();
    fg.update();
    pipes.update();
}

// Loop
function loop() {
    update();
    draw();
    frames++;
    requestAnimationFrame(loop);
}
