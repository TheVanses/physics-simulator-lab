// js/engine.js
export const physics = {
    engine: null,
    render: null,
    runner: null,
    snapEnabled: false,

    init(container) {
        // 显式检查 Matter 是否存在
        if (typeof Matter === 'undefined') {
            console.error("Matter.js 未加载，请检查 index.html 中的脚本引入");
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

        // 边界墙壁
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
        // 使用箭头函数确保 this 指向 physics 对象本身
        Matter.Events.on(this.render, 'afterRender', () => {
            const context = this.render.context;
            const bodies = Matter.Composite.allBodies(this.engine.world);
            
            bodies.forEach(body => {
                if (body.isStatic || body.label === 'wall') return;

                const { x, y } = body.position;
                const g = this.engine.gravity;

                // 计算合力
                const fX = body.force.x;
                const fY = body.force.y + (body.mass * g.y * g.scale);

                // 绘制名称
                context.fillStyle = "#2c3e50";
                context.font = "bold 12px Arial";
                context.textAlign = "center";
                
                // 自动适配圆形和矩形的高度高度
                const offset = body.circleRadius || (body.bounds.max.y - body.bounds.min.y) / 2 || 25;
                context.fillText(body.customName || `ID: ${body.id}`, x, y - offset - 15);

                // 绘制合力箭头
                this.drawArrow(context, x, y, fX * 50000, fY * 50000, "#e74c3c", "F");
            });
        });
    },

    drawArrow(ctx, x, y, vx, vy, color, label) {
        if (Math.abs(vx) < 1 && Math.abs(vy) < 1) return;
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