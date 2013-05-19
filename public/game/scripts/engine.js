/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	Engine
	This contains the classes that manages the 3D renderer
	
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/


/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	Globals
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

// This object
var engine = function() {
    
    /* Game engine */
	this.renderer,
	this.camera,
	this.controls;
		
	this.duration = 100,
	this.keyframes = 5,
	this.animOffset = 0,
	this.interpolation = this.duration / this.keyframes,
	this.lastKeyframe = 0, this.currentKeyframe = 0;
	this.objects = 	{
						players: [],
						bots: [],
						projectiles: [],
						environment: []
					};
    return this;
}

/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	Function definitions
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

engine.prototype.createScene = function () {
/* 
	Create basic scene objects - sky, etc
*/
	scene = new THREE.Scene();
	//scene.add(camera);
	
	var skyGeo = new THREE.CylinderGeometry(M / 2, M / 2, M, 64	, 64, false);

	var sky_materials = [ new THREE.MeshBasicMaterial({ 
			color: 0x66CCFF,
			shading: THREE.SmoothShading, 
			side: THREE.DoubleSide
		}),
		 new THREE.MeshBasicMaterial( { color: 0x002244, side: THREE.DoubleSide,  } )
		 ];
		 
	for ( var i = 0; i < skyGeo.faces.length; i++ ) 
	{
			if  (skyGeo.faces[ i ].centroid.y >  -16000) {
				skyGeo.faces[ i ].materialIndex = 0;
			}
			else {
				skyGeo.faces[ i ].materialIndex = 1;
			}
	}
	
	sky = new THREE.Mesh(skyGeo, new THREE.MeshFaceMaterial(sky_materials));
	sky.name = "sky";
	scene.add(sky);
	
	water = [];
	water.push(new effects.water.makeWater(M));
	scene.add(water[0]);
	
	effects.water.update();
	
	cloudEffect({x: -240000, y: 60000, z: -240000});
		
	hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
	hemiLight.name = "light1";
	hemiLight.color.setRGB( 0.9, 0.95, 1 );
	hemiLight.groundColor.setRGB( 0.6, 0.75, 1 );
	hemiLight.position.set( 0, M, 0 );
	scene.add( hemiLight );
	if (window.location.href.indexOf("editor") > 0) {
		controls.noRotate = true;
		ui.makeDialog("editor_tools", ui.editor.makeControls());
		$("#editor_tools .button").button();
		$("#editor_tools .menu").menu();
		
		ui.makeDialog("properties", ui.editor.properties.makeControls());
		ui.makeDialog("transform", ui.editor.transform.makeControls());
		ui.editor.transform.render();
		
	}
}	

engine.prototype.animate = function () {
	var delta = clock.getDelta();
	var time = new Date().getTime() / 1000;
	handleParticles(delta);
	handleBullets(delta);
	var animTime = new Date().getTime() % engine.duration;
	var keyframe = Math.floor( animTime / engine.interpolation ) + engine.animOffset;
	
	TWEEN.update();
	var shipsMoving = false;
	
	var playerHeightOk = false;
	
	if (!player) { playerHeightOk = true; }
	else {
		if (player.position.y < 80000) {
			playerHeightOk = true;
		}
	}
	
	if ((water.length  >= 1)&&(playerHeightOk == true)){
		var myTime = clock.getElapsedTime() * 10;
		
		for (var i = 0; i < water[0].geometry.vertices.length; i++) {
			var n = Math.sin( i / 5 + ( myTime + i ) /  7);
			water[0].geometry.vertices[i].z += 5.654321 * n;
			water[0].geometry.vertices[i].y = 222.654321 * n;
		}
		water[0].geometry.verticesNeedUpdate = true;
	}
	
	if (player) {	
		scene.children[1].rotation.y = Math.cos(delta) / 15000;

		if  (player.velocity != 0) {
			player.velocity *= .996;
		}

		if ( keyframe != engine.currentKeyframe ) {
			player.morphTargetInfluences[ engine.lastKeyframe ] = 0;
			player.morphTargetInfluences[ engine.currentKeyframe ] = 1;
			player.morphTargetInfluences[ keyframe ] = 0;

			engine.lastKeyframe = engine.currentKeyframe;
			engine.currentKeyframe = keyframe;
		}

		player.morphTargetInfluences[ keyframe ] = ( animTime % engine.interpolation ) / engine.interpolation;
		player.morphTargetInfluences[ engine.lastKeyframe ] = 1 - player.morphTargetInfluences[ keyframe ];
		player.updateMatrix();

		objects.players.movePlayer(player.velocity, player.position, objects.players.playerInput(delta));
		if  (player.velocity != 0) {
			player.velocity *= .996;
		}

	}
	
	
	
	ships.forEach(function(ship,index){
		if (ship.position.y < 0) { ship.position.y += 1.2; }
		if (ship.rotation.z != 0) { ship.rotation.z -= ship.rotation.z / 50; }
	});
	
	bots.forEach(function(bot,index){
		if (player) {
			bots[index].children[0].rotation.x = -bots[index].rotation.x;
			bots[index].children[0].rotation.y = -bots[index].rotation.y + player.rotation.y + player.children[0].rotation.y;
			bots[index].children[0].rotation.z = -bots[index].rotation.z;
		}
		if (bot.position.y < 50) { bot.position.y += 3; }
		if (bot.rotation.z != 0) { bot.rotation.z -= bot.rotation.z / 50; }
	});

	
	requestAnimationFrame( engine.animate );
	renderer.render( scene, camera );
	controls.update();
}