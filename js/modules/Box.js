// js/modules/Box.js
const { Bodies } = Matter;

export const data = {
    name: "木块",
    create: (x, y) => {
        const b = Bodies.rectangle(x, y, 60, 60, {
            friction: 0.5,
            restitution: 0.2,
            mass: 2,
            render: { fillStyle: '#e67e22', strokeStyle: '#d35400', lineWidth: 2 }
        });

        ball.customName = "实验球 A";

        // 绑定可编辑属性，供 main.js 的 inspector 读取
        b.editableProps = {
            customName: { label: "物体名称", type: "text" },
            friction: { label: "摩擦系数", min: 0, max: 1, step: 0.05 },
            restitution: { label: "弹性系数", min: 0, max: 1.2, step: 0.05 },
            mass: { label: "质量 (kg)", min: 0.5, max: 50, step: 0.5 }
        };

        return b;
    }
};