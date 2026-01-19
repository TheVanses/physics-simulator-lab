// js/main.js
import { physics } from './engine.js';

// --- 1. 模块导入与智能分类 ---
window.importComponent = async () => {
    let fileName = prompt("输入组件名 (如 Box, Ball):");
    if (!fileName) return;
    try {
        const module = await import(`./modules/${fileName}.js`);
        const { name, type, create } = module.data;
        
        const btn = document.createElement('button');
        btn.className = 'tool-btn';
        // 区分构造件(🏗️)和功能件(🔧)
        btn.innerText = (type === 'construct' ? '🏗️ ' : '🔧 ') + name;
        
        btn.onclick = () => {
            const obj = create(window.innerWidth / 2, 200);
            obj.sourceModule = fileName; // 核心：记录来源用于保存预设
            obj.objectType = type;

            // 如果是构造件，自动注入物理属性
            if (type === 'construct') {
                obj.editableProps = {
                    customName: { label: "📛 物体名称", type: "text" },
                    ...obj.editableProps,
                    mass: { label: "⚖️ 质量(kg)", min: 0.1, max: 100, step: 0.1 },
                    friction: { label: "🍂 摩擦力", min: 0, max: 1, step: 0.05 },
                    isGhost: { label: "👻 幽灵模式", type: "toggle" }
                };
            }
            physics.add(obj);
        };
        document.getElementById('component-menu').appendChild(btn);
    } catch (e) { 
        alert("导入失败，请检查文件名"); 
        console.error(e);
    }
};

// --- 2. 属性编辑器 (修复名称变进度条问题) ---
function showInspector(target) {
    const propsList = document.getElementById('props-list');
    propsList.innerHTML = '';
    document.getElementById('inspector').style.display = 'block';

    Object.keys(target.editableProps || {}).forEach(key => {
        const config = target.editableProps[key];
        const item = document.createElement('div');
        item.className = 'prop-item';
        
        // --- 核心修复：根据 type 分类渲染 ---
        if (config.type === "text") {
            // 文本框：处理名称
            const val = target[key] || "";
            item.innerHTML = `<label>${config.label}</label>
                              <input type="text" value="${val}" style="width:90%; padding:5px; margin-top:5px;">`;
            item.querySelector('input').onchange = (e) => { target[key] = e.target.value; };
        } 
        else if (config.type === "toggle") {
            // 勾选框：处理幽灵模式
            const checked = target.isStatic ? 'checked' : '';
            item.innerHTML = `<label style="display:flex; justify-content:space-between; cursor:pointer">
                                ${config.label} <input type="checkbox" ${checked}>
                              </label>`;
            item.querySelector('input').onchange = (e) => {
                target.render.opacity = e.target.checked ? 0.5 : 1;
                Matter.Body.setStatic(target, e.target.checked);
            };
        } 
        else {
            // 滑动条：处理数值、缩放、质量
            let val = target[key];
            if (config.isScale) val = (key === 'width' ? target.prev_width : target.prev_height) || 80;
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
        }
        propsList.appendChild(item);
    });
}

// --- 3. 场景保存与加载 ---
window.savePreset = () => {
    const bodies = Matter.Composite.allBodies(physics.engine.world)
        .filter(b => !b.isStatic && b.sourceModule)
        .map(b => ({
            module: b.sourceModule,
            x: b.position.x, y: b.position.y,
            mass: b.mass, angle: b.angle,
            name: b.customName,
            pw: b.prev_width, ph: b.prev_height, pr: b.prev_radius
        }));
    localStorage.setItem('lab_preset', JSON.stringify(bodies));
    alert("预设保存成功！");
};

window.loadPreset = async () => {
    const data = localStorage.getItem('lab_preset');
    if (!data) return;
    const items = JSON.parse(data);
    for (const item of items) {
        try {
            const mod = await import(`./modules/${item.module}.js`);
            const obj = mod.data.create(item.x, item.y);
            obj.sourceModule = item.module;
            obj.customName = item.name;
            
            // 恢复物理形态
            if (item.pw) { 
                Matter.Body.scale(obj, item.pw/obj.prev_width, item.ph/obj.prev_height); 
                obj.prev_width = item.pw; obj.prev_height = item.ph; 
            }
            if (item.pr) { 
                Matter.Body.scale(obj, item.pr/obj.prev_radius, item.pr/obj.prev_radius); 
                obj.prev_radius = item.pr; 
            }
            Matter.Body.setAngle(obj, item.angle);
            Matter.Body.setMass(obj, item.mass);
            physics.add(obj);
        } catch(e) { console.error("读取组件失败", e); }
    }
};

// 启动引擎
const pi = physics.init(document.getElementById('canvas-container'));
Matter.Events.on(pi.mc, 'mousedown', (e) => {
    if (e.source.body) showInspector(e.source.body);
});