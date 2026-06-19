import React, { createContext, useCallback, useState, useContext, useEffect } from 'react';
import * as OpenCC from 'opencc-js';
import SettingsStorageModel from '../model/SettingsStorage';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const translateText = ({
  text,
  sourceLang = 'zh-TW',
  language,
  converters,
  isReady,
}) => {
  if(!text || typeof text !== 'string' || !isReady || language === sourceLang){
    return text;
  }
  if(language === 'zh-CN' && sourceLang === 'zh-TW'){
    return converters.twToCn(text);
  }
  if(language === 'zh-TW' && sourceLang === 'zh-CN'){
    return converters.cnToTw(text);
  }
  return text;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(SettingsStorageModel.get('language'));
  const [converters, setConverters] = useState({
    twToCn: null,
    cnToTw: null
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initConverters = async () => {
      try {
        // Converter for Traditional -> Simplified
        const twToCn = await OpenCC.Converter({ from: 'tw', to: 'cn' });
        // Converter for Simplified -> Traditional
        const cnToTw = await OpenCC.Converter({ from: 'cn', to: 'tw' });
        
        setConverters({ twToCn, cnToTw });
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize OpenCC converters:", error);
      }
    };
    initConverters();
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const nextLanguage = prev === 'zh-TW' ? 'zh-CN' : 'zh-TW';
      SettingsStorageModel.update({ language: nextLanguage });
      return nextLanguage;
    });
  }, []);

  /**
   * Translate text based on source language and current target language.
   * @param {string} text - The text to translate.
   * @param {string} sourceLang - The source language of the text ('zh-TW' or 'zh-CN'). Defaults to 'zh-TW'.
   * @returns {string} - The translated text.
   */
  const t = useCallback((text, sourceLang = 'zh-TW') => translateText({
    text,
    sourceLang,
    language,
    converters,
    isReady,
  }), [language, converters, isReady]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
};
