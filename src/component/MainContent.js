import React, { useState, useEffect, useRef } from 'react';
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import Calculator from '../model/Calculator';

function MainContent() {
  const [whichType, setWhichType] = useState(getCookie('type'));
  
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

  //取得Cookie
  function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].split('=');
      if (cookie[0] === name) {
        return cookie[1] || '1604';
      }
    }
    return '1604'; 
  }
  //設置Cookie
  function setCookie(type) {
    let expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); //設定Cookier在7天後過期
    document.cookie = `type=${type}; expires=${expirationDate.toUTCString()}; path=/;`;
  }

  useEffect(() => {
    const loadData = async (type) => {
      let witchMember = 'member1604.json';
      let witchAttackSkill = 'attackSkill1604.json';
      let witchDefSkill = 'defSkill1604.json';
      
      //根據指定的流派獲取對應的JSON檔案
      switch(type){
        case '114':
          witchMember = 'member114.json';
          witchAttackSkill = 'attackSkill114.json';
          witchDefSkill = 'defSkill114.json';
        break;
        case '1604':
          witchMember = 'member1604.json';
          witchAttackSkill = 'attackSkill1604.json';
          witchDefSkill = 'defSkill1604.json';
        break;
        case '2704':
          witchMember = 'member2704.json';
          witchAttackSkill = 'attackSkill2704.json';
          witchDefSkill = 'defSkill2704.json';
        break;
      }
      //說明表格 
      await fetch(`${process.env.PUBLIC_URL}/memberDirections.json`)
      .then(response => response.json())
      .then(directionJsonData => {
        console.log(directionJsonData);
        fetch(`${process.env.PUBLIC_URL}/${witchMember}`)
        .then(response => response.json())
        .then(memberJsonData => {
          //基礎數值表格
          if (memberJsonData) {
            $(memberTableRef.current).DataTable({
              destroy: true,
              data: memberJsonData.Basic,
              pageLength: 100,
              columns: [
                { title: "", data: null, render: function (row) { return `<img src="${process.env.PUBLIC_URL}/image/member_icon/${row.name}.png" title="${Calculator.memberDirection(row, directionJsonData)}" alt='icon' width='40' height='40' />`; } },
                { title: "名稱", data: "name", render: function (data, type, row) { return Calculator.memberNameRender(row); } },
                { title: "職業", data: "type" },
                { title: "生命", data: "hp" },
                { title: "傷害類型", data: "attackType" },
                { title: "攻擊", data: "attack" },
                { title: "防禦", data: "def" },
                { title: "法抗", data: "res" },
                { title: "攻速", data: "spd" },
                { title: "DPS", data: null, render: function (data, type, row) { return Calculator.memberDps(row, enemyData); } },
                { title: "擊殺所需時間", data: null, render: function (data, type, row) { return Calculator.memberKillTime(row, enemyData); } },
                { title: "敵方DPS", data: null, render: function (data, type, row) { return Calculator.enemyDps(row, enemyData); } },
              ],
            });
          }

          //攻擊技能表格
          fetch(`${process.env.PUBLIC_URL}/${witchAttackSkill}`)
          .then(response => response.json())
          .then(attackSkillJsonData => {
            if (attackSkillJsonData) {
              $(attackSkillTableRef.current).DataTable({
                destroy: true,
                data: attackSkillJsonData.Basic,
                pageLength: 100,
                columns: [
                  //${Calculator.memberIcon(row, memberJsonData.Basic)}
                  { title: "", data: null, render: function (row) { return `<img src="${process.env.PUBLIC_URL}/image/member_icon/${row.name}.png" title="${Calculator.memberDirection(row, directionJsonData)}" alt='icon' width='40' height='40' />`; } },
                  { title: "名稱", data: "name", render: function (data, type, row) { return Calculator.memberNameRender(row); } },
                  { title: "技能", data: "whichSkill" },
                  { title: "傷害類型", data: "attackType" },
                  { title: "冷卻時間", data: "waitTime" },
                  { title: "持續時間", data: "skillTime" },
                  { title: "DPS", data: null, render: function (data, type, row) { return Calculator.memberDps(Calculator.skillMemberRow(row, memberJsonData.Basic), enemyData); } },
                  { title: "技能總傷", data: null, render: function (data, type, row) { return Calculator.memberSkillTotal(row, memberJsonData.Basic, enemyData ); } },
                  { title: "擊殺所需時間", data: null, render: function (data, type, row) { return Calculator.memberKillTime(Calculator.skillMemberRow(row, memberJsonData.Basic), enemyData); } },
                ],
              });
            }
          })
          .catch(error => console.log('Error loading JSON:', error));

          //防禦技能表格
          fetch(`${process.env.PUBLIC_URL}/${witchDefSkill}`)
          .then(response => response.json())
          .then(defSkillJsonData => {
            if (defSkillJsonData) {
              $(defSkillTableRef.current).DataTable({
                destroy: true,
                data: defSkillJsonData.Basic,
                pageLength: 100,
                columns: [
                  { title: "", data: null, render: function (row) { return `<img src="${process.env.PUBLIC_URL}/image/member_icon/${row.name}.png" title="${Calculator.memberDirection(row, directionJsonData)}" alt='icon' width='40' height='40' />`; } },
                  { title: "名稱", data: "name", render: function (data, type, row) { return Calculator.memberNameRender(row); } },
                  { title: "技能", data: "whichSkill" },
                  { title: "技能類型", data: "skillType" },
                  { title: "冷卻時間", data: "waitTime" },
                  { title: "持續時間", data: "skillTime" },
                  { title: "我方DEF", data: null, render: function (data, type, row) { return Calculator.skillMemberRow(row, memberJsonData.Basic).def; } },
                  { title: "我方HPS", data: null, render: function (data, type, row) { return Calculator.skillMemberHps(row, memberJsonData.Basic); } },
                  { title: "敵方DPS", data: null, render: function (data, type, row) { return Calculator.enemyDps(Calculator.skillMemberRow(row, memberJsonData.Basic), enemyData); } },
                ],
              });
            }
          })
          .catch(error => console.log('Error loading JSON:', error));
        })
        .catch(error => console.log('Error loading JSON:', error));
      })
      .catch(error => console.log('Error loading JSON:', error));
    };
    loadData(whichType);
    console.log(whichType);
  }, [whichType, enemyData]); // 每次修改敵人數值或是改變流派時就更新網頁並重新初始化表格

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
        <div className="d-flex flex-row">
          <button className={ `${whichType === '114'? 'btn btn-danger' : 'btn btn-primary'} flex-grow-1 mx-4` } onClick={() => { setCookie('114'); setWhichType('114'); }}>精一1級四星隊</button>
          <button className={ `${whichType === '1604'? 'btn btn-danger' : 'btn btn-primary'} flex-grow-1 mx-4` } onClick={() => { setCookie('1604'); setWhichType('1604'); }}>精一滿級四星隊</button>
          <button className={ `${whichType === '2704'? 'btn btn-danger' : 'btn btn-primary'} flex-grow-1 mx-4` } onClick={() => { setCookie('2704'); setWhichType('2704'); }}>四星隊</button>
        </div>
        <p>以下表格的我方面板數值皆以滿潛能滿信賴(四星隊3級模組)為準</p>
        <p>由於幹員會有許多的因素會影響實際數值或是傷害計算結果</p>
        <p>(ex: 香草的天賦加攻擊力、夜煙的天賦減法抗、刻刀的職業特性攻擊都是二連擊...等等)</p>
        <p>***可將滑鼠懸停在幹員頭像圖示上，會彈出提示訊息，經由提示訊息可確認詳細資訊***</p>
        <p>(幹員頭像取自PRTS的幹員檔案)</p>
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
