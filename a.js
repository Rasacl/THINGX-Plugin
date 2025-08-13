if (!THINGX.SplitScreenTools) {
  return;
}
const condition = '.Rack||[userData/isProxyServer=true]';
// 暂停架设设备的双击进入事件
THING.App.current.pauseEvent(THING.EventType.DBLClick, '.Rack', THING.EventTag.LevelEnterOperation);
function levelChangeNoFly (obj, lobj) {
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
THING.App.current.on(
  THING.EventType.DBLClick,
  condition,
  (t) => {
    if (0 !== t.button)
      return;
    const n = t.object,
      i = THING.App.current.level.current;
    if (n && i !== n) {
      // const proxyObj = n.clone(true, n.parent);
      // levelChangeNoFly(proxyObj, i);
      // THING.App.current.level.change(proxyObj);
      // setTimeout(() => {
      //     const eventData = {
      //         level: proxyObj,
      //         object: proxyObj,
      //         current: proxyObj,
      //         previous: i,
      //     };
      //     THING.App.current.trigger(THING.EventType.LevelFlyEnd, eventData);
      //     proxyObj.trigger(THING.EventType.LevelFlyEnd, eventData);
      //     proxyObj.style.opacity = 0.01;
      // });
      THING.App.current.trigger('dbclickServer', {
        object: n
      })

      const ci = n.userData;
      THINGX.SplitScreenTools.updateServerCi(ci);
      if (n.setOpacityStack) {
        currentEnterObj = n;
        currentEnterObjId = n.id;
      }
      // THINGX.SplitScreenTools.show();
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
  trigger('changeShowTypeSplitScreen',{
    type,
    objectId:currentEnterObjId
  })
}

THINGX.SplitScreenTools.updateServerCi = function (ci) {
  if (ci && ci._ID_) {
    currentEnterObjId = ci?._ID_;
  }
  updateServerCiBack.call(this, ci);
}
const splitMutexButtonTag= '打开分屏设置服务器设置互斥'
THINGX.SplitScreenTools.show = function () {
  if(window.mutexButtonManager){
    window.mutexButtonManager.add(['服务器算力','服务器能耗','服务器温度'],splitMutexButtonTag)
  }
   
  // 主屏和分屏屏蔽右键双击返回
  THINGX.SplitScreenTools.mainTHINGX.App.current.pauseEvent(THING.EventType.DBLClick, null, 'DClickToLevelBack');
  THINGX.SplitScreenTools.THINGX.App.current.pauseEvent(THING.EventType.DBLClick, null, 'DClickToLevelBack');
  THINGX.SplitScreenTools.THINGX.App.current.pauseEvent(THING.EventType.DBLClick, null, '右键双击架设设备返回机柜');
  THINGX.SplitScreenTools.mainTHINGX.App.current.on(
    THING.EventType.DBLClick,
    (ev) => {
      if (ev.button !== 2) {
        return;
      }
      window.uinv.nextStates_flag = '返回入口'
    },
    '主屏右键双击退出分屏');
  THINGX.SplitScreenTools.THINGX.App.current.on(
    THING.EventType.DBLClick,
    (ev) => {
      if (ev.button !== 2) {
        return;
      }
       window.uinv.nextStates_flag = '返回入口'
    },
    '分屏右键双击退出分屏');
  if (currentEnterObj && currentEnterObj.setOpacityStack) {
    currentEnterObj.setOpacityStack('enter')
  }
  showBack.call(this)
  trigger('showSplitScreen')
}

THINGX.SplitScreenTools.hide = function () {
   if(window.mutexButtonManager){
    window.mutexButtonManager.remove(splitMutexButtonTag)
  }
  if (currentEnterObj && currentEnterObj.removeOpacityStack) {
    if (!currentEnterObj.destroyed) {
      currentEnterObj.removeOpacityStack('enter');
    }
    currentEnterObj = null;
    currentEnterObjId = null;
  }
  // 主屏和分屏恢复右键双击返回
  THINGX.SplitScreenTools.mainTHINGX.App.current.resumeEvent(THING.EventType.DBLClick, null, 'DClickToLevelBack');
  THINGX.SplitScreenTools.THINGX.App.current.resumeEvent(THING.EventType.DBLClick, null, 'DClickToLevelBack');
  THINGX.SplitScreenTools.THINGX.App.current.resumeEvent(THING.EventType.DBLClick, null, '右键双击架设设备返回机柜');
  THINGX.SplitScreenTools.mainTHINGX.App.current.off(THING.EventType.DBLClick, null, '主屏右键双击退出分屏');
  THINGX.SplitScreenTools.THINGX.App.current.off(THING.EventType.DBLClick, null, '分屏右键双击退出分屏');
  hideBack.call(this)
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

