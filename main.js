import * as THREE from 'three';

// Game state
const gameState = {
    level: 1,
    time: 0,
    distance: 0,
    isParked: false,
    carSpeed: 0,
    carRotation: 0,
    maxSpeed: 0.3,
    acceleration: 0.01,
    braking: 0.02,
    turnSpeed: 0.03,
    keys: {}
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Road markings
function createRoadMarkings() {
    const markingGeometry = new THREE.PlaneGeometry(1, 4);
    const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    for (let i = -40; i < 40; i += 8) {
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.rotation.x = -Math.PI / 2;
        marking.position.set(i, 0.01, 0);
        scene.add(marking);
    }
}
createRoadMarkings();

// Police car
let policeCar;
function createPoliceCar() {
    const carGroup = new THREE.Group();

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x000080 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    carGroup.add(body);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.8, 0.8, 2);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x000080 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1.4;
    roof.position.z = -0.3;
    roof.castShadow = true;
    carGroup.add(roof);

    // Police lights
    const lightGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.4);
    const redLightMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });
    const blueLight = new THREE.Mesh(lightGeometry, new THREE.MeshStandardMaterial({
        color: 0x0000ff,
        emissive: 0x0000ff,
        emissiveIntensity: 0.5
    }));
    blueLight.position.set(-0.3, 1.9, -0.3);
    carGroup.add(blueLight);

    const redLight = new THREE.Mesh(lightGeometry, redLightMaterial);
    redLight.position.set(0.3, 1.9, -0.3);
    carGroup.add(redLight);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });

    const wheelPositions = [
        [-1.1, 0.4, 1.2],
        [1.1, 0.4, 1.2],
        [-1.1, 0.4, -1.2],
        [1.1, 0.4, -1.2]
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });

    // Headlights
    const headlightGeometry = new THREE.CircleGeometry(0.2, 16);
    const headlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.3
    });

    [-0.7, 0.7].forEach(x => {
        const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlight.position.set(x, 0.5, 2.01);
        carGroup.add(headlight);
    });

    carGroup.position.set(0, 0, -30);
    scene.add(carGroup);
    return carGroup;
}
policeCar = createPoliceCar();

// Parking spot
let parkingSpot;
function createParkingSpot(level) {
    if (parkingSpot) {
        scene.remove(parkingSpot);
    }

    const spotGroup = new THREE.Group();

    // Parking lines
    const lineGeometry = new THREE.BoxGeometry(0.2, 0.1, 8);
    const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const leftLine = new THREE.Mesh(lineGeometry, lineMaterial);
    leftLine.position.set(-2, 0.05, 0);
    spotGroup.add(leftLine);

    const rightLine = new THREE.Mesh(lineGeometry, lineMaterial);
    rightLine.position.set(2, 0.05, 0);
    spotGroup.add(rightLine);

    const backLine = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 0.2), lineMaterial);
    backLine.position.set(0, 0.05, -4);
    spotGroup.add(backLine);

    // "POLICE" text marker
    const markerGeometry = new THREE.PlaneGeometry(3, 1.5);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', 128, 80);

    const texture = new THREE.CanvasTexture(canvas);
    const markerMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(0, 0.06, 0);
    spotGroup.add(marker);

    // Position based on level
    const positions = [
        [20, 0, 30],
        [-25, 0, 35],
        [30, 0, 25],
        [-20, 0, 40],
        [25, 0, 35]
    ];

    const pos = positions[(level - 1) % positions.length];
    spotGroup.position.set(pos[0], pos[1], pos[2]);
    spotGroup.rotation.y = Math.random() * Math.PI / 4 - Math.PI / 8;

    scene.add(spotGroup);
    return spotGroup;
}
parkingSpot = createParkingSpot(gameState.level);

// Obstacles
const obstacles = [];
function createObstacles(level) {
    obstacles.forEach(obs => scene.remove(obs));
    obstacles.length = 0;

    const obstacleCount = Math.min(3 + level, 8);

    for (let i = 0; i < obstacleCount; i++) {
        const obstacleGeometry = new THREE.BoxGeometry(2, 2, 2);
        const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);

        let x, z;
        let tooClose = true;
        let attempts = 0;

        while (tooClose && attempts < 50) {
            x = (Math.random() - 0.5) * 80;
            z = (Math.random() - 0.5) * 80;

            const distToCar = Math.sqrt(x * x + (z + 30) * (z + 30));
            const distToSpot = Math.sqrt(
                (x - parkingSpot.position.x) ** 2 +
                (z - parkingSpot.position.z) ** 2
            );

            if (distToCar > 10 && distToSpot > 10) {
                tooClose = false;
            }
            attempts++;
        }

        obstacle.position.set(x, 1, z);
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}
createObstacles(gameState.level);

// Camera follow
function updateCamera() {
    const offset = new THREE.Vector3(0, 8, -12);
    const rotatedOffset = offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), policeCar.rotation.y);

    camera.position.x = policeCar.position.x + rotatedOffset.x;
    camera.position.y = policeCar.position.y + rotatedOffset.y;
    camera.position.z = policeCar.position.z + rotatedOffset.z;

    camera.lookAt(policeCar.position);
}

// Input handling
window.addEventListener('keydown', (e) => {
    gameState.keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    gameState.keys[e.key.toLowerCase()] = false;
});

// Car physics
function updateCar() {
    if (gameState.isParked) return;

    const keys = gameState.keys;

    // Acceleration
    if (keys['w'] || keys['arrowup']) {
        gameState.carSpeed = Math.min(gameState.carSpeed + gameState.acceleration, gameState.maxSpeed);
    } else if (keys['s'] || keys['arrowdown']) {
        gameState.carSpeed = Math.max(gameState.carSpeed - gameState.braking, -gameState.maxSpeed * 0.5);
    } else {
        // Friction
        if (Math.abs(gameState.carSpeed) > 0.001) {
            gameState.carSpeed *= 0.95;
        } else {
            gameState.carSpeed = 0;
        }
    }

    // Turning
    if (keys['a'] || keys['arrowleft']) {
        policeCar.rotation.y += gameState.turnSpeed * Math.abs(gameState.carSpeed) / gameState.maxSpeed;
    }
    if (keys['d'] || keys['arrowright']) {
        policeCar.rotation.y -= gameState.turnSpeed * Math.abs(gameState.carSpeed) / gameState.maxSpeed;
    }

    // Movement
    const direction = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), policeCar.rotation.y);
    policeCar.position.add(direction.multiplyScalar(gameState.carSpeed));

    // Collision with obstacles
    obstacles.forEach(obstacle => {
        const dist = policeCar.position.distanceTo(obstacle.position);
        if (dist < 3) {
            const pushBack = new THREE.Vector3()
                .subVectors(policeCar.position, obstacle.position)
                .normalize()
                .multiplyScalar(0.5);
            policeCar.position.add(pushBack);
            gameState.carSpeed *= -0.3;
        }
    });

    // Boundaries
    policeCar.position.x = Math.max(-90, Math.min(90, policeCar.position.x));
    policeCar.position.z = Math.max(-90, Math.min(90, policeCar.position.z));

    // Check parking
    checkParking();
}

function checkParking() {
    const dist = policeCar.position.distanceTo(parkingSpot.position);
    const rotDiff = Math.abs(policeCar.rotation.y - parkingSpot.rotation.y) % (Math.PI * 2);

    if (dist < 4 && Math.abs(gameState.carSpeed) < 0.01 && rotDiff < 0.3) {
        gameState.isParked = true;
        document.getElementById('winMessage').style.display = 'block';
        document.getElementById('messageText').textContent =
            `🎉 Level ${gameState.level} Complete!\nTime: ${gameState.time.toFixed(1)}s`;
    }
}

// UI updates
function updateUI() {
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('timer').textContent = gameState.time.toFixed(1);

    const dist = policeCar.position.distanceTo(parkingSpot.position);
    document.getElementById('distance').textContent = dist.toFixed(1);
}

// Restart/Next level
document.getElementById('restartBtn').addEventListener('click', () => {
    gameState.level++;
    gameState.time = 0;
    gameState.isParked = false;
    gameState.carSpeed = 0;

    policeCar.position.set(0, 0, -30);
    policeCar.rotation.y = 0;

    parkingSpot = createParkingSpot(gameState.level);
    createObstacles(gameState.level);

    document.getElementById('winMessage').style.display = 'none';
});

// Animation loop
let lastTime = Date.now();
function animate() {
    requestAnimationFrame(animate);

    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (!gameState.isParked) {
        gameState.time += deltaTime;
    }

    updateCar();
    updateCamera();
    updateUI();

    renderer.render(scene, camera);
}

// Window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
