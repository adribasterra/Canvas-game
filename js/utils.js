
const gameHeight = 710;
const gameWidth = 1510;

function createFullScreenCanvas(){
	//create the element
	var canvas = document.createElement("canvas");
	//make it fullscreen
	canvas.width = gameWidth;
	canvas.height = gameHeight;
	canvas.style.position = "absolute";
	// canvas.style.left = window.innerWidth / 2 - gameWidth / 2;
	// canvas.style.top = window.innerHeight / 2 - gameHeight / 2;
	
	//add to the DOM
	document.body.appendChild(canvas);
	return canvas;
}
