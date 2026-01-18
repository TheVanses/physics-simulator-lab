// js/engine.js
export const physics = {
    engine: null,
    render: null,
    runner: null,

    init(container) {
        const { Engine, Render, Runner, Composite, Bodies, Mouse, MouseConstraint } = Matter;

        // 1. 创建引擎
        this.engine = Engine.create();
        
        // 2. 创建渲染器
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.render = Render.create({
            element: container,
            engine: this.engine,
            options: {
                width: width,
                height: height,
                wireframes: false, // 设置为 false 才能看到颜色
                background: '#f4f4f4'
            }
        });

        // 3. 核心需求：增加物理边界墙壁 (防止超出范围 & 减少边缘抖动)
        const wallThickness = 100; // 墙厚度设置为100，有效防止高速物体穿模
        const offset = wallThickness / 2;
        const walls = [
            // 地面
            Bodies.rectangle(width/2, height + offset, width, wallThickness, { isStatic: true, label: 'wall' }),
            // 天花板
            Bodies.rectangle(width/2, -offset, width, wallThickness, { isStatic: true, label: 'wall' }),
            // 左墙
            Bodies.rectangle(-offset, height/2, wallThickness, height, { isStatic: true, label: 'wall' }),
            // 右墙
            Bodies.rectangle(width + offset, height/2, wallThickness, height, { isStatic: true, label: 'wall' })
        ];
        Composite.add(this.engine.world, walls);

        // 4. 运行引擎
        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        // 5. 添加鼠标交互
        const mouse = Mouse.create(this.render.canvas);
        const mc = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        Composite.add(this.engine.world, mc);

        // 6. 核心需求：受力分析与命名绘制
        this.setupVisualizer();

        return { engine: this.engine, render: this.render, mc: mc };
    },

    // 绘制受力分析箭头和名称
    setupVisualizer() {
        Matter.Events.on(this.render, 'afterRender', () => {
            const context = this.render.context;
            const bodies = Matter.Composite.allBodies(this.engine.world);
            const gravity = this.engine.gravity;

            bodies.forEach(body => {
                // 跳过静态墙壁
                if (body.isStatic || body.label === 'wall') return;

                const { x, y } = body.position;

                // --- A. 绘制合力箭头 ---
                // 计算合力：当前外力(force) + 重力(mass * gravity)
                const totalForceX = body.force.x;
                const totalForceY = body.force.y + (body.mass * gravity.y * gravity.scale);
                
                // 绘制红色的合力箭头 (放大比例以便观察)
                this.drawArrow(context, x, y, totalForceX * 50000, totalForceY * 50000, "#e74c3c", "F合");

                // --- B. 绘制速度箭头 (蓝色) ---
                this.drawArrow(context, x, y, body.velocity.x * 10, body.velocity.y * 10, "#3498db", "v");

                // --- C. 绘制物体名称 ---
                context.fillStyle = "#2c3e50";
                context.font = "bold 14px Arial";
                context.textAlign = "center";
                // 使用 customName，如果没有则显示 ID
                const name = body.customName || `物体 ${body.id}`;
                context.fillText(name, x, y - 40); 
            });
        });
    },

    drawArrow(ctx, fromX, fromY, vecX, vecY, color, label) {
        if (Math.abs(vecX) < 1 && Math.abs(vecY) < 1) return; // 力太小时不绘制

        const toX = fromX + vecX;
        const toY = fromY + vecY;
        const headlen = 10; // 箭头尖端的长度
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        // 画直线
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // 画箭头尖端
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // 写标签
        ctx.fillText(label, toX + 5, toY + 5);
    },

    add(obj) {
        Matter.Composite.add(this.engine.world, obj);
    },

    setGravity(val) {
        this.engine.gravity.y = val;
    }
};// js/engine.js
export const physics = {
    engine: null,
    render: null,
    runner: null,

    init(container) {
        const { Engine, Render, Runner, Composite, Bodies, Mouse, MouseConstraint } = Matter;

        // 1. 创建引擎
        this.engine = Engine.create();
        
        // 2. 创建渲染器
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.render = Render.create({
            element: container,
            engine: this.engine,
            options: {
                width: width,
                height: height,
                wireframes: false, // 设置为 false 才能看到颜色
                background: '#f4f4f4'
            }
        });

        // 3. 核心需求：增加物理边界墙壁 (防止超出范围 & 减少边缘抖动)
        const wallThickness = 100; // 墙厚度设置为100，有效防止高速物体穿模
        const offset = wallThickness / 2;
        const walls = [
            // 地面
            Bodies.rectangle(width/2, height + offset, width, wallThickness, { isStatic: true, label: 'wall' }),
            // 天花板
            Bodies.rectangle(width/2, -offset, width, wallThickness, { isStatic: true, label: 'wall' }),
            // 左墙
            Bodies.rectangle(-offset, height/2, wallThickness, height, { isStatic: true, label: 'wall' }),
            // 右墙
            Bodies.rectangle(width + offset, height/2, wallThickness, height, { isStatic: true, label: 'wall' })
        ];
        Composite.add(this.engine.world, walls);

        // 4. 运行引擎
        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        // 5. 添加鼠标交互
        const mouse = Mouse.create(this.render.canvas);
        const mc = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        Composite.add(this.engine.world, mc);

        // 6. 核心需求：受力分析与命名绘制
        this.setupVisualizer();

        return { engine: this.engine, render: this.render, mc: mc };
    },

    // 绘制受力分析箭头和名称
    setupVisualizer() {
        Matter.Events.on(this.render, 'afterRender', () => {
            const context = this.render.context;
            const bodies = Matter.Composite.allBodies(this.engine.world);
            const gravity = this.engine.gravity;

            bodies.forEach(body => {
                // 跳过静态墙壁
                if (body.isStatic || body.label === 'wall') return;

                const { x, y } = body.position;

                // --- A. 绘制合力箭头 ---
                // 计算合力：当前外力(force) + 重力(mass * gravity)
                const totalForceX = body.force.x;
                const totalForceY = body.force.y + (body.mass * gravity.y * gravity.scale);
                
                // 绘制红色的合力箭头 (放大比例以便观察)
                this.drawArrow(context, x, y, totalForceX * 50000, totalForceY * 50000, "#e74c3c", "F合");

                // --- B. 绘制速度箭头 (蓝色) ---
                this.drawArrow(context, x, y, body.velocity.x * 10, body.velocity.y * 10, "#3498db", "v");

                // --- C. 绘制物体名称 ---
                context.fillStyle = "#2c3e50";
                context.font = "bold 14px Arial";
                context.textAlign = "center";
                // 使用 customName，如果没有则显示 ID
                const name = body.customName || `物体 ${body.id}`;
                context.fillText(name, x, y - 40); 
            });
        });
    },

    drawArrow(ctx, fromX, fromY, vecX, vecY, color, label) {
        if (Math.abs(vecX) < 1 && Math.abs(vecY) < 1) return; // 力太小时不绘制

        const toX = fromX + vecX;
        const toY = fromY + vecY;
        const headlen = 10; // 箭头尖端的长度
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        // 画直线
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // 画箭头尖端
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // 写标签
        ctx.fillText(label, toX + 5, toY + 5);
    },

    add(obj) {
        Matter.Composite.add(this.engine.world, obj);
    },

    setGravity(val) {
        this.engine.gravity.y = val;
    }
};