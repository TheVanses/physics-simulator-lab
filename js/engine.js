// js/engine.js
export const physics = {
    engine: null,
    render: null,
    runner: null,
    snapEnabled: false,
    pendingForces: new Map(), // 存储 body.id -> {x, y}

    init(container) {
        if (typeof Matter === 'undefined') {
            console.error("Matter.js 未加载");
            return;
        }

        const { Engine, Render, Runner, Composite, Bodies, Mouse, MouseConstraint } = Matter;

        this.engine = Engine.create({
            positionIterations: 10,
            velocityIterations: 10
        });
        
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.render = Render.create({
            element: container,
            engine: this.engine,
            options: {
                width: width,
                height: height,
                wireframes: false,
                background: '#f8f9fa'
            }
        });

        const wallOptions = { isStatic: true, label: 'wall', render: { fillStyle: '#bdc3c7' } };
        const walls = [
            Bodies.rectangle(width/2, height + 50, width, 100, wallOptions),
            Bodies.rectangle(width/2, -50, width, 100, wallOptions),
            Bodies.rectangle(-50, height/2, 100, height, wallOptions),
            Bodies.rectangle(width + 50, height/2, 100, height, wallOptions)
        ];
        Composite.add(this.engine.world, walls);

        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        const mouse = Mouse.create(this.render.canvas);
        const mc = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Composite.add(this.engine.world, mc);

        this.setupSnapping(mc);
        this.setupVisualizer();

        return { engine: this.engine, render: this.render, mc: mc };
    },

    // 施加推力接口
    applyImpulse(body, vector) {
        if (!body || !vector) return;
        // 缩放系数 0.002 适合大多数物理模拟
        Matter.Body.applyForce(body, body.position, {
            x: vector.x * 0.002,
            y: vector.y * 0.002
        });
    },

    setupSnapping(mc) {
        Matter.Events.on(mc, 'drag', (event) => {
            if (this.snapEnabled && event.source.body) {
                const body = event.source.body;
                const gridSize = 20;
                const snappedX = Math.round(body.position.x / gridSize) * gridSize;
                const snappedY = Math.round(body.position.y / gridSize) * gridSize;
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

                // 1. 绘制名称
                context.fillStyle = "#2c3e50";
                context.font = "bold 12px Arial";
                context.textAlign = "center";
                context.fillText(body.customName || `ID: ${body.id}`, x, y - offset - 15);

                // 2. 绘制实时合力箭头 (红色)
                const fX = body.force.x;
                const fY = body.force.y + (body.mass * g.y * g.scale);
                this.drawArrow(context, x, y, fX * 50000, fY * 50000, "#e74c3c", "F");

                // 3. 绘制预设启动推力箭头 (黄色)
                const pending = this.pendingForces.get(body.id);
                if (pending) {
                    this.drawArrow(context, x, y, pending.x * 2, pending.y * 2, "#f1c40f", "启动推力");
                }
            });
        });
    },

    drawArrow(ctx, x, y, vx, vy, color, label) {
        if (Math.abs(vx) < 2 && Math.abs(vy) < 2) return;
        const tx = x + vx, ty = y + vy;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        const head = 8, angle = Math.atan2(ty - y, tx - x);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - head * Math.cos(angle - Math.PI/7), ty - head * Math.sin(angle - Math.PI/7));
        ctx.lineTo(tx - head * Math.cos(angle + Math.PI/7), ty - head * Math.sin(angle + Math.PI/7));
        ctx.fill();
        ctx.fillText(label, tx + 5, ty + 5);
    },

    add(obj) { Matter.Composite.add(this.engine.world, obj); },
    setGravity(v) { this.engine.gravity.y = v; }
};