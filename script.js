import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const MODEL_URL = "https://threejs.org/examples/models/gltf/ferrari.glb";

const cars = {
  "911": {
    name: "911 Turbo S",
    make: "PORSCHE · 2025",
    price: "£287,000",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=88",
    engine: "3.7L flat-six",
    power: "640 hp",
    topSpeed: "205 mph",
    economy: "23.5 mpg",
    technology: "Porsche Active Suspension Management",
    transmission: "8-speed PDK",
    fuel: "Petrol",
    safety: "Lane keep, emergency assist & night vision",
    description: "An icon, made even more complete. Everyday ease meets astonishing pace in a beautifully resolved grand tourer that is as comfortable crossing a continent as it is finding its rhythm on a quiet road.",
    colours: ["#aeb4b6", "#17191b", "#ded8cc", "#772b27"],
    features: ["Active all-wheel drive", "Ceramic composite brakes", "Adaptive suspension"]
  },
  "750s": {
    name: "750S",
    make: "MCLAREN · 2025",
    price: "£258,000",
    image: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&w=1400&q=88",
    engine: "4.0L twin-turbo V8",
    power: "740 hp",
    topSpeed: "206 mph",
    economy: "22.0 mpg",
    technology: "Proactive Chassis Control III",
    transmission: "7-speed SSG",
    fuel: "Petrol",
    safety: "Electronic stability, airbags & rear camera",
    description: "Less mass, more feeling. The 750S sharpens every instinct with a remarkable power-to-weight ratio, precise steering and a cabin that puts the road exactly where it should be: front and centre.",
    colours: ["#d0d0cb", "#c5a45e", "#6a766d", "#191a1d"],
    features: ["Carbon-fibre monocoque", "Proactive chassis control", "Electro-hydraulic steering"]
  },
  "amg": {
    name: "GT 63",
    make: "MERCEDES-AMG · 2025",
    price: "£164,000",
    image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1400&q=88",
    engine: "4.0L bi-turbo V8",
    power: "577 hp",
    topSpeed: "196 mph",
    economy: "20.2 mpg",
    technology: "AMG Active Ride Control",
    transmission: "9-speed MCT",
    fuel: "Petrol",
    safety: "Active brake assist, PRE-SAFE® & blind-spot assist",
    description: "The long way home just got longer. Confident, beautifully tailored and unexpectedly composed, the AMG GT 63 makes room for grand touring without losing one ounce of its character.",
    colours: ["#bbc0c0", "#252629", "#9d3e2e", "#e7e3da"],
    features: ["4MATIC+ all-wheel drive", "AMG active ride control", "Burmester surround sound"]
  }
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsap = window.gsap;
if (gsap && window.ScrollTrigger) {
  gsap.registerPlugin(window.ScrollTrigger);
}

function showToast(message) {
  const toast = document.querySelector(".toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 4700);
}

const modelLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/");
modelLoader.setDRACOLoader(dracoLoader);

const modelPromise = modelLoader.loadAsync(MODEL_URL)
  .then((gltf) => gltf.scene)
  .catch((error) => {
    console.error("The 3D car model could not be loaded. The photographic showroom remains available.", error);
    showToast("The 3D model couldn't load. The rest of the showroom is still available.");
    return null;
  });

function makeLights(scene) {
  scene.add(new THREE.HemisphereLight(0xdce6ee, 0x282522, 2.35));

  const key = new THREE.DirectionalLight(0xfff0d7, 3.9);
  key.position.set(-3.5, 6, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xc3d9ef, 3.2);
  rim.position.set(1.5, 4, -5);
  scene.add(rim);

  const gold = new THREE.PointLight(0xe5bd78, 20, 12, 1.8);
  gold.position.set(-4, 1.6, -1);
  scene.add(gold);
}

function prepareModel(model, maxLength) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const length = Math.max(size.x, size.z);
  if (!Number.isFinite(length) || length === 0) {
    throw new Error("The loaded car model has invalid dimensions.");
  }

  model.scale.multiplyScalar(maxLength / length);
  model.position.set(
    -center.x * model.scale.x,
    -bounds.min.y * model.scale.y,
    -center.z * model.scale.z
  );
  model.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      if (object.material) {
        object.material.needsUpdate = true;
      }
    }
  });
  return model;
}

function addGroundGlow(scene, radius) {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 64),
    new THREE.MeshBasicMaterial({ color: 0x101213, transparent: true, opacity: 0.38, depthWrite: false })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.48, 48),
    new THREE.MeshBasicMaterial({ color: 0xc3a36b, transparent: true, opacity: 0.055, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -0.01;
  scene.add(halo);
}

function createCarStage(canvas, { exploded = false } = {}) {
  if (!canvas) return null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (error) {
    console.error("WebGL is unavailable; the photographic fallback will be shown.", error);
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(4.5, 2.35, 7.2);
  camera.lookAt(0, 0.62, 0);
  makeLights(scene);
  addGroundGlow(scene, 5.1);

  const carHolder = new THREE.Group();
  scene.add(carHolder);
  if (canvas.id === "hero-stage") carHolder.position.set(0.65, 0, -0.4);
  let model = null;
  let meshParts = [];
  let baseRotation = exploded ? 0.55 : Math.PI - 0.18;
  let drag = null;

  const resize = () => {
    const width = canvas.clientWidth || canvas.parentElement.clientWidth;
    const height = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  modelPromise.then((loadedModel) => {
    if (!loadedModel || !canvas.isConnected) return;
    model = prepareModel(loadedModel.clone(true), 4.5);
    carHolder.add(model);
    if (exploded) {
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const inverse = new THREE.Matrix4();

      model.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
        const sphere = object.geometry.boundingSphere;
        const worldCenter = object.localToWorld(sphere.center.clone());
        const direction = worldCenter.sub(center);
        if (direction.lengthSq() < 0.0001) direction.set(0, 0.7, 0);
        direction.normalize();

        const parent = object.parent;
        if (!parent) return;
        inverse.copy(parent.matrixWorld).invert();
        direction.transformDirection(inverse);
        meshParts.push({
          object,
          origin: object.position.clone(),
          offset: direction.multiplyScalar(0.5 + (meshParts.length % 4) * 0.09)
        });
      });
      setExploded(1);
    } else {
      canvas.classList.add("is-ready");
    }
  });

  let explodedProgress = 0;
  function setExploded(value) {
    const progress = THREE.MathUtils.clamp(value, 0, 1);
    explodedProgress = progress;
    meshParts.forEach(({ object, origin, offset }) => {
      object.position.copy(origin).addScaledVector(offset, progress);
    });
  }

  canvas.addEventListener("pointerdown", (event) => {
    drag = { x: event.clientX, rotation: baseRotation };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    baseRotation = drag.rotation + (event.clientX - drag.x) * 0.006;
  });
  canvas.addEventListener("pointerup", () => { drag = null; });
  canvas.addEventListener("pointercancel", () => { drag = null; });

  const clock = new THREE.Clock();
  let frame = 0;
  let isVisible = false;
  const render = () => {
    if (!isVisible) return;
    frame = window.requestAnimationFrame(render);
    const elapsed = clock.getDelta();
    if (model) {
      if (!drag && !prefersReducedMotion && !exploded) baseRotation += elapsed * 0.17;
      carHolder.rotation.y = baseRotation;
      if (!exploded && window.scrollY < window.innerHeight * 1.2) {
        const scroll = Math.min(window.scrollY / (window.innerHeight || 1), 1);
        camera.position.z = 7.2 + scroll * 1.1;
        camera.position.y = 2.35 + scroll * 0.18;
        camera.lookAt(0, 0.62, 0);
      }
    }
    renderer.render(scene, camera);
  };
  const visibility = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) render();
    else window.cancelAnimationFrame(frame);
  });
  visibility.observe(canvas);

  return {
    setExploded,
    getExploded: () => explodedProgress,
    destroy() {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      renderer.dispose();
    }
  };
}

function createCabinStage(canvas) {
  if (!canvas) return null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (error) {
    console.error("WebGL is unavailable; the cockpit's photographic fallback will be shown.", error);
    return null;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  const radius = 4.65;
  camera.position.set(0, 1.7, radius);
  camera.lookAt(0, 1.12, 0);

  scene.add(new THREE.HemisphereLight(0xcfd8de, 0x24201b, 2.1));
  const warmKey = new THREE.DirectionalLight(0xffdfae, 3.2);
  warmKey.position.set(-2.2, 4.5, 3.8);
  scene.add(warmKey);
  const dashRim = new THREE.DirectionalLight(0x9caab5, 2.3);
  dashRim.position.set(0, 3.6, -2.7);
  scene.add(dashRim);
  const consoleLight = new THREE.PointLight(0x82a8ac, 5, 3.4, 1.7);
  consoleLight.position.set(0.2, 1.55, -0.7);
  scene.add(consoleLight);

  const cabin = new THREE.Group();
  scene.add(cabin);
  const leather = new THREE.MeshStandardMaterial({ color: 0x29251f, roughness: 0.8, metalness: 0.04 });
  const leatherLight = new THREE.MeshStandardMaterial({ color: 0x4a4031, roughness: 0.76, metalness: 0.05 });
  const darkTrim = new THREE.MeshStandardMaterial({ color: 0x111312, roughness: 0.35, metalness: 0.68 });
  const goldTrim = new THREE.MeshStandardMaterial({ color: 0xb79761, roughness: 0.28, metalness: 0.76 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x263336, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
  const display = new THREE.MeshStandardMaterial({ color: 0x70858a, emissive: 0x294c51, emissiveIntensity: 1.3, roughness: 0.24, metalness: 0.16 });
  const stitch = new THREE.MeshStandardMaterial({ color: 0xd4b478, roughness: 0.7, metalness: 0.05 });

  function addBox(width, height, depth, material, position, radiusValue = 0.03) {
    const geometry = new RoundedBoxGeometry(width, height, depth, 3, radiusValue);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cabin.add(mesh);
    return mesh;
  }

  function addCylinder(radiusTop, radiusBottom, height, material, position, radialSegments = 18) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments),
      material
    );
    mesh.position.set(...position);
    mesh.castShadow = true;
    cabin.add(mesh);
    return mesh;
  }

  addBox(3.35, 0.16, 3.45, darkTrim, [0, 0.36, 0.02], 0.07);
  addBox(0.17, 0.5, 2.5, leather, [-1.57, 0.83, -0.1], 0.045);
  addBox(0.17, 0.5, 2.5, leather, [1.57, 0.83, -0.1], 0.045);
  addBox(3.05, 0.58, 0.48, leather, [0, 1.52, -1.64], 0.11);
  addBox(3, 0.055, 0.18, darkTrim, [0, 1.86, -1.57], 0.03);
  addBox(2.5, 0.052, 0.07, goldTrim, [0, 1.34, -1.37], 0.02);

  const windshield = addBox(2.85, 0.88, 0.025, glass, [0, 2.08, -2.12], 0.02);
  windshield.rotation.x = -0.15;
  windshield.castShadow = false;
  addBox(2.9, 0.11, 0.12, darkTrim, [0, 2.46, -2.04], 0.035);

  addBox(0.67, 0.39, 0.07, darkTrim, [0.23, 1.78, -1.33], 0.065);
  addBox(0.55, 0.29, 0.024, display, [0.23, 1.79, -1.285], 0.04);
  addBox(0.28, 0.12, 0.035, darkTrim, [0.96, 1.74, -1.35], 0.025);
  addBox(0.21, 0.07, 0.02, display, [0.96, 1.75, -1.325], 0.02);
  addBox(0.12, 0.13, 0.13, goldTrim, [0.42, 1.03, -0.42], 0.04);
  addCylinder(0.035, 0.055, 0.27, darkTrim, [0.42, 1.17, -0.47], 20);
  addBox(0.52, 0.045, 0.34, darkTrim, [0.18, 0.88, -0.4], 0.08);

  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.037, 12, 56), darkTrim);
  wheel.position.set(-0.74, 1.38, -0.91);
  wheel.rotation.z = -0.12;
  cabin.add(wheel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.08, 24), darkTrim);
  hub.position.set(-0.74, 1.38, -0.91);
  hub.rotation.x = Math.PI / 2;
  cabin.add(hub);
  const wheelAccent = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.006, 6, 56), goldTrim);
  wheelAccent.position.copy(wheel.position);
  wheelAccent.rotation.copy(wheel.rotation);
  cabin.add(wheelAccent);
  for (let index = 0; index < 3; index += 1) {
    const spoke = addBox(0.028, 0.31, 0.035, darkTrim, [-0.74, 1.38, -0.91], 0.01);
    spoke.rotation.z = index * (Math.PI * 2 / 3);
    spoke.rotation.x = 0.16;
  }
  addBox(0.09, 0.035, 0.038, goldTrim, [-0.74, 1.38, -0.91], 0.015);

  [-0.86, 0.86].forEach((x, index) => {
    const side = x < 0 ? -1 : 1;
    addBox(0.7, 0.21, 0.73, leatherLight, [x, 0.67, 0.58], 0.13);
    const back = addBox(0.68, 0.9, 0.23, leather, [x, 1.08, 0.85], 0.14);
    back.rotation.x = -0.1;
    addBox(0.4, 0.24, 0.2, leatherLight, [x, 1.67, 0.8], 0.09);
    addBox(0.045, 0.65, 0.018, stitch, [x + side * 0.22, 1.1, 0.715], 0.01);
    addBox(0.18, 0.055, 0.28, darkTrim, [x, 0.81, 0.05], 0.04);
    addBox(0.035, 0.22, 0.035, goldTrim, [x, 0.93, 0.05], 0.015);
  });

  addBox(0.53, 0.11, 1.45, leather, [0, 0.7, 0.32], 0.07);
  addBox(0.39, 0.16, 1.18, leatherLight, [0, 0.83, 0.1], 0.085);
  addBox(0.41, 0.025, 0.82, goldTrim, [0, 0.918, 0.06], 0.012);

  addBox(0.025, 0.65, 1.2, darkTrim, [-1.45, 1.15, -0.12], 0.025);
  addBox(0.025, 0.65, 1.2, darkTrim, [1.45, 1.15, -0.12], 0.025);
  addBox(3.15, 0.04, 0.055, goldTrim, [0, 0.45, 0.98], 0.015);

  let angle = 0;
  let drag = null;
  const resize = () => {
    const width = canvas.clientWidth || canvas.parentElement.clientWidth;
    const height = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  canvas.addEventListener("pointerdown", (event) => {
    drag = { x: event.clientX, angle };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (drag) angle = drag.angle + (event.clientX - drag.x) * 0.008;
  });
  canvas.addEventListener("pointerup", () => { drag = null; });
  canvas.addEventListener("pointercancel", () => { drag = null; });

  const clock = new THREE.Clock();
  let frame = 0;
  let isVisible = false;
  const render = () => {
    if (!isVisible) return;
    frame = window.requestAnimationFrame(render);
    const elapsed = clock.getDelta();
    if (!drag && !prefersReducedMotion) angle += elapsed * 0.035;
    camera.position.set(radius * Math.sin(angle), 1.72, radius * Math.cos(angle));
    camera.lookAt(0, 1.12, 0);
    renderer.render(scene, camera);
  };
  const visibility = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) render();
    else window.cancelAnimationFrame(frame);
  });
  visibility.observe(canvas);

  return {
    destroy() {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      renderer.dispose();
    }
  };
}

const heroStage = createCarStage(document.querySelector("#hero-stage"));
const explodedStage = createCarStage(document.querySelector("#exploded-stage"), { exploded: true });
const interiorStage = createCabinStage(document.querySelector("#interior-stage"));
const assembleButton = document.querySelector(".assemble-button");

function updateAssembleControl(progress) {
  if (!assembleButton) return;
  const assembled = progress < 0.5;
  if (assembleButton.getAttribute("aria-pressed") === String(assembled)) return;
  assembleButton.setAttribute("aria-pressed", String(assembled));
  assembleButton.innerHTML = `${assembled ? '<span class="assemble-icon" aria-hidden="true">✳</span> Separate the details' : '<span class="assemble-icon" aria-hidden="true">✳</span> Assemble the details'}`;
}

function setupMotion() {
  if (!gsap || !window.ScrollTrigger || prefersReducedMotion) return;
  gsap.from(".hero-content > *", {
    y: 22,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: "power2.out",
    delay: 0.15
  });
  gsap.utils.toArray(".car-card, .anatomy-top, .compare .section-heading, .booking-form").forEach((element) => {
    gsap.from(element, {
      y: 26,
      opacity: 0,
      duration: 0.75,
      ease: "power2.out",
      scrollTrigger: { trigger: element, start: "top 88%", once: true }
    });
  });
  if (explodedStage) {
    const progress = { value: 0 };
    gsap.to(progress, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "#atelier",
        start: "top 78%",
        end: "bottom 45%",
        scrub: 0.8,
        onUpdate: () => {
          explodedStage.setExploded(progress.value);
          updateAssembleControl(progress.value);
        }
      }
    });
  }
}
setupMotion();

if (assembleButton && explodedStage) {
  assembleButton.addEventListener("click", () => {
    const current = explodedStage.getExploded();
    const target = current > 0.5 ? 0 : 1;
    if (gsap && !prefersReducedMotion) {
      const tween = { progress: current };
      gsap.to(tween, {
        progress: target,
        duration: 1.1,
        ease: "power2.inOut",
        onUpdate: () => {
          explodedStage.setExploded(tween.progress);
          updateAssembleControl(tween.progress);
        }
      });
    } else {
      explodedStage.setExploded(target);
      updateAssembleControl(target);
    }
  });
}

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  menuToggle.setAttribute("aria-label", expanded ? "Open navigation" : "Close navigation");
  siteNav.classList.toggle("is-open", !expanded);
});
siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    siteNav.classList.remove("is-open");
  });
});

let dialogStage = null;

function setDialogView(view) {
 const dialog = document.querySelector(".car-dialog");
 const canvas = dialog.querySelector(".dialog-image canvas");
 const image = dialog.querySelector(".dialog-image img");
 if (dialogStage) dialogStage.destroy();
 image.style.opacity = view === "exterior" ? "1" : "0";
 image.setAttribute("aria-hidden", String(view !== "exterior"));
 dialog.querySelectorAll(".dialog-view-tabs button").forEach((button) => {
   button.setAttribute("aria-pressed", String(button.dataset.view === view));
 });
 dialogStage = view === "interior" ? createCabinStage(canvas) : createCarStage(canvas);
}

function showCarDetails(id) {
  const car = cars[id];
  if (!car) return;
  const dialog = document.querySelector(".car-dialog");
  if (dialogStage) dialogStage.destroy();
 const canvas = document.createElement("canvas");
 canvas.setAttribute("aria-label", `Interactive three-dimensional view of the ${car.name}`);
 dialog.querySelector(".dialog-image canvas").replaceWith(canvas);
  const image = dialog.querySelector(".dialog-image img");
 image.style.opacity = "1";
  image.src = car.image;
  image.alt = `${car.make.split(" · ")[0]} ${car.name}`;
  dialog.querySelector(".dialog-make").textContent = car.make;
  dialog.querySelector("#dialog-title").textContent = car.name;
  dialog.querySelector(".dialog-description").textContent = car.description;
  dialog.querySelector(".dialog-specs").innerHTML = [
    ["PRICE", car.price],
    ["ENGINE", car.engine],
    ["POWER", car.power],
    ["TRANSMISSION", car.transmission],
    ["FUEL", car.fuel],
    ["TOP SPEED", car.topSpeed]
  ].map(([label, value]) => `<div class="dialog-spec"><span>${label}</span><strong>${value}</strong></div>`).join("");
  const featureCards = dialog.querySelector(".dialog-features > div");
  featureCards.replaceChildren(...car.features.map((feature, index) => {
    const card = document.createElement("div");
    card.className = "dialog-feature";
    card.innerHTML = `<span>0${index + 1}</span><strong>${feature}</strong>`;
    return card;
  }));
  const swatches = dialog.querySelector(".dialog-colours > div");
  swatches.replaceChildren(...car.colours.map((colour) => {
    const swatch = document.createElement("span");
    swatch.className = "colour-swatch";
    swatch.style.backgroundColor = colour;
    swatch.setAttribute("aria-label", `Available finish ${colour}`);
    return swatch;
  }));
  dialog.querySelector(".dialog-book").href = `#test-drive`;
  dialog.querySelector(".dialog-book").dataset.car = id;
  dialog.showModal();
  setDialogView("exterior");
}

document.querySelectorAll("[data-details]").forEach((button) => {
  button.addEventListener("click", () => showCarDetails(button.dataset.details));
});
document.querySelectorAll(".car-card .car-visual").forEach((button) => {
  button.addEventListener("click", () => showCarDetails(button.closest(".car-card").dataset.car));
  if (!prefersReducedMotion) {
    button.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      button.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 4}deg) rotateY(${(x - 0.5) * 6}deg)`;
    });
    button.addEventListener("pointerleave", () => { button.style.transform = ""; });
  }
});
const carDialog = document.querySelector(".car-dialog");
carDialog.querySelectorAll(".dialog-view-tabs button").forEach((button) => {
  button.addEventListener("click", () => setDialogView(button.dataset.view));
});
carDialog.querySelector(".dialog-close").addEventListener("click", () => carDialog.close());
carDialog.addEventListener("close", () => {
  if (dialogStage) {
    dialogStage.destroy();
    dialogStage = null;
  }
});
carDialog.addEventListener("click", (event) => {
  if (event.target === carDialog) carDialog.close();
});
carDialog.querySelector(".dialog-book").addEventListener("click", (event) => {
  event.preventDefault();
  const bookingSelect = document.querySelector('.booking-form select[name="car"]');
  bookingSelect.value = event.currentTarget.dataset.car;
  carDialog.close();
  document.querySelector("#test-drive").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
});

const compareKeys = ["911", "750s", "amg"];
const selectedCars = new Set(["911", "750s"]);
const comparePicks = document.querySelector(".compare-picks");
compareKeys.forEach((id) => {
  const button = document.createElement("button");
  button.className = "compare-pick";
  button.type = "button";
  button.textContent = cars[id].name;
  button.setAttribute("aria-pressed", String(selectedCars.has(id)));
  button.addEventListener("click", () => {
    if (selectedCars.has(id)) {
      if (selectedCars.size === 2) {
        showToast("Choose at least two cars to keep the comparison useful.");
        return;
      }
      selectedCars.delete(id);
    } else {
      if (selectedCars.size === 3) {
        showToast("Compare up to three cars at a time.");
        return;
      }
      selectedCars.add(id);
    }
    button.setAttribute("aria-pressed", String(selectedCars.has(id)));
    renderComparison();
  });
  comparePicks.append(button);
});

function renderComparison() {
  const ids = [...selectedCars];
  const header = document.querySelector(".compare-table thead tr");
  header.querySelectorAll(".compare-car-heading").forEach((cell) => cell.remove());
  ids.forEach((id) => {
    const cell = document.createElement("th");
    cell.className = "compare-car-heading";
    cell.scope = "col";
    cell.innerHTML = `<span class="compare-preview"><img src="${cars[id].image}" alt=""></span><strong>${cars[id].name}</strong><span>${cars[id].make.split(" · ")[0]}</span>`;
    header.append(cell);
  });
  document.querySelectorAll(".compare-table tbody tr").forEach((row) => {
    row.querySelectorAll("td").forEach((cell) => cell.remove());
    const key = row.dataset.spec;
    ids.forEach((id) => {
      const cell = document.createElement("td");
      cell.textContent = cars[id][key];
      row.append(cell);
    });
  });
}
renderComparison();

const interiorCaption = document.querySelector(".interior-caption");
const defaultCaption = interiorCaption.innerHTML;
const interiorView = document.querySelector(".interior-image");
interiorView.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  const bounds = interiorView.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  interiorView.style.backgroundPosition = `${50 + (x - 0.5) * 10}% ${57 + (y - 0.5) * 8}%`;
});
interiorView.addEventListener("pointerleave", () => {
  interiorView.style.backgroundPosition = "";
});
document.querySelectorAll(".interior-marker").forEach((marker) => {
  const setMarker = () => {
    document.querySelectorAll(".interior-marker").forEach((item) => item.classList.toggle("is-active", item === marker));
    interiorCaption.textContent = marker.dataset.caption;
  };
  marker.addEventListener("pointerenter", setMarker);
  marker.addEventListener("focus", setMarker);
  marker.addEventListener("click", setMarker);
  marker.addEventListener("pointerleave", () => {
    marker.classList.remove("is-active");
    if (!document.querySelector(".interior-marker.is-active")) interiorCaption.innerHTML = defaultCaption;
  });
  marker.addEventListener("blur", () => {
    marker.classList.remove("is-active");
    if (!document.querySelector(".interior-marker.is-active")) interiorCaption.innerHTML = defaultCaption;
  });
});

const bookingForm = document.querySelector(".booking-form");
const dateInput = bookingForm.querySelector('input[name="date"]');
const today = new Date();
dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = new FormData(bookingForm).get("name").trim().split(/\s+/)[0];
  showToast(`Thank you, ${name}. This demo does not send bookings. Please call our team to confirm.`);
  bookingForm.reset();
  dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
});

window.addEventListener("pagehide", () => {
  heroStage?.destroy();
  explodedStage?.destroy();
  interiorStage?.destroy();
});
