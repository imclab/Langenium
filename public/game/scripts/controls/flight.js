/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	Flight
	This contains input handlers for flying ships
	
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/


/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	Globals
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

// This object
var flight = function() {
    
    this.camera = new THREE.PerspectiveCamera( 45, (client.winW / client.winH), 1, M / 3 * 2 );
    this.camera.position.y = 3;
	this.camera.position.z = 35;
    this.enabled = true;

    return this;
}

/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	Function definitions
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

$(document).bind("mousedown", function(event) {
	if ((controls.flight)&&(controls.flight.enabled == true)) {
		if (window.location.href.indexOf("editor") > 0) { 
			editor.properties.onClick(event);
		}
		else {
			switch (event.which) {
				case 1:
					client.isFiring = true;
					break;
				case 2:
					//zoom IGNORE
					break;
				case 3:
					//rotate
					break;
			}
		}
	}
});

flight.prototype.input = function (delta){
	var keyboardInput = { d: delta, pZ: 0, pY: 0, rY: 0, fire: client.isFiring },
			move = false;
	
	if (keyboard.pressed("W")){
		if (player.velocity > -7.5) { player.velocity -= .75; }
		move = true;
		keyboardInput.pZ = 1;
	}
	if (keyboard.pressed("S")){
		if (player.velocity < 5) { player.velocity += .75; }
		move = true;
		keyboardInput.pZ = -1;
	}
	// rotate left/right
	if (keyboard.pressed("A")) {
		move = true;
		keyboardInput.rY = 1;
	}
	if (keyboard.pressed("D")) {
		move = true;
		keyboardInput.rY = -1;
	}
	if (keyboard.pressed(" ")) {
		if (player.position.y < 100000){														// <--------- these rules will need to go to the server
			move = true;																				// <--------- these rules will need to go to the server
			keyboardInput.pY = 1;																// <--------- these rules will need to go to the server
		}
	}
	if (keyboard.pressed("shift")){
		if (player.position.y > -100000){ 														// <--------- these rules will need to go to the server
			move = true;																				// <--------- these rules will need to go to the server
			keyboardInput.pY = -1;																// <--------- these rules will need to go to the server
		}
	}
	if (keyboard.pressed("esc")){
		if (window.location.href.indexOf("editor") > 0) {
		}
	}
	if (client.isFiring == true) {
		move = true;
	}
	
	if (move == true) {
		events.socket.emit('move', keyboardInput);
	}
	return keyboardInput;
}

flight.prototype.move = function (velocity, playerPosition, data) {
	
	var 		velocityYChange = 600 * data.d,
				rotateAngle = 0.01744444444444444444444444444444 * 100 * data.d;

	velocity = velocity * 100 * data.d;
	if (window.location.href.indexOf("editor") > 0) { 
		if (editor.sky_camera_active == true) {
			velocity *= 100 ; 
		}
		else {
			velocity *= 50 ; 
			velocityYChange *= 50;
		}
	}


	if (data.rY > 0) { data.rY = rotateAngle; }						// left
	if (data.rY < 0) { data.rY = -rotateAngle; }						// right
	data.rY = (data.rY + data.rY * Math.PI / 180);
	
	if (data.pY > 0) { data.pY = velocityYChange; } 			// up
	if (data.pY < 0) { data.pY = -(velocityYChange); } 		// down

	data.rY += player.rotation.y;
	data.pY += player.position.y;
	
	var 	diffX = velocity * Math.sin(player.rotation.y),
			diffZ = velocity * Math.cos(player.rotation.y);

	data.pX = playerPosition.x + diffX;
	data.pZ = playerPosition.z + diffZ;
		
	var moveVector = new THREE.Vector3(data.pX, data.pY, data.pZ);
	var playerPositionVector = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
	
	var collisions = events.detectCollision(playerPositionVector, moveVector, objects.world_map);
	
	if (collisions.length > 0) {
		collisions.forEach(function(collision, index){
			if (collision.distance < 90) {
		
				if (collision.point.x > playerPosition.x) 
					{ data.rY -= collision.distance / 10000; }
				if (collision.point.x < playerPosition.x) 
					{ data.rY += collision.distance / 10000; }
				
				if (data.pX != 0) {
					data.pX  = player.position.x + data.pX * -.001;
				}
				if (data.pY != 0) {
					data.pY = player.position.y;
				}
				if (data.pZ != 0) {
					data.pZ  = player.position.z + data.pZ * -.001;
				}
			}
		}); 
	}
	
	// moves the water tiles position 
	
	for (var tile = 0; tile < water.length; tile++) {
	
		var rotateWater =  data.rY  * -1;
		water[tile].material.map.offset.x-= Math.sin(rotateWater) * velocity / 100000;
		water[tile].material.map.offset.y -= Math.cos(rotateWater) * velocity / 100000;
		
		if (tile == 0) {
			water[0].position.x = player.position.x;
			water[0].position.z = player.position.z;
		}
		else {
			water[tile].position.x = water[tile].position.ox + data.pX;
			water[tile].position.z = water[tile].position.oz + data.pZ;
		}
	}	
	
	var height_diff = 5000 + 2000 * (water.length-1);
	
	sky.position.x = data.pX;
	
	sky.position.z = data.pZ;
	
	
	var 	sky_scale = 1 + (player.position.y / 20000);
	
	effects.water.update();
	
	// set sky scale
	if (sky_scale > 1) {
		sky.position.y =  16000 * (1 + (player.position.y / 20000));
		sky.scale.set(sky_scale,sky_scale,sky_scale);
	}
	
	
	sky.updateMatrixWorld();
		
	events.moveShip(player, true, { name: "move", type: "player", details: data });
	var 		html = 		"<div><strong>";
				html +=	"<strong>Player</strong><br />pX:&nbsp;"+Math.round(player.position.x)+"<br />pY:&nbsp;"+Math.round(player.position.y)+"<br />pZ:&nbsp;"+Math.round(player.position.z);
				html += 	"<br />rY:&nbsp;"+Math.round(player.rotation.y)+"<br />d:&nbsp;" + Math.round(data.d * 1000) + "</div>";
	$("#playerPosition").html(html);
}
