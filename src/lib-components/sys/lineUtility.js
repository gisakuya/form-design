import sortBy from "lodash/sortBy";

// 矩形是否有交集（贴边不算）
function IsRectIntersect(rect1, rect2){
    const r1l = rect1.l;
    const r1r = rect1.l + rect1.w;
    const r1t = rect1.t;
    const r1b = rect1.t + rect1.h;

    const r2l = rect2.l;
    const r2r = rect2.l + rect2.w;
    const r2t = rect2.t;
    const r2b = rect2.t + rect2.h;

    return !(r2l >= r1r || r2r <= r1l || r2b <= r1t || r2t >= r1b);
}

// 返回最小最大值
function FindMinMax(a,b){
    return a >= b ? { min:b, max:a } : { min:a, max:b };
}

// 判断直线是否跟矩形的边重叠
function IsLineEdge(pt1, pt2, rect){
    const l = rect.l;
    const r = rect.l + rect.w;
    const t = rect.t;
    const b = rect.t + rect.h;

    if(pt1.x == pt2.x){
        // 垂直线
        if(pt1.x == l || pt1.x == r){
            // 贴边
            let { min, max } = FindMinMax(pt1.y, pt2.y);
            return !(max <= t || min >= b);
        }
    }
    else if(pt1.y == pt2.y){
        // 水平线
        if(pt1.y == t || pt1.y == b){
            // 贴边
            let { min, max } = FindMinMax(pt1.x, pt2.x);
            return !(max <= l || min >= r);
        }
    }

    return false;
}

// 返回矩形的9个点
function Get9Points(rect) {
    /* 
        1---2---3
        |   |   |
        4---5---6
        |   |   |
        7---8---9
    */
    const { l, t, w, h } = rect;
    const r = l + w;
    const b = t + h;
    const hc = l + w/2;
    const vc = t + h/2;
    const rn = rect.name ? rect.name + "-" : "";

    let x1 = { x: l, y: t, name: rn + "x1" };
    let x2 = { x: hc, y: t, name: rn + "x2" };
    let x3 = { x: r, y: t, name: rn + "x3" };
    let x4 = { x: l, y: vc, name: rn + "x4" };
    let x5 = { x: hc, y: vc, name: rn + "x5" };
    let x6 = { x: r, y: vc, name: rn + "x6" };
    let x7 = { x: l, y: b, name: rn + "x7" };
    let x8 = { x: hc, y: b, name: rn + "x8" };
    let x9 = { x: r, y: b, name: rn + "x9" };

    if(h == 0 && w > 0){
        return [ x1, x2, x3 ];
    }

    if(h > 0 && w == 0){
        return [ x1, x4, x7 ];
    }

    if(h == 0 && w == 0){
        return [ x1 ];
    }

    // h > 0 && w > 0
    return [ x1, x2, x3, x4, x5, x6, x7, x8, x9 ];
}

// 返回矩形的4个点
function Get4Points(rect) {
    /* 
        1------2
        |      |
        |      |
        3------4
    */
    const { l, t, w, h } = rect;
    const r = l + w;
    const b = t + h;
    const rn = rect.name ? rect.name + "-" : "";

    let x1 = { x: l, y: t, name: rn+"x1" };
    let x2 = { x: r, y: t, name: rn+"x2" };
    let x3 = { x: l, y: b, name: rn+"x3" };
    let x4 = { x: r, y: b, name: rn+"x4" };

    if(h == 0 && w > 0){
        return [ x1, x2 ];
    }

    if(h > 0 && w == 0){
        return [ x1, x3 ];
    }

    if(h == 0 && w == 0){
        return [ x1 ];
    }

    return [ x1, x2, x3, x4 ];
}

// 根据2个点，构建一个矩形
function GetRect(pt1, pt2, name){
    let l = 0, t = 0, w = 0, h = 0;
    if(pt1.x <= pt2.x){
        l = pt1.x;
        w = pt2.x - pt1.x;
    }
    else{
        l = pt2.x;
        w = pt1.x - pt2.x;
    }

    if(pt1.y <= pt2.y){
        t = pt1.y;
        h = pt2.y - pt1.y;
    }
    else{
        t = pt2.y;
        h = pt1.y - pt2.y;
    }

    return { l, t, w, h, name: name };
}

// 查找ptSrc到ptDest的第一条路径
function SearchOnePath(ptSrc, ptDest){
    if(ptSrc.x == ptDest.x && ptSrc.y == ptDest.y) return [];

    // 查找目标方向
    const xdir = ptSrc.x < ptDest.x ? 'r' : ptSrc.x > ptDest.x ? 'l' : '';
    const ydir = ptSrc.y < ptDest.y ? 'b' : ptSrc.y > ptDest.y ? 't' : '';
    const direction = xdir + ydir;

    let rtn = null;
    let queue = [];
    let loopPath = pt => {
        queue.push(pt);
        let found = pt == ptDest;
        if(found){
            rtn = queue.slice();
        }
        else{
            for(let key in pt){
                if(rtn) break;
                if("ltrb".includes(key)){
                    if(direction && !direction.includes(key)) continue;
                    let nextPt = pt[key];
                    loopPath(nextPt);
                    queue.pop();
                }
            }
        }
    };
    loopPath(ptSrc);
    queue.pop();
    return rtn;
}

// 查找ptSrc到ptDest的所有可能路径
function SearchPath(ptSrc, ptDest){
    if(ptSrc.x == ptDest.x && ptSrc.y == ptDest.y) return [];

    // 查找目标方向
    const xdir = ptSrc.x < ptDest.x ? 'r' : ptSrc.x > ptDest.x ? 'l' : '';
    const ydir = ptSrc.y < ptDest.y ? 'b' : ptSrc.y > ptDest.y ? 't' : '';
    const direction = xdir + ydir;

    let paths = [];
    let queue = [];
    let loopPath = pt => {
        queue.push(pt);
        let found = pt == ptDest;
        if(found){
            paths.push(queue.slice());
        }
        else{
            for(let key in pt){
                if("ltrb".includes(key)){
                    if(direction && !direction.includes(key)) continue;
                    let nextPt = pt[key];
                    loopPath(nextPt);
                    queue.pop();
                }
            }
        }
    };
    loopPath(ptSrc);
    queue.pop();
    return paths;
}

// 建立点与点之间的关系
function BuildPointRelation(points){
    let sortPoints = sortBy(points, ['x']);
    for (let i = 0; i < sortPoints.length; i++) {
        let pt = sortPoints[i];
        for (let j = i+1; j < sortPoints.length; j++) {
            let npt = sortPoints[j];
            if(npt.y == pt.y){
                // 同一水平线
                pt.r = npt;
                npt.l = pt;
                break;
            }
        }
    }

    sortPoints = sortBy(points, ['y']);
    for (let i = 0; i < sortPoints.length; i++) {
        let pt = sortPoints[i];
        for (let j = i+1; j < sortPoints.length; j++) {
            let npt = sortPoints[j];
            if(npt.x == pt.x){
                // 同一垂直线
                pt.b = npt;
                npt.t = pt;
                break;
            }
        }
    }
}

// 计算路径像素长度
function CalcPathPXLen(path){
    let sum = 0;
    for (let i = 0; i < path.length-1; i++) {
        const pt = path[i];
        const npt = path[i+1];
        sum += Math.abs(npt.x - pt.x) + Math.abs(npt.y-pt.y);
    }
    return sum;
}

// 获取路径与矩形边缘重叠的数量
function CalcPathEdgeCount(path, rect){
    let sum = 0;
    for (let i = 0; i < path.length-1; i++) {
        const pt = path[i];
        const npt = path[i+1];
        if(IsLineEdge(pt, npt, rect)){
            sum++;
        }
    }
    return sum;
}

// 获取线条（垂线+水平线）的数量
function CalcLineCount(path){
    let sum = 0;

    let preLine = null; // 0：水平，1：垂直
    for (let i = 0; i < path.length-1; i++) {
        const pt = path[i];
        const npt = path[i+1];

        let curLine = null;
        if(pt.y == npt.y){
            // 水平线
            curLine = 0;
        }
        else if(pt.x == npt.x){
            // 水平线
            curLine = 1;
        }
        else {
            throw "无法判断线条类型";
        }

        if(preLine != curLine){
            sum++;
            preLine = curLine;
        }
    }

    return sum;
}

// 从点集合中获取与目标点坐标相同的点
function GetPointFromPoints(points, target){
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if(point.x == target.x && point.y == target.y){
            return point;
        }
    }
    return null;
}

// 将点和点集合合并(坐标相同的不会合并)
function MergePointAndPoints(point, points){
    let arr = [ point ];
    for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        if(pt.x == point.x && pt.y == point.y) continue;
        arr.push(pt);
    }
    return arr;
}

// 将路径里多段直线合并
function MergePath(path){
    if(path.length < 3) return path;

    let mpath = [];
    let pt = null, npt = null, preLineType = null;
    for (let i = 0; i < path.length - 1; i++) {
        pt = path[i];
        npt = path[i+1];
        let curLineType = null;
        if(pt.x == npt.x){
            // 垂线
            curLineType = "VL";
        }
        else if(pt.y == npt.y){
            // 直线
            curLineType = "HL";
        }
        else{
            throw "无法识别线条类型";
        }

        if(i == 0){
            mpath.push(pt);
            preLineType = curLineType;
            continue;
        }

        if(curLineType != preLineType){
            mpath.push(pt);
            preLineType = curLineType;
        }
    }
    mpath.push(npt);
    return mpath;
}

// 查找点pt1到点pt2的“最优”路径
export function GetPath(rect1, pt1, rect2, pt2)
{
    pt1.name = "rect1-pt1";
    pt2.name = "rect2-pt2";

    rect1.name = "rect1";
    rect2.name = "rect2";


    let srcPoints = MergePointAndPoints(pt1, Get4Points(rect1));
    let destPoints = MergePointAndPoints(pt2, Get4Points(rect2));

    // 建立关系
    BuildPointRelation(srcPoints);
    BuildPointRelation(destPoints);

    // 25次循环
    const allPaths = [];
    let found = false;
    for (let i = 0; !found && i < srcPoints.length; i++) {
        const srcPt = srcPoints[i];
        for (let j = 0; !found && j < destPoints.length; j++) {
            const destPt = destPoints[j];

            const jcRect = GetRect(srcPt, destPt, `(${srcPt.name}*${destPt.name})`);
            if(IsRectIntersect(jcRect, rect2) || IsRectIntersect(jcRect, rect1)) continue;

            const srcPath = SearchOnePath(pt1, srcPt);
            srcPath.pop();

            const destPath = SearchOnePath(pt2, destPt);
            destPath.pop();
            destPath.reverse();

            const jcPoints = Get9Points(jcRect);
            BuildPointRelation(jcPoints);
            const jcPaths = SearchPath(GetPointFromPoints(jcPoints, srcPt), GetPointFromPoints(jcPoints, destPt));
            for (let i = 0; i < jcPaths.length; i++) {
                const jcPath = jcPaths[i];
                allPaths.push([ ...srcPath, ...jcPath, ...destPath ]);
            }

            if(i == 0 && j == 0){
                found = true;
            }
        }
    }

    // 计算
    allPaths.forEach(path=>{
        path.pxLen = CalcPathPXLen(path); // 计算路径长度
        path.edgeCount = CalcPathEdgeCount(path, rect1) + CalcPathEdgeCount(path, rect2); // 计算路径与矩形边缘的重叠数
        path.lineCount = CalcLineCount(path); //计算直线数量
        // path.printPath = PrintPath(path); // For Debug
    });

    // 排序
    const sortedPaths = sortBy(allPaths, ['pxLen', 'edgeCount', 'lineCount']);
    const firstSortedPath = sortedPaths[0];
    // --- For Debug ---
    // let samePaths = [];
    // for (let i = 0; i < sortedPaths.length; i++) {
    //     const path = sortedPaths[i];
    //     if(path.pxLen == firstSortedPath.pxLen && path.edgeCount == firstSortedPath.edgeCount && path.lineCount == firstSortedPath.lineCount){
    //         samePaths.push(path);
    //     }
    //     else{
    //         break;
    //     }
    // }
    // if(samePaths.length > 1){
    //     samePaths.forEach(path=>{
    //         console.log(path);
    //     });
    //     console.log('------');
    // }
    // --- For Debug ---
    return MergePath(firstSortedPath);
}

// 根据路径生成矩形(供外部VLine使用，用于生成画图的大小)
export function GetPathRect(path){
    let minl = 99999, mint = 99999, maxr = -99999, maxb = -99999;
    let l, t;
    path.forEach(pt=>{
        l = pt.x;
        t = pt.y;
        if(l < minl){
            minl = l;
        }
        if(t < mint){
            mint = t;
        }
        if(l > maxr){
            maxr = l;
        }
        if(t > maxb){
            maxb = t;
        }
    });
    return { l: minl, t: mint, w: maxr - minl, h: maxb - mint };
}

// 点是否在路径内(供外部VLine使用)
export function IsPointInPath(point, path, offset){
    if(!path || !path.length) return false;

    // 根据点生成矩形
    const { x, y } = point;

    for (let i = 0; i < path.length-1; i++) {
        const pt = path[i];
        const npt = path[i+1];
        if(pt.x == npt.x){
            // 垂线
            let {min, max} = FindMinMax(pt.y, npt.y);

            if(pt.x - offset <= x && x <= pt.x + offset &&
               min + offset <= y && y <= max - offset) return { type: 'VL', path: [ pt, npt ] };
        }
        else if(pt.y == npt.y){
            // 水平线
            let {min, max} = FindMinMax(pt.x, npt.x);

            if(pt.y - offset <= y && y <= pt.y + offset &&
               min + offset <= x && x <= max - offset) return { type: 'HL', path: [ pt, npt ] };
        }
        
    }
    return false;
}

// 打印路径(调试用)
function PrintPath(path){
    let log = "";
    let dir = "";
    let pt, npt;
    for (let i = 0; i < path.length-1; i++) {
        pt = path[i];
        npt = path[i+1];
        if(pt.x == npt.x){
            // 垂直
            dir = pt.y <= npt.y ? "↓" : "↑";
        }
        else if(pt.y == npt.y){
            // 水平
            dir = pt.x <= npt.x ? "→" : "←";
        }
        else{
            dir = "?";
        }
        log += `${dir} `;
    }
    return log;
}
