// js/main.js
import { physics } from './engine.js';

// --- 1. 导入与播放逻辑 ---
window.importComponent = async () => {
    let fileName = prompt("请输入模块文件名 (如: Ball, Box):");
    if (!fileName) return;
    fileName = fileName.replace(/\.js$/, ''); 
    
    try {
        const module = await import(`./modules/${fileName}.js`);
        if (!module.data) throw new Error("无效格式");
        createSpawnButton(module.data.name, module.data, fileName);
    } catch (err) {
        alert("加载失败");
        console.error(err);
    }
};

window.togglePlay = () => {
    if (!physics.engine) return;
    const isPaused = physics.engine.gravity.y === 0;
    
    // 如果是从暂停切换到开始，施加预设推力
    if (isPaused) {
        physics.pendingForces.forEach((force, bodyId) => {
            const body = physics.engine.world.bodies.find(b => b.id === bodyId);
            if (body) physics.applyImpulse(body, force);
        });
        physics.pendingForces.clear(); // 施加后清空箭头
    }

    physics.setGravity(isPaused ? 1 : 0);
    const btn = document.getElementById('playBtn');
    if (btn) btn.innerText = isPaused ? "停止演示" : "开始演示";
};

// --- 2. 界面与交互 ---
const menu = document.getElementById('component-menu');
const inspector = document.getElementById('inspector');
const propsList = document.getElementById('props-list');
const container = document.getElementById('canvas-container');

const physicsInstance = physics.init(container);
const mc = physicsInstance ? physicsInstance.mc : null;

function createSpawnButton(label, moduleData, id) {
    if (document.getElementById(`btn-${id}`)) return;
    const btn = document.createElement('button');
    btn.id = `btn-${id}`;
    btn.className = 'tool-btn';
    btn.style.marginTop = "5px";
    btn.innerText = (moduleData.type === "connection" ? "🔗 " : "📦 ") + label;
    btn.onclick = () => {
        const obj = moduleData.create(container.clientWidth / 2, 100);
        physics.add(obj);
    };
    if (menu) menu.appendChild(btn);
}

// --- 3. 鼠标与属性编辑 ---
if (mc) {
    window.oncontextmenu = (e) => e.preventDefault();
    Matter.Events.on(mc, 'mousedown', (event) => {
        const body = event.source.body;
        if (body && event.mouse.button !== 2) {
            showInspector(body);
        } else if (!body) {
            if (inspector) inspector.style.display = 'none';
        }
    });
}

function showInspector(target) {
    if (!propsList || !inspector) return;
    propsList.innerHTML = '';
    inspector.style.display = 'block';

    const props = target.editableProps || {};
    
    // 渲染常规属性滑块
    Object.keys(props).forEach(key => {
        const config = props[key];
        const item = document.createElement('div');
        item.className = 'prop-item';
        
        let currentVal = (key === 'width') ? (target.prev_width || 80) : 
                         (key === 'height') ? (target.prev_height || 80) : 
                         (key === 'radius') ? (target.prev_radius || 40) : target[key];

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between">
                <label>${config.label}</label>
                <span id="val-${key}">${currentVal}</span>
            </div>
            <input type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${currentVal}" style="width:100%">
        `;

        item.querySelector('input').oninput = (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById(`val-${key}`).innerText = val;
            if (config.isScale) {
                const prevKey = `prev_${key}`;
                const prevVal = target[prevKey] || 80;
                const factor = val / prevVal;
                if (key === 'width') Matter.Body.scale(target, factor, 1);
                else Matter.Body.scale(target, 1, factor);
                target[prevKey] = val;
            } else if (config.isRadiusScale) {
                const prevVal = target.prev_radius || 40;
                const factor = val / prevVal;
                Matter.Body.scale(target, factor, factor);
                target.prev_radius = val;
            } else {
                target[key] = val;
            }
        };
        propsList.appendChild(item);
    });

    // --- 新增：推力设置按钮 ---
    const forceSection = document.createElement('div');
    forceSection.style.marginTop = "15px";
    forceSection.innerHTML = `<button class="tool-btn" style="width:100%; background:#e67e22">🎯 设置启动推力</button>`;
    forceSection.querySelector('button').onclick = () => {
        const input = prompt("输入推力 (格式: x,y 建议 -50 到 50):", "20,-10");
        if (input) {
            const [fx, fy] = input.split(',').map(Number);
            if (!isNaN(fx) && !isNaN(fy)) {
                physics.pendingForces.set(target.id, { x: fx, y: fy });
            }
        }
    };
    propsList.appendChild(forceSection);
}

// --- 4. 自动加载 ---
['Box', 'Ball'].forEach(name => {
    import(`./modules/${name}.js`).then(m => createSpawnButton(m.data.name, m.data, name)).catch(() => {});
});