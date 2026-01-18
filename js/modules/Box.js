// js/modules/Box.js

export const data = {
    name: "木块",
    // 确保 create 是 data 对象的一个属性
    create: (x, y) => {
        const { Bodies } = Matter; // 确保在函数内获取 Matter 引用

        const box = Bodies.rectangle(x, y, 80, 80, {
            friction: 0.1,
            restitution: 0.5,
            render: {
                fillStyle: '#e67e22',
                strokeStyle: '#d35400',
                lineWidth: 2
            }
        });

        // 核心属性设置
        box.customName = "木块 " + (Math.floor(Math.random() * 100));
        
        // 初始缩放基准
        box.prev_width = 80;
        box.prev_height = 80;

        // 属性编辑器配置
        box.editableProps = {
            customName: { label: "物体名称", type: "text" },
            width: { label: "宽度 (px)", min: 20, max: 500, step: 10, isScale: true },
            height: { label: "高度 (px)", min: 20, max: 500, step: 10, isScale: true },
            friction: { label: "摩擦力", min: 0, max: 1, step: 0.05 },
            restitution: { label: "弹性", min: 0, max: 1.2, step: 0.1 }
        };

        return box;
    }
};