
// const gameHeight = 1080;
// const gameWidth = 1920;

class MapCreator {

    constructor(){
        this.ballsColor = "#6262d6";
        this.arcColor = "#c1e1ffa0";
        this.boxesPerRow = 96;
        this.boxesPerColumn = 54;
        this.level1 = {
            grid : {
                x : 30,
                y : 30,
                w : 1020,
                h : 660,
                color : "#C255EA90",
                fill : true,
            },
            player : {
                x : 100,
                y : 100,
                radius : 10,
                color : "#000000",
                speed : 200
            },
            config : {
                boxes : {
                    color : "#69056f",
                    fill : true,
                    size : 20
                },
                balls : {
                    radius : 10,
                    color : "#6262d6"
                },
                arcs : {
                    color : "#c1e1ffa0"
                },
                screens : {
                    background : "#0F0F0FF0",
                    color : "#FFFFFF",
                }
            },
            //Boxes
            boxes : [
                { x: 30,     y: 30,    w: 1020,   h:  -1 },     //Upper wall
                { x: 30,     y: 670,   w: 1020,   h:  -1 },     //Lower wall
                { x: 30,     y: 30,    w:   -1,   h: 660 },     //Left  wall
                { x: 1030,   y: 30,    w:   -1,   h: 660 },     //Rigth wall
                { x: 250,    y: 30,    w:   -1,   h: 500 },     //Vertical wall
                { x: 500,    y: 350,   w:   -1,   h: 340 },     //Vertical wall 2
                { x: 250,    y: 200,   w:  270,   h:  -1 },     //Horizontal wall 1
                { x: 600,    y: 500,   w:  330,   h:  -1 }
            ],
            
            //Enemies
            enemies : {
                balls : [
                    { x:  60, y: 200 },
                    { x: 240, y: 400 },
                    { x: 385, y: 240 },
                    { x: 760, y: 270 },
                    { x: 760, y: 270 },
                    { x: 170, y: 600 },
                    { x: 330, y: 125 },
                    { x: 600, y: 400 },
                    { x: 600, y: 600 }
                ],
                arcs : [
                    { x:  60, y: 200, r: 120, angle:   0, speed: 0 },
                    { x: 240, y: 400, r: 150, angle: 2/3, speed: 0 },
                    { x: 385, y: 240, r: 150, angle: 1/3, speed: 0 },
                    { x: 760, y: 270, r: 210, angle:   0, speed: 2 },
                    { x: 760, y: 270, r: 210, angle:   1, speed: 2 },
                    { x: 170, y: 600, r: 210, angle:1.85, speed: 0 },
                    { x: 330, y: 125, r: 120, angle:   0, speed: 1 },
                    { x: 600, y: 400, r: 120, angle:   0, speed: 1 },
                    { x: 600, y: 600, r: 120, angle:   0, speed: 2 }
                ],
                types : [
                    enemyType.Fixed,
                    enemyType.Fixed,
                    enemyType.Fixed,
                    enemyType.Rotating,
                    enemyType.Rotating,
                    enemyType.Moving,
                    enemyType.Moving,
                    enemyType.Moving,
                    enemyType.Moving      
                ],
                speeds : [
                    0,
                    0,
                    0,
                    0,
                    0,
                    100,
                    100,
                    100,
                    200
                ]
            },
            key : {
                x : 300,
                y : 100,
                size : 15,
                color : "#FFFFFF",
                fill : false
            },
            stealth : {
                x : 30,
                y : 690,
                w : 1020,
                h : 20
            },
            finish : {
                x : 900,
                y : 630,
                w : 120,
                h : 30,
                color : "#f5eef6"
            },
            endScreens : {
                win : {
                    text : "Win"
                },
                lose : {
                    text : "Game over"
                }
            }
        };

        this.level2 = {
            //Soon
        }
    }
    
    //#region Method way

    // level1(){
    //     var boxesPerRow = 96;
    //     var boxesPerColumn = 54;
    //     const player = {
    //         x : 100,
    //         y : 100,
    //         radius : 10,
    //         color : "#FF0000",
    //         speed : 200
    //     };
    //     const config = {
    //         boxes : {
    //             color : "#69056f",
    //             fill : true,
    //             size : 20
    //         },
    //         balls : {
    //             color : "#6262d6"
    //         },
    //         arc : {
    //             color : "#c1e1ffa0"
    //         }
    //     };
    //     //Boxes
    //     const boxes = [
    //         {x: 0, y: 0},

    //     ];
        
    //     //Enemies
    //     const enemies = {
    //         balls : [
    //             {x:  60, y: 200, r: 10, color: config.balls.color},
    //             {x: 240, y: 400, r: 10, color: config.balls.color},
    //             {x: 385, y: 240, r: 10, color: config.balls.color},
    //             {x: 760, y: 270, r: 10, color: config.balls.color},
    //             {x: 760, y: 270, r: 10, color: config.balls.color},
    //             {x: 170, y: 600, r: 10, color: config.balls.color},
    //             {x: 330, y: 125, r: 10, color: config.balls.color},
    //             {x: 600, y: 400, r: 10, color: config.balls.color},
    //             {x: 600, y: 600, r: 10, color: config.balls.color}
    //         ],
    //         arcs : [
    //             {x:  60, y: 200, start: 120, angle:   0, speed: 0, color: config.arc.color},
    //             {x: 240, y: 400, start: 150, angle: 2/3, speed: 0, color: config.arc.color},
    //             {x: 385, y: 240, start: 150, angle: 1/3, speed: 0, color: config.arc.color},
    //             {x: 760, y: 270, start: 210, angle:   0, speed: 2, color: config.arc.color},
    //             {x: 760, y: 270, start: 210, angle:   1, speed: 2, color: config.arc.color},
    //             {x: 170, y: 600, start: 210, angle:1.85, speed: 0, color: config.arc.color},
    //             {x: 330, y: 125, start: 120, angle:   0, speed: 1, color: config.arc.color},
    //             {x: 600, y: 400, start: 120, angle:   0, speed: 1, color: config.arc.color},
    //             {x: 600, y: 600, start: 120, angle:   0, speed: 2, color: config.arc.color}
    //         ],
    //         types : [
    //             enemyType.Fixed,
    //             enemyType.Fixed,
    //             enemyType.Fixed,
    //             enemyType.Rotating,
    //             enemyType.Rotating,
    //             enemyType.Moving,
    //             enemyType.Moving,
    //             enemyType.Moving,
    //             enemyType.Moving      
    //         ]
    //     }
    // }
    //#endregion
}