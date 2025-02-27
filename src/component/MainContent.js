import React, { useState, useEffect, useRef } from 'react';
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import Calculator from '../model/Calculator';

function MainContent() {
  const [specialJsonData, setSpecialJsonData] = useState(() => {
    return fetch('/special.json')
    .then(response => response.json())
    .then(json => setSpecialJsonData(json))
    .catch(error => console.log('Error loading JSON:', error));
  });
  const [memberJsonData, setMemberJsonData] = useState(() => {
    return fetch('/member.json')
    .then(response => response.json())
    .then(json => setMemberJsonData(json))
    .catch(error => console.log('Error loading JSON:', error));
  });
  const [attackSkillJsonData, setAttackSkillJsonData] = useState(() => {
    return fetch('/attackSkill.json')
    .then(response => response.json())
    .then(json => setAttackSkillJsonData(json))
    .catch(error => console.log('Error loading JSON:', error));
  });
  const [defSkillJsonData, setDefSkillJsonData] = useState(() => {
    return fetch('/defSkill.json')
    .then(response => response.json())
    .then(json => setDefSkillJsonData(json))
    .catch(error => console.log('Error loading JSON:', error));
  });
  
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
    if (memberJsonData.Basic !== undefined) {
      // 使用DataTable套件來製作表格

      // 基本數值表格
      $(memberTableRef.current).DataTable({
        destroy: true,  // 使表格可以重新初始化
        data: memberJsonData.Basic, // 表格使用的資料
        pageLength: 100, // 每頁顯示100筆資料
        columns: [
          { title: "", data: null, render: function(row) {return `<img src=${row.icon} alt='member_icon' width='40' height='40' />`} },
          { title: "名稱", data: "name", render: function(data, type, row) {return Calculator.memberNameRender(data, specialJsonData);}},
          { title: "職業", data: "type" },
          { title: "生命", data: "hp" },
          { title: "傷害類型", data: "attackType" },
          { title: "攻擊", data: "attack" },
          { title: "防禦", data: "def" },
          { title: "法抗", data: "res" },
          { title: "攻速", data: "spd" },
          { title: "DPS", data: null, render: function(data, type, row) {return Calculator.memberDps(row, enemyData);} },
          { title: "擊殺所需時間", data: null, render: function(data, type, row) {return Calculator.memberKillTime(row, enemyData);} },
          { title: "敵方DPS", data: null, render: function(data, type, row) {return Calculator.enemyDps(row, enemyData);} },
        ],
      });

      // 攻擊技能表格
      $(attackSkillTableRef.current).DataTable({
        destroy: true,  // 使表格可以重新初始化
        data: attackSkillJsonData.Basic, // 表格使用的資料
        pageLength: 100, // 每頁顯示100筆資料
        columns: [
          { title: "", data: null, render: function(row) {return `<img src=${Calculator.memberIcon(row, memberJsonData.Basic)} alt='member_icon' width='40' height='40' />`} },
          { title: "名稱", data: "name", render: function(data, type, row) {return Calculator.memberNameRender(data, specialJsonData);}},
          { title: "技能", data: "whichSkill" },
          { title: "傷害類型", data: "attackType" },
          { title: "冷卻時間", data: "waitTime" },
          { title: "持續時間", data: "skillTime" },
          // { title: "直接固定加算", data: "attackFirstAdd" },
          // { title: "直接倍率乘算", data: "attackFirtsMultiply" },
          // { title: "最終固定加算", data: "attackLastAdd" },
          // { title: "最終倍率乘算", data: "attackLastMultiply" },
          // { title: "攻擊間隔縮減", data: "spdAdd" },
          // { title: "攻速提升", data: "spdMultiply" },
          { title: "DPS", data: null, render: function(data, type, row) {return Calculator.memberDps(Calculator.skillMemberRow(row, memberJsonData.Basic), enemyData);} },
          //{ title: "總傷", data: null, render: function(data, type, row) {return (Calculator.memberDps(Calculator.skillMemberRow(row, memberJsonData.Basic), enemyData) * row.skillTime).toFixed(2);} },
          { title: "擊殺所需時間", data: null, render: function(data, type, row) {return Calculator.memberKillTime(Calculator.skillMemberRow(row, memberJsonData.Basic), enemyData);} },
        ],
      });

      //防禦技能表格
      $(defSkillTableRef.current).DataTable({
        destroy: true,  // 使表格可以重新初始化
        data: defSkillJsonData.Basic, // 表格使用的資料
        pageLength: 100, // 每頁顯示100筆資料
        columns: [
          { title: "", data: null, render: function(row) {return `<img src=${Calculator.memberIcon(row, memberJsonData.Basic)} alt='member_icon' width='40' height='40' />`} },
          { title: "名稱", data: "name", render: function(data, type, row) {return Calculator.memberNameRender(data, specialJsonData);}},
          { title: "技能", data: "whichSkill" },
          { title: "技能類型", data: "skillType" },
          { title: "冷卻時間", data: "waitTime" },
          { title: "持續時間", data: "skillTime" },
          // { title: "直接固定加算", data: "skillFirstAdd" },
          // { title: "直接倍率乘算", data: "skillFirtsMultiply" },
          // { title: "最終固定加算", data: "skillLastAdd" },
          // { title: "最終倍率乘算", data: "skillLastMultiply" },
          // { title: "攻擊間隔縮減", data: "spdAdd" },
          // { title: "攻速提升", data: "spdMultiply" },
          { title: "我方DEF", data: null, render: function(data, type, row) {return Calculator.skillMemberRow(row, memberJsonData.Basic).def;} },
          { title: "我方HPS", data: null, render: function(data, type, row) {return Calculator.skillMemberHps(row, memberJsonData.Basic);} },         
          { title: "敵方DPS", data: null, render: function(data, type, row) {return Calculator.enemyDps(Calculator.skillMemberRow(row, memberJsonData.Basic), enemyData);} },
        ],
      });
    }
  }, [enemyData]); // 每次敵人數值改變時就更新網頁並重新初始化表格

  return (
    <div className='container'>
      <div className='d-flex flex-column'>
        <div>     
          <form id='enemy_form'>
            <h1>敵人數據</h1>
            <label htmlFor="enemyHp">生命:</label>
            <input type="number" id="enemyHp" value={enemyHp} onChange={(e) => setEnemyHp(e.target.value)} min="0" required />
            <br></br>
            <label htmlFor="enemyAttackType">傷害類型:</label>
            <label htmlFor="enemyAttackType1">物傷</label>
            <input type="radio" name="enemyAttackType" value="物傷" checked={enemyAttackType === '物傷'} onChange={(e) => setEnemyAttackType(e.target.value)} required />
            <label htmlFor="enemyAttackType2">法傷</label>
            <input type="radio" name="enemyAttackType" value="法傷" checked={enemyAttackType === '法傷'} onChange={(e) => setEnemyAttackType(e.target.value)} />
            <label htmlFor="enemyAttackType3">真傷</label>
            <input type="radio" name="enemyAttackType" value="真傷" checked={enemyAttackType === '真傷'} onChange={(e) => setEnemyAttackType(e.target.value)} />
            <br></br>
            <label htmlFor="enemyAttack">攻擊:</label>
            <input type="number" id="enemyAttack" value={enemyAttack} onChange={(e) => setEnemyAttack(e.target.value)} min="0" required />
            <br></br>
            <label htmlFor="enemyDef">防禦:</label>
            <input type="number" id="enemyDef" value={enemyDef} onChange={(e) => setEnemyDef(e.target.value)} min="0" required />
            <br></br>
            <label htmlFor="enemyRes">法抗:</label>
            <input type="number" id="enemyRes" value={enemyRes} onChange={(e) => setEnemyRes(e.target.value)} min="0" max="100" required />
            <br></br>
            <label htmlFor="enemySpd">攻速:</label>
            <input type="number" id="enemySpd" value={enemySpd} onChange={(e) => setEnemySpd(e.target.value)} min="0" step="0.01" required />
          </form> 
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
              <h1>敵人技能</h1>            
              <small className="mx-3">{`*若技能屬於一次性傷害，填寫 (技能傷害=總傷) (技能造成傷害次數=1)*`}</small>
              <br></br>
              <small className="mx-3">{`*若技能屬於持續性傷害，填寫 (技能傷害=每次造成的傷害) (技能造成傷害次數=傷害次數)*`}</small>
              <br></br>
              <label htmlFor="enemySkillType">技能傷害類型:</label>
              <label htmlFor="enemySkillType1">物傷</label>
              <input type="radio" name="enemySkillType" value="物傷" required />
              <label htmlFor="enemySkillType2">法傷</label>
              <input type="radio" name="enemySkillType" value="法傷" />
              <label htmlFor="enemySkillType3">真傷</label>
              <input type="radio" name="enemySkillType" value="真傷" />
              <br></br>
              <label htmlFor="enemySkillDamage">技能傷害:</label>
              <input type="number" id="enemySkillDamage" name="enemySkillDamage" min="0" required />         
              <br></br>
              <label htmlFor="enemySkillCount">技能造成傷害次數:</label>
              <input type="number" id="enemySkillCount" name="enemySkillCount" min="1" required />
              <br></br>
              <label htmlFor="enemySkillWaitTime">技能冷卻時間:</label>
              <input type="number" id="enemySkillWaitTime" name="enemySkillWaitTime" min="1" required />
              <br></br>
              <button type="submit">新增技能</button>
            </form>
            <div className="container">          
              <div className="d-flex">
              {
                enemySkill.map((group, index) => (
                  <div className="border border-1 p-2 m-2">
                    <button type='button' onClick={() => {
                      const newItems = enemySkill.filter((item, i) => i !== index); 
                      setEnemySkill(newItems);
                      }}>刪除</button>
                    <p>{`技能${index}`}</p>
                    <p>{`技能傷害類型: ${group.enemySkillType}`}</p>
                    <p>{`技能傷害: ${group.enemySkillDamage}`}</p>
                    <p>{`技能造成傷害次數: ${group.enemySkillCount}`}</p>
                    <p>{`技能冷卻時間: ${group.enemySkillWaitTime}`}</p>
                  </div>
                ))
              }
              </div> 
            </div>              
        </div>
        <hr></hr>
        <p>以下表格的我方面板數值皆以精1滿級滿潛能滿信賴為準</p>
        <p>名稱帶有+表示其面板數值為經天賦加成後的最終結果 (ex: 香草的天賦為攻擊力+8%)</p>
        <p>名稱帶有*表示其打出的數值為受職業特性或天賦影響後的最終結果 (ex: 酸糖的天賦為至少造成20%傷害，因此刮痧時打出的保底傷害與正常幹員的5%不一樣需另外計算)</p>
        <p>名稱帶有%表示其打出的數值可能受職業特性或天賦影響而打的更高，但由於是概率或必須滿足特定條件才觸發，因此不帶入計算，只計算無觸發的正常數值</p>
        <p>(幹員頭像取自PRTS)</p>
        <table id='member_table' ref={memberTableRef} className="table table-bordered table-hover display"></table>
        <hr></hr>
        <table id='attackSkill_table' ref={attackSkillTableRef} className="table table-bordered table-hover display"></table>
        <hr></hr>
        <p>以下表格的持續時間為-1表示其為強力擊類型的技能，此類技能的HPS計算方式不屬於通常算法(攻擊力/攻速)，而是改用(攻擊力/冷卻時間)的方式計算</p>
        <table id='defSkill_table' ref={defSkillTableRef} className="table table-bordered table-hover display"></table>
      </div>
    </div> 
  );
}

export default MainContent;
