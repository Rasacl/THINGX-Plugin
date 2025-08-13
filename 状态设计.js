var allStates ={
    "正常":{
        "action":(oo=>{

        }),
        "trans":{
            "服务器模式":(oo=>{
                return true
            }),     
            "网络架构":(oo=>{
                return true
            }),     
        }
    },
    "服务器模式":{
        "action":(oo=>{
            
        }),
        "trans":{
            "正常":(oo=>{
                return true
            }),     
            "服务器模式_进入设备":(oo=>{
                return true
            }),     
        }
    },
    "服务器模式_进入设备":{
        "action":(oo=>{
            //打开设备单屏幕
        }),
        "trans":{
            "服务器模式":(oo=>{
                return true
            }),     
            "服务器模式_看设备实体位置":(oo=>{
                return true
            }),     
        }       
    },
    "服务器模式_看设备实体位置":{
        "action":(oo=>{
            //打开分屏，左侧切换实体空间屏幕
        }),
        "trans":{
            "服务器模式_进入设备":(oo=>{
                return true
            })
        }       
    },
    "网络架构":{
        "action":(oo=>{
            //打开分屏，右侧切换网络架构屏幕
        }),
        "trans":{
            "正常":(oo=>{
                return true
            }),     
            "网络架构_看设备实体位置":(oo=>{
                return true
            })
        }
    },
    "网络架构_看设备实体位置":{
        "action":(oo=>{
            //打开分屏，左侧实体空间位置
        }),
        "trans":{
            "网络架构":(oo=>{
                return true
            }) 
        }
    },


}


var StateMachine = function(initialState) {
    this.currentState = initialState;
    this.states = allStates;
};

StateMachine.prototype.run = function(oo) {
    var state = this.states[this.currentState];
    if (state.action) {
        state.action(oo);
    }
    
    for (var nextState in state.trans) {
        if (state.trans[nextState](oo)) {
            this.currentState = nextState;
            return;
        }
    }
};

// 示例使用
var sm = new StateMachine("正常");
// sm.run(someOo);