import React, { useState, useEffect, useRef } from 'react';
import $, { data } from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import BasicCalculatorModel from '../model/BasicCalculator';
import UniequipCalculatorModel from '../model/UniequipCalculator';
import SkillCalculatorModel from '../model/SkillCalculator';
import CookieModel from '../model/Cookie';
import FilterModel from '../model/Filter';

function MainContent() {
  const [whichType, setWhichType] = useState(CookieModel.getCookie('type'));
  const [checkRarity, setCheckRarity] = useState(CookieModel.getCookie('rarity'));
  
  const [enemyHp, setEnemyHp] = useState(10000);
  const [enemyAttackType, setEnemyAttackType] = useState('物傷');
  const [enemyAttack, setEnemyAttack] = useState(500);
  const [enemyDef, setEnemyDef] = useState(0);
  const [enemyRes, setEnemyRes] = useState(0);
  const [enemySpd, setEnemySpd] = useState(1);
  const [enemySkill, setEnemySkill] = useState([]);
  const enemyData = {enemyHp, enemyAttackType, enemyAttack, enemyDef, enemyRes, enemySpd, enemySkill }
  const [search, setSearch] = useState(false);
  const [candidates, setCandidates] = useState(false);
  const [candidatesStyle, setCandidatesStyle] = useState("col-4 col-md-3 text-left border border-1 rounded");

  const memberTableRef = useRef(null);
  const attackSkillTableRef = useRef(null); 
  const defSkillTableRef = useRef(null); 

  useEffect(() => {
    const loadData = async (type) => {
      let witchPhases = 0;
      let witchAttributesKeyFrames = 0;
      
      //指定階級與等級
      switch(type){
        case '精零1級':
          witchPhases = 0;
          witchAttributesKeyFrames = 0;
        break;
        case '精零滿級':
          witchPhases = 0;
          witchAttributesKeyFrames = 1;
        break;
        case '精一1級':
          witchPhases = 1;
          witchAttributesKeyFrames = 0;
        break;
        case '精一滿級':
          witchPhases = 1;
          witchAttributesKeyFrames = 1;
        break;
        case '精二1級':
          witchPhases = 2;
          witchAttributesKeyFrames = 0;
        break;
        case '精二滿級':
          witchPhases = 2;
          witchAttributesKeyFrames = 1;
        break;
      }

      //初始化log輸出狀態
      CookieModel.setLog('memberNumeric', false);
      CookieModel.setLog('memberTalent', false);     
      CookieModel.setLog('memberEquip', false); 
      CookieModel.setLog('memberEquip_check', []); 
      CookieModel.setLog('memberDph', false);
      CookieModel.setLog('memberDph_check', []);
      CookieModel.setLog('memberDps', false);
      CookieModel.setLog('memberDps_check', []);  

      //幹員職業
      const professionResponse = await fetch(`${process.env.PUBLIC_URL}/json/profession.json`);
      const professionJsonData = await professionResponse.json();
      //幹員分支
      const subProfessionIdResponse = await fetch(`${process.env.PUBLIC_URL}/json/subProfessionId.json`);
      const subProfessionIdJsonData = await subProfessionIdResponse.json();
      //幹員數據 
      const characterResponse = await fetch(`${process.env.PUBLIC_URL}/json/character_table.json`);
      const characterJsonData = await characterResponse.json();console.log('全幹員數據',characterJsonData);

      //幹員模組資訊
      const uniequipResponse = await fetch(`${process.env.PUBLIC_URL}/json/uniequip_table.json`);
      const uniequipJsonData = await uniequipResponse.json();console.log('全幹員模組資訊',uniequipJsonData);

      //幹員模組數據
      const battleEquipResponse = await fetch(`${process.env.PUBLIC_URL}/json/battle_equip_table.json`);
      const battleEquipJsonData = await battleEquipResponse.json();console.log('全幹員模組數據',battleEquipJsonData);

      //編輯JSON用參考代碼
      // const abcResponse = await fetch(`${process.env.PUBLIC_URL}/json/技能數據簡化版.json`);
      // const abcJsonData = await abcResponse.json();
      // Object.values(abcJsonData).forEach(item => {
      //   if (item.levels && Array.isArray(item.levels) && item.levels.length > 0) {
      //     // 將 item.levels 替換為一個只包含其最後一個元素的新陣列
      //     item.levels = [item.levels[item.levels.length - 1]];
      //   } else {
      //     // 如果 levels 陣列是空的、不存在，或不是陣列，則將其設置為一個空陣列 []
      //     item.levels = []; 
      //   }
      // });
      // console.log(abcJsonData);
      
      //幹員數據解讀出來的型別是雙層Object，但dataTable的column只接受陣列，因此需先做轉換     
      let filterCharacterData = Object.values(characterJsonData);
      //幹員數據過濾處理
      filterCharacterData = FilterModel.characterDataFilter(filterCharacterData, checkRarity); 
      const processedCharacterData = filterCharacterData;
      
      //由於現在有模組系統，幹員的數據計算避不開模組加成
      //但是幹員和模組之間屬於一對多的關係，因此無法只遍歷幹員資料來呈現表格
      //有幾個模組就要再重複增添對應的幾筆幹員資料，讓資料最終依然能以一對一關係呈現

      //幹員數據與模組數據結合 
      if(witchPhases === 2){
        for (const key in filterCharacterData) {
          if (filterCharacterData.hasOwnProperty(key)) {
            const currentMember = filterCharacterData[key];  
            const uniequipContentList = UniequipCalculatorModel.memberEquipID(currentMember, uniequipJsonData);  
            if(uniequipContentList) {
              uniequipContentList.forEach(e => {               
                //在原幹員數據上另外添加上equipid屬性，equipid屬性對應模組ID
                const MemberCopy = { ...currentMember, equipid: e };
                //由於在原數據，有模組的幹員其模組ID array的第一筆總是預設的空模組
                //因此要做判斷，不要將空模組資料插入幹員數據，否則原幹員數據+空模組資料會重複到
                if(e.includes("_001_") === false){
                  processedCharacterData.push(MemberCopy);
                }            
              });
            }               
          }
        }
      }                
      
      //基礎數值表格
      $(memberTableRef.current).DataTable({ 
        destroy: true,
        data: processedCharacterData,
        pageLength: 20,
        processing: true,
        language: {
          processing: "數據載入中，請稍候..." // 自定義提示文字
        },
        columns: [
          //{ title: "", data: null, render: function (row) { return `<img src="${process.env.PUBLIC_URL}/image/member_icon/${row.name}.png" title="${Calculator.memberDirection(row, desJsonData)}" alt='icon' width='40' height='40' />`; } },
          { title: "名稱", data: "name", },
          { title: "星級", data: "rarity", render: function (data, type, row) { return BasicCalculatorModel.memberRarity(row); } },
          { title: "職業", data: "profession", render: function (data, type, row) { return BasicCalculatorModel.memberProfession(row, professionJsonData).chineseName; } },
          { title: "分支", data: "subProfessionId", render: function (data, type, row) { return BasicCalculatorModel.memberSubProfessionId(row, subProfessionIdJsonData).chineseName; } },
          { title: "模組", data: "equipid", 
            render: function (data, type, row) {
              const equipData = UniequipCalculatorModel.memberEquipData(row, uniequipJsonData);
              if(equipData){
                  return equipData.uniEquipName;
              }
              else{
                return `${row.name}证章`;
              }
            } 
          },
          { title: "生命", data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).maxHp); } },
          { title: "傷害類型", data: null, render: function (data, type, row) { return BasicCalculatorModel.memberSubProfessionId(row, subProfessionIdJsonData).attackType; } },
          { title: "攻擊", data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).atk); } },
          { title: "防禦", data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).def); } },
          { title: "法抗", data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).magicResistance); } },
          { title: "攻擊間隔", data: "phases", render: function (data, type, row) { return BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).baseAttackTime; } },
          { title: "攻速", data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).attackSpeed); } },
          //{ title: "DPS", data: null, render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberDps(whichType, row, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData)); } },
          //{ title: "HPS", data: null, render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberHps(whichType, row, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData)); } },
          //{ title: "敵方DPS", data: null, render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.enemyDps(whichType, row, enemyData, uniequipJsonData, battleEquipJsonData)); } },
        ],
        order: [
          [0, 'asc'], // 索引[0]欄位 = 名稱 asc = 升序
          [4, 'asc'], // 索引[4]欄位 = 模組 asc = 升序
        ],
        drawCallback: function(settings) {
          $(memberTableRef.current).find('th').css({
            'background-color': '#c5c5c5',
            'color': 'black'
          });
        }
      });

      //技能數據 
      const skillResponse = await fetch(`${process.env.PUBLIC_URL}/json/skill_table.json`);
      const skillJsonData = await skillResponse.json();

      //技能數據解讀出來的型別是雙層Object，但dataTable的column只接受陣列，因此需先做轉換
      let filterSkillData = Object.values(skillJsonData);
      //資料處理
      filterSkillData = FilterModel.skillDataFilter(filterSkillData, characterJsonData, checkRarity);
      const processedSkillData = filterSkillData;

      //技能數據與模組數據結合 
      if(witchPhases === 2){
        for (const key in filterSkillData) {
          if (filterSkillData.hasOwnProperty(key)) {
            const currentMember = SkillCalculatorModel.skillFromMember(filterSkillData[key], processedCharacterData);  
            const uniequipContentList = UniequipCalculatorModel.memberEquipID(currentMember, uniequipJsonData);  
            if(uniequipContentList) {
              uniequipContentList.forEach(e => {               
                //在原幹員數據上另外添加上equipid屬性，equipid屬性對應模組ID
                const SkillCopy = { ...filterSkillData[key], equipid: e };
                //由於在原數據，有模組的幹員其模組ID array的第一筆總是預設的空模組
                //因此要做判斷，不要將空模組資料插入幹員數據，否則原幹員數據+空模組資料會重複到
                if(e.includes("_001_") === false){
                  processedSkillData.push(SkillCopy);
                } 
              });
            }               
          }
        }
      }      

      //技能表格(傷害類)
      $(attackSkillTableRef.current).DataTable({
        destroy: true,
        data: processedSkillData,
        pageLength: 20,
        processing: true,
        language: {
          processing: "數據載入中，請稍候..." // 自定義提示文字
        },
        columns: [
          { title: "名稱", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillFromMember(row, processedCharacterData).name; } },
          { title: "星級", data: "rarity", render: function (data, type, row) { return BasicCalculatorModel.memberRarity(SkillCalculatorModel.skillFromMember(row, processedCharacterData)); } },
          { title: "職業", data: "profession", render: function (data, type, row) { return BasicCalculatorModel.memberProfession(SkillCalculatorModel.skillFromMember(row, processedCharacterData), professionJsonData).chineseName; } },
          { title: "分支", data: "subProfessionId", render: function (data, type, row) { return BasicCalculatorModel.memberSubProfessionId(SkillCalculatorModel.skillFromMember(row, processedCharacterData), subProfessionIdJsonData).chineseName; } },
          { title: "模組", data: "equipid", 
            render: function (data, type, row) { 
              const equipData = UniequipCalculatorModel.memberEquipData(SkillCalculatorModel.skillFromMember(row, processedCharacterData), uniequipJsonData);
              if(equipData){
                  return equipData.uniEquipName;
              }
              else{
                return `${SkillCalculatorModel.skillFromMember(row, processedCharacterData).name}证章`;
              }
            } 
          },
          { title: "技能名稱", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).name; } },
          { title: "冷卻時間", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).spData.spCost; } },
          { title: "持續時間", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).duration; } },
          { title: "彈藥數量", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'attack@trigger_time'); } },  
          { title: "技能類型", data: null, render: function (data, type, row) { return BasicCalculatorModel.memberSubProfessionId(SkillCalculatorModel.skillFromMember(row, processedCharacterData), subProfessionIdJsonData).attackType; } },          
          //{ title: "原始攻擊力", data: null, render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, SkillCalculatorModel.skillFromMember(row, processedCharacterData), uniequipJsonData, battleEquipJsonData).atk); } },
          //{ title: "原始攻擊間隔", data: null, render: function (data, type, row) { return BasicCalculatorModel.memberNumeric(whichType, SkillCalculatorModel.skillFromMember(row, processedCharacterData), uniequipJsonData, battleEquipJsonData).baseAttackTime; } },
          //{ title: "原始攻速", data: null, render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, SkillCalculatorModel.skillFromMember(row, processedCharacterData), uniequipJsonData, battleEquipJsonData).attackSpeed); } },
          { title: "攻擊乘算", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'atk'); } },
          { title: "攻擊倍率", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'atk_scale'); } },
          { title: "攻擊間隔調整", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'base_attack_time'); } },           
          { title: "攻擊速度調整", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'attack_speed'); } },
          //{ title: "連擊數", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'ATTACK_COUNT'); } },          
          { title: "攻擊段數", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'times'); } },
          //{ title: "無視敵方防禦", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'def_penetrate_fixed'); } },
          //{ title: "削減敵方防禦", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'def') < 0 ? SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'def') : 0; } },
          //{ title: "削減敵方法抗", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'magic_resistance') < 0 ? SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'magic_resistance') : 0; } },
          //{ title: "天賦效果提升", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'talent_scale'); } },
          //{ title: "傷害倍率", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'damage_scale'); } },
          //{ title: "力度", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, characterJsonData, 'force'); } },
          { title: "技能期間DPS", data: null, render: function (data, type, row) { return FilterModel.numberFilter(SkillCalculatorModel.skillMemberDps(whichType, row, processedCharacterData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates)); } },
          { title: "技能總傷", data: null, render: function (data, type, row) { return FilterModel.numberFilter(SkillCalculatorModel.skillMemberTotal(whichType, row, processedCharacterData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates)); } },
          
        ],
        order: [
          [0, 'asc'], // 索引[0]欄位 = 名稱 asc = 升序
          [4, 'asc'], // 索引[4]欄位 = 模組 asc = 升序
        ],
        drawCallback: function(settings) {
          $(attackSkillTableRef.current).find('th').css({
            'background-color': '#c5c5c5',
            'color': 'black'
          });
        }
      });
      //技能表格(防禦類)
      // $(defSkillTableRef.current).DataTable({
      //   destroy: true,
      //   data: processedSkillData,
      //   pageLength: 20,
      //   processing: true,
      //   language: {
      //     processing: "數據載入中，請稍候..." // 自定義提示文字
      //   },
      //   columns: [
      //     { title: "名稱", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillFromMember(row, processedCharacterData).name; } },
      //     { title: "技能名稱", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).name; } },
      //     { title: "冷卻時間", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).spData.spCost; } },
      //     { title: "持續時間", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).duration; } },
      //     { title: "彈藥數量", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'attack@trigger_time'); } },
      //     { title: "技能類型", data: null, render: function (data, type, row) { return BasicCalculatorModel.memberSubProfessionId(SkillCalculatorModel.skillFromMember(row, processedCharacterData), subProfessionIdJsonData).attackType; } },   
      //     { title: "生命提升", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'max_hp'); } },
      //     { title: "防禦提升", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'def') > 0 ? SkillCalculatorModel.skillCustomAttribute(whichType, row, 'def') : 0; } },
      //     { title: "我方法抗提升", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'magic_resistance') > 0 ? SkillCalculatorModel.skillCustomAttribute(whichType, row, 'magic_resistance') : 0; } },
      //     { title: "閃避提升", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, characterJsonData, 'prob'); } }, 
      //     { title: "生命回復", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'heal_scale'); } },
      //     { title: "每秒固定回血", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'hp_recovery_per_sec'); } }, 
      //     { title: "每秒百分比回血", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, 'hp_recovery_per_sec_by_max_hp_ratio'); } },
       
      //   ],
      //   order: [
      //     [0, 'asc'], // 索引[0]欄位 = 名稱 asc = 升序
      //     [4, 'asc'], // 索引[4]欄位 = 模組 asc = 升序
      //   ],
      //   drawCallback: function(settings) {
      //     $(attackSkillTableRef.current).find('th').css({
      //       'background-color': '#c5c5c5',
      //       'color': 'black'
      //     });
      //   }
      // });
    };
    CookieModel.setCookie('type', whichType);
    CookieModel.setCookie('rarity', checkRarity);
    loadData(whichType);
  }, [whichType, checkRarity, search, candidates]); // 改變流派選擇、勾選星級、點擊查詢、勾選模組特性追加，更新網頁並重新初始化表格

  return (
    <div className='container'>  
      <div className='p-2 m-1 border border-2 rounded-4 bg-light' id='enemy_form'>
        <div className='row justify-content-center'>
          <h3 className='col-12 text-center'>敵人數據</h3>
        </div>  
        <form>
          <div className='row justify-content-start justify-content-md-center align-items-center row-gap-1 p-1'>
            <label className='col-2 col-md-1 text-center' htmlFor="enemyHp">生命</label>
            <input className='col-3 col-md-2' type="number" id="enemyHp" value={enemyHp} onChange={(e) => setEnemyHp(e.target.value)} min="0" required />
            <label className='col-2 col-md-1 text-center' htmlFor="enemyAttack">攻擊</label>
            <input className='col-3 col-md-2' type="number" id="enemyAttack" value={enemyAttack} onChange={(e) => setEnemyAttack(e.target.value)} min="0" required />
            <label className='col-3 col-md-1 text-center' htmlFor="enemyAttackType">傷害類型</label>
            <div className='col-7 col-md-2 justify-content-around align-items-center d-flex'>          
              <input type="radio" name="enemyAttackType" value="物傷" checked={enemyAttackType === '物傷'} onChange={(e) => setEnemyAttackType(e.target.value)} required />
              <label htmlFor="enemyAttackType1">物傷</label>
              <input type="radio" name="enemyAttackType" value="法傷" checked={enemyAttackType === '法傷'} onChange={(e) => setEnemyAttackType(e.target.value)} />
              <label htmlFor="enemyAttackType2">法傷</label>
              <input type="radio" name="enemyAttackType" value="真傷" checked={enemyAttackType === '真傷'} onChange={(e) => setEnemyAttackType(e.target.value)} />
              <label htmlFor="enemyAttackType3">真傷</label>
            </div>
          </div>
          <div className='row justify-content-start justify-content-md-center align-items-center row-gap-1 p-1'>
            <label className='col-2 col-md-1 text-center' htmlFor="enemyDef">防禦</label>
            <input className='col-3 col-md-2' type="number" id="enemyDef" value={enemyDef} onChange={(e) => setEnemyDef(e.target.value)} min="0" required />
            <label className='col-2 col-md-1 text-center' htmlFor="enemyRes">法抗</label>
            <input className='col-3 col-md-2' type="number" id="enemyRes" value={enemyRes} onChange={(e) => setEnemyRes(e.target.value)} min="0" max="100" required />
            <div className='d-block d-md-none col-2'></div>
            <label className='col-2 col-md-1 text-center' htmlFor="enemySpd">攻速</label>
            <input className='col-3 col-md-2' type="number" id="enemySpd" value={enemySpd} onChange={(e) => setEnemySpd(e.target.value)} min="0" step="0.01" required />
          </div>        
        </form>
      </div>
      <div className='p-2 m-1 border border-2 rounded-4 bg-light'>
        <div className='row justify-content-center row-gap-1'>
          <h3 className='col-12 text-center'>敵人技能</h3>
          <small className="col-12 text-center">{`若技能屬於一次性傷害，填寫 (技能傷害 = 總傷) (傷害次數 = 1)`}</small>
          <small className="col-12 text-center">{`若技能屬於持續性傷害，填寫 (技能傷害 = 每次造成的傷害) (傷害次數 = 傷害次數)`}</small>
        </div>  
        <form onSubmit={(e) => {
            e.preventDefault()
            const formElements = e.target.elements;
            const formData = {
              enemySkillType: formElements.enemySkillType.value,
              enemySkillDamage: formElements.enemySkillDamage.value,
              enemySkillCount: formElements.enemySkillCount.value,
              enemySkillWaitTime: formElements.enemySkillWaitTime.value,
            };
            setEnemySkill((prevSkills) => [...prevSkills, formData]);  
          }}>    
          <div className='row justify-content-start justify-content-md-center align-items-center p-1'>
            <label className='col-3 col-md-1 text-center' htmlFor="enemySkillDamage">技能傷害</label>
            <input className='col-7 col-md-2' type="number" id="enemySkillDamage" name="enemySkillDamage" min="0" required /> 
            <label className='col-3 col-md-1 text-center' htmlFor="enemySkillCount">傷害次數</label>
            <input className='col-7 col-md-2' type="number" id="enemySkillCount" name="enemySkillCount" min="1" required />   
          </div>
          <div className='row justify-content-start justify-content-md-center align-items-center p-1'>
            <label className='col-3 col-md-1 text-center' htmlFor="enemySkillType">傷害類型</label>
            <div className='col-7 col-md-2 justify-content-around align-items-center d-flex'>                    
              <input type="radio" name="enemySkillType" value="物傷" required />
              <label htmlFor="enemySkillType1">物傷</label>          
              <input type="radio" name="enemySkillType" value="法傷" />
              <label htmlFor="enemySkillType2">法傷</label>          
              <input type="radio" name="enemySkillType" value="真傷" />
              <label htmlFor="enemySkillType3">真傷</label>
            </div>
            <label className='col-3 col-md-1 text-center' htmlFor="enemySkillWaitTime">冷卻時間</label>
            <input className='col-7 col-md-2' type="number" id="enemySkillWaitTime" name="enemySkillWaitTime" min="1" required />
          </div>   
          <div className='row justify-content-center align-items-center p-1'>
            <button className='col-4 col-md-2 btn btn-danger' type="submit">新增技能</button>
          </div>                 
        </form>  
        <div className="row justify-content-center">
        {
          enemySkill.map((group, index) => (
            <div className="col-10 col-md-2 m-2 border border-2 rounded-4 bg-light">
              <div className="d-flex flex-column p-2">
                <div className='row justify-content-center align-items-center'>
                  <span className='col-6 text-center'>{`技能${index}`}</span>
                  <div  className='col-6 d-flex justify-content-end'>
                    <button className='btn btn-close' type='button' onClick={() => {
                      const newItems = enemySkill.filter((item, i) => i !== index); 
                      setEnemySkill(newItems);
                      }}></button>
                  </div> 
                  <span className='col-6 text-center'>{`傷害類型:`}</span>
                  <span className='col-6'>{`${group.enemySkillType}`}</span>
                  <span className='col-6 text-center'>{`技能傷害:`}</span>
                  <span className='col-6'>{`${group.enemySkillDamage}`}</span>
                  <span className='col-6 text-center'>{`傷害次數:`}</span>
                  <span className='col-6'>{`${group.enemySkillCount}`}</span>
                  <span className='col-6 text-center'>{`冷卻時間:`}</span>
                  <span className='col-6'>{`${group.enemySkillWaitTime}`}</span>
                </div>
              </div>
            </div>
          ))
        }
        </div>
      </div> 
      <div className='p-2 m-1 border border-2 rounded-4 bg-light'>
        <div className="row justify-content-around row-gap-1 p-2">     
          <button className={ `${whichType === '精零1級'? 'btn btn-primary' : 'btn btn-secondary'} col-7 col-md-3` } onClick={() => { setWhichType('精零1級'); }}>精零1級</button>
          <button className={ `${whichType === '精零滿級'? 'btn btn-primary' : 'btn btn-secondary'} col-7 col-md-3` } onClick={() => { setWhichType('精零滿級'); }}>精零滿級</button>
          <button className={ `${whichType === '精一1級'? 'btn btn-primary' : 'btn btn-secondary'} col-7 col-md-3` } onClick={() => { setWhichType('精一1級'); }}>精一1級</button>
        </div>
        <div className="row justify-content-around row-gap-1 p-2">     
          <button className={ `${whichType === '精一滿級'? 'btn btn-primary' : 'btn btn-secondary'} col-7 col-md-3` } onClick={() => { setWhichType('精一滿級'); }}>精一滿級</button>
          <button className={ `${whichType === '精二1級'? 'btn btn-primary' : 'btn btn-secondary'} col-7 col-md-3` } onClick={() => { setWhichType('精二1級'); }}>精二1級</button>
          <button className={ `${whichType === '精二滿級'? 'btn btn-primary' : 'btn btn-secondary'} col-7 col-md-3` } onClick={() => { setWhichType('精二滿級'); }}>精二滿級</button>
        </div>
        <div className="row justify-content-around row-gap-1 p-2">     
          <input type="checkbox" className='col-2 col-md-1' checked={checkRarity["TIER_1"]} onChange={(event) => { setCheckRarity((pre) => ({ ...pre, ["TIER_1"]: event.target.checked, })); }} />
          <label className='col-2 col-md-1'>一星</label>
          <input type="checkbox" className='col-2 col-md-1' checked={checkRarity["TIER_2"]} onChange={(event) => { setCheckRarity((pre) => ({ ...pre, ["TIER_2"]: event.target.checked, })); }} />
          <label className='col-2 col-md-1'>二星</label>
          <input type="checkbox" className='col-2 col-md-1' checked={checkRarity["TIER_3"]} onChange={(event) => { setCheckRarity((pre) => ({ ...pre, ["TIER_3"]: event.target.checked, })); }} />
          <label className='col-2 col-md-1'>三星</label>
          <input type="checkbox" className='col-2 col-md-1' checked={checkRarity["TIER_4"]} onChange={(event) => { setCheckRarity((pre) => ({ ...pre, ["TIER_4"]: event.target.checked, })); }} />
          <label className='col-2 col-md-1'>四星</label>
          <input type="checkbox" className='col-2 col-md-1' checked={checkRarity["TIER_5"]} onChange={(event) => { setCheckRarity((pre) => ({ ...pre, ["TIER_5"]: event.target.checked, })); }} />
          <label className='col-2 col-md-1'>五星</label>
          <input type="checkbox" className='col-2 col-md-1' checked={checkRarity["TIER_6"]} onChange={(event) => { setCheckRarity((pre) => ({ ...pre, ["TIER_6"]: event.target.checked, })); }} />
          <label className='col-2 col-md-1'>六星</label>
        </div>
        <div className="row justify-content-around row-gap-1 p-2">     
          <button className='btn btn-primary col-9 col-md-5' onClick={() => { setSearch(!search); }}>查詢</button>
        </div>
         
      </div>  
      <div className='p-2 m-1 border border-2 rounded-4 bg-light' id='member_table'>
        <div className='row justify-content-center row-gap-1'>
          <small className="col-12 text-center">{`目前表格呈現的數據已包含以下加成:`}</small>
          <small className="col-12 text-center">{`潛能加成 (生命、攻擊、防禦、法抗、攻速)`}</small>
          <small className="col-12 text-center">{`滿信賴加成 (生命、攻擊、防禦、法抗)`}</small>
          <small className="col-12 text-center">{`天賦加成 (生命、攻擊、防禦、法抗、攻擊間隔、攻速)`}</small>
          <small className="col-12 text-center">{`模組加成 (生命、攻擊、防禦、法抗、攻速)`}</small>
          <small className="col-12 text-center">{`(五星和六星的天賦數據還未處理完畢，因此五星和六星的數據還不準，請勿參考)`}</small>
        </div>
        <div className='table-responsive'>
          <table ref={memberTableRef} className="table table-bordered table-hover display table-light"></table>
        </div>     
      </div>
      <div className='p-2 m-1 border border-2 rounded-4 bg-light' id='attackSkill_table'>
        <div className='row justify-content-center row-gap-1'>
          <small className="col-12 text-center">{`持續時間為-1或0表示其為強力擊、永續類、子彈類的技能`}</small>
          <small className="col-12 text-center">{`技能與天賦中含有概率或是條件觸發的，一律不計算，默認沒有觸發`}</small>
          <small className="col-12 text-center">{`模組的特性追加中與傷害計算無關的屬性，一律不計算，默認沒有觸發`}</small>
          <small className="col-12 text-center">{`模組的特性追加中含有概率或是條件觸發的，預設沒有觸發，但可勾選下列選項觸發`}</small>  
          <div className="col-12 text-center my-2">
            <input type="checkbox" className='col-2 col-md-1' checked={candidates} onChange={(event) => { setCandidates(event.target.checked); }} />
            <span className="col-6 text-danger">{`是否觸發所有含有概率或是條件觸發的模組特性追加?`}</span>
          </div>                                   
          <small className="col-12 text-center">{`(模組更新天賦數據還未處理完畢，因此精2帶模組的數據都還不準，請勿參考)`}</small>
          <a className="col-12 text-center" data-bs-toggle="collapse" href="#collapseCandidates" role="button" aria-expanded="false" aria-controls="collapseCandidates">{`點此詳細了解目前觸發的模組特性追加`}</a>
          <div class="collapse col-12" id="collapseCandidates">
          <div class="card card-body border border-2 border-secondary">
            <div className='row justify-content-start row-gap-1'>
              <small className="col-12 text-left">{`先鋒:`}</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>衝鋒手Y模:<br/> 攻擊生命低於一定比例的敵人時提升攻擊倍率</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>尖兵X模:<br/> 阻擋敵人時提升攻擊力</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>戰術家Y模:<br/> 攻擊援軍阻擋的敵人時提升攻擊倍率</small>
              <small className="col-12 text-left">{`近衛:`}</small> 
              <small className={ candidates ? candidatesStyle : 'd-none' }>無畏者X模:<br/> 攻擊阻擋的敵人時提升攻擊倍率</small>     
              <small className={ candidates ? candidatesStyle : 'd-none' }>無畏者Y模:<br/> 首次被擊倒不撤退並減少一定比例最大生命和提升攻擊速度</small> 
              <small className={ candidates ? candidatesStyle : 'd-none' }>術戰者X模:<br/> 未阻擋敵人時提升攻擊速度</small>  
              <small className={ candidates ? candidatesStyle : 'd-none' }>術戰者Y模:<br/> 自身阻擋的敵人獲得一定比例的法術脆弱</small> 
              <small className={ candidates ? candidatesStyle : 'd-none' }>鬥士Y模:<br/> 生命高於一定比例時提升攻擊速度</small>                      
              <small className={ candidatesStyle }>劍豪X模:<br/> 提升造成傷害</small>
              <small className={ candidatesStyle }>劍豪Y模:<br/> 無視防禦</small>  
              <small className={ candidates ? candidatesStyle : 'd-none' }>強攻手X模:<br/> 攻擊阻擋的敵人時提升攻擊倍率</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>撼地者X模:<br/> 濺射範圍有3名以上敵人時提升攻擊倍率</small>
              <small className={ candidatesStyle }>領主X模:<br/> 造成額外法傷</small>  
              <small className={ candidates ? candidatesStyle : 'd-none' }>領主Y模(數據有問題):<br/> 攻擊範圍有2名以上敵人時提升攻擊速度</small>     
              <small className={ candidates ? candidatesStyle : 'd-none' }>教官X模:<br/> 攻擊自身未阻擋的敵人時提升攻擊倍率</small>                                         
              <small className="col-12 text-left">{`狙擊:`}</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>速射手X模:<br/> 攻擊空中敵人時提升攻擊倍率</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>速射手Y模(數據有問題):<br/> 攻擊範圍有地面敵人時提升攻擊速度</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>神射手X模(數據有問題):<br/> 攻擊距離越遠的人造成越高傷害</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>攻城手X模(數據有問題):<br/> 攻擊重量&gt;3的敵人時提升攻擊倍率</small> 
              <small className={ candidates ? candidatesStyle : 'd-none' }>炮手X模:<br/> 攻擊阻擋的敵人時提升攻擊倍率</small> 
              <small className={ candidatesStyle }>炮手Y模:<br/> 無視防禦</small>  
              <small className={ candidatesStyle }>散射手X模:<br/> 攻擊前方一橫排的敵人時提升更高攻擊倍率</small> 
              <small className={ candidatesStyle }>投擲手X模:<br/> 造成二次額外傷害</small>   
              <small className="col-12 text-left">{`術師:`}</small>
              <small className={ candidatesStyle }>中堅術師X模:<br/> 無視法抗</small> 
              <small className={ candidatesStyle }>御械術師Y模:<br/> 浮游單元傷害上限提升</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>秘術師Y模(數據有問題):<br/> 有儲存攻擊能量時提升攻擊速度</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>塑靈術師X模:<br/> 攻擊召喚物阻擋的敵人時提升攻擊倍率</small> 
              <small className={ candidates ? candidatesStyle : 'd-none' }>轟擊術師X模(數據有問題):<br/> 攻擊距離越遠的人造成越高傷害</small>  
              <small className={ candidates ? candidatesStyle : 'd-none' }>陣法術師Y模(數據有問題):<br/> 攻擊範圍有越多敵人時造成越高傷害</small>              
              <small className="col-12 text-left">{`重裝:`}</small>
              <small className={ candidatesStyle }>要塞Y模: 提升攻擊速度</small>   
              <small className="col-12 text-left">{`醫療:`}</small>
              <small className="col-12 text-left">{`輔助:`}</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>吟遊者X模(數據有問題):<br/> 攻擊範圍有2名以上幹員時提升攻擊力</small>  
              <small className="col-12 text-left">{`特種:`}</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>處決者Y模:<br/> 周圍沒有幹員時提升攻擊力</small>
              <small className={ candidates ? candidatesStyle : 'd-none' }>行商Y模(數據有問題):<br/> 每次特性消耗費用時提升攻擊力(可疊加)</small>  
            </div>             
          </div>
        </div>
        </div>
        <div className='table-responsive'>
          <table ref={attackSkillTableRef} className="table table-bordered table-hover display table-light"></table>
        </div>        
      </div> 
      {/* <div className='p-2 m-1 border border-2 rounded-4 bg-light' id='defSkill_table'>
        <div className='row justify-content-center row-gap-1'>
          <small className="col-12 text-center">{`持續時間為-1或0表示其為強力擊、永續類、子彈類的技能`}</small>
          <small className="col-12 text-center">{`技能與天賦中含有概率或是條件觸發的一律不計算，默認全程沒有觸發`}</small>
        </div>
        <div className='table-responsive'>
          <table ref={defSkillTableRef} className="table table-bordered table-hover display table-light"></table>
        </div>        
      </div>               */}
    </div> 
  );
}

export default MainContent;
