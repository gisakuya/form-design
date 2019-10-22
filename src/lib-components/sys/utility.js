import Vue from 'vue'

function ToKerbabCase(str){
    // https://gist.github.com/thevangelist/8ff91bac947018c9f3bfaad6487fa149
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
}

const registerComs = {};
setTimeout(() => {
    for (const key in Vue.options.components) {
        const com = Vue.options.components[key];
        if(!com.options || !com.options.model) continue;
        registerComs[ToKerbabCase(key)] = {
            model: com.options.model
        };
    }
}, 100);


// 获取tag对应的model
export function GetTagModel(tag){
    const com = registerComs[tag];
    if(!com) return {};
    return com.model || {};
}


// 对数进行取整
export function QuZheng(val){
    return Math.round(val/10)*10;
}

