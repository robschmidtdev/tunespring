import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture.js';

export default function Combined() {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );

    camera.position.set(100, 100, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mountRef.current?.appendChild(renderer.domElement);

    // const directionalLight = new THREE.DirectionalLight(0xffffff, 0);
    // directionalLight.position.set(2, 2, 2);
    // scene.add(directionalLight);
    // scene.add(new THREE.AmbientLight(0xffffff, 0));
    // const pointLight = new THREE.PointLight(0xffffff, 1);
    // pointLight.position.set(200, 200, 200);
    // scene.add(pointLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 10;
    controls.enableDamping = true;

    let envmaploader = new THREE.PMREMGenerator(renderer);
    envmaploader.compileEquirectangularShader();

    new RGBELoader().setPath('/').load('brown_photostudio_02_1k.hdr', function (hdrmap) {
      let envmap = envmaploader.fromEquirectangular(hdrmap);
      hdrmap.dispose();
      envmaploader.dispose();

      let texture = new THREE.CanvasTexture(new FlakesTexture());
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(10, 10);

      const materialParamsSlider = {
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

    const materialParamsBock = {
              clearcoat: 1.0,
              clearcoatRoughness: 0.1,
              metalness: 1.0,
              roughness: 0.1,
              color: "#8c8c8c", //"#4d4d4d", // 0xa0c0ff, // chrome
              normalMap: texture,
              normalScale: new THREE.Vector2(0.005, 0.005),
              envMap: envmap.texture,
              envMapIntensity: 1.5,
              side: THREE.DoubleSide,
    };

    const materialParamsSpring = {
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            metalness: 1.0,
            roughness: 0.1,
            color: "#000000", // 0xa0c0ff, // chrome
            normalMap: texture,
            normalScale: new THREE.Vector2(0.005, 0.005),
            envMap: envmap.texture,
            envMapIntensity: 1.5,
            side: THREE.DoubleSide,
          };
      const matBock = new THREE.MeshPhysicalMaterial(materialParamsBock);
      const matSlider = new THREE.MeshPhysicalMaterial(materialParamsSlider);
      const matSpring = new THREE.MeshPhysicalMaterial(materialParamsSpring);


      const models = []; // store loaded models with their target positions
    let allAtTarget = false;

      const loader = new GLTFLoader();

      function loadModel(path, material, position, flipX = false) {
        loader.load(
            path,
            (gltf) => {
            const model = gltf.scene;

            model.traverse((child) => {
                if (child.isMesh) {
                const geometry = child.geometry;

                // Center the geometry
                geometry.computeBoundingBox();
                const bbox = geometry.boundingBox;
                const center = new THREE.Vector3();
                bbox.getCenter(center);
                geometry.translate(-center.x, -center.y, -center.z);

                // UV mapping if missing
                if (!geometry.attributes.uv) {
                    const positions = geometry.attributes.position;
                    const uvs = [];
                    for (let i = 0; i < positions.count; i++) {
                    const x = positions.getX(i);
                    const y = positions.getY(i);
                    uvs.push((x + 0.1) / 2, (y + 0.1) / 2);
                    }
                    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                    geometry.attributes.uv.needsUpdate = true;
                }

                // Normals & tangents
                geometry.computeVertexNormals();
                if (geometry.index) {
                    geometry.computeTangents();
                }

                child.material = material;
                child.material.needsUpdate = true;
                }
            });

            

            model.position.copy(position);
            scene.add(model);
            },
            undefined,
            (error) => console.error('Error loading GLTF:', error)
        );
        }


        setTimeout(() => {controls.autoRotateSpeed = 10}, 0);
        setTimeout(() => loadModel('/slider.glb', matSlider, new THREE.Vector3(0, 0, 0)), 0);
        
        setTimeout(() => loadModel('/spring.glb', matSpring, new THREE.Vector3(0, 0, 0)), 1000);
        // setTimeout(() => {controls.autoRotateSpeed = 30}, 1500);

        setTimeout(() => loadModel('/bock.glb', matBock, new THREE.Vector3(0, 0, 0)), 2000);
        setTimeout(() => {controls.autoRotateSpeed = 50}, 2000);
        setTimeout(() => {controls.autoRotateSpeed = 1.5}, 2800);



      animate();
    });

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

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
