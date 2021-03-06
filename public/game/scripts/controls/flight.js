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
    
    this.camera = new THREE.PerspectiveCamera( 45, (client.winW / client.winH), 1, M * 2 );
    this.camera.position.y = 3;
	this.camera.position.z = 35;
    this.enabled = false;

    return this;
}

/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	Evemnt Binders
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

$(document).bind("mousedown", function(event) {
	if ((controls.flight && 
		controls.enabled == true && 
		controls.flight.enabled == true)) 
	{
		switch (event.which) {
			case 1:
				client.isFiring = true;
				break;
			case 2:
				// zoom IGNORE
				break;
			case 3:
				// rotate IGNORE
				break;
		}
	}

});
$(document).bind("mouseup", function(event) {
	if ((controls.flight && 
		controls.enabled == true && 
		controls.flight.enabled == true)) 
	{
		switch (event.which) {
			case 1:
				client.isFiring = false;
				break;
			case 2:
				// zoom IGNORE
				break;
			case 3:
				// rotate IGNORE
				break;
		}
	}
});

$(document).bind("contextmenu",function(){
    return false;
}); 

/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	Function definitions
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/


flight.prototype.input = function (delta){
	var keyboardInput = { d: delta, pZ: 0, pY: 0, rY: 0, fire: client.isFiring, client_position: player.position },
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
	if (keyboard.pressed("X")){
		controls.flight.enabled = false;
		events.socket.emit('character_toggle');
	}

	if (keyboard.pressed("shift")){
		if (player.position.y > -100000){ 														// <--------- these rules will need to go to the server
			move = true;																				// <--------- these rules will need to go to the server
			keyboardInput.pY = -1;																// <--------- these rules will need to go to the server
		}
	}
	
	if (client.isFiring == true) {
		move = true;
	}
	
	if (move == true) {
		events.socket.emit('move_ship', keyboardInput);
	}
	
	if (controls.flight.camera.rotation.x != 0 && (controls.camera_rotating == false || controls.mouse.changeX == false)) {
		controls.flight.camera.rotation.x *= .89;
	}
	if (keyboardInput.rY == 0 && controls.flight.camera.rotation.y != 0 && (controls.camera_rotating == false || controls.mouse.changeX == false)) {
		controls.flight.camera.rotation.y *= .89;
	}
	if (keyboardInput.rY == 0 && controls.flight.camera.rotation.z != 0 && (controls.camera_rotating == false || controls.mouse.changeX == false)) {
		controls.flight.camera.rotation.z *= .89;
	}


	if (controls.flight.camera.position.x != 0 && (controls.camera_rotating == false || controls.mouse.changeX == false)) {
		controls.flight.camera.position.x *= .89;
	}

	if (controls.flight.camera.position.z != 35 && (controls.camera_rotating == false || controls.mouse.changeX == false)) {
		if (controls.flight.camera.position.z < 0) {
			controls.flight.camera.position.z *= .89;
		}
		else {
			if (controls.flight.camera.position.z < 36) {
				controls.flight.camera.position.z += delta * 55;
			}
		}
	}
	
	return keyboardInput;
}

flight.prototype.move = function (velocity, playerPosition, data) {
	/*
		This is a client side function to move the world's water, check collisons and softly a ship, however the server response overrides this
	*/
	var velocityYChange = 22 * data.d,
		rotateAngle = 0.01744444444444444444444444444444 * 2;

	
	if (window.location.href.indexOf("editor") > 0) { 
		if (editor.sky_camera_active == true) {
			velocity *= 10 ; 
		}
		else {
			velocity *= 5 ; 
			velocityYChange *= 5;
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
	
	// move the reflection camera
	/*
		effects.water.textureCamera.position.x = player.position.x;
		effects.water.textureCamera.position.z = player.position.z;
		effects.water.textureCamera.lookAt(player.position);
	*/
	
	// moves the water tiles position 
	/*
	for (var tile = 0; tile < effects.water.water_tiles.length; tile++) {
	
		var rotateWater =  data.rY  * -1;
		effects.water.water_tiles[tile].material.map.offset.x-= Math.sin(rotateWater) * velocity / 100000;
		effects.water.water_tiles[tile].material.map.offset.y -= Math.cos(rotateWater) * velocity / 100000;
		
		if (tile == 0) {
			effects.water.water_tiles[0].position.x = data.pX;
			effects.water.water_tiles[0].position.z = data.pZ;
		}
		else {
			effects.water.water_tiles[tile].position.x = effects.water.water_tiles[tile].position.ox + data.pX;
			effects.water.water_tiles[tile].position.z = effects.water.water_tiles[tile].position.oz + data.pZ;
		}
		effects.water.water_tiles[tile].material.needsUpdate = true;
	}	
	*/
	var height_diff = 5000 + 2000 * (effects.water.water_tiles.length-1);
	
	sky.position.x = data.pX;
	
	sky.position.z = data.pZ;
	
	
	var 	sky_scale = 1 + (player.position.y / 20000);
	
	effects.water.update();
	
	// set sky scale
	if (sky_scale > 1) {
		sky.position.y =  15500 * (1 + (player.position.y / 20000));
		sky.scale.set(sky_scale,sky_scale,sky_scale);
	}
	
	
	sky.updateMatrixWorld();
	
	player.move(player, true, { details: data});
	

}
