// js/modules/Box.js
export const data = {
    name: "木块",
    create: (x, y) => {
        // 1. 在函数内部获取 Matter 引用，防止全局变量未加载
        const { Bodies } = Matter;

        // 2. 创建刚体
        const box = Bodies.rectangle(x, y, 80, 80, {
            friction: 0.1,
            restitution: 0.5,
            render: {
                fillStyle: '#e67e22',
                strokeStyle: '#d35400',
                lineWidth: 2
            }
        });

        // 3. 核心需求：设置初始属性和名称
        box.customName = "木块 " + (Math.floor(Math.random() * 100));
        
        // 4. 关键：为“改变大小”设置初始基准值
        box.prev_width = 80;
        box.prev_height = 80;

        // 5. 设置属性面板配置
        box.editableProps = {
            customName: { label: "物体名称", type: "text" },
            // isScale: true 标记让 main.js 知道这是缩放属性
            width: { label: "宽度 (px)", min: 20, max: 500, step: 10, isScale: true },
            height: { label: "高度 (px)", min: 20, max: 500, step: 10, isScale: true },
            friction: { label: "摩擦力", min: 0, max: 1, step: 0.05 }
        };

        return box;
    }
};