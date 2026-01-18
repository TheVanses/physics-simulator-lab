// js/modules/Ball.js

export const data = {
    name: "小球",
    // 必须确保 create 包含在 data 对象里
    create: (x, y) => {
        const { Bodies } = Matter;

        // 创建初始半径为 40 的圆
        const ball = Bodies.circle(x, y, 40, {
            friction: 0.1,
            restitution: 0.8,
            render: {
                fillStyle: '#3498db',
                strokeStyle: '#2980b9',
                lineWidth: 2
            }
        });

        // 核心属性：名称
        ball.customName = "小球 " + (Math.floor(Math.random() * 100));
        
        // 关键：为了支持大小缩放，记录初始半径基准
        ball.prev_radius = 40;

        // 属性面板设置
        ball.editableProps = {
            customName: { label: "物体名称", type: "text" },
            // 使用 isRadiusScale 标记，方便 main.js 识别
            radius: { label: "半径 (px)", min: 10, max: 300, step: 5, isRadiusScale: true },
            friction: { label: "摩擦力", min: 0, max: 1, step: 0.05 },
            restitution: { label: "弹性", min: 0, max: 1.2, step: 0.1 }
        };

        return ball;
    }
};