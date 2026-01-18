// js/modules/Rope.js
const { Constraint, Composite, Query } = Matter;

export const data = {
    name: "绳索 (点击两点)",
    create: (x, y) => {
        // 线比较特殊，它不是一个 Bodies，而是一个约束。
        // 我们返回一个空对象，在 main.js 中特殊处理，或者
        // 我们可以设计一个“待连接”的状态。
        
        // 为了简化，我们让这个函数返回一个带有特殊标识的对象
        return {
            type: 'constraint_tool',
            label: '绳索',
            editableProps: {
                stiffness: { label: "刚度 (0-1)", min: 0.01, max: 1, step: 0.01 },
                length: { label: "长度", min: 10, max: 500, step: 10 }
            }
        };
    }
};