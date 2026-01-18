// js/main.js
import { physics } from './engine.js';

// --- 1. 全局状态与防御性挂载 ---
window.importComponent = async () => {
    let fileName = prompt("请输入模块文件名 (如: Ball, Box, Rope):");
    if (!fileName) return;
    if (fileName.endsWith('.js')) fileName = fileName.slice(0, -3);
    
    try {
        const module = await import(`./modules/${fileName}.js`);
        if (!module.data) throw new Error("无效的模块格式");
        createSpawnButton(module.data.name, module.data, fileName);
    } catch (err) {
        alert("加载失败，请检查文件名大小写及路径");
        console.error(err);
    }
};

window.togglePlay = () => {
    const isPaused = physics.engine.gravity.y === 0;
    physics.setGravity(isPaused ? 1 : 0);
    document.getElementById('playBtn').innerText = isPaused ? "停止演示" : "开始演示";
};

// --- 2. 初始化吸附开关 ---
function initToolbarExtras() {
    const toolbar = document.querySelector('.toolbar') || document.body;
    const snapBtn = document.createElement('button');
    snapBtn.className = 'tool-btn';
    snapBtn.style.marginLeft = '10px';
    snapBtn.innerText = "网格吸附: 关";
    snapBtn.onclick = () => {
        physics.snapEnabled = !physics.snapEnabled;
        snapBtn.innerText = `网格吸附: ${physics.snapEnabled ? "开" : "关"}`;
        snapBtn.style.borderColor = physics.snapEnabled ? "#2ecc71" : "#ccc";
    };
    toolbar.appendChild(snapBtn);
}

// --- 3. 核心交互逻辑 ---
let connectionMode = null;
let firstBody = null;
const menu = document.getElementById('component-menu');
const inspector = document.getElementById('inspector');
const propsList = document.getElementById('props-list');
const container = document.getElementById('canvas-container');

// 初始化引擎
const { mc } = physics.init(container);
initToolbarExtras();

function createSpawnButton(label, moduleData, id) {
    if (document.getElementById(`btn-${id}`)) return;
    const btn = document.createElement('button');
    btn.id = `btn-${id}`;
    btn.className = 'tool-btn';
    btn.innerText = (moduleData.type === "connection" ? "🔗 " : "📦 ") + label;
    
    btn.onclick = () => {
        if (moduleData.type === "connection") {
            connectionMode = moduleData;
            firstBody = null;
            alert("进入连线模式：请右键依次点击两个物体");
        } else {
            const obj = moduleData.create(container.clientWidth / 2, 100);
            physics.add(obj);
        }
    };
    menu.appendChild(btn);
}

// --- 4. 鼠标事件处理 (左键编辑，右键连线/悬挂) ---
window.oncontextmenu = (e) => e.preventDefault(); // 禁用右键菜单

Matter.Events.on(mc, 'mousedown', (event) => {
    const body = event.source.body;
    const isRightClick = event.mouse.button === 2;

    // 右键逻辑：连线与自动悬挂
    if (isRightClick && body && !body.isStatic) {
        if (!firstBody) {
            firstBody = body;
            body.render.strokeStyle = "#f1c40f";
            body.render.lineWidth = 4;
            // 2秒内未点第二个物体则自动悬挂
            body.hangTimer = setTimeout(() => {
                if (firstBody === body) autoHang(body);
            }, 2000);
        } else if (firstBody !== body) {
            clearTimeout(firstBody.hangTimer);
            if (connectionMode) {
                physics.add(connectionMode.create(firstBody, body));
            } else {
                // 默认硬连接
                physics.add(Matter.Constraint.create({ bodyA: firstBody, bodyB: body, stiffness: 0.5 }));
            }
            resetSelection();
        }
        return;
    }

    // 左键逻辑：属性查看
    if (body && !isRightClick) {
        showInspector(body);
    } else if (!body) {
        inspector.style.display = 'none';
        resetSelection();
    }
});

function resetSelection() {
    if (firstBody) {
        firstBody.render.lineWidth = 0;
        firstBody = null;
    }
}

function autoHang(body) {
    const anchor = { x: body.position.x, y: body.position.y - 150 };
    const constraint = Matter.Constraint.create({
        bodyA: body,
        pointB: anchor,
        stiffness: 0.1,
        render: { strokeStyle: '#7f8c8d' }
    });
    physics.add(constraint);
    resetSelection();
}

// --- 5. 属性编辑器 (支持尺寸缩放) ---
function showInspector(target) {
    if (!propsList) return;
    propsList.innerHTML = '';
    inspector.style.display = 'block';

    const props = target.editableProps || {};
    Object.keys(props).forEach(key => {
        const config = props[key];
        const item = document.createElement('div');
        item.className = 'prop-item';
        
        const labelRow = `<div style="display:flex; justify-content:space-between">
                            <label>${config.label}</label>
                            <span id="val-${key}">${target[key] || ''}</span>
                          </div>`;

        if (config.type === "text") {
            item.innerHTML = `${labelRow}<input type="text" value="${target[key] || ''}" style="width:100%">`;
            item.querySelector('input').onchange = (e) => {
                target[key] = e.target.value;
                document.getElementById(`val-${key}`).innerText = e.target.value;
            };
        } else {
            const currentVal = key === 'width' ? 80 : (key === 'height' ? 80 : target[key]);
            item.innerHTML = `${labelRow}<input type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${currentVal}" style="width:100%">`;
            
            item.querySelector('input').oninput = (e) => {
                const val = parseFloat(e.target.value);
                document.getElementById(`val-${key}`).innerText = val;
                
                if (config.isScale) {
                    // 处理尺寸缩放：Matter.js 需先缩放回1，再缩放至目标比例
                    const prev = target[`prev_${key}`] || (key === 'width' ? 80 : 80);
                    const scaleFactor = val / prev;
                    if (key === 'width') Matter.Body.scale(target, scaleFactor, 1);
                    else Matter.Body.scale(target, 1, scaleFactor);
                    target[`prev_${key}`] = val;
                } else {
                    target[key] = val;
                }
            };
        }
        propsList.appendChild(item);
    });
}

// 加载初始零件
import('./modules/registry.js').then(m => {
    Object.keys(m.Components).forEach(name => {
        const comp = m.Components[name];
        createSpawnButton(name, comp.data || { name }, name);
    });
}).catch(() => console.log("等待手动导入组件"));