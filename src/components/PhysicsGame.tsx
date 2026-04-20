import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { motion, AnimatePresence } from 'motion/react';

interface PhysicsGameProps {
  onScore?: () => void;
}

export const PhysicsGame: React.FC<PhysicsGameProps> = ({ onScore }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const ballRef = useRef<Matter.Body | null>(null);
  const hoopRef = useRef<Matter.Body | null>(null);
  const [isGrounded, setIsGrounded] = useState(false);
  const [hoopPos, setHoopPos] = useState({ x: 0, y: 0 });
  const [bonusState, setBonusState] = useState<'none' | 'perfect' | 'apex'>('none');
  const [apexSuccess, setApexSuccess] = useState(0); // For gauge/visual feedback
  const lastWallHit = useRef<number>(0);
  const wasAscending = useRef<boolean>(false);

  useEffect(() => {
    if (!sceneRef.current) return;

    const { Engine, Render, Runner, Bodies, Composite, Events, Mouse, MouseConstraint, Vector, Body } = Matter;

    const engine = Engine.create({
      gravity: { x: 0, y: 1.2 } // Slightly stronger gravity for "snappy" feel
    });
    engineRef.current = engine;

    const width = sceneRef.current.clientWidth;
    const height = sceneRef.current.clientHeight;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio
      }
    });

    // Walls - High restitution for back-wall bounces
    const wallOptions = { 
      isStatic: true, 
      render: { fillStyle: 'transparent' },
      restitution: 0.95,
      friction: 0.05
    };
    
    const ground = Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -100, width, 50, wallOptions); // Higher ceiling to prevent getting stuck
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height, wallOptions);
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions);

    // Ball - Skill-focused physics
    const ball = Bodies.circle(width / 4, height - 100, 18, {
      restitution: 0.9, 
      friction: 0.005,
      frictionAir: 0.02, // Higher drag for better control when not boosting
      density: 0.01,    // Heavier feel
      inertia: Infinity,
      collisionFilter: {
        category: 0x0002,
        mask: 0x0001 | 0x0004
      },
      render: {
        fillStyle: '#06b6d4',
        strokeStyle: '#ffffff',
        lineWidth: 1
      },
      label: 'ball'
    });
    ballRef.current = ball;


    // Hoop - Multi-part body
    const hoopX = width * 0.75;
    const hoopY = height * 0.4;
    
    const hoopBackboard = Bodies.rectangle(hoopX + 35, hoopY - 20, 10, 100, { 
      render: { fillStyle: 'rgba(255, 255, 255, 0.1)' },
      restitution: 0.9
    });
    const hoopRimLeft = Bodies.circle(hoopX - 25, hoopY + 10, 5, { 
      render: { fillStyle: '#f43f5e' },
      restitution: 0.95
    });
    const hoopRimRight = Bodies.circle(hoopX + 25, hoopY + 10, 5, { 
      render: { fillStyle: '#f43f5e' },
      restitution: 0.95
    });
    const hoopSensor = Bodies.rectangle(hoopX, hoopY + 10, 45, 5, {
      isSensor: true,
      label: 'hoop-sensor',
      render: { fillStyle: 'transparent' }
    });

    const hoopBody = Body.create({
      parts: [hoopBackboard, hoopRimLeft, hoopRimRight, hoopSensor],
      isStatic: false,
      frictionAir: 0.1,
      label: 'hoop-main',
      collisionFilter: {
        category: 0x0004, // Separate category for mouse interaction
        mask: 0x0002      // Only collide with ball
      }
    });
    
    Composite.add(engine.world, [ground, ceiling, leftWall, rightWall, ball, hoopBody]);

    // Input handling
    const keys: { [key: string]: boolean } = {};
    let spaceReleased = true;
    let pulseCooldown = 0;

    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.code === 'Space' && spaceReleased && pulseCooldown <= 0) {
        triggerPulse();
        spaceReleased = false;
      }
      keys[e.code] = true; 
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
      if (e.code === 'Space') spaceReleased = true;
      keys[e.code] = false; 
    };

    const triggerPulse = () => {
      const now = Date.now();
      const timeSinceWall = now - lastWallHit.current;
      const isReflex = timeSinceWall < 150; 
      
      // Apex Detection: Vertical velocity near zero while transitioning from up to down
      const isAtPeak = Math.abs(ball.velocity.y) < 1.5 && wasAscending.current;

      let thrustX = 0;
      if (keys['KeyA'] || keys['ArrowLeft']) thrustX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) thrustX += 1;

      let thrustY = 0;
      if (keys['KeyW'] || keys['ArrowUp']) thrustY -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) thrustY += 1;

      const hasDirection = thrustX !== 0 || thrustY !== 0;
      const isApexSurge = isAtPeak && hasDirection;

      const baseForce = 0.5;
      const reflexMult = 2.0;
      const apexMult = 3.5; // Major bonus for peak timing
      
      let force = baseForce;
      if (isReflex) force *= reflexMult;
      if (isApexSurge) force *= apexMult;

      // Calculate final vector
      let targetVector = { x: 0, y: -1 }; // Default up
      if (hasDirection) {
        const mag = Math.sqrt(thrustX * thrustX + thrustY * thrustY);
        targetVector = { x: thrustX / mag, y: thrustY / mag };
      }

      const impulse = {
        x: targetVector.x * force,
        y: targetVector.y * force
      };

      // Reset velocity for the surgical "snap" feel
      if (isApexSurge) {
        Matter.Body.setVelocity(ball, { x: ball.velocity.x * 0.1, y: ball.velocity.y * 0.1 });
        setBonusState('apex');
        setApexSuccess(1.0);
        shake = 25;
        setTimeout(() => setBonusState('none'), 800);
      } else if (isReflex) {
        Matter.Body.setVelocity(ball, { x: ball.velocity.x * 0.5, y: ball.velocity.y * 0.2 });
        setBonusState('perfect');
        shake = 15;
        setTimeout(() => setBonusState('none'), 500);
      } else {
        Matter.Body.setVelocity(ball, { x: ball.velocity.x * 0.8, y: ball.velocity.y * 0.5 });
        shake = 5;
      }

      Matter.Body.applyForce(ball, ball.position, impulse);
      pulseCooldown = 25; 
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Ball Trail & Squash/Stretch Render
    const trail: { x: number, y: number, alpha: number }[] = [];
    let shake = 0;
    
    Events.on(render, 'afterRender', () => {
      const context = render.context;
      const velocity = ball.velocity;
      const speed = Vector.magnitude(velocity);
      
      // Screen Shake
      if (shake > 0) {
        const sx = (Math.random() - 0.5) * shake;
        const sy = (Math.random() - 0.5) * shake;
        sceneRef.current!.style.transform = `translate(${sx}px, ${sy}px)`;
        shake *= 0.9;
      } else {
        sceneRef.current!.style.transform = 'translate(0,0)';
      }

      // Update trail
      if (speed > 1) {
        trail.push({ x: ball.position.x, y: ball.position.y, alpha: 1 });
      }
      
      if (trail.length > 30) trail.shift();
      
      // Render trail with velocity-based width
      for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        point.alpha -= 0.03;
        if (point.alpha <= 0) continue;
        
        context.globalAlpha = point.alpha * (i / trail.length) * 0.5;
        context.fillStyle = '#06b6d4';
        const size = (i / trail.length) * 12;
        context.beginPath();
        context.arc(point.x, point.y, size, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;

      // Custom Ball Rendering (Squash & Stretch)
      context.save();
      context.translate(ball.position.x, ball.position.y);
      
      // Calculate rotation and stretch
      const angle = Math.atan2(velocity.y, velocity.x);
      context.rotate(angle);
      
      const stretch = 1 + speed * 0.02;
      const squash = 1 / stretch;
      context.scale(stretch, squash);
      
      // Draw ball
      context.beginPath();
      context.arc(0, 0, 18, 0, Math.PI * 2);
      context.fillStyle = '#06b6d4';
      context.fill();
      context.strokeStyle = '#ffffff';
      context.lineWidth = 1;
      context.stroke();
      
      // Highlight/Glow effect
      const gradient = context.createRadialGradient(-5, -5, 2, 0, 0, 18);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      context.fillStyle = gradient;
      context.fill();
      
      context.restore();

      // Draw "Arena Perimeter"
      context.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      context.setLineDash([10, 20]);
      context.lineWidth = 2;
      context.strokeRect(10, 10, width - 20, height - 20);
      context.setLineDash([]);
    });

    // Grounded check helper
    Events.on(engine, 'beforeUpdate', () => {
      setHoopPos({ x: hoopBody.position.x, y: hoopBody.position.y });
      if (pulseCooldown > 0) pulseCooldown--;
      
      // Decay apex success for gauge
      setApexSuccess(prev => Math.max(0, prev * 0.9));

      // Track ascent for apex detection
      if (ball.velocity.y < -0.1) wasAscending.current = true;
      if (ball.velocity.y > 0.1) wasAscending.current = false;

      Matter.Body.applyForce(hoopBody, hoopBody.position, { 
        x: 0, 
        y: -engine.world.gravity.y * hoopBody.mass * engine.world.gravity.scale 
      });

      const collisions = Matter.Query.collides(ball, [ground, leftWall, rightWall]);
      const currentlyGrounded = collisions.length > 0;
      setIsGrounded(currentlyGrounded);

      // Tight Aerial Control
      const airControlForce = 0.001; 
      if (keys['KeyA'] || keys['ArrowLeft']) {
        Matter.Body.applyForce(ball, ball.position, { x: -airControlForce, y: 0 });
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        Matter.Body.applyForce(ball, ball.position, { x: airControlForce, y: 0 });
      }
    });

    // Energy Preservation & Juice logic
    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        if (bodyA.label === 'ball' || bodyB.label === 'ball') {
          const ballBody = bodyA.label === 'ball' ? bodyA : bodyB;
          const otherBody = bodyA.label === 'ball' ? bodyB : bodyA;
          
          if (otherBody === ground || otherBody === leftWall || otherBody === rightWall) {
            lastWallHit.current = Date.now();
          }

          const currentVel = Vector.magnitude(ballBody.velocity);
          if (currentVel > 12) {
            shake = Math.min(currentVel * 0.4, 20);
          }
        }

        if ((bodyA.label === 'ball' && bodyB.label === 'hoop-sensor') ||
            (bodyB.label === 'ball' && bodyA.label === 'hoop-sensor')) {
          if (ball.velocity.y > 0) {
            onScore?.();
          }
        }
      });
    });

    // Mouse control restricted to Hoop
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      collisionFilter: {
        mask: 0x0004 // Only interact with objects in category 4 (Hoop)
      },
      constraint: {
        stiffness: 0.1,
        render: { visible: false }
      }
    });

    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      Render.stop(render);
      Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
    };
  }, []);

  return (
    <div 
      ref={sceneRef} 
      className="w-full h-full relative cursor-crosshair overflow-hidden"
      id="game-container"
    >
      {/* Floating Target Label */}
      <div 
        className="absolute pointer-events-none select-none transition-transform duration-75"
        style={{ 
          left: hoopPos.x, 
          top: hoopPos.y - 80,
          transform: 'translateX(-50%)'
        }}
      >
        <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest bg-rose-400/10 border border-rose-400/20 px-2 py-1 rounded whitespace-nowrap">
          Movable Target
        </span>
      </div>

      {/* Dynamic Apex Gauge */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-48 pointer-events-none flex flex-col items-center gap-2">
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <motion.div 
            animate={{ width: `${apexSuccess * 100}%` }}
            className={`h-full ${bonusState === 'apex' ? 'bg-yellow-400' : 'bg-cyan-400'}`}
          />
        </div>
        <div className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-bold">
          Precision Apex Gauge
        </div>
      </div>

      {/* Reflex / Apex Bonus Indicator */}
      <AnimatePresence>
        {bonusState !== 'none' && (
          <motion.div 
            key={bonusState}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 text-center"
          >
            <div className={`text-5xl font-black italic tracking-tighter drop-shadow-2xl ${bonusState === 'apex' ? 'text-yellow-400' : 'text-cyan-400'}`}>
              {bonusState === 'apex' ? 'APEX SURGE' : 'REFLEX BONUS'}
            </div>
            <div className="text-xs uppercase tracking-[0.5em] text-white opacity-60 font-bold mt-2">
              {bonusState === 'apex' ? 'DIRECTIONAL_MOMENTUM_MAX: 3.5x' : 'REACTION_SYNC_ACTIVE: 2.0x'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 pointer-events-none">
        <div className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 glass-panel rounded-md ${isGrounded ? 'text-cyan-400' : 'text-gray-500'}`}>
          {isGrounded ? '● GROUNDED' : '○ AIRBORNE'}
        </div>
      </div>
    </div>

  );
};
