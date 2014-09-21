function toRad(degrees) {
	return degrees * Math.PI / 180;
}

function printText(ctx, x, y, text, size, color, center) {
	ctx.fillStyle = color;
	ctx.font = "bold " + size + "px Joystix";
	ctx.fillText(text, 
					isSet(center) && center ? 
						(surface.bounds.W / 2 / config.HUD_SCALE.X - ctx.measureText(text).width / 2) 
						: x, 
					y);
}
function fillRect(ctx, rect, color) {
	ctx.fillStyle = color.toString();
	ctx.fillRect(rect.X, rect.Y, rect.W, rect.H);
}
function drawLine(ctx, begin, end, color, stroke) {
	ctx.beginPath();
	ctx.lineWidth = stroke;
	ctx.strokeStyle = color;
	ctx.moveTo(begin.X, begin.Y);
	ctx.lineTo(end.X, end.Y);
	ctx.stroke();
}
function drawRect(ctx, rect, fill_color, stroke_color, stroke) {
	ctx.beginPath();
	ctx.rect(rect.X, rect.Y, rect.W, rect.H);
	ctx.fillStyle = fill_color;
	ctx.fill();
	ctx.lineWidth = stroke;
	ctx.strokeStyle = stroke_color;
	ctx.stroke();
}
function drawResizedCanvas(source, destination, pos, bounds) {
	destination.ctx.drawImage(
				source.canvas, 
				pos.X, 
				pos.Y, 
				bounds.X, 
				bounds.Y);
}
function drawCanvas(source, destination, pos) {
	if(source instanceof gCanvas)
		destination.ctx.drawImage(
					source.canvas, 
					pos.X, 
					pos.Y, 
					source.bounds.W, 
					source.bounds.H);
	else if(source instanceof Image)
		destination.ctx.drawImage(
					source, 
					pos.X, 
					pos.Y);
	else
		destination.ctx.putImageData(
					source, 
					pos.X, 
					pos.Y);
}
// nie chce mi sie babrac z opcjonalnymi argumentami
function drawCutCanvas(source, destination, pos, bounds, inner_pos, inner_bounds) {
	destination.ctx.drawImage(
				source.canvas, 
				inner_pos.X,
				inner_pos.Y,
				inner_bounds.W,
				inner_bounds.H,
				pos.X, 
				pos.Y, 
				bounds.W, 
				bounds.H);
}
function drawRotatedCanvas(source, destination, pos, angle, center) {
	var	ctx	=	destination.ctx;
	
	ctx.save();
	ctx.translate(pos.X, pos.Y);
	ctx.translate(center.X, center.Y);
	ctx.rotate(toRad(angle));
	ctx.translate(-center.X, -center.Y);
	
	drawCanvas(source, destination, Vec2.zero);
	
	ctx.restore();
}
