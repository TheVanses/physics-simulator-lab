// js/main.js

// --- 1. 防御性挂载：最优先执行，确保按钮点击永远有效 ---
window.importComponent = async () => {
    console.log("📥 导入按钮被点击");
    const fileName = prompt("请输入模块文件名 (注意大小写，例如: Ball):");
    if (!fileName) return;
    
    // 调用内部加载逻辑
    await safeLoadModule(fileName);
};

window.togglePlay = () => {
    try {
        const isPlaying = physics.engine.gravity.y === 0;
        physics.setGravity(isPlaying ? 1 : 0);
        const btn = document.getElementById('playBtn');
        if (btn) btn.innerText = isPlaying ? "停止/编辑" : "开始演示";
    } catch (e) {
        console.error("引擎尚未初始化", e);
    }
};

// --- 2. 核心模块导入 (放在全局变量定义之后) ---
import { physics } from './engine.js';

// 状态管理
let connectionMode = null;
let firstBody = null;
const menu = document.getElementById('component-menu');
const inspector = document.getElementById('inspector');
const propsList = document.getElementById('props-list');
const container = document.getElementById('canvas-container');

// 初始化引擎并捕获鼠标约束
const { mc } = physics.init(container);

// --- 3. 动态加载逻辑 ---
async function safeLoadModule(fileName) {
    try {
        // 动态导入
        const module = await import(`./modules/${fileName}.js`);
        if (!module.data) throw new Error("模块缺少 export const data");

        // 防止重复按钮
        if (document.getElementById(`btn-${fileName}`)) return;

        createSpawnButton(module.data.name, module.data, fileName);
        console.log(`✅ 模块 ${fileName} 导入成功`);
    } catch (err) {
        console.error("❌ 加载失败详情:", err);
        alert(`加载失败！\n请检查: js/modules/${fileName}.js 是否存在且大小写正确。`);
    }
}

function createSpawnButton(label, moduleData, id) {
    const btn = document.createElement('button');
    btn.id = `btn-${id}`;
    btn.className = 'tool-btn';
    btn.innerText = (moduleData.type === "connection" ? "🔗 " : "📦 ") + label;
    
    btn.onclick = () => {
        if (moduleData.type === "connection") {
            connectionMode = moduleData;
            firstBody = null;
            alert(`[连线模式] 已激活: 请点击两个物体进行连接`);
        } else {
            connectionMode = null; 
            physics.add(moduleData.create(container.clientWidth / 2, 100));
        }
    };
    menu.appendChild(btn);
}

// 尝试加载初始零件库 (静默执行，失败不崩溃)
import('./modules/registry.js').then(m => {
    if (m.Components) {
        Object.keys(m.Components).forEach(name => {
            const data = m.Components[name].create ? m.Components[name] : { name: name, create: m.Components[name] };
            createSpawnButton(name, data, name);
        });
    }
}).catch(e => console.warn("⚠️ 初始零件库加载受阻，请检查 registry.js 路径"));

// --- 4. 交互处理 (连线与编辑) ---
Matter.Events.on(mc, 'mousedown', (event) => {
    const body = event.source.body;

    // 处理连线
    if (connectionMode && body && !body.isStatic) {
        if (!firstBody) {
            firstBody = body;
            body.render.lineWidth = 4;
            body.render.strokeStyle = "#f1c40f";
        } else if (body !== firstBody) {
            const constraint = connectionMode.create(firstBody, body);
            constraint.editableProps = connectionMode.editableProps;
            physics.add(constraint);
            firstBody.render.lineWidth = 0;
            firstBody = null;
            connectionMode = null;
            alert("✅ 连接成功");
        }
        return;
    }

    // 属性编辑
    if (body && body.editableProps && !body.isStatic) {
        showInspector(body);
    } else {
        if (inspector) inspector.style.display = 'none';
    }
});

Matter.Events.on(render, 'afterRender', () => {
    const context = render.context;
    const bodies = Matter.Composite.allBodies(physics.engine.world);

    bodies.forEach(body => {
        if (body.isStatic || body.label === 'Rectangle Body') return; // 跳过墙壁

        const { x, y } = body.position;
        
        // --- 绘制重力/合力箭头 ---
        drawVector(context, x, y, body.force.x, body.force.y + body.mass * physics.engine.gravity.y, "#e74c3c", "合力");
        
        // --- 绘制速度箭头 (可选) ---
        drawVector(context, x, y, body.velocity.x * 0.5, body.velocity.y * 0.5, "#3498db", "速度");

        // --- 绘制物体名称 ---
        context.fillStyle = "white";
        context.fillText(body.customName || "", x - 20, y - body.circleRadius - 10);
    });
});

// 通用箭头绘制函数
function drawVector(ctx, fromX, fromY, vecX, vecY, color, label) {
    const scale = 500; // 放大受力显示效果
    const toX = fromX + vecX * scale;
    const toY = fromY + vecY * scale;
    
    if (Math.abs(vecX) < 0.01 && Math.abs(vecY) < 0.01) return; // 力太小时不绘制

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // 绘制小箭头尖端
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function showInspector(target) {
    if (!propsList || !inspector) return;
    propsList.innerHTML = ''; 
    inspector.style.display = 'block';

    Object.keys(target.editableProps).forEach(key => {
        const config = target.editableProps[key];
        const val = target[key] || 0;
        const item = document.createElement('div');
        item.style.marginBottom = '12px';
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between">
                <label style="font-size:12px">${config.label}</label>
                <span id="val-${key}" style="font-size:12px; color:#1abc9c">${Number(val).toFixed(2)}</span>
            </div>
            <input type="range" style="width:100%" min="${config.min}" max="${config.max}" step="${config.step}" value="${val}">
        `;
        item.querySelector('input').oninput = (e) => {
            const v = parseFloat(e.target.value);
            if (target.type === 'constraint') { target[key] = v; } 
            else { Matter.Body.set(target, key, v); }
            document.getElementById(`val-${key}`).innerText = v.toFixed(2);
        };
        propsList.appendChild(item);
    });
}