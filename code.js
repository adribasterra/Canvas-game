
//#region Attributes

// Handle keyboard controls
var keyPressed = {};

var controls = {
	playerRIGHT : "ArrowRight",
    playerLEFT : "ArrowLeft",
    playerUP : "ArrowUp",
    playerDOWN : "ArrowDown",
    playerHIDE : "h",
    playerKILL : "k",
    reset : " "
}

var enemyType = {
    Fixed : 0,
    Rotating : 1,
    Moving : 2
}

var game;
var mouseX, mouseY;
var follow = false;

//#endregion


function Init(){
    
    game = {
        canvas : undefined,
        context : undefined,
        lastTick : Date.now(),
        grid : undefined,
        player : undefined,
        objects : {
            boxes : [],
            walls : [],
            enemies : [],
            turrets : [],
            finish : undefined,
            stealth : undefined
        }
    }
    HandleInputEvents();
    LoadLevel();

    // Start the loop
    window.requestAnimationFrame(Loop);
}

function HandleInputEvents(){
    window.addEventListener("keydown", function (event) { keyPressed[event.key] = true; });
    window.addEventListener("keyup", function (event) { keyPressed[event.key] = false; });
    window.onclick = (mouse) =>{
        console.log("click");
        mouseX = mouse.pageX;
        mouseY = mouse.pageY;
        follow = true;
        return true;
    };
}

//#region Main game functions

function Loop() {
    // Delta from last execution of loop in ms
    var now = Date.now();
    var deltaTime = now - game.lastTick;

    Render();
    Update(deltaTime);

    game.lastTick = now;
    // Request to do this again ASAP
    window.requestAnimationFrame(Loop);
}

function Update(deltaTime){
    //console.log("This is the update after " + delta + " ms.");
    game.player.update(deltaTime);

    for(var enemy in game.objects.enemies){
        enemy.update(deltaTime);
        if(aabbCollision(enemy.ball, game.player, true, true) && keyPressed[controls.playerKILL]) {
            enemy.dead = true;
        }
    }

    for(var turret in game.objects.turrets) {
        if(aabbCollision(turret, game.player, true, true) && keyPressed[controls.playerKILL]){
            turret.dead = true;
        }
        for (var missile in turret.missiles){
            missile.update();
            if(aabbCollision(missile, game.player, true, true)){
                game.player.lowerStealth();
                missile = null;
            }
        }
    }


    for(var i = 0; i<game.objects.turrets.length; i++){
        for (var missile in game.objects.turrets[i].missiles){
            missile.update();
        }
    }
}

function Render(){
    //Clear screen
    game.context.fillStyle = '#f3d9f3';
    game.context.fillRect(0, 0, game.canvas.width, game.canvas.height);

    
    if(game.player.dead){           //Game over
        game.grid.loseScreen.render(game.context);
    }
    else if(game.player.finish){    //Finish line reached
        game.grid.winScreen.render(game.context);
    }
    else{
        game.grid.render(game.context);
        game.objects.finish.render(game.context);
        game.player.render(game.context);

        for (var i = 0; i < game.objects.boxes.length; i++) {
            game.objects.boxes[i].render(game.context);
        }

        for(var i = 0; i<game.objects.turrets.length; i++){
            for(var turret in game.objects.turrets) {
                turret.render(game.context);
                for (var missile in turret){
                    missile.render(game.context);
                }
            }
        }

        for(var i = 0; i<game.objects.enemies.length; i++){
            game.objects.enemies[i].render(game.context);
        }
        if(!game.player.hasKey) game.objects.key.render(game.context);
    
        game.stealth.render(game.context);
    }
}
//#endregion


//#region Classes

class Box {
    constructor(x, y, width, height, color, fill){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.fillStyle = color;
        this.fill = fill;
        this.initPath();
    }
    
    initPath(){
        this.path = new Path2D();
        this.path.rect(this.x, this.y, this.width, this.height);
        this.path.closePath();
    }

    render(context){
        context.fillStyle = this.fillStyle;
        if(this.fill) context.fill(this.path);
        else context.stroke(this.path);
    }
}

class Player{
    constructor(x, y, radius, color, speed){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.hidden = false;
        this.once = true;
        this.hasKey = false;
        this.stealth = 100;
        this.dead = false;
        this.finish = false;
        this.area = undefined;
    }

    update(deltaTime) {
        //Movement with keys
        if(!this.hidden){
            var num;
            if (keyPressed[controls.playerUP]) {        // Player holding up
                this.y -= this.speed * deltaTime/1000;
                num = CheckPlayerCollisionWithWalls();
                if(num != -1) this.y = game.objects.boxes[num].y + this.radius *2;
            }
            if (keyPressed[controls.playerDOWN]) {      // Player holding down
                this.y += this.speed * deltaTime/1000;
                num = CheckPlayerCollisionWithWalls();
                if(num != -1) this.y = game.objects.boxes[num].y - this.radius *2;
            } 
            if (keyPressed[controls.playerLEFT]) {      // Player holding left
                this.x -= this.speed * deltaTime/1000;
                num = CheckPlayerCollisionWithWalls();
                if(num != -1) this.x = game.objects.boxes[num].x - this.radius *2;
            }
            if (keyPressed[controls.playerRIGHT]) {     // Player holding right
                this.x += this.speed * deltaTime/1000;
                num = CheckPlayerCollisionWithWalls();
                if(num != -1) this.x = game.objects.boxes[num].x - this.radius;
            }
        }

        if (keyPressed[controls.playerHIDE] && this.once) {
            this.hidden = !this.hidden;
            this.once = false;
        }

        if(!keyPressed[controls.playerHIDE]){
            this.once = true;
        }

        //Check key
        if(aabbCollision(this, game.objects.key, true, false)){
            this.hasKey = true;
        }

        //Movement with mouse
        if(follow){
            this.x += Math.sign(mouseX - this.x) * this.speed * deltaTime/1000;
            this.y += Math.sign(mouseY - this.y) * this.speed * deltaTime/1000;
            if(Math.abs(mouseX - this.x) < 1){  //To avoid shaking
                this.x = mouseX;
            }
            if(Math.abs(mouseY - this.y) < 1){
                this.y = mouseY;
            }
            if(this.x == mouseX && this.y == mouseY){
                follow = false;
            }
        }
    }

    render(context) {
        this.path = new Path2D();
        this.area = new Path2D();
        if(this.hidden) {
            this.path.rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            context.fillStyle = "#00FFFF";
        }
        else{
            this.path.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
            context.fillStyle = this.color;
            this.area.arc(this.x, this.y, this.radius * 2, 0, 2 * Math.PI, true);
        }
        context.fill(this.path);
        context.stroke(this.area);

        //Check if reached finish line
        if(aabbCollision(this, game.objects.finish, true, false) && this.hasKey){
            this.finish = true;
        }
    }

    lowerStealth(){
        this.stealth--;
        if(this.stealth < 0){
            this.dead = true;
        }
    }
}

class Ball{
    constructor(x, y, radius, color, speed){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
    }

    move(deltaTime, speed){
        this.x += deltaTime / 1000 * speed;
        for (var j = 0; j < game.objects.boxes.length; j++) 
        {
            if(this.collision(game.context, game.objects.boxes[j]))
            {
                this.x -= deltaTime / 1000 * speed;
                this.speed *= -1;
            }
        }
    }
    
    render(context, dead) {
        this.path = new Path2D();
        this.path.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
        if(!dead) { context.fillStyle = this.color; }
        else{ context.fillStyle = "#AB2A3EA0"; }
        context.fill(this.path);
    }

    collision(gameObject){
        if(aabbCollision(this, gameObject, true, true)){
            return true;
        }
        return false;

        //#region  Attempt
        if(context.isPointInPath(this.path, gameObject.x, gameObject.y, "nonzero")){
            return true;
        }
        if(isArea){
            if(context.isPointInPath(this.path, gameObject.x + gameObject.radius*2, gameObject.y + gameObject.radius*2, "nonzero")){
                return true;
            }
        }
        else{
            if(context.isPointInPath(this.path, gameObject.x + gameObject.radius, gameObject.y + gameObject.radius, "nonzero")){
                return true;
            }
        }
		return false;
        //#endregion
    }
}

class Arco{
    constructor(x, y, radius, startAngle, rotationSpeed, color){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.rotationSpeed = rotationSpeed;
        this.startAngle = startAngle;
        this.endAngle = this.startAngle + 1/3;
        this.path = new Path2D();
        this.initPath();
    }

    update(deltaTime) {
		this.startAngle += (this.rotationSpeed * deltaTime / 1000) % 2;
		this.endAngle += (this.rotationSpeed * deltaTime / 1000) % 2;
		
		//if(this.startAngle * Math.PI > Math.PI || this.startAngle * Math.PI < - Math.PI/2) this.rotationSpeed *= -1;

        this.initPath();
    }

    initPath() {
        this.path = new Path2D();        
        this.path.arc(this.x, this.y, this.radius, this.startAngle * Math.PI, this.endAngle * Math.PI, false);
        this.path.lineTo(this.x, this.y);
        this.path.closePath();
    }

    render(context) {
        if(!game.player.hidden && context.isPointInPath(this.path, game.player.x, game.player.y, "nonzero")) {
            context.fillStyle = "#FF0000A0";
            game.player.lowerStealth();
        }
        else { context.fillStyle = this.color; }
        
        context.fill(this.path);
    }

    move(deltaTime, speed){
        this.x += deltaTime / 1000 * speed;
    }
}

class Enemy{
    constructor(ball, arc, speed, type){
        this.ball = ball;
        this.arc = arc;
        this.speed = speed;
        this.type = type;
        this.dead = false;
    }

    update(deltaTime) {
        if(!this.dead) {
            switch(this.type){
                case enemyType.Fixed:                   //There is no update
                    break;
                case enemyType.Rotating:
                    this.arc.update(deltaTime);         //Only the arc moves around the ball
                    break;
                case enemyType.Moving:
                    this.arc.update(deltaTime);         //Everything updates
                    this.arc.move(deltaTime, this.speed);
                    this.ball.move(deltaTime, this.speed);
                    break;
            }
        
            for (var i = 0; i < game.objects.boxes.length; i++) 
            {
                this.collision(game.objects.boxes[i], deltaTime);
            }
        }
    }
    
    render(context){
        if(!this.dead){
            this.arc.render(context);
        }
        this.ball.render(context, this.dead);
    }

    collision(gameObject, deltaTime){
        if(aabbCollision(this.ball, gameObject, true, false)){
            this.arc.x -= deltaTime / 1000 * this.speed;
            this.ball.x -= deltaTime / 1000 * this.speed;
            this.speed = -this.speed;
            if(this.arc.rotationSpeed == 0) {
                this.arc.startAngle += 1;
                this.arc.endAngle += 1;
            }
        }
    }
}

class HealthBar {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    render(context) {
        context.fillStyle = "#F60050";
        this.path = new Path2D();
        this.path.rect(this.x, this.y, this.width * game.player.stealth / 100, this.height);
        this.path.closePath();
        context.fill(this.path);
    }
}

class EndGame {
    constructor(backgroundColor, textColor, text){
        this.backgroundColor = backgroundColor;
        this.textColor = textColor;
        this.text = text;
    }

    render(context){
        //Background
        context.fillStyle = this.backgroundColor;
        context.fillRect(0, 0, game.canvas.width, game.canvas.height);

        //Text
        context.fillStyle = this.textColor;
        context.font = "200px Impact";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(this.text, game.canvas.width/2, game.canvas.height/2 - 150);

        context.fillStyle = "white";
        context.font = "20px Impact";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("Press space to play again", game.canvas.width/2, game.canvas.height/2 + 150);

        if(keyPressed[controls.reset]) location.reload();
    }
}

class Turret extends Ball{
    constructor(x, y, radius, color, speed, shootRate, maxTimeAlive){
        super(x, y, radius, color, speed);
        this.shootRate = shootRate;
        this.missiles = [];
        this.numMissiles = 0;
        this.lastTimeShot = 0;
        this.maxTimeAlive = maxTimeAlive;
        this.dead = false;
    }

    update(deltaTime){
        if(!this.dead){
            this.lastTimeShot += deltaTime/1000;
            if(this.lastTimeShot > this.shootRate){
                this.lastTimeShot = 0;
                shoot();
            }
            for(var i = 0; i<this.missiles.length; i++){
                if(this.missiles[i].timeAlive > this.maxTimeAlive){
                    balls[i] = null;
                }
            }
        }
    }

    render(context){
        if(!this.dead) super.render(context, dead);
    }

    shoot(){
        balls[this.numMissiles++] = new Missile(this.x, this.y, 10, "#000000", 200);
        
    }
}

class Missile extends Ball{
    constructor(x, y, radius, color, speed){
        super(x, y, radius, color, speed);
        this.player = game.player;
        this.timeAlive = 0;
    }

    follow(deltaTime){
        this.timeAlive += deltaTime/1000;
        this.x += Math.sign(this.player.x - this.x) * this.speed * deltaTime/1000;
        this.y += Math.sign(this.player.y - this.y) * this.speed * deltaTime/1000;
    }

    update(){
        for(var i = 0; i<game.objects.boxes; i++){
            if(aabbCollision(this, game.objects.balls[i], true, false)){
                this.timeAlive = 10000;
            }
        }
    }
}

//#endregion


function CheckPlayerCollisionWithWalls(){
    for (var i = 0; i < game.objects.boxes.length; i++) {
        if(aabbCollision(game.player, game.objects.boxes[i], true, false)){
            return i;
        }
	}
	return -1;
}

function aabbCollision(object1, object2, _1isBall, _2isBall) {
    if(_1isBall){
        var size1 = object1.radius * 2;
        if(_2isBall){
            var size2 = object2.radius * 2;
            if (object1.x < object2.x + size2 && size1 + object1.x > object2.x &&
                object1.y < object2.y + size2 && size1 + object1.y > object2.y)
            {
                return true;
            }
        }
        else{
            if (object1.x < object2.x + object2.width && size1 + object1.x > object2.x &&
                object1.y < object2.y + object2.height && size1 + object1.y > object2.y)
            {
                return true;
            }
        }
    }
    else{
        if(!_2isBall){
            if (object1.x < object2.x + object2.width && object1.width + object1.x > object2.x &&
                object1.y < object2.y + object2.height && object1.height + object1.y > object2.y)
            {
                return true;
            }
        }
    }
    return false;
}


function LoadLevel(){
    var creator = new MapCreator();
    var level1 = creator.level1;
    //Create canvas and get the context
	game.canvas = createFullScreenCanvas();
    game.context = game.canvas.getContext("2d");
    
    //                                  Grid
    // ----------------------------------------------------------------------------- //
    var gridData = level1.grid;
    game.grid = new Box(gridData.x, gridData.y, gridData.w, gridData.h, gridData.color, gridData.fill);
    

    //                                  Player
    // ----------------------------------------------------------------------------- //
    var playerData = level1.player;
    game.player = new Player(playerData.x, playerData.y, playerData.radius, playerData.color, playerData.speed);


    //                                  Boxes
    // ----------------------------------------------------------------------------- //
    for(var i = 0; i<level1.boxes.length; i++){
        var boxData = level1.boxes[i];
        var width   = boxData.w == -1 ? level1.config.boxes.size : boxData.w;
        var height  = boxData.h == -1 ? level1.config.boxes.size : boxData.h;
        game.objects.boxes[i] = new Box(boxData.x, boxData.y, width, height, level1.config.boxes.color, level1.config.boxes.fill);
    }

    //                                  Turrets
    // ----------------------------------------------------------------------------- //
    for(var i = 0; i<level1.turrets.length; i++){
        var turretData = level1.turrets[i];
        game.objects.turrets[i] = new Turret(turretData.x, turretData.y, turretData.r, turretData.color, turretData.speed, turretData.shootRate, turretData.maxTimeAlive);
    }
    

    //                                  Enemies
    // ----------------------------------------------------------------------------- //
    for(var i = 0; i<level1.enemies.length; i++){
        var ballsData = level1.enemies.balls[i];
        var arcsData  = level1.enemies.arcs[i];
        var ball = new Ball(ballsData.x, ballsData.y, level1.config.balls.radius, level1.config.balls.color);
        var arc = new Arco(arcsData.x, arcsData.y, arcsData.r, arcsData.angle, arcsData.speed, level1.config.arcs.color);
        game.objects.enemies[i] = new Enemy(ball, arc, creator.level1.enemies.speeds[i], creator.level1.enemies.types[i]);
    }

    
    //                                  Others
    // ----------------------------------------------------------------------------- //

    //Key
    var keyData = level1.key;
    game.objects.key = new Box(keyData.x, keyData.y, keyData.size, keyData.size, keyData.color, keyData.fill);

    //Stealth bar
    var stealthData = level1.stealth;
    game.stealth = new HealthBar(stealthData.x, stealthData.y, stealthData.w, stealthData.h);

    //Finish line
    var finishData = level1.finish;
    game.objects.finish = new Box(finishData.x, finishData.y, finishData.w, finishData.h, finishData.color, level1.config.boxes.fill);
    
    //End screens
    game.grid.winScreen = new EndGame(level1.config.screens.background, level1.config.screens.color, level1.endScreens.win.text);
    game.grid.loseScreen = new EndGame(level1.config.screens.background, level1.config.screens.color, level1.endScreens.lose.text);


    //#region Trash
    // //Pared abajo
    // for(var i = 0; i<numBoxesPerRow; i++){
    //     var x = (i % numBoxesPerRow) * tam + margin;
    //     var y = game.grid.height + tam/2;
    //     game.objects.boxes[i] = new Rectangle(x, y, tam, tam, boxColor, true);
    // }

    // //Pared arriba
    // for(var i = 0; i<numBoxesPerRow; i++){
    //     var x = (i % numBoxesPerRow) * tam + margin;
    //     var y = parseInt(i / numBoxesPerRow) * tam + margin;
    //     game.objects.boxes[i+numBoxesPerRow] = new Rectangle(x, y, tam, tam, boxColor, true);
    // }
    
    // numTotalBoxes = game.objects.boxes.length + numBoxesPerColumn;

    // //Pared izquierda
    // for(var i = game.objects.boxes.length; i<numTotalBoxes; i++){
    //     var x = margin;
    //     var y = (i % numBoxesPerColumn) * tam + margin;
    //     game.objects.boxes[i] = new Rectangle(x, y, tam, tam, boxColor, true);
    // }

    // numTotalBoxes = game.objects.boxes.length + numBoxesPerColumn;

    // //Pared derecha
    // for(var i = game.objects.boxes.length; i<numTotalBoxes; i++){
    //     var x = game.grid.width + tam/2;
    //     var y = (i % numBoxesPerColumn) * tam + margin;
    //     game.objects.boxes[i] = new Rectangle(x, y, tam, tam, boxColor, true);
    // }

    // numTotalBoxes = game.objects.boxes.length + numBoxesPerColumn -10;

    // //Pared medio alta 1
    // for(var i = game.objects.boxes.length; i<numTotalBoxes; i++){
    //     var x = 250;
    //     var y = (i % numBoxesPerColumn) * tam - tam/2;
    //     game.objects.boxes[i] = new Rectangle(x, y, tam, tam, boxColor, true);
    // }


    // numTotalBoxes = game.objects.boxes.length + numBoxesPerColumn - 10;

    // //Pared medio baja 1
    // for(var i = game.objects.boxes.length; i<numTotalBoxes; i++){
    //     var x = 500;
    //     var y = (i % numBoxesPerColumn + numBoxesPerColumn/2) * tam + tam*2;
    //     game.objects.boxes[i] = new Rectangle(x, y, tam, tam, boxColor, true);
    // }
    
    // numTotalBoxes = game.objects.boxes.length + numBoxesPerColumn - 16;

    // //Pared medio h 1
    // for(var i = game.objects.boxes.length; i<numTotalBoxes; i++){
    //     var x = (i % numBoxesPerColumn + numBoxesPerColumn/2) * tam - tam*2;
    //     var y = 500;
    //     game.objects.boxes[i] = new Rectangle(x, y, tam, tam, boxColor, true);
    // }

    // numTotalBoxes = game.objects.boxes.length + numBoxesPerColumn - 20;
    
    // //Pared medio alta 2
    // for(var i = game.objects.boxes.length; i<numTotalBoxes; i++){
    //     var x = (i % numBoxesPerColumn + numBoxesPerColumn/2) * tam - tam*4;
    //     var y = 200;
    //     game.objects.boxes[i] = new Rectangle(x, y, tam, tam, boxColor, true);
    // }

    //#endregion

}
