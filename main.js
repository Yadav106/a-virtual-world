const carCanvas = document.getElementById("carCanvas");
carCanvas.width = window.innerWidth - 330;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

carCanvas.height = window.innerHeight;
networkCanvas.height = window.innerHeight - 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const miniMapCanvas = document.getElementById("miniMapCanvas");
miniMapCanvas.width = 300;
miniMapCanvas.height = 300;

// const worldString = localStorage.getItem("world");
// const worldInfo = worldString ? JSON.parse(worldString) : null;
// const world = worldInfo
//   ? World.load(worldInfo)
//   : new World(new Graph());

const viewport = new Viewport(carCanvas, world.zoom, world.offset);
const miniMap = new MiniMap(miniMapCanvas, world.graph, 300);


const N = 1;
const cars = generateCars(N);

let bestCar = cars[0];

if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
    // cars[i].brain = bestBrain; // best brain stored locally
    if (i != 0) {
      NeuralNetwork.mutate(cars[i].brain, 0.1);
    }
  }
}

const traffic = [];
const roadBorders = world.roadBorders
.map(s => [s.p1, s.p2]);

animate();

function save() {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function saveInJson() {
  const bestBrain = JSON.parse(localStorage.getItem("bestBrain"));
  console.log(bestBrain);

  const jsonData = JSON.stringify(bestBrain, null, 2);

  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bestBrain.json';
  link.click();

  URL.revokeObjectURL(url);
}

function discard() {
  localStorage.removeItem("bestBrain");
}

function generateCars(N) {
  const startPoints = world.markings.filter(m => m instanceof Start);

  const startPoint = startPoints.length > 0
    ? startPoints[0].center
    : new Point(100, 100);

  const dir = startPoints.length > 0
    ? startPoints[0].directionVector
    : new Point(0, -1);

  const startAngle = - angle(dir) + Math.PI / 2;
  const cars = [];
  for (let i = 1; i <= N; i++) {
    cars.push(new Car(startPoint.x, startPoint.y, 30, 50, "AI", startAngle));
  }
  return cars;
}

function animate(time) {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(roadBorders, []);
  }

  for (let i = 0; i < cars.length; i++) {
    let car = cars[i];
    car.update(roadBorders, traffic);
  }

  bestCar = cars.find(
    c => c.fitness == Math.max(
      ...cars.map(c => c.fitness)
    )
  );

  world.cars = cars;
  world.bestCar = bestCar;

  viewport.offset.x = - bestCar.x;
  viewport.offset.y = - bestCar.y;

  viewport.reset();
  const viewPoint = scale(viewport.getOffset(), -1);
  world.draw(carCtx, viewPoint, false);
  miniMap.update(viewPoint);

  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx, "red");
  }

  networkCtx.lineDashOffset = -time/50;
  networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);

  Visualizer.drawNetwork(networkCtx, bestCar.brain);
  requestAnimationFrame(animate);
}