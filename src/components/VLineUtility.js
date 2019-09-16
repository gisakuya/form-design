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

    if(r2l >= r1r || r2r <= r1l || r2b <= r1t || r2t >= r1b) return false;
    return true;
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
            if(min < t && t < max || min < b && b < max) return true;
        }
        return false;
    }
    else if(pt1.y == pt2.y){
        // 水平线
        if(pt1.y == t || pt1.y == b){
            // 贴边
            let { min, max } = FindMinMax(pt1.x, pt2.x);
            if(min < l && l < max || min < r && r < max) return true;
        }
        return false;
    }

    throw '无法判断';
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
        else if(pt => pt.y == x3.y && x3.x < pt.x && pt.x < x4.x){
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

    arr.getNext = (pt,dir)=>{
        let [xdir, ydir] = dir;

        if(pt.x == x1.x && pt.y == x1.y){
            if(xdir == "r") return x2;
            if(ydir == "b") return x3;
        }
        else if(pt.x == x2.x && pt.y == x2.y){
            if(xdir == "l") return x1;
            if(ydir == "b") return x4;
        }
        else if(pt.x == x3.x && pt.y == x3.y){
            if(xdir == "r") return x4;
            if(ydir == "t") return x1;
        }
        else if(pt.x == x4.x && pt.y == x4.y){
            if(xdir == "l") return x3;
            if(ydir == "t") return x2;
        }
        else if(pt.y == x1.y && x1.x < pt.x && pt.x < x2.x){
            // 上
            if(xdir == "l") return x1;
            if(xdir == "r") return x2;
        }
        else if(pt => pt.y == x3.y && x3.x < pt.x && pt.x < x4.x){
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

    arr.getPaths = (from, to) => {
        if(from.x == to.x && from.y == to.y) return [];

        let xdir = to.x > from.x ? "r" : to.x < from.x ? "l" : "=";
        let ydir = to.y > from.y ? "b" : to.y < from.y ? "t" : "=";
        let dir = xdir+ydir;
        
        let paths = [];
        let pt = from;
        while(pt != to){
            paths.push(pt);
            pt = this.getNext(pt, dir);
        }

        return paths;
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

// 查找路径
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

    // 遍历所有可能的路径
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


// 查找路径
export function GetPaths(rect1, pt1, rect2, pt2){
    const points1 = Get4Points(rect1);
    const points2 = Get4Points(rect2);

    let paths1 = [];
    let paths2 = [];
    let tmpRect = null;

    let i = 20;
    while(i--){
        tmpRect = GetRect(pt1, pt2);
        let shortestPath = null;
        if(IsRectIntersect(tmpRect, rect2)){
            let candidates = [];
            let minPathLen = 999;
            points2.forEach(pt => {
                tmpRect = GetRect(pt1, pt);
                if(!IsRectIntersect(tmpRect, rect2)){
                    let paths = points2.getPaths(pt2, pt);
                    candidates.push({ pt: pt, rect: tmpRect, paths: paths, len: paths.length });
                    if(paths.length < minPathLen){
                        minPathLen = paths.length;
                    }
                }
            });
            let minPathCandidates = candidates.filter(x=>x.len == minPathLen);
            if(minPathCandidates.length == 0){
                // 找不到最短路径
            }
            else if(minPathCandidates.length == 1){
                // 找到一条最短路径
                shortestPath = minPathCandidates[0];
            }
            else {
                // 找到多条最短路径
                shortestPath = minPathCandidates[0];
                console.log('找到多条最短路径');
            }
        }else{
            shortestPath = [];
        }

        if(shortestPath == null){
            if(paths1.includes(pt1)){
                // 重复添加了
                throw "无法找到最优路径";
            }
            paths1.push(pt1);
            pt1 = points1.getNextR(pt1);
        }
        else{
            if(!IsRectIntersect(tmpRect, rect1)){
                paths2 = shortestPath.reverse();
                break;
            }
        }
    }
    
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
    searchPaths.forEach(searchPath => {
        let weight = 0;
        let log = "";
        for (let i = 0; i < searchPath.length-1; i++) {
            const pt = searchPath[i];
            const npt = searchPath[i+1];
            let lineInRect1 = IsLineEdge(pt, npt, rect1) ? -2 : 0;
            let lineInRect2 = IsLineEdge(pt, npt, rect2) ? -2 : 0;
            let lineToCenter = npt.isCenter ? 1 : 2;
            weight += lineToCenter + lineInRect1 + lineInRect2;

            // ---打印部分---
            let dir = "";
            if(pt.x == npt.x){
                // 垂直
                if(pt.y <= npt.y){
                    dir = "↓";
                }
                else{
                    dir = "↑";
                }
            }
            else if(pt.y == npt.y){
                // 水平
                if(pt.x <= npt.x){
                    dir = "→";
                }
                else{
                    dir = "←";
                }
            }
            log += `${dir}[${lineToCenter},${lineInRect1},${lineInRect2}]`;
            // ---------
        }

        // 保存当前路径权重
        searchPath.weight = weight;

        // 记录最大权重
        if(weight > maxWeight){
            maxWeight = weight;
        }

        // ---打印部分---
        console.log(log, weight);
        // ---------
    });

    const maxWeightPaths = searchPaths.filter(x=>x.weight == maxWeight); //筛选
    const paths = [ ...paths1, ...maxWeightPaths[0], ...paths2 ]; // 合并路径

    // ---打印部分---
    console.log(maxWeightPaths);
    // ---------

    return paths;
}