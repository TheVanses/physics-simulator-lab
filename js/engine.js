// js/engine.js
export const physics = {
    engine: null,
    render: null,
    runner: null,
    pendingForces: new Map(),

    init(container) {
        if (typeof Matter === 'undefined') return;
        const { Engine, Render, Runner, Composite, Mouse, MouseConstraint, Events } = Matter;

        this.engine = Engine.create();
        this.render = Render.create({
            element: container,
            engine: this.engine,
            options: { width: container.clientWidth, height: container.clientHeight, wireframes: false, background: '#f8f9fa' }
        });

        const wallOptions = { isStatic: true, label: 'wall', render: { fillStyle: '#bdc3c7' } };
        Composite.add(this.engine.world, [
            Matter.Bodies.rectangle(container.clientWidth/2, container.clientHeight + 25, container.clientWidth, 50, wallOptions),
            Matter.Bodies.rectangle(container.clientWidth/2, -25, container.clientWidth, 50, wallOptions),
            Matter.Bodies.rectangle(-25, container.clientHeight/2, 50, container.clientHeight, wallOptions),
            Matter.Bodies.rectangle(container.clientWidth + 25, container.clientHeight/2, 50, container.clientHeight, wallOptions)
        ]);

        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        const mc = MouseConstraint.create(this.engine, {
            mouse: Mouse.create(this.render.canvas),
            constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Composite.add(this.engine.world, mc);

        this.setupVisualizer();
        return { engine: this.engine, mc };
    },

    setupVisualizer() {
        Matter.Events.on(this.render, 'afterRender', () => {
            const ctx = this.render.context;
            const bodies = Matter.Composite.allBodies(this.engine.world);
            
            bodies.forEach(body => {
                if (body.isStatic || body.label === 'wall') return;
                const { x, y } = body.position;

                // 1. 速度计
                const speed = Math.sqrt(body.velocity.x**2 + body.velocity.y**2).toFixed(1);
                ctx.fillStyle = "#2ecc71";
                ctx.font = "bold 11px monospace";
                ctx.fillText(`${speed} m/s`, x, y + 25);

                // 2. 导出顶点 (非圆形)
                if (!body.circleRadius && body.vertices) {
                    ctx.fillStyle = "rgba(231, 76, 60, 0.8)";
                    body.vertices.forEach((v, i) => {
                        ctx.beginPath();
                        ctx.arc(v.x, v.y, 3, 0, Math.PI*2);
                        ctx.fill();
                        ctx.font = "9px Arial";
                        ctx.fillText(`(${Math.round(v.x)},${Math.round(v.y)})`, v.x + 5, v.y - 5);
                    });
                }
            });
        });
    },

    setGravity(v) { this.engine.gravity.y = v; },
    add(obj) { Matter.Composite.add(this.engine.world, obj); }
};