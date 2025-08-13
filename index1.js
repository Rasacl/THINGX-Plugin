// 状态枚举
const STATES = {
  NORMAL: "常规模式", // 最顶级状态
  ENTRANCE: "返回入口", // 返回到currentBusiness对应的模式
  SERVER: "服务器模式",
  SERVER_ENTER_DEVICE: "服务器模式_进入设备",
  SERVER_ENTER_DEVICE_SPLIT: "服务器模式_进入设备_分屏模式",
  SERVER_ENTER_DEVICE_SINGLE: "服务器模式_进入设备_单屏模式",
  NETWORK_ARCHITECTURE: "网络架构",
  CPU_MODEL: "CPU模式",
  ROOM_MODEL:'物理空间模式'
};

// 状态转换标志枚举
const TRANSITION_FLAGS = {
  NORMAL: "常规模式", // 新增
  ENTRANCE: "返回入口",
  SERVER: "服务器模式",
  SERVER_ENTER_DEVICE: "服务器模式_进入设备",
  SPLIT_SCREEN: "分屏模式",
  SINGLE_SCREEN: "单屏模式",
  NETWORK_ARCHITECTURE: "网络架构模式",
  CPU_MODEL: "CPU模式",
  ROOM_MODEL:'物理空间模式'
};

const instanceSymbol = Symbol("StateMachine");
class StateMachine {
  constructor() {
    if (StateMachine[instanceSymbol]) {
      return StateMachine[instanceSymbol];
    }
    this.allStates = null;
    this.currentState = null;
    this.isRunning = false;
    this.frameId = null;
    this.currentBusiness = null;

    StateMachine[instanceSymbol] = this;
  }

  /**
   * @description 初始化状态机
   * @param {string} state 初始状态名称
   */
  initState(state) {
    this.setAllStatus();
    this.currentState = state;
  }

  /**
   * @description 启动状态机
   */
  start() {
    if (this.isRunning) {
      console.warn("状态机已经在运行中");
      return;
    }

    if (!this.currentState || !this.allStates[this.currentState]) {
      console.error("当前状态无效，无法启动状态机");
      return;
    }

    this.isRunning = true;
    // 执行当前状态的action
    this.executeCurrentAction();
    // 开始监听状态转换
    this.startListening();

    console.error(`状态机启动，当前状态: ${this.currentState}`);
  }

  /**
   * @description 停止状态机
   * @param {boolean} isStop 是否停止状态机 如果是true 则停止状态机 否则不停止状态机，只是停止监听
   */
  stop(isStop) {
    if (isStop) {
      this.isRunning = false;
      console.error("状态机已停止");
    }
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * @description 执行当前状态的action函数
   */
  executeCurrentAction() {
    if (
      this.allStates[this.currentState] &&
      this.allStates[this.currentState].action
    ) {
      this.allStates[this.currentState].action();
      this.stop(false);
      this.startListening();
    }
  }

  /**
   * @description 开始每帧监听状态转换
   */
  startListening() {
    const checkTransitions = () => {
      if (!this.isRunning) {
        console.error("状态机已停止，退出监听");
        return;
      }

      // 添加当前状态和标志的调试信息
      if (window.uinv && window.uinv.nextStates_flag) {
        console.error(
          `[调试] 当前帧检查 - 状态: ${this.currentState}, 标志: ${window.uinv.nextStates_flag}`
        );
      }

      const currentStateObj = this.allStates[this.currentState];
      let transitionTriggered = false;

      if (currentStateObj && currentStateObj.trans) {
        // 遍历当前状态的所有转换条件
        for (const [targetState, transitionFn] of Object.entries(
          currentStateObj.trans
        )) {
          try {
            if (transitionFn()) {
              // 找到满足条件的状态转换
              console.error(
                `触发状态转换: ${this.currentState} -> ${targetState}`
              );

              // 立即清空标志，防止重复触发
              window.uinv.nextStates_flag = null;

              this.transitionTo(targetState);
              transitionTriggered = true;
              return; // 只执行第一个满足条件的转换
            }
          } catch (error) {
            console.error(
              `状态转换检查出错 ${this.currentState} -> ${targetState}:`,
              error
            );
          }
        }
      }

      // 如果没有触发转换但有标志，清空标志避免无效循环
      if (!transitionTriggered && window.uinv && window.uinv.nextStates_flag) {
        console.error(`清空无效标志: ${window.uinv.nextStates_flag}`);
        window.uinv.nextStates_flag = null;
      }

      // 继续下一帧检查
      this.frameId = requestAnimationFrame(checkTransitions);
    };

    this.frameId = requestAnimationFrame(checkTransitions);
  }

  /**
   * @description 转换到新状态
   * @param {string} newState 新状态名称
   */
  transitionTo(newState) {
    if (!this.allStates[newState]) {
      console.error(`目标状态 "${newState}" 不存在`);
      return;
    }

    const oldState = this.currentState;
    this.currentState = newState;

    console.error(`状态转换: ${oldState} -> ${newState}`);

    // 执行新状态的action
    this.executeCurrentAction();
  }

  /**
   * @description 手动切换状态
   * @param {string} newState 新状态名称
   */
  setState(newState) {
    if (!this.allStates[newState]) {
      console.error(`状态 "${newState}" 不存在`);
      return;
    }

    this.transitionTo(newState);
  }

  /**
   * @description 获取当前状态
   * @returns {string} 当前状态名称
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * @description 设置所有状态配置
   */
  setAllStatus() {
    this.allStates = {
      // 常规模式
      [STATES.NORMAL]: {
        action: () => {
          console.error("常规模式action - 顶级状态");
          // 清空当前业务模式，因为回到了最顶级
          this.normalMode();
          THINGX.SplitScreenTwoTools.pauseBusinessEvent();
          this.currentBusiness = null;
          // this.initNormalMode();
        },
        trans: {
          [STATES.SERVER]: this.checkBusiness(TRANSITION_FLAGS.SERVER),
          [STATES.NETWORK_ARCHITECTURE]: this.checkBusiness(
            TRANSITION_FLAGS.NETWORK_ARCHITECTURE
          ),
          [STATES.CPU_MODEL]: this.checkBusiness(TRANSITION_FLAGS.CPU_MODEL),
        },
      },

      // 返回入口 - 返回到currentBusiness对应的模式
      [STATES.ENTRANCE]: {
        action: () => {
          if (this.currentBusiness) {
            console.error(`返回到业务模式: ${this.currentBusiness}`);
            this.returnEntry(this.currentBusiness);
            // 根据currentBusiness返回到对应模式
            window.uinv.nextStates_flag = this.currentBusiness;
          }
        },
        trans: {
          [STATES.NORMAL]: this.createTransitionChecker(
            TRANSITION_FLAGS.NORMAL
          ),
          [STATES.SERVER]: this.createTransitionChecker(
            TRANSITION_FLAGS.SERVER
          ),
          [STATES.NETWORK_ARCHITECTURE]: this.createTransitionChecker(
            TRANSITION_FLAGS.NETWORK_ARCHITECTURE
          ),
          [STATES.NETWORK_ARCHITECTURE]: this.createTransitionChecker(
            TRANSITION_FLAGS.NETWORK_ARCHITECTURE
          ),
          
        },
      },

      // 服务器模式 - 监听返回入口、常规模式、服务器进入设备
      [STATES.SERVER]: {
        action: () => {
          console.error("服务器模式action");
          // 设置当前业务模式
          this.normalMode();
          this.serverMode();
        },
        trans: {
          [STATES.ENTRANCE]: this.createTransitionChecker(
            TRANSITION_FLAGS.ENTRANCE
          ),
          [STATES.NORMAL]: this.checkBusiness(
            TRANSITION_FLAGS.ROOM_MODEL
          ),
          [STATES.SERVER_ENTER_DEVICE]: this.createTransitionChecker(
            TRANSITION_FLAGS.SERVER_ENTER_DEVICE
          ),
          [STATES.CPU_MODEL]: this.checkBusiness(TRANSITION_FLAGS.CPU_MODEL),
        },
      },

      // 服务器进入设备 - 监听分屏、单屏、返回入口
      [STATES.SERVER_ENTER_DEVICE]: {
        action: () => {
          console.error("服务器进入设备action");
          // 保持当前业务模式不变
          this.serverModeClickDevice();
        },
        trans: {
          [STATES.SERVER_ENTER_DEVICE_SPLIT]: this.createTransitionChecker(
            TRANSITION_FLAGS.SPLIT_SCREEN
          ),
          [STATES.SERVER_ENTER_DEVICE_SINGLE]: this.createTransitionChecker(
            TRANSITION_FLAGS.SINGLE_SCREEN
          ),
          [STATES.ENTRANCE]: this.createTransitionChecker(
            TRANSITION_FLAGS.ENTRANCE
          ),
        },
      },

      // 服务器单屏模式 - 监听分屏和返回入口
      [STATES.SERVER_ENTER_DEVICE_SINGLE]: {
        action: () => {
          console.error("服务器全屏action");
          this.serverModeClickFullScreen();
        },
        trans: {
          [STATES.SERVER_ENTER_DEVICE_SPLIT]: this.createTransitionChecker(
            TRANSITION_FLAGS.SPLIT_SCREEN
          ),
          [STATES.ENTRANCE]: this.createTransitionChecker(
            TRANSITION_FLAGS.ENTRANCE
          ),
        },
      },

      // 服务器分屏模式 - 监听单屏和返回入口
      [STATES.SERVER_ENTER_DEVICE_SPLIT]: {
        action: () => {
          console.error("服务器分屏action");
          this.serverModeClickSplitScreen();
        },
        trans: {
          [STATES.SERVER_ENTER_DEVICE_SINGLE]: this.createTransitionChecker(
            TRANSITION_FLAGS.SINGLE_SCREEN
          ),
          [STATES.ENTRANCE]: this.createTransitionChecker(
            TRANSITION_FLAGS.ENTRANCE
          ),
        },
      },
      // CPU模式
      [STATES.CPU_MODEL]: {
        action: () => {
          console.error("执行CPU模式action");
          this.normalMode();
          this.cpuMode();
          // 设置当前业务模式
          this.currentBusiness = TRANSITION_FLAGS.CPU_MODEL;
        },
        trans: {
          [STATES.NORMAL]: this.createTransitionChecker(
            TRANSITION_FLAGS.NORMAL
          ),
          [STATES.SERVER]: this.checkBusiness(TRANSITION_FLAGS.SERVER),
          [STATES.NETWORK_ARCHITECTURE]: this.checkBusiness(
            TRANSITION_FLAGS.NETWORK_ARCHITECTURE
          ),
        },
      },

      // 网络架构模式 - 监听返回入口和常规模式
      [STATES.NETWORK_ARCHITECTURE]: {
        action: () => {
          console.error("执行网络架构action");
          // 设置当前业务模式
          this.currentBusiness = TRANSITION_FLAGS.NETWORK_ARCHITECTURE;
        },
        trans: {
          [STATES.ENTRANCE]: this.createTransitionChecker(
            TRANSITION_FLAGS.ENTRANCE
          ),
          [STATES.NORMAL]: this.createTransitionChecker(
            TRANSITION_FLAGS.NORMAL
          ),
        },
      },
    };
  }

  checkBusiness(expectedFlag) {
    return () => {
      const currentFlag = THINGX.Business.getActivatedName();
      const flag = currentFlag === expectedFlag;

      // 添加调试信息
      if (currentFlag) {
        console.error(
          `检查转换条件: 当前状态=${this.currentState}, 期望标志=${expectedFlag}, 实际标志=${currentFlag}, 匹配=${flag}`
        );
      }

      if (flag) {
        console.error(`状态转换条件满足: ${this.currentState} -> 目标状态`);
        return true;
      }

      return false;
    };
  }

  /**
   * @description 创建状态转换检查函数
   * @param {string} expectedFlag 期望的状态标志值
   * @returns {Function} 状态转换检查函数
   */
  createTransitionChecker(expectedFlag) {
    return () => {
      const currentFlag = window.uinv && window.uinv.nextStates_flag;
      const flag = currentFlag === expectedFlag;

      // 添加调试信息
      if (currentFlag) {
        console.error(
          `检查转换条件: 当前状态=${this.currentState}, 期望标志=${expectedFlag}, 实际标志=${currentFlag}, 匹配=${flag}`
        );
      }

      if (flag) {
        console.error(`状态转换条件满足: ${this.currentState} -> 目标状态`);
        // 立即清空标志，防止重复触发
        window.uinv.nextStates_flag = null;
        return true;
      }

      return false;
    };
  }

  /**
   * @description 返回入口时的操作
   * @param {string} business 业务值
   */
  returnEntry(business) {
    if (business === TRANSITION_FLAGS.SERVER) {
      THINGX.SplitScreenTwoTools.THINGX.Layer.activate("iframeserver");
      THINGX.SplitScreenTools.hide();
      THINGX.SplitScreenTwoTools.show();
      window.uinv.nextStates_flag = TRANSITION_FLAGS.SERVER;
    }
  }
  /**
   * @description 常规模式执行方法
   */
  normalMode() {
    // THINGX.SplitScreenTwoTools.THINGX.Layer.deactivate("iframeserver");
    // THINGX.SplitScreenTwoTools.THINGX.Layer.deactivate("iframecpu");
    THINGX.SplitScreenTwoTools.hide();
  }

  /**
   * @description 服务器模式执行方法
   */
  serverMode() {
    THINGX.SplitScreenTwoTools.postMessageToIframe({
      type: "setAttributes",
      data: ["LevelCurrent", THING.App.current.level.current.userData],
    });

    THINGX.SplitScreenTwoTools.postMessageToIframe({
      type: "runScript",
      data: `
                            THINGX.Business.activate('${TRANSITION_FLAGS.SERVER}');

                        `,
    });
    THINGX.SplitScreenTwoTools.show();
    this.currentBusiness = TRANSITION_FLAGS.SERVER;
  }

  /**
   * @description CPU模式执行方法
   */
  cpuMode() {
    THINGX.SplitScreenTwoTools.postMessageToIframe({
      type: "setAttributes",
      data: ["LevelCurrent", THING.App.current.level.current.userData],
    });
    THINGX.SplitScreenTwoTools.THINGX.Layer.activate("iframecpu");
    THINGX.SplitScreenTwoTools.show();
    this.currentBusiness = TRANSITION_FLAGS.CPU_MODEL;
  }

  /**
   * @description 服务器模式下，点击设备时的操作
   */
  serverModeClickDevice() {
    THINGX.SplitScreenTools.updateServerCi({
      _DBID_: uinv["选择服务器模式下的设备"]._DBID_,
    });
    THINGX.SplitScreenTools.show();
  }
  /**
   * @description 服务器模式下，点击分屏时的操作
   */
  serverModeClickSplitScreen() {
    THINGX.SplitScreenTools.changeShowType("half");
    THINGX.SplitScreenTwoTools.hide();
    window.localtionFunc.click(uinv["选择服务器模式下的设备"]);
  }

  /**
   * @description 服务器模式下，点击全屏时的操作
   */
  serverModeClickFullScreen() {
    THINGX.SplitScreenTools.changeShowType("full");
  }
}

if (THING.App.current.level.current.name == "北电数智") {
  // 使用示例
  window.sm = StateMachine[instanceSymbol] || new StateMachine();

  window.sm.initState(STATES.NORMAL);
  window.sm.start(); // 启动状态机
}
