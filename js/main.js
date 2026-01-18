// js/main.js
import { physics } from './engine.js';
import { Components } from './modules/registry.js';

const container = document.getElementById('canvas-container');
const { mc } = physics.init(container);

const menu = document.getElementById('component-menu');
const inspector = document.getElementById('inspector');
const propsList = document.getElementById('props-list');

// --- 状态管理 ---
let connectionMode = null; // 当前选择的连线工具逻辑
let firstBody = null;      // 记录连线时的第一个物体

/**
 * 核心功能：创建侧边栏按钮（适配生成类和连线类）
 */
function createSpawnButton(label, moduleData, id) {
    const btn = document.createElement('button');
    btn.id = `btn-${id}`;
    btn.className = 'tool-btn';
    btn.innerText = (moduleData.type === "connection" ? "🔗 " : "📦 ") + label;
    
    btn.onclick = () => {
        if (moduleData.type === "connection") {
            // 切换到连线模式
            connectionMode = moduleData;
            firstBody = null;
            alert(`已激活 [${label}] 模式：请依次点击画布上的两个物体进行连接`);
        } else {
            // 普通生成模式
            connectionMode = null; 
            const obj = moduleData.create(container.clientWidth / 2, 100);
            physics.add(obj);
        }
    };
    menu.appendChild(btn);
}

// 初始化现有零件
if (Components) {
    Object.keys(Components).forEach(name => {
        // 注意：为了统一，registry里的值现在建议也包装成 {name, create, type}
        const data = Components[name].create ? Components[name] : { name: name, create: Components[name] };
        createSpawnButton(name, data, name);
    });
}

/**
 * 暴露给 HTML 的导入函数
 */
window.importComponent = async () => {
    const fileName = prompt("请输入 js/modules/ 下的文件名 (例如: Rope):");
    if (!fileName) return;

    try {
        const module = await import(`./modules/${fileName}.js`);
        if (!module.data) throw new Error("缺少 export const data");

        createSpawnButton(module.data.name, module.data, fileName);
        console.log(`✅ 模块 ${fileName} 加载成功`);
    } catch (err) {
        console.error(err);
        alert("加载失败，请检查控制台报错（F12）");
    }
};

/**
 * 鼠标点击交互：处理属性编辑 & 连线逻辑
 */
Matter.Events.on(mc, 'mousedown', (event) => {
    const body = event.source.body;

    // 1. 连线逻辑优先
    if (connectionMode && body && !body.isStatic) {
        handleConnection(body);
        return;
    }

    // 2. 属性编辑器逻辑
    if (body && body.editableProps && !body.isStatic) {
        showInspector(body);
    } else {
        inspector.style.display = 'none';
    }
});

function handleConnection(body) {
    if (!firstBody) {
        firstBody = body;
        // 视觉高亮
        body.render.lineWidth = 4;
        body.render.strokeStyle = "#f1c40f";
    } else if (body !== firstBody) {
        // 执行连线
        const constraint = connectionMode.create(firstBody, body);
        // 给连线也挂载编辑属性
        constraint.editableProps = connectionMode.editableProps;
        physics.add(constraint);

        // 重置状态
        firstBody.render.lineWidth = 0;
        firstBody = null;
        connectionMode = null;
        alert("连接成功！");
    }
}

function showInspector(target) {
    propsList.innerHTML = ''; 
    inspector.style.display = 'block';

    Object.keys(target.editableProps).forEach(key => {
        const config = target.editableProps[key];
        const item = document.createElement('div');
        item.style.marginBottom = '12px';
        
        // 这里的 target 可能是 body 也可能是 constraint
        const currentVal = target[key] !== undefined ? target[key] : 0.1;

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between">
                <label style="font-size:12px; color:#bdc3c7">${config.label}</label>
                <span id="val-${key}" style="font-size:12px; color:#1abc9c">${Number(currentVal).toFixed(2)}</span>
            </div>
            <input type="range" style="width:100%" 
                min="${config.min}" max="${config.max}" step="${config.step}" value="${currentVal}">
        `;

        item.querySelector('input').oninput = (e) => {
            const val = parseFloat(e.target.value);
            // 兼容物体属性修改和约束属性修改
            if (target.type === 'constraint') {
                target[key] = val; 
            } else {
                Matter.Body.set(target, key, val);
            }
            document.getElementById(`val-${key}`).innerText = val.toFixed(2);
        };
        propsList.appendChild(item);
    });
}

window.togglePlay = () => {
    const isPlaying = physics.engine.gravity.y === 0;
    physics.setGravity(isPlaying ? 1 : 0);
    document.getElementById('playBtn').innerText = isPlaying ? "停止/编辑" : "开始演示";
};