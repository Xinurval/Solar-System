import { db } from "./src/backend/db.js";
import { collection, addDoc, getDocs, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

let sun;
let planets = [];
let G = 50;
let numPlanets = 0; 
let destabilise = 0.2;

let newPlanetButton;
let deletePlanetButton;
let titleFont;
let headingFont;

let planetsLoaded = false; // Flag to track if planets are loaded

// setup code here
function setup() {
	
	createCanvas(windowWidth, windowHeight);

	// create sun
	sun = new Body(100, createVector(0, 0), createVector(0, 0), color(255, 221, 33));

	// load planets from firestore
  loadPlanetsFromFirestore();
	console.log(planets)
	// create planets
	for (let i = planets.length; i < numPlanets; i++){
		planets.push( generatePlanet() )
	}

	// load texts
	titleFont = loadFont('/Montserrat-ExtraBold.ttf');
	headingFont = loadFont('/Montserrat-SemiBold.ttf');
	textAlign(CENTER, CENTER);

	// button to generate new planet
	newPlanetButton = createButton("NEW");
  newPlanetButton.mouseClicked(() => planets.push(generatePlanet()));
	newPlanetButton.position(windowWidth - windowWidth / 12.12, windowHeight / 14.01);
	newPlanetButton.size(windowWidth / 14.95, windowHeight / 25.8 + windowHeight / 24.8);	
  newPlanetButton.style("font-family", titleFont); 
	newPlanetButton.style("font-size", `${windowHeight / 24.09}px`);
	newPlanetButton.style("background-color", color(255, 255, 255));
	newPlanetButton.style("border-radius", "5px");

	// button to delete planet
	deletePlanetButton = createButton("DELETE");
	deletePlanetButton.mouseClicked(() => deletePlanet())
	deletePlanetButton.position(windowWidth - windowWidth / 12.12, windowHeight / 6.425);
	deletePlanetButton.size(windowWidth / 14.95, windowHeight / 25.8 + windowHeight / 24.8);
	deletePlanetButton.style("font-family", titleFont); 
	deletePlanetButton.style("font-size", `${windowHeight / 27.535}px`);
	deletePlanetButton.style("background-color", color(255, 255, 255));
	deletePlanetButton.style("border-radius", "5px");

}

function draw() {	
	console.log('draw() is called');
	// put drawing code here
	// centre items
	translate(width/2, height/2);
	background(180);

	// display title text
	textFont(titleFont);
	text("Solar System Simulation", 0, - (windowHeight / 2) + (windowHeight / 14));

	// draw UI for modifying planets
	rect(width / 2.75, -height / 2.05, width / 8, width / 5.33 , 5);
	// display modify heading text
	fill(0);
	textSize(windowWidth / 53);
	textFont(headingFont);
	text("Modify", width / 2 - width / 13.6, -height / 2 + height / 30);
	textSize(windowWidth / 50);

	// draw planets
	if (planetsLoaded) {
		for (let i = 0; i < planets.length; i++){
			sun.attract(planets[i]);
			planets[i].update();
			planets[i].show();
		}
		sun.show();
		}
	}

// resize window
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
	textSize(windowWidth / 50);
	// update buttons
	newPlanetButton.position(windowWidth - windowWidth / 12.12, windowHeight / 14.01);
	newPlanetButton.size(windowWidth / 14.95, windowHeight / 25.8 + windowHeight / 24.8);	
	newPlanetButton.style("font-size", `${windowHeight / 24.09}px`);
	deletePlanetButton.position(windowWidth - windowWidth / 12.12, windowHeight / 6.425);
	deletePlanetButton.size(windowWidth / 14.95, windowHeight / 25.8 + windowHeight / 24.8);
	deletePlanetButton.style("font-size", `${windowHeight / 27.535}px`);
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

	// planet mass
	let planetMass = random(5, 30)

	// store planet data in Firestore
	storePlanetData(planetPos, planetVel, planetColor, planetMass);

	return new Body(planetMass, planetPos, planetVel, planetColor)
	
}

async function storePlanetData(planetPos, planetVel, planetColor, planetMass) {
  try {
    const planetRef = await addDoc(collection(db, "planets"), {
      x: planetPos.x,
      y: planetPos.y,
      vx: planetVel.x,
      vy: planetVel.y,
      r: planetColor.levels[0], // Red component
      g: planetColor.levels[1], // Green component
      b: planetColor.levels[2], // Blue component
      mass: planetMass
    });
    console.log("Planet data stored with ID:", planetRef.id);
  } catch (error) {
    console.error("Error storing planet data:", error);
  }
}


async function loadPlanetsFromFirestore() {
  try {
    const planetsSnapshot = await getDocs(collection(db, "planets"));

    planetsSnapshot.forEach(doc => {
      const planetData = doc.data();
      const planetPos = createVector(planetData.x, planetData.y);
      const planetVel = createVector(planetData.vx, planetData.vy);
      const planetColor = color(planetData.r, planetData.g, planetData.b);
      const planetMass = planetData.mass;
      planets.push(new Body(planetMass, planetPos, planetVel, planetColor));
    });
    planetsLoaded = true; // Set flag to true when planets are loaded

  } catch (error) {
    console.error("Error loading planets from Firestore:", error);
  }
}

async function deletePlanet() {
  try {
    // Get the first planet's document ID from Firestore
    const planetsSnapshot = await getDocs(collection(db, "planets"));
    const firstPlanetDocId = planetsSnapshot.docs[0].id;

    // Delete the document from Firestore
    await deleteDoc(doc(db, "planets", firstPlanetDocId));
    console.log("Planet deleted from Firestore");

    // Remove the planet from the array
    planets.splice(0, 1);
    console.log("Planet removed from array");

  } catch (error) {
    console.error("Error deleting planet:", error);
  }
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

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;