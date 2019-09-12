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

function IsLineEdge(pt1, pt2, rect){
    const l = rect.l;
    const r = rect.l + rect.w;
    const t = rect.t;
    const b = rect.t + rect.h;

    if(pt1.x == pt2.x){
        // 垂直线
        if(pt1.x == l || pt1.x == r){
            // 贴边
            if(t <= pt1.y && pt1.y <= b || t <= pt2.y && pt2.y <= b) return true;
        }
        return false;
    }
    else if(pt1.y == pt2.y){
        // 水平线
        if(pt1.y == t || pt1.y == b){
            // 贴边
            if(l <= pt1.x && pt1.x <= r || l <= pt2.x && pt2.x <= r) return true;
        }
        return false;
    }

    throw '无法判断';
}

function GetPointsWithCenter(rect) {
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

    let x1 = { x: l, y: t, weight: 2 };
    let x2 = { x: hc, y: t, weight: 2 };
    let x3 = { x: r, y: t, weight: 2 };
    let x4 = { x: l, y: vc, weight: 2 };
    let x5 = { x: hc, y: vc, weight: 1 };
    let x6 = { x: r, y: vc, weightw: 2 };
    let x7 = { x: l, y: b, weight: 2 };
    let x8 = { x: hc, y: b, weight: 2 };
    let x9 = { x: r, y: b, weight: 2 };

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

function GetPoints(rect) {
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

    if(h == 0 && w > 0){
        x1.next = x2;
        x2.next = x1;
        return [ x1, x2 ];
    }

    if(h > 0 && w == 0){
        x1.next = x3;
        x3.next = x1;
        return [ x1, x3 ];
    }

    if(h == 0 && w == 0){
        x1.next = x1;
        return [ x1 ];
    }

    // h > 0 && w > 0
    x1.next = x2;
    x2.next = x4;
    x4.next = x3;
    x3.next = x1;

    return [ x1, x2, x3, x4 ];
}

function GetRect(pt1, pt2){
    let l = Math.min(pt1.x, pt2.x);
    let t = Math.min(pt1.y, pt2.y);
    let w = Math.abs(pt1.x - pt2.x);
    let h = Math.abs(pt1.y - pt2.y);
    return { l, t, w, h };
}

function GetNextPoint(pt, points){
    // 顺时针找下一个点
    if(!pt.next){
        let obj = {};
        for(let i = 0; i < points.length; i++){
            let npt = points[i];
            if(npt.x == pt.x && npt.y == pt.y){
                return npt.next;
            }
            obj[npt.name] = npt;
        }
        let { x1, x2, x3, x4 } = obj;
        if(x1.x < pt.x && pt.x < x2.x && x1.y == pt.y) return x2;
        if(x3.x < pt.x && pt.x < x4.x && x3.y == pt.y) return x3;
        if(x1.y < pt.y && pt.y < x3.y && x1.x == pt.x) return x1;
        if(x2.y < pt.y && pt.y < x4.y && x2.x == pt.x) return x4;
        return null;
    }

    return pt.next;
}

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

function PrintPaths(path){
    console.log(path.map(x=>`(${x.x},${x.y})`).join("->"));
}

export function GetPaths(rect1, pt1, rect2, pt2){
    const points1 = GetPoints(rect1);
    const points2 = GetPoints(rect2);

    let paths1 = [];
    let paths2 = [];
    let tmpRect = null;
    while(true){
        tmpRect = GetRect(pt1, pt2);
        const rect1IWTmpRect = IsRectIntersect(rect1, tmpRect);
        const rect2IWTmpRect = IsRectIntersect(rect2, tmpRect);

        if(!rect1IWTmpRect && !rect2IWTmpRect) break;

        if(rect1IWTmpRect){
            paths1.push(pt1);
            pt1 = GetNextPoint(pt1, points1);
        }
        if(rect2IWTmpRect){
            paths2.unshift(pt2);
            pt2 = GetNextPoint(pt2, points2);
        }
    }

    const tmpRectPoints = GetPointsWithCenter(tmpRect);

    tmpRectPoints.forEach(pt=>{
        if(pt1.x == pt.x && pt1.y == pt.y){
            pt1 = pt;
        }
        if(pt2.x == pt.x && pt2.y == pt.y){
            pt2 = pt;
        }
    });

    const searchPaths = SearchPath(pt1, pt2);

    let maxWeight = 0;
    for (let i = 0; i < searchPaths.length; i++) {
        const searchPath = searchPaths[i];

        let weight = 0;
        for (let i = 0; i < searchPath.length-1; i++) {
            const pt = searchPath[i];
            const npt = searchPath[i+1];
            let lineInRect1 = IsLineEdge(pt, npt, rect1) ? -1 : 0;
            let lineInRect2 = IsLineEdge(pt, npt, rect2) ? -1 : 0;
            pt.lineInRect1 = lineInRect1;
            pt.lineInRect2 = lineInRect2;
            delete pt.l;delete pt.t;delete pt.r;delete pt.b;
            delete npt.l;delete npt.t;delete npt.r;delete npt.b;
            weight += pt.weight + lineInRect1 + lineInRect2;
        }

        searchPath.weight = weight;
        if(weight > maxWeight){
            maxWeight = weight;
        }
    }
    const maxWeightPaths = searchPaths.filter(x=>x.weight == maxWeight);
    console.log(maxWeightPaths);
    const paths = [ ...paths1, ...maxWeightPaths[0], ...paths2 ];
    return paths;
}