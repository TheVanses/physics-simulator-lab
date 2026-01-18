// js/main.js
import { physics } from './engine.js';

window.importComponent = async () => {
    let fileName = prompt("输入组件名:");
    if (!fileName) return;
    try {
        const module = await import(`./modules/${fileName.replace('.js','')}.js`);
        createSpawnButton(module.data.name, module.data, fileName);
    } catch (e) { alert("加载失败"); }
};

window.togglePlay = () => {
    const isPaused = physics.engine.gravity.y === 0;
    if (isPaused) {
        Matter.Composite.allBodies(physics.engine.world).forEach(body => physics.applyImpulse(body));
    }
    physics.setGravity(isPaused ? 1 : 0);
    document.getElementById('playBtn').innerText = isPaused ? "停止演示" : "开始演示";
};

const menu = document.getElementById('component-menu');
const inspector = document.getElementById('inspector');
const propsList = document.getElementById('props-list');
const container = document.getElementById('canvas-container');

physics.init(container);

function createSpawnButton(label, moduleData, id) {
    if (document.getElementById(`btn-${id}`)) return;
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.innerText = "📦 " + label;
    btn.onclick = () => {
        const obj = moduleData.create(container.clientWidth / 2, 150);
        
        // --- 核心：初始化统一物理属性 ---
        obj.isGhost = false;      // 是否为无质量物体
        obj.startThrust = 0;      // 启动推力 (N)
        obj.thrustAngle = 270;    // 默认向上
        obj.constantAccel = 0;    // 持续加速度 (m/s²)
        obj.accelAngle = 0;

        obj.editableProps = {
            ...obj.editableProps,
            mass: { label: "⚖️ 质量 (kg)", min: 0.1, max: 100, step: 0.1 },
            isGhost: { label: "👻 无质量模式", type: "toggle" },
            startThrust: { label: "🚀 启动推力 (N)", min: 0, max: 200, step: 1 },
            thrustAngle: { label: "🚀 推力方向 (°)", min: 0, max: 360, step: 5 },
            constantAccel: { label: "🌀 持续加速度", min: 0, max: 50, step: 0.5 },
            accelAngle: { label: "🌀 加速方向 (°)", min: 0, max: 360, step: 5 }
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
        
        if (config.type === "toggle") {
            // 开关类型渲染
            item.innerHTML = `
                <label style="display:flex; justify-content:space-between; cursor:pointer">
                    ${config.label} 
                    <input type="checkbox" ${target[key] ? 'checked' : ''}>
                </label>`;
            item.querySelector('input').onchange = (e) => {
                target[key] = e.target.checked;
                // 无质量模式逻辑：设为静态或传感器，且透明
                if (target[key]) {
                    target.render.opacity = 0.5;
                    Matter.Body.setStatic(target, true); // 让它“飘”在空中不被重力影响
                } else {
                    target.render.opacity = 1;
                    Matter.Body.setStatic(target, false);
                }
            };
        } else {
            // 滑块类型渲染
            let val = (key==='width'||key==='height'||key==='radius') ? (target[`prev_${key}`] || 40) : (target[key] || 0);
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between"><label>${config.label}</label><span>${val}</span></div>
                <input type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${val}" style="width:100%">`;
            
            item.querySelector('input').oninput = (e) => {
                const v = parseFloat(e.target.value);
                item.querySelector('span').innerText = v;
                if (config.isScale || config.isRadiusScale) {
                    const factor = v / (target[`prev_${key}`] || (key==='radius'?40:80));
                    if (key === 'width') Matter.Body.scale(target, factor, 1);
                    else if (key === 'height') Matter.Body.scale(target, 1, factor);
                    else Matter.Body.scale(target, factor, factor);
                    target[`prev_${key}`] = v;
                } else if (key === 'mass') {
                    Matter.Body.setMass(target, v);
                } else {
                    target[key] = v;
                }
            };
        }
        propsList.appendChild(item);
    });
}

const mc = physics.init(container).mc;
Matter.Events.on(mc, 'mousedown', (e) => {
    if (e.source.body) showInspector(e.source.body);
    else inspector.style.display = 'none';
});

['Box', 'Ball'].forEach(n => import(`./modules/${n}.js`).then(m => createSpawnButton(m.data.name, m.data, n)).catch(()=>{}));