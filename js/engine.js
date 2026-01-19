// js/main.js
import { physics } from './engine.js';

// --- 全局挂载函数 ---
window.importComponent = async () => {
    let fileName = prompt("输入组件名 (如 Box):");
    if (!fileName) return;
    try {
        const module = await import(`./modules/${fileName}.js`);
        addSpawnButton(module.data, fileName);
    } catch (e) { alert("加载失败"); }
};

window.saveScene = () => {
    const bodies = Matter.Composite.allBodies(physics.engine.world)
        .filter(b => !b.isStatic && b.sourceModule)
        .map(b => ({
            module: b.sourceModule, x: b.position.x, y: b.position.y,
            mass: b.mass, angle: b.angle, name: b.customName,
            pw: b.prev_width, ph: b.prev_height, pr: b.prev_radius
        }));
    localStorage.setItem('lab_data', JSON.stringify(bodies));
    alert("场景已保存");
};

window.loadScene = async () => {
    const data = localStorage.getItem('lab_data');
    if (!data) return;
    const items = JSON.parse(data);
    for (const item of items) {
        const mod = await import(`./modules/${item.module}.js`);
        const obj = mod.data.create(item.x, item.y);
        obj.sourceModule = item.module;
        // 恢复缩放逻辑
        if (item.pw) { Matter.Body.scale(obj, item.pw / obj.prev_width, item.ph / obj.prev_height); obj.prev_width = item.pw; }
        physics.add(obj);
    }
};

function addSpawnButton(data, fileName) {
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.innerText = (data.type === 'construct' ? '🏗️ ' : '🔧 ') + data.name;
    btn.onclick = () => {
        const obj = data.create(400, 200);
        obj.sourceModule = fileName;
        // 如果是构造件，补充质量与物理标记
        if (data.type === 'construct') {
            obj.editableProps = {
                customName: { label: "📛 物体名称", type: "text" },
                ...obj.editableProps,
                mass: { label: "⚖️ 质量", min: 0.1, max: 100, step: 0.1 }
            };
        }
        physics.add(obj);
    };
    document.getElementById('component-menu').appendChild(btn);
}

// 属性编辑器修复：支持 type 判断，防止名称变进度条
function showInspector(target) {
    const list = document.getElementById('props-list');
    list.innerHTML = '';
    document.getElementById('inspector').style.display = 'block';

    Object.keys(target.editableProps || {}).forEach(key => {
        const config = target.editableProps[key];
        const item = document.createElement('div');
        item.className = 'prop-item';

        if (config.type === "text") {
            item.innerHTML = `<label>${config.label}</label><input type="text" value="${target[key] || ''}" style="width:100%">`;
            item.querySelector('input').onchange = (e) => { target[key] = e.target.value; };
        } else {
            let val = target[key] || 0;
            item.innerHTML = `<label>${config.label}: <span id="v-${key}">${val}</span></label>
                              <input type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${val}" style="width:100%">`;
            item.querySelector('input').oninput = (e) => {
                const v = parseFloat(e.target.value);
                document.getElementById(`v-${key}`).innerText = v;
                if (key === 'mass') Matter.Body.setMass(target, v);
                else target[key] = v;
            };
        }
        list.appendChild(item);
    });
}

const pi = physics.init(document.getElementById('canvas-container'));
Matter.Events.on(pi.mc, 'mousedown', (e) => { if (e.source.body) showInspector(e.source.body); });