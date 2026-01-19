// js/main.js
import { physics } from './engine.js';

// --- 挂载保存功能 ---
window.saveScene = () => {
    console.log("正在执行保存...");
    const bodies = Matter.Composite.allBodies(physics.engine.world)
        .filter(b => !b.isStatic || b.label !== 'wall')
        .map(b => ({
            module: b.sourceModule,
            x: b.position.x, y: b.position.y,
            vx: b.velocity.x, vy: b.velocity.y,
            mass: b.mass, angle: b.angle, isStatic: b.isStatic,
            pw: b.prev_width, ph: b.prev_height
        }));
    localStorage.setItem('lab_preset', JSON.stringify(bodies));
    alert("场景已保存到本地");
};

// --- 挂载读取功能 ---
window.loadScene = async () => {
    console.log("正在读取...");
    const data = localStorage.getItem('lab_preset');
    if (!data) return alert("没有找到存档");
    const items = JSON.parse(data);
    for (const item of items) {
        try {
            const mod = await import(`./modules/${item.module}.js`);
            const obj = mod.data.create(item.x, item.y);
            obj.sourceModule = item.module;
            if (item.pw) {
                const ratioW = item.pw / obj.prev_width;
                const ratioH = item.ph / obj.prev_height;
                Matter.Body.scale(obj, ratioW, ratioH);
                obj.prev_width = item.pw;
                obj.prev_height = item.ph;
            }
            Matter.Body.setStatic(obj, item.isStatic);
            Matter.Body.setVelocity(obj, { x: item.vx, y: item.vy });
            physics.add(obj);
        } catch (e) { console.error(e); }
    }
};

window.importComponent = async () => {
    let fileName = prompt("输入组件名 (如 Box):");
    if (!fileName) return;
    try {
        const module = await import(`./modules/${fileName}.js`);
        addToolButton(module.data, fileName);
    } catch (e) { alert("加载组件失败"); }
};

function addToolButton(data, fileName) {
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.innerText = (data.type === 'construct' ? '🏗️ ' : '🔧 ') + data.name;
    btn.onclick = () => {
        const obj = data.create(window.innerWidth / 2, 200);
        obj.sourceModule = fileName;
        if (data.type === 'construct') {
            obj.editableProps = {
                customName: { label: "📛 物体名称", type: "text" },
                ...obj.editableProps,
                mass: { label: "⚖️ 质量(kg)", min: 0.1, max: 100, step: 0.1 }
            };
        }
        physics.add(obj);
    };
    document.getElementById('component-menu').appendChild(btn);
}

// 右键固定
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const bodies = Matter.Composite.allBodies(physics.engine.world);
    const clickedBody = Matter.Query.point(bodies, { x: e.clientX, y: e.clientY })[0];
    if (clickedBody && !clickedBody.label?.includes('wall')) {
        Matter.Body.setStatic(clickedBody, !clickedBody.isStatic);
        clickedBody.render.opacity = clickedBody.isStatic ? 0.6 : 1.0;
    }
});

function showInspector(target) {
    const propsList = document.getElementById('props-list');
    propsList.innerHTML = '';
    document.getElementById('inspector').style.display = 'block';

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

        if (config.type === "text") {
            item.innerHTML = `<label>${config.label}</label>
                              <input type="text" value="${target[key] || ''}" style="width:100%; background:#34495e; color:white;">`;
            item.querySelector('input').onchange = (e) => { target[key] = e.target.value; };
        } else {
            item.innerHTML = `<div style="display:flex; justify-content:space-between"><label>${config.label}</label><span>${Number(val).toFixed(1)}</span></div>
                              <input type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${val}" style="width:100%">`;

            item.querySelector('input').oninput = (e) => {
                const v = parseFloat(e.target.value);
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

const pi = physics.init(document.getElementById('canvas-container'));
Matter.Events.on(pi.mc, 'mousedown', (e) => { if (e.source.body) showInspector(e.source.body); });