// js/modules/registry.js

/**
 * 在这里导入你所有基础的物理零件模块
 * 每个模块都应该导出一个名为 'data' 的对象，其中包含 create 函数
 */
import { data as BoxData } from './Box.js';
import { data as BallData } from './Ball.js';
// 以后如果你增加了新零件，比如 Belt.js，就在这里添加：
// import { data as BeltData } from './Belt.js';

/**
 * Components 对象：
 * 键 (Key)：侧边栏显示的名称
 * 值 (Value)：对应的创建函数
 */
export const Components = {
    "木块": BoxData.create,
    "小球": BallData.create,
    // "传送带": BeltData.create, // 取消注释即可启用
};