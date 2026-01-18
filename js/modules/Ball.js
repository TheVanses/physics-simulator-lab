// js/modules/Ball.js
const { Bodies } = Matter;

export const data = {
    name: "小球",
    type: "body", // 标识这是一个单体物理对象
    create: (x, y) => {
        const ball = Bodies.circle(x, y, 30, {
            friction: 0.1,      // 摩擦力
            restitution: 0.8,   // 弹性系数 (0-1，越高越弹)
            density: 0.002,     // 密度
            render: {
                fillStyle: '#3498db',    // 填充颜色
                strokeStyle: '#2980b9',  // 边框颜色
                lineWidth: 3
            }
        });

        // 绑定可编辑属性，供 main.js 的属性编辑器读取
        ball.editableProps = {
            friction: { label: "摩擦力", min: 0, max: 1, step: 0.01 },
            restitution: { label: "弹性", min: 0, max: 1.2, step: 0.01 },
            density: { label: "密度", min: 0.001, max: 0.1, step: 0.001 }
        };

        return ball;
    }
};