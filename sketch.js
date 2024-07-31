let sun;
let planets = [];
let G = 50;
let numPlanets = 5; 
let destabilise = 0.2;

let newPlanetButton;
let deletePlanetButton;


// setup code here
function setup() {
	createCanvas(windowWidth, windowHeight);
	
	// create sun
	sun = new Body(100, createVector(0, 0), createVector(0, 0), color(255, 221, 33));

	// create planets
	for (let i = 0; i < numPlanets; i++){
		planets.push( generatePlanet() )
	}

	// setup title text
	font = loadFont('/Montserrat-ExtraBold.ttf');
	textFont(font);
	textSize(windowWidth / 50);
	textAlign(CENTER, CENTER);

	// button to generate new planet
	newPlanetButton = createButton("NEW");
  newPlanetButton.mouseClicked(() => planets.push(generatePlanet()));
  newPlanetButton.position(windowWidth - 132, 15);
	newPlanetButton.size(107, 62);
  newPlanetButton.style("font-family", font); 
	newPlanetButton.style("font-size", "32px");
	newPlanetButton.style("background-color", color(255, 255, 255));
	newPlanetButton.style("border-radius", "5px");

	// button to delete planet
	deletePlanetButton = createButton("DELETE");
	// button.mouseClicked(generatePlanet);
	deletePlanetButton.position(windowWidth - 132, 80);
	deletePlanetButton.size(107, 62);
	deletePlanetButton.style("font-family", font); 
	deletePlanetButton.style("font-size", "28px");
	deletePlanetButton.style("background-color", color(255, 255, 255));
	deletePlanetButton.style("border-radius", "5px");
}

function draw() {	
	// put drawing code here
	// centre items
	translate(width/2, height/2);
	background(180);
	
	// display text
	text("Solar System Simulation", 20, - (windowHeight / 2) + (windowHeight / 14));

	// draw ui for modifying planets
	rect(width / 2 - 220, -height / 2 + 10, 200, 300, 5)

	// draw planets
	for (let i = 0; i < planets.length; i++){
		sun.attract(planets[i]);
		planets[i].update();
		planets[i].show();
	}
	sun.show();
}

// resize window
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
	textSize(windowWidth / 50);
}

// function to generate planets
function generatePlanet(){
	// planet position
	// find random radius to place planet
	let r = random(sun.r, min(windowWidth/ 2, windowHeight/2));
	// find random angle to place planet 
	let theta = random(TWO_PI);
	// calculate position of planet
	let planetPos = createVector(r * cos(theta), r * sin(theta));

	// planet color
	let planetColor = color(random(0, 255), random(0, 255), random(0, 255));

	// planet velocity
	let planetVel = planetPos.copy();
	// set velocity to act at a right angle to planet position from sun 
	planetVel.rotate(HALF_PI);
	// calculate velocity using orbital speed physics equation
	planetVel.setMag(sqrt(G * sun.mass/ planetPos.mag()));
	// reverse direction of planets 20% of time
	if (random(1) < 0.2){
		planetVel.mult(-1);
	}
	// make orbit ellipitcal instead of circular by changing velocity 
	planetVel.mult(random(1 - destabilise, 1 + destabilise));
	return new Body(random(5, 30), planetPos, planetVel, planetColor)
}

// class for celestial bodies		
function Body(_mass, _pos, _vel, _color){
	// set variables for function
	this.mass = _mass;
	this.pos = _pos; 
	this.vel = _vel;
	this.color = _color;
	this.r = this.mass;
	this.path = [];	
	
	// draw on screen
	this.show = function(){
		noStroke(); fill(this.color);
		ellipse(this.pos.x, this.pos.y, this.r, this.r); 
		stroke(30);
		for (let i = 0; i < this.path.length - 2; i++){
			stroke(this.color);
			line(this.path[i].x, this.path[i].y, this.path[i+1].x, this.path[i+1].y,)
		}
	} 
	
	// update and move planet
	this.update = function() {
		// update the position
		this.pos.x += this.vel.x;
		this.pos.y += this.vel.y;
		// update path
		this.path.push(createVector(this.pos.x, this.pos.y));
		// keep tracing path short
		if (this.path.length > 50){
			// remove first part of path
			this.path.shift(0, 1);
		}
	}

	this.applyForce = function(f){
		this.vel.x += f.x / this.mass // f = ma -> a = f/m
		this.vel.y += f.y / this.mass // f = ma -> a = f/m
	}

	// find gravity force of planet to the sun
	this.attract = function(child){
		// calculate distance between sun and planet
		let r = dist(this.pos.x, this.pos.y, child.pos.x, child.pos.y);
		// find force (vector)
		// points from planet towards sun
		let f = this.pos.copy().sub(child.pos);
		// set magnitude using universal gravitation physics equation 
		f.setMag( (G * this.mass * child.mass) / (r * r)); 
		child.applyForce(f);
	}
}