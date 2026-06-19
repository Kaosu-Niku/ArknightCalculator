import SettingsStorageModel from './SettingsStorage';

class CalculationSession {
  constructor() {
    this.targetMember = SettingsStorageModel.get('memberName') || '';
    this.calculationContext = null;
    this.contextListeners = [];
  }

  setTargetMember(name) {
    this.targetMember = name;
    SettingsStorageModel.update({ memberName: name });
  }

  getTargetMember() {
    return this.targetMember;
  }

  setCalculationContext(context) {
    this.calculationContext = context;
    this.contextListeners.forEach(listener => listener(context));
  }

  getCalculationContext() {
    return this.calculationContext;
  }

  subscribeCalculationContext(listener) {
    this.contextListeners.push(listener);
    listener(this.calculationContext);
    return () => {
      this.contextListeners = this.contextListeners.filter(item => item !== listener);
    };
  }
}

const calculationSession = new CalculationSession();

export default calculationSession;
