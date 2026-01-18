// js/modules/Ball.js
export const data = {
    name: "小球",
    create: (x, y) => {
        const { Bodies } = Matter;

        // 创建初始半径为 40 的圆
        const ball = Bodies.circle(x, y, 40, {
            friction: 0.1,
            restitution: 0.8, // 默认弹性稍高
            render: {
                fillStyle: '#3498db',
                strokeStyle: '#2980b9',
                lineWidth: 2
            }
        });

        // 核心属性设置
        ball.customName = "小球 " + (Math.floor(Math.random() * 100));
        
        // 关键：为“改变大小”设置初始半径基准值
        // 圆形缩放只需要一个维度，但为了兼容 main.js 的 width 逻辑，我们存为 prev_radius
        ball.prev_radius = 40;

        // 设置属性面板配置
        ball.editableProps = {
            customName: { label: "物体名称", type: "text" },
            // 对于圆，我们通常调整半径，这里标记为 isRadiusScale
            radius: { label: "半径 (px)", min: 10, max: 300, step: 5, isRadiusScale: true },
            friction: { label: "摩擦力", min: 0, max: 1, step: 0.05 },
            restitution: { label: "弹性", min: 0, max: 1.2, step: 0.1 }
        };

        return ball;
    }
};