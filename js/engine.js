// js/engine.js
const { Engine, Render, Runner, Composite, Mouse, MouseConstraint, Bodies } = Matter;

export const physics = {
    engine: Engine.create({ gravity: { y: 0 } }),
    init(container) {
        const render = Render.create({
            element: container,
            engine: this.engine,
            options: { 
                width: container.clientWidth, 
                height: container.clientHeight, 
                wireframes: false,
                background: '#f4f4f4'
            }
        });
        Render.run(render);
        Runner.run(Runner.create(), this.engine);

        // 地面
        const ground = Bodies.rectangle(container.clientWidth/2, container.clientHeight-10, container.clientWidth, 20, { 
            isStatic: true, render: { fillStyle: '#7f8c8d' } 
        });
        
        // 鼠标约束
        const mouse = Mouse.create(render.canvas);
        const mc = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: { stiffness: 0.2, render: { visible: false } }
        });
        
        Composite.add(this.engine.world, [ground, mc]);
        return { mc };
    },
    add(obj) { Composite.add(this.engine.world, obj); },
    setGravity(y) { this.engine.gravity.y = y; }
};