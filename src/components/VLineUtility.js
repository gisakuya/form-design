const DEBUG = false;

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

    let x1 = { x: l, y: t };
    let x2 = { x: hc, y: t };
    let x3 = { x: r, y: t };
    let x4 = { x: l, y: vc };
    let x5 = { x: hc, y: vc, isCenter: true };
    let x6 = { x: r, y: vc };
    let x7 = { x: l, y: b };
    let x8 = { x: hc, y: b };
    let x9 = { x: r, y: b };

    if(h == 0 && w > 0){
        x1.r = x2;
        x2.l = x1; x2.r = x3; 
        x3.l = x2;
        return [ x1, x2, x3 ];
    }

    if(h > 0 && w == 0){
        x1.b = x4;
        x4.t = x1; x4.b = x7;
        x7.t = x4;
        return [ x1, x4, x7 ];
    }

    if(h == 0 && w == 0){
        return [ x1 ];
    }

    // h > 0 && w > 0
    x1.r = x2; x1.b = x4;
    x2.l = x1; x2.r = x3; x2.b = x5;
    x3.l = x2; x3.b = x6;
    x4.t = x1; x4.b = x7; x4.r = x5;
    x5.l = x4; x5.t = x2; x5.r = x6; x5.b = x8;
    x6.t = x3; x6.l = x5; x6.b = x9;
    x7.t = x4; x7.r = x8;
    x8.l = x7; x8.t = x5; x8.r = x9;
    x9.l = x8; x9.t = x6;

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

    let x1 = { x: l, y: t, name: "x1" };
    let x2 = { x: r, y: t, name: "x2" };
    let x3 = { x: l, y: b, name: "x3" };
    let x4 = { x: r, y: b, name: "x4" };

    let arr = null;

    if(h == 0 && w > 0){
        arr = [ x1, x2 ];
    }

    if(h > 0 && w == 0){
        arr = [ x1, x3 ];
    }

    if(h == 0 && w == 0){
        arr = [ x1 ];
    }

    if(h > 0 && w > 0){
        arr = [ x1, x2, x3, x4 ];
    }

    // 获取pt的下一个点（顺时针）
    arr.getNextR = pt => {
        if(pt.x == x1.x && pt.y == x1.y){
            return x2;
        }
        else if(pt.x == x2.x && pt.y == x2.y){
            return x4;
        }
        else if(pt.x == x3.x && pt.y == x3.y){
            return x1;
        }
        else if(pt.x == x4.x && pt.y == x4.y){
            return x3;
        }
        else if(pt.y == x1.y && x1.x < pt.x && pt.x < x2.x){
            // 上
            return x2;
        }
        else if(pt.y == x3.y && x3.x < pt.x && pt.x < x4.x){
            // 下
            return x3;
        }
        else if(pt.x == x1.x && x1.y < pt.y && pt.y < x3.y){
            // 左
            return x1;
        }
        else if(pt.x == x2.x && x2.y < pt.y && pt.y < x4.y){
            // 右
            return x4;
        }

        return null;
    };

    // 获取点pt的下一个点（根据dir方向）
    arr.getNextDir = (pt,dir)=>{
        let [xdir, ydir] = dir;

        if(pt.x == x1.x && pt.y == x1.y){
            // x1
            if(xdir == "r") return x2;
            if(ydir == "b") return x3;
        }
        else if(pt.x == x2.x && pt.y == x2.y){
            // x2
            if(xdir == "l") return x1;
            if(ydir == "b") return x4;
        }
        else if(pt.x == x3.x && pt.y == x3.y){
            // x3
            if(xdir == "r") return x4;
            if(ydir == "t") return x1;
        }
        else if(pt.x == x4.x && pt.y == x4.y){
            // x4
            if(xdir == "l") return x3;
            if(ydir == "t") return x2;
        }
        else if(pt.y == x1.y && x1.x < pt.x && pt.x < x2.x){
            // 上
            if(xdir == "l") return x1;
            if(xdir == "r") return x2;
        }
        else if(pt.y == x3.y && x3.x < pt.x && pt.x < x4.x){
            // 下
            if(xdir == "l") return x3;
            if(xdir == "r") return x4;
        }
        else if(pt.x == x1.x && x1.y < pt.y && pt.y < x3.y){
            // 左
            if(ydir == "t") return x1;
            if(ydir == "b") return x3;
        }
        else if(pt.x == x2.x && x2.y < pt.y && pt.y < x4.y){
            // 右
            if(ydir == "t") return x2;
            if(ydir == "b") return x4;
        }

        return null;
    };

    // 获取从form到to的路径
    arr.getPath = (from, to) => {
        if(from.x == to.x && from.y == to.y) return [];

        // 判断to在from的哪个方向
        let xdir = to.x > from.x ? "r" : to.x < from.x ? "l" : "=";
        let ydir = to.y > from.y ? "b" : to.y < from.y ? "t" : "=";
        let dir = xdir+ydir;
        
        let path = []; // 存储路径的数组
        let pt = from;  // 起始点
        while(pt != to){
            path.push(pt);
            pt = arr.getNextDir(pt, dir);
        }

        return path;
    };

    return arr;
}

// 根据2个点，构建一个矩形
function GetRect(pt1, pt2){
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

    return { l, t, w, h };
}

// 查找ptSrc到ptDest的所有可能路径
function SearchPath(ptSrc, ptDest){
    // 查找目标方向
    let direction = "";
    if(ptSrc.x < ptDest.x){
        // 目标在右边
        direction += "r";
    }
    else if(ptSrc.x > ptDest.x){
        // 目标在左边
        direction += "l";
    }
    if(ptSrc.y < ptDest.y){
        // 目标在下方
        direction += "b";
    }
    else if(ptSrc.y > ptDest.y){
        // 目标在上方
        direction += "t";
    }

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

// 查找点pt1到点pt2的“最优”路径
export function GetPath(rect1, pt1, rect2, pt2){
    const points1 = Get4Points(rect1);
    const points2 = Get4Points(rect2);

    let paths1 = [];
    let paths2 = [];
    let tmpRect = null;

    let srcPoints = [ pt1, ...points1 ];
    let destPoints = [ pt2, ...points2 ];
    let candidatePaths = [];

    // 25次循环
    let found = false;
    for (let i = 0; found || i < srcPoints.length; i++) {
        const srcPt = srcPoints[i];
        for (let j = 0; found || j < destPoints.length; j++) {
            const destPt = destPoints[j];

            const jcRect = GetRect(srcPt, destPt);
            if(IsRectIntersect(jcRect, rect1) || IsRectIntersect(jcRect, rect2)) continue;

            const srcPath = points1.getPath(pt1, srcPt);
            const destPath = points2.getPath(pt2, destPt);

            candidatePaths.push({
                src: { pt: srcPt, path: srcPath, rect: jcRect  },
                dest: { pt: destPt, path: destPath, rect: jcRect }
            });
        }
    }

    let minPath = Math.min(...candidatePaths.map(x =>  ));

    
    // 根据临时矩形，获取临时矩形上的9个点
    const tmpRectPoints = Get9Points(tmpRect);
    tmpRectPoints.forEach(pt=>{
        if(pt1.x == pt.x && pt1.y == pt.y){
            pt1 = pt;
        }
        if(pt2.x == pt.x && pt2.y == pt.y){
            pt2 = pt;
        }
    });

    // 搜索路径
    const searchPaths = SearchPath(pt1, pt2);

    // 计算路径权重
    let maxWeight = -999;
    searchPaths.forEach(path => {
        let weight = 0;
        let pt, npt, a, b, c;
        for (let i = 0; i < path.length-1; i++) {
            pt = path[i];
            npt = path[i+1];
            
            a = IsLineEdge(pt, npt, rect1) ? -2 : 0;
            b = IsLineEdge(pt, npt, rect2) ? -2 : 0;
            c = npt.isCenter ? 1 : 2;

            weight += a + b + c;

            // ---调试部分---
            if(DEBUG){
                pt.lineInRect1 = a;
                pt.lineInRect2 = b;
                pt.lineToCenter = c;
            }
            // ---------
        }

        // 保存当前路径权重
        path.weight = weight;

        // 记录最大权重
        if(weight > maxWeight){
            maxWeight = weight;
        }

        // ---调试部分---
        if(DEBUG){
            PrintPath(path, function(pt) { return `[${pt.lineToCenter},${pt.lineInRect1},${pt.lineInRect2}]` }, function(p){ return p.weight; });
        }
        // ---------
    });

    const maxWeightPaths = searchPaths.filter(x=>x.weight == maxWeight); //筛选
    const paths = [ ...paths1, ...maxWeightPaths[0], ...paths2 ]; // 合并路径

    // ---调试部分---
    if(DEBUG){
        PrintPath(paths);
        console.log("-----------我是分割线------------");
    }
    // ---------

    return paths;
}

// 根据路径生成矩形
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

// 打印路径
function PrintPath(path, loop, final){
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
        if(loop){
            log += `${dir}${loop(pt, npt)} `;
        }
        else{
            log += `${dir} `;
        }
    }
    if(final){
        log += final(path);
    }
    console.log(log);
}
