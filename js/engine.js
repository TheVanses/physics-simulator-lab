// js/engine.js
export const physics = {
    engine: null,
    render: null,
    runner: null,
    snapEnabled: false, // 吸附功能开关

    init(container) {
        const { Engine, Render, Runner, Composite, Bodies, Mouse, MouseConstraint } = Matter;

        // 创建引擎，增加迭代次数以减少抖动
        this.engine = Engine.create({
            positionIterations: 10,
            velocityIterations: 10
        });
        
        const width = container.clientWidth;
        const height = container.clientHeight;

        // 创建渲染器
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

        // 核心需求：防抖边界墙壁 (厚度100px)
        const wallOptions = { isStatic: true, label: 'wall', render: { fillStyle: '#bdc3c7' } };
        const walls = [
            Bodies.rectangle(width/2, height + 50, width, 100, wallOptions), // 地
            Bodies.rectangle(width/2, -50, width, 100, wallOptions),         // 天
            Bodies.rectangle(-50, height/2, 100, height, wallOptions),        // 左
            Bodies.rectangle(width + 50, height/2, 100, height, wallOptions)   // 右
        ];
        Composite.add(this.engine.world, walls);

        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        // 鼠标交互
        const mouse = Mouse.create(this.render.canvas);
        const mc = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Composite.add(this.engine.world, mc);

        // 监听鼠标拖拽实现“吸附”
        this.setupSnapping(mc);
        
        // 开启受力分析可视化
        this.setupVisualizer();

        return { engine: this.engine, render: this.render, mc: mc };
    },

    // 核心需求：吸附功能 (对齐到 20px 网格)
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

    // 核心需求：受力分析绘制
    setupVisualizer() {
        Matter.Events.on(this.render, 'afterRender', () => {
            const context = this.render.context;
            const bodies = Matter.Composite.allBodies(this.engine.world);
            
            bodies.forEach(body => {
                if (body.isStatic || body.label === 'wall') return;

                const { x, y } = body.position;
                const g = this.engine.gravity;

                // 计算合力 (外力 + 重力)
                const fX = body.force.x;
                const fY = body.force.y + (body.mass * g.y * g.scale);

                // 绘制名称
                context.fillStyle = "#2c3e50";
                context.font = "12px Arial";
                context.textAlign = "center";
                context.fillText(body.customName || `ID: ${body.id}`, x, y - (body.circleRadius || 25) - 15);

                // 绘制合力箭头 (红色)
                this.drawArrow(context, x, y, fX * 50000, fY * 50000, "#e74c3c", "F");
            });
        });
    },

    drawArrow(ctx, x, y, vx, vy, color, label) {
        if (Math.abs(vx) < 1 && Math.abs(vy) < 1) return;
        const tx = x + vx, ty = y + vy;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        // 箭头小三角
        const head = 8, angle = Math.atan2(ty - y, tx - x);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - head * Math.cos(angle - Math.PI/7), ty - head * Math.sin(angle - Math.PI/7));
        ctx.lineTo(tx - head * Math.cos(angle + Math.PI/7), ty - head * Math.sin(angle + Math.PI/7));
        ctx.fill();
    },

    add(obj) { Composite.add(this.engine.world, obj); },
    setGravity(v) { this.engine.gravity.y = v; }
};