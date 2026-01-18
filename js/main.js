// js/main.js
import { physics } from './engine.js';

// --- 1. 全局状态与防御性挂载 ---
window.importComponent = async () => {
    let fileName = prompt("请输入模块文件名 (如: Ball, Box):");
    if (!fileName) return;
    // 过滤后缀，防止出现 Box.js.js 的情况
    fileName = fileName.replace(/\.js$/, ''); 
    
    try {
        const module = await import(`./modules/${fileName}.js`);
        if (!module.data) throw new Error("无效的模块格式");
        createSpawnButton(module.data.name, module.data, fileName);
    } catch (err) {
        alert("加载失败，请检查文件名大小写及路径");
        console.error("加载错误详情:", err);
    }
};

window.togglePlay = () => {
    // 确保 physics.engine 已初始化
    if (!physics.engine) return;
    const isPaused = physics.engine.gravity.y === 0;
    physics.setGravity(isPaused ? 1 : 0);
    const playBtn = document.getElementById('playBtn');
    if (playBtn) playBtn.innerText = isPaused ? "停止演示" : "开始演示";
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

// 初始化引擎并获取鼠标约束
const physicsInstance = physics.init(container);
const mc = physicsInstance ? physicsInstance.mc : null;
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
    if (menu) menu.appendChild(btn);
}

// --- 4. 鼠标事件处理 ---
if (mc) {
    window.oncontextmenu = (e) => e.preventDefault(); 

    Matter.Events.on(mc, 'mousedown', (event) => {
        const body = event.source.body;
        const isRightClick = event.mouse.button === 2;

        if (isRightClick && body && !body.isStatic) {
            if (!firstBody) {
                firstBody = body;
                body.render.strokeStyle = "#f1c40f";
                body.render.lineWidth = 4;
                body.hangTimer = setTimeout(() => {
                    if (firstBody === body) autoHang(body);
                }, 2000);
            } else if (firstBody !== body) {
                clearTimeout(firstBody.hangTimer);
                if (connectionMode) {
                    physics.add(connectionMode.create(firstBody, body));
                } else {
                    physics.add(Matter.Constraint.create({ bodyA: firstBody, bodyB: body, stiffness: 0.5 }));
                }
                resetSelection();
            }
            return;
        }

        if (body && !isRightClick) {
            showInspector(body);
        } else if (!body) {
            if (inspector) inspector.style.display = 'none';
            resetSelection();
        }
    });
}

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

// --- 5. 属性编辑器 ---
function showInspector(target) {
    if (!propsList || !inspector) return;
    propsList.innerHTML = '';
    inspector.style.display = 'block';

    const props = target.editableProps || {};
    Object.keys(props).forEach(key => {
        const config = props[key];
        const item = document.createElement('div');
        item.className = 'prop-item';
        
        const labelRow = `<div style="display:flex; justify-content:space-between">
                            <label>${config.label}</label>
                            <span id="val-${key}">${target[key] !== undefined ? target[key] : ''}</span>
                          </div>`;

        if (config.type === "text") {
            item.innerHTML = `${labelRow}<input type="text" value="${target[key] || ''}" style="width:100%">`;
            item.querySelector('input').onchange = (e) => {
                target[key] = e.target.value;
                document.getElementById(`val-${key}`).innerText = e.target.value;
            };
        } else {
            // 初始值适配：如果没设置缩放基准，默认为 80
            const currentVal = (key === 'width') ? (target.prev_width || 80) : 
                               (key === 'height') ? (target.prev_height || 80) : target[key];
            
            item.innerHTML = `${labelRow}<input type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${currentVal}" style="width:100%">`;
            
            item.querySelector('input').oninput = (e) => {
                const val = parseFloat(e.target.value);
                const valDisplay = document.getElementById(`val-${key}`);
                if (valDisplay) valDisplay.innerText = val;
                
                if (config.isScale) {
                    const prevKey = `prev_${key}`;
                    const prevVal = target[prevKey] || 80;
                    const scaleFactor = val / prevVal;
                    
                    if (key === 'width') Matter.Body.scale(target, scaleFactor, 1);
                    else Matter.Body.scale(target, 1, scaleFactor);
                    
                    target[prevKey] = val;
                } else {
                    target[key] = val;
                }
            };
        }
        propsList.appendChild(item);
    });
}