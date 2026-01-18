// js/modules/Box.js

export const data = {
    name: "木块",
    create: (x, y) => {
        // 确保 Matter 已经在全局可用（通过 index.html 引入的）
        const { Bodies } = Matter;

        const box = Bodies.rectangle(x, y, 80, 80, {
            friction: 0.1,
            restitution: 0.5,
            render: {
                fillStyle: '#e67e22',
                strokeStyle: '#d35400',
                lineWidth: 2
            }
        });

        box.customName = "木块 " + (Math.floor(Math.random() * 100));

        box.editableProps = {
            customName: { label: "物体名称", type: "text" },
            width: { label: "宽度 (px)", min: 20, max: 500, step: 10, isScale: true },
            height: { label: "高度 (px)", min: 20, max: 500, step: 10, isScale: true },
            friction: { label: "摩擦力", min: 0, max: 1, step: 0.05 },
            restitution: { label: "弹性", min: 0, max: 1.2, step: 0.1 }
        };

        // 必须初始化这两个值，否则 main.js 缩放时会因为 undefined / prev 计算出 NaN
        box.prev_width = 80;
        box.prev_height = 80;

        return box;
    }
};