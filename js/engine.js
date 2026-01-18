// js/engine.js
export const physics = {
    engine: null,
    render: null,
    runner: null,
    snapEnabled: false,
    pendingForces: new Map(), // 保持你原有的存储结构

    init(container) {
        if (typeof Matter === 'undefined') return;
        const { Engine, Render, Runner, Composite, Bodies, Mouse, MouseConstraint, Events } = Matter;

        this.engine = Engine.create({ positionIterations: 10, velocityIterations: 10 });
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.render = Render.create({
            element: container,
            engine: this.engine,
            options: { width, height, wireframes: false, background: '#f8f9fa' }
        });

        // 边界
        const wallOptions = { isStatic: true, label: 'wall', render: { fillStyle: '#bdc3c7' } };
        Composite.add(this.engine.world, [
            Bodies.rectangle(width/2, height + 50, width, 100, wallOptions),
            Bodies.rectangle(width/2, -50, width, 100, wallOptions),
            Bodies.rectangle(-50, height/2, 100, height, wallOptions),
            Bodies.rectangle(width + 50, height/2, 100, height, wallOptions)
        ]);

        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        const mouse = Mouse.create(this.render.canvas);
        const mc = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Composite.add(this.engine.world, mc);

        // --- 核心修复：处理每帧持续力 ---
        Events.on(this.engine, 'beforeUpdate', () => {
            const bodies = Composite.allBodies(this.engine.world);
            bodies.forEach(body => {
                if (body.constantAccel && !body.isStatic) {
                    const rad = (body.accelAngle || 0) * (Math.PI / 180);
                    const f = body.constantAccel * body.mass * 0.001;
                    Matter.Body.applyForce(body, body.position, { x: Math.cos(rad) * f, y: Math.sin(rad) * f });
                }
            });
        });

        this.setupSnapping(mc);
        this.setupVisualizer();
        return { engine: this.engine, render: this.render, mc: mc };
    },

    // 统一推力接口
    applyImpulse(body, vector) {
        if (!body || !vector) return;
        Matter.Body.applyForce(body, body.position, {
            x: vector.x * 0.002,
            y: vector.y * 0.002
        });
    },

    setupSnapping(mc) {
        Matter.Events.on(mc, 'drag', (event) => {
            if (this.snapEnabled && event.source.body) {
                const body = event.source.body;
                const snappedX = Math.round(body.position.x / 20) * 20;
                const snappedY = Math.round(body.position.y / 20) * 20;
                Matter.Body.setPosition(body, { x: snappedX, y: snappedY });
            }
        });
    },

    setupVisualizer() {
        Matter.Events.on(this.render, 'afterRender', () => {
            const context = this.render.context;
            const bodies = Matter.Composite.allBodies(this.engine.world);
            const g = this.engine.gravity;
            
            bodies.forEach(body => {
                if (body.isStatic || body.label === 'wall') return;
                const { x, y } = body.position;
                const offset = body.circleRadius || (body.bounds.max.y - body.bounds.min.y) / 2 || 25;

                // 1. 绘制速度计 (绿色)
                const speed = Math.sqrt(body.velocity.x**2 + body.velocity.y**2).toFixed(1);
                context.fillStyle = "#2ecc71";
                context.font = "bold 10px monospace";
                context.fillText(`${speed} m/s`, x, y + offset + 15);

                // 2. 绘制名称与质量
                context.fillStyle = body.render.opacity < 1 ? "#95a5a6" : "#2c3e50";
                context.font = "bold 12px Arial";
                context.fillText(`${body.customName || body.id} (${body.mass.toFixed(1)}kg)`, x, y - offset - 15);

                // 3. 绘制启动推力箭头 (黄色)
                const pending = this.pendingForces.get(body.id);
                if (pending) {
                    this.drawArrow(context, x, y, pending.x, pending.y, "#f1c40f", "启动推力");
                }
            });
        });
    },

    drawArrow(ctx, x, y, vx, vy, color, label) {
        if (Math.abs(vx) < 1 && Math.abs(vy) < 1) return;
        const tx = x + vx, ty = y + vy;
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
        const head = 8, angle = Math.atan2(ty - y, tx - x);
        ctx.beginPath(); ctx.moveTo(tx, ty);
        ctx.lineTo(tx - head * Math.cos(angle - 0.4), ty - head * Math.sin(angle - 0.4));
        ctx.lineTo(tx - head * Math.cos(angle + 0.4), ty - head * Math.sin(angle + 0.4));
        ctx.fill();
        ctx.fillText(label, tx + 5, ty + 5);
    },

    add(obj) { Matter.Composite.add(this.engine.world, obj); },
    setGravity(v) { this.engine.gravity.y = v; }
};