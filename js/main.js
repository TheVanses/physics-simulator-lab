// js/main.js
import { physics } from './engine.js';

// --- 模块导入与分类检测 ---
window.importComponent = async () => {
    let fileName = prompt("输入组件名 (如 Box, Ball):");
    if (!fileName) return;
    try {
        const module = await import(`./modules/${fileName}.js`);
        const { name, type, create } = module.data;
        
        const btn = document.createElement('button');
        btn.className = 'tool-btn';
        btn.innerText = (type === 'construct' ? '🏗️ ' : '🔧 ') + name;
        btn.onclick = () => {
            const obj = create(400, 200);
            // 自动检测并注入通用设置
            setupObject(obj, type, fileName);
            physics.add(obj);
        };
        document.getElementById('component-menu').appendChild(btn);
    } catch (e) { alert("模块加载失败"); }
};

function setupObject(obj, type, sourceModule) {
    obj.sourceModule = sourceModule; // 用于保存预设
    obj.objectType = type;

    // 默认属性注入
    if (type === 'construct') {
        if (!obj.editableProps.mass) obj.editableProps.mass = { label: "⚖️ 质量", min: 0.1, max: 100, step: 0.1 };
        if (!obj.editableProps.friction) obj.editableProps.friction = { label: "🍂 摩擦力", min: 0, max: 1, step: 0.05 };
    }
}

// --- 属性编辑器 (解决缩放不生效) ---
function showInspector(target) {
    const propsList = document.getElementById('props-list');
    propsList.innerHTML = '';
    document.getElementById('inspector').style.display = 'block';

    Object.keys(target.editableProps || {}).forEach(key => {
        const config = target.editableProps[key];
        const item = document.createElement('div');
        item.className = 'prop-item';
        
        let val = target[key];
        if (config.isScale) val = target.prev_width || 80;
        if (config.isRadiusScale) val = target.prev_radius || 40;

        item.innerHTML = `<label>${config.label}: <span id="v-${key}">${val}</span></label>
                          <input type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${val}" style="width:100%">`;

        item.querySelector('input').oninput = (e) => {
            const v = parseFloat(e.target.value);
            document.getElementById(`v-${key}`).innerText = v;

            if (config.isScale) {
                const ratio = v / (key === 'width' ? target.prev_width : target.prev_height);
                if (key === 'width') { Matter.Body.scale(target, ratio, 1); target.prev_width = v; }
                else { Matter.Body.scale(target, 1, ratio); target.prev_height = v; }
            } else if (config.isRadiusScale) {
                const ratio = v / target.prev_radius;
                Matter.Body.scale(target, ratio, ratio);
                target.prev_radius = v;
            } else if (key === 'mass') {
                Matter.Body.setMass(target, v);
            } else {
                target[key] = v;
            }
        };
        propsList.appendChild(item);
    });
}

// --- 保存与加载功能 ---
window.saveScene = () => {
    const bodies = Matter.Composite.allBodies(physics.engine.world)
        .filter(b => !b.isStatic && b.label !== 'wall')
        .map(b => ({
            module: b.sourceModule,
            x: b.position.x, y: b.position.y,
            mass: b.mass,
            angle: b.angle,
            prev_width: b.prev_width, prev_height: b.prev_height, prev_radius: b.prev_radius
        }));
    const data = JSON.stringify(bodies);
    localStorage.setItem('physics_preset', data);
    alert("预设已保存到本地存储");
};

window.loadScene = async () => {
    const data = localStorage.getItem('physics_preset');
    if (!data) return;
    const items = JSON.parse(data);
    for (const item of items) {
        const module = await import(`./modules/${item.module}.js`);
        const obj = module.data.create(item.x, item.y);
        setupObject(obj, module.data.type, item.module);
        
        // 恢复缩放
        if (item.prev_width) {
            Matter.Body.scale(obj, item.prev_width/obj.prev_width, item.prev_height/obj.prev_height);
            obj.prev_width = item.prev_width; obj.prev_height = item.prev_height;
        }
        if (item.prev_radius) {
            Matter.Body.scale(obj, item.prev_radius/obj.prev_radius, item.prev_radius/obj.prev_radius);
            obj.prev_radius = item.prev_radius;
        }
        Matter.Body.setAngle(obj, item.angle);
        physics.add(obj);
    }
};

// 初始化
const physicsInstance = physics.init(document.getElementById('canvas-container'));
Matter.Events.on(physicsInstance.mc, 'mousedown', (e) => {
    if (e.source.body) showInspector(e.source.body);
});