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
                // { title: "擊殺所需時間", data: null, render: function (data, type, row) { return Calculator.memberKillTime(row, enemyData); } },
                { title: "敵方DPS", data: null, render: function (data, type, row) { return Calculator.enemyDps(row, enemyData); } },
              ],
              drawCallback: function(settings) {
                $(memberTableRef.current).find('th').css({
                  'background-color': '#c5c5c5',
                  'color': 'black'
                });
              }
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
                  { title: "DPS", data: null, render: function (data, type, row) { return Calculator.skillMemberDps(row, memberJsonData.Basic, enemyData); } },
                  { title: "技能總傷", data: null, render: function (data, type, row) { return Calculator.memberSkillTotal(row, memberJsonData.Basic, enemyData ); } },
                  // { title: "擊殺所需時間", data: null, render: function (data, type, row) { return Calculator.memberKillTime(Calculator.skillMemberRow(row, memberJsonData.Basic), enemyData); } },
                ],
                drawCallback: function(settings) {
                  $(attackSkillTableRef.current).find('th').css({
                    'background-color': '#c5c5c5',
                    'color': 'black'
                  });
                }
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
                drawCallback: function(settings) {
                  $(defSkillTableRef.current).find('th').css({
                    'background-color': '#c5c5c5',
                    'color': 'black'
                  });
                }
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
      <div className='p-2 m-1 border border-2 rounded-4 bg-light'>
        <div className='row justify-content-center'>
          <h3 className='col-12 text-center'>敵人數據</h3>
        </div>  
        <form id='enemy_form'>
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
          <button className={ `${whichType === '114'? 'btn btn-primary' : 'btn btn-secondary'} col-7 col-md-3` } onClick={() => { setCookie('114'); setWhichType('114'); }}>精一1級四星隊</button>
          <button className={ `${whichType === '1604'? 'btn btn-primary' : 'btn btn-secondary'} col-7 col-md-3` } onClick={() => { setCookie('1604'); setWhichType('1604'); }}>精一滿級四星隊</button>
          <button className={ `${whichType === '2704'? 'btn btn-primary' : 'btn btn-secondary'} col-7 col-md-3` } onClick={() => { setCookie('2704'); setWhichType('2704'); }}>四星隊</button>
        </div>
        <div className='row justify-content-center row-gap-1'>
          <small className="col-12 text-center">{`以下表格的我方面板數值皆以滿潛能滿信賴(四星隊3級模組)為準`}</small>
          <small className="col-12 text-center">{`幹員會有許多的因素會影響實際數值或是傷害計算結果`}</small>
          <small className="col-12 text-center">{`(ex: 香草的天賦加攻擊力、夜煙的天賦減法抗、刻刀的職業特性攻擊都是二連擊...等等)`}</small>
          <small className="col-12 text-center">{`可將滑鼠懸停在幹員頭像圖示上，會彈出提示訊息，經由提示訊息可確認詳細資訊`}</small>
        </div> 
      </div>  
      <div className='p-2 m-1 border border-2 rounded-4 bg-light'>
        <div className='table-responsive'>
          <table id='member_table' ref={memberTableRef} className="table table-bordered table-hover display table-light"></table>
        </div>     
      </div>
      <div className='p-2 m-1 border border-2 rounded-4 bg-light'>
      <div className='row justify-content-center row-gap-1'>
          <small className="col-12 text-center">{`以下表格的持續時間為-1表示其為強力擊類型的技能，
          此類技能的DPS計算方式不屬於通常算法(攻擊力/攻速)，而是改用(總傷/冷卻時間)的方式計算。`}</small>
          <small className="col-12 text-center">{`因此對於使用強力擊技能的幹員，將其無技能的DPS和強力擊技能的DPS相加即可得出其真正的平均DPS`}</small>
        </div>
        <div className='table-responsive'>
          <table id='attackSkill_table' ref={attackSkillTableRef} className="table table-bordered table-hover display table-light"></table>
        </div>        
      </div>           
      <div className='p-2 m-1 border border-2 rounded-4 bg-light'>
        <div className='row justify-content-center row-gap-1'>
          <small className="col-12 text-center">{`以下表格的持續時間為-1表示其為強力擊類型的技能，
          此類技能的HPS計算方式不屬於通常算法(攻擊力/攻速)，而是改用(治療量/冷卻時間)的方式計算`}</small>
          <small className="col-12 text-center">{`因此對於使用強力擊技能的幹員，將其無技能的HPS和強力擊技能的HPS相加即可得出其真正的平均HPS`}</small>
        </div> 
        <div className='table-responsive'>
          <table id='defSkill_table' ref={defSkillTableRef} className="table table-bordered table-hover display table-light"></table>
        </div> 
      </div>  
    </div> 
  );
}

export default MainContent;
