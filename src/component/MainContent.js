import React, { useState, useEffect, useRef } from 'react';
import $, { data } from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import BasicCalculatorModel from '../model/BasicCalculator';
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

      //幹員職業
      const professionResponse = await fetch(`${process.env.PUBLIC_URL}/json/profession.json`);
      const professionJsonData = await professionResponse.json();
      //幹員分支
      const subProfessionIdResponse = await fetch(`${process.env.PUBLIC_URL}/json/subProfessionId.json`);
      const subProfessionIdJsonData = await subProfessionIdResponse.json();
      //幹員數據 
      const characterResponse = await fetch(`${process.env.PUBLIC_URL}/json/character_table.json`);
      const characterJsonData = await characterResponse.json();

      //幹員模組
      const uniequipResponse = await fetch(`${process.env.PUBLIC_URL}/json/uniequip_table.json`);
      const uniequipJsonData = await uniequipResponse.json();
      console.log(uniequipJsonData);

      
      //幹員數據解讀出來的型別是雙層Object，但dataTable的column只接受陣列，因此需先做轉換     
      let filterCharacterData = Object.values(characterJsonData);
      //幹員數據過濾處
      filterCharacterData = FilterModel.characterDataFilter(filterCharacterData, checkRarity); 
      
      //幹員數據與模組數據結合
      //由於現在有模組系統，幹員的數據計算避不開模組加成
      //但是幹員和模組之間屬於一對多的關係，因此無法只遍歷幹員資料來呈現表格
      //有幾個模組就要再重複增添對應的幾筆幹員資料，讓資料最終依然能以一對一關係呈現
      const processedCharacterData = filterCharacterData;
      // const processedCharacterData = [];
      // for (const key in filterCharacterData) {
      //     if (filterCharacterData.hasOwnProperty(key)) {
      //         const originalMember = filterCharacterData[key];  
      //         const uniequipContentList = BasicCalculatorModel.memberUniequip(filterCharacterData[key], uniequipJsonData);            
      //         uniequipContentList.forEach(e => {               
      //           const MemberCopy = { ...originalMember, uniequip: e };
      //           processedCharacterData.push(MemberCopy);
      //         });
      //     }
      // }
      
      //基礎數值表格
      $(memberTableRef.current).DataTable({ 
        destroy: true,
        data: processedCharacterData,
        pageLength: 20,
        columns: [
          //{ title: "", data: null, render: function (row) { return `<img src="${process.env.PUBLIC_URL}/image/member_icon/${row.name}.png" title="${Calculator.memberDirection(row, desJsonData)}" alt='icon' width='40' height='40' />`; } },
          { title: "名稱", data: "name", },
          { title: "星級", data: "rarity", render: function (data, type, row) { return BasicCalculatorModel.memberRarity(row); } },
          { title: "職業", data: "profession", render: function (data, type, row) { return BasicCalculatorModel.memberProfession(row, professionJsonData).chineseName; } },
          { title: "分支", data: "subProfessionId", render: function (data, type, row) { return BasicCalculatorModel.memberSubProfessionId(row, subProfessionIdJsonData).chineseName; } },
          //{ title: "模組", data: "uniequip", render: function (data, type, row) { return row.uniequip.uniEquipName;} },
          { title: "生命", data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row).maxHp); } },
          { title: "傷害類型", data: null, render: function (data, type, row) { return BasicCalculatorModel.memberSubProfessionId(row, subProfessionIdJsonData).attackType; } },
          { title: "攻擊", data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row).atk); } },
          { title: "防禦", data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row).def); } },
          { title: "法抗", data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row).magicResistance); } },
          { title: "攻擊間隔", data: "phases", render: function (data, type, row) { return BasicCalculatorModel.memberNumeric(whichType, row).baseAttackTime; } },
          { title: "攻速", data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row).attackSpeed); } },
          { title: "DPS", data: null, render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberDps(whichType, row, enemyData, subProfessionIdJsonData)); } },
          { title: "HPS", data: null, render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberHps(whichType, row, enemyData, subProfessionIdJsonData)); } },
          { title: "敵方DPS", data: null, render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.enemyDps(whichType, row, enemyData)); } },
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
      let processedSkillData = Object.values(skillJsonData);
      //資料處理
      processedSkillData = FilterModel.skillDataFilter(processedSkillData, characterJsonData, checkRarity);

      //技能表格(傷害類)
      $(attackSkillTableRef.current).DataTable({
        destroy: true,
        data: processedSkillData,
        pageLength: 20,
        columns: [
          { title: "名稱", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillFromMember(row, processedCharacterData).name; } },
          { title: "技能名稱", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).name; } },
          { title: "冷卻時間", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).spData.spCost; } },
          { title: "持續時間", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).duration; } },
          { title: "彈藥數量", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'attack@trigger_time'); } },  
          { title: "技能類型", data: null, render: function (data, type, row) { return BasicCalculatorModel.memberSubProfessionId(SkillCalculatorModel.skillFromMember(row, processedCharacterData), subProfessionIdJsonData).attackType; } },          
          //{ title: "原始攻擊力", data: null, render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, SkillCalculatorModel.skillFromMember(row, processedCharacterData)).atk); } },
          //{ title: "原始攻擊間隔", data: null, render: function (data, type, row) { return BasicCalculatorModel.memberNumeric(whichType, SkillCalculatorModel.skillFromMember(row, processedCharacterData)).baseAttackTime; } },
          //{ title: "原始攻速", data: null, render: function (data, type, row) { return FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, SkillCalculatorModel.skillFromMember(row, processedCharacterData)).attackSpeed); } },
          { title: "攻擊乘算", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'atk'); } },
          { title: "攻擊倍率", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'atk_scale'); } },
          { title: "攻擊間隔調整", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'base_attack_time'); } },           
          { title: "攻擊速度加算", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'attack_speed'); } },
          { title: "攻擊次數", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'times'); } },
          { title: "無視敵方防禦", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'def_penetrate_fixed'); } },
          { title: "削減敵方防禦", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'def') < 0 ? SkillCalculatorModel.skillAttribute(whichType, row, 'def') : 0; } },
          { title: "削減敵方法抗", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'magic_resistance') < 0 ? SkillCalculatorModel.skillAttribute(whichType, row, 'magic_resistance') : 0; } },
          { title: "天賦效果提升", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'talent_scale'); } },
          { title: "傷害倍率", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'damage_scale'); } },
          { title: "力度", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'force'); } },
          { title: "技能期間DPS", data: null, render: function (data, type, row) { return FilterModel.numberFilter(SkillCalculatorModel.skillMemberDps(whichType, row, processedCharacterData, enemyData, subProfessionIdJsonData)); } },
          { title: "技能總傷", data: null, render: function (data, type, row) { return FilterModel.numberFilter(SkillCalculatorModel.skillMemberTotal(whichType, row, processedCharacterData, enemyData, subProfessionIdJsonData)); } },
          
        ],
        drawCallback: function(settings) {
          $(attackSkillTableRef.current).find('th').css({
            'background-color': '#c5c5c5',
            'color': 'black'
          });
        }
      });
      //技能表格(防禦類)
      $(defSkillTableRef.current).DataTable({
        destroy: true,
        data: processedSkillData,
        pageLength: 20,
        columns: [
          { title: "名稱", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillFromMember(row, processedCharacterData).name; } },
          { title: "技能名稱", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).name; } },
          { title: "冷卻時間", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).spData.spCost; } },
          { title: "持續時間", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillData(whichType, row).duration; } },
          { title: "彈藥數量", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'attack@trigger_time'); } },
          { title: "技能類型", data: null, render: function (data, type, row) { return BasicCalculatorModel.memberSubProfessionId(SkillCalculatorModel.skillFromMember(row, processedCharacterData), subProfessionIdJsonData).attackType; } },   
          { title: "生命提升", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'max_hp'); } },
          { title: "防禦提升", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'def') > 0 ? SkillCalculatorModel.skillAttribute(whichType, row, 'def') : 0; } },
          { title: "我方法抗提升", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'magic_resistance') > 0 ? SkillCalculatorModel.skillAttribute(whichType, row, 'magic_resistance') : 0; } },
          //{ title: "閃避提升", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'prob'); } }, 
          { title: "生命回復", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'heal_scale'); } },
          { title: "每秒固定回血", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'hp_recovery_per_sec'); } }, 
          { title: "每秒百分比回血", data: null, render: function (data, type, row) { return SkillCalculatorModel.skillAttribute(whichType, row, 'hp_recovery_per_sec_by_max_hp_ratio'); } },
       
        ],
        drawCallback: function(settings) {
          $(attackSkillTableRef.current).find('th').css({
            'background-color': '#c5c5c5',
            'color': 'black'
          });
        }
      });
    };
    CookieModel.setCookie('type', whichType);
    CookieModel.setCookie('rarity', checkRarity);
    loadData(whichType);
  }, [whichType, checkRarity, enemyData]); // 每次修改敵人數值或改變流派選擇或勾選星級時就更新網頁並重新初始化表格

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
        <div className='row justify-content-center row-gap-1'>
          <small className="col-12 text-center">{`目前表格呈現的數據已包含以下加成:`}</small>
          <small className="col-12 text-center">{`潛能加成 (生命、攻擊、防禦、法抗、攻速)`}</small>
          <small className="col-12 text-center">{`滿信賴加成 (生命、攻擊、防禦、法抗)`}</small>
          <small className="col-12 text-center">{`天賦加成 (生命、攻擊、防禦、法抗、攻擊間隔、攻速)`}</small>
          <small className="col-12 text-center">{`(還未添加模組加成，以及天賦加成目前只處理了四星以下的數據)`}</small>
          <small className="col-12 text-center">{`(因此精二以及五星六星的數據還不準，請勿參考)`}</small>
        </div> 
      </div>  
      <div className='p-2 m-1 border border-2 rounded-4 bg-light' id='member_table'>
        <div className='table-responsive'>
          <table ref={memberTableRef} className="table table-bordered table-hover display table-light"></table>
        </div>     
      </div>
      <div className='p-2 m-1 border border-2 rounded-4 bg-light' id='attackSkill_table'>
        <div className='row justify-content-center row-gap-1'>
          <small className="col-12 text-center">{`持續時間為-1或0表示其為強力擊、永續類、子彈類的技能`}</small>
        </div>
        <div className='table-responsive'>
          <table ref={attackSkillTableRef} className="table table-bordered table-hover display table-light"></table>
        </div>        
      </div> 
      <div className='p-2 m-1 border border-2 rounded-4 bg-light' id='defSkill_table'>
        <div className='row justify-content-center row-gap-1'>
          <small className="col-12 text-center">{`持續時間為-1或0表示其為強力擊、永續類、子彈類的技能`}</small>
        </div>
        <div className='table-responsive'>
          <table ref={defSkillTableRef} className="table table-bordered table-hover display table-light"></table>
        </div>        
      </div>              
    </div> 
  );
}

export default MainContent;
