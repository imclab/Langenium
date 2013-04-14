/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	LANGENIUM CLIENT 
	
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

$(document).ready(function(){

	initializeClient();
	animate();
	
});


/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	Globals
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

var username = "Saggy Nuts";

/* Game engine */
var 	renderer,
		camera,
		controls;
		
var duration = 100,
	keyframes = 5,
	animOffset = 0,
	interpolation = duration / keyframes,
	lastKeyframe = 0, currentKeyframe = 0;

/* Object definition */
var 		winW = 1024, winH = 768,
			objects = {
							players: [],
							bots: [],
							projectiles: [],
							environment: []
							};


/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	Function Definitions
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

var isFiring = false;
$(document).bind("mousedown", function(event) {
	if (window.location.href.indexOf("editor") > 0) { 
		ui.editor.properties.onClick(event);
	}
	else {
		switch (event.which) {
			case 1:
				isFiring = true;
				break;
			case 2:
				//zoom IGNORE
				break;
			case 3:
				//rotate
				break;
		}
	}
});

function initializeClient() {
/*
	Initializes the client... :P
*/
	updateWinSizeVariables();
	renderer = new THREE.WebGLRenderer({
		antialias : true
	});
	
	camera = new THREE.PerspectiveCamera( 45, (winW) / (winH), 1, M / 3 * 2 );
	//camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 500, 1000 );

	camera.position.y = 12;
	camera.position.z = 75;

	
	controls = new THREE.TrackballControls(camera);
	controls.target.set(0, 0, 0);
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.5;
	
	createScene();
	
	renderer.setSize( winW, winH);
	$("#game").append(renderer.domElement);
	
	window.addEventListener( 'resize', onWindowResize, false );
}

function createScene() {
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
		ui.editor.transform.refresh();
		
	}
}	

function animate() {
	var delta = clock.getDelta();
	var time = new Date().getTime() / 1000;
	handleParticles(delta);
	handleBullets(delta);
	var animTime = new Date().getTime() % duration;
	var keyframe = Math.floor( animTime / interpolation ) + animOffset;
	
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
			water[0].geometry.vertices[i].z += 11.654321 * n;
			water[0].geometry.vertices[i].y = 444.654321 * n;
		}
		water[0].geometry.verticesNeedUpdate = true;
	}
	
	if (player) {	
		scene.children[1].rotation.y = Math.cos(delta) / 15000;

		if  (player.velocity != 0) {
			player.velocity *= .996;
		}

		if ( keyframe != currentKeyframe ) {
			player.morphTargetInfluences[ lastKeyframe ] = 0;
			player.morphTargetInfluences[ currentKeyframe ] = 1;
			player.morphTargetInfluences[ keyframe ] = 0;

			lastKeyframe = currentKeyframe;
			currentKeyframe = keyframe;
		}

		player.morphTargetInfluences[ keyframe ] = ( animTime % interpolation ) / interpolation;
		player.morphTargetInfluences[ lastKeyframe ] = 1 - player.morphTargetInfluences[ keyframe ];
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

	
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	controls.update();
}

function onWindowResize() {
/*
	Resizes the renderer
*/
	updateWinSizeVariables();
	camera.aspect = winW / winH;
	camera.updateProjectionMatrix();
 
	renderer.setSize( winW, winH );
}

function updateWinSizeVariables(){
/*
	Update the global window variables
*/
	if (document.body && document.body.offsetWidth) {
		winW = document.body.offsetWidth;
		winH = document.body.offsetHeight;
	}
	if (document.compatMode=='CSS1Compat' &&
		document.documentElement &&
		document.documentElement.offsetWidth ) {
		winW = document.documentElement.offsetWidth;
		winH = document.documentElement.offsetHeight;
	} 
	if (window.innerWidth && window.innerHeight) {
		winW = window.innerWidth;
		winH = window.innerHeight;
	}
}