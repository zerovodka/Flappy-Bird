const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
//RAD = 1rad
const RAD = Math.PI/180;

//tabIndex = 1 지정 => 웹 페이지 상에서 tab키 눌렀을때 가장 빠르게 포커스
canvas.tabIndex = 1;
canvas.addEventListener("click",()=>{
    switch(state.curr) {
        //Play시 start 음성 출력
        case state.getReady :
            state.curr = state.Play;
            SFX.start.play();
            break;
        //출력한 음성 새가 움직일 시 출력 취소    
        case state.Play :
            bird.flap();
            break;
        //gameOver시 ready상태로, 새/파이프 고정, 점수 0, 음성X    
        case state.gameOver :
            state.curr = state.getReady;
            bird.speed = 0;
            bird.y = 100;
            pipe.pipes = [];
            UI.score.curr = 0;
            SFX.played = false;
            break;
       }
})

//키보드 입력시 변화{
//keyCode 이용 특정 유니코드 입력 시 작용
canvas.onkeydown = function keyDown(e) {
    //Space or W or 화살표 윗키
    if(e.keyCode == 32 || e.keyCode == 87 || e.keyCode == 38) {
        switch(state.curr) {
            //준비 -> 시작 음성 출력    
            case state.getReady :
                state.curr = state.Play;
                SFX.start.play();
                break;
            //시작 -> flap
            case state.Play :
                bird.flap();
                break;
            case state,gameOver :
                state.curr = state.getReady;
                bird.speed = 0;
                bird.y = 100;
                pipe.pipes = [];
                UI.score.curr = 0;
                SFX.played = false;
                break;
        }
    }
}

//
let frames = 0;
let dx = 2;
//각 상태에 특정값 부여
const state = {
    curr : 0,
    getReady : 0,
    Play : 1,
    gameOver : 2,
}

//소리
const SFX = {
    start : new Audio(),
    flap : new Audio(),
    score : new Audio(),
    hit : new Audio(),
    die : new Audio(),
    played : false
}

//바닥
const gnd = {
    sprite : new Image(),
    x : 0,
    y : 0,
    draw : function() {
        this.y = parseFloat(canvas.height - this.sprite.height);
        context.drawImage(this.sprite, this.x, this.y);
    },
    update : function() {
        //게임 지속되는 동안 스크롤
        if(state.curr != state.Play) return;
            this.x -= dx;
            this.x = this.x % (this.sprite.width/2);
    }
};

const bg = {
    sprite : new Image(),
    x : 0,
    y : 0,
    draw : function() {
        y = parseFloat(canvas.height-this.sprite.height);
        context.drawImage(this.sprite, this.x, y);
    }
};

//파이프
const pipe = {
    top : {sprite : new Image()},
    bot : {sprite : new Image()},
    //두 파이프 사이 간격 고정
    gap : 120,
    moved : true,
    //파이프 x,y 좌표 입력 받을 배열 pipes
    pipes : [],
    //아래 파이프는 위 파이프 길이 + 간격 만큼 떨어진 곳에서 그리기 시작한다는 뜻
    draw : function() {
        for(let i = 0; i<this.pipes.length; i++) {
            let p = this.pipes[i];
            context.drawImage(this.top.sprite, p.x, p.y)
            context.drawImage(this.bot.sprite, p.x, p.y + parseFloat(this.top.sprite.height) + this.gap)
        }
    },
    //파이프 반복
    update : function() {
        if(state.curr != state.Play) return;
        //canvas height가 512px에 무작위 공간 생성해야 하므로 y값에 random 넣고 최대가 512px 못넘게 만듦
        if(frames % 100 == 0) {
            this.pipes.push({x:parseFloat(canvas.width), y:-210*Math.min(Math.random()+1, 1.8)});
        }
        //pipes 배열 요소 각각마다 실행해서 pipe가 왼쪽으로 빠져나가게
        this.pipes.forEach(pipe=>{
            pipe.x -= dx;
        })
        if(this.pipes.length && this.pipes[0].x < -this.top.sprite.width) {
            this.pipes.shift();
            this.moved = true;
        }
    }
};
//새
const bird = {
    //새 이미지 활용 애니메이션
    animations : [
        {sprite : new Image()},
        {sprite : new Image()},
        {sprite : new Image()},
        {sprite : new Image()},
    ],
    rotation : 0,
    x : 50,
    y : 100,
    speed : 0,
    gravity : .125,
    thrust : 3.6,
    frame : 0,
    
    draw : function() {
        let h = this.animations[this.frame].sprite.height;
        let w = this.animations[this.frame].sprite.width;
        context.save();
        //위치 이동, 각도 조절
        context.translate(this.x, this.y);
        context.rotate(this.rotation*RAD);
        context.drawImage(this.animations[this.frame].sprite, -w/2, -h/2);
        context.restore();
    },
    
    update : function() {
        let r = parseFloat(this.animations[0].sprite.width)/2;
        switch(state.curr) {
            case state.getReady :
                this.rotation = 0;
                this.y += (frames % 10 == 0) ? Math.sin(frames*RAD) : 0; //
                this.frame += (frames % 10 == 0) ? 1:0;
                break;
            case state.Play :
                this.frame += (frames % 5 == 0) ? 1 : 0;
                this.y += this.speed;
                this.setRotation()
                this.speed += this.gravity;
                if(this.y + r >= gnd.y || this.collision()) {
                    state.curr = state.gameOver;
                }
                break;

            case state.gameOver :
                this.frame = 1;
                if(this.y + r < gnd.y) {
                    this.y += this.speed;
                    this.setRotation()
                    this.speed += this.gravity*2;
                }
                ///////////////////////////////
                else {
                this.speed = 0;
                this.y = gnd.y - r;
                this.rotation = 90;
                if(!SFX.played) {
                    SFX.die.play();                       SFX.played = true;
                }
                }
                break;
        }
        this.frame = this.frame % this.animations.length;
    },
    
    flap : function() {
        if(this.y > 0) {
            SFX.flap.play();
            this.speed = -this.thrust;
        }
    },
    
    setRotation : function() {
        if(this.speed <= 0) {
            this.rotation = Math.max(-25, -25 * this.speed/(-1*this.thrust));
        }
        else if(this.speed > 0) {
            this.rotation = Math.min(90, 90 * this.speed/(this.thrust*2));
        }
    },
    
    collision : function() {
        if(!pipe.pipes.length) return;
        let bird = this.animations[0].sprite;
        let x = pipe.pipes[0].x;
        let y = pipe.pipes[0].y;
        let r = bird.height/4 + bird.width/4;
        let roof = y + parseFloat(pipe.top.sprite.height);
        let floor = roof + pipe.gap;
        let w = parseFloat(pipe.top.sprite.width);
        if(this.x + r >= x) {
            if(this.x + r < x + w) {
                if(this.y - r <= roof || this.y + r >= floor) {
                    SFX.hit.play();
                    return true;
                }
            }
            else if(pipe.moved) {
                UI.score.curr++;
                SFX.score.play();
                pipe.moved = false;
            }
        }    
    }
};

const UI = {
    getReady : {sprite : new Image()},
    gameOver : {sprite : new Image()},
    tap : [{sprite : new Image()},
           {sprite : new Image()}],
    score : {
        curr : 0,
        best : 0,
    },
    x : 0,
    y : 0,
    tx : 0,
    ty : 0,
    frame : 0,
    
    draw : function() {
        switch(state.curr) {
            case state.getReady :
                this.x = parseFloat(canvas.width - this.getReady.sprite.height)/2;
                this.y = parseFloat(canvas.height - this.getReady.sprite.height)/2;
                this.tx = parseFloat(canvas.width - this.tap[0].sprite.width)/2;
                this.ty = this.y + this.getReady.sprite.height - this.tap[0].sprite.height;
                context.drawImage(this.getReady.sprite, this.x, this.y);
                context.drawImage(this.tap[this.frame].sprite, this.tx, this.ty)
                break;
            
            case state.gameOver :
                this.x = parseFloat(canvas.width - this.gameOver.sprite.width)/2;
                this.y = parseFloat(canvas.height - this.gameOver.sprite.height)/2;
                this.tx = parseFloat(canvas.width - this.tap[0].sprite.width)/2;
                this.ty = this.y + this.gameOver.sprite.height - this.tap[0].sprite.height;
                context.drawImage(this.gameOver.sprite, this.x, this.y);
                context.drawImage(this.tap[this.frame].sprite, this.tx, this.ty)
                break;
        }
        this.drawScore();
    },
    
    drawScore : function() {
            context.fillStyle = "#FFFFFF";
            context.strokeStyle = "#000000";
        switch(state.curr) {
            case state.Play :
                context.lineWidth = "2";
                context.font = "35px Squada One";
                context.fillText(this.score.curr, canvas.width/2-5, 50);
                context.strokeText(this.score.curr, canvas.width/2-5, 50);
                break;
            case state.gameOver :
                context.lineWidth = "2";
                context.font = "40px Squada One";
                let sc = `SCORE :   ${this.score.curr}`;
                try {
                    this.score.best = Math.max(this.score.curr, localStorage.getItem("best"));
                    localStorage.setItem("best", this.score.best);
                    
                    let bs = `BEST :    ${this.score.best}`;
                    context.fillText(sc, canvas.width/2-80, canvas.height/2+0);
                    context.strokeText(sc, canvas.width/2-80, canvas.height/2+0);
                    context.fillText(bs, canvas.width/2-80, canvas.height/2+30);
                    context.strokeText(bs, canvas.width/2-80, canvas.height/2+30);
                }
                catch(e) {
                    context.fillText(sc, canvas.width/2-85, canvas.height/2+15);
                    context.strokeText(sc, canvas.width/2-85, canvas.height/2+15);
                }
                
            break;  
        }
    },
    update : function() {
        if(state.curr == state.Play) return;
        this.frame += (frames % 10 == 0) ? 1 : 0;
        this.frame = this.frame % this.tap.length;
    }
};

gnd.sprite.src="img/ground.png";
bg.sprite.src="img/BG.png";
pipe.top.sprite.src="img/toppipe.png";
pipe.bot.sprite.src="img/botpipe.png";
UI.gameOver.sprite.src="img/go.png";
UI.getReady.sprite.src="img/getready.png";
UI.tap[0].sprite.src="img/tap/t0.png";
UI.tap[1].sprite.src="img/tap/t1.png";
bird.animations[0].sprite.src="img/bird/b0.png";
bird.animations[1].sprite.src="img/bird/b1.png";
bird.animations[2].sprite.src="img/bird/b2.png";
bird.animations[3].sprite.src="img/bird/b0.png";
SFX.start.src = "sfx/start.wav"
SFX.flap.src = "sfx/flap.wav"
SFX.score.src = "sfx/score.wav"
SFX.hit.src = "sfx/hit.wav"
SFX.die.src = "sfx/die.wav"
                
gameloop();

function gameloop() {
    update();
    draw();
    frames++;
    requestAnimationFrame(gameloop);
}

function update() {
    bird.update();
    gnd.update();
    pipe.update();
    UI.update();
}

function draw() {
    context.fillStyle = "#30c0df";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    bg.draw();
    pipe.draw();
    bird.draw();
    gnd.draw();
    UI.draw();
}
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                