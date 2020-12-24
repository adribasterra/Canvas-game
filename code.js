
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

    for(var i = 0; i<game.objects.enemies.length; i++){
        game.objects.enemies[i].update(deltaTime);
        if(aabbCollision(game.objects.enemies[i].ball, game.player, true, true) && keyPressed[controls.playerKILL]) {
            game.objects.enemies[i].dead = true;
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

        for(var i = 0; i<game.objects.enemies.length; i++){
            game.objects.enemies[i].render(game.context);
        }
        if(!game.player.hasKey) game.objects.key.render(game.context);
    
        game.stealth.render(game.context);
    }
}
//#endregion
