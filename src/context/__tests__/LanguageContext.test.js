import * as OpenCC from 'opencc-js';
import { translateText } from '../LanguageContext';

const converters = {
  twToCn: OpenCC.Converter({ from: 'tw', to: 'cn' }),
  cnToTw: OpenCC.Converter({ from: 'cn', to: 'tw' }),
};

describe('language conversion', () => {
  test('converts display text in both directions without changing source keys', () => {
    const traditionalRuleKey = '馭法鐵衛';
    const simplifiedName = '维什戴尔';

    expect(translateText({
      text: traditionalRuleKey,
      sourceLang: 'zh-TW',
      language: 'zh-CN',
      converters,
      isReady: true,
    })).toBe('驭法铁卫');
    expect(translateText({
      text: simplifiedName,
      sourceLang: 'zh-CN',
      language: 'zh-TW',
      converters,
      isReady: true,
    })).toBe('維什戴爾');
    expect(traditionalRuleKey).toBe('馭法鐵衛');
    expect(simplifiedName).toBe('维什戴尔');
  });

  test('remains stable across repeated language switches', () => {
    let language = 'zh-CN';
    for(let index = 0; index < 100; index += 1){
      language = language === 'zh-CN' ? 'zh-TW' : 'zh-CN';
      const value = translateText({
        text: '傷害技能',
        sourceLang: 'zh-TW',
        language,
        converters,
        isReady: true,
      });
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('returns source text before converters are ready', () => {
    expect(translateText({
      text: '攻擊',
      sourceLang: 'zh-TW',
      language: 'zh-CN',
      converters: { twToCn: null, cnToTw: null },
      isReady: false,
    })).toBe('攻擊');
  });
});
