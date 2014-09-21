var window_size = 	new Vec2(window.innerWidth, window.innerHeight);
var ratio		=	new Vec2(window_size.X / surface.bounds.W, window_size.Y / surface.bounds.H);

function renderLoop() {
	setInterval(function() { 
		Tweener.update();
	}, 1000 / 50);
	setInterval(function() { 
		drawSkiJump(); 
	}, 1000 / 30);
}
