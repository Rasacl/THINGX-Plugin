if (!THINGX.SplitScreenTools) {
    return
}
const condition = '.Rack||[userData/isProxyServer=true]||([userData/_TWINTYPE_=架式设备]&&[userData/_styleTag_=backward_network_node])';
// 暂停架设设备的双击进入事件
THING.App.current.pauseEvent(THING.EventType.DBLClick, '.Rack', THING.EventTag.LevelEnterOperation);
function levelChangeNoFly(obj, lobj) {
    obj.style.opacity = 0.01;
    serverProxyQuerySre = '[userData/isProxyServer=true]';
    box = new THING.Box();
    obj.add(box);
    box.pauseEvent(THING.EventType.EnterLevelForward, serverProxyQuerySre, 'ELFFly');
    box.pauseEvent(THING.EventType.LeaveLevelBackward, serverProxyQuerySre, 'LLBFly');
    box.pauseEvent(THING.EventType.EnterLevel, serverProxyQuerySre, 'enterThingToShow');
    box.active = false;
    obj.on(
        THING.EventType.AfterLeaveLevel,
        () => {
        setTimeout(() => {
            obj.destroy();
            const eventData = {
                level: lobj,
                object: lobj,
                current: lobj,
                previous: null,
            };
            THING.App.current.trigger(THING.EventType.LevelFlyEnd, eventData);
            lobj.trigger(THING.EventType.LevelFlyEnd, eventData);
        }, 100);
    },
        '退出销毁');
}
let currentEnterObj, currentEnterObjId;
const layerOfCheckTypeConfig = [{
        keywords: '能耗',
        nextStates_flag: '能耗进入设备',
        ciKey: '选择能耗下的设备'
    }, {
        keywords: '温度',
        nextStates_flag: '温度云图进入设备',
        ciKey: '选择温度云图下的设备'
    }, {
        keywords: '液冷',
        nextStates_flag: '液冷管线进入设备',
        ciKey: '选择液冷管线下的设备'
    },{
        keywords: '参数网',
        nextStates_flag: '参数网进入设备',
        ciKey: '选择参数网下的设备'
    },
]
THING.App.current.on(
    THING.EventType.DBLClick,
    condition,
    (t) => {
    if (0 !== t.button)
        return;
    const n = t.object,
    i = THING.App.current.level.current;
    if (n && i !== n) {

        THING.App.current.trigger('dbclickServer', {
            object: n
        })

        const ci = n.userData;
        const activedLayerNames = THINGX.Layer.getActivated().map(i => i.id);
        const layerOfCheckType = layerOfCheckTypeConfig.find(i => activedLayerNames.find(name => name.includes(i.keywords)));
        if (layerOfCheckType) {
            uinv.nextStates_flag = layerOfCheckType.nextStates_flag;
            uinv[layerOfCheckType.ciKey] = ci;
        }

        if (n.setOpacityStack) {
            currentEnterObj = n;
            currentEnterObjId = n.id;
        }
    }
},
    '双击架设设备打开分屏');
const trigger = function (eventName, params) {
    THINGX.SplitScreenTools.mainTHINGX.App.current.trigger(eventName, params);
    THINGX.SplitScreenTools.THINGX.App.current.trigger(eventName, params);
}

const showBack = THINGX.SplitScreenTools.show;
const hideBack = THINGX.SplitScreenTools.hide;
const updateServerCiBack = THINGX.SplitScreenTools.updateServerCi;
const changeShowTypeBack = THINGX.SplitScreenTools.changeShowType;

THINGX.SplitScreenTools.changeShowType = function (type) {

    changeShowTypeBack.call(this, type);
    trigger('changeShowTypeSplitScreen')
}

THINGX.SplitScreenTools.updateServerCi = function (ci) {
    if (ci && ci._ID_) {
        currentEnterObjId = ci?._ID_;
    }
    updateServerCiBack.call(this, ci);
}

THINGX.SplitScreenTools.show = function () {

    // 主屏和分屏屏蔽右键双击返回
    // THINGX.SplitScreenTools.mainTHINGX.App.current.pauseEvent(THING.EventType.DBLClick, null, 'DClickToLevelBack');
    // THINGX.SplitScreenTools.THINGX.App.current.pauseEvent(THING.EventType.DBLClick, null, 'DClickToLevelBack');
    // THINGX.SplitScreenTools.THINGX.App.current.pauseEvent(THING.EventType.DBLClick, null, '右键双击架设设备返回机柜');

    if (currentEnterObj && currentEnterObj.setOpacityStack) {
        currentEnterObj.setOpacityStack('enter')
    }

    //测试_show
    // const splitIframe = document.getElementById('PointCloud');
    // // 设置为绝对定位并偏移到视口外
    // splitIframe.style.position = 'absolute';
    // splitIframe.style.left = '50%';
    // 保持可见性和渲染状态
    // splitIframe.style.display = 'block';
    // splitIframe.style.visibility = 'visible';



    showBack.call(this)
    // const one = document.getElementById('split-screen-iframe')
    // one.style.right = '1px'
    trigger('showSplitScreen')
}

THINGX.SplitScreenTools.hide = function (onlyHideIframe) {
    if (currentEnterObj && currentEnterObj.removeOpacityStack) {
        if (!currentEnterObj.destroyed) {
            currentEnterObj.removeOpacityStack('enter');
        }
        currentEnterObj = null;
        currentEnterObjId = null;
    }

    // //测试_hide
    // const splitIframe = document.getElementById('split-screen-iframe');
    // splitIframe.style.left = '';
    // splitIframe.style.top = '';

    // 主屏和分屏恢复右键双击返回
    // THINGX.SplitScreenTools.mainTHINGX.App.current.resumeEvent(THING.EventType.DBLClick, null, 'DClickToLevelBack');
    // THINGX.SplitScreenTools.THINGX.App.current.resumeEvent(THING.EventType.DBLClick, null, 'DClickToLevelBack');
    // THINGX.SplitScreenTools.THINGX.App.current.resumeEvent(THING.EventType.DBLClick, null, '右键双击架设设备返回机柜');
    // const one = document.getElementById('split-screen-iframe')
    // one.style.right = '99%'
    hideBack.call(this, onlyHideIframe)
    trigger('hideSplitScreen')
}
THING.App.current.on(THING.EventType.Create, '[userData/isProxyServerBox=true]', (e) => {
    if (!currentEnterObjId) {
        return;
    }
    const obj = e.object;
    if (obj.id === currentEnterObjId) {
        currentEnterObj = obj;
        if (currentEnterObj && currentEnterObj.setOpacityStack) {
            currentEnterObj.setOpacityStack('enter')
        }
    }
}, '服务器盒子创建完重新设置下当前进入物体')
