// js/main.js
import { physics } from './engine.js';

// --- 必须挂载到 window，否则 HTML 无法访问 ---
window.importComponent = async () => {
    let fileName = prompt("请输入模块文件名 (如: Ball, Box):");
    if (!fileName) return;
    try {
        const module = await import(`./modules/${fileName.replace('.js','')}.js`);
        createSpawnButton(module.data.name, module.data, fileName);
    } catch (err) { alert("加载失败"); }
};

window.togglePlay = () => {
    if (!physics.engine) return;
    const isPaused = physics.engine.gravity.y === 0;
    
    if (isPaused) {
        // 施加预设力
        physics.pendingForces.forEach((force, bodyId) => {
            const body = physics.engine.world.bodies.find(b => b.id === bodyId);
            if (body) physics.applyImpulse(body, force);
        });
        physics.pendingForces.clear();
    }

    physics.setGravity(isPaused ? 1 : 0);
    const btn = document.getElementById('playBtn');
    if (btn) btn.innerText = isPaused ? "停止演示" : "开始演示";
};

// --- 初始化界面 ---
const container = document.getElementById('canvas-container');
const physicsInstance = physics.init(container);
const menu = document.getElementById('component-menu');
const inspector = document.getElementById('inspector');
const propsList = document.getElementById('props-list');

function createSpawnButton(label, moduleData, id) {
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.innerText = "📦 " + label;
    btn.onclick = () => {
        const obj = moduleData.create(container.clientWidth / 2, 150);
        // 默认增加受力属性
        obj.constantAccel = 0;
        obj.accelAngle = 0;
        obj.editableProps = {
            ...obj.editableProps,
            mass: { label: "⚖️ 质量(kg)", min: 0.1, max: 100, step: 0.1 },
            ghost: { label: "👻 幽灵模式", type: "toggle" },
            thrust: { label: "🎯 启动推力设置", type: "action" },
            constantAccel: { label: "🌀 持续加速度", min: 0, max: 50, step: 0.5 },
            accelAngle: { label: "🌀 加速角度", min: 0, max: 360, step: 5 }
        };
        physics.add(obj);
    };
    menu.appendChild(btn);
}

function showInspector(target) {
    propsList.innerHTML = '';
    inspector.style.display = 'block';
    
    Object.keys(target.editableProps || {}).forEach(key => {
        const config = target.editableProps[key];
        const item = document.createElement('div');
        item.className = 'prop-item';

        if (config.type === "action") {
            item.innerHTML = `<button class="tool-btn" style="width:100%">${config.label}</button>`;
            item.onclick = () => {
                const input = prompt("请输入力(x,y):", "20,-20");
                if (input) {
                    const [fx, fy] = input.split(',').map(Number);
                    physics.pendingForces.set(target.id, { x: fx, y: fy });
                }
            };
        } else if (config.type === "toggle") {
            item.innerHTML = `<label>${config.label} <input type="checkbox" ${target.isStatic ? 'checked' : ''}></label>`;
            item.querySelector('input').onchange = (e) => {
                target.render.opacity = e.target.checked ? 0.5 : 1;
                Matter.Body.setStatic(target, e.target.checked);
            };
        } else {
            const val = target[key] || (key==='radius'?40:80);
            item.innerHTML = `<label>${config.label}</label> <input type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${val}" style="width:100%">`;
            item.querySelector('input').oninput = (e) => {
                const v = parseFloat(e.target.value);
                if (key === 'mass') Matter.Body.setMass(target, v);
                else target[key] = v;
            };
        }
        propsList.appendChild(item);
    });
}

// 绑定点击查看属性
if (physicsInstance.mc) {
    Matter.Events.on(physicsInstance.mc, 'mousedown', (e) => {
        if (e.source.body) showInspector(e.source.body);
    });
}

// 自动加载 Box 和 Ball
['Box', 'Ball'].forEach(n => import(`./modules/${n}.js`).then(m => createSpawnButton(m.data.name, m.data, n)).catch(()=>{}));