import CookieModel from './Cookie';

class LogManager {
  constructor() {
    this.logs = [];
    this.listeners = [];
    this.targetMember = CookieModel.getCookie('memberName') || '';
  }

  // 訂閱更新
  subscribe(listener) {
    this.listeners.push(listener);
    // 立即回調一次當前狀態
    // listener(this.logs); 
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  // 設置目標幹員
  setTargetMember(name) {
    this.targetMember = name;
    CookieModel.setCookie('memberName', name);
    // 切換幹員時清空日誌並重置去重狀態，以便重新生成
    this.clearLogs(); 
  }

  getTargetMember() {
    return this.targetMember;
  }

  // 判斷是否需要記錄
  shouldLog(memberName) {
    return this.targetMember && memberName === this.targetMember;
  }

  // 添加日誌
  addLog(title, data, type = 'info') {
    // 生成唯一ID
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // 同時輸出到控制台，保持 F12 可用
    // console.groupCollapsed(title);
    // console.table(data);
    // console.groupEnd();

    this.logs = [...this.logs, { id, title, data, type, timestamp: new Date() }];
    this.notify();
  }

  clearLogs() {
    this.logs = [];
    this.notify();
    
    // 重置 CookieModel 裡的去重狀態
    if (CookieModel.logList) {
        Object.keys(CookieModel.logList).forEach(key => {
            if (Array.isArray(CookieModel.logList[key])) {
                CookieModel.logList[key] = [];
            } else {
                CookieModel.logList[key] = false;
            }
        });
    }
  }
}

const logManagerInstance = new LogManager();
export default logManagerInstance;
