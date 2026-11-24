'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Shuffle,
  Volume2,
  Sparkles,
  Layers
} from 'lucide-react';

interface InteractiveCubeProps {
  algorithm?: string;
  setupMoves?: string;
  autoPlay?: boolean;
  interactive?: boolean;
  className?: string;
  onMoveComplete?: (moveIndex: number) => void;
  highlightSlot?: 'none' | 'FR' | 'FL' | 'BR' | 'BL' | 'cross' | 'yellow';
}

// Standard WCA Facelet Colors
const COLOR_WHITE = 0xffffff;
const COLOR_YELLOW = 0xffd500;
const COLOR_GREEN = 0x009e60;
const COLOR_BLUE = 0x0051ba;
const COLOR_RED = 0xc41e3a;
const COLOR_ORANGE = 0xff5800;
const COLOR_BLACK = 0x111318;

interface CubieData {
  mesh: THREE.Mesh;
  initPos: THREE.Vector3;
}

export const InteractiveCube: React.FC<InteractiveCubeProps> = ({
  algorithm = '',
  setupMoves = '',
  autoPlay = false,
  interactive = true,
  className = '',
  onMoveComplete,
  highlightSlot = 'none'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState<number>(1);
  const [currentMoveIdx, setCurrentMoveIdx] = useState<number>(-1);
  const [parsedMoves, setParsedMoves] = useState<string[]>([]);
  const [isRotating, setIsRotating] = useState(false);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubiesRef = useRef<CubieData[]>([]);
  const pivotGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Mouse interaction state for camera orbit
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 5, distance: 7.5 });

  // Parse notation into array of moves
  const parseAlgorithm = useCallback((alg: string): string[] => {
    if (!alg) return [];
    // Remove parentheses, brackets, and clean up spaces
    const clean = alg.replace(/[()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    return clean.split(' ').filter(Boolean);
  }, []);

  useEffect(() => {
    const moves = parseAlgorithm(algorithm);
    setParsedMoves(moves);
    setCurrentMoveIdx(-1);
  }, [algorithm, parseAlgorithm]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer with antialiasing and tone mapping for Apple-level fidelity
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(6, 10, 8);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    // Subtle Cyan Cyber Rim Light (Cubex Brand Aesthetic)
    const rimLight = new THREE.PointLight(0x00f0ff, 1.8, 20);
    rimLight.position.set(-8, -4, -6);
    scene.add(rimLight);

    // Warm Orange accent light
    const orangeLight = new THREE.PointLight(0xff6b00, 1.2, 20);
    orangeLight.position.set(8, -6, 4);
    scene.add(orangeLight);

    // 5. Floor Shadow receiver
    const shadowGeo = new THREE.PlaneGeometry(12, 12);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.3;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // 6. Build the 26 Cubies
    const pivot = new THREE.Group();
    scene.add(pivot);
    pivotGroupRef.current = pivot;

    cubiesRef.current = createRubiksCube(scene);

    // Setup initial position if setupMoves provided
    if (setupMoves) {
      applySetupMoves(setupMoves);
    }

    // Render loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, distance } = cameraAngleRef.current;
    const x = distance * Math.sin(phi) * Math.sin(theta);
    const y = distance * Math.cos(phi);
    const z = distance * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Create 26 individual cubies with realistic beveled materials
  const createRubiksCube = (scene: THREE.Scene): CubieData[] => {
    const cubies: CubieData[] = [];
    const size = 0.96;
    const spacing = 1.0;

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue; // Skip core center

          // Create materials for the 6 faces:
          // Order in Three.js BoxGeometry: [right(+x), left(-x), top(+y), bottom(-y), front(+z), back(-z)]
          const materials: THREE.MeshStandardMaterial[] = [
            createFaceMaterial(x === 1 ? COLOR_RED : COLOR_BLACK), // Right
            createFaceMaterial(x === -1 ? COLOR_ORANGE : COLOR_BLACK), // Left
            createFaceMaterial(y === 1 ? COLOR_WHITE : COLOR_BLACK), // Top
            createFaceMaterial(y === -1 ? COLOR_YELLOW : COLOR_BLACK), // Bottom
            createFaceMaterial(z === 1 ? COLOR_GREEN : COLOR_BLACK), // Front
            createFaceMaterial(z === -1 ? COLOR_BLUE : COLOR_BLACK) // Back
          ];

          const geometry = new THREE.BoxGeometry(size, size, size);
          const mesh = new THREE.Mesh(geometry, materials);
          mesh.position.set(x * spacing, y * spacing, z * spacing);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          scene.add(mesh);
          cubies.push({
            mesh,
            initPos: new THREE.Vector3(x, y, z)
          });
        }
      }
    }

    return cubies;
  };

  const createFaceMaterial = (color: number) => {
    const isColored = color !== COLOR_BLACK;
    return new THREE.MeshStandardMaterial({
      color,
      roughness: isColored ? 0.2 : 0.6,
      metalness: isColored ? 0.05 : 0.1
    });
  };

  // Execute a single move with rotation animation
  const executeMove = useCallback(
    (move: string, customDuration?: number): Promise<void> => {
      return new Promise((resolve) => {
        const scene = sceneRef.current;
        const pivot = pivotGroupRef.current;
        if (!scene || !pivot || isRotating) {
          resolve();
          return;
        }

        setIsRotating(true);

        const face = move[0].toUpperCase();
        const isDouble = move.includes('2');
        const isPrime = move.includes("'");
        let angle = Math.PI / 2;
        if (isDouble) angle = Math.PI;
        if (isPrime) angle = -angle;

        // Determine axis and layer filtering predicate
        let axis = new THREE.Vector3(0, 1, 0);
        let filter: (pos: THREE.Vector3) => boolean = () => false;

        switch (face) {
          case 'U': // Top layer: y > 0.5
            axis.set(0, -1, 0);
            filter = (pos) => pos.y > 0.5;
            break;
          case 'D': // Bottom layer: y < -0.5
            axis.set(0, 1, 0);
            filter = (pos) => pos.y < -0.5;
            break;
          case 'R': // Right layer: x > 0.5
            axis.set(-1, 0, 0);
            filter = (pos) => pos.x > 0.5;
            break;
          case 'L': // Left layer: x < -0.5
            axis.set(1, 0, 0);
            filter = (pos) => pos.x < -0.5;
            break;
          case 'F': // Front layer: z > 0.5
            axis.set(0, 0, -1);
            filter = (pos) => pos.z > 0.5;
            break;
          case 'B': // Back layer: z < -0.5
            axis.set(0, 0, 1);
            filter = (pos) => pos.z < -0.5;
            break;
          case 'M': // Middle slice between L and R: -0.5 <= x <= 0.5
            axis.set(1, 0, 0); // M moves follow L direction
            filter = (pos) => Math.abs(pos.x) < 0.5;
            break;
          case 'E': // Equatorial slice between U and D
            axis.set(0, 1, 0);
            filter = (pos) => Math.abs(pos.y) < 0.5;
            break;
          case 'S': // Standing slice between F and B
            axis.set(0, 0, -1);
            filter = (pos) => Math.abs(pos.z) < 0.5;
            break;
          default:
            setIsRotating(false);
            resolve();
            return;
        }

        // Attach target cubies to pivot
        pivot.rotation.set(0, 0, 0);
        const rotatingCubies: THREE.Mesh[] = [];

        cubiesRef.current.forEach(({ mesh }) => {
          const worldPos = new THREE.Vector3();
          mesh.getWorldPosition(worldPos);
          if (filter(worldPos)) {
            pivot.attach(mesh);
            rotatingCubies.push(mesh);
          }
        });

        // Animation timing
        const duration = customDuration ?? 260 / speed;
        const startTime = performance.now();

        const animateRotation = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic for crisp, snappy feel
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentAngle = angle * easeProgress;

          pivot.setRotationFromAxisAngle(axis, currentAngle);

          if (progress < 1) {
            requestAnimationFrame(animateRotation);
          } else {
            pivot.setRotationFromAxisAngle(axis, angle);
            pivot.updateMatrixWorld();

            // Reattach cubies back to root scene and round positions
            rotatingCubies.forEach((mesh) => {
              scene.attach(mesh);
              mesh.position.set(
                Math.round(mesh.position.x),
                Math.round(mesh.position.y),
                Math.round(mesh.position.z)
              );
              mesh.updateMatrixWorld();
            });

            pivot.rotation.set(0, 0, 0);
            setIsRotating(false);
            resolve();
          }
        };

        requestAnimationFrame(animateRotation);
      });
    },
    [isRotating, speed]
  );

  const applySetupMoves = async (movesStr: string) => {
    const moves = parseAlgorithm(movesStr);
    for (const m of moves) {
      await executeMove(m, 1);
    }
  };

  // Step Forward
  const handleStepForward = async () => {
    if (currentMoveIdx < parsedMoves.length - 1 && !isRotating) {
      const nextIdx = currentMoveIdx + 1;
      const move = parsedMoves[nextIdx];
      await executeMove(move);
      setCurrentMoveIdx(nextIdx);
      onMoveComplete?.(nextIdx);
    }
  };

  // Step Backward (inverts move)
  const handleStepBackward = async () => {
    if (currentMoveIdx >= 0 && !isRotating) {
      const move = parsedMoves[currentMoveIdx];
      const invMove = move.includes("'")
        ? move.replace("'", '')
        : move.includes('2')
        ? move
        : move + "'";
      await executeMove(invMove);
      const prevIdx = currentMoveIdx - 1;
      setCurrentMoveIdx(prevIdx);
      onMoveComplete?.(prevIdx);
    }
  };

  // Reset to solved
  const handleReset = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    cubiesRef.current.forEach(({ mesh, initPos }) => {
      scene.attach(mesh);
      mesh.position.copy(initPos);
      mesh.rotation.set(0, 0, 0);
      mesh.updateMatrixWorld();
    });
    setCurrentMoveIdx(-1);
    setIsPlaying(false);
  };

  // Quick Scramble
  const handleScramble = async () => {
    handleReset();
    const scrambleMoves = ['R', 'U', "R'", "F'", 'U2', 'L', "B'", 'D', 'R2', 'F'];
    for (const m of scrambleMoves) {
      await executeMove(m, 40);
    }
  };

  // Auto-play loop
  useEffect(() => {
    let active = true;

    const playLoop = async () => {
      if (!isPlaying || isRotating) return;

      if (currentMoveIdx < parsedMoves.length - 1) {
        const nextIdx = currentMoveIdx + 1;
        const move = parsedMoves[nextIdx];
        await executeMove(move);
        if (active) {
          setCurrentMoveIdx(nextIdx);
          onMoveComplete?.(nextIdx);
        }
      } else {
        setIsPlaying(false);
      }
    };

    if (isPlaying) {
      playLoop();
    }

    return () => {
      active = false;
    };
  }, [isPlaying, currentMoveIdx, parsedMoves, isRotating, executeMove, onMoveComplete]);

  // Mouse / Touch orbit controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !interactive) return;
    const dx = e.clientX - prevMousePosRef.current.x;
    const dy = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    cameraAngleRef.current.theta += dx * 0.008;
    cameraAngleRef.current.phi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, cameraAngleRef.current.phi - dy * 0.008)
    );
    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Keyboard shortcut listener for cube moves
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!interactive) return;
      const key = e.key.toUpperCase();
      const validFaces = ['U', 'D', 'L', 'R', 'F', 'B', 'M'];
      if (validFaces.includes(key)) {
        const move = e.shiftKey ? `${key}'` : key;
        executeMove(move);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interactive, executeMove]);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full min-h-[340px] cursor-grab active:cursor-grabbing relative flex items-center justify-center"
      >
        {/* Apple-style floating move indicator */}
        {parsedMoves.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl z-10 max-w-[90%] overflow-x-auto scrollbar-none">
            {parsedMoves.map((m, idx) => (
              <span
                key={idx}
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-all duration-200 ${
                  idx === currentMoveIdx
                    ? 'bg-[#00F0FF] text-black shadow-lg shadow-[#00F0FF]/30 scale-110'
                    : idx < currentMoveIdx
                    ? 'text-white/40'
                    : 'text-white/80'
                }`}
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="w-full max-w-md px-4 py-3 bg-[#0E131F]/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between gap-2 shadow-2xl mt-2 z-10">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStepBackward()}
            disabled={currentMoveIdx < 0 || isRotating}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            title="Step Back"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={parsedMoves.length === 0}
            className="p-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0099FF] text-black font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#00F0FF]/20"
            title={isPlaying ? 'Pause' : 'Play Algorithm'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => handleStepForward()}
            disabled={currentMoveIdx >= parsedMoves.length - 1 || isRotating}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                speed === s
                  ? 'bg-white/20 text-[#00F0FF] shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Utilities */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs flex items-center gap-1"
            title="Reset to Solved"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={handleScramble}
            className="p-2 rounded-xl text-white/60 hover:text-[#FF6B00] hover:bg-white/10 transition-all text-xs flex items-center gap-1"
            title="Scramble Cube"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
