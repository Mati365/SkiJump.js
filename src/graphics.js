function gColor(r, g, b, a) {
	if(r instanceof gColor)
		this.copy(r);
	else {
		this.r	=	r;
		this.g	=	g;
		this.b	=	b;
		this.a	=	a;
	}
	
	this.copy	=	function(color) {
		this.r	=	color.r;
		this.g	=	color.g;
		this.b	=	color.b;
		this.a	=	color.a;
	}
	this.toString	=	function() {
		return 'rgba('+ 
					this.r + ',' +
					this.g + ',' +
					this.b + ',' +
					(this.a < 0 ? 0 : this.a) + 
					')';
	}
}
gColor.WHITE	=	new gColor(255, 255, 255, 1);
gColor.RED		=	new gColor(255, 0, 0, 1);
gColor.GREEN	=	new gColor(0, 255, 0, 1);
gColor.BLUE		=	new gColor(0, 0, 255, 1);
gColor.BLACK	=	new gColor(0, 0, 0, 1);

function gCanvas(src, bounds) {
	this.canvas	=	src;
	this.ctx	=	src.getContext('2d');
	this.bounds	=	isSet(bounds) ? bounds : new Rect(0, 0, src.width, src.height);
	this.center	=	new Vec2(0, 0);
	
	this.canvas.width	=	this.bounds.W;
	this.canvas.height	=	this.bounds.H;
	
	this.ctx.mozImageSmoothingEnabled 		= 	false;
	this.ctx.webkitImageSmoothingEnabled 	= 	false;
	this.ctx.msImageSmoothingEnabled 		= 	false;
	this.ctx.imageSmoothingEnabled 			= 	false;
}
function gTile(image, cell_bounds) {
	this.image			=	image;
	this.cell_bounds	=	cell_bounds;
	this.tile_bounds 	= 	new Vec2(
								this.image.width / cell_bounds.X, 
								this.image.height / cell_bounds.Y); 
	this.tiles			=	[];
	this.tiles_count	=	this.tile_bounds.X * this.tile_bounds.Y;
		
	this.splitImage		=	function() {
		var canvas = 	new gCanvas(
							document.createElement('canvas'), 
							new Rect(0, 0, this.image.width, this.image.height));
		drawCanvas(this.image, canvas, Vec2.zero);
		for(var i = 0;i < this.tile_bounds.Y; ++i)
			for(var j = 0;j < this.tile_bounds.X; ++j) {
					var img_canvas = new gCanvas(
								document.createElement('canvas'), 
								new Rect(0, 0, this.cell_bounds.X, this.cell_bounds.Y));
					img_canvas.ctx.putImageData(
								canvas.ctx.getImageData(
										j * this.cell_bounds.X, 
										i * this.cell_bounds.Y, 
										this.cell_bounds.X, 
										this.cell_bounds.Y),
								0, 0);
					this.tiles.push(img_canvas);
				}
	}
	this.splitImage();
	
	this.resizeImages = function(size) {
		for(key in this.tiles)
			this.tiles[key].bounds.copy(size);
	}
	this.getImage = function(X, Y) {
		return this.tiles[Y * this.tile_bounds.X + X];
	}
	this.getByIndex	=	function(index) {
		return this.tiles[index];
	}
}

/** Menedżer zasobów, tutaj można walnąć sweetaśni pasek ładowania */
function ContentManager() {}
ContentManager.images = [ ];
ContentManager.interval = null;
ContentManager.registerImage = function(src) {
	var img = new Image();
	img.src = src;
	
	this.images.push(img);
	return img;
}
ContentManager.isLoaded = function(callback) {
	console.log('Loading..');
	for(var i = 0;i < this.images.length; ++i) {
		var img = this.images[i];
		if(!img.complete || 
			(typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0))
			return;
	}
	clearInterval(this.interval);
	callback();
}
ContentManager.registerLoadCallback = function(callback) {
	this.interval = setInterval(
				function() { ContentManager.isLoaded(callback) } , 
				10);
}
