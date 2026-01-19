// js/main.js
import { physics } from './engine.js';

// --- 1. 模块导入与分类检测 ---
window.importComponent = async () => {
    let fileName = prompt("输入组件名 (如 Box, Ball):");
    if (!fileName) return;
    try {
        const module = await import(`./modules/${fileName.replace('.js', '')}.js`);
        const { name, type, create } = module.data;

        const btn = document.createElement('button');
        btn.className = 'tool-btn';
        btn.innerText = (type === 'construct' ? '🏗️ ' : '🔧 ') + name;

        btn.onclick = () => {
            const obj = create(window.innerWidth / 2, 200);
            obj.sourceModule = fileName; // 标记来源用于保存预设

            if (type === 'construct') {
                obj.editableProps = {
                    customName: { label: "📛 物体名称", type: "text" }, // 修复名称文本框
                    ...obj.editableProps,
                    mass: { label: "⚖️ 质量(kg)", min: 0.1, max: 100, step: 0.1 }
                };
            }
            physics.add(obj);
        };
        document.getElementById('component-menu').appendChild(btn);
    } catch (e) { alert("导入失败"); }
};

// --- 2. 右键固定功能 ---
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const bodies = Matter.Composite.allBodies(physics.engine.world);
    const clickedBody = Matter.Query.point(bodies, { x: e.clientX, y: e.clientY })[0];

    if (clickedBody && !clickedBody.label?.includes('wall')) {
        const newState = !clickedBody.isStatic;
        Matter.Body.setStatic(clickedBody, newState);
        clickedBody.render.opacity = newState ? 0.6 : 1.0;
    }
});

// --- 3. 统一 UI 属性编辑器 (含质心坐标与初始速度) ---
function showInspector(target) {
    const propsList = document.getElementById('props-list');
    propsList.innerHTML = '';
    document.getElementById('inspector').style.display = 'block';

    // 定义基础物理属性
    const baseProps = {
        customName: { label: "📛 物体名称", type: "text" },
        positionX: { label: "📍 质心 X", min: 0, max: 2000, step: 1 },
        positionY: { label: "📍 质心 Y", min: 0, max: 1000, step: 1 },
        velocityX: { label: "🚀 初始速度 X", min: -30, max: 30, step: 1 },
        velocityY: { label: "🚀 初始速度 Y", min: -30, max: 30, step: 1 },
        mass: { label: "⚖️ 质量(kg)", min: 0.1, max: 100, step: 0.1 }
    };

    const allProps = { ...baseProps, ...(target.editableProps || {}) };

    Object.keys(allProps).forEach(key => {
        const config = allProps[key];
        const item = document.createElement('div');
        item.className = 'prop-item';

        let val = target[key];
        if (key === 'positionX') val = target.position.x;
        if (key === 'positionY') val = target.position.y;
        if (key === 'velocityX') val = target.velocity.x;
        if (key === 'velocityY') val = target.velocity.y;
        if (config.isScale) val = (key === 'width' ? target.prev_width : target.prev_height);

        if (config.type === "text") {
            item.innerHTML = `<label style="color:#ecf0f1">${config.label}</label>
                              <input type="text" value="${target[key] || ''}" style="width:100%; background:#34495e; color:white; border:1px solid #7f8c8d; padding:4px;">`;
            item.querySelector('input').onchange = (e) => { target[key] = e.target.value; };
        } else {
            item.innerHTML = `<div style="display:flex; justify-content:space-between"><label>${config.label}</label><span id="v-${key}">${Number(val).toFixed(1)}</span></div>
                              <input type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${val}" style="width:100%">`;

            item.querySelector('input').oninput = (e) => {
                const v = parseFloat(e.target.value);
                document.getElementById(`v-${key}`).innerText = v.toFixed(1);

                if (key === 'positionX') Matter.Body.setPosition(target, { x: v, y: target.position.y });
                else if (key === 'positionY') Matter.Body.setPosition(target, { x: target.position.x, y: v });
                else if (key === 'velocityX' || key === 'velocityY') {
                    Matter.Body.setVelocity(target, { x: key === 'velocityX' ? v : target.velocity.x, y: key === 'velocityY' ? v : target.velocity.y });
                } else if (key === 'mass') Matter.Body.setMass(target, v);
                else if (config.isScale) {
                    const ratio = v / (key === 'width' ? target.prev_width : target.prev_height);
                    if (key === 'width') { Matter.Body.scale(target, ratio, 1); target.prev_width = v; }
                    else { Matter.Body.scale(target, 1, ratio); target.prev_height = v; }
                }
            };
        }
        propsList.appendChild(item);
    });
}

// --- 4. 场景保存与加载 ---
window.saveScene = () => {
    const bodies = Matter.Composite.allBodies(physics.engine.world)
        .filter(b => !b.isStatic || b.label !== 'wall')
        .map(b => ({
            module: b.sourceModule,
            x: b.position.x, y: b.position.y,
            vx: b.velocity.x, vy: b.velocity.y,
            mass: b.mass, angle: b.angle, isStatic: b.isStatic,
            pw: b.prev_width, ph: b.prev_height, pr: b.prev_radius
        }));
    localStorage.setItem('lab_preset', JSON.stringify(bodies));
    alert("场景已保存");
};

window.loadScene = async () => {
    const data = localStorage.getItem('lab_preset');
    if (!data) return;
    const items = JSON.parse(data);
    for (const item of items) {
        const mod = await import(`./modules/${item.module}.js`);
        const obj = mod.data.create(item.x, item.y);
        obj.sourceModule = item.module;
        if (item.pw) { Matter.Body.scale(obj, item.pw / obj.prev_width, item.ph / obj.prev_height); obj.prev_width = item.pw; obj.prev_height = item.ph; }
        Matter.Body.setStatic(obj, item.isStatic);
        Matter.Body.setVelocity(obj, { x: item.vx, y: item.vy });
        physics.add(obj);
    }
};

// 初始化
const pi = physics.init(document.getElementById('canvas-container'));
Matter.Events.on(pi.mc, 'mousedown', (e) => { if (e.source.body) showInspector(e.source.body); });