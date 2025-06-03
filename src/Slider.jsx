import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture.js';


export default function Slider() {
  const mountRef = useRef(null);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.set(0, 0, 100);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha:true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    mountRef.current?.appendChild(renderer.domElement);

    // Lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0);
    directionalLight.position.set(2, 2, 2);
    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0))

    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(200,200,200)
    scene.add(pointLight)

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true
    controls.autoRotateSpeed = 1
    controls.enableDamping = true


    let envmaploader = new THREE.PMREMGenerator(renderer)
    envmaploader.compileEquirectangularShader();

    // hdr file 
    new RGBELoader().setPath('/').load('brown_photostudio_02_1k.hdr', function(hdrmap){

      let envmap = envmaploader.fromEquirectangular(hdrmap)
      
      hdrmap.dispose();
      envmaploader.dispose();

      // texture 
      let texture = new THREE.CanvasTexture(new FlakesTexture())
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.x = 10
      texture.repeat.y = 10

      const material = {
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        metalness: 1.0,
        roughness: 0.1,
        // color: 0x8418ca, //red
        color: 0xffd700, // gold
        // color: '#a8a9ad', // chrome
        normalMap: texture,
        normalScale: new THREE.Vector2(0.005, 0.005),
        envMap: envmap.texture,
        envMapIntensity: 1.5
      }
      let ballMat = new THREE.MeshPhysicalMaterial(material);
      // let ballMat = new THREE.MeshStandardMaterial({ color: 0x8418ca });

      let model = null
      let geometry = null

      // Load GLTF/GLB model
      const loader = new GLTFLoader();
      loader.load(
        '/slider.glb',
        (gltf) => {

          model = gltf.scene;

          model.traverse((child) => {
          if (child.isMesh) {
            geometry = child.geometry;

            material.side = THREE.DoubleSide;

            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            geometry.translate(-center.x, -center.y, -center.z);


            if (!geometry.attributes.uv) {
              const positions = geometry.attributes.position;
              const uvs = [];

              for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                uvs.push((x + 0.1) / 2, (y + 0.1) / 2);  // simple planar UV mapping
              }

              geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
              geometry.attributes.uv.needsUpdate = true;
            }

            geometry.computeVertexNormals();

            if (!geometry.index) {
              console.warn('Geometry has no index attribute, skipping computeTangents()');
            } else {
              geometry.computeTangents();
            }

            child.material = ballMat;  // assign material after UVs exist
            child.material.needsUpdate = true;
          }
        }
      );

          let ballGeo = new THREE.SphereGeometry(100,64,64)
          
          console.log(geometry)
          model = new THREE.Mesh(geometry, ballMat) // ballGeo, geometry

          scene.add(model);
          animate();
        },
        undefined,
        (error) => {
          console.error('Error loading GLTF:', error);
        }
      );


    })

    // Animation loop
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
      
    };
    // animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} />;
}
