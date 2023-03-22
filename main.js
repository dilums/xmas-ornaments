let camera, controls, scene, renderer, loader, textures, font;
let ornaments = [];
const { sin } = Math;

const map = (value, sMin, sMax, dMin, dMax) => {
  return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
};
const range = (n, m = 0) =>
  Array(n)
    .fill(m)
    .map((i, j) => i + j);

// https://github.com/bit101/CodingMath
const bez = (p0, p1, p2, t) => {
  const x = Math.pow(1 - t, 2) * p0.x + (1 - t) * 2 * t * p1.x + t * t * p2.x;
  const y = Math.pow(1 - t, 2) * p0.y + (1 - t) * 2 * t * p1.y + t * t * p2.y;
  return [x, y];
};
const rad = (deg) => (deg / 180) * Math.PI;

const rand = (max, min = 0) => min + Math.random() * (max - min);
const randInt = (max, min = 0) => Math.floor(min + Math.random() * (max - min));
const randChoise = (arr) => arr[randInt(arr.length)];

function loadItems() {
  const loader = new THREE.FontLoader();
  loader.load("https://assets.codepen.io/3685267/droid_sans_bold.typeface.json", function (fontx) {
    font = fontx;
    init();
    animate();
  });
}
loadItems();

function getY(x) {
  const xActual = x + 50;
  const t = map(xActual % 20, 0, 20, 0, 1);
  const [_, y] = bez({ x: 0, y: 0 }, { x: 10, y: -8 }, { x: 20, y: 0 }, t);
  return y;
}

function loadTextures() {
  textures = range(9).map((i) => {
    const texture = loader.load(`https://assets.codepen.io/3685267/christmas_texture_${i}.jpg`);

    return texture;
  });
}

function addOrnaments(num, posY) {
  range(num).forEach((i) => {
    if (i) {
      const x = (100 / num) * i - 50;
      const y = getY(x) + posY;

      ornaments.push(
        new Ornament({
          scene,
          x,
          y,
          texture: randChoise(textures),
          font,
          index: ornaments.length,
        })
      );
    }
  });
}

function init() {
  scene = new THREE.Scene();
  scene.position.y += 13;
  loader = new THREE.TextureLoader();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 0, 110);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  loadTextures();
  [
    [3, 9],
    [0, 9],
    [-3, 10],
  ].forEach(([row, num]) => {
    addTube(row);
    addOrnaments(num, row * 10);
  });

  addLights();
  addPlane();
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
  requestAnimationFrame(animate);
  ornaments.forEach((item) => {
    item.update(time * 0.001);
  });
  renderer.render(scene, camera);
}

function addTube(yRoot = 0) {
  class CustomSinCurve extends THREE.Curve {
    constructor(scale = 1) {
      super();

      this.scale = scale;
    }

    getPoint(t, optionalTarget = new THREE.Vector3()) {
      const x = map(t, 0, 1, 0, 10);
      const a = map(x % 2, 0, 2, 0, 1);
      const [_, y] = bez({ x: 0, y: 0 }, { x: 1, y: -0.8 }, { x: 2, y: 0 }, a);
      const z = 0;
      return optionalTarget.set(x - 5, y + yRoot, z).multiplyScalar(this.scale);
    }
  }
  const texture = loader.load("https://assets.codepen.io/3685267/christmas_texture_9.jpg");

  const path = new CustomSinCurve(10);
  const geometry = new THREE.TubeGeometry(path, 100, 1, 16, false);
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = 10;
  texture.repeat.y = 1;
  texture.offset.set(0.5, 0.5);
  const material = new THREE.MeshPhongMaterial({
    map: texture,
    shininess: 120,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

function addLights() {
  const color = 0xffffff;
  const intensity = 0.9;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(0, 0, 80);
  scene.add(light);
}

function addPlane() {
  const geometry = new THREE.PlaneBufferGeometry(500, 500, 32);
  const material = new THREE.MeshPhongMaterial({
    color: 0x570b22,
    shininess: 10,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.position.z = -5;
  scene.add(plane);
}

class Ornament {
  constructor({ scene, x, y, texture, font, index }) {
    this.scene = scene;
    this.phase = Math.random() * 2;
    const base = new THREE.Group();
    base.position.x = x;
    base.position.y = y;
    this.base = base;
    scene.add(base);
    this.length = -12 - rand(6);
    const item = new THREE.Group();
    item.position.y = this.length;
    base.add(item);
    this.item = item;
    this.texture = texture;

    this.text = `${index + 1}`;

    this.font = font;

    this.material = new THREE.MeshPhongMaterial({
      map: this.texture,
      shininess: 120,
    });
    this.addItems();
  }
  addItems() {
    this.addBall();
    this.addLine();
    this.addCylynder();
    this.addRing();
    this.addText();
  }
  addBall() {
    const geometry = new THREE.SphereBufferGeometry(4, 20, 20);

    const ball = new THREE.Mesh(geometry, this.material);
    this.item.add(ball);
  }
  addCylynder() {
    const geometry = new THREE.CylinderBufferGeometry(0.8, 0.8, 2, 15, 5);

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.x = 0;
    mesh.position.y = 4;
    this.item.add(mesh);
  }
  addRing() {
    const geometry = new THREE.TorusBufferGeometry(0.8, 0.2, 10, 24);
    const material = new THREE.MeshPhongMaterial({
      color: 0x393e46,
      shininess: 80,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = 0;
    mesh.position.y = 5.2;
    this.item.add(mesh);
  }
  addLine() {
    const material = new THREE.LineBasicMaterial({
      color: 0x666666,
    });
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, this.length + 6, 0),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    this.base.add(line);
  }

  update(time) {
    const angle = map(sin(time + this.phase), -1, 1, -rad(5), rad(5));
    this.item.rotation.y = angle * 3;
    this.base.rotation.z = angle;
  }
  addText() {
    const text = this.text;
    const geometry = new THREE.TextGeometry(text, {
      font: this.font,
      size: 2.2,
      height: 0.4,
      curveSegments: 12,
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.z = 4;
    mesh.position.x = text.length === 1 ? -0.8 : -1.2;
    mesh.position.y = -1;
    this.item.add(mesh);
  }
}
