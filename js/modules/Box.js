// js/modules/Box.js
export const data = {
    name: "木块",
    // 关键点：create 必须在 data 对象内
    create: (x, y) => {
        const { Bodies } = Matter; // 确保在调用时获取 Matter 引用

        const box = Bodies.rectangle(x, y, 80, 80, {
            friction: 0.1,
            restitution: 0.5,
            render: {
                fillStyle: '#e67e22',
                strokeStyle: '#d35400',
                lineWidth: 2
            }
        });

        // 命名与初始尺寸基准
        box.customName = "木块 " + (Math.floor(Math.random() * 100));
        box.prev_width = 80;
        box.prev_height = 80;

        // 属性编辑器配置
        box.editableProps = {
            customName: { label: "物体名称", type: "text" },
            width: { label: "宽度 (px)", min: 20, max: 500, step: 10, isScale: true },
            height: { label: "高度 (px)", min: 20, max: 500, step: 10, isScale: true },
            friction: { label: "摩擦力", min: 0, max: 1, step: 0.05 }
        };

        return box;
    }
};