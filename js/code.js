
//#region Attributes

var keyPressed = {};

var controls = {
	playerRIGHT : "ArrowRight",
    playerLEFT : "ArrowLeft",
    playerUP : "ArrowUp",
    playerDOWN : "ArrowDown",
    playerHIDE : "h",
    playerKILL : "k",
    reset : " ",
    playerMINE : "m"
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

    //Discard if elasped long time
    if(deltaTime > 1000){
        return;
    }
    
    game.player.update(deltaTime);

    //Update enemies & check player killing
    for(var i = 0; i<game.objects.enemies.length; i++){
        game.objects.enemies[i].update(deltaTime);
        if(aabbCollision(game.objects.enemies[i].ball, game.player, true, true, true) && keyPressed[controls.playerKILL]) {
            game.objects.enemies[i].dead = true;
        }
    }

    //Update turrets & check collision of missiles
    for(var i = 0; i<game.objects.turrets.length; i++) {
        if(aabbCollision(game.objects.turrets[i], game.player, true, true, true) && keyPressed[controls.playerKILL]){
            game.objects.turrets[i].dead = true;
        }
        for (var j = 0; j<game.objects.turrets[i].missiles.length; j++){
            if(game.objects.turrets[i].missiles[j] != null){
                game.objects.turrets[i].missiles[j].update(deltaTime);
                if(aabbCollision(game.objects.turrets[i].missiles[j], game.player, true, true, false)){
                    var times = 20;
                    while(times-- > 0) game.player.lowerStealth();
                    game.objects.turrets[i].missiles[j] = null;
                }
            }
        }
        game.objects.turrets[i].update(deltaTime);
    }
}

function Render(){
    //Clear screen
    game.context.fillStyle = '#F3D9F3';
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
            game.objects.turrets[i].ownRender(game.context);
            for (var j = 0; j<game.objects.turrets[i].missiles.length; j++){
                if(game.objects.turrets[i].missiles[j] != null) game.objects.turrets[i].missiles[j].render(game.context);
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
        this.once = { h: true, m: true};
        this.hasKey = false;
        this.stealth = 100;
        this.dead = false;
        this.finish = false;
        this.area = undefined;
        this.collision = { up: false, down: false, left: false, right: false };
        this.mines = [];
        this.numMines = 0;
    }

    update(deltaTime) {
        //Movement with keys
        if(!this.hidden){
            //Works not that bad
            var walls = this.checkWallCollision(game.context);
            if (keyPressed[controls.playerUP]) {            // Player holding up
                if(this.collision.up) this.y = game.objects.boxes[walls.up].y + game.objects.boxes[walls.up].height + this.radius;
                else this.y -= this.speed * deltaTime/1000;
            }
            if (keyPressed[controls.playerDOWN]) {          // Player holding down
                if(this.collision.down) this.y = game.objects.boxes[walls.down].y - this.radius;
                else this.y += this.speed * deltaTime/1000;
            } 
            if (keyPressed[controls.playerLEFT]) {          // Player holding left
                if(this.collision.left) this.x = game.objects.boxes[walls.left].x + 20 + this.radius;
                else this.x -= this.speed * deltaTime/1000;
            }
            if (keyPressed[controls.playerRIGHT]) {         // Player holding right
                if(this.collision.right) this.x = game.objects.boxes[walls.right].x - this.radius;
                else this.x += this.speed * deltaTime/1000;
            }
        }

        //Hide player
        if (keyPressed[controls.playerHIDE] && this.once.h) {
            this.hidden = !this.hidden;
            this.once.h = false;
        }
        if(!keyPressed[controls.playerHIDE]){
            this.once.h = true;
        }

        //Instantiate mine
        if (keyPressed[controls.playerMINE] && this.once.m && this.numMines < 4) {
            this.once.m = false;
            this.mines[this.numMines++] = new Mine(this.x, this.y, 10, "#FF0000", 1);
            console.log("Mine");
        }
        if(!keyPressed[controls.playerMINE]){
            this.once.m = true;
        }
        //Mine collision with enemies
        for(var i = 0; i<this.mines.length; i++){
            for(var j = 0; j<game.objects.enemies.length; j++){
                if(this.mines[i] != null){
                    this.mines[i].ownUpdate(deltaTime);
                    if(game.objects.enemies[j].collision(this.mines[i], -1)){
                        this.mines[i] = null;
                    }
                }
            }
        }

        //Check key
        if(aabbCollision(this, game.objects.key, true, false, false)){
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
        
        //Render mines
        for(var i = 0; i<this.mines.length; i++){
            if(this.mines[i] != null) this.mines[i].ownRender(context);
        }

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
        if(aabbCollision(this, game.objects.finish, true, false, false) && this.hasKey){
            this.finish = true;
        }
    }

    checkWallCollision(context){
        var walls = { up: -1, down: -1, left: -1, right: -1 };
        for (var i = 0; i < game.objects.boxes.length; i++) {
            if(context.isPointInPath(game.objects.boxes[i].path, this.x, this.y - this.radius)){                    //Up
                this.collision.up = true;
                walls.up = i;
            }
            if(context.isPointInPath(game.objects.boxes[i].path, this.x, this.y + this.radius)){                    //Down
                this.collision.down = true;
                walls.down = i;
            }
            if(context.isPointInPath(game.objects.boxes[i].path, this.x - this.radius, this.y + this.radius)){      //Left
                this.collision.left = true;
                walls.left = i;
            }
            if(context.isPointInPath(game.objects.boxes[i].path, this.x + this.radius, this.y)){                    //Right
                this.collision.right = true;
                walls.right = i;
            }
        }
        if(walls.up == -1) this.collision.up = false;
        if(walls.down == -1) this.collision.down = false;
        if(walls.left == -1) this.collision.left = false;
        if(walls.right == -1) this.collision.right = false;
        
        return walls;
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
        if(aabbCollision(this, gameObject, true, true, false)){
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
        if(deltaTime != -1){
            if(aabbCollision(this.ball, gameObject, true, false, false)){
                this.arc.x -= deltaTime / 1000 * this.speed;
                this.ball.x -= deltaTime / 1000 * this.speed;
                this.speed = -this.speed;
                if(this.arc.rotationSpeed == 0) {
                    this.arc.startAngle += 1;
                    this.arc.endAngle += 1;
                }
                return true;
            }
        }
        else{
            if(aabbCollision(this.ball, gameObject, true, true, false)){
                this.dead = true;
                return true;
            }
        }
        return false;
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
    constructor(x, y, radius, color, speed, shootRate, maxTimeAlive, missileSpeed){
        super(x, y, radius, color, speed);
        this.shootRate = shootRate;
        this.missiles = [];
        this.numMissiles = 0;
        this.lastTimeShot = 0;
        this.maxTimeAlive = maxTimeAlive;
        this.dead = false;
        this.missileSpeed = missileSpeed;
    }

    update(deltaTime){
        //Shoot
        if(!this.dead){
            this.lastTimeShot += deltaTime/1000;
            if(this.lastTimeShot > this.shootRate){
                this.lastTimeShot = 0;
                this.shoot();
            }
        }
        //Check missiles time alive
        for(var i = 0; i<this.missiles.length; i++){
            if(this.missiles[i] != null){
                if(this.missiles[i] != null && this.missiles[i].timeAlive > this.maxTimeAlive){
                    this.missiles[i] = null;
                }
            }
        }
    }

    ownRender(context){
        super.render(context, this.dead);
    }

    shoot(){
        this.missiles[this.numMissiles++] = new Missile(this.x, this.y, 10, "#000000", this.missileSpeed);
    }
}

class Missile extends Ball{
    constructor(x, y, radius, color, speed){
        super(x, y, radius, color, speed);
        this.player = game.player;
        this.timeAlive = 0;
    }

    update(deltaTime){
        this.timeAlive += deltaTime/1000;

        //Chase player
        var playerPos = new Vec2(this.player.x, this.player.y);
        var distance = playerPos.substract(this);
        distance = distance.normalized();
        distance = new Vec2(distance.x * this.speed, distance.y * this.speed);
        distance = distance.add(this);
        this.x = distance.x;
        this.y = distance.y;

        //Check collision with boxes
        for(var i = 0; i<game.objects.boxes.length; i++){
            if(aabbCollision(this, game.objects.boxes[i], true, false, false)){
                this.timeAlive = 1000000;
            }
        }
    }
}

class Mine extends Ball{
    constructor(x, y, externRadius, color, speed){
        super(x, y, externRadius, color, 0);
        this.innerRadius = 0;
        this.speed = speed;
    }

    ownUpdate(deltaTime){
        if(this.innerRadius > this.radius -2) this.innerRadius = 0;
        else this.innerRadius += this.speed * deltaTime / 1000;
    }

    ownRender(context){
        this.externPath = new Path2D();
        this.externPath.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
        context.fillStyle = this.color;
        context.stroke(this.externPath);

        this.innerPath = new Path2D();
        this.innerPath.arc(this.x, this.y, this.innerRadius, 0, 2 * Math.PI, true);
        context.fillStyle = this.color;
        context.fill(this.innerPath);
    }
}

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    substract(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    normalized() {
        var module = Math.sqrt(this.x * this.x + this.y * this.y);
        if (module >= 0) {
            return new Vec2(this.x / module, this.y / module);
        }
        return this;
    }

    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }
}

//#endregion

//#region Collision methods

function CircleRect(circle) {
    for(var i = 0; i<game.objects.boxes.length; i++){
        var rx = game.objects.boxes[i].x;
        var ry = game.objects.boxes[i].y;
        var rw = game.objects.boxes[i].width;
        var rh = game.objects.boxes[i].height;
        var cx = circle.x;
        var cy = circle.y;
        var radius = circle.radius;
        // temporary variables to set edges for testing
        var testX = circle.x;
        var testY = circle.y;
    
        // which edge is closest?
        if (cx < rx)         testX = rx;      // test left edge
        else if (cx > rx+rw) testX = rx+rw;   // right edge
        if (cy < ry)         testY = ry;      // top edge
        else if (cy > ry+rh) testY = ry+rh;   // bottom edge
    
        // get distance from closest edges
        var distX = cx-testX;
        var distY = cy-testY;
        var distance = Math.sqrt( (distX*distX) + (distY*distY) );
    
        // if the distance is less than the radius, collision!
        if (distance <= radius) {
            return true;
        }
    }
    return false;
}

function CheckPlayerCollisionWithWalls(){
    for (var i = 0; i < game.objects.boxes.length; i++) {
        if(aabbCollision(game.player, game.objects.boxes[i], true, false, false)){
            return i;
        }
	}
	return -1;
}

function aabbCollision(object1, object2, _1isBall, _2isBall, area) {
    if(_1isBall){
        var size1 = object1.radius * 2;
        if(_2isBall){
            var size2 = area ? object2.radius * 4 : object2.radius * 2;
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

//#endregion


function LoadLevel(){
    var creator = new MapCreator();
    var level1 = creator.level1;
    //Create canvas and get the context
	game.canvas = createFullScreenCanvas();
    game.context = game.canvas.getContext("2d");
    
    //                                  Grid
    // ----------------------------------------------------------------------------- //
    var gridData = level1.grid;
    var center = { left: gameWidth/2 - gridData.w/2 - 30, top: gameHeight/2 - gridData.h/2 - 30 };
    game.grid = new Box(gridData.x + center.left, gridData.y + center.top, gridData.w, gridData.h, gridData.color, gridData.fill);
    

    //                                  Player
    // ----------------------------------------------------------------------------- //
    var playerData = level1.player;
    game.player = new Player(playerData.x + center.left, playerData.y + center.top, playerData.radius, playerData.color, playerData.speed);


    //                                  Boxes
    // ----------------------------------------------------------------------------- //
    for(var i = 0; i<level1.boxes.length; i++){
        var boxData = level1.boxes[i];
        var width   = boxData.w == -1 ? level1.config.boxes.size : boxData.w;
        var height  = boxData.h == -1 ? level1.config.boxes.size : boxData.h;
        game.objects.boxes[i] = new Box(boxData.x + center.left, boxData.y + center.top, width, height, level1.config.boxes.color, level1.config.boxes.fill);
    }
    

    //                                  Enemies
    // ----------------------------------------------------------------------------- //
    for(var i = 0; i<level1.enemies.balls.length; i++){
        var ballsData = level1.enemies.balls[i];
        var arcsData  = level1.enemies.arcs[i];
        var ball = new Ball(ballsData.x + center.left, ballsData.y + center.top, level1.config.balls.radius, level1.config.balls.color);
        var arc = new Arco(arcsData.x + center.left, arcsData.y + center.top, arcsData.r, arcsData.angle, arcsData.speed, level1.config.arcs.color);
        game.objects.enemies[i] = new Enemy(ball, arc, creator.level1.enemies.speeds[i], creator.level1.enemies.types[i]);
    }


    //                                  Turrets
    // ----------------------------------------------------------------------------- //
    for(var i = 0; i<level1.turrets.length; i++){
        var turretData = level1.turrets[i];
        game.objects.turrets[i] = new Turret(turretData.x + center.left, turretData.y + center.top, turretData.r, turretData.color, turretData.speed,
                                             turretData.shootRate, turretData.maxTimeAlive, turretData.missileSpeed);
    }
    
    
    //                                  Others
    // ----------------------------------------------------------------------------- //

    //Key
    var keyData = level1.key;
    game.objects.key = new Box(keyData.x + center.left, keyData.y + center.top, keyData.size, keyData.size, keyData.color, keyData.fill);

    //Stealth bar
    var stealthData = level1.stealth;
    game.stealth = new HealthBar(stealthData.x + center.left, stealthData.y + center.top, stealthData.w, stealthData.h);

    //Finish line
    var finishData = level1.finish;
    game.objects.finish = new Box(finishData.x + center.left, finishData.y + center.top, finishData.w, finishData.h, finishData.color, level1.config.boxes.fill);
    
    //End screens
    game.grid.winScreen = new EndGame(level1.config.screens.background, level1.config.screens.color, level1.endScreens.win.text);
    game.grid.loseScreen = new EndGame(level1.config.screens.background, level1.config.screens.color, level1.endScreens.lose.text);
}
