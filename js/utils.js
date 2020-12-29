
const gameHeight = 710;
const gameWidth = 1510;

function createFullScreenCanvas(){
	//create the element
	var canvas = document.createElement("canvas");
	//make it fullscreen
	canvas.width = gameWidth;
	canvas.height = gameHeight;
	canvas.style.position = "absolute";
	
	//add to the DOM
	document.body.appendChild(canvas);
	return canvas;
}

