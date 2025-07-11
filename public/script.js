// ThreeJS Globe Variables
let scene, camera, renderer, globe, isRotating = true;
let sliceGroup, sliceMesh, hollowSection;
let targetRotation = { x: 0, y: 0 };
const globeRadius = 100;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  createStarryBackground();
  initGlobe();
  loadSearchHistory();
  
  // Add enter key handler
  document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchWeather();
    }
  });
});

// Generate starry background
function createStarryBackground() {
  const starsContainer = document.getElementById('stars');
  const numberOfStars = 200;
  
  for (let i = 0; i < numberOfStars; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    
    // Random position
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // Random size
    const size = Math.random() * 2 + 1;
    
    // Random twinkle duration
    const duration = Math.random() * 3 + 2;
    
    // Random opacity
    const opacity = Math.random() * 0.7 + 0.3;
    
    star.style.setProperty('--duration', `${duration}s`);
    star.style.setProperty('--opacity', opacity);
    star.style.setProperty('--opacity-half', opacity / 2);
    
    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    
    starsContainer.appendChild(star);
  }
}

// Initialize the 3D globe
function initGlobe() {
  // Create scene
  scene = new THREE.Scene();
  
  // Add a subtle ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  
  // Add directional light for shadows
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Add a blue point light to enhance visibility
  const blueLight = new THREE.PointLight(0x4169e1, 2, 300);
  blueLight.position.set(100, 50, 100);       
  scene.add(blueLight);  
   
  // Add the opposite red light for contrast
  const redLight = new THREE.PointLight(0xff4500, 1, 300);
  redLight.position.set(-100, -50, -100);
  scene.add(redLight);
     
  // Create camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / 400, 0.1, 1000);
  camera.position.z = 300;
  
  // Create renderer with antialias for smooth edges
  renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true,
    logarithmicDepthBuffer: true
  });
  renderer.setSize(window.innerWidth, 400);
  renderer.setClearColor(0x000000, 0); // transparent background
  
  // Add renderer to         DOM
  const container = document.getElementById('globe-container');
  container.appendChild(renderer.domElement);
  
  // Add a glow effec t div
  const glowEffect = document.createElement('div');
  glowEffect.classList.add('globe-glow');
  container.appendChild(glowEffect);
  
  // Create Earth glo                       be with enhanced texture
  createGlobe();
  
  // Cr eate empty group for the slice
  sliceGroup = new THREE.Group();
  scene.add(sliceGroup);
  sliceGroup.visible = false;         
                    
  // Make renderer responsive
  window.addEventListener('resize', onWindowResize);
  
  // Start animation loop  
  animate();
}        
 
function createGlobe() { 
  // Load Earth texture with higher resolution
  const textureLoader = new THREE.TextureLoader();
  
  // Load multiple textures for better appearance
  const earthTexture = textureLoader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg');
  const bumpMap = textureLoader.load('https://threejs.org/examples/textures/earth_atmos_2048.jpg');
  const specularMap = textureLoader.load('https://threejs.org/examples/textures/earth_specular_2048.jpg');
         
  // Create a detailed sphere geometry   
  const earthGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
  
  // Create material with multiple maps for enhanced appearance
  const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: bumpMap,
    bumpScale: 2,
    specularMap: specularMap,
    specular: new THREE.Color(0x333333),
    shininess: 25,
    emissive: new THREE.Color(0x112244), // Subtle glow
    emissiveIntensity: 0.1
  });
  
  // Create mesh and add to scene
  globe = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(globe);
  
  // Add a subtle cloud layer
  const cloudTexture = textureLoader.load('https://threejs.org/examples/textures/earth_clouds_1024.png');
  const cloudMaterial = new THREE.MeshPhongMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.5
  });
  
  const cloudGeometry = new THREE.SphereGeometry(globeRadius + 2, 64, 64);
  const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  scene.add(clouds);
  
  // Make clouds part of the globe object for rotation
  globe.add(clouds);
}
                             
// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / 400;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, 400);
}

                      
function animate() {
  requestAnimationFrame(animate);
  
  if (isRotating) {
    globe.rotation.y += 0.005;
  } else {
    // Smoothly rotate to target position
    globe.rotation.y += (targetRotation.y - globe.rotation.y) * 0.05;
    globe.rotation.x += (targetRotation.x - globe.rotation.x) * 0.05;
  }
  
  renderer.render(scene, camera);
}

// Create a slice of the globe at the given coordinates
function createSlice(lat, lon) {
  // Remove any existing slice
  while(sliceGroup.children.length > 0) {
    sliceGroup.remove(sliceGroup.children[0]);
  }
  
  // Convert latitude and longitude to 3D position
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  
  const x = -globeRadius * Math.sin(phi) * Math.cos(theta);
  const y = globeRadius * Math.cos(phi);
  const z = globeRadius * Math.sin(phi) * Math.sin(theta);
  
  // Store target rotation to face this point
  targetRotation.y = Math.atan2(-x, -z);
  targetRotation.x = Math.atan2(y, Math.sqrt(x*x + z*z));
  
  // Create mathematical sector geometry
  const sectorRadius = globeRadius * 0.3;
  const sectorAngle = Math.PI / 6; // 30 degrees
  
  // Create custom sector geometry 
  const sectorGeometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  
  // Center vertex
  vertices.push(0, 0, 0);
  
  // Create vertices for the sector
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const angle = -sectorAngle/2 + (i / segments) * sectorAngle;
    vertices.push(
      sectorRadius * Math.sin(angle),
      sectorRadius * Math.cos(angle),
      0
    );
  }
  
  // Connect vertices to form triangles
  for (let i = 0; i < segments; i++) {
    indices.push(0, i+1, i+2);
  }
  
  // Create the geometry
  sectorGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  sectorGeometry.setIndex(indices);
  sectorGeometry.computeVertexNormals();
  
  // Material for the sector with more vibrant color
  const sectorMaterial = new THREE.MeshPhongMaterial({
    color: 0x00aaff,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    emissive: 0x0044aa,
    emissiveIntensity: 0.5,
    shininess: 100
  });
  
  // Create sector mesh
  sliceMesh = new THREE.Mesh(sectorGeometry, sectorMaterial);
  
  // Position and orient the sector
  sliceMesh.position.set(x * 1.2, y * 1.2, z * 1.2);
  sliceMesh.lookAt(0, 0, 0);
  sliceMesh.rotateX(Math.PI / 2);
  
  // Create hollow section on the globe with more visible material
  const hollowGeometry = new THREE.SphereGeometry(
    globeRadius - 1, 32, 32,
    theta - 0.1, 0.2,
    phi - 0.1, 0.2
  );
  const hollowMaterial = new THREE.MeshBasicMaterial({
    color: 0x000033,
    transparent: true,
    opacity: 0.9,
    side: THREE.BackSide
  });
  
  hollowSection = new THREE.Mesh(hollowGeometry, hollowMaterial);
  
  // Add extrusion to make the sector 3D with a glowing material
  const extrudedSectorGeometry = new THREE.ExtrudeGeometry(
    new THREE.Shape()
      .moveTo(0, 0)
      .arc(0, 0, sectorRadius, -sectorAngle/2, sectorAngle/2, false)
      .lineTo(0, 0),
    {
      depth: 20,
      bevelEnabled: false
    }
  );
  
  const extrudedSector = new THREE.Mesh(
    extrudedSectorGeometry,
    new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      emissive: 0x0044aa,
      emissiveIntensity: 0.5
    })
  );
  
  extrudedSector.position.copy(sliceMesh.position);
  extrudedSector.rotation.copy(sliceMesh.rotation);
  extrudedSector.translateZ(-10);
  
  // Add slice and hollow to group
  sliceGroup.add(sliceMesh);
  sliceGroup.add(extrudedSector);
  sliceGroup.add(hollowSection);
  sliceGroup.visible = true;
  
  // Handle animation for pulling out slice
  let startTime = Date.now();
  let animationDuration = 1000; // ms
  let finalOffset = globeRadius * 0.5;
  
  function animateSlice() {
    let elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / animationDuration, 1);
    let easing = 1 - Math.pow(1 - progress, 3); // Cubic easing out
    
    let currentOffset = finalOffset * easing;
    
    // Move the slice outward
    sliceMesh.position.set(
      x * (1 + currentOffset/globeRadius),
      y * (1 + currentOffset/globeRadius),
      z * (1 + currentOffset/globeRadius)
    );
    
    extrudedSector.position.set(
      x * (1 + currentOffset/globeRadius),
      y * (1 + currentOffset/globeRadius),
      z * (1 + currentOffset/globeRadius)
    );
    
    if (progress < 1) {
      requestAnimationFrame(animateSlice);
    }
  }
  
  animateSlice();
}

// Weather API Interactions
async function searchWeather() {
  const city = document.getElementById('cityInput').value;
  if (!city) return alert("Please enter a city name");
  
  try {
    const response = await fetch('/getWeather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch weather data');
    }
    
    const weatherData = await response.json();
    
    // Extract coordinates from the API response
    const coords = {
      city: weatherData.current.city,
      temperature: weatherData.current.temperature,
      condition: weatherData.current.condition,
      humidity: weatherData.current.humidity,
      time: weatherData.current.time,
      lat: weatherData.current.lat,
      lon: weatherData.current.lon
    };
    
    displayWeather(coords);
    
    // Stop globe rotation
    isRotating = false;
    
    // Create slice at the location
    createSlice(coords.lat, coords.lon);
    
    // Update sidebar history
    updateHistory(coords);

    rotationTimeout = setTimeout(() => {
      isRotating = true;
      sliceGroup.visible = false;
      document.getElementById('weatherSliceVisual').style.opacity = '0';
      document.getElementById('weatherInfoPanel').classList.remove('active');
    }, 3000);
    
  } catch (error) {
    alert("Error fetching weather: " + error.message);
  }
}
// Mock function to simulate API call - replace with real API
async function getMockWeather(city) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate random coordinates based on city name hash
  const hashCode = s => s.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const hash = Math.abs(hashCode(city));
  const lat = -90 + (hash % 180);
  const lon = -180 + (hash % 360);
  
  // Mock weather data
  return {
    city: city,
    temperature: Math.floor(15 + Math.random() * 20),
    condition: ["Sunny", "Cloudy", "Partly Cloudy", "Rainy", "Thunderstorm"][Math.floor(Math.random() * 5)],
    humidity: Math.floor(30 + Math.random() * 60),
    time: new Date().toLocaleTimeString(),
    lat: lat,
    lon: lon
  };
}

// Display weather data in the UI
function displayWeather(weather) {
  document.getElementById('cityName').innerText = weather.city;
  document.getElementById('temperature').innerText = `${weather.temperature}°C`;
  document.getElementById('condition').innerText = weather.condition;
  document.getElementById('humidity').innerText = `${weather.humidity}%`;
  document.getElementById('time').innerText = weather.time;
  
  const slice = document.getElementById('weatherSlice');
  slice.classList.add('active');
}

// Update search history
function updateHistory(weather) {
  const historyEl = document.getElementById('history');
  
  // Create new history item HTML
  const newItem = document.createElement('div');
  newItem.className = 'history-item';
  newItem.innerHTML = `
    <strong>${weather.city}</strong>
    <div class="flex justify-between text-sm text-blue-300">
      <span>${weather.temperature}°C, ${weather.condition}</span>
      <span>${weather.time}</span>
    </div>
  `;
  newItem.onclick = () => searchCity(weather.city);
  
  // Check if we need to create the container structure
  let container = historyEl.querySelector('.history-container');
  if (!container) {
    // Create header if it doesn't exist
    if (!historyEl.querySelector('h3')) {
      const header = document.createElement('h3');
      header.className = 'text-lg font-semibold mb-2';
      header.textContent = 'Recent Searches';
      historyEl.appendChild(header);
    }
    
    // Create container for history items
    container = document.createElement('div');
    container.className = 'history-container space-y-2';
    historyEl.appendChild(container);
  }
  
  // Insert new item at the top
  const firstItem = container.firstChild;
  if (firstItem) {
    container.insertBefore(newItem, firstItem);
  } else {
    container.appendChild(newItem);
  }
  
  // Limit to 10 items
  const items = container.querySelectorAll('.history-item');
  if (items.length > 10) {
    container.removeChild(items[items.length - 1]);
  }
}
// Load search history from localStorage
async function loadSearchHistory() {
  try {
    const response = await fetch('/getHistory');
    if (!response.ok) throw new Error('Failed to load history');
    
    const history = await response.json();
    const historyEl = document.getElementById('history');
    
    if (history.length > 0) {
      historyEl.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">Recent Searches</h3>
        <div class="space-y-2">
          ${history.map(w => `
            <div class="history-item" onclick="searchCity('${w.city}')">
              <strong>${w.city}</strong>
              <div class="flex justify-between text-sm text-blue-300">
                <span>${w.temperature}°C, ${w.condition}</span>
                <span>${w.time}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

// Search for a city from history
function searchCity(city) {
  document.getElementById('cityInput').value = city;
  searchWeather();
  toggleSidebar();
}

// Toggle sidebar visibility
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('-translate-x-full');
}

// Reset globe to default rotating state
function resetGlobe() {
  isRotating = true;
  sliceGroup.visible = false;
  document.getElementById('weatherSlice').classList.remove('active');
}