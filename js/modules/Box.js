// js/modules/Box.js
export const data = {
    name: "实验木块",
    type: "construct",
    create: (x, y) => {
        const box = Matter.Bodies.rectangle(x, y, 80, 80, {
            render: { fillStyle: '#e67e22' }
        });
        box.prev_width = 80;
        box.prev_height = 80;
        box.editableProps = {
            width: { label: "宽度", min: 10, max: 300, step: 2, isScale: true },
            height: { label: "高度", min: 10, max: 300, step: 2, isScale: true }
        };
        return box;
    }
};