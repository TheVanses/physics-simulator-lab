// js/modules/Box.js
const { Bodies } = Matter;

export const data = {
    name: "木块",
    create: (x, y) => {
        // 创建初始尺寸为 80x80 的木块
        const box = Bodies.rectangle(x, y, 80, 80, {
            friction: 0.1,
            restitution: 0.5,
            render: {
                fillStyle: '#e67e22',
                strokeStyle: '#d35400',
                lineWidth: 2
            }
        });

        // 核心需求 3: 物体初始命名
        box.customName = "木块 " + (Math.floor(Math.random() * 100));

        // 核心需求 4: 定义属性编辑器配置
        box.editableProps = {
            customName: { label: "物体名称", type: "text" },
            // isScale: true 配合 main.js 实现尺寸实时缩放
            width: { label: "宽度 (px)", min: 20, max: 500, step: 10, isScale: true },
            height: { label: "高度 (px)", min: 20, max: 500, step: 10, isScale: true },
            friction: { label: "摩擦力", min: 0, max: 1, step: 0.05 },
            restitution: { label: "弹性", min: 0, max: 1.2, step: 0.1 }
        };

        // 用于记录缩放比例的辅助变量 (配合 main.js 的缩放算法)
        box.prev_width = 80;
        box.prev_height = 80;

        return box;
    }
};