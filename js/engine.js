// js/main.js
import { physics } from './engine.js';

// 将函数挂载到 window，确保 HTML 的 onclick 能找到它们
window.importComponent = async () => {
    let fileName = prompt("输入组件名 (如 Ball, Box):");
    if (!fileName) return;
    try {
        const module = await import(`./modules/${fileName.replace('.js','')}.js`);
        createSpawnButton(module.data.name, module.data, fileName);
    } catch (e) { 
        alert("模块加载失败，请检查文件名"); 
    }
};

window.togglePlay = () => {
    if (!physics.engine) return;
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

// 初始化引擎并获取 mc
const physicsInstance = physics.init(container);

function createSpawnButton(label, moduleData, id) {
    if (!menu || document.getElementById(`btn-${id}`)) return;
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.id = `btn-${id}`;
    btn.innerText = "📦 " + label;
    btn.onclick = () => {
        const obj = moduleData.create(container.clientWidth / 2, 150);
        obj.isGhost = false;
        obj.startThrust = 0;
        obj.thrustAngle = 270;
        obj.constantAccel = 0;
        obj.accelAngle = 0;
        obj.editableProps = {
            ...obj.editableProps,
            mass: { label: "⚖️ 质量 (kg)", min: 0.1, max: 100, step: 0.1 },
            isGhost: { label: "👻 幽灵模式", type: "toggle" },
            startThrust: { label: "🚀 启动推力(N)", min: 0, max: 200, step: 1 },
            thrustAngle: { label: "🚀 推力方向(°)", min: 0, max: 360, step: 5 },
            constantAccel: { label: "🌀 持续加速度", min: 0, max: 50, step: 0.5 },
            accelAngle: { label: "🌀 加速方向(°)", min: 0, max: 360, step: 5 }
        };
        physics.add(obj);
    };
    menu.appendChild(btn);
}

function showInspector(target) {
    if (!propsList || !inspector) return;
    propsList.innerHTML = '';
    inspector.style.display = 'block';
    
    Object.keys(target.editableProps || {}).forEach(key => {
        const config = target.editableProps[key];
        const item = document.createElement('div');
        item.className = 'prop-item';
        
        if (config.type === "toggle") {
            item.innerHTML = `
                <label style="display:flex; justify-content:space-between; cursor:pointer">
                    ${config.label} <input type="checkbox" ${target[key] ? 'checked' : ''}>
                </label>`;
            item.querySelector('input').onchange = (e) => {
                target[key] = e.target.checked;
                target.render.opacity = target[key] ? 0.4 : 1;
                Matter.Body.setStatic(target, target[key]); 
            };
        } else {
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

// 确保鼠标约束正确绑定
if (physicsInstance && physicsInstance.mc) {
    Matter.Events.on(physicsInstance.mc, 'mousedown', (e) => {
        if (e.source.body) showInspector(e.source.body);
        else inspector.style.display = 'none';
    });
}

// 自动加载默认组件
['Box', 'Ball'].forEach(n => {
    import(`./modules/${n}.js`)
        .then(m => createSpawnButton(m.data.name, m.data, n))
        .catch(() => console.log(n + " 待手动加载"));
});